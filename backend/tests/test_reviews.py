"""Tests for Review endpoints: due queue retrieval and review submission."""

from datetime import date, timedelta
from fastapi.testclient import TestClient


def create_subject(client: TestClient, headers: dict, name: str = "DSA") -> int:
    """Helper to create a study subject."""
    res = client.post("/subjects", json={"name": name, "color": "#10B981"}, headers=headers)
    return res.json()["id"]


def test_get_reviews_today(client: TestClient, user_a_headers: dict):
    """Test GET /reviews/today returns due items with prompts, answers, tags, and subject info."""
    sub_id = create_subject(client, user_a_headers, "Algorithms")

    # Tag
    tag = client.post(f"/subjects/{sub_id}/tags", json={"name": "Graphs"}, headers=user_a_headers).json()

    # Create problem item
    prob_item = client.post(
        "/items",
        json={
            "subject_id": sub_id,
            "type": "problem",
            "title": "Course Schedule",
            "url": "https://leetcode.com/problems/course-schedule",
            "difficulty": "Medium",
            "tag_ids": [tag["id"]],
        },
        headers=user_a_headers,
    ).json()

    # Create QA item
    qa_item = client.post(
        "/items",
        json={
            "subject_id": sub_id,
            "type": "qa",
            "title": "Topological Sort",
            "prompt": "What is topological sorting?",
            "answer": "Linear ordering of vertices in a DAG.",
        },
        headers=user_a_headers,
    ).json()

    res = client.get("/reviews/today", headers=user_a_headers)
    assert res.status_code == 200
    due_items = res.json()
    assert len(due_items) == 2

    # Check problem item serialization
    due_prob = next(d for d in due_items if d["item_id"] == prob_item["id"])
    assert due_prob["title"] == "Course Schedule"
    assert due_prob["type"] == "problem"
    assert due_prob["url"] == "https://leetcode.com/problems/course-schedule"
    assert due_prob["difficulty"] == "Medium"
    assert len(due_prob["tags"]) == 1
    assert due_prob["tags"][0]["name"] == "graphs"
    assert due_prob["subject"]["name"] == "Algorithms"
    assert due_prob["subject"]["color"] == "#10B981"

    # Check QA item serialization
    due_qa = next(d for d in due_items if d["item_id"] == qa_item["id"])
    assert due_qa["title"] == "Topological Sort"
    assert due_qa["type"] == "qa"
    assert due_qa["prompt"] == "What is topological sorting?"
    assert due_qa["answer"] == "Linear ordering of vertices in a DAG."


def test_get_reviews_today_filtered_by_subject(client: TestClient, user_a_headers: dict):
    """Test filtering today's review queue by subject_id."""
    sub1_id = create_subject(client, user_a_headers, "Subject One")
    sub2_id = create_subject(client, user_a_headers, "Subject Two")

    client.post(
        "/items",
        json={"subject_id": sub1_id, "type": "problem", "title": "Item 1"},
        headers=user_a_headers,
    )
    client.post(
        "/items",
        json={"subject_id": sub2_id, "type": "problem", "title": "Item 2"},
        headers=user_a_headers,
    )

    res_sub1 = client.get(f"/reviews/today?subject_id={sub1_id}", headers=user_a_headers)
    assert res_sub1.status_code == 200
    items_sub1 = res_sub1.json()
    assert len(items_sub1) == 1
    assert items_sub1[0]["title"] == "Item 1"


def test_reviews_today_ownership_isolation(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test that users only see their own due items in /reviews/today."""
    sub_a = create_subject(client, user_a_headers, "Sub A")
    sub_b = create_subject(client, user_b_headers, "Sub B")

    client.post("/items", json={"subject_id": sub_a, "type": "problem", "title": "Card A"}, headers=user_a_headers)
    client.post("/items", json={"subject_id": sub_b, "type": "problem", "title": "Card B"}, headers=user_b_headers)

    a_due = client.get("/reviews/today", headers=user_a_headers).json()
    b_due = client.get("/reviews/today", headers=user_b_headers).json()

    assert len(a_due) == 1
    assert a_due[0]["title"] == "Card A"

    assert len(b_due) == 1
    assert b_due[0]["title"] == "Card B"


def test_submit_review_easy_updates_sm2_and_appends_log(client: TestClient, user_a_headers: dict):
    """Test submitting rating 'easy' advances interval, updates repetitions, and records log."""
    sub_id = create_subject(client, user_a_headers, "OS")
    item = client.post(
        "/items",
        json={"subject_id": sub_id, "type": "qa", "title": "Deadlock", "prompt": "P", "answer": "A"},
        headers=user_a_headers,
    ).json()

    user_item_id = item["user_item"]["user_item_id"] if "user_item_id" in item["user_item"] else None
    if not user_item_id:
        # Retrieve from /reviews/today
        due = client.get("/reviews/today", headers=user_a_headers).json()
        user_item_id = due[0]["user_item_id"]

    review_res = client.post(
        f"/reviews/{user_item_id}",
        json={"rating": "easy", "time_taken_seconds": 15},
        headers=user_a_headers,
    )
    assert review_res.status_code == 200
    res_data = review_res.json()

    assert res_data["user_item_id"] == user_item_id
    assert res_data["ease_factor"] == 2.6
    assert res_data["interval_days"] == 1
    assert res_data["repetitions"] == 1
    assert res_data["next_review_date"] == str(date.today() + timedelta(days=1))

    # Verify review log entry
    log = res_data["review_log"]
    assert log["rating"] == "easy"
    assert log["time_taken_seconds"] == 15
    assert "reviewed_at" in log

    # Once reviewed for tomorrow, the card should no longer be due today
    due_after = client.get("/reviews/today", headers=user_a_headers).json()
    assert len(due_after) == 0


def test_submit_review_forgot_resets_repetitions(client: TestClient, user_a_headers: dict):
    """Test submitting rating 'forgot' resets repetition count and reduces ease factor."""
    sub_id = create_subject(client, user_a_headers, "CN")
    client.post(
        "/items",
        json={"subject_id": sub_id, "type": "qa", "title": "DNS", "prompt": "P", "answer": "A"},
        headers=user_a_headers,
    )

    due = client.get("/reviews/today", headers=user_a_headers).json()
    user_item_id = due[0]["user_item_id"]

    # First review: easy (reps=1, interval=1, ease=2.6)
    client.post(f"/reviews/{user_item_id}", json={"rating": "easy", "time_taken_seconds": 5}, headers=user_a_headers)

    # Second review: forgot -> reps reset to 0, interval = 1, ease = 2.6 - 0.2 = 2.4
    forgot_res = client.post(
        f"/reviews/{user_item_id}",
        json={"rating": "forgot", "time_taken_seconds": 20},
        headers=user_a_headers,
    )
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    assert forgot_data["repetitions"] == 0
    assert forgot_data["interval_days"] == 1
    assert forgot_data["ease_factor"] == 2.4


def test_submit_review_ownership_denied(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test user B cannot submit a review for user A's study item."""
    sub_id = create_subject(client, user_a_headers)
    client.post("/items", json={"subject_id": sub_id, "type": "problem", "title": "Prob A"}, headers=user_a_headers)

    due = client.get("/reviews/today", headers=user_a_headers).json()
    user_item_id = due[0]["user_item_id"]

    res = client.post(
        f"/reviews/{user_item_id}",
        json={"rating": "easy", "time_taken_seconds": 10},
        headers=user_b_headers,
    )
    assert res.status_code == 404
