# Output Quality Audit

- Generated: 2026-04-20T21:15:06.793619+00:00
- Report sample size: **15**
- Sample selection: latest report-like HTML files under repo root + `output/`, excluding smoke/minimal/old variants.
- Mandatory-28 note: this audit infers the target metric slate from `scripts/test_28_metrics.py`, `backend/src/orchestrator.ts`, and `agents/financial_analysis/output_schema.json` because the repo does not yet have a single canonical list.

## Per-report audit

| report | ticker | metric_coverage | missing_metrics | sections | page_divs | svg | canvas | ias29 | sector_gaps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KCHOL_Yonetim_Kurulu_Raporu_20260414.html | KCHOL | 8/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, net_margin, roa, roic, opex_to_revenue ... | 12 | 15 | 2 | 0 | no | — |
| SISE_YONETIM_RAPORU_2026-04-10.html | SISE | 11/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, net_margin, roa, roic, opex_to_revenue, nwc_to_revenue ... | 0 | — | 0 | 0 | yes | — |
| SISE_YONETIM_RAPORU_WEB.html | SISE | 11/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, net_margin, roa, roic, opex_to_revenue, nwc_to_revenue ... | 0 | — | 0 | 0 | yes | — |
| TCELL_Kapsamli_Analiz_Raporu_2026.html | TCELL | 11/28 | gross_margin, gross_profit_ias29, ebitda_margin, net_margin, roa, roic, dso, dio ... | 0 | 15 | 8 | 0 | yes | Churn, SAC/LTV, Capex Intensity |
| TCELL_Kapsamli_Analiz_Raporu_2026_final.html | TCELL | 11/28 | gross_margin, gross_profit_ias29, ebitda_margin, net_margin, roa, roic, dso, dio ... | 0 | 15 | 8 | 0 | yes | Churn, SAC/LTV, Capex Intensity |
| TCELL_Kapsamli_Analiz_Raporu_2026_final_v2.html | TCELL | 11/28 | gross_margin, gross_profit_ias29, ebitda_margin, net_margin, roa, roic, dso, dio ... | 0 | 15 | 8 | 0 | yes | Churn, SAC/LTV, Capex Intensity |
| TCELL_Yonetim_Kurulu_Raporu_20260414.html | TCELL | 15/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, net_margin, roic, opex_to_revenue, nwc_to_revenue ... | 0 | 15 | 13 | 0 | no | Churn, SAC/LTV, Capex Intensity |
| TCELL_Yonetim_Kurulu_Raporu_20260415.html | TCELL | 14/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, roa, roce, roic, opex_to_revenue ... | 0 | 16 | 5 | 0 | no | Churn, SAC/LTV, Capex Intensity |
| THYAO_V4_Reformat_20260417.html | THYAO | 0/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda, ebitda_margin, net_margin, roe, roa ... | 0 | — | 0 | 0 | no | EBITDAR, CASK, RASK, Load Factor, RPK, ASK |
| THYAO_Yonetim_Kurulu_Raporu_20260413.html | THYAO | 10/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, net_margin, roa, roic, opex_to_revenue ... | 10 | 10 | 4 | 0 | no | RPK, ASK |
| THYAO_Yonetim_Kurulu_Raporu_20260416.html | THYAO | 20/28 | gross_profit_ias29, monetary_gain_loss, ebitda_margin, opex_to_revenue, nwc_to_revenue, acid_test, cash_ratio, interest_burden | 12 | 13 | 10 | 0 | no | EBITDAR |
| TUPRS_KURUMSAL_RAPOR_2026_04_12.html | TUPRS | 11/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, roa, roce, roic, opex_to_revenue, dso ... | 3 | — | 3 | 0 | yes | — |
| TUPRS_Yonetim_Kurulu_Raporu_2026.html | TUPRS | 12/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, net_margin, roa, roic, opex_to_revenue, nwc_to_revenue ... | 0 | — | 3 | 0 | yes | — |
| TUPRS_Yonetim_Kurulu_Raporu_20260419.html | TUPRS | 13/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, net_margin, roa, roic, opex_to_revenue ... | 12 | 12 | 3 | 0 | no | — |
| output/TUPRS_Yonetim_Kurulu_Raporu_20260419.html | TUPRS | 13/28 | gross_margin, gross_profit_ias29, monetary_gain_loss, ebitda_margin, net_margin, roa, roic, opex_to_revenue ... | 12 | 12 | 3 | 0 | no | — |


