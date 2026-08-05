"""Production configuration regression tests."""

from pathlib import Path

import pytest

from app.config.settings import PROJECT_ROOT, Settings


def test_relative_storage_paths_are_anchored_to_project_root(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("UPLOAD_ROOT", "runtime/uploads")
    monkeypatch.setenv("REPORT_ROOT", "runtime/reports")
    monkeypatch.setenv("DATABASE_PATH", "runtime/exovision.db")

    configured = Settings()

    assert configured.upload_root == PROJECT_ROOT / "runtime/uploads"
    assert configured.report_root == PROJECT_ROOT / "runtime/reports"
    assert configured.database_path == PROJECT_ROOT / "runtime/exovision.db"


def test_absolute_storage_path_is_preserved(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
):
    monkeypatch.setenv("UPLOAD_ROOT", str(tmp_path))

    assert Settings().upload_root == tmp_path


def test_api_prefix_must_be_absolute(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("API_V1_STR", "api/v1")

    with pytest.raises(RuntimeError, match="must start"):
        Settings()
