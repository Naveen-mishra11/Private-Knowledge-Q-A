# Private Knowledge Q&A (MERN + Python)

A mini “private workspace” where you can upload a few **.txt** documents and ask questions. The app returns an answer plus **citations** showing which document + excerpt the answer came from.

## Features
- Upload **text** documents (<= 5MB)
- List uploaded documents
- Ask a question
- Get an answer + **citations** (document + chunk excerpt)
- **Status page** to show health of:
  - Node backend
  - MongoDB
  - Python RAG service
  - Gemini LLM connectivity

## Architecture
- **web/**: React (Vite)
- **api/**: Node.js + Express
- **rag/**: Python + FastAPI
- **MongoDB**: stores documents and chunks

RAG pipeline:
1) Store uploaded document text in Mongo (`documents`)
2) Python service chunks the text and stores per-chunk embeddings in Mongo (`chunks`)
3) Query → embed → brute-force cosine similarity over chunks → topK context
4) Send context to **Gemini** with a grounding prompt

> Note: Embeddings are a deterministic local “hashing trick” (no paid embedding API).

## Run locally (no Docker)
### 1) Start MongoDB
This repo can run without Docker Desktop.

From repo root:

```powershell
mkdir -Force .\data\mongo
& 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe' --dbpath "$PWD\data\mongo" --port 27017 --bind_ip 127.0.0.1
```

### 2) Start Python RAG service

```cmd
cd rag
copy .env.example .env
REM put your key into rag/.env: GEMINI_API_KEY=...
run_dev.cmd
```

### 3) Start Node API

```cmd
cd api
copy .env.example .env
run_dev.cmd
```

### 4) Start Web

```cmd
cd web
copy .env.example .env
npm install
npm run dev
```

Open: http://localhost:5173

## Run locally (Docker)
> Requires Docker Desktop running.

1) Copy env file:

```cmd
copy .env.example .env
```

2) Put your Gemini key into `.env`:

```env
GEMINI_API_KEY=...
```

3) Run:

```cmd
docker compose up --build
```

Open: http://localhost:5173

## Environment variables
### Node (api/.env)
- `MONGODB_URI`
- `PY_RAG_URL`
- `ALLOWED_ORIGINS`

### Python (rag/.env)
- `MONGODB_URI`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default `models/gemini-flash-latest`)

### Web (web/.env)
- `VITE_API_BASE_URL` (default `http://localhost:8080`)

## What is done / not done
### Done
- Upload/list docs
- Q&A with citations
- Status checks
- Local no-docker run path
- Docker compose for 1-command run

### Not done (intentionally)
- Authentication / multi-user
- PDFs / docx
- Scalable vector DB (current retrieval is brute-force over stored embeddings)
- Tests

## Hosting (Render)
Recommended setup on Render:
- **MongoDB Atlas** free tier
- Render Web Service: `api` (Node)
- Render Web Service: `rag` (Python)
- Render Static Site: `web`

Set env vars in Render:
- `MONGODB_URI` (Atlas)
- `GEMINI_API_KEY`
- `PY_RAG_URL` on the Node service (pointing to the rag service URL)
- `VITE_API_BASE_URL` on the web build
