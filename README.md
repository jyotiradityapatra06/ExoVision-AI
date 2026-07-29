# ExoVision AI 🌌🪐

**ExoVision AI** is an advanced full-stack platform designed for detecting exoplanet transit signals from astronomical light-curve time-series data captured by space missions such as NASA's Kepler, K2, and TESS.

---

## 📌 Problem Statement

Space telescopes collect high-precision stellar photometry across millions of stars to discover transiting exoplanets. However, transit detection is severely challenged by:
1. **Low Signal-to-Noise Ratio**: Earth-sized planets produce tiny fractional flux drops (< 0.01%).
2. **Instrumental & Cosmic Noise**: Spacecraft jitter, thermal drift, and stellar crowding introduce systemic artifacts.
3. **Astrophysical False Positives**: Eclipsing binaries, stellar variability, and starspots frequently mimic transit signals.

ExoVision AI addresses these challenges by combining robust astronomical signal processing (Box Least Squares, polynomial detrending, light-curve phase folding) with deep learning architectures to automate transit candidate identification and disambiguate false positives.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic
- **AI & Data Processing**: NumPy, Pandas, SciPy, Astropy, Lightkurve, scikit-learn, Matplotlib
- **Testing**: Pytest & TestClient (Backend & AI Utilities), ESLint (Frontend)
- **Code Quality**: Ruff (Python linting & formatting), ESLint (Next.js)

---

## 📁 Repository Structure

```
ExoVision/
├── frontend/                  # Next.js 15 App Router Frontend
├── backend/                   # FastAPI Python Microservice
│   ├── app/
│   │   ├── api/               # API Router & Versioned Handlers
│   │   │   └── v1/            # API v1 Endpoint Implementations
│   │   ├── config/            # Application Configuration
│   │   ├── core/              # Core App Mechanics & CORS
│   │   ├── models/            # Domain Data Models
│   │   ├── schemas/           # Pydantic Schemas
│   │   ├── services/          # Business Logic Layer
│   │   ├── utils/             # Backend Utilities
│   │   └── main.py            # FastAPI Entry Point
│   ├── tests/                 # Pytest Test Suite
│   ├── requirements.txt       # Production Dependencies
│   ├── requirements-dev.txt   # Dev & Testing Dependencies
│   └── pyproject.toml         # Ruff & Pytest Config
├── ai/                        # AI & Astronomical Data Science Package
│   ├── preprocessing/         # Light Curve Detrending & Outlier Removal
│   ├── features/              # Periodograms & Transit Metrics
│   ├── detection/             # Transit Signal Detectors
│   ├── experiments/           # Training & Experimentation
│   ├── evaluation/            # Model Evaluation Metrics
│   ├── visualization/         # Light Curve Plotting & Diagnostics
│   ├── utils/                 # Light curve loader & validation utilities
│   └── tests/                 # AI Package Unit Tests
├── data/                      # Data Storage (Git Ignored except .gitkeep and catalog.json)
│   ├── raw/                   # Unprocessed FITS Light Curves (kepler/ and tess/)
│   ├── interim/               # Flattened & Detrended Data
│   ├── processed/             # Folded & Feature Matrix Data
│   ├── samples/               # Sample Light Curves
│   └── metadata/              # Catalog metadata (catalog.json) & Stellar Catalogs
├── notebooks/                 # Exploratory Jupyter Notebooks (01_lightcurve_exploration.ipynb)
├── models/                    # Serialized Model Artifacts
├── scripts/                   # Utility Scripts (download_lightcurves.py)
├── docs/                      # Technical Documentation & Specs
│   ├── architecture.md        # System Architecture
│   ├── problem-statement.md   # Problem Domain & AI Solution
│   ├── api.md                 # API Specifications
│   ├── dataset.md             # Dataset Descriptions & FITS Specifications
│   └── ml-roadmap.md          # AI & ML Pipeline Roadmap
├── tests/                     # System-wide Tests
├── .gitignore                 # Environment & Build Ignore Rules
├── .env.example               # Example Environment Configurations
├── README.md                  # Project Root Documentation
└── LICENSE                    # MIT License
```

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js 18.x or 20.x and `npm`
- Python 3.11+ and `pip`

### 1. Backend & AI Setup

```bash
# Activate Python virtual environment
.venv\Scripts\Activate.ps1   # On Windows
source .venv/bin/activate    # On Linux/macOS

# Run Pytest unit tests across backend and AI package
pytest

# Run Ruff linting check on AI and backend modules
ruff check ai/ backend/

# Execute dataset download & catalog metadata generation script
python scripts/download_lightcurves.py

# Start FastAPI development server
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run lint
npm run dev
```

---

## 🎯 Phase Progress & Scope

### Phase 1.1 — Foundation & Web Architecture
- Next.js 15 landing page & FastAPI backend structure (`GET /api/v1/health`).
- Decoupled modular AI subpackage layout.

### Phase 1.2 — Astronomy Data Acquisition & Exploration Foundation (Completed)
- Created FITS light curve loading & schema validation utilities (`ai/utils/lightcurve_loader.py`).
- Implemented dataset acquisition script (`scripts/download_lightcurves.py`) with metadata cataloging (`data/metadata/catalog.json`).
- Built research-quality exploratory analysis notebook (`notebooks/01_lightcurve_exploration.ipynb`).
- Documented FITS specifications and space photometry data schemas (`docs/dataset.md`).
- Synthetic FITS unit test suite (`ai/tests/test_lightcurve_loader.py`).
