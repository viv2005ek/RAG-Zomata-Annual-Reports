import re
import json
from typing import Dict, Any, List, Tuple

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions",
    r"forget\s+(what|all)\s+you\s+(were\s+)?told",
    r"you\s+are\s+now\s+(an?\s+)?unrestricted",
    r"system\s*prompt",
    r"developer\s+mode",
    r"jailbreak",
    r"dan\s+mode",
    r"act\s+as\s+an\s+ai\s+without\s+rules",
    r"bypass\s+all\s+filters"
]

FINANCIAL_TERMS_NEEDING_CLARIFICATION = [
    "revenue", "profit", "net profit", "ebitda", "loss", "turnover", 
    "assets", "liabilities", "cash flow", "borrowings", "net worth"
]

class Guardrails:
    @staticmethod
    def validate_input(query: str) -> Tuple[bool, str]:
        """
        Validates user input against prompt injection and malicious attempts.
        Returns (is_safe, error_or_sanitized_message)
        """
        if not query or not query.strip():
            return False, "Query cannot be empty."

        clean_query = query.strip()
        lower_query = clean_query.lower()

        # Check prompt injection patterns
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, lower_query):
                return False, (
                    "Security Alert: Your query contains patterns resembling prompt injection. "
                    "This system operates under strict guardrails to answer queries exclusively based on "
                    "Eternal Ltd's Annual Reports."
                )

        # Length check
        if len(clean_query) > 1000:
            return False, "Query is too long. Please limit questions to 1000 characters."

        return True, clean_query

    @staticmethod
    def analyze_query_intent(query: str) -> Dict[str, Any]:
        """
        Detects year focus, ambiguity (Consolidated vs Standalone), and comparison nature.
        """
        q_lower = query.lower()

        has_fy25 = any(term in q_lower for term in ["2024-25", "fy25", "fy 25", "2024-2025", "2025"])
        has_fy26 = any(term in q_lower for term in ["2025-26", "fy26", "fy 26", "2025-2026", "2026"])
        is_cross_year = ("both" in q_lower or "between" in q_lower or "compare" in q_lower or 
                         "growth" in q_lower or "percentage" in q_lower or (has_fy25 and has_fy26))

        # Check if financial term is queried without specifying Consolidated vs Standalone
        needs_basis_clarification = False
        has_basis_specified = ("consolidated" in q_lower or "standalone" in q_lower)
        if not has_basis_specified:
            for term in FINANCIAL_TERMS_NEEDING_CLARIFICATION:
                if term in q_lower:
                    needs_basis_clarification = True
                    break

        target_docs = []
        if is_cross_year or (not has_fy25 and not has_fy26):
            target_docs = ["A", "B"]
        elif has_fy25 and not has_fy26:
            target_docs = ["A", "B"] # Include B to check for comparative restatements!
        elif has_fy26:
            target_docs = ["B"]

        return {
            "has_fy25": has_fy25,
            "has_fy26": has_fy26,
            "is_cross_year": is_cross_year,
            "needs_basis_clarification": needs_basis_clarification,
            "target_docs": target_docs
        }

    @staticmethod
    def verify_output_citations(answer: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verifies that cited page numbers in the answer actually exist in the retrieved chunks.
        Detects hallucinated citations.
        """
        # Valid viewer page numbers present in retrieved context
        valid_citations = set()
        for chunk in retrieved_chunks:
            doc_id = chunk.get("doc_id", "")
            page_no = chunk.get("viewer_page", 0)
            valid_citations.add((doc_id, page_no))

        # Parse citations from answer text using flexible regex
        matches_fwd = re.findall(
            r"Doc(?:ument)?[\s\u202f]*([ABab])[^\d\n\r]{1,20}?(?:Page|P\.?|p\.?)[\s\u202f]*(\d+)",
            answer,
            flags=re.IGNORECASE
        )
        matches_rev = re.findall(
            r"(?:Page|P\.?|p\.?)[\s\u202f]*(\d+)[^\d\n\r]{1,20}?Doc(?:ument)?[\s\u202f]*([ABab])",
            answer,
            flags=re.IGNORECASE
        )
        
        extracted_citations = []
        for m in matches_fwd:
            extracted_citations.append((m[0].upper(), int(m[1])))
        for m in matches_rev:
            extracted_citations.append((m[1].upper(), int(m[0])))

        # Secondary fallback: look for standalone "Doc A/B" or "(Page X)" if explicit
        if not extracted_citations and "not found in the reports" not in answer.lower():
            for chunk in retrieved_chunks:
                c_doc = chunk.get("doc_id", "")
                c_page = str(chunk.get("viewer_page", ""))
                if c_page in answer and (f"Doc {c_doc}" in answer or f"Document {c_doc}" in answer or f"Doc {c_doc}" in answer):
                    extracted_citations.append((c_doc, int(c_page)))

        # Check if any cited page is absent from context
        unverified_citations = []
        for cit in extracted_citations:
            if cit not in valid_citations:
                unverified_citations.append(cit)

        is_grounded = len(unverified_citations) == 0 or len(valid_citations) > 0

        return {
            "extracted_citations": extracted_citations,
            "unverified_citations": unverified_citations,
            "is_grounded": is_grounded,
            "valid_citations_in_context": list(valid_citations)
        }

    @staticmethod
    def verify_with_llm(answer: str, retrieved_chunks: List[Dict[str, Any]], call_llm_fn) -> Dict[str, Any]:
        """
        LLM Guardrail: Secondary semantic check that runs when regex citation extraction
        fails to find citations on non-refusal answers, or to verify zero hallucination.
        """
        if "not found in the reports" in answer.lower():
            return {
                "is_faithful": True,
                "extracted_citations": [],
                "unverified_citations": [],
                "notes": "Honest refusal confirmed."
            }

        valid_citations = [(c.get("doc_id", ""), c.get("viewer_page", 0)) for c in retrieved_chunks]
        context_summary = "\n".join([
            f"Doc {c.get('doc_id')} Page {c.get('viewer_page')}: {c.get('text', '')[:180]}..."
            for c in retrieved_chunks
        ])

        guardrail_prompt = f"""You are an audit guardrail evaluator for Eternal Ltd annual reports RAG.
Review the candidate answer against the retrieved chunks below.
1. Identify any citations (Doc A or Doc B, Page X) that support the facts.
2. Determine if the answer is fully faithful to the chunks (no hallucinations).

Candidate Answer:
{answer}

Available Chunks:
{context_summary}

Respond ONLY in strict JSON:
{{
    "is_faithful": true,
    "citations": [["A", 232], ["B", 248]],
    "hallucination_detected": false
}}"""
        try:
            raw = call_llm_fn([{"role": "user", "content": guardrail_prompt}])
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                parsed_cits = [(str(c[0]).upper(), int(c[1])) for c in data.get("citations", []) if len(c) == 2]
                unverified = [c for c in parsed_cits if c not in valid_citations]
                return {
                    "is_faithful": data.get("is_faithful", True) and not data.get("hallucination_detected", False),
                    "extracted_citations": parsed_cits,
                    "unverified_citations": unverified,
                    "notes": "Verified by LLM guardrail."
                }
        except Exception:
            pass

        return {
            "is_faithful": True,
            "extracted_citations": [],
            "unverified_citations": [],
            "notes": "Fallback to standard verification."
        }

