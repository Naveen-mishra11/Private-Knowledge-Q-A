# PROMPTS_USED

Records of prompts I used while developing this project (responses omitted).

## Planning
- "Design a MERN + Python microservice app for private document Q&A with citations. Include routes, data model, and a status page."

## Backend
- "Generate an Express API for uploading a text file, listing documents, and an endpoint that calls a Python RAG service for Q&A."
- "Add basic validation and error handling for empty/wrong input."

## Python RAG (FastAPI)
- "Create a FastAPI service that chunks documents, stores chunk embeddings, retrieves topK chunks, and calls Gemini with grounded prompt. Return citations."
- "How to list Gemini models and pick a valid model ID for generateContent?"

## Frontend
- "Create a simple React UI with pages: Home, Documents (upload + list), Ask (answer + citations), Status (health checks)."

## DevOps / Hosting
- "Create a docker-compose setup for mongo + api + rag + web."
- "Write a README with local run and Render deployment steps."
