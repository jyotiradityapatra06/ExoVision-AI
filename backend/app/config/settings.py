"""Application settings loaded from environment variables."""

import json
from dataclasses import dataclass
from os import getenv
from pathlib import Path
from secrets import token_urlsafe


def _cors_origins() -> tuple[str, ...]:
    """Parse the JSON-encoded CORS origin list."""
    raw_origins = getenv(
        "BACKEND_CORS_ORIGINS",
        '["http://localhost:3000"]',
    )
    try:
        parsed = json.loads(raw_origins)
    except json.JSONDecodeError as error:
        raise RuntimeError("BACKEND_CORS_ORIGINS must be a JSON array") from error

    if not isinstance(parsed, list) or not all(
        isinstance(origin, str) and origin for origin in parsed
    ):
        raise RuntimeError("BACKEND_CORS_ORIGINS must be a JSON array of URLs")
    return tuple(parsed)


@dataclass(frozen=True)
class Settings:
    """Runtime configuration for the Phase 1 API."""

    project_name: str = getenv("PROJECT_NAME", "ExoVision API")
    api_v1_prefix: str = getenv("API_V1_STR", "/api/v1")
    cors_origins: tuple[str, ...] = _cors_origins()
    upload_root: Path = Path(
        getenv(
            "UPLOAD_ROOT",
            str(Path(__file__).resolve().parents[3] / "data" / "uploads"),
        )
    )
    report_root: Path = Path(
        getenv(
            "REPORT_ROOT",
            str(Path(__file__).resolve().parents[3] / "data" / "reports"),
        )
    )
    database_path: Path = Path(
        getenv(
            "DATABASE_PATH",
            str(Path(__file__).resolve().parents[3] / "data" / "exovision.db"),
        )
    )
    jwt_secret: str = getenv("JWT_SECRET", token_urlsafe(48))
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = int(getenv("ACCESS_TOKEN_MINUTES", "60"))

    def __post_init__(self) -> None:
        """Reject unsafe authentication configuration at process startup."""
        if len(self.jwt_secret.encode("utf-8")) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 bytes.")
        if self.access_token_minutes < 1:
            raise RuntimeError("ACCESS_TOKEN_MINUTES must be positive.")


settings = Settings()
