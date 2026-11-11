"""Pydantic schemas for subject tag management."""

from pydantic import BaseModel, ConfigDict, Field


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Tag name scoped to subject")


class TagCreate(TagBase):
    """Schema for creating a tag."""
    pass


class TagRead(TagBase):
    """Schema for reading tag details."""
    id: int
    subject_id: int

    model_config = ConfigDict(from_attributes=True)
