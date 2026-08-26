import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db

logger = logging.getLogger("sahayak.health")
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
        logger.error("Database readiness check failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database readiness check failed.",
        )


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """General health check (retained for backward compatibility)."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error("Database health check failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed.",
        )
