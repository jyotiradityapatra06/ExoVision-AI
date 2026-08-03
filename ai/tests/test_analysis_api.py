"""HTTP tests for analysis execution and durable status endpoints."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.v1.analysis import get_analysis_service
from app.main import app
from app.services.analysis_service import (
    AnalysisExecutionError,
    AnalysisNotFoundError,
)


class StubAnalysisService:
    """Deterministic substitute for endpoint contract tests."""

    def analyze(self, analysis_id: str) -> dict[str, Any]:
        if analysis_id == "missing":
            raise AnalysisNotFoundError("Analysis not found.")
        if analysis_id == "invalid":
            raise AnalysisExecutionError("CSV/TXT files must contain time and flux.")
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "candidate_count": 1,
        }

    def status(self, analysis_id: str) -> dict[str, Any]:
        if analysis_id == "missing":
            raise AnalysisNotFoundError("Analysis not found.")
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "progress": 100,
            "error": None,
        }


@pytest.fixture
def client():
    """Provide an API client without running the expensive astronomy pipeline."""
    app.dependency_overrides[get_analysis_service] = StubAnalysisService
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_analysis_creation_returns_completed_summary(client: TestClient):
    response = client.post("/api/v1/analyze/analysis123")

    assert response.status_code == 200
    assert response.json() == {
        "analysis_id": "analysis123",
        "status": "completed",
        "candidate_count": 1,
    }


def test_analysis_status_endpoint(client: TestClient):
    response = client.get("/api/v1/analyze/analysis123/status")

    assert response.status_code == 200
    assert response.json() == {
        "analysis_id": "analysis123",
        "status": "completed",
        "progress": 100,
        "error": None,
    }


@pytest.mark.parametrize("method", ["post", "get"])
def test_missing_analysis_returns_404(client: TestClient, method: str):
    path = (
        "/api/v1/analyze/missing"
        if method == "post"
        else "/api/v1/analyze/missing/status"
    )
    response = getattr(client, method)(path)

    assert response.status_code == 404


def test_invalid_lightcurve_returns_422(client: TestClient):
    response = client.post("/api/v1/analyze/invalid")

    assert response.status_code == 422
    assert "time and flux" in response.json()["detail"]
