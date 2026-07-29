"""Unit tests for light curve loader and validation utilities."""

from astropy.io import fits
import numpy as np
import pytest

from ai.utils.lightcurve_loader import load_lightcurve_fits, validate_lightcurve


@pytest.fixture
def synthetic_fits_file(tmp_path):
    """Generate a synthetic FITS light curve file in a temporary directory."""
    fits_path = tmp_path / "test_lightcurve.fits"

    time = np.linspace(100.0, 110.0, 50)
    flux = np.full(50, 1000.0)
    flux_err = np.full(50, 1.0)
    quality = np.zeros(50, dtype=np.int32)

    # Inject a couple NaNs to test cleaning behavior
    flux[5] = np.nan
    time[10] = np.nan

    col_time = fits.Column(name="TIME", format="D", array=time)
    col_flux = fits.Column(name="PDCSAP_FLUX", format="D", array=flux)
    col_err = fits.Column(name="PDCSAP_FLUX_ERR", format="D", array=flux_err)
    col_qual = fits.Column(name="SAP_QUALITY", format="J", array=quality)

    cols = fits.ColDefs([col_time, col_flux, col_err, col_qual])
    bintable_hdu = fits.BinTableHDU.from_columns(cols)
    primary_hdu = fits.PrimaryHDU()

    hdul = fits.HDUList([primary_hdu, bintable_hdu])
    hdul.writeto(fits_path, overwrite=True)

    return fits_path


def test_load_lightcurve_fits_valid(synthetic_fits_file):
    """Test loading valid synthetic FITS light curve file."""
    data = load_lightcurve_fits(synthetic_fits_file)

    assert isinstance(data, dict)
    assert set(data.keys()) == {"time", "flux", "flux_error", "quality"}
    # Original length was 50, minus 2 NaNs -> 48 clean points
    assert len(data["time"]) == 48
    assert len(data["flux"]) == 48
    assert len(data["flux_error"]) == 48
    assert len(data["quality"]) == 48
    assert not np.isnan(data["flux"]).any()
    assert not np.isnan(data["time"]).any()


def test_validate_lightcurve_success():
    """Test validation passes for matching valid dictionary payload."""
    valid_data = {
        "time": np.array([1.0, 2.0, 3.0]),
        "flux": np.array([100.0, 101.0, 99.0]),
        "flux_error": np.array([0.5, 0.5, 0.5]),
        "quality": np.array([0, 0, 0]),
    }
    assert validate_lightcurve(valid_data) is True


def test_validate_lightcurve_missing_keys():
    """Test validation raises ValueError when required keys are missing."""
    incomplete_data = {
        "time": np.array([1.0, 2.0]),
        "flux": np.array([100.0, 101.0]),
    }
    with pytest.raises(ValueError, match="missing keys"):
        validate_lightcurve(incomplete_data)


def test_validate_lightcurve_length_mismatch():
    """Test validation raises ValueError when array lengths mismatch."""
    mismatched_data = {
        "time": np.array([1.0, 2.0, 3.0]),
        "flux": np.array([100.0, 101.0]),
        "flux_error": np.array([0.5, 0.5, 0.5]),
        "quality": np.array([0, 0, 0]),
    }
    with pytest.raises(ValueError, match="length mismatch"):
        validate_lightcurve(mismatched_data)


def test_validate_lightcurve_empty_arrays():
    """Test validation raises ValueError when arrays are empty."""
    empty_data = {
        "time": np.array([]),
        "flux": np.array([]),
        "flux_error": np.array([]),
        "quality": np.array([]),
    }
    with pytest.raises(ValueError, match="empty arrays"):
        validate_lightcurve(empty_data)


def test_load_lightcurve_fits_file_not_found():
    """Test load_lightcurve_fits raises FileNotFoundError for missing paths."""
    with pytest.raises(FileNotFoundError):
        load_lightcurve_fits("non_existent_file.fits")
