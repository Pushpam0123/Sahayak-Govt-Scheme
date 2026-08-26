import os
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import pytest

from ingest.fetcher import MIN_HTML_BYTES, MIN_PDF_BYTES, FetchResult, fetch_scheme_guidelines

VALID_HTML_CONTENT = b"<html><body>" + b"Real guidelines content. " * 100 + b"</body></html>"
VALID_PDF_CONTENT = b"%PDF-1.4\n" + b"0" * MIN_PDF_BYTES


def _mock_response(status_code: int, content: bytes, content_type: str = "text/html; charset=utf-8"):
    response = MagicMock()
    response.status_code = status_code
    response.content = content
    response.headers = {"content-type": content_type}
    return response


@pytest.fixture(autouse=True)
def _isolated_raw_dir(tmp_path, monkeypatch) -> None:
    """Point RAW_DATA_DIR at a throwaway directory so tests never touch
    the real data/raw/ corpus or leak files between runs."""
    monkeypatch.setattr("ingest.fetcher.RAW_DATA_DIR", str(tmp_path))


@contextmanager
def _patched_client(response=None, side_effect=None):
    mock_client = MagicMock()
    if side_effect is not None:
        mock_client.get.side_effect = side_effect
    else:
        mock_client.get.return_value = response

    with patch("ingest.fetcher.httpx.Client") as mock_client_cls:
        mock_client_cls.return_value.__enter__.return_value = mock_client
        yield mock_client_cls


def test_fetch_failed_when_unreachable_and_no_cache() -> None:
    with _patched_client(side_effect=Exception("Connection refused")):
        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.html")

    assert isinstance(result, FetchResult)
    assert result.status == "failed"
    assert result.file_path is None
    assert result.doc_type is None
    assert result.checksum is None
    assert result.content_sha256 is None
    assert result.fetched_at is None
    assert result.error is not None


def test_fetch_cached_when_network_fails_but_local_file_exists_no_sidecar(tmp_path) -> None:
    scheme_id = "some-scheme"
    cached_path = os.path.join(str(tmp_path), f"{scheme_id}.html")
    with open(cached_path, "wb") as f:
        f.write(b"<html><body>Previously fetched guidelines</body></html>")

    with _patched_client(side_effect=Exception("Connection refused")):
        result = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/guidelines.html")

    assert result.status == "cached"
    assert result.file_path == cached_path
    assert result.checksum is not None
    assert result.content_sha256 is not None
    # No sidecar proving this file's provenance -> not verified -> not citable.
    assert result.fetched_at is None


def test_fetch_success_returns_fetched_status(tmp_path) -> None:
    scheme_id = "some-scheme"

    with _patched_client(response=_mock_response(200, VALID_HTML_CONTENT)):
        result = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/guidelines.html")

    assert result.status == "fetched"
    assert result.file_path == os.path.join(str(tmp_path), f"{scheme_id}.html")
    assert result.fetched_at is not None
    assert os.path.exists(result.file_path)
    # A provenance sidecar must exist alongside the content.
    assert os.path.exists(f"{result.file_path}.meta.json")


def test_regression_cache_fallback_after_flaky_network_stays_citable(tmp_path) -> None:
    """The critical regression: ingest once with a working network (the
    document becomes citable), then ingest again on a flaky connection.
    The document must STILL be citable via the cache, because the cached
    bytes are provably the same ones that were verified moments before -
    not silently downgraded to unverified."""
    scheme_id = "some-scheme"
    source_url = "https://example.gov.in/guidelines.html"

    with _patched_client(response=_mock_response(200, VALID_HTML_CONTENT)):
        first = fetch_scheme_guidelines(scheme_id, source_url)
    assert first.status == "fetched"
    assert first.fetched_at is not None

    with _patched_client(side_effect=Exception("Connection refused")):
        second = fetch_scheme_guidelines(scheme_id, source_url)

    assert second.status == "cached"
    # The trap: this must NOT be None. The sidecar proves the cached bytes
    # were verified against this exact source_url on the first run.
    assert second.fetched_at is not None
    assert second.fetched_at == first.fetched_at
    assert second.content_sha256 == first.content_sha256


def test_cached_fallback_with_mismatched_source_url_is_not_verified(tmp_path) -> None:
    """A sidecar recorded against a different source_url (e.g. the scheme's
    manifest URL changed) must not be trusted for the new URL."""
    scheme_id = "some-scheme"

    with _patched_client(response=_mock_response(200, VALID_HTML_CONTENT)):
        first = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/old-guidelines.html")
    assert first.fetched_at is not None

    with _patched_client(side_effect=Exception("Connection refused")):
        result = fetch_scheme_guidelines(scheme_id, "https://example.gov.in/new-guidelines.html")

    assert result.status == "cached"
    assert result.fetched_at is None


def test_cached_fallback_with_tampered_content_is_not_verified(tmp_path) -> None:
    """If the bytes on disk no longer match the sidecar's recorded hash
    (file corrupted or hand-edited), the sidecar's claim is void."""
    scheme_id = "some-scheme"
    source_url = "https://example.gov.in/guidelines.html"

    with _patched_client(response=_mock_response(200, VALID_HTML_CONTENT)):
        first = fetch_scheme_guidelines(scheme_id, source_url)
    assert first.fetched_at is not None

    # Tamper with the cached file after the sidecar was written.
    with open(first.file_path, "ab") as f:
        f.write(b"tampered")

    with _patched_client(side_effect=Exception("Connection refused")):
        result = fetch_scheme_guidelines(scheme_id, source_url)

    assert result.status == "cached"
    assert result.fetched_at is None


def test_undersized_pdf_response_is_rejected() -> None:
    small_pdf = b"%PDF-1.4\n" + b"0" * 100  # well under MIN_PDF_BYTES
    with _patched_client(response=_mock_response(200, small_pdf, content_type="application/pdf")):
        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.pdf")

    assert result.status == "failed"
    assert result.file_path is None
    assert "too small" in (result.error or "")


def test_undersized_html_response_is_rejected() -> None:
    small_html = b"<html>tiny</html>"  # well under MIN_HTML_BYTES
    with _patched_client(response=_mock_response(200, small_html)):
        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.html")

    assert result.status == "failed"
    assert result.file_path is None
    assert "too small" in (result.error or "")


def test_html_url_with_non_html_content_type_is_rejected() -> None:
    content = VALID_HTML_CONTENT  # size is fine; content-type is not
    with _patched_client(response=_mock_response(200, content, content_type="application/x-javascript")):
        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.html")

    assert result.status == "failed"
    assert result.file_path is None
    assert "text/html" in (result.error or "")


def test_pdf_without_magic_bytes_is_rejected_even_if_large() -> None:
    fake_pdf = b"NOT A PDF " * 2000  # large enough, but not a real PDF
    with _patched_client(response=_mock_response(200, fake_pdf, content_type="application/pdf")):
        result = fetch_scheme_guidelines("some-scheme", "https://example.gov.in/guidelines.pdf")

    assert result.status == "failed"
    assert "magic bytes" in (result.error or "")
