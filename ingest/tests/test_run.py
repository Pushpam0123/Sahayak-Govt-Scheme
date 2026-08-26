from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.scheme import Document, Scheme
from ingest.fetcher import FetchResult
from ingest.run import ingest_scheme

SCHEME_DATA = {
    "id": "some-scheme",
    "name": "Some Scheme",
    "state": "Central",
    "category": "Welfare",
    "ministry": "Ministry of Testing",
    "official_url": "https://example.gov.in",
    "source_url": "https://example.gov.in/guidelines.html",
}


@pytest.mark.asyncio
async def test_ingest_scheme_creates_no_document_when_fetch_failed() -> None:
    mock_db = AsyncMock(spec=AsyncSession)

    # No existing Scheme row.
    mock_scheme_result = MagicMock()
    mock_scheme_result.scalars().first.return_value = None
    mock_db.execute.return_value = mock_scheme_result

    failed_result = FetchResult(
        status="failed",
        http_status=404,
        error="Unexpected HTTP status 404",
    )

    with patch("ingest.run.fetch_scheme_guidelines", return_value=failed_result):
        await ingest_scheme(mock_db, SCHEME_DATA)

    # A Scheme row is ensured, but no Document (and therefore no chunks)
    # were ever created or indexed.
    added_objects = [call.args[0] for call in mock_db.add.call_args_list]
    assert not any(isinstance(obj, Document) for obj in added_objects)

    scheme_objects = [obj for obj in added_objects if isinstance(obj, Scheme)]
    assert len(scheme_objects) == 1
    assert scheme_objects[0].status == "unverified"


@pytest.mark.asyncio
async def test_ingest_scheme_marks_existing_scheme_unverified_on_failed_fetch() -> None:
    mock_db = AsyncMock(spec=AsyncSession)

    existing_scheme = Scheme(id="some-scheme", name="Some Scheme", status="active")
    mock_scheme_result = MagicMock()
    mock_scheme_result.scalars().first.return_value = existing_scheme
    mock_db.execute.return_value = mock_scheme_result

    failed_result = FetchResult(status="failed", http_status=None, error="Connection refused")

    with patch("ingest.run.fetch_scheme_guidelines", return_value=failed_result):
        await ingest_scheme(mock_db, SCHEME_DATA)

    assert existing_scheme.status == "unverified"
    # No Document was created for the existing scheme either.
    added_objects = [call.args[0] for call in mock_db.add.call_args_list]
    assert not any(isinstance(obj, Document) for obj in added_objects)
