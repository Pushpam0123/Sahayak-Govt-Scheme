import os
from unittest.mock import MagicMock, patch

import pytest

from ingest.fetcher import FetchResult, fetch_scheme_guidelines


@pytest.fixture(autouse=True)
def _isolated_raw_dir(tmp_path, monkeypatch) -> None:
    """Point RAW_DATA_DIR at a throwaway directory so tests never touch
    the real data/raw/ corpus or leak files between runs."""
    monkeypatch.setattr("ingest.fetcher.RAW_DATA_DIR", str(tmp_path))


def test_fetch_failed_when_unreachable_and_no_cache() -> None:
    with patch("ingest.fetcher.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.get.side_effect = Exception("Connection refused")
        mock_client_cls.return_value.__enter__.return_value = mock_client

        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.html")

    assert isinstance(result, FetchResult)
    assert result.status == "failed"
    assert result.file_path is None
    assert result.doc_type is None
    assert result.checksum is None
    assert result.content_sha256 is None
    assert result.fetched_at is None
    assert result.error is not None


def test_fetch_cached_when_network_fails_but_local_file_exists(tmp_path) -> None:
    scheme_id = "some-scheme"
    cached_path = os.path.join(str(tmp_path), f"{scheme_id}.html")
    with open(cached_path, "wb") as f:
        f.write(b"<html><body>Previously fetched guidelines</body></html>")

    with patch("ingest.fetcher.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.get.side_effect = Exception("Connection refused")
        mock_client_cls.return_value.__enter__.return_value = mock_client

        result = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/guidelines.html")

    assert result.status == "cached"
    assert result.file_path == cached_path
    assert result.checksum is not None
    assert result.content_sha256 is not None
    # Cached content is not a fresh live fetch.
    assert result.fetched_at is None


def test_fetch_success_returns_fetched_status(tmp_path) -> None:
    scheme_id = "some-scheme"
    content = b"<html><body>Real guidelines</body></html>"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = content

    with patch("ingest.fetcher.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__enter__.return_value = mock_client

        result = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/guidelines.html")

    assert result.status == "fetched"
    assert result.file_path == os.path.join(str(tmp_path), f"{scheme_id}.html")
    assert result.fetched_at is not None
    assert os.path.exists(result.file_path)
