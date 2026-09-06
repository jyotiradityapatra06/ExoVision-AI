"""Application settings loaded from environment variables."""

import json
from dataclasses import dataclass, field
from os import getenv
from pathlib import Path
from secrets import token_urlsafe
from urllib.parse import urlsplit

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

    if not isinstance(parsed, list) or not parsed:
        raise RuntimeError("BACKEND_CORS_ORIGINS must be a JSON array of URLs")
    origins: list[str] = []
    for origin in parsed:
        if not isinstance(origin, str) or origin == "*":
            raise RuntimeError("BACKEND_CORS_ORIGINS must contain explicit URLs")
        parsed_origin = urlsplit(origin)
        if (
            parsed_origin.scheme not in {"http", "https"}
            or not parsed_origin.netloc
            or parsed_origin.path not in {"", "/"}
            or parsed_origin.query
            or parsed_origin.fragment
        ):
            raise RuntimeError("BACKEND_CORS_ORIGINS contains an invalid origin URL")
        origins.append(origin.rstrip("/"))
    return tuple(dict.fromkeys(origins))


def _positive_int(name: str, default: int) -> int:
    try:
        value = int(getenv(name, str(default)))
    except ValueError as error:
        raise RuntimeError(f"{name} must be a positive integer.") from error
    if value < 1:
        raise RuntimeError(f"{name} must be a positive integer.")
    return value


def _rate_limits() -> dict[str, tuple[int, int]]:
    """Return category limits as requests/window-seconds pairs."""
    defaults = {
        "auth": [10, 60],
        "analysis": [6, 60],
        "upload": [10, 3600],
        "report": [6, 60],
        "mast_search": [30, 60],
        "mast_download": [10, 60],
        "ml": [30, 60],
    }
    raw = getenv("RATE_LIMITS", json.dumps(defaults))
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as error:
        raise RuntimeError("RATE_LIMITS must be a JSON object.") from error
    if set(parsed) != set(defaults):
        raise RuntimeError("RATE_LIMITS must define every supported category.")
    result: dict[str, tuple[int, int]] = {}
    for category, values in parsed.items():
        if (
            not isinstance(values, list)
            or len(values) != 2
            or any(not isinstance(value, int) or value < 1 for value in values)
        ):
            raise RuntimeError(f"RATE_LIMITS.{category} must be [limit, seconds].")
        result[category] = (values[0], values[1])
    return result


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
    environment: str = field(default_factory=lambda: getenv("APP_ENV", "development"))
    jwt_secret: str = field(
        default_factory=lambda: getenv("JWT_SECRET", token_urlsafe(48))
    )
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = field(
        default_factory=lambda: int(getenv("ACCESS_TOKEN_MINUTES", "60"))
    )
    analysis_stale_minutes: int = field(
        default_factory=lambda: _positive_int("ANALYSIS_STALE_MINUTES", 30)
    )
    max_active_analyses_per_user: int = field(
        default_factory=lambda: _positive_int("MAX_ACTIVE_ANALYSES_PER_USER", 1)
    )
    max_upload_bytes: int = field(
        default_factory=lambda: _positive_int("MAX_UPLOAD_BYTES", 25 * 1024 * 1024)
    )
    max_analyses_per_user: int = field(
        default_factory=lambda: _positive_int("MAX_ANALYSES_PER_USER", 100)
    )
    max_storage_bytes_per_user: int = field(
        default_factory=lambda: _positive_int(
            "MAX_STORAGE_BYTES_PER_USER", 500 * 1024 * 1024
        )
    )
    trust_proxy_headers: bool = field(
        default_factory=lambda: getenv("TRUST_PROXY_HEADERS", "false").lower()
        in {"1", "true", "yes"}
    )
    rate_limits: dict[str, tuple[int, int]] = field(default_factory=_rate_limits)

    def __post_init__(self) -> None:
        """Reject unsafe authentication configuration at process startup."""
        if len(self.jwt_secret.encode("utf-8")) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 bytes.")
        if self.environment.lower() == "production" and not getenv("JWT_SECRET"):
            raise RuntimeError("JWT_SECRET is required when APP_ENV=production.")
        if self.environment.lower() == "production" and not getenv(
            "BACKEND_CORS_ORIGINS"
        ):
            raise RuntimeError(
                "BACKEND_CORS_ORIGINS is required when APP_ENV=production."
            )
        if self.access_token_minutes < 1:
            raise RuntimeError("ACCESS_TOKEN_MINUTES must be positive.")
        if not self.api_v1_prefix.startswith("/"):
            raise RuntimeError("API_V1_STR must start with '/'.")


settings = Settings()
