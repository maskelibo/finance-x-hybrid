# Workflow: Full Integrated Analysis

## Overview
End-to-end autonomous analysis of a single BIST-listed company. Triggered when a user selects a company and requests a comprehensive report. No manual intervention required after trigger.

---

## Trigger Condition
User selects a company (e.g., ASELSAN / ASELS) via the Finance X dashboard and initiates a full analysis. Runtime mode must be specified: `fast_screening`, `standard_institutional`, or `deep_dive`.

---

## Active Agents (All 20)
| Agent | Role |
|---|---|
| ceo | Governance, mandate interpretation, final approval |
| orchestrator | Task sequencing, parallel coordination |
| data_collection | Acquire all raw data from KAP, BIST, market feeds |
| parse_standardization | Parse and normalize all documents |
| reconciliation | Validate data quality and consistency |
| context_extraction | Extract business model from activity/annual reports |
| financial_analysis | Compute and interpret financial ratios and trends |
| sector_competition | Industry structure, peer comparison |
| macro_analysis | Country macro, inflation, rates, policy |
| technical_analysis | Price, volume, moving averages, support/resistance |
| kap_watch | Monitor and feed new KAP disclosures |
| event_classification | Classify events detected in KAP disclosures |
| event_impact_mapper | Map events to financial statement impact |
| event_timeline_alert | Build event timeline and forward-looking alerts |
| strategic_synthesis | Combine fundamental + event + sector + macro into coherent narrative |
| final_summary | Produce executive summary report |
| qa_review | Review all specialist outputs before synthesis |
| agent_factory | Spun up on-demand if new capability is needed |
| cost_performance_optimizer | Monitor and report cost efficiency |

---

## Step-by-Step Flow

### Phase 1 — Mandate Interpretation (CEO)
**Duration:** 30–60 seconds  
**Agent:** `ceo`

1. CEO receives user request: company ticker + runtime mode.
2. CEO validates the request: is ticker valid BIST company? Is runtime mode set?
3. CEO issues analysis mandate to `orchestrator` with:
   - company_ticker
   - company_name
   - runtime_mode
   - quality_threshold per mode
   - analysis_session_id
4. CEO logs mandate to audit ledger.

**Quality Gate:** CEO must confirm mandate is well-formed before issuing to orchestrator.

---

### Phase 2 — Data Acquisition (Parallel)
**Duration:** 2–10 minutes  
**Agents:** `data_collection`, `kap_watch`

`orchestrator` issues tasks in parallel:

**Task A — data_collection:**
- Collect last 5 years of financial statements (balance sheet, income, cash flow)
- Collect last 5 annual/activity reports
- Collect all KAP disclosures for company (last 5 years)
- Collect current market data (OHLCV, moving averages)
- Output: `data_collection_result`

**Task B — kap_watch (continuous):**
- Pull latest KAP disclosures for company (last 90 days)
- Flag any new disclosures not yet in knowledge base
- Output: `kap_watch_feed`

**Quality Gate:** If data_collection returns < 3 years of financials, orchestrator must flag to CEO and consider degraded mode.

---

### Phase 3 — Parsing & Standardization
**Duration:** 3–8 minutes  
**Agent:** `parse_standardization`

- Parse all collected documents (PDFs, HTML, XBRL)
- Normalize financial statements to standard line items
- Extract KAP disclosure text and metadata
- Output: `parsed_document` (one per document)

**Quality Gate:** Parser confidence < 0.70 triggers warning. < 0.50 triggers reconciliation escalation.

---

### Phase 4 — Data Quality & Reconciliation
**Duration:** 2–5 minutes  
**Agent:** `reconciliation`

- Validate internal consistency of each financial statement
- Check balance sheet equation (Assets = Liabilities + Equity)
- Check cross-statement linkage (net income → retained earnings, operating CF vs net income)
- Detect duplicates and stale documents
- Assign data_quality_score to each source
- Output: `reconciliation_report`

**Quality Gate:** If any statement has data_quality_score < 0.6, financial analysis must use degraded confidence. If critical data is missing, CEO must be notified and decide whether to continue.

---

### Phase 5 — Context Extraction
**Duration:** 3–6 minutes  
**Agent:** `context_extraction`

- Read annual/activity reports
- Extract: business model, revenue sources, customer structure, production/sales cycle, segment breakdown, FX sensitivity, seasonal patterns, capital intensity, key risks
- Output: `context_profile`

