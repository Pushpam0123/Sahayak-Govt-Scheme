from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.scheme import Chunk
from api.services.retrieval import (
    get_fts_search,
    get_vector_search,
    reciprocal_rank_fusion,
)
from api.services.translation import is_hindi


def test_is_hindi_detection() -> None:
    assert is_hindi("PM-KISAN eligibility") is False
    assert is_hindi("PM-KISAN पात्रता क्या है?") is True
    assert is_hindi("पात्रता") is True
    assert is_hindi("") is False


def test_rrf_disjoint_lists() -> None:
    # 2 disjoint lists of chunks
    vector_chunks = [
        Chunk(id=1, text="vector 1"),
        Chunk(id=2, text="vector 2"),
    ]
    fts_chunks = [
        Chunk(id=3, text="fts 1"),
        Chunk(id=4, text="fts 2"),
    ]

    # Merge disjoint lists
    merged = reciprocal_rank_fusion(vector_chunks, fts_chunks, k=60.0, limit=4)

    assert len(merged) == 4
    # Chunk 1 (rank 1 vector) score: 1 / (60 + 1) = 0.01639
    # Chunk 3 (rank 1 fts) score: 1 / (60 + 1) = 0.01639
    # Since they have identical scores, chunk 1 (id=1) must precede chunk 3 (id=3)
    assert merged[0][0].id == 1
    assert merged[1][0].id == 3
    assert merged[2][0].id == 2
    assert merged[3][0].id == 4

    assert merged[0][1] == pytest.approx(1.0 / 61.0)
    assert merged[1][1] == pytest.approx(1.0 / 61.0)
    assert merged[2][1] == pytest.approx(1.0 / 62.0)
    assert merged[3][1] == pytest.approx(1.0 / 62.0)


def test_rrf_overlapping_lists() -> None:
    # Overlapping chunks
    vector_chunks = [
        Chunk(id=1, text="overlap 1"),
        Chunk(id=2, text="vector only"),
    ]
    fts_chunks = [
        Chunk(id=3, text="fts only"),
        Chunk(id=1, text="overlap 1"),
    ]

    merged = reciprocal_rank_fusion(vector_chunks, fts_chunks, k=60.0, limit=3)

    assert len(merged) == 3
    # Chunk 1 is rank 1 in vector, rank 2 in FTS
    # Score for Chunk 1: 1/61 + 1/62 = 0.016393 + 0.016129 = 0.032522
    assert merged[0][0].id == 1
    assert merged[0][1] == pytest.approx(1.0 / 61.0 + 1.0 / 62.0)

    # Chunk 2 (rank 2 vector) and Chunk 3 (rank 1 FTS)
    # Chunk 3 score: 1/61 = 0.016393
    # Chunk 2 score: 1/62 = 0.016129
    assert merged[1][0].id == 3
    assert merged[2][0].id == 2


def test_rrf_ties_deterministic() -> None:
    # 4 chunks with identical scores (all rank 1 in disjoint setups)
    # List A contains chunk 2, List B contains chunk 1
    vector_chunks = [Chunk(id=2, text="chunk 2")]
    fts_chunks = [Chunk(id=1, text="chunk 1")]

    merged = reciprocal_rank_fusion(vector_chunks, fts_chunks, k=60.0, limit=2)

    # Both have score 1/61. Sort secondary by id asc, so chunk 1 first
    assert merged[0][0].id == 1
    assert merged[1][0].id == 2


def test_rrf_empty_lists() -> None:
    assert reciprocal_rank_fusion([], [], k=60.0) == []

    chunks = [Chunk(id=5, text="text")]
    merged = reciprocal_rank_fusion(chunks, [], k=60.0)
    assert len(merged) == 1
    assert merged[0][0].id == 5
    assert merged[0][1] == pytest.approx(1.0 / 61.0)


@pytest.mark.asyncio
async def test_get_vector_search_db_calls() -> None:
    mock_db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [Chunk(id=1, text="mocked vector chunk")]
    mock_db.execute.return_value = mock_result

    # Mock embedder output
    from unittest.mock import patch

    with patch("api.services.retrieval.get_embedder") as mock_get_embedder:
        mock_embedder = MagicMock()
        mock_embedder.embed_text.return_value = [0.1] * 1024
        mock_get_embedder.return_value = mock_embedder

        results = await get_vector_search(
            mock_db, "test query", state="Central", category="Agriculture"
        )
        assert len(results) == 1
        assert results[0].id == 1

        # Verify execute was called
        mock_db.execute.assert_called_once()
        stmt = mock_db.execute.call_args[0][0]
        # Verify sql compilation works
        compiled_sql = str(stmt)
        assert "state = :" in compiled_sql
        assert "category = :" in compiled_sql


@pytest.mark.asyncio
async def test_get_fts_search_db_calls() -> None:
    mock_db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [Chunk(id=2, text="mocked fts chunk")]
    mock_db.execute.return_value = mock_result

    results = await get_fts_search(mock_db, "test query", state="Central")
    assert len(results) == 1
    assert results[0].id == 2

    # Verify execute was called
    mock_db.execute.assert_called_once()
    stmt = mock_db.execute.call_args[0][0]
    compiled_sql = str(stmt)
    assert "websearch_to_tsquery" in compiled_sql
    assert "state = :" in compiled_sql
