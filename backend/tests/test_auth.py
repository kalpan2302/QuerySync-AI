"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient

from app.services.otp_service import _otp_storage


def mock_email_verified(email: str):
    """Helper to mock email verification for tests."""
    _otp_storage[email] = {
        "otp": "1234",
        "expires_at": None,
        "verified": True,
    }


def clear_otp_storage():
    """Clear OTP storage between tests."""
    _otp_storage.clear()


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration with verified email."""
    clear_otp_storage()
    # Mock email verification
    mock_email_verified("admin@test.com")

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
async def test_register_without_otp(client: AsyncClient):
    """Test that registration without OTP verification fails."""
    clear_otp_storage()
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "nootp@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "Email not verified" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate emails are rejected."""
    clear_otp_storage()

    # First registration with verified email
    mock_email_verified("duplicate@test.com")
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "user1",
            "email": "duplicate@test.com",
            "password": "password123",
        },
    )

    # Second registration with same email (re-verify for the test)
    mock_email_verified("duplicate@test.com")
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
    clear_otp_storage()

    # Register first with verified email
    mock_email_verified("login@test.com")
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
