# Dead Code & Legacy Audit

- Generated: 2026-04-20T21:15:05.869063+00:00
- This report is intentionally conservative: rows are `candidates`, not guaranteed dead code, unless the evidence says otherwise.

## Agent folders / runtime registry drift

| agent_folder | in_agents_registry_json | in_backend_runtime_registry | note |
| --- | --- | --- | --- |
| agent_factory | True | False | Drift candidate |
| agent_performance_review | True | False | Drift candidate |
| analyst_consensus_agent | False | True | Drift candidate |
| coo | False | True | Drift candidate |
| cost_performance_optimizer | True | False | Drift candidate |
| esg_agent | False | True | Drift candidate |
| sentiment_news_agent | False | True | Drift candidate |
| valuation_agent | False | True | Drift candidate |


## Legacy / backup / archive files

| path | category | size_kb |
| --- | --- | --- |
| TCELL_Yonetim_Kurulu_Raporu_20260411_OLD.pdf | deprecated-or-legacy | 833.47 |
| agents/ceo/heartbeat_archive.md | agent-other | 168.97 |
| agents/ceo/memory_archive.md | agent-other | 64.06 |
| agents/context_extraction/memory_archive.md | agent-other | 41.79 |
| agents/sector_competition/memory_archive.md | agent-other | 38.8 |
| agents/financial_analysis/memory_archive.md | agent-other | 35.88 |
| agents/macro_analysis/memory_archive.md | agent-other | 33.25 |
| agents/data_collection/memory_archive.md | agent-other | 31.52 |
| agents/parse_standardization/memory_archive.md | agent-other | 28.44 |
| agents/event_timeline_alert/memory_archive.md | agent-other | 28.12 |
| agents/report_formatter/memory_archive.md | agent-other | 27.74 |
| agents/qa_review/memory_archive.md | agent-other | 27.09 |
| agents/final_summary/memory_archive.md | agent-other | 26.12 |
| agents/technical_analysis/memory_archive.md | agent-other | 23.42 |
| agents/strategic_synthesis/memory_archive.md | agent-other | 23.0 |
| agents/reconciliation/memory_archive.md | agent-other | 21.52 |
| agents/event_classification/memory_archive.md | agent-other | 21.16 |
| agents/valuation_agent/memory_archive.md | agent-other | 21.14 |
| agents/event_impact_mapper/memory_archive.md | agent-other | 18.42 |
| agents/kap_watch/memory_archive.md | agent-other | 17.5 |
| agents/esg_agent/memory_archive.md | agent-other | 16.04 |
| agents/analyst_consensus_agent/memory_archive.md | agent-other | 8.42 |
| agents/sentiment_news_agent/memory_archive.md | agent-other | 8.21 |
| agents/coo/memory_archive.md | agent-other | 6.12 |
| agents/ceo/memory.backup.md | agent-other | 2.95 |
| agents/financial_analysis/memory.backup.md | agent-other | 1.11 |
| agents/qa_review/memory.backup.md | agent-other | 1.0 |
| agents/kap_watch/memory.backup.md | agent-other | 0.99 |
| agents/orchestrator/memory.backup.md | agent-other | 0.98 |
| agents/technical_analysis/memory.backup.md | agent-other | 0.98 |
| agents/sector_competition/memory.backup.md | agent-other | 0.96 |
| agents/reconciliation/memory.backup.md | agent-other | 0.95 |
| agents/data_collection/memory.backup.md | agent-other | 0.94 |
| agents/macro_analysis/memory.backup.md | agent-other | 0.94 |
| agents/parse_standardization/memory.backup.md | agent-other | 0.94 |
| agents/context_extraction/memory.backup.md | agent-other | 0.93 |
| agents/final_summary/memory.backup.md | agent-other | 0.93 |
| agents/event_impact_mapper/memory.backup.md | agent-other | 0.91 |
| agents/event_timeline_alert/memory.backup.md | agent-other | 0.9 |
| agents/strategic_synthesis/memory.backup.md | agent-other | 0.87 |
| agents/agent_factory/memory.backup.md | agent-other | 0.86 |
| agents/event_classification/memory.backup.md | agent-other | 0.84 |
| agents/_legacy_memory_archive/memory/parse_standardization.md | deprecated-or-legacy | 0.64 |
| agents/_legacy_memory_archive/memory/sector_competition.md | deprecated-or-legacy | 0.64 |
| agents/_legacy_memory_archive/memory/context_extraction.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/event_classification.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/event_impact_mapper.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/event_timeline_alert.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/financial_analysis.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/reconciliation.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/strategic_synthesis.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/technical_analysis.md | deprecated-or-legacy | 0.63 |
| agents/_legacy_memory_archive/memory/data_collection.md | deprecated-or-legacy | 0.62 |
| agents/_legacy_memory_archive/memory/final_summary.md | deprecated-or-legacy | 0.62 |
| agents/_legacy_memory_archive/memory/macro_analysis.md | deprecated-or-legacy | 0.62 |
| agents/_legacy_memory_archive/memory/orchestrator.md | deprecated-or-legacy | 0.62 |
| agents/_legacy_memory_archive/memory/qa_review.md | deprecated-or-legacy | 0.62 |
| agents/_legacy_memory_archive/memory/kap_watch.md | deprecated-or-legacy | 0.61 |


