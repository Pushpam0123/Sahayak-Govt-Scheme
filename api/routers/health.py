from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db

router = APIRouter()


@router.get("/healthz", status_code=status.HTTP_200_OK)
async def liveness_probe() -> Dict[str, str]:
    """Liveness probe: verifies the API process is alive and responding."""
    return {"status": "healthy"}


@router.get("/readyz", status_code=status.HTTP_200_OK)
async def readiness_probe(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Readiness probe: verifies the database connection is healthy."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database readiness check failed: {str(e)}",
        )


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """General health check (retained for backward compatibility)."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {str(e)}"
        )
