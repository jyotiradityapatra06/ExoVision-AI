"""Database initialization and lightweight migration runner."""

import sqlite3
from pathlib import Path

MIGRATIONS = (
    (
        "0001_users_analyses",
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_analyses_user_created
        ON analyses(user_id, created_at DESC);
        """,
    ),
    (
        "0002_scientific_entities",
        """
        CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            source TEXT NOT NULL,
            mission TEXT,
            target_name TEXT,
            filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
            classification TEXT,
            confidence REAL,
            period REAL,
            depth REAL,
            snr REAL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_datasets_user_created
        ON datasets(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_candidates_analysis ON candidates(analysis_id);
        CREATE INDEX IF NOT EXISTS idx_reports_analysis ON reports(analysis_id);
        """,
    ),
    (
        "0003_analysis_processing_timestamps",
        """
        ALTER TABLE analyses ADD COLUMN processing_started_at TEXT;
        ALTER TABLE analyses ADD COLUMN updated_at TEXT;
        UPDATE analyses SET updated_at = created_at WHERE updated_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_analyses_user_status
        ON analyses(user_id, status);
        """,
    ),
)


def connect_database(database_path: str | Path) -> sqlite3.Connection:
    """Open a consistently configured SQLite connection."""
    connection = sqlite3.connect(Path(database_path).resolve(), timeout=5.0)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 5000")
    return connection


def initialize_database(database_path: str | Path) -> None:
    """Apply pending embedded SQLite migrations atomically."""
    path = Path(database_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    with connect_database(path) as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations "
            "(version TEXT PRIMARY KEY, "
            "applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        )
        applied = {
            row[0]
            for row in connection.execute("SELECT version FROM schema_migrations")
        }
        for version, sql in MIGRATIONS:
            if version in applied:
                continue
            connection.executescript(sql)
            connection.execute(
                "INSERT INTO schema_migrations (version) VALUES (?)", (version,)
            )
        connection.execute("PRAGMA optimize")
