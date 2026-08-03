"""Release-level integration test for the complete Phase 3 ML pipeline."""

import json
from pathlib import Path

import pytest

from ai.ml.explain import CandidateExplainer
from ai.ml.features import extract_ml_features
from ai.ml.model import DEFAULT_MODEL_PATH, MLClassifier
from ai.ml.predict import predict_candidate
from ai.ml.report import generate_candidate_report
from ai.simulation.synthetic_transit import generate_synthetic_transit


@pytest.mark.skipif(
    not DEFAULT_MODEL_PATH.is_file(),
    reason="Release model artifact is not available in this checkout.",
)
@pytest.mark.filterwarnings(
    "ignore:Setting the shape on a NumPy array has been deprecated:DeprecationWarning"
)
def test_complete_phase3_pipeline_with_release_model() -> None:
    """Execute candidate-to-report inference using the persisted release model."""
    curve = generate_synthetic_transit(
        period=3.52,
        transit_epoch=0.7,
        transit_duration=0.15,
        transit_depth=0.012,
        noise_std=0.001,
        random_seed=33,
    )
    candidate = {
        "candidate_id": "PHASE3-AUDIT-001",
        "period": 3.52,
        "epoch": 0.7,
        "duration": 0.15,
        "depth": 0.012,
        "depth_consistency": 0.94,
        "number_of_transits": 8,
        "transit_snr": 42.0,
        "noise_level": 0.001,
        "odd_even_depth_difference": 0.0005,
        "secondary_eclipse_indicator": 0.0,
        "stellar_variability_score": 0.1,
        "heuristic_confidence_score": 88.0,
        "candidate_category": 3,
    }

    classifier = MLClassifier.load(Path(DEFAULT_MODEL_PATH))
    features = extract_ml_features(candidate, raw_flux=curve["flux"])
    prediction = predict_candidate(features, classifier=classifier)
    explanation = CandidateExplainer(classifier).explain_prediction(
        features,
        prediction=prediction["class"],
        prediction_probability=prediction["confidence"],
    )
    report = generate_candidate_report(
        candidate["candidate_id"], prediction, explanation
    )
    report["probabilities"] = prediction["probabilities"]

    assert report["candidate_id"] == "PHASE3-AUDIT-001"
    assert report["classification"]["label"] in {
        "Noise",
        "Planet Transit Candidate",
        "Eclipsing Binary",
        "Stellar Activity / Star Spots",
    }
    assert 0.0 <= report["classification"]["confidence"] <= 1.0
    assert sum(report["probabilities"].values()) == pytest.approx(1.0)
    assert report["feature_contributions"]
    assert json.loads(json.dumps(report)) == report
