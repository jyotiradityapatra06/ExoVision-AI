"""Tests for deterministic Random Forest candidate explanations."""

import numpy as np

from ai.ml.dataset import TARGET_COLUMN, generate_synthetic_ml_dataset
from ai.ml.explain import CandidateExplainer
from ai.ml.features import ML_FEATURE_NAMES
from ai.ml.model import MLClassifier


def _explainer() -> tuple[CandidateExplainer, dict[str, float]]:
    dataset = generate_synthetic_ml_dataset(80, random_seed=21)
    classifier = MLClassifier(n_estimators=20, random_state=21).fit(
        dataset.loc[:, ML_FEATURE_NAMES], dataset[TARGET_COLUMN]
    )
    features = {name: float(dataset.loc[0, name]) for name in ML_FEATURE_NAMES}
    return CandidateExplainer(classifier), features


def test_explanation_is_ranked_complete_and_deterministic():
    explainer, features = _explainer()

    first = explainer.explain_prediction(features)
    second = explainer.explain_prediction(features)

    assert first == second
    assert len(first["feature_contributions"]) == 5
    assert len(first["feature_importance"]) == 5
    importances = [item["importance"] for item in first["feature_importance"]]
    assert importances == sorted(importances, reverse=True)
    assert 0.0 <= first["confidence"] <= 1.0
    assert first["summary"]


def test_missing_and_nonfinite_features_use_safe_defaults():
    explainer, _ = _explainer()

    result = explainer.explain_prediction(
        {"period": 3.5, "transit_snr": np.nan},
        prediction="Planet Transit Candidate",
        prediction_probability=0.75,
    )

    assert "transit_snr" in result["missing_features"]
    assert result["confidence"] == 0.75
    assert all(np.isfinite(item["score"]) for item in result["feature_contributions"])
