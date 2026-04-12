# Workflow: Degraded Mode

## Overview
Defines how the Finance X platform behaves when data is partially missing, agents fail, or confidence thresholds cannot be met. The platform must never produce false completeness. Partial output with explicit uncertainty is always preferred over fabricated completeness.

---

## Degradation Triggers

| Trigger | Severity | Response |
|---|---|---|
| < 2 years of financial statements available | Major | Financial analysis proceeds with reduced scope; confidence capped at `low` |
| Only 1 year of financials | Critical | Multi-year trend analysis blocked; single-period ratios only; synthesis must disclose |
| No activity/annual report available | Moderate | context_extraction skipped; financial ratios interpreted generically; synthesis warns |
| KAP disclosure data unavailable | Moderate | Event intelligence team outputs `kap_watch_feed` with empty result; all event layers skipped |
| Market data unavailable | Moderate | technical_analysis skipped; synthesis and executive summary note absence |
| Parser confidence < 0.50 for primary financials | Critical | Reconciliation blocks financial analysis; CEO must decide continue/abort |
| Reconciliation data_quality_score < 0.50 | Critical | Affected statements quarantined; analysis proceeds only on validated statements |
| Agent fails after 2 retries | Major | Layer omitted; disclosure added to all downstream outputs and final report |
| QA rejects output after 2 revisions | Major | CEO decides: accept with low confidence label, or omit layer entirely |
| Cost budget exceeded | Moderate | Cost optimizer alerts CEO; CEO may reduce scope (e.g., drop deep-dive to standard) |
| Macro data unavailable | Minor | macro_analysis uses last available data with staleness warning |

---

## What Remains Possible in Each Degradation Scenario

### Scenario A: Only 3 years of financials (vs 5 required)
**Still possible:**
- 3-year ratio trend analysis
- Profitability, liquidity, leverage ratios
- Single-period balance sheet, income, cash flow interpretation
- Context extraction (if reports available)
- Sector and macro analysis (not data-dependent)
- Technical analysis
- Event intelligence

**Not possible:**
- 5-year growth trend analysis
- Long-term capital cycle assessment

**Disclosure required:** "Financial trend analysis is based on 3 years of data (2022–2024) rather than the standard 5 years. Multi-year structural trends may be less reliable."

---

### Scenario B: No activity/annual reports
**Still possible:**
- All quantitative financial analysis
- Technical analysis
- Event intelligence (from KAP disclosures)
- Sector and macro analysis

**Not possible:**
- Business model context extraction
- Ratio interpretation informed by operational context (segment structure, seasonality, FX sensitivity, customer concentration)
- Ratios interpreted generically, not company-specifically

**Disclosure required:** "Activity and annual reports were unavailable. Financial ratios are interpreted without company-specific operational context. Conclusions carry higher uncertainty."

---

### Scenario C: Major agent failure (e.g., financial_analysis fails)
**Still possible:**
- All other layers that don't depend on financial_analysis output
- Technical analysis
- Event intelligence
- Sector and macro analysis

**Not possible:**
- Fundamental analysis
- Financial ratio synthesis

**CEO Decision:** Proceed without fundamental layer (technical + event + sector + macro only) OR abort and retry full analysis.

**Disclosure required in final report:** "Fundamental financial analysis could not be completed in this run due to a processing error. This report contains technical, sector, macro, and event analysis only."

---

### Scenario D: KAP event data unavailable
**Still possible:**
- All fundamental and technical analysis
- Synthesis based on historical financials and context only

**Not possible:**
- Event intelligence pipeline
- Forward-looking alerts

**Disclosure required:** "KAP event intelligence was unavailable for this analysis. The report does not reflect recent corporate disclosures or event-driven impacts."

---

## Degraded Mode Confidence Rules

1. If any critical layer is missing, `confidence_overall` of the final output must be `low` or `speculative`.
2. Synthesis agent must not upgrade confidence beyond what the weakest available layer supports.
3. Every missing layer must appear in `missing_inputs[]` of the final output contract.
4. CEO must explicitly approve any degraded output before delivery.

---

## CEO Degraded Mode Decision Protocol

When degradation is detected, CEO must:
1. Assess what percentage of the analytical mandate can still be fulfilled
2. If >= 70% can be fulfilled → proceed with disclosures
3. If 40–69% can be fulfilled → inform user, get explicit confirmation to proceed
4. If < 40% can be fulfilled → abort session, deliver failure report explaining what was unavailable and why

---

## Degraded Mode Output Template

Every report produced in degraded mode must include a prominent section:

```
⚠ DEGRADED ANALYSIS NOTICE
This report was produced under degraded conditions. The following analytical layers 
could not be completed:

- [Layer name]: [Reason]
- [Layer name]: [Reason]

Conclusions in this report carry [low/speculative] confidence unless explicitly marked otherwise.
All findings should be independently verified before use.
```
