"""Password and JWT authentication service."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.models.user import User, UserRepository


class AccountExistsError(ValueError):
    """Raised when an email address is already registered."""


class InvalidCredentialsError(ValueError):
    """Raised when supplied credentials or a token are invalid."""


class AuthService:
    """Register users, verify Argon2 passwords, and issue signed JWTs."""

    def __init__(
        self,
        users: UserRepository,
        secret: str,
        *,
        algorithm: str = "HS256",
        access_token_minutes: int = 60,
    ) -> None:
        self.users = users
        self.secret = secret
        self.algorithm = algorithm
        self.access_token_minutes = access_token_minutes
        self.password_hash = PasswordHash.recommended()

    def register(self, email: str, display_name: str, password: str) -> User:
        """Create an account with a one-way Argon2id password hash."""
        try:
            return self.users.create(
                email=email,
                display_name=display_name,
                password_hash=self.password_hash.hash(password),
            )
        except sqlite3.IntegrityError as error:
            raise AccountExistsError(
                "An account with this email already exists."
            ) from error

    def authenticate(self, email: str, password: str) -> User:
        """Validate credentials without revealing which field failed."""
        user = self.users.by_email(email)
        if user is None or not self.password_hash.verify(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password.")
        return user

    def issue_token(self, user: User) -> tuple[str, int]:
        """Issue a time-limited JWT access token."""
        now = datetime.now(UTC)
        expires = now + timedelta(minutes=self.access_token_minutes)
        token = jwt.encode(
            {"sub": user.id, "iat": now, "exp": expires, "type": "access"},
            self.secret,
            algorithm=self.algorithm,
        )
        return token, self.access_token_minutes * 60

    def user_from_token(self, token: str) -> User:
        """Validate a JWT and resolve its current user."""
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            if payload.get("type") != "access" or not isinstance(
                payload.get("sub"), str
            ):
                raise InvalidCredentialsError("Invalid authentication token.")
        except jwt.PyJWTError as error:
            raise InvalidCredentialsError("Invalid authentication token.") from error
        user = self.users.by_id(payload["sub"])
        if user is None:
            raise InvalidCredentialsError("Invalid authentication token.")
        return user
