"""Unit tests for Astronomy Preprocessing Engine (Phase 1.3)."""

from pathlib import Path

import numpy as np
import pytest
from astropy.io import fits

from ai.preprocessing import (
    clean_lightcurve,
    detrend_lightcurve,
    normalize_lightcurve,
    preprocess_lightcurve,
    remove_outliers,
)
from ai.utils.lightcurve_loader import validate_lightcurve


@pytest.fixture
def synthetic_raw_lightcurve():
    """Generate a synthetic light curve with baseline trend, transit dip, flare,
    and noise."""
    np.random.seed(42)
    time = np.linspace(100.0, 110.0, 300)

    # Low-frequency parabolic trend
    trend = 1000.0 + 50.0 * np.sin(0.2 * time)
    noise = np.random.normal(0.0, 1.0, size=300)
    flux = trend + noise
    flux_err = np.ones(300, dtype=np.float64)
    quality = np.zeros(300, dtype=np.int32)

    # Exoplanet transit dip at time index 150 (depth = 15.0 units ~ 1.5%)
    flux[148:153] -= 15.0

    # Stellar flare spike at time index 50 (+50.0 units ~ 5%)
    flux[50] += 50.0

    return {
        "time": time,
        "flux": flux,
        "flux_error": flux_err,
        "quality": quality,
    }


@pytest.fixture
def synthetic_fits_file(tmp_path: Path, synthetic_raw_lightcurve):
    """Generate a temporary synthetic FITS light curve file."""
    fits_path = tmp_path / "test_lc.fits"
    lc = synthetic_raw_lightcurve

    col_time = fits.Column(name="TIME", format="D", array=lc["time"])
    col_flux = fits.Column(name="PDCSAP_FLUX", format="D", array=lc["flux"])
    col_err = fits.Column(name="PDCSAP_FLUX_ERR", format="D", array=lc["flux_error"])
    col_qual = fits.Column(name="SAP_QUALITY", format="J", array=lc["quality"])

    cols = fits.ColDefs([col_time, col_flux, col_err, col_qual])
    bintable_hdu = fits.BinTableHDU.from_columns(cols)
    primary_hdu = fits.PrimaryHDU()

    with fits.HDUList([primary_hdu, bintable_hdu]) as hdul:
        hdul.writeto(fits_path, overwrite=True)

    return fits_path


# -----------------------------------------------------------------------------
# 1. clean_lightcurve Tests
# -----------------------------------------------------------------------------


def test_clean_lightcurve_nan_and_inf_removal():
    """Test clean_lightcurve removes NaNs and Infs while preserving alignment."""
    time = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    flux = np.array([10.0, np.nan, 30.0, np.inf, 50.0])
    flux_err = np.array([0.1, 0.1, np.nan, 0.1, 0.1])
    quality = np.array([0, 0, 0, 0, 0], dtype=np.int32)

    c_time, c_flux, c_err, c_qual = clean_lightcurve(time, flux, flux_err, quality)

    # Valid points: index 0 (1.0) and index 4 (5.0)
    assert len(c_time) == 2
    np.testing.assert_array_equal(c_time, np.array([1.0, 5.0]))
    np.testing.assert_array_equal(c_flux, np.array([10.0, 50.0]))
    np.testing.assert_array_equal(c_err, np.array([0.1, 0.1]))
    np.testing.assert_array_equal(c_qual, np.array([0, 0]))


def test_clean_lightcurve_positive_time_requirement():
    """Test optional requirement for positive timestamps."""
    time = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    flux = np.array([10.0, 20.0, 30.0, 40.0, 50.0])
    flux_err = np.array([0.1, 0.1, 0.1, 0.1, 0.1])
    quality = np.zeros(5, dtype=np.int32)

    # Default require_positive_time=False allows negative/zero time
    c_time_def, _, _, _ = clean_lightcurve(time, flux, flux_err, quality)
    assert len(c_time_def) == 5

    # require_positive_time=True keeps only time > 0
    c_time_pos, c_flux_pos, _, _ = clean_lightcurve(
        time, flux, flux_err, quality, require_positive_time=True
    )
    assert len(c_time_pos) == 2
    np.testing.assert_array_equal(c_time_pos, np.array([1.0, 2.0]))
    np.testing.assert_array_equal(c_flux_pos, np.array([40.0, 50.0]))


