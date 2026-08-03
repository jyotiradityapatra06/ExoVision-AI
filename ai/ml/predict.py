"""High-level classification helper for Phase 2 transit candidates."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import numpy as np

from ai.ml.dataset import TargetLabel
from ai.ml.features import extract_ml_features
from ai.ml.model import DEFAULT_MODEL_PATH, MLClassifier

CLASS_LABELS: dict[int, str] = {
    TargetLabel.NOISE: "Noise",
    TargetLabel.PLANET_TRANSIT: "Planet Transit Candidate",
    TargetLabel.ECLIPSING_BINARY: "Eclipsing Binary",
    TargetLabel.STAR_SPOTS: "Stellar Activity / Star Spots",
}

PROBABILITY_KEYS: dict[int, str] = {
    TargetLabel.NOISE: "noise",
    TargetLabel.PLANET_TRANSIT: "planet",
    TargetLabel.ECLIPSING_BINARY: "binary",
    TargetLabel.STAR_SPOTS: "stellar_activity",
}


def predict_candidate(
    candidate: Mapping[str, Any] | Any,
    *,
    classifier: MLClassifier | None = None,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    phase: Sequence[float] | np.ndarray | None = None,
    folded_flux: Sequence[float] | np.ndarray | None = None,
    raw_flux: Sequence[float] | np.ndarray | None = None,
) -> dict[str, Any]:
    """Extract candidate features and return a labeled model prediction."""
    model = classifier if classifier is not None else MLClassifier.load(model_path)
    features = extract_ml_features(
        candidate, phase=phase, folded_flux=folded_flux, raw_flux=raw_flux
    )
    probabilities = model.predict_proba(features)[0]
    by_class = {
        int(class_id): float(probability)
        for class_id, probability in zip(model.classes_, probabilities, strict=True)
    }
    complete = {
        PROBABILITY_KEYS[class_id]: by_class.get(class_id, 0.0)
        for class_id in CLASS_LABELS
    }
    predicted_class = max(by_class, key=by_class.get)
    return {
        "class": CLASS_LABELS[predicted_class],
        "confidence": by_class[predicted_class],
        "probabilities": complete,
    }
