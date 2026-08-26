import os
import hashlib
import httpx
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("sahayak.ingest.fetcher")
logging.basicConfig(level=logging.INFO)

RAW_DATA_DIR = "data/raw"

# Minimum acceptable content sizes. Below these thresholds a "200 OK" is
# treated as junk (error pages, redirect stubs, empty placeholders) rather
# than a real document, and the fetch is treated as failed.
MIN_PDF_BYTES = 10_000
MIN_HTML_BYTES = 2_000


def calculate_checksum(content: bytes) -> str:
    return hashlib.md5(content).hexdigest()


def calculate_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


@dataclass
class FetchResult:
    status: str  # "fetched" | "cached" | "failed"
    file_path: Optional[str] = None
    doc_type: Optional[str] = None
    checksum: Optional[str] = None  # md5, used for idempotency
    content_sha256: Optional[str] = None
    http_status: Optional[int] = None
    error: Optional[str] = None
    # UTC. The moment this exact content was last CONFIRMED to have come
    # from source_url: set on a fresh, successful 200 fetch, and also on a
    # cached load when a matching, uncorrupted sidecar proves the cached
    # bytes on disk were themselves verified against this same source_url
    # by a previous fetch. None in every other case - a file sitting in
    # data/raw/ with no (or a stale/mismatched) provenance record is not
    # evidence of anything and must not be treated as verified.
    fetched_at: Optional[datetime] = None


def _meta_path(file_path: str) -> str:
    return f"{file_path}.meta.json"


def _write_meta(
    file_path: str,
    source_url: str,
    fetched_at: datetime,
    http_status: Optional[int],
    content_sha256: str,
    doc_type: str,
) -> None:
    """Writes a sidecar JSON file recording the provenance of the content
    just written to file_path, so a later run that falls back to this
    cached file can prove it was genuinely fetched from source_url."""
    meta = {
        "source_url": source_url,
        "fetched_at": fetched_at.isoformat(),
        "http_status": http_status,
        "content_sha256": content_sha256,
        "doc_type": doc_type,
    }
    with open(_meta_path(file_path), "w", encoding="utf-8") as f:
        json.dump(meta, f)


def _read_verified_fetched_at(
    file_path: str, source_url: str, content_sha256: str
) -> Optional[datetime]:
    """Reads the sidecar for a cached file and returns the fetched_at it
    records only if the sidecar proves the cached bytes were verified
    against this exact source_url. Returns None if the sidecar is
    missing, corrupt, records a different source_url, or records a
    different content hash (i.e. the file on disk changed underneath it,
    or was never a verified fetch to begin with)."""
    meta_path = _meta_path(file_path)
    if not os.path.exists(meta_path):
        return None
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None

    if meta.get("source_url") != source_url:
        return None
    if meta.get("content_sha256") != content_sha256:
        return None

    fetched_at_raw = meta.get("fetched_at")
    if not fetched_at_raw:
        return None
    try:
        return datetime.fromisoformat(fetched_at_raw)
    except ValueError:
        return None


def fetch_scheme_guidelines(scheme_id: str, source_url: str) -> FetchResult:
    """
    Fetches the guidelines document for a scheme from its source URL.

    On success (HTTP 200 with valid, sufficiently large content of the
    expected type), writes the content plus a provenance sidecar to
    data/raw/ and returns status="fetched" with fetched_at set to now.

    On failure (non-200, invalid/undersized/mistyped content, or a network
    exception), falls back to a previously cached file at the expected
    data/raw/ path if one exists (status="cached"). fetched_at on a cached
    result is only set if the sidecar proves that exact file content was
    itself previously verified against this same source_url - otherwise
    fetched_at is None, i.e. not citable.

    If no cached file exists, returns status="failed" with no file content
    whatsoever - nothing is ever fabricated.
    """
    os.makedirs(RAW_DATA_DIR, exist_ok=True)

    # Determine doc_type
    doc_type = "pdf" if source_url.lower().endswith(".pdf") else "html"
    file_name = f"{scheme_id}.{doc_type}"
    file_path = os.path.join(RAW_DATA_DIR, file_name)

    http_status: Optional[int] = None
    error: Optional[str] = None

    try:
        logger.info(f"Attempting to download guidelines for {scheme_id} from {source_url}")
        with httpx.Client(timeout=20.0, follow_redirects=True, verify=False) as client:
            response = client.get(source_url)
            http_status = response.status_code
            if response.status_code == 200:
                content = response.content
                valid = False

                if doc_type == "pdf":
                    if not content.startswith(b"%PDF"):
                        error = "Downloaded PDF does not start with %PDF magic bytes"
                    elif len(content) < MIN_PDF_BYTES:
                        error = (
                            f"Downloaded PDF is too small "
                            f"({len(content)} bytes < {MIN_PDF_BYTES} minimum)"
                        )
                    else:
                        valid = True
                else:
                    content_type = response.headers.get("content-type", "")
                    if "text/html" not in content_type.lower():
                        error = (
                            f"Response Content-Type '{content_type}' "
                            "does not contain text/html"
                        )
                    elif len(content) < MIN_HTML_BYTES:
                        error = (
                            f"Downloaded HTML is too small "
                            f"({len(content)} bytes < {MIN_HTML_BYTES} minimum)"
                        )
                    else:
                        valid = True

                if valid:
                    logger.info(f"Successfully downloaded {scheme_id} ({len(content)} bytes)")
                    with open(file_path, "wb") as f:
                        f.write(content)
                    checksum = calculate_checksum(content)
                    content_sha256 = calculate_sha256(content)
                    fetched_at = datetime.now(timezone.utc)
                    _write_meta(
                        file_path, source_url, fetched_at, http_status, content_sha256, doc_type
                    )
                    return FetchResult(
                        status="fetched",
                        file_path=file_path,
                        doc_type=doc_type,
                        checksum=checksum,
                        content_sha256=content_sha256,
                        http_status=http_status,
                        fetched_at=fetched_at,
                    )
                else:
                    logger.warning(f"{error} for {scheme_id}. Treating as failed download.")
            else:
                error = f"Unexpected HTTP status {response.status_code}"
                logger.warning(f"Failed to fetch {scheme_id} from web: {error}.")
    except Exception as e:
        error = str(e)
        logger.warning(f"Failed to fetch {scheme_id} from web: {error}.")

    # Fetch failed (bad status, bad content, or exception). Fall back to a
    # previously cached file if one exists; never fabricate content.
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            content = f.read()
        logger.info(f"Using existing cached file for {scheme_id} at {file_path}")
        checksum = calculate_checksum(content)
        content_sha256 = calculate_sha256(content)
        fetched_at = _read_verified_fetched_at(file_path, source_url, content_sha256)
        return FetchResult(
            status="cached",
            file_path=file_path,
            doc_type=doc_type,
            checksum=checksum,
            content_sha256=content_sha256,
            http_status=http_status,
            error=error,
            fetched_at=fetched_at,
        )

    logger.warning(f"No cached file available for {scheme_id}. Fetch failed with no fallback.")
    return FetchResult(
        status="failed",
        http_status=http_status,
        error=error,
    )
