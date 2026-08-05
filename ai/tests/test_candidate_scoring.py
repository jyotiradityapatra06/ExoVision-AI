"""Tests for transparent heuristic transit-candidate scoring."""

import json
from dataclasses import fields, replace

import numpy as np
import pytest

from ai.detection import TransitDetectionResult, detect_transit_bls
from ai.evaluation import (
    CandidateScoringConfig,
    ComponentWeights,
    InjectedTransitParameters,
    ScoreCategory,
    evaluate_transit_recovery,
    rank_transit_candidates,
    score_transit_candidate,
)
from ai.preprocessing import preprocess_lightcurve
from ai.simulation import generate_synthetic_transit
from ai.transit import build_transit_candidate


def make_candidate(
    noise: float = 0.001,
    detected: bool = True,
    source_id: str = "score-test",
):
    lightcurve = generate_synthetic_transit(
        start_time=0.0,
        end_time=12.0,
        cadence=0.02,
        period=2.0,
        transit_epoch=1.0,
        transit_duration=0.2,
        transit_depth=0.02,
        noise_std=noise,
        random_seed=9,
    )
    detection = TransitDetectionResult(
        detected=detected,
        period_days=2.0,
        duration_days=0.2,
        transit_time=1.0,
        depth=0.02,
        depth_error=0.001,
        snr=12.0 if detected else 1.0,
        power=5.0,
        false_alarm_probability=None,
    )
    return build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        flux_error=lightcurve["flux_error"],
        quality=lightcurve["quality"],
        source_id=source_id,
    )


def only_weights(**selected: float) -> ComponentWeights:
    values = {field.name: 0.0 for field in fields(ComponentWeights)}
    values.update(selected)
    return ComponentWeights(**values)


def no_penalty_config(**overrides):
    values = {
        name: 0.0
        for name in (
            "low_snr_penalty",
            "insufficient_events_penalty",
            "insufficient_transit_samples_penalty",
            "insufficient_baseline_samples_penalty",
            "poor_valid_fraction_penalty",
            "quality_flags_penalty",
            "poor_phase_coverage_penalty",
            "geometry_penalty",
            "depth_inconsistency_penalty",
            "odd_even_mismatch_penalty",
            "detector_not_detected_penalty",
            "incorrect_recovery_penalty",
            "invalid_values_penalty",
        )
    }
    values.update(overrides)
    return CandidateScoringConfig(**values)


def penalty(result, name):
    return next(item for item in result.penalties if item.name == name)


def component(result, name):
    return next(item for item in result.components if item.name == name)


def test_high_quality_candidate_and_score_metadata():
    result = score_transit_candidate(make_candidate())

    assert 0.0 <= result.total_score <= 100.0
    assert result.category in (ScoreCategory.HIGH, ScoreCategory.MODERATE)
    assert not result.rejected
    assert result.metadata["is_probability"] is False
    assert result.score_range == (0.0, 100.0)
    assert len(result.components) == 14


def test_exact_category_boundaries():
    candidate = make_candidate()
    weights = only_weights(detector_significance=1.0, transit_snr=1.0)
    detection = replace(candidate.detection, snr=5.0)
    candidate = replace(candidate, detection=detection)
    common = {
        "weights": weights,
        "target_transit_snr": 10.0,
        "minimum_transit_snr": 0.0,
    }

    high = score_transit_candidate(
        candidate,
        no_penalty_config(
            **common,
            high_score_threshold=75.0,
            moderate_score_threshold=50.0,
            low_score_threshold=25.0,
        ),
    )
    moderate = score_transit_candidate(
        candidate,
        no_penalty_config(
            **common,
            high_score_threshold=80.0,
            moderate_score_threshold=75.0,
            low_score_threshold=50.0,
        ),
    )
    low = score_transit_candidate(
        candidate,
        no_penalty_config(
            **common,
            high_score_threshold=90.0,
            moderate_score_threshold=80.0,
            low_score_threshold=75.0,
        ),
    )

    assert high.total_score == pytest.approx(75.0)
    assert high.category is ScoreCategory.HIGH
    assert moderate.category is ScoreCategory.MODERATE
    assert low.category is ScoreCategory.LOW


