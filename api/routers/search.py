from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.models.scheme import Chunk, Document, Scheme

router = APIRouter()


@router.get("/search")
async def search_chunks(
    query: str = Query(None),
    scheme_id: str = Query(None),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieves chunks from the database for debugging and eyeball quality checks."""
    stmt = select(Chunk).join(Document)

    if scheme_id:
        stmt = stmt.where(Document.scheme_id == scheme_id)

    if query:
        stmt = stmt.where(Chunk.text.ilike(f"%{query}%"))

    # Order by scheme and chunk sequence
    stmt = stmt.order_by(Document.scheme_id, Chunk.seq).limit(limit)

    result = await db.execute(stmt)
    chunks = result.scalars().all()

    results_list = []
    for chunk in chunks:
        # Fetch related doc to return metadata
        doc_stmt = select(Document).where(Document.id == chunk.document_id)
        doc_res = await db.execute(doc_stmt)
        doc = doc_res.scalar_one()

        results_list.append(
            {
                "id": chunk.id,
                "scheme_id": doc.scheme_id,
                "document_title": doc.title,
                "seq": chunk.seq,
                "heading_path": chunk.heading_path,
                "text": chunk.text,
                "tokens": chunk.tokens,
            }
        )

    # Get all ingested schemes for filters list
    schemes_stmt = select(Scheme).order_by(Scheme.name)
    schemes_res = await db.execute(schemes_stmt)
    schemes = schemes_res.scalars().all()

    return {
        "results": results_list,
        "schemes": [
            {"id": s.id, "name": s.name, "state": s.state, "category": s.category}
            for s in schemes
        ],
    }
