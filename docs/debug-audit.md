# ExoVision AI v1.0.0 Debug Audit

Audit baseline: commit `32374c8`, tag `v1.0.0`. Scope: `frontend/`, `backend/`, `ai/`, `scripts/`, `docs/`, `data/`, and `models/`.

## Findings and resolutions

| Area | Finding and root cause | Resolution | Regression coverage |
| --- | --- | --- | --- |
| Configuration | Relative database, upload, and report paths depended on the process working directory; the documented root `.env` was not loaded. | Load the root `.env`, resolve relative paths from the repository root, and validate the API prefix, JWT length, and token lifetime. | `backend/tests/test_settings.py` |
| Authorization | NASA dataset downloads/search/demo and direct ML prediction could be reached without a bearer token, unlike the product workflow. | Require authentication on those routes; frontend downloads now send the token. | Authentication API tests |
| Session handling | A backend `401` could leave stale client authentication state until reload. | Clear the token and broadcast auth invalidation on authenticated API failures. | Lint, type, build, API tests |
| Upload/analysis | Corrupt or empty uploads lacked end-to-end coverage, and unbounded arrays could cause excessive BLS resource use. | Preserve controlled `422` failures, clean empty uploads, and cap analyses at 250,000 samples. | Upload and analysis API tests |
| Light-curve loading | CSV input without uncertainty received zero uncertainty; downstream positive-value filtering could remove every sample. | Derive a positive robust uncertainty estimate from adjacent flux differences. | Light-curve loader tests |
| Persisted results | A valid JSON array could bypass result shape expectations and cause uncontrolled downstream errors. | Require the persisted result root to be an object. | Results and reports API tests |
| NASA MAST | Upstream shapes, file bodies, sizes, and filenames were trusted too far; product fan-out was unbounded. | Validate responses, cap fan-out, require a FITS signature, parse sizes safely, and sanitize filenames. | `backend/tests/test_nasa_service.py` |
| SQLite integrity | Repository connections did not consistently enable foreign keys or a busy timeout. | Centralize connections with foreign keys, row mapping, timeout, and busy-timeout pragmas. | Orphan-analysis integrity test |
| Model performance | The classifier service was reconstructed for analyses. | Cache one service/model instance per worker. | Full workflow test |
| Reports UI | Entries were called generated reports before generation; failures used blocking alerts; BibTeX asserted a fictitious journal article. | Label entries accurately, generate before download, show inline errors, and export a truthful `@misc` citation. | ESLint, TypeScript, build |
| Demo/upload UI | The upload demo generated random CSV data and displayed invented operational statistics. | Load the bundled FITS dataset through the authenticated API and remove simulated claims/delays. | Full workflow and route smoke tests |
| Results charts | Mismatched x/y lengths could produce invalid tooltip and drawing indexes. | Render only paired samples. | TypeScript and build |
| Responsive/accessibility | Authenticated mobile users had no primary nav; auth controls were incompletely labelled; reduced motion was ignored. | Add mobile navigation, explicit control labels, and reduced-motion CSS. | ESLint and build |
| Product claims | UI copy claimed CNN, SHAP, ensembles, validation, and latency not implemented by the deployed Random Forest pipeline. | Align copy with BLS, Random Forest, feature importance, and illustrative preview data. | Repository claim scan |
| Dependencies | Next.js 15.1.6 had production advisories. | Upgrade to Next.js 16.3.0, native flat ESLint config, Node 20.9+, and a refreshed lockfile. | `npm audit`, lint, typecheck, build |
| Quality tooling | Ruff scanned a historical notebook as product Python; Next 16 exposed synchronous effect state updates. | Exclude notebooks from Ruff and make initial session/history updates asynchronous and cancellation-safe. | Ruff and ESLint |

## Repository hygiene

- No committed secret-bearing `.env`, private key, or credential-shaped token was found. Only `.env.example` files are tracked.
- Generated uploads, reports, databases, builds, caches, environments, and model artifacts are ignored.
- No routes or detection algorithms were removed. Existing AI files outside targeted loader/service changes received formatting only.
- Historical roadmap documents mention CNN and SHAP as future work; deployed product surfaces now describe current capabilities.

## Deployment boundaries

- SQLite is appropriate for one API instance with persistent storage. The PostgreSQL schema is preparatory; horizontal deployment needs a tested PostgreSQL adapter.
- Uploads and reports use local/persistent disk. Multi-instance deployment requires shared object storage.
- Analysis is synchronous and CPU-bound. The sample cap limits abuse; sustained public workloads should use a task queue and per-user rate limits.
- Browser tokens remain in local storage under the existing architecture. Future hardening should evaluate same-site HTTP-only cookies and CSRF protection.
