"""Tests for deterministic Phase 3.1 feature extraction."""

from copy import deepcopy
from dataclasses import dataclass

import numpy as np
import pytest

from ai.ml import (
    FEATURE_NAMES,
    extract_candidate_features,
    feature_vector,
    get_feature_names,
    normalize_label,
    sanitize_optional_value,
    validate_feature_record,
)


def candidate_record(**updates):
    record = {
        "candidate_id": "candidate-1",
        "source_id": "TIC-1",
        "period_days": 3.5,
        "duration_days": 0.2,
        "depth": 0.01,
        "transit_snr": 12.0,
        "bls_power": 7.0,
        "observed_transit_events": 5,
        "transit_epoch": 1.2,
        "data_quality": {"phase_coverage": 0.9},
        "folded_statistics": {"baseline_std": 0.001},
        "odd_even": {
            "absolute_depth_difference": 0.002,
            "relative_depth_difference": 0.2,
        },
        "secondary_eclipse_depth": 0.002,
        "candidate_score": 82.0,
        "recovery": {
            "absolute_period_error": 0.01,
            "epoch_error_days": 0.02,
        },
    }
    record.update(updates)
    return record


def test_extracts_mapping_with_deterministic_order_and_metadata():
    result = extract_candidate_features(
        candidate_record(), metadata={"mission": "TESS", "label": "planet"}
    )

    assert tuple(result)[5:-1] == FEATURE_NAMES
    assert result["mission"] == "TESS"
    assert result["period_days"] == 3.5
    assert result["residual_rms"] == 0.001
    assert result["secondary_to_primary_depth_ratio"] == pytest.approx(0.2)
    assert result["label"] == 1
    assert get_feature_names() == FEATURE_NAMES
    assert feature_vector(result) == tuple(result[name] for name in FEATURE_NAMES)


@dataclass(frozen=True)
class Detection:
    period_days: float
    duration_days: float
    depth: float
    snr: float
    power: float
    transit_time: float


@dataclass(frozen=True)
class Candidate:
    candidate_id: str
    source_id: str
    detection: Detection
    observed_transit_events: int
    data_quality: dict
    folded_statistics: dict
    odd_even: dict
    recovery: dict | None
    metadata: dict


def test_extracts_dataclass_and_numpy_scalars():
    candidate = Candidate(
        candidate_id="candidate-dataclass",
        source_id="KIC-1",
        detection=Detection(
            np.float64(2.0),
            np.float64(0.1),
            np.float64(0.02),
            np.float64(10.0),
            np.float64(4.0),
            np.float64(0.5),
        ),
        observed_transit_events=np.int64(4),
        data_quality={"phase_coverage": np.float64(0.8)},
        folded_statistics={"baseline_std": np.float64(0.002)},
        odd_even={},
        recovery=None,
        metadata={"mission": "Kepler"},
    )

    result = extract_candidate_features(candidate)

    assert type(result["period_days"]) is float
    assert type(result["transit_count"]) is int
    assert result["mission"] == "Kepler"


def test_extracts_candidate_and_score_from_pipeline_style_mapping():
    pipeline_result = {
        "candidate": candidate_record(candidate_score=None),
        "confidence": {"total_score": 91.5},
    }

    result = extract_candidate_features(pipeline_result)

    assert result["candidate_id"] == "candidate-1"
    assert result["candidate_score"] == 91.5


def test_optional_values_are_consistently_missing():
    result = extract_candidate_features(
        candidate_record(
            secondary_eclipse_depth=None,
            candidate_score=np.nan,
            recovery=None,
            odd_even={},
        )
    )

    assert result["secondary_eclipse_depth"] is None
    assert result["secondary_to_primary_depth_ratio"] is None
    assert result["candidate_score"] is None
    assert result["recovery_period_error"] is None
    assert sanitize_optional_value(np.inf) is None


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("period_days", 0.0, "period_days"),
        ("period_days", np.inf, "period_days"),
        ("duration_days", 0.0, "duration_days"),
        ("duration_days", np.nan, "duration_days"),
        ("depth", -0.1, "depth"),
        ("depth", np.inf, "depth"),
        ("observed_transit_events", -1, "transit_count"),
    ],
)
def test_invalid_required_values_are_rejected(field, value, message):
    with pytest.raises(ValueError, match=message):
        extract_candidate_features(candidate_record(**{field: value}))


def test_safe_ratio_handles_zero_primary_depth():
    result = extract_candidate_features(
        candidate_record(depth=0.0, secondary_eclipse_depth=0.001)
    )

    assert result["secondary_to_primary_depth_ratio"] is None


@pytest.mark.parametrize(
    ("label", "expected"),
    [
        (1, 1),
        (0, 0),
        ("planet", 1),
        ("confirmed_planet", 1),
        ("positive", 1),
        ("false-positive", 0),
        ("non_planet", 0),
        ("negative", 0),
        (None, None),
    ],
)
def test_label_normalization(label, expected):
    assert normalize_label(label) == expected


def test_unknown_label_is_rejected():
    with pytest.raises(ValueError, match="Unknown label"):
        normalize_label("maybe")


def test_input_is_not_mutated_and_validation_rejects_nonfinite_optional():
    candidate = candidate_record()
    original = deepcopy(candidate)
    result = extract_candidate_features(candidate)

    assert candidate == original
    result["transit_snr"] = np.inf
    with pytest.raises(ValueError, match="transit_snr"):
        validate_feature_record(result)
