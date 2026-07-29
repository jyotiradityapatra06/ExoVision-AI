# Light Curve Dataset Specifications

## Supported Astronomy Datasets

ExoVision AI is designed to ingest photometric time-series datasets from primary space-based transit survey missions:

### 1. NASA Kepler Mission
- **Target Stars**: ~200,000 stars in the Cygnus-Lyra constellation.
- **Cadence**: Long Cadence (29.4 min) & Short Cadence (1 min).
- **Data Format**: FITS files containing SAP (Simple Aperture Photometry) and PDCSAP (Pre-search Data Conditioning SAP) flux.

### 2. NASA K2 Mission
- **Coverage**: Ecliptic plane campaigns (19 campaigns).
- **Special Characteristics**: Increased pointing drift due to two-wheel operation; requires specialized systematics correction (e.g., EVEREST, K2SFF).

### 3. NASA TESS (Transiting Exoplanet Survey Satellite)
- **Coverage**: All-sky survey divided into 2-year observational sectors.
- **Cadence**: 2-minute target pixel cadence and 20-second fast cadence.
- **Data Format**: Target Pixel Files (TPF) and Light Curve Files (LCF).

---

## Directory Organization

Raw and processed data files are stored in structured subdirectories:

- `data/raw/`: Original FITS light-curve downloads.
- `data/interim/`: Cleaned, detrended, and outlier-filtered light curves.
- `data/processed/`: Phase-folded flux arrays, feature matrix vectors (`.parquet` / `.npy`).
- `data/samples/`: Benchmark sample light curves for testing algorithms.
- `data/metadata/`: Stellar catalogs (stellar radius, mass, effective temperature) and target ID maps.
