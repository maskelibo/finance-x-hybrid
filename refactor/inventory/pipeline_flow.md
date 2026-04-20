# Pipeline Flow Audit

- Generated: 2026-04-20T21:15:05.832485+00:00
- Duration estimates are approximate and derived from `evals/baseline.json` average durations plus the actual `EXECUTION_PHASES` batching logic.

## Actual runtime DAG (agent dependencies)

| agent | dependency_count | upstream_agents |
| --- | --- | --- |
| report_formatter | 13 | final_summary, strategic_synthesis, financial_analysis, technical_analysis, macro_analysis, sector_competition, valuation_agent, context_extraction, esg_agent, sentiment_news_agent, event_impact_mapper, analyst_consensus_agent, reconciliation |
| final_summary | 10 | strategic_synthesis, financial_analysis, valuation_agent, qa_review, macro_analysis, technical_analysis, sector_competition, context_extraction, esg_agent, sentiment_news_agent |
| strategic_synthesis | 7 | financial_analysis, technical_analysis, macro_analysis, sector_competition, context_extraction, event_impact_mapper, valuation_agent |
| qa_review | 4 | financial_analysis, context_extraction, reconciliation, valuation_agent |
| financial_analysis | 3 | parse_standardization, reconciliation, context_extraction |
| valuation_agent | 3 | financial_analysis, context_extraction, macro_analysis |
| context_extraction | 2 | data_collection, parse_standardization |
| data_collection | 2 | ceo, coo |
| esg_agent | 2 | context_extraction, data_collection |
| event_impact_mapper | 2 | event_classification, context_extraction |
| event_timeline_alert | 2 | event_classification, event_impact_mapper |
| reconciliation | 2 | data_collection, parse_standardization |
| sector_competition | 2 | context_extraction, financial_analysis |
| analyst_consensus_agent | 1 | context_extraction |
| coo | 1 | ceo |
| event_classification | 1 | kap_watch |
| kap_watch | 1 | ceo |
| macro_analysis | 1 | context_extraction |
| parse_standardization | 1 | data_collection |
| sentiment_news_agent | 1 | context_extraction |
| technical_analysis | 1 | context_extraction |
| ceo | 0 | — |


## Documented vs actual runtime modes

### Actual runtime activation

| mode | actual_agent_count | actual_agents |
| --- | --- | --- |
| fast_screening | 16 | ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, report_formatter |
| standard_institutional | 18 | ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, report_formatter |
| deep_dive | 22 | ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent, report_formatter |


### Documented activation

| source | mode | documented |
| --- | --- | --- |
| README.md | fast_screening | ceo, data_collection, financial_analysis, technical_analysis, final_summary, report_formatter |
| README.md | standard_institutional | ~15 agents |
| README.md | deep_dive | 22 agents (hepsi) |
| workflows/full_integrated_analysis.md | fast_screening | ceo, data_collection, financial_analysis, technical_analysis, final_summary |
| workflows/full_integrated_analysis.md | standard_institutional | not enumerated |
| workflows/full_integrated_analysis.md | deep_dive | all 20 |
| agents/ceo/system_prompt.md | fast_screening | ceo, data_collection, financial_analysis, technical_analysis, final_summary |
| agents/ceo/system_prompt.md | standard_institutional | specialists + qa_review + conditional KAP team |
| agents/ceo/system_prompt.md | deep_dive | all 20 agents |


## Outputs repeatedly reused downstream (cache candidates)

| context | downstream_count | note |
| --- | --- | --- |
| context_extraction | 13 | High fan-out output; cache/digest candidate |
| financial_analysis | 6 | High fan-out output; cache/digest candidate |
| data_collection | 4 | High fan-out output; cache/digest candidate |
| macro_analysis | 4 | High fan-out output; cache/digest candidate |
| valuation_agent | 4 | High fan-out output; cache/digest candidate |
| ceo | 3 | High fan-out output; cache/digest candidate |
| parse_standardization | 3 | High fan-out output; cache/digest candidate |
| reconciliation | 3 | High fan-out output; cache/digest candidate |
| event_impact_mapper | 3 | High fan-out output; cache/digest candidate |
| technical_analysis | 3 | High fan-out output; cache/digest candidate |
| sector_competition | 3 | High fan-out output; cache/digest candidate |
| event_classification | 2 | High fan-out output; cache/digest candidate |
| strategic_synthesis | 2 | High fan-out output; cache/digest candidate |
| esg_agent | 2 | High fan-out output; cache/digest candidate |
| sentiment_news_agent | 2 | High fan-out output; cache/digest candidate |
| coo | 1 | High fan-out output; cache/digest candidate |
| kap_watch | 1 | High fan-out output; cache/digest candidate |
| qa_review | 1 | High fan-out output; cache/digest candidate |
| final_summary | 1 | High fan-out output; cache/digest candidate |
| analyst_consensus_agent | 1 | High fan-out output; cache/digest candidate |


