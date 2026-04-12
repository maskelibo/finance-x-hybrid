# Reconciliation Agent — Fallback Policy

## Single Source Available
Use as authoritative. Flag: `SINGLE_SOURCE_NO_RECONCILIATION`. Confidence: medium (for good quality source) or low (for PDF-only).

## All Sources Disagree Materially
Escalate all discrepancies to CEO. Do NOT forward reconciled_data until CEO issues a resolution instruction.

## Zero Documents Available
Return empty reconciled_data with RECONCILIATION_IMPOSSIBLE flag. Analysis cannot proceed without source data.

## Partial Period Coverage
Reconcile available periods. Flag missing periods in missing_inputs[]. Downstream agents work with available periods only.
