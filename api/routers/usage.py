from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.models.chat import QALog

router = APIRouter()


@router.get("/admin/usage")
async def get_usage_summary(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Returns aggregated token usage, cost audit, and request counts from qa_logs."""
    try:
        stmt = select(
            func.count(QALog.id).label("total_requests"),
            func.sum(QALog.tokens_in).label("total_tokens_in"),
            func.sum(QALog.tokens_out).label("total_tokens_out"),
            func.sum(QALog.estimated_cost_usd).label("total_cost_usd"),
            func.avg(QALog.latency_ms).label("avg_latency_ms"),
        )
        res = await db.execute(stmt)
        row = res.first()

        if not row or row.total_requests == 0:
            return {
                "total_requests": 0,
                "total_tokens_in": 0,
                "total_tokens_out": 0,
                "total_cost_usd": 0.0,
                "avg_latency_ms": 0.0,
            }

        return {
            "total_requests": row.total_requests or 0,
            "total_tokens_in": int(row.total_tokens_in or 0),
            "total_tokens_out": int(row.total_tokens_out or 0),
            "total_cost_usd": float(row.total_cost_usd or 0.0),
            "avg_latency_ms": float(row.avg_latency_ms or 0.0),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage: {str(e)}",
        )
