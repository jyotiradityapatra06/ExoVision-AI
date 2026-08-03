"""Tests for the schema-aware Random Forest wrapper."""

import numpy as np

from ai.ml.dataset import TARGET_COLUMN, generate_synthetic_ml_dataset
from ai.ml.features import ML_FEATURE_NAMES
from ai.ml.model import MLClassifier


def test_model_initializes_and_trains_deterministically():
    dataset = generate_synthetic_ml_dataset(40, random_seed=3)
    features = dataset.loc[:, ML_FEATURE_NAMES]
    labels = dataset[TARGET_COLUMN]
    first = MLClassifier(random_state=9, n_estimators=20).fit(features, labels)
    second = MLClassifier(random_state=9, n_estimators=20).fit(features, labels)

    assert first.is_fitted
    np.testing.assert_array_equal(first.predict(features), second.predict(features))
    probabilities = first.predict_proba(features)
    np.testing.assert_allclose(probabilities.sum(axis=1), 1.0)


def test_saved_model_loads_with_equivalent_predictions(tmp_path):
    dataset = generate_synthetic_ml_dataset(40, random_seed=5)
    features = dataset.loc[:, ML_FEATURE_NAMES]
    classifier = MLClassifier(n_estimators=10).fit(features, dataset[TARGET_COLUMN])

    path = classifier.save(tmp_path / "nested" / "classifier.joblib")
    restored = MLClassifier.load(path)

    np.testing.assert_array_equal(
        classifier.predict(features), restored.predict(features)
    )
    np.testing.assert_allclose(
        classifier.predict_proba(features), restored.predict_proba(features)
    )
