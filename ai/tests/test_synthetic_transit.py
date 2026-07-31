"""Tests for the reusable synthetic transit light-curve generator."""

import numpy as np
import pytest

from ai.detection import build_transit_mask, detect_transit_bls
from ai.preprocessing import preprocess_lightcurve
from ai.simulation import generate_synthetic_transit
from ai.utils.lightcurve_loader import validate_lightcurve


def test_output_shape_order_and_baseline():
    lightcurve = generate_synthetic_transit(
        start_time=10.0,
        end_time=20.0,
        cadence=0.1,
        period=3.0,
        transit_epoch=11.0,
        transit_duration=0.2,
        noise_std=0.0,
    )

    assert validate_lightcurve(lightcurve)
    assert len(lightcurve["time"]) == 100
    assert np.all(np.diff(lightcurve["time"]) > 0)
    assert np.all(lightcurve["flux_error"] > 0)
    mask = build_transit_mask(lightcurve["time"], 3.0, 0.2, 11.0)
    assert np.all(lightcurve["flux"][~mask] == 1.0)
    assert np.median(lightcurve["flux"][~mask]) == pytest.approx(1.0)


def test_transit_depth_and_periodic_placement():
    period = 2.5
    duration = 0.2
    epoch = 1.0
    depth = 0.025
    lightcurve = generate_synthetic_transit(
        end_time=12.0,
        cadence=0.01,
        period=period,
        transit_epoch=epoch,
        transit_duration=duration,
        transit_depth=depth,
        noise_std=0.0,
    )
    mask = build_transit_mask(lightcurve["time"], period, duration, epoch)

    measured_depth = np.median(lightcurve["flux"][~mask]) - np.median(
        lightcurve["flux"][mask]
    )
    assert measured_depth == pytest.approx(depth)
    for center in (1.0, 3.5, 6.0, 8.5, 11.0):
        nearest = np.argmin(np.abs(lightcurve["time"] - center))
        assert mask[nearest]


def test_fixed_seed_is_deterministic():
    first = generate_synthetic_transit(random_seed=81)
    second = generate_synthetic_transit(random_seed=81)

    for key in first:
        np.testing.assert_array_equal(first[key], second[key])


def test_gaussian_noise_generation():
    noise_std = 0.02
    lightcurve = generate_synthetic_transit(
        end_time=100.0,
        cadence=0.01,
        period=200.0,
        transit_epoch=150.0,
        transit_duration=0.2,
        transit_depth=0.01,
        noise_std=noise_std,
        random_seed=7,
    )

    assert np.std(lightcurve["flux"] - 1.0) == pytest.approx(noise_std, rel=0.03)
    assert np.all(lightcurve["flux_error"] == noise_std)


def test_missing_observations():
    lightcurve = generate_synthetic_transit(
        end_time=10.0,
        cadence=0.01,
        missing_fraction=0.25,
        random_seed=3,
    )

    assert len(lightcurve["time"]) == 750
    assert np.all(np.diff(lightcurve["time"]) > 0)
    assert np.any(np.diff(lightcurve["time"]) > 0.01)


def test_positive_and_negative_outlier_injection():
    amplitude = 0.2
    lightcurve = generate_synthetic_transit(
        end_time=10.0,
        cadence=0.01,
        period=20.0,
        transit_epoch=15.0,
        noise_std=0.0,
        outlier_fraction=0.02,
        outlier_amplitude=amplitude,
        random_seed=12,
    )
    outliers = lightcurve["quality"] == 1

    assert np.count_nonzero(outliers) == 20
    assert np.any(lightcurve["flux"][outliers] > 1.0)
    assert np.any(lightcurve["flux"][outliers] < 1.0)
    np.testing.assert_allclose(
        np.abs(lightcurve["flux"][outliers] - 1.0), amplitude
    )


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"period": 0.0}, "period must be positive"),
        ({"transit_duration": 0.0}, "transit_duration must be positive"),
        ({"transit_depth": 0.0}, "transit_depth must be positive"),
        (
            {"period": 2.0, "transit_duration": 2.0},
            "transit_duration must be smaller",
        ),
        ({"missing_fraction": -0.1}, "missing_fraction"),
        ({"missing_fraction": 1.0}, "missing_fraction"),
        ({"outlier_fraction": -0.1}, "outlier_fraction"),
        ({"outlier_fraction": 1.1}, "outlier_fraction"),
    ],
)
def test_invalid_parameters(overrides, message):
    with pytest.raises(ValueError, match=message):
        generate_synthetic_transit(**overrides)


def test_preprocessing_and_bls_integration_recovers_period():
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
        config={
            "detrend_method": "savgol",
            "window_length": 101,
        },
    )
    result = detect_transit_bls(
        processed,
        minimum_period=1.0,
        maximum_period=8.0,
        durations=[0.1, 0.16, 0.2],
        minimum_snr=6.0,
    )

    assert result.detected
    assert result.period_days == pytest.approx(injected_period, rel=0.02)
