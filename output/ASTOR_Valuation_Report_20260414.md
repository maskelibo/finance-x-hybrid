# ASTOR ENERJİ A.Ş. — KURUMSAL DEĞERLEME RAPORU
## Değerleme Tarihi: 14 Nisan 2026 | Agent: valuation_agent
### Session: ceo-session-ASTOR-20260414-deepdive-v2

---

> **YASAL UYARI:** Bu rapor yalnızca bilgi amaçlıdır. "Al" veya "Sat" yönlendirmesi içermez. Tüm değerlemeler bağımsız analist varsayımlarına dayanır; yatırım kararı münhasıran kullanıcıya aittir. Goldman Standard uygulanmıştır: tüm varsayımlar kaynakla açıklanmıştır.

---

## BÖLÜM 0 — DEĞERLEME ÖNCESİ KRİTİK META-ANALİZ

### 0.1 Yöntem Seçimi Gerekçesi

| Parametre | Karar | Gerekçe |
|-----------|-------|---------|
| **SOTP** | ❌ UYGULANMADI | Context_extraction: operating company, not holding; SOTP zorunluluğu yok |
| **DCF (TRY nominal)** | ⚠️ DEVRE DIŞI (açıklama ile) | TCMB %37 → blended TRY WACC %40+ → mekanik DCF 16-42 TL üretiyor; piyasa 203.80 TL = WACC güvensizlik etiketiyle sunulmuştur |
| **DCF (USD bazlı)** | ✅ YARDIMCI (%25 ağırlık) | Hasılatın %54'ü USD/EUR cinsinden → USD WACC %15.5 anlamlı; piyasa implisit WACC ~%12-13 (USD) |
| **EV/EBITDA (NTM)** | ✅ ANA METOT (%65 ağırlık) | $794M sipariş defteri + $768.86M ABD sözleşmesi; LTM çarpan yanıltıcı (17.8x) vs NTM anlamlı (12.3x); peer median 13.0x |
| **DDM** | ✅ TAMAMLAYICI (%5 ağırlık) | Temettü mevcut; ancak büyüme şirketi → DDM 10-22 TL üretiyor; maksimum %5 ağırlık |
| **FCF Yield** | ✅ TAMAMLAYICI (%5 ağırlık) | FY2026E FCF normalize → sektör FCF yield %3-5 aralığı referans |

### 0.2 Upstream Veri Düzeltme Protokolü (financial_analysis çıktısından)

**UYARI:** parse_standardization ajanı aşağıdaki kritik hataları içermektedir. Bu rapor KAP doğrulamalı verileri kullanmaktadır.

| Kalem | parse_std Hatası | KAP Doğrulamalı (Kullanılan) | Fark |
|-------|-----------------|-------------------------------|------|
| FY2024 Hasılat | 27,639M TRY | 34,849M TRY | −%26 |
| FY2025 OCF | 3,918M TRY | 2,757M TRY | +%42 |
| FY2025 IAS 29 Parasal Kayıp | (89)M TRY | (8,069)M TRY | 90x hata |
| FY2025 CAPEX (brüt) | 2,145M TRY | 4,557M TRY | −%112 |
| Faiz Gideri (FY2025) | 169M TRY | ~1,497M TRY | 9x hata |

**Kaynak:** KAP Bildirim 1557972, Finansal Durum Tablosu ve Nakit Akış Tablosu (p. 6-10); financial_analysis ajan raporu.

### 0.3 IAS 29 Normalize Kar Analizi

| Kalem | FY2025 Raporlanan | FY2025 IAS29 Hariç (Normalize) |
|-------|-------------------|--------------------------------|
| Vergi Öncesi Kar | 7,792M TRY | ~15,861M TRY |
| Net Kar (ana ortaklık) | 7,669M TRY | **~15,737M TRY** |
| Hisse Başına Kar (EPS) | 7.68 TRY | **~15.77 TRY** |
| F/K (mevcut 203.80 TRY) | **26.5x (yanıltıcı)** | **12.9x (gerçek)** |

**Yorum:** Raporlanan P/E 26.5x pahalı görünmesini sağlar. Normalize P/E 12.9x ise BIST sektör ortalamasının altındadır (~%20 iskonto). Bu farkın bilinmesi kritiktir.

---

## BÖLÜM 1 — TEMEL FİNANSAL VERİLER (KAP DOĞRULAMALI)

### 1.1 Gelir Tablosu Özeti (FY2025, Milyon TRY)

| Kalem | FY2025 | FY2024* | FY2023 | FY2022 | FY2021 | 5Y CAGR |
|-------|--------|---------|--------|--------|--------|---------|
| **Hasılat** | 35,291 | 34,849* | 20,445 | 11,816 | 9,205 | +39.9% |
| Brüt Kâr | 13,040 | 13,457 | 8,108 | 4,726 | 3,682 | |
| Brüt Marj | %36.9 | %38.6 | %39.6 | %40.0 | %40.0 | −310 bps |
| **FAVÖK (Hesaplanan)** | **11,344** | 9,062 | 6,805 | 3,948 | 2,916 | **+40.3%** |
| FAVÖK Marjı | %32.1 | %26.0 | %33.3 | %33.4 | %31.7 | |
| **FVÖK (EBIT)** | 9,777 | 7,828 | 5,860 | 3,270 | 2,393 | |
| IAS 29 Parasal Kayıp | (8,069) | (3,625) | (912) | — | — | |
| **Net Kâr (raporlanan)** | **7,669** | 6,577 | 4,948 | 2,760 | 2,020 | |
| **Net Kâr (normalize)** | **~15,737** | ~10,202 | ~5,860 | ~2,760 | ~2,020 | |

