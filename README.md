# KnowSphere AI — Local Edition (Ollama + ChromaDB)

A full-stack RAG knowledge intelligence application. It ingests documents and supports semantic search, structured summaries, topic analysis, multi-document comparison, research reports and analytics. It is not a chatbot.

## No paid AI API
This edition uses **Ollama** for local LLM inference and local embeddings, plus **ChromaDB** for vector storage. No OpenAI API key or paid AI API is required. You still need a computer capable of running the models; electricity, hardware and internet downloads are not necessarily free.

## Stack
- Frontend: React + Vite
- Backend: Python + FastAPI
- Local LLM: Ollama (`llama3.2:3b`)
- Local embeddings: Ollama (`nomic-embed-text`)
- Vector store: ChromaDB persistent local collection
- Parsing: pypdf, python-docx, TXT/Markdown

## 1. Install Ollama and pull models

Install Ollama: https://ollama.com/download

Open a terminal:
```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Check installed models:
```bash
ollama list
```

Ollama normally runs as a background service. If it is not running, start:
```bash
ollama serve
```

The first model downloads can be several GB. Ensure you have enough disk space and RAM. If `llama3.2:3b` is too slow or too large for your computer, choose a smaller compatible model and update `OLLAMA_CHAT_MODEL` in `.env`.

## 2. Backend setup

```bash
cd backend
python -m venv .venv
```
Windows:
```bash
.venv\Scripts\activate
```
macOS/Linux:
```bash
source .venv/bin/activate
```
Then:
```bash
pip install -r requirements.txt
```

Create `backend/.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.2:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
CHROMA_PATH=./chroma_db
FRONTEND_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=15
OLLAMA_TIMEOUT_SECONDS=300
```

Start FastAPI:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger docs: http://localhost:8000/docs

## 3. Frontend setup

Open another terminal:
```bash
cd frontend
npm install
```
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```
Run:
```bash
npm run dev
```
Open http://localhost:5173.

## 4. Workflows
- Upload PDF, DOCX, TXT or Markdown
- Extract text, split into overlapping chunks and create local embeddings
- Store vectors and metadata in ChromaDB
- Search semantically across the knowledge base
- Generate document summaries and topic/entity insights
- Compare two sources
- Generate evidence-backed reports with retrieved source excerpts
- View knowledge inventory analytics

## 5. API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health and model names |
| GET | `/api/documents` | List indexed sources |
| POST | `/api/documents/upload` | Ingest and index file |
| DELETE | `/api/documents/{id}` | Delete indexed source |
| POST | `/api/search` | Semantic retrieval |
| POST | `/api/documents/{id}/summary` | Generate summary |
| POST | `/api/compare` | Compare two sources |
| POST | `/api/reports` | Evidence-backed research report |
| GET | `/api/analytics` | Knowledge-base statistics |

## 6. Troubleshooting
- **Cannot connect to Ollama:** install Ollama, confirm it is running, and check `OLLAMA_BASE_URL`.
- **Model not found:** run `ollama pull llama3.2:3b` and `ollama pull nomic-embed-text`.
- **Slow responses:** local inference depends on RAM/CPU/GPU. Try a smaller chat model.
- **Scanned PDF:** OCR is not included; use a text-based PDF.
- **No search results:** upload and index documents first.
- **Embedding dimension mismatch:** if you change embedding models, delete the old `backend/chroma_db` collection and re-index documents with the new model. Do not mix embedding models in one collection.
- **Ollama API from another device:** configure Ollama's listening address and network/firewall carefully; do not expose it publicly without authentication and access controls.

## 7. GitHub
Create a GitHub repository, then from project root:
```bash
git init
git add .
git commit -m "Build KnowSphere AI local RAG platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/knowsphere-ai.git
git push -u origin main
```
Do not commit `.env`, `.venv`, `node_modules`, uploaded documents or `chroma_db`.

## 8. Deployment reality
The React frontend can be deployed to Vercel, but **Ollama must run on a machine that has the model files and enough compute**. A normal free Render web service is not a practical host for local model inference. For a public live demo, options include:
- Run the backend + Ollama on your own always-on computer and securely expose it (not recommended without authentication, HTTPS, firewall and rate limiting).
- Use a GPU hosting provider (may cost money).
- Deploy the UI publicly but provide a recorded demo, while running the local AI backend during interviews.

ChromaDB must also use persistent storage. Do not assume ephemeral deployment files survive restarts.

## 9. Resume description
**KnowSphere AI — Local RAG Knowledge Intelligence Platform**
- Built a full-stack knowledge intelligence platform using React, FastAPI, Ollama and ChromaDB.
- Implemented document ingestion, text extraction, overlapping chunking, local embedding generation and persistent vector indexing.
- Developed semantic search, document summarization, topic extraction and multi-document comparison.
- Generated source-grounded research reports with traceable document excerpts.
- Integrated locally hosted LLM inference to avoid paid external AI API dependencies.

Only claim features you have tested and can explain.

## Limitations
No auth/tenant isolation, OCR, background job queue, streaming, upload malware scanning or production-grade access control. Local ChromaDB is intended for a single-instance portfolio demo. Add these before production use.
