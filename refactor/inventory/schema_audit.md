# Schema Audit

- Generated: 2026-04-20T21:15:05.827966+00:00
- Schemas scanned: **30**
- Inference note: `required-candidate` rows are heuristic, based on runtime code/docs referencing optional fields as operationally important.

## Schema inventory

| path | refs | unconstrained_strings | arrays_without_minItems | enums | broken_refs | note |
| --- | --- | --- | --- | --- | --- | --- |
| agents/ceo/output_schema.json | 8 | 38 | 14 | 15 | 0 | CEO Agent Output Schema |
| agents/ceo/audit_log_schema.json | 9 | 24 | 6 | 8 | 0 | CEO Agent Audit Log Entry Schema |
| agents/financial_analysis/output_schema.json | 49 | 22 | 14 | 10 | 1 | Financial Analysis Agent Output Schema |
| agents/context_extraction/output_schema.json | 0 | 20 | 10 | 4 | 0 | Context Extraction Agent Output Schema |
| agents/parse_standardization/output_schema.json | 4 | 18 | 9 | 4 | 0 | Parse & Standardization Agent Output Schema |
| agents/macro_analysis/output_schema.json | 0 | 17 | 6 | 6 | 0 | Macro Analysis Agent Output Schema |
| agents/event_impact_mapper/output_schema.json | 1 | 15 | 12 | 8 | 1 | Event Impact Mapper Agent Output Schema |
| agents/event_timeline_alert/output_schema.json | 0 | 15 | 5 | 8 | 0 | Event Timeline Alert Agent Output Schema |
| backend/generated/schemas/ticker_package.schema.json | 64 | 15 | 13 | 0 | 0 | TickerPackage |
| agents/data_collection/output_schema.json | 0 | 14 | 7 | 8 | 0 | Data Collection Agent Output Schema |
| schemas/shared/contradiction_report.schema.json | 0 | 14 | 3 | 6 | 0 | ContradictionReport |
| agents/strategic_synthesis/output_schema.json | 0 | 13 | 14 | 7 | 0 | Strategic Synthesis Agent Output Schema |
| schemas/shared/agent_output_contract.schema.json | 4 | 12 | 4 | 6 | 0 | AgentOutputContract |
| agents/agent_performance_review/output_schema.json | 0 | 11 | 9 | 10 | 0 | Agent Performance Review Output Schema |
| agents/ceo/hiring_request_schema.json | 0 | 11 | 6 | 11 | 0 | Agent Hiring Request Schema |
| agents/final_summary/output_schema.json | 0 | 11 | 6 | 5 | 0 | Final Summary Agent Output Schema |
| agents/qa_review/output_schema.json | 0 | 11 | 2 | 4 | 0 | QA Review Agent Output Schema |
| agents/reconciliation/output_schema.json | 0 | 9 | 6 | 5 | 0 | Reconciliation Agent Output Schema |
| agents/sector_competition/output_schema.json | 0 | 9 | 6 | 4 | 0 | Sector Competition Agent Output Schema |
| schemas/shared/evidence.schema.json | 0 | 9 | 0 | 2 | 0 | EvidenceReference |
| schemas/shared/review_decision.schema.json | 0 | 9 | 3 | 3 | 0 | ReviewDecision |
| agents/event_classification/output_schema.json | 0 | 8 | 6 | 5 | 0 | Event Classification Agent Output Schema |
| agents/kap_watch/output_schema.json | 0 | 8 | 3 | 4 | 0 | KAP Watch Agent Output Schema |
| schemas/shared/task_contract.schema.json | 0 | 6 | 1 | 4 | 0 | TaskContract |
| agents/agent_factory/output_schema.json | 0 | 5 | 0 | 2 | 0 | Agent Factory Output Schema |
| agents/orchestrator/output_schema.json | 0 | 5 | 3 | 2 | 0 | Orchestrator Agent Output Schema |
| agents/technical_analysis/output_schema.json | 0 | 5 | 4 | 15 | 0 | Technical Analysis Agent Output Schema |
| backend/generated/schemas/kap_event.schema.json | 1 | 4 | 0 | 0 | 0 | KapEvent |
| schemas/shared/confidence.schema.json | 0 | 2 | 1 | 2 | 0 | ConfidenceObject |
| backend/generated/schemas/engine_output.schema.json | 28 | 0 | 3 | 0 | 0 | EngineOutput |