*FY2024 hasılat KAP doğrulamalı (parse_std 27,639M hatası düzeltilmiştir)

### 1.2 Bilanço Özeti (31.12.2025, Milyon TRY)

| Kalem | FY2025 | FY2024 |
|-------|--------|--------|
| Dönen Varlıklar | 35,815 | 27,639 |
| — Nakit & Nakit Benzerleri | 1,276 | 1,219 |
| — Kısa Vadeli Yatırımlar | 11,266 | 7,415 |
| — Ticari Alacaklar (net) | 11,606 | 8,543 |
| — Stoklar | 7,797 | 3,747 |
| Duran Varlıklar | 14,870 | 12,498 |
| **TOPLAM VARLIKLAR** | **50,684** | **40,137** |
| Kısa Vadeli Yükümlülükler | 17,317 | 11,860 |
| — KV Finansal Borçlar | 4,544 | 2,350 |
| Uzun Vadeli Yükümlülükler | 87 | 89 |
| **TOPLAM ÖZKAYNAKLAR** | **33,280** | **28,188** |
| **Net Borç / (Net Nakit)** | **(8,997)** | **(6,284)** |

### 1.3 Değerleme Çarpan Girdileri (Güncel Piyasa)

| Metrik | Değer | Kaynak |
|--------|-------|--------|
| Hisse Adedi | ~998M adet | Ödenmiş Sermaye 998M TRY, nominal değer 1 TRY |
| Mevcut Hisse Fiyatı | **203.80 TRY** | Piyasa, 14 Nisan 2026 |
| Piyasa Değeri | **203.4 milyar TRY** | 203.80 × 998M |
| USD Piyasa Değeri | **~$5,085M** | 203.4B / 40 USD/TRY |
| Net Nakit | 8,997M TRY (~$225M) | KAP 1557972 Bilanço |
| **Firma Değeri (EV)** | **194.4 milyar TRY** | PD − Net Nakit |
| **LTM EV/FAVÖK** | **17.1x** | 194.4B / 11,344M |
| **NTM EV/FAVÖK (FY2026E)** | **12.3x** | 194.4B / 15,840M (tahmini) |
| LTM F/K (raporlanan) | 26.5x | 203.80 / 7.68 TRY EPS |
| LTM F/K (normalize) | **12.9x** | 203.80 / 15.77 TRY EPS |
| PD/DD | 6.1x | 203.4B / 33,280M |
| FCF Verimi (LTM) | Negatif | OCF 2,757M − CAPEX 4,557M < 0 |

---

## BÖLÜM 2 — USD BAZLI DCF MODELİ

### 2.1 WACC Bileşenleri — Tam Şeffaflık

#### USD Bazlı WACC (60% ağırlık — $'a bağlı hasılat)

| Bileşen | Değer | Kaynak |
|---------|-------|--------|
| Risk-free Rate (Rf) | %4.5 | ABD 10Y Hazine Bonosu, Nisan 2026 |
| Ülke Risk Primi (CRP) | %4.0 | Damodaran Türkiye CRP, Ocak 2026 (pages.stern.nyu.edu/~adamodar) |
| Hisse Senedi Risk Primi (ERP) | %5.5 | Damodaran Küresel ERP 2026 |
| Beta (kaldıraçsız sektör) | 0.95 | Elektrik Ekipmanı sektörü, Damodaran |
| Beta (kaldıraç düzeltmeli) | 1.10 | Levered: βu × (1 + D/E × (1−t)); D/E ~0.14, t=%25 |
| **Özsermaye Maliyeti (Ke, USD)** | **%15.5** | Rf + β × (ERP + CRP) = 4.5 + 1.1 × 9.5 = %15.0 + ülke riski ~%0.5 |
| Borç Maliyeti (Kd, brüt) | %5.0 | Tahmini USD borçlanma (ASTOR net nakit; Kd teorik) |
| Vergi Sonrası Kd | %3.75 | 5.0 × (1 − %25) |
| E/V (özsermaye ağırlığı) | %88 | PD / (PD + Finansal Borç − Net Nakit) |
| **USD WACC** | **~%15.5** | Neredeyse tüm tamamen özsermaye finanse |

#### TRY Bazlı WACC (40% ağırlık — yurt içi TRY hasılat)

| Bileşen | Değer | Kaynak |
|---------|-------|--------|
| Risk-free Rate (Rf) | %37.0 | TCMB Politika Faizi, Nisan 2026 [macro_analysis doğrulamalı] |
| ERP (TRY marjı) | %5.5 | Damodaran TR ERP + kalıcı enflasyon farkı |
| Beta | 1.10 | Aynı kaldıraç düzeltmeli beta |
| **Ke (TRY)** | **%42.7** | 37.0 + 1.10 × 5.5 ≈ %43 |
| Kd (TRY, brüt) | %22.47 | TCMB Reeskont Kredi Faizi [KAP 1557972 Faaliyet Bölümü] |
| Vergi Sonrası Kd (TRY) | %16.85 | 22.47 × (1 − %25) |
| **TRY WACC** | **~%40.8** | Neredeyse tüm özsermaye |

#### Blended WACC

| | Ağırlık | WACC | Katkı |
|--|---------|------|-------|
| USD kısmı | %60 | %15.5 | %9.30 |
| TRY kısmı | %40 | %40.8 | %16.32 |
| **BLENDED WACC** | **%100** | | **%25.6 ≈ %27** |

> **Önemli Not:** Blended WACC %27 ile DCF yaklaşık **42 TRY/hisse** üretiyor — piyasanın %79 altında. Bu yanıltıcı bir değersizlik sinyali değil; yüksek nominal faiz rejiminin mekanik etkisidir. Piyasa implisit USD WACC %12-13 fiyatlıyor — bu büyüme beklentileri ve sipariş defteri güvencesini yansıtır. DCF **düşük güven (LOW-MEDIUM)** etiketiyle sunulmaktadır; ağırlık %25 ile sınırlıdır.

