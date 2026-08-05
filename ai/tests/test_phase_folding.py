"""Tests for numerical phase folding and folded-transit analysis."""

import json

import numpy as np
import pytest

from ai.detection import TransitDetectionResult, detect_transit_bls
from ai.preprocessing import preprocess_lightcurve
from ai.simulation import generate_synthetic_transit
from ai.transit import (
    bin_folded_lightcurve,
    extract_transit_window,
    fold_detection_result,
    fold_lightcurve,
)


def make_detection(
    period: float = 2.0, transit_time: float = 1.0
) -> TransitDetectionResult:
    return TransitDetectionResult(
        detected=True,
        period_days=period,
        duration_days=0.2,
        transit_time=transit_time,
        depth=0.01,
        depth_error=0.001,
        snr=10.0,
        power=1.0,
        false_alarm_probability=None,
    )


def test_transit_centered_at_zero_and_default_range():
    time = np.array([-3.0, -1.0, 1.0, 3.0, 5.0])
    folded = fold_lightcurve(time, np.ones(5), period=2.0, transit_epoch=1.0)

    np.testing.assert_allclose(folded.phase, 0.0)
    np.testing.assert_allclose(folded.relative_time, 0.0)
    assert np.all(folded.phase >= -0.5)
    assert np.all(folded.phase < 0.5)


def test_sorted_and_unsorted_output_preserves_original_indices():
    time = np.array([0.8, 0.2, 0.6, 0.4])
    flux = np.array([8.0, 2.0, 6.0, 4.0])
    unsorted = fold_lightcurve(
        time, flux, 1.0, 0.0, phase_range=(0.0, 1.0), sort_phase=False
    )
    sorted_result = fold_lightcurve(
        time, flux, 1.0, 0.0, phase_range=(0.0, 1.0), sort_phase=True
    )

    np.testing.assert_array_equal(unsorted.original_indices, np.arange(4))
    np.testing.assert_array_equal(unsorted.flux, flux)
    np.testing.assert_array_equal(sorted_result.original_indices, [1, 3, 2, 0])
    assert np.all(np.diff(sorted_result.phase) >= 0)


@pytest.mark.parametrize(
    ("time", "epoch"),
    [
        (np.array([-10.0, -8.0, -6.0]), -7.0),
        (np.array([100.0, 102.0, 104.0]), -500.0),
        (np.array([-1000.0, 0.0, 1000.0]), 2000.0),
    ],
)
def test_phase_handles_negative_times_and_epochs_outside_range(time, epoch):
    folded = fold_lightcurve(time, np.ones(3), np.float64(3.0), np.float64(epoch))

    assert np.all(folded.phase >= -0.5)
    assert np.all(folded.phase < 0.5)
    assert np.all(np.isfinite(folded.phase))


def test_invalid_samples_are_removed_with_indices_preserved():
    folded = fold_lightcurve(
        np.array([0.0, 1.0, np.nan, 3.0]),
        np.array([1.0, np.inf, 1.0, 0.9]),
        2.0,
        0.0,
        flux_error=np.array([0.1, 0.1, 0.1, 0.1]),
        quality=np.array([0, 1, 2, 3]),
    )

    assert folded.valid_samples == 2
    assert folded.rejected_samples == 2
    np.testing.assert_array_equal(np.sort(folded.original_indices), [0, 3])

    with pytest.raises(ValueError, match="remove_invalid is False"):
        fold_lightcurve(
            np.array([0.0, np.nan]),
            np.ones(2),
            2.0,
            0.0,
            remove_invalid=False,
        )


def test_optional_flux_error_and_quality_are_preserved():
    error = np.array([0.1, 0.2, 0.3])
    quality = np.array([1, 2, 3], dtype=np.int32)
    folded = fold_lightcurve(
        np.array([0.4, 0.1, 0.3]),
        np.ones(3),
        1.0,
        0.0,
        flux_error=error,
        quality=quality,
        phase_range=(0.0, 1.0),
    )

    np.testing.assert_array_equal(folded.flux_error, [0.2, 0.3, 0.1])
    np.testing.assert_array_equal(folded.quality, [2, 3, 1])


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"time": np.ones(3), "flux": np.ones(2)}, "length mismatch"),
        ({"time": np.ones((2, 2)), "flux": np.ones(4)}, "one-dimensional"),
        ({"time": np.ones(3), "flux": np.ones(3), "period": 0.0}, "positive"),
    ],
)
def test_fold_validation_errors(kwargs, message):
    arguments = {"period": 2.0, "transit_epoch": 0.0, **kwargs}
    with pytest.raises(ValueError, match=message):
        fold_lightcurve(**arguments)


