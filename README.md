# ExoVision AI

ExoVision AI is a full-stack foundation for a future exoplanet transit-analysis
platform. Phase 1.1 provides a responsive landing page, a versioned FastAPI
health API, Python and frontend quality tooling, and an expansion-ready package
layout.

No datasets, signal-processing pipeline, machine-learning models, upload
workflow, authentication, database, or deployment infrastructure are
implemented in Phase 1.1.

## Technology stack

- Frontend: Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS
- Backend: Python 3.11+, FastAPI, Uvicorn, and Pydantic
- Testing and quality: Pytest, Ruff, and ESLint

Scientific Python dependencies will be selected when their corresponding AI
features are implemented; they are intentionally not part of the Phase 1.1
backend runtime.

## Repository structure

```text
ExoVision-AI/
├── frontend/          # Next.js App Router application
├── backend/
│   ├── app/
│   │   ├── api/v1/    # Versioned API routes
│   │   ├── config/    # Runtime settings
│   │   ├── schemas/   # Pydantic API contracts
│   │   └── main.py    # FastAPI application factory and entry point
│   ├── tests/         # Backend HTTP tests
│   ├── requirements.txt
│   └── requirements-dev.txt
├── ai/                # Empty, importable namespaces for future AI work
├── data/              # Ignored raw/interim/processed/sample data locations
├── models/            # Ignored future model artifacts
├── docs/              # Phase 1 documentation and future roadmap
├── notebooks/         # Future exploration workspace
├── scripts/           # Future project utilities
├── tests/             # Future cross-component tests
└── pyproject.toml     # Repository-wide Pytest and Ruff configuration
```

All current Python package directories contain `__init__.py`. Empty future
workspaces are retained intentionally to support modular growth without
claiming functionality that does not yet exist.

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
# PowerShell: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cd ..
python -m pytest backend/tests
python -m ruff check backend/ ai/
cd backend
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Its implemented endpoints are
`GET /` and `GET /api/v1/health`.

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

Set `NEXT_PUBLIC_API_URL` if the backend is not served from
`http://localhost:8000`. The landing page is available at
`http://localhost:3000`.

## Configuration

Copy `.env.example` to an ignored local environment file as needed. The backend
accepts `PROJECT_NAME`, `API_V1_STR`, and a JSON array in
`BACKEND_CORS_ORIGINS`. The frontend uses `NEXT_PUBLIC_API_URL`.

## Phase 1.1 scope

Phase 1.1 is limited to repository structure, application scaffolding,
health/status connectivity, local configuration, tests, linting, build
validation, documentation, and Git safety. See
[`docs/ml-roadmap.md`](docs/ml-roadmap.md) for planned work beyond this phase.
