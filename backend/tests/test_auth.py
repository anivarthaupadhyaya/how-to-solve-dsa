"""Unit and integration tests for authentication endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient):
    """Test successful user registration returns 201 and user info without password."""
    payload = {
        "email": "user@example.com",
        "password": "mypassword123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email_fails(client: TestClient):
    """Test registering with an existing email returns 400 Bad Request."""
    payload = {
        "email": "duplicate@example.com",
        "password": "password123",
    }
    first_res = client.post("/auth/register", json=payload)
    assert first_res.status_code == 201

    second_res = client.post("/auth/register", json=payload)
    assert second_res.status_code == 400
    assert second_res.json()["detail"] == "Email already registered"


def test_login_success(client: TestClient):
    """Test login with valid credentials returns JWT bearer access token."""
    register_payload = {
        "email": "loginuser@example.com",
        "password": "secretpassword",
    }
    client.post("/auth/register", json=register_payload)

    login_payload = {
        "email": "loginuser@example.com",
        "password": "secretpassword",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_login_wrong_password_fails(client: TestClient):
    """Test login with incorrect password returns 401 Unauthorized."""
    register_payload = {
        "email": "wrongpass@example.com",
        "password": "correctpassword",
    }
    client.post("/auth/register", json=register_payload)

    login_payload = {
        "email": "wrongpass@example.com",
        "password": "incorrectpassword",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unknown_user_fails(client: TestClient):
    """Test login with non-existent user returns 401 Unauthorized."""
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "somepassword",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_get_me_success(client: TestClient):
    """Test GET /auth/me returns current user info when valid token provided."""
    register_payload = {
        "email": "me@example.com",
        "password": "mypassword123",
    }
    reg_res = client.post("/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    login_res = client.post("/auth/login", json=register_payload)
    token = login_res.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "me@example.com"


def test_get_me_unauthorized_without_token(client: TestClient):
    """Test GET /auth/me without token returns 401 Unauthorized."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_get_me_unauthorized_with_invalid_token(client: TestClient):
    """Test GET /auth/me with an invalid token returns 401 Unauthorized."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert response.status_code == 401
