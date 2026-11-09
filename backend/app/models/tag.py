"""Tag and item_tags association models."""

from sqlalchemy import Column, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Many-to-many relationship table between items and tags
item_tags = Table(
    "item_tags",
    Base.metadata,
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """Tag entity scoped to a specific subject."""

    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("subject_id", "name", name="uq_subject_tag_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    subject: Mapped["Subject"] = relationship("Subject", back_populates="tags")
    items: Mapped[list["Item"]] = relationship(
        "Item", secondary=item_tags, back_populates="tags"
    )
