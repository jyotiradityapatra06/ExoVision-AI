"""Tests for transit-event and candidate feature extraction."""

import json

import numpy as np
import pytest

from ai.detection import TransitDetectionResult, detect_transit_bls
from ai.evaluation import InjectedTransitParameters, evaluate_transit_recovery
from ai.preprocessing import preprocess_lightcurve
from ai.simulation import generate_synthetic_transit
from ai.transit import (
    CandidateThresholds,
    TransitEvent,
    build_transit_candidate,
    evaluate_odd_even_consistency,
    extract_transit_events,
    fold_detection_result,
)


def make_detection(
    period: float = 2.0,
    epoch: float = 1.0,
    duration: float = 0.2,
    depth: float = 0.02,
    detected: bool = True,
) -> TransitDetectionResult:
    return TransitDetectionResult(
        detected=detected,
        period_days=period,
        duration_days=duration,
        transit_time=epoch,
        depth=depth,
        depth_error=0.001,
        snr=12.0,
        power=5.0,
        false_alarm_probability=None,
    )


def synthetic_series(
    noise: float = 0.001,
) -> tuple[dict[str, np.ndarray], TransitDetectionResult]:
    lightcurve = generate_synthetic_transit(
        start_time=0.0,
        end_time=12.0,
        cadence=0.02,
        period=2.0,
        transit_epoch=1.0,
        transit_duration=0.2,
        transit_depth=0.02,
        noise_std=noise,
        random_seed=17,
    )
    return lightcurve, make_detection()


def test_valid_candidate_and_identifier_generation():
    lightcurve, detection = synthetic_series()
    first = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        flux_error=lightcurve["flux_error"],
        quality=lightcurve["quality"],
    )
    second = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        flux_error=lightcurve["flux_error"],
        quality=lightcurve["quality"],
    )

    assert first.candidate_id.startswith("exovision-")
    assert first.candidate_id == second.candidate_id
    assert first.period_days == 2.0
    assert first.duration_period_ratio == pytest.approx(0.1)
    assert first.transit_phase_fraction == pytest.approx(0.1)
    assert first.observed_transit_events == 6
    assert first.in_transit_sample_count > 0
    assert first.out_of_transit_sample_count > 0


def test_source_identifier_changes_candidate_identifier():
    lightcurve, detection = synthetic_series()
    anonymous = build_transit_candidate(
        lightcurve["time"], lightcurve["flux"], detection
    )
    sourced = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        source_id="TIC-123",
    )

    assert sourced.source_id == "TIC-123"
    assert sourced.candidate_id != anonymous.candidate_id


def test_event_centers_counts_depth_and_snr():
    lightcurve, _ = synthetic_series()
    events = extract_transit_events(
        lightcurve["time"],
        lightcurve["flux"],
        2.0,
        1.0,
        0.2,
        flux_error=lightcurve["flux_error"],
    )

    np.testing.assert_allclose(
        [event.expected_center_time for event in events],
        [1.0, 3.0, 5.0, 7.0, 9.0, 11.0],
    )
    assert all(event.sample_count > 0 for event in events)
    assert all(
        event.local_depth is not None and event.local_depth > 0 for event in events
    )
    assert all(event.local_snr is not None and event.local_snr > 0 for event in events)


def test_complete_partial_and_gapped_events():
    time = np.arange(0.95, 5.06, 0.02)
    flux = np.ones_like(time)
    for center in (1.0, 3.0, 5.0):
        flux[np.abs(time - center) <= 0.1] -= 0.02
    keep = np.abs(time - 3.0) > 0.12
    events = extract_transit_events(time[keep], flux[keep], 2.0, 1.0, 0.2)

    assert len(events) == 3
    assert not events[0].fully_observed
    assert events[1].sample_count == 0
    assert "no_in_transit_samples" in events[1].warnings
    assert not events[-1].fully_observed


def make_event(number: int, depth: float | None) -> TransitEvent:
    return TransitEvent(
        event_number=number,
        expected_center_time=float(number),
        window_start=float(number) - 0.1,
        window_end=float(number) + 0.1,
        fully_observed=True,
        sample_count=5,
        baseline_sample_count=10,
        local_depth=depth,
        local_scatter=0.001,
        local_snr=None if depth is None else depth / 0.001,
        warnings=(),
    )


def test_odd_even_consistent_and_inconsistent_depths():
    consistent = evaluate_odd_even_consistency(
        tuple(make_event(index, 0.02) for index in range(1, 5)),
        relative_tolerance=0.2,
    )
    inconsistent = evaluate_odd_even_consistency(
        (
            make_event(1, 0.02),
            make_event(2, 0.01),
            make_event(3, 0.021),
            make_event(4, 0.009),
        ),
        relative_tolerance=0.2,
    )

    assert consistent.status == "consistent"
    assert consistent.absolute_depth_difference == 0.0
    assert inconsistent.status == "inconsistent"
    assert inconsistent.relative_depth_difference > 0.2


def test_odd_even_insufficient_events():
    result = evaluate_odd_even_consistency((make_event(1, 0.02),))

    assert result.status == "insufficient_events"
    assert result.usable_odd_events == 1
    assert result.usable_even_events == 0


def test_candidate_with_one_observed_event():
    time = np.arange(0.8, 1.21, 0.01)
    flux = np.ones_like(time)
    flux[np.abs(time - 1.0) <= 0.1] -= 0.02
    candidate = build_transit_candidate(time, flux, make_detection())

    assert candidate.observed_transit_events == 1
    assert candidate.odd_even.status == "insufficient_events"


