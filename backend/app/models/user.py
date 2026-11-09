"""User model for authentication and data ownership."""

from datetime import datetime
from typing import List
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """User account entity."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    subjects: Mapped[List["Subject"]] = relationship(
        "Subject", back_populates="user", cascade="all, delete-orphan"
    )
    user_items: Mapped[List["UserItem"]] = relationship(
        "UserItem", back_populates="user", cascade="all, delete-orphan"
    )
