# ExoVision AI

ExoVision AI is a full-stack astronomy platform that turns Kepler, K2, and TESS light curves into explainable exoplanet-candidate assessments. It combines a scientific transit-search pipeline with a Random Forest classifier, an interactive web product, and downloadable PDF reports.

> A detected or classified candidate is not a confirmed exoplanet. ExoVision is a screening and research-support tool; confirmation requires independent scientific validation.

## Features

- Professional responsive landing page and authenticated user workspace
- CSV, TXT, and FITS light-curve upload (up to 25 MB)
- Box Least Squares (BLS) periodic transit search
- Transit feature extraction and Random Forest classification
- Explainable AI evidence and model feature importance
- Interactive raw and phase-folded light-curve charts
- Scientific PDF report generation and authenticated download
- NASA MAST target search with Kepler, K2, and TESS mission filters
- One-click analysis of archive light curves through the standard pipeline
- Guided demo using a deterministic FITS transit dataset
- SQLite-backed users, datasets, analyses, candidates, and reports schema

## Architecture

```text
Next.js + TypeScript + Tailwind + Framer Motion
                    |
                    v
        FastAPI REST API + JWT auth
           |                    |
           v                    v
    Local FITS/upload      NASA MAST API
           |                    |
           +---------+----------+
                     v
        FITS loader and validation
                     v
        Cleaning and preprocessing
                     v
          BLS transit detection
                     v
     Candidate and feature extraction
                     v
        Random Forest classification
                     v
    Evidence explanation and PDF report
```

### Frontend

The `frontend/` Next.js application provides the landing page, authentication, dashboard, upload observatory, NASA dataset explorer, guided demo, results dashboard, charts, and reports history. API access is centralized in `frontend/src/lib/api.ts`.

### Backend

The `backend/` FastAPI application exposes versioned endpoints under `/api/v1`, validates JWT ownership, stores analysis state, runs the existing scientific pipeline, projects visualization-ready results, and generates PDF reports. SQLite migrations live in `backend/migrations/`.

### AI pipeline

The `ai/` package owns light-curve preprocessing, BLS detection, phase folding, candidate extraction, feature engineering, Random Forest inference, explainability, visualization helpers, and evaluation. API services orchestrate these modules without replacing their detection logic.

### Data sources

- User-supplied Kepler/TESS-compatible FITS, CSV, or TXT light curves
- Public NASA observations discovered through the Space Telescope Science Institute MAST API
- `data/samples/exoplanet_demo_transit.fits`, a deterministic synthetic transit used by demo mode

## Run locally

Requirements: Python 3.12 and Node.js 20 or later.

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -r backend/requirements-dev.txt
Copy-Item .env.example .env
```

Set a stable `JWT_SECRET` of at least 32 bytes in `.env`, then start the API from the repository root:

```powershell
Set-Location backend
uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`, create an account, and sign in.

## Use the product

### Demo

Open `/demo` and choose **Run sample analysis**. The browser retrieves the bundled FITS file, uploads it through the normal endpoint, runs BLS and ML inference, and opens the complete results page. Use **Generate report** on the result to create and download the PDF.

### Upload and analyze

Open `/upload`, choose a `.fits`, `.csv`, or `.txt` light curve, upload it, and start analysis. Tabular files must include `time` and `flux` columns; `flux_error` and `quality` are optional.

### NASA Kepler/TESS data

Open `/datasets`, enter a resolvable astronomical target such as `Kepler-452`, select a mission filter, and search. **Analyze** downloads the selected public FITS product through MAST and sends it to the same upload and analysis pipeline. Internet access is required for archive search and download.

## API workflow

```text
POST /api/v1/auth/register or /auth/login
POST /api/v1/upload/lightcurve
POST /api/v1/analyze/{analysis_id}
GET  /api/v1/results/{analysis_id}
POST /api/v1/reports/{analysis_id}
GET  /api/v1/reports/{analysis_id}/download
GET  /api/v1/datasets/search
GET  /api/v1/datasets/download
GET  /api/v1/datasets/demo
```

Protected endpoints require `Authorization: Bearer <token>`.

## Validation

```powershell
python -m pytest
Set-Location frontend
npm run typecheck
npm run build
```

The automated suite covers authentication, uploads, preprocessing, BLS detection, candidate extraction, ML features and inference, explainability, results, and PDF reports.

## Repository layout

```text
frontend/   Next.js product interface
backend/    FastAPI routes, services, schemas, models, and migrations
ai/         Scientific and machine-learning pipeline
scripts/    Dataset, preprocessing, and demo utilities
data/       Samples, metadata, runtime uploads, reports, and SQLite data
docs/       Phase notes, architecture, audits, and roadmap
```

## License

MIT. See `LICENSE`.
