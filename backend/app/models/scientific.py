"""Database-ready scientific entity models."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Dataset:
    id: str
    user_id: str
    source: str
    mission: str | None
    target_name: str | None
    filename: str
    created_at: str


@dataclass(frozen=True)
class Candidate:
    id: str
    analysis_id: str
    classification: str | None
    confidence: float | None
    period: float | None
    depth: float | None
    snr: float | None
    created_at: str


@dataclass(frozen=True)
class Report:
    id: str
    analysis_id: str
    filename: str
    created_at: str
