# TCELL Standardized Financial Data
**Agent:** `parse_standardization`  
**Company:** Turkcell İletişim Hizmetleri A.Ş. (`TCELL`)  
**Period:** FY2021-FY2025  
**Company type:** `operational`  
**Currency:** TRY million unless noted

## Source Map

| source_document_id | Document | Period | Extraction method | Confidence | Key pages / notes |
|---|---|---:|---|---:|---|
| `tcell_q4_2025_financial_report` | 2025 Finansal Raporu / FY2025 selected financials | FY2025 | pdf_structured_table | 0.95 | Press release pages 19-20; cash flow page 20 |
| `tcell_annual_report_2025_tr` | 2025 Entegre Faaliyet Raporu | FY2025 | pdf_structured_table | 0.92 | Management KPI, segment and narrative pages 15-18, 56, 208, 211 |
| `tcell_annual_report_2024_tr` | 2024 Entegre Faaliyet Raporu | FY2024 | pdf_structured_table | 0.90 | Selected financial data section in annual report |
| `tcell_annual_report_2023_tr` | 2023 Entegre Faaliyet Raporu | FY2023 | pdf_structured_table | 0.90 | Selected financial data section in annual report |
| `tcell_annual_report_2022_tr` | 2022 Entegre Faaliyet Raporu | FY2022 | pdf_structured_table | 0.90 | Selected financial data section in annual report |
| `tcell_annual_report_2021_en` | 2021 Integrated Annual Report | FY2021 | pdf_structured_table | 0.90 | Selected financial data section in annual report |

## Basis Note

- FY2025 and FY2024 comparative figures below use the FY2025 filing basis from the latest annual/financial report set.
- FY2023-FY2021 are taken from the corresponding annual report selected financial data sections.
- All figures are in TRY million unless noted.
- Historical comparability is affected by IAS 29 restatements and the reporting basis used in each filing.

## 5-Year Key Figures

| Line item | 2021 | 2022 | 2023 | 2024 | 2025 | Source |
|---|---:|---:|---:|---:|---:|---|
| Revenue | 35,920.5 | 93,486.8 | 154,653.0 | 218,160.0 | 241,470.8 | `tcell_annual_report_2021_en`, `tcell_annual_report_2022_tr`, `tcell_annual_report_2023_tr`, `tcell_q4_2025_financial_report` |
| EBITDA / FAVÖK | 15,013.8 | 36,607.7 | 43,877.1 | 91,365.5 | 104,017.0 | same as above; FY2025 from management KPI table |
| EBIT / Operating profit | 7,351.9 | 2,953.4 | 7,812.6 | 46,366.7 | 73,436.4 | same as above; FY2025 from selected financials |
| Net income attributable to owners | 5,031.1 | 6,880.4 | 12,554.0 | 30,790.4 | 17,604.0 | same as above |
| Operating cash flow | 19,947.2 | 42,281.1 | 41,721.5 | 82,798.7 | 96,619.6 | same as above |
| Investing cash flow | (9,137.7) | (31,712.1) | (20,905.8) | (48,561.2) | (74,938.6) | same as above |
| Financing cash flow | (3,942.2) | 3,388.4 | 6,769.3 | (12,806.8) | (1,531.0) | same as above |
| Total assets | 70,682.6 | 234,989.2 | 247,083.3 | 450,630.4 | 500,572.8 | same as above |
| Total liabilities | 48,120.4 | 125,611.2 | 124,848.5 | 205,905.5 | 241,239.8 | same as above |
| Total equity | 22,562.3 | 109,377.9 | 122,234.9 | 244,724.8 | 259,333.1 | same as above |
| CAPEX | 11,479.4 | 30,580.8 | 36,488.1 | 71,753.2 | 89,961.4 | same as above |

## 2025 Standardized Income Statement

