import os
import hashlib
import httpx
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("sahayak.ingest.fetcher")
logging.basicConfig(level=logging.INFO)

RAW_DATA_DIR = "data/raw"


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
    fetched_at: Optional[datetime] = None  # UTC, set only on status == "fetched"


def fetch_scheme_guidelines(scheme_id: str, source_url: str) -> FetchResult:
    """
    Fetches the guidelines document for a scheme from its source URL.

    On success (HTTP 200 with valid content), writes the content to
    data/raw/ and returns status="fetched".

    On failure (non-200, invalid content, or a network exception), falls
    back to a previously cached file at the expected data/raw/ path if one
    exists (status="cached"). If no cached file exists, returns
    status="failed" with no file content whatsoever - nothing is ever
    fabricated.
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
        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            response = client.get(source_url)
            http_status = response.status_code
            if response.status_code == 200:
                content = response.content
                if doc_type == "pdf" and not content.startswith(b"%PDF"):
                    error = "Downloaded PDF does not start with %PDF magic bytes"
                    logger.warning(f"{error} for {scheme_id}. Treating as failed download.")
                elif doc_type == "html" and not content.strip():
                    error = "Downloaded HTML content is empty"
                    logger.warning(f"{error} for {scheme_id}. Treating as failed download.")
                else:
                    logger.info(f"Successfully downloaded {scheme_id} ({len(content)} bytes)")
                    with open(file_path, "wb") as f:
                        f.write(content)
                    checksum = calculate_checksum(content)
                    content_sha256 = calculate_sha256(content)
                    return FetchResult(
                        status="fetched",
                        file_path=file_path,
                        doc_type=doc_type,
                        checksum=checksum,
                        content_sha256=content_sha256,
                        http_status=http_status,
                        fetched_at=datetime.now(timezone.utc),
                    )
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
        return FetchResult(
            status="cached",
            file_path=file_path,
            doc_type=doc_type,
            checksum=checksum,
            content_sha256=content_sha256,
            http_status=http_status,
            error=error,
        )

    logger.warning(f"No cached file available for {scheme_id}. Fetch failed with no fallback.")
    return FetchResult(
        status="failed",
        http_status=http_status,
        error=error,
    )
