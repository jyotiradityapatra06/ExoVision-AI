"""HTTP tests for visualization-ready stored analysis results."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.v1.results import get_result_service
from app.main import app
from app.services.result_service import ResultService


@pytest.fixture
def results_client(tmp_path: Path):
    """Provide a client and isolated result storage root."""
    root = tmp_path / "uploads"
    app.dependency_overrides[get_result_service] = lambda: ResultService(root)
    with TestClient(app) as client:
        yield client, root
    app.dependency_overrides.clear()


def _write_result(root: Path, analysis_id: str) -> None:
    directory = root / analysis_id
    directory.mkdir(parents=True)
    payload = {
        "analysis_id": analysis_id,
        "status": "completed",
        "candidate_count": 1,
        "lightcurve": {"time": [0.0, 1.0, 2.0], "flux": [1.0, 0.99, 1.0]},
        "pipeline": {
            "status": "success",
            "input_summary": {"sample_count": 3},
            "detection": {
                "period_days": 3.52,
                "transit_time": 0.7,
                "duration_days": 0.15,
                "depth": 0.012,
                "snr": 18.2,
            },
            "candidate": {
                "candidate_id": "candidate-001",
                "period_days": 3.52,
                "transit_epoch": 0.7,
                "duration_days": 0.15,
                "depth": 0.012,
                "transit_snr": 18.2,
            },
            "folded_output": {
                "arrays": {
                    "phase": [-0.1, 0.0, 0.1],
                    "flux": [1.0, 0.988, 1.0],
                }
            },
        },
        "ml_report": {
            "classification": {
                "label": "Planet Transit Candidate",
                "confidence": 0.96,
            },
            "evidence": {
                "positive": ["High transit signal-to-noise ratio."],
                "negative": ["Minor stellar variability."],
            },
            "summary": "Strong periodic transit signal with consistent depth.",
        },
    }
    (directory / "result.json").write_text(json.dumps(payload), encoding="utf-8")


def test_results_endpoint_returns_typed_complete_result(results_client):
    client, root = results_client
    _write_result(root, "analysis123")

    response = client.get("/api/v1/results/analysis123")

    assert response.status_code == 200
    payload = response.json()
    assert payload["analysis_id"] == "analysis123"
    assert payload["lightcurve"]["time"] == [0.0, 1.0, 2.0]
    assert payload["transit"]["phase"] == [-0.1, 0.0, 0.1]
    assert payload["transit"]["detected"] is True
    assert payload["candidates"][0]["classification"] == ("Planet Transit Candidate")
    assert payload["candidates"][0]["confidence"] == 0.96
    assert payload["candidates"][0]["explanation"]["positive_factors"]


def test_missing_or_invalid_analysis_id_returns_404(results_client):
    client, _ = results_client

    assert client.get("/api/v1/results/missing").status_code == 404
    assert client.get("/api/v1/results/not-valid").status_code == 404


def test_corrupt_result_returns_controlled_500(results_client):
    client, root = results_client
    directory = root / "corrupt"
    directory.mkdir(parents=True)
    (directory / "result.json").write_text("not-json", encoding="utf-8")

    response = client.get("/api/v1/results/corrupt")

    assert response.status_code == 500
    assert response.json()["detail"] == "Stored analysis result is unavailable."


def test_non_object_result_returns_controlled_500(results_client):
    client, root = results_client
    directory = root / "wrongshape"
    directory.mkdir(parents=True)
    (directory / "result.json").write_text("[]", encoding="utf-8")

    response = client.get("/api/v1/results/wrongshape")

    assert response.status_code == 500
    assert response.json()["detail"] == "Stored analysis result is unavailable."
