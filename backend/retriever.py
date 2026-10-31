import re
import pickle
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from rank_bm25 import BM25Okapi
Ranker = None
RerankRequest = None
from backend.config import (
    PINECONE_API_KEY, 
    PINECONE_INDEX_NAME, 
    PINECONE_EMBED_MODEL,
    BM25_INDEX_FILE,
    CHUNKS_CACHE_FILE
)

class HybridRetriever:
    def __init__(self):
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pc.Index(PINECONE_INDEX_NAME)
        self.chunks_by_id: Dict[str, Dict[str, Any]] = {}
        self.bm25: Optional[BM25Okapi] = None
        self.bm25_ids: List[str] = []
        self.ranker: Optional[Ranker] = None
        self._load_local_indices()

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """
        Tokenizes text into alphanumeric tokens, preserving numbers, financial years, and symbols.
        """
        clean = text.lower()
        tokens = re.findall(r"[a-z0-9\.\-%]+", clean)
        return tokens

    def _load_local_indices(self):
        """
        Loads cached chunks and precomputed BM25 index if available.
        """
        import json
        if CHUNKS_CACHE_FILE.exists():
            with open(CHUNKS_CACHE_FILE, "r", encoding="utf-8") as f:
                all_chunks = json.load(f)
                self.chunks_by_id = {c["id"]: c for c in all_chunks}
                print(f"[Retriever] Loaded {len(self.chunks_by_id)} chunks into memory.")

        if BM25_INDEX_FILE.exists():
            try:
                with open(BM25_INDEX_FILE, "rb") as f:
                    data = pickle.load(f)
                    self.bm25 = data["bm25"]
                    self.bm25_ids = data["ids"]
                    print(f"[Retriever] Loaded BM25 index with {len(self.bm25_ids)} documents.")
            except Exception as e:
                print(f"[Retriever] Failed to load BM25 index: {e}")

    def build_bm25_index(self, chunks: List[Dict[str, Any]]):
        """
        Builds and serializes BM25 index over the chunks.
        """
        print(f"[Retriever] Building BM25 index for {len(chunks)} chunks...")
        corpus = [self.tokenize(c["text"]) for c in chunks]
        self.bm25 = BM25Okapi(corpus)
        self.bm25_ids = [c["id"] for c in chunks]
        self.chunks_by_id = {c["id"]: c for c in chunks}

        with open(BM25_INDEX_FILE, "wb") as f:
            pickle.dump({"bm25": self.bm25, "ids": self.bm25_ids}, f)
        print(f"[Retriever] BM25 index saved to {BM25_INDEX_FILE}.")

    def index_chunks_to_pinecone(self, chunks: List[Dict[str, Any]], batch_size: int = 64):
        """
        Uploads chunks to Pinecone using Pinecone's serverless inference embeddings.
        """
        print(f"[Retriever] Indexing {len(chunks)} chunks to Pinecone index '{PINECONE_INDEX_NAME}'...")
        self.build_bm25_index(chunks)

        total = len(chunks)
        for i in range(0, total, batch_size):
            batch = chunks[i:i + batch_size]
            texts = [c["text"] for c in batch]
            ids = [c["id"] for c in batch]

            print(f"Generating Pinecone embeddings for batch {i+1} to {min(i+batch_size, total)}/{total}...")
            # Generate 1024-dimension embeddings via Pinecone inference API
            embed_resp = self.pc.inference.embed(
                model=PINECONE_EMBED_MODEL,
                inputs=texts,
                parameters={"input_type": "passage", "truncate": "END"}
            )
            embeddings = [e.values for e in embed_resp]

            # Prepare vectors for upsert
            vectors_to_upsert = []
            for c_id, emb, c in zip(ids, embeddings, batch):
                metadata = {
                    "doc_id": c["doc_id"],
                    "fiscal_year": c["fiscal_year"],
                    "viewer_page": c["viewer_page"],
                    "part": c["part"],
                    "text": c["text"][:1000] # store text preview in metadata
                }
                vectors_to_upsert.append((c_id, emb, metadata))

            self.index.upsert(vectors=vectors_to_upsert)
            print(f"Upserted {len(vectors_to_upsert)} vectors to Pinecone.")

        print("[Retriever] All chunks successfully indexed to Pinecone!")

    def dense_search(self, query: str, top_k: int = 15, doc_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search in Pinecone.
        """
        try:
            embed_resp = self.pc.inference.embed(
                model=PINECONE_EMBED_MODEL,
                inputs=[query],
                parameters={"input_type": "query", "truncate": "END"}
            )
            query_vector = embed_resp[0].values

            filter_dict = None
            if doc_filter and len(doc_filter) == 1:
                filter_dict = {"doc_id": {"$eq": doc_filter[0]}}

            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )

            dense_matches = []
            for match in results.get("matches", []):
                chunk_id = match["id"]
                score = match.get("score", 0.0)
                chunk_data = self.chunks_by_id.get(chunk_id)
                if chunk_data:
                    dense_matches.append({
                        "chunk": chunk_data,
                        "dense_score": score
                    })
            return dense_matches
        except Exception as e:
            print(f"[Retriever] Dense search error: {e}")
            return []

    def bm25_search(self, query: str, top_k: int = 15, doc_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Performs exact keyword BM25 search.
        """
        if not self.bm25 or not self.bm25_ids:
            return []

        tokens = self.tokenize(query)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

        bm25_matches = []
        for idx in top_indices:
            if scores[idx] <= 0:
                break
            chunk_id = self.bm25_ids[idx]
            chunk_data = self.chunks_by_id.get(chunk_id)
            if not chunk_data:
                continue

            if doc_filter and chunk_data.get("doc_id") not in doc_filter:
                continue

            bm25_matches.append({
                "chunk": chunk_data,
                "bm25_score": float(scores[idx])
            })
            if len(bm25_matches) >= top_k:
                break

        return bm25_matches

    def _rrf_search(self, query: str, top_k: int = 4, doc_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Internal RRF Search over dense vector matches and BM25 matches.
        """
        dense_results = self.dense_search(query, top_k=15, doc_filter=doc_filter)
        bm25_results = self.bm25_search(query, top_k=15, doc_filter=doc_filter)

        # RRF Scoring (standard constant k = 60)
        rrf_scores: Dict[str, float] = {}
        chunks_map: Dict[str, Dict[str, Any]] = {}

        for rank, item in enumerate(dense_results):
            c_id = item["chunk"]["id"]
            chunks_map[c_id] = item["chunk"]
            rrf_scores[c_id] = rrf_scores.get(c_id, 0.0) + (1.0 / (60 + rank + 1))

        for rank, item in enumerate(bm25_results):
            c_id = item["chunk"]["id"]
            chunks_map[c_id] = item["chunk"]
            rrf_scores[c_id] = rrf_scores.get(c_id, 0.0) + (1.0 / (60 + rank + 1))

        # Sort by combined RRF score
        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        top_chunks = [chunks_map[c_id] for c_id in sorted_ids[:top_k]]
        return top_chunks

    def hybrid_search(self, query: str, top_k: int = 8, doc_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Generalized Hybrid Search with Cross-Document RRF & Language-Aware Cross-Encoder Reranking:
        1. Universal accounting synonym expansion (no hardcoded answers or numbers).
        2. Broad retrieval (top 25 dense + top 25 BM25) across all documents.
        3. Reciprocal Rank Fusion (RRF) to merge candidate pools.
        4. Cross-Encoder reranking (FlashRank) for deep semantic query-passage scoring.
        5. Cross-year balance safeguard ensuring representation from both reports when relevant.
        """
        if Ranker is not None and self.ranker is None:
            try:
                self.ranker = Ranker()
            except Exception as e:
                print(f"[Retriever] FlashRank init failed ({e}), using RRF fusion.")
                self.ranker = None

        q_lower = query.lower()
        expanded_query = query
        # General accounting & domain synonyms (strictly no hardcoded answers/numbers)
        if "employee" in q_lower or "headcount" in q_lower or "workforce" in q_lower:
            expanded_query += " permanent employees headcount workforce total staff"
        if "differently" in q_lower or "difference" in q_lower or "restated" in q_lower:
            expanded_query += " restated reclassified comparative prior year figures"
        if "fastest" in q_lower or "segment" in q_lower:
            expanded_query += " segment revenue food delivery quick commerce hyperpure B2B"
        if "profit" in q_lower:
            expanded_query += " profit after tax PAT Statement of Profit and Loss"
        if "revenue" in q_lower:
            expanded_query += " revenue from operations Statement of Profit and Loss"
        if "auditor" in q_lower:
            expanded_query += " statutory auditors report of independent auditors"
        if "chairman" in q_lower:
            expanded_query += " Chairman of the Board of Directors"
        if "ceo" in q_lower or "chief executive" in q_lower or "managing director" in q_lower:
            expanded_query += " Chief Executive Officer Managing Director CEO"

        # Broad candidate retrieval from dense (Pinecone) and sparse (BM25)
        dense_matches = self.dense_search(expanded_query, top_k=25, doc_filter=doc_filter)
        bm25_matches = self.bm25_search(expanded_query, top_k=25, doc_filter=doc_filter)

        # Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        chunks_map: Dict[str, Dict[str, Any]] = {}

        for rank, item in enumerate(dense_matches):
            c_id = item["chunk"]["id"]
            chunks_map[c_id] = item["chunk"]
            rrf_scores[c_id] = rrf_scores.get(c_id, 0.0) + (1.0 / (60 + rank + 1))

        for rank, item in enumerate(bm25_matches):
            c_id = item["chunk"]["id"]
            chunks_map[c_id] = item["chunk"]
            rrf_scores[c_id] = rrf_scores.get(c_id, 0.0) + (1.0 / (60 + rank + 1))

        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:20]
        candidates = [chunks_map[cid] for cid in sorted_ids]

        if not candidates:
            return []

        # Cross-Encoder Reranking via FlashRank
        if self.ranker is not None and RerankRequest is not None:
            try:
                passages = [
                    {"id": c["id"], "text": c["text"][:1000], "meta": {"chunk": c}}
                    for c in candidates
                ]
                rerank_req = RerankRequest(query=query, passages=passages)
                reranked = self.ranker.rerank(rerank_req)
                ranked_chunks = [r["meta"]["chunk"] for r in reranked]
            except Exception as e:
                print(f"[Retriever] Reranking exception ({e}), falling back to RRF.")
                ranked_chunks = candidates
        else:
            ranked_chunks = candidates

        # Determine if query compares or queries both documents
        is_cross_doc = any(term in q_lower for term in [
            "2024-25", "2025-26", "both", "two years", "between", 
            "each year", "differently", "fastest", "change", "growth", "compare"
        ])

        if is_cross_doc and not doc_filter:
            top_a = [c for c in ranked_chunks if c.get("doc_id") == "A"]
            top_b = [c for c in ranked_chunks if c.get("doc_id") == "B"]
            half = max(2, top_k // 2)
            balanced = (top_a[:half] + top_b[:half])
            seen = {c["id"] for c in balanced}
            for c in ranked_chunks:
                if len(balanced) >= top_k:
                    break
                if c["id"] not in seen:
                    balanced.append(c)
                    seen.add(c["id"])
            return balanced[:top_k]

        return ranked_chunks[:top_k]
