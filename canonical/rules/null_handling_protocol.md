# Null Handling Protocol

Canonical rule set for what an agent must do when an input is missing.

Ids used in this file are referenced from `mandatory_metrics.yaml`, agent system prompts, and schema enforcement layers. Do not re-state rules — cite ids.

---

## NH-001 — "Veri yok" is forbidden

**Rule.** No agent is permitted to respond with "veri yok", "data unavailable", or any equivalent as a final position on a mandatory metric. If the metric is required by `mandatory_metrics.yaml` and the input is missing, the agent must walk the escalation ladder (NH-002) before declaring.

**Why.** This agent swarm has the full BIST document set, the KAP website, and direct PDF fetch available. A bare "veri yok" is almost always a search-depth failure, not a data-availability failure.

**How to apply.** When a required input is missing:

1. Check the reconciled output under `reconciliation`.
2. Check the parse_standardization output for an alternate line item mapping.
3. Issue a `WebFetch` to the relevant KAP disclosure.
4. Escalate upstream (data_collection / parse_standardization) with the missing field name.
5. Only after all four fail, emit `BLOCKED` with a `blocked_reason` (NH-004).

---

## NH-002 — Escalation ladder

When a required input is missing, descend in this order:

| step | action | max_latency |
| --- | --- | --- |
| 1 | Consult `reconciled_financial_data` object | 0 ms |
| 2 | Consult `parse_standardization_output` raw object | 0 ms |
| 3 | Fetch the source disclosure directly from KAP via WebFetch | 30 s |
| 4 | Emit `UPSTREAM_REQUEST` finding to orchestrator pointing at the responsible upstream agent | deferred |
| 5 | Emit `BLOCKED` with proxy hierarchy evaluated (NH-003) and escalate to CEO if proxy is not acceptable | final |

---

## NH-003 — Proxy hierarchy

For the specific metrics that allow proxy computation, use this ladder:

### EBITDA (MM-07)
1. Reported EBITDA line item.
2. `Operating Profit + D&A` — confidence `HIGH`.
3. `Net Income + Tax + Interest + D&A` — confidence `MEDIUM`, label `[EBITDA proxy]`.

### EBITDAR (aviation, SR-aviation-001)
1. Reported EBITDA + reported lease expense.
2. `Operating Income + D&A_proxy(sector) + lease_expense` — confidence `MEDIUM`, label `[EBITDAR proxy]`.
3. **Never null** if ticker is in `{THYAO, PEGYS, ONUIR}`.

### FCF (MM-21)
1. `OCF - CAPEX` where both are from cash flow statement.
2. `EBITDA × (OCF/EBITDA sector avg) - CAPEX` — confidence `LOW`, explicitly flagged.

### ROE (MM-25)
No proxy. If Net Income or Average Equity is missing, escalate (NH-002).

### IAS 29 adjusted metrics (MM-04, MM-05, MM-06)
1. Apply the IAS 29 protocol directly from raw statements.
2. If CPI series is missing, emit `BLOCKED` — no proxy.

---

## NH-004 — BLOCKED protocol

When all ladders fail, emit the metric with:

```json
{
  "id": "MM-NN",
  "value": null,
  "confidence": "BLOCKED",
  "blocked_reason": "<concrete missing input>",
  "escalation_target": "<agent_id>",
  "proxy_attempts": ["<list of ladder steps tried and why they failed>"]
}
```

**`escalation_target` must be a real agent id**, never "unknown". The QA agent's `overall_score` cannot reach `PASS` with any BLOCKED mandatory metric.

---

## NH-005 — Naked-number prohibition

Every metric value in the metrics_array must carry:

- `formula` — the computation used (not just the result).
- `inputs_used` — the line items actually read, with their report period.
- `confidence` — one of `HIGH | MEDIUM | LOW | BLOCKED` (see `confidence_taxonomy.md`).
- `proxy_used` — boolean.
- `proxy_formula` — present iff `proxy_used = true`.

Phase 4 schema hardening enforces this at AJV level.

---

## NH-006 — Downstream acknowledgement

Any finding from QA referencing a BLOCKED or MEDIUM-confidence metric MUST be addressed by the receiving agent with an `addressed_findings` entry. `finding_id` set equality is checked by the validation gate (Phase 4). A silent drop is a retry trigger.
