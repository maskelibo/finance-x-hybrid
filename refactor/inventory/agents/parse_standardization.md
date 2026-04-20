# Agent inventory — parse_standardization

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **98.60 KB** across 9 entries
- Red flags: `memory_bloat_31.02kb`, `canonicalizable_sections_19`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.5 | 64 | 2026-04-19T12:49:43Z |
| knowledge.md | 6.61 | 177 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.94 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 31.34 | 328 | 2026-04-19T12:49:43Z |
| memory_archive.md | 28.44 | 454 | 2026-04-19T12:49:43Z |
| output_schema.json | 3.78 | 84 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 7.64 | 179 | 2026-04-19T12:49:43Z |
| system_prompt.md | 14.55 | 313 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.8 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **14.25 KB**, 313 lines
- Headings: H1=1, H2=13, H3+=20
- Bullets: 57 · Code blocks: 5 · Rule-marker lines (ZORUNLU/YASAK/must/never): **33**

## knowledge.md

- Size: **6.44 KB**, 177 lines
- Headings: H1=1, H2=11, H3+=13
- Bullets: 45 · Code blocks: 2 · Rule-marker lines: 13

## memory.md

- Size: **31.02 KB**, 328 lines
- Feedback dates found: 4 → 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **61** · Migration-candidate headings: 19
- Canonical-rule hints present: THYAO×35, TUPRS×1, KCHOL×8, ASELS×7, EREGL×10, TCELL×5, SAHOL×1, BIMAS×3, IAS 29×17, EBITDAR×14, aviation×3, havacılık×4, çelik×2, banka×1, telekom×2, holding×6, savunma×6, proxy×3
- Top repeated tokens (len≥6, freq≥5): ebitda×48, ticari×31, income×29, tablosu×25, eskalasyon×19, pending×18, raporu×18, bildirimi×17, satırı×17, statement×16

- `memory.backup.md` present: **0.94 KB**
- `memory_archive.md` present: **28.44 KB**
## output_schema.json

- Size: **3.7 KB** · max nesting depth: 4
- Required (top level): 11
- Required (recursive sum): 19
- Properties (recursive): 44
- Enum/const usage: 4
- minLength fields: **0** · minItems fields: 0
- $ref usages: 4

## agent_spec.json

- Size: **3.44 KB**
- Inputs: data_manifest, raw_documents, bist_taxonomy_map, task_context
- Outputs: standardized_statements
- Tools: xbrl_parser, pdf_table_extractor, html_parser, bist_taxonomy_mapper, balance_checker, restatement_detector
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 3 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `output_SISE_20260410.json`
