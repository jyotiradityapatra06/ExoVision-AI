CREATE TABLE datasets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    mission TEXT,
    target_name TEXT,
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE candidates (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    classification TEXT,
    confidence REAL,
    period REAL,
    depth REAL,
    snr REAL,
    created_at TEXT NOT NULL
);

CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_datasets_user_created ON datasets(user_id, created_at DESC);
CREATE INDEX idx_candidates_analysis ON candidates(analysis_id);
CREATE INDEX idx_reports_analysis ON reports(analysis_id);