## Parallelizable but currently serialized / weakly-grouped work

| current_runtime_behavior | could_run_in_parallel | evidence |
| --- | --- | --- |
| kap_watch then data_collection execute in separate serial groups inside the same phase | Yes, workflow spec explicitly says parallel | backend/src/orchestrator.ts EXECUTION_PHASES vs workflows/full_integrated_analysis.md Phase 2 |
| qa_review waits until after valuation/sector/event-impact phase finishes | Partially; deps only require financial_analysis, context_extraction, reconciliation, valuation_agent | AGENT_DEPENDENCIES + EXECUTION_PHASES |
| event_timeline_alert is placed in the same phase bucket as event_impact_mapper even though it depends on it | No, but grouping obscures dependency and relies on batch ordering side-effect | AGENT_DEPENDENCIES + MAX_CONCURRENT batching logic |
| report_formatter runs only after executive report insert/CEO gate path | Mostly no, but formatter payload assembly could start before DB insert | executeSession post-final_summary branch |


## Critical-path estimate by mode

| mode | bottleneck_phase | approx_min | agents | full_path_min |
| --- | --- | --- | --- | --- |
| fast_screening | Final Report | 10.9 | final_summary | 49.9 |
| standard_institutional | Final Report | 10.9 | final_summary | 53.1 |
| deep_dive | Analysis & Events | 13.0 | financial_analysis, macro_analysis, technical_analysis, sentiment_news_agent, analyst_consensus_agent, esg_agent, event_classification | 59.5 |


### fast_screening

| phase | agents | approx_min |
| --- | --- | --- |
| Mandate | ceo | 2.5 |
| Pre-Flight | coo | 0.8 |
| Data Acquisition | kap_watch / data_collection | 4.0 |
| Parsing | parse_standardization | 1.8 |
| Data Quality & Context | reconciliation, context_extraction | 5.9 |
| Analysis & Events | financial_analysis, technical_analysis, event_classification | 8.2 |
| Valuation & Sector & Event Impact | event_impact_mapper, event_timeline_alert | 2.9 |
| Quality Review | qa_review | 3.7 |
| Synthesis | strategic_synthesis | 6.1 |
| Final Report | final_summary | 10.9 |
| Formatting | report_formatter | 3.1 |
| TOTAL |  | 49.9 |


### standard_institutional

| phase | agents | approx_min |
| --- | --- | --- |
| Mandate | ceo | 2.5 |
| Pre-Flight | coo | 0.8 |
| Data Acquisition | kap_watch / data_collection | 4.0 |
| Parsing | parse_standardization | 1.8 |
| Data Quality & Context | reconciliation, context_extraction | 5.9 |
| Analysis & Events | financial_analysis, macro_analysis, technical_analysis, event_classification | 9.6 |
| Valuation & Sector & Event Impact | sector_competition, event_impact_mapper, event_timeline_alert | 4.8 |
| Quality Review | qa_review | 3.7 |
| Synthesis | strategic_synthesis | 6.1 |
| Final Report | final_summary | 10.9 |
| Formatting | report_formatter | 3.1 |
| TOTAL |  | 53.1 |


### deep_dive

| phase | agents | approx_min |
| --- | --- | --- |
| Mandate | ceo | 2.5 |
| Pre-Flight | coo | 0.8 |
| Data Acquisition | kap_watch / data_collection | 4.0 |
| Parsing | parse_standardization | 1.8 |
| Data Quality & Context | reconciliation, context_extraction | 5.9 |
| Analysis & Events | financial_analysis, macro_analysis, technical_analysis, sentiment_news_agent, analyst_consensus_agent, esg_agent, event_classification | 13.0 |
| Valuation & Sector & Event Impact | valuation_agent, sector_competition, event_impact_mapper, event_timeline_alert | 7.8 |
| Quality Review | qa_review | 3.7 |
| Synthesis | strategic_synthesis | 6.1 |
| Final Report | final_summary | 10.9 |
| Formatting | report_formatter | 3.1 |
| TOTAL |  | 59.5 |


## Key findings

- `PIPELINE_BY_MODE` is identical for all modes; real mode difference comes only from `MODE_DEFAULT_LAYERS` + always-on backbone agents.
- Because the backbone includes `coo`, `qa_review`, `strategic_synthesis`, `final_summary`, and `report_formatter`, `fast_screening` is materially closer to a slimmed institutional path than the documented 5-6 agent flow.
- The largest fan-out context objects are `context_extraction_output`, `financial_analysis_output`, and `valuation_agent_output`, which makes them prime candidates for manifest/retrieval instead of raw prompt injection.
