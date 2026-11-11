"""Router for subject tag management and item tag associations."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.tag import Tag
from app.models.user import User
from app.schemas.item import ItemRead
from app.schemas.tag import TagCreate, TagRead
from app.routers.items import get_user_item_or_404, serialize_item
from app.routers.subjects import get_user_subject

router = APIRouter(tags=["Tags"])


@router.get("/subjects/{subject_id}/tags", response_model=List[TagRead], summary="List tags for a subject")
def list_subject_tags(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Tag]:
    """Retrieve all tags scoped to a user's subject."""
    get_user_subject(subject_id, current_user.id, db)
    return db.query(Tag).filter(Tag.subject_id == subject_id).order_by(Tag.name.asc()).all()


@router.post(
    "/subjects/{subject_id}/tags",
    response_model=TagRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag within a subject",
)
def create_subject_tag(
    subject_id: int,
    tag_in: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Tag:
    """Create a new tag within the specified subject, enforcing uniqueness per subject."""
    get_user_subject(subject_id, current_user.id, db)

    clean_name = tag_in.name.strip().lower()
    existing = (
        db.query(Tag)
        .filter(Tag.subject_id == subject_id, Tag.name == clean_name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists in this subject",
        )

    tag = Tag(subject_id=subject_id, name=clean_name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.post(
    "/items/{item_id}/tags/{tag_id}",
    response_model=ItemRead,
    summary="Attach a tag to an item",
)
def attach_tag_to_item(
    item_id: int,
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Attach a subject-scoped tag to an item owned by the authenticated user."""
    item = get_user_item_or_404(item_id, current_user.id, db)

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    if tag.subject_id != item.subject_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag belongs to a different subject than the item",
        )

    if tag not in item.tags:
        item.tags.append(tag)
        db.commit()
        db.refresh(item)

    return serialize_item(item, current_user.id)


@router.delete(
    "/items/{item_id}/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Detach a tag from an item",
)
def detach_tag_from_item(
    item_id: int,
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Detach a tag from an item owned by the authenticated user."""
    item = get_user_item_or_404(item_id, current_user.id, db)

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    if tag in item.tags:
        item.tags.remove(tag)
        db.commit()
