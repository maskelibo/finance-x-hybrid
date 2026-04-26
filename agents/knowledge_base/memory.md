# Knowledge Base — memory.md

## Kurallar (permanent)

- Her sub_question için top-5 chunk al (relevance >= 0.50 filtresi).
- Snippet max 500 karakter, orijinal metin.
- doc_id + page bazında dedupe et (aynı sayfada birden fazla chunk varsa en yüksek relevance'ı tut).
- Collection yoksa `BLOCKED` dön; orchestrator downstream agent'ları skip edebilir.
- Bridge CLI timeout'ta 1 kez retry.

## KCHOL Sistematik Sorun — Kalıcı Uyarı (13 Ardışık Seans — 26 Nisan 2026 güncellendi)
- kap_primary_in_corpus=false → confidence_cap=MEDIUM kalıcı
- IAS29 monetary_gain, IFRS8 segment gelir/EBIT, holding-only Net Borç → daima rag_out_of_scope
- CF format: OCF=-101.9B + FCF=~-120B mevcut, işletme/yatırım/finansman split yok
- CEO + Chairman bildirimi zorunlu (3+ kural). Pipeline DUR tetiklendi.
- 5YR Revenue: FY2021:477,050 → FY2022:1,555,660 → FY2023:1,988,419 → FY2024:2,252,685 → FY2025:2,757,295 mn TRY
- SOTP NAV: Brüt=882B TRY, Piyasa=517B, İskonto=%39.5 (Koç Group efektif paylar)
- Blended NAV: 385-388 TL. Güncel fiyat 204 TL → %47.4 iskonto. Sensitivity: %35→252TL★baz
- Segment NI (FY2025): TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B

## Ticker-specific retrieval ipuçları

### ARCLK (24 Nisan 2026 — ilk run)
- **Altın kaynak:** `ARCLK_activity_report_20260219_1558676` (FY2025 faaliyet raporu, 19 Şubat 2026) — p.42-43 finansal göstergeler tablosu (gelir/FAVÖK/marj/net borç/capex tek sayfada), p.302 bilanço, p.310-311 CF, p.350 ticari alacak/borç, p.356 şerefiye, p.386-388 FX pozisyon tablosu.
- **IAS 29 fonksiyonel para birimi:** `ARCLK_financial_report_20260130_1550376` p.3 — TRY fonksiyonel (tam TMS 29). "Fonksiyonel para birimi yüksek enflasyonlu ekonomi" query kesin relevance verir.
- **Net Finansal Borç:** p.42 "Net Finansal Borç" query → FY2025: 127.578 mn TRY, FY2024: 102.613 mn TRY (+%24.3). Net Borç/EBITDA: 4.16x — DISTRESSED eşiği aşıldı.
- **FAVÖK verileri:** p.43 — FY2025 FAVÖK: 30.685 mn TRY / %5.8 marj. Düzeltilmiş FAVÖK: 30.247 mn / %5.9. Sektör %8-12 beklentisinin altında — kırmızı bayrak.
- **Şerefiye:** p.356 NOT 15 — FY2025: 10.672 mn TRY. Hitachi: %54.7. Değer düşüklüğü yok (sadece kur farkı). "Şerefiye goodwill" query p.356'yı direkt verir.
- **FX Pozisyon Tablosu:** p.386-387 NOT 35 — EUR/USD/GBP/RUB bazında ticari alacak, nakit, borç dökümü. Duyarlılık analizi p.388 (%10 kur hareketi → ±1.047 mn TRY USD etkisi).
- **IAS 29 parasal kazanç:** Corpus'ta yok — Not 2.1 dipnotundan okunmalı. "Parasal kazanç kayıp enflasyon" query yalnızca denetim metodolojisi döndürüyor, rakam yok. P0 bloker — escalation zorunlu.
- **PDF format notu:** p.42-43 grafik/tablo okuma — değerler (value1=FY2025, value2=FY2024) sırasıyla verilmiş, yıl etiketleri sonra geliyor. Doğrulama: Net Satışlar Değişim -%6.6 → 523.933(2025)/560.937(2024) = -%6.6 ✓.
- **Net Kâr:** FY2025: -9.799 mn TRY, FY2024: -2.889 mn TRY — iki yıl üst üste zarar. ROE: -%12.2 (FY2025).
- **Uluslararası gelir oranı:** FY2025 %67.6 (354.101 mn TRY). Türkiye: %32.4.
- **NOT 25 HASILAT (p.368):** Coğrafi gelir kırılımı için kesin kaynak. Sorgu: "yurt içi yurt dışı satış hasılatı coğrafi segment" → p.368 rel=0.935. FY2025: TR 169.832, Avrupa 256.630, AsPac 51.286, Afrika 26.067, Diğer 20.119 mn TRY. FY2024 karşılaştırmalı mevcut.
- **OCF Kaynağı:** `ARCLK_financial_report_20260130_1550376` p.13 — FY2025 OCF: 23.615 mn TRY, FY2024: 18.835 mn TRY. OCF/EBITDA: FY2025=%76.9, FY2024=%62.8.
- **CAPEX boşluğu:** p.311 CF tablosunda "Maddi ve maddi olmayan duran varlıkların alımı" satırı var ancak RAG snippet truncated — değer alınamadı. financial_analysis p.311 manuel okumalı.
- **Şerefiye (p.298 denetçi raporu):** FY2025 Şerefiye 10.671.568 bin TRY, Marka 15.230.900 bin TRY. Değer düşüklüğü tespit edilmemiş.
- **EBIT/Faiz karşılama KRİTİK:** FY2025 EBIT 6.995 mn / Faiz 26.353 mn = 0.27x. Distressed — faiz karşılanamıyor.
- **Toplam Varlıklar:** p.17 snippet truncated — goodwill/TA oranı hesaplanamadı. financial_analysis tam BS okuması yapmalı.
- **NOT 6 Finansal Borç (p.348):** FY2025 toplam finansal borç (vade analizi p.379): 224.825 mn TRY. Kiralama: 11.073 mn TRY. Net Borç (kiralama hariç) ≈ 115.923 mn TRY; (kiralama dahil) ≈ 126.996 mn TRY ≈ memory'deki 127.578 mn TRY ✓.
- **NOT 30 Finansman Giderleri (p.371):** FY2025: Faiz 26.353, Kur farkı gideri 10.616, Türev zarar 5.670, Toplam 47.636 mn TRY.

### EREGL (24 Nisan 2026 — güncellendi)
- **Altın kaynak:** `EREGL_Yonetim_Kurulu_Raporu_20260413` (FY-2026 board report) — tüm sub_question'ların %85'ine doğrudan yanıt veriyor; 5YR gelir tablosu (p.10), marj trendi (p.12-13), kaldıraç (p.15), FCF (p.17), peer karşılaştırma (p.22-23), CBAM/AB safeguard (p.25), izleme planı (p.35).
- **Net borç sorgusu:** "kaldıraç" + "net borç" içeren query p.15'i %100 relevance ile döndürüyor.
- **CBAM verisi:** board_report p.25 — 0.4-2.3B TRY efektif tahmin bandı (2026); uzun vadeli 490-626M EUR. AB safeguard -%47 kota, %50 tarife (1 Temmuz 2026).
- **CBAM-eligible hacim:** ~%10 satış hacmi [entegre_rapor 20260217_1557688 p.8]. Avrupa gelir payı %47.8 farklı metrik — karıştırma.
- **HRC/CRC spot fiyatları:** Collection'da emtia fiyat serisi YOK — external WebSearch zorunlu. RAG bu soruya yanıt veremiyor.
- **IAS 29 NI doğrulama:** `EREGL_financial_report_20260217_1557665` p.13 — 694,345 TRY bin (FY2025). FY2024: 14,193,046 bin. FY2023: 4,329,064 bin [20250212_1392292 p.13]. Board report p.5'te 511.8M = ana ortaklık payı (azınlık farkı var).
- **IAS29 Not 33:** FY2024-FY2023 monetary_gain Qdrant'ta yok. financial_analysis doğrudan okuma: EREGL_financial_report_20260217_1557665 (FY2025 Not 33) ve EREGL_financial_report_20250212_1392292 (FY2024 Not 33).
- **Net Nakit uyarısı:** 115.5B TRY nakit+ST yatırım > 42.9B TRY finansal borç → EREGL net nakit pozisyonunda. Board report "2.1x" = gross debt/EBITDA olabilir. reconciliation zorunlu.
- **Ton başı EBITDA:** Doğrudan tabloda yok — hesaplama: EBITDA 20,450mn / üretim 9.4mn ton ≈ 2,175 TRY/ton.
- **Kapasite kullanımı:** board_report p.8 — %84.7 (FY2025), ham çelik üretimi 9.4mn ton (+13.5% YoY).
- **Peer tablo:** board_report p.23 — ISDMR (ROE=%4.63, EV/EBITDA=9.17x), KCAER (ROE=%3.87, EV/EBITDA=7.74x), MT (ROE=%6.02, EV/EBITDA=12.94x). KRDMD/IZDMC ticker eşleştirmesini doğrula.
- **UNTRACKED:** EREGL_Yonetim_Kurulu_Raporu_20260423.pdf (1.79MB) Qdrant'ta indexlenmemiş — data_collection re-index gerekli.

### THYAO (24 Nisan 2026 — ilk run)
- **Altın kaynak:** `THYAO_V4_Final_20260417` (V4 Final, 17 Nisan 2026) — p.28 executive summary (24.1B USD gelir, 5.7B USD EBITDAR, 2.8B USD FCF [WebSearch]), p.32 aviation KPI tablosu (yolcu/LF/filo), p.39 EBITDAR marj trendi + borç analizi, p.48 veri kalite uyarıları (P0-1/P0-2 listesi).
- **Finansal data kaynağı:** `THYAO_Yonetim_Kurulu_Raporu_20260416` p.29 — FY2025: Gelirler 955,472 mn TRY [KAP 1565996], Net Kar 118,117 mn TRY, Özkaynak 911,222 mn TRY, Net Borç 585,851 mn TRY. Net marj %12.36-12.4.
- **P0 blokerleri hâlâ AÇIK:** `THYAO_Yonetim_Kurulu_Raporu_20260413` p.21 + V4_Final p.48 her ikisi de P0-1 (CF tablosu) ve P0-2 (SE 141B TRY gap) açık olduğunu teyit ediyor. Bu oturumda da çözümsüz kalıyor → data_collection P0 direktifi.
- **Yolcu/LF:** FY2025: 92.6M yolcu [WebSearch/aerotime.aero], LF %83.2 [WebSearch]; Mart 2026 LF %83.6 [KAP 1589738]; FY2024: 85.2M, LF %78-84. RPK/ASK kamuya açık değil.
- **CASK/RASK:** Corpus'ta yok — segment maliyet/gelir detayı kamuya açık değil. `rag_out_of_scope`. External IR/KAP/IATA zorunlu.
- **IAS29:** THYAO USD fonksiyonel para birimi (IFRS raporlaması USD bazlı). TRY IAS29 parasal kazanç mevcut değil — ARCLK/BIMAS/EREGL'den farklı. Downstream financial_analysis'e: IAS29 monetary gain TRY = N/A for THYAO.
- **Net Borç/EBITDAR:** ~1.36x [önceki rapor, orta güven]. EBITDA null → Net Borç/EBITDA hesaplanamıyor. IFRS16 kira ödemeleri: 82,311 mn TRY [KAP 1565996 s.17]. CAPEX: ~178 mn TRY (PPE+avans inference, KAP 1565996 s.17).
- **OCF çelişkisi:** 20260416 p.33 "Raporlanmadı (P0)" derken V4_Final_20260417 p.11 "OCF: 185,813 mn TRY" veriyor — güven düşük; KAP PDF doğrulama şart.
- **Peer:** 20260413 p.11 — THYAO FY2024: EBITDA marjı %18.3, LF %78-84, P/E 3.7x; Pegasus %28-30/%87.7; Ryanair %20-24/%95; Lufthansa %12-15/%84; AFR-KLM %10-14/%82.
- **Untracked yeni belgeler:** THYAO_Yonetim_Kurulu_Raporu_20260422 ve 20260423 (pdf+html) koleksiyona girmemiş → data_collection indexlemeli, bu run confidence max=MEDIUM.

### KCHOL (24 Nisan 2026 — üçüncü run, offline fix)
- **HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1**: cited_rag çağrıları arasında HF Hub rate-limit bağlantısı kesilince bu env var'ları ekle — model zaten cache'lenmiş, hub check'ini bypass eder. İlk 2 çağrı genellikle online geçer, sonrasında offline gerekir.
- **Yeni untracked**: KCHOL_Yonetim_Kurulu_Raporu_20260424.html + .pdf — her run başında git status kontrol; data_collection indexlemeli.
- **data_collection 13 KAP PDF**: Qdrant collection'a girmemiş (üçüncü kez aynı sorun). KB yapısal kural: cited_rag çağrısından önce collection'da hangi doc_id'lerin olduğunu doğrula; platform-derived only ise CEOya warn et.
- **5YR gelir tablosu (p.5 Raporu_2026)**: FY2021=477,050 / FY2022=1,555,660 / FY2023=1,988,419 / FY2024=2,252,685 / FY2025=2,757,295 mn TL. NI: 46,483 / 91,427 / 191,696 / 25,872 / 22,000.
- **YKBNK working capital etkisi (p.8 20260414)**: OCF -101.9B TL (YKBNK kredi büyümesi), FCF ~-120B TL, NWC -443B TL. Holding-only net borç hesabı KAP PDF gerekli.
- **IFRS 8 EBITDA 3. kez 0 chunk**: sadece segment NI var (p.6). Gerçek segment EBITDA kırılımı RAG'dan çekilemiyor — CEO P0-004 aktif.
- **Makro (p.13 20260414)**: TCMB %37, TÜFE %30.87, USD/TRY 44.70, Net FX rezerv $19B.

### KCHOL (24 Nisan 2026 — ilk run)
- **Altın kaynak:** `KCHOL_Yonetim_Kurulu_Raporu_20260414` (Finance X Platform önceki oturum raporu, 14 Nisan 2026) — p.3 yönetici özeti (NAV 385-388 TL / %47.4 iskonto), p.6 segment NI katkıları, p.7 finansal analiz (FY2025 gelir 2,760B TRY / FAVÖK 181.5B), p.8 working capital metrikleri, p.9 SOTP metodoloji, p.10 holding iskonto sensitivitesi, p.13 makro göstergeler, p.20 KAP olayları, p.21 risk matrisi, p.23 hedef fiyat (253 TL / HOLD), p.25 yapısal riskler.
- **İKİNCİ KAYNAK:** `KCHOL_Yonetim_Kurulu_Raporu_2026` (tarihsiz) — p.2 özet (NAV 882 Mly TL, piyasa değ 517 Mly), p.3 SOTP tablosu (TUPRS/YKBNK/FROTO/TOASO/ARCLK kote piyasa değerleri), p.5 5YR finansal tablo (FY2021-2025 hasılat+NI+marj trendi).
- **CORPUS KRİTİK UYARI:** Her iki doküman da Finance X Platform önceki oturum çıktısı — `KCHOL_Yonetim_Kurulu_Raporu_20260414` açıkça "Finance X Platform | Confidential" başlığı taşıyor. KAP/birincil kaynak YOK. Confidence max=MEDIUM (lokal platform çıktısı kullanıldı). data_collection öncelikli; bu chunk'lar sadece yapısal kanıt.
- **Q4/FY karışıklığı CORPUS'TA:** p.7 FY2024=752B TRY (YKBNK konsolidasyon öncesi Q4 2024 benzeri) vs p.5 5YR tablosu FY2024=2,252,685 mn TRY. İki farklı "FY2024" figürü — corpus içi çelişki. data_collection FY2025=2,757,295 mn TRY (5YR tablo) doğrulamalı.
- **SOTP sahiplik oranı farkı:** Corpus SOTP tablosunda TUPRS %51.2, YKBNK %68, ARCLK %53.5, FROTO ~%50 (Koç Group toplam efektif). Mandate'deki %40.5/29/14.5/38.5 = KCHOL legal entity doğrudan pay. p.5: "Efektif %40.5–44.8, doğrudan pay %26.2" notu — TUPRS için iki oranın tanımını netleştiriyor. SOTP hesabında hangi oranın kullanıldığı belirtilmeli.
- **Segment NI (IFRS 8 EBITDA DEĞİL):** p.6 — TUPRS +13.4B, FROTO +17.7B, Finans +4.2B, ARCLK -10.9B, Diğer -2.4B. Bunlar Net Kar katkısı, EBITDA değil. Gerçek IFRS 8 EBITDA = [VERİ YOK corpus'ta].
- **IAS 29:** "Denetim notları ile doğrulanmadı" — corpus'ta KCHOL IAS 29 monetary gain rakamı yok. financial_analysis p.5 not "IAS 29 tersine dönüş, ARCLK impairment, enerji one-time kalemler" → NI çöküşü açıklaması. Adj_ROE = [VERİ YOK RAG'dan].
- **Holding merkez gideri:** [VERİ YOK] — corpus'ta explicit central cost TL tutarı yok. SOTP blended hesaplamasında DDM 21 TL/hisse (Gordon Growth, %5 ağırlık).
- **NAV iskonto trend:** Mevcut %47.4 (14 Nis 2026) ekstrem; tarihi ort %20-30; SAHOL ~%25 (bull benchmark). FY2023/FY2024 tarihsel iskonto serisi corpus'ta yok.
- **İşletme sermayesi (p.8):** DIO 135gün [DÜŞÜK GÜVEN], DPO 189gün [DÜŞÜK GÜVEN], CCC -54gün, NWC -443B TL, OCF -101.9B (YKBNK konsolidasyonu), FCF ~-120B TL.
- **KAP olayları (p.20):** TUPRS satışı +9.32B TL (Mart 2026), ARCLK temettü yok (-10.9B zarar), FROTO temettü 3.64 TL brüt/hisse, YKBNK Q1 bilançosu 29 Nisan due.
- **Makro (p.13):** TCMB %37, TÜFE %30.87, USD/TRY 44.70, Net FX rezerv $19B (kritik).
- **Hedef fiyat (p.10/23):** Bear 170 TL / Base 252 TL / Bull 338 TL; ağırlıklı 253 TL; tavsiye HOLD.

### BIMAS (24 Nisan 2026 — ilk run)
- **Altın kaynak:** `BIMAS_Yonetim_Kurulu_Raporu_20260413` (board_report FY-2026, 13 Nisan 2026) — p.7 5YR gelir tablosu (FY2020-2024), p.8 CF analizi (OCF/CAPEX/FCF/Net Nakit), p.9 çalışma sermayesi yorumu, p.10 sektör/peer pazar payı, p.13 değerleme çarpanları (EV/EBITDA peer), p.14 makro bağlam, p.16 risk matrisi, p.18 yatırımcı profili.
- **FY2025 tam yıl kaynak:** `BIMAS_activity_report_20260311_1570151` (Q4-2025, 11 Mart 2026) — p.10 özet (721.1bn TRY satış, 43.5bn FAVÖK, %6 marj, 18.6bn net kâr), p.12 mağaza sayıları, p.18 bilanço tablosu, p.31 finansal sermaye.
- **5YR gelir tablosu:** board_report p.7 FY2020-2024; FY2025 için activity_report p.10/31 ekleme şart.
- **Mağaza sayıları FY2023-2025:** activity_report p.12 → Toplam 14,473/13,583/12,482. BİM Türkiye: 12,751/12,089/11,203.
- **IAS29 monetary gain/loss:** Corpus'ta rakam YOK — yalnızca denetim metodolojisi. P0-004 → escalation_to_CEO zorunlu. (ARCLK ile aynı pattern)
- **Net nakit pozisyonu FY2024:** +8,240 mn TRY (sıfır banka borcu) [board_report p.8].
- **FCF FY2024:** [CF ESTIMATED] — board_report p.21'de "KAP PDF doğrulama yapılmamış" notu var. P0-002 beklemede.
- **DSO/DIO/DPO tabloları:** Collection'da yok — KAP financial_report Not 7/8 gerekli.
- **Özel marka oranı:** FY2025 sonu %55 (hedef %55-60). "~65%" [STALE] olarak etiketlenmiş.
- **Peer:** board_report p.10 → SOKM %8.3/%2.6 (distressed), Migros ~%15/4.0-5.0. p.13 → EV/EBITDA BIMAS 10.4x vs medyan 11.1x (%6.3 iskonto).
- **Yeni untracked raporlar uyarısı:** 20260423.pdf ve 20260424.pdf collection'a girmemiş. Her BIMAS session'ında git status kontrol zorunlu.
