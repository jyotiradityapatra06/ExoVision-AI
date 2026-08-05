# ExoVision AI v1.0 release audit

## Scope

Reviewed `frontend/`, `backend/`, `ai/`, `scripts/`, `docs/`, deployment configuration, environment examples, database migrations, and the public README for the v1.0 release.

## Resolved findings

- Replaced Phase 1 architecture and API documents with the implemented v1 contracts.
- Updated frontend and API metadata from `0.1.0` to `1.0.0`.
- Added explicit Vercel, Render, and Railway configuration and environment guidance.
- Fixed monorepo package resolution so `uvicorn app.main:app` starts correctly from `backend/`.
- Added a PostgreSQL-compatible schema while retaining SQLite as the active local runtime.
- Verified user, dataset, analysis, candidate, and report entities, foreign keys, timestamps, and indexes.
- Removed three unreferenced frontend files: `OrbitalHeroStage.tsx`, `page-header.tsx`, and `use-api-health.ts`.
- Added current architecture, workflow, product preview, dashboard, and result portfolio assets.
- Confirmed the deterministic FITS demo is tracked and recovers a 5-day transit.
- Verified all documented application routes and FastAPI documentation respond in a live local smoke test.

## Preserved behavior

- Scientific preprocessing, BLS detection, feature extraction, classifier, and explanation algorithms were not changed.
- Existing API paths and frontend routes were retained.
- SQLite development support and automatic migrations remain the default.
- Authentication ownership checks and report generation behavior remain intact.

## Release verification

- Python test suite: 212 passing tests
- Python static checks: clean
- TypeScript typecheck: clean
- Next.js production build: successful
- Local route smoke test: all release routes returned HTTP 200
- FastAPI health and interactive documentation: HTTP 200

## Known production boundaries

- SQLite plus persistent disk supports a single API instance. Horizontal scaling requires the documented PostgreSQL repository adapter and shared object storage.
- NASA archive search and download require outbound internet access.
- Analysis currently executes synchronously; large batch workloads should move to a task queue.
- ML confidence is screening evidence, not a calibrated planet-occurrence probability.
