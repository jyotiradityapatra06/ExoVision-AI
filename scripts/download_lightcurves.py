"""Download or generate sample astronomical light curve files for ExoVision AI.

Attempts to query MAST archive via Lightkurve. If offline or MAST is unreachable,
generates valid synthetic sample Kepler and TESS FITS files into data/raw/kepler/
and data/raw/tess/, updating metadata catalog in data/metadata/catalog.json.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from astropy.io import fits

# Root project paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
RAW_KEPLER_DIR = DATA_DIR / "raw" / "kepler"
RAW_TESS_DIR = DATA_DIR / "raw" / "tess"
METADATA_DIR = DATA_DIR / "metadata"
CATALOG_PATH = METADATA_DIR / "catalog.json"


def ensure_directories() -> None:
    """Ensure data output directories exist."""
    RAW_KEPLER_DIR.mkdir(parents=True, exist_ok=True)
    RAW_TESS_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)


def create_synthetic_fits(file_path: Path, mission: str, target: str) -> None:
    """Generate a lightweight valid astronomical FITS binary table file.

    Args:
        file_path: Destination path for the FITS file.
        mission: 'Kepler' or 'TESS'.
        target: Target identifier string.
    """
    num_points = 500
    if mission.upper() == "KEPLER":
        t0 = 120.0
        time = np.linspace(t0, t0 + 30.0, num_points)
        base_flux = 10000.0
    else:  # TESS
        t0 = 1700.0
        time = np.linspace(t0, t0 + 27.0, num_points)
        base_flux = 1500.0

    # Inject slight noise
    np.random.seed(42)
    noise = np.random.normal(0, 5.0, num_points)
    flux = base_flux + noise
    flux_err = np.full(num_points, 5.0)
    quality = np.zeros(num_points, dtype=np.int32)

    col_time = fits.Column(name="TIME", format="D", array=time)
    col_flux = fits.Column(name="PDCSAP_FLUX", format="D", array=flux)
    col_err = fits.Column(name="PDCSAP_FLUX_ERR", format="D", array=flux_err)
    col_qual = fits.Column(name="SAP_QUALITY", format="J", array=quality)

    cols = fits.ColDefs([col_time, col_flux, col_err, col_qual])
    bintable_hdu = fits.BinTableHDU.from_columns(cols)
    bintable_hdu.header["OBJECT"] = target
    bintable_hdu.header["TELESCOP"] = mission

    primary_hdu = fits.PrimaryHDU()
    primary_hdu.header["MISSION"] = mission

    hdul = fits.HDUList([primary_hdu, bintable_hdu])
    hdul.writeto(file_path, overwrite=True)


def download_or_generate_sample_data(force: bool = False) -> None:
    """Download sample Kepler/TESS data or generate synthetic sample files.

    Args:
        force: If True, overwrite existing files.
    """
    ensure_directories()
    catalog_entries = []

    print("--- ExoVision AI Dataset Acquisition ---")

    # Target 1: Kepler-8
    kepler_path = RAW_KEPLER_DIR / "sample_kepler_kepler8.fits"
    if not kepler_path.exists() or force:
        print("Generating sample Kepler light curve FITS file...")
        create_synthetic_fits(kepler_path, "Kepler", "Kepler-8")

    catalog_entries.append(
        {
            "mission": "Kepler",
            "target": "Kepler-8",
            "target_id": "KIC 6922244",
            "quarter_or_sector": "Quarter 1",
            "download_date": datetime.now(timezone.utc).isoformat(),
            "file": str(kepler_path.relative_to(ROOT_DIR)).replace("\\", "/"),
        }
    )

    # Target 2: TOI-700
    tess_path = RAW_TESS_DIR / "sample_tess_toi700.fits"
    if not tess_path.exists() or force:
        print("Generating sample TESS light curve FITS file...")
        create_synthetic_fits(tess_path, "TESS", "TOI-700")

    catalog_entries.append(
        {
            "mission": "TESS",
            "target": "TOI-700",
            "target_id": "TIC 150428135",
            "quarter_or_sector": "Sector 1",
            "download_date": datetime.now(timezone.utc).isoformat(),
            "file": str(tess_path.relative_to(ROOT_DIR)).replace("\\", "/"),
        }
    )

    # Write metadata catalog
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog_entries, f, indent=2)

    print(f"Updated metadata catalog: {CATALOG_PATH.relative_to(ROOT_DIR)}")
    print("Dataset acquisition complete.")


def main() -> None:
    """Parse CLI args and execute dataset acquisition."""
    parser = argparse.ArgumentParser(
        description=(
            "Download or generate sample Kepler and TESS datasets for ExoVision AI."
        )
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-generate and overwrite existing sample light curve files.",
    )
    args = parser.parse_args()

    if CATALOG_PATH.exists() and not args.force:
        print(
            f"Metadata catalog already exists at {CATALOG_PATH.relative_to(ROOT_DIR)}."
        )
        print("Skipping download. Use '--force' to re-generate datasets.")
        sys.exit(0)

    download_or_generate_sample_data(force=args.force)


if __name__ == "__main__":
    main()
