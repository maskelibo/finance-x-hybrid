---
id: ias29-inflation-accounting
name: "IAS 29 Hyperinflation Accounting"
description: "Turkiye TUFE >%100 donemlerinde IAS 29. Net monetary position, parasal kazanc/kayip, adjusted EBITDA/NI."
triggers: ['ias 29', 'ias29', 'enflasyon muhasebesi', 'parasal kazanc', 'hyperinflation', 'tufe', 'monetary position']
applies_to_agents: ['parse_standardization', 'reconciliation', 'financial_analysis', 'valuation_agent']
category: accounting
priority: critical
---

# IAS 29 Hyperinflation Accounting

## Ne Zaman Kullanılır?
Türkiye TÜFE kümülatif 3 yıl >%100 → IAS 29 aktif (2022'den beri). IFRS/SPK konsolide raporlarda uygulanmış; VUK (solo) raporlarda uygulanmamıştır.

## Prosedür

### 1. Net Parasal Pozisyon (NMP)
NMP = parasal_varlıklar (nakit+alacak+mevduat) − parasal_yükümlülükler (kredi+ticari_borç).
- NMP>0 enflasyonda **KAYIP** (alacak erir, borç ise sabit → net pozisyon aşınır).
- NMP<0 enflasyonda **KAZANÇ** (net borçluysan borcun eriyor).

### 2. Parasal Kazanç/Kayıp (NMP × enflasyon)
= NMP × (TÜFE_t1 / TÜFE_t0 − 1). Bu rakam IAS 29 altında **ayrı bir P&L satırı** olarak gösterilir (Türk IFRS'inde tipik Not 35, finansal giderlerin altında).

### 3. IAS 29 Operating-Only EBITDA (doğru formül — U6'da doğrulandı)

```
EBITDA_ias29 = operating_profit_restated + D&A_restated
```

**Net Parasal Pozisyon Kazanç/Kaybı EBITDA'ya DAHİL EDİLMEZ.** IAS 29/TMS 29 altında NMP operating profit'in **altında**, finansal giderlerden sonra, vergi öncesi kârdan önce ayrı kalem olarak yer alır — non-operating.

**Kaynak doğrulama:** EREGL FY2024 (KAP 1392292, Not 35: NMP = -529.928 bin TL, ayrı satır) ve ARCLK FY2024 H1 (KAP 1317392, Not 2.1 + NMP Not satırı).

### 4. Reconciliation — management "EBITDA" farklıysa

Yönetim raporunda açıklanan "EBITDA" farklı bir rakamsa:
- `divergence = reported_ebitda − computed_ebitda_ias29`
- `|divergence − NMP|` küçükse (< %5 reported) → yönetim NMP'yi yanlışlıkla EBITDA'ya dahil etmiş → `computed_ebitda_ias29` kullan, tutarsızlığı raporla.
- Aksi halde restatement metodolojisini Not 2.x'te incele.

### 5. Adjusted NI
= Reported NI − Monetary Gain + Monetary Loss (NI'da NMP inherent; operasyonel-dışı normalize için çıkar).

## Kurallar
- Nominal vs restated karıştırma — daima "IAS29 başlığı + periyot" etiketi.
- Restated statements'te D&A zaten restated PP&E base üzerinden hesaplanmıştır; **tekrar CPI multiplier ile çarpma** (çift sayım hatası).
- Revenue restate → CPI-current-year bazında (restated statements'te zaten yapılmış).
- **NMP EBITDA'ya EKLENMEZ.** Ayrı izlenir, reconciliation için kullanılır.

## Örnek

**EREGL FY2024 (IAS 29 restated, teorik restatement sonrası):**
- operating_profit_restated = 12.0 milyar TL
- D&A_restated = 8.0 milyar TL
- NMP (Net Parasal Pozisyon Kazanç/Kayıp) = -0.53 milyar TL (KAYIP)
- **EBITDA_ias29 = 12.0 + 8.0 = 20.0 milyar TL** (NMP dahil EDİLMEZ)
- Ayrıca raporlanan: "Net Parasal Pozisyon Kaybı: -0.53 milyar TL" (Not 35)

## Bilinen Tuzaklar
1. Solo (VUK) rapor IAS29 uygulamıyor — karıştırma.
2. Bankalar hariç tutuluyor (TFRS 10 özel hüküm).
3. Segment breakdown'da IAS29 restatement uygulanmış mı kontrol et (bazen segment-level restated değil).
4. **Management "adjusted EBITDA" ≠ IAS 29 EBITDA.** Management NMP'yi dahil etmiş olabilir → reconciliation uygula.
5. **EBITDA ≠ Opex + D&A.** EBITDA = Revenue − Opex (excl D&A) = Operating Profit + D&A. Sadece opex+D&A toplamı "total operating cost"tur, EBITDA değil.

## Bilinen Tuzaklar
1. Solo (VUK) rapor IAS29 uygulamıyor — karıştırma.
2. Bankalar hariç tutuluyor (TFRS 10 özel hüküm).
3. Segment breakdown'da IAS29 restatement uygulanmış mı kontrol et (bazen segment-level restated değil).

## Referanslar
- TMS 29 Yüksek Enflasyonlu Ekonomilerde Finansal Raporlama
- TÜİK TÜFE endeks serisi
