"""Pydantic schemas for learning analytics and reporting."""

from typing import List, Optional
from pydantic import BaseModel, Field


class TagAnalytics(BaseModel):
    """Performance metric for a single tag within a subject."""
    tag_id: int
    tag_name: str
    subject_id: int
    total_reviews: int = Field(..., description="Total review attempts on items tagged with this tag")
    successful_reviews: int = Field(..., description="Reviews rated 'shaky' or 'easy'")
    success_rate: float = Field(..., description="Ratio of successful reviews (0.0 to 1.0)")


class AnalyticsSummary(BaseModel):
    """High-level study summary statistics."""
    total_items: int = Field(..., description="Total number of study cards")
    due_today: int = Field(..., description="Number of cards due for review on or before today")
    reviews_this_week: int = Field(..., description="Count of reviews completed in the past 7 days")
    retention_rate: float = Field(..., description="Overall share of successful reviews ('shaky' or 'easy', 0.0 to 1.0)")
    total_reviews: int = Field(..., description="Total count of reviews completed all-time")
