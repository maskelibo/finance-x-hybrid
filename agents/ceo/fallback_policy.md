# CEO Agent — Fallback Policy
## Finance X Platform | Degraded Operation and Recovery Procedures

---

## Purpose

This document defines the CEO Agent's complete fallback decision tree: what actions to take when agents fail, produce substandard outputs, contradict each other, hit budget limits, or cannot meet quality thresholds. The fallback policy ensures the platform degrades gracefully rather than producing unreliable outputs or failing silently.

The core principle: **it is always better to deliver less with appropriate disclosure than to deliver more with false confidence.**

---

## Fallback Decision Tree

### Trigger 1: Agent Produces Null or Empty Output

**Definition:** An agent returns an empty output, a null payload, or a schema-invalid response with no recoverable content.

**Response Protocol:**

```
STEP 1: Trigger immediate retry
  - Wait: 5 seconds (allow transient failures to clear)
  - Retry count: 1
  - Log: RETRY_TRIGGERED event in audit log

STEP 2: If retry produces null output again
  - Trigger second retry
  - Retry count: 2
  - Log: RETRY_TRIGGERED event (retry_count=2)

STEP 3: If second retry also null
  - Mark agent status: DEGRADED
  - Log: AGENT_DEGRADED event
  - Notify Orchestrator to re-route dependencies

STEP 4: Determine if agent is on critical path
  IF critical path (data_collection, financial_analysis, final_summary):
    → Activate degraded_mode workflow
    → Surface AGENT_FAILURE disclosure to user
    → Do NOT produce section relying on this agent
    → Deliver analysis with explicit gap disclosure

  IF not critical path (macro_analysis, sector_competition, technical_analysis):
    → Continue analysis without this agent
    → Label affected section as SECTION_UNAVAILABLE
    → Include in final output: "This section is unavailable due to a system issue"
    → Deliver remaining analysis with disclosure

STEP 5: Post-session
  - Log AGENT_FAILURE in improvement_backlog
  - If this is the 3rd null output in 7 days for this agent:
    → Issue HIRING_REQUEST with request_type=agent_redesign
```

---

### Trigger 2: Agent Fails Evidence Requirements Repeatedly

**Definition:** An agent consistently submits outputs where claims lack required evidence references, or evidence quality scores are below threshold.

**Response Protocol:**

```
FAILURE 1 (First occurrence in a session):
  - Issue REVISION_REQUESTED with specific evidence gap instructions
  - Log: REVISION_REQUESTED event
  - Allow up to retry_budget revisions

FAILURE 2 (Second revision still fails evidence check):
  - Escalate output to QA_REVIEW agent for manual assessment
  - Hold the agent's output: status = REVISION_HOLD
  - Log: QUALITY_THRESHOLD_BREACH event

FAILURE 3 (QA review also fails or third revision fails):
  - Freeze agent output: mark affected section as UNVERIFIED_SECTION
  - Continue analysis with all other approved outputs
  - In final_summary: explicitly note "Section X could not be verified due to insufficient evidence"
  - Log: AGENT_FROZEN event
  - Assess pattern: if this agent has failed evidence requirements in >= 3 sessions in 7 days:
    → Issue HIRING_REQUEST for agent redesign
    → Include evidence failure logs as gap_evidence

SYSTEMIC PATTERN RESPONSE:
  - If the same evidence failure pattern appears across multiple agents:
    → Review data_collection and parse_standardization outputs
    → If source data is the root cause: escalate to data layer remediation
    → Surface "Insufficient primary source data available" in final output
```

---

### Trigger 3: Unresolvable Contradiction Between Agent Outputs

**Definition:** Two or more agents produce conflicting claims that cannot be resolved through revision cycles within the retry budget.

**Response Protocol by Severity:**

#### CRITICAL Severity (Numerical contradiction on same metric and period)

```
STEP 1: Hold both outputs: status = CONTRADICTION_HOLD
STEP 2: Re-activate reconciliation agent with explicit contradiction resolution task
STEP 3: If reconciliation agent resolves the contradiction:
  → Update both outputs with reconciled values
  → Log: CONTRADICTION_RESOLVED
  → Continue

STEP 4: If reconciliation agent cannot resolve within 2 attempts:
  → Do NOT produce a synthesized value for the contested metric
  → Include both conflicting values in the final output with source attribution
  → Label the section: CONTESTED_VALUE
  → Add mandatory disclosure: "Two data sources report conflicting values for [metric]. This analysis does not synthesize these into a single figure."
  → Reduce confidence for this section to LOW
  → Log: CONTRADICTION_ESCALATED
```

