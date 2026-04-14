# QA Review Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Quality Score Eşikleri

| Score | Karar | Aksiyon |
|-------|-------|---------|
| > 0.85 | AUTO PASS | Devam et |
| 0.70–0.85 (minor gaps) | CONDITIONAL PASS | Condition'lar net belirtilmeli + deadline |
| 0.70–0.85 (>%40 mandatory metrics eksik) | REVISION REQUIRED | Pipeline durdur |
| 0.50–0.70 | REVISION REQUIRED | Pipeline durdur, major fixes |
| < 0.50 | BLOCK | Temel veri kalitesi sorunu, CEO'ya bildir |

### Kritik Kural
- `conditional_pass` artık BLOCK (masked failure olduğu kanıtlandı — 4 raporda)
- Numeric score < 0.75 → BLOCK
- Score 0.68 + %60 mandatory metrics missing → REVISION REQUIRED, CONDITIONAL_PASS DEĞİL

---

## 2. Completeness Checklist — 28 Zorunlu Metrik

### A. Gelir Tablosu (11 metrik)
Net Satışlar, Brüt Kar, Brüt Karlılık Oranı, Brüt Kar IAS29, Brüt Kar Oranı IAS29, Parasal Kayıp/Kazanç, FAVÖK, FAVÖK Oranı, VÖK, Net Dönem Karı, OPEX/Ciro

### B. İşletme Sermayesi (5 metrik)
DSO, DIO, DPO, CCC, NWC/Hasılat

### C. Borç ve Likidite (4 metrik)
Net Kredi, Net Borç/FAVÖK, Cari Oran, Asit-Test

### D. Nakit Akışı (4 metrik)
FCF, OCF/FAVÖK, FAVÖK/Faiz Gideri, FCF/Faiz Ödemesi

### E. Karlılık (2 metrik)
ROE, ROCE

### F. Yatırım (2 metrik)
CAPEX/FAVÖK, Faiz Gideri/FAVÖK

**BİR EKSİK = REJECT**

---

## 3. Issue Prioritization Framework (P0-P3)

| Seviye | Tanım | Aksiyon |
|--------|-------|---------|
| **P0 (Blocker)** | Raporun tamamlanmasını engelliyor | Pipeline DURDUR |
| **P1 (Critical)** | Rapor kalitesini ciddi düşürüyor | Immediate fix gerekli |
| **P2 (High)** | İyileştirme gerekli | Deadline'lı fix |
| **P3 (Medium)** | Nice-to-have | Sonraki raporda düzelt |

---

## 4. Remediation Action Plan Template

Her CRITICAL/BLOCKING issue için zorunlu:

```
Issue: [Description]
- Sorumlu Agent: [agent_id]
- Fix Steps: [1], [2], [3]
- Deadline: [X hours]
- Success Criteria: [Measurable outcome]
- Verification Method: [How to confirm fix]
```

---

## 5. Downstream Impact Analysis (Cascade Effect)

Her critical issue için hangi downstream agent'lar etkilenir:

```
Financial_analysis failure →
  - Strategic_synthesis: Investment thesis dayanaksız
  - Valuation_agent: DCF impossible (FCF/CAPEX eksik)
  - Final_summary: Skor kartı eksik
  - QA_review: Overall report confidence LOW
```

---

## 6. Bilinen Hata Pattern'ları (10 Rapor Post-Mortem)

### Tekrar Sayısı 4+
| Hata | Kök Neden |
|------|-----------|
| Working capital metrikleri eksik (DSO/DIO/DPO/CCC) | Chairman zorunlu liste uygulanmıyor |
| Output truncation (yarım bölümler) | Context limit + öncelik sıralaması yanlış |
| Agent meta-text temizlenmemiş | Post-processing filter yok |
| QA FAIL sonrası pipeline devam etti | Gate keyword çok geniş |
| Cash flow statement toplanmamış | KAP CF URL direktifi verilmiyor |
| Hedef fiyat yok/eksik | Valuation fail → downstream habersiz |

### Tekrar Sayısı 2-3
| Hata | Kök Neden |
|------|-----------|
| Net borç yanlış (toplam yükümlülük kullanılmış) | Formül hatası |
| IAS 29 parasal kazanç ayrıştırılmamış | Hatırlatma yapılmıyor |
| Platform çıktıları veri kaynağı olarak kullanılmış | Chairman kaynak kuralı ihlali |
| EBITDA kaynak yanlış (FY karışıklığı) | Çapraz kontrol yok |

---

## 7. Evidence Sufficiency Kontrolü

- Upstream agent "birincil kaynak kullandım" diyorsa ama açık belge ID'si, sayfa referansı yoksa → `evidence_sufficiency` otomatik düşür
- "Web access yok" / "permission denied" notu varsa → ileriye dönük sayısal iddialar → `low/speculative`
- QA sadece yanlış rakamı değil, **hangi rakamın authoritative** olduğunu da belirtmeli

### Authoritative Kaynak Sırası
1. Audited financials / KAP annual filing
2. Reconciliation output with explicit formulas
3. Management report summaries
4. Standardization layer

---

## 8. Matematiksel Tutarlılık Kontrolleri

- Bilanço dengesi: Aktif = Pasif
- Gelir tablosu zinciri: Revenue − COGS = Gross Profit, PBT − Tax = Net Income
- Nakit akış mutabakatı
- Working capital tamlık kontrolü
- Anomali tespiti: EBITDA marjı > sektör normu + 15pp → kaynak doğrulama zorunlu

---

## 9. Yorum Kalitesi Kontrolü

Her tablo sonrasında 3-5 cümle yorum paragrafı ZORUNLU
4 cümle yapısı:
1. Metrik + Değişim
2. Neden (Root Cause)
3. Karşılaştırma (Benchmark)
4. Ne Anlama Geliyor (So What?)

Yorum yoksa → tablo geçersiz → output REJECT

---

## 10. Cash Flow Bölümü Tamlık Kontrolü (7 Alt Bölüm)

A. Nakit Akışı Tablosu Özeti (5 yıl)
B. OCF Detaylı Analizi (bileşenler + OCF/FAVÖK + OCF/NI)
C. FCF Detaylı Analizi (OCF − CAPEX = FCF + trend)
D. Cash FAVÖK vs Reported FAVÖK
E. Working Capital Changes Breakdown (tablo)
F. Nakit Bazlı Borç Servis Kapasitesi
G. Cash Flow Red Flags Kontrolü (7 madde tablo)

---
