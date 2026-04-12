# QA Review Agent — Review Rubric
## Finance X Platform | QA Assessment Standards

The QA Review Agent applies the same 5-dimension rubric as the CEO agent, independently, without access to CEO scores.

## QA Decision Rules

- **Pass:** Overall score >= runtime mode threshold AND no critical quality flags
- **Conditional Pass:** Overall score >= threshold but 1–2 medium quality flags; escalation_recommendation = none, notes for CEO attention
- **Fail:** Overall score below threshold OR any critical quality flag OR suspected fabricated evidence

## Quality Flag Types

| Flag Type | Severity | Trigger |
|-----------|----------|---------|
| SUSPECTED_FABRICATION | critical | Evidence ref points to nonexistent document |
| FALSE_CERTAINTY | critical | Forward claim labeled high confidence |
| NO_EVIDENCE | critical | Claims with zero evidence refs |
| SCOPE_VIOLATION | high | Agent output contains work outside its domain |
| CONFIDENCE_OVERCLAIM | high | Multiple labels above what evidence supports |
| MISSING_REQUIRED_FIELD | medium | Output schema required field is absent |
| CROSS_REFERENCE_CONFLICT | medium | Conflicts with another approved session output |
| FORMULA_UNDISCLOSED | low | Non-standard ratio without formula disclosure |

## Independence Protocol

QA reviewer must complete its assessment before receiving CEO's decision. If CEO decision is received first, QA proceeds independently and notes the sequence in review_notes.
