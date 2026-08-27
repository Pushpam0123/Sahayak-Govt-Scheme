import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Set

import yaml
from sqlalchemy import delete, select

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db import AsyncSessionLocal
from api.llm.client import get_llm_client
from api.models.chat import QALog
from api.models.eval import EvalCase, EvalRun
from api.models.scheme import Chunk, Document
from api.services.chat import get_grounded_answer
from api.services.retrieval import get_fts_search, get_vector_search, hybrid_search

logger = logging.getLogger("sahayak.eval.harness")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)


async def load_golden_set(
    yaml_path: str = "eval/golden/golden_set.yaml",
) -> List[Dict[str, Any]]:
    """Loads cases from the golden set YAML file."""
    if not os.path.exists(yaml_path):
        raise FileNotFoundError(f"Golden set file not found at {yaml_path}")
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    cases = data.get("cases", [])
    if not isinstance(cases, list):
        return []
    return cases


def _normalize_whitespace(text: str) -> str:
    """Collapses any run of whitespace (including the literal newlines PDF
    extraction leaves at a line-wrap) to a single space, so a verbatim quote
    that happens to fall across a wrapped line still matches."""
    return re.sub(r"\s+", " ", text).strip()


async def resolve_gold_chunk_ids(db: Any, scheme_id: str, quote: str) -> List[int]:
    """Resolves a verbatim quote in a scheme to its database chunk IDs.

    Matches on whitespace-normalized text rather than a raw ILIKE. Chunk
    text preserves the source PDF's line-wrap newlines verbatim, so a
    quote that is genuinely verbatim in the document but happens to span
    one of those wraps (e.g. "...offering life\ninsurance cover...") would
    otherwise silently fail to resolve to any chunk under plain ILIKE,
    undercounting real in-corpus cases rather than reflecting a retrieval
    miss.
    """
    if not scheme_id or not quote:
        return []

    stmt = (
        select(Chunk.id, Chunk.text)
        .join(Document)
        .where(Document.scheme_id == scheme_id)
    )
    result = await db.execute(stmt)
    normalized_quote = _normalize_whitespace(quote)
    return [
        chunk_id
        for chunk_id, text in result.all()
        if normalized_quote in _normalize_whitespace(text)
    ]


