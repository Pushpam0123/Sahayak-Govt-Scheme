import logging
import os
import re
import time
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.llm.client import get_llm_client
from api.models.chat import QALog
from api.models.scheme import Document, Scheme
from api.services.groundedness import verify_groundedness
from api.services.retrieval import hybrid_search
from api.services.translation import is_hindi, translate_hindi_to_english

logger = logging.getLogger("sahayak.api.services.chat")


def split_into_sentences(text: str) -> List[str]:
    """Splits a block of text into sentences, supporting English and Hindi.

    Handles inline citation marks like [1] or [2][3].
    """
    pattern = r"([^.!?।\n]+(?:[.!?।]+|\n+)?)"
    sentences = []
    for match in re.finditer(pattern, text):
        sentence = match.group(0).strip()
        if sentence:
            sentences.append(sentence)
    return sentences


def parse_citations_for_sentence(sentence_text: str, max_chunk_index: int) -> List[int]:
    """Extracts unique citation numbers from a sentence.

    Ensures they are within the index bounds (1 to max_chunk_index).
    Out-of-bounds citations are dropped and logged as warnings.
    """
    raw_citations = []
    for match in re.finditer(r"\[([0-9]+)\]", sentence_text):
        raw_citations.append(int(match.group(1)))

    valid_citations = []
    for num in sorted(list(set(raw_citations))):
        if 1 <= num <= max_chunk_index:
            valid_citations.append(num)
        else:
            logger.warning(
                f"Drop out-of-bounds citation [{num}] from sentence: '{sentence_text}'"
            )
    return valid_citations


