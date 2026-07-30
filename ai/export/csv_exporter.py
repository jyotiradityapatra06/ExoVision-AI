"""CSV export module for preprocessed light curve datasets."""

from pathlib import Path
from typing import Dict, Union

import numpy as np
import pandas as pd


def export_lightcurve_csv(
    lightcurve: Dict[str, np.ndarray],
    output_path: Union[str, Path],
) -> Path:
    """Export light curve data to a standardized CSV file.

    Export CSV Format:
        time,flux,flux_error,quality
        120.0,1.0002,0.002,0

    Args:
        lightcurve: Dictionary containing 'time', 'flux', 'flux_error',
            and 'quality' arrays.
        output_path: Destination file path for saved CSV dataset.

    Returns:
        Path: Path object pointing to exported CSV file.

    Raises:
        ValueError: If input lightcurve is not a dictionary, missing required keys,
            arrays are not 1D, are empty, or have mismatched lengths.
    """
    if not isinstance(lightcurve, dict):
        raise ValueError("Input lightcurve must be a dictionary.")

    required_keys = {"time", "flux", "flux_error", "quality"}
    missing_keys = required_keys - set(lightcurve.keys())
    if missing_keys:
        raise ValueError(
            f"Light curve dictionary missing required keys: {missing_keys}"
        )

    time_arr = np.asarray(lightcurve["time"])
    flux_arr = np.asarray(lightcurve["flux"])
    err_arr = np.asarray(lightcurve["flux_error"])
    qual_arr = np.asarray(lightcurve["quality"])

    if (
        time_arr.ndim != 1
        or flux_arr.ndim != 1
        or err_arr.ndim != 1
        or qual_arr.ndim != 1
    ):
        raise ValueError("All light curve series must be one-dimensional arrays.")

    n_samples = len(time_arr)
    if n_samples == 0:
        raise ValueError("Light curve arrays cannot be empty.")

    if not (n_samples == len(flux_arr) == len(err_arr) == len(qual_arr)):
        raise ValueError(
            f"Array length mismatch across light curve series: time ({n_samples}), "
            f"flux ({len(flux_arr)}), flux_error ({len(err_arr)}), "
            f"quality ({len(qual_arr)})."
        )

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.DataFrame(
        {
            "time": time_arr,
            "flux": flux_arr,
            "flux_error": err_arr,
            "quality": qual_arr,
        }
    )

    df.to_csv(out_path, index=False)
    return out_path
