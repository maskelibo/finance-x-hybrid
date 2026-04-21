-- Phase 5A — Manifest Observation (observe-only)
--
-- Phase 5A builds one AgentOutputManifest per agent run and stores a
-- compact snapshot on agent_runs. The manifest is the canonical retrieval
-- layer Phase 5B/C/D will eventually route downstream consumers through;
-- here we only measure its shape to decide whether dual-write is worth
-- the plumbing cost.
--
-- Strictly additive ALTER TABLE statements. Apply once (not idempotent).
-- Procedure identical to phase2/3a/4 migrations (see README.md).

BEGIN TRANSACTION;

-- Raw output size (bytes). Lets us graph fan-out over time.
ALTER TABLE agent_runs ADD COLUMN manifest_raw_size_bytes INTEGER;

-- Serialized manifest size (bytes). Phase 5B compares these to project
-- savings when downstream agents read manifest instead of raw payload.
ALTER TABLE agent_runs ADD COLUMN manifest_compressed_size_bytes INTEGER;

-- Section count (top-level retrievable chunks). Used to plan downstream
-- section-aware retrieval in Phase 5C.
ALTER TABLE agent_runs ADD COLUMN manifest_section_count INTEGER;

-- 1 when raw_output_bytes exceeded the 100 KB downstream-truncation floor.
ALTER TABLE agent_runs ADD COLUMN manifest_truncation_risk INTEGER DEFAULT 0;

-- Full serialized manifest (JSON). Capped to ~16 KB by extractor.
ALTER TABLE agent_runs ADD COLUMN manifest_json TEXT;

CREATE INDEX IF NOT EXISTS idx_agent_runs_manifest_truncation_risk
  ON agent_runs(manifest_truncation_risk);

CREATE INDEX IF NOT EXISTS idx_agent_runs_manifest_raw_size
  ON agent_runs(manifest_raw_size_bytes);

COMMIT;
