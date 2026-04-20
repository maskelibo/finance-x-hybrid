# Phase 2 Summary — Canonical Truth Source + Regression Safety

- Branch: `refactor/phase-2-canonical`
- Started from: `refactor-phase-1-inventory`
- Date: 2026-04-21
- Mode: autonomous overnight, user-authorized
- Risky items: **skipped**, catalogued in Phase 2 "Not Done — And Why"

## What landed

### A — Backup + branch
- `backups/pre_phase2_code_20260421_003120.tar.gz` (567 files, 1.5 MB code surface; excludes `output/`, `node_modules/`, `.git/`).
- Feature branch `refactor/phase-2-canonical` cut from `refactor-phase-1-inventory`.

### B — Golden baseline harness
- `evals/golden/coverage_matrix.py` — regression harness scoring 15 pinned reports on 28 metric presence, sector KPI coverage, CoE/IAS29/truncation/benchmark/counter-argument markers.
- `evals/golden/baseline_20260421.json` — frozen scores.
- `evals/golden/README.md` — how to use, what the regressions mean.
- Baseline numbers at freeze: **232 / 420 metric presences (55.2%)**, **0 / 15 CoE**, **6 / 15 IAS29 mentioned**, worst truncation KCHOL_20260414 @ 143 markers. Phase 3+ commits must not regress any of these per-report.

### C — Canonical skeleton
Everything under `canonical/` — single source of truth. **No agent is wired to it yet**; it is kept in parallel so Phase 3 can migrate prose rules in with side-by-side validation.

| file | content |
| --- | --- |
| `canonical/README.md` | Hierarchy (Global > Sector > Agent Prompt > Memory), id scheme. |
| `canonical/tickers/sector_mapping.yaml` | 25 tickers hardcoded with sector + playbook path + notes. Silent "industrial" fallback is now forbidden. |
| `canonical/rules/mandatory_metrics.yaml` | 28-metric catalog with formula, required_inputs, benchmark_required, interpretation_required, sector_variants, null_proxy. Includes `interpretation_depth` char-floor table used by Phase 4 schema hardening. |
| `canonical/rules/null_handling_protocol.md` | NH-001..NH-006 — escalation ladder, proxy hierarchy, BLOCKED protocol, naked-number prohibition, downstream acknowledgement. |
| `canonical/rules/confidence_taxonomy.md` | CT-001..CT-006 — HIGH/MEDIUM/LOW/BLOCKED definitions + `confidence_overall = min(per-metric)` aggregation rule. |
| `canonical/rules/output_integrity.md` | OI-001..OI-008 — truncation ban, engine_snapshot ⊆ metrics_array, 12-section mandate, evidence citation, forbidden sources, SVG-only chart policy (resolves Chart.js contradiction), emoji/agent-meta ban. |
| `canonical/rules/ias29_protocol.md` | IAS29-001..IAS29-006 — when to apply, mandatory separate table, CPI source hierarchy, common mistakes, sector sensitivities. |
| `canonical/sectors/aviation.yaml` | THYAO/PEGYS/ONUIR — EBITDAR primary, CASK/RASK/LF/RPK/ASK/Yield mandatory, IFRS 16 pre/post required, fuel transmission parameter. |
| `canonical/sectors/steel.yaml` | EREGL/KRDMD/ISDMR — growth vs maintenance CAPEX split mandatory, HRC + iron-ore transmission parameters, DIO emphasis. |
| `canonical/sectors/banking.yaml` | AKBNK/GARAN/ISCTR/YKBNK — NIM decomposition, CAR waterfall, Cost of Risk, fee-income breakdown. |
| `canonical/sectors/telecom.yaml` | TCELL/TTKOM — ARPU/churn/SAC/LTV/CAPEX intensity/5G premium. |
| `canonical/sectors/defense.yaml` | ASELS/ROKET/FNSS — backlog/revenue, R&D/revenue, export ratio, FX exposure. |
| `canonical/sectors/retail.yaml` | BIMAS/MGROS/SOKM — SSSG decomposition, Revenue/Store, IFRS 16 normalize, payables-float commentary. |
| `canonical/sectors/holding.yaml` | KCHOL/SAHOL/DOHOL — three-layer parent/consolidated/segment mandate, SOTP/NAV/discount. |
| `canonical/sectors/energy_refining.yaml` | TUPRS — refining margin USD/bbl, crack spread, crude differential, inventory gain/loss. |
| `canonical/sectors/industrial_generic.yaml` | fallback for unclassified tickers + PETKM/FROTO/TOASO/ARCLK/SISE. |
| `canonical/contracts/pipeline_modes.yaml` | Source-of-truth for mode → activation list. Documents the runtime drift (docs claim fast=5-6, actual=16; standard≈15, actual=18; deep=20-22, actual=22). |
| `canonical/contracts/agent_io_contracts.yaml` | Per-agent IO summary across 26 agents, flags the 5 registry-missing agents. |
| `canonical/glossary/terms.md` | EBITDA/EBITDAR/CCC/ROE/ROCE/ROIC/NIM/CoR/CAR/ARPU/churn/SAC/LTV/CASK/RASK/LF/SSSG/SOTP/NAV definitions. |
| `canonical/glossary/abbreviations.md` | 60+ abbreviation table (TR + EN). |

