"""Unit tests for pure SM-2 algorithm scheduling rules."""

from datetime import date, timedelta
import pytest

from app.services.sm2 import (
    MIN_EASE_FACTOR,
    DEFAULT_EASE_FACTOR,
    next_state,
)


def test_forgot_resets_repetitions_and_interval():
    """Rating 'forgot' must reset repetitions to 0 and interval to 1 day."""
    today = date(2026, 1, 15)
    # Card that had reached high repetitions and long interval
    state = next_state(
        ease_factor=2.5,
        interval_days=45,
        repetitions=4,
        rating="forgot",
        today=today,
    )
    assert state.repetitions == 0
    assert state.interval_days == 1
    assert state.ease_factor == 2.3
    assert state.next_review_date == today + timedelta(days=1)


def test_forgot_respects_ease_floor():
    """Rating 'forgot' must never reduce ease factor below the minimum floor of 1.3."""
    today = date(2026, 1, 15)

    # Near floor (1.4 - 0.2 = 1.2 -> should floor at 1.3)
    state1 = next_state(
        ease_factor=1.4,
        interval_days=10,
        repetitions=2,
        rating="forgot",
        today=today,
    )
    assert state1.ease_factor == MIN_EASE_FACTOR

    # Already at floor (1.3 - 0.2 = 1.1 -> should remain 1.3)
    state2 = next_state(
        ease_factor=1.3,
        interval_days=1,
        repetitions=0,
        rating="forgot",
        today=today,
    )
    assert state2.ease_factor == MIN_EASE_FACTOR


def test_first_repetition_interval_is_one():
    """When repetitions == 0, rating 'shaky' or 'easy' must yield interval == 1."""
    today = date(2026, 3, 1)

    state_shaky = next_state(2.5, 0, 0, "shaky", today=today)
    assert state_shaky.repetitions == 1
    assert state_shaky.interval_days == 1
    assert state_shaky.next_review_date == today + timedelta(days=1)

    state_easy = next_state(2.5, 0, 0, "easy", today=today)
    assert state_easy.repetitions == 1
    assert state_easy.interval_days == 1
    assert state_easy.next_review_date == today + timedelta(days=1)


def test_second_repetition_interval_is_six():
    """When repetitions == 1, rating 'shaky' or 'easy' must yield interval == 6."""
    today = date(2026, 3, 1)

    state_shaky = next_state(2.5, 1, 1, "shaky", today=today)
    assert state_shaky.repetitions == 2
    assert state_shaky.interval_days == 6
    assert state_shaky.next_review_date == today + timedelta(days=6)

    state_easy = next_state(2.5, 1, 1, "easy", today=today)
    assert state_easy.repetitions == 2
    assert state_easy.interval_days == 6
    assert state_easy.next_review_date == today + timedelta(days=6)


def test_subsequent_repetition_interval_growth():
    """When repetitions >= 2, interval = round(previous_interval * ease_factor)."""
    today = date(2026, 3, 1)
    # reps = 2, interval = 6, ease = 2.6 -> 6 * 2.6 = 15.6 -> round = 16
    state = next_state(
        ease_factor=2.6,
        interval_days=6,
        repetitions=2,
        rating="easy",
        today=today,
    )
    assert state.repetitions == 3
    assert state.interval_days == 16
    assert state.ease_factor == 2.7
    assert state.next_review_date == today + timedelta(days=16)


def test_shaky_rating_ease_adjustment():
    """Rating 'shaky' (q=3) must adjust ease by 0.1 - (5-3)*(0.08 + (5-3)*0.02) = -0.14."""
    today = date(2026, 1, 1)
    state = next_state(2.5, 6, 2, "shaky", today=today)
    assert state.ease_factor == 2.36


def test_easy_rating_ease_adjustment():
    """Rating 'easy' (q=5) must adjust ease by +0.10."""
    today = date(2026, 1, 1)
    state = next_state(2.5, 6, 2, "easy", today=today)
    assert state.ease_factor == 2.6


def test_interval_growth_over_multiple_reviews():
    """Verify exponential interval progression over several successful consecutive reviews."""
    today = date(2026, 5, 1)

    # Initial card creation state
    ease = DEFAULT_EASE_FACTOR
    interval = 0
    reps = 0

    # 1st review: easy -> interval = 1, reps = 1, ease = 2.6
    s1 = next_state(ease, interval, reps, "easy", today)
    assert s1.interval_days == 1
    assert s1.repetitions == 1
    assert s1.ease_factor == 2.6

    # 2nd review: easy -> interval = 6, reps = 2, ease = 2.7
    s2 = next_state(s1.ease_factor, s1.interval_days, s1.repetitions, "easy", today)
    assert s2.interval_days == 6
    assert s2.repetitions == 2
    assert s2.ease_factor == 2.7

    # 3rd review: easy -> round(6 * 2.7) = 16, reps = 3, ease = 2.8
    s3 = next_state(s2.ease_factor, s2.interval_days, s2.repetitions, "easy", today)
    assert s3.interval_days == 16
    assert s3.repetitions == 3
    assert s3.ease_factor == 2.8

    # 4th review: easy -> round(16 * 2.8) = round(44.8) = 45, reps = 4, ease = 2.9
    s4 = next_state(s3.ease_factor, s3.interval_days, s3.repetitions, "easy", today)
    assert s4.interval_days == 45
    assert s4.repetitions == 4
    assert s4.ease_factor == 2.9

    # 5th review: easy -> round(45 * 2.9) = round(130.5) = 130 (Python round-half-to-even)
    s5 = next_state(s4.ease_factor, s4.interval_days, s4.repetitions, "easy", today)
    assert s5.interval_days == 130
    assert s5.repetitions == 5
    assert s5.ease_factor == 3.0


def test_repeated_shaky_drops_ease_to_floor():
    """Verify that successive 'shaky' reviews decrease ease factor until bounded at 1.3."""
    today = date(2026, 1, 1)
    ease = 1.5
    interval = 6
    reps = 2

    # Review 1: 1.5 - 0.14 = 1.36
    s1 = next_state(ease, interval, reps, "shaky", today)
    assert s1.ease_factor == 1.36

    # Review 2: 1.36 - 0.14 = 1.22 -> bounded at 1.3
    s2 = next_state(s1.ease_factor, s1.interval_days, s1.repetitions, "shaky", today)
    assert s2.ease_factor == MIN_EASE_FACTOR


def test_invalid_rating_raises_exception():
    """Passing an unaccepted rating value must raise ValueError."""
    with pytest.raises(ValueError):
        next_state(2.5, 0, 0, "unknown_rating")  # type: ignore
