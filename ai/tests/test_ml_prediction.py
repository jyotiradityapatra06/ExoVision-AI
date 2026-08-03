"""Tests for candidate-to-class prediction integration."""

import pytest

from ai.ml.dataset import TARGET_COLUMN, generate_synthetic_ml_dataset
from ai.ml.features import ML_FEATURE_NAMES
from ai.ml.model import MLClassifier
from ai.ml.predict import predict_candidate


def test_predict_candidate_returns_complete_probability_mapping():
    dataset = generate_synthetic_ml_dataset(80, random_seed=12)
    classifier = MLClassifier(n_estimators=20).fit(
        dataset.loc[:, ML_FEATURE_NAMES], dataset[TARGET_COLUMN]
    )
    candidate = {
        "period": 3.5,
        "epoch": 1.0,
        "duration": 0.15,
        "depth": 0.01,
        "number_of_transits": 8,
        "transit_snr": 45.0,
        "noise_level": 0.001,
        "depth_consistency": 0.95,
        "heuristic_confidence_score": 90.0,
    }

    first = predict_candidate(candidate, classifier=classifier)
    second = predict_candidate(candidate, classifier=classifier)

    assert first == second
    assert first["class"] in {
        "Noise",
        "Planet Transit Candidate",
        "Eclipsing Binary",
        "Stellar Activity / Star Spots",
    }
    assert first["confidence"] == max(first["probabilities"].values())
    assert sum(first["probabilities"].values()) == pytest.approx(1.0)
    assert set(first["probabilities"]) == {
        "planet",
        "binary",
        "stellar_activity",
        "noise",
    }
