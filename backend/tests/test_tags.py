"""Tests for Tag CRUD operations, item tagging, and ownership checks."""

from fastapi.testclient import TestClient


def create_subject(client: TestClient, headers: dict, name: str = "DSA") -> int:
    """Helper to create subject."""
    res = client.post("/subjects", json={"name": name}, headers=headers)
    return res.json()["id"]


def test_create_and_list_tags(client: TestClient, user_a_headers: dict):
    """Test creating and listing tags within a subject."""
    sub_id = create_subject(client, user_a_headers)

    res1 = client.post(f"/subjects/{sub_id}/tags", json={"name": "Arrays"}, headers=user_a_headers)
    assert res1.status_code == 201
    assert res1.json()["name"] == "arrays"

    res2 = client.post(f"/subjects/{sub_id}/tags", json={"name": "Binary Search"}, headers=user_a_headers)
    assert res2.status_code == 201

    tags_res = client.get(f"/subjects/{sub_id}/tags", headers=user_a_headers)
    assert tags_res.status_code == 200
    tag_names = [t["name"] for t in tags_res.json()]
    assert "arrays" in tag_names
    assert "binary search" in tag_names


def test_duplicate_tag_in_same_subject_rejected(client: TestClient, user_a_headers: dict):
    """Test that creating duplicate tag in the same subject returns 400 Bad Request."""
    sub_id = create_subject(client, user_a_headers)

    res1 = client.post(f"/subjects/{sub_id}/tags", json={"name": "Graphs"}, headers=user_a_headers)
    assert res1.status_code == 201

    res2 = client.post(f"/subjects/{sub_id}/tags", json={"name": "graphs"}, headers=user_a_headers)
    assert res2.status_code == 400
    assert res2.json()["detail"] == "Tag already exists in this subject"


def test_attach_and_detach_tag_on_item(client: TestClient, user_a_headers: dict):
    """Test attaching and detaching tags on an item."""
    sub_id = create_subject(client, user_a_headers)

    # Create tag
    tag = client.post(f"/subjects/{sub_id}/tags", json={"name": "DP"}, headers=user_a_headers).json()
    tag_id = tag["id"]

    # Create item
    item = client.post(
        "/items",
        json={"subject_id": sub_id, "type": "problem", "title": "Climbing Stairs"},
        headers=user_a_headers,
    ).json()
    item_id = item["id"]

    # Attach tag
    attach_res = client.post(f"/items/{item_id}/tags/{tag_id}", headers=user_a_headers)
    assert attach_res.status_code == 200
    attached_tags = [t["name"] for t in attach_res.json()["tags"]]
    assert "dp" in attached_tags

    # Detach tag
    detach_res = client.delete(f"/items/{item_id}/tags/{tag_id}", headers=user_a_headers)
    assert detach_res.status_code == 204

    # Verify detached
    item_check = client.get(f"/items/{item_id}", headers=user_a_headers).json()
    assert len(item_check["tags"]) == 0


def test_tag_ownership_isolation(
    client: TestClient,
    user_a_headers: dict,
    user_b_headers: dict,
):
    """Test user B cannot access user A's tags or attach tags across subjects."""
    sub_a = create_subject(client, user_a_headers, "Subject A")
    sub_b = create_subject(client, user_b_headers, "Subject B")

    tag_a = client.post(f"/subjects/{sub_a}/tags", json={"name": "Tree"}, headers=user_a_headers).json()

    # User B cannot list user A's subject tags
    assert client.get(f"/subjects/{sub_a}/tags", headers=user_b_headers).status_code == 404

    # User B item
    item_b = client.post(
        "/items",
        json={"subject_id": sub_b, "type": "problem", "title": "B Problem"},
        headers=user_b_headers,
    ).json()

    # Cannot attach User A's tag to User B's item
    attach_res = client.post(f"/items/{item_b['id']}/tags/{tag_a['id']}", headers=user_b_headers)
    assert attach_res.status_code == 400
