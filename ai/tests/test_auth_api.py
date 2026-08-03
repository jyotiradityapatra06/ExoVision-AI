"""Authentication, JWT, and protected-route API tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_repository, get_auth_service
from app.main import app
from app.models.analysis import AnalysisRepository
from app.models.database import initialize_database
from app.models.user import UserRepository
from app.services.auth_service import AuthService


@pytest.fixture
def auth_client(tmp_path: Path):
    """Provide a client backed by an isolated migrated user database."""
    app.dependency_overrides.clear()
    database = tmp_path / "auth.db"
    initialize_database(database)
    service = AuthService(
        UserRepository(database), "test-secret-that-is-more-than-32-bytes-long"
    )
    analyses = AnalysisRepository(database)
    app.dependency_overrides[get_auth_service] = lambda: service
    app.dependency_overrides[get_analysis_repository] = lambda: analyses
    with TestClient(app) as client:
        yield client, service, analyses
    app.dependency_overrides.clear()


def _register(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "astro@example.com",
            "display_name": "Ada Astronomer",
            "password": "correct-horse-orbit-42",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_registration_hashes_password_and_returns_jwt(auth_client):
    client, service, _ = auth_client
    payload = _register(client)

    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == "astro@example.com"
    stored = service.users.by_email("astro@example.com")
    assert stored is not None
    assert stored.password_hash != "correct-horse-orbit-42"
    assert stored.password_hash.startswith("$argon2")


def test_login_and_current_user(auth_client):
    client, _, _ = auth_client
    _register(client)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "astro@example.com", "password": "correct-horse-orbit-42"},
    )

    assert login.status_code == 200
    token = login.json()["access_token"]
    profile = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert profile.status_code == 200
    assert profile.json()["display_name"] == "Ada Astronomer"


def test_duplicate_registration_and_invalid_credentials(auth_client):
    client, _, _ = auth_client
    _register(client)
    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "email": "astro@example.com",
            "display_name": "Other",
            "password": "another-secure-password",
        },
    )
    invalid = client.post(
        "/api/v1/auth/login",
        json={"email": "astro@example.com", "password": "wrong-password"},
    )

    assert duplicate.status_code == 409
    assert invalid.status_code == 401
    assert invalid.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "method,path",
    [
        ("post", "/api/v1/upload/lightcurve"),
        ("post", "/api/v1/analyze/analysis123"),
        ("get", "/api/v1/results/analysis123"),
        ("post", "/api/v1/reports/analysis123"),
        ("get", "/api/v1/reports/analysis123/download"),
    ],
)
def test_product_endpoints_reject_anonymous_requests(
    auth_client, method: str, path: str
):
    client, _, _ = auth_client
    response = getattr(client, method)(path)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_invalid_token_is_rejected(auth_client):
    client, _, _ = auth_client
    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer invalid-token"}
    )

    assert response.status_code == 401


def test_user_cannot_access_another_users_analysis(auth_client):
    client, service, analyses = auth_client
    first = service.register(
        "first@example.com", "First Researcher", "first-secure-password"
    )
    second = service.register(
        "second@example.com", "Second Researcher", "second-secure-password"
    )
    analyses.create("privateanalysis", first.id, "private.csv")
    token, _ = service.issue_token(second)

    response = client.get(
        "/api/v1/results/privateanalysis",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
