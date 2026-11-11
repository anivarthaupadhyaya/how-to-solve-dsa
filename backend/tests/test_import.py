"""Tests for CSV bulk import endpoint including valid, bad rows, and ownership enforcement."""

import io
from fastapi.testclient import TestClient


def create_subject(client: TestClient, headers: dict, name: str = "DSA") -> int:
    """Helper to create a subject."""
    res = client.post("/subjects", json={"name": name}, headers=headers)
    return res.json()["id"]


def test_csv_import_success(client: TestClient, user_a_headers: dict):
    """Test importing a valid CSV with problem, qa, and tags."""
    subject_id = create_subject(client, user_a_headers, "Algorithms")

    csv_content = (
        "type,title,prompt,answer,url,difficulty,tags\n"
        "problem,Two Sum,,,https://leetcode.com/problems/two-sum,Easy,\"array,hash-table\"\n"
        "qa,What is Big O?,\"Define Big O notation\",\"Asymptotic upper bound\",,,math;complexity\n"
    )

    files = {"file": ("items.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {"subject_id": subject_id}

    res = client.post("/items/import", data=data, files=files, headers=user_a_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == 2
    assert body["skipped"] == 0
    assert len(body["errors"]) == 0
    assert len(body["items"]) == 2

    # Check that tags were created and associated
    items = body["items"]
    two_sum = next(it for it in items if it["title"] == "Two Sum")
    assert two_sum["type"] == "problem"
    assert two_sum["difficulty"] == "Easy"
    assert any(t["name"] == "array" for t in two_sum["tags"])

    qa_item = next(it for it in items if it["title"] == "What is Big O?")
    assert qa_item["type"] == "qa"
    assert qa_item["prompt"] == "Define Big O notation"
    assert any(t["name"] == "complexity" for t in qa_item["tags"])


def test_csv_import_with_bad_rows(client: TestClient, user_a_headers: dict):
    """Test that CSV import processes valid rows and reports errors for invalid rows."""
    subject_id = create_subject(client, user_a_headers, "Mixed CSV")

    csv_content = (
        "type,title,prompt,answer,url,difficulty,tags\n"
        "problem,Valid Problem 1,,,https://example.com,Medium,tag1\n"
        "invalid_type,Bad Type Item,,,,,\n"
        "problem,,Missing title,,,,\n"
        "qa,Valid QA,Prompt,Answer,,,tag2\n"
    )

    files = {"file": ("mixed.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {"subject_id": subject_id}

    res = client.post("/items/import", data=data, files=files, headers=user_a_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == 2
    assert body["skipped"] == 2
    assert len(body["errors"]) == 2

    error_rows = [err["row"] for err in body["errors"]]
    assert 3 in error_rows  # invalid_type row
    assert 4 in error_rows  # missing title row


def test_csv_import_ownership_denied(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test user B cannot import items into user A's subject."""
    sub_a_id = create_subject(client, user_a_headers, "User A Sub")

    csv_content = "type,title,prompt,answer,url,difficulty,tags\nproblem,Hack Item,,,,,\n"
    files = {"file": ("items.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {"subject_id": sub_a_id}

    res = client.post("/items/import", data=data, files=files, headers=user_b_headers)
    assert res.status_code == 404
