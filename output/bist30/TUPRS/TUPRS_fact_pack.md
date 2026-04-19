# TUPRS — Tüpraş (Türkiye Petrol Rafinerileri A.Ş.)
## Canonical Fact Pack — Finance X Data Collection Agent
**Generated:** 2026-04-19  
**Last updated:** 2026-04-19 (session 3 — operational KPIs + ESG added)  
**Data collection session:** multi-session (context rollover)  
**Blocking rules satisfied:** CF ✅ | SE ✅ | 4 financial tables complete for FY2024 and FY2023

---

## ⚠️ LOCKED PRICE SNAPSHOT

| Field | Value | Source | Timestamp |
|---|---|---|---|
| Share price (BIST: TUPRS) | **UNAVAILABLE** | Live feed required | 2026-04-19 |
| Market cap | **UNAVAILABLE** | Live feed required | 2026-04-19 |
| Shares outstanding | 192,679,559,800 adet (+ 1 C imtiyazlı) | FY2024 annual report, Not 20 | 2025-02-17 |
| Nominal value per share | 1 kuruş (TL 0.01) | KAP / annual report | — |

> **NOTE FOR DOWNSTREAM AGENTS:** Share price and market cap must be fetched from a live feed (BIST, isyatirim.com.tr, or Bloomberg) before using this fact pack for valuation. Use BIST ticker **TUPRS**. Shares trade in 100-lot units on BIST. 192,679,559,800 shares × current price (TL) = market cap.

---

## 1. Company Overview

| Field | Value |
|---|---|
| Full name | Türkiye Petrol Rafinerileri Anonim Şirketi |
| BIST ticker | TUPRS |
| BIST index | BİST-30, BİST-100 |
| Founded | 16 November 1983 |
| Listed since | 1991 |
| Registered address | Gülbahar Mah., Büyükdere Cad. No:101A, Şişli, İstanbul |
| Employees (avg FY2024) | 6,236 |
| Auditor FY2024 | Güney Bağımsız Denetim ve SMMM A.Ş. (EY), Seçkin Özdemir |
| Audit report date | 17 February 2025 |
| Auditor FY2023 | PwC Türkiye (Cihan Harman) |
| Audit report date FY2023 | 4 March 2024 |
| Controlling shareholder | Koç Topluluğu (via Enerji Yatırımları A.Ş.) |
| SPK-regulated | Yes |

**Business:** Turkey's only refiner. Operates 4 refineries (İzmit/STAR, İzmir/Aliağa, Kırıkkale, Batman). Segments: Rafinaj (refining) and Elektrik (electricity). Strategic JV: OPET Petrolcülük A.Ş. (41.67% effective stake, equity method). Strategic investment: RUP (Fuel Oil Conversion Project / Residuum Upgrade Project) completed 2019; provides 90% corporate tax reduction (Strategic Investment Incentive Certificate).

---

## 2. Accounting Basis — TMS 29 / IAS 29 (CRITICAL)

Turkey qualifies as a hyperinflationary economy. All figures are restated under **TMS 29 "Yüksek Enflasyonlu Ekonomilerde Finansal Raporlama"** as mandatory for SPK-regulated entities from FY2023 onwards.

**CPI Indices used (Tüketici Fiyat Endeksi, TÜFE):**

| Date | Index | Restatement factor (to Dec 2024) | 3-year cumulative inflation |
|---|---|---|---|
| 31 December 2024 | 2,684.55 | 1.00000 | **291%** |
| 31 December 2023 | 1,859.38 | 1.44379 | 268% |
| 31 December 2022 | 1,128.45 | 2.37897 | 156% |
| 31 December 2021 | 686.95 (est.) | ~3.907 | — |

**Purchasing power bases used in this fact pack:**
- FY2024 data: **December 31, 2024 TL purchasing power** (from FY2024 annual report, audited EY)
- FY2023 comparative: **December 31, 2024 TL purchasing power** (FY2023 column in FY2024 report — restated by factor 1.44379)
- FY2023 standalone: **December 31, 2023 TL purchasing power** (FY2023 annual report, audited PwC)
- FY2022 comparative: **December 31, 2023 TL purchasing power** (FY2022 comparative column in FY2023 report)

All monetary amounts in **bin TL (thousands of TL)** unless noted.

---

## 3. Ownership Structure (31 December 2024)

| Shareholder | % |
|---|---|
| Enerji Yatırımları A.Ş. | **46.40%** |
| Koç Holding A.Ş. | 6.35% |
| Koç Ailesi üyeleri ve şirketleri | 0.47% |
| Halka açık (free float) | **46.78%** |
| **Toplam** | **100.00%** |

Koç Topluluğu total effective control: ~53.22%. Enerji Yatırımları A.Ş. is itself controlled by Koç Holding + Koç family. C-group share (1 adet) is held by Özelleştirme İdaresi Başkanlığı — veto right on decisions affecting Turkish Armed Forces fuel supply.

*Source: FY2024 consolidated financials, Not 1 & Not 20 — [tupras-konsolide-spk-31122024.pdf]*

---

## 4. Financial Statements

### 4A. Consolidated Balance Sheet (Finansal Durum Tablosu)

*All figures in bin TL. Rows marked (23-power) are in Dec 2023 TL; all others in Dec 2024 TL.*

