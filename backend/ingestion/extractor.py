import os
import json
import unicodedata
from pathlib import Path
from typing import List, Dict, Any
import pymupdf
from rapidocr_onnxruntime import RapidOCR
from backend.config import DOC_A_PATH, DOC_B_PATH, CHUNKS_CACHE_FILE

# Initialize OCR engine once
_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = RapidOCR()
    return _ocr_engine

def clean_text(text: str) -> str:
    """
    Normalizes unicode ligatures (fi, fl, etc.) and trims excess whitespace.
    """
    if not text:
        return ""
    # Normalize unicode (turns ligatures \ufb01 into fi, etc.)
    normalized = unicodedata.normalize("NFKD", text)
    # Remove control characters except standard whitespace
    cleaned = "".join(ch for ch in normalized if ch == "\n" or ch == "\t" or not unicodedata.category(ch).startswith("C"))
    return cleaned.strip()

def extract_document_chunks(doc_path: Path, doc_id: str, fiscal_year: str) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF, preserving exact 1-indexed viewer page numbers.
    Automatically applies RapidOCR only to image-rendered pages (e.g. Doc B pages 2-54).
    """
    print(f"Opening Document {doc_id} ({fiscal_year}) from {doc_path.name}...")
    pdf_doc = pymupdf.open(str(doc_path))
    total_pages = len(pdf_doc)
    print(f"Total pages in Document {doc_id}: {total_pages}")

    ocr_engine = None
    chunks = []

    for page_idx in range(total_pages):
        viewer_page = page_idx + 1

        # Check native text length
        native_text = clean_text(pdf_doc[page_idx].get_text("text"))

        if len(native_text) < 30:
            # Page has little or no text (e.g., Doc 2 pages 2 to 54) -> Run OCR
            if ocr_engine is None:
                ocr_engine = get_ocr_engine()
            
            try:
                pix = pdf_doc[page_idx].get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                ocr_res, _ = ocr_engine(img_bytes)
                if ocr_res:
                    lines = [line[1] for line in ocr_res]
                    page_text = clean_text("\n".join(lines))
                else:
                    page_text = native_text
            except Exception as e:
                print(f"OCR failed for Doc {doc_id} P.{viewer_page}: {e}")
                page_text = native_text
        else:
            page_text = native_text

        if viewer_page % 30 == 0 or viewer_page == 1 or viewer_page == total_pages:
            print(f"Processed Document {doc_id} - Page {viewer_page}/{total_pages} (chars: {len(page_text)})", flush=True)

        if not page_text:
            continue

        # Split very long pages gracefully while keeping the exact viewer_page
        words = page_text.split()
        if len(words) > 850:
            sub_chunks = []
            chunk_size = 650
            overlap = 120
            for i in range(0, len(words), chunk_size - overlap):
                sub_text = " ".join(words[i:i + chunk_size])
                sub_chunks.append(sub_text)
                if i + chunk_size >= len(words):
                    break

            for part_idx, sub_content in enumerate(sub_chunks):
                header = f"[Document {doc_id}: {fiscal_year} | Page {viewer_page} (Part {part_idx+1})]"
                full_text = f"{header}\n{sub_content}"
                chunks.append({
                    "id": f"doc_{doc_id}_p{viewer_page}_part{part_idx+1}",
                    "doc_id": doc_id,
                    "fiscal_year": fiscal_year,
                    "viewer_page": viewer_page,
                    "part": part_idx + 1,
                    "text": full_text,
                    "raw_content": sub_content
                })
        else:
            header = f"[Document {doc_id}: {fiscal_year} | Page {viewer_page}]"
            full_text = f"{header}\n{page_text}"
            chunks.append({
                "id": f"doc_{doc_id}_p{viewer_page}",
                "doc_id": doc_id,
                "fiscal_year": fiscal_year,
                "viewer_page": viewer_page,
                "part": 1,
                "text": full_text,
                "raw_content": page_text
            })

    pdf_doc.close()
    print(f"Document {doc_id} extraction complete: {len(chunks)} chunks created.")
    return chunks

def load_or_extract_all_chunks(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Loads chunks from cache if available, otherwise extracts both documents and caches to JSON.
    """
    if CHUNKS_CACHE_FILE.exists() and not force_refresh:
        print(f"Loading cached chunks from {CHUNKS_CACHE_FILE}...", flush=True)
        with open(CHUNKS_CACHE_FILE, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        print(f"Loaded {len(chunks)} chunks from cache.", flush=True)
        return chunks

    print("Starting full PDF extraction across both annual reports...", flush=True)
    chunks_a = extract_document_chunks(DOC_A_PATH, doc_id="A", fiscal_year="FY 2024-25")
    chunks_b = extract_document_chunks(DOC_B_PATH, doc_id="B", fiscal_year="FY 2025-26")

    all_chunks = chunks_a + chunks_b
    print(f"Extraction complete! Total chunks: {len(all_chunks)}", flush=True)

    print(f"Saving extracted chunks to {CHUNKS_CACHE_FILE}...", flush=True)
    with open(CHUNKS_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    print("Chunks successfully cached to disk.", flush=True)

    return all_chunks

if __name__ == "__main__":
    load_or_extract_all_chunks(force_refresh=True)
