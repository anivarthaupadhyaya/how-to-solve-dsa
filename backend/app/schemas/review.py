"""Pydantic schemas for review queue and review submission."""

from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagRead

ReviewRating = Literal["forgot", "shaky", "easy"]


class SubjectSimpleRead(BaseModel):
    """Subject metadata attached to due review items."""
    id: int
    name: str
    color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DueItemRead(BaseModel):
    """Item due for review today, containing card prompt, answer, tags, and subject context."""
    user_item_id: int
    item_id: int
    subject_id: int
    type: str
    title: str
    prompt: Optional[str] = None
    answer: Optional[str] = None
    url: Optional[str] = None
    difficulty: Optional[str] = None
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: date
    tags: List[TagRead] = Field(default_factory=list)
    subject: SubjectSimpleRead


class ReviewSubmission(BaseModel):
    """Payload for submitting a review rating and duration."""
    rating: ReviewRating = Field(..., description="Recall rating: 'forgot', 'shaky', or 'easy'")
    time_taken_seconds: int = Field(0, ge=0, description="Time taken to recall/answer in seconds")


class ReviewLogRead(BaseModel):
    """Read schema for append-only review log entry."""
    id: int
    user_item_id: int
    rating: str
    time_taken_seconds: int
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewResultResponse(BaseModel):
    """Response returned upon submitting a review, showing updated scheduling state."""
    user_item_id: int
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: date
    review_log: ReviewLogRead
