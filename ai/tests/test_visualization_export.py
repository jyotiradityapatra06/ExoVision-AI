"""Unit tests for light curve visualization and CSV dataset export (Phase 1.4)."""

from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from astropy.io import fits

from ai.export import export_lightcurve_csv
from ai.preprocessing import preprocess_lightcurve
from ai.utils.lightcurve_loader import load_lightcurve_fits
from ai.visualization import plot_lightcurve, plot_lightcurve_comparison


@pytest.fixture
def synthetic_lightcurve_data():
    """Generate synthetic time series dict with time, flux, flux_error, quality."""
    np.random.seed(42)
    time = np.linspace(100.0, 105.0, 100)
    flux = 1000.0 + 10.0 * np.sin(time) + np.random.normal(0, 0.5, 100)
    flux_err = np.full(100, 0.5)
    quality = np.zeros(100, dtype=np.int32)
    return {
        "time": time,
        "flux": flux,
        "flux_error": flux_err,
        "quality": quality,
    }


@pytest.fixture
def synthetic_fits_file(tmp_path: Path, synthetic_lightcurve_data):
    """Generate a temporary FITS file for integration testing."""
    fits_path = tmp_path / "test_sample.fits"
    data = synthetic_lightcurve_data

    col_time = fits.Column(name="TIME", format="D", array=data["time"])
    col_flux = fits.Column(name="PDCSAP_FLUX", format="D", array=data["flux"])
    col_err = fits.Column(name="PDCSAP_FLUX_ERR", format="D", array=data["flux_error"])
    col_qual = fits.Column(name="SAP_QUALITY", format="J", array=data["quality"])

    cols = fits.ColDefs([col_time, col_flux, col_err, col_qual])
    bintable_hdu = fits.BinTableHDU.from_columns(cols)
    primary_hdu = fits.PrimaryHDU()

    with fits.HDUList([primary_hdu, bintable_hdu]) as hdul:
        hdul.writeto(fits_path, overwrite=True)

    return fits_path


# -----------------------------------------------------------------------------
# 1. plot_lightcurve Tests
# -----------------------------------------------------------------------------


def test_plot_lightcurve_success(tmp_path: Path, synthetic_lightcurve_data):
    """Test successful plot generation and file creation."""
    out_file = tmp_path / "plots" / "test_plot.png"
    data = synthetic_lightcurve_data

    result_path = plot_lightcurve(
        time=data["time"],
        flux=data["flux"],
        title="Test Plot",
        output_path=out_file,
    )

    assert result_path.exists()
    assert result_path.is_file()
    assert result_path.stat().st_size > 0


def test_plot_lightcurve_validation_errors(tmp_path: Path):
    """Test plot_lightcurve raises ValueError on invalid inputs."""
    out_file = tmp_path / "test.png"

    # Mismatched lengths
    with pytest.raises(ValueError, match="length mismatch"):
        plot_lightcurve(np.ones(5), np.ones(4), "Title", out_file)

    # Empty arrays
    with pytest.raises(ValueError, match="cannot be empty"):
        plot_lightcurve(np.array([]), np.array([]), "Title", out_file)

    # Non-1D arrays
    with pytest.raises(ValueError, match="one-dimensional"):
        plot_lightcurve(np.ones((2, 2)), np.ones(4), "Title", out_file)

    # Non-finite values
    with pytest.raises(ValueError, match="non-finite"):
        plot_lightcurve(
            np.array([1.0, np.nan]), np.array([10.0, 10.0]), "Title", out_file
        )


# -----------------------------------------------------------------------------
# 2. plot_lightcurve_comparison Tests
# -----------------------------------------------------------------------------


def test_plot_lightcurve_comparison_success(tmp_path: Path, synthetic_lightcurve_data):
    """Test successful two-panel comparison plot generation."""
    out_file = tmp_path / "plots" / "comparison.png"
    raw = synthetic_lightcurve_data
    processed = {
        "time": raw["time"].copy(),
        "flux": (raw["flux"] / np.median(raw["flux"])).copy(),
    }

    result_path = plot_lightcurve_comparison(
        raw=raw,
        processed=processed,
        output_path=out_file,
        title="Raw vs Processed Test",
    )

    assert result_path.exists()
    assert result_path.is_file()
    assert result_path.stat().st_size > 0


