# Agent inventory — strategic_synthesis

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **75.44 KB** across 10 entries
- Red flags: `memory_bloat_23.87kb`, `canonicalizable_sections_10`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.51 | 60 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.52 | 166 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.87 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 24.12 | 252 | 2026-04-19T12:49:43Z |
| memory_archive.md | 23.0 | 476 | 2026-04-19T12:49:43Z |
| output_schema.json | 3.62 | 78 | 2026-04-19T12:49:43Z |
| permanent_rules.md | 3.12 | 46 | 2026-04-19T12:49:43Z |
| review_rubric.md | 0.8 | 15 | 2026-04-19T12:49:43Z |
| system_prompt.md | 8.87 | 198 | 2026-04-19T12:49:43Z |
| test_cases.json | 2.01 | 31 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **8.67 KB**, 198 lines
- Headings: H1=1, H2=10, H3+=8
- Bullets: 22 · Code blocks: 6 · Rule-marker lines (ZORUNLU/YASAK/must/never): **17**

## knowledge.md

- Size: **5.35 KB**, 166 lines
- Headings: H1=1, H2=8, H3+=13
- Bullets: 42 · Code blocks: 3 · Rule-marker lines: 5

## memory.md

- Size: **23.87 KB**, 252 lines
- Feedback dates found: 5 → 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **31** · Migration-candidate headings: 10
- Canonical-rule hints present: THYAO×33, TUPRS×1, KCHOL×2, ASELS×3, EREGL×2, TCELL×2, SAHOL×1, EBITDAR×4, havacılık×9, çelik×1, banka×1, telekom×1, holding×5, savunma×5, proxy×2
- Top repeated tokens (len≥6, freq≥5): ebitda×27, trigger×25, üretilmedi×24, minimum×24, revenue×19, senaryo×18, formatı×18, yatırım×17, listesi×16, goldman×16

- `memory.backup.md` present: **0.87 KB**
- `memory_archive.md` present: **23.0 KB**
## output_schema.json

- Size: **3.55 KB** · max nesting depth: 4
- Required (top level): 13
- Required (recursive sum): 29
- Properties (recursive): 36
- Enum/const usage: 7
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **3.46 KB**
- Inputs: financial_analysis_output, sector_competition_output, macro_analysis_output, technical_analysis_output, event_impact_mapper_output, context_extraction_output, contradiction_reports
- Outputs: strategic_synthesis_output
- Tools: signal_integrator, convergence_analyzer, contradiction_addresser, confidence_aggregator
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `permanent_rules.md`
- `review_rubric.md`
