"""Tests for four-class ML feature extraction."""

import numpy as np

from ai.ml.features import ML_FEATURE_NAMES, CandidateCategory, extract_ml_features


def test_extracts_phase_two_mapping_and_score_category():
    candidate = {
        "period_days": 3.52,
        "transit_epoch": 0.7,
        "duration_days": 0.15,
        "depth": 0.012,
        "transit_snr": 87.9,
        "observed_transit_events": 6,
        "folded_statistics": {"baseline_std": 0.001},
        "odd_even": {"absolute_depth_difference": 0.002},
        "candidate_score": 94.0,
    }
    result = extract_ml_features(candidate)

    assert tuple(result.to_dict()) == ML_FEATURE_NAMES
    assert result.period == 3.52
    assert result.odd_even_depth_difference == 0.002
    assert result.candidate_category == CandidateCategory.HIGH


def test_missing_and_nonfinite_values_are_safe_and_deterministic():
    candidate = {"period": np.nan, "depth": None, "transit_snr": np.inf}

    first = extract_ml_features(candidate).to_dict()
    second = extract_ml_features(candidate).to_dict()

    assert first == second
    assert all(np.isfinite(value) for value in first.values())


def test_shape_features_accept_folded_arrays():
    phase = np.linspace(-0.5, 0.5, 101)
    flux = 1.0 - 0.01 * (np.abs(phase) < 0.03)
    result = extract_ml_features(
        {"period": 2.0, "duration": 0.1, "depth": 0.01},
        phase=phase,
        folded_flux=flux,
        raw_flux=flux,
    )

    assert 0.0 <= result.symmetry_score <= 1.0
    assert result.phase_folded_variance > 0.0