## Agent -> schema mapping

| agent | schema | shared_contract |
| --- | --- | --- |
| agent_factory | agents/agent_factory/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| agent_performance_review | agents/agent_performance_review/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| ceo | agents/ceo/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| context_extraction | agents/context_extraction/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| data_collection | agents/data_collection/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| event_classification | agents/event_classification/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| event_impact_mapper | agents/event_impact_mapper/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| event_timeline_alert | agents/event_timeline_alert/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| final_summary | agents/final_summary/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| financial_analysis | agents/financial_analysis/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| kap_watch | agents/kap_watch/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| macro_analysis | agents/macro_analysis/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| orchestrator | agents/orchestrator/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| parse_standardization | agents/parse_standardization/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| qa_review | agents/qa_review/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| reconciliation | agents/reconciliation/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| sector_competition | agents/sector_competition/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| strategic_synthesis | agents/strategic_synthesis/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |
| technical_analysis | agents/technical_analysis/output_schema.json | schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end) |


## $ref graph (cross-file only)

| source | ref | resolved_to |
| --- | --- | --- |
| agents/event_impact_mapper/output_schema.json | https://financex.io/schemas/shared/evidence | MISSING |
| agents/financial_analysis/output_schema.json | https://financex.io/schemas/shared/evidence | MISSING |
| schemas/shared/agent_output_contract.schema.json | https://financex.internal/schemas/shared/confidence.schema.json | schemas/shared/confidence.schema.json |
| schemas/shared/agent_output_contract.schema.json | https://financex.internal/schemas/shared/confidence.schema.json | schemas/shared/confidence.schema.json |
| schemas/shared/agent_output_contract.schema.json | https://financex.internal/schemas/shared/evidence.schema.json | schemas/shared/evidence.schema.json |
| schemas/shared/agent_output_contract.schema.json | https://financex.internal/schemas/shared/contradiction_report.schema.json | schemas/shared/contradiction_report.schema.json |


## Broken or unresolved $ref targets

| source | ref |
| --- | --- |
| agents/event_impact_mapper/output_schema.json | https://financex.io/schemas/shared/evidence |
| agents/financial_analysis/output_schema.json | https://financex.io/schemas/shared/evidence |


## Unconstrained string fields

