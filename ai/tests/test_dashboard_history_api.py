"""Focused contract tests for paginated lightweight dashboard history."""

from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_repository
from app.api.v1.analysis import get_analysis_service, get_history_result_service
from app.main import app
from app.models.analysis import AnalysisRecord
from app.services.analysis_service import AnalysisNotFoundError
from app.services.result_service import ResultNotFoundError


class HistoryRepository:
    def __init__(self) -> None:
        self.request: tuple[str, int | None, int] | None = None
        self.records = [
            AnalysisRecord(
                "done1",
                "test-user",
                "kepler.csv",
                "completed",
                "2026-01-03T00:00:00+00:00",
                updated_at="2026-01-03T01:00:00+00:00",
            ),
            AnalysisRecord(
                "active1",
                "test-user",
                "tess.fits",
                "processing",
                "2026-01-02T00:00:00+00:00",
                processing_started_at="2026-01-02T00:01:00+00:00",
                updated_at="2026-01-02T00:02:00+00:00",
            ),
            AnalysisRecord(
                "failed1",
                "test-user",
                "broken.txt",
                "failed",
                "2026-01-01T00:00:00+00:00",
                updated_at="2026-01-01T00:03:00+00:00",
            ),
            AnalysisRecord(
                "legacy1",
                "test-user",
                "legacy.csv",
                "completed",
                "2025-12-01T00:00:00+00:00",
            ),
        ]

    def list_for_user(self, user_id: str, limit: int | None = None, offset: int = 0):
        self.request = (user_id, limit, offset)
        return self.records[offset : offset + limit if limit is not None else None]

    def status_counts_for_user(self, user_id: str):
        assert user_id == "test-user"
        return {"total": 4, "completed": 2, "processing": 1, "failed": 1}


class HistoryStateService:
    def status(self, analysis_id: str):
        if analysis_id == "legacy1":
            raise AnalysisNotFoundError("missing legacy state")
        if analysis_id == "failed1":
            return {"stage": "failed", "error": "Analysis could not be completed."}
        return {
            "stage": "classifying_candidate"
            if analysis_id == "active1"
            else "completed",
            "error": None,
        }


class CompactResultService:
    def __init__(self) -> None:
        self.requested: list[str] = []

    def summary(self, analysis_id: str):
        self.requested.append(analysis_id)
        if analysis_id == "legacy1":
            raise ResultNotFoundError("legacy result unavailable")
        return {
            "candidate_detected": True,
            "classification": "Candidate",
            "model_score": 0.82,
            "period_days": 3.5247,
            "depth": 0.0082,
            "duration_days": 0.14,
            "transit_snr": 11.2,
        }


def test_history_is_owned_paginated_and_compact():
    repository = HistoryRepository()
    results = CompactResultService()
    app.dependency_overrides[get_analysis_repository] = lambda: repository
    app.dependency_overrides[get_analysis_service] = HistoryStateService
    app.dependency_overrides[get_history_result_service] = lambda: results

    with TestClient(app) as client:
        response = client.get("/api/v1/analyze/history?limit=2&offset=0")

    assert response.status_code == 200
    payload = response.json()
    assert repository.request == ("test-user", 2, 0)
    assert payload["total"] == 4
    assert payload["counts"] == {
        "total": 4,
        "completed": 2,
        "processing": 1,
        "failed": 1,
    }
    assert len(payload["items"]) == 2
    assert payload["items"][0]["model_score"] == 0.82
    assert "lightcurve" not in payload["items"][0]
    assert results.requested == ["done1"]


def test_history_exposes_failed_safe_state_and_legacy_completed_record():
    repository = HistoryRepository()
    results = CompactResultService()
    app.dependency_overrides[get_analysis_repository] = lambda: repository
    app.dependency_overrides[get_analysis_service] = HistoryStateService
    app.dependency_overrides[get_history_result_service] = lambda: results

    with TestClient(app) as client:
        response = client.get("/api/v1/analyze/history?limit=2&offset=2")

    assert response.status_code == 200
    failed, legacy = response.json()["items"]
    assert failed["status"] == "failed"
    assert failed["safe_error"] == "Analysis could not be completed."
    assert legacy["status"] == "completed"
    assert legacy["candidate_detected"] is None
    assert legacy["updated_at"] == legacy["created_at"]


def test_history_validates_pagination_bounds():
    with TestClient(app) as client:
        assert client.get("/api/v1/analyze/history?limit=0").status_code == 422
        assert client.get("/api/v1/analyze/history?limit=51").status_code == 422
        assert client.get("/api/v1/analyze/history?offset=-1").status_code == 422
