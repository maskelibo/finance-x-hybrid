# Agent inventory — financial_analysis

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **219.30 KB** across 17 entries
- Red flags: `memory_bloat_30.59kb`, `canonicalizable_sections_15`, `system_prompt_heavy_38.4kb`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_9_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 4.4 | 75 | 2026-04-19T12:49:43Z |
| case_lessons.md | 3.46 | 81 | 2026-04-19T12:49:43Z |
| ceo_feedback_20260410.md | 7.44 | 257 | 2026-04-19T12:49:43Z |
| CHECKLIST_CRITICAL_METRICS.md | 5.22 | 190 | 2026-04-19T12:49:43Z |
| FEEDBACK_2026-04-10_ASELS.md | 2.44 | 80 | 2026-04-19T12:49:43Z |
| FEEDBACK_2026_04_10.md | 10.02 | 299 | 2026-04-19T12:49:43Z |
| FEEDBACK_TEMPLATE.md | 9.79 | 243 | 2026-04-19T12:49:43Z |
| knowledge.md | 7.08 | 164 | 2026-04-19T12:49:43Z |
| memory.backup.md | 1.11 | 31 | 2026-04-19T12:49:43Z |
| memory.md | 30.87 | 281 | 2026-04-19T12:49:43Z |
| memory_archive.md | 35.88 | 641 | 2026-04-19T12:49:43Z |
| output_schema.json | 10.36 | 223 | 2026-04-19T12:49:43Z |
| permanent_rules.md | 3.18 | 47 | 2026-04-19T12:49:43Z |
| reference_manual.md | 43.4 | 817 | 2026-04-19T12:49:43Z |
| review_rubric.md | 1.67 | 41 | 2026-04-19T12:49:43Z |
| system_prompt.md | 39.11 | 729 | 2026-04-19T12:49:43Z |
| test_cases.json | 3.87 | 115 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **38.4 KB**, 729 lines
- Headings: H1=1, H2=18, H3+=26
- Bullets: 227 · Code blocks: 12 · Rule-marker lines (ZORUNLU/YASAK/must/never): **59**

## knowledge.md

- Size: **6.92 KB**, 164 lines
- Headings: H1=1, H2=7, H3+=11
- Bullets: 34 · Code blocks: 0 · Rule-marker lines: 4

## memory.md

- Size: **30.59 KB**, 281 lines
- Feedback dates found: 4 → 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **57** · Migration-candidate headings: 15
- Canonical-rule hints present: THYAO×41, TUPRS×4, KCHOL×4, ASELS×7, EREGL×2, TCELL×4, SAHOL×1, BIMAS×1, IAS 29×16, IAS29×10, EBITDAR×33, aviation×9, havacılık×18, çelik×3, banka×1, telecom×1, telekom×6, holding×9, defense×2, savunma×8, proxy×20, sektör override×4
- Top repeated tokens (len≥6, freq≥5): ebitda×47, ebitdar×33, metrics×27, sektör×20, eksikler×17, chairman×17, revenue×16, bundan×16, havacılık×16, tahmini×16

- `memory.backup.md` present: **1.11 KB**
- `memory_archive.md` present: **35.88 KB**
## output_schema.json

- Size: **10.15 KB** · max nesting depth: 4
- Required (top level): 12
- Required (recursive sum): 66
- Properties (recursive): 123
- Enum/const usage: 10
- minLength fields: **0** · minItems fields: 0
- $ref usages: 49

## agent_spec.json

- Size: **4.33 KB**
- Inputs: reconciled_financial_data, parse_standardization_output, context_extraction_output
- Outputs: financial_analysis_output
- Tools: ratio_calculator, trend_analyzer, non_recurring_identifier, inflation_accounting_adjuster, evidence_formatter
- Handoff rules: 4 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 3 · KPIs: 4

## Extra / non-canonical doc files in this agent folder

- `CHECKLIST_CRITICAL_METRICS.md`
- `FEEDBACK_2026-04-10_ASELS.md`
- `FEEDBACK_2026_04_10.md`
- `FEEDBACK_TEMPLATE.md`
- `case_lessons.md`
- `ceo_feedback_20260410.md`
- `permanent_rules.md`
- `reference_manual.md`
- `review_rubric.md`
