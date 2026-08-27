from typing import Any, Dict, List

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
    Eagerly loads Document details in a batch query to eliminate N+1 queries.
    """
    results_list: List[Dict[str, Any]] = []

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

        if hybrid_results:
            doc_ids = list({chunk.document_id for chunk, _ in hybrid_results})
            docs_stmt = select(Document).where(Document.id.in_(doc_ids))
            docs_res = await db.execute(docs_stmt)
            doc_map = {}

            if hasattr(docs_res, "scalars"):
                docs = docs_res.scalars().all()
                if docs:
                    doc_map = {doc.id: doc for doc in docs}
            if not doc_map and hasattr(docs_res, "scalar_one"):
                try:
                    doc = docs_res.scalar_one()
                    doc_map = {doc.id: doc}
                except Exception:
                    pass

            for chunk, score in hybrid_results:
                chunk_doc = doc_map.get(chunk.document_id)
                results_list.append(
                    {
                        "id": chunk.id,
                        "scheme_id": chunk_doc.scheme_id if chunk_doc else None,
                        "document_title": chunk_doc.title if chunk_doc else "",
                        "seq": chunk.seq,
                        "heading_path": chunk.heading_path,
                        "text": chunk.text,
                        "tokens": chunk.tokens,
                        "score": score,
                    }
                )
    else:
        # Fallback browser query with batch fetching
        stmt = (
            select(Chunk, Document)
            .join(Document, Chunk.document_id == Document.id)
            .join(Scheme, Document.scheme_id == Scheme.id)
        )
        if scheme_id:
            stmt = stmt.where(Document.scheme_id == scheme_id)
        if state:
            stmt = stmt.where(Scheme.state == state)
        if category:
            stmt = stmt.where(Scheme.category == category)

        stmt = stmt.order_by(Document.scheme_id, Chunk.seq).limit(limit)
        result = await db.execute(stmt)

        raw_items = result.all() if hasattr(result, "all") else []
        if raw_items and isinstance(raw_items[0], tuple):
            for chunk, doc in raw_items:
                results_list.append(
                    {
                        "id": chunk.id,
                        "scheme_id": doc.scheme_id if doc else None,
                        "document_title": doc.title if doc else "",
                        "seq": chunk.seq,
                        "heading_path": chunk.heading_path,
                        "text": chunk.text,
                        "tokens": chunk.tokens,
                        "score": 1.0,
                    }
                )
        else:
            chunks = result.scalars().all() if hasattr(result, "scalars") else []
            if chunks:
                doc_ids = list({chunk.document_id for chunk in chunks})
                docs_stmt = select(Document).where(Document.id.in_(doc_ids))
                docs_res = await db.execute(docs_stmt)
                doc_map = {}
                if hasattr(docs_res, "scalars"):
                    docs = docs_res.scalars().all()
                    if docs:
                        doc_map = {doc.id: doc for doc in docs}
                if not doc_map and hasattr(docs_res, "scalar_one"):
                    try:
                        doc = docs_res.scalar_one()
                        doc_map = {doc.id: doc}
                    except Exception:
                        pass

                for chunk in chunks:
                    chunk_doc = doc_map.get(chunk.document_id)
                    results_list.append(
                        {
                            "id": chunk.id,
                            "scheme_id": chunk_doc.scheme_id if chunk_doc else None,
                            "document_title": chunk_doc.title if chunk_doc else "",
                            "seq": chunk.seq,
                            "heading_path": chunk.heading_path,
                            "text": chunk.text,
                            "tokens": chunk.tokens,
                            "score": 1.0,
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
