"""Items router for card CRUD operations with ownership checks and query filters."""

import csv
from datetime import date
import io
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.item import Item
from app.models.review import UserItem
from app.models.subject import Subject
from app.models.tag import Tag
from app.models.user import User
from app.schemas.item import (
    ImportSummaryResponse,
    ItemCreate,
    ItemRead,
    ItemUpdate,
    RowError,
)

router = APIRouter(prefix="/items", tags=["Items"])


def get_user_item_or_404(item_id: int, user_id: int, db: Session) -> Item:
    """Retrieve an item by ID, confirming ownership via its subject."""
    item = (
        db.query(Item)
        .join(Subject, Item.subject_id == Subject.id)
        .options(joinedload(Item.tags), joinedload(Item.user_items))
        .filter(Item.id == item_id, Subject.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return item


def serialize_item(item: Item, user_id: int) -> dict:
    """Helper to convert Item ORM object into ItemRead schema dictionary."""
    user_item = next((ui for ui in item.user_items if ui.user_id == user_id), None)
    return {
        "id": item.id,
        "subject_id": item.subject_id,
        "type": item.type,
        "title": item.title,
        "prompt": item.prompt,
        "answer": item.answer,
        "url": item.url,
        "difficulty": item.difficulty,
        "tags": item.tags,
        "user_item": user_item,
    }


@router.get("", response_model=List[ItemRead], summary="List study items with optional filters")
def list_items(
    subject_id: Optional[int] = Query(None, description="Filter items by subject ID"),
    tag: Optional[str] = Query(None, description="Filter items by tag name"),
    type: Optional[str] = Query(None, description="Filter by card type ('problem' or 'qa')"),
    due: Optional[bool] = Query(None, description="Filter for cards due for review on or before today"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[dict]:
    """Retrieve items owned by current user with optional filtering by subject, tag, type, or due status."""
    query = (
        db.query(Item)
        .join(Subject, Item.subject_id == Subject.id)
        .options(joinedload(Item.tags), joinedload(Item.user_items))
        .filter(Subject.user_id == current_user.id)
    )

    if subject_id is not None:
        query = query.filter(Item.subject_id == subject_id)

    if type is not None:
        query = query.filter(Item.type == type)

    if tag is not None:
        query = query.filter(Item.tags.any(Tag.name == tag))

    if due is True:
        today = date.today()
        query = query.join(UserItem, (UserItem.item_id == Item.id) & (UserItem.user_id == current_user.id)).filter(
            UserItem.next_review_date <= today
        )

    items = query.order_by(Item.id.desc()).all()
    return [serialize_item(item, current_user.id) for item in items]


@router.post(
    "",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new study item and schedule its initial review",
)
def create_item(
    item_in: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Create a new study item (problem/qa) and initialize its user_items scheduling row."""
    # Enforce ownership: subject must belong to current user
    subject = (
        db.query(Subject)
        .filter(Subject.id == item_in.subject_id, Subject.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or does not belong to you",
        )

    item = Item(
        subject_id=item_in.subject_id,
        type=item_in.type,
        title=item_in.title,
        prompt=item_in.prompt,
        answer=item_in.answer,
        url=item_in.url,
        difficulty=item_in.difficulty,
    )

    if item_in.tag_ids:
        tags = (
            db.query(Tag)
            .filter(Tag.id.in_(item_in.tag_ids), Tag.subject_id == item_in.subject_id)
            .all()
        )
        item.tags = tags

    db.add(item)
    db.flush()  # Populates item.id before creating user_items

    # Per CONTEXT.md: Creating an item also creates its user_items row (next_review_date = today)
    user_item = UserItem(
        user_id=current_user.id,
        item_id=item.id,
        ease_factor=2.5,
        interval_days=0,
        repetitions=0,
        next_review_date=date.today(),
    )
    db.add(user_item)
    db.commit()
    db.refresh(item)

    return serialize_item(item, current_user.id)


@router.post(
    "/import",
    response_model=ImportSummaryResponse,
    summary="Bulk import items into a subject from a CSV file",
)
def import_items(
    subject_id: int = Form(..., description="Target subject ID to import into"),
    file: UploadFile = File(..., description="CSV file with columns: type,title,prompt,answer,url,difficulty,tags"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Bulk import items from CSV, validating per-row data and returning an import summary."""
    # Enforce subject ownership
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id, Subject.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or does not belong to you",
        )

    try:
        content_bytes = file.file.read()
        text = content_bytes.decode("utf-8-sig")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read or decode CSV file as UTF-8",
        )

    reader = csv.DictReader(io.StringIO(text))
    created_count = 0
    skipped_count = 0
    errors: List[dict] = []
    created_items: List[Item] = []

    # Map of existing tag names to Tag entities within this subject
    existing_tags = {
        t.name.lower(): t
        for t in db.query(Tag).filter(Tag.subject_id == subject_id).all()
    }

    # CSV row counting: row 1 is header, data rows start at index 2
    for row_idx, raw_row in enumerate(reader, start=2):
        row = {
            (k.strip().lower() if k else ""): (v.strip() if v else "")
            for k, v in raw_row.items()
        }

        item_type = row.get("type", "").lower()
        title = row.get("title", "")

        # Validation
        if not item_type or item_type not in ["problem", "qa"]:
            errors.append({
                "row": row_idx,
                "reason": f"Invalid item type '{item_type}'. Must be 'problem' or 'qa'",
            })
            skipped_count += 1
            continue

        if not title:
            errors.append({
                "row": row_idx,
                "reason": "Title is required",
            })
            skipped_count += 1
            continue

        prompt = row.get("prompt") or None
        answer = row.get("answer") or None
        url = row.get("url") or None
        difficulty = row.get("difficulty") or None

        # Process tags
        tags_str = row.get("tags") or ""
        tag_names = [t.strip().lower() for t in re.split(r"[,;]", tags_str) if t.strip()]
        matched_tags: List[Tag] = []

        for t_name in tag_names:
            if t_name not in existing_tags:
                new_tag = Tag(subject_id=subject_id, name=t_name)
                db.add(new_tag)
                db.flush()
                existing_tags[t_name] = new_tag
            matched_tags.append(existing_tags[t_name])

        item = Item(
            subject_id=subject_id,
            type=item_type,
            title=title,
            prompt=prompt,
            answer=answer,
            url=url,
            difficulty=difficulty,
            tags=matched_tags,
        )
        db.add(item)
        db.flush()

        user_item = UserItem(
            user_id=current_user.id,
            item_id=item.id,
            ease_factor=2.5,
            interval_days=0,
            repetitions=0,
            next_review_date=date.today(),
        )
        db.add(user_item)
        created_items.append(item)
        created_count += 1

    db.commit()

    return {
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors,
        "items": [serialize_item(it, current_user.id) for it in created_items],
    }


@router.get("/{item_id}", response_model=ItemRead, summary="Get item by ID")
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Retrieve card item details by ID ensuring ownership."""
    item = get_user_item_or_404(item_id, current_user.id, db)
    return serialize_item(item, current_user.id)


@router.patch("/{item_id}", response_model=ItemRead, summary="Update an existing item")
def update_item(
    item_id: int,
    item_in: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Update study item fields and tags with user ownership check."""
    item = get_user_item_or_404(item_id, current_user.id, db)

    if item_in.title is not None:
        item.title = item_in.title
    if item_in.type is not None:
        item.type = item_in.type
    if item_in.prompt is not None:
        item.prompt = item_in.prompt
    if item_in.answer is not None:
        item.answer = item_in.answer
    if item_in.url is not None:
        item.url = item_in.url
    if item_in.difficulty is not None:
        item.difficulty = item_in.difficulty

    if item_in.tag_ids is not None:
        tags = (
            db.query(Tag)
            .filter(Tag.id.in_(item_in.tag_ids), Tag.subject_id == item.subject_id)
            .all()
        )
        item.tags = tags

    db.commit()
    db.refresh(item)
    return serialize_item(item, current_user.id)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an item",
)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete an item and cascade delete its user_items scheduling state and tags association."""
    item = get_user_item_or_404(item_id, current_user.id, db)
    db.delete(item)
    db.commit()
