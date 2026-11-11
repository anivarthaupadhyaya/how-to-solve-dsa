"""Reviews router for retrieving due study queue and submitting review ratings."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.item import Item
from app.models.review import ReviewLog, UserItem
from app.models.subject import Subject
from app.models.user import User
from app.schemas.review import (
    DueItemRead,
    ReviewLogRead,
    ReviewResultResponse,
    ReviewSubmission,
    SubjectSimpleRead,
)
from app.services.sm2 import next_state

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get(
    "/today",
    response_model=List[DueItemRead],
    summary="Get cards due for review today",
)
def get_due_reviews_today(
    subject_id: Optional[int] = Query(None, description="Optional subject ID to filter review queue"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[DueItemRead]:
    """Retrieve all study cards due on or before today for the authenticated user."""
    today = date.today()

    query = (
        db.query(UserItem)
        .join(Item, UserItem.item_id == Item.id)
        .join(Subject, Item.subject_id == Subject.id)
        .options(
            joinedload(UserItem.item).joinedload(Item.tags),
            joinedload(UserItem.item).joinedload(Item.subject),
        )
        .filter(
            UserItem.user_id == current_user.id,
            UserItem.next_review_date <= today,
        )
    )

    if subject_id is not None:
        query = query.filter(Item.subject_id == subject_id)

    due_user_items = query.order_by(UserItem.next_review_date.asc(), UserItem.id.asc()).all()

    results: List[DueItemRead] = []
    for ui in due_user_items:
        card = ui.item
        subj = card.subject
        results.append(
            DueItemRead(
                user_item_id=ui.id,
                item_id=card.id,
                subject_id=card.subject_id,
                type=card.type,
                title=card.title,
                prompt=card.prompt,
                answer=card.answer,
                url=card.url,
                difficulty=card.difficulty,
                ease_factor=ui.ease_factor,
                interval_days=ui.interval_days,
                repetitions=ui.repetitions,
                next_review_date=ui.next_review_date,
                tags=card.tags,
                subject=SubjectSimpleRead(
                    id=subj.id,
                    name=subj.name,
                    color=subj.color,
                ),
            )
        )

    return results


@router.post(
    "/{user_item_id}",
    response_model=ReviewResultResponse,
    summary="Submit a review rating for a study card",
)
def submit_review(
    user_item_id: int,
    submission: ReviewSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewResultResponse:
    """Submit recall rating ('forgot'/'shaky'/'easy') and duration, updating SM-2 state and appending review log."""
    user_item = (
        db.query(UserItem)
        .filter(UserItem.id == user_item_id, UserItem.user_id == current_user.id)
        .first()
    )
    if not user_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review item not found or does not belong to you",
        )

    # Compute updated SM-2 scheduling state
    updated_state = next_state(
        ease_factor=user_item.ease_factor,
        interval_days=user_item.interval_days,
        repetitions=user_item.repetitions,
        rating=submission.rating,
    )

    # Update state on user_item entity
    user_item.ease_factor = updated_state.ease_factor
    user_item.interval_days = updated_state.interval_days
    user_item.repetitions = updated_state.repetitions
    user_item.next_review_date = updated_state.next_review_date

    # Append-only audit entry in review_logs
    log_entry = ReviewLog(
        user_item_id=user_item.id,
        rating=submission.rating,
        time_taken_seconds=submission.time_taken_seconds,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(user_item)
    db.refresh(log_entry)

    return ReviewResultResponse(
        user_item_id=user_item.id,
        ease_factor=user_item.ease_factor,
        interval_days=user_item.interval_days,
        repetitions=user_item.repetitions,
        next_review_date=user_item.next_review_date,
        review_log=ReviewLogRead(
            id=log_entry.id,
            user_item_id=log_entry.user_item_id,
            rating=log_entry.rating,
            time_taken_seconds=log_entry.time_taken_seconds,
            reviewed_at=log_entry.reviewed_at,
        ),
    )
