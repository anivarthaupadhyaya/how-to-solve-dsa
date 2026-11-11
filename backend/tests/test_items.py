"""Tests for Item CRUD operations, scheduling state creation, and ownership enforcement."""

from datetime import date
from fastapi.testclient import TestClient


def create_subject(client: TestClient, headers: dict, name: str = "DSA") -> int:
    """Helper to create a test subject and return its ID."""
    res = client.post("/subjects", json={"name": name, "color": "#4F46E5"}, headers=headers)
    return res.json()["id"]


def test_create_problem_item_and_verify_user_item(client: TestClient, user_a_headers: dict):
    """Test creating a problem item creates both the item and its user_items scheduling row."""
    subject_id = create_subject(client, user_a_headers)

    payload = {
        "subject_id": subject_id,
        "type": "problem",
        "title": "Two Sum",
        "url": "https://leetcode.com/problems/two-sum",
        "difficulty": "Easy",
    }
    res = client.post("/items", json=payload, headers=user_a_headers)
    assert res.status_code == 201
    item = res.json()
    assert item["title"] == "Two Sum"
    assert item["type"] == "problem"
    assert item["url"] == "https://leetcode.com/problems/two-sum"
    assert item["difficulty"] == "Easy"

    # Verify user_item initialized for SM-2
    assert item["user_item"] is not None
    assert item["user_item"]["ease_factor"] == 2.5
    assert item["user_item"]["interval_days"] == 0
    assert item["user_item"]["repetitions"] == 0
    assert item["user_item"]["next_review_date"] == str(date.today())


def test_create_qa_item(client: TestClient, user_a_headers: dict):
    """Test creating a QA flashcard item."""
    subject_id = create_subject(client, user_a_headers, "OS")

    payload = {
        "subject_id": subject_id,
        "type": "qa",
        "title": "Process vs Thread",
        "prompt": "What is the difference between a process and a thread?",
        "answer": "A process has its own address space, while threads share address space.",
    }
    res = client.post("/items", json=payload, headers=user_a_headers)
    assert res.status_code == 201
    item = res.json()
    assert item["title"] == "Process vs Thread"
    assert item["prompt"] == payload["prompt"]
    assert item["answer"] == payload["answer"]


def test_cannot_create_item_in_other_user_subject(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test that user B cannot create an item in user A's subject."""
    a_subject_id = create_subject(client, user_a_headers)

    payload = {
        "subject_id": a_subject_id,
        "type": "problem",
        "title": "Unauthorized Item",
    }
    res = client.post("/items", json=payload, headers=user_b_headers)
    assert res.status_code == 404


def test_list_items_with_filters(client: TestClient, user_a_headers: dict):
    """Test filtering items by subject_id, type, tag, and due status."""
    sub1 = create_subject(client, user_a_headers, "Subject 1")
    sub2 = create_subject(client, user_a_headers, "Subject 2")

    # Item 1 in sub1 (problem)
    client.post(
        "/items",
        json={"subject_id": sub1, "type": "problem", "title": "Sub1 Prob", "difficulty": "Easy"},
        headers=user_a_headers,
    )
    # Item 2 in sub1 (qa)
    client.post(
        "/items",
        json={"subject_id": sub1, "type": "qa", "title": "Sub1 QA", "prompt": "P", "answer": "A"},
        headers=user_a_headers,
    )
    # Item 3 in sub2 (problem)
    client.post(
        "/items",
        json={"subject_id": sub2, "type": "problem", "title": "Sub2 Prob"},
        headers=user_a_headers,
    )

    # Filter by subject
    res_sub1 = client.get(f"/items?subject_id={sub1}", headers=user_a_headers).json()
    assert len(res_sub1) == 2

    # Filter by type
    res_qa = client.get(f"/items?type=qa", headers=user_a_headers).json()
    assert len(res_qa) == 1
    assert res_qa[0]["title"] == "Sub1 QA"

    # Filter by due status (all newly created items have next_review_date = today, so due=true returns all 3)
    res_due = client.get(f"/items?due=true", headers=user_a_headers).json()
    assert len(res_due) == 3


def test_item_ownership_checks(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test user B cannot read, update, or delete user A's items."""
    subject_id = create_subject(client, user_a_headers)
    item = client.post(
        "/items",
        json={"subject_id": subject_id, "type": "problem", "title": "User A Item"},
        headers=user_a_headers,
    ).json()
    item_id = item["id"]

    # User B read
    assert client.get(f"/items/{item_id}", headers=user_b_headers).status_code == 404

    # User B update
    patch_res = client.patch(
        f"/items/{item_id}",
        json={"title": "Hacked Title"},
        headers=user_b_headers,
    )
    assert patch_res.status_code == 404

    # User B delete
    assert client.delete(f"/items/{item_id}", headers=user_b_headers).status_code == 404

    # User A can delete successfully
    assert client.delete(f"/items/{item_id}", headers=user_a_headers).status_code == 204
