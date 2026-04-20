# Glossary — Finance-X terms

Authoritative definitions. All agents use these definitions; do not re-define locally.

---

## EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)
Operating Profit + D&A. Excludes finance items, tax, monetary gain/loss.
**Turkish:** FAVÖK (Faiz, Amortisman ve Vergi Öncesi Kâr).

## EBITDAR (EBITDA + Rent)
EBITDA + kira/lease expense. Primary aviation metric (see SR-aviation-001) because pre-IFRS 16 operating leases materially shift EBITDA across carriers.
**Turkish:** FAVÖK + Kira.

## CCC (Cash Conversion Cycle)
DSO + DIO − DPO. Measured in days. See MM-15.
**Turkish:** Nakit Dönüşüm Döngüsü.

## DSO / DIO / DPO
Days Sales Outstanding / Days Inventory Outstanding / Days Payables Outstanding. All use 365 days × ratio formulation.

## FCF (Free Cash Flow)
Operating Cash Flow − CAPEX. See MM-21.
**Turkish:** Serbest Nakit Akışı.

## IAS 29 vs TAS 29
**IAS 29** is the IFRS standard "Financial Reporting in Hyperinflationary Economies".
**TAS 29** is the Turkish-language IFRS equivalent (Türkiye Muhasebe Standartları). They are identical in substance. See canonical/rules/ias29_protocol.md.

## ROE (Return on Equity)
Net Income / Average Shareholders' Equity × 100. Must be compared against Cost of Equity — see MM-25.

## ROCE (Return on Capital Employed)
EBIT / (Total Assets − Current Liabilities) × 100. Use trailing 12-month EBIT when comparing to trailing capital base.

## ROIC (Return on Invested Capital)
NOPAT / Invested Capital. Preferred over ROCE in valuation contexts. Not in the 28-metric mandatory set but expected in `deep_dive` mode.

## NIM (Net Interest Margin) — banking only
(Interest Income − Interest Expense) / Average Earning Assets × 100.

## Cost of Risk (CoR) — banking only
Provisions for loan losses / Average Gross Loans × 100, expressed in basis points.

## CAR (Capital Adequacy Ratio) — banking only
Regulatory capital / Risk-Weighted Assets × 100. BDDK minimum: 12%.

## ARPU (Average Revenue Per User) — telecom only
Service revenue / Average subscribers. Report prepaid/postpaid separately when material.

## Churn — telecom only
Monthly or annualized subscriber loss rate. Gross vs net distinction must be clarified.

## SAC / LTV — telecom only
Subscriber Acquisition Cost / Lifetime Value. Target LTV/SAC ratio ≥ 3.0.

## CASK / RASK — aviation only
**CASK** (Cost per Available Seat-Kilometre) = Total Operating Cost / ASK.
**RASK** (Revenue per Available Seat-Kilometre) = Operating Revenue / ASK.

## Load Factor — aviation only
RPK / ASK. Expressed as %. Industry benchmark around 83% (IATA 2025).

## SSSG (Same-Store Sales Growth) — retail only
Revenue growth from stores open both in the current and prior period. Excludes new-store contribution.

## SOTP (Sum-of-the-Parts) — holding only
Valuation methodology aggregating peer-multiple-based fair value of each subsidiary.

## NAV (Net Asset Value) — holding only
Parent-level net asset value based on segment SOTP. Holding discount = (NAV − Market Cap) / NAV.

## Monetary Gain / Loss — IAS 29
Change in purchasing power of net monetary position over the reporting period. Structural (not non-recurring) in hyperinflationary economies.
**Turkish:** Net Parasal Pozisyon Kazanç/Kaybı.
