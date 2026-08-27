import asyncio
import json
import logging
import os
import re
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any, Dict, List, Optional

import yaml

from api.config import settings

logger = logging.getLogger("sahayak.api.llm")


class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        """Generates a response from the LLM.

        Returns a dictionary containing:
        - "content": the text response
        - "usage": {"input_tokens": int, "output_tokens": int}
        """
        pass

    @abstractmethod
    def stream_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> AsyncGenerator[str, None]:
        """Stream text chunks from the LLM.

        Declared as a plain ``def`` returning an ``AsyncGenerator``: calling an
        ``async def`` function that yields returns the generator directly rather
        than a coroutine, so this is the signature implementations satisfy.
        Declaring it ``async def`` here instead made the supertype a coroutine
        and broke ``async for`` at every call site under type checking.
        """
        ...


class GeminiClient(BaseLLMClient):
    """Google Gemini implementation of the chat interface.

    Two details of Gemini's wire format are translated here so the rest of the
    application keeps speaking one message format: the assistant role is called
    "model", and the system prompt is a field on the request config rather than
    a message in the conversation.
    """

    def __init__(self, api_key: str, chat_model: Optional[str] = None):
        from google import genai

        self.client = genai.Client(api_key=api_key)
        self.model: str = (
            chat_model
            or os.getenv("GEMINI_CHAT_MODEL")
            or settings.GEMINI_CHAT_MODEL
            or "gemini-3.6-flash"
        )
        logger.info(f"Initialized GeminiClient using model '{self.model}'")

    @staticmethod
    def _to_contents(messages: List[Dict[str, str]]) -> List[Any]:
        """Translate our role vocabulary into Gemini's typed Content objects."""
        from google.genai import types

        contents: List[Any] = []
        for m in messages:
            role = "model" if m["role"] == "assistant" else "user"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=m["content"])])
            )
        return contents

    def _config(self, system_prompt: str, temperature: float) -> Any:
        from google.genai import types

        # Gemini 3.x reasons before answering, and those thinking tokens are drawn
        # from max_output_tokens. A 1024 budget can be consumed entirely by
        # thinking, returning an empty or truncated answer, so the default here is
        # deliberately generous.
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=int(os.getenv("GEMINI_MAX_TOKENS", "4096")),
        )

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        contents = self._to_contents(messages)
        config = self._config(system_prompt, temperature)

        for attempt in range(3):
            try:
                response = await self.client.aio.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )
                usage = getattr(response, "usage_metadata", None)
                # Thinking tokens are billed as output but reported separately.
                # Counting only candidates_token_count understates the cost of a
                # reasoning model by roughly the size of its reasoning.
                candidates = getattr(usage, "candidates_token_count", 0) or 0
                thoughts = getattr(usage, "thoughts_token_count", 0) or 0
                return {
                    "content": response.text or "",
                    "usage": {
                        "input_tokens": getattr(usage, "prompt_token_count", 0) or 0,
                        "output_tokens": candidates + thoughts,
                    },
                }
            except Exception as e:
                logger.warning(f"Gemini call attempt {attempt + 1} failed: {str(e)}")
                if attempt == 2:
                    raise e
                await asyncio.sleep(2**attempt)
        raise RuntimeError("Gemini call failed after retries")

    async def stream_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> AsyncGenerator[str, None]:
        contents = self._to_contents(messages)
        config = self._config(system_prompt, temperature)

        stream = await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=config,
        )
        async for chunk in stream:
            text = getattr(chunk, "text", None)
            if text:
                yield text


