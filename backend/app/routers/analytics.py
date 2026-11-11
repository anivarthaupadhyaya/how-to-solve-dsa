"""Analytics router providing learning metrics, per-tag performance, and summary statistics."""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.item import Item
from app.models.review import ReviewLog, UserItem
from app.models.subject import Subject
from app.models.tag import Tag, item_tags
from app.models.user import User
from app.schemas.analytics import (
    ActivityAnalytics,
    AnalyticsSummary,
    DailyActivity,
    TagAnalytics,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/tags",
    response_model=List[TagAnalytics],
    summary="Get per-tag review performance sorted weakest first",
)
def get_tag_analytics(
    subject_id: Optional[int] = Query(None, description="Optional subject ID to filter tags"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[TagAnalytics]:
    """Calculate total reviews and success rate for each tag, returning weakest tags first."""
    if subject_id is not None:
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

    # Aggregate review logs grouped by tag for the current user
    query = (
        db.query(
            Tag.id.label("tag_id"),
            Tag.name.label("tag_name"),
            Tag.subject_id.label("subject_id"),
            func.count(ReviewLog.id).label("total_reviews"),
            func.sum(
                case((ReviewLog.rating.in_(["shaky", "easy"]), 1), else_=0)
            ).label("successful_reviews"),
        )
        .join(Subject, Tag.subject_id == Subject.id)
        .outerjoin(item_tags, Tag.id == item_tags.c.tag_id)
        .outerjoin(Item, item_tags.c.item_id == Item.id)
        .outerjoin(
            UserItem,
            (UserItem.item_id == Item.id) & (UserItem.user_id == current_user.id),
        )
        .outerjoin(ReviewLog, UserItem.id == ReviewLog.user_item_id)
        .filter(Subject.user_id == current_user.id)
    )

    if subject_id is not None:
        query = query.filter(Tag.subject_id == subject_id)

    aggregated = query.group_by(Tag.id, Tag.name, Tag.subject_id).all()

    tag_stats: List[TagAnalytics] = []
    for row in aggregated:
        tot = row.total_reviews or 0
        succ = int(row.successful_reviews or 0)
        rate = round(succ / tot, 4) if tot > 0 else 0.0

        tag_stats.append(
            TagAnalytics(
                tag_id=row.tag_id,
                tag_name=row.tag_name,
                subject_id=row.subject_id,
                total_reviews=tot,
                successful_reviews=succ,
                success_rate=rate,
            )
        )

    # Sort weakest first: lowest success rate first; tiebreak by most reviews first
    tag_stats.sort(key=lambda t: (t.success_rate, -t.total_reviews, t.tag_name))

    return tag_stats


@router.get(
    "/summary",
    response_model=AnalyticsSummary,
    summary="Get overall learning stats, due cards, and retention rate",
)
def get_analytics_summary(
    subject_id: Optional[int] = Query(None, description="Optional subject ID filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    """Return high-level summary metrics: total items, due today, reviews this week, and retention rate."""
    if subject_id is not None:
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

    today = date.today()
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    # 1. Total items
    items_q = (
        db.query(func.count(Item.id))
        .join(Subject, Item.subject_id == Subject.id)
        .filter(Subject.user_id == current_user.id)
    )
    if subject_id is not None:
        items_q = items_q.filter(Item.subject_id == subject_id)
    total_items = items_q.scalar() or 0

    # 2. Due today
    due_q = (
        db.query(func.count(UserItem.id))
        .join(Item, UserItem.item_id == Item.id)
        .join(Subject, Item.subject_id == Subject.id)
        .filter(
            UserItem.user_id == current_user.id,
            UserItem.next_review_date <= today,
        )
    )
    if subject_id is not None:
        due_q = due_q.filter(Item.subject_id == subject_id)
    due_today = due_q.scalar() or 0

    # 3. Reviews this week
    week_q = (
        db.query(func.count(ReviewLog.id))
        .join(UserItem, ReviewLog.user_item_id == UserItem.id)
        .join(Item, UserItem.item_id == Item.id)
        .join(Subject, Item.subject_id == Subject.id)
        .filter(
            UserItem.user_id == current_user.id,
            ReviewLog.reviewed_at >= seven_days_ago,
        )
    )
    if subject_id is not None:
        week_q = week_q.filter(Item.subject_id == subject_id)
    reviews_this_week = week_q.scalar() or 0

    # 4. Total all-time reviews and retention rate
    all_rev_q = (
        db.query(
            func.count(ReviewLog.id).label("total"),
            func.sum(
                case((ReviewLog.rating.in_(["shaky", "easy"]), 1), else_=0)
            ).label("successful"),
        )
        .join(UserItem, ReviewLog.user_item_id == UserItem.id)
        .join(Item, UserItem.item_id == Item.id)
        .join(Subject, Item.subject_id == Subject.id)
        .filter(UserItem.user_id == current_user.id)
    )
    if subject_id is not None:
        all_rev_q = all_rev_q.filter(Item.subject_id == subject_id)

    rev_stats = all_rev_q.first()
    total_reviews = rev_stats.total if rev_stats and rev_stats.total else 0
    successful_reviews = int(rev_stats.successful) if rev_stats and rev_stats.successful else 0
    retention_rate = round(successful_reviews / total_reviews, 4) if total_reviews > 0 else 0.0

    return AnalyticsSummary(
        total_items=total_items,
        due_today=due_today,
        reviews_this_week=reviews_this_week,
        retention_rate=retention_rate,
        total_reviews=total_reviews,
    )


def compute_streaks(active_dates: set, today: date) -> tuple:
    """Calculate current and longest active study streaks in consecutive calendar days."""
    if not active_dates:
        return 0, 0

    sorted_dates = sorted(active_dates)

    # 1. Longest streak calculation
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i - 1]).days
        if diff == 1:
            current_run += 1
            if current_run > longest:
                longest = current_run
        elif diff > 1:
            current_run = 1

    # 2. Current streak calculation
    streak = 0
    check_day = today
    # If no reviews yet today, check if yesterday was active to preserve streak
    if check_day not in active_dates:
        check_day = today - timedelta(days=1)

    while check_day in active_dates:
        streak += 1
        check_day -= timedelta(days=1)

    return streak, longest


@router.get(
    "/activity",
    response_model=ActivityAnalytics,
    summary="Get daily review activity heatmap for the past 365 days and streaks",
)
def get_activity_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ActivityAnalytics:
    """Return daily review count for the last 365 days, current streak, and longest streak."""
    today = date.today()
    cutoff_date = today - timedelta(days=364)

    # Query all reviews for user
    all_logs = (
        db.query(ReviewLog.reviewed_at)
        .join(UserItem, ReviewLog.user_item_id == UserItem.id)
        .filter(UserItem.user_id == current_user.id)
        .all()
    )

    active_dates = set()
    date_counts = {}

    for (rev_at,) in all_logs:
        if rev_at:
            rev_date = rev_at.date() if isinstance(rev_at, datetime) else rev_at
            active_dates.add(rev_date)
            d_str = rev_date.isoformat()
            date_counts[d_str] = date_counts.get(d_str, 0) + 1

    current_streak, longest_streak = compute_streaks(active_dates, today)

    # Build 365-day array
    activity_timeline: List[DailyActivity] = []
    past_year_total = 0

    for i in range(365):
        day = cutoff_date + timedelta(days=i)
        d_str = day.isoformat()
        count = date_counts.get(d_str, 0)
        past_year_total += count
        activity_timeline.append(DailyActivity(date=d_str, count=count))

    return ActivityAnalytics(
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_reviews_past_year=past_year_total,
        activity=activity_timeline,
    )

