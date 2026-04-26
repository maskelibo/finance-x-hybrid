# Research Brief — memory.md

## Kurallar (permanent)

- 5-8 sub_question üret; daha azı eksik kapsama, daha fazlası retrieval'ı yorar.
- Her sub_question ölçülebilir cevap aramalı (miktar, oran, yön).
- Sektöre özgü metrikleri mutlaka kullan (mapping: canonical/tickers/sector_mapping.yaml).
- ceo_output'tan mode'u al (fast/standard/deep) — fast'ta 5, deep'te 8 soru.
- Output JSON schema'ya tam uy; boş field bırakma.

## Sektör başına tipik sub_question pattern'ları (lessons)

### retail (BİM / BIMAS — standard_institutional, 7 soru)
1. SSSG trendi + fiyat/hacim ayrıştırması (SR-retail-002 zorunlu)
2. IFRS 16 öncesi/sonrası EBITDA marjı (SR-retail-003 zorunlu)
3. Mağaza açılış/kapanış neti + CAPEX per yeni mağaza
4. DPO + negatif NWC/Gelir trendi (SR-retail-004 zorunlu)
5. IAS29 Note 35: parasal kazanç/kayıp ve EBITDA düzeltmesi
6. Brüt marj + stok devir (DIO) trendi vs benchmark
7. Net Borç/EBITDA + OCF/EBITDA finansal kaldıraç trendi
Evidence_need ağırlığı: 4×rag, 2×rag+external, 1×rag (toplam 7)
Eklenme: 2026-04-24 BIMAS analizi

### durable_goods (ARCLK — standard_institutional, 7 soru)
1. Yurt içi / uluslararası coğrafi gelir dağılımı + yıllık değişim (SQ-rag zorunlu)
2. IAS 29 monetary gain tutarı + düzeltilmiş EBITDA marjı (SQ-rag+calc)
3. FX net pozisyonu (YP varlık − YP yükümlülük) — dipnot bazlı tüzel kişilik sınıflandırması (SQ-rag)
4. CCC (DSO+DIO-DPO) trendi + sektör benchmark karşılaştırması (SQ-calc)
5. Net Borç/EBITDA + goodwill + faiz karşılama oranı (SQ-rag+calc)
6. OCF/EBITDA + FCF kalitesi FY2023-FY2025 (SQ-rag — CF tablosu P0 bloker riski)
7. CBAM / AB ihracat riski + hammadde maliyet duyarlılığı (SQ-rag+external)
FX_COMPLEXITY notu: çok katmanlı fonksiyonel para birimi (Whirlpool EMEA + Hitachi) — dipnot bazlı tüzel kişilik sınıflandırması zorunlu, mekanik IAS 29 hata üretir.
Eklenme: 2026-04-24 ARCLK analizi

### steel_manufacturing (EREGL — standard_institutional, 7 soru)
1. Yeni KAP belgesi içerik sınıflandırması (dönem + yeni veri tespiti) — document_evidence P0
2. EBITDA tanım çakışması: mgmt Not 8 değeri vs SPK mekanik — parse_standardization P0 (kilitli: 20,452 mn)
3. FCF normalizasyonu: raw − WC release = sürdürülebilir FCF (kilitli baz: raw 49,717 mn, WC 45,997 mn) — financial_analysis P0
4. IAS29 monetary_gain/NI oranı trendi FY2023-FY2025 + adj_NI hesabı (kilitli trigger: %126.2) — financial_analysis P0
5. CBAM net FCF etkisi 2026E-2030E (AB ihracat hacmi × emisyon yoğunluğu × fiyat) — external_research P1
6. Net borç/EBITDA + vade profili (Not 7 finansal borç zorunlu — toplam yükümlülük YASAK) — financial_analysis P1
7. Ton başı EBITDA + HRC spread trendi vs KRDMD/IZDMC peer karşılaştırması — sector_competition P1
Evidence_need ağırlığı: 4×rag, 2×rag+external, 1×external (toplam 7)
CRITICAL notu: parse_standardization tarihsel hata üretici — her çıktıda KAP Not referansı zorunlu. FCF yorumunda WC release ayrıştırması olmadan normalize etme YASAK.
Eklenme: 2026-04-24 EREGL analizi

