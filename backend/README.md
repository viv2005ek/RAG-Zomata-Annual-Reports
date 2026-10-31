# ⚙️ Eternal RAG — Backend Service

Production-ready, asynchronous **FastAPI** backend for the Eternal Ltd Annual Report RAG Intelligence platform.

---

## 🌟 Key Architecture & Capabilities

* **Hybrid Retrieval (Dense + Sparse)**: Fuses 1024-dimension Pinecone vector embeddings (`multilingual-e5-large`) with exact lexical BM25 token matches (`rank-bm25`) using **Reciprocal Rank Fusion (RRF)** ($k=60$).
* **Cross-Encoder Reranking**: Re-scores top candidates to maximize precision within the LLM context window.
* **Low-Latency Groq LLM Inference**: Powered by `openai/gpt-oss-20b` configured with `"reasoning_effort": "low"`, reducing response times from 40s+ down to ~1.2s.
* **Strict Grounding & Verification Guardrails**: Regex engine audits every `[Doc X, Page Y]` citation against actual retrieved chunk metadata.
* **Honest Fallback**: Explicitly returns `"Not found in the reports."` when queries request unanswerable or future-dated data.
* **Self-Contained Data Bundle**: Pre-computed BM25 indexes (`bm25_index.pkl`) and extracted chunks (`extracted_chunks.json`) are bundled inside `backend/data/` for zero-configuration local runs and seamless Vercel serverless deployment.

---

## 🚀 Getting Started

### 1. Setup Virtual Environment & Install Dependencies
```powershell
# Navigate to backend
cd backend

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=mpl-rag
```

### 3. Start the Server
```powershell
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

---

## 📡 API Endpoints

### 1. `GET /`
Returns service health, document metadata, and Pinecone status.
```json
{
  "service": "Eternal Ltd Annual Report RAG Engine",
  "status": "online",
  "company": "Eternal Ltd (formerly Zomato Ltd)",
  "documents": [
    {"id": "Doc A", "fiscal_year": "FY 2024-25", "pages": 385},
    {"id": "Doc B", "fiscal_year": "FY 2025-26", "pages": 422}
  ]
}
```

### 2. `POST /api/chat/stream`
Server-Sent Events (SSE) streaming endpoint for the chat UI.
* **Request Body**: `{"query": "Total revenue FY25 vs FY26"}`
* **Stream Events**:
  * `event: stage`: Pipeline progress (`retrieval`, `reranking`, `context_build`, `generation`, `verification`).
  * `event: token`: Incremental token text deltas.
  * `event: meta`: Verified citations, chunk metadata, grounding status, and suggested follow-ups.
  * `event: done`: Stream termination.

### 3. `POST /api/query`
Synchronous JSON endpoint returning complete grounded answers, citations, and used chunks.

### 4. `POST /api/evaluate`
Triggers the full 18-question evaluation benchmark and saves results to `backend/data/eval_results.json`.

---

## 🔄 Ingestion & Extraction Pipeline (`backend/ingestion/`)

The offline preparation scripts live in `backend/ingestion/` and can be re-run whenever new reports or documents are added:

1. **`backend/ingestion/extractor.py`**:
   * Uses **PyMuPDF** for standard native text extraction.
   * Employs local ONNX **RapidOCR** heuristic on pages with <30 characters (extracting infographic text from pages 2–54 of Document B).
   * Generates `backend/data/extracted_chunks.json`.

2. **`backend/ingestion/ingest.py`**:
   * Generates 1024-dim dense embeddings using Pinecone Serverless Inference (`multilingual-e5-large`).
   * Builds the lexical token index and serializes it to `backend/data/bm25_index.pkl`.

To re-run the entire extraction and indexing process:
```powershell
python -m ingestion.extractor
python -m ingestion.ingest
```

---

## 🧪 Benchmark Evaluation CLI

To run the automated audit over all 18 benchmark questions:
```powershell
python evaluator.py
```
Results are saved to `backend/data/eval_results.json` and written to Tab 4 of `ProjectDetails.xlsx`.

---

## 📂 Backend Directory Structure

```
backend/
├── app.py                      # FastAPI application & SSE streaming endpoints
├── config.py                   # Central path & environment configuration
├── evaluator.py                # 18-question evaluation benchmark runner
├── guardrails.py               # Input security & citation verification guardrails
├── rag_engine.py               # Groq LLM reasoning engine & context orchestrator
├── retriever.py                # Hybrid Dense (Pinecone) + Sparse (BM25) retriever
├── requirements.txt            # Python dependencies
├── vercel.json                 # Vercel serverless routing configuration
├── .env.example                # Environment variables template
├── data/                       # Self-contained runtime data bundle
│   ├── bm25_index.pkl          # Serialized BM25 lexical index
│   ├── eval_results.json       # Cached benchmark results
│   ├── extracted_chunks.json   # 807 extracted & OCR-enriched chunks
│   └── Documents/              # Source PDF Annual Reports (FY24-25 & FY25-26)
└── ingestion/                  # Offline document extraction & indexing
    ├── __init__.py
    ├── extractor.py            # PyMuPDF + RapidOCR extraction logic
    ├── ingest.py               # Pinecone embedding & BM25 generation
    └── sync_eval.py            # Benchmark synchronization utility
```
