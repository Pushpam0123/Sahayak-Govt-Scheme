import hashlib
import hmac
from typing import Optional

from fastapi import Depends, Header, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.db import get_db
from api.models.auth import APIKey

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
admin_token_header = APIKeyHeader(name="X-Admin-Token", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


def hash_api_key(key: str) -> str:
    """Returns SHA-256 hash of an API key."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


async def verify_admin_token(
    admin_token: Optional[str] = Security(admin_token_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> str:
    """Verifies that the caller has provided a valid ADMIN_TOKEN."""
    token = admin_token or (bearer.credentials if bearer else None)

    if not token or not settings.ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Constant-time comparison
    if not hmac.compare_digest(token.strip(), settings.ADMIN_TOKEN.strip()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unauthorized admin token.",
        )

    return token


async def get_optional_api_key(
    raw_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Optional[APIKey]:
    """Retrieves active API key record if provided, otherwise returns None."""
    if not raw_key:
        return None

    hashed = hash_api_key(raw_key.strip())
    stmt = select(APIKey).where(APIKey.key_hash == hashed, APIKey.is_active == True)
    res = await db.execute(stmt)
    return res.scalars().first()
