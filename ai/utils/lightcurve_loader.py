"""Light curve loader and validation utilities for ExoVision AI.

Supports loading FITS photometric time-series files from NASA Kepler, K2, and
TESS missions using Astropy and Lightkurve.
"""

from pathlib import Path
from typing import Any, Dict

import numpy as np
from astropy.io import fits


def validate_lightcurve(data: Dict[str, Any]) -> bool:
    """Validate a light curve dictionary payload.

    Args:
        data: Dictionary containing light curve arrays.

    Returns:
        bool: True if the dictionary passes all validation checks.

    Raises:
        ValueError: If required keys are missing, array lengths mismatch,
            or arrays are empty.
    """
    required_keys = {"time", "flux", "flux_error", "quality"}
    missing_keys = required_keys - set(data.keys())
    if missing_keys:
        raise ValueError(f"Light curve dictionary is missing keys: {missing_keys}")

    time_arr = np.asarray(data["time"])
    flux_arr = np.asarray(data["flux"])
    flux_err_arr = np.asarray(data["flux_error"])
    quality_arr = np.asarray(data["quality"])

    if time_arr.size == 0:
        raise ValueError("Light curve contains empty arrays.")

    lengths = {
        "time": time_arr.size,
        "flux": flux_arr.size,
        "flux_error": flux_err_arr.size,
        "quality": quality_arr.size,
    }

    unique_lengths = set(lengths.values())
    if len(unique_lengths) > 1:
        raise ValueError(f"Array length mismatch across light curve series: {lengths}")

    return True


def load_lightcurve_fits(file_path: str | Path) -> Dict[str, np.ndarray]:
    """Load a FITS light curve file and extract primary time series columns.

    Supports Kepler, K2, and TESS FITS files produced by standard pipelines.

    Args:
        file_path: Path to the .fits or .fits.gz light curve file.

    Returns:
        Dict[str, np.ndarray]: A dictionary containing cleaned numpy arrays for:
            - 'time': Observation timestamps (BJD / BTJD)
            - 'flux': Measured aperture flux or PDCSAP/SAP flux
            - 'flux_error': Flux measurement uncertainties
            - 'quality': Data quality flag bitmasks

    Raises:
        FileNotFoundError: If the specified file_path does not exist.
        ValueError: If required binary table HDU or columns are missing.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"FITS file not found at: {path}")

    try:
        hdul_context = fits.open(path)
    except (OSError, ValueError) as exc:
        raise ValueError(f"Unable to open FITS file '{path}': {exc}") from exc

    with hdul_context as hdul:
        # Find binary table extension (usually HDU 1)
        bintable_hdu = None
        for hdu in hdul:
            if isinstance(hdu, (fits.BinTableHDU, fits.TableHDU)):
                bintable_hdu = hdu
                break

        if bintable_hdu is None:
            raise ValueError(f"No binary table HDU found in FITS file: {path}")

        data = bintable_hdu.data
        colnames = [col.name.upper() for col in bintable_hdu.columns]

        # Extract TIME
        if "TIME" in colnames:
            raw_time = np.array(data["TIME"], dtype=np.float64)
        else:
            raise ValueError(f"Column 'TIME' not found in FITS file: {path}")

        # Extract FLUX (prefer PDCSAP_FLUX, then SAP_FLUX, then FLUX)
        if "PDCSAP_FLUX" in colnames:
            raw_flux = np.array(data["PDCSAP_FLUX"], dtype=np.float64)
        elif "SAP_FLUX" in colnames:
            raw_flux = np.array(data["SAP_FLUX"], dtype=np.float64)
        elif "FLUX" in colnames:
            raw_flux = np.array(data["FLUX"], dtype=np.float64)
        else:
            raise ValueError(f"Flux column not found in FITS file: {path}")

        # Extract FLUX_ERROR
        if "PDCSAP_FLUX_ERR" in colnames:
            raw_flux_err = np.array(data["PDCSAP_FLUX_ERR"], dtype=np.float64)
        elif "SAP_FLUX_ERR" in colnames:
            raw_flux_err = np.array(data["SAP_FLUX_ERR"], dtype=np.float64)
        elif "FLUX_ERR" in colnames:
            raw_flux_err = np.array(data["FLUX_ERR"], dtype=np.float64)
        elif "FLUX_ERROR" in colnames:
            raw_flux_err = np.array(data["FLUX_ERROR"], dtype=np.float64)
        else:
            raw_flux_err = np.zeros_like(raw_flux)

        # Extract QUALITY flags
        if "SAP_QUALITY" in colnames:
            raw_quality = np.array(data["SAP_QUALITY"], dtype=np.int32)
        elif "QUALITY" in colnames:
            raw_quality = np.array(data["QUALITY"], dtype=np.int32)
        else:
            raw_quality = np.zeros(len(raw_time), dtype=np.int32)

        # Clean NaN values in time or flux
        valid_mask = np.isfinite(raw_time) & np.isfinite(raw_flux)
        clean_time = raw_time[valid_mask]
        clean_flux = raw_flux[valid_mask]
        clean_flux_err = raw_flux_err[valid_mask]
        clean_quality = raw_quality[valid_mask]

        result = {
            "time": clean_time,
            "flux": clean_flux,
            "flux_error": clean_flux_err,
            "quality": clean_quality,
        }

        validate_lightcurve(result)
        return result
