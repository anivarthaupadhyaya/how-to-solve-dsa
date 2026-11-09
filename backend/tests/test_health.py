"""Tests for health check endpoint and CORS configuration."""

from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient):
    """Verify that GET /health returns HTTP 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_headers_on_health(client: TestClient):
    """Verify that CORS response headers are returned for allowed origins."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
