import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Load .env from backend directory (and fallback to root if present)
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(BASE_DIR / ".env")

DOCUMENTS_DIR = (BASE_DIR / "data" / "Documents") if (BASE_DIR / "data" / "Documents").exists() else (BASE_DIR / "Documents")
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

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
EXCEL_FILE = BASE_DIR / "ProjectDetails.xlsx"
