"""Pure SM-2 (SuperMemo-2) spaced repetition scheduling service.

This module contains no FastAPI or database dependencies. It is completely deterministic
and pure, calculating interval progression, repetition count, ease factor adjustments,
and next review dates.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal, Optional

Rating = Literal["forgot", "shaky", "easy"]

MIN_EASE_FACTOR: float = 1.3
DEFAULT_EASE_FACTOR: float = 2.5


@dataclass(frozen=True)
class SM2State:
    """Represents the scheduling state of a card after applying SM-2."""

    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: date


def next_state(
    ease_factor: float,
    interval_days: int,
    repetitions: int,
    rating: Rating,
    today: Optional[date] = None,
) -> SM2State:
    """Calculate the next SM-2 review schedule based on the user's recall rating.

    Rules:
    - 'forgot':
        repetitions resets to 0, interval_days = 1, ease_factor = max(1.3, ease_factor - 0.2).
    - 'shaky' (q=3) or 'easy' (q=5):
        if repetitions == 0 -> interval = 1
        elif repetitions == 1 -> interval = 6
        else -> interval = round(previous_interval * ease_factor)
        repetitions += 1
        ease_factor = max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    - next_review_date = today + interval_days
    """
    if today is None:
        today = date.today()

    if rating == "forgot":
        new_repetitions = 0
        new_interval = 1
        new_ease = max(MIN_EASE_FACTOR, round(ease_factor - 0.2, 4))
    elif rating in ("shaky", "easy"):
        q = 3 if rating == "shaky" else 5

        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = int(round(interval_days * ease_factor))

        new_repetitions = repetitions + 1
        delta_ease = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        new_ease = max(MIN_EASE_FACTOR, round(ease_factor + delta_ease, 4))
    else:
        raise ValueError(f"Invalid rating: {rating}. Must be 'forgot', 'shaky', or 'easy'")

    new_review_date = today + timedelta(days=new_interval)

    return SM2State(
        ease_factor=new_ease,
        interval_days=new_interval,
        repetitions=new_repetitions,
        next_review_date=new_review_date,
    )
