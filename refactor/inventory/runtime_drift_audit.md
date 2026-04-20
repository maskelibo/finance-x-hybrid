# Runtime Drift Audit

> Confirms or rejects runtime-behaviour claims raised by the Codex master prompt, via direct reading of `backend/src/orchestrator.ts`, `backend/src/agent-runner.ts`, `backend/src/analysis-config.ts`, and `backend/src/db.ts`.

- Generated: 2026-04-21
- Scope: runtime vs doctrine drift. Phase 1 Executive Summary v2 raised five specific claims. Each is now verified against source.

---

## Claim #1 — QA `overall_score` is advisory, not a hard blocker

**Status: CONFIRMED.**

`orchestrator.ts:1244` sets `MAX_QA_ROUNDS = 2`. Inside the QA revision loop:

```
orchestrator.ts:1308-1326
if (qaRound >= MAX_QA_ROUNDS) {
  console.warn(`[QA GATE] ${MAX_QA_ROUNDS} tur revision sonrası hâlâ geçemedi — UYARI ile devam ediliyor`);
  accumulatedContext['qa_warning'] = `QA ${MAX_QA_ROUNDS} turda onay veremedi. Rapor eksiklikler içerebilir.`;
  // CEO override post-mortem log ...
  break; // Block etme, devam et
}
```

So when QA refuses to approve after 2 revision rounds:

- A `WARNING` is logged to stdout.
- A post-mortem row is written to `ceo_activities` with `activity_type = 'ceo_override'`.
- The `qa_warning` string is injected into `accumulatedContext` so downstream agents *could* see it (they rarely act on it).
- `break` falls through to delivery.

**Doctrine says QA gate must block delivery on fail.** The runtime does not.

### Supporting detail — QA block keyword set (healthy)

`orchestrator.ts:1275-1281` does define a strict block keyword whitelist:

```
QA_BLOCK_KEYWORDS = [
  'revision_requested', 'rejected', 'reject', 'revision required',
  'fail', 'failed', 'block', 'blocked',
  'hard rejection', 'hard fail',
  'conditional_pass', 'condition_pass', 'koşullu geçiş', 'koşullu onay',
  'başarısız', 'reddedildi', 'revizyon gerekli', 'düzeltme gerekli',
];
```

`conditional_pass` being in the block list is correct (brief doctrine). But the effect of keywordBlock = true is only to loop back for revision — **up to two rounds**. After two, see Claim #1.

### Supporting detail — score-based blocking is implemented

`orchestrator.ts:1285-1294` parses `overall_score` / `qa_score` / `kalite_puanı` / `genel_puan` via regex, normalizes 0-10 to 0-1, and blocks when score < 0.75. This is an **additional** block trigger beyond keywordBlock — the intent is right. But the trigger still routes into the same 2-round revision loop, so Claim #1 still stands.

---

## Claim #2 — CEO approval gate is also advisory

**Status: CONFIRMED.**

`orchestrator.ts:1515-1536`:

```
if (approvalFailures.length > 0) {
  const warningMsg = `CEO APPROVAL UYARI — ${approvalFailures.length} eksiklik:\n...`;
  console.warn(`\n⚠️  [CEO APPROVAL GATE] ${warningMsg}\n`);
  // Block etme, uyarı ile devam et — rapor çıksın, Chairman değerlendirir
  accumulatedContext['ceo_approval_warning'] = warningMsg;
  // ceo_activities log ...
}
```

The inline comment is unambiguous: `// Block etme, uyarı ile devam et — rapor çıksın, Chairman değerlendirir` ("Do not block, continue with warning — let the report ship, Chairman evaluates").

Delivery path keeps going into `final_summary` and `report_formatter` regardless. This is a deliberate, commented-in behaviour, not an accidental silent failure.

**Doctrine says CEO gate must block institutional delivery.** Runtime does not.

---

## Claim #3 — Runtime mode pipelines are identical

**Status: CONFIRMED (already documented in pipeline_flow.md).**

`orchestrator.ts:229-233`:

