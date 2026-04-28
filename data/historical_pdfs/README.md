# Operator-Curated Historical KAP PDFs

This directory holds historical KAP financial-report PDFs that augment
the live `data_collection` KAP fetch. Useful when the 6-year KAP search
window doesn't reach back far enough to populate the 5-year trend chart,
or when KAP's rate limit forces a fallback to local disk.

## Convention

```
data/historical_pdfs/<TICKER>/<filename>.pdf
```

The loader extracts a fiscal year from each filename via the first
4-digit sequence in the 1990-2100 range. Examples that all parse to
FY-2024:

- `2024.pdf`
- `KCHOL_2024.pdf`
- `KCHOL-FY-2024.pdf`
- `2024_consolidated.pdf`
- `something_FY2024_annual.pdf`

Files without a parseable year are silently ignored.

## Behaviour

- The data_collection runner merges these into the KAP manifest as
  `kind: 'financial_report'` with `period_label: 'FY-<YYYY>'`.
- KAP-side entries always win on year collision (the live filing is
  canonical; disk copies are fallback only).
- A `warnings[]` entry is added to the manifest explaining how many
  disk-only years were appended and which years they were.

## When to use

- Operator wants the 5-year trend chart to render for tickers whose KAP
  history is shorter than 5 years.
- Operator has high-quality manually downloaded PDFs that are easier to
  parse than the KAP versions (e.g., consolidated re-filings).
- KAP rate-limits during a session and the operator wants to guarantee
  basic coverage from a local cache.

## Verification

The loader does not score or rank files — it accepts whatever is on
disk. Operator is responsible for ensuring the PDF is the genuine,
unmodified KAP filing for that fiscal year.
