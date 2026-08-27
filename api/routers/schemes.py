from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.exceptions import SchemeNotFoundError
from api.models.eligibility import SchemeEligibilityRules
from api.models.scheme import Document, Scheme

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("")
async def list_schemes(
    state: Optional[str] = Query(None, description="Filter by state name or 'Central'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    benefit_type: Optional[str] = Query(None, description="Filter by benefit type"),
    status_filter: Optional[str] = Query(
        "active", alias="status", description="Filter by status"
    ),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists schemes with optional filters and rich citizen summary metadata."""
    stmt = select(Scheme)
    if status_filter:
        stmt = stmt.where(Scheme.status == status_filter)
    if state:
        stmt = stmt.where(Scheme.state == state)
    if category:
        stmt = stmt.where(Scheme.category == category)
    if benefit_type:
        stmt = stmt.where(Scheme.benefit_type == benefit_type)

    stmt = stmt.order_by(Scheme.name)
    res = await db.execute(stmt)
    schemes = res.scalars().all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "state": s.state,
            "ministry": s.ministry,
            "category": s.category,
            "summary": s.summary,
            "benefit_amount": s.benefit_amount,
            "benefit_type": s.benefit_type,
            "application_mode": s.application_mode,
            "official_url": s.official_url,
            "status": s.status,
            "tags": s.tags or [],
        }
        for s in schemes
    ]


@router.get("/{scheme_id}")
async def get_scheme_detail(
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Return full scheme detail: benefits, rules, documents and guidelines."""
    # 1. Fetch scheme record
    stmt_scheme = select(Scheme).where(Scheme.id == scheme_id)
    res_scheme = await db.execute(stmt_scheme)
    scheme = res_scheme.scalars().first()

    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    # 2. Fetch associated documents
    stmt_docs = select(Document).where(Document.scheme_id == scheme_id)
    res_docs = await db.execute(stmt_docs)
    docs = res_docs.scalars().all()

    # 3. Fetch eligibility rules if configured
    stmt_rules = select(SchemeEligibilityRules).where(
        SchemeEligibilityRules.scheme_id == scheme_id
    )
    res_rules = await db.execute(stmt_rules)
    rules_obj = res_rules.scalars().first()

    return {
        "id": scheme.id,
        "name": scheme.name,
        "state": scheme.state,
        "ministry": scheme.ministry,
        "category": scheme.category,
        "summary": scheme.summary,
        "benefit_amount": scheme.benefit_amount,
        "benefit_type": scheme.benefit_type,
        "required_documents": scheme.required_documents or [],
        "application_mode": scheme.application_mode,
        "application_url": scheme.application_url or scheme.official_url,
        "deadlines": scheme.deadlines,
        "helpline": scheme.helpline,
        "official_url": scheme.official_url,
        "status": scheme.status,
        "tags": scheme.tags or [],
        "eligibility_rules": {
            "is_verified": rules_obj.is_verified if rules_obj else False,
            "rules": rules_obj.rules_json if rules_obj else None,
            "verified_by": rules_obj.verified_by if rules_obj else None,
            "verified_at": rules_obj.verified_at.isoformat()
            if rules_obj and rules_obj.verified_at
            else None,
        }
        if rules_obj
        else None,
        "documents": [
            {
                "id": d.id,
                "title": d.title,
                "source_url": d.source_url,
                "doc_type": d.doc_type,
                "fetch_status": d.fetch_status,
                "verified_at": d.verified_at.isoformat() if d.verified_at else None,
                "content_sha256": d.content_sha256,
                "tls_verified": d.tls_verified,
            }
            for d in docs
        ],
    }
