import hashlib
import json
import logging
import os
import ssl
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import httpx

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
    # True unless this content was only obtainable via an explicit,
    # per-scheme opted-in insecure (certificate-unverified) retry. Carried
    # through from the sidecar on a cached load the same way fetched_at is,
    # gated by the same source_url/hash match.
    tls_verified: bool = True


def _meta_path(file_path: str) -> str:
    return f"{file_path}.meta.json"


def _write_meta(
    file_path: str,
    source_url: str,
    fetched_at: datetime,
    http_status: Optional[int],
    content_sha256: str,
    doc_type: str,
    tls_verified: bool,
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
        "tls_verified": tls_verified,
    }
    with open(_meta_path(file_path), "w", encoding="utf-8") as f:
        json.dump(meta, f)


def _read_verified_provenance(
    file_path: str, source_url: str, content_sha256: str
) -> tuple[Optional[datetime], bool]:
    """Reads the sidecar for a cached file and returns (fetched_at,
    tls_verified) only if the sidecar proves the cached bytes were
    verified against this exact source_url. Returns (None, False) if the
    sidecar is missing, corrupt, records a different source_url, or
    records a different content hash (i.e. the file on disk changed
    underneath it, or was never a verified fetch to begin with).

    A sidecar written before tls_verified existed carries no evidence
    either way, so it is treated as tls_verified=False (unknown is not
    the same as verified) even though fetched_at is still honoured.
    """
    meta_path = _meta_path(file_path)
    if not os.path.exists(meta_path):
        return None, False
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None, False

    if meta.get("source_url") != source_url:
        return None, False
    if meta.get("content_sha256") != content_sha256:
        return None, False

    fetched_at_raw = meta.get("fetched_at")
    if not fetched_at_raw:
        return None, False
    try:
        fetched_at = datetime.fromisoformat(fetched_at_raw)
    except ValueError:
        return None, False

    tls_verified = bool(meta.get("tls_verified", False))
    return fetched_at, tls_verified


def _is_tls_verification_error(exc: BaseException) -> bool:
    """True if exc (raised while fetching with certificate verification
    on) indicates the failure was specifically a TLS/certificate problem,
    as opposed to DNS failure, connection refused, timeout, etc. Only
    this class of failure is eligible for the opt-in insecure retry."""
    seen = set()
    current: Optional[BaseException] = exc
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if isinstance(current, ssl.SSLError):
            return True
        current = current.__cause__ or current.__context__

    text = str(exc)
    return "CERTIFICATE_VERIFY_FAILED" in text or "SSLCertVerificationError" in text


def fetch_scheme_guidelines(
    scheme_id: str, source_url: str, allow_insecure_fallback: bool = False
) -> FetchResult:
    """
    Fetches the guidelines document for a scheme from its source URL.

    Certificate verification is ON by default (verify=True). If, and only
    if, that attempt fails with a TLS/certificate error AND the caller has
    explicitly passed allow_insecure_fallback=True (per-scheme opt-in from
    corpus.yaml, validated by the caller), a single retry is made with
    verification disabled. Any other kind of failure (DNS, timeout,
    connection refused, non-200, bad content) never triggers an insecure
    retry regardless of the flag.

    On success, writes the content plus a provenance sidecar to data/raw/
    and returns status="fetched" with fetched_at set to now, and
    tls_verified reflecting whether the insecure retry was needed.

    On failure (non-200, invalid/undersized/mistyped content, or a network
    exception), falls back to a previously cached file at the expected
    data/raw/ path if one exists (status="cached"). fetched_at and
    tls_verified on a cached result are only set/true if the sidecar
    proves that exact file content was itself previously verified against
    this same source_url - otherwise fetched_at is None, i.e. not
    citable.

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
    tls_verified = True
    response = None

    try:
        logger.info(
            f"Attempting to download guidelines for {scheme_id} from {source_url} (TLS verified)"
        )
        with httpx.Client(timeout=20.0, follow_redirects=True, verify=True) as client:
            response = client.get(source_url)
            http_status = response.status_code
    except Exception as e:
        error = str(e)
        if _is_tls_verification_error(e) and allow_insecure_fallback:
            logger.warning(
                f"TLS verification failed for {scheme_id} ({error}); "
                "retrying insecurely per explicit scheme opt-in."
            )
            try:
                with httpx.Client(
                    timeout=20.0, follow_redirects=True, verify=False
                ) as client:
                    response = client.get(source_url)
                    http_status = response.status_code
                    tls_verified = False
                    error = None
            except Exception as e2:
                error = str(e2)
                logger.warning(f"Insecure retry also failed for {scheme_id}: {error}.")
        else:
            logger.warning(f"Failed to fetch {scheme_id} from web: {error}.")

    if response is not None and http_status == 200:
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
                    f"Response Content-Type '{content_type}' does not contain text/html"
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
                file_path,
                source_url,
                fetched_at,
                http_status,
                content_sha256,
                doc_type,
                tls_verified,
            )
            return FetchResult(
                status="fetched",
                file_path=file_path,
                doc_type=doc_type,
                checksum=checksum,
                content_sha256=content_sha256,
                http_status=http_status,
                fetched_at=fetched_at,
                tls_verified=tls_verified,
            )
        else:
            logger.warning(f"{error} for {scheme_id}. Treating as failed download.")
    elif response is not None:
        error = f"Unexpected HTTP status {response.status_code}"
        logger.warning(f"Failed to fetch {scheme_id} from web: {error}.")

    # Fetch failed (bad status, bad content, or exception). Fall back to a
    # previously cached file if one exists; never fabricate content.
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            content = f.read()
        logger.info(f"Using existing cached file for {scheme_id} at {file_path}")
        checksum = calculate_checksum(content)
        content_sha256 = calculate_sha256(content)
        cached_fetched_at, cached_tls_verified = _read_verified_provenance(
            file_path, source_url, content_sha256
        )
        return FetchResult(
            status="cached",
            file_path=file_path,
            doc_type=doc_type,
            checksum=checksum,
            content_sha256=content_sha256,
            http_status=http_status,
            error=error,
            fetched_at=cached_fetched_at,
            tls_verified=cached_tls_verified,
        )

    logger.warning(
        f"No cached file available for {scheme_id}. Fetch failed with no fallback."
    )
    return FetchResult(
        status="failed",
        http_status=http_status,
        error=error,
    )