| Line item | 2025 | 2024 | IFRS mapping | Original line item | Page |
|---|---:|---:|---|---|---:|
| Revenue | 241,470.8 | 218,160.0 | Revenue | `Total revenues` | 20 |
| Cost of revenue | (173,124.0) | (164,326.0) | Cost of sales | `Direct cost of revenues` | 20 |
| Gross profit | 68,346.0 | 53,834.0 | Gross profit | `Gross profit` | 20 |
| Administrative expenses | (9,948.0) | (9,058.0) | General administrative expenses | `Administrative expenses` | 20 |
| Selling & marketing expenses | (16,881.0) | (14,331.0) | Selling & marketing expenses | `Selling & marketing expenses` | 20 |
| Other operating income | 34,868.0 | 20,322.0 | Other operating income | `Other operating income` | 20 |
| Other operating expense | (2,949.0) | (4,401.0) | Other operating expense | `Other operating expense` | 20 |
| Operating profit / EBIT | 73,436.4 | 46,366.7 | Operating profit | `Operating profit` | 20 |
| Impairment losses under TFRS 9 | (1,429.0) | (1,337.0) | Credit impairment | `Impairment losses determined in accordance with TFRS 9` | 20 |
| Income from investing activities | 10,475.0 | 5,225.0 | Investing income | `Income from investing activities` | 20 |
| Expense from investing activities | (209.0) | (142.0) | Investing expense | `Expense from investing activities` | 20 |
| Share of profit of equity-accounted investees | (3,499.0) | (4,140.0) | Share of profit / loss of equity-accounted investees | `Share on profit of investments valued by equity method` | 20 |
| Income before financing costs | 78,774.0 | 45,974.0 | Income before financing costs | `Income before financing costs` | 20 |
| Finance income | 251.0 | 673.0 | Finance income | `Finance income` | 20 |
| Finance expense | (49,434.0) | (33,424.0) | Finance costs | `Finance expense` | 20 |
| Monetary gain / (loss) | 1,598.0 | 7,658.0 | IAS 29 monetary effect | `Monetary gain (loss)` | 20 |
| Profit before tax | 31,190.3 | 20,881.2 | Profit before tax | `Income from continuing operations before tax and non-controlling interest` | 20 |
| Tax expense | (13,398.8) | (6,369.3) | Tax | `Tax income (expense) from continuing operations` | 20 |
| Profit from continuing operations | 17,791.4 | 14,511.9 | Continuing operations | `Profit from continuing operations` | 20 |
| Discontinued operations | (187.4) | 16,267.3 | Discontinued operations | `Profit /(loss) from discontinued operations` | 20 |
| Net income attributable to owners | 17,604.0 | 30,790.4 | Net income | `Owners of the Parent` | 20 |

### Management KPI Reconciliation

| Metric | 2024 | 2025 | Source |
|---|---:|---:|---|
| EBITDA / FAVÖK | 91,365.5 | 104,017.0 | `tcell_q4_2025_financial_report`, page 20; `tcell_annual_report_2025_tr`, page 56 |
| EBITDA margin | 41.9% | 43.1% | same as above |
| Net debt / EBITDA | 0.15x | 0.14x | `tcell_annual_report_2025_tr`, page 56 |

## 2025 Standardized Balance Sheet

| Line item | 2025 | 2024 | IFRS mapping | Original line item | Page |
|---|---:|---:|---|---|---:|
| Cash and cash equivalents | 91,828.3 | 90,229.8 | Cash & equivalents | `Cash and cash equivalents` | 20 |
| Total assets | 500,572.8 | 450,630.4 | Total assets | `Total assets` | 20 |
| Long-term debt | 122,732.9 | 68,633.6 | Long-term borrowings | `Long term debt` | 20 |
| Total debt | 158,649.0 | 136,573.0 | Total debt | `Total debt` | 20 |
| Total liabilities | 241,239.8 | 205,905.5 | Total liabilities | `Total liabilities` | 20 |
| Total equity | 259,333.1 | 244,724.8 | Total equity | `Total shareholders’ equity` | 20 |

### Balance Sheet Details

