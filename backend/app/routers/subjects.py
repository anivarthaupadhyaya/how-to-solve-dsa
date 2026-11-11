"""Subjects router for category CRUD operations with user ownership enforcement."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["Subjects"])


def get_user_subject(subject_id: int, user_id: int, db: Session) -> Subject:
    """Retrieve a subject by ID ensuring ownership by the current user."""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == user_id,
    ).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )
    return subject


@router.get("", response_model=List[SubjectRead], summary="List all subjects for current user")
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Subject]:
    """Return all study subjects created by the authenticated user."""
    return db.query(Subject).filter(Subject.user_id == current_user.id).order_by(Subject.id.desc()).all()


@router.post(
    "",
    response_model=SubjectRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new study subject",
)
def create_subject(
    subject_in: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    """Create a new subject scoped to the authenticated user."""
    subject = Subject(
        user_id=current_user.id,
        name=subject_in.name,
        color=subject_in.color,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectRead, summary="Get subject details by ID")
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    """Retrieve details for a specific subject owned by the authenticated user."""
    return get_user_subject(subject_id, current_user.id, db)


@router.patch("/{subject_id}", response_model=SubjectRead, summary="Update an existing subject")
def update_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    """Update subject name or color with user ownership check."""
    subject = get_user_subject(subject_id, current_user.id, db)

    if subject_in.name is not None:
        subject.name = subject_in.name
    if subject_in.color is not None:
        subject.color = subject_in.color

    db.commit()
    db.refresh(subject)
    return subject


@router.delete(
    "/{subject_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a subject",
)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a subject and cascade delete associated items and tags."""
    subject = get_user_subject(subject_id, current_user.id, db)
    db.delete(subject)
    db.commit()