All 13 YAML files parse clean via `yaml.safe_load`.

### D — Canonical loader
- `canonical/_loader/python/loader.py` — `Canonical` class + CLI (`--ticker`, `--metric`, `--mode`, `--agent`, `--selftest`). **Selftest passes 15/15.**
- `canonical/_loader/ts/loader.ts` — thin subprocess shim over the Python CLI (keeps backend/package.json untouched). Exports `getSector`, `getTickerInfo`, `getMetric`, `getModeActivation`, `getAgentContract`, `selftest`.
- `canonical/_loader/ts/loader.test.cjs` — Node smoke test. **Passes 6/6.**

### E — Context budget logging (prepared, NOT applied)
- `backend/src/migrations/phase2_context_budget.sql` — ALTER TABLE additions on `agent_runs` (13 new nullable columns + 3 indexes).
- `backend/src/migrations/README.md` — application procedure.
- Validated against a stub SQLite db (`python -c …` script in commit history); 13/13 columns and 3/3 indexes land cleanly.
- **Not executed.** Runtime is untouched.

### F — Runtime drift audit
- `refactor/inventory/runtime_drift_audit.md` — five Codex claims verified line-by-line against `orchestrator.ts`:
  - Claim #1 (QA gate advisory): **CONFIRMED** (orchestrator.ts:1308-1326 `break; // Block etme, devam et`).
  - Claim #2 (CEO approval gate advisory): **CONFIRMED** (orchestrator.ts:1515-1536 `// Block etme, uyarı ile devam et`).
  - Claim #3 (pipeline modes identical): **CONFIRMED** (orchestrator.ts:229-233 `AGENT_PIPELINE.map(a => a.id)` ×3).
  - Claim #4 (6 KB memory cap vs 18-44 KB on disk): **CONFIRMED** (agent-runner.ts:101-102 note).
  - Claim #5 (roster three-way drift): **CONFIRMED** (see G).

### G — Roster reconciliation
- `refactor/inventory/roster_reconciliation.md` — three-way diff:
  - **Filesystem + runtime, NOT registry**: `coo`, `valuation_agent`, `sentiment_news_agent`, `analyst_consensus_agent`, `esg_agent`.
  - **Registry, NOT runtime pipeline (utility-meta, expected)**: `agent_factory`, `agent_performance_review`, `cost_performance_optimizer`, `orchestrator`.
- Phase 3 recommendation: adopt `canonical/contracts/agent_io_contracts.yaml` as truth, promote the five registry-missing agents with product sign-off, add pre-boot validation in orchestrator.

## Tests run (pass/fail)

