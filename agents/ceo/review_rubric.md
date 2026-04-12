# CEO Agent — Review Rubric
## Finance X Platform | Quality Evaluation Standards

---

## Purpose

This rubric is the CEO Agent's authoritative scoring guide for evaluating every specialist agent output in the Finance X platform. It defines what a passing output looks like, what triggers a revision request, and what triggers a hard rejection for each type of agent output.

The rubric is applied after schema validation passes. It operates on the content and quality of the output, not its format.

---

## Rubric Dimensions (Applied to ALL Agent Outputs)

Every agent output is scored on five dimensions. Each score is 0.0 to 1.0. A weighted overall score is computed. Thresholds determine approval vs. revision vs. rejection.

### Dimension 1: Evidence Sufficiency (Weight: 30%)
**Definition:** Are the claims in this output supported by referenced evidence from real sources?

| Score | Criteria |
|-------|----------|
| 1.0 | Every claim has >= 2 primary source evidence refs; quality scores all >= 0.80 |
| 0.8 | Every claim has >= 1 primary source evidence ref; quality scores >= 0.70 |
| 0.6 | Most claims have evidence; some claims have secondary-only sources; quality >= 0.55 |
| 0.4 | Some claims have evidence; multiple claims lack any evidence ref |
| 0.2 | Minimal evidence; most claims unsupported |
| 0.0 | No evidence references; all claims unsupported |

**Hard Rejection Threshold:** Score < 0.2 (no evidence at all)
**Revision Required Threshold:** Score < 0.6

---

### Dimension 2: Confidence Calibration (Weight: 25%)
**Definition:** Are confidence labels accurately reflecting the strength of evidence?

| Score | Criteria |
|-------|----------|
| 1.0 | All confidence labels precisely match evidence quality; no over-confidence detected |
| 0.8 | Minor calibration issues (1-2 labels slightly elevated); no critical miscalibration |
| 0.6 | Some labels over-confident but no `high` labels on weak evidence |
| 0.4 | Multiple miscalibrated labels; at least one `high` label on medium-quality evidence |
| 0.2 | Widespread miscalibration; forward-looking claims labeled `high` |
| 0.0 | Systematic over-confidence; `guaranteed` or `certain` language present |

**Hard Rejection Threshold:** Score < 0.2 (false certainty present)
**Revision Required Threshold:** Score < 0.6

**Special Rules:**
- Any forward-looking claim labeled `high` confidence is an automatic hard rejection regardless of overall score
- Use of the words "guaranteed", "certain", "will definitely", "no doubt" is an automatic hard rejection
- A `speculative` claim that is not labeled as such is a hard rejection if it appears in a primary conclusion

---

### Dimension 3: Claim Support (Weight: 25%)
**Definition:** Is each claim logically and numerically derivable from the cited evidence?

| Score | Criteria |
|-------|----------|
| 1.0 | All claims are directly derivable from cited evidence with clear logical chain |
| 0.8 | Most claims well-supported; minor inferential leaps with acknowledgment |
| 0.6 | Claims generally supported; some inferential gaps noted in warnings |
| 0.4 | Multiple claims where evidence does not directly support the assertion |
| 0.2 | Most claims exceed what evidence supports; significant inferential overreach |
| 0.0 | Claims contradict cited evidence or evidence is fabricated |

**Hard Rejection Threshold:** Score < 0.2 (fabricated evidence or direct contradiction with cited sources)
**Revision Required Threshold:** Score < 0.6

---

### Dimension 4: Completeness (Weight: 10%)
**Definition:** Does the output address all required sections for its output type and the current runtime mode?

| Score | Criteria |
|-------|----------|
| 1.0 | All required fields populated; all optional fields populated for current runtime mode |
| 0.8 | All required fields populated; minor optional gaps |
| 0.6 | Most required fields populated; 1-2 required fields missing |
| 0.4 | Multiple required fields missing; output materially incomplete |
| 0.2 | Most sections missing; output barely usable |
| 0.0 | Empty output or null content |

**Hard Rejection Threshold:** Score = 0.0 (empty output)
**Revision Required Threshold:** Score < 0.8 for deep_dive mode; Score < 0.6 for standard mode; Score < 0.4 for fast_screening mode

---

### Dimension 5: Scope Compliance (Weight: 10%)
**Definition:** Did the agent stay within its defined responsibilities?

| Score | Criteria |
|-------|----------|
| 1.0 | Output strictly within defined scope; no boundary violations |
| 0.8 | Minor scope extension with appropriate hedging |
| 0.5 | One clear scope violation that does not affect primary conclusions |
| 0.0 | Major scope violation; agent producing conclusions outside its domain |

**Hard Rejection Threshold:** Score < 0.5 (scope violation detected)
**Revision Required Threshold:** Score < 0.8

---

## Approval Thresholds by Runtime Mode

| Mode | Approval Threshold | Revision Threshold | Rejection Threshold |
|------|-------------------|--------------------|---------------------|
| fast_screening | Overall >= 0.65 | 0.45–0.64 | < 0.45 |
| standard_institutional | Overall >= 0.75 | 0.55–0.74 | < 0.55 |
| deep_dive | Overall >= 0.85 | 0.65–0.84 | < 0.65 |

---

## Agent-Specific Review Standards