| schema | field |
| --- | --- |
| agents/agent_factory/output_schema.json | design_notes |
| agents/agent_factory/output_schema.json | designed_agent_id |
| agents/agent_factory/output_schema.json | estimated_integration_effort |
| agents/agent_factory/output_schema.json | hiring_request_id |
| agents/agent_factory/output_schema.json | output_id |
| agents/agent_performance_review/output_schema.json | agent_evaluations[].agent_id |
| agents/agent_performance_review/output_schema.json | agent_evaluations[].feedback_file_written |
| agents/agent_performance_review/output_schema.json | agent_evaluations[].persistent_issues[].issue |
| agents/agent_performance_review/output_schema.json | escalations[].agent_id |
| agents/agent_performance_review/output_schema.json | escalations[].issue |
| agents/agent_performance_review/output_schema.json | next_steps[].action |
| agents/agent_performance_review/output_schema.json | next_steps[].responsible |
| agents/agent_performance_review/output_schema.json | overall_report_quality.summary |
| agents/agent_performance_review/output_schema.json | report_evaluated.company |
| agents/agent_performance_review/output_schema.json | report_evaluated.ticker |
| agents/agent_performance_review/output_schema.json | session_id |
| agents/ceo/audit_log_schema.json | actor |
| agents/ceo/audit_log_schema.json | definitions.AgentAssignedDetails.agent_id |
| agents/ceo/audit_log_schema.json | definitions.AgentAssignedDetails.task_contract_id |
| agents/ceo/audit_log_schema.json | definitions.ContradictionDetails.affected_metric |
| agents/ceo/audit_log_schema.json | definitions.ContradictionDetails.agent_a |
| agents/ceo/audit_log_schema.json | definitions.ContradictionDetails.agent_b |
| agents/ceo/audit_log_schema.json | definitions.ContradictionDetails.contradiction_id |
| agents/ceo/audit_log_schema.json | definitions.CostBreachDetails.action_taken |
| agents/ceo/audit_log_schema.json | definitions.FallbackDetails.runtime_mode_after |
| agents/ceo/audit_log_schema.json | definitions.FallbackDetails.runtime_mode_before |
| agents/ceo/audit_log_schema.json | definitions.FallbackDetails.trigger_reason |
| agents/ceo/audit_log_schema.json | definitions.HiringRequestDetails.gap_description |
| agents/ceo/audit_log_schema.json | definitions.HiringRequestDetails.proposed_agent |
| agents/ceo/audit_log_schema.json | definitions.HiringRequestDetails.request_id |
| agents/ceo/audit_log_schema.json | definitions.OutputReviewDetails.agent_id |
| agents/ceo/audit_log_schema.json | definitions.OutputReviewDetails.review_id |
| agents/ceo/audit_log_schema.json | definitions.RevisionDetails.agent_id |
| agents/ceo/audit_log_schema.json | definitions.RevisionDetails.revision_id |
| agents/ceo/audit_log_schema.json | integrity_hash |
| agents/ceo/audit_log_schema.json | session_id |
| agents/ceo/hiring_request_schema.json | audit_entry_id |
| agents/ceo/hiring_request_schema.json | business_impact |
| agents/ceo/hiring_request_schema.json | evidence_of_gap[].description |
| agents/ceo/hiring_request_schema.json | evidence_of_gap[].reference_id |
| agents/ceo/hiring_request_schema.json | proposed_resolution.design_notes |
| agents/ceo/hiring_request_schema.json | proposed_resolution.integration_points[].other_agent_id |
| agents/ceo/hiring_request_schema.json | proposed_resolution.integration_points[].payload_description |
| agents/ceo/hiring_request_schema.json | proposed_resolution.proposed_agent_id |
| agents/ceo/hiring_request_schema.json | proposed_resolution.proposed_agent_name |
| agents/ceo/hiring_request_schema.json | proposed_resolution.required_capabilities[].capability_name |
| agents/ceo/hiring_request_schema.json | proposed_resolution.required_capabilities[].description |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.agents_with_issues[].agent_id |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.session_id |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.target_company |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.ticker |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.agent_id |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.audit_entry_id |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.rejection_reasons[].description |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.reviewed_output_id |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.revision_instructions[].failure_type |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.revision_instructions[].instruction |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.revision_instructions[].revision_id |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.revision_instructions[].specific_issue |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.session_id |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.assigned_agents[].agent_id |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.context.analysis_scope |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.context.special_instructions |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.context.target_company |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.context.ticker |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.session_id |
| agents/ceo/output_schema.json | definitions.TaskContractOutput.task_id |
| agents/context_extraction/output_schema.json | accounting_policy_context.revenue_recognition_method |
| agents/context_extraction/output_schema.json | company_profile.bist_sector |
| agents/context_extraction/output_schema.json | company_profile.business_description |
| agents/context_extraction/output_schema.json | company_profile.controlling_shareholder |
| agents/context_extraction/output_schema.json | company_profile.geographic_exposure |
| agents/context_extraction/output_schema.json | company_profile.legal_name |
| agents/context_extraction/output_schema.json | company_profile.ticker |
| agents/context_extraction/output_schema.json | management_guidance[].guidance_text |
| agents/context_extraction/output_schema.json | management_guidance[].metric |
| agents/context_extraction/output_schema.json | management_guidance[].source_document_id |
| agents/context_extraction/output_schema.json | operational_context.capacity |
| agents/context_extraction/output_schema.json | operational_context.seasonality |
| agents/context_extraction/output_schema.json | output_id |


