# Deployment guide

## Local setup

From the repository root, create Python 3.12 and Node.js 20.9+ environments:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
Set-Location backend
uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

## Frontend deployment (Vercel)

Import the repository in Vercel and set the root directory to `frontend`. The framework preset should resolve to Next.js. Configure:

- `NEXT_PUBLIC_API_URL` — HTTPS origin of the deployed FastAPI service, without a trailing slash.
- `NEXT_PUBLIC_SITE_URL` — canonical HTTPS origin of the deployed frontend.

Run `npm run build` as the build command. No server-only frontend secrets are required.

## Backend deployment (Render)

The root `render.yaml` defines the web service, health check, and a persistent disk for SQLite, uploads, and reports. Connect the repository as a Blueprint and provide `BACKEND_CORS_ORIGINS` as a JSON array containing the Vercel origin. Render generates `JWT_SECRET`.

The production command is:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

It is run from `backend/`; the Blueprint performs that directory change.

## Backend deployment (Railway)

`railway.json` supplies the health check and start command. Add a persistent volume and map these values to it:

- `DATABASE_PATH=/data/exovision.db`
- `UPLOAD_ROOT=/data/uploads`
- `REPORT_ROOT=/data/reports`

Also set `JWT_SECRET`, `BACKEND_CORS_ORIGINS`, and `PROJECT_NAME`. Do not use an ephemeral filesystem for user uploads or reports.

## Environment variables

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | JWT signing key of at least 32 bytes |
| `BACKEND_CORS_ORIGINS` | Yes | JSON array of allowed frontend origins |
| `DATABASE_PATH` | Yes for SQLite | Persistent SQLite file location |
| `UPLOAD_ROOT` | Yes | Persistent uploaded FITS/data directory |
| `REPORT_ROOT` | Yes | Persistent generated PDF directory |
| `ACCESS_TOKEN_MINUTES` | No | Session lifetime; defaults to 60 |
| `API_V1_STR` | No | API prefix; defaults to `/api/v1` |
| `NEXT_PUBLIC_API_URL` | Yes | Browser-visible API origin |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical frontend origin |

## Database setup

SQLite migrations execute automatically when FastAPI starts. Render's persistent-disk configuration is suitable for a single API instance.

Analysis work runs after request acceptance through FastAPI's in-process background-task mechanism. SQLite provides an atomic execution claim, while status and results remain on the persistent disk. This is appropriate for the documented single-instance deployment, but it is not a durable queue: terminating the API process can interrupt active work. Use one API instance for this release.

For horizontally scaled production, provision PostgreSQL and apply `backend/migrations/postgresql/0001_initial.sql`. The schema is ready, but the current lightweight repository adapter uses SQLite; introduce and test a PostgreSQL repository adapter before setting `DATABASE_URL`. Keep FITS files and reports in object storage or a shared persistent volume.

## Release checks

```powershell
python -m pytest
python -m ruff check .
Set-Location frontend
npm audit
npm run lint
npm run typecheck
npm run build
```

After deployment, verify `/api/v1/health`, `/docs`, authentication, demo analysis, report download, and the configured CORS origin.