### data_collection Agent
**Primary concern:** Did the agent accurately report data availability, source quality, and data gaps?
- Evidence sufficiency applied to: source citations, data quality scores
- Special check: Are all missing data gaps explicitly listed in `missing_inputs[]`?
- Scope check: Agent must NOT interpret data, only report its availability and quality
- Hard reject if: Agent makes any analytical claim (interpretation = scope violation)

### parse_standardization Agent
**Primary concern:** Are documents correctly parsed and standardized per BIST/KAP format?
- Evidence sufficiency applied to: source document references, parser confidence scores
- Special check: Are IFRS line items correctly mapped to standard taxonomy?
- Hard reject if: Financial figures differ materially (>1%) from source documents without explanation

### reconciliation Agent
**Primary concern:** Are discrepancies between data sources correctly identified and classified?
- Evidence sufficiency: Both conflicting sources must be cited for every discrepancy
- Special check: Every discrepancy must have a `resolution_status` (resolved / unresolved / escalated)
- Hard reject if: Discrepancy is silently resolved without documentation

### financial_analysis Agent
**Primary concern:** Are ratios and trends correctly calculated from financial statements?
- Evidence sufficiency: Every ratio must cite the exact financial statement source and period
- Special check: Formula disclosure required for non-standard ratios
- Hard reject if: Agent produces buy/sell recommendations (scope violation)
- Confidence calibration: Trend extrapolation must be labeled `speculative` or `low` confidence

### sector_competition Agent
**Primary concern:** Is BIST sector data used correctly for benchmarking?
- Evidence sufficiency: Benchmark data must cite specific company or sector data source
- Special check: Are peer companies correctly identified as BIST-listed?
- Hard reject if: Macro-level claims made without citing macro_analysis agent

### macro_analysis Agent
**Primary concern:** Are Turkish macro variables (TCMB rate, CPI, TRY/USD, GDP) correctly referenced?
- Evidence sufficiency: All macro data must cite official TCMB, TUIK, or equivalent primary source
- Special check: Are macro-to-company linkages explicitly explained?
- Hard reject if: Agent uses non-Turkish macro data without explaining the translation

### technical_analysis Agent
**Primary concern:** Are chart patterns and price signals correctly identified with appropriate uncertainty?
- Evidence sufficiency: Price data source and period must be cited
- Special check: No pattern is labeled `high` confidence; technical analysis is inherently `medium` or lower
- Hard reject if: Technical signals labeled as predictive certainties

### strategic_synthesis Agent
**Primary concern:** Are cross-domain signals correctly integrated without overreach?
- Evidence sufficiency: Every synthesis claim must trace back to at least one approved specialist output
- Special check: Contradictions between specialist outputs must be explicitly addressed
- Hard reject if: Synthesis introduces new claims not derivable from specialist inputs
- Hard reject if: Contradictions between specialists are silently resolved without disclosure

### final_summary Agent
**Primary concern:** Is the user-facing summary accurate, appropriately uncertain, and complete?
- Evidence sufficiency: All summary claims must trace to approved specialist outputs
- Special check: All mandatory disclosures must be present (no investment advice, confidence labels, data gaps)
- Hard reject if: Summary contains stronger claims than underlying analysis supports
- Hard reject if: Mandatory disclosures are absent

### kap_watch Agent
**Primary concern:** Are KAP disclosures correctly monitored and reported?
- Evidence sufficiency: Every disclosure must link to a real KAP document ID and URL
- Special check: Are timestamps accurate and within the monitoring window?
- Hard reject if: Agent invents disclosures that do not exist in KAP

### event_classification Agent
**Primary concern:** Are events correctly classified per the Finance X taxonomy?
- Evidence sufficiency: Classification must cite the originating KAP disclosure
- Special check: Classification confidence reflects the clarity of the disclosure language
- Hard reject if: Same event classified under multiple mutually exclusive categories without explanation

### event_impact_mapper Agent
**Primary concern:** Are financial statement impacts correctly mapped with appropriate evidence?
- Evidence sufficiency: Impact mapping must cite both the event source and the financial theory/precedent
- Special check: Quantification claims require explicit methodology
- Hard reject if: Impact direction stated as certain for events with `speculative` classification

---

## Contradiction Review Standards

When reviewing for contradictions, apply these standards:

### Numerical Contradictions
- Two values for the same metric differ by more than 1%: flag as CRITICAL contradiction
- Two values differ by less than 1% due to rounding: note the rounding, approve with comment

### Directional Contradictions
- "Revenue growing" vs. "Revenue declining": CRITICAL if both in same period
- "Margins expanding" vs. "Margins compressing": HIGH if same metric and period

### Inference vs. Fact Contradictions
- A confirmed fact from data_collection/financial_analysis overrides an inference from synthesis agents
- The synthesis agent must revise to align with confirmed facts or explicitly explain the discrepancy

### Scope-Overlap Contradictions
- When two agents cover the same topic from different angles and reach different conclusions, both are valid until strategic_synthesis resolves
- Flag as LOW-MEDIUM, note for synthesis agent instructions

---

## Rejection Record Requirements

Every rejection must document:
1. Which dimension failed
2. The specific claim or field that triggered the failure
3. What evidence would be needed to remedy the failure
4. Whether the failure is recoverable (revision possible) or terminal (hard reject)

Rejection records are immutable and feed the improvement_backlog for systemic quality tracking.
