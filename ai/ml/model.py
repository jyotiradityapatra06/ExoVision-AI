"""Random Forest classifier wrapper for ExoVision candidate features."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.validation import check_is_fitted

from ai.ml.features import ML_FEATURE_NAMES, MLFeatures

MODEL_FORMAT_VERSION = 1
DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parents[2] / "models" / "exovision_classifier.joblib"
)


class MLClassifier:
    """Deterministic Random Forest with schema-aware persistence."""

    def __init__(
        self,
        *,
        random_state: int = 42,
        n_estimators: int = 200,
        **model_parameters: Any,
    ) -> None:
        """Initialize the baseline estimator with configurable parameters."""
        if "random_state" in model_parameters or "n_estimators" in model_parameters:
            raise ValueError(
                "Pass random_state and n_estimators as their named arguments."
            )
        self.random_state = int(random_state)
        self.model_parameters = {
            "n_estimators": int(n_estimators),
            "random_state": self.random_state,
            "n_jobs": 1,
            **model_parameters,
        }
        self.estimator = RandomForestClassifier(**self.model_parameters)

    def fit(
        self,
        features: pd.DataFrame | np.ndarray | Sequence[Sequence[float]],
        labels: pd.Series | np.ndarray | Sequence[int],
    ) -> MLClassifier:
        """Fit the classifier and return this instance."""
        matrix = self._prepare_features(features)
        target = np.asarray(labels)
        if target.ndim != 1 or len(target) != len(matrix):
            raise ValueError("labels must be one-dimensional and match features.")
        if len(np.unique(target)) < 2:
            raise ValueError("training requires at least two target classes.")
        self.estimator.fit(matrix, target.astype(int))
        return self

    def predict(
        self,
        features: pd.DataFrame
        | np.ndarray
        | Sequence[Sequence[float]]
        | Mapping[str, float | int]
        | MLFeatures,
    ) -> np.ndarray:
        """Predict integer classes for one or more feature records."""
        self._require_fitted()
        return self.estimator.predict(self._prepare_features(features)).astype(int)

    def predict_proba(
        self,
        features: pd.DataFrame
        | np.ndarray
        | Sequence[Sequence[float]]
        | Mapping[str, float | int]
        | MLFeatures,
    ) -> np.ndarray:
        """Return class probabilities in fitted-estimator class order."""
        self._require_fitted()
        return self.estimator.predict_proba(self._prepare_features(features))

    @property
    def classes_(self) -> np.ndarray:
        """Return fitted target classes."""
        self._require_fitted()
        return self.estimator.classes_.astype(int)

    @property
    def is_fitted(self) -> bool:
        """Report whether the underlying estimator has been fitted."""
        try:
            check_is_fitted(self.estimator)
        except Exception:  # sklearn raises version-specific not-fitted errors
            return False
        return True

    def save(self, path: str | Path) -> Path:
        """Persist the fitted model and its exact feature schema."""
        self._require_fitted()
        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "format_version": MODEL_FORMAT_VERSION,
                "feature_names": ML_FEATURE_NAMES,
                "model_parameters": self.model_parameters,
                "estimator": self.estimator,
            },
            destination,
        )
        return destination

    @classmethod
    def load(cls, path: str | Path) -> MLClassifier:
        """Load a fitted model after validating format and feature schema."""
        source = Path(path)
        if not source.is_file():
            raise FileNotFoundError(f"Model file not found: {source}")
        payload = joblib.load(source)
        if not isinstance(payload, dict):
            raise ValueError("Invalid model artifact payload.")
        if payload.get("format_version") != MODEL_FORMAT_VERSION:
            raise ValueError("Unsupported model artifact format version.")
        if tuple(payload.get("feature_names", ())) != ML_FEATURE_NAMES:
            raise ValueError("Model feature schema is incompatible with this build.")
        estimator = payload.get("estimator")
        if not isinstance(estimator, RandomForestClassifier):
            raise ValueError("Model artifact does not contain a Random Forest.")
        instance = cls()
        instance.estimator = estimator
        instance.model_parameters = dict(payload.get("model_parameters", {}))
        instance.random_state = int(instance.model_parameters.get("random_state", 42))
        instance._require_fitted()
        return instance

    def _prepare_features(
        self,
        features: pd.DataFrame
        | np.ndarray
        | Sequence[Sequence[float]]
        | Mapping[str, float | int]
        | MLFeatures,
    ) -> pd.DataFrame:
        if isinstance(features, MLFeatures):
            features = features.to_dict()
        if isinstance(features, Mapping):
            missing = [name for name in ML_FEATURE_NAMES if name not in features]
            if missing:
                raise ValueError(f"Missing model features: {', '.join(missing)}.")
            frame = pd.DataFrame(
                [[features[name] for name in ML_FEATURE_NAMES]],
                columns=ML_FEATURE_NAMES,
            )
        elif isinstance(features, pd.DataFrame):
            missing = [name for name in ML_FEATURE_NAMES if name not in features]
            if missing:
                raise ValueError(f"Missing model features: {', '.join(missing)}.")
            frame = features.loc[:, ML_FEATURE_NAMES].copy()
        else:
            array = np.asarray(features, dtype=np.float64)
            if array.ndim == 1:
                array = array.reshape(1, -1)
            if array.ndim != 2 or array.shape[1] != len(ML_FEATURE_NAMES):
                raise ValueError(f"features must have {len(ML_FEATURE_NAMES)} columns.")
            frame = pd.DataFrame(array, columns=ML_FEATURE_NAMES)
        values = frame.to_numpy(dtype=np.float64)
        if not np.isfinite(values).all():
            raise ValueError("features must contain only finite numeric values.")
        return frame

    def _require_fitted(self) -> None:
        check_is_fitted(self.estimator)
