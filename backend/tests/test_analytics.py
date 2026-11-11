"""Tests for analytics endpoints: tag performance and summary metrics."""

from fastapi.testclient import TestClient


def create_subject(client: TestClient, headers: dict, name: str = "DSA") -> int:
    """Helper to create subject."""
    res = client.post("/subjects", json={"name": name, "color": "#6366F1"}, headers=headers)
    return res.json()["id"]


def test_tag_analytics_weakest_first(client: TestClient, user_a_headers: dict):
    """Test that tags are returned sorted by weakest success rate first."""
    sub_id = create_subject(client, user_a_headers, "Algorithms")

    # Create two tags: 'dp' and 'greedy'
    dp_tag = client.post(f"/subjects/{sub_id}/tags", json={"name": "dp"}, headers=user_a_headers).json()
    greedy_tag = client.post(f"/subjects/{sub_id}/tags", json={"name": "greedy"}, headers=user_a_headers).json()

    # Item 1 with 'dp'
    dp_item = client.post(
        "/items",
        json={"subject_id": sub_id, "type": "problem", "title": "Coin Change", "tag_ids": [dp_tag["id"]]},
        headers=user_a_headers,
    ).json()

    # Item 2 with 'greedy'
    greedy_item = client.post(
        "/items",
        json={"subject_id": sub_id, "type": "problem", "title": "Activity Selection", "tag_ids": [greedy_tag["id"]]},
        headers=user_a_headers,
    ).json()

    # Get user_item IDs
    due = client.get("/reviews/today", headers=user_a_headers).json()
    dp_ui_id = next(d["user_item_id"] for d in due if d["item_id"] == dp_item["id"])
    greedy_ui_id = next(d["user_item_id"] for d in due if d["item_id"] == greedy_item["id"])

    # Review DP item with 'forgot' (0% success)
    client.post(f"/reviews/{dp_ui_id}", json={"rating": "forgot", "time_taken_seconds": 25}, headers=user_a_headers)

    # Review Greedy item with 'easy' (100% success)
    client.post(f"/reviews/{greedy_ui_id}", json={"rating": "easy", "time_taken_seconds": 10}, headers=user_a_headers)

    # Fetch tag analytics
    res = client.get(f"/analytics/tags?subject_id={sub_id}", headers=user_a_headers)
    assert res.status_code == 200
    tags = res.json()
    assert len(tags) == 2

    # Weakest first: DP (0.0) before Greedy (1.0)
    assert tags[0]["tag_name"] == "dp"
    assert tags[0]["success_rate"] == 0.0
    assert tags[0]["total_reviews"] == 1
    assert tags[0]["successful_reviews"] == 0

    assert tags[1]["tag_name"] == "greedy"
    assert tags[1]["success_rate"] == 1.0
    assert tags[1]["total_reviews"] == 1
    assert tags[1]["successful_reviews"] == 1


def test_analytics_summary_maths(client: TestClient, user_a_headers: dict):
    """Test calculation of total items, due items, weekly reviews, and retention rate."""
    sub_id = create_subject(client, user_a_headers, "System Design")

    # Initially empty
    empty_summary = client.get("/analytics/summary", headers=user_a_headers).json()
    assert empty_summary["total_items"] == 0
    assert empty_summary["due_today"] == 0
    assert empty_summary["reviews_this_week"] == 0
    assert empty_summary["retention_rate"] == 0.0

    # Add 2 items
    client.post(
        "/items",
        json={"subject_id": sub_id, "type": "qa", "title": "CAP Theorem", "prompt": "P", "answer": "A"},
        headers=user_a_headers,
    )
    client.post(
        "/items",
        json={"subject_id": sub_id, "type": "qa", "title": "Load Balancing", "prompt": "P", "answer": "A"},
        headers=user_a_headers,
    )

    # Before review: 2 items, 2 due today
    mid_summary = client.get("/analytics/summary", headers=user_a_headers).json()
    assert mid_summary["total_items"] == 2
    assert mid_summary["due_today"] == 2

    # Review 1 item as 'easy'
    due = client.get("/reviews/today", headers=user_a_headers).json()
    client.post(f"/reviews/{due[0]['user_item_id']}", json={"rating": "easy", "time_taken_seconds": 12}, headers=user_a_headers)

    # After 1 review: 2 items, 1 due today, 1 review this week, 1.0 retention rate
    final_summary = client.get("/analytics/summary", headers=user_a_headers).json()
    assert final_summary["total_items"] == 2
    assert final_summary["due_today"] == 1
    assert final_summary["reviews_this_week"] == 1
    assert final_summary["total_reviews"] == 1
    assert final_summary["retention_rate"] == 1.0


def test_analytics_ownership_isolation(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test user B cannot see user A's analytics metrics."""
    sub_a = create_subject(client, user_a_headers, "Private Sub")
    client.post("/items", json={"subject_id": sub_a, "type": "problem", "title": "Private Card"}, headers=user_a_headers)

    # User B cannot access User A's subject tag analytics
    res = client.get(f"/analytics/tags?subject_id={sub_a}", headers=user_b_headers)
    assert res.status_code == 404

    # User B summary shows 0 items
    b_summary = client.get("/analytics/summary", headers=user_b_headers).json()
    assert b_summary["total_items"] == 0