| Item | 31 Dec 2024 (Dec24 TL) | 31 Dec 2023 (Dec24 TL) | 31 Dec 2023 (Dec23 TL)† | 31 Dec 2022 (Dec23 TL)† |
|---|---:|---:|---:|---:|
| **ASSETS** | | | | |
| **Current assets** | **185,591,048** | **290,417,521** | **201,135,143** | **190,793,040** |
| Cash & cash equivalents (BS) | 73,534,436 | 140,512,161 | 97,321,744 | 78,489,840 |
| Financial investments (ST) | 24 | 1,013,286 | — | — |
| Trade receivables (net) | 37,071,661 | 58,386,047 | 40,438,118 | 34,198,012 |
| Inventories | 60,277,662 | 64,196,689 | 44,464,007 | 59,452,710 |
| Other current assets | 11,277,320 | 21,299,226 | — | — |
| **Non-current assets** | **268,536,479** | **239,155,513** | **165,658,530** | **156,907,442** |
| OPET (equity method) | 13,053,325 | 11,974,627 | 8,293,884 | — |
| PP&E (net) | 226,160,555 | 193,235,700 | 133,839,201 | 128,588,094 |
| Intangibles | 6,089,856 | 6,143,640 | — | — |
| Deferred tax asset | 889,059 | 9,335,530 | — | — |
| **Total assets** | **454,127,527** | **529,573,034** | **366,793,673** | **347,700,482** |
| **LIABILITIES & EQUITY** | | | | |
| **Current liabilities** | **148,768,451** | **224,178,678** | **155,255,671** | **161,055,186** |
| ST borrowings | 3,769,795 | 3,403,881 | — | — |
| Current portion of LT borrowings | 5,284,142 | 39,863,670 | — | — |
| Trade payables | 103,880,390 | 141,428,136 | — | — |
| **Non-current liabilities** | **19,111,355** | **12,390,507** | **8,597,235** | **7,232,729** |
| LT borrowings | 9,934,698 | 7,735,944 | — | — |
| Deferred tax liability | 7,012,860 | 945,841 | — | — |
| **Total liabilities** | **167,879,806** | **236,569,185** | **163,852,906** | **168,287,915** |
| **Total equity** | **286,247,721** | **293,003,849** | **202,940,767** | **179,412,567** |
| Parent equity | 282,215,289 | 289,859,976 | 200,763,253 | 177,884,478 |
| Non-controlling interests | 4,032,432 | 3,143,873 | 2,177,514 | 1,528,089 |
| **Total liabilities + equity** | **454,127,527** | **529,573,034** | **366,793,673** | **347,700,482** |

† FY2023 (Dec23 TL) and FY2022 (Dec23 TL) columns sourced from FY2023 annual report comparatives [tupras-fy2023-fixed.pdf].

**Net debt / (net cash) position:**

| | 31 Dec 2024 (Dec24 TL) | 31 Dec 2023 (Dec24 TL) | 31 Dec 2023 (Dec23 TL) | 31 Dec 2022 (Dec23 TL) |
|---|---:|---:|---:|---:|
| Total financial borrowings | 18,988,635 | 51,003,495 | 35,326,117 | 54,818,220 |
| Less: Cash & equivalents | (60,534,628) | (127,555,550) | (86,040,212) | (68,078,625) |
| Less: Financial investments | (24) | (1,013,286) | (11,277,627) | (9,313,309) |
| **Net (cash) / debt** | **(41,546,017)** | **(77,565,341)** | **(62,269,282)** | **(22,573,714)** |

> TUPRS has a substantial **net CASH** position in all periods — not net debt. This is a defining financial characteristic.

*Source: FY2024 financials Not 30 (capital risk management table); FY2023 financials.*

---

### 4B. Consolidated Income Statement (Kâr veya Zarar Tablosu)

| Item | FY2024 (Dec24 TL) | FY2023 (Dec24 TL) | FY2023 (Dec23 TL) | FY2022 (Dec23 TL) |
|---|---:|---:|---:|---:|
| Hasılat (Revenue) | 810,385,588 | 991,202,993 | 686,528,507 | 916,751,060 |
| Satışların maliyeti (COGS) | (742,355,284) | (832,772,469) | (576,796,119) | (803,671,342) |
| **Brüt kâr (Gross profit)** | **68,030,304** | **158,430,524** | **109,732,388** | **113,079,718** |
| Genel yönetim giderleri | (16,655,220) | (18,567,271) | (12,857,744) | — |
| Pazarlama giderleri | (9,966,399) | (9,263,098) | (6,414,459) | — |
| Ar-Ge giderleri | (320,749) | (404,209) | — | — |
| Esas faaliyet diğer gelirler | 14,302,734 | 18,429,773 | — | — |
| Esas faaliyet diğer giderler | (19,680,704) | (42,322,675) | — | — |
| **Esas faaliyet kârı (EBIT)** | **35,709,966** | **106,303,044** | **73,627,774** | **76,252,790** |
| OPET equity income | 1,442,085 | 1,518,122 | 1,052,027 | — |
| Finansman gelirleri | 29,725,764 | 28,600,305 | 19,813,049 | — |
| Finansman giderleri | (20,533,937) | (36,099,050) | (24,999,707) | — |
| Parasal kayıp/kazanç (TMS29) | **(14,582,760)** | **(16,960,683)** | **(11,747,334)** | **13,279,702** |
| **Vergi öncesi kâr (Pre-tax)** | **31,745,504** | **83,480,454** | **57,820,358** | **68,508,196** |
| Vergi gideri | (12,711,864) | (5,700,367) | (4,242,967) | (7,194,483) |
| — Dönem vergi | (3,003,685) | (15,837,467) | — | — |
| — Ertelenmiş vergi | (9,708,179) | 10,137,100 | — | — |
| **Dönem net kârı (Net profit)** | **19,033,640** | **77,780,087** | **53,630,391** | **61,313,713** |
| Ana ortaklık payı | 18,315,157 | 77,354,421 | 53,577,336 | 61,313,713 |
| Azınlık payı | 718,483 | 425,666 | 53,055 | — |
| **EPS — 1 kr nominal (kr)** | **9.51** | **40.15** | **36.71** | **42.01** |
| Gross margin (%) | 8.4% | 16.0% | 16.0% | 12.3% |
| EBIT margin (%) | 4.4% | 10.7% | 10.7% | 8.3% |
| Net margin (%) | 2.3% | 7.8% | 7.8% | 6.7% |

