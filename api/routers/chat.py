import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.services.chat import get_grounded_answer, stream_grounded_answer

logger = logging.getLogger("sahayak.chat")
router = APIRouter()


class ChatFilter(BaseModel):
    state: Optional[str] = None
    category: Optional[str] = None
    scheme_id: Optional[str] = None


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    filters: Optional[ChatFilter] = None


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Generates a grounded cited answer for the user query."""
    try:
        state = None
        category = None
        scheme_id = None
        if request.filters:
            state = request.filters.state
            category = request.filters.category
            scheme_id = request.filters.scheme_id

        result = await get_grounded_answer(
            db=db,
            query=request.question,
            state=state,
            category=category,
            scheme_id=scheme_id,
            session_id=request.session_id,
        )
        return result
    except Exception as e:
        logger.error("Chat generation failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat generation failed due to an internal processing error.",
        )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Streams a grounded cited answer via Server-Sent Events (SSE)."""
    state = None
    category = None
    scheme_id = None
    if request.filters:
        state = request.filters.state
        category = request.filters.category
        scheme_id = request.filters.scheme_id

    generator = stream_grounded_answer(
        db=db,
        query=request.question,
        state=state,
        category=category,
        scheme_id=scheme_id,
        session_id=request.session_id,
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
