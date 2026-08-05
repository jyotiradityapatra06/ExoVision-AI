"""End-to-end production workflow regression test."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.api.dependencies import get_analysis_repository, get_auth_service
from app.api.v1.analysis import get_analysis_service
from app.api.v1.reports import get_report_service
from app.api.v1.results import get_result_service
from app.api.v1.upload import get_upload_service
from app.main import app
from app.models.analysis import AnalysisRepository
from app.models.database import initialize_database
from app.models.user import UserRepository
from app.services.analysis_service import AnalysisService
from app.services.auth_service import AuthService
from app.services.report_service import ReportService
from app.services.result_service import ResultService
from app.services.upload_service import UploadService


def test_authenticated_demo_to_report_workflow(tmp_path: Path):
    """Exercise auth, FITS upload, BLS/ML, results, and PDF export together."""
    database = tmp_path / "workflow.db"
    uploads = tmp_path / "uploads"
    reports = tmp_path / "reports"
    initialize_database(database)
    auth = AuthService(
        UserRepository(database), "workflow-secret-that-is-more-than-32-bytes"
    )
    analyses = AnalysisRepository(database)
    app.dependency_overrides[get_auth_service] = lambda: auth
    app.dependency_overrides[get_analysis_repository] = lambda: analyses
    app.dependency_overrides[get_upload_service] = lambda: UploadService(uploads)
    app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(uploads)
    app.dependency_overrides[get_result_service] = lambda: ResultService(uploads)
    app.dependency_overrides[get_report_service] = lambda: ReportService(
        uploads, reports
    )
    sample = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "samples"
        / "exoplanet_demo_transit.fits"
    )

    try:
        with TestClient(app) as client:
            registration = client.post(
                "/api/v1/auth/register",
                json={
                    "email": "workflow@example.com",
                    "display_name": "Workflow Test",
                    "password": "correct-horse-orbit-42",
                },
            )
            token = registration.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            with sample.open("rb") as sample_file:
                upload = client.post(
                    "/api/v1/upload/lightcurve",
                    files={
                        "file": (
                            sample.name,
                            sample_file,
                            "application/fits",
                        )
                    },
                    headers=headers,
                )
            analysis_id = upload.json()["analysis_id"]

            analysis = client.post(
                f"/api/v1/analyze/{analysis_id}", headers=headers
            )
            result = client.get(
                f"/api/v1/results/{analysis_id}", headers=headers
            )
            report = client.post(
                f"/api/v1/reports/{analysis_id}", headers=headers
            )
            download = client.get(
                f"/api/v1/reports/{analysis_id}/download", headers=headers
            )

        assert registration.status_code == 201
        assert upload.status_code == 201
        assert analysis.status_code == 200
        assert analysis.json()["candidate_count"] == 1
        assert result.status_code == 200
        assert result.json()["transit"]["detected"] is True
        assert result.json()["candidates"]
        assert report.status_code == 200
        assert download.status_code == 200
        assert download.content.startswith(b"%PDF-")
    finally:
        app.dependency_overrides.clear()