def test_configurable_weights_and_invalid_weights():
    candidate = make_candidate()
    detector_only = score_transit_candidate(
        candidate,
        no_penalty_config(weights=only_weights(detector_significance=1.0)),
    )
    snr_only = score_transit_candidate(
        replace(candidate, detection=replace(candidate.detection, snr=0.0)),
        no_penalty_config(weights=only_weights(transit_snr=1.0)),
    )

    assert detector_only.total_score == 100.0
    assert snr_only.total_score == 0.0
    with pytest.raises(ValueError, match="cannot be negative"):
        ComponentWeights(transit_snr=-1.0)
    with pytest.raises(ValueError, match="At least one"):
        only_weights()


def test_high_snr_normalization_and_low_snr_penalty():
    candidate = make_candidate()
    high = score_transit_candidate(
        replace(candidate, detection=replace(candidate.detection, snr=1000.0))
    )
    low = score_transit_candidate(
        replace(candidate, detection=replace(candidate.detection, snr=1.0))
    )

    assert component(high, "transit_snr").normalized_value == 1.0
    assert penalty(low, "low_transit_snr").applied
    assert low.total_score < high.total_score


def test_insufficient_event_and_sample_penalties():
    candidate = make_candidate()
    candidate = replace(
        candidate,
        observed_transit_events=1,
        in_transit_sample_count=1,
        out_of_transit_sample_count=1,
    )
    result = score_transit_candidate(candidate)

    assert penalty(result, "insufficient_observed_transits").applied
    assert penalty(result, "insufficient_in_transit_samples").applied
    assert penalty(result, "insufficient_baseline_samples").applied


def test_quality_and_phase_coverage_penalties():
    candidate = make_candidate()
    quality = replace(
        candidate.data_quality,
        valid_sample_fraction=0.5,
        quality_flagged_fraction=0.5,
        phase_coverage=0.1,
        populated_phase_bins=5,
        total_phase_bins=50,
    )
    result = score_transit_candidate(replace(candidate, data_quality=quality))

    assert penalty(result, "poor_valid_sample_fraction").applied
    assert penalty(result, "excessive_quality_flags").applied
    assert penalty(result, "poor_phase_coverage").applied


def test_geometry_and_depth_consistency_behaviors():
    candidate = make_candidate()
    implausible = score_transit_candidate(replace(candidate, duration_period_ratio=0.5))
    inconsistent_stats = replace(
        candidate.folded_statistics,
        measured_to_detector_depth_ratio=2.0,
    )
    inconsistent = score_transit_candidate(
        replace(candidate, folded_statistics=inconsistent_stats)
    )

    assert implausible.rejected
    assert "implausible_transit_geometry" in implausible.hard_failure_flags
    assert penalty(inconsistent, "depth_inconsistency").applied
    assert component(inconsistent, "depth_consistency").normalized_value == 0.0


def test_odd_even_contribution_and_mismatch_penalty():
    candidate = make_candidate()
    consistent = replace(candidate.odd_even, status="consistent")
    inconsistent = replace(
        candidate.odd_even,
        status="inconsistent",
        relative_depth_difference=1.0,
    )
    good = score_transit_candidate(replace(candidate, odd_even=consistent))
    bad = score_transit_candidate(replace(candidate, odd_even=inconsistent))

    assert component(good, "odd_even_consistency").normalized_value == 1.0
    assert component(bad, "odd_even_consistency").normalized_value == 0.0
    assert penalty(bad, "odd_even_mismatch").applied
    assert bad.total_score < good.total_score


