"""Analysis ownership and history persistence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from app.models.database import connect_database


@dataclass(frozen=True)
class AnalysisRecord:
    """User-owned analysis metadata."""

    id: str
    user_id: str
    filename: str
    status: str
    created_at: str


class AnalysisRepository:
    """Persist ownership metadata without duplicating scientific results."""

    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path).resolve()

    def create(self, analysis_id: str, user_id: str, filename: str) -> AnalysisRecord:
        """Register ownership of a newly stored upload."""
        record = AnalysisRecord(
            id=analysis_id,
            user_id=user_id,
            filename=filename,
            status="uploaded",
            created_at=datetime.now(UTC).isoformat(),
        )
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO analyses (id, user_id, filename, status, created_at)
                VALUES (?, ?, ?, ?, ?)""",
                (
                    record.id,
                    record.user_id,
                    record.filename,
                    record.status,
                    record.created_at,
                ),
            )
        return record

    def belongs_to(self, analysis_id: str, user_id: str) -> bool:
        """Return whether an analysis belongs to a user."""
        with self._connect() as connection:
            row = connection.execute(
                "SELECT 1 FROM analyses WHERE id = ? AND user_id = ?",
                (analysis_id, user_id),
            ).fetchone()
        return row is not None

    def update_status(self, analysis_id: str, status: str) -> None:
        """Synchronize dashboard metadata after pipeline execution."""
        with self._connect() as connection:
            connection.execute(
                "UPDATE analyses SET status = ? WHERE id = ?", (status, analysis_id)
            )

    def transition_status(
        self, analysis_id: str, expected: str, replacement: str
    ) -> bool:
        """Atomically claim one analysis state transition."""
        with self._connect() as connection:
            cursor = connection.execute(
                "UPDATE analyses SET status = ? WHERE id = ? AND status = ?",
                (replacement, analysis_id, expected),
            )
        return cursor.rowcount == 1

    def by_id(self, analysis_id: str) -> AnalysisRecord | None:
        """Return one analysis record without weakening ownership checks."""
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
            ).fetchone()
        return AnalysisRecord(**dict(row)) if row is not None else None

    def list_for_user(self, user_id: str) -> list[AnalysisRecord]:
        """Return newest-first analysis history for a user."""
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
        return [AnalysisRecord(**dict(row)) for row in rows]

    def _connect(self):
        return connect_database(self.database_path)