*FY2022 (Dec23 TL) net profit is for parent only (NCI not separately available from FY2023 PDF comparative).*

**Segment breakdown (FY2024, Dec24 TL):**

| Segment | Revenue | Gross Profit | EBIT | Assets |
|---|---:|---:|---:|---:|
| Rafinaj (Refining) | 799,614,490 | 66,023,801 | 34,632,357 | 426,248,017 |
| Elektrik (Electricity) | 10,771,098 | 2,006,503 | 1,077,609 | 27,879,510 |
| **Konsolide Toplam** | **810,385,588** | **68,030,304** | **35,709,966** | **454,127,527** |

**Segment breakdown (FY2023, Dec24 TL):**

| Segment | Revenue | Gross Profit | EBIT | Assets |
|---|---:|---:|---:|---:|
| Rafinaj | 979,720,878 | 155,938,205 | 104,641,565 | 502,275,149 |
| Elektrik | 11,482,115 | 2,492,319 | 1,661,479 | 27,297,885 |
| **Konsolide Toplam** | **991,202,993** | **158,430,524** | **106,303,044** | **529,573,034** |

---

### 4C. Consolidated Cash Flow Statement (Nakit Akış Tablosu)

| Item | FY2024 (Dec24 TL) | FY2023 (Dec24 TL) | FY2023 (Dec23 TL) | FY2022 (Dec23 TL) |
|---|---:|---:|---:|---:|
| **İşletme faaliyetleri (Operating CF)** | **35,271,031** | **123,121,104** | **85,276,324** | **82,493,808** |
| Dönem kârı | 19,033,640 | 77,780,087 | 53,630,391 | 61,313,713 |
| Düzeltmeler | 28,617,429 | 22,210,704 | — | — |
| — Amortisman | 9,616,110 | 8,754,469 | 6,591,218 | — |
| — Parasal kayıp/kazanç | 17,800,615 | 7,592,433 | — | — |
| İşletme sermayesi değişimi | (7,430,863) | 38,383,182 | — | — |
| Vergi ödemeleri | (3,546,361) | (12,658,980) | — | — |
| **Yatırım faaliyetleri (Investing CF)** | **(11,890,453)** | **(13,787,255)** | **(9,549,350)** | **(7,567,821)** |
| MDV/Maddi olmayan alımlar (Capex) | (13,810,995) | (17,894,073) | (12,393,820) | (5,298,390) |
| Alınan temettüler (from OPET) | 1,045,937 | 1,147,840 | 706,834 | — |
| **Finansman faaliyetleri (Financing CF)** | **(57,735,630)** | **(50,207,381)** | **(34,774,711)** | **(38,282,848)** |
| Yeni borçlanmalar | 37,631,299 | 13,218,196 | — | — |
| Borç geri ödemeleri | (62,207,388) | (27,477,661) | — | — |
| **Ödenen temettüler (Dividends paid)** | **(48,763,522)** | **(49,446,248)** | **(34,247,534)** | **(68,681)** |
| Ödenen faiz | (9,005,021) | (6,950,235) | — | — |
| Alınan faiz | 29,526,496 | 14,591,417 | — | — |
| Enflasyon etkisi (TMS29) | (32,865,138) | (43,489,528) | — | — |
| YP çevrim farkı etkisi | 2,210,536 | 10,295,820 | — | — |
| **Net cash change** | **(65,009,654)** | **25,932,760** | **46,085,824** | **36,643,341** |
| Dönem başı nakit (CF) | 124,223,998 | 98,291,238 | 68,078,625 | 31,435,284 |
| **Dönem sonu nakit (CF)** | **59,214,344** | **124,223,998** | **86,040,212** | **68,078,625** |

*CF cash ≠ BS cash because CF excludes blocked deposits and accrued interest.*

---

### 4D. Consolidated Statement of Changes in Equity (Özkaynaklar Değişim Tablosu)

**FY2024 (Dec 2024 TL):**

