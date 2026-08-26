import secrets
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import hash_api_key, verify_admin_token
from api.db import get_db
from api.models.auth import APIKey, Organization, User
from api.models.chat import QALog
from api.models.scheme import Chunk, Document, Scheme

router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_admin_token)],
    tags=["admin"],
)


class CreateOrgRequest(BaseModel):
    name: str
    slug: str


class CreateAPIKeyRequest(BaseModel):
    name: str
    org_id: Optional[uuid.UUID] = None


@router.get("/stats")
async def get_admin_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns administrative dashboard stats."""
    schemes_count = await db.scalar(select(func.count(Scheme.id)))
    active_schemes_count = await db.scalar(select(func.count(Scheme.id)).where(Scheme.status == "active"))
    docs_count = await db.scalar(select(func.count(Document.id)))
    verified_docs_count = await db.scalar(
        select(func.count(Document.id)).where(Document.verified_at != None)
    )
    chunks_count = await db.scalar(select(func.count(Chunk.id)))
    qa_logs_count = await db.scalar(select(func.count(QALog.id)))
    total_cost = await db.scalar(select(func.coalesce(func.sum(QALog.estimated_cost_usd), 0.0)))

    return {
        "catalogue": {
            "total_schemes": schemes_count or 0,
            "active_schemes": active_schemes_count or 0,
            "total_documents": docs_count or 0,
            "verified_documents": verified_docs_count or 0,
            "total_chunks": chunks_count or 0,
        },
        "usage": {
            "total_questions_served": qa_logs_count or 0,
            "total_cost_usd": float(total_cost or 0.0),
        },
    }


@router.post("/api-keys")
async def create_api_key(
    req: CreateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Generates a new API key for an organization/client."""
    raw_secret = f"shk_live_{secrets.token_urlsafe(24)}"
    prefix = raw_secret[:12]
    key_hash = hash_api_key(raw_secret)

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    api_key_obj = APIKey(
        key_hash=key_hash,
        prefix=prefix,
        name=req.name,
        org_id=req.org_id,
        is_active=True,
        created_at=now,
    )
    db.add(api_key_obj)
    await db.commit()
    await db.refresh(api_key_obj)

    return {
        "id": str(api_key_obj.id),
        "name": api_key_obj.name,
        "prefix": api_key_obj.prefix,
        "api_key": raw_secret,  # Only shown once
        "created_at": api_key_obj.created_at.isoformat(),
    }