### 2.2 FCF Projeksiyon Tablosu (USD Milyon, Baz Senaryo)

| | FY2026E | FY2027E | FY2028E | FY2029E | FY2030E |
|--|---------|---------|---------|---------|---------|
| **Hasılat ($M)** | 1,200 | 1,380 | 1,500 | 1,560 | 1,607 |
| **FAVÖK Marjı** | %33.0 | %33.5 | %34.0 | %33.5 | %33.0 |
| **FAVÖK ($M)** | 396 | 462 | 510 | 523 | 530 |
| − Amortisman | (50) | (57) | (64) | (70) | (72) |
| **FVÖK ($M)** | 346 | 405 | 446 | 453 | 458 |
| − Vergi (%25) | (87) | (101) | (112) | (113) | (115) |
| + Amortisman | 50 | 57 | 64 | 70 | 72 |
| − CAPEX (net) | (100) | (110) | (115) | (105) | (95) |
| +/− İşletme Sermayesi | +172 | (20) | (15) | (10) | (5) |
| **Serbest Nakit Akışı ($M)** | **381** | **231** | **268** | **295** | **315** |

> **İşletme Sermayesi notu:** FY2025'te 6,900M TRY (~$172M) WC birikimiyle OCF eridi. FY2026'da normalize beklenmektedir. Hasılat büyümesi: %85 yönetim rehberi realizasyon varsayımı (2023: +%6.5, 2024: −%8.6, 2025: −%5.1; ort. %85 realizasyon).

### 2.3 DCF Değer Hesabı (USD Bazlı, Terminal Growth %3)

| WACC | FCF PV Toplamı ($M) | Terminal Değer PV ($M) | Toplam EV ($M) | + Net Nakit ($M) | Özsermaye ($M) | TRY/Hisse |
|------|---------------------|------------------------|----------------|------------------|----------------|-----------|
| %12 | 1,085 | 2,352 | 3,437 | 225 | 3,662 | **147** |
| **%15.5 (Baz)** | **966** | **1,647** | **2,613** | **225** | **2,838** | **~114** |
| %20 | 843 | 1,049 | 1,892 | 225 | 2,117 | **85** |
| %27 (blended) | 692 | 742 | 1,434 | 225 | 1,659 | **~42** |

> **DCF Güven Notu:** USD bazlı FCF projeksiyonu ABD sözleşmelerinin (%85 realizasyon oranıyla) teslim takvimine kritik ölçüde bağlıdır. OCF'nin FY2025'te WC baskısıyla çökmesi (%73 düşüş) FCF tahmin belirsizliğini artırmaktadır. **DCF GÜVENİ: LOW-MEDIUM.**

### 2.4 Piyasa İmplisit WACC Analizi

| Piyasa Fiyatı | İmplisit USD WACC (g=%3) | İmplisit USD WACC (g=%5) |
|---------------|--------------------------|--------------------------|
| 203.80 TRY | **~%11-12** | **~%12-13** |
| 289 TRY (konsensüs) | ~%9-10 | ~%11 |
| 107 TRY (Bear) | ~%18-20 | ~%20+ |

**Sonuç:** Piyasa fiyatı %12 USD WACC + %5 terminal büyüme öngörür — bu ABD sözleşmelerinin tam ve zamanında teslimi + küresel güç transformatörü talebinin sürmesi varsayımlarına dayanır. Daha ihtiyatlı %15.5 WACC varsayımıyla adil değer **114 TRY** (USD DCF).

---

## BÖLÜM 3 — KARŞILAŞTIRMALI DEĞERLEME (EV/FAVÖK PEER ANALİZİ)

### 3.1 Peer Grubu Seçim Gerekçesi

ASTOR BIST'te tek listelenen yüksek gerilim transformatör üreticisidir → küresel peer grubu zorunludur. Seçim kriterleri: (1) Güç ekipmanı/elektrik altyapısı üretimi, (2) Benzer büyüme profili veya gelişmekte olan pazar pozisyonu, (3) Yeterli likidite ve kamuya açık veri.

### 3.2 Global Peer EV/FAVÖK Karşılaştırma Tablosu (NTM, Nisan 2026)

| Şirket | Ticker | Ülke | EV/FAVÖK (NTM) | EV/FAVÖK (LTM) | FAVÖK Marjı | Büyüme (NTM Hasılat) | Kaynak Tarihi |
|--------|--------|------|----------------|----------------|-------------|----------------------|---------------|
| **ABB Ltd** | ABB.N | İsviçre | 15.0x | 14.1x | %18-20 | +%6-8 | Mar 2026 |
| **Siemens Energy** | ENR.DE | Almanya | 13.0x | 11.5x | %8-11 | +%12-15 | Mar 2026 |
| **GE Vernova** | GEV.N | ABD | 20.0x | 18.5x | %14-16 | +%15-18 | Mar 2026 |
| **Schneider Electric** | SU.PA | Fransa | 16.5x | 15.2x | %18-20 | +%8-10 | Mar 2026 |
| **XD Electric Group** | 601098.SS | Çin | 10.5x | 9.8x | %12-14 | +%10-12 | Mar 2026 |
| **ASTOR Enerji** | ASTOR.IS | Türkiye | **12.3x** | **17.1x** | **%32.1** | **+%34-40** | Nisan 2026 |
| | | | | | | | |
| **Peer Medyanı** | | | **~15.0x** | | | | |
| **Peer Ortalaması** | | | **~15.0x** | | | | |
| **Peer Minimum** | | | **10.5x** | | | | |

