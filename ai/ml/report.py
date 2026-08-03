"""JSON-safe report generation for explained candidate classifications."""

from __future__ import annotations

from collections.abc import Mapping
from numbers import Real
from typing import Any

import numpy as np


def generate_candidate_report(
    candidate_id: str,
    prediction: Mapping[str, Any],
    explanation: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a JSON-safe classification report from prediction/explanation data.

    If ``explanation`` is omitted, ``prediction`` may be the complete dictionary
    returned by ``CandidateExplainer.explain_prediction``.
    """
    if not isinstance(candidate_id, str) or not candidate_id.strip():
        raise ValueError("candidate_id must be a non-empty string.")
    if not isinstance(prediction, Mapping):
        raise TypeError("prediction must be a mapping.")
    reasoning = prediction if explanation is None else explanation
    if not isinstance(reasoning, Mapping):
        raise TypeError("explanation must be a mapping.")
    label = prediction.get("class", prediction.get("prediction"))
    if label is None:
        label = reasoning.get("prediction")
    confidence = prediction.get("confidence", reasoning.get("confidence"))
    if not isinstance(label, str) or not label:
        raise ValueError("prediction must provide a classification label.")
    if (
        isinstance(confidence, bool)
        or not isinstance(confidence, Real)
        or not np.isfinite(confidence)
        or not 0.0 <= float(confidence) <= 1.0
    ):
        raise ValueError("prediction confidence must be between zero and one.")

    contributions = reasoning.get("feature_contributions", [])
    if not isinstance(contributions, list):
        raise ValueError("feature_contributions must be a list.")
    positive = [
        str(item.get("description", item.get("feature", "Supporting evidence")))
        for item in contributions
        if isinstance(item, Mapping) and item.get("impact") == "positive"
    ]
    negative = [
        str(item.get("description", item.get("feature", "Challenging evidence")))
        for item in contributions
        if isinstance(item, Mapping) and item.get("impact") == "negative"
    ]
    return {
        "candidate_id": candidate_id.strip(),
        "classification": {
            "label": label,
            "confidence": float(confidence),
        },
        "evidence": {"positive": positive, "negative": negative},
        "feature_contributions": _json_safe(contributions),
        "summary": str(reasoning.get("summary", "")),
        "missing_features": [
            str(name) for name in reasoning.get("missing_features", [])
        ],
    }


def _json_safe(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value
