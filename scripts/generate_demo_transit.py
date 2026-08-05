"""
Generate a synthetic exoplanet transit FITS file for ExoVision testing.
"""

from pathlib import Path
import numpy as np
from astropy.io import fits


def create_transit_lightcurve():
    np.random.seed(42)

    # Observation timeline
    samples = 5000
    time = np.linspace(0, 50, samples)

    # Normal stellar brightness
    flux = np.ones(samples)

    # Planet parameters
    period = 5.0          # days
    transit_depth = 0.01  # 1% brightness drop
    duration = 0.15       # days

    # Inject periodic transit
    for center in np.arange(2.5, 50, period):
        phase_distance = np.abs(
            ((time - center + period / 2) % period) - period / 2
        )

        transit = phase_distance < duration / 2

        flux[transit] -= transit_depth

    # Add realistic noise
    noise = np.random.normal(
        0,
        0.0015,
        samples
    )

    flux += noise

    flux_error = np.full(
        samples,
        0.0015
    )

    return time, flux, flux_error


def save_fits():

    output = Path(
        "data/samples/exoplanet_demo_transit.fits"
    )

    output.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    time, flux, flux_error = create_transit_lightcurve()

    columns = [
        fits.Column(
            name="TIME",
            array=time,
            format="D"
        ),
        fits.Column(
            name="FLUX",
            array=flux,
            format="D"
        ),
        fits.Column(
            name="FLUX_ERROR",
            array=flux_error,
            format="D"
        ),
    ]

    table = fits.BinTableHDU.from_columns(columns)

    table.writeto(
        output,
        overwrite=True
    )

    print("Created:")
    print(output)


if __name__ == "__main__":
    save_fits()