async def get_grounded_answer(
    db: AsyncSession,
    query: str,
    state: Optional[str] = None,
    category: Optional[str] = None,
    scheme_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieves context chunks using hybrid retrieval, calls the grounded answer

    LLM, parses inline citations at sentence-level, and logs the Q&A run.
    """
    # 1. Translate Hindi query if needed
    is_query_hindi = is_hindi(query)
    processed_query = query
    translation_input_tokens = 0
    translation_output_tokens = 0

    if is_query_hindi:
        processed_query = await translate_hindi_to_english(query)
        translation_input_tokens = len(query.split()) + 30
        translation_output_tokens = len(processed_query.split()) + 20

    # 2. Retrieve top 5 context chunks using the processed (English) query
    chunks = await hybrid_search(
        db,
        processed_query,
        state=state,
        category=category,
        scheme_id=scheme_id,
        limit=5,
    )

    # 3. Format context for system prompt
    context_blocks = []
    for idx, (chunk, _) in enumerate(chunks, 1):
        context_blocks.append(
            f"Context [{idx}]:\n"
            f"Source: {chunk.heading_path or 'Root Document'}\n"
            f"Text: {chunk.text}"
        )
    context_str = "\n\n".join(context_blocks)

    # 4. Read prompt template
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(
        os.path.dirname(current_dir), "llm", "prompts", "answer.md"
    )

    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    # Append context to the system prompt
    full_system_prompt = (
        f"{system_prompt}\n\n"
        f"--- PROVIDED CONTEXTS ---\n"
        f"{context_str}\n"
        f"--- END OF CONTEXTS ---"
    )

    if is_query_hindi:
        full_system_prompt += (
            "\n\nIMPORTANT: The user has asked the question in Hindi. "
            "You MUST translate the facts from contexts and write your "
            "entire final response in Hindi (Devanagari script). "
            "Maintain all inline citation references like [1], [2], etc., "
            "correctly attached to your sentences."
        )

    # 5. Invoke LLM client
    llm_client = get_llm_client()
    messages = [{"role": "user", "content": query}]

    start_time = time.perf_counter()
    response = await llm_client.generate_response(
        full_system_prompt, messages, temperature=0.0
    )
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    raw_answer = response["content"]
    usage = response["usage"]

    # 6. Parse answer into cited sentences
    raw_sentences = split_into_sentences(raw_answer)
    parsed_sentences: List[Dict[str, Any]] = []
    unique_citation_nums = set()

    for s_text in raw_sentences:
        cits = parse_citations_for_sentence(s_text, len(chunks))
        parsed_sentences.append({"text": s_text, "citations": cits})
        for c in cits:
            unique_citation_nums.add(c)

    # 7. Gather citations metadata (Batch-fetched to eliminate N+1 queries)
    citations_metadata = []
    if unique_citation_nums:
        doc_ids = {
            chunks[n - 1][0].document_id
            for n in unique_citation_nums
            if 1 <= n <= len(chunks)
        }
        doc_scheme_map = {}
        if doc_ids:
            stmt = (
                select(Document, Scheme)
                .join(Scheme, Document.scheme_id == Scheme.id)
                .where(Document.id.in_(doc_ids))
            )
            res = await db.execute(stmt)
            for doc, scheme in res.all():
                doc_scheme_map[doc.id] = (doc, scheme)

        for n in sorted(list(unique_citation_nums)):
            if 1 <= n <= len(chunks):
                chunk, _ = chunks[n - 1]
                doc_scheme = doc_scheme_map.get(chunk.document_id)
                doc = doc_scheme[0] if doc_scheme else None
                scheme = doc_scheme[1] if doc_scheme else None
                citations_metadata.append(
                    {
                        "n": n,
                        "chunk_id": chunk.id,
                        "source_url": (
                            doc.source_url if doc and doc.source_url else (scheme.official_url if scheme else "")
                        ),
                        "heading_path": chunk.heading_path or (doc.title if doc else "Document"),
                        "quote": (
                            chunk.text[:150] + "..."
                            if len(chunk.text) > 150
                            else chunk.text
                        ),
                    }
                )

    # 8. Groundedness Verification Pass
    groundedness_usage: Dict[str, Any] = {}
    groundedness_results = await verify_groundedness(
        parsed_sentences, chunks, usage_collector=groundedness_usage
    )
    for idx, s in enumerate(parsed_sentences):
        g_res = groundedness_results[idx]
        s["groundedness"] = {
            "status": g_res["status"],
            "reasoning": g_res["reasoning"],
        }

    # 9. Cost Accounting Calculation using centralized settings
    chat_cost = (
        usage.get("input_tokens", 0) * (settings.ANTHROPIC_INPUT_COST_PER_M / 1_000_000.0)
    ) + (
        usage.get("output_tokens", 0) * (settings.ANTHROPIC_OUTPUT_COST_PER_M / 1_000_000.0)
    )
    groundedness_cost = (
        groundedness_usage.get("input_tokens", 0) * (settings.ANTHROPIC_INPUT_COST_PER_M / 1_000_000.0)
        + groundedness_usage.get("output_tokens", 0) * (settings.ANTHROPIC_OUTPUT_COST_PER_M / 1_000_000.0)
    )
    translation_cost = (
        translation_input_tokens * (settings.ANTHROPIC_INPUT_COST_PER_M / 1_000_000.0)
        + translation_output_tokens * (settings.ANTHROPIC_OUTPUT_COST_PER_M / 1_000_000.0)
    )

    total_cost = chat_cost + groundedness_cost + translation_cost

    total_tokens_in = (
        usage.get("input_tokens", 0)
        + groundedness_usage.get("input_tokens", 0)
        + translation_input_tokens
    )
    total_tokens_out = (
        usage.get("output_tokens", 0)
        + groundedness_usage.get("output_tokens", 0)
        + translation_output_tokens
    )

    # 10. Log Q&A to database
    qa_log = QALog(
        session_id=session_id,
        question=query,
        lang="hi" if is_query_hindi else "en",
        retrieved_chunk_ids=[chunk.id for chunk, _ in chunks],
        answer=raw_answer,
        citations_json=citations_metadata,
        groundedness_json=groundedness_results,
        latency_ms=latency_ms,
        tokens_in=total_tokens_in,
        tokens_out=total_tokens_out,
        estimated_cost_usd=total_cost,
    )
    db.add(qa_log)
    await db.commit()
    await db.refresh(qa_log)

    return {
        "id": qa_log.id,
        "answer": raw_answer,
        "sentences": parsed_sentences,
        "citations": citations_metadata,
        "usage": {
            "input_tokens": total_tokens_in,
            "output_tokens": total_tokens_out,
        },
        "latency_ms": latency_ms,
    }
