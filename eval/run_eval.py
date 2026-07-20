import asyncio
import logging
import os
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
from api.models.eval import EvalCase, EvalRun
from api.models.scheme import Chunk, Document
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


async def resolve_gold_chunk_ids(db: Any, scheme_id: str, quote: str) -> List[int]:
    """Resolves a verbatim quote in a scheme to its database chunk IDs."""
    if not scheme_id or not quote:
        return []

    stmt = (
        select(Chunk.id)
        .join(Document)
        .where(Document.scheme_id == scheme_id)
        .where(Chunk.text.ilike(f"%{quote}%"))
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


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


async def main() -> None:
    # 1. Load golden cases
    cases_data = await load_golden_set()

    async with AsyncSessionLocal() as db:
        # 2. Sync cases with database
        synced_cases = await sync_eval_cases(db, cases_data)

        logger.info("Starting retrieval evaluation...")

        # 3. Evaluate FTS
        fts_recall = await evaluate_strategy(db, synced_cases, "fts")
        logger.info("FTS Recall@5: %.4f", fts_recall)

        # 4. Evaluate Vector
        vector_recall = await evaluate_strategy(db, synced_cases, "vector")
        logger.info("Vector Recall@5: %.4f", vector_recall)

        # 5. Evaluate Hybrid and measure latency
        in_corpus_cases = [c for c in synced_cases if c["gold_chunk_ids"]]

        hybrid_recall = 0.0
        total_latency_ms = 0.0
        hits = 0

        for case in in_corpus_cases:
            start_time = time.perf_counter()
            results = await hybrid_search(db, case["question"], limit=5)
            latency = (time.perf_counter() - start_time) * 1000.0
            total_latency_ms += latency

            retrieved_ids = {int(c.id) for c, _ in results}
            gold_ids = set(case["gold_chunk_ids"])
            if gold_ids.intersection(retrieved_ids):
                hits += 1

        if in_corpus_cases:
            hybrid_recall = hits / len(in_corpus_cases)
            avg_latency = total_latency_ms / len(in_corpus_cases)
        else:
            avg_latency = 0.0

        logger.info(
            "Hybrid Recall@5: %.4f (Average Latency: %.2f ms)",
            hybrid_recall,
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
            avg_latency_ms=avg_latency,
            notes="RRF hybrid retrieval evaluation run",
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
            f"{fts_recall:.4f} | {hybrid_recall:.4f} | {avg_latency:.2f}ms | "
            f"RRF hybrid retrieval run |\n"
        )

        if not exists:
            header = (
                "# Sahayak Evaluation History\n\n"
                "| Date | Git SHA | Vector Recall@5 | FTS Recall@5 | "
                "Hybrid Recall@5 | Avg Latency | Notes |\n"
                "| --- | --- | --- | --- | --- | --- | --- |\n"
            )
            with open(evals_file_path, "w", encoding="utf-8") as f:
                f.write(header + row_str)
        else:
            with open(evals_file_path, "a", encoding="utf-8") as f:
                f.write(row_str)

        logger.info("Appended evaluation metrics to EVALS.md")


if __name__ == "__main__":
    asyncio.run(main())
