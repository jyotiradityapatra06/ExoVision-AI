"""Automated light curve preprocessing, visualization, and dataset export CLI script.

Processes raw FITS files from data/raw/kepler/ and data/raw/tess/, generating
visual comparison plots and standardized CSV files in outputs/.
"""

import logging
import sys
from pathlib import Path

# Ensure project root is in Python path for direct script execution
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai.export import export_lightcurve_csv
from ai.preprocessing import preprocess_lightcurve
from ai.utils.lightcurve_loader import load_lightcurve_fits
from ai.visualization import plot_lightcurve, plot_lightcurve_comparison

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _safe_print(text: str) -> None:
    """Print text safely handling terminal encoding limitations on Windows."""
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.replace("✓", "[OK]"))


def preprocess_dataset(
    raw_dirs: list[Path] | None = None,
    output_dir: Path | None = None,
) -> int:
    """Batch process all FITS light curve files across raw data directories.

    Args:
        raw_dirs: List of directories containing raw FITS files. Defaults to
            [data/raw/kepler, data/raw/tess].
        output_dir: Root output directory. Defaults to 'outputs/'.

    Returns:
        int: Number of successfully processed FITS files.
    """
    root_path = Path.cwd()
    if raw_dirs is None:
        raw_dirs = [
            root_path / "data" / "raw" / "kepler",
            root_path / "data" / "raw" / "tess",
        ]

    if output_dir is None:
        output_dir = root_path / "outputs"

    plots_dir = output_dir / "plots"
    processed_dir = output_dir / "processed"

    plots_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    fits_files: list[Path] = []
    for raw_dir in raw_dirs:
        if raw_dir.exists():
            fits_files.extend(raw_dir.glob("*.fits"))
            fits_files.extend(raw_dir.glob("*.fits.gz"))

    if not fits_files:
        logger.warning("No FITS files found in target directories: %s", raw_dirs)
        return 0

    logger.info("Found %d FITS file(s) for processing.", len(fits_files))

    processed_count = 0
    for fits_path in fits_files:
        stem = fits_path.name.replace(".fits.gz", "").replace(".fits", "")
        _safe_print(f"\nProcessing: {fits_path.name}")

        try:
            # 1. Load FITS
            raw_lc = load_lightcurve_fits(fits_path)
            _safe_print("✓ FITS loaded")

            # 2. Generate raw plot
            raw_plot_path = plots_dir / f"{stem}_raw.png"
            plot_lightcurve(
                time=raw_lc["time"],
                flux=raw_lc["flux"],
                title=f"Raw Light Curve — {stem}",
                output_path=raw_plot_path,
                ylabel="Raw Flux",
            )
            _safe_print("✓ Raw plot generated")

            # 3. Preprocess light curve
            proc_lc = preprocess_lightcurve(raw_lc)
            _safe_print("✓ Preprocessing completed")

            # 4. Generate processed plot
            proc_plot_path = plots_dir / f"{stem}_processed.png"
            plot_lightcurve(
                time=proc_lc["time"],
                flux=proc_lc["flux"],
                title=f"Processed Light Curve — {stem}",
                output_path=proc_plot_path,
                ylabel="Normalized Flux",
            )

            # 5. Generate comparison plot
            comp_plot_path = plots_dir / f"{stem}_comparison.png"
            plot_lightcurve_comparison(
                raw=raw_lc,
                processed=proc_lc,
                output_path=comp_plot_path,
                title=f"Raw vs Processed — {stem}",
            )
            _safe_print("✓ Comparison generated")

            # 6. Export CSV
            csv_path = processed_dir / f"{stem}.csv"
            export_lightcurve_csv(proc_lc, csv_path)
            _safe_print("✓ CSV exported")

            processed_count += 1

        except Exception as exc:
            logger.error("Failed to process %s: %s", fits_path.name, exc)

    _safe_print(
        f"\nPipeline finished. Successfully processed {processed_count} file(s)."
    )
    return processed_count


if __name__ == "__main__":
    preprocess_dataset()
