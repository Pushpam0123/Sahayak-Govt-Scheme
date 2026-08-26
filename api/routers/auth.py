import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.auth import (
    AuthPrincipal,
    create_access_token,
    generate_api_key,
    get_current_principal,
    get_current_user,
    hash_password,
    verify_password,
)
from api.config import settings
from api.db import get_db
from api.models.auth import APIKey, Organization, User
from api.schemas.auth import (
    APIKeyCreateRequest,
    APIKeyCreateResponse,
    APIKeyListItem,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def slugify(text: str) -> str:
    """Converts a string into a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text or str(uuid.uuid4())[:8]


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen or organization user",
)
async def register(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    # 1. Check if email is already taken
    existing_stmt = select(User).where(User.email == req.email.strip().lower())
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 2. Handle optional organization creation
    org_id: Optional[uuid.UUID] = None
    if req.organization_name and req.organization_name.strip():
        base_slug = slugify(req.organization_name)
        slug = base_slug
        counter = 1
        while True:
            slug_stmt = select(Organization).where(Organization.slug == slug)
            slug_res = await db.execute(slug_stmt)
            if not slug_res.scalars().first():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        org = Organization(name=req.organization_name.strip(), slug=slug)
        db.add(org)
        await db.flush()
        org_id = org.id

    # 3. Create user with hashed password
    hashed_pwd = hash_password(req.password)
    user = User(
        email=req.email.strip().lower(),
        password_hash=hashed_pwd,
        full_name=req.full_name.strip() if req.full_name else None,
        role="operator" if org_id else "citizen",
        org_id=org_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()

    # Re-fetch with relationships loaded
    fetch_stmt = select(User).options(selectinload(User.organization)).where(User.id == user.id)
    fetch_res = await db.execute(fetch_stmt)
    created_user = fetch_res.scalars().first()
    if created_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve created user record.",
        )
    return UserResponse.model_validate(created_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with email and password to receive a JWT access token",
)
async def login(
    req: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # Look up user
    stmt = select(User).where(User.email == req.email.strip().lower())
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account is inactive.",
        )

    # Issue signed JWT
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "org_id": str(user.org_id) if user.org_id else None,
    }
    access_token = create_access_token(token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
    )


@router.get(
    "/me",
    summary="Get details of the currently authenticated caller",
)
async def get_me(
    principal: AuthPrincipal = Depends(get_current_principal),
) -> Dict[str, Any]:
    if principal.auth_type == "jwt" and principal.user:
        return {
            "auth_type": "jwt",
            "user": {
                "id": str(principal.user.id),
                "email": principal.user.email,
                "full_name": principal.user.full_name,
                "role": principal.user.role,
                "created_at": principal.user.created_at.isoformat(),
            },
            "organization": {
                "id": str(principal.organization.id),
                "name": principal.organization.name,
                "slug": principal.organization.slug,
            }
            if principal.organization
            else None,
        }
    elif principal.auth_type == "api_key" and principal.api_key:
        return {
            "auth_type": "api_key",
            "api_key": {
                "id": str(principal.api_key.id),
                "name": principal.api_key.name,
                "prefix": principal.api_key.prefix,
                "created_at": principal.api_key.created_at.isoformat(),
            },
            "organization": {
                "id": str(principal.organization.id),
                "name": principal.organization.name,
                "slug": principal.organization.slug,
            }
            if principal.organization
            else None,
        }
    return {"auth_type": principal.auth_type}


@router.post(
    "/api-keys",
    response_model=APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key (plaintext key shown ONLY ONCE)",
)
async def create_new_api_key(
    req: APIKeyCreateRequest,
    principal: AuthPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db),
) -> APIKeyCreateResponse:
    # Resolve organization ownership
    org_id = req.org_id or (principal.organization.id if principal.organization else None)

    plaintext_key, key_prefix, key_hash = generate_api_key(prefix="shk_live_")

    api_key_rec = APIKey(
        key_hash=key_hash,
        prefix=key_prefix,
        name=req.name.strip(),
        org_id=org_id,
        is_active=True,
    )
    db.add(api_key_rec)
    await db.commit()
    await db.refresh(api_key_rec)

    return APIKeyCreateResponse(
        id=api_key_rec.id,
        name=api_key_rec.name,
        prefix=api_key_rec.prefix,
        api_key=plaintext_key,
        org_id=api_key_rec.org_id,
        created_at=api_key_rec.created_at,
    )


@router.get(
    "/api-keys",
    response_model=List[APIKeyListItem],
    summary="List API keys (plaintext keys are masked and impossible to retrieve)",
)
async def list_api_keys(
    principal: AuthPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db),
) -> List[APIKeyListItem]:
    stmt = select(APIKey)
    if principal.organization:
        stmt = stmt.where(APIKey.org_id == principal.organization.id)
    else:
        # Caller with no org can only see unassigned keys if any
        stmt = stmt.where(APIKey.org_id.is_(None))

    stmt = stmt.order_by(APIKey.created_at.desc())
    result = await db.execute(stmt)
    keys = result.scalars().all()
    return [APIKeyListItem.model_validate(k) for k in keys]
