-- Block P / Plan P1B Wave 1 — Data Lineage Tracking
--
-- Strictly additive. Adds two new tables for per-fact lineage:
--   - lineage_nodes: per-fact derivation nodes (raw_extracted in Wave 1;
--     computed/aggregated/transformed reserved for Wave 2)
--   - lineage_edges: input → output DAG (Wave 1 emits no edges since only
--     raw_extracted nodes are written; the table exists so Wave 2 / P1D can
--     populate it without a follow-up migration)
--
-- Backward compatibility:
--   - canonical_facts is UNTOUCHED. Lineage is opt-in per insert via
--     fact-layer/lineage.ts.recordLineageNode; legacy rows yield empty
--     lineage_summary in pack-v2.
--
-- Apply procedure same as the other phase*_*.sql files in this folder
-- (see backend/src/migrations/README.md). Manual, backup-first, idempotent
-- via the schema_migrations registry table written by
-- backend/src/scripts/apply-migrations.ts.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS lineage_nodes (
  session_id        TEXT NOT NULL,
  fact_key          TEXT NOT NULL,
  node_id           TEXT PRIMARY KEY,
  node_type         TEXT NOT NULL,
  formula           TEXT,
  computed_by       TEXT NOT NULL,
  computed_at       TEXT NOT NULL,
  source_doc_id     TEXT,
  source_page       INTEGER,
  source_snippet    TEXT,
  raw_value         TEXT,
  normalized_value  TEXT,
  unit_conversion   TEXT,
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lineage_edges (
  session_id        TEXT NOT NULL,
  input_node_id     TEXT NOT NULL,
  output_node_id    TEXT NOT NULL,
  PRIMARY KEY (session_id, input_node_id, output_node_id),
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lineage_nodes_session ON lineage_nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_lineage_nodes_fact ON lineage_nodes(session_id, fact_key);
CREATE INDEX IF NOT EXISTS idx_lineage_edges_input ON lineage_edges(session_id, input_node_id);
CREATE INDEX IF NOT EXISTS idx_lineage_edges_output ON lineage_edges(session_id, output_node_id);

COMMIT;
