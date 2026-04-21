-- Phase 6A — QA Checklist Enforcement Observation (observe-only)
--
-- Records session-level addressal rates and per-agent action breakdowns so
-- CLAUDE_MASTER_PROMPT.md §6.7 (downstream must address every upstream QA
-- finding) can be measured before any retry/escalation logic ships.
--
-- Additive ALTER TABLE + CREATE INDEX IF NOT EXISTS. Apply once.

BEGIN TRANSACTION;

-- Session-level roll-up.
ALTER TABLE analysis_sessions ADD COLUMN addressal_rate REAL;
ALTER TABLE analysis_sessions ADD COLUMN findings_total INTEGER;
ALTER TABLE analysis_sessions ADD COLUMN findings_addressed INTEGER;
ALTER TABLE analysis_sessions ADD COLUMN addressal_escalation_flag INTEGER DEFAULT 0;
ALTER TABLE analysis_sessions ADD COLUMN addressal_report_json TEXT;

CREATE INDEX IF NOT EXISTS idx_analysis_sessions_addressal_flag
  ON analysis_sessions(addressal_escalation_flag);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_addressal_rate
  ON analysis_sessions(addressal_rate);

-- Per-agent breakdown of actions taken during revision rounds.
ALTER TABLE agent_runs ADD COLUMN addressal_rate REAL;
ALTER TABLE agent_runs ADD COLUMN finding_action_fixed_count INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN finding_action_acknowledged_count INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN finding_action_rejected_count INTEGER DEFAULT 0;

COMMIT;
