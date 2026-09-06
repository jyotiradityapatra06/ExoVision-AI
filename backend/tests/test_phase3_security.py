"""Focused regression tests for public deployment hardening."""

from __future__ import annotations

import json
from asyncio import run
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient

from app.api.dependencies import get_auth_service, require_analysis_owner
from app.config.settings import Settings, settings
from app.core.security import rate_limiter
from app.main import app
from app.models.analysis import AnalysisRepository
from app.models.database import initialize_database
from app.models.user import UserRepository
from app.services.analysis_service import AnalysisService
from app.services.auth_service import AuthService
from app.services.report_service import ReportService
from app.services.upload_service import UploadService, UploadValidationError


def _repository(tmp_path: Path) -> AnalysisRepository:
    database = tmp_path / "phase3.db"
    initialize_database(database)
    repository = AnalysisRepository(database)
    with repository._connect() as connection:
        connection.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
            (
                "user1",
                "user@example.com",
                "User",
                "hash",
                datetime.now(UTC).isoformat(),
            ),
        )
    return repository


def test_stale_processing_is_failed_and_retryable(tmp_path: Path):
    repository = _repository(tmp_path)
    uploads = tmp_path / "uploads"
    repository.create("stale123", "user1", "sample.csv")
    directory = uploads / "stale123"
    directory.mkdir(parents=True)
    (directory / "status.json").write_text(
        json.dumps({
            "analysis_id": "stale123",
            "stored_filename": "sample.csv",
            "status": "processing",
            "stage": "analyzing_lightcurve",
        }),
        encoding="utf-8",
    )
    stale = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
    with repository._connect() as connection:
        connection.execute(
            """UPDATE analyses SET status = 'processing', processing_started_at = ?,
            updated_at = ? WHERE id = 'stale123'""",
            (stale, stale),
        )

    recovered = repository.recover_stale(30)
    AnalysisService(uploads).mark_interrupted("stale123")

    assert recovered == ["stale123"]
    assert repository.by_id("stale123").status == "failed"  # type: ignore[union-attr]
    status = AnalysisService(uploads).status("stale123")
    assert status["retryable"] is True
    assert status["error"] == (
        "Analysis was interrupted before completion. You can retry it."
    )


def test_active_analysis_limit_is_atomic_under_concurrent_claims(tmp_path: Path):
    repository = _repository(tmp_path)
    repository.create("first", "user1", "first.csv")
    repository.create("second", "user1", "second.csv")

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(
            lambda analysis_id: repository.claim_processing(
                analysis_id, "user1", "uploaded", 1
            ),
            ["first", "second"],
        ))

    assert sorted(outcomes) == ["claimed", "limit"]


def test_retry_claim_respects_active_limit(tmp_path: Path):
    repository = _repository(tmp_path)
    repository.create("active", "user1", "active.csv")
    repository.create("retry", "user1", "retry.csv")
    repository.update_status("active", "processing")
    repository.update_status("retry", "failed")

    assert repository.claim_processing("retry", "user1", "failed", 1) == "limit"
    assert repository.by_id("retry").status == "failed"  # type: ignore[union-attr]


def test_auth_rate_limit_returns_retry_after(tmp_path: Path):
    database = tmp_path / "auth.db"
    initialize_database(database)
    auth = AuthService(
        UserRepository(database),
        "phase3-test-secret-longer-than-thirty-two-bytes",
    )
    original = settings.rate_limits["auth"]
    settings.rate_limits["auth"] = (2, 60)
    rate_limiter.reset()
    app.dependency_overrides[get_auth_service] = lambda: auth
    try:
        with TestClient(app) as client:
            payload = {"email": "nobody@example.com", "password": "not-the-password"}
            assert client.post("/api/v1/auth/login", json=payload).status_code == 401
            assert client.post("/api/v1/auth/login", json=payload).status_code == 401
            rejected = client.post("/api/v1/auth/login", json=payload)
        assert rejected.status_code == 429
        assert int(rejected.headers["retry-after"]) >= 1
    finally:
        settings.rate_limits["auth"] = original
        rate_limiter.reset()
        app.dependency_overrides.clear()


def test_expensive_report_endpoint_is_rate_limited():
    original = settings.rate_limits["report"]
    settings.rate_limits["report"] = (2, 60)
    rate_limiter.reset()
    app.dependency_overrides[require_analysis_owner] = lambda: SimpleNamespace(
        id="limited-user"
    )
    try:
        with TestClient(app) as client:
            assert client.post("/api/v1/reports/missing").status_code == 404
            assert client.post("/api/v1/reports/missing").status_code == 404
            rejected = client.post("/api/v1/reports/missing")
        assert rejected.status_code == 429
        assert rejected.headers["retry-after"]
    finally:
        settings.rate_limits["report"] = original
        rate_limiter.reset()
        app.dependency_overrides.clear()


def test_upload_total_storage_quota_rejects_without_artifacts(tmp_path: Path):
    root = tmp_path / "uploads"
    existing = root / "owned"
    existing.mkdir(parents=True)
    (existing / "result.json").write_bytes(b"12345")
    upload = UploadFile(filename="new.csv", file=BytesIO(b"time,flux\n0,1\n"))
    with pytest.raises(UploadValidationError, match="quota"):
        run(
            UploadService(root).save(
                upload, existing_analysis_ids=["owned"], max_total_bytes=10
            )
        )
    assert [path.name for path in root.iterdir()] == ["owned"]


def test_existing_report_is_reused(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    reports = tmp_path / "reports"
    reports.mkdir()
    existing = reports / "analysis123.pdf"
    existing.write_bytes(b"%PDF-existing")
    service = ReportService(tmp_path / "uploads", reports)
    monkeypatch.setattr(
        service.result_service, "get", lambda _id: {"status": "completed"}
    )
    monkeypatch.setattr(
        "app.services.report_service._build_pdf",
        lambda *_args: pytest.fail("regenerated"),
    )

    response = service.generate("analysis123")

    assert response["status"] == "generated"
    assert existing.read_bytes() == b"%PDF-existing"


def test_production_requires_stable_secret_and_explicit_cors(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", '["https://example.com"]')
    with pytest.raises(RuntimeError, match="JWT_SECRET is required"):
        Settings()


@pytest.mark.parametrize(
    "origins",
    ['["*"]', '["javascript:alert(1)"]', '["https://example.com/path"]', "not-json"],
)
def test_malformed_or_unsafe_cors_is_rejected(
    monkeypatch: pytest.MonkeyPatch, origins: str
):
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", origins)
    with pytest.raises(RuntimeError, match="BACKEND_CORS_ORIGINS"):
        Settings()


def test_security_headers_and_health_are_safe():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-request-id"]
    assert set(response.json()) == {"status", "service", "phase"}
