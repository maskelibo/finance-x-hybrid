# Agent inventory — event_classification

- Registered in `agents_registry.json`: **True**
- Registry group: `event`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **82.67 KB** across 9 entries
- Red flags: `memory_bloat_28.47kb`, `feedback_log_style_8_dates`, `canonicalizable_sections_17`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.98 | 55 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.96 | 151 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.84 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 28.79 | 331 | 2026-04-19T12:49:43Z |
| memory_archive.md | 21.16 | 393 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.48 | 52 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 13.86 | 353 | 2026-04-19T12:49:43Z |
| system_prompt.md | 4.68 | 110 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.92 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **4.57 KB**, 110 lines
- Headings: H1=1, H2=9, H3+=2
- Bullets: 7 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **9**

## knowledge.md

- Size: **5.81 KB**, 151 lines
- Headings: H1=1, H2=8, H3+=5
- Bullets: 48 · Code blocks: 2 · Rule-marker lines: 4

## memory.md

- Size: **28.47 KB**, 331 lines
- Feedback dates found: 8 → 2025-03-25, 2026-04-11, 2026-04-12, 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **28** · Migration-candidate headings: 17
- Canonical-rule hints present: THYAO×22, TUPRS×4, KCHOL×5, ASELS×2, EREGL×4, TCELL×5, SAHOL×1, BIMAS×3, havacılık×6, çelik×3, banka×1, telekom×10, holding×5, savunma×4
- Top repeated tokens (len≥6, freq≥5): değişimi×28, material×26, classification×25, impact×23, bildirimi×23, classify×20, temettü×20, etkisi×18, interaction×17, eksikler×16

- `memory.backup.md` present: **0.84 KB**
- `memory_archive.md` present: **21.16 KB**
## output_schema.json

- Size: **2.43 KB** · max nesting depth: 4
- Required (top level): 9
- Required (recursive sum): 17
- Properties (recursive): 23
- Enum/const usage: 5
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **2.92 KB**
- Inputs: kap_watch_output, disclosure_content, event_taxonomy
- Outputs: classified_events
- Tools: nlp_classifier, taxonomy_matcher, key_term_extractor
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `output_SISE_20260410.json`
