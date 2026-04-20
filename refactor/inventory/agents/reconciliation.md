# Agent inventory — reconciliation

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **113.74 KB** across 13 entries
- Red flags: `memory_bloat_28.13kb`, `canonicalizable_sections_16`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_5_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.32 | 62 | 2026-04-19T12:49:43Z |
| case_lessons.md | 7.14 | 77 | 2026-04-19T12:49:43Z |
| fallback_policy.md | 0.64 | 13 | 2026-04-19T12:49:43Z |
| knowledge.md | 7.11 | 200 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.95 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 28.38 | 262 | 2026-04-19T12:49:43Z |
| memory_archive.md | 21.52 | 344 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.75 | 52 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 14.12 | 310 | 2026-04-19T12:49:43Z |
| reference_manual.md | 11.8 | 270 | 2026-04-19T12:49:43Z |
| review_rubric.md | 0.71 | 14 | 2026-04-19T12:49:43Z |
| system_prompt.md | 13.32 | 311 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.98 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **13.02 KB**, 311 lines
- Headings: H1=1, H2=10, H3+=13
- Bullets: 46 · Code blocks: 8 · Rule-marker lines (ZORUNLU/YASAK/must/never): **22**

## knowledge.md

- Size: **6.92 KB**, 200 lines
- Headings: H1=1, H2=16, H3+=5
- Bullets: 53 · Code blocks: 3 · Rule-marker lines: 11

## memory.md

- Size: **28.13 KB**, 262 lines
- Feedback dates found: 4 → 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **38** · Migration-candidate headings: 16
- Canonical-rule hints present: THYAO×29, TUPRS×1, KCHOL×8, ASELS×4, EREGL×8, TCELL×5, SAHOL×1, BIMAS×1, IAS 29×9, IAS29×7, havacılık×12, banka×4, telekom×1, holding×6, savunma×2, proxy×2
- Top repeated tokens (len≥6, freq≥5): skipped×34, downstream×29, reconciliation×27, finansal×26, yapılmadı×24, eskalasyon×23, ebitda×21, kontrol×20, gerçek×20, standardization×19

- `memory.backup.md` present: **0.95 KB**
- `memory_archive.md` present: **21.52 KB**
## output_schema.json

- Size: **2.7 KB** · max nesting depth: 3
- Required (top level): 11
- Required (recursive sum): 18
- Properties (recursive): 31
- Enum/const usage: 5
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **3.26 KB**
- Inputs: parsed_statements_set, data_manifest, task_context
- Outputs: reconciled_dataset
- Tools: discrepancy_detector, source_priority_resolver, materiality_calculator, escalation_router
- Handoff rules: 3 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `fallback_policy.md`
- `output_SISE_20260410.json`
- `reference_manual.md`
- `review_rubric.md`
