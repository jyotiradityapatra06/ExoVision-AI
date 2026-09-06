"""Analysis ownership and history persistence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
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
    processing_started_at: str | None = None
    updated_at: str | None = None


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
            updated_at=datetime.now(UTC).isoformat(),
        )
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO analyses
                (id, user_id, filename, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    record.id,
                    record.user_id,
                    record.filename,
                    record.status,
                    record.created_at,
                    record.updated_at,
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
                """UPDATE analyses SET status = ?, updated_at = ?,
                processing_started_at = CASE WHEN ? = 'processing'
                    THEN COALESCE(processing_started_at, ?)
                    ELSE processing_started_at END
                WHERE id = ?""",
                (status, _now(), status, _now(), analysis_id),
            )

    def transition_status(
        self, analysis_id: str, expected: str, replacement: str
    ) -> bool:
        """Atomically claim one analysis state transition."""
        with self._connect() as connection:
            cursor = connection.execute(
                """UPDATE analyses SET status = ?, updated_at = ?,
                processing_started_at = CASE WHEN ? = 'processing' THEN ?
                    ELSE processing_started_at END
                WHERE id = ? AND status = ?""",
                (replacement, _now(), replacement, _now(), analysis_id, expected),
            )
        return cursor.rowcount == 1

    def claim_processing(
        self, analysis_id: str, user_id: str, expected: str, max_active: int
    ) -> str:
        """Atomically enforce ownership, state, and a per-user active limit."""
        now = _now()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT status FROM analyses WHERE id = ? AND user_id = ?",
                (analysis_id, user_id),
            ).fetchone()
            if row is None or row["status"] != expected:
                return "unchanged"
            active = connection.execute(
                """SELECT COUNT(*) FROM analyses
                WHERE user_id = ? AND status = 'processing' AND id != ?""",
                (user_id, analysis_id),
            ).fetchone()[0]
            if active >= max_active:
                return "limit"
            connection.execute(
                """UPDATE analyses SET status = 'processing',
                processing_started_at = ?, updated_at = ? WHERE id = ?""",
                (now, now, analysis_id),
            )
        return "claimed"

    def recover_stale(self, stale_minutes: int) -> list[str]:
        """Fail interrupted processing rows and return their identifiers."""
        cutoff = (datetime.now(UTC) - timedelta(minutes=stale_minutes)).isoformat()
        now = _now()
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT id FROM analyses WHERE status = 'processing'
                AND COALESCE(processing_started_at, updated_at, created_at) < ?""",
                (cutoff,),
            ).fetchall()
            ids = [str(row["id"]) for row in rows]
            if ids:
                connection.executemany(
                    """UPDATE analyses SET status = 'failed', updated_at = ?
                    WHERE id = ?""",
                    [(now, analysis_id) for analysis_id in ids],
                )
        return ids

    def count_for_user(self, user_id: str) -> int:
        with self._connect() as connection:
            return int(
                connection.execute(
                    "SELECT COUNT(*) FROM analyses WHERE user_id = ?", (user_id,)
                ).fetchone()[0]
            )

    def ids_for_user(self, user_id: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT id FROM analyses WHERE user_id = ?", (user_id,)
            ).fetchall()
        return [str(row["id"]) for row in rows]

    def by_id(self, analysis_id: str) -> AnalysisRecord | None:
        """Return one analysis record without weakening ownership checks."""
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
            ).fetchone()
        return AnalysisRecord(**dict(row)) if row is not None else None

    def list_for_user(
        self, user_id: str, limit: int | None = None, offset: int = 0
    ) -> list[AnalysisRecord]:
        """Return a bounded newest-first analysis history for a user."""
        query = "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC"
        parameters: tuple[object, ...] = (user_id,)
        if limit is not None:
            query += " LIMIT ? OFFSET ?"
            parameters = (user_id, limit, offset)
        with self._connect() as connection:
            rows = connection.execute(query, parameters).fetchall()
        return [AnalysisRecord(**dict(row)) for row in rows]

    def status_counts_for_user(self, user_id: str) -> dict[str, int]:
        """Return aggregate status counts without loading history rows."""
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT status, COUNT(*) AS count FROM analyses "
                "WHERE user_id = ? GROUP BY status",
                (user_id,),
            ).fetchall()
        counts = {str(row["status"]): int(row["count"]) for row in rows}
        return {
            "total": sum(counts.values()),
            "completed": counts.get("completed", 0),
            "processing": counts.get("processing", 0),
            "failed": counts.get("failed", 0),
        }

    def _connect(self):
        return connect_database(self.database_path)


def _now() -> str:
    return datetime.now(UTC).isoformat()
