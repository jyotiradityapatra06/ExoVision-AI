"""Human-readable, deterministic explanations for candidate classifications.

Random Forest impurity importance supplies global feature magnitude, not signed
local attribution.  This module combines that magnitude with documented domain
rules to describe whether an observed value supports or challenges the predicted
class.  The result is evidence-oriented and must not be interpreted causally.
"""

from __future__ import annotations

from collections.abc import Mapping
from numbers import Real
from typing import Any, Literal

import numpy as np

from ai.ml.dataset import TargetLabel
from ai.ml.features import ML_FEATURE_NAMES, MLFeatures
from ai.ml.model import MLClassifier
from ai.ml.predict import CLASS_LABELS

Impact = Literal["positive", "negative", "neutral"]

FEATURE_EXPLANATIONS: dict[str, str] = {
    "period": "A stable periodic signal is consistent with an orbiting object.",
    "epoch": "A repeatable transit epoch supports a coherent periodic signal.",
    "duration": "Transit duration helps distinguish plausible orbital geometry.",
    "depth": "Transit depth measures how much light the companion blocks.",
    "depth_consistency": "Similar transit depths support a repeatable event.",
    "number_of_transits": "Repeated events strengthen evidence for periodicity.",
    "transit_snr": (
        "A high signal-to-noise ratio increases confidence in transit detection."
    ),
    "noise_level": "High background noise can make a detection less reliable.",
    "folding_snr_improvement": (
        "Improvement after phase folding supports a repeating signal."
    ),
    "symmetry_score": "A symmetric transit shape is commonly planet-like.",
    "ingress_egress_ratio": (
        "Balanced ingress and egress are consistent with a symmetric transit."
    ),
    "transit_width": "Signal width contributes evidence about event geometry.",
    "phase_folded_variance": (
        "Residual folded variance measures scatter in the repeating signal."
    ),
    "odd_even_depth_difference": (
        "Large odd/even depth differences may indicate an eclipsing binary."
    ),
    "secondary_eclipse_indicator": (
        "A secondary eclipse is evidence for an eclipsing stellar companion."
    ),
    "stellar_variability_score": (
        "Strong stellar variability can indicate star spots or activity."
    ),
    "heuristic_confidence_score": (
        "The Phase 2 quality score summarizes detection reliability."
    ),
    "candidate_category": (
        "The Phase 2 score category summarizes heuristic candidate quality."
    ),
}

_DEFAULT_FEATURES: dict[str, float] = {name: 0.0 for name in ML_FEATURE_NAMES}
_DEFAULT_FEATURES.update(
    {
        "depth_consistency": 1.0,
        "symmetry_score": 0.5,
        "ingress_egress_ratio": 1.0,
    }
)


