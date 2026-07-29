"""Unit tests for backend health and root endpoints."""

from app.main import get_health, read_root


def test_read_root() -> None:
    """Test root endpoint returns 200 OK welcome message."""
    response = read_root()
    assert response == {"message": "Welcome to ExoVision API"}


def test_health_check() -> None:
    """Test health check endpoint returns exact Phase 1 status payload."""
    response = get_health()
    assert response == {
        "status": "healthy",
        "service": "ExoVision API",
        "phase": 1,
    }

