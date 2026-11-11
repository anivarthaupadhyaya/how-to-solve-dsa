"""Pytest fixtures and configuration with SQLite in-memory test database."""

from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.limiter import limiter
from app.main import app

# In-memory SQLite database with StaticPool ensures all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(autouse=True)
def setup_tables():
    """Create fresh schema for each test function and drop afterward."""
    Base.metadata.create_all(bind=test_engine)
    limiter.reset()
    yield
    Base.metadata.drop_all(bind=test_engine)
    limiter.reset()


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Yield a database session bound to the in-memory test engine."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a TestClient with get_db overridden to use test session."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_auth_headers(client: TestClient, email: str) -> dict:
    """Helper to register and login a test user, returning auth Bearer header."""
    client.post("/auth/register", json={"email": email, "password": "testpassword123"})
    login_res = client.post("/auth/login", json={"email": email, "password": "testpassword123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_a_headers(client: TestClient) -> dict:
    """Authentication headers for test User A."""
    return make_auth_headers(client, "user_a@example.com")


@pytest.fixture
def user_b_headers(client: TestClient) -> dict:
    """Authentication headers for test User B."""
    return make_auth_headers(client, "user_b@example.com")

