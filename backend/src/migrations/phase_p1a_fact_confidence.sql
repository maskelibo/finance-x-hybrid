-- Block P / Plan P1A Wave 1 — Fact-Level Confidence Scoring
--
-- Strictly additive. Adds a single nullable TEXT column to canonical_facts to
-- persist the per-fact FactConfidence object computed by
-- backend/src/fact-layer/confidence.ts when callers opt in via
-- upsertFact's optional confidence_inputs parameter.
--
-- Backward compatibility:
--   - Legacy rows (no confidence_json) read back as { confidence: null } in
--     the runtime — store.ts.rowToFact handles missing/malformed JSON
--     defensively.
--   - upsertFact callers that omit confidence_inputs continue to write
--     confidence_json=NULL with no behaviour change.
--
-- Apply procedure same as the other phase*_*.sql files in this folder
-- (see backend/src/migrations/README.md). Manual, backup-first, idempotent
-- via the schema_migrations registry table written by
-- backend/src/scripts/apply-migrations.ts.

BEGIN TRANSACTION;

ALTER TABLE canonical_facts ADD COLUMN confidence_json TEXT;

COMMIT;
