# Agent inventory — event_timeline_alert

- Registered in `agents_registry.json`: **True**
- Registry group: `event`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **119.29 KB** across 9 entries
- Red flags: `memory_bloat_20.16kb`, `canonicalizable_sections_9`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.43 | 40 | 2026-04-19T12:49:43Z |
| froto_output_20260414.md | 51.93 | 8 | 2026-04-19T12:49:43Z |
| knowledge.md | 7.59 | 201 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.9 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 20.39 | 243 | 2026-04-19T12:49:43Z |
| memory_archive.md | 28.12 | 479 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.75 | 62 | 2026-04-19T12:49:43Z |
| system_prompt.md | 3.3 | 97 | 2026-04-19T20:29:49Z |
| test_cases.json | 1.88 | 35 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **3.2 KB**, 97 lines
- Headings: H1=1, H2=10, H3+=3
- Bullets: 13 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **9**

## knowledge.md

- Size: **7.39 KB**, 201 lines
- Headings: H1=1, H2=11, H3+=4
- Bullets: 61 · Code blocks: 4 · Rule-marker lines: 4

## memory.md

- Size: **20.16 KB**, 243 lines
- Feedback dates found: 5 → 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **33** · Migration-candidate headings: 9
- Canonical-rule hints present: THYAO×27, TUPRS×2, ASELS×3, EREGL×4, TCELL×2, SAHOL×1, EBITDAR×2, havacılık×2, çelik×3, banka×1, holding×1, savunma×5, proxy×3
- Top repeated tokens (len≥6, freq≥5): immediate×65, medium×56, urgency×37, değişimi×22, timeline×15, sonuçları×15, rotaları×14, senaryo×14, olaylar×13, bağlantısı×13

- `memory.backup.md` present: **0.9 KB**
- `memory_archive.md` present: **28.12 KB**
## output_schema.json

- Size: **2.69 KB** · max nesting depth: 4
- Required (top level): 10
- Required (recursive sum): 20
- Properties (recursive): 29
- Enum/const usage: 8
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **2.39 KB**
- Inputs: event_impact_mapper_output, financial_analysis_output, task_context
- Outputs: event_timeline_alerts
- Tools: timeline_organizer, urgency_classifier, calendar_builder
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 1 · KPIs: 2

## Extra / non-canonical doc files in this agent folder

- `froto_output_20260414.md`
