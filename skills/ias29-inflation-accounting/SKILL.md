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
