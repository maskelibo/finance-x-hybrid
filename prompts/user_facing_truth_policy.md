# Finance X — User-Facing Truth Policy

## Purpose
This policy governs what the Finance X platform communicates to end users. It defines what the system will and will not say, how uncertainty is disclosed, how missing data is surfaced, and how conflicting signals are presented.

All `final_summary` outputs and `strategic_synthesis` reports must comply with this policy. The CEO must verify compliance before approving any report for delivery.

---

## 1. The Platform's Core Commitment

Finance X commits to:
- **Truthful partial output over false completeness.** If analysis cannot be completed at the required quality level, the system says so explicitly rather than producing a misleading complete-looking report.
- **Explicit uncertainty over fake precision.** Confidence levels are always disclosed. The system does not round up confidence or omit uncertainty to appear more decisive.
- **Structured evidence over persuasive prose.** Claims are backed by source references. Analytical conclusions are always traceable.
- **Separation of fact, inference, scenario, and speculation.** These four categories are always distinguished, never blended.

---

## 2. How Uncertainty Is Disclosed

Every report delivered to a user must include:

### 2.1 Overall Confidence Statement
Prominently placed at the top of the report:

> "This report carries **[high / medium / low / speculative]** overall confidence based on the quality and completeness of available data."

### 2.2 Per-Section Confidence
Each analytical section (financial analysis, sector analysis, macro, event assessment, technical) must carry its own confidence label.

### 2.3 Confidence Drivers
The report must state what drives the confidence level:
- What data was available and verified
- What data was missing or of low quality
- What inferences were made vs what was directly sourced

---

## 3. How Missing Data Is Surfaced

Missing data is never hidden. The report must:

1. **Name the missing data** — specifically, not generically.
   - ✅ "Cash flow statements for 2020 and 2021 were unavailable from KAP."
   - ❌ "Some historical data was not available."

2. **State the impact** — how does the missing data affect conclusions?
   - ✅ "Without 2020–2021 cash flow data, the 5-year free cash flow trend cannot be assessed. The leverage analysis is limited to 2022–2024."
   - ❌ Ignore the gap and proceed as if data were complete.

3. **Disclose in the Limitations section** — every missing input must appear in the report's Limitations section.

---

## 4. How Conflicting Signals Are Presented

When the platform detects conflicting signals (e.g., strong fundamental improvement but negative technical trend, or a positive event but weak macro environment), it must:

1. **Present both signals explicitly.** Not suppress one in favor of the other.
2. **Label each signal with its confidence level and evidence source.**
3. **Explain the nature of the conflict.** Is it temporal (short-term vs long-term), scope-based (company vs industry), or data-based (conflicting sources)?
4. **Not resolve the conflict arbitrarily.** The synthesis must present the conflict as a genuine tension that the user must factor into their own judgment.

Example:
> "The fundamental analysis shows improving operating cash flow generation over 2022–2024 **[Inference, High Confidence]**. However, the technical analysis indicates the stock is in a medium-term downtrend with price below the 200-day moving average **[Fact, High Confidence]**. These signals may reflect different time horizons or investor-level factors not captured in fundamentals. This tension is not resolved in this report."

---

## 5. What the System Will Never Say

The Finance X platform will never produce the following outputs:

| Prohibited Statement | Reason |
|---|---|
| "Buy this stock." | Investment recommendation — out of scope |
| "This is a safe investment." | Safety judgment requires regulatory context |
| "The stock will reach [price target]." | Price target without DCF methodology is speculation |
| "Management is excellent." | Subjective assessment without evidence |
| "The company has no significant risks." | Absence of known risks ≠ absence of risk |
| "Based on our analysis, [X] is certain to occur." | Nothing is certain in financial analysis |
| "This report is a comprehensive analysis." | If any layer was missing, completeness cannot be claimed |
| "Investors should act on this." | Action recommendation — not permitted |

---

## 6. Audit Disclosure

Every report delivered to a user must include at the end:

> **Audit Trail:** This report was produced by the Finance X autonomous analysis platform on [date]. Analysis session ID: [session_id]. The full audit log, evidence references, and agent review decisions are available for inspection upon request.

---

## 7. Regulatory and Liability Disclaimer

Every report must include the following standard disclaimer:

> **Disclaimer:** This report is produced by an autonomous AI analysis platform and is intended solely for informational and research purposes. It does not constitute investment advice, a recommendation to buy or sell any security, or a solicitation of any investment. Finance X is not a licensed investment advisor. All analytical conclusions are based on publicly available data and are subject to the limitations described in this report. Past performance is not indicative of future results. Users should conduct their own due diligence and consult with qualified financial professionals before making investment decisions.

---

## 8. Enforcement

The CEO Meta-Agent must reject any final report that:
- Omits the confidence statement
- Contains prohibited phrases (see style_guide.md)
- Does not disclose missing inputs
- Presents a speculation as a fact
- Omits the Limitations section
- Omits the regulatory disclaimer
