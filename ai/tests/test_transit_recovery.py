"""Tests for transit detection recovery metrics and decisions."""

import json

import numpy as np
import pytest

from ai.detection import TransitDetectionResult, detect_transit_bls
from ai.evaluation import (
    HarmonicClassification,
    InjectedTransitParameters,
    RecoveryThresholds,
    calculate_absolute_period_error,
    calculate_depth_error,
    calculate_duration_error,
    calculate_period_ratio,
    calculate_relative_period_error,
    calculate_wrapped_epoch_error,
    classify_period_harmonic,
    evaluate_transit_recovery,
)
from ai.preprocessing import preprocess_lightcurve
from ai.simulation import generate_synthetic_transit


@pytest.fixture
def injected() -> InjectedTransitParameters:
    return InjectedTransitParameters(
        period_days=4.0,
        transit_time=10.0,
        duration_days=0.2,
        depth=0.02,
    )


def make_detection(
    period: float = 4.0,
    transit_time: float = 10.0,
    duration: float = 0.2,
    depth: float = 0.02,
    detected: bool = True,
) -> TransitDetectionResult:
    """Create a valid detector result for focused metric tests."""
    return TransitDetectionResult(
        detected=detected,
        period_days=period,
        duration_days=duration,
        transit_time=transit_time,
        depth=depth,
        depth_error=0.001,
        snr=12.0,
        power=1.0,
        false_alarm_probability=None,
    )


def test_exact_period_recovery_and_serialization(injected):
    result = evaluate_transit_recovery(injected, make_detection())

    assert result.recovered
    assert result.harmonic is HarmonicClassification.FUNDAMENTAL
    assert result.absolute_period_error == 0.0
    assert result.relative_period_error == 0.0
    assert result.period_ratio == 1.0
    assert result.epoch_error_days == 0.0
    assert result.duration_error_days == 0.0
    assert result.depth_error == 0.0
    assert json.loads(json.dumps(result.to_dict()))["harmonic"] == "fundamental"


def test_small_period_error_is_recovered(injected):
    detection = make_detection(period=np.float64(4.04))
    result = evaluate_transit_recovery(injected, detection)

    assert result.recovered
    assert result.absolute_period_error == pytest.approx(0.04)
    assert result.relative_period_error == pytest.approx(0.01)
    assert calculate_absolute_period_error(4.0, 4.04) == pytest.approx(0.04)
    assert calculate_relative_period_error(4.0, 4.04) == pytest.approx(0.01)
    assert calculate_period_ratio(4.0, 4.04) == pytest.approx(1.01)


def test_period_outside_tolerance_is_not_recovered(injected):
    thresholds = RecoveryThresholds(
        period_relative_tolerance=0.005,
        harmonic_relative_tolerance=0.1,
    )
    result = evaluate_transit_recovery(
        injected, make_detection(period=4.04), thresholds
    )

    assert result.harmonic is HarmonicClassification.FUNDAMENTAL
    assert not result.recovered
    assert "Period-to-harmonic error exceeds tolerance." in result.notes


@pytest.mark.parametrize(
    ("period", "expected"),
    [
        (2.0, HarmonicClassification.HALF_PERIOD),
        (8.0, HarmonicClassification.DOUBLE_PERIOD),
        (12.0, HarmonicClassification.OTHER_HARMONIC),
        (4.8, HarmonicClassification.INCORRECT),
    ],
)
def test_harmonic_classification(period, expected):
    assert classify_period_harmonic(4.0, period) is expected


def test_harmonic_must_be_explicitly_accepted(injected):
    detected = make_detection(period=2.0, duration=0.1)
    default_result = evaluate_transit_recovery(injected, detected)
    harmonic_result = evaluate_transit_recovery(
        injected,
        detected,
        RecoveryThresholds(
            accepted_harmonics=(
                HarmonicClassification.FUNDAMENTAL,
                HarmonicClassification.HALF_PERIOD,
            )
        ),
    )

    assert not default_result.recovered
    assert harmonic_result.recovered
    assert harmonic_result.harmonic_period_relative_error == 0.0


def test_wrapped_epoch_error_near_period_boundary(injected):
    error = calculate_wrapped_epoch_error(10.0, 13.95, 4.0)
    result = evaluate_transit_recovery(
        injected, make_detection(transit_time=13.95)
    )

    assert error == pytest.approx(0.05)
    assert result.epoch_error_days == pytest.approx(0.05)


def test_duration_and_depth_errors(injected):
    result = evaluate_transit_recovery(
        injected,
        make_detection(duration=0.25, depth=0.015),
        RecoveryThresholds(
            duration_relative_tolerance=0.2,
            depth_relative_tolerance=0.2,
        ),
    )

    assert calculate_duration_error(0.2, 0.25) == pytest.approx(0.05)
    assert calculate_depth_error(0.02, 0.015) == pytest.approx(0.005)
    assert result.relative_duration_error == pytest.approx(0.25)
    assert result.relative_depth_error == pytest.approx(0.25)
    assert not result.recovered
    assert "Relative duration error exceeds tolerance." in result.notes
    assert "Relative depth error exceeds tolerance." in result.notes


def test_configurable_tolerances(injected):
    detection = make_detection(
        period=4.08,
        transit_time=10.15,
        duration=0.23,
        depth=0.017,
    )
    strict = evaluate_transit_recovery(
        injected,
        detection,
        RecoveryThresholds(
            period_relative_tolerance=0.01,
            harmonic_relative_tolerance=0.03,
            epoch_absolute_tolerance=0.1,
            duration_relative_tolerance=0.1,
            depth_relative_tolerance=0.1,
        ),
    )
    relaxed = evaluate_transit_recovery(
        injected,
        detection,
        RecoveryThresholds(
            period_relative_tolerance=0.03,
            harmonic_relative_tolerance=0.03,
            epoch_absolute_tolerance=0.2,
            duration_relative_tolerance=0.2,
            depth_relative_tolerance=0.2,
        ),
    )

    assert not strict.recovered
    assert relaxed.recovered


def test_false_detector_flag_prevents_recovery(injected):
    result = evaluate_transit_recovery(
        injected, make_detection(detected=False)
    )

    assert not result.recovered
    assert "Detector significance flag is false." in result.notes


def test_non_positive_detected_depth_prevents_recovery(injected):
    result = evaluate_transit_recovery(injected, make_detection(depth=0.0))

    assert not result.recovered
    assert "Detected transit depth is not positive." in result.notes


def test_invalid_or_non_finite_detector_output(injected):
    invalid = make_detection()
    object.__setattr__(invalid, "period_days", np.nan)

    with pytest.raises(ValueError, match="detected.period_days must be finite"):
        evaluate_transit_recovery(injected, invalid)
    with pytest.raises(ValueError, match="TransitDetectionResult"):
        evaluate_transit_recovery(injected, object())  # type: ignore[arg-type]


def test_synthetic_bls_recovery_integration():
    injected = InjectedTransitParameters(
        period_days=3.7,
        transit_time=101.1,
        duration_days=0.16,
        depth=0.018,
    )
    lightcurve = generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=injected.period_days,
        transit_epoch=injected.transit_time,
        transit_duration=injected.duration_days,
        transit_depth=injected.depth,
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
    recovery = evaluate_transit_recovery(
        injected,
        detection,
        RecoveryThresholds(
            period_relative_tolerance=0.02,
            epoch_absolute_tolerance=0.1,
            duration_relative_tolerance=0.3,
            depth_relative_tolerance=0.3,
        ),
    )

    assert recovery.recovered
    assert recovery.harmonic is HarmonicClassification.FUNDAMENTAL