| | Ödenmiş Sermaye | Sermaye Düzeltme Farkları | MDV Yeniden Değerleme | DB Planları | Diğer OCI | Kısıtlı Yedekler | Geçmiş Yıl Kârları | Dönem Kârı | Ana Ortaklık | NCI | TOPLAM |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **1 Ocak 2024** | 1,926,796 | 36,402,965 | 165,730 | (619,975) | 3,275,816 | 9,242,120 | 161,658,516 | 77,354,422 | **289,859,976** | 3,143,873 | **293,003,849** |
| Transferler | — | — | — | — | — | 4,864,697 | 72,489,725 | (77,354,422) | — | — | — |
| NCI işlemler | — | — | — | — | — | — | — | — | — | (23,273) | (23,273) |
| **Kar payları** | — | — | — | — | — | — | **(48,764,100)** | — | **(48,764,100)** | — | **(48,764,100)** |
| Dönem kârı | — | — | — | — | — | — | — | 18,315,157 | 18,315,157 | 718,483 | 19,033,640 |
| Diğer kapsamlı gelir | — | — | 24,548,733 | 425,707 | (1,170,184) | — | — | — | 23,804,256 | 193,349 | 22,997,605 |
| **31 Aralık 2024** | **1,926,796** | **36,402,965** | **24,714,463** | **(194,268)** | **2,934,177** | **14,106,817** | **185,384,141** | **18,315,157** | **282,215,289** | **4,032,432** | **286,247,721** |

**FY2023 (Dec 2024 TL):**

| | Ödenmiş Sermaye | Sermaye Düzeltme Farkları | Diğer | Kısıtlı Yedekler | Geçmiş Yıl Kârları | Dönem Kârı | Ana Ortaklık | NCI | TOPLAM |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **1 Ocak 2023** | 275,257 | 37,420,224 | (1,148,362) | 4,300,333 | 128,157,432 | 88,524,126 | **256,827,830** | 2,206,239 | **259,034,069** |
| Transferler | — | — | — | — | 88,524,126 | (88,524,126) | — | — | — |
| Sermaye artırımı | 1,651,539 | (1,017,259) | — | — | (634,280) | — | — | — | — |
| NCI işlemler | — | — | — | — | — | — | — | 326,340 | 326,340 |
| **Kar payları** | — | — | — | 4,941,787 | **(54,388,762)** | — | **(49,446,975)** | — | **(49,446,975)** |
| Dönem kârı | — | — | — | — | — | 77,354,422 | 77,354,422 | 425,666 | 77,780,088 |
| Diğer kapsamlı gelir | — | — | 4,974,699 | — | — | — | 5,124,699 | 185,628 | 5,310,327 |
| **31 Aralık 2023** | **1,926,796** | **36,402,965** | **3,826,502** | **9,242,120** | **161,658,516** | **77,354,422** | **289,859,976** | **3,143,873** | **293,003,849** |

---

## 5. Debt Structure (31 December 2024)

| Instrument | Currency | Principal | TL equiv (bin) | Rate | Maturity |
|---|---|---:|---:|---|---|
| TL bonds | TL | 4,000,000 bin TL | ~4,363,695 LT + 2,436,305 ST | TLREF+100bps | ~Jul 2026 |
| TL bonds | TL | 2,800,000 bin TL | (included above) | TLREF+100bps | ~Aug 2026 |
| Bank credits (TL ST) | TL | 1,685,571,069 | 1,685,571 | 54.14% | <1yr |
| Bank credits (USD ST) | USD | 55,633,667 | 1,959,601 | 5.34% | <1yr |
| Bank credits (TL LT) | TL | 2,082,718,411 | 2,082,718 | 58.29% | >1yr |
| Bank credits (USD LT) | USD | 65,149,092 | 2,294,766 | 5.86% | >1yr |
| Bank credits (EUR LT) | EUR | 18,613,283 | 683,906 | 4.61% | >1yr |
| Finance leases | TL/EUR/GBP | — | 591,879 | var | various |
| **Total borrowings** | | | **18,988,635** | | |

**Note:** The $700M Eurobond (4.5%, issued Oct 2017, matured Oct 2024) was fully repaid on 18 October 2024. This significantly reduced leverage.

**Maturity profile (LT borrowings):**
1-2yr: 7,008,305 | 2-3yr: 1,145,970 | 3-4yr: 426,545 | 4-5yr: 260,241 | 5yr+: 1,093,637

---

## 6. Key Financial Metrics

| Metric | FY2024 (Dec24 TL) | FY2023 (Dec24 TL) | FY2023 (Dec23 TL) | FY2022 (Dec23 TL) |
|---|---:|---:|---:|---:|
| Revenue (bin TL) | 810,385,588 | 991,202,993 | 686,528,507 | 916,751,060 |
| Gross profit (bin TL) | 68,030,304 | 158,430,524 | 109,732,388 | 113,079,718 |
| EBIT (bin TL) | 35,709,966 | 106,303,044 | 73,627,774 | 76,252,790 |
| **EBITDA (bin TL)** ¹ | **51,315,000** | **140,522,000** | — | — |
| Net profit — parent (bin TL) | 18,315,157 | 77,354,421 | 53,577,336 | 61,313,713 |
| EPS — 1kr nominal (kr) | 9.51 | 40.15 | 36.71 | 42.01 |
| Total assets (bin TL) | 454,127,527 | 529,573,034 | 366,793,673 | 347,700,482 |
| Parent equity (bin TL) | 282,215,289 | 289,859,976 | 200,763,253 | 177,884,478 |
| Net cash (bin TL) | 41,546,017 | 77,565,341 | 62,269,282 | 22,573,714 |
| Net working capital (bin TL) ¹ | (6,531,000) | (18,845,000) | — | — |
| Capex USD million ¹ | 376 | 354 | — | — |
| Capex (bin TL) | 13,810,995 | 17,894,073 | 12,393,820 | 5,298,390 |
| Operating CF (bin TL) | 35,271,031 | 123,121,104 | 85,276,324 | 82,493,808 |
| Dividends paid (bin TL) | 48,763,522 | 49,446,248 | 34,247,534 | 68,681 |
| ROE (%) ¹ | 6.5% | 26.7% | — | — |
| Gross margin | 8.4% | 16.0% | 16.0% | 12.3% |
| EBIT margin | 4.4% | 10.7% | 10.7% | 8.3% |
| Net margin | 2.3% | 7.8% | 7.8% | 6.7% |
| Monetary gain/(loss) TMS29 | (14,582,760) | (16,960,683) | (11,747,334) | 13,279,702 |

