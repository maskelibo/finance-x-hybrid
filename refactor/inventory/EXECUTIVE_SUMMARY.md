# Executive Summary

- Generated: 2026-04-20T21:15:06.798619+00:00
- Scope: Phase 1 inventory + audit only. No production logic changed in this deliverable beyond inventory scripts/reports.

## Most critical 10 problems

| problem | impact_x_frequency | evidence |
| --- | --- | --- |
| Runtime/documentation drift on mode activation and agent count | 10 x 9 = 90 | Docs say 20/22 agents and 5-6-agent fast mode; actual runtime activates 16/18/22 agents depending on mode backbone. |
| Prompt/memory bloat exceeds what runtime actually injects | 9 x 9 = 81 | Many memories are 20-44 KB, but agent-runner trims memory injection to 6 KB. |
| No single canonical sector/rule source | 9 x 8 = 72 | THYAO/aviation, IAS29, Chart.js, and sector heuristics appear across memory, prompts, formatter code, peer_sets, and docs. |
| QA / CEO gates are advisory in runtime, not hard blockers | 10 x 7 = 70 | executeSession logs warnings/overrides and continues after failed QA or approval checks. |
| Schema enforcement is weaker than platform doctrine claims | 8 x 8 = 64 | Shared universal contract exists, but runtime validator uses lightweight per-agent/text checks; many schemas lack minLength/minItems depth constraints. |
| Formatter doctrine is internally contradictory | 8 x 7 = 56 | system_prompt bans Chart.js and raw HTML generation; agent_spec still requires Chart.js and layout authority. |
| Output metric completeness is materially below doctrinal target | 9 x 6 = 54 | Sampled reports omit many working-capital / cash-conversion metrics; THYAO still misses aviation identity/KPIs. |
| Agent roster split-brain across filesystem, registry, and runtime code | 7 x 7 = 49 | Some agent folders are not in runtime registry, while some runtime agents drift against `agents_registry.json`. |
| Artifacts/backups/dumps dominate the repo surface | 6 x 8 = 48 | Output artifacts are 772,758 KB and 800+ files; agent folders also contain many backup/sample files. |
| Critical path is still long despite parallel phases | 7 x 6 = 42 | Approx runtime path from baseline: fast 49.9 min, standard 53.1 min, deep 59.5 min. |


## Highest-leverage 5 refactor candidates

| candidate | why |
| --- | --- |
| Create canonical ticker->sector YAML and replace runtime keyword heuristics | High leverage; fixes THYAO/industrial and removes repeated memory directives. |
| Make QA `overall_score` required and block delivery on explicit fail/revision | Runtime behavior aligns with doctrine quickly. |
| Prune/archival policy for `memory.md` + stop loading >6 KB memories silently | Immediate context reduction without quality loss. |
| Unify report formatter doctrine (agent_spec + prompt + compose.ts) | Removes Chart.js/SVG contradiction and stabilizes report expectations. |
| Mark agent roster truth source and reconcile runtime registry vs registry JSON | Stops orchestration/config drift. |


## Structural changes (strategic)

| candidate | why |
| --- | --- |
| Canonical rules/sectors/contracts directory | Single source of truth for metric doctrine, null handling, sector playbooks. |
| Manifest + retrieval pattern for large upstream outputs | Addresses lost-in-the-middle and prompt bloat root cause. |
| Cross-agent finding acknowledgement contract | Fixes QA loop leakage and silent downstream omissions. |
| True AJV validation gate + retry categorization middleware | Turns schema from documentation into runtime enforcement. |
| Golden-scorecard regression harness around final HTML/report quality | Protects depth while refactoring architecture. |


## Risk matrix

| change_area | primary_agents | risk |
| --- | --- | --- |
| Canonical sector mapping | context_extraction, financial_analysis, sector_competition, report_formatter | Medium |
| Shared contract hardening | qa_review, final_summary, strategic_synthesis, report_formatter | High |
| Memory purge / hierarchy | All agent prompts | Medium |
| Manifest retrieval | financial_analysis, qa_review, strategic_synthesis, final_summary, report_formatter | High |
| Pipeline mode rewrite | ceo, orchestrator, coo | Medium |


## Quick wins (<1 day, high leverage)

- **Create canonical ticker->sector YAML and replace runtime keyword heuristics** — High leverage; fixes THYAO/industrial and removes repeated memory directives.
- **Make QA `overall_score` required and block delivery on explicit fail/revision** — Runtime behavior aligns with doctrine quickly.
- **Prune/archival policy for `memory.md` + stop loading >6 KB memories silently** — Immediate context reduction without quality loss.
- **Unify report formatter doctrine (agent_spec + prompt + compose.ts)** — Removes Chart.js/SVG contradiction and stabilizes report expectations.
- **Mark agent roster truth source and reconcile runtime registry vs registry JSON** — Stops orchestration/config drift.

## Structural changes (>1 week, strategic)

