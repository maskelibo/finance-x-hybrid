# Agent inventory — final_summary

- Registered in `agents_registry.json`: **True**
- Registry group: `specialist`
- Reports to: `orchestrator`
- Supervises: `report_formatter`
- Upstream (derived): `agent_performance_review`, `orchestrator`
- Downstream (derived): `report_formatter`
- Folder total size: **74.27 KB** across 8 entries
- Red flags: `memory_bloat_22.1kb`, `canonicalizable_sections_10`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.18 | 57 | 2026-04-19T12:49:43Z |
| knowledge.md | 6.0 | 172 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.93 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 22.33 | 232 | 2026-04-19T12:49:43Z |
| memory_archive.md | 26.12 | 472 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.95 | 65 | 2026-04-19T12:49:43Z |
| system_prompt.md | 11.06 | 221 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.7 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **10.85 KB**, 221 lines
- Headings: H1=1, H2=13, H3+=7
- Bullets: 29 · Code blocks: 4 · Rule-marker lines (ZORUNLU/YASAK/must/never): **23**

## knowledge.md

- Size: **5.83 KB**, 172 lines
- Headings: H1=1, H2=10, H3+=13
- Bullets: 41 · Code blocks: 2 · Rule-marker lines: 8

## memory.md

- Size: **22.1 KB**, 232 lines
- Feedback dates found: 5 → 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **26** · Migration-candidate headings: 10
- Canonical-rule hints present: THYAO×14, TUPRS×1, KCHOL×2, ASELS×3, EREGL×2, TCELL×2, IAS 29×1, EBITDAR×11, havacılık×18, çelik×4, banka×1, holding×2, savunma×5, proxy×3, ticker override×1
- Top repeated tokens (len≥6, freq≥5): tablosu×44, ebitda×27, kalite×26, summary×23, yönetici×19, formatı×18, unblock×18, koşulu×18, uyarıları×17, havacılık×17

- `memory.backup.md` present: **0.93 KB**
- `memory_archive.md` present: **26.12 KB**
## output_schema.json

- Size: **2.88 KB** · max nesting depth: 3
- Required (top level): 12
- Required (recursive sum): 19
- Properties (recursive): 33
- Enum/const usage: 5
- minLength fields: **0** · minItems fields: 2
- $ref usages: 0

## agent_spec.json

- Size: **3.13 KB**
- Inputs: strategic_synthesis_output, financial_analysis_output, event_impact_mapper_output, all_approved_outputs, task_context
- Outputs: user_facing_report
- Tools: report_formatter, confidence_labeler, disclosure_inserter
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 1 · KPIs: 3
