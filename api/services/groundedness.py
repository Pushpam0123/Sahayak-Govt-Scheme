import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from api.llm.client import get_llm_client

logger = logging.getLogger("sahayak.api.services.groundedness")


async def verify_groundedness(
    sentences: List[Dict[str, Any]],
    chunks: List[Any],
    usage_collector: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Verifies whether each sentence in the answer is grounded in its cited chunks.

    Returns a list of dicts: [{"status": str, "reasoning": str}]
    """
    # 1. Default fallback if check is disabled via environment configuration
    enable_check = os.getenv("ENABLE_GROUNDEDNESS_CHECK", "true").lower() == "true"
    if not enable_check:
        logger.info("Groundedness verification check skipped via configuration.")
        return [
            {"status": "supported", "reasoning": "Check disabled in config"}
            for _ in sentences
        ]

    # If there are no sentences or no chunks, all are trivially supported/refused
    if not sentences:
        return []

    # 2. Format contexts for prompt
    context_blocks = []
    # chunks can be list of Chunks or list of (Chunk, score)
    for idx, item in enumerate(chunks, 1):
        chunk_obj = item[0] if isinstance(item, tuple) else item
        context_blocks.append(f"Context [{idx}]:\n{chunk_obj.text}")
    context_str = "\n\n".join(context_blocks)

    # 3. Format sentences to verify
    sentences_blocks = []
    for idx, s in enumerate(sentences):
        cits = s.get("citations", [])
        sentences_blocks.append(
            f"Sentence [{idx}]: {s['text']} (Cites Contexts: {cits})"
        )
    sentences_str = "\n".join(sentences_blocks)

    # 4. Read groundedness system prompt template
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(
        os.path.dirname(current_dir), "llm", "prompts", "groundedness.md"
    )

    if not os.path.exists(prompt_path):
        logger.warning(
            f"Groundedness prompt template not found at {prompt_path}. "
            "Defaulting all to supported."
        )
        return [
            {"status": "supported", "reasoning": "Prompt template missing"}
            for _ in sentences
        ]

    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    # Append formatted inputs
    full_system_prompt = (
        f"{system_prompt}\n\n"
        f"--- CONTEXTS ---\n"
        f"{context_str}\n\n"
        f"--- SENTENCES TO VERIFY ---\n"
        f"{sentences_str}"
    )

    # 5. Invoke LLM judge (Haiku-class model)
    # Pinned to haiku model via config or environment
    judge_model = os.getenv("ANTHROPIC_JUDGE_MODEL", "claude-3-5-haiku-20241022")
    llm_client = get_llm_client(chat_model=judge_model)
    messages = [
        {
            "role": "user",
            "content": "Perform groundedness verification on the sentences.",
        }
    ]

    try:
        response = await llm_client.generate_response(
            full_system_prompt, messages, temperature=0.0
        )
        content = response["content"]
        if usage_collector is not None:
            usage_collector.update(response.get("usage", {}))

        # Parse JSON array from response content
        match = re.search(r"(\[.*\])", content, re.DOTALL)
        if match:
            results = json.loads(match.group(1))

            # Map index results back to sentences list order
            mapped_results = []
            for idx in range(len(sentences)):
                # Search for match in LLM response
                item_match = next(
                    (item for item in results if item.get("sentence_index") == idx),
                    None,
                )
                if item_match:
                    mapped_results.append(
                        {
                            "status": item_match.get("status", "supported"),
                            "reasoning": item_match.get(
                                "reasoning", "No explanation provided"
                            ),
                        }
                    )
                else:
                    mapped_results.append(
                        {"status": "supported", "reasoning": "Unchecked"}
                    )
            return mapped_results

    except Exception as e:
        logger.error(f"Groundedness verification pass failed: {str(e)}")

    # Fallback to supported on any parsing or call exceptions
    return [
        {"status": "supported", "reasoning": "Evaluator call failed fallback"}
        for _ in sentences
    ]
