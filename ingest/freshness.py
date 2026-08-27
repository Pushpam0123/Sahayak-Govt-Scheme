import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import AsyncSessionLocal
from api.models.scheme import Document

logger = logging.getLogger("sahayak.ingest.freshness")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)


async def check_scheme_freshness(
    db: AsyncSession,
    scheme_data: dict,
    client: httpx.AsyncClient,
    insecure_client: Optional[httpx.AsyncClient] = None,
) -> Dict[str, Any]:
    """Re-check one scheme's source document against the stored checksum.

    TLS is verified by default. A scheme may opt out with `tls_insecure: true`
    in corpus.yaml -- the same explicit, per-scheme, reason-documented mechanism
    ingest/fetcher.py uses -- and only then is the unverified client used. The
    result records which path was taken so an unverified check can never be
    mistaken for a verified one.
    """
    scheme_id = scheme_data["id"]
    source_url = scheme_data["source_url"]
    tls_insecure = bool(scheme_data.get("tls_insecure", False))

    # 1. Fetch document from DB
    stmt = select(Document).where(Document.scheme_id == scheme_id)
    res = await db.execute(stmt)
    db_doc = res.scalars().first()

    result = {
        "scheme_id": scheme_id,
        "source_url": source_url,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "status": "unknown",
        "http_status": None,
        "is_fresh": False,
        "content_length": None,
        "error": None,
        "tls_verified": not tls_insecure,
    }

    if tls_insecure:
        if insecure_client is None:
            result["status"] = "broken_network_error"
            result["error"] = (
                "Scheme opted out of TLS verification but no insecure "
                "client was provided."
            )
            return result
        logger.warning(
            "Checking %s without TLS verification per explicit corpus opt-in: %s",
            scheme_id,
            scheme_data.get("tls_insecure_reason", "no reason recorded"),
        )
        active_client = insecure_client
    else:
        active_client = client

    try:
        response = await active_client.get(source_url, timeout=15.0)
        result["http_status"] = response.status_code

        if response.status_code == 200:
            content_bytes = response.content
            remote_sha256 = hashlib.sha256(content_bytes).hexdigest()
            result["content_length"] = len(content_bytes)

            if db_doc and db_doc.content_sha256:
                if db_doc.content_sha256 == remote_sha256:
                    result["status"] = "fresh_unchanged"
                    result["is_fresh"] = True
                else:
                    result["status"] = "content_updated_stale"
                    result["is_fresh"] = False
            else:
                result["status"] = "fresh_new"
                result["is_fresh"] = True
        else:
            result["status"] = "broken_http_error"
            result["error"] = f"HTTP {response.status_code}"

    except Exception as e:
        result["status"] = "broken_network_error"
        result["error"] = str(e)

    return result


async def run_freshness_audit(
    manifest_path: str = "ingest/corpus.yaml",
) -> Dict[str, Any]:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = yaml.safe_load(f)
    schemes = manifest.get("schemes", [])

    needs_insecure = any(s.get("tls_insecure") for s in schemes)

    results: List[Dict[str, Any]] = []
    async with AsyncSessionLocal() as db:
        async with httpx.AsyncClient(follow_redirects=True, verify=True) as client:
            insecure_ctx = (
                httpx.AsyncClient(follow_redirects=True, verify=False)
                if needs_insecure
                else None
            )
            try:
                for s in schemes:
                    res = await check_scheme_freshness(db, s, client, insecure_ctx)
                    results.append(res)
            finally:
                if insecure_ctx is not None:
                    await insecure_ctx.aclose()

    fresh_count = sum(1 for r in results if r["is_fresh"])
    stale_count = sum(1 for r in results if r["status"] == "content_updated_stale")
    broken_count = sum(1 for r in results if "broken" in r["status"])

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_schemes": len(schemes),
        "fresh_count": fresh_count,
        "stale_count": stale_count,
        "broken_count": broken_count,
        "tls_unverified_count": sum(
            1 for r in results if not r.get("tls_verified", True)
        ),
        "schemes": results,
    }


def main():
    report = asyncio.run(run_freshness_audit())
    print(
        f"Freshness Report: {report['fresh_count']}/{report['total_schemes']} "
        f"fresh, {report['broken_count']} broken"
    )


if __name__ == "__main__":
    main()
