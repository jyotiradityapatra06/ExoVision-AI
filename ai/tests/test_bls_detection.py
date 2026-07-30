"""Unit tests for Box Least Squares (BLS) transit detection engine (Phase 2.1)."""

from typing import Dict

import numpy as np
import pytest

from ai.detection import (
    TransitDetectionResult,
    build_transit_mask,
    calculate_transit_snr,
    detect_transit_bls,
)


def generate_synthetic_transit_lightcurve(
    period: float = 3.5,
    duration: float = 0.15,
    transit_time: float = 101.2,
    depth: float = 0.015,
    noise_std: float = 0.001,
    n_points: int = 1200,
    time_span: float = 20.0,
    seed: int = 42,
) -> Dict[str, np.ndarray]:
    """Generate a deterministic synthetic light curve with periodic box transits."""
    np.random.seed(seed)
    time = np.linspace(100.0, 100.0 + time_span, n_points)
    flux = np.ones(n_points, dtype=np.float64)

    # Inject box transits using build_transit_mask
    mask = build_transit_mask(time, period, duration, transit_time)
    flux[mask] -= depth

    # Add Gaussian noise
    flux += np.random.normal(0.0, noise_std, size=n_points)
    flux_err = np.full(n_points, noise_std, dtype=np.float64)
    quality = np.zeros(n_points, dtype=np.int32)

    return {
        "time": time,
        "flux": flux,
        "flux_error": flux_err,
        "quality": quality,
    }


# -----------------------------------------------------------------------------
# 1. Transit Mask Tests
# -----------------------------------------------------------------------------


def test_transit_mask_shape_and_values():
    """Test build_transit_mask generates expected boolean shape and values."""
    time = np.array([100.0, 101.2, 102.0, 104.7, 108.2])
    mask = build_transit_mask(time, period=3.5, duration=0.2, transit_time=101.2)

    assert isinstance(mask, np.ndarray)
    assert mask.dtype == bool
    assert len(mask) == 5
    # Epoch at 101.2 and 101.2 + 2*3.5 = 108.2 should be in-transit (True)
    assert mask[1] is np.bool_(True)
    assert mask[4] is np.bool_(True)
    assert mask[0] is np.bool_(False)


def test_transit_mask_phase_wrapping():
    """Test build_transit_mask correctly handles periodic phase wrapping."""
    time = np.linspace(100.0, 120.0, 500)
    period = 4.0
    duration = 0.2
    t0 = 102.0

    mask = build_transit_mask(time, period, duration, t0)
    # Check that in-transit points repeat periodically every 4.0 days
    in_transit_times = time[mask]
    assert len(in_transit_times) > 0

    for t in (102.0, 106.0, 110.0, 114.0, 118.0):
        # Near central transit times, mask should be True
        idx = np.argmin(np.abs(time - t))
        assert mask[idx] is np.bool_(True)


def test_transit_mask_invalid_parameters():
    """Test build_transit_mask raises ValueError on invalid inputs."""
    time = np.array([1.0, 2.0, 3.0])

    # Period <= 0
    with pytest.raises(ValueError, match="Period must be positive"):
        build_transit_mask(time, period=0.0, duration=0.1, transit_time=1.0)

    # Duration <= 0
    with pytest.raises(ValueError, match="Duration must be positive"):
        build_transit_mask(time, period=3.0, duration=-0.1, transit_time=1.0)

    # Duration >= Period
    with pytest.raises(ValueError, match="smaller than period"):
        build_transit_mask(time, period=2.0, duration=2.5, transit_time=1.0)

    # Non 1D array
    with pytest.raises(ValueError, match="one-dimensional"):
        build_transit_mask(np.ones((2, 2)), period=3.0, duration=0.1, transit_time=1.0)


# -----------------------------------------------------------------------------
# 2. SNR Calculation Tests
# -----------------------------------------------------------------------------


def test_calculate_transit_snr_valid():
    """Test calculate_transit_snr yields expected statistical SNR value."""
    depth = 0.01  # 1% transit depth
    n_pts = 25
    err_val = 0.002
    flux_err = np.full(100, err_val)
    mask = np.zeros(100, dtype=bool)
    mask[:n_pts] = True

    snr = calculate_transit_snr(depth, flux_err, mask)

    # Theoretical SNR: depth / (err_val / sqrt(n_pts)) = 0.01 / (0.002 / 5) = 25.0
    assert pytest.approx(snr, rel=1e-5) == 25.0


def test_calculate_transit_snr_invalid():
    """Test calculate_transit_snr error handling for invalid inputs."""
    flux_err = np.array([0.001, 0.001, 0.001])
    mask = np.array([True, False, False])

    # Length mismatch
    with pytest.raises(ValueError, match="Length mismatch"):
        calculate_transit_snr(0.01, flux_err, np.array([True, False]))

    # Empty mask (no True points)
    with pytest.raises(ValueError, match="at least one True"):
        calculate_transit_snr(0.01, flux_err, np.zeros(3, dtype=bool))

    # Invalid non-positive uncertainties in-transit
    with pytest.raises(ValueError, match="No valid positive flux uncertainties"):
        calculate_transit_snr(0.01, np.array([-0.1, 0.001, 0.001]), mask)