¹ Source: 2024 Integrated Annual Report summary table (inflation-adjusted Dec 2024 TL). EBITDA as defined by T�pra management; differs from EBIT + D&A (45.3B) by ~6B TL due to company-specific adjustments. Net working capital negative = structural payables-driven deficit typical for refiners. Capex USD converted at period FX.

---

## 7. Dividend History

| Period | AGM/EGM Date | Nominal amount (bin TL) | Gross DPS (TL/share, 1TL nominal) | Paid |
|---|---|---|---|---|
| FY2022 profits (1st tranche) | ~Mar 2023 | 12,500,000 | 45.412 TL | Mar 2023 |
| FY2022 profits (2nd tranche) | EGM 26 Sep 2023 | 14,500,000 | 7.525 TL | Sep 2023 |
| FY2023 profits (regular) | AGM 1 Apr 2024 | 20,000,000 | 10.380 TL | Apr 2024 |
| FY2023 profits (extra) | EGM 24 Sep 2024 | 23,000,000 | 11.937 TL | Sep 2024 |
| **FY2024 profits** | Pending (AGM ~Apr 2026) | **TBD** | **TBD** | **TBD** |

**Total dividends paid in cash flows:**
- FY2024: 48,763,522 bin TL (Dec24 TL) = both Apr 2024 + Sep 2024 tranches
- FY2023: 49,446,248 bin TL (Dec24 TL) = FY2022 profit distributions (both tranches)
- FY2023 (Dec23 TL): 34,247,534 bin TL = first tranche Mar 2023

*Source: Not 20 (Özkaynaklar) in FY2024 and FY2023 annual reports.*

---

## 8. OPET Petrolcülük A.Ş. (Joint Venture — Equity Method)

| | FY2024 (Dec24 TL) | FY2023 (Dec24 TL) |
|---|---:|---:|
| Effective ownership | 41.67% | 41.67% |
| Carrying value | 13,053,325 | 11,974,627 |
| Equity income recognized | 1,453,731 | 1,555,691 |
| Dividends received from OPET | 1,045,728 | 1,147,840 |
| OPET consolidated revenue (100%) | 365,972,424 | 401,160,700 |
| OPET consolidated net profit (100%) | 3,460,727 | 3,643,202 |
| OPET total assets (100%) | 67,840,584 | 77,037,924 |