def test_clean_lightcurve_duplicate_timestamps():
    """Test duplicate timestamps are deduplicated keeping the first occurrence."""
    time = np.array([1.0, 2.0, 2.0, 3.0, 2.0, 4.0])
    flux = np.array([100.0, 200.0, 999.0, 300.0, 888.0, 400.0])
    flux_err = np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
    quality = np.array([0, 1, 2, 3, 4, 5], dtype=np.int32)

    c_time, c_flux, c_err, c_qual = clean_lightcurve(time, flux, flux_err, quality)

    assert len(c_time) == 4
    np.testing.assert_array_equal(c_time, np.array([1.0, 2.0, 3.0, 4.0]))
    # Must keep first occurrence of 2.0 (flux=200.0, quality=1)
    np.testing.assert_array_equal(c_flux, np.array([100.0, 200.0, 300.0, 400.0]))
    np.testing.assert_array_equal(c_qual, np.array([0, 1, 3, 5]))


def test_clean_lightcurve_invalid_inputs():
    """Test clean_lightcurve raises ValueError on invalid inputs."""
    time = np.array([1.0, 2.0, 3.0])
    flux = np.array([10.0, 20.0])
    err = np.array([0.1, 0.1, 0.1])
    qual = np.array([0, 0, 0])

    # Length mismatch
    with pytest.raises(ValueError, match="Array length mismatch"):
        clean_lightcurve(time, flux, err, qual)

    # Empty inputs
    with pytest.raises(ValueError, match="cannot be empty"):
        clean_lightcurve(np.array([]), np.array([]), np.array([]), np.array([]))

    # Non 1D inputs
    with pytest.raises(ValueError, match="one-dimensional"):
        clean_lightcurve(np.ones((2, 2)), np.ones(4), np.ones(4), np.ones(4))

    # All non-finite
    all_nan = np.full(3, np.nan)
    with pytest.raises(ValueError, match="No valid samples remain"):
        clean_lightcurve(all_nan, all_nan, all_nan, qual)


# -----------------------------------------------------------------------------
# 2. normalize_lightcurve Tests
# -----------------------------------------------------------------------------


def test_normalize_lightcurve_median():
    """Test median normalization scales baseline flux near 1.0."""
    flux = np.array([100.0, 102.0, 98.0, 100.0])
    flux_err = np.array([2.0, 2.0, 2.0, 2.0])

    norm_flux, norm_err = normalize_lightcurve(flux, flux_err, method="median")

    assert np.isclose(np.median(norm_flux), 1.0)
    np.testing.assert_allclose(norm_flux, np.array([1.0, 1.02, 0.98, 1.0]))
    np.testing.assert_allclose(norm_err, np.array([0.02, 0.02, 0.02, 0.02]))


def test_normalize_lightcurve_zscore():
    """Test z-score normalization produces mean ~0 and std ~1."""
    np.random.seed(42)
    flux = np.random.normal(loc=50.0, scale=5.0, size=200)
    flux_err = np.ones(200)

    norm_flux, norm_err = normalize_lightcurve(flux, flux_err, method="zscore")

    assert np.isclose(np.mean(norm_flux), 0.0, atol=1e-7)
    assert np.isclose(np.std(norm_flux), 1.0, atol=1e-7)
    assert norm_err is not None
    assert np.all(norm_err > 0)


