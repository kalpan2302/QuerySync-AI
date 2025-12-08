"""Authentication API routes."""

from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.db import get_db
from app.schemas.user import Token, UserCreate, UserLogin, UserOut
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_username,
)
from app.services.otp_service import (
    send_otp,
    verify_otp,
    is_email_verified,
    clear_otp,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class OTPRequest(BaseModel):
    """Request schema for OTP."""
    email: EmailStr


class OTPVerify(BaseModel):
    """Request schema for OTP verification."""
    email: EmailStr
    otp: str


class OTPResponse(BaseModel):
    """Response schema for OTP operations."""
    success: bool
    message: str


@router.post("/send-otp", response_model=OTPResponse)
async def request_otp(request: OTPRequest):
    """Send OTP to email for registration verification."""
    success = await send_otp(request.email)
    if success:
        return OTPResponse(
            success=True,
            message=f"OTP sent to {request.email}. Please check your inbox."
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please check email configuration."
        )


@router.post("/verify-otp", response_model=OTPResponse)
async def verify_email_otp(request: OTPVerify):
    """Verify OTP for email verification."""
    success, message = verify_otp(request.email, request.otp)
    if success:
        return OTPResponse(success=True, message=message)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new admin user. Requires OTP verification first."""
    # Check if email has been verified with OTP
    if not is_email_verified(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not verified. Please verify your email with OTP first."
        )

    # Check if email already exists
    existing_email = await get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = await get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    user = await create_user(db, user_data)

    # Clear OTP data after successful registration
    clear_otp(user_data.email)

    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login and get JWT access token."""
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    return Token(access_token=access_token)