- **Canonical rules/sectors/contracts directory** — Single source of truth for metric doctrine, null handling, sector playbooks.
- **Manifest + retrieval pattern for large upstream outputs** — Addresses lost-in-the-middle and prompt bloat root cause.
- **Cross-agent finding acknowledgement contract** — Fixes QA loop leakage and silent downstream omissions.
- **True AJV validation gate + retry categorization middleware** — Turns schema from documentation into runtime enforcement.
- **Golden-scorecard regression harness around final HTML/report quality** — Protects depth while refactoring architecture.

## Supporting observations

- Largest memory files: ceo 44.3 KB, context_extraction 31.6 KB, coo 31.2 KB, report_formatter 31.1 KB, parse_standardization 31.0 KB, technical_analysis 30.6 KB, financial_analysis 30.6 KB, kap_watch 29.6 KB
- Actual mode agent counts: fast=16, standard=18, deep=22
- Report sample showed ongoing sector/identity leakage (e.g. THYAO rendered as industrial) and inconsistent 12-section compliance.

---

## Phase 2 outcome (executed 2026-04-21)

Phase 2 landed the **read-only** parts of the roadmap on branch `refactor/phase-2-canonical`. Every runtime-behaviour change was deliberately deferred.

### Done

| ref | artefact | location |
| --- | --- | --- |
| A | Code-surface backup (pre-Phase 2) | `backups/pre_phase2_code_20260421_003120.tar.gz` |
| B | Golden regression harness + frozen baseline | `evals/golden/coverage_matrix.py`, `evals/golden/baseline_20260421.json` |
| C | Canonical truth source (18 files, 13 YAML + 5 MD) | `canonical/` |
| D | Canonical loader (Python + TS shim) with selftests | `canonical/_loader/` |
| E | Context-budget SQL migration (not applied) | `backend/src/migrations/phase2_context_budget.sql` |
| F | Runtime drift audit — 5 Codex claims verified | `refactor/inventory/runtime_drift_audit.md` |
| G | Roster three-way reconciliation | `refactor/inventory/roster_reconciliation.md` |
| H | Phase 2 summary | `refactor/reports/phase_2_summary.md` |

Regression status at end of Phase 2: **all 15 baseline reports meet or exceed the frozen baseline** (guarded signals unchanged; Phase 2 did not touch runtime so this is expected).

### Skipped — and why

| item | why skipped | phase target |
| --- | --- | --- |
| Hard QA `overall_score` gate | Changes delivery behaviour; Chairman-visible blast radius. Needs golden baseline + rollback switch in place first. | Phase 3 |
| Hard CEO approval gate | Same as QA gate + needs a product call on Chairman-override. | Phase 3 |
| Schema `minLength` / `minItems` hardening | AJV rejects existing outputs; needs a soft-mode flag + dry-run pass across the report catalog. | Phase 4 |
| Validation gate with retry routing | Runaway-retry risk without a failure taxonomy + context-budget logging first. | Phase 6 (after 4) |
| Manifest + retrieval contract | Biggest single breaking change; needs parallel-run smoke testing. | Phase 5 |
| Formatter Chart.js doctrine resolution | `canonical/rules/output_integrity.md#OI-007` declares SVG-only; product needs to confirm before rewriting the dissenting `agent_spec.json`. | Phase 3 |
| Memory purge to ≤ 2 KB per agent | Brief rule #5 requires canonical to prove itself in at least one live run before memories are stripped. Canonical now parallel; Phase 3 runs the proof. | Phase 3 |
| Memory.backup / single-shot artefact cleanup | Purely mechanical; waits for Phase 3 migrations so we don't delete files the prompt rewrite still references. | Phase 3 end |
| Rule compiler (Codex 7.1) | Premature — canonical is a day old. Build after 2-3 weeks of stable canonical edits. | Phase 2.5 |
| Provenance ledger (Codex 7.2) | Belongs inside Phase 4 schema hardening (`evidence_refs` extension). | Phase 4 |
| Roster promotion of `coo`/`valuation_agent`/`esg_agent`/`sentiment_news_agent`/`analyst_consensus_agent` | Product decision (shipped vs experimental). | Phase 3 pre-req |

### Four decisions needed from the user before Phase 3

1. **Hard gates or advisory gates?** `runtime_drift_audit.md` § Claim #1/#2 confirms QA and CEO gates today log warnings and continue. Phase 3 can flip either or both to hard blockers. Product call.
2. **Chart.js or SVG?** `OI-007` declares SVG-only. `agent_spec.json` of `report_formatter` still asks for Chart.js. One will be rewritten in Phase 3.
3. **Which of the 5 registry-missing agents are shipped?** `coo`, `valuation_agent`, `sentiment_news_agent`, `analyst_consensus_agent`, `esg_agent` — runtime uses them; registry does not. Each needs a shipped-vs-experimental label.
4. **Apply `phase2_context_budget.sql` now or during Phase 3?** Additive-only, zero runtime behaviour change, lights up observability. Recommend applying at Phase 3 kickoff.
