"""Exoplanet light curve preprocessing pipeline.

Chains cleaning, normalization, outlier removal, and detrending into a reproducible
production pipeline for NASA Kepler and TESS photometric time-series.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Union

import numpy as np

from ai.preprocessing.clean import clean_lightcurve
from ai.preprocessing.detrend import detrend_lightcurve
from ai.preprocessing.normalize import normalize_lightcurve
from ai.preprocessing.outliers import remove_outliers
from ai.utils.lightcurve_loader import load_lightcurve_fits, validate_lightcurve

logger = logging.getLogger(__name__)

DEFAULT_CONFIG: Dict[str, Any] = {
    "require_positive_time": False,
    "normalization_method": "median",
    "outlier_sigma": 5.0,
    "preserve_transits": True,
    "detrend_method": "auto",
    "window_length": 101,
    "polyorder": 2,
}


def preprocess_lightcurve(
    lightcurve: Union[Dict[str, np.ndarray], str, Path],
    config: Dict[str, Any] | None = None,
) -> Dict[str, np.ndarray]:
    """Preprocess raw light curve dictionary or FITS file through the standard pipeline.

    Workflow:
        1. Load FITS (if path supplied) or validate light curve dictionary.
        2. Clean non-finite entries and duplicate timestamps.
        3. Normalize flux and flux uncertainties.
        4. Remove noise outliers (preserving exoplanet transits).
        5. Detrend low-frequency stellar variability.
        6. Validate processed output.

    Args:
        lightcurve: A light curve dictionary with 'time', 'flux', 'flux_error',
            'quality' arrays, or a str/Path pointing to a FITS file.
        config: Optional configuration dictionary overriding pipeline defaults.

    Returns:
        Dict[str, np.ndarray]: Processed light curve payload containing clean,
        normalized, clipped, and detrended time series.

    Raises:
        ValueError: If input format is invalid, required keys are missing,
            or any stage fails.
        FileNotFoundError: If a supplied FITS file path does not exist.
    """
    merged_config = {**DEFAULT_CONFIG, **(config or {})}

    if isinstance(lightcurve, (str, Path)):
        logger.info("Loading FITS light curve from path: %s", lightcurve)
        raw_lc = load_lightcurve_fits(lightcurve)
    elif isinstance(lightcurve, dict):
        # Validate required dictionary keys without mutating original input
        validate_lightcurve(lightcurve)
        raw_lc = {
            "time": np.asarray(lightcurve["time"]),
            "flux": np.asarray(lightcurve["flux"]),
            "flux_error": np.asarray(lightcurve["flux_error"]),
            "quality": np.asarray(lightcurve["quality"]),
        }
    else:
        raise ValueError(
            f"Unsupported light curve input type: {type(lightcurve)}. "
            "Expected dict, str, or Path."
        )

    initial_count = len(raw_lc["time"])
    logger.info(
        "Starting light curve preprocessing pipeline on %d samples.", initial_count
    )

    # 1. Clean stage
    clean_time, clean_flux, clean_err, clean_qual = clean_lightcurve(
        time=raw_lc["time"],
        flux=raw_lc["flux"],
        flux_error=raw_lc["flux_error"],
        quality=raw_lc["quality"],
        require_positive_time=bool(merged_config["require_positive_time"]),
    )
    logger.info(
        "Clean stage completed: %d -> %d samples.", initial_count, len(clean_time)
    )

    # 2. Normalize stage
    norm_flux, norm_err = normalize_lightcurve(
        flux=clean_flux,
        flux_error=clean_err,
        method=str(merged_config["normalization_method"]),
    )
    if norm_err is None:
        norm_err = np.zeros_like(norm_flux)
    logger.info(
        "Normalize stage completed using method '%s'.",
        merged_config["normalization_method"],
    )

    # 3. Outlier removal stage
    pre_outlier_count = len(clean_time)
    outlier_time, outlier_flux, outlier_err, outlier_qual = remove_outliers(
        time=clean_time,
        flux=norm_flux,
        flux_error=norm_err,
        quality=clean_qual,
        sigma=float(merged_config["outlier_sigma"]),
        preserve_transits=bool(merged_config["preserve_transits"]),
    )
    logger.info(
        "Outliers removal stage completed: %d -> %d samples.",
        pre_outlier_count,
        len(outlier_time),
    )

    # 4. Detrend stage
    detrended_flux, detrended_err = detrend_lightcurve(
        time=outlier_time,
        flux=outlier_flux,
        flux_error=outlier_err,
        window_length=int(merged_config["window_length"]),
        polyorder=int(merged_config["polyorder"]),
        method=str(merged_config["detrend_method"]),
    )
    if detrended_err is None:
        detrended_err = np.zeros_like(detrended_flux)
    logger.info(
        "Detrend stage completed using method '%s'.", merged_config["detrend_method"]
    )

    result = {
        "time": outlier_time,
        "flux": detrended_flux,
        "flux_error": detrended_err,
        "quality": outlier_qual,
    }

    validate_lightcurve(result)
    logger.info(
        "Preprocessing pipeline finished successfully. Output sample count: %d.",
        len(result["time"]),
    )
    return result