class CandidateExplainer:
    """Explain a fitted classifier using importance-ranked domain evidence."""

    def __init__(self, classifier: MLClassifier, *, top_n: int = 5) -> None:
        """Create an explainer for a fitted model."""
        if not isinstance(classifier, MLClassifier):
            raise TypeError("classifier must be an MLClassifier instance.")
        if not classifier.is_fitted:
            raise ValueError("classifier must be fitted before explanation.")
        if isinstance(top_n, bool) or not isinstance(top_n, int) or top_n < 1:
            raise ValueError("top_n must be a positive integer.")
        self.classifier = classifier
        self.top_n = min(top_n, len(ML_FEATURE_NAMES))
        importances = self.classifier.estimator.feature_importances_
        self._importance_lookup = {
            name: float(imp)
            for name, imp in zip(ML_FEATURE_NAMES, importances, strict=True)
        }
        ranked = sorted(
            zip(ML_FEATURE_NAMES, importances, strict=True),
            key=lambda item: (-float(item[1]), item[0]),
        )
        self._ranked_importance = [
            {"feature": name, "importance": float(importance)}
            for name, importance in ranked[: self.top_n]
        ]
        self._ranked_names = [item["feature"] for item in self._ranked_importance]

    def rank_feature_importance(self) -> list[dict[str, float | str]]:
        """Return the model's highest global impurity-based importances."""
        return [dict(item) for item in self._ranked_importance]

    def get_feature_importance(self) -> list[dict[str, float | str]]:
        """Alias exposing the top-ranked model feature importances."""
        return self.rank_feature_importance()

    def explain_prediction(
        self,
        features: Mapping[str, Any] | MLFeatures,
        prediction: int | str | None = None,
        prediction_probability: float | None = None,
    ) -> dict[str, Any]:
        """Explain one prediction using the five most important features.

        Missing or non-finite values are replaced with conservative defaults and
        listed in ``missing_features`` so the explanation remains JSON-safe and
        transparent about incomplete evidence.
        """
        supplied = features.to_dict() if isinstance(features, MLFeatures) else features
        if not isinstance(supplied, Mapping):
            raise TypeError("features must be a mapping or MLFeatures instance.")
        complete, missing = _complete_features(supplied)
        class_id, inferred_confidence = self._resolve_prediction(complete, prediction)
        confidence = (
            inferred_confidence
            if prediction_probability is None
            else _probability(prediction_probability)
        )

        contributions: list[dict[str, Any]] = []
        for name in self._ranked_names:
            direction, strength = _direction(name, complete, class_id)
            importance = self._importance_lookup[name]
            signed_score = importance * strength
            if direction == "negative":
                signed_score *= -1.0
            elif direction == "neutral":
                signed_score = 0.0
            contributions.append(
                {
                    "feature": name,
                    "value": complete[name],
                    "importance": importance,
                    "direction": direction,
                    "impact": direction,
                    "score": float(signed_score),
                    "description": _description(name, direction, class_id),
                    "used_default": name in missing,
                }
            )

        return {
            "prediction": CLASS_LABELS[class_id],
            "confidence": confidence,
            "feature_contributions": contributions,
            "feature_importance": self.rank_feature_importance(),
            "positive_factors": [
                item["description"]
                for item in contributions
                if item["impact"] == "positive"
            ],
            "negative_factors": [
                item["description"]
                for item in contributions
                if item["impact"] == "negative"
            ],
            "missing_features": missing,
            "summary": _summary(class_id, contributions),
            "method": "random_forest_importance_with_domain_direction_rules",
        }

    def _resolve_prediction(
        self, features: dict[str, float], prediction: int | str | None
    ) -> tuple[int, float]:
        probabilities = self.classifier.predict_proba(features)[0]
        by_class = {
            int(class_id): float(probability)
            for class_id, probability in zip(
                self.classifier.classes_, probabilities, strict=True
            )
        }
        if prediction is None:
            class_id = max(by_class, key=by_class.get)
        elif isinstance(prediction, str):
            normalized = prediction.strip().lower()
            matches = [
                class_id
                for class_id, label in CLASS_LABELS.items()
                if label.lower() == normalized
            ]
            if not matches:
                raise ValueError(f"Unknown prediction label: {prediction!r}.")
            class_id = int(matches[0])
        elif isinstance(prediction, Real) and not isinstance(prediction, bool):
            class_id = int(prediction)
        else:
            raise ValueError("prediction must be a class integer, label, or None.")
        if class_id not in CLASS_LABELS:
            raise ValueError(f"Unknown prediction class: {class_id}.")
        return class_id, by_class.get(class_id, 0.0)


def _complete_features(
    supplied: Mapping[str, Any],
) -> tuple[dict[str, float], list[str]]:
    complete: dict[str, float] = {}
    missing: list[str] = []
    for name in ML_FEATURE_NAMES:
        value = supplied.get(name)
        if (
            isinstance(value, Real)
            and not isinstance(value, bool)
            and np.isfinite(value)
        ):
            complete[name] = float(value)
        else:
            complete[name] = _DEFAULT_FEATURES[name]
            missing.append(name)
    return complete, missing


def _probability(value: Any) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, Real)
        or not np.isfinite(value)
        or not 0.0 <= float(value) <= 1.0
    ):
        raise ValueError("prediction_probability must be between zero and one.")
    return float(value)


