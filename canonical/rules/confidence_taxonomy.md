# Confidence Taxonomy

Canonical definitions for `confidence` field values. Every agent schema using a `confidence` enum must reference these ids. Phase 4 schema hardening replaces free-form `confidence` strings with `enum: [HIGH, MEDIUM, LOW, BLOCKED]`.

---

## CT-001 — HIGH

- Source: reconciled primary statements (audited annual or KAP-filed consolidated quarterly).
- All inputs directly observed; no proxy; no estimate.
- Reconciliation quality score ≥ 0.80.
- Formula is the canonical one from `mandatory_metrics.yaml`.
- Required for any metric displayed without a disclaimer.

## CT-002 — MEDIUM

- Any one of:
  - One input is estimated from a disclosed sub-total.
  - A proxy from `null_handling_protocol.md#NH-003` was applied.
  - Reconciliation quality score in `[0.60, 0.80)`.
  - IAS 29 adjustment uses CPI series from a non-authoritative source.
- Must include `proxy_used = true` or a stated estimate caveat.

## CT-003 — LOW

- Forward projection beyond the latest reported period.
- Derivation from technical indicators with no fundamental anchor.
- Analyst consensus blend where dispersion is high (coefficient of variation ≥ 0.30).
- Reconciliation quality score in `[0.40, 0.60)`.
- Sector benchmark derived from <3 peers.

## CT-004 — BLOCKED

- See `null_handling_protocol.md#NH-004`.
- `value` must be `null`.
- `blocked_reason` must be concrete; no placeholders.
- `escalation_target` must be a real agent_id.
- No QA PASS with any BLOCKED mandatory metric.

---

## CT-005 — Overall confidence aggregation

An agent's `confidence_overall` is the minimum of its per-metric confidences, **not** the average. One BLOCKED metric makes `confidence_overall = BLOCKED`; one LOW metric caps `confidence_overall` at LOW.

This is intentional: institutional rubric treats the weakest link as the gating signal.

---

## CT-006 — Forbidden confidence patterns

- Declaring HIGH when any mandatory input came from a non-primary source (e.g., prior published HTML report).
- Declaring HIGH with `proxy_used = true`.
- Declaring MEDIUM without emitting a proxy_formula OR stating the estimation method.
- Promoting BLOCKED → LOW to "move on" — this is a retry trigger for Phase 6 checklist enforcement.
