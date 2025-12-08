"""Tests for questions endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_question_guest(client: AsyncClient):
    """Test creating a question as a guest."""
    response = await client.post(
        "/api/v1/questions",
        json={
            "message": "How do I reset my password?",
            "guest_name": "John Doe",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "How do I reset my password?"
    assert data["guest_name"] == "John Doe"
    assert data["status"] == "PENDING"
    assert data["user_id"] is None


@pytest.mark.asyncio
async def test_create_question_empty_message(client: AsyncClient):
    """Test that empty messages are rejected."""
    response = await client.post(
        "/api/v1/questions",
        json={
            "message": "   ",  # whitespace only
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_escalated_question(client: AsyncClient):
    """Test creating an escalated question."""
    response = await client.post(
        "/api/v1/questions",
        json={
            "message": "Urgent: System is down!",
            "is_escalated": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "ESCALATED"
    assert data["escalated_at"] is not None


@pytest.mark.asyncio
async def test_list_questions_ordering(client: AsyncClient):
    """Test that questions are ordered correctly (escalated first)."""
    # Create regular questions
    await client.post(
        "/api/v1/questions",
        json={"message": "Regular question 1"},
    )
    await client.post(
        "/api/v1/questions",
        json={"message": "Regular question 2"},
    )

    # Create escalated question
    await client.post(
        "/api/v1/questions",
        json={"message": "Escalated question", "is_escalated": True},
    )

    # Get all questions
    response = await client.get("/api/v1/questions")
    assert response.status_code == 200
    data = response.json()

    # Escalated should be first
    assert len(data) == 3
    assert data[0]["status"] == "ESCALATED"
    assert data[0]["message"] == "Escalated question"


@pytest.mark.asyncio
async def test_get_question_by_id(client: AsyncClient):
    """Test getting a specific question."""
    # Create a question
    create_response = await client.post(
        "/api/v1/questions",
        json={"message": "Test question for get"},
    )
    question_id = create_response.json()["id"]

    # Get the question
    response = await client.get(f"/api/v1/questions/{question_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == question_id
    assert data["message"] == "Test question for get"


@pytest.mark.asyncio
async def test_get_nonexistent_question(client: AsyncClient):
    """Test getting a question that doesn't exist."""
    response = await client.get("/api/v1/questions/99999")
    assert response.status_code == 404
