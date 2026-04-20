# Agent inventory — event_impact_mapper

- Registered in `agents_registry.json`: **True**
- Registry group: `event`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **89.41 KB** across 10 entries
- Red flags: `memory_bloat_20.66kb`, `canonicalizable_sections_9`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 4.77 | 76 | 2026-04-19T12:49:43Z |
| knowledge.md | 7.92 | 223 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.91 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 20.87 | 213 | 2026-04-19T12:49:43Z |
| memory_archive.md | 18.42 | 289 | 2026-04-19T12:49:43Z |
| output_schema.json | 4.8 | 131 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 17.03 | 323 | 2026-04-19T12:49:43Z |
| review_rubric.md | 2.01 | 41 | 2026-04-19T12:49:43Z |
| system_prompt.md | 8.19 | 180 | 2026-04-19T12:49:43Z |
| test_cases.json | 4.49 | 118 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **8.02 KB**, 180 lines
- Headings: H1=1, H2=11, H3+=0
- Bullets: 24 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **12**

## knowledge.md

- Size: **7.71 KB**, 223 lines
- Headings: H1=1, H2=12, H3+=7
- Bullets: 65 · Code blocks: 3 · Rule-marker lines: 4

## memory.md

- Size: **20.66 KB**, 213 lines
- Feedback dates found: 5 → 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **35** · Migration-candidate headings: 9
- Canonical-rule hints present: THYAO×30, TUPRS×6, KCHOL×4, ASELS×5, EREGL×2, TCELL×2, SAHOL×1, BIMAS×1, IAS 29×1, IAS29×2, EBITDAR×9, havacılık×4, çelik×3, banka×1, holding×4, savunma×4, proxy×13
- Top repeated tokens (len≥6, freq≥5): temettü×30, impact×29, template×26, haritalama×25, değişimi×19, etkisi×17, python×17, quantification×15, rotaları×15, başlık×14

- `memory.backup.md` present: **0.91 KB**
- `memory_archive.md` present: **18.42 KB**
## output_schema.json

- Size: **4.67 KB** · max nesting depth: 4
- Required (top level): 10
- Required (recursive sum): 22
- Properties (recursive): 43
- Enum/const usage: 9
- minLength fields: **0** · minItems fields: 0
- $ref usages: 1

## agent_spec.json

- Size: **4.7 KB**
- Inputs: event_classification_output, financial_analysis_output, context_extraction_output
- Outputs: event_impact_maps
- Tools: impact_mapping_engine, ifrs_rule_lookup, materiality_calculator, quantification_framework, evidence_formatter
- Handoff rules: 4 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 3 · KPIs: 4

## Extra / non-canonical doc files in this agent folder

- `output_SISE_20260410.json`
- `review_rubric.md`
