# CEO Meta-Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Governance Framework — Agent Değerlendirme Kriterleri

### Agent Başarı Ölçütleri

| Agent | Kritik Kriter | Kabul Edilemez Durum |
|-------|--------------|---------------------|
| data_collection | 5 yıllık KAP + CF statement + faaliyet raporu PDF | PDF extraction yok |
| parse_standardization | IAS 29 ayrıştırma, FY yılı doğru, TBD yasağı | "[pending]" bırakma |
| reconciliation | Net Borç doğru formül, EBITDA anomali kontrolü | Toplam yükümlülük = net borç |
| financial_analysis | 28 zorunlu metrik + yorum | Bir metrik bile eksik |
| valuation_agent | DCF + peer + Bear/Baz/Bull hedef fiyat | Hedef fiyat yok |
| qa_review | P0-P3 prioritization + remediation plan | Rapor sadece yazılmış, aksiyon yok |
| final_summary | 12 bölüm tam + skor kartı + hedef fiyat | Yarım bölüm, truncation |
| report_formatter | SVG grafik + 15+ sayfa + sıfır boş sayfa | HTML yarım, meta-text |

### Agent Performans Ortalamaları (Nisan 2026 Baseline)

| Agent | Ort. Başarı | En Sık Sorun |
|-------|------------|--------------|
| macro_analysis | %80 | Sektöre özgü bölümler bazen eksik |
| technical_analysis | %70 | Volume analizi, Fibonacci eksik |
| kap_watch | %80 | İyi çalışıyor |
| financial_analysis | %45 | Working capital sistematik eksiklik |
| valuation_agent | %55 | Truncation, crash |
| report_formatter | %50 | HTML yarım, boş sayfa |

---

## 2. Quality Gate Eşikleri

### QA Gate (Güncellenmiş — 13 Nisan 2026)
- `conditional_pass` → BLOCK (masked failure)
- Numeric score < 0.75 → BLOCK
- `critical` keyword artık blocklist'te DEĞİL (her çıktıda geçiyor)

### Pre-QA Completeness Gate
Events fazı sonrası, QA öncesi otomatik kontrol:
- financial_analysis: min 3000 char + FAVÖK/EBITDA/marj keywords
- macro_analysis: min 1000 char
- valuation_agent: min 500 char + hedef fiyat keywords
- Başarısız olanlar otomatik re-run

### CEO Approval Gate
Hiçbir rapor CEO onayı olmadan teslim edilemez:
- qa_review, strategic_synthesis, final_summary → DB status `completed`
- Minimum karakter eşiği: qa 500, synthesis 2000, final 5000
- `[DEGRADED]` veya hatalı çıktı içermemeli

---

## 3. Zorunlu Finansal Metrik Listesi

### A. Karlılık
| Metrik | Formül | Benchmark |
|--------|--------|-----------|
| Brüt Marj | Brüt Kar / Net Satışlar | Sektöre göre |
| FAVÖK Marjı | FAVÖK / Net Satışlar | İmalat: %12-18 |
| Net Marj | Net Kar / Net Satışlar | %8-15 |
| ROE | Net Kar / Ort. Özsermaye | %12-20 |
| ROCE | FVÖK / (Toplam Varlıklar − KVYK) | >%15 |
| ROIC | NOPAT / Invested Capital | >WACC |

### B. Kaldıraç
| Metrik | Formül | Benchmark |
|--------|--------|-----------|
| Net Borç/FAVÖK | (Finansal Borç − Nakit) / FAVÖK | <3x |
| Faiz Karşılama | FVÖK / Faiz Giderleri | >3x |
| Borç/Özsermaye | Toplam Borç / Özsermaye | <1.5x |

---

## 4. Kaynak Hiyerarşisi (Mutlak Kural)

1. **Faaliyet raporu PDF** (KAP / IR sayfası) — en zengin kaynak
2. **KAP SPK finansal tabloları** (yıllık/ara dönem, denetimli)
3. **XBRL verisi** (varsa)
4. **WebFetch** (canlı, cache değil)

### YASAK
- Platform'un kendi ürettiği HTML/PDF/MD dosyalarından veri çekmek → OTOMATİK REJECT
- "Önceki raporumuzda X yazmıştı" → KABUL EDİLMEZ
- Claude eğitim bilgisinden finansal veri → YASAK

### Authoritative Fact Pack
- Reconciliation ile parse_standardization çatıştığında: CEO authoritative fact pack yayımlar
- Tüm downstream agent'lar buna kilitlenir
- parse_standardization kendini "SUCCESSFUL" ilan edemez — kalite kararı CEO veya QA verir

---

## 5. Sektöre Özel Direktifler

### Bankacılık
- NIM, Cost/Income, NPL ratio, CET1 zorunlu
- BDDK regulatory changes (CAR, reserve requirements) zorunlu
- Balance sheet currency mismatch analizi

### Savunma / Havacılık
- Jeopolitik Analiz bölümü ZORUNLU
- Tetikleyiciler: TSK/SSB müşterisi, NATO ülkeleri, radar/füze/drone ürün portföyü

### Holding Şirketleri
- İki katmanlı analiz: Konsolide + Segment bazlı
- NAV calculation + holding discount ZORUNLU
- Segment listesi: Her major segment için ayrı karlılık/kaldıraç analizi

### Enerji / Rafineri
- Jeopolitik analiz önerilir (tedarik zinciri disruption)
- Rafineri marjı ($/bbl) birincil metrik

---

## 6. Rapor Format Standardı (Chairman Direktifi)

- 12 bölümlü yapı: Kapak → İçindekiler → Yönetici Özeti → ... → Zorunlu Bildirimler
- Skor kartı: 1-10, 6 boyut + genel skor
- Grafik verisi: [CHART:PIE/BAR/LINE] tag'leriyle
- Emoji YASAK, agent meta-text YASAK
- PDF çıktı zorunlu
- Hedef fiyat aralığı (Bear/Baz/Bull) ZORUNLU
- Her tablo sonrasında 3-5 cümle yorum paragrafı ZORUNLU

---

## 7. Tekrarlayan Hata Yönetimi

- Bir feedback BİR KEZ verilir, uygulanır
- Agent'ın önceki feedback'leri memory'den kontrol et → uygulanmamışsa REJECT
- Aynı hata 3+ kez tekrarlandıysa → sistem değişikliği gerekli (system prompt, output schema, upstream pipeline)

---