### holding (KCHOL — deep_dive, 8 soru) [confirmed 2026-04-25]
1. SOTP/NAV — 6 temel iştirak (YKBNK P/BV; TUPRS/FROTO/ARCLK/AYGAZ/TKFEN EV/EBITDA) × efektif hisse; ARCLK-Hitachi Nisan 2026 sahiplik revizyonu + çift sayım koruması — valuation_agent (rag+calc) [P0]
2. Revenue FY/Q4 P0 disambiguasyon — FY2025 konsolide ~2.76T TRY vs Q4 802.669B TRY; parent-only (temettü+faiz) ayrıca — data_collection (rag) [P0]
3. IFRS 8 segment EBITDA — TUPRS/FROTO/YKBNK/ARCLK FY2021-2025; 4-fallback: KAP dipnot → faaliyet raporu → IR sunumu → fintables.com — context_extraction (rag) [P0]
4. YKBNK 924B TRY bilanço izolasyonu → sanayi-only Net Borç/EBITDA + faiz karşılama FY2023-2025 — financial_analysis (rag+calc) [P0]
5. CF tablosu P0 doğrulama — OCF/FCF/CAPEX 5 yıl tam veri; önceki 4 analizde P0 bloker — data_collection (rag) [P0]
6. IAS29 parasal kazanç/kayıp — EBITDA ve net kar etkisi FY2022-2025; adj EBITDA marjı — financial_analysis (rag+calc)
7. NAV indirimi tarihsel trend — SAHOL/KOZAL/ECZYT peer benchmark; GCM SOTP 406 TRY vs güncel fiyat — sector_competition (rag+external)
8. Parent FX borç riski (USD/EUR vs TRY nakit akışı) + holding giderleri/NAV + temettü getirisi 5yr — financial_analysis (rag)
Evidence_need ağırlığı: 3×rag, 3×rag+calc, 2×rag+external (toplam 8)
P0 bloker SQ: SQ-01 (SOTP veri), SQ-02 (Revenue disambig), SQ-03 (IFRS8), SQ-04 (YKBNK iso), SQ-05 (CF)

### holding (KCHOL — standard_institutional, 7 soru) [confirmed 2026-04-25]
1. SOTP: TUPRS+YKBNK+FROTO+TOASO+ARCLK+AYGAZ+listesiz efektif hisse × sektör çarpanı → NAV — valuation_agent (rag+external) [P0]
2. IAS 29 adj EBITDA + net marj FY2021–FY2025 — financial_analysis (rag+calc) [P0]
3. YKBNK ~924B TRY bilanço izolasyonu → holding-only Net Borç/EBITDA + faiz karşılama — financial_analysis (rag+calc) [P0]
4. CF tablosu OCF/FCF P0 doğrulama (önceki 3 KCHOL seansında P0 bloker) — data_collection (rag) [P0]
5. IFRS 8 segment EBITDA (otomotiv/enerji/finans/beyaz eşya) — financial_analysis, 4-fallback zorunlu (rag+external) [P1]
6. NAV indirimi/prim + SAHOL/KOZAL/ECZYT peer benchmark — sector_competition (rag+external) [P1]
7. Holding giderleri/NAV oranı + holding-seviyesi temettü getirisi — financial_analysis (rag+calc) [P2]
Evidence ağırlığı: 1×rag, 3×rag+calc, 2×rag+external, 1×rag-4fallback (toplam 7)
Banka çarpanı: P/BV; sanayi/enerji/otomotiv: EV/EBITDA. YKBNK BS düzeltmesi olmadan Net Borç raporlanamaz.
IFRS 8 fallback zinciri: KAP faaliyet raporu HTML → KAP segment bildirimi → şirket IR sunumu → fintables.com
ARCLK-Hitachi yapısal değişimi (Nisan 2026): efektif KCHOL sahipliği revize olmuş — external_research SQ-01 öncesi zorunlu.
Çift sayım koruması: SOTP'ta her alt şirket standalone değerlenmeli; konsolide EBITDA'dan hareket YASAK.
