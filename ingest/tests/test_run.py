from datetime import datetime, timezone
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

    failed_result = FetchResult(
        status="failed", http_status=None, error="Connection refused"
    )

    with patch("ingest.run.fetch_scheme_guidelines", return_value=failed_result):
        await ingest_scheme(mock_db, SCHEME_DATA)

    assert existing_scheme.status == "unverified"
    # No Document was created for the existing scheme either.
    added_objects = [call.args[0] for call in mock_db.add.call_args_list]
    assert not any(isinstance(obj, Document) for obj in added_objects)


@pytest.mark.asyncio
async def test_ingest_scheme_upgrades_verified_at_on_idempotent_checksum_match() -> (
    None
):
    """A document that was previously stored from a cached (unverified)
    fetch must be upgraded to verified once we confirm the identical bytes
    live - even though the checksum match means we skip re-chunking it."""
    mock_db = AsyncMock(spec=AsyncSession)

    existing_doc = Document(
        id=1,
        scheme_id="some-scheme",
        title="Some Scheme",
        source_url="https://example.gov.in/guidelines.html",
        doc_type="html",
        checksum="matching-checksum",
        fetch_status="cached",
        verified_at=None,
        content_sha256="old-sha256",
    )
    mock_doc_result = MagicMock()
    mock_doc_result.scalars().first.return_value = existing_doc
    mock_db.execute.return_value = mock_doc_result

    verified_time = datetime(2026, 8, 26, 12, 0, 0, tzinfo=timezone.utc)
    fetched_result = FetchResult(
        status="fetched",
        file_path="data/raw/some-scheme.html",
        doc_type="html",
        checksum="matching-checksum",
        content_sha256="new-sha256",
        http_status=200,
        fetched_at=verified_time,
    )

    with patch("ingest.run.fetch_scheme_guidelines", return_value=fetched_result):
        await ingest_scheme(mock_db, SCHEME_DATA, force=False)

    assert existing_doc.fetch_status == "fetched"
    # Document.verified_at is a naive DateTime column (not DateTime(timezone=True));
    # asyncpg rejects a tz-aware value outright, so ingest_scheme strips tzinfo
    # before assigning. The upgraded value is the same instant, naive.
    assert existing_doc.verified_at == verified_time.replace(tzinfo=None)
    assert existing_doc.content_sha256 == "new-sha256"
    # No new Document (or anything else) was created - this was an
    # in-place upgrade of the existing row.
    mock_db.add.assert_not_called()


@pytest.mark.asyncio
async def test_verified_at_never_downgraded_on_checksum_match() -> None:
    """A document verified at T1 must keep that verified_at (and its
    fetch_status) if a later run on the identical bytes only manages a
    cached fetch with no provenance (e.g. the sidecar was lost). The bytes
    are unchanged, so the earlier confirmation is still valid evidence -
    losing this run's sidecar must not retroactively make it uncitable."""
    mock_db = AsyncMock(spec=AsyncSession)

    verified_time = datetime(2026, 8, 20, 9, 0, 0, tzinfo=timezone.utc)
    existing_doc = Document(
        id=1,
        scheme_id="some-scheme",
        title="Some Scheme",
        source_url="https://example.gov.in/guidelines.html",
        doc_type="html",
        checksum="matching-checksum",
        fetch_status="fetched",
        verified_at=verified_time,
        content_sha256="matching-sha256",
    )
    mock_doc_result = MagicMock()
    mock_doc_result.scalars().first.return_value = existing_doc
    mock_db.execute.return_value = mock_doc_result

    # This run's fetch fell back to cache with no sidecar proof - fetched_at
    # is None even though the bytes (and thus the checksum) are identical.
    cached_no_sidecar_result = FetchResult(
        status="cached",
        file_path="data/raw/some-scheme.html",
        doc_type="html",
        checksum="matching-checksum",
        content_sha256="matching-sha256",
        http_status=None,
        error="Connection refused",
        fetched_at=None,
    )

    with patch(
        "ingest.run.fetch_scheme_guidelines", return_value=cached_no_sidecar_result
    ):
        await ingest_scheme(mock_db, SCHEME_DATA, force=False)

    # verified_at and fetch_status are untouched - not downgraded.
    assert existing_doc.verified_at == verified_time
    assert existing_doc.fetch_status == "fetched"
    mock_db.add.assert_not_called()
