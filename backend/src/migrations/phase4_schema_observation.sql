-- Phase 4A — Schema Observation (observe-only)
--
-- Records the 4-category validation taxonomy (missing_metric /
-- unaddressed_finding / shallow_interpretation / broken_structure) for every
-- agent_run. Populated by backend/src/validation-gate.ts. Canlı davranış
-- değişmez; Phase 4B shadow-warn bu kolonları okuyup dashboard uyarısı basar.
--
-- Apply procedure same as phase2_context_budget.sql / phase3a_gate_events.sql
-- (see backend/src/migrations/README.md). Strictly additive — no data
-- backfill needed, no constraints tightened.

BEGIN TRANSACTION;

-- Worst category observed on this run (null if no violations). Discrete enum
-- kept as TEXT for portability; see validation-gate.ts ValidationCategory.
ALTER TABLE agent_runs ADD COLUMN validation_category TEXT;

-- Full breakdown: { counts: {category→n}, top: [ClassifiedViolation...] }
-- Capped at ~8 KB in validation-gate.ts to avoid row bloat.
ALTER TABLE agent_runs ADD COLUMN validation_category_details_json TEXT;

CREATE INDEX IF NOT EXISTS idx_agent_runs_validation_category
  ON agent_runs(validation_category);

COMMIT;
