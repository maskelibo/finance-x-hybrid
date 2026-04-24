# Pre-Part-2 Checkpoint Report

**Date:** 2026-04-24
**Branch:** `finance-x-execution`
**Tip of branch:** `c936d0ff`

Part 1 was closed at `46fdf055` (2026-04-23). Between that and FAZ S1 start, a
bug-sweep cycle was executed against the 4 U5 evidence agents because their
live citation production had never been end-to-end verified on a real pipeline
run. This document closes that cycle.

---

## Scope of this checkpoint

Not a new block. This is the "pre-Part-2 cleanup" that landed between Part 1
exit and FAZ S1 start. It covers:

1. BIMAS 28-fix bug sweep (commit `19facdaf`) — residual bugs from Part 1 that
   only surfaced once real reports were being produced end-to-end
2. U5 live validation — 3-bug sweep on the evidence-driven agents
3. Part 2 master plan import

---

## Bug sweep results

### Bug #1 — knowledge layer default (fixed: `0e9e46a7`)
**Root cause:** `analysis-config.ts:33` — `standard_institutional` default
layer list excluded `knowledge`. The 4 U5 agents (document_evidence,
external_research, research_brief, knowledge_base) only ran when the caller
explicitly passed `layers: [...,"knowledge"]` or runtime_mode was `deep_dive`.

**Evidence:** BIMAS 2026-04-24 00:23 (session `mHfZoDyC1GgOYopZPJOmj`) —
18 agent rows, 0 U5. BIMAS 2026-04-24 15:47 after fix — 22 agent rows,
`selected_layers` auto-included `knowledge`.

### Bug #2 — THYAO pending U5 rows (timing artifact, no code fix)
**Root cause:** THYAO session `tq4OK1p7GEw1H2MVTWNaQ` started 2026-04-23
18:19:35 — 40 minutes before U5 code landed (`410a2147` at 18:59:52). The
session's pipeline was computed with the pre-U5 `buildPipelineForLayers`,
so 4 U5 rows never got inserted at create time. A later pipeline-migration
pass inserted them as `pending`, but by then the execution loop was past
the Knowledge Retrieval phase.

**Verification:** EREGL (U5+8min later) and ARCLK (U5+1h30 later) both ran
4 U5 agents to completion — hypothesis confirmed. No code fix needed; ops
rule: session start time ≥ code merge time.

### Bug #3 — JSON output protocol bypass (fixed: `adab3c6e`)
**Root cause:** All 4 U5 agents performed tool calls correctly (retrieval,
memory updates, skill triggers) but wrote a Turkish conversational summary
as their final assistant message instead of the required JSON envelope.

**BIMAS 2026-04-24 empirical measurements (session `FPFoOvYZYSUfw33WFY6mT`):**

| Agent              | Duration | Output bytes | Expected bytes   |
|---                 |---:      |---:          |---:              |
| research_brief     | 2 min    | 256          | 5,000–15,000     |
| knowledge_base     | 14 min   | 721          | 20,000–30,000    |
| document_evidence  | 7 min    | 620          | 10,000–25,000    |
| external_research  | 13 min   | 2,563        | 5,000–20,000     |

Typical bypass pattern observed: *"Memory güncellendi. Retrieval tamamlandı.
--- ## Özet 7/7 sub_question için kanıt toplandı..."* — no JSON block.

**Fix:** Appended a strict `## ÇIKTI PROTOKOLÜ (KATI — TÜM DİĞER KURALLARIN
ÜSTÜNDE)` section to each of the 4 prompts, with forbidden examples pulled
directly from the BIMAS regression and an explicit byte-size floor. Prompts
are read fresh by `loadAgent` at session start (no cache), so backend
restart is not required.

**ARCLK previously-observed exception:** on 2026-04-23 the same 4 agents also
produced summaries under 700 bytes. That was NOT a ticker-specific issue —
BIMAS reproduced it identically. EREGL 2026-04-23 was the sole session where
knowledge_base produced 25k of structured JSON with 7 evidence entries; its
behaviour was the target to match.

---

## Verification in progress (task #80)

3 sessions launched at 2026-04-24 17:03 with the prompt fix applied:

- THYAO: `gHiKhzgtibbp3zJRbI6Cv`
- ARCLK: `-GYVP6rDN0MQyI1HKwE8_`
- EREGL: `OlowvziHH2ApthenXAqHI`

Success criterion: each U5 agent output must be ≥5,000 bytes and must contain
a parseable JSON envelope with the required schema fields (evidence[] /
claims[] / findings[] / sub_questions as applicable).

---

## Part 2 plan import

`docs/plans/PART2_EXECUTION_PLAN.md` (345 KB, 10,010 lines) — imported at
commit `c936d0ff`. Block S + Block P, 32 phases total, with mandatory 5-step
cycle per phase.

---

## Exit state (ready for FAZ S1)

| Item                             | State |
|---                               |---    |
| Part 1 officially closed         | ✅    |
| BIMAS 28-fix bug sweep committed | ✅    |
| Bug #1 (knowledge layer default) | ✅    |
| Bug #2 (timing artifact)         | ✅ (no fix needed) |
| Bug #3 (JSON protocol)           | ✅ fix committed; verification pending |
| Part 2 plan imported             | ✅    |
| Auto-memory updated              | ✅    |
| Ready for FAZ S1                 | ✅ (after task #80 green) |

Next: FAZ S1 — Sub-Agent Infrastructure. Benchmark: KCHOL.
