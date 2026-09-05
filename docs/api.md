# ExoVision API

The FastAPI service is versioned under `/api/v1`. Interactive OpenAPI documentation is available at `/docs`; ReDoc is available at `/redoc`. Protected endpoints require `Authorization: Bearer <access_token>`.

## Authentication APIs

### `POST /api/v1/auth/register`

Creates an account and returns a bearer token plus the new user. Body fields: `email`, `display_name`, and `password`.

### `POST /api/v1/auth/login`

Authenticates with `email` and `password`, then returns a bearer token and user.

### `GET /api/v1/auth/me`

Returns the current authenticated user.

## Upload API

### `POST /api/v1/upload/lightcurve`

Accepts multipart field `file` containing `.fits`, `.csv`, or `.txt` data up to 25 MB. CSV/TXT input requires `time` and `flux`; `flux_error` and `quality` are optional. Scientific processing is limited to 250,000 light-curve samples per analysis. Returns `analysis_id`, filename, and `uploaded` status.

## Analysis APIs

### `POST /api/v1/analyze/{analysis_id}`

Runs the existing preprocessing, BLS, candidate extraction, ML classification, and explainability pipeline for an owned upload. Returns completion status and candidate count.

### `GET /api/v1/analyze/{analysis_id}/status`

Returns persisted progress, status, and any terminal error.

### `GET /api/v1/analyze`

Returns the authenticated user's newest-first analysis history.

## Results API

### `GET /api/v1/results/{analysis_id}`

Returns visualization-ready raw and folded light curves, transit measurements, classifier model score, feature importance, and explanation evidence. The score is not a calibrated probability that the candidate is a confirmed exoplanet.

## Report APIs

### `POST /api/v1/reports/{analysis_id}`

Generates or replaces a scientific PDF from the completed result.

### `GET /api/v1/reports/{analysis_id}/download`

Downloads the generated PDF after ownership verification.

## Dataset APIs

### `GET /api/v1/datasets/search?target={name}&mission={all|kepler|tess}`

Resolves an astronomical target through NASA MAST and returns compatible Kepler, K2, or TESS light-curve product metadata. Authentication is required.

### `GET /api/v1/datasets/download?data_uri={mast_uri}`

Downloads a validated public MAST FITS product through the API so the browser can submit it to the standard upload workflow. Authentication is required.

### `GET /api/v1/datasets/demo`

Returns the bundled deterministic FITS sample used by `/demo`. Authentication is required.

## System and model APIs

- `GET /` — service greeting
- `GET /api/v1/health` — deployment health check
- `GET /api/v1/ml/info` — classifier metadata and feature list
- `POST /api/v1/ml/predict` — direct prepared-feature inference contract

## Errors

FastAPI validation errors use HTTP `422`. Authentication failures use `401`; inaccessible or non-owned analyses return `404` to avoid resource disclosure. Invalid scientific input returns `422`; upstream MAST failures return `502`.
