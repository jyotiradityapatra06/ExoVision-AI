"""Normalization module for light curve flux series.

Provides robust median normalization and z-score scaling while preserving
relative exoplanet transit depth.
"""

from typing import Tuple

import numpy as np


def normalize_lightcurve(
    flux: np.ndarray,
    flux_error: np.ndarray | None = None,
    method: str = "median",
) -> Tuple[np.ndarray, np.ndarray | None]:
    """Normalize light curve flux and flux uncertainties.

    Args:
        flux: Observed flux array.
        flux_error: Optional flux measurement uncertainties array.
        method: Normalization method. Supported methods are 'median' and 'zscore'.
            Defaults to 'median'.

    Returns:
        Tuple[np.ndarray, np.ndarray | None]: Normalized flux array and normalized
        flux_error array (or None if input flux_error is None).

    Raises:
        ValueError: If input arrays are not 1D, have mismatched lengths, are empty,
            if the normalization method is unsupported, or if baseline metrics
            (median/std) are zero or non-finite.
    """
    flux_arr = np.asarray(flux)
    if flux_arr.ndim != 1:
        raise ValueError("Flux array must be one-dimensional.")

    if len(flux_arr) == 0:
        raise ValueError("Flux array cannot be empty.")

    flux_err_arr: np.ndarray | None = None
    if flux_error is not None:
        flux_err_arr = np.asarray(flux_error)
        if flux_err_arr.ndim != 1:
            raise ValueError("Flux error array must be one-dimensional.")
        if len(flux_err_arr) != len(flux_arr):
            raise ValueError(
                f"Length mismatch: flux ({len(flux_arr)}) vs "
                f"flux_error ({len(flux_err_arr)})."
            )

    method_clean = method.lower().strip()
    if method_clean not in ("median", "zscore"):
        raise ValueError(
            f"Unsupported normalization method: '{method}'. "
            "Supported methods are 'median' and 'zscore'."
        )

    if method_clean == "median":
        med = float(np.median(flux_arr))
        if med == 0 or not np.isfinite(med):
            raise ValueError(
                f"Median flux is zero or non-finite ({med}), cannot normalize."
            )

        norm_flux = np.copy(flux_arr) / med
        norm_flux_err = (
            np.copy(flux_err_arr) / abs(med) if flux_err_arr is not None else None
        )

    else:  # zscore
        mean_val = float(np.mean(flux_arr))
        std_val = float(np.std(flux_arr))
        if std_val == 0 or not np.isfinite(std_val):
            raise ValueError(
                f"Standard deviation of flux is zero or non-finite ({std_val}), "
                "cannot calculate z-score."
            )

        norm_flux = (np.copy(flux_arr) - mean_val) / std_val
        norm_flux_err = (
            np.copy(flux_err_arr) / std_val if flux_err_arr is not None else None
        )

    return norm_flux, norm_flux_err
