# IAS 29 Protocol

Canonical rules for applying IAS 29 (Financial Reporting in Hyperinflationary Economies) to Turkish-reporting entities.

---

## IAS29-001 — Applicability

IAS 29 applies to a reporting period when:

- Cumulative CPI change over the most recent 3 years ≥ 100% (Türkiye qualifies for all periods from 2022-Q1 onward).
- OR the entity explicitly applies IAS 29 in its financial statements.

When IAS 29 applies, the financial_analysis agent MUST emit `MM-04`, `MM-05`, and `MM-06` in addition to the non-adjusted metrics. Missing any of these three in an IAS 29 period produces a `MISSING_IAS29_ADJUSTMENT` finding.

## IAS29-002 — Separate table required

The institutional report must include a dedicated "IAS 29 Öncesi / Sonrası" comparison table with at least:

| metric | reported (IAS 29 öncesi) | IAS 29 monetary gain/loss | adjusted (IAS 29 sonrası) |
| --- | --- | --- | --- |
| Revenue | … | … | … |
| Gross Profit | … | … | … |
| EBITDA | … | … | … |
| Net Income | … | … | … |

This is non-negotiable for any period where IAS29-001 applies.

## IAS29-003 — Source hierarchy for inflation adjustment

1. The entity's own IAS 29 adjusted statements if reported.
2. Compute from raw statements using the TÜİK Türkiye CPI series (authoritative).
3. A CPI series from a non-authoritative aggregator is `MEDIUM` confidence and must carry `proxy_used = true`.

## IAS29-004 — Common mistakes to flag

- Treating monetary gain/loss as "non-recurring" — it is a structural line in a hyperinflationary period.
- Computing EBITDA margin by pairing IAS 29 numerator with reported denominator (apples-to-pears). Both must be consistent.
- Omitting `MM-06` when CPI change is large. Monetary position is a material driver of reported net income.

## IAS29-005 — Interpretation requirements

When presenting IAS 29 adjusted metrics, the interpretation paragraph must address:

- Direction of net monetary position (net long monetary ↔ inflation loss, net short monetary ↔ inflation gain).
- Magnitude relative to reported net income (e.g. "monetary gain represents %X of reported NI").
- Whether the entity hedged its monetary position via FX debt or commodity exposure.
- Whether it distorts year-over-year EBITDA growth (purging monetary gain/loss from EBITDA is standard institutional practice).

## IAS29-006 — Sector sensitivities

- **Aviation** (THYAO, PEGYS, ONUIR): IAS 29 monetary loss is large because aircraft fleet is USD-denominated while operating cash flow is mixed. Must be paired with FX exposure table.
- **Banking** (AKBNK, GARAN, ISCTR, YKBNK): Banks are treated as net short monetary → typically report IAS 29 monetary gain. CAR ratio impact analysis required.
- **Retail** (BIMAS, MGROS, SOKM): Net short monetary via payables float → structural IAS 29 gain. Explain magnitude of float.
- **Holding** (KCHOL, SAHOL, DOHOL): Segment-level IAS 29 must aggregate up; parent-only IAS 29 is insufficient.
