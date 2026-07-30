"""Light curve visualization module for ExoVision AI.

Provides high-resolution, astronomy-styled plotting utilities for light curve
time series using Matplotlib.
"""

from pathlib import Path
from typing import Union

import matplotlib
import matplotlib.pyplot as plt
import numpy as np

# Use non-interactive Agg backend for headless server execution
matplotlib.use("Agg")


def plot_lightcurve(
    time: np.ndarray,
    flux: np.ndarray,
    title: str,
    output_path: Union[str, Path],
    xlabel: str = "Time (days)",
    ylabel: str = "Normalized Flux",
) -> Path:
    """Plot a single light curve time series and save figure to disk.

    Args:
        time: Timestamp array.
        flux: Observed flux array.
        title: Plot title.
        output_path: Destination file path for saved figure (.png, .svg, etc.).
        xlabel: X-axis label. Defaults to "Time (days)".
        ylabel: Y-axis label. Defaults to "Normalized Flux".

    Returns:
        Path: Path object pointing to saved figure file.

    Raises:
        ValueError: If input arrays are not 1D, have unequal lengths, are empty,
            or contain non-finite values (NaNs / Infs).
    """
    time_arr = np.asarray(time)
    flux_arr = np.asarray(flux)

    if time_arr.ndim != 1 or flux_arr.ndim != 1:
        raise ValueError("Time and flux arrays must be one-dimensional.")

    n_samples = len(time_arr)
    if n_samples == 0:
        raise ValueError("Input light curve arrays cannot be empty.")

    if len(flux_arr) != n_samples:
        raise ValueError(
            f"Array length mismatch: time ({n_samples}) vs flux ({len(flux_arr)})."
        )

    if not (np.all(np.isfinite(time_arr)) and np.all(np.isfinite(flux_arr))):
        raise ValueError("Light curve contains non-finite values (NaN or Inf).")

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)

    ax.plot(
        time_arr,
        flux_arr,
        color="#1f77b4",
        marker="o",
        markersize=1.5,
        linestyle="-",
        linewidth=0.5,
        alpha=0.85,
        label="Flux",
    )

    ax.set_title(title, fontsize=12, fontweight="bold", pad=10)
    ax.set_xlabel(xlabel, fontsize=10)
    ax.set_ylabel(ylabel, fontsize=10)
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="upper right", frameon=True, fontsize=9)

    fig.tight_layout()
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)

    return out_path
