# Finance-X Architecture

Snapshot date: 2026-04-28. This document is a high-level map. Source of truth is the code; this map is a navigation aid, not a contract.

## Top-level layout

```
backend/             Node.js + TypeScript backend (Express, better-sqlite3)
  src/               Backend source (tsconfig rootDir)
  scripts/           Operator and dev CLI scripts (out of tsconfig include path)
  data/              Local SQLite (gitignored)
python-services/     Python 3.12 deterministic engines (financial parsing,
                     reconciliation, valuation, sector competition, etc.)
                     Invoked via dispatcher subprocess from backend.
agents/              Per-agent prompt + memory + lessons (file-based)
dashboard/           React frontend (separate build)
docs/                Plans, phase reports, architecture notes
evals/               Golden + synthetic fixtures, eval scaffolding
```

## Backend modules (`backend/src/`)

### Core orchestration
- `server.ts` — Express bootstrap, route registration, watchdog + heartbeat startup.
- `orchestrator.ts` — session lifecycle, phase progression, agent scheduling, QA loop, retry handling.
- `agent-runner.ts` / `sub-agent-runner.ts` — single-agent and sub-agent execution paths with provider dispatch.
- `db.ts` — SQLite schema (sessions, agent runs, sub-agent runs, lineage nodes/edges, methodology registry, etc.).

### Decision engines (deterministic, frozen reason codes)
- `execution/circuit-breaker.ts` — stateless circuit breaker; caller supplies attempt history.
- `execution/cost-governor.ts`, `cost-cap-resolver.ts`, `cost-cap-calibration.ts` — budget enforcement.
- `execution/escalation-manager.ts` — failure-to-escalation lifecycle.
- `quality-data/contradiction.ts`, `coverage.ts`, `completeness.ts`, `synthetic_validator.ts` — quality gates.

### Fact + lineage
- `fact-layer/store.ts` — canonical facts upsert + read.
- `fact-layer/extractor.ts` — fact extraction wrapper.
- `fact-layer/lineage.ts` — lineage node/edge writer.
- `fact-layer/truth-arbitration.ts` — in-memory truth arbitration (no `truth_decisions` table yet).
- `fact-layer/methodology.ts` — versioned methodology registry.
- `fact-layer/confidence.ts` — confidence tier scoring.

### Truth Layer (P1.alpha + P1.beta)
- `truth-layer/classifier.ts` — fact-classification hint producer.
- `truth-layer/weighter.ts` — relative weighting of competing sources.
- `truth-layer/filing-selector.ts` — recommends "true consolidated" filing for FA preflight.

### Security (P6 phases)
- `security/secrets.ts` — pluggable provider (env / 1password stub / vault stub). Default mode = env.
- `security/audit-log.ts` — SHA-256 hash-chained JSONL audit writer + verifier. Default OFF; standalone (no consumer wiring).
- `security/prompt-injection.ts` — first-line regex injection detector + `validateUserInput`. Standalone.

### Observability (P6 + P7 phases)
- `observability/setup.ts`, `tracer.ts` — OpenTelemetry hook.
- `observability/health.ts` — `/health`, `/ready` handlers + `buildMetricsResponse` helper. Default OFF gate `METRICS_ENABLED`.
- `observability/dag.ts` — `/api/sessions/:id/dag` snapshot from `agent_runs` + `sub_agent_runs`. Default OFF gate `DAG_ENABLED`.
- `observability/lineage-api.ts` — `/api/lineage/:sessionId/:factKey` over `lineage_nodes` + `lineage_edges`. Default OFF gate `LINEAGE_API_ENABLED`.

### Streaming (P7A)
- `streaming/sse.ts` — SSE consumer-side plumbing for `/api/sessions/:id/stream`. Default OFF gate `SSE_ENABLED`. Publisher emissions in orchestrator/agent-runner deferred to Wave 2.

### Dev tools (P7C)
- `dev-tools/replay.ts` — `replaySession()` + bottleneck analysis + text/HTML rendering.
- `scripts/replay.ts` — CLI: `npx tsx scripts/replay.ts <session_id> [--html out.html]`.

### CEO + memory
- `ceo-chat.ts`, `heartbeat.ts`, `night-training.ts`, `feedback-loop.ts`, `memory.ts` — CEO autonomous loop and per-agent learning persistence.

### Event bus
- `event-bus.ts` — internal pub/sub (6 typed events). Currently no publishers; SSE consumer is wired but receives nothing until Wave 2.
- `event-bus-wiring.ts` — subscriber wiring for auto-trigger on material disclosures.

## Python services (`python-services/`)

Pure deterministic engines invoked via subprocess from backend. No LLM calls.
- `financex/parsers/` — financial statement parsing, label mapping (sector-aware), banking overlay.
- `financex/calculators/reconciliation.py` — accounting identity + sector-specific checks.
- `financex/crawlers/` — TCMB FX, KAP filings, source HTTP clients (mockable transports for tests).
- `financex/calculators/financial_engine.py` — ratio + KPI computation.
- `financex/sector_competition.py`, `valuation.py` — Wave-7/8 deterministic Python.
- `tests/` — pytest suite (257 tests as of 2026-04-28, with one known live-network flake on `test_live_tcmb_fetch` — broken skip predicate).

## Reason-code discipline

Every decision engine must surface its decision via:
1. A frozen `*_REASON_CODES` constant mapping codes to short human descriptions.
2. The decision output schema must include `reason_code` from this constant.
3. Tests assert reason codes are the only ones emitted.

This applies to circuit breaker, cost governor, contradiction engine, coverage engine, completeness engine, synthetic validator, truth arbitration, escalation manager. New engines must follow the same pattern.

## Forbidden-file touch template (P4.5)

`server.ts`, `orchestrator.ts`, `agent-runner.ts`, `sub-agent-runner.ts` are sensitive runtime files. Touches are allowed only when ALL hold:
- ≤ 15 additive lines per file.
- No deletion. No refactor. Pure addition.
- Default-OFF env flag (e.g., `METRICS_ENABLED='1'`, `SSE_ENABLED='1'`).
- Exception isolated (try/catch that warns, never throws).
- Byte-functionally identical baseline when the flag is unset.

## CI

`.github/workflows/ci.yml` runs four jobs:
- `backend-typecheck` — `npx tsc --noEmit` from `backend/`.
- `backend-tests` — `npx vitest run` from `backend/` (full suite, plus uv-provisioned Python toolchain for pipeline-smoke).
- `python-tests` — `uv run pytest` from `python-services/`.
- `regression-eval` — hard-disabled (`if: false`); guarded behind future budget envelope.

CI runs on every PR and on push to `main` / `master` / `finance-x-execution`.

## Database

SQLite at `backend/data/financex.db`. Tables:
- `analysis_sessions`, `agent_runs`, `sub_agent_runs`, `reports`.
- `ceo_activities`, `agent_memory`, `agent_lessons`.
- `lineage_nodes`, `lineage_edges` (P1B Wave 1).
- `methodology_versions`, `canonical_facts`.

Tables referenced by P7E master plan that **do not exist**: `truth_decisions`, `citation_reports`, `evidence_chunks`, `analyst_review_bundles`. Each would be a separate migration scope.

## Hard constraints (current sprint discipline)

- No live paid run.
- No fabricated runtime state (especially circuit-breaker status).
- No DB schema migration without explicit phase scope.
- No package dependency change without explicit justification.
- No silent suppression of analytical narrative; every decision layer carries reason codes.
- Agent prompts, agent memory files, report artefacts, and replay HTML are never committed.
