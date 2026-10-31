import sys
from pathlib import Path

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ingestion.extractor import load_or_extract_all_chunks
from backend.retriever import HybridRetriever

def main():
    print("==================================================")
    print("   ASK THE ANNUAL REPORT - RAG INGESTION SCRIPT   ")
    print("==================================================")
    
    # 1. Load or extract all page chunks
    chunks = load_or_extract_all_chunks(force_refresh=False)
    print(f"Total chunks ready for indexing: {len(chunks)}")

    # 2. Initialize Retriever and Index to Pinecone + BM25
    retriever = HybridRetriever()
    retriever.index_chunks_to_pinecone(chunks, batch_size=64)

    # 3. Quick verification query
    print("\nRunning quick test retrieval on 'statutory auditors'...")
    test_results = retriever.hybrid_search("Who are the statutory auditors?", top_k=3)
    for idx, c in enumerate(test_results):
        print(f"[{idx+1}] Doc {c['doc_id']} Page {c['viewer_page']}: {c['text'][:120]}...")

    print("\nINGESTION & HYBRID INDEXING COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