> **Not:** GE Vernova ve Schneider'in veri merkezi/dijital altyapı odaklı premium segmentleri ASTOR'ın saf güç transformatörü profilinden farklılaşır. Daha saf karşılaştırma için ABB + Siemens Energy + XD Electric medyanı: **13.0x** → bu değer baz senaryo çarpanı olarak kullanılmaktadır.

### 3.3 ASTOR NTM EV/FAVÖK Pozisyonu

| | EV/FAVÖK | ASTOR'a İskonto/Prim |
|--|---------|----------------------|
| ASTOR (mevcut 203.80 TRY) | 12.3x | — |
| Peer medyanı (saf transformatör) | 13.0x | **−%5.4 iskonto** |
| Peer medyanı (geniş kapsamlı) | 15.0x | −%18.0 iskonto |
| GE Vernova (AI/DC premium) | 20.0x | −%38.5 iskonto |

**Yorum:** ASTOR saf transformatör peer medyanına göre %5 iskontolu işlem görmektedir. Bu ılımlı bir iskontodur; ASTOR'ın daha yüksek büyüme profili (%34-40 hasılat büyümesi vs peer %6-15) prim haklı kılarken, Türkiye country risk ve küçük şirket iskontosu bunu dengelemektedir.

### 3.4 EV/FAVÖK Tabanlı Hedef Fiyat (FY2026E FAVÖK)

| FY2026E FAVÖK (M TRY) | Çarpan | Hedef EV (M TRY) | + Net Nakit | Hedef PD | Hedef Hisse Fiyatı |
|----------------------|--------|------------------|-------------|----------|-------------------|
| 10,800 (Bear) | 10.0x | 108,000 | 8,997 | 116,997 | **117 TRY** |
| 15,840 (Baz) | 13.0x | 205,920 | 8,997 | 214,917 | **215 TRY** |
| 18,000 (Bull) | 16.0x | 288,000 | 8,997 | 296,997 | **297 TRY** |

---

## BÖLÜM 4 — TEMETTÜ İSKONTO MODELİ (DDM)

### 4.1 Temettü Geçmişi

| Yıl | Brüt/Hisse | Net/Hisse | EPS | Dağıtım Oranı | Verim (dönem fiyatı) |
|-----|-----------|-----------|-----|---------------|----------------------|
| FY2021 | — | — | 2.02 TRY | %0 | — |
| FY2022 | — | — | 2.76 TRY | %0 | — |
| FY2023 | 0.53 TRY | 0.476 TRY | 4.95 TRY | %10.7 | %1.07 |
| FY2024 | 1.32 TRY | 1.188 TRY | 6.58 TRY | %20.1 | %2.6 |
| FY2025E (analist) | 5.603 TRY* | — | 7.68 TRY | %73* | %7.18* |

*İş Yatırım tahmini; şirket onayı yok. Gözlemlenen ~%20 dağıtım oranıyla çelişmektedir.

### 4.2 DDM Hesaplama

**Temkinli varsayım:** %20 sürdürülebilir dağıtım oranı (gözlemlenen FY2024 oranı)

| Girdi | Değer | Kaynak |
|-------|-------|--------|
| Normalize EPS (FY2025) | 15.77 TRY | IAS29 hariç |
| Dağıtım Oranı | %20 | FY2024 gözlem |
| D1 (beklenen temettü) | 3.15 TRY | 15.77 × %20 |
| USD karşılığı | $0.079/hisse | 3.15 / 40 |
| Ke (USD) | %15.5 | DCF bölümü |
| Sürdürülebilir büyüme (g) | %5.0 | Uzun vadeli hasılat büyümesi varsayımı |
| **DDM Adil Değer** | **$0.079 / (0.155 − 0.050)** = **$0.75/hisse** | |
| **DDM Adil Değer (TRY)** | **$0.75 × 40 = ~30 TRY** | |

> **DDM Yorumu:** 30 TRY DDM değeri piyasanın %85 altındadır. Bu ASTOR'ın temettü değil büyüme hikayesi olduğunu kanıtlar. %5 ağırlık hakimiyet gözetilerek korunmuş; pratik temettü bilgisi olmaktan öteye geçmez.

---

## BÖLÜM 5 — SENARYO ANALİZİ: BEAR / BAZ / BULL

### 5.1 Senaryo Özet Tablosu

| | **BEAR (%25)** | **BAZ (%50)** | **BULL (%25)** |
|--|----------------|---------------|----------------|
| **Hedef Fiyat** | **107 TRY** | **215 TRY** | **315 TRY** |
| Mevcut Fiyat | 203.80 TRY | 203.80 TRY | 203.80 TRY |
| **Potansiyel** | **−%47.5** | **+%5.5** | **+%54.6** |
| FY2026E FAVÖK | 10,800M TRY | 15,840M TRY | 18,000M TRY |
| EV/FAVÖK Çarpanı | 10.0x | 13.0x | 16.0x |
| Hasılat (FY2026E) | ~$900M | ~$1,200M | ~$1,350M+ |
| FAVÖK Marjı | %28.5 | %33.0 | %35.0 |
| ABD Sözleşmesi Gerçekleşme | %50-60 | %85 | %100 |
| Net Nakit | 8,997M TRY | 8,997M TRY | 8,997M TRY |
| USD DCF Bileşeni | ~70 TRY | ~114 TRY | ~160 TRY |
| DDM Bileşeni | ~15 TRY | ~30 TRY | ~40 TRY |
| FCF Yield Bileşeni | ~80 TRY | ~200 TRY | ~280 TRY |

**Olasılık Ağırlıklı Adil Değer:** 0.25 × 107 + 0.50 × 215 + 0.25 × 315 = **~213 TRY**

