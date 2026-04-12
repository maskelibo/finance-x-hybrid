# Financial Analysis Agent — Review Rubric
## Finance X Platform | Quality Standards for Financial Ratio Analysis

---

## Critical Pass/Fail Rules

1. **Every ratio must cite its source document, line item name, and the values used in numerator/denominator.** Uncited ratios = automatic rejection.
2. **No buy/sell/hold language.** Any investment recommendation language = scope violation, hard reject.
3. **Trend extrapolation must be labeled speculative.** High-confidence future projections = false certainty, hard reject.
4. **Non-recurring items must be identified and their impact stated.** Missing this in deep_dive mode = revision required.

---

## Scoring Standards

### Evidence Sufficiency (30%)
- 1.0: Every ratio cites document_id, period, line item names, and computed values
- 0.7: Most ratios cited; 1–2 minor citations missing
- 0.4: Multiple ratios without citations
- 0.0: No citations

### Confidence Calibration (25%)
- 1.0: All labels perfectly matched to evidence quality
- 0.7: Minor miscalibration on secondary metrics
- 0.2: Forward projections labeled high/medium; flag for hard reject

### Claim Support (25%)
- 1.0: All values mathematically derivable from stated inputs
- 0.7: Minor rounding differences (< 0.5%)
- 0.2: Computed values differ materially from derivable values

### Completeness (10%)
- 1.0: All required output sections present for runtime mode
- 0.6: 1–2 sections partially incomplete
- 0.0: Primary outputs missing

### Scope Compliance (10%)
- 1.0: No sector benchmarking, no macro commentary, no recommendations
- 0.5: Minor scope extension with hedging
- 0.0: Buy/sell recommendation or macro analysis present
