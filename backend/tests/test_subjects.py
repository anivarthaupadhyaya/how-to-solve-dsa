"""Tests for Subject CRUD operations and user ownership validation."""

from fastapi.testclient import TestClient


def test_create_and_get_subject(client: TestClient, user_a_headers: dict):
    """Test creating a subject and retrieving it by ID."""
    res = client.post(
        "/subjects",
        json={"name": "DSA", "color": "#3B82F6"},
        headers=user_a_headers,
    )
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "DSA"
    assert created["color"] == "#3B82F6"
    assert "id" in created

    # Retrieve by ID
    get_res = client.get(f"/subjects/{created['id']}", headers=user_a_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == created["id"]


def test_list_subjects_ownership_isolation(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test that users only see their own subjects."""
    client.post("/subjects", json={"name": "User A Subject"}, headers=user_a_headers)
    client.post("/subjects", json={"name": "User B Subject"}, headers=user_b_headers)

    a_subjects = client.get("/subjects", headers=user_a_headers).json()
    b_subjects = client.get("/subjects", headers=user_b_headers).json()

    assert len(a_subjects) == 1
    assert a_subjects[0]["name"] == "User A Subject"

    assert len(b_subjects) == 1
    assert b_subjects[0]["name"] == "User B Subject"


def test_subject_update(client: TestClient, user_a_headers: dict):
    """Test updating subject name and color."""
    created = client.post(
        "/subjects",
        json={"name": "Algorithms", "color": "#111111"},
        headers=user_a_headers,
    ).json()

    update_res = client.patch(
        f"/subjects/{created['id']}",
        json={"name": "Advanced Algorithms", "color": "#222222"},
        headers=user_a_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Advanced Algorithms"
    assert update_res.json()["color"] == "#222222"


def test_subject_ownership_access_denied(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test that user B cannot read, update, or delete user A's subject."""
    created = client.post(
        "/subjects",
        json={"name": "Private Subject A"},
        headers=user_a_headers,
    ).json()
    subject_id = created["id"]

    # User B cannot read
    get_res = client.get(f"/subjects/{subject_id}", headers=user_b_headers)
    assert get_res.status_code == 404

    # User B cannot update
    patch_res = client.patch(
        f"/subjects/{subject_id}",
        json={"name": "Hacked"},
        headers=user_b_headers,
    )
    assert patch_res.status_code == 404

    # User B cannot delete
    del_res = client.delete(f"/subjects/{subject_id}", headers=user_b_headers)
    assert del_res.status_code == 404


def test_delete_subject(client: TestClient, user_a_headers: dict):
    """Test deleting subject returns 204 and subject is removed."""
    created = client.post(
        "/subjects",
        json={"name": "To Delete"},
        headers=user_a_headers,
    ).json()

    del_res = client.delete(f"/subjects/{created['id']}", headers=user_a_headers)
    assert del_res.status_code == 204

    # Confirm it no longer exists
    get_res = client.get(f"/subjects/{created['id']}", headers=user_a_headers)
    assert get_res.status_code == 404