def test_normalize_lightcurve_immutability_and_errors():
    """Test immutability of inputs and proper error handling in normalization."""
    flux = np.array([10.0, 20.0, 30.0])
    flux_copy = flux.copy()

    norm_flux, _ = normalize_lightcurve(flux, method="median")
    # Verify input array was not modified
    np.testing.assert_array_equal(flux, flux_copy)
    assert norm_flux is not flux

    # Zero median
    with pytest.raises(ValueError, match="zero or non-finite"):
        normalize_lightcurve(np.array([-10.0, 0.0, 10.0]), method="median")

    # Zero std
    with pytest.raises(ValueError, match="zero or non-finite"):
        normalize_lightcurve(np.array([5.0, 5.0, 5.0]), method="zscore")

    # Unsupported method
    with pytest.raises(ValueError, match="Unsupported normalization method"):
        normalize_lightcurve(flux, method="invalid_method")


# -----------------------------------------------------------------------------
# 3. remove_outliers Tests
# -----------------------------------------------------------------------------


def test_remove_outliers_flare_and_transit():
    """Test removing positive flare while preserving negative transit dip."""
    time = np.linspace(0, 10, 100)
    flux = np.full(100, 1.0)
    flux_err = np.full(100, 0.01)
    quality = np.zeros(100, dtype=np.int32)

    # Positive flare spike (+1.0 flux ~ 100 sigma)
    flux[20] = 2.0
    # Negative transit dip (-0.05 flux ~ 5 sigma dip)
    flux[50:55] = 0.95

    # preserve_transits=True -> remove flare at index 20, keep dip at 50:55
    o_time, o_flux, o_err, o_qual = remove_outliers(
        time, flux, flux_err, quality, sigma=5.0, preserve_transits=True
    )

    assert len(o_time) == 99
    assert 2.0 not in o_flux
    assert np.min(o_flux) == 0.95  # Transit dip preserved!


def test_remove_outliers_two_sided():
    """Test two-sided outlier clipping removes negative extreme values when
    requested."""
    time = np.linspace(0, 10, 100)
    flux = np.full(100, 1.0)
    flux_err = np.full(100, 0.01)
    quality = np.zeros(100, dtype=np.int32)

    flux[20] = 2.0  # Positive outlier
    flux[50] = -1.0  # Extreme negative outlier

    o_time, o_flux, _, _ = remove_outliers(
        time, flux, flux_err, quality, sigma=3.0, preserve_transits=False
    )

    assert len(o_time) == 98
    assert 2.0 not in o_flux
    assert -1.0 not in o_flux


def test_remove_outliers_mad_fallback_and_invalid_sigma():
    """Test MAD fallback to std, and invalid sigma validation."""
    time = np.array([1.0, 2.0, 3.0, 4.0])
    # Array with zero MAD
    flux = np.array([1.0, 1.0, 1.0, 5.0])
    flux_err = np.ones(4)
    quality = np.zeros(4, dtype=np.int32)

    # Should fall back to std and run successfully
    o_time, o_flux, _, _ = remove_outliers(
        time, flux, flux_err, quality, sigma=2.0, preserve_transits=True
    )
    assert len(o_time) == 3
    assert 5.0 not in o_flux

    # Invalid sigma <= 0
    with pytest.raises(ValueError, match="Sigma threshold must be positive"):
        remove_outliers(time, flux, flux_err, quality, sigma=0.0)


# -----------------------------------------------------------------------------
# 4. detrend_lightcurve Tests
# -----------------------------------------------------------------------------


def test_detrend_lightcurve_basic():
    """Test detrend_lightcurve removes low-frequency trend."""
    time = np.linspace(0, 10, 200)
    trend = 100.0 + 5.0 * time
    flux = trend + np.random.normal(0, 0.1, size=200)
    flux_err = np.full(200, 0.1)

    d_flux, d_err = detrend_lightcurve(
        time, flux, flux_err, window_length=51, polyorder=2, method="savgol"
    )

    assert len(d_flux) == 200
    assert d_err is not None
    assert len(d_err) == 200
    # Baseline after detrending should be centered around 1.0
    assert np.isclose(np.median(d_flux), 1.0, atol=0.05)