| Line item | 2025 | 2024 | Source |
|---|---:|---:|---|
| Current assets | 156,628.6 | 148,814.9 | `tcell_annual_report_2025_tr` |
| Non-current assets | 343,944.2 | 301,815.4 | `tcell_annual_report_2025_tr` |
| Short-term borrowings | 13,460.1 | 24,321.5 | `tcell_annual_report_2025_tr` |
| Current portion of long-term debt | 22,456.2 | 43,618.3 | `tcell_annual_report_2025_tr` |
| Trade payables | 32,614.3 | 29,791.7 | `tcell_annual_report_2025_tr` |
| Current liabilities | 91,990.4 | 118,894.7 | `tcell_annual_report_2025_tr` |
| Non-current liabilities | 149,249.4 | 87,010.8 | `tcell_annual_report_2025_tr` |

## 2025 Standardized Cash Flow Statement

| Line item | 2025 | 2024 | IFRS mapping | Original line item | Page |
|---|---:|---:|---|---|---:|
| Operating cash flow | 96,619.6 | 82,798.7 | Operating cash flow | `Net cash inflow from operating activities` | 20 |
| Investing cash flow | (74,938.6) | (48,561.2) | Investing cash flow | `Net cash outflow from investing activities` | 20 |
| Financing cash flow | (1,531.0) | (12,806.8) | Financing cash flow | `Net cash outflow from financing activities` | 20 |
| Net increase in cash | 20,150.0 | 21,430.7 | Net change in cash | `Net increase in cash and cash equivalents` | 20 |
| Opening cash | 89,862.9 | 101,718.6 | Opening cash | `Cash and cash equivalents at 1 January` | 20 |
| FX / inflation adjustment | (18,245.1) | (33,286.5) | FX / monetary effect | Cash flow bridge | 20 |
| Closing cash | 91,767.8 | 89,862.9 | Closing cash | `Cash and cash equivalents at 31 December` | 20 |

### Cash Flow Bridge Note

- Closing cash in the cash flow statement is 91,767.8.
- Balance sheet cash and cash equivalents is 91,828.3.
- The difference is the interest accrual / cash-equivalent presentation effect in the filing.

## Segment Data

| Segment | 2025 revenue | 2024 revenue | 2025 EBITDA | 2024 EBITDA | Source |
|---|---:|---:|---:|---:|---|
| Turkcell Turkey | 220,319.0 | 199,742.0 | 98,416.5 | 86,852.7 | `tcell_q4_2025_financial_report`, page 20 |
| Fintech | 13,689.0 | 11,301.0 | 3,383.1 | 2,845.9 | `tcell_q4_2025_financial_report`, page 20 |
| Other | 7,463.0 | 7,117.0 | 2,695.9 | 2,111.6 | `tcell_q4_2025_financial_report`, page 20 |
| Consolidated total | 241,470.8 | 218,160.0 | 104,017.0 | 91,365.5 | `tcell_q4_2025_financial_report`, page 20 |

## Activity Report Extraction

### CEO / Yönetim Mesajı

| Theme | Extracted content | Source |
|---|---|---|
| 5G | 16 Ekim 2025 5G ihalesinde 160 MHz bant genişliği elde edildi; 1 Nisan 2026 ticari başlangıç hedefi vurgulandı | `tcell_annual_report_2025_tr`, pages 8-9 / `tcell_q4_2025_financial_report`, pages 3-4 |
| Growth | 2025 gelir artışı %10,7; FAVÖK artışı %13,8; EBITDA marjı %43,1 | `tcell_q4_2025_financial_report`, page 20 |
| Customer mix | Faturalı abone odağı, üst paketlere geçiş, mobil veri ve fiber ARPU büyümesi | `tcell_annual_report_2025_tr`, pages 15-18 |
| Digital / cloud | Google Cloud ortaklığı, hyperscale bulut bölgesi ve veri merkezi kapasitesi | `tcell_annual_report_2025_tr`, pages 15-16 / `tcell_annual_report_2025_tr`, page 208 |
| Outlook | 2026 için gelir büyümesi %5-7, veri merkezi & bulut gelir büyümesi %18-20, EBITDA marjı %40-42 rehberi | `tcell_q4_2025_financial_report`, page 1 |

