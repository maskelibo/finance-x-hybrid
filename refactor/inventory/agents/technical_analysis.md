# Agent inventory — technical_analysis

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **114.63 KB** across 11 entries
- Red flags: `memory_bloat_30.6kb`, `feedback_log_style_7_dates`, `canonicalizable_sections_18`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_3_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.82 | 48 | 2026-04-19T12:49:43Z |
| case_lessons.md | 18.13 | 171 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.37 | 135 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.98 | 31 | 2026-04-19T12:49:43Z |
| memory.md | 30.92 | 323 | 2026-04-19T12:49:43Z |
| memory_archive.md | 23.42 | 424 | 2026-04-19T12:49:43Z |
| output_schema.json | 3.55 | 83 | 2026-04-19T12:49:43Z |
| permanent_rules.md | 2.86 | 57 | 2026-04-19T12:49:43Z |
| system_prompt.md | 4.6 | 125 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.63 | 29 | 2026-04-19T12:49:43Z |
| thyao_output_20260413.json | 20.35 | 376 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **4.47 KB**, 125 lines
- Headings: H1=1, H2=9, H3+=6
- Bullets: 30 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **12**

## knowledge.md

- Size: **5.24 KB**, 135 lines
- Headings: H1=1, H2=7, H3+=16
- Bullets: 57 · Code blocks: 0 · Rule-marker lines: 3

## memory.md

- Size: **30.6 KB**, 323 lines
- Feedback dates found: 7 → 2026-04-11, 2026-04-12, 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **41** · Migration-candidate headings: 18
- Canonical-rule hints present: THYAO×46, TUPRS×2, KCHOL×11, ASELS×3, EREGL×5, TCELL×6, SAHOL×2, BIMAS×4, IAS29×1, aviation×1, havacılık×10, çelik×2, banka×1, telekom×1, savunma×4, proxy×2
- Top repeated tokens (len≥6, freq≥5): teknik×63, insider×40, analizi×40, volume×29, fibonacci×29, bollinger×28, standart×26, bildirimi×26, destek×19, seviyeleri×19

- `memory.backup.md` present: **0.98 KB**
- `memory_archive.md` present: **23.42 KB**
## output_schema.json

- Size: **3.47 KB** · max nesting depth: 3
- Required (top level): 12
- Required (recursive sum): 17
- Properties (recursive): 44
- Enum/const usage: 15
- minLength fields: **0** · minItems fields: 1
- $ref usages: 0

## agent_spec.json

- Size: **2.77 KB**
- Inputs: price_data, bist_index_data, task_context
- Outputs: technical_analysis_output
- Tools: price_feed_client, indicator_calculator, pattern_detector, volume_analyzer
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 2

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `permanent_rules.md`
- `thyao_output_20260413.json`