# -----------------------------------------------------------------------------
# 3. BLS Search Engine Tests
# -----------------------------------------------------------------------------


def test_bls_detects_strong_synthetic_transit():
    """Test detect_transit_bls recovers strong periodic transit signal."""
    target_period = 3.5
    target_duration = 0.15
    target_depth = 0.015  # 1.5% depth

    lc = generate_synthetic_transit_lightcurve(
        period=target_period,
        duration=target_duration,
        depth=target_depth,
        noise_std=0.001,
        n_points=1200,
        time_span=20.0,
    )

    result = detect_transit_bls(
        lc, minimum_period=1.0, maximum_period=10.0, minimum_snr=6.0
    )

    assert isinstance(result, TransitDetectionResult)
    assert result.detected is True
    # Period recovered within 2% relative tolerance
    assert pytest.approx(result.period_days, rel=0.02) == target_period
    assert result.depth > 0
    assert pytest.approx(result.depth, rel=0.2) == target_depth
    assert result.snr >= 6.0
    assert result.false_alarm_probability is None


def test_bls_weak_signal_not_detected():
    """Test detect_transit_bls marks detected=False for noisy/weak signal."""
    # Very shallow transit with high noise
    lc = generate_synthetic_transit_lightcurve(
        period=3.5,
        duration=0.15,
        depth=0.0001,
        noise_std=0.01,
        n_points=500,
        time_span=10.0,
    )

    result = detect_transit_bls(
        lc, minimum_period=1.0, maximum_period=5.0, minimum_snr=6.0
    )

    assert isinstance(result, TransitDetectionResult)
    assert result.detected is False


def test_bls_handles_non_finite_samples():
    """Test detect_transit_bls filters NaNs and Infs without failing."""
    lc = generate_synthetic_transit_lightcurve(
        period=2.5, depth=0.02, noise_std=0.001, n_points=500
    )

    # Inject NaNs and Infs into series
    lc["flux"][10] = np.nan
    lc["time"][20] = np.inf
    lc["flux_error"][30] = np.nan

    result = detect_transit_bls(
        lc, minimum_period=1.0, maximum_period=5.0, minimum_snr=5.0
    )

    assert isinstance(result, TransitDetectionResult)
    assert result.detected is True


def test_bls_input_validation_errors():
    """Test detect_transit_bls raises ValueError for invalid inputs."""
    valid_lc = generate_synthetic_transit_lightcurve()

    # Missing required key
    incomplete_lc = {"time": valid_lc["time"], "flux": valid_lc["flux"]}
    with pytest.raises(ValueError, match="missing required keys"):
        detect_transit_bls(incomplete_lc)

    # Insufficient observations (< 20 points)
    short_lc = {
        "time": np.linspace(0, 5, 15),
        "flux": np.ones(15),
        "flux_error": np.full(15, 0.001),
    }
    with pytest.raises(ValueError, match="Insufficient valid observations"):
        detect_transit_bls(short_lc)

    # Minimum period >= maximum period
    with pytest.raises(ValueError, match="greater than minimum period"):
        detect_transit_bls(valid_lc, minimum_period=5.0, maximum_period=2.0)


# -----------------------------------------------------------------------------
# 4. TransitDetectionResult Validation Tests
# -----------------------------------------------------------------------------


def test_transit_detection_result_immutability_and_validation():
    """Test TransitDetectionResult validation and immutability."""
    res = TransitDetectionResult(
        detected=True,
        period_days=3.5,
        duration_days=0.15,
        transit_time=101.2,
        depth=0.015,
        depth_error=0.001,
        snr=15.0,
        power=0.45,
        false_alarm_probability=0.01,
    )

    assert res.detected is True
    assert isinstance(res.period_days, float)

    # Test frozen immutability
    with pytest.raises(AttributeError):
        res.period_days = 5.0  # type: ignore

    # Test invalid negative period
    with pytest.raises(ValueError, match="Period must be positive"):
        TransitDetectionResult(
            detected=True,
            period_days=-1.0,
            duration_days=0.1,
            transit_time=10.0,
            depth=0.01,
            depth_error=0.001,
            snr=10.0,
            power=0.5,
            false_alarm_probability=None,
        )

    # Test out-of-bounds false alarm probability
    with pytest.raises(ValueError, match="between 0.0 and 1.0"):
        TransitDetectionResult(
            detected=True,
            period_days=3.5,
            duration_days=0.1,
            transit_time=10.0,
            depth=0.01,
            depth_error=0.001,
            snr=10.0,
            power=0.5,
            false_alarm_probability=1.5,
        )
