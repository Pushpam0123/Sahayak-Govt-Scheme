import secrets
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import hash_api_key, verify_admin_token
from api.db import get_db
from api.models.auth import APIKey
from api.models.chat import QALog
from api.models.eligibility import SchemeEligibilityRules
from api.models.scheme import Chunk, Document, Scheme
from api.services.extractor import extract_rules_from_chunk

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


class VerifyRulesRequest(BaseModel):
    rules_json: Dict[str, Any]
    verified_by: str
    notes: Optional[str] = None


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
    unverified_rules_count = await db.scalar(
        select(func.count(SchemeEligibilityRules.id)).where(SchemeEligibilityRules.is_verified == False)
    )

    return {
        "catalogue": {
            "total_schemes": schemes_count or 0,
            "active_schemes": active_schemes_count or 0,
            "total_documents": docs_count or 0,
            "verified_documents": verified_docs_count or 0,
            "total_chunks": chunks_count or 0,
            "unverified_rules_in_queue": unverified_rules_count or 0,
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


@router.get("/rules/queue")
async def get_rules_verification_queue(
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns all scheme eligibility rules waiting for human review and verification."""
    stmt = (
        select(SchemeEligibilityRules, Scheme)
        .join(Scheme, SchemeEligibilityRules.scheme_id == Scheme.id)
        .where(SchemeEligibilityRules.is_verified == False)
        .order_by(SchemeEligibilityRules.updated_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    queue_items = []
    for rule, scheme in rows:
        queue_items.append(
            {
                "id": rule.id,
                "scheme_id": rule.scheme_id,
                "scheme_name": scheme.name,
                "state": scheme.state,
                "category": scheme.category,
                "rules_json": rule.rules_json,
                "extracted_by": rule.extracted_by,
                "extracted_at": rule.extracted_at.isoformat() if rule.extracted_at else None,
                "is_verified": rule.is_verified,
                "notes": rule.notes,
            }
        )
    return queue_items


@router.post("/rules/{scheme_id}/verify")
async def verify_scheme_rules(
    scheme_id: str,
    req: VerifyRulesRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Approves and marks a scheme's eligibility rules as verified."""
    stmt = select(SchemeEligibilityRules).where(SchemeEligibilityRules.scheme_id == scheme_id)
    res = await db.execute(stmt)
    rule = res.scalars().first()

    now = datetime.now(timezone.utc)
    if not rule:
        rule = SchemeEligibilityRules(
            scheme_id=scheme_id,
            rules_json=req.rules_json,
            is_verified=True,
            extracted_by="human",
            extracted_at=now,
            verified_by=req.verified_by,
            verified_at=now,
            notes=req.notes,
        )
        db.add(rule)
    else:
        rule.rules_json = req.rules_json
        rule.is_verified = True
        rule.verified_by = req.verified_by
        rule.verified_at = now
        rule.notes = req.notes
        rule.updated_at = now

    await db.commit()
    await db.refresh(rule)

    return {
        "status": "verified",
        "scheme_id": scheme_id,
        "is_verified": rule.is_verified,
        "verified_by": rule.verified_by,
        "verified_at": rule.verified_at.isoformat() if rule.verified_at else None,
        "rules_json": rule.rules_json,
    }


@router.post("/rules/{scheme_id}/extract")
async def trigger_rule_extraction(
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Automates drafting of eligibility rules from verified scheme chunks using LLM extractor."""
    # Find chunks for scheme
    stmt_chunks = (
        select(Chunk)
        .join(Document, Chunk.document_id == Document.id)
        .where(Document.scheme_id == scheme_id, Document.verified_at != None)
        .order_by(Chunk.seq)
        .limit(5)
    )
    res_chunks = await db.execute(stmt_chunks)
    chunks = res_chunks.scalars().all()

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No verified document chunks found for scheme '{scheme_id}' to extract rules from.",
        )

    # Combine chunk texts
    combined_text = "\n\n".join([f"[{c.heading_path or 'Section'}]: {c.text}" for c in chunks])
    extracted_rules = await extract_rules_from_chunk(combined_text)

    # Save to verification queue as unverified draft
    stmt_rule = select(SchemeEligibilityRules).where(SchemeEligibilityRules.scheme_id == scheme_id)
    res_rule = await db.execute(stmt_rule)
    rule = res_rule.scalars().first()

    now = datetime.now(timezone.utc)
    if not rule:
        rule = SchemeEligibilityRules(
            scheme_id=scheme_id,
            rules_json=extracted_rules,
            is_verified=False,
            extracted_by="llm",
            extracted_at=now,
        )
        db.add(rule)
    else:
        rule.rules_json = extracted_rules
        rule.is_verified = False  # Reset to unverified for review
        rule.extracted_by = "llm"
        rule.extracted_at = now
        rule.updated_at = now

    await db.commit()
    await db.refresh(rule)

    return {
        "status": "extracted_queued_for_verification",
        "scheme_id": scheme_id,
        "is_verified": rule.is_verified,
        "rules_json": rule.rules_json,
    }
