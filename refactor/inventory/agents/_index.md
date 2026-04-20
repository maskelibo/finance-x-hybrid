# Agent inventory index

- Generated: 2026-04-20T21:09:05.424594+00:00
- Agents scanned: **26** (registry lists 21, filesystem-only: 5)

## Per-agent summary

| agent | reg | group | size_kb | sys_kb | know_kb | mem_kb | mem_feedback_dates | schema_req | schema_minLen | extra_docs | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ceo | ✓ | management | 469.84 | 25.37 | 5.1 | 44.34 | 4 | 0 | 0 | 12 | 6 |
| financial_analysis | ✓ | specialist | 219.3 | 38.4 | 6.92 | 30.59 | 4 | 12 | 0 | 9 | 6 |
| sector_competition | ✓ | specialist | 175.78 | 6.31 | 5.12 | 18.78 | 3 | 11 | 0 | 3 | 5 |
| data_collection | ✓ | specialist | 165.0 | 19.73 | 5.79 | 28.76 | 4 | 12 | 0 | 3 | 5 |
| context_extraction | ✓ | specialist | 155.71 | 14.29 | 6.74 | 31.56 | 4 | 10 | 0 | 3 | 5 |
| macro_analysis | ✓ | specialist | 148.34 | 13.12 | 5.21 | 20.39 | 3 | 10 | 0 | 6 | 5 |
| report_formatter | ✓ | specialist | 121.06 | 17.85 | 5.56 | 31.1 | 6 | — | — | 3 | 4 |
| event_timeline_alert | ✓ | event | 119.29 | 3.2 | 7.39 | 20.16 | 5 | 10 | 0 | 1 | 4 |
| technical_analysis | ✓ | specialist | 114.63 | 4.47 | 5.24 | 30.6 | 7 | 12 | 0 | 3 | 6 |
| reconciliation | ✓ | specialist | 113.74 | 13.02 | 6.92 | 28.13 | 4 | 11 | 0 | 5 | 5 |
| parse_standardization | ✓ | specialist | 98.6 | 14.25 | 6.44 | 31.02 | 4 | 11 | 0 | 1 | 4 |
| event_impact_mapper | ✓ | event | 89.41 | 8.02 | 7.71 | 20.66 | 5 | 10 | 0 | 2 | 4 |
| qa_review | ✓ | management | 85.48 | 6.42 | 5.89 | 22.22 | 5 | 10 | 0 | 4 | 5 |
| event_classification | ✓ | event | 82.67 | 4.57 | 5.81 | 28.47 | 8 | 9 | 0 | 1 | 5 |
| kap_watch | ✓ | event | 77.55 | 3.67 | 6.78 | 29.56 | 11 | 10 | 0 | 1 | 5 |
| strategic_synthesis | ✓ | specialist | 75.44 | 8.67 | 5.35 | 23.87 | 5 | 13 | 0 | 2 | 4 |
| final_summary | ✓ | specialist | 74.27 | 10.85 | 5.83 | 22.1 | 5 | 12 | 0 | 0 | 4 |
| valuation_agent | ✗ | — | 66.51 | 12.37 | 5.91 | 7.61 | 3 | — | — | 3 | 3 |
| coo | ✗ | — | 61.26 | 8.86 | 5.85 | 31.24 | 5 | — | — | 1 | 3 |
| esg_agent | ✗ | — | 53.9 | 7.81 | 5.5 | 6.5 | 2 | — | — | 2 | 1 |
| sentiment_news_agent | ✗ | — | 37.52 | 5.72 | 3.96 | 6.1 | 2 | — | — | 1 | 1 |
| analyst_consensus_agent | ✗ | — | 31.7 | 6.06 | 3.57 | 13.23 | 8 | — | — | 0 | 3 |
| agent_performance_review | ✓ | management | 29.57 | 17.15 | — | 3.47 | 1 | 8 | 0 | 0 | 1 |
| orchestrator | ✓ | management | 15.8 | 4.04 | — | 1.36 | 1 | 3 | 0 | 0 | 2 |
| agent_factory | ✓ | management | 8.36 | 2.7 | — | 1.36 | 1 | 6 | 1 | 0 | 1 |
| cost_performance_optimizer | ✓ | management | 0.92 | — | — | 0.9 | 0 | — | — | 0 | 0 |


