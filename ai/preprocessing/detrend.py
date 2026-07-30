"""Light curve detrending module.

Removes low-frequency stellar variability and instrumental trends using Lightkurve
or Savitzky-Golay filtering.
"""

import logging
from typing import Tuple

import lightkurve as lk
import numpy as np
from scipy.signal import savgol_filter

logger = logging.getLogger(__name__)


def detrend_lightcurve(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray | None = None,
    window_length: int = 101,
    polyorder: int = 2,
    method: str = "auto",
) -> Tuple[np.ndarray, np.ndarray | None]:
    """Detrend light curve time series to isolate high-frequency signals.

    Args:
        time: Timestamp array.
        flux: Observed flux array.
        flux_error: Optional flux error array.
        window_length: Length of smoothing filter window. Must be positive odd
            integer. Defaults to 101.
        polyorder: Polynomial order for trend fitting. Defaults to 2.
        method: Detrending algorithm ('auto', 'lightkurve', 'savgol').
            Defaults to 'auto'.

    Returns:
        Tuple[np.ndarray, np.ndarray | None]: Detrended flux array and detrended
        flux_error array (or None if flux_error is None).

    Raises:
        ValueError: If input shapes are invalid, method is unsupported, polyorder
            is invalid, or if detrending produces non-finite or zero trends.
    """
    time_arr = np.asarray(time, dtype=np.float64)
    flux_arr = np.asarray(flux, dtype=np.float64)

    if time_arr.ndim != 1 or flux_arr.ndim != 1:
        raise ValueError("Time and flux arrays must be one-dimensional.")

    n_samples = len(time_arr)
    if n_samples == 0:
        raise ValueError("Time and flux arrays cannot be empty.")

    if len(flux_arr) != n_samples:
        raise ValueError(
            f"Length mismatch: time ({n_samples}) vs flux ({len(flux_arr)})."
        )

    flux_err_arr: np.ndarray | None = None
    if flux_error is not None:
        flux_err_arr = np.asarray(flux_error, dtype=np.float64)
        if flux_err_arr.ndim != 1:
            raise ValueError("Flux error array must be one-dimensional.")
        if len(flux_err_arr) != n_samples:
            raise ValueError(
                f"Length mismatch: time ({n_samples}) vs "
                f"flux_error ({len(flux_err_arr)})."
            )

    method_clean = method.lower().strip()
    if method_clean not in ("auto", "lightkurve", "savgol"):
        raise ValueError(
            f"Unsupported detrending method: '{method}'. "
            "Choose 'auto', 'lightkurve', or 'savgol'."
        )

    if polyorder < 1:
        raise ValueError(f"Polynomial order must be at least 1, got {polyorder}.")

    # Parameter adjustment for window_length
    adj_window = window_length

    # Ensure window is odd
    if adj_window % 2 == 0:
        adj_window += 1

    # Ensure window does not exceed sample length
    if adj_window > n_samples:
        adj_window = n_samples if n_samples % 2 != 0 else n_samples - 1

    # Check for short array condition where filtering is unsafe
    if n_samples <= polyorder + 1 or adj_window <= polyorder:
        logger.warning(
            "Light curve length (%d) too short for filter window (%d) "
            "and polyorder (%d). Returning median-normalized flux.",
            n_samples,
            adj_window,
            polyorder,
        )
        med = float(np.median(flux_arr))
        if med == 0 or not np.isfinite(med):
            raise ValueError("Median flux is zero or non-finite for short light curve.")
        norm_f = np.copy(flux_arr) / med
        norm_e = np.copy(flux_err_arr) / abs(med) if flux_err_arr is not None else None
        return norm_f, norm_e

    # Primary method attempt with Lightkurve
    if method_clean in ("auto", "lightkurve"):
        try:
            lc = lk.LightCurve(time=time_arr, flux=flux_arr, flux_err=flux_err_arr)
            flat_lc = lc.flatten(window_length=adj_window, polyorder=polyorder)

            detrended_flux = np.asarray(
                flat_lc.flux.value if hasattr(flat_lc.flux, "value") else flat_lc.flux,
                dtype=np.float64,
            )
            detrended_err = None
            if flux_err_arr is not None and flat_lc.flux_err is not None:
                detrended_err = np.asarray(
                    flat_lc.flux_err.value
                    if hasattr(flat_lc.flux_err, "value")
                    else flat_lc.flux_err,
                    dtype=np.float64,
                )

            if not np.all(np.isfinite(detrended_flux)):
                raise ValueError("Lightkurve flatten produced non-finite values.")

            return detrended_flux, detrended_err

        except Exception as exc:
            if method_clean == "lightkurve":
                raise ValueError(f"Lightkurve detrending failed: {exc}") from exc
            logger.info(
                "Lightkurve detrending failed in auto mode (%s). "
                "Falling back to Savitzky-Golay filter.",
                exc,
            )

    # Savitzky-Golay implementation / Fallback
    trend = savgol_filter(flux_arr, window_length=adj_window, polyorder=polyorder)

    if np.any(trend == 0) or not np.all(np.isfinite(trend)):
        raise ValueError(
            "Savitzky-Golay trend estimation produced zero or non-finite values."
        )

    detrended_flux = np.copy(flux_arr) / trend
    detrended_err = (
        np.copy(flux_err_arr) / np.abs(trend) if flux_err_arr is not None else None
    )

    if not np.all(np.isfinite(detrended_flux)):
        raise ValueError("Detrending resulted in non-finite flux values.")

    return detrended_flux, detrended_err
