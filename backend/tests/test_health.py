"""HTTP-level tests for backend system endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_read_root() -> None:
    """The root endpoint returns its documented payload."""
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to ExoVision API"}


def test_health_check() -> None:
    """The versioned health endpoint returns release status."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "ExoVision API",
        "phase": "1.0",
    }


def test_cors_allows_local_frontend() -> None:
    """The configured local frontend origin receives CORS headers."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )
