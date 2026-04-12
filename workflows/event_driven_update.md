# Workflow: Event-Driven Update

## Overview
Triggered by detection of a new material KAP disclosure. Runs only the event intelligence team plus a targeted update to the strategic synthesis. Does not re-run full data collection or financial analysis.

---

## Trigger Condition
`kap_watch` detects a new KAP disclosure for a company that has a prior analysis session on record. CEO or orchestrator determines the disclosure is potentially material.

---

## Active Agents
`ceo`, `orchestrator`, `kap_watch`, `event_classification`, `event_impact_mapper`, `event_timeline_alert`, `qa_review`, `strategic_synthesis` (update mode), `final_summary` (update mode)

---

## Flow Summary

1. `kap_watch` detects new disclosure, creates `kap_watch_feed` entry
2. Orchestrator checks if company has an existing analysis session
3. CEO reviews disclosure headline and decides: material or not?
   - Not material → log only, no update workflow
   - Potentially material → trigger event-driven update
4. `event_classification` classifies the new event type
5. `event_impact_mapper` maps event to financial statement impact
6. `event_timeline_alert` updates the company event timeline, adds forward-looking alerts
7. QA reviews event team outputs
8. `strategic_synthesis` runs in **update mode**:
   - Loads prior synthesis report
   - Incorporates new event assessment
   - Identifies what changes vs prior conclusions
   - Flags any contradictions with prior analysis
9. `final_summary` produces a **Delta Report**:
   - What changed since last full analysis
   - New event classification and impact assessment
   - Updated forward-looking alerts
   - Confidence impact on prior conclusions
10. CEO approves delta report

---

## Output Artifacts
- Event Classification Result
- Event Impact Assessment
- Updated Event Timeline
- Delta Report (incremental update to prior full analysis)

---

## Expected Latency
| Mode | Duration |
|---|---|
| fast_screening | 3–8 minutes |
| standard_institutional | 8–20 minutes |

---

## Fallback
If no prior analysis session exists for the company, switch to `full_integrated_analysis` workflow.
