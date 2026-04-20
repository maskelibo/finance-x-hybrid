# Agent inventory — sector_competition

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **175.78 KB** across 11 entries
- Red flags: `memory_bloat_18.78kb`, `canonicalizable_sections_10`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_3_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.52 | 42 | 2026-04-19T12:49:43Z |
| case_lessons.md | 17.83 | 188 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.24 | 124 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.96 | 34 | 2026-04-19T12:49:43Z |
| memory.md | 18.96 | 182 | 2026-04-19T12:49:43Z |
| memory_archive.md | 38.8 | 564 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.37 | 49 | 2026-04-19T12:49:43Z |
| system_prompt.md | 6.45 | 150 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.72 | 29 | 2026-04-19T12:49:43Z |
| thyao_analysis.md | 45.66 | 601 | 2026-04-19T12:49:43Z |
| thyao_output.json | 35.27 | 690 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **6.31 KB**, 150 lines
- Headings: H1=1, H2=11, H3+=5
- Bullets: 35 · Code blocks: 2 · Rule-marker lines (ZORUNLU/YASAK/must/never): **11**

## knowledge.md

- Size: **5.12 KB**, 124 lines
- Headings: H1=1, H2=7, H3+=16
- Bullets: 53 · Code blocks: 0 · Rule-marker lines: 2

## memory.md

- Size: **18.78 KB**, 182 lines
- Feedback dates found: 3 → 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **24** · Migration-candidate headings: 10
- Canonical-rule hints present: THYAO×56, TUPRS×3, KCHOL×2, ASELS×8, EREGL×6, TCELL×1, BIMAS×1, EBITDAR×17, aviation×11, havacılık×19, çelik×3, steel×3, banka×3, holding×3, defense×3, savunma×9, proxy×2
- Top repeated tokens (len≥6, freq≥5): sektör×46, porter×25, industrial×22, havacılık×19, ebitdar×17, analizi×16, benchmark×14, listesi×14, upstream×13, finansal×12

- `memory.backup.md` present: **0.96 KB**
- `memory_archive.md` present: **38.8 KB**
## output_schema.json

- Size: **2.32 KB** · max nesting depth: 4
- Required (top level): 11
- Required (recursive sum): 16
- Properties (recursive): 30
- Enum/const usage: 4
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **2.48 KB**
- Inputs: financial_analysis_output, sector_peer_data, sector_database
- Outputs: sector_benchmarking
- Tools: bist_sector_database, peer_financial_fetcher, benchmarking_calculator, ranking_engine
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 1 · KPIs: 2

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `thyao_analysis.md`
- `thyao_output.json`
