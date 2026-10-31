import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from backend directory (and fallback to root if present)
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")

# Locate data directory (self-contained within backend/data for Vercel, fallback to root)
DATA_DIR = (BACKEND_DIR / "data") if (BACKEND_DIR / "data").exists() else (PROJECT_ROOT / "data")
DATA_DIR.mkdir(exist_ok=True)

# Locate Documents directory
DOCUMENTS_DIR = (DATA_DIR / "Documents") if (DATA_DIR / "Documents").exists() else (PROJECT_ROOT / "Documents")

# Document Paths
DOC_A_PATH = DOCUMENTS_DIR / "Document1.pdf"  # FY 2024-25 (385 pages)
DOC_B_PATH = DOCUMENTS_DIR / "Document2.pdf"  # FY 2025-26 (422 pages)

# API Keys (loaded from environment variables or .env)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")

# Pinecone Settings
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "mpl-rag")
PINECONE_EMBED_MODEL = "multilingual-e5-large"  # 1024 dimensions
EMBEDDING_DIM = 1024

# LLM Models on Groq
GROQ_PRIMARY_MODEL = "openai/gpt-oss-20b"
GROQ_FALLBACK_MODEL = "openai/gpt-oss-120b"

# Cache Files
CHUNKS_CACHE_FILE = DATA_DIR / "extracted_chunks.json"
BM25_INDEX_FILE = DATA_DIR / "bm25_index.pkl"
EVAL_RESULTS_FILE = DATA_DIR / "eval_results.json"
EXCEL_FILE = (PROJECT_ROOT / "ProjectDetails.xlsx") if (PROJECT_ROOT / "ProjectDetails.xlsx").exists() else (BACKEND_DIR / "ProjectDetails.xlsx")
