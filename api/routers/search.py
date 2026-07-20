from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.models.scheme import Chunk, Document, Scheme
from api.services.retrieval import hybrid_search

router = APIRouter()


@router.get("/search")
async def search_chunks(
    query: str = Query(None),
    scheme_id: str = Query(None),
    state: str = Query(None),
    category: str = Query(None),
    limit: int = Query(20),  # Default limit to 20 for search browser
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieves chunks from the database.

    If query is provided, performs hybrid retrieval (vector + FTS + RRF).
    Otherwise, returns all chunks sorted by scheme/seq for browsing.
    """
    results_list = []

    if query:
        # Perform hybrid search (RRF score returned as well)
        hybrid_results = await hybrid_search(
            db=db,
            query=query,
            state=state,
            category=category,
            scheme_id=scheme_id,
            limit=limit,
        )
        for chunk, score in hybrid_results:
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
                    "score": score,
                }
            )
    else:
        # Fallback browser query (browsing without query)
        stmt = select(Chunk).join(Document).join(Scheme)
        if scheme_id:
            stmt = stmt.where(Document.scheme_id == scheme_id)
        if state:
            stmt = stmt.where(Scheme.state == state)
        if category:
            stmt = stmt.where(Scheme.category == category)

        stmt = stmt.order_by(Document.scheme_id, Chunk.seq).limit(limit)
        result = await db.execute(stmt)
        chunks = result.scalars().all()

        for chunk in chunks:
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
                    "score": 1.0,  # default placeholder score when browsing
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
