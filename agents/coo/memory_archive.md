# COO Agent — Operasyonel Hafıza

---

## Kimlik Kartı

| Alan | Bilgi |
|------|-------|
| Rol | Chief Operating Officer |
| Sorumluluk | Pipeline kalite kontrolü, delivery check, revision koordinasyonu |
| Raporlama | CEO Meta-Agent'a bağlı |
| Oluşturma | 2026-04-13 |
| Revizyon | 2026-04-13 (10 rapor post-mortem ile kapsamlı güncelleme) |

---

## Sistemik Hata Kaydı — 10 Rapor Analizi (Nisan 2026)

Platformun ilk 10 raporundan (ASELS, AKBNK, SISE, KCHOL×3, TCELL×2, TUPRS, EREGL) çıkan kalıcı sorunlar:

### KRİTİK — Tekrar Sayısı 4+

| Hata | Kaç Rapor | Etkilenen Agent | Kök Neden |
|------|-----------|-----------------|-----------|
| Working capital metrikleri eksik (DSO/DIO/DPO/CCC) | 5 | financial_analysis | Chairman zorunlu liste uygulanmıyor |
| Output truncation (yarım bölümler/tablolar) | 5 | Çoğu agent | Context limit + "nice to have" önce yazılıyor |
| Agent meta-text temizlenmemiş | 5 | final_summary, report_formatter | Post-processing filter yok |
| QA FAIL sonrası pipeline devam etti | 4 | Orchestrator | Gate keyword "critical" çok geniş, conditional_pass bloklama yapılmadı |
| Valuation agent truncated/degraded | 4 | valuation_agent | DCF+peer+sensitivity tek seferde crash |
| Cash flow statement toplamamış | 4 | data_collection | KAP CF URL direktifi verilmemiyor |
| Hedef fiyat yok/eksik | 4 | valuation_agent + final_summary | Valuation fail → downstream hedef fiyatsız devam ediyor |

### YÜKSEK — Tekrar Sayısı 2-3

| Hata | Kaç Rapor | Etkilenen Agent | Kök Neden |
|------|-----------|-----------------|-----------|
| Net borç yanlış hesabı (toplam yükümlülük) | 3 | reconciliation | Net borç tanımı yanlış formül |
| IAS 29 parasal kazanç ayrıştırılmamış | 3 | parse_standardization | IAS 29 aktif olduğu hatırlatılmıyor |
| Kaynak hatalı (platform çıktıları veri kaynağı olarak) | 3 | Veri katmanı | Chairman kaynak kuralı uygulanmıyor |
| EBITDA kaynak yanlış (FY yılı karışıklığı veya platform çıktısı) | 2 | parse_standardization | Faaliyet raporu çapraz kontrolü yapılmıyor |
| EPDK/BOTAŞ kararı event_impact_mapper'da yok | 2 | event_impact_mapper | Düzenleyici enerji kararları event sınıflandırmasında atlanıyor |
| Segment analizi yok (holding şirketleri) | 3 | financial_analysis | Holding direktifi verilmiyor |
| Jeopolitik analiz yok (savunma şirketleri) | 2 | macro_analysis | Sektöre özgü direktif eksik |
| QA conditional_pass ile pipeline geçiyor | 2 | QA Gate | Conditional_pass bloklayıcı değildi (DÜZELTME: 2026-04-13) |

---

## 2026-04-13 — Sistemik Düzeltmeler (COO Devreye Alma)

### Yapılan Değişiklikler

1. **QA Gate Düzeltmesi (orchestrator.ts):**
   - `critical` keyword blocklist'ten kaldırıldı (çok geniş, her çıktıda geçiyor)
   - `conditional_pass` blocklist'e eklendi (masked failure)
   - Score-based blocking eklendi: QA overall score < 0.75 → BLOCK
   
