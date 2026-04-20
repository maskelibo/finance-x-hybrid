# Agent inventory — macro_analysis

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **148.34 KB** across 14 entries
- Red flags: `memory_bloat_20.39kb`, `canonicalizable_sections_10`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_6_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.86 | 52 | 2026-04-19T12:49:43Z |
| case_lessons.md | 18.13 | 190 | 2026-04-19T12:49:43Z |
| ceo_feedback_20260410.md | 7.92 | 305 | 2026-04-19T12:49:43Z |
| CHECKLIST_GEOPOLITICAL.md | 5.67 | 191 | 2026-04-19T12:49:43Z |
| FEEDBACK_2026-04-10_ASELS.md | 9.38 | 228 | 2026-04-19T12:49:43Z |
| FEEDBACK_2026_04_10.md | 12.94 | 353 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.35 | 140 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.94 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 20.6 | 220 | 2026-04-19T12:49:43Z |
| memory_archive.md | 33.25 | 521 | 2026-04-19T12:49:43Z |
| output_schema.json | 3.62 | 89 | 2026-04-19T12:49:43Z |
| reference_manual.md | 12.44 | 259 | 2026-04-19T12:49:43Z |
| system_prompt.md | 13.39 | 281 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.85 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **13.12 KB**, 281 lines
- Headings: H1=1, H2=14, H3+=10
- Bullets: 66 · Code blocks: 2 · Rule-marker lines (ZORUNLU/YASAK/must/never): **21**

## knowledge.md

- Size: **5.21 KB**, 140 lines
- Headings: H1=1, H2=7, H3+=15
- Bullets: 39 · Code blocks: 1 · Rule-marker lines: 4

## memory.md

- Size: **20.39 KB**, 220 lines
- Feedback dates found: 3 → 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **41** · Migration-candidate headings: 10
- Canonical-rule hints present: THYAO×39, TUPRS×2, KCHOL×4, ASELS×8, EREGL×6, EBITDAR×3, havacılık×13, çelik×8, telekom×1, holding×4, savunma×10, proxy×2
- Top repeated tokens (len≥6, freq≥5): etkisi×40, jeopolitik×32, maliyeti×26, ebitda×24, impact×18, tablosu×18, summary×15, üretilmedi×15, websearch×14, havacılık×13

- `memory.backup.md` present: **0.94 KB**
- `memory_archive.md` present: **33.25 KB**
## output_schema.json

- Size: **3.53 KB** · max nesting depth: 4
- Required (top level): 10
- Required (recursive sum): 15
- Properties (recursive): 47
- Enum/const usage: 6
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **2.8 KB**
- Inputs: task_context, macro_data_feed, context_extraction_output
- Outputs: macro_analysis_output
- Tools: tcmb_data_client, tuik_data_client, fx_rate_fetcher, bddk_data_client
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 2

## Extra / non-canonical doc files in this agent folder

- `CHECKLIST_GEOPOLITICAL.md`
- `FEEDBACK_2026-04-10_ASELS.md`
- `FEEDBACK_2026_04_10.md`
- `case_lessons.md`
- `ceo_feedback_20260410.md`
- `reference_manual.md`
