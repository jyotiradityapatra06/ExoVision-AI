# Phase 4: Product Platform

## Objective

Phase 4 turns ExoVision AI's astronomy and classification engine into an
accessible web product for students and researchers. Phase 4.1 establishes the
application shell, navigation, route structure, design system, typed API client,
and deployment boundaries only. It does not upload files, run analyses, or add
scientific visualization logic.

## Frontend architecture

The existing `frontend/` application uses Next.js 15, React 19, TypeScript, and
Tailwind CSS. Source code remains under `frontend/src`:

```text
src/
├── app/
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   ├── upload/page.tsx
│   └── results/[id]/page.tsx
├── components/
├── hooks/
├── lib/
└── types/
```

The root layout owns the shared navigation and footer. Small reusable Button,
Card, page-header, and upload-placeholder components establish consistent visual
and accessibility conventions without creating a large component framework.
The dynamic results route already carries a candidate identifier but deliberately
renders no analysis data in Phase 4.1.

## Backend integration plan

`src/lib/api.ts` is the single typed boundary for FastAPI communication. The
public `NEXT_PUBLIC_API_URL` environment variable selects the backend origin and
defaults to `http://localhost:8000` for local development. Initial types cover
health and ML model metadata. Prediction, analysis submission, upload, polling,
and result types will be added only when those workflows are implemented.
`NEXT_PUBLIC_SITE_URL` supplies the canonical origin for social-preview metadata.

Future frontend requests will use the existing versioned endpoints under
`/api/v1`. Upload processing requires a dedicated backend contract and is not
simulated in this foundation release.

## Deployment plan

The frontend and FastAPI backend remain independently deployable services:

1. Build the Next.js application with `npm run build`.
2. Deploy the backend with its provisioned Phase 3 model artifact.
3. Set `NEXT_PUBLIC_API_URL` to the public backend origin at frontend build time.
4. Configure `BACKEND_CORS_ORIGINS` with the deployed frontend origin.
5. Run frontend route smoke tests and backend health checks after deployment.

No hosting provider configuration is committed yet. A later deployment phase
can select a provider and add environment-specific configuration without
coupling product code to infrastructure prematurely.

## Upload and Analysis Workflow

Phase 4.2 connects the upload screen to the existing astronomy and ML pipeline:

```text
Browser file selection / drag and drop
                 ↓
POST /api/v1/upload/lightcurve
                 ↓
data/uploads/{analysis_id}/
                 ↓
POST /api/v1/analyze/{analysis_id}
                 ↓
Existing loader and Phase 2 analysis pipeline
                 ↓
Existing Phase 3 classification and explanation service
                 ↓
result.json + redirect to /results/{analysis_id}
```

Uploads accept `.csv`, `.fits`, and `.txt` files up to 25 MB. Filenames are
reduced to their basename, each upload receives an unguessable UUID identifier,
and bytes are stored under a dedicated analysis directory. `status.json` holds
durable local workflow state and progress; `result.json` holds the JSON-safe
pipeline output and optional ML candidate report. The storage root defaults to
`data/uploads` and can be changed with `UPLOAD_ROOT`.

Tabular inputs must include case-insensitive `time` and `flux` columns. Optional
`flux_error`/`flux_err` and `quality` columns are accepted. FITS mission products
continue to use the existing Phase 1 FITS loader. All scientific processing is
delegated to the existing Phase 2 and Phase 3 services rather than duplicated.

The workflow endpoints are:

- `POST /api/v1/upload/lightcurve`: validate and persist multipart input.
- `POST /api/v1/analyze/{analysis_id}`: synchronously execute analysis and save
  the result.
- `GET /api/v1/analyze/{analysis_id}/status`: read persisted workflow status.

Phase 4.2 keeps processing synchronous and local. A background task queue,
remote object storage, authentication, and result visualization are explicitly
deferred.

## Astronomy Visualization and Results Dashboard

Phase 4.3 adds a read-only, typed projection of each persisted `result.json` at
`GET /api/v1/results/{analysis_id}`. New analyses retain raw time/flux samples
and the existing Phase 2 folded arrays in local result storage. The API returns
an analysis summary, raw light curve, detected transit measurements, folded
curve, ranked candidates, and the existing Phase 3 explanation. Older results
without retained arrays remain readable and return empty chart series.

For browser performance, the result service preserves paired coordinates while
downsampling series longer than 5,000 points. This is a presentation projection;
the full locally stored scientific result remains unchanged.

The results route now provides:

- a status, sample-count, candidate-count, and detection summary;
- a responsive time-versus-flux canvas chart with pointer tooltips and wheel
  zoom/reset controls;
- a responsive phase-versus-flux folded-transit chart with tooltips;
- ranked candidate cards with classification, confidence, period, depth, and
  signal-to-noise ratio;
- positive and cautionary evidence plus the explainable-AI narrative.

Charts use the browser Canvas API and add no visualization dependency. They do
not recompute, smooth, classify, or otherwise alter astronomy measurements.
PDF report generation remains deferred to Phase 4.4.

## Scientific Reports and Export

Phase 4.4 generates a professional A4 PDF directly from the typed, stored result
projection. `POST /api/v1/reports/{analysis_id}` creates or replaces a local
report at `data/reports/{analysis_id}.pdf`; `GET
/api/v1/reports/{analysis_id}/download` returns it with PDF download headers.
`REPORT_ROOT` can move the local report directory without changing application
code.

Each report includes a branded title page, analysis summary, raw light-curve
chart, transit parameter table, phase-folded chart, candidate classification,
model confidence, existing positive and cautionary AI evidence, and a scientific
disclaimer. Charts are rendered by ReportLab from persisted result arrays; no
astronomy or ML calculations are repeated during export.

The results dashboard exposes generation as an explicit user action. It shows
generating and error states, then provides a direct download link after success.
Reports remain local.

## Authentication and User Management

Phase 4.5 adds account-scoped research workspaces while preserving the existing
astronomy and machine-learning pipeline. Users register or sign in through the
versioned authentication API and receive a time-limited bearer token. Passwords
are stored exclusively as Argon2id hashes; signed JWT access tokens identify the
current user on subsequent requests.

User profiles and analysis ownership metadata are stored in local SQLite. The
schema is migration-ready under `backend/migrations`, while uploaded light curves,
scientific results, and PDF reports remain in their existing local file stores.
Every upload, analysis, result, and report route validates authentication and
ownership server-side. Cross-user resource requests use a not-found response to
avoid revealing whether another user's analysis exists.

Frontend authentication is coordinated through `AuthContext`. Login and signup
establish a session, protected research routes redirect anonymous visitors, and
the dashboard presents account identity plus owned analysis history. Logout
clears the locally stored access token.
