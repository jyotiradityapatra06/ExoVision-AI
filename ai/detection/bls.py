"""Box Least Squares (BLS) transit search engine for ExoVision AI.

Uses Astropy's BoxLeastSquares time-series analysis tool to detect periodic exoplanet
transit dips in preprocessed photometric light curve data.
"""

import logging
from typing import Dict, Union

import numpy as np
from astropy.timeseries import BoxLeastSquares

from ai.detection.metrics import build_transit_mask, calculate_transit_snr
from ai.detection.models import TransitDetectionResult

logger = logging.getLogger(__name__)

DEFAULT_DURATIONS = np.array([0.05, 0.08, 0.1, 0.15, 0.2, 0.3])


def detect_transit_bls(
    lightcurve: Dict[str, np.ndarray],
    minimum_period: float = 0.5,
    maximum_period: float | None = None,
    durations: Union[np.ndarray, list[float], None] = None,
    minimum_snr: float = 6.0,
) -> TransitDetectionResult:
    """Detect periodic exoplanet transit signals using Box Least Squares (BLS).

    Args:
        lightcurve: Preprocessed light curve dictionary containing 'time', 'flux',
            and 'flux_error' 1D arrays.
        minimum_period: Minimum period search bound in days. Defaults to 0.5.
        maximum_period: Optional maximum period search bound in days. Defaults to
            half the observation time baseline.
        durations: Optional array of trial transit durations in days.
        minimum_snr: Minimum SNR threshold required to mark detected=True.
            Defaults to 6.0.

    Returns:
        TransitDetectionResult: Structured detection result container.

    Raises:
        ValueError: If required keys are missing, arrays are non-1D, empty,
            have mismatched lengths, contain insufficient valid points (< 20),
            or period/duration range specifications are invalid.
    """
    if not isinstance(lightcurve, dict):
        raise ValueError("Input lightcurve must be a dictionary.")

    required_keys = {"time", "flux", "flux_error"}
    missing_keys = required_keys - set(lightcurve.keys())
    if missing_keys:
        raise ValueError(
            f"Light curve dictionary missing required keys: {missing_keys}"
        )

    time_arr = np.asarray(lightcurve["time"], dtype=np.float64)
    flux_arr = np.asarray(lightcurve["flux"], dtype=np.float64)
    err_arr = np.asarray(lightcurve["flux_error"], dtype=np.float64)

    if time_arr.ndim != 1 or flux_arr.ndim != 1 or err_arr.ndim != 1:
        raise ValueError("Time, flux, and flux_error arrays must be one-dimensional.")

    n_samples = len(time_arr)
    if n_samples == 0:
        raise ValueError("Input light curve arrays cannot be empty.")

    if not (n_samples == len(flux_arr) == len(err_arr)):
        raise ValueError(
            f"Array length mismatch: time ({n_samples}), flux ({len(flux_arr)}), "
            f"flux_error ({len(err_arr)})."
        )

    # Filter non-finite entries and non-positive uncertainties
    valid_mask = (
        np.isfinite(time_arr)
        & np.isfinite(flux_arr)
        & np.isfinite(err_arr)
        & (err_arr > 0)
    )

    clean_time = time_arr[valid_mask]
    clean_flux = flux_arr[valid_mask]
    clean_err = err_arr[valid_mask]

    if len(clean_time) < 20:
        raise ValueError(
            f"Insufficient valid observations for BLS search (got {len(clean_time)}, "
            "minimum 20 required)."
        )

    time_span = float(np.max(clean_time) - np.min(clean_time))
    if time_span <= 0:
        raise ValueError(
            "Observation time span must be positive to perform periodogram search."
        )

    if minimum_period <= 0:
        raise ValueError(f"Minimum period must be positive, got {minimum_period}.")

    if minimum_period >= time_span:
        raise ValueError(
            f"Minimum period ({minimum_period}) must be smaller than time baseline "
            f"({time_span:.2f})."
        )

    if maximum_period is None:
        max_period = time_span / 2.0
    else:
        max_period = float(maximum_period)

    if max_period <= minimum_period:
        raise ValueError(
            f"Maximum period ({max_period}) must be greater than minimum period "
            f"({minimum_period})."
        )

    if max_period > time_span:
        max_period = time_span

    # Setup trial durations
    if durations is None:
        dur_arr = np.copy(DEFAULT_DURATIONS)
    else:
        dur_arr = np.asarray(durations, dtype=np.float64)

    valid_dur_mask = (dur_arr > 0) & (dur_arr < minimum_period) & (dur_arr < time_span)
    valid_durations = dur_arr[valid_dur_mask]

    if len(valid_durations) == 0:
        raise ValueError(
            "No valid trial transit durations remain that are smaller than "
            "minimum_period and time baseline."
        )

    logger.info(
        "Running BLS search over %d points (span %.2f d, period range [%.2f, %.2f] d).",
        len(clean_time),
        time_span,
        minimum_period,
        max_period,
    )

    model = BoxLeastSquares(clean_time, clean_flux, clean_err)
    results = model.autopower(
        duration=valid_durations,
        minimum_period=minimum_period,
        maximum_period=max_period,
    )

    best_idx = int(np.argmax(results.power))
    best_period = float(results.period[best_idx])
    best_duration = float(results.duration[best_idx])
    best_transit_time = float(results.transit_time[best_idx])
    best_power = float(results.power[best_idx])

    # Compute model stats for depth & depth uncertainty
    stats = model.compute_stats(best_period, best_duration, best_transit_time)
    depth_tuple = stats.get("depth", (0.0, 0.0))
    best_depth = (
        float(depth_tuple[0]) if isinstance(depth_tuple, tuple) else float(depth_tuple)
    )
    best_depth_err = (
        float(depth_tuple[1])
        if (isinstance(depth_tuple, tuple) and len(depth_tuple) > 1)
        else 0.0
    )
    best_depth_err = max(0.0, best_depth_err)

    # Build transit mask and calculate signal-to-noise ratio
    mask = build_transit_mask(
        clean_time, best_period, best_duration, best_transit_time
    )

    if np.any(mask) and best_depth > 0:
        snr = calculate_transit_snr(best_depth, clean_err, mask)
    else:
        snr = 0.0

    detected = bool(
        np.isfinite(best_period)
        and np.isfinite(best_depth)
        and best_depth > 0
        and snr >= minimum_snr
    )

    logger.info(
        "BLS search finished: detected=%s, period=%.4f d, depth=%.6f, SNR=%.2f.",
        detected,
        best_period,
        best_depth,
        snr,
    )

    return TransitDetectionResult(
        detected=detected,
        period_days=best_period,
        duration_days=best_duration,
        transit_time=best_transit_time,
        depth=best_depth,
        depth_error=best_depth_err,
        snr=snr,
        power=best_power,
        false_alarm_probability=None,
    )
