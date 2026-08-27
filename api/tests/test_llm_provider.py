"""Provider selection for chat and embeddings.

The selection is load-bearing: falling through to the mocks silently is exactly
how fabricated answers and meaningless eval numbers got shipped before.
"""

import os
from typing import Iterator
from unittest.mock import patch

import pytest

from api.config import Settings


@pytest.fixture
def clean_env() -> Iterator[None]:
    saved = os.environ.get("GEMINI_API_KEY")
    os.environ.pop("GEMINI_API_KEY", None)
    yield
    if saved is None:
        os.environ.pop("GEMINI_API_KEY", None)
    else:
        os.environ["GEMINI_API_KEY"] = saved


# --- Chat client selection ---


def test_gemini_key_selects_gemini_client() -> None:
    from api.llm.client import GeminiClient, get_llm_client

    with patch("api.config.settings.GEMINI_API_KEY", "AIza-real-looking-key"):
        assert isinstance(get_llm_client(), GeminiClient)


def test_placeholder_key_does_not_count_as_configured() -> None:
    from api.llm.client import MockLLMClient, get_llm_client

    with patch("api.config.settings.GEMINI_API_KEY", "your-gemini-api-key-here"):
        assert isinstance(get_llm_client(), MockLLMClient)


def test_blank_key_falls_back_to_mock() -> None:
    from api.llm.client import MockLLMClient, get_llm_client

    with patch("api.config.settings.GEMINI_API_KEY", "   "):
        assert isinstance(get_llm_client(), MockLLMClient)


def test_chat_model_default_is_available_to_new_keys() -> None:
    """gemini-2.5-* is retired for new API keys and 404s; the default must not be one."""
    assert "2.5" not in Settings().GEMINI_CHAT_MODEL


# --- Embedder selection ---


def test_embedder_prefers_gemini(clean_env: None) -> None:
    from ingest.embedder import GeminiEmbedder, get_embedder

    os.environ["GEMINI_API_KEY"] = "AIza-real-looking-key"
    assert isinstance(get_embedder(), GeminiEmbedder)


def test_embedder_falls_back_to_mock_without_key(clean_env: None) -> None:
    from ingest.embedder import MockEmbedder, get_embedder

    assert isinstance(get_embedder(), MockEmbedder)


def test_embedder_dimension_matches_pgvector_column(clean_env: None) -> None:
    """The chunks.embedding column is Vector(1024); a mismatch corrupts search."""
    from ingest.embedder import GeminiEmbedder

    os.environ["GEMINI_API_KEY"] = "AIza-real-looking-key"
    assert GeminiEmbedder().dimension == 1024


def test_embedder_rejects_wrong_width_vector(clean_env: None) -> None:
    """A short vector must raise rather than silently corrupt the index."""
    from ingest.embedder import GeminiEmbedder

    os.environ["GEMINI_API_KEY"] = "AIza-real-looking-key"
    e = GeminiEmbedder()

    class _Emb:
        values = [0.0] * 512

    class _Res:
        embeddings = [_Emb()]

    with patch.object(e.client.models, "embed_content", return_value=_Res()):
        with pytest.raises(ValueError, match="512"):
            e.embed_text("anything")


# --- Cost attribution ---


def test_cost_uses_gemini_pricing() -> None:
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

    with patch("api.config.settings.GEMINI_API_KEY", ""):
        assert active_llm_provider() == "mock"