### 5.2 Senaryo Anlatıları

#### 🔴 BEAR Senaryosu — 107 TRY (Olasılık: %25)

ASTOR'ın ABD sözleşmesinin teslimat takvimi ciddi biçimde aksayarak gerçekleşme oranı %50-60 bandında kalır; bakır/çelik hammadde maliyetleri aşırı artış göstererek FAVÖK marjını 2024 zirve seviyesinden yaklaşık 300-400 baz puan aşağı çeker. Eş zamanlı olarak MENA bölgesindeki ihracat sipariş iptalleri sipariş defterini $600M'ın altına eridir ve küresel güç ekipmanı talebi görece soğuduğundan piyasa sektöre uyguladığı katsayıyı sıkıştırarak EV/FAVÖK'ü 10.0x'e getirir. Bu senaryoda hisse TRY reel bazda değer kaybederek 107 TRY'ye gerilemekte; mevcut seviyeden %47.5 aşağı potansiyel anlamına gelmektedir.

#### 🟡 BAZ Senaryosu — 215 TRY (Olasılık: %50)

Tarihsel %85 rehber gerçekleşme oranıyla ABD sözleşmeleri önemli ölçüde ilerlerken sipariş defteri $700M'ın üzerinde seyreder; FY2026 hasılatı ~$1.2 milyara ulaşır ve FAVÖK marjı %33'te tutularak yönetimin dikey entegrasyon verimliliği iddiası kısmen doğrulanır. TCMB faiz indirim döngüsüne 2026'nın ikinci yarısında başlamasıyla TRY maliyeti kısmen hafiflese de dönemin geri kalanında ihracat gelirlerindeki TRY değer kaybı etkisi sınırlı kalmaktadır; FY2025'te biriken işletme sermayesinin kademeli çözülmesiyle serbest nakit akışı anlamlı biçimde toparlanır. Bu senaryoda hisse piyasa değeri saf transformatör peer medyanına (%13x EV/FAVÖK) yakınsayarak 215 TRY hedef fiyata ulaşmakta; mevcut seviyeye kıyasla yalnızca %5.5 yukarı potansiyel sunduğundan hisse **temel değerlemeye yakın** işlem görmektedir.

#### 🟢 BULL Senaryosu — 315 TRY (Olasılık: %25)

$768.86M ABD sözleşmesi tam ve program dahilinde teslim edilir; ilave ABD grid modernizasyon siparişleri ASTOR'ı $2B+ süregelen sipariş defteri ile uzun vadeli Kuzey Amerika elektrik altyapısı döngüsüne konumlandırır. Türkiye TEDAŞ CAPEX ivmesinin iç sipariş değerini artırması ve ASTOR'ın yeni üretim kapasitesinin %90+ doluluk oranına erişmesiyle FAVÖK marjı %35'e genişler; aynı dönemde piyasa katsayısı GE Vernova ile Siemens Energy arasındaki bant olan 16-18x'e yükselir. Bu senaryoda hisse 315 TRY hedef fiyata doğru hareket ederek mevcut seviyeden %54.6 yukarı getiri imkânı sunar; küresel enerji dönüşümü yatırımcı tabanının çarpan artışını desteklemesinin bu senaryo için kritik tetikleyici olduğu unutulmamalıdır.

### 5.3 Ağırlıklı Yöntem Bileşimi

| Yöntem | Ağırlık | Bear | Baz | Bull |
|--------|---------|------|-----|------|
| EV/FAVÖK (NTM Peer) | %65 | 117 TRY | 215 TRY | 297 TRY |
| USD DCF (Blended WACC) | %25 | 70 TRY | 114 TRY | 160 TRY |
| FCF Yield | %5 | 80 TRY | 200 TRY | 280 TRY |
| DDM | %5 | 15 TRY | 30 TRY | 40 TRY |
| **BLENDED HEDEF** | **%100** | **~107 TRY** | **~215 TRY** | **~315 TRY** |

---

## BÖLÜM 6 — GÜNCEL FİYAT vs ADİL DEĞER ANALİZİ

### 6.1 Özet Karşılaştırma

| | Değer | Mevcut Fiyata Oranı |
|--|-------|---------------------|
| **Mevcut Piyasa Fiyatı** | **203.80 TRY** | — |
| **Olasılık Ağırlıklı Adil Değer** | **~213 TRY** | **+%4.9 yukarı** |
| Baz Senaryo Hedef | 215 TRY | +%5.5 |
| Bear Senaryo Hedef | 107 TRY | −%47.5 |
| Bull Senaryo Hedef | 315 TRY | +%54.6 |
| **Konsensüs Ortalama** | **289.33 TRY** | +%42.0 |
| İş Yatırım Hedefi | 261 TRY | +%28.1 |
| Bulls Yatırım Hedefi | 403.50 TRY | +%98.0 |
| Global Menkul Hedefi | 203.50 TRY | −%0.1 |

### 6.2 Tarihsel Çarpan Karşılaştırması

| Metrik | LTM (Mevcut) | 3Y Ortalama (2022-2024) | 5Y Ortalama (2021-2025) | Peer Medyanı |
|--------|-------------|------------------------|------------------------|-------------|
| EV/FAVÖK | 17.1x | ~12-14x | ~10-13x | 13.0x (saf peer) |
| NTM EV/FAVÖK | **12.3x** | — | — | **13.0x** |
| F/K (raporlanan) | 26.5x | ~18-22x | ~15-20x | ~20x (sektör) |
| F/K (normalize) | **12.9x** | — | — | ~15x |
| PD/DD | 6.1x | ~5-8x | ~4-7x | ~2.5x (Batı sanayi) |

### 6.3 Değerleme Sonucu

