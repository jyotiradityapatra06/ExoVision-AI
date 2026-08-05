"""Application settings loaded from environment variables."""

import json
from dataclasses import dataclass, field
from os import getenv
from pathlib import Path
from secrets import token_urlsafe

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env", override=False)


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


def _path_setting(name: str, default: str) -> Path:
    """Resolve storage paths consistently, independent of process cwd."""
    configured = Path(getenv(name, default)).expanduser()
    return configured if configured.is_absolute() else PROJECT_ROOT / configured


@dataclass(frozen=True)
class Settings:
    """Runtime configuration for the ExoVision 1.0 API."""

    project_name: str = field(
        default_factory=lambda: getenv("PROJECT_NAME", "ExoVision AI API")
    )
    api_v1_prefix: str = field(default_factory=lambda: getenv("API_V1_STR", "/api/v1"))
    cors_origins: tuple[str, ...] = field(default_factory=_cors_origins)
    upload_root: Path = field(
        default_factory=lambda: _path_setting("UPLOAD_ROOT", "data/uploads")
    )
    report_root: Path = field(
        default_factory=lambda: _path_setting("REPORT_ROOT", "data/reports")
    )
    database_path: Path = field(
        default_factory=lambda: _path_setting("DATABASE_PATH", "data/exovision.db")
    )
    jwt_secret: str = field(
        default_factory=lambda: getenv("JWT_SECRET", token_urlsafe(48))
    )
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = field(
        default_factory=lambda: int(getenv("ACCESS_TOKEN_MINUTES", "60"))
    )

    def __post_init__(self) -> None:
        """Reject unsafe authentication configuration at process startup."""
        if len(self.jwt_secret.encode("utf-8")) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 bytes.")
        if self.access_token_minutes < 1:
            raise RuntimeError("ACCESS_TOKEN_MINUTES must be positive.")
        if not self.api_v1_prefix.startswith("/"):
            raise RuntimeError("API_V1_STR must start with '/'.")


settings = Settings()
