-- Phase 2 — Context Budget Logging (Codex 7.3)
--
-- Adds per-run observability fields so we can measure the "lost in the middle"
-- problem before we refactor retrieval. Every column is nullable so already-
-- existing rows stay valid.
--
-- DO NOT execute automatically. Apply via the procedure in
-- backend/src/migrations/README.md after taking a db backup.
--
-- Schema target for agent_runs AFTER applying this:
--   id, session_id, agent_id, agent_display_name, status,
--   provider_used, started_at, completed_at, duration_ms,
--   input_prompt, output_text, error_message, tokens_used, cost_usd,
--   -- Phase 2 additions --
--   prompt_total_chars, prompt_memory_chars, prompt_knowledge_chars,
--   prompt_upstream_payload_chars, prompt_shared_directives_chars,
--   injected_sections_count, output_chars,
--   truncation_detected, memory_was_trimmed,
--   cache_hit_prefix_ratio, extended_thinking_enabled,
--   runtime_mode_at_call, layer_at_call

BEGIN TRANSACTION;

-- Prompt size breakdown (char count — runner records per-section counts).
ALTER TABLE agent_runs ADD COLUMN prompt_total_chars INTEGER;
ALTER TABLE agent_runs ADD COLUMN prompt_memory_chars INTEGER;
ALTER TABLE agent_runs ADD COLUMN prompt_knowledge_chars INTEGER;
ALTER TABLE agent_runs ADD COLUMN prompt_upstream_payload_chars INTEGER;
ALTER TABLE agent_runs ADD COLUMN prompt_shared_directives_chars INTEGER;

-- Manifest + retrieval instrumentation (used once Phase 5 lands).
ALTER TABLE agent_runs ADD COLUMN injected_sections_count INTEGER;

-- Output-side observability.
ALTER TABLE agent_runs ADD COLUMN output_chars INTEGER;
ALTER TABLE agent_runs ADD COLUMN truncation_detected INTEGER DEFAULT 0;  -- bool (0/1)
ALTER TABLE agent_runs ADD COLUMN memory_was_trimmed INTEGER DEFAULT 0;    -- bool (0/1), true when memory.md > 6 KB budget

-- Caching + reasoning flags (optional, populated when instrumented).
ALTER TABLE agent_runs ADD COLUMN cache_hit_prefix_ratio REAL;
ALTER TABLE agent_runs ADD COLUMN extended_thinking_enabled INTEGER DEFAULT 0;

-- Context the call was made in (mode/layer drift visibility).
ALTER TABLE agent_runs ADD COLUMN runtime_mode_at_call TEXT;
ALTER TABLE agent_runs ADD COLUMN layer_at_call TEXT;

-- Helpful reporting indexes.
CREATE INDEX IF NOT EXISTS idx_agent_runs_truncation ON agent_runs(truncation_detected);
CREATE INDEX IF NOT EXISTS idx_agent_runs_memory_trim ON agent_runs(memory_was_trimmed);
CREATE INDEX IF NOT EXISTS idx_agent_runs_mode ON agent_runs(runtime_mode_at_call);

COMMIT;
