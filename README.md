# ExoVision AI

ExoVision AI is an exoplanet light-curve processing system for NASA Kepler,
K2, and TESS photometry. Phase 1 provides a reproducible foundation for FITS
acquisition, validation, preprocessing, visualization, and tabular export.
Transit detection and machine-learning models are intentionally outside the
Phase 1 scope.

## Current Pipeline

```text
Data Acquisition (FITS)
          |
          v
Loader and Validation
          |
          v
Preprocessing
  clean -> normalize -> transit-safe outlier removal -> detrend
          |
          v
Visualization
  raw -> processed -> comparison
          |
          v
CSV Export
```

The preprocessing defaults live in `ai/preprocessing/pipeline.py` as
`DEFAULT_CONFIG`. Callers may override individual values through the
`preprocess_lightcurve(..., config={...})` argument.

## Requirements

- Python 3.12
- Node.js 20 or later (only for the optional web frontend)
- Git

## Installation

Create and activate a virtual environment, then install runtime and development
dependencies:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r backend/requirements-dev.txt
```

On Linux or macOS, activate with `source .venv/bin/activate`.

## Data Acquisition

Generate deterministic sample Kepler and TESS FITS files and update the
metadata catalog:

```powershell
python scripts/download_lightcurves.py
```

Use `--force` to regenerate existing samples. Generated FITS files are stored
under `data/raw/kepler/` and `data/raw/tess/` and are excluded from Git.

## Run the Phase 1 Pipeline

Process FITS files, create raw/processed/comparison plots, and export CSV files:

```powershell
python scripts/preprocess_dataset.py
```

Generated artifacts are written beneath `outputs/`, which is excluded from
Git. The script logs per-file failures and continues processing the remaining
dataset.

## Tests and Quality Checks

```powershell
python -m pytest -v
python -m ruff check ai scripts
```

The test suite uses synthetic FITS fixtures and does not require network access.
It covers Kepler and TESS column conventions, malformed and empty FITS inputs,
preprocessing stages, plotting, CSV export, and the complete integration path.

## Repository Layout

```text
ai/
  preprocessing/       cleaning, normalization, clipping, detrending, pipeline
  utils/               FITS loading and validation
  visualization/       raw, processed, and comparison plots
  export/              CSV export
  tests/               AI and pipeline tests
backend/               FastAPI service and tests
frontend/              Next.js application
data/
  raw/                 generated/downloaded FITS files
  metadata/            dataset catalog
  processed/           reserved processed datasets
scripts/
  download_lightcurves.py
  preprocess_dataset.py
docs/                  architecture, dataset, roadmap, and audit documentation
```

## Roadmap

- Phase 1 — Foundation and astronomical data pipeline: complete
- Phase 2 — BLS/TLS exoplanet transit detection engine
- Phase 3 — Candidate features, validation, and false-positive analysis
- Phase 4 — Model experimentation and evaluation
- Phase 5 — API and user-interface integration

Phase 2 should begin only after the Phase 1 audit gate documented in
`docs/phase1-final-audit.md` remains green in continuous integration.

## License

MIT. See `LICENSE`.
