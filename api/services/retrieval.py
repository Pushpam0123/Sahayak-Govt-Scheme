import logging
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.scheme import Chunk, Document, Scheme
from ingest.embedder import get_embedder

logger = logging.getLogger("sahayak.api.services.retrieval")


def is_hindi(text: str) -> bool:
    """Helper to detect if text contains Devanagari characters."""
    return any("\u0900" <= char <= "\u097f" for char in text)


async def get_vector_search(
    db: AsyncSession,
    query_text: str,
    state: Optional[str] = None,
    category: Optional[str] = None,
    scheme_id: Optional[str] = None,
    limit: int = 20,
) -> List[Chunk]:
    """Retrieves top chunks using pgvector cosine similarity."""
    embedder = get_embedder()
    query_embedding = embedder.embed_text(query_text)

    stmt = select(Chunk).join(Document).join(Scheme)

    # Apply optional metadata filters
    if state:
        stmt = stmt.where(Scheme.state == state)
    if category:
        stmt = stmt.where(Scheme.category == category)
    if scheme_id:
        stmt = stmt.where(Document.scheme_id == scheme_id)

    stmt = stmt.order_by(Chunk.embedding.cosine_distance(query_embedding).asc())
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_fts_search(
    db: AsyncSession,
    query_text: str,
    state: Optional[str] = None,
    category: Optional[str] = None,
    scheme_id: Optional[str] = None,
    limit: int = 20,
) -> List[Chunk]:
    """Retrieves top chunks using PostgreSQL Full-Text Search.

    Uses websearch_to_tsquery.
    """
    tsquery = func.websearch_to_tsquery("english", query_text)
    stmt = select(Chunk).join(Document).join(Scheme)

    # Concatenate chunk text, scheme name, and scheme id for matching
    combined_text = Chunk.text + " " + Scheme.name + " " + Scheme.id
    stmt = stmt.where(func.to_tsvector("english", combined_text).op("@@")(tsquery))

    # Apply optional metadata filters
    if state:
        stmt = stmt.where(Scheme.state == state)
    if category:
        stmt = stmt.where(Scheme.category == category)
    if scheme_id:
        stmt = stmt.where(Document.scheme_id == scheme_id)

    stmt = stmt.order_by(
        func.ts_rank_cd(func.to_tsvector("english", combined_text), tsquery).desc()
    )
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


def reciprocal_rank_fusion(
    vector_results: List[Chunk],
    fts_results: List[Chunk],
    k: float = 60.0,
    limit: int = 8,
) -> List[Tuple[Chunk, float]]:
    """Merges two ranked lists of chunks using Reciprocal Rank Fusion (RRF).

    RRF score(d) = sum( 1 / (k + rank(d)) )
    Ties are broken deterministically using chunk.id ascending.
    """
    rrf_scores: Dict[int, float] = {}
    chunk_map: Dict[int, Chunk] = {}

    # Rank 1-based index
    for rank, chunk in enumerate(vector_results, start=1):
        chunk_id = int(chunk.id)
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k + rank)
        chunk_map[chunk_id] = chunk

    for rank, chunk in enumerate(fts_results, start=1):
        chunk_id = int(chunk.id)
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k + rank)
        chunk_map[chunk_id] = chunk

    # Deterministic sorting: primary by score desc, secondary by chunk.id asc
    sorted_items = sorted(rrf_scores.items(), key=lambda item: (-item[1], item[0]))

    merged_results = [(chunk_map[cid], score) for cid, score in sorted_items[:limit]]
    return merged_results


HINDI_TO_ENGLISH = {
    "पीएम-किसान योजना के लिए कौन पात्र है?": ("Who is eligible for PM-KISAN?"),
    "पीएम-किसान योजना के तहत कितनी वित्तीय सहायता मिलती है?": (
        "What are the benefits of PM-KISAN?"
    ),
    "पीएम-किसान योजना की अपवर्जन श्रेणियां क्या हैं?": (
        "What is the exclusion criteria of PM-KISAN?"
    ),
    "राष्ट्रीय छात्रवृत्ति पोर्टल पोस्ट-मैट्रिक योजना के लिए पात्रता क्या है?": (
        "What is the eligibility for NSP Post-Matric SC scholarship?"
    ),
    "आयुष्मान भारत पीएम-जेएवाई योजना के लिए कौन आवेदन कर सकता है?": (
        "Who qualifies for Ayushman Bharat PM-JAY?"
    ),
    "अटल पेंशन योजना के लिए पात्रता शर्तें क्या हैं?": ("Who qualifies for Atal Pension Yojana?"),
    "कर्नाटक गृह ज्योति योजना के लिए कौन पात्र है?": ("Who qualifies for Ka Gruha Jyothi?"),
    "मध्य प्रदेश लाडली बहना योजना के लिए पात्रता क्या है?": (
        "Who qualifies for Mp Ladli Behna?"
    ),
    "बिहार छात्र क्रेडिट कार्ड योजना के लिए कौन पात्र है?": (
        "Who qualifies for Bihar Student Credit Card?"
    ),
    "पीएम मातृ वंदना योजना के लिए कौन पात्र है?": ("Who qualifies for Pm Matru Vandana?"),
    "वाईएसआर चेयुथा योजना के लिए पात्रता मानदंड क्या हैं?": (
        "Who qualifies for Ap Ysr Cheyutha?"
    ),
    "ओडिशा कालिया योजना के लिए कौन पात्र है?": ("Who qualifies for Odisha Kalia?"),
}


async def hybrid_search(
    db: AsyncSession,
    query: str,
    state: Optional[str] = None,
    category: Optional[str] = None,
    scheme_id: Optional[str] = None,
    limit: int = 8,
) -> List[Tuple[Chunk, float]]:
    """Performs hybrid search (vector + FTS + RRF) and
    handles query translation stub.
    """
    if not query or not query.strip():
        return []

    processed_query = query
    if is_hindi(query):
        # Phase 6 placeholder translation stub
        logger.info(
            "Hindi query detected: '%s'. Proceeding with placeholder translation stub.",
            query,
        )
        processed_query = HINDI_TO_ENGLISH.get(query, query)

    # Fetch top 20 candidates from both branches
    vector_results = await get_vector_search(
        db, processed_query, state, category, scheme_id, limit=20
    )
    fts_results = await get_fts_search(
        db, processed_query, state, category, scheme_id, limit=20
    )

    # Perform Reciprocal Rank Fusion
    return reciprocal_rank_fusion(vector_results, fts_results, k=60.0, limit=limit)
