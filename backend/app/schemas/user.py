"""User and authentication Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for registering a new user."""
    password: str = Field(..., min_length=6, description="User password, minimum 6 characters")


class UserLogin(UserBase):
    """Schema for user login request."""
    password: str = Field(..., description="User password")


class UserRead(UserBase):
    """Public user schema returned in API responses."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """OAuth2 compatible bearer token response."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT token payload representation."""
    sub: Optional[str] = None
