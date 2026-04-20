# Agent inventory — ceo

- Registered in `agents_registry.json`: **True**
- Registry group: `management`
- Supervises: `qa_review`
- Upstream (derived): —
- Downstream (derived): `agent_factory`, `agent_performance_review`, `cost_performance_optimizer`, `orchestrator`, `qa_review`
- Folder total size: **469.84 KB** across 20 entries
- Red flags: `memory_bloat_44.34kb`, `canonicalizable_sections_29`, `system_prompt_heavy_25.37kb`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_12_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 9.07 | 241 | 2026-04-19T12:49:43Z |
| ASELS_REPORT_REVIEW_2026_04_10.md | 11.18 | 315 | 2026-04-19T12:49:43Z |
| audit_log_schema.json | 9.17 | 272 | 2026-04-19T12:49:43Z |
| case_lessons.md | 6.4 | 112 | 2026-04-19T12:49:43Z |
| fallback_policy.md | 13.66 | 326 | 2026-04-19T12:49:43Z |
| feedback_issued.md | 2.65 | 70 | 2026-04-19T12:49:43Z |
| feedback_reports/  (dir) | 10.75 | - | 2026-04-19T12:49:43Z |
| heartbeat_archive.md | 168.97 | 3637 | 2026-04-19T12:49:43Z |
| hiring_request_schema.json | 7.35 | 232 | 2026-04-19T12:49:43Z |
| knowledge.md | 5.24 | 139 | 2026-04-19T12:49:43Z |
| memory.backup.md | 2.95 | 86 | 2026-04-19T12:49:43Z |
| memory.md | 44.87 | 540 | 2026-04-19T19:22:07Z |
| memory_archive.md | 64.06 | 1240 | 2026-04-19T12:49:43Z |
| night_training_protocol.md | 8.49 | 240 | 2026-04-19T12:49:43Z |
| output_schema.json | 12.01 | 373 | 2026-04-19T12:49:43Z |
| permanent_rules.md | 4.44 | 64 | 2026-04-19T12:49:43Z |
| reference_manual.md | 40.45 | 972 | 2026-04-19T12:49:43Z |
| review_rubric.md | 11.43 | 226 | 2026-04-19T12:49:43Z |
| system_prompt.md | 25.95 | 594 | 2026-04-19T12:49:43Z |
| test_cases.json | 10.75 | 244 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **25.37 KB**, 594 lines
- Headings: H1=1, H2=18, H3+=48
- Bullets: 142 · Code blocks: 4 · Rule-marker lines (ZORUNLU/YASAK/must/never): **60**

## knowledge.md

- Size: **5.1 KB**, 139 lines
- Headings: H1=1, H2=7, H3+=13
- Bullets: 36 · Code blocks: 0 · Rule-marker lines: 17

## memory.md

- Size: **44.34 KB**, 540 lines
- Feedback dates found: 4 → 2026-04-16, 2026-04-17, 2026-04-18, 2026-04-19
- Rule-marker lines: **34** · Migration-candidate headings: 29
- Canonical-rule hints present: THYAO×95, TUPRS×13, KCHOL×13, ASELS×9, EREGL×22, TCELL×1, BIMAS×1, IAS 29×4, IAS29×4, EBITDAR×19, aviation×13, havacılık×7, çelik×4, banka×4, telekom×1, holding×7, defense×2, savunma×5, proxy×1
- Top repeated tokens (len≥6, freq≥5): heartbeat×47, archive×42, sector×34, competition×34, impact×31, timeline×28, mapper×27, sorunlu×24, blocked×24, formatter×23

- `memory.backup.md` present: **2.95 KB**
- `memory_archive.md` present: **64.06 KB**
## output_schema.json

- Size: **11.64 KB** · max nesting depth: 5
- Required (top level): 0
- Required (recursive sum): 69
- Properties (recursive): 92
- Enum/const usage: 15
- minLength fields: **0** · minItems fields: 1
- $ref usages: 8

## agent_spec.json

- Size: **8.83 KB**
- Inputs: user_analysis_request, agent_output_package, audit_trigger, session_state
- Outputs: task_contract, review_decision, contradiction_report, hiring_request, audit_log_entry, final_approval
- Tools: session_state_reader, agent_output_registry, contradiction_detector, audit_log_writer, task_contract_issuer, review_ledger_writer, hiring_request_issuer, cost_budget_monitor, schema_validator
- Handoff rules: 4 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 4 · KPIs: 5

## Extra / non-canonical doc files in this agent folder

- `ASELS_REPORT_REVIEW_2026_04_10.md`
- `audit_log_schema.json`
- `case_lessons.md`
- `fallback_policy.md`
- `feedback_issued.md`
- `feedback_reports`
- `heartbeat_archive.md`
- `hiring_request_schema.json`
- `night_training_protocol.md`
- `permanent_rules.md`
- `reference_manual.md`
- `review_rubric.md`
