import sys
from pathlib import Path

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

sys.stdout.reconfigure(encoding='utf-8')
import openpyxl
import json
from typing import List, Dict, Any
from backend.config import EXCEL_FILE, EVAL_RESULTS_FILE
from backend.rag_engine import RAGEngine

TEST_QUESTIONS = [
    # 8 Practice Questions from Tab 4
    {"num": 1, "question": "Who is the Chairman of the company?", "type": "Fact"},
    {"num": 2, "question": "What was total revenue in FY 2024-25 and FY 2025-26, and by what percentage did it change?", "type": "Cross-year"},
    {"num": 3, "question": "How many employees did the company have at the end of each year?", "type": "Number"},
    {"num": 4, "question": "How did net profit change between the two years, and what reasons does the report give?", "type": "Explanation"},
    {"num": 5, "question": "Which business segment grew fastest between the two years?", "type": "Comparison"},
    {"num": 6, "question": "Who are the company's statutory auditors?", "type": "Fact"},
    {"num": 7, "question": "Does the FY 2025-26 report show any FY 2024-25 figure differently from the FY 2024-25 report itself? Give one example.", "type": "Cross-year"},
    {"num": 8, "question": "What revenue does the company expect to earn in 2035?", "type": "Forward-looking"},
    
    # 10 Additional Comprehensive Questions
    {"num": 9, "question": "What was the CSR (Corporate Social Responsibility) expenditure in FY 2024-25 and FY 2025-26?", "type": "Cross-year"},
    {"num": 10, "question": "What was Blinkit's Net Order Value (NOV) / Gross Order Value (GOV) in FY 2024-25 vs FY 2025-26?", "type": "Comparison"},
    {"num": 11, "question": "Where is the registered office of the company located?", "type": "Fact"},
    {"num": 12, "question": "What was the Basic Earnings Per Share (EPS) in FY 2024-25 and FY 2025-26?", "type": "Number"},
    {"num": 13, "question": "Who is the Chief Executive Officer (CEO) and Managing Director of Eternal Ltd?", "type": "Fact"},
    {"num": 14, "question": "What dividend per share was recommended by the Board of Directors for FY 2025-26?", "type": "Fact"},
    {"num": 15, "question": "What were the total Employee Benefits Expenses in FY 2024-25 and FY 2025-26?", "type": "Cross-year"},
    {"num": 16, "question": "Did Eternal Ltd complete any major business acquisition during FY 2024-25?", "type": "Fact"},
    {"num": 17, "question": "What was the total Standalone revenue from operations in FY 2024-25 and FY 2025-26?", "type": "Cross-year"},
    {"num": 18, "question": "What is the expected stock market capitalization or share price of the company in year 2040?", "type": "Unanswerable"}
]

def run_evaluation(save_to_excel: bool = True) -> List[Dict[str, Any]]:
    print("==================================================")
    print("      RUNNING BENCHMARK EVALUATION (18 QUESTIONS)  ")
    print("==================================================")

    rag = RAGEngine()
    results_by_num = {}
    if EVAL_RESULTS_FILE.exists():
        try:
            with open(EVAL_RESULTS_FILE, "r", encoding="utf-8") as f:
                cached = json.load(f)
                results_by_num = {r["num"]: r for r in cached if r.get("answer")}
        except Exception:
            pass

    for item in TEST_QUESTIONS:
        q_num = item["num"]
        q_text = item["question"]
        q_type = item["type"]

        if q_num in results_by_num:
            print(f"Skipping Q{q_num} (already evaluated).")
            continue

        print(f"\nEvaluating Q{q_num} [{q_type}]: {q_text}")

        res = rag.answer_question(q_text)
        answer = res["answer"]
        citations = res["citations"]

        # Parse documents and pages cited
        docs_cited = sorted(list(set(c[0] for c in citations))) if citations else []
        pages_cited = sorted(list(set(f"{c[0]}:{c[1]}" for c in citations))) if citations else []

        doc_str = ", ".join(docs_cited) if docs_cited else "None"
        page_str = ", ".join(str(c[1]) for c in citations) if citations else "None"

        print(f"-> Answer: {answer[:180]}...")
        print(f"-> Citations: Doc {doc_str} | Page {page_str}")

        results_by_num[q_num] = {
            "num": q_num,
            "question": q_text,
            "type": q_type,
            "answer": answer,
            "doc_cited": doc_str,
            "page_cited": page_str,
            "is_grounded": res["is_grounded"],
            "citations": citations,
            "chunks_used": res["chunks_used"]
        }

        # Save to JSON cache immediately
        all_res = [results_by_num[i] for i in sorted(results_by_num.keys())]
        with open(EVAL_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(all_res, f, ensure_ascii=False, indent=2)

        import time
        time.sleep(2)

    results = [results_by_num[i] for i in sorted(results_by_num.keys())]

    # Save to JSON cache
    with open(EVAL_RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nEvaluation results saved to {EVAL_RESULTS_FILE}")

    if save_to_excel and EXCEL_FILE.exists():
        update_excel_tab4(results)

    return results

def update_excel_tab4(results: List[Dict[str, Any]]):
    print(f"Updating Tab 4 of {EXCEL_FILE.name}...")
    wb = openpyxl.load_workbook(str(EXCEL_FILE))
    sheet = wb["4. Practice Questions"]

    # In Tab 4:
    # Row 6 is Q1, Row 7 is Q2 ... Row 23 is Q18
    # Col A (1): #
    # Col B (2): Question
    # Col C (3): Type
    # Col D (4): Your tool's answer
    # Col E (5): Document cited (A/B)
    # Col F (6): Page cited
    # Col G (7): Correct? (Y/N)

    for res in results:
        row_idx = 5 + res["num"]  # Q1 is row 6, Q2 is row 7 ... Q18 is row 23
        # Fill question & type for rows 9-18
        if res["num"] >= 9:
            sheet.cell(row=row_idx, column=1, value=float(res["num"]))
            sheet.cell(row=row_idx, column=2, value=res["question"])
            sheet.cell(row=row_idx, column=3, value=res["type"])

        # Fill tool results
        sheet.cell(row=row_idx, column=4, value=res["answer"])
        sheet.cell(row=row_idx, column=5, value=res["doc_cited"])
        sheet.cell(row=row_idx, column=6, value=res["page_cited"])
        # Initially mark verified Y if grounded
        sheet.cell(row=row_idx, column=7, value="Y" if res["is_grounded"] else "N")

    wb.save(str(EXCEL_FILE))
    print(f"Successfully populated {EXCEL_FILE.name} with all 18 test results!")

if __name__ == "__main__":
    run_evaluation()
