"""Controlled synthetic box-transit light curves for detector validation."""

from numbers import Real
from typing import Dict

import numpy as np

from ai.detection.metrics import build_transit_mask


def generate_synthetic_transit(
    start_time: float = 0.0,
    end_time: float = 30.0,
    cadence: float = 0.02,
    period: float = 3.5,
    transit_epoch: float = 1.0,
    transit_duration: float = 0.15,
    transit_depth: float = 0.01,
    baseline_flux: float = 1.0,
    noise_std: float = 0.001,
    random_seed: int | None = None,
    missing_fraction: float = 0.0,
    outlier_fraction: float = 0.0,
    outlier_amplitude: float = 0.1,
) -> Dict[str, np.ndarray]:
    """Generate a detector-compatible light curve with periodic box transits.

    The observation interval is half-open: ``start_time <= time < end_time``.
    Missing samples and outlier locations are selected without replacement.

    Args:
        start_time: First possible observation time in days.
        end_time: Exclusive end of the observation interval in days.
        cadence: Time between observations in days.
        period: Orbital period in days.
        transit_epoch: Center time of any transit in the periodic sequence.
        transit_duration: Full box-transit duration in days.
        transit_depth: Absolute flux decrease during transit.
        baseline_flux: Out-of-transit stellar flux.
        noise_std: Standard deviation of additive Gaussian flux noise.
        random_seed: Optional seed for deterministic random generation.
        missing_fraction: Fraction of generated observations to remove.
        outlier_fraction: Fraction of retained observations to perturb.
        outlier_amplitude: Absolute magnitude of injected flux outliers.

    Returns:
        A dictionary containing synchronized ``time``, ``flux``, ``flux_error``,
        and ``quality`` NumPy arrays.

    Raises:
        ValueError: If a parameter is non-finite, outside its valid range, or
            would produce no observations.
        TypeError: If ``random_seed`` is not an integer or ``None``.
    """
    numeric_values = {
        "start_time": start_time,
        "end_time": end_time,
        "cadence": cadence,
        "period": period,
        "transit_epoch": transit_epoch,
        "transit_duration": transit_duration,
        "transit_depth": transit_depth,
        "baseline_flux": baseline_flux,
        "noise_std": noise_std,
        "missing_fraction": missing_fraction,
        "outlier_fraction": outlier_fraction,
        "outlier_amplitude": outlier_amplitude,
    }
    for name, value in numeric_values.items():
        if (
            isinstance(value, bool)
            or not isinstance(value, Real)
            or not np.isfinite(value)
        ):
            raise ValueError(f"{name} must be a finite number, got {value!r}.")

    if end_time <= start_time:
        raise ValueError("end_time must be greater than start_time.")
    if cadence <= 0:
        raise ValueError(f"cadence must be positive, got {cadence}.")
    if period <= 0:
        raise ValueError(f"period must be positive, got {period}.")
    if transit_duration <= 0:
        raise ValueError(f"transit_duration must be positive, got {transit_duration}.")
    if transit_duration >= period:
        raise ValueError("transit_duration must be smaller than period.")
    if baseline_flux <= 0:
        raise ValueError(f"baseline_flux must be positive, got {baseline_flux}.")
    if transit_depth <= 0 or transit_depth >= baseline_flux:
        raise ValueError(
            "transit_depth must be positive and smaller than baseline_flux."
        )
    if noise_std < 0:
        raise ValueError(f"noise_std cannot be negative, got {noise_std}.")
    if not 0.0 <= missing_fraction < 1.0:
        raise ValueError("missing_fraction must be in the range [0.0, 1.0).")
    if not 0.0 <= outlier_fraction <= 1.0:
        raise ValueError("outlier_fraction must be in the range [0.0, 1.0].")
    if outlier_fraction > 0 and outlier_amplitude <= 0:
        raise ValueError(
            "outlier_amplitude must be positive when outliers are requested."
        )
    if random_seed is not None and (
        isinstance(random_seed, bool) or not isinstance(random_seed, (int, np.integer))
    ):
        raise TypeError("random_seed must be an integer or None.")

    time = np.arange(start_time, end_time, cadence, dtype=np.float64)
    if len(time) == 0:
        raise ValueError("The requested observation range and cadence produce no data.")

    rng = np.random.default_rng(random_seed)
    transit_mask = build_transit_mask(
        time,
        period=float(period),
        duration=float(transit_duration),
        transit_time=float(transit_epoch),
    )
    flux = np.full(len(time), baseline_flux, dtype=np.float64)
    flux[transit_mask] -= transit_depth
    if noise_std > 0:
        flux += rng.normal(0.0, noise_std, size=len(time))

    reported_error = max(float(noise_std), np.finfo(np.float64).eps)
    flux_error = np.full(len(time), reported_error, dtype=np.float64)
    quality = np.zeros(len(time), dtype=np.int32)

    missing_count = int(np.floor(len(time) * missing_fraction))
    if missing_count:
        keep = np.ones(len(time), dtype=bool)
        missing_indices = rng.choice(len(time), size=missing_count, replace=False)
        keep[missing_indices] = False
        time = time[keep]
        flux = flux[keep]
        flux_error = flux_error[keep]
        quality = quality[keep]

    outlier_count = int(np.floor(len(time) * outlier_fraction))
    if outlier_count:
        outlier_indices = rng.choice(len(time), size=outlier_count, replace=False)
        signs = np.ones(outlier_count, dtype=np.float64)
        signs[1::2] = -1.0
        rng.shuffle(signs)
        flux[outlier_indices] += signs * outlier_amplitude
        quality[outlier_indices] = 1

    return {
        "time": time,
        "flux": flux,
        "flux_error": flux_error,
        "quality": quality,
    }
