"""Single-instance abuse controls and safe response middleware."""

from __future__ import annotations

import logging
from collections import defaultdict, deque
from threading import Lock
from time import monotonic
from uuid import uuid4

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.settings import settings

logger = logging.getLogger("exovision.security")


class InMemoryRateLimiter:
    """Thread-safe fixed-window limiter for one API process."""

    def __init__(self) -> None:
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, category: str, identity: str) -> int | None:
        limit, window = settings.rate_limits[category]
        now = monotonic()
        key = (category, identity)
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - window:
                events.popleft()
            if len(events) >= limit:
                return max(1, int(window - (now - events[0])) + 1)
            events.append(now)
        return None

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


rate_limiter = InMemoryRateLimiter()


def client_identity(request: Request) -> str:
    """Resolve a client IP, trusting forwarding only when explicitly configured."""
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        if forwarded:
            return forwarded
    return request.client.host if request.client else "unknown"


def authenticated_identity(user: object) -> str:
    """Return the stable user ID, tolerating lightweight dependency test doubles."""
    identifier = getattr(user, "id", None)
    if identifier is None and isinstance(user, dict):
        identifier = user.get("sub") or user.get("id")
    return str(identifier or "unknown")


def enforce_rate_limit(category: str, identity: str) -> None:
    retry_after = rate_limiter.check(category, identity)
    if retry_after is None:
        return
    logger.warning("rate_limit_rejected category=%s identity=%s", category, identity)
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please retry later.",
        headers={"Retry-After": str(retry_after)},
    )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach request correlation and conservative API security headers."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", "")
        if not request_id.isascii() or not request_id.isalnum() or len(request_id) > 64:
            request_id = uuid4().hex
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        if request.url.path.startswith(settings.api_v1_prefix):
            response.headers["Cache-Control"] = "no-store"
            response.headers["Pragma"] = "no-cache"
        return response