2. **Pre-QA Completeness Gate (orchestrator.ts):**
   - Events fazı bittikten sonra, QA başlamadan önce otomatik kontrol
   - financial_analysis: min 3000 char + FAVÖK/EBITDA/marj keywords
   - macro_analysis: min 1000 char
   - valuation_agent: min 500 char + hedef fiyat keywords
   - Başarısız olanlar otomatik re-run

3. **HTML Chart Validation (orchestrator.ts):**
   - Sadece `<canvas>` değil `<svg>` da kontrol ediliyor
   - SVG 0 + Canvas 0 → uyarı

4. **COO System Prompt Güncellendi:**
   - 10 rapor post-mortem entegre edildi
   - Sektöre özgü direktifler eklendi
   - Net borç tanımı, IAS 29, kaynak kuralları eklendi

---

## Agent Performans Özeti — Nisan 2026

| Agent | Ortalama Başarı | Tekrarlayan Sorun |
|-------|-----------------|-------------------|
| data_collection | 75% | CF statement eksik, 5 yıllık tarihsel veri eksik |
| parse_standardization | 55% | FY yılı karışıklığı, IAS 29 ayrıştırma |
| reconciliation | 60% | Net borç tanımı, internal consistency ≠ source accuracy |
| context_extraction | 75% | Sektöre özgü detaylar yüzeysel |
| financial_analysis | 45% | Working capital metrics sistematik eksikliği |
| sector_competition | 65% | Truncation, peer data yüzeysel |
| macro_analysis | 80% | Sektöre özgü bölümler bazen eksik |
| technical_analysis | 70% | Volume analizi, Fibonacci eksik |
| kap_watch | 80% | İyi çalışıyor |
| event_classification | 75% | Düzenleyici kararlar atlanıyor |
| event_impact_mapper | 65% | Enerji tarifeleri atlanıyor |
| event_timeline_alert | 75% | Upstream bağımlılık sorunları |
| qa_review | 65% | Remediation plan eksik, gate bypass ediliyor (DÜZELTİLDİ) |
| strategic_synthesis | 70% | Divergence map eksik |
| valuation_agent | 55% | Truncation, crash, hedef fiyat eksik |
| final_summary | 60% | Meta-text temizlenmemiş, hedef fiyat atlanıyor |
| report_formatter | 50% | HTML yarım, boş sayfa, meta-text |

---

## Sonraki Analiz İçin Öncelikli Direktifler

Her yeni analiz başlamadan önce şu direktifleri MUTLAKA ver:

1. **data_collection'a:** "Son 5 yıllık KAP finansal tabloları + cash flow statement + faaliyet raporu PDF ZORUNLU. Sadece özet değil tam tablolar."

2. **parse_standardization'a:** "IAS 29 aktif. Net kâr içindeki parasal kazanç ayrıştır. EBITDA'yı faaliyet raporundan al, SPK EBIT'inden hesaplama. FY yılını teyit et (başlık + tarih)."

3. **reconciliation'a:** "Net Borç = Finansal Borç − (Nakit + KV Finansal Yatırımlar). TOPLAM YÜKÜMLÜLÜK KULLANMA. EBITDA marjı > sektör normu + 15pp → kaynak doğrulama zorunlu."

4. **financial_analysis'e:** "Chairman zorunlu metrik listesindeki TÜM 45 metriği hesapla. DSO, DIO, DPO, CCC, NWC/Revenue, OCF/EBITDA, CAPEX/EBITDA dahil. Bir metrik bile eksikse output gönderme."

5. **valuation_agent'e:** "DCF, peer multiples ve senaryoyu 3 ayrı bölümde yaz. Bear/Baz/Bull hedef fiyat aralığı ZORUNLU. Truncation olursa: önce hedef fiyatı yaz, sonra metodoloji."

6. **report_formatter'a:** "SVG grafikleri kullan (Chart.js değil). 15+ sayfa, sıfır boş sayfa, metin sandviç kuralı. Agent meta-text YASAK."