| test | result |
| --- | --- |
| `yaml.safe_load` on all 13 canonical YAMLs | 13 / 13 OK |
| `python canonical/_loader/python/loader.py --selftest` | 15 / 15 OK |
| `node canonical/_loader/ts/loader.test.cjs` | 6 / 6 OK |
| stub-sqlite migration apply | 13 cols + 3 indexes present, 0 missing |
| `python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json` | all 15 reports OK (no regression) |

## Not Done — And Why (risky items deferred)

Phase 2 deliberately does **not** touch any runtime behaviour. The following items from the combined brief + Codex additions are known high-value but require coverage/regression support that only Phase 2 landed today; they belong in Phase 3/4 with the golden baseline acting as the floor.

| skipped | why deferred | phase target |
| --- | --- | --- |
| **Hard QA gate** — turn advisory continue into hard block on `overall_score < 0.75` or unaddressed findings | Changes delivery behaviour directly. Without baseline proving today's output quality, you can't tell if the block is rescuing or suppressing information. Golden harness exists now, but Phase 3 must also add a rollback switch. | Phase 3 |
| **Hard CEO approval gate** — turn `approvalFailures > 0` into block, not just warning | Same reason as QA gate. Additionally needs a product decision on "what if CEO blocks but Chairman wants the report anyway". | Phase 3 |
| **Schema `minLength` / `minItems` hardening** (interpretation depth, addressed_findings equality, metrics_array ≥ 28) | AJV will reject existing output shapes. Needs a "soft mode" flag + a run-the-catalog migration pass to see how many reports would fail. | Phase 4 |
| **Validation gate with retry routing** (Codex 7.4) | Runaway-retry risk without a well-defined failure taxonomy and budget. Need context_budget logging to be live first so we can see the retry cost. | Phase 6 (after 4) |
| **Manifest + retrieval contract** (brief Phase 5) | Contract change on every analytic agent's output. Biggest single breaking change in the roadmap. Needs parallel-run smoke testing. | Phase 5 |
| **Formatter Chart.js resolution** | Product decision: Chart.js or SVG? Brief + `AGENTS.md` + `system_prompt` + `html-to-pdf.mjs` say SVG; `agent_spec.json` says Chart.js. Canonical `OI-007` declares SVG-only, but the dissenting file needs a human gate before rewrite. | Phase 3 |
| **Memory purge to ≤2 KB per agent** | Brief rule #5 requires canonical files to be kept in parallel and proven working via at least one test report run before deleting. Canonical is now in parallel; Phase 3 runs the proof. | Phase 3 |
| **Dead code / memory.backup.md deletion (17 files)** | Needs a second backup tarball + a "proven not referenced" audit that includes the runtime. Easy cleanup, but not worth doing before Phase 3's prompt rewrite lands. | Phase 3 end / Phase 4 start |
| **Rule compiler** (Codex 7.1) | Premature per my own advice. Canonical files are one day old; compiler built now would have no stable ground to compile against. | Phase 2.5 after canonical stabilizes |
| **Provenance ledger** (Codex 7.2) | Extends `evidence_refs`; belongs inside Phase 4 schema hardening, not its own phase. | Phase 4 |
| **Runtime roster promotion of 5 agents** | Product decision, not a technical refactor. | Phase 3 pre-req |

## Next-turn action for the user

1. Read `refactor/inventory/runtime_drift_audit.md` — especially Claims #1 and #2. These are the most load-bearing trust issues and fixing them requires your product decision on "do we actually want hard blocks".
2. Read `refactor/inventory/roster_reconciliation.md` § "Deferred decisions requiring human input" — five agents need a shipped-vs-experimental label.
3. Decide whether to apply `phase2_context_budget.sql` now or during Phase 3. My recommendation: apply now, because it only adds nullable columns and lights up observability for every Phase 3+ change.
4. Review the Chart.js contradiction (`canonical/rules/output_integrity.md#OI-007` declares SVG-only) and confirm. Once confirmed, Phase 3 rewrites `agent_spec.json` to match.

After these four, Phase 3 is unblocked.
