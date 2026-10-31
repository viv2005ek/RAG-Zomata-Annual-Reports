import re
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from backend.config import GROQ_API_KEY, GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL
from backend.guardrails import Guardrails
from backend.retriever import HybridRetriever

SYSTEM_PROMPT = """You are the official "Ask the Annual Report" AI analyst for Eternal Ltd (formerly Zomato Ltd).
You answer user questions strictly based on the two provided annual reports:
- Document A: Annual Report FY 2024-25 (385 pages)
- Document B: Annual Report FY 2025-26 (422 pages)

==================================================
CRITICAL CORE RULES:
==================================================
1. GROUNDED CITATIONS:
   - Every factual assertion MUST cite the source Document and the EXACT 1-indexed PDF viewer page number.
   - Standard format: `(Doc A, Page X)` or `(Doc B, Page Y)`.

2. ZERO HALLUCINATION & HONEST REFUSALS:
   - If the answer is NOT in the reports (e.g., future projections for 2035, unreleased forecasts, or undisclosed data), state clearly:
     "Not found in the reports." (Followed by a brief explanation of what is absent).
   - If the user's question is ambiguous or underspecified, explain what is available in the reports and ask clarification questions to guide the user.

3. CONSOLIDATED VS. STANDALONE CLARITY:
   - If a financial metric (revenue, EBITDA, net profit, expenses) is queried without specifying Consolidated or Standalone, present BOTH in a clear comparative table.

4. STEP-BY-STEP ARITHMETIC DERIVATIONS:
   - When calculating variances, growth rates, or percentage changes, write out the explicit math formula:
     `Growth % = ((FY26 Value - FY25 Value) / FY25 Value) * 100 = ...`

5. RESTATED FIGURES TRANSPARENCY:
   - If Document B presents a restated prior-year figure for FY25 differing from Document A, explicitly highlight both with their respective page numbers.

==================================================
RICH FORMATTING GUIDELINES:
==================================================
- **Bold**: Use bold for key numbers, company names, key executives, and totals (e.g. **₹54,364 cr**, **Sanjeev Bikhchandani**).
- *Italics*: Use italics for notes, restatements, or accounting definitions (e.g. *Restated under IND AS*).
- **Markdown Tables**: Always format side-by-side cross-year comparisons and Consolidated vs Standalone breakdowns in clean markdown tables.
- **Formulas / Code blocks**: Format math calculations in backticks or markdown formula blocks.
- **Section Headers**: Use clean markdown subheaders (`###`) where appropriate.
- End your response with:
  `### Clarifications & Suggested Follow-ups`
  Offer 2 to 3 logical, relevant next questions or ask the user for clarification if the query could be interpreted in multiple ways.

==================================================
FEW-SHOT EXAMPLES:
==================================================
--- EXAMPLE 1 (Cross-Year Financial Comparison with Table & Math) ---
User: What was total revenue in FY 2024-25 and FY 2025-26, and by what percentage did it change?
Assistant:
Total revenue across the two fiscal years is reported as follows:

| Reporting Basis | FY 2024-25 (Doc A) | FY 2025-26 (Doc B) | YoY Growth (%) | Citations |
| :--- | :--- | :--- | :--- | :--- |
| **Consolidated** | ₹20,243 cr | ₹54,364 cr | **+168.56%** | (Doc A, Page 232), (Doc B, Page 248) |
| **Standalone** | ₹8,617 cr | ₹10,899 cr | **+26.48%** | (Doc A, Page 342), (Doc B, Page 361) |

**Mathematical Derivation:**
- Consolidated Growth: `((54,364 - 20,243) / 20,243) * 100 = (34,121 / 20,243) * 100 = +168.56%`
- Standalone Growth: `((10,899 - 8,617) / 8,617) * 100 = (2,282 / 8,617) * 100 = +26.48%`

*Note: The dramatic growth in consolidated revenue was largely driven by hyper-scaling in the Quick Commerce (Blinkit) vertical.*

### Clarifications & Suggested Follow-ups
1. Would you like a segment-wise breakdown of revenue between Food Delivery, Quick Commerce, and Hyperpure?
2. Should we examine the Consolidated Net Profit (PAT) margin trends over the same period?

--- EXAMPLE 2 (Unanswerable / Forward-Looking Refusal + Clarification) ---
User: What revenue does the company expect to earn in 2035?
Assistant:
**Not found in the reports.**
Neither Annual Report FY 2024-25 nor FY 2025-26 contains forward-looking financial projections or guidance extending to the year 2035. Annual reports provide historical audited financials and general strategic vision, but do not publish speculative decade-long revenue targets.

### Clarifications & Suggested Follow-ups
1. Did you mean the company's historical revenue for the latest reported fiscal year (FY 2025-26)?
2. Would you like to review management's qualitative strategic commentary on long-term market opportunities in quick commerce?
"""