## Fields that look enum-worthy but remain free-form strings

| schema | field |
| --- | --- |
| agents/agent_performance_review/output_schema.json | next_steps[].action |
| agents/ceo/audit_log_schema.json | definitions.FinalApprovalDetails.final_confidence |
| agents/ceo/hiring_request_schema.json | business_impact |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.agents_with_issues[].issue_type |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.output_artifacts[].artifact_type |
| agents/ceo/output_schema.json | definitions.FinalApprovalOutput.output_artifacts[].confidence |
| agents/ceo/output_schema.json | definitions.ReviewDecisionOutput.revision_instructions[].failure_type |
| agents/context_extraction/output_schema.json | company_profile.bist_sector |
| agents/event_impact_mapper/output_schema.json | event_impacts[].quantification_estimate.confidence |
| agents/event_timeline_alert/output_schema.json | impact_timeline[].event_type |
| agents/final_summary/output_schema.json | company_overview.runtime_mode |
| agents/final_summary/output_schema.json | company_overview.sector |
| agents/financial_analysis/output_schema.json | company.bist_sector |
| agents/financial_analysis/output_schema.json | restatement_flags[].impact |
| agents/kap_watch/output_schema.json | disclosure_inventory[].disclosure_type |
| agents/qa_review/output_schema.json | cross_reference_findings[].finding_type |
| agents/qa_review/output_schema.json | quality_flags[].flag_type |
| backend/generated/schemas/ticker_package.schema.json | $defs.CompanyInfo.sector |


## Fields likely required in practice but optional in schema

| schema | field |
| --- | --- |
| agents/final_summary/output_schema.json | warnings |
| agents/kap_watch/output_schema.json | warnings |
| agents/qa_review/output_schema.json | overall_score |
| agents/qa_review/output_schema.json | review_notes |
| backend/generated/schemas/engine_output.schema.json | warnings |
| backend/generated/schemas/ticker_package.schema.json | overall_score |
| backend/generated/schemas/ticker_package.schema.json | warnings |
| schemas/shared/agent_output_contract.schema.json | analysis_session_id |
| schemas/shared/agent_output_contract.schema.json | claims |
| schemas/shared/agent_output_contract.schema.json | company_ticker |
| schemas/shared/agent_output_contract.schema.json | payload |
| schemas/shared/agent_output_contract.schema.json | warnings |
| schemas/shared/contradiction_report.schema.json | analysis_session_id |
| schemas/shared/evidence.schema.json | company_ticker |
| schemas/shared/review_decision.schema.json | analysis_session_id |
| schemas/shared/review_decision.schema.json | overall_score |
| schemas/shared/task_contract.schema.json | analysis_session_id |
| schemas/shared/task_contract.schema.json | company_ticker |


## Key audit findings

- `schemas/shared/agent_output_contract.schema.json` documents a universal wrapper, but `backend/src/schema-validator.ts` mostly validates per-agent schemas or falls back to regex/text checks rather than full AJV enforcement.
- Many agent output schemas have rich required-field lists, but depth constraints are shallow: long-form narrative fields rarely use `minLength`, and arrays often omit `minItems`.
- `qa_review.output_schema.json` leaves `overall_score` optional even though `backend/src/orchestrator.ts` score-blocks delivery on it.
- Cross-agent checklist enforcement (`findings[]` -> `addressed_findings[]`) does not exist in the current shared contract.