def _direction(
    name: str, features: Mapping[str, float], class_id: int
) -> tuple[Impact, float]:
    value = features[name]
    depth = max(features["depth"], 1e-12)
    if class_id == TargetLabel.PLANET_TRANSIT:
        rules = {
            "period": value > 0,
            "epoch": features["period"] > 0,
            "duration": 0 < value < max(features["period"] * 0.2, 0.01),
            "depth": 0.001 <= value <= 0.03,
            "number_of_transits": value >= 3,
            "transit_snr": value >= 7,
            "noise_level": value < depth,
            "depth_consistency": value >= 0.75,
            "folding_snr_improvement": value >= 1,
            "symmetry_score": value >= 0.7,
            "ingress_egress_ratio": 0.5 <= value <= 2.0,
            "odd_even_depth_difference": value / depth <= 0.2,
            "secondary_eclipse_indicator": value <= 0.1,
            "stellar_variability_score": value <= 0.3,
            "heuristic_confidence_score": value >= 50,
            "candidate_category": value >= 2,
            "transit_width": 0 < value < max(features["period"] * 0.2, 0.01),
            "phase_folded_variance": value < max(depth**2, 1e-8),
        }
    elif class_id == TargetLabel.ECLIPSING_BINARY:
        rules = {
            "depth": value >= 0.02,
            "depth_consistency": value < 0.75,
            "odd_even_depth_difference": value / depth > 0.2,
            "secondary_eclipse_indicator": value > 0.1,
            "transit_snr": value >= 7,
            "number_of_transits": value >= 2,
        }
    elif class_id == TargetLabel.STAR_SPOTS:
        rules = {
            "stellar_variability_score": value >= 0.5,
            "phase_folded_variance": value > 0,
            "symmetry_score": value < 0.7,
            "depth_consistency": value < 0.75,
            "folding_snr_improvement": value < 1,
        }
    else:
        rules = {
            "transit_snr": value < 7,
            "depth": value < 0.002,
            "number_of_transits": value < 3,
            "depth_consistency": value < 0.75,
            "noise_level": value >= depth,
            "heuristic_confidence_score": value < 25,
            "candidate_category": value == 0,
        }
    if name not in rules:
        return "neutral", 0.0
    return ("positive", 1.0) if rules[name] else ("negative", 1.0)


def _description(name: str, impact: Impact, class_id: int) -> str:
    prefix = {
        "positive": "Supports this classification: ",
        "negative": "Challenges this classification: ",
        "neutral": "Contextual evidence: ",
    }[impact]
    if class_id == TargetLabel.PLANET_TRANSIT and name == "transit_snr":
        return prefix + "high signal quality is expected for a reliable transit."
    if class_id == TargetLabel.PLANET_TRANSIT and name == "stellar_variability_score":
        detail = (
            "low stellar variability makes an activity-driven signal less likely."
            if impact == "positive"
            else "strong stellar variability can mimic a transit signal."
        )
        return prefix + detail
    if class_id == TargetLabel.PLANET_TRANSIT and name == "secondary_eclipse_indicator":
        detail = (
            "no meaningful secondary eclipse is present."
            if impact == "positive"
            else "a secondary eclipse can indicate an eclipsing binary."
        )
        return prefix + detail
    if class_id == TargetLabel.PLANET_TRANSIT and name == "odd_even_depth_difference":
        detail = (
            "odd and even transit depths are consistent."
            if impact == "positive"
            else "unequal odd and even depths can indicate an eclipsing binary."
        )
        return prefix + detail
    return (
        prefix + FEATURE_EXPLANATIONS[name][0].lower() + FEATURE_EXPLANATIONS[name][1:]
    )


def _summary(class_id: int, contributions: list[dict[str, Any]]) -> str:
    positive = sum(item["impact"] == "positive" for item in contributions)
    summaries = {
        TargetLabel.NOISE: "The measured features are most consistent with noise.",
        TargetLabel.PLANET_TRANSIT: (
            "The candidate shows planetary transit characteristics."
        ),
        TargetLabel.ECLIPSING_BINARY: (
            "The candidate shows characteristics of an eclipsing stellar system."
        ),
        TargetLabel.STAR_SPOTS: (
            "The signal is consistent with stellar activity or star spots."
        ),
    }
    qualifier = " Strong supporting evidence is present." if positive >= 3 else ""
    return summaries[class_id] + qualifier