async def sync_eval_cases(
    db: Any, cases_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Clears and re-populates the eval_cases table with resolved gold_chunk_ids."""
    logger.info("Syncing golden cases with the database...")

    # 1. Clear existing cases
    await db.execute(delete(EvalCase))
    await db.flush()

    synced_cases = []
    for c in cases_data:
        question = c["question"]
        scheme_id = c.get("scheme_id")
        quote = c.get("gold_quote")
        category = c["category"]
        gold_answer = c.get("gold_answer")

        # Resolve quote to chunk IDs
        gold_chunk_ids = []
        if scheme_id and quote:
            gold_chunk_ids = await resolve_gold_chunk_ids(db, scheme_id, quote)
            if not gold_chunk_ids:
                logger.warning(
                    "Could not resolve any chunk ID for scheme '%s' with quote '%s'",
                    scheme_id,
                    quote,
                )

        eval_case = EvalCase(
            question=question,
            gold_answer=gold_answer,
            gold_chunk_ids=gold_chunk_ids,
            category=category,
        )
        db.add(eval_case)
        await db.flush()

        synced_cases.append(
            {
                "id": eval_case.id,
                "question": question,
                "gold_chunk_ids": gold_chunk_ids,
                "category": category,
            }
        )

    await db.commit()
    logger.info("Successfully synced %d golden cases.", len(synced_cases))
    return synced_cases


def get_git_sha() -> str:
    """Gets the current Git commit SHA."""
    try:
        return (
            subprocess.check_output(["git", "rev-parse", "HEAD"])
            .decode("utf-8")
            .strip()
        )
    except Exception:
        return "unknown"


async def evaluate_strategy(
    db: Any,
    cases: List[Dict[str, Any]],
    strategy: str,
) -> float:
    """Evaluates a retrieval strategy returning average Recall@5 for in-corpus cases."""
    in_corpus_cases = [c for c in cases if c["gold_chunk_ids"]]
    if not in_corpus_cases:
        return 0.0

    hits = 0
    for case in in_corpus_cases:
        question = case["question"]
        gold_ids = set(case["gold_chunk_ids"])

        retrieved_ids: Set[int] = set()
        if strategy == "vector":
            chunks = await get_vector_search(db, question, limit=5)
            retrieved_ids = {int(c.id) for c in chunks}
        elif strategy == "fts":
            chunks = await get_fts_search(db, question, limit=5)
            retrieved_ids = {int(c.id) for c in chunks}
        elif strategy == "hybrid":
            results = await hybrid_search(db, question, limit=5)
            retrieved_ids = {int(c.id) for c, _ in results}

        if gold_ids.intersection(retrieved_ids):
            hits += 1

    return hits / len(in_corpus_cases)


async def evaluate_faithfulness(
    answer: str, retrieved_chunks: List[str]
) -> float:
    """Invokes LLM-as-judge to verify if the answer is faithful to the context chunks.

    Returns 1.0 (faithful) or 0.0 (unfaithful).
    """
    rubric_path = "eval/rubrics/faithfulness.md"
    if not os.path.exists(rubric_path):
        logger.warning(f"Rubric file {rubric_path} not found. Defaulting to 1.0.")
        return 1.0

    with open(rubric_path, "r", encoding="utf-8") as f:
        rubric_content = f.read()

    context_str = ""
    for idx, text in enumerate(retrieved_chunks, 1):
        context_str += f"Context [{idx}]:\n{text}\n\n"

    system_prompt = (
        f"{rubric_content}\n\n"
        f"--- PROVIDED CONTEXTS ---\n"
        f"{context_str}\n"
        f"--- END OF CONTEXTS ---"
    )

    messages = [
        {
            "role": "user",
            "content": f"Please evaluate the faithfulness of this Answer:\n\n{answer}",
        }
    ]

    llm_client = get_llm_client()
    try:
        response = await llm_client.generate_response(
            system_prompt, messages, temperature=0.0
        )
        content = response["content"]

        # Parse JSON block from response
        match = re.search(r"({.*})", content, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            return float(data.get("score", 0.0))
        return 0.0
    except Exception as e:
        logger.error(f"Faithfulness evaluation judge failed: {str(e)}")
        return 0.0


async def main() -> None:
    # 1. Load golden cases
    cases_data = await load_golden_set()

    async with AsyncSessionLocal() as db:
        # 2. Sync cases with database
        synced_cases = await sync_eval_cases(db, cases_data)

        logger.info("Starting retrieval evaluation...")

        # 3. Evaluate FTS recall
        fts_recall = await evaluate_strategy(db, synced_cases, "fts")
        logger.info("FTS Recall@5: %.4f", fts_recall)

        # 4. Evaluate Vector recall
        vector_recall = await evaluate_strategy(db, synced_cases, "vector")
        logger.info("Vector Recall@5: %.4f", vector_recall)

        # 5. Evaluate Hybrid Q&A (Recall@5, Citation Precision, and Faithfulness)
        logger.info("Starting Grounded Q&A Evaluation...")

        total_latency_ms = 0.0
        hybrid_hits = 0
        citation_precisions = []
        faithfulness_scores = []
        total_sentences = 0
        supported_sentences = 0

        # We evaluate QA metrics for all cases (faithfulness applies to out-of-corpus as well!)
        for case in synced_cases:
            question = case["question"]
            gold_ids = set(case["gold_chunk_ids"])

            # Start timer & run full chat generation pipeline
            start_time = time.perf_counter()
            chat_res = await get_grounded_answer(db, question)
            latency = (time.perf_counter() - start_time) * 1000.0
            total_latency_ms += latency

            answer = chat_res["answer"]
            citations = chat_res["citations"]

            # A. Compute hybrid recall (if in-corpus)
            if gold_ids:
                # Citations only cover what the assistant chose to cite, which is a
                # subset of what was retrieved. Recall must be measured against the
                # full retrieved set, so read it back from the QA log written above.
                qa_log_id = chat_res["id"]
                qa_log = await db.get(QALog, qa_log_id)
                ret_chunk_ids = set(qa_log.retrieved_chunk_ids or []) if qa_log else set()

                if gold_ids.intersection(ret_chunk_ids):
                    hybrid_hits += 1

            # B. Compute Citation Precision
            cited_chunk_ids = {cit["chunk_id"] for cit in citations}
            if not cited_chunk_ids:
                # If cited nothing, it's correct only if there were no gold chunk ids
                precision = 1.0 if not gold_ids else 0.0
            else:
                precision = len(cited_chunk_ids.intersection(gold_ids)) / len(cited_chunk_ids)
            citation_precisions.append(precision)

            # C. Compute Faithfulness (LLM-as-judge)
            # Retrieve text of cited chunks to pass to judge
            cited_texts = []
            for cit in citations:
                # Retrieve from database
                chunk_id = cit["chunk_id"]
                chunk_obj = await db.get(Chunk, chunk_id)
                if chunk_obj:
                    cited_texts.append(chunk_obj.text)

            faith = await evaluate_faithfulness(answer, cited_texts)
            faithfulness_scores.append(faith)

            # D. Parse Groundedness Rate
            for s in chat_res.get("sentences", []):
                total_sentences += 1
                g_status = s.get("groundedness", {}).get("status", "supported")
                if g_status == "supported":
                    supported_sentences += 1

        in_corpus_count = sum(1 for c in synced_cases if c["gold_chunk_ids"])
        hybrid_recall = hybrid_hits / in_corpus_count if in_corpus_count > 0 else 0.0
        avg_precision = sum(citation_precisions) / len(synced_cases) if synced_cases else 0.0
        avg_faithfulness = sum(faithfulness_scores) / len(synced_cases) if synced_cases else 0.0
        avg_groundedness = (
            supported_sentences / total_sentences if total_sentences > 0 else 1.0
        )
        avg_latency = total_latency_ms / len(synced_cases) if synced_cases else 0.0

        logger.info(
            "Hybrid Recall@5: %.4f, Citation Precision: %.4f, "
            "Faithfulness: %.4f, Groundedness Rate: %.4f (Avg Latency: %.2f ms)",
            hybrid_recall,
            avg_precision,
            avg_faithfulness,
            avg_groundedness,
            avg_latency,
        )

        # 6. Log evaluation run to DB
        git_sha = get_git_sha()
        run_record = EvalRun(
            git_sha=git_sha,
            ts=datetime.utcnow(),
            recall_at_5=hybrid_recall,
            vector_recall=vector_recall,
            fts_recall=fts_recall,
            hybrid_recall=hybrid_recall,
            citation_precision=avg_precision,
            faithfulness=avg_faithfulness,
            groundedness_rate=avg_groundedness,
            avg_latency_ms=avg_latency,
            notes="Groundedness verification evaluation run",
        )
        db.add(run_record)
        await db.commit()
        logger.info("Saved evaluation run to DB.")

        # 7. Append result row to EVALS.md
        evals_file_path = "EVALS.md"
        exists = os.path.exists(evals_file_path)

        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        row_str = (
            f"| {date_str} | `{git_sha[:7]}` | {vector_recall:.4f} | "
            f"{fts_recall:.4f} | {hybrid_recall:.4f} | {avg_precision:.4f} | "
            f"{avg_faithfulness:.4f} | {avg_groundedness:.4f} | {avg_latency:.2f}ms | "
            f"Groundedness verification run |\n"
        )

        if not exists:
            header = (
                "# Sahayak Evaluation History\n\n"
                "| Date | Git SHA | Vector Recall@5 | FTS Recall@5 | "
                "Hybrid Recall@5 | Citation Precision | Faithfulness | Groundedness Rate | Avg Latency | Notes |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
            )
            with open(evals_file_path, "w", encoding="utf-8") as f:
                f.write(header + row_str)
        else:
            with open(evals_file_path, "a", encoding="utf-8") as f:
                f.write(row_str)

        logger.info("Appended evaluation metrics to EVALS.md")


if __name__ == "__main__":
    asyncio.run(main())
