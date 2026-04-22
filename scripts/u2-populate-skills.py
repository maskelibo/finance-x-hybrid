# U2: Populate 20 SKILL.md files with substantive content (short but real).
import os, yaml

SKILLS = yaml.safe_load(open('skills/_registry.yml', encoding='utf-8'))['skills']

def fm(s):
    return f"""---
id: {s['id']}
name: "{s['name']}"
description: "{s['description']}"
triggers: {s['triggers']}
applies_to_agents: {s['applies_to_agents']}
category: {s['category']}
priority: {s['priority']}
---

"""

CONTENT = {
    'bist-kap-fetching': """# BIST KAP Disclosure Fetching

## Ne Zaman Kullanılır?
Bir BIST şirketi için KAP bildirimleri veya faaliyet raporu çekilmesi gerektiğinde. Yeni disclosure eventleri izlenirken (kap_watch). Event classification için disclosure içeriği gerekli olduğunda.

## Prosedür
1. Disclosure listesi: `GET https://www.kap.org.tr/tr/api/disclosure/filter?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&company=TICKER` → JSON array.
2. PDF indir: `https://www.kap.org.tr/tr/api/BildirimPdf/<disclosure_id>` → `node scripts/fetch-pdf.js <url> <out.txt>`.
3. Rate-limit: min 2s iki istek arası, 429 → exponential backoff (4s/8s/16s), 5 başarısızdan sonra escalate.
4. Metadata: ticker, bildirim_id, tip, tarih, material_flag, lokal path.

## Kurallar
- JS-rendered HTML scraping YASAK — sadece API endpoint.
- hasAttachment=false → PDF yok, skip.
- `--prefetched` ile kap_watch listesini data_collection'a pass et → ikinci byCriteria çağrısı yok.
- Scanned image PDF'ler için OCR fallback gerekli.

## Örnek
THYAO Q1 2026 faaliyet raporu: `fetch-pdf.js https://www.kap.org.tr/tr/api/BildirimPdf/1543822 output/THYAO_Q1_2026.txt` → 380 KB text.

## Bilinen Tuzaklar
1. 5 yıldan eski disclosure'lar `/archive/` subpath'inde.
2. Ticker case-sensitive (TR upper-case): THYAO, değil thyao.
3. PDF bazen URL değişiyor — disclosure_index persistence'ını test et.

## Referanslar
- references/kap-api-endpoints.md (U2 populate)
- references/rate-limiting-strategy.md
""",

    'ias29-inflation-accounting': """# IAS 29 Hyperinflation Accounting

## Ne Zaman Kullanılır?
Türkiye TÜFE kümülatif 3 yıl >%100 → IAS 29 aktif (2022'den beri). IFRS/SPK konsolide raporlarda uygulanmış; VUK (solo) raporlarda uygulanmamıştır.

## Prosedür
1. **Net Parasal Pozisyon (NMP)** = parasal_varlıklar (nakit+alacak+mevduat) − parasal_yükümlülükler (kredi+ticari_borç). NMP>0 enflasyonda KAYIP, NMP<0 KAZANÇ.
2. **Parasal Kazanç/Kayıp** = NMP × (TÜFE_t1 / TÜFE_t0 − 1).
3. **IAS 29 Adjusted EBITDA** = Reported EBITDA − Net Monetary Gain (kazanç varsa EBITDA'dan düş).
4. **Adjusted NI** = Reported NI − Monetary Gain + Monetary Loss.

## Kurallar
- Nominal vs restated karıştırma — daima "IAS29 başlığı + periyot" etiketi.
- Amortismanlar tarihsel maliyet × CPI multiplier ile restate edilir.
- Revenue restate → CPI-current-year bazında.
- Monetary gain EBITDA'yı SHISIRIR, adjusted EBITDA için geri çıkarılmalı.

## Örnek
THYAO FY2025 reported EBITDA = 184.8 milyar TL (IFRS). Monetary gain (eğer net borçluysa) = 12 milyar TL. IAS29 adjusted EBITDA = 184.8 − 12 = ~172.8 milyar TL.

## Bilinen Tuzaklar
1. Solo (VUK) rapor IAS29 uygulamıyor — karıştırma.
2. Bankalar hariç tutuluyor (TFRS 10 özel hüküm).
3. Segment breakdown'da IAS29 restatement uygulanmış mı kontrol et (bazen segment-level restated değil).

## Referanslar
- TMS 29 Yüksek Enflasyonlu Ekonomilerde Finansal Raporlama
- TÜİK TÜFE endeks serisi
""",

    'ifrs16-lease-adjustment': """# IFRS 16 Lease Adjustments

## Ne Zaman Kullanılır?
Havacılık, perakende, telekom gibi yüksek operating lease kullanan sektörlerde EBITDAR hesaplamak için. IFRS 16 sonrası lease önden right-of-use asset + lease liability olarak bilançoya giriyor.

## Prosedür
1. **Lease liability** → faiz + anapara kısmına ayrıştır (amortizasyon tablosu kullan).
2. **D&A içinde right-of-use amortization** → ayrı satır, IFRS 16 etkisi.
3. **EBITDAR** = EBITDA + Rent Expense (pre-IFRS 16) veya EBITDA + D&A_leaseROU + Interest_leaseLiab.
4. **Net Debt adjusted** = Financial Debt + Lease Liability.

## Kurallar
- EBITDAR havacılık için zorunlu (airline kira-yoğun).
- Lease-adjusted leverage: Net Debt + 8× Annual Rent (pre-IFRS 16) veya Net Debt + Lease Liability (post).
- Short-term lease (<12ay) ve low-value (<$5k) IFRS 16 dışı — ayrı tutulur.

## Örnek
THYAO FY2025: EBITDA 184.8B TL + lease-ROU amortization 35B TL + lease-liab faiz 8B TL = EBITDAR ~228B TL, marj ~%23.2.

## Bilinen Tuzaklar
1. "Rent expense" ve "Lease D&A + Interest" arasındaki toplam eşit değil — dönem başı/sonu lease liability değişiminden kaynaklanır.
2. Sublease gelirleri ayrı satır; lease cost net alınmalı.
3. Variable lease payment (percentage-of-sales rent) IFRS 16 dışı tutulur.

## Referanslar
- TFRS 16 Kiralamalar
- IASB IFRS 16 staff paper — EBITDA vs EBITDAR
""",

    'financial-statements-extraction': """# Financial Statements Extraction

## Ne Zaman Kullanılır?
PDF faaliyet raporu veya SPK konsolide rapordan gelir tablosu (IS), bilanço (BS), nakit akım tablosu (CF), özsermaye değişim (SE) çıkarılacağında.

## Prosedür
1. **PDF text extract** → `pdfplumber` veya `pymupdf`. Scanned ise OCR (tesseract).
2. **Tablo tespiti** → layout heuristics (çok sütunlu sayısal bloklar, başlık satırları).
3. **Satır eşleştirme** → Türkçe/İngilizce satır etiketi regex'leri (Hasılat/Revenue, Brüt Kar/Gross Profit, FAVÖK/EBITDA).
4. **Dönem yayılımı** → Q1/H1/9M/FY + karşılaştırma (current vs previous).
5. **Unit normalize** → mn TL / bn TL / USD → TRY_mn canonical (fact-layer/unit-normalizer).

## Kurallar
- SPK formatı vs VUK formatı farkı (IAS 29 uygulama).
- Konsolide vs solo ayrımı.
- "Satış gelirleri" ≠ "Hasılat" — bazen brüt vs net farkı.
- İlişkili taraf satışları ayrı satır (segment breakdown'da önemli).

## Örnek
TUPRS 2025 annual: Hasılat 945.7 bn TL → raw 945,700,000,000 → 945,700 mn (canonical TRY_mn).

## Bilinen Tuzaklar
1. PDF sayfa header/footer tablo kesmesi → satır birleştirme gerekli.
2. Notlara atıflar (*1, 5.2.1) tablo'dan düşer.
3. Restated comparatives (önceki dönem IAS 29 düzeltmeli) karıştırmamalı.

## Referanslar
- pdfplumber docs — table_settings
- SPK Sermaye Piyasası Finansal Raporlama Tebliği
""",

    'financial-ratios-calculation': """# 28 Mandatory Metric Formulas

## Ne Zaman Kullanılır?
financial_analysis agent 28 Chairman-zorunlu metrik raporu üretirken. Metrik eksikse report_formatter banner'ı uyarı verir.

## Prosedür
| Metrik | Formül |
|---|---|
| DSO | Alacak / (Satış/365) |
| DIO | Stok / (COGS/365) |
| DPO | Borç / (COGS/365) |
| CCC | DSO + DIO − DPO |
| NWC/Revenue | (Alacak+Stok−Borç) / Satış |
| Net Borç/EBITDA | (Kredi−Nakit) / EBITDA |
| Faiz Karşılama | EBITDA / Faiz Gideri |
| Cari Oran | Dönen Varlık / KVY |
| Asit-Test | (Dönen−Stok) / KVY |
| ROE | Net Kar / Ortalama Özsermaye |
| ROCE | NOPAT / (Toplam Varlık − KVY) |
| ROIC | NOPAT / Yatırılan Sermaye |
| FCF | OCF − CAPEX |
| CAPEX/EBITDA | CAPEX / EBITDA |
| OCF/EBITDA | OCF / EBITDA |

## Kurallar
- Avg özsermaye = (BOP+EOP)/2, period-end değil.
- NOPAT = EBIT × (1 − efektif vergi oranı).
- 28 metrikten eksik olan varsa `[VERİ YOK]` etiketi + confidence=blocked.
- Her metriğin yorumu zorunlu (sadece rakam yazmak yasak — Chairman direktifi).

## Örnek
THYAO FY2025: EBITDA 184.8 bn, Net Debt 677 bn, Net Debt/EBITDA = 3.67x (havacılıkta yüksek sınır).

## Bilinen Tuzaklar
1. Banka için ROIC/ROCE alternative (risk-weighted).
2. Holding için segment bazlı ROIC daha anlamlı.
3. CCC negative olabilir (retail model — ödeme > alım hızlı).

## Referanslar
- canonical/rules/mandatory_metrics.yaml
- _shared_knowledge_modules/ratios.md
""",

    'dcf-valuation': """# DCF Valuation

## Ne Zaman Kullanılır?
valuation_agent intrinsic value hesaplarken. Şirket istikrarlı FCF, predictible growth varsa. Banking için alternative DDM kullan.

## Prosedür
1. **5-yıl FCF projeksiyonu** — revenue growth × operating margin × (1−tax) − CAPEX − ∆NWC.
2. **WACC** = Equity_ratio × Ke + Debt_ratio × Kd × (1−tax).
   - Ke = Rf + β × ERP (Türkiye ERP ~11-14%, Rf Turkish 10Y ~37-40%).
3. **Terminal value** = FCF_year5 × (1+g) / (WACC−g). g = LT GDP growth ~2-3% real.
4. **Enterprise Value** = Σ PV(FCF) + PV(TV).
5. **Equity Value** = EV − Net Debt.
6. **Per-share** = Equity / Shares outstanding.

## Kurallar
- Bear/Base/Bull senaryo zorunlu — tek nokta tahmini kabul edilmez.
- Sensitivity tablosu: WACC ±200bp × g ±100bp matris.
- Turkish companies: USD DCF tercih (TRY volatility) veya TRY DCF with CPI-adjusted g.
- Terminal value EV'nin %60'ını geçerse mantıklılık testi gerekli.

## Örnek
THYAO: FCF_2025 105.7B TL, growth ort 8%, WACC %24 (local), g=%3 → EV ~580B, Equity ~395B, fair PS ~286 TL (spot 323 → %11 discount).

## Bilinen Tuzaklar
1. Negative FCF yıllar — ortalama alma, DCF için kapsayıcı projection.
2. CAPEX lumpy ise (havacılık fleet purchase) average-out.
3. Working capital dönüşüm sürekli değilse run-rate normalleştir.

## Referanslar
- Damodaran country risk premium
- _shared_knowledge_modules/dcf.md
""",

    'sotp-valuation': """# SOTP (Sum-of-the-Parts) Valuation

## Ne Zaman Kullanılır?
Holding/konglomera yapıda (KCHOL, SAHOL, DOHOL). Segment'lerin biri diğerinden çok farklı economics'e sahip → tek çarpan anlamsız.

## Prosedür
1. **Segment dökümü** — her iştirak/iş birimi ayrı: net income/ebitda/revenue.
2. **Her segment için uygun metod**:
   - Stake'i halka açık → son kapanış × ownership × (1−likidite discount).
   - Stake'i özel → peer EV/EBITDA × segment EBITDA.
   - Finansal iştirak (banka) → P/B × book × share.
3. **Net debt** — holding seviyesi ayrı çek.
4. **NAV** = Σ segment values − holding net debt.
5. **Discount to NAV** — piyasa genelde %25-50 discount ile işlem görür (likidite+governance).

## Kurallar
- Minority stake (<20%) fair value ile, eşitlik metodu ile değil.
- Holding-level giderler (corporate overhead) ayrı satır.
- Cross-holding varsa çifte sayma önlenir.
- Currency mismatch: segment USD earnings × current FX ile convert.

## Örnek
KCHOL (basit model): Koç Fiat 120B + Tofaş 80B + Yapı Kredi %41 × market cap 350B = 143.5B + segmentler toplam ~430B. Net debt 50B. NAV ~380B. %35 discount → hedef 247B.

## Bilinen Tuzaklar
1. Intra-group transaction'lar düşmeden segment EBITDA overstated.
2. Deferred tax liability of parent — NAV'dan düş.
3. Holding employee options vs segment şirketleri.

## Referanslar
- _shared_knowledge_modules/sotp.md
- Holding sektör raporları (Akbank Yatırım, Yapı Kredi Yatırım)
""",

    'altman-z-score': """# Altman Z-Score

## Ne Zaman Kullanılır?
Bankrupty risk scoring. Manufacturing + halka açık şirketler için klasik formül. Özel/hizmet/finansal için varyant formüller.

## Prosedür
Z = 1.2·A + 1.4·B + 3.3·C + 0.6·D + 1.0·E, burada:
- A = (Current Assets − Current Liabilities) / Total Assets
- B = Retained Earnings / Total Assets
- C = EBIT / Total Assets
- D = Market Cap / Total Liabilities
- E = Revenue / Total Assets

## Kurallar
- Z > 2.99: safe zone
- 1.81 < Z < 2.99: grey zone
- Z < 1.81: distress zone
- **Emerging markets discount** — Türkiye için threshold 0.5 puan daha düşük alın.
- Bankalar için Altman anlamsız; bunun yerine Altman Z" (private/non-manufacturing).

## Örnek
EREGL 2025: A=0.12, B=0.28, C=0.08, D=1.2, E=0.45 → Z = 1.2×0.12 + 1.4×0.28 + 3.3×0.08 + 0.6×1.2 + 1.0×0.45 = 1.986 (grey zone).

## Bilinen Tuzaklar
1. Market cap D'yi etkiler — bear market'te Z düşer false-distress.
2. Retained earnings negatif olabilir (yeniden yapılanma) — Z anlamsız.
3. Türkçe raporlarda "Dağıtılmamış Kârlar" = Retained Earnings.

## Referanslar
- Altman (1968) Original paper
- _shared_knowledge_modules/altman.md
""",

    'piotroski-f-score': """# Piotroski F-Score

## Ne Zaman Kullanılır?
Fundamental quality screening. 9 binary criterion, toplam 0-9. F ≥ 7: yüksek kaliteli (value screener). F ≤ 3: zayıf.

## Prosedür
9 kriter (1 puan her biri):
1. Positive net income
2. Positive OCF
3. OCF > Net income (quality)
4. ROA improved YoY
5. Long-term debt ratio improved (azalmış)
6. Current ratio improved
7. No share issuance (dilution yok)
8. Gross margin improved YoY
9. Asset turnover improved YoY

## Kurallar
- YoY improvement = strict greater-than (eşit değil).
- New IPO'lar için kriter 7 n/a — 8 skor üzerinden değerlendir.
- Banking hariç — financial sector farklı metrics.

## Örnek
EREGL 2025: NI+ ✓, OCF+ ✓, OCF>NI ✗ (NI büyük), ROA↑ ✓, LTD↓ ✓, CR↓ ✗, dilution ✓ (no issuance), GM↑ ✗, asset turnover↑ ✓ → F=6/9.

## Bilinen Tuzaklar
1. Restated prior year — improvement false positive olabilir.
2. Asset sales (divestiture) → asset turnover yapay iyileşir.
3. Emerging market inflation YoY comparison bozar (IAS 29 restated kullan).

## Referanslar
- Piotroski (2000) "Value Investing: The Use of Historical Financial Statement Information"
""",

    'goldman-report-structure': """# Goldman 12-Section Report

## Ne Zaman Kullanılır?
report_formatter final HTML/PDF üretirken. final_summary rapor iskeletini hazırlarken. 12 sabit bölüm standart template.

## Prosedür
1. Executive Summary (1 sayfa)
2. Investment Thesis
3. Valuation (DCF + multiples + target price)
4. Financial Analysis (28 metrik, trend, YoY)
5. Sector & Competitive Position
6. Macro Context (Turkey + global)
7. Key Risks & Mitigants
8. ESG & Governance
9. Technical Analysis (chart + indicators)
10. Event Timeline & Catalysts
11. Scenario Analysis (Bear/Base/Bull)
12. Appendix (metodoloji, kaynaklar)

## Kurallar
- **Metin sandviç**: her tablo/grafik öncesi 2 cümle, sonrası 3-5 cümle yorum.
- Chart.js YASAK — SVG deterministic (svg_charts.ts).
- Her sayı `[KAYNAK: doc_id]` veya `[VERİ YOK]`.
- Brand identity CSS theme preset (institutional/anthropic/minimal).
- HTML validation: 12 section başlık, 4+ SVG, 60-120KB range.

## Örnek
THYAO rapor: §1 Executive 850 chars, §4 Financial Analysis 28 metrics table + 4 chart, §11 Scenario 3 fiyat range 247-325 TL.

## Bilinen Tuzaklar
1. Section 2 + section 11 birbirini tekrar eder → thesis-scenario bağı açık.
2. Section 8 ESG eksik rapor tesliminde common fail (data gap).
3. CEO delivery check (COO) 4 kriterde bakar: format ok, 12 section present, metin-görsel balance, marka identity applied.

## Referanslar
- backend/src/python/report_formatter/template.html (canonical)
""",

    'brand-identity-extraction': """# Brand Identity Extraction

## Ne Zaman Kullanılır?
context_extraction agent şirket kurumsal kimliğini çıkarırken. report_formatter theme preset uygularken.

## Prosedür
1. Şirket web sitesinden CSS variables çek (primary color, logo font).
2. Eğer yoksa annual report PDF'te logo renk + typography detect.
3. JSON schema:
```json
{
  "primary_color": "#C41E3A",
  "secondary_color": "#1A365D",
  "logo_url": "...",
  "font_family": "Open Sans",
  "theme_preset": "institutional"
}
```
4. Report formatter CSS `:root` variables'a inject.

## Kurallar
- 3 theme preset: `institutional`, `anthropic`, `minimal`.
- Brand default `institutional` eğer brand detection başarısız.
- Logo aspect ratio preserve (max 200×80).
- Color accessibility: primary vs arka plan contrast ≥ 4.5:1 (WCAG AA).

## Örnek
THYAO: primary `#E10600` (red), secondary `#1B1D29`, logo `thy-logo.svg`, theme `institutional`.

## Bilinen Tuzaklar
1. PDF'teki logo imajı düşük çözünürlük → vektör için web scrape.
2. Bazı markalar CMYK'dan RGB'ye convert hatası → renk sapması.
3. Global marka lokal logo farklı (Coca Cola TR vs global).

## Referanslar
- templates/report_base.html CSS variable section
""",

    'technical-indicators': """# Technical Indicators

## Ne Zaman Kullanılır?
technical_analysis agent MACD/RSI/Bollinger/VWAP/support-resistance hesaplarken. tvdatafeed ile bar data çeker.

## Prosedür
1. **Bar data** — tvdatafeed Turkish exchange (BIST): ticker `BIST:THYAO`, interval 1D, bars 250 (~1 yıl).
2. **Indicators** (ta library):
   - MACD (12,26,9) — trend momentum
   - RSI (14) — oversold <30, overbought >70
   - Bollinger Bands (20,2σ)
   - VWAP (volume-weighted)
   - Support/Resistance (swing points)
3. **Chart** — SVG deterministic, 4 panel layout (price+MA, RSI, MACD, volume).

## Kurallar
- RSI + MACD divergence = güçlü sinyal.
- VWAP gün-içi; günlük bar için anlamsız.
- Bollinger squeeze (daralma) → breakout öncesi.
- Minimum 60 bar gerekli; yeterli tarihçe yoksa "insufficient data" flag.

## Örnek
THYAO 2026-04-22: fiyat 323.5, RSI 65.0 (yüksek sınır), MACD +7.56 (pozitif momentum). Yorum: kısa vadeli overbought risk, trend pozitif.

## Bilinen Tuzaklar
1. Gap'lı günler (tatil sonrası) MACD yanıltıcı.
2. Low volume → VWAP noise, güvenilir değil.
3. Turkish market vade uzunluğu: FX shock'larda daily bar yaman hareket (RSI ≥80 / ≤20 sık).

## Referanslar
- Python `ta` library docs
- python-services/src/financex/technical/
""",

    'sector-aviation': """# Sector Playbook — Aviation

## Ne Zaman Kullanılır?
Havacılık şirketi analizi (THYAO, PEGYS, ONUIR). EBITDAR, CASK/RASK, load factor, fuel hedge, IFRS 16 impact.

## Prosedür
Anahtar metrikler:
- **EBITDAR** = EBITDA + operating lease cost (IFRS 16 rollback) — havacılık primary metric.
- **CASK** (Cost per Available Seat Km) — operasyonel etkinlik.
- **RASK** (Revenue per ASK) — pricing power.
- **Load Factor** = RPK / ASK — kapasite kullanımı.
- **ASK growth** — kapasite genişlemesi (fleet + yeni rota).
- **Fuel hedge ratio** — jet fuel volatility yönetimi.

## Kurallar
- EBITDAR margin benchmark: global %12-18, THYAO %22-24 (lease-heavy).
- CASK ex-fuel ayrı raporlanmalı (yakıt dışı efficiency).
- Load factor <75% → capacity absorbtion riski.
- Seasonality: Q3 peak (yaz), Q1 trough.

## Örnek
THYAO FY2025: EBITDAR ~%23.2 (lease adjustment sonrası), Load Factor %82, CASK ex-fuel 4.2 ¢/ASK, fuel hedge %50 next 12ay.

## Bilinen Tuzaklar
1. ASK ≠ RPK karıştırma (supply vs demand).
2. Cargo ayrı segment (THY ve Pegasus cargo büyük).
3. Currency: revenue çoğunlukla USD/EUR, cost karışık — hedge durumunu anla.
4. IFRS 16 öncesi/sonrası karşılaştırmalar yanıltıcı.

## Referanslar
- IATA air transport financial benchmarks
- ICAO industry KPI definitions
""",

    'sector-banking': """# Sector Playbook — Banking

## Ne Zaman Kullanılır?
Türk bankası analizi (AKBNK, GARAN, ISCTR, YKBNK, HALKB, VAKBN). NIM, CET1, NPL, BDDK mevzuat, Basel III.

## Prosedür
Anahtar metrikler:
- **NIM** (Net Interest Margin) = (faiz geliri − faiz gideri) / ort. faiz getiren varlıklar.
- **CET1** — Common Equity Tier 1 ratio, Basel III minimum %8 (BDDK %8.5 buffer).
- **Cost of Risk** = karşılık / ort. krediler — stage 2-3 kredi oranı.
- **NPL ratio** = non-performing / total loans.
- **Fee/income ratio** — komisyon/ücret geliri çeşitlendirme.
- **C/I (cost-to-income)** — operasyonel verimlilik.

## Kurallar
- Banka için EBITDA anlamsız — net faiz marjı + net kar odaklı.
- ROE benchmark: GYO'lu dönem %40+, düşük GYO %15-20.
- CET1 < %10 → BDDK uyarı; dividend restriction.
- BRSA stres testi (CKO ≥ %0.30) önemli.

## Örnek
AKBNK FY2025: NIM %5.8, CET1 %15.2, NPL %2.1, cost of risk 180bps, ROE %32, fee/income %28.

## Bilinen Tuzaklar
1. Fatura muhasebesi vs gerçek nakit — provisyon gelir/gider netleştirmesi.
2. FX-indexed loan → TRY depreciation'da NPL artar.
3. Hazine destekli krediler (KGF) ayrı risk profili.
4. State banks (HALKB/VAKBN) government-driven growth.

## Referanslar
- BDDK Bankacılık Sektörü Bülteni (aylık)
- Basel III capital framework
""",

    'sector-steel': """# Sector Playbook — Steel

## Ne Zaman Kullanılır?
Çelik üreticisi analizi (EREGL, KRDMD, OYAKC). HRC spread, CBAM, hammadde pass-through, kapasite kullanımı.

## Prosedür
Anahtar metrikler:
- **HRC spread** = HRC fiyatı − (demir cevheri + kok/coking coal toplamı × consumption).
- **Kapasite kullanım oranı** (CUF) — %85+ sağlıklı.
- **İhracat oranı** — EU CBAM (Carbon Border Adjustment) etkisi kritik.
- **Emisyon yoğunluğu** — tonaj CO2 / ton çelik (integrated mill ~2.0, EAF ~0.5).
- **Enerji maliyet** — doğal gaz + elektrik.

## Kurallar
- Türkiye ithalat hammadde bağımlılığı yüksek → global fiyat transmisyonu.
- EREGL blast furnace, KRDMD EAF — maliyet yapısı farklı.
- CBAM 2026'dan itibaren carbon embedded tariff — ihracat EBITDA'yı eritecek.
- Kuzey Amerika/AB talep daralması → Türk ihracat fiyatlarına down-pressure.

## Örnek
EREGL FY2025: HRC spread $220/ton, CUF %92, ihracat %45, EBITDA/ton $95, Net Debt/EBITDA 2.1x.

## Bilinen Tuzaklar
1. Inventory gain/loss — demir cevheri cost averaging dönem sonu restated.
2. FX-indexed ihracat gelir, TRY maliyet → margin TRY weakening'den fayda görür.
3. Capital intensive — CAPEX/EBITDA %25-40 (green steel transition).

## Referanslar
- World Steel Association statistics
- EU CBAM regulation 2023/956
""",

    'sector-refinery': """# Sector Playbook — Refinery

## Ne Zaman Kullanılır?
Rafineri analizi (TUPRS). Crack spread, Brent exposure, product mix, storage-hedge.

## Prosedür
Anahtar metrikler:
- **Gross refining margin** (GRM) = (product sales − crude cost) / barrel.
- **Crack spread** — 321 (Gasoline+Diesel+Jet vs Brent) veya 3-2-1 Gulf/Med benchmark.
- **Utilization rate** — nameplate capacity'nin %'i.
- **Product slate** — Gasoline/Diesel/Jet/Fuel Oil/Naphtha breakdown.
- **Inventory gain/loss** — Brent fiyat hareketinden stok değerlenmesi.

## Kurallar
- GRM $6-8/bbl = sağlıklı; <$4 sıkışık.
- Crack spread Med TUPRS için öncelik (coğrafi premium).
- Jet fuel crack aviation cycle ile beraber.
- RON octane grade product mix değeri.

## Örnek
TUPRS FY2025: GRM $10.2/bbl, Crack Med $8.5, utilization %93, ihracat %35, inventory gain 2.1B TL.

## Bilinen Tuzaklar
1. Nominal crack vs realized: feedstock discount (Iran/Russia lindirim) + freight.
2. Inventory accounting: FIFO vs weighted-average farkı.
3. Maintenance turnaround — 18-36 ay aralıkla 30-60 gün downtime.
4. NRL (net realized) negotiation — gasoline tavan fiyat regulation etkisi.

## Referanslar
- Platts/Argus crack spread serisi
- IEA World Oil Outlook
""",

    'sector-holding': """# Sector Playbook — Holding

## Ne Zaman Kullanılır?
Holding/konglomera analizi (KCHOL, SAHOL, DOHOL, ENKAI, TKFEN). NAV, SOTP discount, segment reporting.

## Prosedür
1. Segment-level P&L — otomotiv, enerji, finans, gıda ayrı dökümü.
2. NAV = Σ (stake × market/fair value) − holding net debt − deferred tax.
3. Discount-to-NAV tarihsel ortalama (KCHOL %30, SAHOL %40).
4. Holding-level corporate overhead ayrı gider.

## Kurallar
- Her segment için uygun metrik kullan: banka NIM, otomotiv SSSG, çelik CUF.
- Cross-listed iştirak → discount veya premium'a göre fair value revize.
- Minority stake <%20 fair value with observable price.
- Private asset (unlisted) peer EV/EBITDA × segment EBITDA.

## Örnek
KCHOL FY2025: NAV ~430B TL (otomotiv 180B + finans 150B + enerji 50B + tüketim 40B + diğer 10B), net holding debt 30B. Fair = 400B. Market cap 260B → %35 discount.

## Bilinen Tuzaklar
1. Double-counting: segment EBITDA'da intra-group transactions düşmediyse overstated.
2. Deferred tax reserve — NAV'dan çık.
3. Segment revenue vs consolidated revenue — elimination farkı.
4. SPV/offshore segment visibility düşük.

## Referanslar
- Yapı Kredi Yatırım holding research
- Akbank AŞ holding desk notlar
""",

    'sector-telecom': """# Sector Playbook — Telecom

## Ne Zaman Kullanılır?
Telekom analizi (TCELL, TTKOM). ARPU, churn, net add, 5G CAPEX, spectrum.

## Prosedür
Anahtar metrikler:
- **ARPU** (Average Revenue Per User) — ayda kullanıcı başına gelir.
- **Churn** — aylık/yıllık müşteri kaybı oranı (prepaid %25+, postpaid %2-5).
- **Net add** — yeni - kaybedilen müşteri.
- **Blended ARPU** — mobil + fiber + TV aggregate.
- **CAPEX/revenue** — telekom %18-25 (5G yoğun dönemde daha yüksek).
- **Penetration** — fiber, 5G, postpaid mix.

## Kurallar
- Spectrum auction CAPEX lumpy — amortize et.
- 5G rollout 2024-2028 dönemi yoğun yatırım.
- MVNO sözleşmeleri ayrı revenue kalemi.
- FX exposure: spectrum payments EUR/USD, revenue TRY.

## Örnek
TCELL FY2025: mobile ARPU 127 TL, postpaid oranı %58, churn %2.1 postpaid, 5G CAPEX peak 2026-2027.

## Bilinen Tuzaklar
1. Prepaid revenue top-up lumpy — deferred revenue accounting.
2. FX-indexed spectrum liability — TRY depreciation leverage artırır.
3. "Subscriber" definition: inactive SIM thresholds değişebilir.

## Referanslar
- BTK Türkiye Mobil İstatistik Raporu
- GSMA Mobile Economy reports
""",

    'sector-retail': """# Sector Playbook — Retail

## Ne Zaman Kullanılır?
Perakende analizi (BIMAS, MGROS, SOKM). SSSG, basket size, mağaza açılışları, private label.

## Prosedür
Anahtar metrikler:
- **SSSG** (Same Store Sales Growth) — açılışları hariç like-for-like.
- **Basket size / transaction** — ticket ortalaması.
- **Square-meter productivity** — m² başına satış.
- **Mağaza ağı** — yeni açılış, kapanış, net store count.
- **Private label penetration** — margin driver.

## Kurallar
- SSSG inflation-adjusted vs nominal ayrımı kritik.
- Store maturity curve (yeni store Y1 %70, Y2 %85, Y3+ %100).
- Seasonal: bayram dönemleri Q2 boost.
- CAPEX genellikle düşük (%3-5 revenue), inventory turnover yüksek (40-60 gün).

## Örnek
BIMAS FY2025: SSSG %61 (nominal), CPI-adjusted %8, basket 185 TL, 14,500 mağaza, private label %35.

## Bilinen Tuzaklar
1. Hipermarket vs hard-discount format farkı — BIMAS vs MGROS.
2. E-commerce channel ayrı raporlama (BIMAS/SOKM e-com düşük, MGROS orta).
3. Rent expense ayrı — lease adjustment EBITDAR önemli.
4. Delivery/last-mile CAPEX yükü.

## Referanslar
- TUIK Perakende Endeksi
- Nielsen FMCG Türkiye raporları
""",

    'sector-defense': """# Sector Playbook — Defense & Electronics

## Ne Zaman Kullanılır?
Savunma/elektronik analizi (ASELS, HAEFN, OTKAR). Backlog, R&D/revenue, SSB yatırım, ihracat.

## Prosedür
Anahtar metrikler:
- **Backlog** (sipariş stoğu) — gelecek 2-4 yıl görünürlük.
- **Book-to-Bill ratio** — new orders / revenue (>1.0 sağlıklı).
- **R&D/Revenue** — savunma %12-18 (defense IP intensive).
- **Export ratio** — SSB kısıtları + ihracat lisansı regulatory.
- **Milestone payment structure** — avans/sevkiyat/kabul.

## Kurallar
- Revenue recognition: stage-of-completion yoğunluklu → Q-to-Q volatility.
- USD-indexed SSB contracts → FX tailwind TRY weak dönemde.
- Export license US-approval bağımlı (ITAR sensitive components).
- R&D capitalization policy şirketler arası farklı — normalize et.

## Örnek
ASELS FY2025: backlog 12B USD (~3 yıl görünürlük), book-to-bill 1.4×, R&D %14, ihracat %45, EBITDA margin %22.

## Bilinen Tuzaklar
1. "Contract asset" ve "deferred revenue" doğru yorum.
2. Government receivable cycle uzun — DSO 200+ gün normal.
3. TL weakness in advance payments (locked rate) → realized FX gain/loss.
4. Dual-use item regulation — sivil/askeri split değişir.

## Referanslar
- SIPRI defense spending database
- SSB stratejik plan dokümanları
""",
}

for s in SKILLS:
    p = f"skills/{s['id']}/SKILL.md"
    content = fm(s) + CONTENT.get(s['id'], f"# {s['name']}\n\n## Ne Zaman Kullanılır?\nTBD\n\n## Prosedür\nTBD\n\n## Kurallar\nTBD\n\n## Örnek\nTBD\n\n## Bilinen Tuzaklar\nTBD\n\n## Referanslar\n")
    with open(p, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

print(f"wrote {len(SKILLS)} SKILL.md files")
print(f"covered: {sum(1 for s in SKILLS if s['id'] in CONTENT)} / {len(SKILLS)}")
