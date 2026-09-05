"""Local orchestration of uploaded light curves through existing pipelines."""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ai.ml.service import MLInferenceService
from ai.pipeline import PipelineStatus, TransitAnalysisConfig, analyze_lightcurve
from ai.utils.lightcurve_loader import load_lightcurve_fits, validate_lightcurve

MAX_LIGHTCURVE_SAMPLES = 250_000
logger = logging.getLogger(__name__)

STAGE_MESSAGES = {
    "ready": "Observation is ready for analysis.",
    "preparing_observation": "Preparing the uploaded observation.",
    "analyzing_lightcurve": (
        "Preprocessing the light curve and searching for transit-like signals."
    ),
    "classifying_candidate": "Running the candidate classifier.",
    "preparing_results": "Preparing the analysis results.",
    "completed": "Analysis completed successfully.",
    "failed": "Analysis could not be completed.",
}
PUBLIC_ANALYSIS_ERRORS = {
    "CSV/TXT observations must contain time and flux columns.",
    "The observation contains too many samples for this deployment.",
    "The observation does not contain enough valid light-curve samples.",
    "The observation format is unsupported or malformed.",
    "Candidate classification is temporarily unavailable.",
    "Analysis failed while processing this observation.",
}


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
        self._set_state(
            directory, state, status="processing", stage="preparing_observation"
        )
        try:
            lightcurve = _load_lightcurve(directory / str(state["stored_filename"]))
            _ensure_sample_limit(lightcurve)
            self._set_state(
                directory, state, status="processing", stage="analyzing_lightcurve"
            )
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
                raise AnalysisExecutionError("The light curve could not be analyzed.")
            candidate_count = int(pipeline_result.candidate is not None)
            ml_report = None
            if pipeline_result.candidate is not None:
                self._set_state(
                    directory,
                    state,
                    status="processing",
                    stage="classifying_candidate",
                )
                service = self.ml_service or _default_ml_service()
                ml_report = service.analyze_candidate(pipeline_result.candidate)
            self._set_state(
                directory, state, status="processing", stage="preparing_results"
            )
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
                stage="completed",
                error=None,
            )
            return {
                "analysis_id": analysis_id,
                "status": "completed",
                "candidate_count": candidate_count,
            }
        except Exception as error:
            public_error = safe_analysis_error(error)
            logger.exception("Analysis %s failed", analysis_id)
            self._set_state(
                directory,
                state,
                status="failed",
                stage="failed",
                error=public_error,
            )
            raise AnalysisExecutionError(public_error) from error

    def status(self, analysis_id: str) -> dict[str, str | int | None]:
        """Return persisted analysis state."""
        _, state = self._load_state(analysis_id)
        status_value = str(state["status"])
        stage = str(state.get("stage", _default_stage(status_value)))
        stored_error = state.get("error")
        public_error = (
            safe_analysis_error(RuntimeError(str(stored_error)))
            if status_value == "failed" and stored_error
            else None
        )
        return {
            "analysis_id": analysis_id,
            "status": status_value,
            "progress": 100 if status_value in {"completed", "failed"} else 0,
            "stage": stage,
            "message": str(state.get("message", STAGE_MESSAGES[stage])),
            "retryable": status_value == "failed",
            "error": public_error,
        }

    def mark_processing(self, analysis_id: str) -> dict[str, Any]:
        """Persist the accepted processing state before background execution."""
        directory, state = self._load_state(analysis_id)
        (directory / "result.json").unlink(missing_ok=True)
        (directory / "result.tmp").unlink(missing_ok=True)
        self._set_state(
            directory,
            state,
            status="processing",
            stage="preparing_observation",
            error=None,
        )
        return state

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
        stage: str,
        error: str | None = None,
    ) -> None:
        progress = 100 if status in {"completed", "failed"} else 0
        state.update(
            status=status,
            progress=progress,
            stage=stage,
            message=STAGE_MESSAGES[stage],
            retryable=status == "failed",
            error=error,
        )
        _write_json(directory / "status.json", state)


def safe_analysis_error(error: Exception) -> str:
    """Map processing failures to useful messages without leaking internals."""
    original = str(error)
    if original in PUBLIC_ANALYSIS_ERRORS:
        return original
    message = original.lower()
    if "time" in message and "flux" in message and "column" in message:
        return "CSV/TXT observations must contain time and flux columns."
    if "sample" in message and ("limit" in message or "250,000" in message):
        return "The observation contains too many samples for this deployment."
    if "sample" in message or "finite" in message or "empty" in message:
        return "The observation does not contain enough valid light-curve samples."
    if "fits" in message or "parse" in message or "light curve" in message:
        return "The observation format is unsupported or malformed."
    if "model" in message or "classifier" in message:
        return "Candidate classification is temporarily unavailable."
    return "Analysis failed while processing this observation."


def _default_stage(status: str) -> str:
    return {
        "uploaded": "ready",
        "processing": "preparing_observation",
        "completed": "completed",
        "failed": "failed",
    }.get(status, "ready")


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
