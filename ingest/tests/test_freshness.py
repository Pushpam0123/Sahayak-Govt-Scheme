from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from api.models.scheme import Document
from ingest.freshness import check_scheme_freshness


@pytest.mark.asyncio
async def test_check_scheme_freshness_fresh():
    mock_db = AsyncMock()
    mock_doc = Document(
        scheme_id="pm-kisan",
        content_sha256="fakehash123",
    )
    mock_res = MagicMock()
    mock_res.scalars().first.return_value = mock_doc
    mock_db.execute.return_value = mock_res

    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b"sample pdf content bytes"
    mock_client.get.return_value = mock_response

    with patch("hashlib.sha256") as mock_sha:
        mock_sha.return_value.hexdigest.return_value = "fakehash123"
        result = await check_scheme_freshness(
            mock_db,
            {"id": "pm-kisan", "source_url": "https://pmkisan.gov.in/guidelines.pdf"},
            mock_client,
        )

    assert result["is_fresh"] is True
    assert result["status"] == "fresh_unchanged"
    assert result["http_status"] == 200


@pytest.mark.asyncio
async def test_check_scheme_freshness_broken():
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars().first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_client.get.return_value = mock_response

    result = await check_scheme_freshness(
        mock_db,
        {"id": "broken-scheme", "source_url": "https://broken.gov.in/404.pdf"},
        mock_client,
    )

    assert result["is_fresh"] is False
    assert result["status"] == "broken_http_error"
    assert result["http_status"] == 404
