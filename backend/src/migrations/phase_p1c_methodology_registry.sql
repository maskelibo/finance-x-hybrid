-- Block P / Plan P1C — Versioned Methodology Registry
--
-- Strictly additive. One new table for per-session methodology snapshots.
-- canonical_facts and lineage_nodes/lineage_edges remain UNTOUCHED — per-row
-- methodology_version is dereferenced via analysis_sessions → session_methodology.
--
-- Apply procedure same as the other phase*_*.sql files in this folder
-- (see backend/src/migrations/README.md). Manual, backup-first, idempotent
-- via the schema_migrations registry table written by
-- backend/src/scripts/apply-migrations.ts.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS session_methodology (
  session_id            TEXT PRIMARY KEY,
  methodology_version   TEXT NOT NULL,
  methodology_snapshot  TEXT NOT NULL,   -- JSON-serialised full yaml
  recorded_at           TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_methodology_version ON session_methodology(methodology_version);

COMMIT;
