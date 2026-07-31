"""Unit tests for light curve loader and validation utilities."""

import numpy as np
import pytest
from astropy.io import fits

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

    with fits.HDUList([primary_hdu, bintable_hdu]) as hdul:
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


@pytest.mark.parametrize(
    ("mission", "flux_column", "error_column", "quality_column"),
    [
        ("Kepler", "PDCSAP_FLUX", "PDCSAP_FLUX_ERR", "SAP_QUALITY"),
        ("TESS", "SAP_FLUX", "SAP_FLUX_ERR", "QUALITY"),
    ],
)
def test_load_mission_samples(
    tmp_path, mission, flux_column, error_column, quality_column
):
    """Load representative Kepler and TESS column variants."""
    sample_path = tmp_path / f"{mission.lower()}_sample.fits"
    columns = fits.ColDefs(
        [
            fits.Column(name="TIME", format="D", array=np.arange(8, dtype=float)),
            fits.Column(name=flux_column, format="D", array=np.ones(8)),
            fits.Column(name=error_column, format="D", array=np.full(8, 0.01)),
            fits.Column(name=quality_column, format="J", array=np.zeros(8, dtype=int)),
        ]
    )
    table = fits.BinTableHDU.from_columns(columns)
    table.header["TELESCOP"] = mission
    with fits.HDUList([fits.PrimaryHDU(), table]) as hdul:
        hdul.writeto(sample_path)

    loaded = load_lightcurve_fits(sample_path)

    assert validate_lightcurve(loaded)
    assert len(loaded["time"]) == 8


def test_load_lightcurve_fits_invalid_file(tmp_path):
    """Reject a non-FITS payload with a contextual error."""
    invalid_path = tmp_path / "invalid.fits"
    invalid_path.write_text("not a FITS file", encoding="utf-8")

    with pytest.raises(ValueError, match="Unable to open FITS file"):
        load_lightcurve_fits(invalid_path)


def test_load_lightcurve_fits_empty_table(tmp_path):
    """Reject a structurally valid FITS table containing no samples."""
    empty_path = tmp_path / "empty.fits"
    columns = fits.ColDefs(
        [
            fits.Column(name="TIME", format="D", array=np.array([], dtype=float)),
            fits.Column(
                name="PDCSAP_FLUX", format="D", array=np.array([], dtype=float)
            ),
        ]
    )
    with fits.HDUList(
        [fits.PrimaryHDU(), fits.BinTableHDU.from_columns(columns)]
    ) as hdul:
        hdul.writeto(empty_path)

    with pytest.raises(ValueError, match="empty arrays"):
        load_lightcurve_fits(empty_path)
