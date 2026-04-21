# backend/src/migrations/

Prepared but not-yet-applied SQLite migrations for Finance-X Hybrid.

## Phase 2 philosophy

Every file here is ADDITIVE — it only extends existing tables with new columns
and indexes. No file in this folder is executed automatically during Phase 2.

Applying a migration requires an explicit human go-ahead and is logged in
`refactor/reports/`. This keeps the Phase 2 commit reversible without a data
restore; the only surface area is schema text the runtime does not yet touch.

## Files

| file | purpose | target phase to apply |
| --- | --- | --- |
| `phase2_context_budget.sql` | Add per-run context-budget columns to `agent_runs` | Phase 2.5 (observability before retrieval refactor) |
| `phase3a_gate_events.sql` | Observe-only gate events table + shadow violation cols | Phase 3A rollout |
| `phase4_schema_observation.sql` | Add 4-category validation_category + details_json to `agent_runs` | Phase 4A (observe-only) |
| `phase5_manifest_observation.sql` | Add manifest_* columns to `agent_runs` for the retrieval contract | Phase 5A (observe-only) |

## How to apply (Phase 2.5+ procedure)

```bash
# 1) Back up the db
cp backend/finance-x.db backups/finance-x_$(date +%Y%m%d_%H%M%S).db

# 2) Apply the migration (sqlite3 CLI)
sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql

# 3) Verify
sqlite3 backend/finance-x.db '.schema agent_runs'
```

Until this sequence is run by hand, the runtime behaves exactly as it does today.