#### HIGH Severity (Directional contradiction on trend or direction)

```
STEP 1: Hold both outputs
STEP 2: Issue revision to BOTH agents with contradiction details
  - Instruct each agent to either:
    (a) Reconcile their directional claim against the other's evidence, or
    (b) Explicitly scope their claim to a specific sub-period or segment that avoids the contradiction
STEP 3: If revised outputs no longer contradict:
  → Approve both, continue
STEP 4: If contradiction persists:
  → Present both views explicitly: "Financial_analysis agent indicates [X]; strategic_synthesis agent indicates [Y]"
  → Do NOT synthesize a middle ground
  → Note: "The directional outlook is contested between data-driven and contextual analysis"
  → Reduce affected section confidence to LOW
```

#### MEDIUM Severity (Inference contradicts confirmed fact)

```
STEP 1: The confirmed fact from primary data analysis takes precedence
STEP 2: Issue revision to the agent making the inference
  - Instructions: "Your claim [X] contradicts confirmed data [Y]. Revise to align with confirmed data or explicitly acknowledge the discrepancy with reasoning."
STEP 3: If revision accepted: approve, continue
STEP 4: If revision not possible (agent cannot reconcile):
  → Label the inference as CONTESTED
  → Primary fact remains in final output
  → Inference noted as a dissenting view with context
```

#### LOW Severity (Scope overlap, minor divergence)

```
STEP 1: Approve both outputs (do NOT hold)
STEP 2: In instructions to strategic_synthesis agent:
  → Include both outputs
  → Flag: "Minor divergence between agent_A and agent_B on topic [X]. Synthesis must address explicitly."
STEP 3: Synthesis agent resolves in final output
```

---

### Trigger 4: Cost Budget Exceeded

**Definition:** Cumulative token/compute cost for a session exceeds the runtime mode budget.

**Response Protocol:**

#### 10–25% over budget (Auto-managed)

```
STEP 1: Log: COST_BREACH_DETECTED
STEP 2: Immediately pause lowest-priority optional agents:
  Priority for suspension (in order):
  1. macro_analysis (suspend first)
  2. sector_competition (suspend second)
  3. technical_analysis (suspend third)
  4. context_extraction (suspend fourth)
  Note: Never suspend data_collection, financial_analysis, or final_summary
STEP 3: Re-calculate projected cost with suspended agents
STEP 4: If under budget: continue with reduced agent set
STEP 5: In final output: note which sections are unavailable due to resource constraints
```

#### 25–50% over budget (User notification required)

```
STEP 1: Pause all non-critical agents immediately
STEP 2: Notify user: "Analysis is running over budget. Proceeding with core analysis only (financial fundamentals + data collection). Optional layers (macro, sector, technical) are suspended. Estimated completion time: [X] minutes."
STEP 3: Await user decision:
  - "Continue with core only": Proceed with data_collection, financial_analysis, final_summary
  - "Full analysis authorized": Lift budget cap and proceed with all agents
  - "Abort": Terminate session with audit log
STEP 4: Log: USER_NOTIFICATION_SENT
```

#### Over 50% above budget (Hard stop unless pre-authorized)

```
STEP 1: Hard stop all non-critical processing
STEP 2: Notify user with full cost breakdown and request explicit authorization
STEP 3: If not pre-authorized: abort session, save completed work, provide partial output with clear disclosure
```

---

### Trigger 5: Widespread Low Confidence Across Multiple Agents

**Definition:** Three or more specialist agents independently report `low` or `speculative` overall confidence.

**Response Protocol:**

