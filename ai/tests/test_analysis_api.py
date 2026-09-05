"""HTTP and concurrency tests for the durable analysis lifecycle."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_repository
from app.api.v1.analysis import get_analysis_service
from app.main import app
from app.models.analysis import AnalysisRecord, AnalysisRepository
from app.models.database import initialize_database
from app.services.analysis_service import (
    _ensure_sample_limit,
    safe_analysis_error,
)


class StubAnalysisService:
    """Deterministic state store for endpoint lifecycle tests."""

    def __init__(self) -> None:
        self.state = "uploaded"
        self.stage = "ready"
        self.error: str | None = None
        self.analyze_calls = 0

    def mark_processing(self, _analysis_id: str) -> None:
        self.state = "processing"
        self.stage = "preparing_observation"
        self.error = None

    def analyze(self, _analysis_id: str) -> dict[str, Any]:
        self.analyze_calls += 1
        self.state = "completed"
        self.stage = "completed"
        return {
            "analysis_id": "analysis123",
            "status": "completed",
            "candidate_count": 1,
        }

    def status(self, analysis_id: str) -> dict[str, Any]:
        return {
            "analysis_id": analysis_id,
            "status": self.state,
            "progress": 100 if self.state in {"completed", "failed"} else 0,
            "stage": self.stage,
            "message": {
                "ready": "Observation is ready for analysis.",
                "preparing_observation": "Preparing the uploaded observation.",
                "completed": "Analysis completed successfully.",
                "failed": "Analysis could not be completed.",
            }[self.stage],
            "retryable": self.state == "failed",
            "error": self.error if self.state == "failed" else None,
        }


class StubAnalysisRepository:
    def __init__(self) -> None:
        self.state = "uploaded"

    def transition_status(
        self, _analysis_id: str, expected: str, replacement: str
    ) -> bool:
        if self.state != expected:
            return False
        self.state = replacement
        return True

    def update_status(self, _analysis_id: str, status: str) -> None:
        self.state = status

    def by_id(self, analysis_id: str) -> AnalysisRecord:
        return AnalysisRecord(
            analysis_id,
            "test-user",
            "observation.csv",
            self.state,
            "2026-01-01T00:00:00+00:00",
        )


@pytest.fixture
def lifecycle_client():
    service = StubAnalysisService()
    repository = StubAnalysisRepository()
    app.dependency_overrides[get_analysis_service] = lambda: service
    app.dependency_overrides[get_analysis_repository] = lambda: repository
    with TestClient(app) as client:
        yield client, service, repository
    app.dependency_overrides.clear()


def test_starting_uploaded_analysis_returns_processing_acknowledgement(
    lifecycle_client,
):
    client, service, repository = lifecycle_client

    response = client.post("/api/v1/analyze/analysis123")

    assert response.status_code == 202
    assert response.json()["status"] == "processing"
    assert response.json()["stage"] == "preparing_observation"
    assert service.analyze_calls == 1
    assert repository.state == "completed"


@pytest.mark.parametrize("existing", ["processing", "completed"])
def test_duplicate_start_does_not_execute_pipeline(lifecycle_client, existing: str):
    client, service, repository = lifecycle_client
    repository.state = existing
    service.state = existing
    service.stage = "preparing_observation" if existing == "processing" else "completed"

    response = client.post("/api/v1/analyze/analysis123")

    assert response.status_code == 202
    assert response.json()["status"] == existing
    assert service.analyze_calls == 0


def test_failed_analysis_requires_explicit_retry(lifecycle_client):
    client, service, repository = lifecycle_client
    repository.state = "failed"
    service.state = "failed"
    service.stage = "failed"
    service.error = "Analysis failed while processing this observation."

    start = client.post("/api/v1/analyze/analysis123")
    assert start.json()["status"] == "failed"
    assert start.json()["retryable"] is True
    assert service.analyze_calls == 0

    retry = client.post("/api/v1/analyze/analysis123/retry")
    assert retry.status_code == 202
    assert retry.json()["status"] == "processing"
    assert service.analyze_calls == 1
    assert repository.state == "completed"


def test_status_response_exposes_truthful_stage(lifecycle_client):
    client, service, _ = lifecycle_client
    service.state = "processing"
    service.stage = "preparing_observation"

    response = client.get("/api/v1/analyze/analysis123/status")

    assert response.status_code == 200
    assert response.json() == {
        "analysis_id": "analysis123",
        "status": "processing",
        "progress": 0,
        "stage": "preparing_observation",
        "message": "Preparing the uploaded observation.",
        "retryable": False,
        "error": None,
    }


def test_atomic_sqlite_claim_allows_only_one_concurrent_winner(tmp_path: Path):
    database = tmp_path / "claims.db"
    initialize_database(database)
    repository = AnalysisRepository(database)
    with repository._connect() as connection:
        connection.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
            ("user1", "user@example.com", "User", "hash", "now"),
        )
    repository.create("analysis123", "user1", "lightcurve.csv")

    with ThreadPoolExecutor(max_workers=8) as executor:
        outcomes = list(
            executor.map(
                lambda _: repository.transition_status(
                    "analysis123", "uploaded", "processing"
                ),
                range(8),
            )
        )

    assert outcomes.count(True) == 1
    record = repository.by_id("analysis123")
    assert record is not None
    assert record.status == "processing"


@pytest.mark.parametrize(
    ("internal", "public"),
    [
        (
            "C:/private/uploads/user/file.fits crashed in astropy.io",
            "The observation format is unsupported or malformed.",
        ),
        (
            "secret internal implementation failure",
            "Analysis failed while processing this observation.",
        ),
    ],
)
def test_safe_error_mapping_does_not_expose_internal_details(
    internal: str, public: str
):
    assert safe_analysis_error(RuntimeError(internal)) == public


def test_analysis_rejects_excessive_sample_count(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.analysis_service.MAX_LIGHTCURVE_SAMPLES", 2)
    lightcurve = {
        "time": np.array([0.0, 1.0, 2.0]),
        "flux": np.ones(3),
        "flux_error": np.full(3, 0.01),
        "quality": np.zeros(3, dtype=int),
    }

    with pytest.raises(ValueError, match="production limit"):
        _ensure_sample_limit(lightcurve)
