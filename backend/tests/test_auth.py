"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testadmin",
            "email": "admin@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate emails are rejected."""
    # First registration
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "user1",
            "email": "duplicate@test.com",
            "password": "password123",
        },
    )

    # Second registration with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "user2",
            "email": "duplicate@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "logintest",
            "email": "login@test.com",
            "password": "password123",
        },
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