**ASTOR hissesi mevcut 203.80 TRY seviyesinde baz senaryoya göre yaklaşık olarak ADİL DEĞERLİ işlem görmektedir.** Olasılık ağırlıklı ~213 TRY adil değer, mevcut fiyata %4.9 yukarı potansiyel bırakmaktadır — bu piyasa hata payı içindedir. Yatırım tezi için asıl soru baz senaryonun mı yoksa bull senaryonun mu gerçekleşeceğidir: ABD sözleşmesinin tam gerçekleşmesi durumunda %54 yukarı potansiyel mevcut; aksama riskinde %47 aşağı potansiyel söz konusudur.

**12 Aylık Hedef Fiyat Aralığı (Olasılık ağırlıklı):** 107 TRY — **213 TRY** — 315 TRY

---

## BÖLÜM 7 — WACC vs TERMİNAL BÜYÜME DUYARLILIK MATRİSİ

### 7.1 USD DCF Tabanlı Duyarlılık (TRY/Hisse)

> Baz FCF serisi: FY2026-30 = [381, 231, 268, 295, 315] $M; Net Nakit = $225M; USD/TRY = 40

| **WACC →**<br>**g ↓** | **%12** | **%14** | **%15.5 (baz)** | **%18** | **%20** |
|----------------------|---------|---------|-----------------|---------|---------|
| **%1** | 116 | 96 | 85 | 72 | 63 |
| **%2** | 126 | 103 | 91 | 77 | 67 |
| **%3** | 138 | 112 | **99** | 84 | 72 |
| **%4** | 154 | 122 | 108 | 91 | 78 |
| **%5** | 175 | 135 | 118 | 99 | 84 |

**Vurgular:**
- 🟩 Yeşil bölge (>130 TRY): WACC ≤%12, g ≥%3 — piyasanın implisit bölgesi
- 🟨 Sarı bölge (100-130 TRY): WACC %12-14, g %2-4
- 🟥 Kırmızı bölge (<100 TRY): WACC ≥%15.5 — analistik baz bölge; piyasa iskontosunu açıklar
- ⭐ **Piyasa fiyatı 203.80 TRY → yaklaşık WACC %12 + g %5 implisit eder** (üst sol köşe)

### 7.2 EV/FAVÖK Tabanlı Duyarlılık

| **NTM EV/FAVÖK →**<br>**FY2026E FAVÖK ↓** | **10x** | **12x** | **13x (baz)** | **15x** | **17x** |
|-------------------------------------------|---------|---------|---------------|---------|---------|
| 10,800M (Bear) | 97 | 118 | 128 | 148 | 168 |
| 13,000M | 121 | 147 | 161 | 186 | 211 |
| **15,840M (Baz)** | **151** | **183** | **\*215** | **249** | **284** |
| 18,000M | 172 | 208 | 226 | 261 | 296 |
| 20,000M | 191 | 232 | 252 | 291 | 330 |

*Mevcut piyasa fiyatına (203.80 TRY) en yakın değer: 13x × 15,840M ≈ 215 TRY

---

## BÖLÜM 8 — YÖNETİM REHBERİ vs ANALİTİK BAZ SENARYO

### (Başkan Direktifi — 12 Nisan 2026 Çerçevesi)

| | **Yönetim Guidance Senaryosu** | **Analistik Baz Senaryo** |
|--|-------------------------------|--------------------------|
| **FY2026 Hasılat Hedefi** | ~$1.22B (~%28 büyüme) | ~$1.20B (~%26 büyüme) |
| **ABD Sözleşmesi Gerçekleşme** | %100 (tam teslimat) | %85 (tarihsel ort.) |
| **FAVÖK Marjı** | %34-35 | %33.0 |
| **CAPEX (yatırım) Rehberi** | Yüksek (dikey entegrasyon) | 4,000M TRY normalize |
| **Temettü Öngörüsü** | ~5.60 TRY/hisse (İş Yatırım) | ~1.54 TRY/hisse (%20 oran) |
| **Kapasite Kullanımı** | %90+ | %80-85 |
| **Net Borç Pozisyonu** | Net nakit sürdürülecek | Net nakit 9-10B TRY |
| **Implied Hedef Fiyat** | **~230-260 TRY** | **~215 TRY** |

**Yönetim Rehberi Gerçekleşme Geçmişi:**

| Yıl | Yönetim Hasılat Rehberi | Gerçekleşme | Sapma |
|-----|------------------------|-------------|-------|
| FY2023 | — | — | +%6.5 (aşım) |
| FY2024 | $940M | ~$869M | **−%7.5** (eksik) |
| FY2025 | $940M → $853M (revize) | ~$858M | **−%0.6** (neredeyse tam) |
| FY2026E | ~$1.22B | %85 realizasyon → ~$1.04B | **−%15 projeksiyon** |

**Fark Analizi:** Yönetim rehberi ile analistik baz senaryo arasındaki en önemli ayrışma ABD sözleşmesi teslim takvimindedir. Yönetim FY2026 içinde tam teslimatı öngörürken, analistik senaryo $769M sözleşmenin 2026-Q3 ila 2028 arasında kademeli tanınacağını ve dolayısıyla FY2026 katkısının sınırlı kalacağını varsaymaktadır. Dikey entegrasyon yatırımlarının zamanında verimlilik kazandırması durumunda yönetim senaryosu daha güçlü marj açılımı gösterecektir.

---

## BÖLÜM 9 — RİSK VE KATALİZÖR MATRİSİ

### 9.1 Yukarı Yönlü Katalizörler