## Sample outputs / backup files living inside agent folders

| path | size_kb |
| --- | --- |
| agents/sector_competition/thyao_analysis.md | 45.66 |
| agents/sector_competition/thyao_output.json | 35.27 |
| agents/context_extraction/output_SISE_20260410.json | 22.05 |
| agents/event_impact_mapper/output_SISE_20260410.json | 17.03 |
| agents/data_collection/output_SISE_20260410.json | 14.72 |
| agents/reconciliation/output_SISE_20260410.json | 14.12 |
| agents/event_classification/output_SISE_20260410.json | 13.86 |
| agents/kap_watch/output_SISE_20260410.json | 11.57 |
| agents/parse_standardization/output_SISE_20260410.json | 7.64 |
| agents/ceo/memory.backup.md | 2.95 |
| agents/financial_analysis/memory.backup.md | 1.11 |
| agents/qa_review/memory.backup.md | 1.0 |
| agents/kap_watch/memory.backup.md | 0.99 |
| agents/orchestrator/memory.backup.md | 0.98 |
| agents/technical_analysis/memory.backup.md | 0.98 |
| agents/sector_competition/memory.backup.md | 0.96 |
| agents/reconciliation/memory.backup.md | 0.95 |
| agents/data_collection/memory.backup.md | 0.94 |
| agents/macro_analysis/memory.backup.md | 0.94 |
| agents/parse_standardization/memory.backup.md | 0.94 |
| agents/context_extraction/memory.backup.md | 0.93 |
| agents/final_summary/memory.backup.md | 0.93 |
| agents/event_impact_mapper/memory.backup.md | 0.91 |
| agents/event_timeline_alert/memory.backup.md | 0.9 |
| agents/strategic_synthesis/memory.backup.md | 0.87 |
| agents/agent_factory/memory.backup.md | 0.86 |
| agents/event_classification/memory.backup.md | 0.84 |


## Broken doc references / missing legacy targets

| path | status | evidence |
| --- | --- | --- |
| templates/report_base.html | missing | Referenced in README.md and AGENTS.md repo map, but no `templates/` directory exists in workspace. |


## Broken schema references

| row |
| --- |
| | agents/event_impact_mapper/output_schema.json | https://financex.io/schemas/shared/evidence | |
| | agents/financial_analysis/output_schema.json | https://financex.io/schemas/shared/evidence | |


## Source files older than 6 months

_No source/config files older than 6 months were found; age skew is mostly in generated artifacts._

## Key findings

- `coo`, `valuation_agent`, `esg_agent`, `sentiment_news_agent`, and `analyst_consensus_agent` exist in backend runtime registry/folders but drift against `agents_registry.json` (per current machine inventory).
- `agent_factory`, `agent_performance_review`, and `cost_performance_optimizer` exist as agent folders/registry concepts but are not in `backend/src/agents.ts`, so the Node runtime cannot load them through the normal `loadAgent()` registry.
- `memory.backup.md`, `memory_archive.md`, dated feedback markdowns, and sample output dumps materially bloat agent folders and blur the authoritative file set.
