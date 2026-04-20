# Phase 3 Readiness Checklist

> What Phase 3 can and cannot start without user input. Every "decision needed" below is a concrete, binary or multi-choice product question — not a technical research task.

- Generated: 2026-04-21
- Prerequisite: Phase 2 landed on branch `refactor/phase-2-canonical` with canonical/ parallel + golden baseline frozen.

---

## Decisions needed from the user

### 1. QA gate behaviour

**Question.** Should `qa_review` failing after `MAX_QA_ROUNDS = 2` **block** delivery, or **warn-and-continue** as today?

Reference: `refactor/inventory/runtime_drift_audit.md` § Claim #1.

| choice | description | Phase 3 action |
| --- | --- | --- |
| **A — hard block (recommended)** | Pipeline halts, session status becomes `qa_blocked`, no report written, dashboard shows block with reason. | Flip `break` → `return 'qa_blocked'` at `orchestrator.ts:1325`; add session-status enum value; add dashboard surface for the status. |
| **B — warn-and-continue (status quo)** | Report ships with `qa_warning` stamp; Chairman manually decides. | No code change; doctrine updates to describe warning-only semantics explicitly. |
| **C — mode-dependent** | Hard block in `deep_dive`; warn-and-continue in `fast_screening`. | Adds a `qa_gate_mode` per runtime mode to `canonical/contracts/pipeline_modes.yaml`. |

**My recommendation:** A. Institutional rubric's entire purpose is blocking delivery below a quality floor. Option C is a soft middle ground if you want fast_screening to stay loose.

### 2. CEO approval gate

**Question.** Should `approvalFailures > 0` in the CEO approval gate block delivery, or warn-and-continue as today?

Reference: `runtime_drift_audit.md` § Claim #2.

| choice | Phase 3 action |
| --- | --- |
| **A — hard block** | Flip `orchestrator.ts:1515-1536` to `return 'ceo_blocked'`; mirror dashboard surface. |
| **B — Chairman override** | Block by default, but expose a "Chairman override" button on the dashboard that re-runs delivery with `approval_failures_overridden = true`. |
| **C — warn-and-continue (status quo)** | No code change. |

**My recommendation:** B. Block by default protects institutional quality; Chairman override keeps human escape hatch visible.

### 3. Chart.js vs SVG

**Question.** Final chart technology policy. `canonical/rules/output_integrity.md#OI-007` currently declares SVG-only; `agents/report_formatter/agent_spec.json` still asks for Chart.js; `AGENTS.md` and `html-to-pdf.mjs` both ban Chart.js.

| choice | Phase 3 action |
| --- | --- |
| **A — SVG only (current canonical)** | Rewrite `agents/report_formatter/agent_spec.json` to remove Chart.js references; strip Chart.js CDN from templates; enforce in `compose.ts`. |
| **B — Chart.js only** | Rewrite `OI-007`; remove Chart.js ban from `AGENTS.md`; relax `html-to-pdf.mjs` check. |
| **C — SVG for reports, Chart.js for dashboard** | Split: report formatter stays SVG (current canonical), dashboard frontend may use Chart.js. Update `OI-007` to be explicit about report vs dashboard scope. |

**My recommendation:** A or C. B requires re-enabling CDN dependency in PDF rendering, which has known layout fragility.

### 4. Registry-missing agent status

**Question.** Are these five agents **shipped** (first-class) or **experimental**?

Reference: `refactor/inventory/roster_reconciliation.md`.

| agent | filesystem | runtime | registry | decision needed |
| --- | :---: | :---: | :---: | --- |
| `coo` | ✓ | ✓ (backbone) | ✗ | shipped ✓ / experimental ✗ |
| `valuation_agent` | ✓ | ✓ (deep_dive) | ✗ | shipped ✓ / experimental ✗ |
| `sentiment_news_agent` | ✓ | ✓ (deep_dive) | ✗ | shipped ✓ / experimental ✗ |
| `analyst_consensus_agent` | ✓ | ✓ (deep_dive) | ✗ | shipped ✓ / experimental ✗ |
| `esg_agent` | ✓ | ✓ (deep_dive) | ✗ | shipped ✓ / experimental ✗ |

