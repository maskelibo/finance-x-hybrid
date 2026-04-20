# Agent inventory — data_collection

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **165.00 KB** across 11 entries
- Red flags: `memory_bloat_28.76kb`, `canonicalizable_sections_15`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_3_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.77 | 74 | 2026-04-19T12:49:43Z |
| case_lessons.md | 7.23 | 64 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.94 | 154 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.94 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 29.02 | 269 | 2026-04-19T12:49:43Z |
| memory_archive.md | 31.52 | 565 | 2026-04-19T12:49:43Z |
| output/  (dir) | 44.96 | - | 2026-04-19T12:49:43Z |
| output_schema.json | 3.97 | 87 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 14.72 | 323 | 2026-04-19T12:49:43Z |
| system_prompt.md | 20.21 | 485 | 2026-04-19T19:19:48Z |
| test_cases.json | 2.72 | 66 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **19.73 KB**, 485 lines
- Headings: H1=1, H2=18, H3+=22
- Bullets: 120 · Code blocks: 15 · Rule-marker lines (ZORUNLU/YASAK/must/never): **30**

## knowledge.md

- Size: **5.79 KB**, 154 lines
- Headings: H1=1, H2=10, H3+=9
- Bullets: 59 · Code blocks: 0 · Rule-marker lines: 6

## memory.md

- Size: **28.76 KB**, 269 lines
- Feedback dates found: 4 → 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **49** · Migration-candidate headings: 15
- Canonical-rule hints present: THYAO×34, TUPRS×2, KCHOL×3, ASELS×5, EREGL×6, TCELL×5, SAHOL×1, BIMAS×1, IAS 29×7, EBITDAR×5, havacılık×4, banka×1, telekom×4, holding×8, savunma×6, proxy×3
- Top repeated tokens (len≥6, freq≥5): raporu×30, canonical×23, bildirimi×22, yıllık×21, tablosu×21, downstream×17, kaynak×15, segment×15, eksikler×15, bundan×15

- `memory.backup.md` present: **0.94 KB**
- `memory_archive.md` present: **31.52 KB**
## output_schema.json

- Size: **3.88 KB** · max nesting depth: 3
- Required (top level): 12
- Required (recursive sum): 19
- Properties (recursive): 46
- Enum/const usage: 8
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **3.7 KB**
- Inputs: task_context, data_source_registry, previous_session_cache
- Outputs: data_manifest
- Tools: kap_api_client, bist_data_fetcher, company_ir_scraper, tcmb_data_client, tuik_data_client, price_feed_client, document_registry_writer, quality_scorer
- Handoff rules: 3 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 3 · KPIs: 4

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `output`
- `output_SISE_20260410.json`
