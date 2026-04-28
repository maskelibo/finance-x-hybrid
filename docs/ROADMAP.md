# Finance-X Roadmap

Snapshot date: 2026-04-28. This document is a **forward-looking sketch**, not a commitment. Tier 2/3 items are explicitly subject to operator approval, budget envelope, and live-validation discipline. Nothing here is in flight unless a separate phase (with its own scope cycle) is running for it.

## Tier 1 — Completed (current state)

### Block S — Sub-agent decomposition (S1-S12)
- 40-sub-agent registry across data collection, parsing, financial analysis, macro, valuation, sector, event impact, final summary, and strategic synthesis.
- Provider-hang resilience: deterministic split for `ss_signal_merger` (4 Python sub-agents) and `val_dcf` (4 sub-agents).
- Dispatcher hardening: platform-aware Python binary spawn, sanitised task inputs, hard deadline via `Promise.race`.
- KCHOL benchmark stabilised at 0% provider hang across 3-run protocol.

### Block P — Polish (P1.alpha + P1.beta + P5A + P5B + P5C + P6A + P6B + P6C + P6D + P6E + P7A + P7B + P7C + P7D)
- **Truth Layer (P1.alpha + P1.beta):** classifier + weighter + filing selector with consumer integration into orchestrator preflight.
- **P5A — Golden eval scaffolding:** schema + harness; real golden facts deferred to operator delivery.
- **P5B Wave 1 — A/B testing framework:** Welch t-test statistics, mocked runner harness; live runner deferred.
- **P5C Wave 1 — Synthetic edge-case generator:** 8 deterministic Python fixtures + JSON schema; torture runner deferred.
- **P6A Wave 1 — Pluggable secrets:** `EnvSecretsProvider` full; 1Password / Vault stubs throw with remediation hints.
- **P6B Wave 1 — Immutable audit log:** SHA-256 hash-chained JSONL with `verifyAuditChain`. Default OFF; consumer wiring deferred.
- **P6C — CI:** typecheck + vitest + python-services pytest enabled, regression-eval hard-disabled.
- **P6D Wave 1 — Health & readiness:** `/health` + `/ready` JSON endpoints + `buildMetricsResponse` helper. Default OFF; existing `/metrics` route preserved.
- **P6E Wave 1 — Prompt-injection defense:** 11 frozen regex patterns + `validateUserInput`. No consumer wiring (deferred to Wave 2).
- **P7A Wave 1 — SSE streaming:** standalone consumer-side plumbing; publisher emissions deferred to Wave 2.
- **P7B Wave 1 — Observable DAG endpoint:** `GET /api/sessions/:id/dag` JSON; React frontend deferred.
- **P7C Wave 1 — Replay tool:** `replaySession()` + CLI with HTML export.
- **P7D Wave 1 — Lineage trail endpoint:** `GET /api/lineage/:sessionId/:factKey` over `lineage_nodes` + `lineage_edges`.

### Reliability and ops scaffolding (P3 + P4)
- Reason-code-driven decision engines: contradiction detection, coverage check, completeness probe, SPK-style guards.
- Stateless circuit breaker (P4D) — pure function over caller-supplied attempt history.
- Cost governor + escalation manager + cost-cap calibration.
- P1B Wave 1 lineage tracking (per-fact derivation nodes + DAG edges).

## Tier 2 — Feature expansion (next 6 months)

Each item below is a discrete future phase that requires its own scope cycle and operator approval before any work begins.

### Audit log + secrets-provider Wave 2
- P6A Wave 2: real `op` CLI integration in `OnePasswordCLIProvider`; real Vault HTTP client in `HashiCorpVaultProvider`.
- P6B Wave 2: orchestrator `session_started`/`session_completed`/`session_failed` lifecycle wiring under P4.5 template.
- P6E Wave 2: validateUserInput call site in `/api/sessions` with audit emission on failure.

### Observability Wave 2
- P6D Wave 1.5: decide how to expose the new six metrics — merge into existing `/metrics`, ship at `/observability/metrics`, or replace.
- P7A Wave 2: orchestrator + agent-runner publisher emissions (`agent_started`, `agent_completed`, `sub_agent_started`, `qa_decision`).
- P7B Wave 2: React DAG visualizer component.
- P7D Wave 2: React explainability panel.

### Synthetic + A/B Wave 2
- P5B Wave 2: live A/B runner harness (paid-run with explicit budget envelope).
- P5C Wave 2: torture-test runner against synthetic fixtures (paid-run-gated).
- Real golden facts delivery (operator-supplied) to activate P5A regression evals.

### Compliance + analyst tooling
- P6F (deferred): SPK compliance reporter — auto-check rapor language, forward-looking-statement disclaimer, citation density.
- P7E (blocked): Analyst review bundle. Requires shipped backing tables — `truth_decisions`, `citation_reports`, `evidence_chunks`, `analyst_review_bundles` — none of which exist today. Each is its own migration scope.

### Portfolio mode
- Multi-ticker aggregated analysis.
- Cross-correlation risk metrics.
- Portfolio-level reports.

### Backtesting engine
- Historical session vs current-state comparison.
- Prediction accuracy metrics.
- Auto lesson extraction.

### Alerting
- Rule-based alerts (KAP material, price deviation, earnings surprise).
- Slack/email integration.
- Alert fatigue management.

### Natural-language query
- Dashboard chat.
- CEO agent for natural queries.
- Streaming responses.

### Analyst collaboration
- Real-time collaboration on report sections.
- Comment threads.
- Approval workflow.

## Tier 3 — Strategic (6-12 months)

### Fine-tuning
- Domain-specific Turkish financial LLM derived from gold-standard reports.

### Ensemble decision making
- BUY/SELL and target-price calls run through 3 models with confidence-weighted voting.

### Self-improving loop
- Nightly pattern detection.
- Auto rule generation with A/B validation.

### Multi-modal support
- Chart-to-data extraction (vision model).
- Logo / brand extraction.

## Compliance roadmap

### KVKK / GDPR
- Data retention policy.
- Right to erasure.
- Consent management.

### Multi-tenancy
- Tenant isolation.
- Per-tenant memory + feedback loop.
- Chinese Wall.

## Governance
- ADR (Architecture Decision Records) directory at `docs/adr/` (planned).
- Quarterly architecture review cadence.
- Every new decision layer must carry explicit reason codes.
