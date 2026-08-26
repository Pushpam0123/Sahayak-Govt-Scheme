import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    full_name: Optional[str] = Field(None, max_length=255)
    organization_name: Optional[str] = Field(None, max_length=255)


class UserLoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str
    org_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    organization: Optional[OrganizationResponse] = None


class APIKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Friendly label for the API key")
    org_id: Optional[uuid.UUID] = Field(None, description="Associated organization ID (if any)")


class APIKeyCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    prefix: str
    api_key: str = Field(..., description="Plaintext API key — displayed ONLY ONCE upon creation")
    org_id: Optional[uuid.UUID] = None
    created_at: datetime


class APIKeyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    prefix: str
    org_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