def test_recovery_contribution_missing_and_incorrect_recovery():
    candidate = make_candidate()
    successful = evaluate_transit_recovery(
        InjectedTransitParameters(2.0, 1.0, 0.2, 0.02),
        candidate.detection,
    )
    incorrect = evaluate_transit_recovery(
        InjectedTransitParameters(3.3, 1.0, 0.2, 0.02),
        candidate.detection,
    )
    missing = score_transit_candidate(candidate)
    good = score_transit_candidate(replace(candidate, recovery=successful))
    bad = score_transit_candidate(
        replace(candidate, recovery=incorrect),
        CandidateScoringConfig(reject_incorrect_recovery=True),
    )

    assert component(missing, "recovery_accuracy").normalized_value is None
    assert component(good, "recovery_accuracy").normalized_value == 1.0
    assert bad.rejected
    assert penalty(bad, "incorrect_recovery").applied


def test_detector_hard_rejection_nonfinite_values_and_score_clamping():
    candidate = make_candidate()
    detector_rejected = score_transit_candidate(
        replace(
            candidate,
            detection=replace(candidate.detection, detected=False),
        )
    )
    nonfinite = replace(candidate, duration_period_ratio=np.nan)
    invalid = score_transit_candidate(nonfinite)
    clamped = score_transit_candidate(
        replace(candidate, detection=replace(candidate.detection, snr=0.0)),
        CandidateScoringConfig(low_snr_penalty=1000.0),
    )

    assert detector_rejected.rejected
    assert "detector_not_detected" in detector_rejected.hard_failure_flags
    assert invalid.rejected
    assert "non_finite_candidate_values" in invalid.hard_failure_flags
    assert clamped.total_score == 0.0


def test_json_safe_serialization():
    result = score_transit_candidate(make_candidate())
    payload = result.to_dict()

    assert payload["metadata"]["is_probability"] is False
    assert payload["configuration"]["weight_normalization"].startswith("normalized")
    json.dumps(payload, allow_nan=False)


def test_deterministic_ranking_and_rejections_last():
    first = replace(make_candidate(source_id="a"), candidate_id="candidate-a")
    second = replace(make_candidate(source_id="b"), candidate_id="candidate-b")
    rejected = replace(
        make_candidate(source_id="z", detected=False),
        candidate_id="candidate-z",
    )
    ranked = rank_transit_candidates((rejected, second, first))

    assert [item.candidate_id for item in ranked[:2]] == [
        "candidate-a",
        "candidate-b",
    ]
    assert ranked[-1].candidate_id == "candidate-z"
    assert ranked[-1].rejected


def build_end_to_end_score(noise: float, depth: float, seed: int):
    period = 3.7
    duration = 0.16
    epoch = 101.1
    lightcurve = generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=period,
        transit_epoch=epoch,
        transit_duration=duration,
        transit_depth=depth,
        noise_std=noise,
        random_seed=seed,
        missing_fraction=0.05,
    )
    processed = preprocess_lightcurve(
        lightcurve,
        config={"detrend_method": "savgol", "window_length": 101},
    )
    detection = detect_transit_bls(
        processed,
        minimum_period=1.0,
        maximum_period=8.0,
        durations=[0.1, duration, 0.2],
        minimum_snr=6.0,
    )
    recovery = evaluate_transit_recovery(
        InjectedTransitParameters(period, epoch, duration, depth),
        detection,
    )
    candidate = build_transit_candidate(
        processed["time"],
        processed["flux"],
        detection,
        flux_error=processed["flux_error"],
        quality=processed["quality"],
        recovery=recovery,
    )
    return score_transit_candidate(candidate)


def test_strong_and_weak_synthetic_end_to_end_scoring():
    strong = build_end_to_end_score(noise=0.001, depth=0.018, seed=42)
    weak = build_end_to_end_score(noise=0.006, depth=0.006, seed=43)

    assert not strong.rejected
    assert strong.category in (ScoreCategory.HIGH, ScoreCategory.MODERATE)
    assert strong.total_score > weak.total_score