This output is passed to `financial_analysis` to shape ratio interpretation.

---

### Phase 6 — Specialist Analysis (Parallel)
**Duration:** 5–20 minutes  
**Agents:** `financial_analysis`, `sector_competition`, `macro_analysis`, `technical_analysis`, `event_classification`, `event_impact_mapper`, `event_timeline_alert`

All run in parallel after Phase 4 and 5 complete.

**financial_analysis:**
- Computes ratios: profitability, liquidity, leverage, efficiency, growth
- Interprets ratios using context_profile (not generic textbook logic)
- Multi-year trend analysis
- Output: `financial_analysis_report`

**sector_competition:**
- Industry structure analysis (Porter's 5 forces style)
- Peer identification and comparison
- Market positioning
- SWOT
- Output: `sector_competition_report`

**macro_analysis:**
- Turkey macro: inflation, interest rates, TRY/USD, GDP
- Policy environment
- Transmission to company-level impact
- Output: `macro_analysis_report`

**technical_analysis:**
- Daily/weekly/long-term price trend
- 50/100/200-day MAs
- Support/resistance levels
- Volume analysis
- Bullish/bearish scenarios
- Output: `technical_analysis_report`

**event_classification** (inputs from kap_watch):
- Classify each detected event by type
- Output: `event_classification_result`

**event_impact_mapper** (inputs from event_classification):
- Map each event to financial statement impact
- Output: `event_impact_assessment`

**event_timeline_alert** (inputs from event_impact_mapper):
- Build chronological event timeline
- Flag forward-looking alerts
- Output: `event_timeline`

**Quality Gate:** Each specialist output must go through `qa_review` before being passed to synthesis.

---

### Phase 7 — QA Review
**Duration:** 3–8 minutes  
**Agent:** `qa_review`

Reviews each specialist output against the rubric:
- Evidence sufficiency
- Confidence calibration
- Claim support
- Completeness
- No false certainty

For each output:
- `approved` → passes to synthesis
- `revision_requested` → returned to originating agent (max 2 retries)
- `rejected` → CEO notified, degraded mode for that layer

---

### Phase 8 — Strategic Synthesis
**Duration:** 5–15 minutes  
**Agent:** `strategic_synthesis`

Inputs: approved outputs from financial_analysis, sector_competition, macro_analysis, event_impact_mapper, event_timeline_alert, context_profile.

- Integrates all layers into coherent analytical narrative
- Detects cross-layer contradictions
- Assigns synthesis-level confidence
- Separates facts / inferences / scenarios / speculations
- Produces: `strategic_synthesis_report`

QA review required before passing to final_summary.

---

### Phase 9 — Technical Report
**Duration:** 2–5 minutes  
**Agent:** `technical_analysis` (already completed in Phase 6)

Technical Analysis Report is a standalone output, reviewed and approved separately.

---

### Phase 10 — Final Summary
**Duration:** 3–8 minutes  
**Agent:** `final_summary`

Inputs: `strategic_synthesis_report` + `technical_analysis_report`

- Produces 3 outputs:
  1. **Fundamental Analysis Report** (full)
  2. **Technical Analysis Report** (formatted)
  3. **Executive Summary** (decision-supporting, concise)
- All confidence labels preserved
- Missing inputs disclosed
- No investment advice language

QA review required.

---

### Phase 11 — CEO Final Approval
**Duration:** 1–3 minutes  
**Agent:** `ceo`

- Reviews final summary package
- Checks all critical contradictions are resolved or disclosed
- Approves or requests final revision
- Logs approval to audit ledger
- Issues `ceo_session_summary`
- Delivers reports to user

---

## Output Artifacts
1. Fundamental Analysis Report (PDF/Markdown)
2. Technical Analysis Report (PDF/Markdown)
3. Executive Summary (PDF/Markdown)
4. Event Timeline with alerts
5. CEO Session Summary (internal audit)
6. Full audit log for the session

---

## Expected Latency by Mode
| Mode | Expected Duration |
|---|---|
| fast_screening | 10–20 minutes |
| standard_institutional | 30–60 minutes |
| deep_dive | 90–180 minutes |

---

## Fallback Behavior
- Missing financial data → Degraded mode (see workflows/degraded_mode.md)
- Agent failure → Retry up to 2x, then skip layer with explicit disclosure
- QA rejection after 2 revisions → CEO decides: accept with low confidence or omit layer
- Budget exceeded → Cost optimizer reports to CEO, CEO may reduce scope