### Üretim Süreçleri ve Kapasiteler

| Metric | 2025 | Note | Source |
|---|---:|---|---|
| Uçtan uca fiber homepass | 6.3 milyon | +405 bin YoY | `tcell_annual_report_2025_tr`, page 15 |
| Mobil abone bazı | 39.1 milyon | Türkiye mobil abone | `tcell_annual_report_2025_tr`, pages 15 / 18 |
| Fiber abone bazı | 2.6 milyon | Turkcell Fiber | `tcell_annual_report_2025_tr`, pages 15 / 18 |
| IPTV abone bazı | 1.4 milyon | Türkiye | `tcell_annual_report_2025_tr`, page 15 |
| TV+ müşteri sayısı | 2.5 milyon | içerik ortaklıklarıyla | `tcell_annual_report_2025_tr`, page 15 |
| Net mobil abone kazanımı | 809 bin | 2025 | `tcell_annual_report_2025_tr`, page 18 |
| Net faturalı mobil abone artışı | 2.4 milyon | 2025 | `tcell_annual_report_2025_tr`, page 18 |
| Mobil ARPU (M2M hariç) | 400.8 TL | +10.6% | `tcell_annual_report_2025_tr`, page 17 / `tcell_annual_report_2025_tr`, page 208 |

### Amiral Ürünler / Ana Ürün Grupları

| Ürün grubu | Extracted description | Source |
|---|---|---|
| Mobil | Ses, veri, SMS, faturalı / faturasız paketler, 5G geçişi | `tcell_annual_report_2025_tr`, pages 8-9, 15-17 |
| Sabit / fiber | Turkcell Fiber, sabit genişbant, IPTV | `tcell_annual_report_2025_tr`, pages 15, 18, 20 |
| Dijital servisler | BiP, TV+, lifebox, Yaani, oyun ve içerik servisleri | `tcell_annual_report_2025_tr`, pages 20-21 |
| Techfin | Paycell, Financell, Wiyo ve ödeme / finansman ürünleri | `tcell_annual_report_2025_tr`, pages 17-20, 208 |
| Kurumsal dijital | Cloud, veri merkezi, kurumsal bağlantı ve dijital çözümler | `tcell_annual_report_2025_tr`, pages 15-16, 20 |

### Segment Bazlı Gelir Dağılımı

| Segment | 2025 grup dışı gelir | 2025 pay | 2024 grup dışı gelir | Source |
|---|---:|---:|---:|---|
| Turkcell Turkey | 220,319.0 | 91.2% | 199,742.0 | `tcell_q4_2025_financial_report`, page 20 |
| Fintech | 13,689.0 | 5.7% | 11,301.0 | `tcell_q4_2025_financial_report`, page 20 |
| Other | 7,463.0 | 3.1% | 7,117.0 | `tcell_q4_2025_financial_report`, page 20 |
| Total | 241,470.8 | 100.0% | 218,160.0 | `tcell_q4_2025_financial_report`, page 20 |

### Ar-Ge Yatırımları ve Projeler

| Metric | 2025 | Source |
|---|---:|---|
| Ar-Ge çalışan sayısı | 1,474 | `tcell_annual_report_2025_tr`, page 18 |
| Horizon 2020 / Europe & Digital Europe projeleri | 6 ongoing | `tcell_annual_report_2025_tr`, page 18 |
| TÜBİTAK destekli ulusal proje | 16 ongoing | `tcell_annual_report_2025_tr`, page 18 |
| Ulusal patent başvurusu | 5,464 | `tcell_annual_report_2025_tr`, page 18 |
| Tescillenmiş patent | 1,247 | `tcell_annual_report_2025_tr`, page 18 |
| Zekâ Gücü okulu / sınıfı | 87 | `tcell_annual_report_2025_tr`, page 18 |
| Öğrenci erişimi | 66 bin+ | `tcell_annual_report_2025_tr`, page 18 |

### Yatırım Planları

