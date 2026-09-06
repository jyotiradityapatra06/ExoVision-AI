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

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        """Reject names that become empty after normalization."""
        normalized = value.strip()
        if not normalized:
            raise ValueError("Display name cannot be blank.")
        return normalized


class LoginRequest(BaseModel):
    """Existing account credentials."""

    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


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
    """One user-owned legacy history entry."""

    id: str
    filename: str
    status: str
    created_at: str


class AnalysisSummaryItem(BaseModel):
    """One lightweight user-owned dashboard history entry."""

    id: str
    filename: str
    status: str
    stage: str
    created_at: str
    updated_at: str
    processing_started_at: str | None = None
    safe_error: str | None = None
    candidate_detected: bool | None = None
    classification: str | None = None
    model_score: float | None = None
    period_days: float | None = None
    depth: float | None = None
    duration_days: float | None = None
    transit_snr: float | None = None


class AnalysisHistoryCounts(BaseModel):
    """Truthful status totals for the authenticated user's workspace."""

    total: int
    completed: int
    processing: int
    failed: int


class AnalysisHistoryPage(BaseModel):
    """A bounded page of lightweight dashboard summaries."""

    items: list[AnalysisSummaryItem]
    counts: AnalysisHistoryCounts
    total: int
    limit: int
    offset: int
