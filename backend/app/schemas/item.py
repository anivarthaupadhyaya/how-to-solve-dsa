"""Pydantic schemas for study card item management."""

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagRead

ItemType = Literal["problem", "qa"]


class ItemBase(BaseModel):
    """Base attributes for a study card item."""
    type: ItemType = Field(..., description="Item type: 'problem' or 'qa'")
    title: str = Field(..., min_length=1, max_length=255, description="Card title or problem name")
    prompt: Optional[str] = Field(None, description="QA question prompt (used for QA items)")
    answer: Optional[str] = Field(None, description="QA answer (used for QA items)")
    url: Optional[str] = Field(None, max_length=500, description="Reference URL (e.g. LeetCode problem link)")
    difficulty: Optional[str] = Field(None, max_length=50, description="Difficulty level (e.g. Easy, Medium, Hard)")


class ItemCreate(ItemBase):
    """Schema for creating a card item."""
    subject_id: int = Field(..., description="Target subject ID")
    tag_ids: Optional[List[int]] = Field(default_factory=list, description="Optional tag IDs to attach")


class ItemUpdate(BaseModel):
    """Schema for updating an existing card item."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[ItemType] = None
    prompt: Optional[str] = None
    answer: Optional[str] = None
    url: Optional[str] = Field(None, max_length=500)
    difficulty: Optional[str] = Field(None, max_length=50)
    tag_ids: Optional[List[int]] = None


class UserItemStateRead(BaseModel):
    """Spaced repetition scheduling state embedded in item responses."""
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: date
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ItemRead(ItemBase):
    """Public card item schema returned in API responses."""
    id: int
    subject_id: int
    tags: List[TagRead] = Field(default_factory=list)
    user_item: Optional[UserItemStateRead] = None

    model_config = ConfigDict(from_attributes=True)


class RowError(BaseModel):
    """Details of a failed row during CSV import."""
    row: int = Field(..., description="Line number of the failed row (1-indexed)")
    reason: str = Field(..., description="Error explanation")


class ImportSummaryResponse(BaseModel):
    """Summary of bulk CSV import results."""
    created: int = Field(..., description="Number of items successfully created")
    skipped: int = Field(..., description="Number of rows skipped due to errors")
    errors: List[RowError] = Field(default_factory=list, description="Per-row error details")
    items: List[ItemRead] = Field(default_factory=list, description="List of created items")