class MockLLMClient(BaseLLMClient):
    def __init__(self) -> None:
        self.model = "mock-llm"
        logger.info("Initialized MockLLMClient")

        # Load golden set for matching
        self.golden_cases: Dict[str, Dict[str, Any]] = {}
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.dirname(os.path.dirname(current_dir))
            yaml_path = os.path.join(root_dir, "eval", "golden", "golden_set.yaml")
            if os.path.exists(yaml_path):
                with open(yaml_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    cases = data.get("cases", [])
                    for case in cases:
                        q = case.get("question", "")
                        self.golden_cases[self._normalize(q)] = case
                logger.info(
                    f"Loaded {len(self.golden_cases)} cases into MockLLMClient."
                )
        except Exception as e:
            logger.error(f"Failed to load golden set in MockLLMClient: {str(e)}")

    def _normalize(self, text: str) -> str:
        return "".join(c for c in text.lower() if c.isalnum())

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> Dict[str, Any]:

        # Check if this is a translation call
        is_translate_call = (
            "translate" in system_prompt.lower() and "english" in system_prompt.lower()
        )
        if is_translate_call:
            user_msg = messages[0]["content"] if messages else ""
            clean_q = user_msg.replace("Document chunk text:\n\n", "").strip()
            clean_q = clean_q.split("\n")[0].strip()
            from api.services.translation import HINDI_TO_ENGLISH

            translated = HINDI_TO_ENGLISH.get(clean_q, clean_q)
            return {
                "content": translated,
                "usage": {"input_tokens": 100, "output_tokens": 20},
            }

        # Check if this is a rules extraction prompt
        is_extract = (
            "rules extraction" in system_prompt.lower()
            or "min_age" in system_prompt.lower()
        )
        if is_extract:
            # Combine messages text
            combined_msg = "\n".join(m["content"] for m in messages)
            if "kisan" in combined_msg.lower():
                rules = {
                    "min_age": 18,
                    "max_age": None,
                    "states": ["Any"],
                    "genders": ["Any"],
                    "castes": ["Any"],
                    "max_income": None,
                    "max_landholding_acres": 5.0,
                }
            elif "ladli" in combined_msg.lower() or "behna" in combined_msg.lower():
                rules = {
                    "min_age": 21,
                    "max_age": 60,
                    "states": ["Madhya Pradesh"],
                    "genders": ["Female"],
                    "castes": ["Any"],
                    "max_income": 250000.0,
                    "max_landholding_acres": 5.0,
                }
            else:
                rules = {
                    "min_age": None,
                    "max_age": None,
                    "states": ["Any"],
                    "genders": ["Any"],
                    "castes": ["Any"],
                    "max_income": None,
                    "max_landholding_acres": None,
                }
            return {
                "content": json.dumps(rules),
                "usage": {"input_tokens": 400, "output_tokens": 80},
            }

        # Check if this is a groundedness evaluator prompt
        is_grounded_check = (
            "groundedness evaluator" in system_prompt.lower()
            or "sentences to verify" in system_prompt.lower()
        )
        if is_grounded_check:
            results = []
            pattern = (
                r"Sentence \[([0-9]+)\]:\s*(.*?)"
                r"(?=\s*\(Cites|\n|Sentence \[[0-9]+\]:|$)"
            )
            sentences_matches = re.findall(pattern, system_prompt)
            for idx_str, text in sentences_matches:
                idx = int(idx_str)
                is_bad = (
                    "deliberately bad citation" in text.lower()
                    or "unsupported claim" in text.lower()
                )
                status = "unsupported" if is_bad else "supported"
                reasoning = (
                    "Seeded bad citation regression match."
                    if is_bad
                    else "Grounded fully in context."
                )
                results.append(
                    {"sentence_index": idx, "status": status, "reasoning": reasoning}
                )

            content = json.dumps(results)
            return {
                "content": content,
                "usage": {"input_tokens": 600, "output_tokens": 100},
            }

        is_judge = (
            "expert evaluator" in system_prompt.lower()
            or "faithfulness" in system_prompt.lower()
        )
        if is_judge:
            content = '{"score": 1.0, "reasoning": "Grounded fully in the context."}'
            return {
                "content": content,
                "usage": {"input_tokens": 500, "output_tokens": 50},
            }

        user_query = ""
        for m in messages:
            if m["role"] == "user":
                user_query = m["content"]
                break

        normalized_query = self._normalize(user_query)
        refusal_msg = (
            "I don't have this information in the official documents I've indexed."
        )

        # 1. Match against golden set cases
        if normalized_query in self.golden_cases:
            case = self.golden_cases[normalized_query]
            if case.get("category") == "out_of_corpus":
                content = refusal_msg
            else:
                gold_ans = case.get("gold_answer", "Eligible under general rules.")
                content = f"{gold_ans} [1]"
        else:
            # 2. Try to parse dynamic context chunks from the input prompt or messages
            combined_input = (
                system_prompt + "\n" + "\n".join(m["content"] for m in messages)
            )

            # Find context block 1
            pattern = r"Context \[1\]:\n(?:Source:[^\n]*\n)?Text:\s*(.*?)(?=\n\n|\Z)"
            match = re.search(pattern, combined_input, re.DOTALL | re.IGNORECASE)
            if match:
                context_text = match.group(1).strip()
                lines = [
                    line.strip() for line in context_text.split("\n") if line.strip()
                ]
                clean_lines = [
                    line
                    for line in lines
                    if not line.startswith("|") and not line.startswith("#")
                ]

                snippet = clean_lines[0] if clean_lines else lines[0]
                if len(snippet) > 150:
                    snippet = snippet[:150] + "..."
                content = f"Based on the official guidelines, {snippet} [1]."
            else:
                content = refusal_msg

        input_tokens = len(user_query.split()) + 300
        output_tokens = len(content.split()) + 20

        return {
            "content": content,
            "usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
            },
        }

    async def stream_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
    ) -> AsyncGenerator[str, None]:
        res = await self.generate_response(system_prompt, messages, temperature)
        full_text = res["content"]
        tokens = full_text.split(" ")
        for i, token in enumerate(tokens):
            space = " " if i < len(tokens) - 1 else ""
            yield token + space
            await asyncio.sleep(0.005)


def _is_usable_key(value: str, placeholder_fragment: str) -> bool:
    """A key is usable only if it is non-empty and not the .env.example placeholder."""
    if not value or not value.strip():
        return False
    return placeholder_fragment not in value.lower()


def get_llm_client(chat_model: Optional[str] = None) -> BaseLLMClient:
    """Return the Gemini client, or the mock when no key is configured.

    The mock returns golden-set answers verbatim and always self-reports perfect
    faithfulness, so falling back to it is logged loudly: any metric produced
    while it is active is meaningless. See EVALS.md.
    """
    from api.config import settings

    key = settings.GEMINI_API_KEY
    if _is_usable_key(key, "your-gemini-api-key"):
        return GeminiClient(key, chat_model or settings.GEMINI_CHAT_MODEL)

    logger.warning(
        "GEMINI_API_KEY is not configured. Falling back to MockLLMClient: "
        "generated answers are FABRICATED and must not be treated as real output."
    )
    return MockLLMClient()
