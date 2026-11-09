"""Item model representing cards ('problem' or 'qa')."""

from typing import List, Optional
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.tag import item_tags


class Item(Base):
    """Study card entity belonging to a subject."""

    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'problem' | 'qa'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    difficulty: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    subject: Mapped["Subject"] = relationship("Subject", back_populates="items")
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary=item_tags, back_populates="items"
    )
    user_items: Mapped[List["UserItem"]] = relationship(
        "UserItem", back_populates="item", cascade="all, delete-orphan"
    )
