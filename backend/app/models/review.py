"""UserItem review tracking and ReviewLog append-only history models."""

from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserItem(Base):
    """Spaced repetition state for a user's study item."""

    __tablename__ = "user_items"
    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_item"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    interval_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    repetitions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_items")
    item: Mapped["Item"] = relationship("Item", back_populates="user_items")
    review_logs: Mapped[List["ReviewLog"]] = relationship(
        "ReviewLog", back_populates="user_item", cascade="all, delete-orphan"
    )


class ReviewLog(Base):
    """Append-only log entry for each review attempt."""

    __tablename__ = "review_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[str] = mapped_column(String(20), nullable=False)  # 'forgot' | 'shaky' | 'easy'
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user_item: Mapped["UserItem"] = relationship("UserItem", back_populates="review_logs")