def test_deterministic_mean_and_median_binning():
    folded = fold_lightcurve(
        np.array([0.05, 0.10, 0.15, 0.30, 0.35]),
        np.array([1.0, 3.0, 20.0, 5.0, 9.0]),
        1.0,
        0.0,
        phase_range=(0.0, 1.0),
        sort_phase=False,
    )
    mean_result = bin_folded_lightcurve(folded, number_bins=4, aggregation="mean")
    median_result = bin_folded_lightcurve(folded, number_bins=4, aggregation="median")
    repeated = bin_folded_lightcurve(folded, number_bins=4, aggregation="mean")

    assert mean_result.flux[0] == pytest.approx(8.0)
    assert median_result.flux[0] == pytest.approx(3.0)
    assert mean_result.flux[1] == pytest.approx(7.0)
    np.testing.assert_array_equal(mean_result.flux, repeated.flux)
    np.testing.assert_array_equal(mean_result.sample_counts, [3, 2, 0, 0])


def test_empty_bins_and_minimum_samples():
    folded = fold_lightcurve(
        np.array([0.05, 0.10, 0.30]),
        np.array([1.0, 3.0, 5.0]),
        1.0,
        0.0,
        phase_range=(0.0, 1.0),
    )
    binned = bin_folded_lightcurve(folded, bin_width=0.25, minimum_samples=2)

    np.testing.assert_array_equal(binned.sample_counts, [2, 1, 0, 0])
    np.testing.assert_array_equal(binned.valid_bins, [True, False, False, False])
    assert np.isnan(binned.flux[1:]).all()
    assert binned.metadata["empty_bins"] == 2


def test_transit_window_extraction_by_duration_and_phase():
    time = np.linspace(-1.0, 1.0, 201)
    flux = np.ones_like(time)
    flux[np.abs(time) <= 0.1] = 0.98
    folded = fold_lightcurve(time, flux, 2.0, 0.0)
    by_duration = extract_transit_window(
        folded, transit_duration=0.2, baseline_outer_factor=3.0
    )
    by_phase = extract_transit_window(
        folded, phase_half_width=0.05, baseline_outer_factor=3.0
    )

    np.testing.assert_array_equal(by_duration.in_transit_mask, by_phase.in_transit_mask)
    assert len(by_duration.in_transit_indices) > 0
    assert len(by_duration.baseline_indices) > 0
    assert np.median(by_duration.in_transit_flux) < np.median(by_duration.baseline_flux)


def test_alternate_phase_range_window_wraps_around_zero():
    folded = fold_lightcurve(
        np.array([-0.05, 0.05, 0.5]),
        np.array([0.98, 0.98, 1.0]),
        1.0,
        0.0,
        phase_range=(0.0, 1.0),
    )
    window = extract_transit_window(folded, phase_half_width=0.06)

    np.testing.assert_allclose(np.sort(folded.relative_time), [-0.5, -0.05, 0.05])
    assert len(window.in_transit_indices) == 2


def test_detector_result_integration_and_serialization():
    time = np.linspace(0.0, 5.0, 100)
    flux = np.ones(100)
    folded = fold_detection_result(
        time,
        flux,
        make_detection(),
        flux_error=np.full(100, 0.01),
        quality=np.zeros(100, dtype=int),
    )
    window = extract_transit_window(folded, transit_duration=0.2)
    binned = bin_folded_lightcurve(folded, number_bins=10)

    assert folded.period_days == 2.0
    json.dumps(folded.to_dict(), allow_nan=False)
    json.dumps(window.to_dict(), allow_nan=False)
    json.dumps(binned.to_dict(), allow_nan=False)


def test_synthetic_bls_phase_fold_integration():
    duration = 0.16
    lightcurve = generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=3.7,
        transit_epoch=101.1,
        transit_duration=duration,
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
        durations=[0.1, duration, 0.2],
        minimum_snr=6.0,
    )
    folded = fold_detection_result(
        processed["time"],
        processed["flux"],
        detection,
        flux_error=processed["flux_error"],
        quality=processed["quality"],
    )
    window = extract_transit_window(
        folded,
        transit_duration=detection.duration_days,
        baseline_outer_factor=4.0,
    )

    minimum_phase = folded.phase[np.argmin(folded.flux)]
    assert abs(minimum_phase) < 0.05
    assert np.median(window.in_transit_flux) < np.median(window.baseline_flux)