## Most frequently missing mandatory metrics

| metric | missing_in_reports |
| --- | --- |
| gross_profit_ias29 | 15 |
| nwc_to_revenue | 15 |
| interest_burden | 15 |
| gross_margin | 14 |
| roic | 14 |
| capex_to_ebitda | 14 |
| roa | 13 |
| cash_ratio | 13 |
| ocf_to_ebitda | 13 |
| monetary_gain_loss | 12 |
| net_margin | 12 |
| opex_to_revenue | 12 |
| ebitda_margin | 11 |
| interest_coverage | 11 |
| altman_z | 11 |
| piotroski_f | 11 |
| acid_test | 10 |
| current_ratio | 6 |
| dso | 5 |
| dio | 5 |


## Truncation / structural integrity issues

| report | sections | page_divs | chars |
| --- | --- | --- | --- |
| TUPRS_Yonetim_Kurulu_Raporu_2026.html | 0 | 0 | 94209 |
| TUPRS_KURUMSAL_RAPOR_2026_04_12.html | 3 | 0 | 82823 |
| THYAO_Yonetim_Kurulu_Raporu_20260413.html | 10 | 10 | 78557 |
| THYAO_V4_Reformat_20260417.html | 0 | 0 | 0 |
| TCELL_Yonetim_Kurulu_Raporu_20260415.html | 0 | 16 | 79151 |
| TCELL_Yonetim_Kurulu_Raporu_20260414.html | 0 | 15 | 91476 |
| TCELL_Kapsamli_Analiz_Raporu_2026_final.html | 0 | 15 | 55940 |
| TCELL_Kapsamli_Analiz_Raporu_2026_final_v2.html | 0 | 15 | 55999 |
| TCELL_Kapsamli_Analiz_Raporu_2026.html | 0 | 15 | 55940 |
| SISE_YONETIM_RAPORU_WEB.html | 0 | 0 | 793256 |
| SISE_YONETIM_RAPORU_2026-04-10.html | 0 | 0 | 793256 |


## BLOCKED without proxy-like fallback

| report | blocked_mentions |
| --- | --- |
| KCHOL_Yonetim_Kurulu_Raporu_20260414.html | 4 |


## Low commentary density (table-heavy, text-light)

| report | paragraphs | tables |
| --- | --- | --- |
| TUPRS_Yonetim_Kurulu_Raporu_20260419.html | 33 | 17 |
| output/TUPRS_Yonetim_Kurulu_Raporu_20260419.html | 33 | 17 |
| TCELL_Yonetim_Kurulu_Raporu_20260415.html | 19 | 29 |
| KCHOL_Yonetim_Kurulu_Raporu_20260414.html | 15 | 16 |


## Sector-specific KPI gaps

| gap | count |
| --- | --- |
| TCELL:Churn | 5 |
| TCELL:SAC/LTV | 5 |
| TCELL:Capex Intensity | 5 |
| THYAO:EBITDAR | 2 |
| THYAO:RPK | 2 |
| THYAO:ASK | 2 |
| THYAO:CASK | 1 |
| THYAO:RASK | 1 |
| THYAO:Load Factor | 1 |
| THYAO:IFRS16 | 1 |


## IAS 29 adjusted metric coverage

- IAS 29 wording present in **7/15** sampled reports.

## Key findings

- THYAO sample reports still surface as `Sanayi/industrial` in HTML despite repeated aviation-specific doctrine elsewhere.
- Report formatting quality is highly inconsistent: some outputs are rich 12-section HTML documents, while others are shorter legacy/custom layouts or carry placeholder score blocks.
- The metric slate visible in finished reports is far less stable than the engine/prompt expectations imply; several mandatory working-capital and cash-conversion metrics are absent in many sampled outputs.
