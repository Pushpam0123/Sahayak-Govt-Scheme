"""Provider selection for chat and embeddings.

The selection order is load-bearing: falling through to the mocks silently is
exactly how fabricated answers and meaningless eval numbers got shipped before.
"""

import os
from typing import Iterator
from unittest.mock import patch

import pytest

from api.config import Settings


@pytest.fixture
def clean_env() -> Iterator[None]:
    keys = ("GEMINI_API_KEY", "ANTHROPIC_API_KEY", "VOYAGE_API_KEY")
    saved = {k: os.environ.get(k) for k in keys}
    for k in keys:
        os.environ.pop(k, None)
    yield
    for k, v in saved.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v


# --- Chat client selection ---


def test_gemini_key_selects_gemini_client() -> None:
    from api.llm.client import GeminiClient, get_llm_client

    with patch("api.config.settings.GEMINI_API_KEY", "AIza-real-looking-key"):
        client = get_llm_client()
    assert isinstance(client, GeminiClient)


def test_anthropic_used_when_no_gemini_key() -> None:
    from api.llm.client import ClaudeClient, get_llm_client

    with (
        patch("api.config.settings.GEMINI_API_KEY", ""),
        patch("api.config.settings.ANTHROPIC_API_KEY", "sk-ant-real-looking-key"),
    ):
        client = get_llm_client()
    assert isinstance(client, ClaudeClient)


def test_gemini_takes_priority_over_anthropic() -> None:
    from api.llm.client import GeminiClient, get_llm_client

    with (
        patch("api.config.settings.GEMINI_API_KEY", "AIza-real-looking-key"),
        patch("api.config.settings.ANTHROPIC_API_KEY", "sk-ant-real-looking-key"),
    ):
        client = get_llm_client()
    assert isinstance(client, GeminiClient)


def test_placeholder_key_does_not_count_as_configured() -> None:
    from api.llm.client import MockClaudeClient, get_llm_client

    with (
        patch("api.config.settings.GEMINI_API_KEY", "your-gemini-api-key-here"),
        patch("api.config.settings.ANTHROPIC_API_KEY", ""),
    ):
        client = get_llm_client()
    assert isinstance(client, MockClaudeClient)


def test_no_key_falls_back_to_mock() -> None:
    from api.llm.client import MockClaudeClient, get_llm_client

    with (
        patch("api.config.settings.GEMINI_API_KEY", ""),
        patch("api.config.settings.ANTHROPIC_API_KEY", "   "),
    ):
        client = get_llm_client()
    assert isinstance(client, MockClaudeClient)


# --- Embedder selection ---


def test_embedder_prefers_gemini(clean_env: None) -> None:
    from ingest.embedder import GeminiEmbedder, get_embedder

    os.environ["GEMINI_API_KEY"] = "AIza-real-looking-key"
    os.environ["VOYAGE_API_KEY"] = "pa-real-looking-key"
    assert isinstance(get_embedder(), GeminiEmbedder)


def test_embedder_falls_back_to_mock_without_keys(clean_env: None) -> None:
    from ingest.embedder import MockEmbedder, get_embedder

    assert isinstance(get_embedder(), MockEmbedder)


def test_embedder_dimension_matches_pgvector_column(clean_env: None) -> None:
    """The chunks.embedding column is Vector(1024); a mismatch corrupts search."""
    from ingest.embedder import GeminiEmbedder

    os.environ["GEMINI_API_KEY"] = "AIza-real-looking-key"
    assert GeminiEmbedder().dimension == 1024


# --- Cost attribution ---


def test_cost_follows_the_active_provider() -> None:
    from api.config import (
        active_llm_provider,
        llm_input_cost_per_m,
        llm_output_cost_per_m,
    )

    defaults = Settings()
    with patch("api.config.settings.GEMINI_API_KEY", "AIza-real-looking-key"):
        assert active_llm_provider() == "gemini"
        assert llm_input_cost_per_m() == defaults.GEMINI_INPUT_COST_PER_M
        assert llm_output_cost_per_m() == defaults.GEMINI_OUTPUT_COST_PER_M

    with (
        patch("api.config.settings.GEMINI_API_KEY", ""),
        patch("api.config.settings.ANTHROPIC_API_KEY", "sk-ant-real-looking-key"),
    ):
        assert active_llm_provider() == "anthropic"
        assert llm_input_cost_per_m() == defaults.ANTHROPIC_INPUT_COST_PER_M
