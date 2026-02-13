# AI Notes

## What I used AI for
- High-level architecture planning (MERN + Python microservice split)
- Generating starter boilerplate for Express + FastAPI services
- Iterating on prompt format to force **grounded answers** with citations
- Troubleshooting Windows command quoting and local dev ergonomics

## What I checked / verified myself
- End-to-end flow works locally:
  - upload document → ingest → ask question → answer + citations
- Status endpoints correctly reflect backend, db, and llm connectivity
- Basic input validation for empty/wrong inputs (file type/size, question empty)

## LLM used (provider + model)
- **Provider**: Google AI Studio (Gemini API)
- **Model**: `models/gemini-flash-latest`

### Why this choice
- Free-tier friendly for demos
- Easy to configure via a single API key in Render environment variables
- Fast responses and good enough quality for a small RAG demo

## Notes / limitations
- The Python SDK `google.generativeai` is currently marked deprecated in warnings.
  - For production, I would migrate to `google-genai`.
- Retrieval uses a deterministic local embedding (hashing trick) + brute-force cosine similarity.
  - This keeps costs at zero and works well for “a few docs”.
  - For scale, swap to Atlas Vector Search / pgvector / FAISS.
