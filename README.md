# ExoVision AI

ExoVision AI is an exoplanet light-curve processing system for NASA Kepler,
K2, and TESS photometry. Phase 1 provides the reproducible data foundation.
Phase 2 adds BLS transit detection, synthetic-signal validation, phase-folded
analysis, candidate extraction, heuristic confidence scoring, and reusable
single/batch orchestration. The current release candidate is **v1.2.0 —
Phase 2 Transit Detection and Candidate Analysis**.

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
Visualization and CSV Export
          |
          v
BLS Transit Detection
          |
          v
Phase Folding and Candidate Analysis
          |
          v
Recovery Metrics and Confidence Scoring
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

## Run the Data Pipeline

Process FITS files, create raw/processed/comparison plots, and export CSV files:

```powershell
python scripts/preprocess_dataset.py
```

Generated artifacts are written beneath `outputs/`, which is excluded from
Git. The script logs per-file failures and continues processing the remaining
dataset.

## Run Transit Analysis

Run the deterministic synthetic end-to-end demonstration:

```powershell
python scripts/run_transit_demo.py
python scripts/run_transit_demo.py --output outputs/transit-demo.json
```

The demo injects a known transit, preprocesses the light curve, runs the
existing BLS detector, folds the result, evaluates recovery, builds a candidate,
and reports its heuristic confidence score.

For programmatic use:

```python
from ai.pipeline import analyze_lightcurve
from ai.simulation import generate_synthetic_transit

lightcurve = generate_synthetic_transit(
    start_time=0.0,
    end_time=30.0,
    cadence=0.02,
    period=3.7,
    transit_epoch=1.1,
    transit_duration=0.16,
    transit_depth=0.018,
    noise_std=0.001,
    random_seed=42,
)
result = analyze_lightcurve(
    lightcurve["time"],
    lightcurve["flux"],
    flux_error=lightcurve["flux_error"],
    quality=lightcurve["quality"],
    source_id="synthetic-example",
)
print(result.status.value, result.detection, result.confidence)
```

`TransitAnalysisResult` contains the pipeline status, input/preprocessing
summaries, BLS detection, optional folded/binning summaries, optional injected
signal recovery, extracted candidate, confidence score, per-stage diagnostics,
warnings, errors, timings, and configuration. `result.to_dict()` produces a
JSON-safe concise representation; large intermediate arrays are excluded by
default.

See [Phase 2 Transit Detection](docs/phase-2-transit-detection.md) for public
APIs, configuration, status semantics, serialization, and scientific
limitations.

## Tests and Quality Checks

```powershell
python -m pytest
python -m ruff check ai scripts backend
git diff --check
```

The test suite uses synthetic FITS fixtures and does not require network access.
It covers Kepler and TESS column conventions, malformed and empty FITS inputs,
preprocessing, plotting, export, synthetic injection/recovery, phase folding,
candidate analysis, confidence scoring, and single/batch orchestration.

## Repository Layout

```text
ai/
  preprocessing/       cleaning, normalization, clipping, detrending, pipeline
  utils/               FITS loading and validation
  visualization/       raw, processed, and comparison plots
  export/              CSV export
  detection/           Box Least Squares transit detection
  simulation/          deterministic synthetic transit generation
  transit/             phase folding, event and candidate extraction
  evaluation/          recovery metrics and candidate confidence scoring
  pipeline/            end-to-end single and batch orchestration
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
  run_transit_demo.py
docs/                  architecture, dataset, roadmap, and audit documentation
```

## Roadmap

- Phase 1 — Foundation and astronomical data pipeline: complete
- Phase 2 — Transit detection and candidate analysis: release-ready
- Phase 3 — Astrophysical vetting and false-positive validation
- Phase 4 — Model experimentation and evaluation
- Phase 5 — API and user-interface integration

The Phase 1 audit gate is documented in `docs/phase1-final-audit.md`.

## Scientific Disclaimer

A BLS candidate or confidence score is not a confirmed exoplanet. The score is
a deterministic engineering heuristic, not a calibrated probability. Candidate
validation requires additional astrophysical vetting, false-positive analysis,
and preferably independent observations before scientific interpretation.

## License

MIT. See `LICENSE`.
