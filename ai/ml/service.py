"""Long-lived orchestration service for ML candidate inference."""

from __future__ import annotations

from collections.abc import Mapping
from numbers import Real
from pathlib import Path
from typing import Any

import numpy as np

from ai.ml.explain import CandidateExplainer
from ai.ml.features import ML_FEATURE_NAMES, MLFeatures, extract_ml_features
from ai.ml.model import DEFAULT_MODEL_PATH, MLClassifier
from ai.ml.predict import CLASS_LABELS
from ai.ml.predict import predict_candidate as run_prediction
from ai.ml.report import generate_candidate_report

DEFAULT_SERVICE_MODEL_PATH = DEFAULT_MODEL_PATH


class MLInferenceService:
    """Connect model prediction, explanation, and scientific reporting."""

    def __init__(
        self,
        model_path: str | Path = DEFAULT_SERVICE_MODEL_PATH,
        *,
        classifier: MLClassifier | None = None,
    ) -> None:
        """Load one classifier or accept an already-loaded test/application model."""
        self.model_path = Path(model_path)
        self.classifier = (
            classifier if classifier is not None else MLClassifier.load(self.model_path)
        )
        self.explainer = CandidateExplainer(self.classifier)

    def predict_candidate(
        self,
        features: Mapping[str, Any] | Any,
    ) -> dict[str, Any]:
        """Classify prepared or partially prepared candidate features."""
        extracted = _prepare_features(features)
        prediction = run_prediction(extracted, classifier=self.classifier)
        explanation_features = (
            features
            if isinstance(features, Mapping)
            and any(name in features for name in ML_FEATURE_NAMES)
            else extracted
        )
        explanation = self.explainer.explain_prediction(
            explanation_features,
            prediction=prediction["class"],
            prediction_probability=prediction["confidence"],
        )
        return {
            "classification": {
                "label": prediction["class"],
                "confidence": prediction["confidence"],
            },
            "probabilities": prediction["probabilities"],
            "explanation": explanation,
        }

    def analyze_candidate(self, candidate: Mapping[str, Any] | Any) -> dict[str, Any]:
        """Run extraction, classification, explanation, and report generation."""
        candidate_id = _candidate_identifier(candidate)
        inference = self.predict_candidate(candidate)
        prediction = {
            "class": inference["classification"]["label"],
            "confidence": inference["classification"]["confidence"],
        }
        report = generate_candidate_report(
            candidate_id,
            prediction,
            inference["explanation"],
        )
        report["probabilities"] = inference["probabilities"]
        return report

    def model_info(self) -> dict[str, Any]:
        """Return stable, non-sensitive metadata about the loaded model."""
        return {
            "model": type(self.classifier.estimator).__name__,
            "version": "phase-3.2",
            "classes": [CLASS_LABELS[class_id] for class_id in sorted(CLASS_LABELS)],
            "features_count": len(ML_FEATURE_NAMES),
            "features": list(ML_FEATURE_NAMES),
        }


def _candidate_identifier(candidate: Mapping[str, Any] | Any) -> str:
    if isinstance(candidate, Mapping):
        value = candidate.get("candidate_id", candidate.get("id"))
    else:
        value = getattr(candidate, "candidate_id", getattr(candidate, "id", None))
    if not isinstance(value, str) or not value.strip():
        raise ValueError("candidate must include a non-empty id or candidate_id.")
    return value.strip()


def _prepare_features(candidate: Mapping[str, Any] | Any) -> MLFeatures:
    """Extract Phase 2 values while preserving explicit prepared ML fields."""
    extracted = extract_ml_features(candidate)
    if not isinstance(candidate, Mapping):
        return extracted
    values = extracted.to_dict()
    for name in ML_FEATURE_NAMES:
        if name not in candidate:
            continue
        value = candidate[name]
        if (
            isinstance(value, bool)
            or not isinstance(value, Real)
            or not np.isfinite(value)
        ):
            raise ValueError(f"{name} must be a finite numeric value.")
        values[name] = (
            int(value)
            if name in {"number_of_transits", "candidate_category"}
            else float(value)
        )
    return MLFeatures(**values)