```
const PIPELINE_BY_MODE: Record<RuntimeMode, string[]> = {
  fast_screening: AGENT_PIPELINE.map(a => a.id),
  standard_institutional: AGENT_PIPELINE.map(a => a.id),
  deep_dive: AGENT_PIPELINE.map(a => a.id),
};
```

All three modes resolve to the same full list. Differentiation happens via `MODE_DEFAULT_LAYERS` + `LAYER_AGENTS` (in `analysis-config.ts`) inside `buildPipelineForLayers()`.

### Actual mode agent counts (post-backbone + layer filter)

Verified via `canonical/_loader/python/loader.py --mode <mode>`:

| mode | activated | matches Codex claim? |
| --- | --- | --- |
| `fast_screening` | **16** agents | ✓ |
| `standard_institutional` | **18** agents | ✓ |
| `deep_dive` | **22** agents | ✓ |

Docs in `AGENTS.md` and `workflows/full_integrated_analysis.md` talk about "5-6 agents in fast mode" and "15 agents in standard" — those numbers are a **docs/runtime drift** dating back to before backbone logic was added.

---

## Claim #4 — `agent-runner.ts` caps memory at 6 KB while on-disk memories are 18–44 KB

**Status: CONFIRMED.**

`agent-runner.ts:101-102`:

```
 * Katman 1: memory.md (max 6KB) — Her çalışmada yüklenir. Kurallar, kontrol listeleri.
 * Katman 2: knowledge.md (max 8KB) — Agent ihtiyaç duyduğunda Read ile açar. Domain bilgisi.
```

Confirmed via earlier `agent_inventory.json`: actual `memory.md` sizes include `ceo=44.34`, `coo=31.24`, `context_extraction=31.56`, `report_formatter=31.10`, `parse_standardization=31.02`, `technical_analysis=30.60`, `financial_analysis=30.59`, `kap_watch=29.56`, etc. — all far over 6 KB.

The runner either (a) silently truncates to 6 KB (so the agent sees a different memory than what the file contains) or (b) the 6-KB note is aspirational and the whole file is injected (bloating prompts and killing cache hits). Either way, there is a drift between the on-disk doctrine and the runtime injection.

**Phase 2 artefact addressing this:** `backend/src/migrations/phase2_context_budget.sql` adds `prompt_memory_chars` and `memory_was_trimmed` columns so Phase 2.5 can measure which of (a) or (b) is happening.

---

## Claim #5 — Agent roster drift across three source surfaces

**Status: CONFIRMED (see `roster_reconciliation.md`).**

- `agents/` filesystem: 26 agent folders (excluding `_shared_knowledge_modules`, `_legacy_memory_archive`).
- `agents_registry.json`: 21 entries.
- `AGENT_PIPELINE` in `orchestrator.ts`: 22 entries.

Delta agents (exist in filesystem + runtime but missing from registry):

- `coo`
- `valuation_agent`
- `sentiment_news_agent`
- `analyst_consensus_agent`
- `esg_agent`

Delta agents (exist in registry but absent from `AGENT_PIPELINE`):

- `agent_factory`
- `agent_performance_review`
- `cost_performance_optimizer`

Details in `roster_reconciliation.md`.

---

## Implications for Phase 3+

The three highest-risk runtime drifts are **#1, #2, and #4**, in that order. They are not Phase 2 targets — they change delivery behaviour and require regression coverage. Phase 2 only DOCUMENTS them here and prepares the canonical + migration scaffolding needed to fix them safely:

- `canonical/contracts/pipeline_modes.yaml` — source of truth for mode → activation that Phase 3 can wire into `buildPipelineForLayers()`.
- `canonical/rules/confidence_taxonomy.md` + `canonical/rules/output_integrity.md` — definitions that Phase 3's hard QA gate will enforce.
- `phase2_context_budget.sql` — observability so Phase 2.5 can see whether a gate change causes cost / latency regression.

Do not attempt to flip the advisory gates to hard blockers without running `evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json` both before and after the change. That is the only safety net we have until Phase 10 regression tests land.