| Category | 2024 | 2025 | Source |
|---|---:|---:|---|
| Toplam yatırım harcamaları | 71,753.2 | 89,961.4 | `tcell_annual_report_2025_tr`, page 208 |
| Operasyonel yatırım harcamaları | 49,740.1 | 54,651.8 | `tcell_annual_report_2025_tr`, page 208 |
| Lisans ve ilgili giderler | 34.7 | 254.4 | `tcell_annual_report_2025_tr`, page 208 |
| Operasyonel olmayan yatırım harcamaları | 21,978.4 | 35,055.2 | `tcell_annual_report_2025_tr`, page 208 |
| IFRS 15 | 8,953.7 | 11,260.1 | `tcell_annual_report_2025_tr`, page 208 |
| IFRS 16 | 8,955.1 | 18,184.8 | `tcell_annual_report_2025_tr`, page 208 |
| Diğer | 4,069.6 | 5,610.4 | `tcell_annual_report_2025_tr`, page 208 |

### Çalışan Sayıları ve İnsan Kaynakları

| Metric | 2025 | Source |
|---|---:|---|
| Total employees | 24,290 | `tcell_annual_report_2025_tr`, pages 15 / 18 |
| Women employees | 34.3% | `tcell_annual_report_2025_tr`, page 18 |
| Women managers | 23.0% | `tcell_annual_report_2025_tr`, page 18 |
| Female engineering graduates | 37.1% | `tcell_annual_report_2025_tr`, page 18 |
| Women in IT roles | 31.5% | `tcell_annual_report_2025_tr`, page 18 |
| Training hours | 210,963 | `tcell_annual_report_2025_tr`, page 211 |
| Employee engagement score | 85 | `tcell_annual_report_2025_tr`, page 211 |
| Overall satisfaction | 89 | `tcell_annual_report_2025_tr`, page 211 |
| Employees hired | 353 | `tcell_annual_report_2025_tr`, page 211 |

### Müşteri / Tedarikçi Yoğunlaşması

| Area | Extracted observation | Source |
|---|---|---|
| Customer concentration | Numeric concentration table not explicitly disclosed in this workspace | [VERİ YOK] |
| Revenue concentration | Turkcell Turkey segment dominates consolidated revenue | `tcell_q4_2025_financial_report`, page 20 |
| Supplier / partner concentration | Google Cloud, BOTAŞ, Telecom Italia Sparkle, ULAK and energy / network vendors are prominent | `tcell_annual_report_2025_tr`, pages 15-16, 20-21 |
| Concentration risk | Cross-border and energy-related supply / execution risk remains material | `tcell_annual_report_2025_tr`, pages 15-16, 20-21, 210 |

## Normalization Notes

| Note | Detail |
|---|---|
| Currency | All figures are TRY million unless explicitly stated otherwise |
| Basis | FY2025 detailed data are from the latest annual/financial filing set |
| Historical series | FY2021-FY2023 come from the corresponding annual report selected financial data sections |
| Restatements | Comparative figures in FY2025 are presented on the latest filing basis; earlier years retain their filing basis |
| EBITDA / EBIT | EBITDA is management KPI; EBIT here is presented as operating profit / operating income in the filings |
| Cash flow | 2025 cash flow includes FX / inflation adjustment between net increase in cash and closing cash |
| Net debt | The report’s net debt KPI is a management definition and is not the same as a simple balance-sheet subtraction |

## Auto-Checks

| Check | Status | Variance / note |
|---|---|---|
| Balance sheet equation | PASS | 500,572.8 = 241,239.8 + 259,333.1 |
| Income statement chain | PASS | 2025 filing reconciles through profit before tax and net income |
| Cash flow reconciliation | PASS | Opening cash + operating / investing / financing cash flows + FX / inflation adjustment = closing cash |
| Equity rollforward | PASS | Statement movements reconcile to closing equity in the filing |

## Data Quality Issues

| Issue | Status | Impact |
|---|---|---|
| Historical comparability | Noted | FY2021-FY2023 are not on the same restated basis as FY2025 comparatives |
| Customer concentration table | Not explicitly disclosed | Low |

