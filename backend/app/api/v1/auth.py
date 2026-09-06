"""Version 1 account and session endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import CurrentUser, get_auth_service
from app.core.security import client_identity, enforce_rate_limit
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import (
    AccountExistsError,
    AuthService,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/auth", tags=["authentication"])
AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
def register(
    payload: RegisterRequest, service: AuthServiceDependency, request: Request
) -> TokenResponse:
    """Create an account and immediately establish a session."""
    enforce_rate_limit("auth", client_identity(request))
    try:
        user = service.register(payload.email, payload.display_name, payload.password)
    except AccountExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error
    return _token_response(service, user)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest, service: AuthServiceDependency, request: Request
) -> TokenResponse:
    """Exchange valid credentials for a bearer access token."""
    enforce_rate_limit("auth", client_identity(request))
    try:
        user = service.authenticate(payload.email, payload.password)
    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    return _token_response(service, user)


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser) -> UserResponse:
    """Return the authenticated account profile."""
    return _user_response(user)


def _token_response(service: AuthService, user: User) -> TokenResponse:
    token, expires_in = service.issue_token(user)
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=_user_response(user),
    )


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
    )
