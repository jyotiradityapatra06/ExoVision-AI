"""Feature extraction for four-class transit-candidate classification.

The extractor accepts Phase 2 ``TransitCandidate`` objects, complete pipeline
results, or their serialized mapping equivalents.  Optional light-curve arrays
may be supplied to improve shape measurements; otherwise conservative,
deterministic values are derived from the candidate summary.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from enum import IntEnum
from numbers import Real
from typing import Any

import numpy as np


class CandidateCategory(IntEnum):
    """Numerical encoding of the Phase 2 heuristic score category."""

    REJECTED = 0
    LOW = 1
    MODERATE = 2
    HIGH = 3


@dataclass(frozen=True, slots=True)
class MLFeatures:
    """Stable, finite feature vector used by Phase 3 classifiers."""

    period: float
    epoch: float
    duration: float
    depth: float
    depth_consistency: float
    number_of_transits: int
    transit_snr: float
    noise_level: float
    folding_snr_improvement: float
    symmetry_score: float
    ingress_egress_ratio: float
    transit_width: float
    phase_folded_variance: float
    odd_even_depth_difference: float
    secondary_eclipse_indicator: float
    stellar_variability_score: float
    heuristic_confidence_score: float
    candidate_category: int

    def to_dict(self) -> dict[str, float | int]:
        """Return features in deterministic dataclass field order."""
        return asdict(self)


ML_FEATURE_NAMES: tuple[str, ...] = tuple(MLFeatures.__dataclass_fields__)


def extract_ml_features(
    candidate: Mapping[str, Any] | Any,
    *,
    phase: Sequence[float] | np.ndarray | None = None,
    folded_flux: Sequence[float] | np.ndarray | None = None,
    raw_flux: Sequence[float] | np.ndarray | None = None,
) -> MLFeatures:
    """Convert a Phase 2 candidate or analysis result to finite ML features.

    Missing optional measurements use neutral, documented defaults rather than
    NaN. Required orbital values also fall back to zero so partially populated
    JSON results can safely be inspected and batched.
    """
    if not isinstance(candidate, Mapping) and not hasattr(
        candidate, "__dataclass_fields__"
    ):
        raise TypeError("candidate must be a mapping or dataclass instance.")

    nested = _get(candidate, "candidate")
    core = nested if nested is not None else candidate
    detection = _get(core, "detection")
    statistics = _get(core, "folded_statistics")
    odd_even = _get(core, "odd_even")
    confidence = _get(candidate, "confidence") or _get(core, "confidence")

    period = _finite(_first(core, detection, "period", "period_days"))
    epoch = _finite(_first(core, detection, "epoch", "transit_epoch", "transit_time"))
    duration = _finite(_first(core, detection, "duration", "duration_days"))
    depth = max(0.0, _finite(_first(core, detection, "depth")))
    snr = max(0.0, _finite(_first(core, detection, "transit_snr", "snr")))
    noise = max(
        0.0,
        _finite(
            _first(statistics, core, "noise_level", "baseline_std", "residual_rms")
        ),
    )
    transit_count = max(
        0,
        int(
            _finite(
                _first(
                    core,
                    None,
                    "number_of_transits",
                    "observed_transit_events",
                    "transit_count",
                )
            )
        ),
    )
    relative_difference = max(
        0.0, _finite(_first(odd_even, core, "relative_depth_difference"))
    )
    absolute_difference = max(
        0.0,
        _finite(
            _first(
                odd_even,
                core,
                "odd_even_depth_difference",
                "absolute_depth_difference",
            )
        ),
    )

    phase_array, folded_array = _paired_arrays(phase, folded_flux)
    symmetry, ingress_ratio, folded_variance = _shape_features(
        phase_array, folded_array, duration, period
    )
    raw_array = _array(raw_flux)
    raw_variance = float(np.var(raw_array)) if raw_array.size else noise**2
    variability = _unit_interval(
        _finite(
            _first(core, statistics, "stellar_variability_score"),
            _variability(raw_array, depth),
        )
    )
    folded_noise = float(np.std(folded_array)) if folded_array.size else noise
    folding_improvement = (
        max(0.0, np.sqrt(raw_variance) / folded_noise) if folded_noise > 0 else 0.0
    )

    explicit_secondary = _first(
        core, statistics, "secondary_eclipse_indicator", "secondary_eclipse_depth"
    )
    secondary = _secondary_indicator(explicit_secondary, depth)
    score = _finite(
        _first(
            core,
            confidence,
            "heuristic_confidence_score",
            "candidate_score",
            "total_score",
        )
    )
    category = _category(
        _first(confidence, core, "category", "candidate_category"), score
    )
    explicit_consistency = _first(core, statistics, "depth_consistency")
    consistency = _unit_interval(
        _finite(explicit_consistency, 1.0 - relative_difference)
    )

    return MLFeatures(
        period=period,
        epoch=epoch,
        duration=duration,
        depth=depth,
        depth_consistency=consistency,
        number_of_transits=transit_count,
        transit_snr=snr,
        noise_level=noise,
        folding_snr_improvement=_finite(folding_improvement),
        symmetry_score=symmetry,
        ingress_egress_ratio=ingress_ratio,
        transit_width=_finite(_first(core, statistics, "transit_width"), duration),
        phase_folded_variance=folded_variance,
        odd_even_depth_difference=absolute_difference,
        secondary_eclipse_indicator=secondary,
        stellar_variability_score=variability,
        heuristic_confidence_score=float(np.clip(score, 0.0, 100.0)),
        candidate_category=int(category),
    )


def extract_features(
    candidate: Mapping[str, Any] | Any, **kwargs: Any
) -> dict[str, float | int]:
    """Convenience wrapper returning an ordered dictionary."""
    return extract_ml_features(candidate, **kwargs).to_dict()


def _get(source: Any, name: str) -> Any:
    if source is None:
        return None
    return (
        source.get(name) if isinstance(source, Mapping) else getattr(source, name, None)
    )


def _first(primary: Any, secondary: Any, *names: str) -> Any:
    for source in (primary, secondary):
        for name in names:
            value = _get(source, name)
            if value is not None:
                return value
    return None


def _finite(value: Any, default: float = 0.0) -> float:
    if isinstance(value, Real) and not isinstance(value, bool) and np.isfinite(value):
        return float(value)
    return float(default)


def _array(values: Sequence[float] | np.ndarray | None) -> np.ndarray:
    if values is None:
        return np.array([], dtype=np.float64)
    array = np.asarray(values, dtype=np.float64).reshape(-1)
    return array[np.isfinite(array)]


def _paired_arrays(
    phase: Sequence[float] | np.ndarray | None,
    flux: Sequence[float] | np.ndarray | None,
) -> tuple[np.ndarray, np.ndarray]:
    if phase is None or flux is None:
        return np.array([]), np.array([])
    phase_array = np.asarray(phase, dtype=np.float64).reshape(-1)
    flux_array = np.asarray(flux, dtype=np.float64).reshape(-1)
    if len(phase_array) != len(flux_array):
        raise ValueError("phase and folded_flux must have equal lengths.")
    valid = np.isfinite(phase_array) & np.isfinite(flux_array)
    return phase_array[valid], flux_array[valid]


def _shape_features(
    phase: np.ndarray, flux: np.ndarray, duration: float, period: float
) -> tuple[float, float, float]:
    if not flux.size:
        return 0.5, 1.0, 0.0
    variance = float(np.var(flux))
    width = duration / period if period > 0 else 0.05
    window = np.abs(phase) <= max(width, 0.01)
    left = flux[window & (phase < 0)]
    right = flux[window & (phase >= 0)]
    if not left.size or not right.size:
        return 0.5, 1.0, variance
    count = min(len(left), len(right))
    mismatch = float(np.mean(np.abs(left[-count:] - right[:count][::-1])))
    scale = max(float(np.ptp(flux)), np.finfo(float).eps)
    symmetry = _unit_interval(1.0 - mismatch / scale)
    left_slope = abs(float(np.mean(np.diff(left)))) if len(left) > 1 else 0.0
    right_slope = abs(float(np.mean(np.diff(right)))) if len(right) > 1 else 0.0
    ratio = (
        left_slope / right_slope
        if right_slope > 0
        else (1.0 if left_slope == 0 else 10.0)
    )
    return symmetry, float(np.clip(ratio, 0.0, 10.0)), variance


def _variability(flux: np.ndarray, depth: float) -> float:
    if flux.size < 3:
        return 0.0
    scale = max(depth, float(np.median(np.abs(flux - np.median(flux)))), 1e-12)
    return _unit_interval(float(np.std(flux)) / (5.0 * scale))


def _secondary_indicator(value: Any, depth: float) -> float:
    if isinstance(value, (bool, np.bool_)):
        return float(value)
    numeric = max(0.0, _finite(value))
    return _unit_interval(numeric / depth) if depth > 0 else 0.0


def _category(value: Any, score: float) -> CandidateCategory:
    if isinstance(value, Real) and not isinstance(value, bool):
        return CandidateCategory(int(np.clip(int(value), 0, 3)))
    if hasattr(value, "value"):
        value = value.value
    aliases = {"rejected": 0, "low": 1, "moderate": 2, "high": 3}
    if isinstance(value, str) and value.lower() in aliases:
        return CandidateCategory(aliases[value.lower()])
    if score >= 75:
        return CandidateCategory.HIGH
    if score >= 50:
        return CandidateCategory.MODERATE
    if score >= 25:
        return CandidateCategory.LOW
    return CandidateCategory.REJECTED


def _unit_interval(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))
