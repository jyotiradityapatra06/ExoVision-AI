# ExoVision API Documentation

## Overview

In Phase 1.1, the ExoVision API provides only service discovery and health
endpoints. It does not accept light curves or execute detection pipelines.

Base URL: `http://localhost:8000`

---

## Phase 1 Endpoints

### 1. Root Endpoint
- **URL**: `/`
- **Method**: `GET`
- **Response**: `200 OK`
- **Payload**:
```json
{
  "message": "Welcome to ExoVision API"
}
```

### 2. API Health Check
- **URL**: `/api/v1/health`
- **Method**: `GET`
- **Response**: `200 OK`
- **Payload**:
```json
{
  "status": "healthy",
  "service": "ExoVision API",
    "phase": "1.1"
}
```

---

## Future endpoints (not implemented)

- `POST /api/v1/lightcurves/upload` - Upload FITS / CSV light-curve files.
- `GET /api/v1/lightcurves/{id}` - Retrieve preprocessed light curve time series.
- `POST /api/v1/detect` - Trigger transit detection pipeline on target light curve.
- `GET /api/v1/candidates/{id}` - Fetch transit candidate details, BLS periodograms, and classification confidence scores.

These paths are non-binding roadmap examples. Their contracts will be designed
and documented when the corresponding phase is approved.
