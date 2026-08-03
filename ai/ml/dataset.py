"""Deterministic synthetic dataset generation for Phase 3 classifiers."""

from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum
from numbers import Integral, Real

import numpy as np
import pandas as pd

from ai.ml.features import ML_FEATURE_NAMES, extract_ml_features
from ai.simulation.synthetic_transit import generate_synthetic_transit


class TargetLabel(IntEnum):
    """Four-class target encoding required by the classification layer."""

    NOISE = 0
    PLANET_TRANSIT = 1
    ECLIPSING_BINARY = 2
    STAR_SPOTS = 3


TARGET_COLUMN = "target"


@dataclass(frozen=True, slots=True)
class DatasetSplit:
    """Deterministic stratified train/test frames."""

    train: pd.DataFrame
    test: pd.DataFrame


def generate_synthetic_ml_dataset(
    n_samples: int = 400,
    *,
    random_seed: int = 42,
    test_size: float | None = None,
) -> pd.DataFrame | DatasetSplit:
    """Generate a balanced, shuffled four-class feature dataset.

    ``n_samples`` must be divisible by four to guarantee exact balance.  When
    ``test_size`` is supplied, a reproducible stratified split is returned.
    """
    _validate_arguments(n_samples, random_seed, test_size)
    rng = np.random.default_rng(random_seed)
    rows: list[dict[str, float | int]] = []
    per_class = n_samples // len(TargetLabel)
    for label in TargetLabel:
        for _ in range(per_class):
            rows.append(_generate_row(label, rng))
    frame = pd.DataFrame(rows, columns=(*ML_FEATURE_NAMES, TARGET_COLUMN))
    frame = frame.iloc[rng.permutation(len(frame))].reset_index(drop=True)
    if test_size is None:
        return frame
    return split_ml_dataset(frame, test_size=test_size, random_seed=random_seed)


def generate_synthetic_dataset(
    n_samples: int = 400,
    *,
    random_seed: int = 42,
    test_size: float | None = None,
) -> pd.DataFrame | DatasetSplit:
    """Backward-friendly alias for :func:`generate_synthetic_ml_dataset`."""
    return generate_synthetic_ml_dataset(
        n_samples, random_seed=random_seed, test_size=test_size
    )


def split_ml_dataset(
    dataset: pd.DataFrame,
    *,
    test_size: float = 0.2,
    random_seed: int = 42,
) -> DatasetSplit:
    """Split a labeled frame while preserving every class proportion."""
    if TARGET_COLUMN not in dataset:
        raise ValueError(f"dataset must contain a {TARGET_COLUMN!r} column.")
    if not isinstance(test_size, Real) or not 0.0 < float(test_size) < 1.0:
        raise ValueError("test_size must be between zero and one.")
    rng = np.random.default_rng(random_seed)
    train_indices: list[int] = []
    test_indices: list[int] = []
    for label in sorted(dataset[TARGET_COLUMN].unique()):
        indices = dataset.index[dataset[TARGET_COLUMN] == label].to_numpy()
        shuffled = rng.permutation(indices)
        count = max(1, min(len(indices) - 1, int(round(len(indices) * test_size))))
        test_indices.extend(shuffled[:count].tolist())
        train_indices.extend(shuffled[count:].tolist())
    train_indices = rng.permutation(train_indices).tolist()
    test_indices = rng.permutation(test_indices).tolist()
    return DatasetSplit(
        train=dataset.loc[train_indices].reset_index(drop=True),
        test=dataset.loc[test_indices].reset_index(drop=True),
    )


def _generate_row(
    label: TargetLabel, rng: np.random.Generator
) -> dict[str, float | int]:
    period = float(rng.uniform(1.0, 12.0))
    epoch = float(rng.uniform(0.0, period))
    duration = float(rng.uniform(0.04, min(0.3, period * 0.12)))
    noise = float(rng.uniform(0.0004, 0.0025))
    if label is TargetLabel.PLANET_TRANSIT:
        depth = float(rng.uniform(0.002, 0.02))
        variability, odd_even, secondary, score = (
            rng.uniform(0.0, 0.2),
            rng.uniform(0.0, depth * 0.15),
            0.0,
            rng.uniform(65, 98),
        )
    elif label is TargetLabel.ECLIPSING_BINARY:
        depth = float(rng.uniform(0.025, 0.15))
        variability, odd_even, secondary, score = (
            rng.uniform(0.05, 0.35),
            rng.uniform(depth * 0.2, depth * 0.8),
            rng.uniform(0.25, 0.8),
            rng.uniform(20, 65),
        )
    elif label is TargetLabel.STAR_SPOTS:
        depth = float(rng.uniform(0.001, 0.012))
        variability, odd_even, secondary, score = (
            rng.uniform(0.65, 1.0),
            rng.uniform(0.0, depth * 0.3),
            0.0,
            rng.uniform(10, 55),
        )
    else:
        depth = float(rng.uniform(0.00005, 0.001))
        variability, odd_even, secondary, score = (
            rng.uniform(0.2, 0.8),
            rng.uniform(0.0, 0.001),
            0.0,
            rng.uniform(0, 30),
        )

    curve = generate_synthetic_transit(
        end_time=30.0,
        cadence=0.04,
        period=period,
        transit_epoch=epoch,
        transit_duration=duration,
        transit_depth=max(depth, 1e-8),
        noise_std=noise,
        random_seed=int(rng.integers(0, np.iinfo(np.int32).max)),
    )
    flux = curve["flux"].copy()
    if label is TargetLabel.STAR_SPOTS:
        flux += depth * np.sin(2.0 * np.pi * curve["time"] / period)
    elif label is TargetLabel.NOISE:
        transit_mask = curve["flux"] < 1.0 - depth / 2.0
        flux[transit_mask] += depth

    transit_count = max(1, int(np.floor(30.0 / period)))
    snr = max(0.0, depth / noise * np.sqrt(max(1, transit_count)))
    candidate = {
        "period": period,
        "epoch": epoch,
        "duration": duration,
        "depth": depth,
        "number_of_transits": transit_count,
        "transit_snr": snr,
        "noise_level": noise,
        "odd_even_depth_difference": odd_even,
        "secondary_eclipse_indicator": secondary,
        "stellar_variability_score": variability,
        "heuristic_confidence_score": score,
        "depth_consistency": max(0.0, 1.0 - odd_even / max(depth, 1e-12)),
    }
    features = extract_ml_features(candidate, raw_flux=flux).to_dict()
    features[TARGET_COLUMN] = int(label)
    return features


def _validate_arguments(
    n_samples: int, random_seed: int, test_size: float | None
) -> None:
    if (
        isinstance(n_samples, bool)
        or not isinstance(n_samples, Integral)
        or n_samples < 4
    ):
        raise ValueError("n_samples must be an integer of at least four.")
    if n_samples % 4:
        raise ValueError("n_samples must be divisible by four for balanced labels.")
    if isinstance(random_seed, bool) or not isinstance(random_seed, Integral):
        raise TypeError("random_seed must be an integer.")
    if test_size is not None and (
        isinstance(test_size, bool)
        or not isinstance(test_size, Real)
        or not 0.0 < float(test_size) < 1.0
    ):
        raise ValueError("test_size must be between zero and one.")