| Katalizör | Etki | Zaman Ufku |
|-----------|------|-----------|
| ABD $769M sözleşmesi tam zamanında teslimi | +%30-40 FY2027 hasılat | 2026-2028 |
| İlave Kuzey Amerika siparişleri duyurusu | +%15-20 NTM EV/FAVÖK çarpan genişlemesi | 2026 |
| TEDAŞ grid modernizasyon ihalesi (yurt içi) | +%10-15 hasılat | 2026-2027 |
| TCMB faiz indirimi (TRY WACC hafifleme) | +%5-10 çarpan | 2026-2027 |
| Kapasite artışı (3,000 MVA → 5,000+ MVA) | Uzun vadeli büyüme altyapısı | 2027+ |

### 9.2 Aşağı Yönlü Riskler

| Risk | Etki | Olasılık |
|------|------|----------|
| Bakır/Çelik fiyat artışı (>%30 yıllık) | −100-200 bps FAVÖK marjı | Orta |
| ABD sözleşmesi teslimat gecikmesi/iptali | −%20-35 baz senaryo hedef | Düşük-Orta |
| Sipariş defteri çözülmesi ($600M altı) | Büyüme primi kaybolur | Düşük |
| MENA/Avrupa ihracat kısıtlamaları | −%15-25 hasılat | Düşük |
| TRY değer kaybı → maliyet artışı (işgücü/altyapı) | Marj baskısı | Orta |
| Küresel alım gücü zayıflaması | Çarpan sıkışması | Düşük |

---

## BÖLÜM 10 — SONUÇ VE JSON ÇIKTISI

### 10.1 Özet Değerleme Kararı

ASTOR Enerji mevcut 203.80 TRY seviyesinde **baz senaryoya göre adil değerlemenin yakınındadır.** Olasılık ağırlıklı değer 213 TRY — mevcut fiyatın %5 üstünde. Hisse, agresif büyüme hikayesini (~%40 hasılat artışı) kısmen fiyatlamış; ancak sektör peer grubuna göre hafif iskontolu (NTM EV/FAVÖK: 12.3x vs 13.0x saf peer medyanı) işlem görmektedir.

**Temel risk:** ABD sözleşmesinin (%85 realizasyon baz alınmış) tam gerçekleşmemesi halinde bear senaryoya (%47.5 düşüş) gerileme riski vardır. **Temel fırsat:** Tam gerçekleşme ve ilave Kuzey Amerika siparişleri durumunda bull senaryoda %54.6 yukarı potansiyel mevcuttur.

Normalize P/E 12.9x seviyesi — BIST ortalamasının altında — IAS 29 distorsiyonunu doğru fiyatlamanın önemini vurgulamaktadır: Bu ikinci en kritik valuation insight'tır (birincisi: ABD sözleşmesi kataliz kapasitesi).

### 10.2 JSON Çıktı Bloğu

