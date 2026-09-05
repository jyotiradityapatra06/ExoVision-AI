"""HTTP tests for local light-curve upload storage."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.v1.analysis import get_analysis_service
from app.api.v1.upload import get_upload_service
from app.main import app
from app.services.analysis_service import AnalysisService
from app.services.upload_service import UploadService


@pytest.fixture
def upload_client(tmp_path: Path):
    """Provide an API client storing uploads under a temporary root."""
    root = tmp_path / "uploads"
    app.dependency_overrides[get_upload_service] = lambda: UploadService(root)
    app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(root)
    with TestClient(app) as client:
        yield client, root
    app.dependency_overrides.clear()


def test_valid_csv_upload_is_stored_with_status(upload_client):
    client, root = upload_client
    response = client.post(
        "/api/v1/upload/lightcurve",
        files={"file": ("sample.csv", b"time,flux\n0,1\n1,0.99\n", "text/csv")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "uploaded"
    assert payload["filename"] == "sample.csv"
    directory = root / payload["analysis_id"]
    assert (directory / "sample.csv").is_file()
    assert (directory / "status.json").is_file()


def test_invalid_upload_extension_returns_422(upload_client):
    client, root = upload_client
    response = client.post(
        "/api/v1/upload/lightcurve",
        files={"file": ("notes.pdf", b"not a light curve", "application/pdf")},
    )

    assert response.status_code == 422
    assert "Unsupported file extension" in response.json()["detail"]
    assert not root.exists()


def test_missing_upload_file_returns_422(upload_client):
    client, _ = upload_client
    response = client.post("/api/v1/upload/lightcurve")

    assert response.status_code == 422


def test_empty_upload_returns_422_without_leaving_artifacts(upload_client):
    client, root = upload_client

    response = client.post(
        "/api/v1/upload/lightcurve",
        files={"file": ("empty.fits", b"", "application/fits")},
    )

    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()
    assert not root.exists() or not any(root.iterdir())


def test_corrupt_fits_fails_analysis_with_controlled_error(upload_client):
    client, _ = upload_client
    uploaded = client.post(
        "/api/v1/upload/lightcurve",
        files={"file": ("corrupt.fits", b"not-fits", "application/fits")},
    )
    analysis_id = uploaded.json()["analysis_id"]

    response = client.post(f"/api/v1/analyze/{analysis_id}")
    workflow = client.get(f"/api/v1/analyze/{analysis_id}/status")

    assert response.status_code == 202
    assert workflow.status_code == 200
    assert workflow.json()["status"] == "failed"
    assert workflow.json()["retryable"] is True
    assert workflow.json()["error"] == (
        "The observation format is unsupported or malformed."
    )
    assert "uploads" not in workflow.json()["error"]