**Phase 3 action per choice:**
- **shipped** → promote to `agents_registry.json` with proper `reports_to`/`supervises`; add to `agent_performance_review.monitors[]`.
- **experimental** → move folder to `agents/_experimental/<id>/`; remove from `AGENT_PIPELINE`; skip in all three modes.

**My recommendation:** `coo` is definitely shipped (backbone). The other four — runtime uses them in deep_dive; suggest shipped if deep_dive is a shipped mode, else move to `_experimental/`.

### 5. Apply context budget migration now or later?

**Question.** Run `sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql` now?

| choice | implication |
| --- | --- |
| **A — apply now** | Columns exist but stay NULL until Phase 2.5 instruments `agent-runner.ts`. No risk. |
| **B — apply at Phase 3 start** | Same net effect, one extra day of unobservable runs. |

**My recommendation:** A. Migration is additive + reversible via tarball backup; the sooner the columns exist, the sooner Phase 2.5 can start populating them opportunistically.

---

## Unblocked Phase 3 work (can proceed without any of the above)

The following Phase 3 items can start immediately, since they only touch prompt / doctrine files that already have canonical equivalents:

### Phase 3.0 — Prompt lint gate
Wire `refactor/tools/prompt_memory_lint.py` into a pre-commit or pre-PR check that fails on any `size_hard` category finding. This alone prevents further memory/prompt bloat accretion.

Current baseline: **20 hard-cap failures, 27 soft-cap, 130 canonical-candidate info notes** (see `refactor/inventory/lint_baseline_20260421.txt`).

### Phase 3.1 — Pilot agent prompt rewrite
Pick one agent (recommended: `financial_analysis`, highest leverage + most documented canonical references) and rewrite its `system_prompt.md` to reference `canonical/` ids instead of restating doctrine. Keep original as `system_prompt.original.md` for side-by-side validation until a golden run confirms no regression.

Success criterion: prompt drops below 10 KB, selftests still pass, one full `standard_institutional` run produces ≥ baseline scores.

### Phase 3.2 — Sector override sanity check
Add one-line call to `canonical._loader.python.loader.get_sector(ticker)` at `backend/src/orchestrator.ts:startAnalysisSession` (via subprocess) and log the resolved sector. No behaviour change — just ensures the canonical resolver is exercised on every run, so stale mappings surface immediately.

### Phase 3.3 — `agent_performance_review.monitors[]` expansion
Extend the `monitors[]` array in `agents_registry.json` to cover `valuation_agent`, `esg_agent`, `sentiment_news_agent`, `analyst_consensus_agent`. Pure JSON edit; no runtime behaviour change. Requires decision #4 first, though — if agents are moved to `_experimental/`, don't add them.

### Phase 3.4 — Docs alignment with runtime
Rewrite agent-count sections in `AGENTS.md` and `workflows/full_integrated_analysis.md` to match `canonical/contracts/pipeline_modes.yaml` (fast=16, standard=18, deep=22). Small edits; removes a public doctrine drift surface.

---

## Blocked-on-decisions Phase 3 work

| item | blocked on | ready when |
| --- | --- | --- |
| Flip QA gate to hard block | #1 | user chooses A / B / C |
| Flip CEO approval to hard block | #2 | user chooses A / B / C |
| Rewrite `report_formatter/agent_spec.json` for chart policy | #3 | user chooses A / B / C |
| Promote 5 agents into registry OR move to `_experimental/` | #4 | user chooses shipped / experimental for each |

All four can be answered in a single review pass since each is binary-ish and reference docs exist.

---

## Phase 3 kickoff gates

Before any Phase 3 change touches production code:

1. ✅ Golden baseline pinned — `evals/golden/baseline_20260421.json`
2. ✅ Canonical truth source in parallel — `canonical/`
3. ✅ Runtime drift inventoried — `refactor/inventory/runtime_drift_audit.md`
4. ✅ Code-surface backup — `backups/pre_phase2_code_20260421_003120.tar.gz`
5. ⏳ User decisions #1-#4 answered
6. ⏳ `phase2_context_budget.sql` applied (decision #5) — enables Phase 3 regression observability
7. ⏳ Fresh `pre_phase3_code_*.tar.gz` tarball

Items 1-4 are done. Items 5-7 are the go-button for Phase 3.
