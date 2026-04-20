-- Phase 3A — Gate Events (observe-only)
--
-- Records "what would the hard gate have done?" for every QA/CEO decision point
-- and schema shadow validation. Canlı davranış değişmez; yalnızca log.
--
-- Apply procedure same as phase2_context_budget.sql (see
-- backend/src/migrations/README.md).

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS agent_run_gate_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  ticker TEXT,
  runtime_mode TEXT,
  gate_kind TEXT NOT NULL,              -- 'qa' | 'ceo_approval' | 'schema_shadow'
  qa_round INTEGER,                      -- only populated for gate_kind='qa'
  would_have_blocked INTEGER DEFAULT 0,  -- bool 0/1
  decision_taken TEXT,                   -- 'continued' | 'revised' | 'delivered_with_warning' | 'passed'
  reason TEXT,                           -- short human-readable reason
  detail_json TEXT,                      -- JSON blob with structured detail
  score_numeric REAL,                    -- for qa: overall_score 0-1
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gate_events_session ON agent_run_gate_events(session_id);
CREATE INDEX IF NOT EXISTS idx_gate_events_kind    ON agent_run_gate_events(gate_kind);
CREATE INDEX IF NOT EXISTS idx_gate_events_blocked ON agent_run_gate_events(would_have_blocked);
CREATE INDEX IF NOT EXISTS idx_gate_events_ticker  ON agent_run_gate_events(ticker);

-- Schema shadow validator per-run aggregated counts (additive to agent_runs)
ALTER TABLE agent_runs ADD COLUMN schema_shadow_violation_count INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN schema_shadow_violations_json TEXT;
ALTER TABLE agent_runs ADD COLUMN qa_would_block_last INTEGER DEFAULT 0;

COMMIT;