def test_detrend_lightcurve_parameter_adjustments():
    """Test even window_length and oversized window adjustments."""
    time = np.linspace(0, 10, 50)
    flux = np.full(50, 100.0)

    # Even window 20 -> adjusted to 21
    d_flux, _ = detrend_lightcurve(
        time, flux, window_length=20, polyorder=2, method="savgol"
    )
    assert len(d_flux) == 50

    # Oversized window 100 -> adjusted to 49 (max odd <= 50)
    d_flux_over, _ = detrend_lightcurve(
        time, flux, window_length=100, polyorder=2, method="savgol"
    )
    assert len(d_flux_over) == 50


def test_detrend_lightcurve_short_array_handling():
    """Test short light curve returns median-normalized data gracefully."""
    time = np.array([1.0, 2.0, 3.0])
    flux = np.array([100.0, 102.0, 98.0])

    d_flux, _ = detrend_lightcurve(
        time, flux, window_length=51, polyorder=2, method="auto"
    )

    assert len(d_flux) == 3
    assert np.isclose(np.median(d_flux), 1.0)


def test_detrend_lightcurve_methods_and_errors():
    """Test auto mode, savgol mode, and invalid method error."""
    time = np.linspace(0, 10, 100)
    flux = 500.0 + 10.0 * np.sin(time)

    # Auto mode
    d_auto, _ = detrend_lightcurve(time, flux, method="auto")
    assert len(d_auto) == 100

    # Explicit SavGol mode
    d_savgol, _ = detrend_lightcurve(time, flux, method="savgol")
    assert len(d_savgol) == 100

    # Invalid method
    with pytest.raises(ValueError, match="Unsupported detrending method"):
        detrend_lightcurve(time, flux, method="invalid_method")


# -----------------------------------------------------------------------------
# 5. preprocess_lightcurve Pipeline Tests
# -----------------------------------------------------------------------------


def test_preprocess_lightcurve_dict_input(synthetic_raw_lightcurve):
    """Test end-to-end pipeline execution with dictionary input."""
    raw_lc = synthetic_raw_lightcurve
    # Inject NaNs and duplicates
    raw_lc["flux"][5] = np.nan
    raw_lc["time"][10] = raw_lc["time"][9]

    processed = preprocess_lightcurve(raw_lc)

    assert validate_lightcurve(processed) is True
    assert isinstance(processed, dict)
    assert set(processed.keys()) == {"time", "flux", "flux_error", "quality"}
    # Flare removed, NaNs & duplicates removed
    assert len(processed["time"]) < 300
    assert not np.isnan(processed["flux"]).any()
    # Detrended baseline around 1.0
    assert np.isclose(np.median(processed["flux"]), 1.0, atol=0.05)


def test_preprocess_lightcurve_fits_input(synthetic_fits_file):
    """Test end-to-end pipeline execution with FITS file input."""
    processed = preprocess_lightcurve(synthetic_fits_file)

    assert validate_lightcurve(processed) is True
    assert len(processed["time"]) > 0
    assert not np.isnan(processed["flux"]).any()


def test_preprocess_lightcurve_custom_config_and_immutability(
    synthetic_raw_lightcurve,
):
    """Test custom pipeline configuration merging and dictionary immutability."""
    raw_lc = synthetic_raw_lightcurve
    original_time_0 = raw_lc["time"][0]

    custom_config = {
        "outlier_sigma": 10.0,
        "detrend_method": "savgol",
        "window_length": 51,
    }

    processed = preprocess_lightcurve(raw_lc, config=custom_config)

    # Input dict was not mutated
    assert raw_lc["time"][0] == original_time_0
    assert validate_lightcurve(processed) is True