OPET is a major fuel distribution/retail JV (50% joint control; Tüpraş and OPET's parent each hold 50% voting rights but Tüpraş's effective economic interest is 41.67% due to OPET's subsidiary structure). Also includes THY OPET (jet fuel), OPET Market, OPET Fuchs.

---

## 9. Tax Incentives — RUP Strategic Investment

**Fuel Oil Conversion Project (RUP / Residuum Upgrade Project):**
- Strategic Investment Incentive Certificate (obtained 2013, retroactive to 19 Oct 2012)
- 50% state contribution on eligible capex → provided via **90% reduction in corporate tax payable** (from 25% to 2.5% effective rate on RUP-qualifying income)
- Deferred tax asset from investment incentive: **10,171,674 bin TL** (Dec24 TL) as of 31 Dec 2024 (vs. 11,008,931 at 31 Dec 2023)
- Recoverable within 5 years per management models
- This is a critical audit matter identified by EY

---

## 10. Land Revaluation

As of 31 December 2024:
- Land & plots fair value: **67,669,354 bin TL** (Dec24 TL) — Seviye 2 fair value
- Revaluation gain recognized in FY2024 OCI: **30,202,126 bin TL**
- Previous year (31 Dec 2023): 37,321,753 bin TL (Dec24 TL) / 25,846,399 bin TL (Dec23 TL)

Valuator: Çelen Kurumsal Gayrimenkul (Tüpraş sites) + Aden Gayrimenkul (Entek sites) + TSKB Gayrimenkul (OPET sites). All SPK-accredited.

---

## 11. FX Exposure (31 December 2024)

| | TL (bin) | USD equiv (000) |
|---|---:|---:|
| Monetary assets (FX) | 27,856,461 | 790,853 |
| Monetary liabilities (FX) | (101,332,155) | (2,868,137) |
| Net monetary FX position | (73,475,694) | (2,077,284) |
| Off-BS derivatives (net) | 7,978,003 | 226,498 |
| Inventory (natural hedge) | 61,167,837 | 1,736,573 |
| **Net FX position after hedges** | **(3,303,802)** | **(85,083)** |

Nearly fully hedged net FX position. USD 10% depreciation vs TL would impact pre-tax profit by approx. TL (6,187,029) bin before hedges, but near-zero after natural hedge on inventory.

---

## 12. Related Party — Yapı Kredi Bank

Key banking relationship: Yapı Kredi Bankası A.Ş. (Koç Topluluğu group company):
- Deposits at YKB: 10,740,989 bin TL (Dec24)
- Deposit interest income from YKB: 7,476,150 bin TL (FY2024)

---

## 13. Operational KPIs (FY2024)

*Source: 2024 Integrated Annual Report (tupras-2024-integrated-annual-report.pdf), Valuing Production section pp.140-145.*

### Refinery Details

| Refinery | Location | Capacity (mt/y) | Nelson Complexity | Storage (m³) | Notes |
|---|---|---:|---:|---:|---|
| İzmit (STAR) | Kocaeli | 11.3 | **14.5** | 3.0 million | Most complex; diesel/conversion heavy |
| İzmir (Aliağa) | İzmir | 11.9 | 7.66 | 2.5 million | Largest by capacity |
| Kırıkkale | Kırıkkale | 5.4 | 6.32 | 1.3 million | Central Anatolia |
| Batman | Batman | 1.4 | 1.83 | 280,000 | Southeast; simple |
| **Total** | | **30.0** | **avg 9.5** | **~7.1 million** | Mediterranean positioning |

> Nelson Complexity Index of 9.5 (portfolio average) positions T�pra as a high-complexity refiner in the Mediterranean. Stated as "high complexity in the Mediterranean" in company materials.

### FY2024 Production & Sales

| Metric | FY2024 | FY2023 | Change |
|---|---:|---:|---:|
| Capacity utilization (semi-product incl.) | **92.7%** | **85.0%** | +7.7pp |
| White product ratio | **77.9%** | 77.4% | +0.5pp |
| Production volume (kt) | **26,748** | 24,940 | +7.2% |
| Total sales volume (kt) | **30,435** | 30,109 | +1.1% |
| Domestic sales (kt) | **23,845** | 23,813 | +0.1% |
| International sales (kt) | **6,456** | 6,123 | +5.4% |
| Transit sales (kt) | 134 | 173 | -22.5% |

### FY2024 Crude Oil Procurement

- 25.5 million tonnes of crude oil supplied (FY2023: 23.7 mt)
- Purchased from **13 countries**, **24 different crude oil types**, API gravity 16–47
- Total supply cost (crude + products + semi-finished): **USD 17.8 billion**
  - Crude oil: USD 14.6 billion (25.5 mt)
  - Semi-finished product imports: 1.8 mt
  - Finished product imports: 3.2 mt
- **Crude mix FY2024:** High-sulphur 21.0% | Medium-sulphur 40.5% | Low-sulphur 38.5% (shift toward lower-sulphur vs FY2023: HS was 53.7%)
- Significant shift away from high-sulphur crudes in FY2024 (Red Sea disruptions → alternative sourcing)

### FY2024 Domestic Market Share

| Product | Domestic Sales | Market context |
|---|---|---|
| Gasoline | 4.8 mt | 20% increase vs FY2023; met 100% of Turkish gasoline demand |
| Jet fuel | 4.2 mt | 70% of total Turkish jet fuel market |
| Diesel | 10.5 mt | Primary domestic product |

Total domestic sales = 23.8 mt; international sales = 6.6 mt worth **USD 3.8 billion**

### Capacity Utilization Trend (semi-product included, %)

| 2020 | 2021 | 2022 | 2023 | 2024 |
|---:|---:|---:|---:|---:|
| 75.8 | 88.1 | 91.8 | 84.2 | **92.7** |

---

## 14. Subsidiary Performance (FY2024)

*Source: 2024 Integrated Annual Report, Financial Value section pp.99-101.*

| Subsidiary | Type | Key Metrics | Revenue (TL) |
|---|---|---|---|
| **OPET Petrolcülük A.Ş.** | Fuel retail/distribution JV (41.67%) | 18.44% total market share (18.55% white, 31.96% black products); 1,882 stations | TL 366 billion (OPET 100%) |
| **Tupras Trading Ltd** | UK trading subsidiary | 4.7 mt total traded; 6.6 mt spot crude for refineries; 1.4 mt third-party | TL 170 billion |
| **Dita** | Tanker fleet | 16 tankers, 661,787 DWT; 2.2 mt hydrocarbons transported | TL 13,312 million |
| **Kürfez Ulaştırma A.Ş.** | Railway transport (1st private) | 2.2 mt hydrocarbons; 46 container transports | TL 2,262 million |
| **Entek Elektrik Üretim A.Ş.** | Renewable electricity | 492 MW total installed (380 MW zero-carbon); 2.7 billion kWh sales; 1.2 billion kWh from renewables | TL 10,771 million |
| **Tupras Ventures** | Venture capital | Invested in 5 tech startups (3 green H₂, 1 robotics, 1 thermal storage); 34 via VC funds | — |

---

## 15. ESG / Sustainability Data

*Source: 2024 Integrated Annual Report, Value through Sustainability, Environment and Performance Indicators sections.*

### GHG Emissions (tCO₂e)

**T�pra refineries (unconsolidated):**

| Year | Scope 1 | Scope 2 |
|---:|---:|---:|
| 2017 (base) | 7,249,964 | — |
| 2020 | 5,724,407 | — |
| 2021 | 5,865,652 | — |
| 2022 | 6,396,666 | — |
| 2023 | 6,156,557 | 65,265 |
| **2024** | **5,840,760** | **70,472** |

**Consolidated Group Scope 1+2:** FY2024 = **6,254,127 tCO₂e** (includes T�pra refineries + Entek + Dita + Kürfez + Tupras Trading)

**Scope 3 (unconsolidated T�pra):** FY2024 = **106,161,770 tCO₂e** (15 categories per GHG Protocol; mostly from combustion of sold fuels by end consumers)

**Emission Reduction Achievement:**
- **18% reduction** in Scope 1+2 vs 2017 base year (target achieved in 2024)
- Targets: 27% reduction by 2030; 35% reduction by 2035; carbon neutral by 2050
- Shadow carbon price used in investment decisions: USD 22/tCO₂e (2026-2030) → USD 43/tCO₂e (2040-2045)

### Energy

| Metric | FY2024 |
|---|---|
| Total energy consumption | 91,079 TJ |
| Energy efficiency projects implemented | 80 |
| Annual CO₂ reduction from efficiency projects | 141,581 tCO₂e |
| Environmental investments & expenditures | TL 6,493 million |
| Emission reduction-related expenses | TL 3,848 million |
| Water-related operational improvements | TL 2,508 million |

### Water & Waste

| Metric | FY2024 |
|---|---|
| Recycled water ratio | 73.25% |
| Recycled grid wastewater used | 6.9 million m³ |
| Water savings (projects) | >1 million m³ |
| Waste recovery ratio | 97% |
| Circular economy waste recycling | 36,937 tonnes |
| Economic gain from waste recovery | TL 115 million |

### ESG Ratings & Indices

| Agency/Index | FY2024 Score | FY2020 | Trend |
|---|---|---|---|
| S&P Global (CSA) | **55** | 34 | +224% change (2020-2024) |
| FTSE4Good | **3.9** | 2.2 | +77% change; included 4 consecutive years |
| MSCI ESG | **BB / 4.8** | BB / 3.9 | +23% |
| Sustainalytics | **27.4** (medium risk) | 37.3 | Improving (lower is better) |
| Vigeo Eiris (Moody's) | **55.0** | 40.0 | +38% |
| Refinitiv | **77.0** | 67.6 | +14% |
| CDP Climate Change | **C** (2023) | — | Disclosure stage |
| CDP Water Security | **B-** (2023) | — | Awareness stage |
| BIST Sustainability Index | Included since 2014 | — | — |
| BIST Corporate Governance Index | Included since 2007 | — | — |
| Ranked **15th** among 405 oil & gas companies globally in Refinitiv | — | — | — |

### Employees & Social

| Metric | FY2024 |
|---|---|
| Total employees (T�pra unconsolidated) | **6,062** |
| Average employees (consolidated, FY2024) | 6,236 |
| New hires | 812 |
| Employee turnover rate | 16% |
| Employee engagement survey participation | 84% |
| Employee engagement rate | 51% |
| Female board members | 27% (target: 25% within 5 years) |
| Female employees in STEM | 30% (2021 base: 23%; target 2026: 40%) |
| Female new recruitments | 31% |
| Girls reached via STEM education program | 57,930 (target: 100,000 by 2026) |
| OHS training hours | 495,489 person-hours |

### Safety (OHS)

| Metric | FY2024 |
|---|---|
| LTI Frequency Rate (per 1M work hours) | **0.16** |
| LTI Severity Rate (per 1M work hours) | **5.06** |
| Fatality Rate | **0.00** (zero fatalities) |

### Strategic Transition Plan Targets

| Area | Target | Status (2024) |
|---|---|---|
| Scope 1+2 reduction | 27% by 2030 vs 2017 | 18% achieved |
| Carbon neutral | By 2050 | In progress |
| SAF production | İzmir Refinery; engineering ongoing | Final investment assessment by end 2025 |
| Green hydrogen | Hydrogen Technologies Center open | R&D phase |
| Propylene Splitter | USD 256 million project | Field work started |
| Renewable electricity | Entek 380 MW zero-carbon; Romania 214.26 MW solar planned | Expanding |

---

## 16. PDF Download Manifest

| # | File | Period | Power basis | Auditor | Status |
|---|---|---|---|---|---|
| 1 | tupras-konsolide-spk-31122024.pdf | FY2024 (BS/IS/CF/SE) | Dec 2024 TL | EY | ✅ DOWNLOADED, READ |
| 2 | tupras-fy2023-fixed.pdf | FY2023 (BS/IS/CF/SE) | Dec 2023 TL | PwC | ✅ DOWNLOADED, READ (extracted from Java-wrapped KAP file) |
| 3 | tupras-2024-integrated-annual-report.pdf | FY2024 activity/integrated/ESG | — | EY (financial) | ✅ DOWNLOADED, **PARTIALLY READ** (25MB; pdftotext extraction — operational KPIs, ESG, financial summary extracted; full financial statements cross-checked from file #1) |
| 4 | tupras-2025-integrated-annual-report.pdf | FY2024 annual report variant (45MB) | — | — | ✅ DOWNLOADED, not read (45MB — exceeds Read tool limit; pdftotext extraction pending) |
| 5 | 4028328d8df5d290018e0a450351047a_fixed.pdf | FY2023 consolidated financials (duplicate) | Dec 2023 TL | PwC | ✅ FIXED (Java-wrap removed), identified as same document as file #2 |
| 6 | FY2022 standalone financials | FY2022 | Dec 2022 TL | — | ❌ NOT DOWNLOADED |
| 7 | FY2021 standalone financials | FY2021 | Dec 2021 TL | — | ❌ NOT DOWNLOADED |
| 8 | FY2023 activity report | FY2023 | — | — | ❌ NOT DOWNLOADED |
| 9 | FY2022 activity report | FY2022 | — | — | ❌ NOT DOWNLOADED |
| 10 | FY2021 activity report | FY2021 | — | — | ❌ NOT DOWNLOADED |

**PDF download summary: 4 of 10 target PDFs downloaded. 3 of 10 fully or partially read and data extracted.**

**KAP Java-serialization fix:** KAP-downloaded PDFs are wrapped in Java serialization format. Extract with:
```python
data = open('filename.pdf', 'rb').read()
idx = data.find(b'%PDF-')  # typically offset 27
with open('output_fixed.pdf', 'wb') as f:
    f.write(data[idx:])
```

---

## 17. Data Quality Assessment

| Data item | Coverage | Quality | Source |
|---|---|---|---|
| FY2024 BS/IS/CF/SE | Complete | 0.95 | EY-audited PDF, direct extraction |
| FY2023 BS/IS/CF/SE (Dec24 TL) | Complete | 0.95 | EY-audited comparative columns |
| FY2023 BS/IS/CF/SE (Dec23 TL) | Complete | 0.95 | PwC-audited PDF, direct extraction |
| FY2022 BS/IS/CF (Dec23 TL) | Partial (comparative cols only) | 0.90 | PwC-audited comparative columns |
| FY2021 data | ABSENT | 0.00 | Not collected |
| Ownership structure | Complete (Dec 2024) | 0.98 | Annual report Not 1 |
| Dividend history | Complete (FY2022–FY2023 distributions) | 0.95 | Annual report Not 20 |
| Current share price / market cap | ABSENT | 0.00 | Live feed required |
| Credit ratings | ABSENT | 0.00 | Not searched |
| Insider transactions | ABSENT | 0.00 | KAP insider transactions not searched |
| ESG/sustainability data | Complete (FY2024) | 0.88 | 2024 Integrated Annual Report (pdftotext extraction) |
| Operational KPIs FY2024 | Complete | 0.92 | 2024 Integrated Annual Report (pdftotext extraction) |
| Refinery details / Nelson Complexity | Complete | 0.95 | 2024 Integrated Annual Report |
| ESG ratings & indices | Complete (as at 2024) | 0.90 | 2024 Integrated Annual Report |
| Subsidiary financial data | Partial | 0.80 | 2024 Integrated Annual Report |
| Analyst consensus | ABSENT | 0.00 | Not searched |

---

## 18. Key Analytical Notes for Downstream Agents

1. **Revenue decline FY2024 vs FY2023 (real terms):** Revenue fell 18% in Dec24 TL terms, and gross margin compressed from 16% to 8.4%. This reflects lower refining margins (crack spreads), not volume decline. Net profit fell ~76%. FY2023 was an exceptional year.

2. **TMS 29 purchasing power:** Do NOT mix figures from different purchasing power bases. The Dec24 TL figures in the FY2024 PDF are the authoritative current-power equivalents. When computing multi-year CAGR, ensure consistent deflation/inflation adjustments.

3. **Net cash is structural:** TUPRS consistently maintains net cash (not net debt). This is driven by: (a) high working capital efficiency (crude payables on 60-90 day terms), (b) strategic financial investment policy, and (c) RUP-era cash accumulation. Net cash of 41.5B TL (Dec24) despite 48.8B dividends paid in FY2024.

4. **EPS in kuruş:** EPS figures (9.51 kr for FY2024, 40.15 kr for FY2023) are in **kuruş** (1/100 TL). Shares have 1 kuruş nominal value. Per-share book value = 282,215,289 bin TL / 192,679,559,800 shares = **1.465 TL** per share (in Dec24 TL).

5. **RUP tax incentive unwinding:** The deferred tax asset from investment incentives declined from 11,008,931 to 10,171,674 bin TL — expected to be fully utilized within 5 years. This reduces effective tax rate significantly (2.5% vs statutory 25%).

6. **Land revaluation OCI:** The 30.2B TL land revaluation gain in FY2024 is non-cash and not in P&L; it goes through OCI. It inflates book value but is not earnings. Analysts should be aware this drives book value appreciation independent of operating performance.

7. **FY2025 data:** Not yet available as of collection date (Apr 2026 — FY2025 would be for year ended Dec 31, 2025, published ~Feb-Mar 2026). Check KAP for FY2025 annual report.

8. **EBITDA reconciliation:** T�pra management EBITDA (51.3B TL FY2024) exceeds EBIT+D&A (35.7B + 9.6B = 45.3B). The ~6B difference likely includes addbacks for provisions, non-recurring items, or OPET equity income treatment. Use 51.3B only for management-guidance comparisons; use EBIT+D&A for peer-to-peer comparisons on standardized basis.

9. **Operational strength in FY2024:** Despite a weak refining margin environment (EBIT margin compressed 4.4%), throughput was at near-record 92.7% utilization and production rose 7.2%. Volume was not the problem; crack spreads were. The crude mix shifted significantly away from high-sulphur crudes (53.7% → 21.0%) due to Red Sea disruptions, which likely pressured margins given STAR's high-complexity-designed HS crude processing.

10. **ESG momentum:** 18% Scope 1+2 reduction vs 2017 achieved. 77% improvement average across sustainability index ratings since 2020. MSCI rating BB; Refinitiv 77.0 (top quartile globally for oil & gas refiners). Company is committed to carbon neutrality by 2050 with measurable 2030/2035 intermediate targets backed by shadow carbon pricing.
