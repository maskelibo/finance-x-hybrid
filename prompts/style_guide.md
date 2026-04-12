# Finance X — LLM Prompt & Output Style Guide

## Purpose
This guide governs the tone, structure, and language standards for all LLM-generated content within the Finance X platform. All agent system prompts, output templates, and user-facing reports must comply.

---

## 1. Tone

### Required Tone
- **Analytical** — facts-first, interpretation-second
- **Precise** — specific numbers, specific periods, specific sources
- **Measured** — neither optimistic nor pessimistic without evidence
- **Professional** — institutional quality, not retail/media quality
- **Structured** — use headers, bullet points, and tables; avoid prose walls

### Prohibited Tone
- Promotional ("exciting growth prospects")
- Alarmist without evidence ("dangerously high debt")
- Casual or colloquial
- Hedging without substance ("things could go either way")

---

## 2. Claim Structure

Every substantive claim must follow this structure:

**[Assertion] + [Evidence] + [Confidence label]**

Examples:

✅ Correct:
> "Revenue grew 23% YoY in 2024 (KAP financial disclosure, 2024FY income statement, line: Net Sales). **[Fact, High Confidence]**"

✅ Correct:
> "Margin compression in 2024 appears partly attributable to rising raw material costs per management commentary (Activity Report 2024, p.34), though exact cost breakdown is not disclosed. **[Inference, Medium Confidence]**"

❌ Incorrect:
> "The company is well-positioned for strong growth."

❌ Incorrect:
> "Revenue increased significantly." (no number, no source)

---

## 3. Forbidden Phrases

The following phrases are strictly prohibited in all outputs:

| Forbidden Phrase | Why |
|---|---|
| "strong buy" / "buy" / "sell" | Investment advice — not permitted |
| "guaranteed" | No analysis guarantees outcomes |
| "certainly" / "definitely" | False certainty |
| "obviously" / "clearly" | Assumes conclusion |
| "exciting opportunity" | Promotional |
| "the market will" | Future prediction presented as fact |
| "investors should" | Investment recommendation |
| "we believe" | First-person; use "the analysis suggests" |
| "strong growth ahead" | Unsupported forward claim |
| "undervalued" / "overvalued" | Valuation conclusion without DCF or comparable |
| "excellent management" | Subjective without evidence |
| "best in class" | Superlative without peer comparison data |

---

## 4. Confidence Labeling Conventions

Every claim must be labeled with one of the following:

| Label | Meaning | When to Use |
|---|---|---|
| `[Fact, High Confidence]` | Directly from verified source data | Audited financial figures, official KAP disclosures |
| `[Fact, Medium Confidence]` | From source data with minor quality concerns | Unaudited interim reports, partially parsed documents |
| `[Inference, High Confidence]` | Derived from multiple strong evidence sources | Ratio calculated from verified statements |
| `[Inference, Medium Confidence]` | Derived from evidence with gaps | Segment estimate from partial disclosure |
| `[Inference, Low Confidence]` | Weak or indirect evidence | Estimation from industry average |
| `[Scenario]` | Hypothetical forward-looking analysis | Stress test, management guidance extrapolation |
| `[Speculation]` | Minimal direct evidence | Market rumor, analyst consensus without disclosed data |

---

## 5. Output Format Standards

### Financial Tables
- All monetary values: Turkish Lira (TRY) unless otherwise stated
- Unit: millions TRY (TRY mn) unless context requires billions
- Percentages: one decimal place (e.g., 23.4%)
- Growth rates: always specify base period ("YoY", "QoQ", "5Y CAGR")

### Report Sections
Every report must have:
- Header: Company name, ticker, period covered, analysis date, runtime mode, confidence_overall
- Data Sources section listing all source documents
- Limitations and Disclosures section at the end
- Confidence label on every conclusion

### Temporal References
- Always use absolute periods, never relative ("in 2024", not "last year")
- Fiscal year: state whether calendar year or fiscal year ending month
- For trends: explicitly state start and end period

---

## 6. Missing Data Protocol

When a data point is unavailable:

✅ Correct:
> "Net debt position as of 2024Q3 is unavailable due to incomplete financial statement disclosure. This limits leverage assessment for the current period. **[Data Gap]**"

❌ Incorrect:
> Silently skip the metric
> Estimate without disclosing the estimate

---

## 7. Contradiction Handling

When two sources conflict:

✅ Correct:
> "Revenue figure for 2024H1 differs between the KAP interim disclosure (TRY 4,230mn) and the annual report footnote (TRY 4,190mn). The discrepancy has not been resolved. Both figures are presented. **[Contradiction, Medium Severity]**"

❌ Incorrect:
> Silently use one figure without noting the conflict

---

## 8. Forward-Looking Statements

All forward-looking content must be explicitly labeled:

> **[Forward-Looking Scenario]** "If the defense procurement contract announced in [KAP disclosure date] converts to revenue in 2025H2 as management indicated, revenue growth could accelerate to 15–20% YoY. This is a scenario based on management guidance and is not a forecast. Actual results may differ materially."
