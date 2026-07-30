"""Data cleaning module for exoplanet light curves.

Handles removal of NaNs, infinite values, invalid timestamps, and duplicate
timestamps while maintaining array synchronization.
"""

from typing import Tuple

import numpy as np


def clean_lightcurve(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray,
    quality: np.ndarray,
    require_positive_time: bool = False,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Clean light curve arrays by removing non-finite values and duplicate timestamps.

    Args:
        time: Timestamp array.
        flux: Observed flux array.
        flux_error: Flux measurement error array.
        quality: Data quality bitmask flags array.
        require_positive_time: If True, also filter out timestamps <= 0.
            Defaults to False.

    Returns:
        Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]: Cleaned and synchronized
        (time, flux, flux_error, quality) arrays.

    Raises:
        ValueError: If input arrays are not 1D, have unequal lengths, are empty,
            or if no valid samples remain after cleaning.
    """
    time_arr = np.asarray(time)
    flux_arr = np.asarray(flux)
    flux_err_arr = np.asarray(flux_error)
    quality_arr = np.asarray(quality)

    if (
        time_arr.ndim != 1
        or flux_arr.ndim != 1
        or flux_err_arr.ndim != 1
        or quality_arr.ndim != 1
    ):
        raise ValueError("All input arrays must be one-dimensional.")

    n_samples = len(time_arr)
    if n_samples == 0:
        raise ValueError("Input light curve arrays cannot be empty.")

    if not (n_samples == len(flux_arr) == len(flux_err_arr) == len(quality_arr)):
        raise ValueError(
            f"Array length mismatch: time ({n_samples}), flux ({len(flux_arr)}), "
            f"flux_error ({len(flux_err_arr)}), quality ({len(quality_arr)})."
        )

    # Filter non-finite values across time, flux, and flux_error
    valid_mask = (
        np.isfinite(time_arr) & np.isfinite(flux_arr) & np.isfinite(flux_err_arr)
    )

    if require_positive_time:
        valid_mask &= time_arr > 0

    time_clean = time_arr[valid_mask]
    flux_clean = flux_arr[valid_mask]
    flux_err_clean = flux_err_arr[valid_mask]
    quality_clean = quality_arr[valid_mask]

    if len(time_clean) == 0:
        raise ValueError(
            "No valid samples remain after removing non-finite or invalid entries."
        )

    # Deduplicate timestamps while preserving the first occurrence order
    _, unique_indices = np.unique(time_clean, return_index=True)
    unique_indices = np.sort(unique_indices)

    time_out = np.asarray(time_clean[unique_indices], dtype=np.float64)
    flux_out = np.asarray(flux_clean[unique_indices], dtype=np.float64)
    flux_err_out = np.asarray(flux_err_clean[unique_indices], dtype=np.float64)
    quality_out = np.asarray(quality_clean[unique_indices], dtype=np.int32)

    if len(time_out) == 0:
        raise ValueError("No valid samples remain after deduplicating timestamps.")

    return time_out, flux_out, flux_err_out, quality_out
