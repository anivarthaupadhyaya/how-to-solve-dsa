"""Pydantic schemas for subject category management."""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    """Base subject attributes."""
    name: str = Field(..., min_length=1, max_length=100, description="Subject name (e.g. DSA, OS, CN)")
    color: Optional[str] = Field("#4F46E5", max_length=50, description="Hex color or color identifier")


class SubjectCreate(SubjectBase):
    """Schema for creating a subject."""
    pass


class SubjectUpdate(BaseModel):
    """Schema for updating an existing subject."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=50)


class SubjectRead(SubjectBase):
    """Schema for reading subject details in responses."""
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
