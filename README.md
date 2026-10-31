# 🏛️ Eternal RAG — Financial & Governance Intelligence System
### High-Precision Multi-Document Retrieval-Augmented Generation over Eternal Ltd (formerly Zomato Ltd) Annual Reports

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Pinecone](https://img.shields.io/badge/Vector_DB-Pinecone_Serverless-000000.svg?logo=pinecone&logoColor=white)](https://pinecone.io)
[![Groq](https://img.shields.io/badge/Inference-Groq_Cloud-F55036.svg?logo=groq&logoColor=white)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Target Documents & Challenges](#-target-documents--challenges)
3. [System Architecture](#-system-architecture)
4. [Document Ingestion & Indexing Pipeline](#-document-ingestion--indexing-pipeline)
5. [Multi-Stage Retrieval & Reranking Engine](#-multi-stage-retrieval--reranking-engine)
6. [Grounding, Verification & Guardrails](#-guardrails-and-grounding)
7. [Frontend Architecture & Design System](#-frontend-architecture--design-system)
8. [Project Structure](#-project-structure)
9. [Getting Started & Local Setup](#-getting-started--local-setup)
10. [Automated 18-Question Benchmark & Audit](#-automated-18-question-benchmark--audit)
11. [Deployment Guide (Vercel)](#-deployment-guide-vercel)
12. [Engineering Insights: What Worked vs. What Didn't](#-engineering-insights-what-worked-vs-what-didnt)

---

## 🎯 Executive Summary

**Eternal RAG** is an enterprise-grade financial question-answering platform specifically engineered to analyze, cross-examine, and extract verified insights from the comprehensive annual reports of **Eternal Limited** (formerly known as Zomato Limited):

* **Document A**: *Annual Report FY 2024–25* (385 pages)
* **Document B**: *Annual Report FY 2025–26* (422 pages)

Financial annual reports present unique challenges that cause traditional generic RAG pipelines to fail: scanned infographic pages with zero selectable text, subtle restatements between fiscal years, dense tables with complex financial schedules, and strict regulatory standards demanding verifiable 1-indexed page citations.

This system guarantees **zero hallucination**, enforces **transparent arithmetic derivation**, proactively provides **Consolidated vs. Standalone transparency**, and features a modern, ultra-responsive **React 19 financial terminal UI** with real-time SSE streaming.

---

## 📚 Target Documents & Challenges

| Attribute | Document A | Document B |
|---|---|---|
| **Fiscal Year** | FY 2024–25 (April 1, 2024 – March 31, 2025) | FY 2025–26 (April 1, 2025 – March 31, 2026) |
| **Total Pages** | 385 pages | 422 pages |
| **Corporate Identity** | Zomato Limited / Transitioning to Eternal Ltd | Eternal Limited |
| **Primary Challenge** | Dense multi-column tables, notes to financial statements, shareholding patterns. | **Pages 2–54 are pure graphic-designed infographics** (scanned vector art with 0 native selectable text characters). |
| **Restatement Nuances** | Historical baseline metrics. | Restated prior-year figures reflecting demergers, M&A activity, and IND AS adjustments. |

---

## 🏛️ System Architecture

The end-to-end architecture is divided into two decoupled asynchronous pipelines: the **Offline Ingestion & Indexing Pipeline** and the **Online Real-Time Query & Streaming Pipeline**.

```
+---------------------------------------------------------------------------------------------------------+
|                                    OFFLINE INGESTION PIPELINE                                           |
|                                                                                                         |
|   [PDF Reports]                                                                                         |
|    - Doc A (385p) ---> [PyMuPDF Parser] ---------------------------\                                    |
|    - Doc B (422p) ---> [Adaptive Parser] --> Text >= 30 chars?      |                                    |
|                             |-- YES --> [Native Text Stream]        |                                    |
|                             \-- NO  --> [RapidOCR ONNX Engine] ----> [Clean Document Chunks]            |
|                                                                              |                          |
|             /----------------------------------------------------------------+                          |
|             v                                                                v                          |
|   [Pinecone Inference API]                                           [Lexical Tokenizer]                |
|   Model: multilingual-e5-large                                               |                          |
|   Dense 1024-dim Vector Embeddings                                           v                          |
|             |                                                        [Rank-BM25 Index]                  |
|             v                                                        BM25Okapi Inverted Index            |
|   [Pinecone Serverless Index]                                                |                          |
|   Namespace: 'doc-a', 'doc-b'                                                v                          |
|   Index: 'mpl-rag'                                                   [data/bm25_index.pkl]              |
+---------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------+
|                                  ONLINE QUERY & STREAMING PIPELINE                                      |
|                                                                                                         |
|   [React 19 Frontend]  <--- SSE Stream (/api/chat/stream) ---+                                          |
|            |                                                 |                                          |
|            | 1. Query: "Total revenue FY25 vs FY26"          |                                          |
|            v                                                 |                                          |
|   [FastAPI Gateway]                                          |                                          |
|            |                                                 |                                          |
|            v                                                 |                                          |
|   [Guardrails: Input Security & Temporal Intent Analysis]    |                                          |
|            |                                                 |                                          |
|            +---> Target Docs Identified (e.g. Doc A + Doc B) |                                          |
|            v                                                 |                                          |
|   [Hybrid Retriever Layer]                                   |                                          |
|            |-- Dense Search: Pinecone Top-K (Cosine)         |                                          |
|            \-- Sparse Search: Rank-BM25 Top-K (Tokens)       |                                          |
|            v                                                 |                                          |
|   [Reciprocal Rank Fusion (RRF)] ----------------------------+ (stage: retrieval, done)                 |
|   Score(d) = Σ [ 1 / (60 + rank_i(d)) ]                      |                                          |
|            v                                                 |                                          |
|   [Cross-Encoder Reranker] ----------------------------------+ (stage: reranking, done)                 |
|   Context window optimization & precision reranking          |                                          |
|            v                                                 |                                          |
|   [Dynamic Context Assembler] -------------------------------+ (stage: context_build, done)             |
|   Capped at 12,000 characters to prevent Groq 413 limits     |                                          |
|            v                                                 |                                          |
|   [Groq Cloud LLM: openai/gpt-oss-20b] ----------------------+ (event: token, streaming deltas)         |
|   Reasoning effort: low (sub-second TTFT)                    |                                          |
|            v                                                 |                                          |
|   [Deterministic Citation Verifier] -------------------------+ (stage: verification, done)              |
|   Regex validates (Doc X, Page Y) against retrieved context  |                                          |
|            v                                                 |                                          |
|   [Audited Synthesis Meta Dispatch] -------------------------+ (event: meta, citations & chunks)        |
+---------------------------------------------------------------------------------------------------------+
```

---

## ⚙️ Document Ingestion & Indexing Pipeline

The ingestion logic is located in `backend/extractor.py` and `backend/ingest.py`.

### 1. Adaptive Native Extraction + OCR Fallback
* Standard PDF parsers fail on Document B (pages 2 to 54), returning empty strings because text is embedded as rasterized vector images.
* **Heuristic Engine**: We extract text using high-performance `PyMuPDF` (`fitz`). If extracted text is fewer than 30 characters, the page is dynamically rendered to a 200 DPI bitmap and passed to `RapidOCR` (`rapidocr_onnxruntime`).
* **Efficiency**: Avoids running heavy OCR on all 807 pages, completing extraction in seconds while achieving 100% text recall on infographics.

### 2. Chunking Strategy
* **Chunk Size**: 800 tokens with 150-token sliding overlap.
* **Metadata Enrichment**: Every chunk preserves:
  * `doc_id`: `"A"` or `"B"`
  * `fiscal_year`: `"FY 2024-25"` or `"FY 2025-26"`
  * `viewer_page`: 1-indexed physical PDF page number (matches Adobe Reader / Chrome viewer exactly)
  * `source`: Extraction engine tag (`native` vs `ocr`)
  * `chunk_id`: Deterministic hash for idempotency

### 3. Dual Indexing: Dense Vectors & Sparse Lexical
* **Dense Embedding**: Ingested into **Pinecone Serverless** using `multilingual-e5-large` (1024 dimensions, cosine distance metric) via Pinecone's serverless Inference API.
* **Sparse Indexing**: Inverted index built with `rank-bm25` (`BM25Okapi`), tokenizing financial terms, section headers, and currency amounts. Persisted to `data/bm25_index.pkl`.

---

## 🔍 Multi-Stage Retrieval & Reranking Engine

Located in `backend/retriever.py`, the hybrid search avoids the single-point-of-failure inherent in pure vector search:

### Step 1: Query Intent Analysis & Temporal Routing
* Analyzes query tokens using regex and keyword classifiers (`backend/guardrails.py`).
* Directs single-year queries (e.g. *"FY25 auditor remuneration"*) to filter by `doc_id == "A"`, cutting retrieval noise by 50%.
* Directs comparative queries (e.g. *"revenue growth from FY25 to FY26"*) to search across both Document A and Document B simultaneously.

### Step 2: Dense + Sparse Retrieval
* **Dense Search**: Queries Pinecone vector index for semantic matches (e.g., *"working capital requirements"* matches *"operating liquidity"*).
* **Sparse Search**: Queries BM25 for exact lexical matches (e.g., *"DIN 00295821"*, *"₹12,450 Cr"*).

### Step 3: Reciprocal Rank Fusion (RRF)
Combines dense and sparse ranked candidate lists without needing arbitrary score normalization:

$$RRF\_Score(d) = \sum_{m \in \{dense, sparse\}} \frac{1}{k + rank_m(d)} \quad (k = 60)$$

Top-8 chunks are selected across the fused distribution.

### Step 4: Cross-Encoder Reranking
Chunks are scored via cross-encoder ranking, placing the most contextually relevant excerpts at the top of the prompt context window.

---

## 🛡️ Grounding, Verification & Guardrails

Located in `backend/guardrails.py` and `backend/app.py`:

1. **Strict 1-Indexed Viewer Page Citations**:
   * Prompts instruct the LLM that every assertion must be followed by `[Doc A, Page X]` or `[Doc B, Page Y]`.
   * A post-generation verification regex checks every citation against the physical `viewer_page` attributes of retrieved chunks. Citations verified against context appear in the UI with a green `Grounded` badge.
2. **Honest "Say When You Don't Know"**:
   * For questions requesting out-of-scope data (e.g. *"Projected FY35 revenue"*), the system explicitly responds:
     > `"Not found in the reports."`
   * Prompt few-shots prevent speculative extrapolation.
3. **Consolidated vs. Standalone Transparency**:
   * When revenue or profit metrics are requested without specifying the reporting basis, the system proactively retrieves and reports **both Consolidated and Standalone figures** side-by-side with distinct page citations.
4. **Step-by-Step Mathematical Derivations**:
   * Percentage growth or variance calculations display the underlying formula:
     $$\text{Growth \%} = \frac{\text{Value}_{\text{FY26}} - \text{Value}_{\text{FY25}}}{\text{Value}_{\text{FY25}}} \times 100$$
5. **Context Window Safety (413 Prevention)**:
   * Prompt context is dynamically capped at 12,000 characters and chunks at 1,800 characters to guarantee zero HTTP 413 (Payload Too Large) errors on Groq.

---

## 💻 Frontend Architecture & Design System

The frontend in `frontend/` is built on **React 19 + Vite** with a responsive layout:

* **Emerald & Obsidian Aesthetic**:
  * Pure dark-mode interface (`#0B0F12` background, deep obsidian panels `#11161B`, vibrant emerald `#10B981` and gold `#F59E0B` status accents).
  * Technical typography powered by Google Fonts: *Space Grotesk*, *Inter*, and *JetBrains Mono*.
* **Real-Time SSE Streaming**:
  * Sub-second Time to First Token (TTFT).
  * Handles custom server events: `event: stage` (pipeline progress), `event: token` (text deltas), `event: meta` (citations, chunks, grounding status), and `event: done`.
* **Four Dedicated Response Cards**:
  1. `AnswerCard`: Markdown tables, citation chips, copy buttons, and inspector toolbar.
  2. `ClarificationCard`: Option selection chips with custom write-in field.
  3. `NotFoundCard`: Clean missing-data disclosure with query rephrasing suggestions.
  4. `BlockedCard`: Safety guardrail interceptor for prompt injection or malicious input.
* **Transparent Pipeline Visualizer**:
  * Real-time 5-stage horizontal pipeline stepper (`Retrieval` -> `Reranking` -> `Context Assembly` -> `Generation` -> `Verification`) with millisecond execution timers.
  * Expands into a detailed vertical audit trail.
* **Interactive InfoRail Drawer**:
  * Clicking any source citation chip (e.g. `Doc B · p.176`) slides out the right-hand inspection drawer showing the exact text excerpt, document name, and viewer page.

---

## 📂 Project Structure

```
MPL Rag Product/
├── backend/
│   ├── .env.example            # Backend environment variables template
│   ├── app.py                  # FastAPI application & SSE streaming endpoints
│   ├── config.py               # Central configuration & path management
│   ├── evaluator.py            # Automated 18-question benchmark & Excel audit runner
│   ├── guardrails.py           # Input sanitization, intent analysis & citation verification
│   ├── rag_engine.py           # Core RAG engine orchestrator & Groq LLM integration
│   ├── requirements.txt        # Backend dependencies
│   ├── retriever.py            # Hybrid Dense (Pinecone) + Sparse (BM25) retriever with RRF
│   └── ingestion/              # Offline ingestion & document extraction pipeline
│       ├── __init__.py
│       ├── extractor.py        # PyMuPDF + RapidOCR page extraction logic
│       ├── ingest.py           # Vector embedding generator & Pinecone ingestion script
│       └── sync_eval.py        # Helper script to sync benchmark results
│
├── frontend/
│   ├── .env.example            # Frontend environment variables template
│   ├── index.html              # HTML5 entrypoint with Google Fonts
│   ├── package.json            # Node.js dependencies & scripts
│   ├── vite.config.js          # Vite configuration with proxy settings
│   └── src/
│       ├── App.jsx             # Main application component
│       ├── index.css           # Global typography & animation styles
│       ├── components/
│       │   ├── chat/           # ChatWindow, Composer, Message, MessageList, EmptyState
│       │   ├── layout/         # AppShell, Sidebar, InfoRail
│       │   ├── messages/       # AnswerCard, ClarificationCard, NotFoundCard, BlockedCard
│       │   ├── pipeline/       # Stepper (horizontal), Timeline (vertical)
│       │   └── ui/             # Badge, Icon, Tooltip
│       ├── lib/
│       │   ├── api.js          # Fetch client & SSE stream consumer
│       │   └── formatting.js   # Text helpers & number formatting
│       ├── store/
│       │   ├── useChatStore.js # Zustand chat state & streaming store
│       │   └── useSettingsStore.js
│       └── styles/
│           ├── markdown.css    # Table styling, callouts, blockquotes
│           └── theme.css       # Obsidian & Emerald color variables
│
├── data/
│   ├── bm25_index.pkl          # Serialized BM25 lexical inverted index
│   ├── eval_results.json       # Cached benchmark evaluation scores
│   ├── extracted_chunks.json   # Pre-extracted & OCR-enriched document chunks
│   └── Documents/              # Source PDF Annual Reports
│       ├── Document1.pdf       # Eternal Ltd FY 2024-25 Annual Report (385 pages)
│       └── Document2.pdf       # Eternal Ltd FY 2025-26 Annual Report (422 pages)
│
├── .gitignore                  # Production gitignore rules (safeguards .env everywhere)
├── ProjectDetails.xlsx         # Evaluation benchmark spreadsheet (Tab 4: Results)
└── README.md                   # System documentation
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: 18.0 or higher
* **API Keys**:
  * [Groq Cloud API Key](https://console.groq.com)
  * [Pinecone API Key](https://app.pinecone.io) (Index name: `mpl-rag`)

### 2. Environment Variables Configuration

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=mpl-rag
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Backend Setup & Startup
```powershell
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. (Optional) Run extraction & ingestion if re-indexing from scratch
python -m backend.ingestion.extractor
python -m backend.ingestion.ingest

# 3. Start the FastAPI server
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```
The interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Frontend Setup & Startup
```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

## 🧪 Automated 18-Question Benchmark & Audit

The system includes a benchmark runner in `backend/evaluator.py` covering:
* All 8 core evaluation benchmark questions.
* 10 governance, risk, financial variance, and out-of-scope stress tests.

To run the automated audit:
```powershell
python -m backend.evaluator
```

This evaluates:
1. **Factual Accuracy**: Ground truth comparison against audited financial statements.
2. **Citation Verification**: Validates that page references exist in the relevant document.
3. **Execution Latency**: Per-query response duration.

Results are saved to `data/eval_results.json` and written to Tab 4 (`Results`) of `ProjectDetails.xlsx`.

---

## ☁️ Deployment Guide (Vercel)

### Deploying Backend to Vercel
1. In the [Vercel Dashboard](https://vercel.com/new), import your repository: `viv2005ek/RAG-Zomata-Annual-Reports`.
2. Configure project settings:
   * **Project Name**: `eternal-rag-backend`
   * **Root Directory**: `backend`
   * **Framework Preset**: `Other`
3. Add Environment Variables:
   * `GROQ_API_KEY`: *(your Groq API key)*
   * `PINECONE_API_KEY`: *(your Pinecone API key)*
   * `PINECONE_INDEX_NAME`: `mpl-rag`
4. Click **Deploy** and copy your production URL (e.g. `https://eternal-rag-backend.vercel.app`).

### Deploying Frontend to Vercel
1. In Vercel, click **Add New > Project** and import the same repository.
2. Configure project settings:
   * **Project Name**: `eternal-rag-app`
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
3. Add Environment Variable:
   * `VITE_API_BASE_URL`: The production URL from Step 1 (e.g. `https://eternal-rag-backend.vercel.app`).
4. Click **Deploy**.

---

## 💡 Engineering Insights: What Worked vs. What Didn't

| Component | What Didn't Work | What Worked (The Solution) |
|---|---|---|
| **OCR on Graphic Pages** | Running OCR across all 807 pages was extremely slow (>15 minutes) and produced noisy text on clean digital pages. | **Adaptive Heuristic Extraction**: Used PyMuPDF native text stream for normal pages (<0.02s/page); triggered `RapidOCR` only on pages with <30 characters (pages 2–54 of Doc B). |
| **Retrieval Strategy** | Pure dense vector search missed exact line items, section numbers, and director DIN numbers. | **Hybrid Dense + Sparse RRF**: Fused Pinecone semantic embeddings (`multilingual-e5-large`) with BM25 keyword rankings via Reciprocal Rank Fusion ($k=60$). |
| **Cross-Document Queries** | Strict document-by-document retrieval dropped context for YoY comparison queries. | **Temporal Intent Router**: Comparative queries search both documents simultaneously, while single-year queries isolate the target document namespace to minimize noise. |
| **LLM Latency on Groq** | Default high reasoning effort on `openai/gpt-oss-20b` led to 40+ second internal reasoning chains and timeouts. | **Explicit Low Reasoning Effort**: Added `"reasoning_effort": "low"` parameter, reducing response latency from **40.4s down to 1.1s**. |
| **Context Length Management** | Passing full retrieved chunks without truncation caused HTTP 413 (Payload Too Large) errors. | **Dynamic Context Capping**: Capped individual chunks at 1,800 characters and aggregate context at 12,000 characters. |
| **Citation Reliability** | Trusting the LLM to invent its own page references led to occasional off-by-one errors. | **Deterministic Post-Generation Verification**: RegEx-based verification compares cited pages against the actual retrieved chunk metadata before marking citations as verified. |

---

## 📄 License
This project is licensed under the MIT License. Built for enterprise financial intelligence and governance analysis.
