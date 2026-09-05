"""Validated local storage for uploaded light-curve files."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import UploadFile

SUPPORTED_EXTENSIONS = frozenset({".csv", ".fits", ".txt"})
DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024


class UploadValidationError(ValueError):
    """Raised when an uploaded file violates the public upload contract."""


class UploadService:
    """Validate and persist one upload in an analysis-scoped directory."""

    def __init__(
        self,
        upload_root: str | Path,
        *,
        max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES,
    ) -> None:
        self.upload_root = Path(upload_root).resolve()
        self.max_upload_bytes = max_upload_bytes

    async def save(self, uploaded_file: UploadFile) -> dict[str, str]:
        """Validate and store an upload, returning its public metadata."""
        filename = Path(uploaded_file.filename or "").name
        if not filename:
            raise UploadValidationError("A filename is required.")
        extension = Path(filename).suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
            raise UploadValidationError(
                f"Unsupported file extension. Supported formats: {supported}."
            )

        analysis_id = uuid4().hex
        analysis_directory = self.upload_root / analysis_id
        analysis_directory.mkdir(parents=True, exist_ok=False)
        destination = analysis_directory / filename
        total_bytes = 0
        try:
            with destination.open("xb") as output:
                while chunk := await uploaded_file.read(1024 * 1024):
                    total_bytes += len(chunk)
                    if total_bytes > self.max_upload_bytes:
                        raise UploadValidationError(
                            f"Upload exceeds the {self.max_upload_bytes} byte limit."
                        )
                    output.write(chunk)
            if total_bytes == 0:
                raise UploadValidationError("Uploaded file cannot be empty.")
            metadata: dict[str, Any] = {
                "analysis_id": analysis_id,
                "filename": filename,
                "stored_filename": filename,
                "status": "uploaded",
                "progress": 0,
                "stage": "ready",
                "message": "Observation is ready for analysis.",
                "retryable": False,
                "size_bytes": total_bytes,
                "created_at": datetime.now(UTC).isoformat(),
                "error": None,
            }
            _write_json(analysis_directory / "status.json", metadata)
        except Exception:
            destination.unlink(missing_ok=True)
            (analysis_directory / "status.json").unlink(missing_ok=True)
            analysis_directory.rmdir()
            raise
        finally:
            await uploaded_file.close()
        return {
            "analysis_id": analysis_id,
            "filename": filename,
            "status": "uploaded",
        }


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8"
    )
    temporary.replace(path)
