"""Metrics and masking functions for exoplanet transit signal analysis."""

import numpy as np


def build_transit_mask(
    time: np.ndarray,
    period: float,
    duration: float,
    transit_time: float,
) -> np.ndarray:
    """Generate a periodic boolean mask identifying in-transit observation timestamps.

    Args:
        time: Timestamp array.
        period: Orbital period in days.
        duration: Transit duration in days.
        transit_time: Central transit epoch timestamp (T0).

    Returns:
        np.ndarray: Boolean mask array where True indicates an in-transit timestamp.

    Raises:
        ValueError: If time array is invalid, non-finite, empty, or if period/duration
            parameters are non-positive or duration >= period.
    """
    time_arr = np.asarray(time)
    if time_arr.ndim != 1:
        raise ValueError("Time array must be one-dimensional.")

    if len(time_arr) == 0:
        raise ValueError("Time array cannot be empty.")

    if not np.all(np.isfinite(time_arr)):
        raise ValueError("Time array contains non-finite values (NaN or Inf).")

    if period <= 0:
        raise ValueError(f"Period must be positive, got {period}.")

    if duration <= 0:
        raise ValueError(f"Duration must be positive, got {duration}.")

    if duration >= period:
        raise ValueError(
            f"Duration ({duration}) must be smaller than period ({period})."
        )

    # Phase fold timestamps around central transit time T0 into [-period/2, period/2]
    phase = (time_arr - transit_time + 0.5 * period) % period - 0.5 * period
    mask = np.abs(phase) < (0.5 * duration)

    return np.asarray(mask, dtype=bool)


def calculate_transit_snr(
    depth: float,
    flux_error: np.ndarray,
    in_transit_mask: np.ndarray,
) -> float:
    """Calculate statistical signal-to-noise ratio (SNR) of a detected transit depth.

    Formula:
        SNR = depth / effective_uncertainty
        effective_uncertainty = 1.0 / sqrt(sum(1.0 / (sigma_i^2)))

    Args:
        depth: Estimated fractional transit depth.
        flux_error: Flux error array.
        in_transit_mask: Boolean mask indicating in-transit observations.

    Returns:
        float: Calculated plain Python float SNR value (0.0 if depth <= 0).

    Raises:
        ValueError: If arrays are not 1D, have unequal lengths, are empty,
            if no in-transit observations exist, or if usable uncertainties are <= 0
            or non-finite.
    """
    err_arr = np.asarray(flux_error)
    mask_arr = np.asarray(in_transit_mask, dtype=bool)

    if err_arr.ndim != 1 or mask_arr.ndim != 1:
        raise ValueError(
            "Flux error and in-transit mask arrays must be one-dimensional."
        )

    if len(err_arr) == 0:
        raise ValueError("Arrays cannot be empty.")

    if len(err_arr) != len(mask_arr):
        raise ValueError(
            f"Length mismatch: flux_error ({len(err_arr)}) vs "
            f"in_transit_mask ({len(mask_arr)})."
        )

    if not np.any(mask_arr):
        raise ValueError("In-transit mask must contain at least one True observation.")

    # Extract in-transit flux uncertainties
    in_transit_err = err_arr[mask_arr]
    valid_mask = np.isfinite(in_transit_err) & (in_transit_err > 0)
    usable_err = in_transit_err[valid_mask]

    if len(usable_err) == 0:
        raise ValueError(
            "No valid positive flux uncertainties available for in-transit points."
        )

    if depth <= 0:
        return 0.0

    # Effective uncertainty from weighted combination of in-transit points
    eff_uncertainty = 1.0 / float(np.sqrt(np.sum(1.0 / (usable_err**2))))
    snr = float(depth / eff_uncertainty)

    return float(snr)
