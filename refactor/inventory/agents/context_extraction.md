# Agent inventory — context_extraction

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): —
- Folder total size: **155.71 KB** across 11 entries
- Red flags: `memory_bloat_31.56kb`, `canonicalizable_sections_17`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_3_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.34 | 59 | 2026-04-19T12:49:43Z |
| case_lessons.md | 16.26 | 170 | 2026-04-19T12:49:43Z |
| knowledge.md | 6.9 | 164 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.93 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 31.84 | 287 | 2026-04-19T12:49:43Z |
| memory_archive.md | 41.79 | 670 | 2026-04-19T12:49:43Z |
| output_schema.json | 3.27 | 79 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 22.05 | 446 | 2026-04-19T12:49:43Z |
| reference_manual.md | 13.01 | 305 | 2026-04-19T12:49:43Z |
| system_prompt.md | 14.62 | 342 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.7 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **14.29 KB**, 342 lines
- Headings: H1=1, H2=8, H3+=13
- Bullets: 74 · Code blocks: 9 · Rule-marker lines (ZORUNLU/YASAK/must/never): **15**

## knowledge.md

- Size: **6.74 KB**, 164 lines
- Headings: H1=1, H2=9, H3+=5
- Bullets: 53 · Code blocks: 1 · Rule-marker lines: 8

## memory.md

- Size: **31.56 KB**, 287 lines
- Feedback dates found: 4 → 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **35** · Migration-candidate headings: 17
- Canonical-rule hints present: THYAO×42, TUPRS×7, KCHOL×7, ASELS×4, EREGL×5, TCELL×4, SAHOL×4, BIMAS×3, IAS 29×2, EBITDAR×2, havacılık×11, çelik×2, banka×1, telecom×1, telekom×5, holding×13, savunma×5
- Top repeated tokens (len≥6, freq≥5): context×27, bildirimi×27, pozisyon×27, pozisyonu×24, tablosu×21, raporu×21, taahhüt×20, profili×18, extraction×17, eksikler×17

- `memory.backup.md` present: **0.93 KB**
- `memory_archive.md` present: **41.79 KB**
## output_schema.json

- Size: **3.2 KB** · max nesting depth: 3
- Required (top level): 10
- Required (recursive sum): 14
- Properties (recursive): 42
- Enum/const usage: 4
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **3.28 KB**
- Inputs: parsed_statements, kap_disclosures, company_ir_materials, task_context
- Outputs: context_package
- Tools: text_extractor, segment_identifier, accounting_policy_parser, management_guidance_tagger, evidence_formatter
- Handoff rules: 3 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `output_SISE_20260410.json`
- `reference_manual.md`