## Red-flag map

| agent | flags |
| --- | --- |
| agent_factory | has_memory_backup_file |
| agent_performance_review | schema_no_minLength_enforcement |
| analyst_consensus_agent | not_in_agents_registry_json, feedback_log_style_8_dates, canonicalizable_sections_7 |
| ceo | memory_bloat_44.34kb, canonicalizable_sections_29, system_prompt_heavy_25.37kb, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_12_files |
| context_extraction | memory_bloat_31.56kb, canonicalizable_sections_17, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_3_files |
| coo | not_in_agents_registry_json, memory_bloat_31.24kb, canonicalizable_sections_23 |
| data_collection | memory_bloat_28.76kb, canonicalizable_sections_15, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_3_files |
| esg_agent | not_in_agents_registry_json |
| event_classification | memory_bloat_28.47kb, feedback_log_style_8_dates, canonicalizable_sections_17, schema_no_minLength_enforcement, has_memory_backup_file |
| event_impact_mapper | memory_bloat_20.66kb, canonicalizable_sections_9, schema_no_minLength_enforcement, has_memory_backup_file |
| event_timeline_alert | memory_bloat_20.16kb, canonicalizable_sections_9, schema_no_minLength_enforcement, has_memory_backup_file |
| final_summary | memory_bloat_22.1kb, canonicalizable_sections_10, schema_no_minLength_enforcement, has_memory_backup_file |
| financial_analysis | memory_bloat_30.59kb, canonicalizable_sections_15, system_prompt_heavy_38.4kb, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_9_files |
| kap_watch | memory_bloat_29.56kb, feedback_log_style_11_dates, canonicalizable_sections_17, schema_no_minLength_enforcement, has_memory_backup_file |
| macro_analysis | memory_bloat_20.39kb, canonicalizable_sections_10, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_6_files |
| orchestrator | schema_no_minLength_enforcement, has_memory_backup_file |
| parse_standardization | memory_bloat_31.02kb, canonicalizable_sections_19, schema_no_minLength_enforcement, has_memory_backup_file |
| qa_review | memory_bloat_22.22kb, canonicalizable_sections_10, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_4_files |
| reconciliation | memory_bloat_28.13kb, canonicalizable_sections_16, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_5_files |
| report_formatter | memory_bloat_31.1kb, feedback_log_style_6_dates, canonicalizable_sections_19, extra_doc_clutter_3_files |
| sector_competition | memory_bloat_18.78kb, canonicalizable_sections_10, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_3_files |
| sentiment_news_agent | not_in_agents_registry_json |
| strategic_synthesis | memory_bloat_23.87kb, canonicalizable_sections_10, schema_no_minLength_enforcement, has_memory_backup_file |
| technical_analysis | memory_bloat_30.6kb, feedback_log_style_7_dates, canonicalizable_sections_18, schema_no_minLength_enforcement, has_memory_backup_file, extra_doc_clutter_3_files |
| valuation_agent | not_in_agents_registry_json, canonicalizable_sections_3, extra_doc_clutter_3_files |


## Red-flag legend

- `not_in_agents_registry_json` — folder exists under `agents/` but agent is not listed in `agents_registry.json`.
- `memory_bloat_<kb>` — `memory.md` exceeds 15 KB.
- `feedback_log_style_<N>_dates` — memory contains 5+ dated feedback entries (log-style, not distilled).
- `canonicalizable_sections_<N>` — memory headings mention hard-codable concepts (ticker, sector, IAS 29, etc.).
- `system_prompt_heavy_<kb>` — system prompt over 25 KB.
- `schema_no_minLength_enforcement` / `schema_no_enum_enforcement` — schema has >20 properties but no depth/enumeration constraints.
- `has_memory_backup_file` — `memory.backup.md` is present; clean-up candidate.
- `extra_doc_clutter_<N>_files` — 3+ non-canonical doc files in agent folder.