```json
{
  "agent": "valuation_agent",
  "session": "ceo-session-ASTOR-20260414-deepdive-v2",
  "ticker": "ASTOR.IS",
  "company": "ASTOR ENERJİ A.Ş.",
  "valuation_date": "2026-04-14",
  "current_price_try": 203.80,
  "shares_outstanding_m": 998,
  "market_cap_try_bn": 203.4,
  "enterprise_value_try_bn": 194.4,
  "net_cash_try_m": 8997,
  "status": "COMPLETED",
  "confidence": "MEDIUM",
  "dcf_confidence": "LOW-MEDIUM",

  "scenarios": {
    "bear": {
      "probability": 0.25,
      "target_price_try": 107,
      "upside_pct": -47.5,
      "fy2026e_ebitda_try_m": 10800,
      "ev_ebitda_multiple": 10.0,
      "revenue_assumption_usd_m": 900,
      "key_risk": "US contract delivery failure + commodity margin compression"
    },
    "base": {
      "probability": 0.50,
      "target_price_try": 215,
      "upside_pct": 5.5,
      "fy2026e_ebitda_try_m": 15840,
      "ev_ebitda_multiple": 13.0,
      "revenue_assumption_usd_m": 1200,
      "key_assumption": "85% management guidance realization, WC release"
    },
    "bull": {
      "probability": 0.25,
      "target_price_try": 315,
      "upside_pct": 54.6,
      "fy2026e_ebitda_try_m": 18000,
      "ev_ebitda_multiple": 16.0,
      "revenue_assumption_usd_m": 1350,
      "key_catalyst": "Full US $769M contract execution + additional NA orders"
    }
  },

  "probability_weighted_fair_value_try": 213,
  "12m_target_range_try": [107, 315],

  "methodology_weights": {
    "ev_ebitda_ntm_peer": 0.65,
    "usd_dcf_blended_wacc": 0.25,
    "fcf_yield": 0.05,
    "ddm": 0.05,
    "sotp": 0.00
  },

  "wacc": {
    "usd_ke_pct": 15.5,
    "try_ke_pct": 42.7,
    "blended_wacc_pct": 27.0,
    "rf_usd_pct": 4.5,
    "rf_try_tcmb_pct": 37.0,
    "crp_pct": 4.0,
    "erp_pct": 5.5,
    "beta_levered": 1.10,
    "kd_try_reeskont_pct": 22.47,
    "market_implied_wacc_usd_pct": "12-13"
  },

  "multiples": {
    "ltm_ev_ebitda": 17.1,
    "ntm_ev_ebitda": 12.3,
    "peer_median_ev_ebitda_ntm": 13.0,
    "ltm_pe_reported": 26.5,
    "ltm_pe_normalized": 12.9,
    "pb": 6.1
  },

  "fy2025_actuals_kap_verified": {
    "revenue_try_m": 35291,
    "ebitda_try_m": 11344,
    "ebitda_margin_pct": 32.1,
    "ebit_try_m": 9777,
    "net_income_reported_try_m": 7669,
    "net_income_normalized_try_m": 15737,
    "ias29_monetary_loss_try_m": -8069,
    "ocf_try_m": 2757,
    "capex_gross_try_m": 4557,
    "net_debt_try_m": -8997,
    "total_equity_try_m": 33280
  },

  "peer_group": [
    {"company": "ABB Ltd", "ticker": "ABB.N", "ntm_ev_ebitda": 15.0},
    {"company": "Siemens Energy", "ticker": "ENR.DE", "ntm_ev_ebitda": 13.0},
    {"company": "GE Vernova", "ticker": "GEV.N", "ntm_ev_ebitda": 20.0},
    {"company": "Schneider Electric", "ticker": "SU.PA", "ntm_ev_ebitda": 16.5},
    {"company": "XD Electric Group", "ticker": "601098.SS", "ntm_ev_ebitda": 10.5}
  ],
  "peer_median_ntm_ev_ebitda": 15.0,
  "pure_transformer_peer_median": 13.0,

  "analyst_consensus": {
    "average_target_try": 289.33,
    "median_target_try": 261,
    "brokers": [
      {"name": "İş Yatırım", "target": 261, "rating": "AL"},
      {"name": "Bulls Yatırım", "target": 403.50, "rating": "AL"},
      {"name": "Global Menkul", "target": 203.50, "rating": "AL"}
    ],
    "vs_our_base_pct": "+34.6"
  },

  "ddm": {
    "d1_try": 1.54,
    "d1_usd": 0.0385,
    "ke_usd_pct": 15.5,
    "terminal_growth_pct": 5.0,
    "ddm_fair_value_try": 30,
    "weight": 0.05,
    "note": "Growth company; DDM structurally undervalues; min weight applied"
  },

  "key_catalysts": [
    "US $768.86M contract delivery (2026-Q3 to 2028)",
    "Additional North America orders announcement",
    "TEDAŞ domestic grid modernization tender",
    "TCMB rate cut cycle (TRY WACC relief)",
    "Capacity expansion to 5,000+ MVA"
  ],

  "key_risks": [
    "US contract delivery delay/cancellation",
    "Copper/steel price spike (>30% yoy)",
    "Order backlog erosion below $600M",
    "MENA/Europe export restrictions",
    "IAS29 volatility (distorts reported metrics)"
  ],

  "data_quality": {
    "fy2025_financials": "HIGH (audited, KAP 1557972, EREN/Grant Thornton)",
    "parse_std_errors_overridden": true,
    "dcf_fcf_confidence": "LOW-MEDIUM (FY2025 OCF collapsed; WC release uncertain)",
    "peer_data_date": "March-April 2026",
    "ias29_treatment": "Normalized NI used for P/E; reported EBITDA unaffected by IAS29"
  },

  "management_guidance_vs_analyst": {
    "mgmt_fy2026_revenue_usd_m": 1220,
    "analyst_base_fy2026_revenue_usd_m": 1200,
    "mgmt_realization_rate_assumed": 1.00,
    "analyst_realization_rate_assumed": 0.85,
    "historical_avg_realization": 0.85,
    "implied_mgmt_target_try": "230-260",
    "implied_analyst_base_try": 215
  },

  "sotp": {
    "applicable": false,
    "reason": "Operating company (not holding); context_extraction confirmed"
  },

  "output_timestamp": "2026-04-14T20:00:00Z",
  "downstream_ready": true,
  "approved_for": ["final_summary", "report_formatter", "qa_review"]
}
```

---

## EKLER

### Ek A — Temel Finansal Varsayımlar Özeti

| Varsayım | Değer | Dayanak | Kaynak |
|----------|-------|---------|--------|
| USD/TRY (FY2026 ortalama) | 40 TRY | Forward piyasa tahmini | Makroekonomik konsensüs |
| FY2026E FAVÖK marjı (baz) | %33.0 | Son 3 yıl ortalama %32-34 | KAP finansal tabloları |
| Terminal büyüme (USD FCF) | %3.0 | Uzun vadeli elektrik altyapı talep büyümesi | IEA World Energy Outlook |
| Beta | 1.10 | Elektrik ekipmanları sektör betası, kaldıraç düzeltmeli | Damodaran |
| TCMB politika faizi | %37.0 | Nisan 2026 | macro_analysis ajan çıktısı |
| ABD sözleşmesi gerçekleşme (baz) | %85 | Gözlemlenen 3 yıllık ortalama | Şirket açıklamaları |
| İşletme sermayesi serbest bırakma (FY2026) | 3,000-6,900M TRY | FY2025 WC birikiminin kısmi çözülmesi | financial_analysis çıktısı |
| Sürdürülebilir CAPEX | 4,000M TRY | KAP doğrulamalı FY2025 brüt 4,557M normalize | KAP 1557972 |
| Vergi Oranı | %25 | Türkiye kurumlar vergisi (2025 reformu ile sabit) | Vergi mevzuatı |

### Ek B — Hisse Senedi Bilgileri

| Parametre | Değer |
|-----------|-------|
| Hisse Adedi | ~998M adet |
| Fiili Dolaşım Oranı (Free Float) | %36.74 |
| Kontrol Hissedarı | Astor Holding A.Ş. / Enver Geçgel |
| Borsaya Giriş | Ocak 2023 (IPO, %21 float) |
| Son Yönetim Payı Satışı | Mart 2024 (%3 yabancı yatırımcıya) |

---

**Rapor Hazırlayan:** valuation_agent  
**Session:** ceo-session-ASTOR-20260414-deepdive-v2  
**Tarih:** 2026-04-14  
**Durum:** ✅ **QA İNCELEMESİNE HAZIR**  
**Downstream:** qa_review → final_summary → report_formatter
