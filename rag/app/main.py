import os
import time
from typing import List, Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId

import google.generativeai as genai


def reload_env() -> None:
    # Re-load `.env` so long-running dev servers pick up changes.
    # (In production, env vars are injected at process start.)
    load_dotenv(override=True)


reload_env()


def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]


PORT = int(os.getenv("PORT", "8000"))
MONGODB_URI = os.getenv("MONGODB_URI")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "900"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
TOP_K_DEFAULT = int(os.getenv("TOP_K", "4"))

ALLOWED_ORIGINS = _split_csv(os.getenv("ALLOWED_ORIGINS", ""))


if not MONGODB_URI:
    raise RuntimeError("Missing MONGODB_URI")

mongo = MongoClient(MONGODB_URI)
db = mongo.get_default_database()
if db is None:
    db = mongo["pkqa"]
documents = db["documents"]
chunks = db["chunks"]


app = FastAPI(title="Private Knowledge RAG", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


class IngestResponse(BaseModel):
    ok: bool
    doc_id: str
    chunks_created: int


class QARequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: Optional[int] = Field(default=None, ge=1, le=10)


class Citation(BaseModel):
    doc_id: str
    doc_name: str
    chunk_id: str
    chunk_index: int
    text: str
    score: float


class QAResponse(BaseModel):
    answer: str
    citations: List[Citation]


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    if not text:
        return []

    if overlap >= chunk_size:
        overlap = max(0, chunk_size // 4)

    out = []
    start = 0
    n = len(text)

    while start < n:
        end = min(n, start + chunk_size)
        out.append(text[start:end])
        if end == n:
            break
        start = max(0, end - overlap)
    return out


def embed_text_local(text: str, dim: int = 384) -> List[float]:
    """Simple deterministic embedding (hashing trick) so we don’t need paid embedding APIs.

    This is not SOTA, but it’s good enough for a few small text files and keeps costs at zero.
    """
    v = np.zeros(dim, dtype=np.float32)
    # Python's built-in hash is salted per-process; use a stable hash.
    import hashlib

    for token in text.lower().split():
        h = hashlib.sha256(token.encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "little") % dim
        v[idx] += 1.0
    norm = float(np.linalg.norm(v) + 1e-8)
    v = v / norm
    return v.astype(np.float32).tolist()


def cosine(a: List[float], b: List[float]) -> float:
    av = np.array(a, dtype=np.float32)
    bv = np.array(b, dtype=np.float32)
    denom = float(np.linalg.norm(av) * np.linalg.norm(bv) + 1e-8)
    return float(np.dot(av, bv) / denom)


def ensure_gemini_configured():
    reload_env()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY")
    genai.configure(api_key=api_key)


def current_model_name() -> str:
    # Read from environment each time; also reload `.env` so dev changes apply.
    reload_env()
    return os.getenv("GEMINI_MODEL") or GEMINI_MODEL


@app.get("/health")
def health():
    return {"ok": True, "service": "rag", "time": time.time(), "geminiModel": current_model_name()}


@app.get("/config")
def config():
    return {
        "chunkSize": CHUNK_SIZE,
        "chunkOverlap": CHUNK_OVERLAP,
        "topKDefault": TOP_K_DEFAULT,
        "geminiModel": current_model_name(),
    }


@app.get("/llm-health")
def llm_health():
    try:
        ensure_gemini_configured()
        model = genai.GenerativeModel(current_model_name())
        r = model.generate_content("Reply with: OK")
        text = (r.text or "").strip()
        if "ok" not in text.lower():
            return {"ok": False, "model": current_model_name(), "response": text}
        return {"ok": True, "model": current_model_name()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/ingest/{doc_id}", response_model=IngestResponse)
def ingest(doc_id: str):
    mongo_id = ObjectId(doc_id) if ObjectId.is_valid(doc_id) else doc_id
    doc = documents.find_one({"_id": mongo_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    text = doc.get("text", "")
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Document text is empty")

    # Normalize stored docId to string to avoid ObjectId-vs-string mismatches
    doc_id_str = str(doc.get("_id"))

    # Clear existing
    chunks.delete_many({"docId": doc_id_str})

    parts = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
    to_insert = []
    for i, part in enumerate(parts):
        to_insert.append(
            {
                "docId": doc_id_str,
                "docName": doc.get("name", "unknown"),
                "chunkIndex": i,
                "text": part,
                "embedding": embed_text_local(part),
                "createdAt": time.time(),
            }
        )

    if to_insert:
        chunks.insert_many(to_insert)

    return IngestResponse(ok=True, doc_id=doc_id_str, chunks_created=len(to_insert))


@app.post("/qa", response_model=QAResponse)
def qa(req: QARequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    top_k = req.top_k or TOP_K_DEFAULT

    q_emb = embed_text_local(question)

    # For small scale: brute-force over all chunks.
    # (If we needed scale, we’d use Atlas vector search / pgvector / FAISS.)
    all_chunks = list(chunks.find({}, {"embedding": 1, "text": 1, "docId": 1, "docName": 1, "chunkIndex": 1}))
    if not all_chunks:
        raise HTTPException(status_code=400, detail="No documents ingested yet")

    scored = []
    for c in all_chunks:
        score = cosine(q_emb, c.get("embedding", []))
        scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_k]

    citations: List[Citation] = []
    context_blocks = []
    for score, c in top:
        citations.append(
            Citation(
                doc_id=str(c.get("docId")),
                doc_name=str(c.get("docName")),
                chunk_id=str(c.get("_id")),
                chunk_index=int(c.get("chunkIndex", 0)),
                text=str(c.get("text", ""))[:1200],
                score=float(score),
            )
        )
        context_blocks.append(
            f"[DOC={c.get('docName')} | docId={c.get('docId')} | chunk={c.get('chunkIndex')}\n{c.get('text','')}]"
        )

    # Gemini generation grounded on retrieved context
    ensure_gemini_configured()
    model = genai.GenerativeModel(current_model_name())

    prompt = """You are a private knowledge base assistant.

Use ONLY the provided context to answer the question.
If the context does not contain the answer, say you don't know.

Return a concise answer.

Context:
{context}

Question: {question}
""".format(context="\n\n".join(context_blocks), question=question)

    try:
        r = model.generate_content(prompt)
        answer = (r.text or "").strip() or "I don't know based on the provided documents."
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Gemini error: {str(e)}")

    return QAResponse(answer=answer, citations=citations)
