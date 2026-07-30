"""Outlier removal module for light curve time series.

Implements robust sigma clipping using Median Absolute Deviation (MAD) while
preserving negative dips from exoplanet transit events.
"""

from typing import Tuple

import numpy as np


def remove_outliers(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray,
    quality: np.ndarray,
    sigma: float = 5.0,
    preserve_transits: bool = True,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Remove outlier data points from light curve using robust sigma clipping.

    Args:
        time: Timestamp array.
        flux: Observed flux array.
        flux_error: Flux error array.
        quality: Data quality flags array.
        sigma: Threshold standard deviation multiplier. Must be > 0. Defaults to 5.0.
        preserve_transits: If True, remove only positive flux outliers (flares/spikes),
            preserving negative transit dips. If False, perform two-sided clipping.
            Defaults to True.

    Returns:
        Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]: Synchronized clean arrays
        (time, flux, flux_error, quality).

    Raises:
        ValueError: If arrays are not 1D, have unequal lengths, are empty,
            if sigma <= 0, or if all samples are removed by clipping.
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

    if sigma <= 0:
        raise ValueError(f"Sigma threshold must be positive, got {sigma}.")

    centre = float(np.median(flux_arr))
    mad = float(np.median(np.abs(flux_arr - centre)))
    scale = 1.4826 * mad

    if scale == 0 or not np.isfinite(scale):
        scale = float(np.std(flux_arr))

    # If scale is still zero or non-finite, no outliers can be identified
    if scale == 0 or not np.isfinite(scale):
        return (
            np.copy(time_arr),
            np.copy(flux_arr),
            np.copy(flux_err_arr),
            np.copy(quality_arr),
        )

    if preserve_transits:
        # Keep samples that do not exceed positive flare threshold
        valid_mask = flux_arr <= (centre + sigma * scale)
    else:
        # Two-sided sigma clipping
        valid_mask = np.abs(flux_arr - centre) <= (sigma * scale)

    time_clean = np.copy(time_arr[valid_mask])
    flux_clean = np.copy(flux_arr[valid_mask])
    flux_err_clean = np.copy(flux_err_arr[valid_mask])
    quality_clean = np.copy(quality_arr[valid_mask])

    if len(time_clean) == 0:
        raise ValueError("All samples were removed during outlier clipping.")

    return time_clean, flux_clean, flux_err_clean, quality_clean
