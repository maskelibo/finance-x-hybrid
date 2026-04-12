# QA Review Agent — Fallback Policy
## Finance X Platform

## QA Agent Failure Behavior

If the QA Review Agent fails or times out:
1. CEO review proceeds without QA input — this is acceptable in standard mode
2. The absence of QA review is logged in the session audit
3. In deep_dive mode, a QA failure triggers a notification to the CEO that independent review was not available
4. The final output may still be delivered, but the audit log records the gap

## QA Scope Ambiguity

If QA cannot determine the correct standard to apply to a novel output type:
1. Flag the output as SCOPE_AMBIGUITY
2. Escalate to CEO with description of the ambiguity
3. CEO determines the applicable standard and issues guidance
4. QA proceeds with guidance applied
5. The guidance is added to the improvement_backlog for policy formalization

## Disagreement with CEO

If QA scores an output as FAIL and CEO scores it as APPROVED:
1. Both scores are logged in the audit trail
2. The CEO decision stands (CEO has final authority)
3. The disagreement is logged in the improvement_backlog for pattern analysis
4. If QA and CEO disagree on more than 20% of outputs in a rolling 30-day window, a policy review is triggered
