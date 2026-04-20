# Agent inventory — orchestrator

- Registered in `agents_registry.json`: **True**
- Registry group: `management`
- Reports to: `ceo`
- Supervises: `data_collection`, `parse_standardization`, `reconciliation`, `context_extraction`, `financial_analysis`, `sector_competition`, `macro_analysis`, `technical_analysis`, `strategic_synthesis`, `final_summary`, `kap_watch`, `event_classification`, `event_impact_mapper`, `event_timeline_alert`
- Upstream (derived): `ceo`
- Downstream (derived): `context_extraction`, `data_collection`, `event_classification`, `event_impact_mapper`, `event_timeline_alert`, `final_summary`, `financial_analysis`, `kap_watch`, `macro_analysis`, `parse_standardization`, `reconciliation`, `sector_competition`, `strategic_synthesis`, `technical_analysis`
- Folder total size: **15.80 KB** across 6 entries
- Red flags: `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 4.27 | 92 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.98 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 1.43 | 69 | 2026-04-19T12:49:43Z |
| output_schema.json | 1.78 | 49 | 2026-04-19T12:49:43Z |
| system_prompt.md | 4.13 | 92 | 2026-04-19T12:49:43Z |
| test_cases.json | 3.21 | 76 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **4.04 KB**, 92 lines
- Headings: H1=1, H2=8, H3+=3
- Bullets: 4 · Code blocks: 2 · Rule-marker lines (ZORUNLU/YASAK/must/never): **7**

## memory.md

- Size: **1.36 KB**, 69 lines
- Feedback dates found: 1 → 2026-04-09
- Rule-marker lines: **0** · Migration-candidate headings: 1
- Canonical-rule hints present: banka×1
- Top repeated tokens (len≥6, freq≥5): başlangıç×5, seviyesi×5

- `memory.backup.md` present: **0.98 KB**
## output_schema.json

- Size: **1.73 KB** · max nesting depth: 3
- Required (top level): 3
- Required (recursive sum): 3
- Properties (recursive): 21
- Enum/const usage: 2
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **4.18 KB**
- Inputs: task_contract, agent_output_notification, ceo_review_decision, platform_health
- Outputs: agent_task_dispatch, session_state, escalation_signal
- Tools: session_state_manager, dependency_resolver, task_dispatcher, timeout_monitor, escalation_router
- Handoff rules: 4 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 3 · KPIs: 4
