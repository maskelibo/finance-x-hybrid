# Workflow: Technical Only Analysis

## Overview
Runs only the technical analysis pipeline using current market data. No financial statements, KAP disclosures, or fundamental layer. Fast, market-data-driven output.

---

## Trigger Condition
User requests a quick technical read on a BIST ticker without fundamental context. Typically used for short-term timing decisions or screening.

---

## Active Agents
`ceo`, `orchestrator`, `data_collection` (market data only), `technical_analysis`, `qa_review`, `final_summary`

**Excluded:** All fundamental, event, and macro agents.

---

## Flow Summary

1. CEO interprets mandate (technical only)
2. data_collection fetches: daily OHLCV (2 years), current price, volume, index comparison
3. technical_analysis performs:
   - Trend analysis (daily, weekly, long-term)
   - 50/100/200-day moving averages
   - Support and resistance levels
   - Volume behavior
   - Relative strength vs BIST100
   - Bullish and bearish scenarios
4. QA review of technical output
5. final_summary produces:
   - Technical Analysis Report (standalone)
   - Brief note: "Fundamental and event context not included in this run"
6. CEO approves

---

## Output Note
The Technical Analysis Report must carry a disclaimer: "This report is based solely on market price and volume data. No fundamental, financial, or event-level analysis was performed."

---

## Expected Latency
| Mode | Duration |
|---|---|
| fast_screening | 3–6 minutes |
| standard_institutional | 5–10 minutes |
| deep_dive | 10–20 minutes |

---

## Fallback
If market data feed is unavailable, technical_analysis cannot run. CEO must notify user immediately — no partial technical output is acceptable.
