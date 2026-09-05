"""HTTP and file-integrity tests for scientific PDF reports."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.v1.reports import get_report_service
from app.main import app
from app.services import report_service
from app.services.report_service import ReportService


@pytest.fixture
def report_client(tmp_path: Path):
    """Provide a client with isolated analysis and report roots."""
    uploads = tmp_path / "uploads"
    reports = tmp_path / "reports"
    app.dependency_overrides[get_report_service] = lambda: ReportService(
        uploads, reports
    )
    with TestClient(app) as client:
        yield client, uploads, reports
    app.dependency_overrides.clear()


def _store_result(root: Path, analysis_id: str) -> None:
    directory = root / analysis_id
    directory.mkdir(parents=True)
    time = [index * 0.02 for index in range(200)]
    flux = [1.0 - (0.012 if index % 60 in (0, 1, 2) else 0.0) for index in range(200)]
    payload = {
        "analysis_id": analysis_id,
        "status": "completed",
        "lightcurve": {"time": time, "flux": flux},
        "pipeline": {
            "status": "success",
            "input_summary": {"sample_count": len(time)},
            "candidate": {
                "candidate_id": "candidate-report-001",
                "period_days": 3.52,
                "transit_epoch": 0.7,
                "duration_days": 0.15,
                "depth": 0.012,
                "transit_snr": 18.2,
            },
            "folded_output": {
                "arrays": {
                    "phase": [-0.2, -0.1, 0.0, 0.1, 0.2],
                    "flux": [1.0, 0.999, 0.988, 0.999, 1.0],
                }
            },
        },
        "ml_report": {
            "classification": {
                "label": "Planet Transit Candidate",
                "confidence": 0.96,
            },
            "evidence": {
                "positive": ["High signal-to-noise ratio supports a reliable transit."],
                "negative": ["Minor stellar variability remains."],
            },
            "summary": "Strong periodic transit signal with consistent depth.",
        },
    }
    (directory / "result.json").write_text(json.dumps(payload), encoding="utf-8")


def test_pdf_generation_endpoint_creates_valid_file(report_client):
    client, uploads, reports = report_client
    _store_result(uploads, "analysis123")

    response = client.post("/api/v1/reports/analysis123")

    assert response.status_code == 200
    assert response.json() == {
        "analysis_id": "analysis123",
        "status": "generated",
        "filename": "analysis123.pdf",
        "download_url": "/api/v1/reports/analysis123/download",
    }
    pdf = reports / "analysis123.pdf"
    assert pdf.is_file()
    assert pdf.read_bytes().startswith(b"%PDF-")
    assert pdf.stat().st_size > 2_000


def test_generated_pdf_download_uses_pdf_headers(report_client):
    client, uploads, _ = report_client
    _store_result(uploads, "download123")
    client.post("/api/v1/reports/download123")

    response = client.get("/api/v1/reports/download123/download")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "download123.pdf" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF-")


def test_missing_analysis_and_report_return_404(report_client):
    client, _, _ = report_client

    assert client.post("/api/v1/reports/missing").status_code == 404
    assert client.get("/api/v1/reports/missing/download").status_code == 404


def test_invalid_analysis_id_returns_404(report_client):
    client, _, _ = report_client

    assert client.post("/api/v1/reports/not-valid").status_code == 404


def test_malformed_result_shape_returns_controlled_500(report_client):
    client, uploads, _ = report_client
    directory = uploads / "wrongshape"
    directory.mkdir(parents=True)
    (directory / "result.json").write_text("[]", encoding="utf-8")

    response = client.post("/api/v1/reports/wrongshape")

    assert response.status_code == 500
    assert response.json()["detail"] == "Scientific report generation failed."


def test_pdf_uses_candidate_screening_terminology(monkeypatch, tmp_path: Path):
    """Keep scientifically important score and limitation language in reports."""
    captured: list[object] = []

    class DocumentStub:
        page = 1

        def build(self, story, **_kwargs):
            captured.extend(story)

    monkeypatch.setattr(
        report_service,
        "SimpleDocTemplate",
        lambda *_args, **_kwargs: DocumentStub(),
    )
    uploads = tmp_path / "uploads"
    _store_result(uploads, "wording123")
    result = report_service.ResultService(uploads).get("wording123")

    report_service._build_pdf(tmp_path / "wording.pdf", result)

    fragments: list[str] = []
    for item in captured:
        if hasattr(item, "getPlainText"):
            fragments.append(item.getPlainText())
        for row in getattr(item, "_cellvalues", []):
            fragments.extend(str(cell) for cell in row)
    text = " ".join(fragments)
    assert "Model score" in text
    assert "Classifier Random Forest" in text
    assert "not a calibrated probability" in text
    assert "not a confirmed discovery" in text
    assert "Model confidence" not in text
