"""Light curve comparison visualization module for ExoVision AI.

Generates stacked two-panel figures comparing raw vs. preprocessed light curve
time series.
"""

from pathlib import Path
from typing import Dict, Union

import matplotlib
import matplotlib.pyplot as plt
import numpy as np

matplotlib.use("Agg")


def plot_lightcurve_comparison(
    raw: Dict[str, np.ndarray],
    processed: Dict[str, np.ndarray],
    output_path: Union[str, Path],
    title: str = "Raw vs Processed Light Curve",
) -> Path:
    """Generate a stacked two-panel figure comparing raw and processed light curves.

    Args:
        raw: Dictionary containing raw 'time' and 'flux' arrays.
        processed: Dictionary containing processed 'time' and 'flux' arrays.
        output_path: Destination file path for saved comparison plot.
        title: Overall figure title. Defaults to "Raw vs Processed Light Curve".

    Returns:
        Path: Path object pointing to saved figure file.

    Raises:
        ValueError: If required keys ('time', 'flux') are missing, if arrays are not 1D,
            are empty, have mismatched lengths, or contain non-finite values.
    """
    for name, data in [("raw", raw), ("processed", processed)]:
        if not isinstance(data, dict):
            raise ValueError(f"Input '{name}' must be a dictionary.")

        missing_keys = {"time", "flux"} - set(data.keys())
        if missing_keys:
            raise ValueError(
                f"Input '{name}' light curve missing required keys: {missing_keys}"
            )

    raw_time = np.asarray(raw["time"])
    raw_flux = np.asarray(raw["flux"])
    proc_time = np.asarray(processed["time"])
    proc_flux = np.asarray(processed["flux"])

    if (
        raw_time.ndim != 1
        or raw_flux.ndim != 1
        or proc_time.ndim != 1
        or proc_flux.ndim != 1
    ):
        raise ValueError("All time and flux arrays must be one-dimensional.")

    if len(raw_time) == 0 or len(proc_time) == 0:
        raise ValueError("Raw and processed light curve arrays cannot be empty.")

    if len(raw_time) != len(raw_flux):
        raise ValueError(
            f"Raw array length mismatch: time ({len(raw_time)}) vs "
            f"flux ({len(raw_flux)})."
        )

    if len(proc_time) != len(proc_flux):
        raise ValueError(
            f"Processed array length mismatch: time ({len(proc_time)}) vs "
            f"flux ({len(proc_flux)})."
        )

    if not (
        np.all(np.isfinite(raw_time))
        and np.all(np.isfinite(raw_flux))
        and np.all(np.isfinite(proc_time))
        and np.all(np.isfinite(proc_flux))
    ):
        raise ValueError("Light curve arrays contain non-finite values (NaN or Inf).")

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True, dpi=300)

    # Panel 1: Raw Flux
    ax1.plot(
        raw_time,
        raw_flux,
        color="#d62728",
        marker="o",
        markersize=1.2,
        linestyle="-",
        linewidth=0.4,
        alpha=0.8,
        label="Raw Flux",
    )
    ax1.set_title("Raw Light Curve", fontsize=11, fontweight="bold")
    ax1.set_ylabel("Raw Flux", fontsize=10)
    ax1.grid(True, linestyle="--", alpha=0.5)
    ax1.legend(loc="upper right", frameon=True, fontsize=9)

    # Panel 2: Processed Flux
    ax2.plot(
        proc_time,
        proc_flux,
        color="#2ca02c",
        marker="o",
        markersize=1.2,
        linestyle="-",
        linewidth=0.4,
        alpha=0.8,
        label="Clean & Detrended Flux",
    )
    ax2.set_title("Processed Light Curve", fontsize=11, fontweight="bold")
    ax2.set_xlabel("Time (days)", fontsize=10)
    ax2.set_ylabel("Normalized Flux", fontsize=10)
    ax2.grid(True, linestyle="--", alpha=0.5)
    ax2.legend(loc="upper right", frameon=True, fontsize=9)

    fig.suptitle(title, fontsize=13, fontweight="bold", y=0.98)
    fig.tight_layout(rect=[0, 0, 1, 0.96])

    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)

    return out_path