def test_plot_lightcurve_comparison_validation_errors(tmp_path: Path):
    """Test comparison plot raises ValueError on missing keys or invalid inputs."""
    out_file = tmp_path / "comp_err.png"
    valid_dict = {"time": np.ones(10), "flux": np.ones(10)}

    # Missing keys
    with pytest.raises(ValueError, match="missing required keys"):
        plot_lightcurve_comparison({"time": np.ones(10)}, valid_dict, out_file)

    # Array length mismatch in processed
    with pytest.raises(ValueError, match="length mismatch"):
        plot_lightcurve_comparison(
            valid_dict, {"time": np.ones(10), "flux": np.ones(5)}, out_file
        )


# -----------------------------------------------------------------------------
# 3. export_lightcurve_csv Tests
# -----------------------------------------------------------------------------


def test_export_lightcurve_csv_success(tmp_path: Path, synthetic_lightcurve_data):
    """Test CSV export creates valid CSV file with correct columns and row count."""
    csv_file = tmp_path / "processed" / "lightcurve.csv"
    data = synthetic_lightcurve_data

    result_path = export_lightcurve_csv(data, csv_file)

    assert result_path.exists()
    assert result_path.is_file()

    # Read exported CSV with pandas to verify structure
    df = pd.read_csv(result_path)
    assert list(df.columns) == ["time", "flux", "flux_error", "quality"]
    assert len(df) == 100
    np.testing.assert_allclose(df["time"].values, data["time"])
    np.testing.assert_allclose(df["flux"].values, data["flux"])


def test_export_lightcurve_csv_mutation_protection(
    tmp_path: Path, synthetic_lightcurve_data
):
    """Test CSV export does not mutate original dictionary."""
    csv_file = tmp_path / "test.csv"
    data = synthetic_lightcurve_data
    original_time_0 = data["time"][0]

    export_lightcurve_csv(data, csv_file)

    assert data["time"][0] == original_time_0


def test_export_lightcurve_csv_validation_errors(tmp_path: Path):
    """Test CSV exporter raises ValueError on missing keys, empty, or mismatched
    arrays."""
    csv_file = tmp_path / "err.csv"

    # Not a dict
    with pytest.raises(ValueError, match="must be a dictionary"):
        export_lightcurve_csv(["not", "a", "dict"], csv_file)  # type: ignore

    # Missing keys
    with pytest.raises(ValueError, match="missing required keys"):
        export_lightcurve_csv({"time": np.ones(5), "flux": np.ones(5)}, csv_file)

    # Length mismatch
    with pytest.raises(ValueError, match="Array length mismatch"):
        export_lightcurve_csv(
            {
                "time": np.ones(5),
                "flux": np.ones(5),
                "flux_error": np.ones(4),
                "quality": np.ones(5),
            },
            csv_file,
        )


# -----------------------------------------------------------------------------
# 4. Integration Test
# -----------------------------------------------------------------------------


def test_end_to_end_pipeline_integration(tmp_path: Path, synthetic_fits_file: Path):
    """Test full integration: FITS Loader -> Preprocessing -> Visualization ->
    CSV Export."""
    # 1. Load FITS
    raw_lc = load_lightcurve_fits(synthetic_fits_file)
    assert set(raw_lc.keys()) == {"time", "flux", "flux_error", "quality"}

    # 2. Raw Plot
    raw_plot = tmp_path / "raw.png"
    plot_lightcurve(raw_lc["time"], raw_lc["flux"], "Raw", raw_plot)
    assert raw_plot.exists()

    # 3. Preprocess
    proc_lc = preprocess_lightcurve(raw_lc)
    assert set(proc_lc.keys()) == {"time", "flux", "flux_error", "quality"}

    # 4. Processed & Comparison Plot
    proc_plot = tmp_path / "processed.png"
    plot_lightcurve(proc_lc["time"], proc_lc["flux"], "Processed", proc_plot)
    assert proc_plot.exists()

    comp_plot = tmp_path / "comparison.png"
    plot_lightcurve_comparison(raw_lc, proc_lc, comp_plot)
    assert comp_plot.exists()

    # 5. CSV Export
    csv_path = tmp_path / "processed.csv"
    export_lightcurve_csv(proc_lc, csv_path)
    assert csv_path.exists()
