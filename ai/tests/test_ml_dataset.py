"""Tests for the balanced synthetic ML dataset."""

import numpy as np
import pandas as pd

from ai.ml.dataset import TARGET_COLUMN, DatasetSplit, generate_synthetic_ml_dataset
from ai.ml.features import ML_FEATURE_NAMES


def test_dataset_is_balanced_finite_and_deterministic():
    first = generate_synthetic_ml_dataset(40, random_seed=7)
    second = generate_synthetic_ml_dataset(40, random_seed=7)

    assert isinstance(first, pd.DataFrame)
    pd.testing.assert_frame_equal(first, second)
    assert list(first.columns) == [*ML_FEATURE_NAMES, TARGET_COLUMN]
    assert first[TARGET_COLUMN].value_counts().to_dict() == {0: 10, 1: 10, 2: 10, 3: 10}
    assert np.isfinite(first.to_numpy(dtype=float)).all()


def test_stratified_train_test_split():
    split = generate_synthetic_ml_dataset(80, random_seed=11, test_size=0.25)

    assert isinstance(split, DatasetSplit)
    assert len(split.train) == 60
    assert len(split.test) == 20
    assert split.test[TARGET_COLUMN].value_counts().to_dict() == {
        0: 5,
        1: 5,
        2: 5,
        3: 5,
    }
