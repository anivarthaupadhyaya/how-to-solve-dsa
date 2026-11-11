"""Tests for seed script idempotency and sample deck counts."""

from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.subject import Subject
from app.models.user import User
from scripts.seed import DEMO_EMAIL, OS_DECK, CN_DECK, DSA_DECK, seed_database


def test_seed_database_idempotency(db_session: Session, monkeypatch):
    """Verify that seed_database creates the demo decks and is safe to execute multiple times."""
    # Monkeypatch SessionLocal in seed module to use the test db_session
    import scripts.seed as seed_mod
    monkeypatch.setattr(seed_mod, "SessionLocal", lambda: db_session)

    # 1. First run
    summary1 = seed_database()
    assert summary1["os_items"] == len(OS_DECK) == 15
    assert summary1["cn_items"] == len(CN_DECK) == 15
    assert summary1["dsa_items"] == len(DSA_DECK) == 8
    assert summary1["total_cards"] == 38

    # Verify entities in DB
    user = db_session.query(User).filter(User.email == DEMO_EMAIL).first()
    assert user is not None

    subjects = db_session.query(Subject).filter(Subject.user_id == user.id).all()
    assert len(subjects) == 3

    items = db_session.query(Item).join(Subject).filter(Subject.user_id == user.id).all()
    assert len(items) == 38

    # 2. Second run: must not duplicate user, subjects, or items
    summary2 = seed_database()
    assert summary2["total_cards"] == 38

    users_count = db_session.query(User).filter(User.email == DEMO_EMAIL).count()
    assert users_count == 1

    subjects_count = db_session.query(Subject).filter(Subject.user_id == user.id).count()
    assert subjects_count == 3

    items_count = db_session.query(Item).join(Subject).filter(Subject.user_id == user.id).count()
    assert items_count == 38
