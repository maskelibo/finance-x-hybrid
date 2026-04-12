# Workflow: Fundamental Only Analysis

## Overview
Runs only the fundamental analysis pipeline — data collection, parsing, reconciliation, context extraction, financial analysis, sector/competition, macro, event intelligence, and synthesis. Technical analysis is excluded.

---

## Trigger Condition
User requests fundamental-only analysis, or technical data is unavailable, or runtime mode is `fast_screening` with explicit exclusion of technical layer.

---

## Active Agents
`ceo`, `orchestrator`, `data_collection`, `parse_standardization`, `reconciliation`, `context_extraction`, `financial_analysis`, `sector_competition`, `macro_analysis`, `kap_watch`, `event_classification`, `event_impact_mapper`, `event_timeline_alert`, `strategic_synthesis`, `final_summary`, `qa_review`

**Excluded:** `technical_analysis`

---

## Flow Summary

1. CEO interprets mandate (fundamental only)
2. Orchestrator plans parallel tasks — no technical_analysis task issued
3. Data collection: financials + KAP (no market OHLCV required)
4. Parse → Reconcile → Context extraction
5. Parallel: financial_analysis + sector_competition + macro_analysis + KAP event team
6. QA review all outputs
7. strategic_synthesis (without technical layer input)
8. final_summary produces:
   - Fundamental Analysis Report
   - Executive Summary (note: technical context unavailable)
9. CEO approval

---

## Output Note
Executive Summary must explicitly state: "Technical analysis was not performed in this run. Market trend assessment is not included."

---

## Expected Latency
| Mode | Duration |
|---|---|
| fast_screening | 8–15 minutes |
| standard_institutional | 20–40 minutes |
| deep_dive | 60–120 minutes |

---

## Fallback
Same as full_integrated_analysis except technical layer is intentionally absent — no degradation disclosure needed for that layer.
