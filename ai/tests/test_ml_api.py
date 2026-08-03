"""HTTP-level tests for the versioned ML inference API."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.v1.ml import get_ml_service
from app.main import app


class StubMLInferenceService:
    """Deterministic service substitute that avoids loading or training a model."""

    def predict_candidate(self, features: dict[str, Any]) -> dict[str, Any]:
        confidence = 0.96
        explanation = {
            "prediction": "Planet Transit Candidate",
            "confidence": confidence,
            "feature_contributions": [
                {
                    "feature": "transit_snr",
                    "value": float(features.get("transit_snr", 0.0)),
                    "importance": 0.31,
                    "direction": "positive",
                    "impact": "positive",
                    "score": 0.31,
                    "description": "High signal quality detected.",
                    "used_default": "transit_snr" not in features,
                }
            ],
            "feature_importance": [{"feature": "transit_snr", "importance": 0.31}],
            "positive_factors": ["High signal quality detected."],
            "negative_factors": [],
            "missing_features": [],
            "summary": "Strong periodic transit signal with consistent depth.",
            "method": "random_forest_importance_with_domain_direction_rules",
        }
        return {
            "classification": {
                "label": "Planet Transit Candidate",
                "confidence": confidence,
            },
            "probabilities": {
                "planet": 0.96,
                "binary": 0.02,
                "stellar_activity": 0.01,
                "noise": 0.01,
            },
            "explanation": explanation,
        }

    def analyze_candidate(self, candidate: dict[str, Any]) -> dict[str, Any]:
        candidate_id = str(candidate.get("id", candidate.get("candidate_id", "")))
        result = self.predict_candidate(candidate)
        return {
            "candidate_id": candidate_id,
            "classification": result["classification"],
            "evidence": {
                "positive": result["explanation"]["positive_factors"],
                "negative": result["explanation"]["negative_factors"],
            },
            "feature_contributions": result["explanation"]["feature_contributions"],
            "summary": result["explanation"]["summary"],
            "missing_features": [],
            "probabilities": result["probabilities"],
        }

    def model_info(self) -> dict[str, Any]:
        return {
            "model": "RandomForestClassifier",
            "version": "phase-3.2",
            "classes": [
                "Noise",
                "Planet Transit Candidate",
                "Eclipsing Binary",
                "Stellar Activity / Star Spots",
            ],
            "features_count": 18,
            "features": ["period"] * 18,
        }


@pytest.fixture
def client() -> TestClient:
    """Return a client with a model-free service dependency override."""
    app.dependency_overrides[get_ml_service] = StubMLInferenceService
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_model_info_endpoint_is_available(client: TestClient):
    response = client.get("/api/v1/ml/info")

    assert response.status_code == 200
    assert response.json()["model"] == "RandomForestClassifier"
    assert response.json()["features_count"] == 18


def test_predict_returns_probabilities_confidence_and_explanation(
    client: TestClient,
):
    response = client.post(
        "/api/v1/ml/predict",
        json={
            "candidate_id": "EXO-001",
            "features": {
                "period": 3.52,
                "depth": 0.012,
                "duration": 0.15,
                "transit_snr": 87.9,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["candidate_id"] == "EXO-001"
    assert 0.0 <= payload["classification"]["confidence"] <= 1.0
    assert sum(payload["probabilities"].values()) == pytest.approx(1.0)
    assert payload["explanation"]["positive_factors"]


def test_analyze_returns_complete_scientific_report(client: TestClient):
    response = client.post(
        "/api/v1/ml/analyze",
        json={
            "candidate": {
                "id": "EXO-002",
                "period": 2.7,
                "depth": 0.01,
                "transit_snr": 25.0,
            }
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["candidate_id"] == "EXO-002"
    assert payload["classification"]["label"] == "Planet Transit Candidate"
    assert payload["evidence"]["positive"]
    assert payload["summary"]


def test_invalid_prediction_input_returns_422(client: TestClient):
    response = client.post(
        "/api/v1/ml/predict",
        json={
            "candidate_id": "EXO-003",
            "features": {"unsupported_feature": 1.0},
        },
    )

    assert response.status_code == 422
