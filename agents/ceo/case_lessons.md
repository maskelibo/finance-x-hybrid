# CEO Agent — Vaka Bazlı Dersler (Katman 2b)

> Önceki analizlerden damıtılmış vaka bazlı öğrenimler.
> Aynı şirketi veya benzer sektörü analiz ederken `Read` ile aç.
> Her yeni post-report review sonrası güncellenir.

---

## Agent Performans Özeti (Nisan 2026 Snapshot)

**KRİTİK SORUNLU:** parse_standardization (parse hataları, kendini SUCCESSFUL ilan ediyor), reconciliation (hatalı veri onaylıyor), qa_review (tespit iyi, pipeline durdurma yok), valuation_agent (timeout crash), report_formatter (çoğu raporda çalışmadı), final_summary (içerik sığ, truncation), event_impact_mapper (EPDK gibi kritik olayları kaçırıyor)

**İYİLEŞİYOR:** financial_analysis (TCELL-delta'da düzeltildi; upstream hata yakalama iyi), data_collection (0.91 güven; tarihsel veri zayıf)

**İYİ:** macro_analysis (jeopolitik güçlü), technical_analysis (Fib+MA+RSI), context_extraction (SOTP/ESG), kap_watch, event_timeline_alert, sector_competition (CBAM/peer)

**ORTA:** strategic_synthesis (convergence iyi; divergence/BUY-HOLD-SELL eksik)

---

## Son Raporların Öğrenimleri

### EREGL Deep Dive (15-16 Nisan) — QA 0.80, CEO OVERRIDE → APPROVED ✅
**Durum:** Tamamlandı. report_formatter unblocked.

**Tur 1 (13 Nisan) — QA ~0.45, REJECT:**
- Kaskadif veri hatası: parse EBITDA %66 fazla + net kar 27.5x fazla → reconciliation 0.91 skorla onayladı.
- Net borç yanlış (toplam yükümlülük kullanıldı). EPDK +%18.61 event_impact_mapper'da yoktu.

**Tur 2 (15-16 Nisan) — QA 0.80, CEO Override:**
- P0/P1 8/8 çözüldü. IAS29 izolasyonu yapıldı (Monetary gain 876mn / NI 694mn = %126.2 → tetiklendi; adj_NI = −182mn).
- DISC-004 P2 açık: parse ticari borç 19,628mn vs Not 8 68,762mn — financial_analysis doğru değeri kullandı; CEO override COND-1/4 ile geçildi.
- Chairman checklist: 15/15 PASS. Fact base kilitli.

**Çelik Sektörü Öğrenimleri:**
- **IAS29 tetikleyicisi:** Monetary gain / NI (not Monetary gain / EBITDA) — NI küçükse oran sıçrar. EREGL: %126.2 → trigger, ama economic impact LOW (USD functional).
- **FCF sustainability:** FY2025 FCF 49,717mn; WC release 45,997mn (ticari borç +32.3bn). Normalize FCF 2026E: 8-15bn TRY.
- **CBAM brüt vs net:** esg gross TRY 7-10bn; event_impact_mapper net FCF TRY 0.8-2.3bn (pass-through + mitigation dahil). Net değer seçildi.
- **EBITDA tanım çatışması:** Mgmt 20,452mn vs SPK mekanik 22,978mn (fark: non-operating items). Mgmt değeri kilitlendi.
- **Net Borç kaynağı:** Not 7 ZORUNLU — finansal borç = 42,864mn TRY (UV borçlanma KV dahil: 16,077mn).
- **İyi:** financial_analysis upstream hata yakalama katmanı pipeline'ın en güvenilir agentı olarak öne çıktı.

### TUPRS (12 Nisan) — QA 0.618, PARTIAL RECOVERY
- event_timeline_alert upstream output varken "eksik" dedi → dosya varlığı kontrolü şart.
- financial_analysis bölüm 1-9 pipeline'a girmedi. valuation tek seferde crash (exit 143) → 3 parça.
- **İyi:** kap_watch 12 aylık envanter, data_collection 0.91, esg CDP A- tespiti.

### TCELL Delta (11 Nisan) — QA 0.84, CONDITIONAL PASS
- Delta-update stratejisi başarılı: gap-focused deep execution > geniş scope shallow.
- Upstream güçlendirme işe yaradı (input validation + [pending] yasağı). Truncation hâlâ sorun → çift output uygulanacak.

---

## Post-Report Reviews

### KCHOL Delta — 14 Nisan 2026 — QA 0.676, BLOCKED
- **Revenue Q4/FY karışıklığı:** 802.669B TRY = Q4, FY = 2.76T TRY; financial_analysis yanlış baz aldı.
- **KAP PDF script çalıştırılmadı:** 2 tur boyunca "CANNOT EXECUTE" — 3. kez.
- **IFRS 8 segment extraction %0:** Holding valuation için kritik; 2 tur boyunca alternatif denenmedi.
- **Truncation salgını:** macro, sector, final, strategic, event_impact — hepsi kesildi.
- **HTML report formatter body yok:** CSS var, body yok — BIMAS'ta da aynı pattern.
- **Holding öğrenimleri:** Banka konsolidasyonu bilanço şişirmesi (YKBNK 924B), Revenue üç katman tanımı, SOTP için GCM anchor (406 TL), TUPRS efektif pay ~%40.5.

### THYAO — 14 Nisan 2026 — QA 0.757, BLOCKED
- **CF tablosu tamamen eksik** (conf: 0.00) → 3 QA turunda çözümsüz.
- **D1 equity gap 141B TRY** (SE tablosu yok), Working Capital BLOCKED.
- **Havacılık öğrenimleri:** EBITDAR birincil metrik (IFRS 16), 8 KPI zorunlu (RPK/ASK/CASK/RASK/Yield/LF/Kargo/Filo), IAS 29 sınırlı ama mevcut, Rusya üstgeçiş hakkı $50-80M/yıl avantaj, EV/EBITDAR 2.52x vs peer 4.4x = −43% iskonto.

### BIMAS — 14 Nisan 2026 — QA 0.80, BLOCKED
- **CF/SE tabloları 2 tur upstream'den gelmedi** → WC, OCF, FCF BLOCKED.
- **HTML formatter P0:** Body yok, sadece CSS.
- **IAS29 optik-gerçeklik uçurumu:** ROE %21.3 raporlanan vs %3.6 operasyonel — kritik divergence.
- **Perakende öğrenimleri:** IAS29 perakendede kritik optik risk, CF bloker için BS bazlı OCF tahmini, SSSG zorunlu metrik, özel marka oranı trend zorunlu.

### SAHOL — 14 Nisan 2026 — QA 0.738, BLOCKED
- **CONDITIONAL_PASS sızıntısı:** Reconciliation CONDITIONAL_PASS → QA bunu FAIL'e çevirmedi.
- **Parse revenue 195B (segment kısmı) vs FY ~konsolide** → cascade hata.
- **Chairman metrikleri eksik:** DSO, DIO, DPO, CCC, NWC, ROCE, ROIC, Cash FAVÖK.
- **Truncation:** 6+ agent çıktısı kesildi.

---

## Pipeline Geneli Kök Nedenler (Çözülmeden Kapanmamalı)

| # | Kök Neden | Etkilenen Rapor Sayısı |
|---|-----------|----------------------|
| 1 | CF tablosu eksik | 4+ (AKBNK, KCHOL, TUPRS, THYAO, BIMAS) |
| 2 | KAP PDF script çalıştırılmadı | 3+ kez |
| 3 | conditional_pass = BLOCK ihlali | 3 kez |
| 4 | Truncation salgını | Her rapor |
| 5 | Report formatter HTML body eksik | BIMAS + KCHOL |
| 6 | Revenue Q4/FY karışıklığı | KCHOL |

---

## Rapor Geçmişi (13 rapor)

PASS: ASELS(0.78), TCELL-delta(0.84), EREGL-deep(0.80+CEO-override) | BLOCK: AKBNK(0.58), SISE(0.62), KCHOLx3(0.45-0.68), TCELL#1(0.62), EREGL-Tur1(~0.45), THYAO(0.757), BIMAS(0.80) | PARTIAL: TUPRS(0.618)
**Hedef:** QA > 0.85, %100 PASS. Override sayısı: 1 (EREGL deep dive — P2 parse kayıt, minimal etki).

---

## QA İstatistikleri — Son Pipeline

| Tur | QA Skoru | Ana İlerleme |
|-----|----------|-------------|
| Round 1 | 0.590 | İlk tarama |
| Round 2 | 0.676 | Revenue Q4/FY tanımlandı ama yanlış çözüldü |

---

*Dosya sahibi: CEO Meta-Agent | Güncelleyen: Feedback Loop*

### 2026-04-22 — THYAO
THYAO: CEO mandate kesik — downstream ajanlar mandate'i referans aldığında invalid JSON okur. IAS 29 notu THYAO analizi için önemli: 2022-2024 dönemi IAS 29 kapsamında mıydı flag'lenmeli.

### 2026-04-22 — THYAO
THYAO 22-Nis önceki session'da da aynı truncation yaşandı (CEO hafızasında kayıtlı). Bu session'da kritik alanlar başa alındı — gelişme var — ama liste hâlâ kesildi. Kompaktlaştırma uygulanmadı.