```
STEP 1: Identify the root cause:
  CAUSE A: Insufficient source data (data_collection reports sparse coverage)
    → Surface: "Insufficient primary source data for this company"
    → Recommend: "This analysis requires additional data. Consider requesting a deep_dive with extended data collection, or providing supplementary documents."
    → Deliver what analysis is possible with full LOW confidence labeling

  CAUSE B: Data exists but is ambiguous or contradictory
    → Escalate to deep_dive mode (if not already)
    → Activate reconciliation agent for full re-pass
    → If still low confidence after deep_dive: surface as INSUFFICIENT_DATA

  CAUSE C: Analysis requested for period without available data
    → Inform user of the data limitation
    → Offer to analyze the most recent available period

  CAUSE D: Company is newly listed / limited history
    → Note the limited history in the final output
    → Reduce scope to available data
    → Label all trend-based claims as LOW or SPECULATIVE

STEP 2: If already in deep_dive and confidence remains low:
  → Do NOT produce a full analysis
  → Deliver a partial analysis with disclosure: "Due to insufficient underlying data, Finance X cannot produce a complete analysis for this company at this time."
  → Include: what WAS analyzed, what data gaps prevented full analysis, recommendations for resolution

STEP 3: Never produce an analysis that appears confident when evidence does not support it.
```

---

### Trigger 6: QA Review Agent Escalation

**Definition:** The QA Review agent flags an output for CEO escalation because it cannot make a determination within its scope.

**Response Protocol:**

```
STEP 1: Review the QA escalation reason:
  - If COMPLEXITY: Take direct CEO review (apply full rubric)
  - If SCOPE_AMBIGUITY: Determine correct scope interpretation, issue clarification to both the producing agent and QA
  - If CONFLICTING_STANDARDS: Review relevant policies and issue a ruling

STEP 2: Issue a CEO review decision directly
STEP 3: Log: all decisions made in audit log
STEP 4: If the QA escalation reveals a policy gap:
  → Create an IMPROVEMENT_BACKLOG item
  → Consider whether a policy update is needed
```

---

### Trigger 7: CEO Agent Self-Failure

**Definition:** The CEO Agent itself fails, times out, or produces an invalid review decision.

**Response Protocol:**

```
STEP 1: Platform detects CEO agent failure
STEP 2: Orchestrator enters SAFE_MODE:
  - No new analyses accepted
  - All pending analyses PAUSED (not aborted)
  - Platform surfaces: "Analysis platform temporarily unavailable. Your request has been queued."
STEP 3: Platform attempts CEO agent restart (2 attempts)
STEP 4: If CEO agent restores: Resume paused analyses from last valid checkpoint
STEP 5: If CEO agent cannot restore: Queue all requests, alert platform administrators
STEP 6: Under NO circumstances: deliver unreviewed analysis output
```

---

## Degraded Mode Operation Summary

When in degraded mode (one or more fallbacks activated), the following applies to all outputs:

1. **Mandatory Disclosure Header:** Every analysis delivered in degraded mode must include a prominent disclosure listing which components are unavailable and why.

2. **Confidence Floor:** In degraded mode, the overall analysis confidence cannot exceed `medium` regardless of individual section scores.

3. **No Fabricated Completeness:** Missing sections must be marked as missing. Do not ask the final_summary agent to fill in gaps with inference.

4. **Audit Log Completeness:** The complete chain of fallback decisions must be logged, including timestamps, trigger reasons, and actions taken.

5. **User Communication:** Users must receive clear, non-technical language explaining what they are receiving and what they are not receiving.

---

## Recovery and Resumption

After a fallback is activated, the following recovery procedures apply:

### Short-Term Recovery (Within Session)
- If a failed agent recovers during the session (e.g., transient timeout resolves), it can be re-activated
- Re-activated agent must re-process only the tasks it missed (not full re-run)
- CEO reviews the recovered output before including it

### Long-Term Recovery (Post-Session)
- Failed analyses are logged in the improvement_backlog
- Cost_performance_optimizer reviews fallback patterns monthly
- Persistent failures trigger hiring_request via CEO
- User receives notification if a previously failed analysis can now be completed with new data

---

## Communication Standards for Fallback Disclosure

When communicating fallback situations to users, the following language standards apply:

**Acceptable:** "This analysis does not include sector benchmarking because the required data was unavailable."
**Acceptable:** "The technical analysis section could not be completed due to a system issue. Core financial analysis is complete."
**Acceptable:** "Two data sources conflict on this metric. Both values are presented for your review."

**Not Acceptable:** "Due to technical difficulties we couldn't run this." (too vague)
**Not Acceptable:** "The analysis is complete." (when sections are missing)
**Not Acceptable:** "We believe the correct value is [average of two conflicting values]." (fabricated synthesis)
