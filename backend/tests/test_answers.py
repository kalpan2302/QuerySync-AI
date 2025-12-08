"""Tests for answers endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_answer_guest(client: AsyncClient):
    """Test creating an answer as a guest."""
    # Create a question first
    q_response = await client.post(
        "/api/v1/questions",
        json={"message": "Test question for answer"},
    )
    question_id = q_response.json()["id"]

    # Create answer
    response = await client.post(
        f"/api/v1/questions/{question_id}/answers",
        json={
            "message": "This is a helpful answer",
            "guest_name": "Helper",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "This is a helpful answer"
    assert data["guest_name"] == "Helper"
    assert data["question_id"] == question_id


@pytest.mark.asyncio
async def test_create_answer_empty_message(client: AsyncClient):
    """Test that empty answer messages are rejected."""
    # Create a question first
    q_response = await client.post(
        "/api/v1/questions",
        json={"message": "Test question"},
    )
    question_id = q_response.json()["id"]

    # Try to create empty answer
    response = await client.post(
        f"/api/v1/questions/{question_id}/answers",
        json={"message": "   "},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_answer_nonexistent_question(client: AsyncClient):
    """Test creating an answer for a nonexistent question."""
    response = await client.post(
        "/api/v1/questions/99999/answers",
        json={"message": "This won't work"},
    )
    assert response.status_code == 404
