"""Subject model representing study categories (DSA, OS, CN, DBMS, etc.)."""

from typing import List, Optional
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Subject(Base):
    """Subject category owned by a user."""

    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="#4F46E5")

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subjects")
    items: Mapped[List["Item"]] = relationship(
        "Item", back_populates="subject", cascade="all, delete-orphan"
    )
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", back_populates="subject", cascade="all, delete-orphan"
    )