class RAGEngine:
    def __init__(self, retriever: Optional[HybridRetriever] = None):
        self.retriever = retriever or HybridRetriever()

    def _call_groq_llm(self, messages: List[Dict[str, str]], model: str = GROQ_PRIMARY_MODEL) -> str:
        import time
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.05,
            "max_tokens": 1200,
            "reasoning_effort": "low"
        }

        for attempt in range(8):
            req = urllib.request.Request(url, headers=headers, data=json.dumps(payload).encode("utf-8"))
            try:
                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    msg = data["choices"][0]["message"]
                    content = msg.get("content") or ""
                    if not content.strip() and msg.get("reasoning"):
                        content = msg["reasoning"]
                    if content.strip():
                        return content.strip()
                    if model != GROQ_FALLBACK_MODEL:
                        return self._call_groq_llm(messages, model=GROQ_FALLBACK_MODEL)
                    return content.strip()
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait_time = min(40, (attempt + 1) * 6)
                    print(f"[RAG] Rate limit 429 on {model}, waiting {wait_time}s (attempt {attempt+1}/8)...")
                    time.sleep(wait_time)
                    continue
                elif model != GROQ_FALLBACK_MODEL:
                    print(f"[RAG] Model {model} failed ({e.code}), falling back to {GROQ_FALLBACK_MODEL}...")
                    return self._call_groq_llm(messages, model=GROQ_FALLBACK_MODEL)
                raise e
        raise RuntimeError(f"Groq API exceeded max retries on {model}.")

    def stream_groq_llm(self, messages: List[Dict[str, str]], model: str = GROQ_PRIMARY_MODEL):
        """
        Streams token chunks from Groq API via SSE, falling back to synchronous chunks if needed.
        """
        import time
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.05,
            "max_tokens": 1200,
            "stream": True,
            "reasoning_effort": "low"
        }
        tokens_yielded = 0
        try:
            req = urllib.request.Request(url, headers=headers, data=json.dumps(payload).encode("utf-8"))
            with urllib.request.urlopen(req, timeout=60) as resp:
                for line in resp:
                    line_str = line.decode("utf-8").strip()
                    if line_str.startswith("data: "):
                        data_str = line_str[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk_json = json.loads(data_str)
                            delta = chunk_json["choices"][0]["delta"]
                            token = delta.get("content") or ""
                            if token:
                                tokens_yielded += 1
                                yield token
                        except Exception:
                            continue
        except Exception as e:
            print(f"[RAG] Stream error: {e}")

        # If streaming yielded no tokens, run synchronous fallback
        if tokens_yielded == 0:
            print("[RAG] Stream yielded 0 tokens, executing sync fallback...")
            try:
                raw = self._call_groq_llm(messages, model=model)
                for word in re.split(r"(\s+)", raw):
                    if word:
                        yield word
            except Exception as fb_err:
                print(f"[RAG] Sync fallback error: {fb_err}")

    def answer_question(self, query: str) -> Dict[str, Any]:
        """
        Full RAG pipeline: Guardrails -> Query Analysis -> Hybrid Retrieval -> LLM Generation -> Verification
        """
        # Step 1: Input Guardrail
        is_safe, validation_msg = Guardrails.validate_input(query)
        if not is_safe:
            return {
                "answer": validation_msg,
                "citations": [],
                "unverified_citations": [],
                "is_grounded": False,
                "suggested_followups": [],
                "chunks_used": []
            }

        # Step 2: Query Intent Analysis
        intent = Guardrails.analyze_query_intent(query)
        target_docs = intent["target_docs"]

        # Step 3: Hybrid Retrieval (BM25 + Dense Pinecone + RRF)
        retrieved_chunks = self.retriever.hybrid_search(
            query=query, 
            top_k=4, 
            doc_filter=target_docs if len(target_docs) == 1 else None
        )

        if not retrieved_chunks:
            return {
                "answer": "Not found in the reports. No relevant context could be retrieved for this query.",
                "citations": [],
                "unverified_citations": [],
                "is_grounded": True,
                "suggested_followups": [
                    "What was total consolidated revenue in FY 2024-25 and FY 2025-26?",
                    "Who are the statutory auditors of Eternal Ltd?",
                    "How many employees does Eternal Ltd have?"
                ],
                "chunks_used": []
            }

        # Step 4: Construct Context
        context_blocks = []
        for c in retrieved_chunks:
            context_blocks.append(
                f"--- [Document {c['doc_id']} | {c['fiscal_year']} | PDF Viewer Page: {c['viewer_page']}] ---\n"
                f"{c['text']}\n"
            )
        context_text = "\n\n".join(context_blocks)

        user_content = f"""Context from Eternal Ltd Annual Reports:
{context_text}

User Question: {query}

Please provide a clear, accurate, and short answer in plain English adhering to all instructions. Every factual statement must cite the document and viewer page number. If not found in the provided context, state "Not found in the reports."
"""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ]

        # Step 5: LLM Generation
        raw_answer = self._call_groq_llm(messages)

        # Step 6: Dual-Layer Output Verification Guardrail (Deterministic Regex + LLM Semantic Guardrail)
        verification = Guardrails.verify_output_citations(raw_answer, retrieved_chunks)
        
        # If regex missed citations on a factual response, invoke LLM guardrail
        if not verification["extracted_citations"] and "not found in the reports" not in raw_answer.lower():
            llm_check = Guardrails.verify_with_llm(raw_answer, retrieved_chunks, self._call_groq_llm)
            if llm_check.get("extracted_citations"):
                verification["extracted_citations"] = llm_check["extracted_citations"]
                verification["unverified_citations"] = llm_check["unverified_citations"]
                verification["is_grounded"] = llm_check["is_faithful"]

        # Parse suggested follow-ups / clarifications if present
        followups = []
        fu_split = re.split(r"###\s*(?:Clarifications\s*&\s*)?Suggested\s+Follow[\-‑\s]*ups?", raw_answer, flags=re.IGNORECASE)
        if len(fu_split) > 1:
            main_answer = fu_split[0].strip().rstrip("- \n\r")
            followup_text = fu_split[1].strip()
            for line in followup_text.splitlines():
                clean_line = line.strip().lstrip("-*0123456789. ")
                if clean_line:
                    followups.append(clean_line)
        else:
            main_answer = raw_answer

        return {
            "answer": main_answer,
            "citations": verification["extracted_citations"],
            "unverified_citations": verification["unverified_citations"],
            "is_grounded": verification["is_grounded"],
            "suggested_followups": followups,
            "chunks_used": [
                {
                    "doc_id": c["doc_id"],
                    "viewer_page": c["viewer_page"],
                    "fiscal_year": c["fiscal_year"],
                    "preview": c["text"][:200]
                }
                for c in retrieved_chunks
            ]
        }
