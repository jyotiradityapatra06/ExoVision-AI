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
- **Testing**: Pytest & TestClient (Backend), ESLint (Frontend)
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
│   ├── utils/                 # AI Utilities
│   └── tests/                 # AI Package Unit Tests
├── data/                      # Data Storage (Git Ignored except .gitkeep)
│   ├── raw/                   # Unprocessed FITS Light Curves
│   ├── interim/               # Flattened & Detrended Data
│   ├── processed/             # Folded & Feature Matrix Data
│   ├── samples/               # Sample Light Curves
│   └── metadata/              # Stellar Catalogs & Label Maps
├── notebooks/                 # Exploratory Jupyter Notebooks
├── models/                    # Serialized Model Artifacts
├── scripts/                   # Utility Scripts
├── docs/                      # Technical Documentation & Specs
│   ├── architecture.md        # System Architecture
│   ├── problem-statement.md   # Problem Domain & AI Solution
│   ├── api.md                 # API Specifications
│   ├── dataset.md             # Dataset Descriptions
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

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Run pytest unit tests
pytest

# Run Ruff linting check
ruff check app/

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The backend server will be available at `http://localhost:8000`. You can inspect the health endpoint at `http://localhost:8000/api/v1/health`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Run ESLint check
npm run lint

# Start Next.js development server
npm run dev
```

The frontend landing page will be available at `http://localhost:3000`.

---

## 🎯 Phase 1 Scope

Phase 1 establishes the foundational architecture and repository structure:
- Modern Next.js 15 landing page for ExoVision AI.
- FastAPI backend application with status and health monitoring (`GET /api/v1/health`).
- Decoupled modular AI data processing package structure.
- Comprehensive technical documentation and automated test setup.
- *Out of scope for Phase 1*: Database persistence, user authentication, deployment infrastructure, active ML model inference, and transit detection algorithms.
