# Astronomical Light Curve Dataset Specifications

## 1. Primary Dataset Sources

ExoVision AI ingests photometric time-series datasets from NASA's space-based transit photometry survey missions:

### NASA Kepler Mission (2009–2013)
- **Observational Target**: ~200,000 stars in a fixed 115-square-degree field in the Cygnus-Lyra region.
- **Cadence**: Long Cadence (29.4 minutes) and Short Cadence (1 minute).
- **Primary Data Products**: Target Pixel Files (TPF) and Light Curve Files (LCF).

### NASA K2 Mission (2014–2018)
- **Observational Target**: Ecliptic plane campaigns across 19 sectors following the loss of two reaction wheels.
- **Cadence**: 29.4-minute cadence with drift correction required due to solar radiation pressure pointing drift.

### NASA TESS (Transiting Exoplanet Survey Satellite, 2018–Present)
- **Observational Target**: All-sky survey dividing northern and southern celestial hemispheres into 27-day sectors.
- **Cadence**: 30-minute full-frame images (FFI), 2-minute target cadence, and 20-second fast cadence.

---

## 2. FITS (Flexible Image Transport System) File Format

Space-based telescopes package light curve data using the **FITS** (Flexible Image Transport System) standard format (`.fits` / `.fits.gz`), regulated by the International Astronomical Union (IAU).

### FITS File Structure
1. **Primary HDU (Header Data Unit)**:
   - Contains global metadata (telescope name, mission, object target identifier, RA/Dec coordinates, observation start/end dates).
2. **Binary Table HDU (Extension 1)**:
   - Contains array columns holding time-series photometric measurements across thousands of observation cadences.

---

## 3. Light Curve Column Specifications

| Column Name | Data Type | Description | Scientific Role |
| :--- | :--- | :--- | :--- |
| `TIME` | `float64` | Observation timestamp in Barycentric Julian Date (`BJD - 2454833.0` for Kepler, `BTJD` for TESS). | X-axis for orbital period identification. |
| `FLUX` / `PDCSAP_FLUX` | `float64` | Pre-search Data Conditioning Simple Aperture Photometry flux in electrons/second ($e^-/s$). | Y-axis measuring stellar brightness variations and transit dips. |
| `FLUX_ERROR` | `float64` | 1-sigma statistical measurement uncertainty derived from CCD read noise and photon shot noise. | Error weighting during periodogram and likelihood calculations. |
| `QUALITY` | `int32` | Bitmask quality flag indicating instrumental anomalies (e.g., momentum dumps, cosmic rays, thruster fires). | Filtering invalid data points prior to analysis. |

---

## 4. Scientific Justification: Why Kepler and TESS are Critical for Exoplanet AI

Space telescopes like Kepler and TESS eliminate Earth's atmospheric distortion, scintillation, and day-night observational gaps. They achieve ultra-high photometric precision ($<10\text{ ppm}$), enabling AI models to detect Earth-sized planet transits blocking less than $0.01\%$ of starlight.
