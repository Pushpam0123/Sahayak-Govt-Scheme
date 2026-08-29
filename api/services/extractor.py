import json
import logging
import os
import re
from typing import Any, Dict

from api.llm.client import get_llm_client

logger = logging.getLogger("sahayak.api.services.extractor")


async def extract_rules_from_chunk(chunk_text: str) -> Dict[str, Any]:
    """Uses LLM to extract structured eligibility rules from a document chunk.

    Returns a dictionary of constraints matching the rules schema.
    """
    # 1. Read prompt template
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(
        os.path.dirname(current_dir), "llm", "prompts", "extract_rules.txt"
    )

    default_rules = {
        "min_age": None,
        "max_age": None,
        "states": None,
        "genders": None,
        "castes": None,
        "max_income": None,
        "max_landholding_acres": None,
    }

    if not os.path.exists(prompt_path):
        logger.error(f"Rule extraction prompt not found at {prompt_path}")
        return default_rules

    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    # 2. Invoke LLM client
    llm_client = get_llm_client()
    messages = [
        {
            "role": "user",
            "content": f"Document chunk text:\n\n{chunk_text}",
        }
    ]

    try:
        response = await llm_client.generate_response(
            system_prompt, messages, temperature=0.0
        )
        content = response["content"]

        # Parse JSON block
        match = re.search(r"({.*})", content, re.DOTALL)
        if match:
            extracted = json.loads(match.group(1))
            # Merge with default schema to guarantee all keys exist
            merged = {**default_rules}
            for k in default_rules.keys():
                if k in extracted:
                    merged[k] = extracted[k]
            return merged

    except Exception as e:
        logger.error(f"Failed to extract rules from chunk: {str(e)}")

    return default_rules
