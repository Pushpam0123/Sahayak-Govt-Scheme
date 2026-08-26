import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.config import settings
from api.db import get_db
from api.models.auth import APIKey, Organization, User

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
admin_token_header = APIKeyHeader(name="X-Admin-Token", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


# --- Cryptographic Helpers ---

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with automatic salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def hash_api_key(key: str) -> str:
    """Returns the SHA-256 hex digest of an API key."""
    return hashlib.sha256(key.strip().encode("utf-8")).hexdigest()


def generate_api_key(prefix: str = "shk_live_") -> tuple[str, str, str]:
    """
    Generates a cryptographically secure random API key.
    Returns: (plaintext_key, key_prefix, key_hash)
    """
    random_part = secrets.token_hex(24)
    plaintext_key = f"{prefix}{random_part}"
    key_prefix = plaintext_key[:12]
    key_hash = hash_api_key(plaintext_key)
    return plaintext_key, key_prefix, key_hash


# --- JWT Token Management ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Issues a signed JWT access token."""
    if not settings.JWT_SECRET:
        raise ValueError("JWT_SECRET is not configured.")

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT token. Raises HTTPException(401) on failure."""
    if not settings.JWT_SECRET:
        raise ValueError("JWT_SECRET is not configured.")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token or signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Principal & Dependencies ---

@dataclass
class AuthPrincipal:
    user: Optional[User] = None
    organization: Optional[Organization] = None
    api_key: Optional[APIKey] = None
    auth_type: str = "jwt"  # "jwt" | "api_key" | "admin"


async def verify_admin_token(
    admin_token: Optional[str] = Security(admin_token_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> str:
    """Verifies that the caller has provided a valid ADMIN_TOKEN in constant time."""
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


async def get_current_principal(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    raw_api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> AuthPrincipal:
    """
    Unified dependency resolving caller from either JWT Bearer token or API Key.
    Supports:
    - Authorization: Bearer <jwt_token>
    - Authorization: Bearer shk_live_<key>
    - X-API-Key: shk_live_<key>
    """
    token_str = bearer.credentials if bearer else None
    key_str = raw_api_key or (token_str if token_str and token_str.startswith("shk_") else None)

    # 1. API Key Auth Path
    if key_str:
        hashed = hash_api_key(key_str)
        stmt = (
            select(APIKey)
            .options(selectinload(APIKey.organization))
            .where(APIKey.key_hash == hashed, APIKey.is_active == True)
        )
        result = await db.execute(stmt)
        api_key_rec = result.scalars().first()

        if not api_key_rec:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API key.",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Update last used timestamp
        api_key_rec.last_used_at = datetime.now(timezone.utc)
        await db.commit()

        return AuthPrincipal(
            organization=api_key_rec.organization,
            api_key=api_key_rec,
            auth_type="api_key",
        )

    # 2. JWT Bearer Auth Path
    if token_str:
        payload = decode_access_token(token_str)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing subject claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        stmt = (
            select(User)
            .options(selectinload(User.organization))
            .where(User.id == user_id, User.is_active == True)
        )
        result = await db.execute(stmt)
        user = result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found or deactivated.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthPrincipal(
            user=user,
            organization=user.organization,
            auth_type="jwt",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials required (Bearer JWT token or X-API-Key).",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    principal: AuthPrincipal = Depends(get_current_principal),
) -> User:
    """Requires an authenticated user identity."""
    if not principal.user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User identity required for this operation (API Key insufficient).",
        )
    return principal.user
