"""Authentication request and response schemas."""

from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
    """New account credentials."""

    email: str = Field(min_length=3, max_length=254)
    display_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        """Apply a dependency-free basic email format check."""
        normalized = value.strip().lower()
        local, separator, domain = normalized.partition("@")
        if not separator or not local or "." not in domain:
            raise ValueError("A valid email address is required.")
        return normalized


class LoginRequest(BaseModel):
    """Existing account credentials."""

    email: str
    password: str


class UserResponse(BaseModel):
    """Safe public user representation."""

    id: str
    email: str
    display_name: str
    created_at: str


class TokenResponse(BaseModel):
    """Bearer access token and authenticated user."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class AnalysisHistoryItem(BaseModel):
    """One user-owned dashboard history entry."""

    id: str
    filename: str
    status: str
    created_at: str