def test_candidate_flux_snr_depth_and_quality_features():
    lightcurve, detection = synthetic_series()
    lightcurve["flux"][0] = np.nan
    lightcurve["quality"][10] = 1
    candidate = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        flux_error=lightcurve["flux_error"],
        quality=lightcurve["quality"],
    )
    stats = candidate.folded_statistics

    assert stats.in_transit_median < stats.baseline_median
    assert stats.measured_depth > 0
    assert stats.measured_to_detector_depth_ratio == pytest.approx(1.0, rel=0.2)
    assert stats.measured_snr > 0
    assert stats.robust_snr > 0
    assert candidate.transit_snr == 12.0
    assert candidate.data_quality.valid_sample_fraction == pytest.approx(599 / 600)
    assert candidate.data_quality.rejected_sample_fraction == pytest.approx(1 / 600)
    assert candidate.data_quality.phase_coverage > 0
    assert candidate.data_quality.populated_phase_bins > 0
    assert candidate.data_quality.quality_flagged_fraction > 0
    assert "quality_flagged_samples_present" in candidate.warnings


def test_flat_and_noisy_light_curves_are_processable():
    time = np.arange(0.0, 10.0, 0.02)
    flat = build_transit_candidate(time, np.ones_like(time), make_detection())
    rng = np.random.default_rng(5)
    noisy = build_transit_candidate(
        time,
        1.0 + rng.normal(0.0, 0.05, len(time)),
        make_detection(),
        thresholds=CandidateThresholds(minimum_measured_snr=100.0),
    )

    assert "non_positive_measured_depth" in flat.warnings
    assert "flat_local_baseline" in flat.warnings
    assert noisy.folded_statistics.baseline_std > 0
    assert {
        "low_measured_snr",
        "non_positive_measured_depth",
    }.intersection(noisy.warnings)


def test_missing_baseline_samples_adds_warning():
    time = np.array([0.98, 1.0, 1.02, 2.98, 3.0, 3.02])
    flux = np.full(len(time), 0.98)
    candidate = build_transit_candidate(
        time,
        flux,
        make_detection(),
        thresholds=CandidateThresholds(minimum_baseline_samples=1),
    )

    assert candidate.out_of_transit_sample_count == 0
    assert "insufficient_baseline_samples" in candidate.warnings


def test_invalid_inputs_and_inconsistent_folded_result():
    lightcurve, detection = synthetic_series()
    with pytest.raises(ValueError, match="length mismatch"):
        build_transit_candidate(lightcurve["time"], lightcurve["flux"][:-1], detection)

    invalid = make_detection()
    object.__setattr__(invalid, "period_days", np.nan)
    with pytest.raises(ValueError, match="finite"):
        build_transit_candidate(lightcurve["time"], lightcurve["flux"], invalid)

    for field, value, message in (
        ("duration_days", 0.0, "duration"),
        ("duration_days", 2.0, "duration"),
        ("depth", 0.0, "depth"),
    ):
        invalid = make_detection()
        object.__setattr__(invalid, field, value)
        with pytest.raises(ValueError, match=message):
            build_transit_candidate(lightcurve["time"], lightcurve["flux"], invalid)

    wrong_fold = fold_detection_result(
        lightcurve["time"], lightcurve["flux"], make_detection(period=2.1)
    )
    with pytest.raises(ValueError, match="period is inconsistent"):
        build_transit_candidate(
            lightcurve["time"], lightcurve["flux"], detection, folded=wrong_fold
        )


def test_json_serialization_and_recovery_reuse():
    lightcurve, detection = synthetic_series()
    recovery = evaluate_transit_recovery(
        InjectedTransitParameters(2.0, 1.0, 0.2, 0.02), detection
    )
    candidate = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        recovery=recovery,
        source_id="synthetic-1",
    )
    payload = candidate.to_dict()

    assert payload["recovery"]["recovered"] is True
    assert payload["source_id"] == "synthetic-1"
    json.dumps(payload, allow_nan=False)

    failed_recovery = evaluate_transit_recovery(
        InjectedTransitParameters(3.3, 1.0, 0.2, 0.02), detection
    )
    failed_candidate = build_transit_candidate(
        lightcurve["time"],
        lightcurve["flux"],
        detection,
        recovery=failed_recovery,
    )
    failed_payload = failed_candidate.to_dict()
    assert failed_payload["recovery"]["harmonic_period_relative_error"] is None
    json.dumps(failed_payload, allow_nan=False)


def test_synthetic_bls_candidate_integration():
    injected_period = 3.7
    lightcurve = generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=injected_period,
        transit_epoch=101.1,
        transit_duration=0.16,
        transit_depth=0.018,
        noise_std=0.001,
        random_seed=42,
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
        durations=[0.1, 0.16, 0.2],
        minimum_snr=6.0,
    )
    folded = fold_detection_result(
        processed["time"],
        processed["flux"],
        detection,
        flux_error=processed["flux_error"],
        quality=processed["quality"],
    )
    candidate = build_transit_candidate(
        processed["time"],
        processed["flux"],
        detection,
        flux_error=processed["flux_error"],
        quality=processed["quality"],
        folded=folded,
        source_id="integration-synthetic",
    )

    assert candidate.period_days == pytest.approx(injected_period, rel=0.02)
    assert candidate.depth > 0
    assert candidate.transit_snr > 0
    assert candidate.observed_transit_events > 1
    assert (
        candidate.folded_statistics.in_transit_median
        < candidate.folded_statistics.baseline_median
    )
    json.dumps(candidate.to_dict(), allow_nan=False)
