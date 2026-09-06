ALTER TABLE analyses ADD COLUMN processing_started_at TEXT;
ALTER TABLE analyses ADD COLUMN updated_at TEXT;
UPDATE analyses SET updated_at = created_at WHERE updated_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_user_status
ON analyses(user_id, status);
