"""Local orchestration of uploaded light curves through existing pipelines."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ai.ml.service import MLInferenceService
from ai.pipeline import PipelineStatus, TransitAnalysisConfig, analyze_lightcurve
from ai.utils.lightcurve_loader import load_lightcurve_fits, validate_lightcurve

MAX_LIGHTCURVE_SAMPLES = 250_000


class AnalysisNotFoundError(FileNotFoundError):
    """Raised when an analysis identifier does not exist."""


class AnalysisExecutionError(RuntimeError):
    """Raised when an uploaded light curve cannot complete analysis."""


class AnalysisService:
    """Run and persist the existing astronomy and ML pipeline."""

    def __init__(
        self,
        upload_root: str | Path,
        *,
        ml_service: MLInferenceService | None = None,
    ) -> None:
        self.upload_root = Path(upload_root).resolve()
        self.ml_service = ml_service

    def analyze(self, analysis_id: str) -> dict[str, str | int]:
        """Execute the uploaded candidate workflow synchronously."""
        directory, state = self._load_state(analysis_id)
        self._set_state(directory, state, status="processing", progress=10)
        try:
            lightcurve = _load_lightcurve(directory / str(state["stored_filename"]))
            _ensure_sample_limit(lightcurve)
            self._set_state(directory, state, status="processing", progress=35)
            pipeline_result = analyze_lightcurve(
                lightcurve["time"],
                lightcurve["flux"],
                flux_error=lightcurve["flux_error"],
                quality=lightcurve["quality"],
                source_id=analysis_id,
                config=TransitAnalysisConfig(
                    include_folded_output=True,
                    retain_intermediate_arrays=True,
                ),
            )
            if pipeline_result.status is PipelineStatus.FAILED:
                message = "; ".join(pipeline_result.errors) or "Analysis failed."
                raise AnalysisExecutionError(message)
            self._set_state(directory, state, status="processing", progress=80)
            candidate_count = int(pipeline_result.candidate is not None)
            ml_report = None
            if pipeline_result.candidate is not None:
                service = self.ml_service or _default_ml_service()
                ml_report = service.analyze_candidate(pipeline_result.candidate)
            result = {
                "analysis_id": analysis_id,
                "status": "completed",
                "candidate_count": candidate_count,
                "lightcurve": {
                    "time": lightcurve["time"].tolist(),
                    "flux": lightcurve["flux"].tolist(),
                },
                "pipeline": pipeline_result.to_dict(),
                "ml_report": ml_report,
            }
            _write_json(directory / "result.json", result)
            self._set_state(
                directory,
                state,
                status="completed",
                progress=100,
                error=None,
            )
            return {
                "analysis_id": analysis_id,
                "status": "completed",
                "candidate_count": candidate_count,
            }
        except Exception as error:
            self._set_state(
                directory,
                state,
                status="failed",
                progress=100,
                error=str(error),
            )
            if isinstance(error, AnalysisExecutionError):
                raise
            raise AnalysisExecutionError(str(error)) from error

    def status(self, analysis_id: str) -> dict[str, str | int | None]:
        """Return persisted analysis state."""
        _, state = self._load_state(analysis_id)
        return {
            "analysis_id": analysis_id,
            "status": str(state["status"]),
            "progress": int(state["progress"]),
            "error": state.get("error"),
        }

    def _load_state(self, analysis_id: str) -> tuple[Path, dict[str, Any]]:
        if not analysis_id or not analysis_id.isalnum():
            raise AnalysisNotFoundError("Analysis not found.")
        directory = self.upload_root / analysis_id
        state_path = directory / "status.json"
        if not state_path.is_file():
            raise AnalysisNotFoundError("Analysis not found.")
        return directory, json.loads(state_path.read_text(encoding="utf-8"))

    @staticmethod
    def _set_state(
        directory: Path,
        state: dict[str, Any],
        *,
        status: str,
        progress: int,
        error: str | None = None,
    ) -> None:
        state.update(status=status, progress=progress, error=error)
        _write_json(directory / "status.json", state)


def _load_lightcurve(path: Path) -> dict[str, np.ndarray]:
    if path.suffix.lower() == ".fits":
        return load_lightcurve_fits(path)
    try:
        frame = pd.read_csv(path, sep=None, engine="python", comment="#")
    except (OSError, pd.errors.ParserError) as error:
        raise ValueError(f"Unable to parse tabular light curve: {error}") from error
    normalized = {str(column).strip().lower(): column for column in frame.columns}
    if "time" not in normalized or "flux" not in normalized:
        raise ValueError("CSV/TXT files must contain 'time' and 'flux' columns.")
    time = frame[normalized["time"]].to_numpy(dtype=np.float64)
    flux = frame[normalized["flux"]].to_numpy(dtype=np.float64)
    error_column = normalized.get("flux_error", normalized.get("flux_err"))
    quality_column = normalized.get("quality")
    flux_error = (
        frame[error_column].to_numpy(dtype=np.float64)
        if error_column is not None
        else np.full(len(time), max(float(np.nanstd(flux)), np.finfo(float).eps))
    )
    quality = (
        frame[quality_column].to_numpy(dtype=np.int32)
        if quality_column is not None
        else np.zeros(len(time), dtype=np.int32)
    )
    valid = np.isfinite(time) & np.isfinite(flux)
    result = {
        "time": time[valid],
        "flux": flux[valid],
        "flux_error": flux_error[valid],
        "quality": quality[valid],
    }
    validate_lightcurve(result)
    return result


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8"
    )
    temporary.replace(path)


def _ensure_sample_limit(lightcurve: dict[str, np.ndarray]) -> None:
    sample_count = len(lightcurve["time"])
    if sample_count > MAX_LIGHTCURVE_SAMPLES:
        raise ValueError(
            f"Light curve contains {sample_count:,} samples; the production limit is "
            f"{MAX_LIGHTCURVE_SAMPLES:,}."
        )


@lru_cache(maxsize=1)
def _default_ml_service() -> MLInferenceService:
    """Load the classifier once per worker instead of once per analysis."""
    return MLInferenceService()
