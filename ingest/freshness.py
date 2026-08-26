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
from api.models.scheme import Document, Scheme

logger = logging.getLogger("sahayak.ingest.freshness")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


async def check_scheme_freshness(
    db: AsyncSession, scheme_data: dict, client: httpx.AsyncClient
) -> Dict[str, Any]:
    scheme_id = scheme_data["id"]
    source_url = scheme_data["source_url"]

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
    }

    try:
        response = await client.get(source_url, timeout=15.0)
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


async def run_freshness_audit(manifest_path: str = "ingest/corpus.yaml") -> Dict[str, Any]:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = yaml.safe_load(f)
    schemes = manifest.get("schemes", [])

    results: List[Dict[str, Any]] = []
    async with AsyncSessionLocal() as db:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            for s in schemes:
                res = await check_scheme_freshness(db, s, client)
                results.append(res)

    fresh_count = sum(1 for r in results if r["is_fresh"])
    stale_count = sum(1 for r in results if r["status"] == "content_updated_stale")
    broken_count = sum(1 for r in results if "broken" in r["status"])

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_schemes": len(schemes),
        "fresh_count": fresh_count,
        "stale_count": stale_count,
        "broken_count": broken_count,
        "schemes": results,
    }


def main():
    report = asyncio.run(run_freshness_audit())
    print(f"Freshness Report: {report['fresh_count']}/{report['total_schemes']} fresh, {report['broken_count']} broken")


if __name__ == "__main__":
    main()
