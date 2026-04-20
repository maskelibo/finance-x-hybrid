# Golden coverage matrix

Regression harness for Finance-X Hybrid refactor Phase 2+.

## What it does

For 15 pinned historical reports, `coverage_matrix.py` scores:

- mandatory 28 metric **name-presence** (coverage, not correctness)
- sector-specific KPI presence (aviation: EBITDAR/CASK/RASK/…, steel: growth-vs-maintenance CAPEX/HRC transmission, …)
- CoE / cost-of-equity references
- IAS 29 references
- truncation markers
- benchmark references
- counter-argument markers

## Baseline

`baseline_20260421.json` — frozen on 2026-04-21, before any Phase 2+ code change.

Top-level numbers at freeze:

| signal | value |
| --- | --- |
| reports covered | 15 |
| metric presence (all reports summed) | 232 / 420 = 55.2% |
| reports mentioning CoE | **0 / 15** |
| reports mentioning IAS 29 | 6 / 15 (26 or more hits) |
| reports with zero sector KPIs matched | EREGL 0/3 × 2 reports, ASELS 0/3 × 1 report, TUPRS/SISE not classified |
| reports with `BLOCKED` markers | 5+ |
| worst truncation | KCHOL_20260414 with 143 truncation markers |

Regenerating new reports with the refactored pipeline and running `--baseline` must meet or exceed these on every guarded signal.

## Usage

```bash
# Print the current score table
python evals/golden/coverage_matrix.py --print

# Diff current state against the pinned baseline (exit 0 = OK, 2 = regression)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json

# Pin a new baseline (only after intentional quality jump)
python evals/golden/coverage_matrix.py --freeze evals/golden/baseline_<yyyymmdd>.json
```

## What "regression" means here

`coverage_matrix.py` does **not** judge the correctness of numbers in a report. It checks whether the metric names and qualitative hooks the institutional rubric requires are **present**. A commit that removes the word "ROE" from 5 reports — for any reason — is blocked. A commit that reduces a number from 23.4 to 22.1 is not blocked by this harness (schema + AJV will enforce that separately).

This floor is deliberately weak so it can run automatically without generating false positives during refactor. Depth and correctness enforcement lives in:

- `canonical/rules/mandatory_metrics.yaml` (formula + interpretation requirements)
- each agent's `output_schema.json` (Phase 4 hardening adds `minLength` / `minItems`)
- QA review schema (Phase 3 `overall_score` tightening)

## Pinned report set

See `GOLDEN_REPORTS` in `coverage_matrix.py`. The set is deliberately frozen — adding a new report means re-freezing the baseline.
