import logging
import os
import re
import time
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.llm.client import get_llm_client
from api.models.chat import QALog
from api.models.scheme import Document, Scheme
from api.services.retrieval import hybrid_search, is_hindi

logger = logging.getLogger("sahayak.api.services.chat")


def split_into_sentences(text: str) -> List[str]:
    """Splits a block of text into sentences, supporting English and Hindi.

    Handles inline citation marks like [1] or [2][3].
    """
    # Split on sentence boundaries (. ! ? । \n) while trying not to break up citations
    # e.g. sentence text [1]. sentence text [2]
    # We find segments ending with a boundary punctuation followed by
    # whitespace/newlines.
    pattern = r"([^.!?।\n]+(?:[.!?।]+|\n+)?)"
    sentences = []
    for match in re.finditer(pattern, text):
        sentence = match.group(0).strip()
        if sentence:
            sentences.append(sentence)
    return sentences


def parse_citations_for_sentence(
    sentence_text: str, max_chunk_index: int
) -> List[int]:
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
    # 1. Retrieve top 5 context chunks
    chunks = await hybrid_search(
        db, query, state=state, category=category, scheme_id=scheme_id, limit=5
    )

    # 2. Format context for system prompt
    context_blocks = []
    for idx, (chunk, _) in enumerate(chunks, 1):
        context_blocks.append(
            f"Context [{idx}]:\n"
            f"Source: {chunk.heading_path or 'Root Document'}\n"
            f"Text: {chunk.text}"
        )
    context_str = "\n\n".join(context_blocks)

    # 3. Read prompt template
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

    # 4. Invoke LLM client
    llm_client = get_llm_client()
    messages = [{"role": "user", "content": query}]

    start_time = time.perf_counter()
    response = await llm_client.generate_response(
        full_system_prompt, messages, temperature=0.0
    )
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    raw_answer = response["content"]
    usage = response["usage"]

    # 5. Parse answer into cited sentences
    raw_sentences = split_into_sentences(raw_answer)
    parsed_sentences = []
    unique_citation_nums = set()

    for s_text in raw_sentences:
        cits = parse_citations_for_sentence(s_text, len(chunks))
        parsed_sentences.append({"text": s_text, "citations": cits})
        for c in cits:
            unique_citation_nums.add(c)

    # 6. Gather citations metadata
    citations_metadata = []
    for n in sorted(list(unique_citation_nums)):
        chunk, _ = chunks[n - 1]

        # Fetch document and scheme details
        stmt = (
            select(Document, Scheme)
            .join(Scheme)
            .where(Document.id == chunk.document_id)
        )
        res = await db.execute(stmt)
        row = res.first()

        if row:
            doc, scheme = row
            citations_metadata.append(
                {
                    "n": n,
                    "chunk_id": chunk.id,
                    "source_url": doc.source_url or scheme.official_url or "",
                    "heading_path": chunk.heading_path or doc.title,
                    "quote": (
                        chunk.text[:150] + "..."
                        if len(chunk.text) > 150
                        else chunk.text
                    ),
                }
            )

    # 7. Log Q&A to database
    qa_log = QALog(
        session_id=session_id,
        question=query,
        lang="hi" if is_hindi(query) else "en",
        retrieved_chunk_ids=[chunk.id for chunk, _ in chunks],
        answer=raw_answer,
        citations_json=citations_metadata,
        groundedness_json=None,  # Set in Phase 4
        latency_ms=latency_ms,
        tokens_in=usage["input_tokens"],
        tokens_out=usage["output_tokens"],
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
            "input_tokens": usage["input_tokens"],
            "output_tokens": usage["output_tokens"],
        },
        "latency_ms": latency_ms,
    }
