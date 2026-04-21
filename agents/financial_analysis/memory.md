# Financial Analysis Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **28 zorunlu metrik eksikse output GONDERME.** Bir metrik bile eksik = REJECT.
- **"Veri yok" mazereti YASAK.** Sira: (1) Reconciled data, (2) Parse output, (3) KAP WebFetch, (4) Upstream escalation, (5) CEO'ya escalate. Tum yollar tukenmeden gecme.
- **Her rasyo icin: Formula -> Benchmark -> Trend -> Interpretation.** Sadece sayi yazmak YASAK.
- **Her tablo sonrasi 3-5 cumle yorum paragrafi ZORUNLU.** Yorum yoksa tablo = gecersiz. 4 cumle yapisi: Metrik+Degisim -> Neden -> Karsilastirma -> Ne Anlama Geliyor.
- **Confidence Level durustlugu:** Coverage eksikse HIGH beyan edilemez.
- **Sektor benchmark zorunlu:** Her rasyo icin sektor ortalamasiyla karsilastirma.
- **Upstream veri uyusmazliginda ikili senaryo analizi:** Parse vs dogrulanmis veri icin ayri hesapla.
- **mandatory_metrics_complete: TRUE kriterleri:** Hesaplandi + ciktida gorunur + formul gosterildi — ucu birlikte saglanmadan TRUE verilemez.
- **Cikti truncation YASAK:** Uzunsa Core Metrics (tam analiz) + Supplementary (ozet) + Detail JSON appendix olarak bol.
- **Holding sirketi = UC KATMANLI ANALIZ:** (1) Parent-level, (2) Konsolide, (3) Segment-level.
- **Pre-flight check sistemi:** 4 asamali kontrol — metrik taramasi, cash flow tamlik, yorum kalitesi, matematiksel tutarlilik.

## Zorunlu Kontrol Listesi

**28 Zorunlu Metrik (bir eksik = REJECT):**
- A. Gelir: Net Satislar, Brut Kar, Brut Karlilik, Brut Kar IAS29, Brut Kar Orani IAS29, Parasal Kayip/Kazanc, FAVOK, FAVOK Orani, VOK, Net Donem Kari, OPEX/Ciro
- B. Isletme Sermayesi: DSO, DIO, DPO, CCC, NWC/Hasilat
- C. Borc/Likidite: Net Kredi, Net Borc/FAVOK, Cari Oran, Asit-Test
- D. Nakit Akisi: FCF, OCF/FAVOK, FAVOK/Faiz Gideri, FCF/Faiz Odemesi
- E. Karlilik: ROE, ROCE
- F. Yatirim: CAPEX/FAVOK, Faiz Gideri/FAVOK

**Cash Flow 7 Alt Bolum:** (A) Nakit Akisi Tablosu Ozeti 5Y, (B) OCF Detayli, (C) FCF Detayli, (D) Cash FAVOK vs Reported, (E) WC Changes Breakdown, (F) Nakit Bazli Borc Servis, (G) Cash Flow Red Flags (7 madde)

**Sektor-Ozel Ek Metrikler:**
- Banka: Cost of Risk trend, NIM decomposition, fee income breakdown, capital ratio waterfall, distributable cash, BDDK CAR %12 minimum
- Telekom: ARPU trend 5Y, churn rate, SAC vs LTV, CAPEX intensity, 5G ARPU premium, spectrum amortization
- Celik: DIO vurgulu, buyume vs idame CAPEX ayrimi, hammadde maliyet gecirgenlik orani
- Holding: Segment bazli ROIC/FAVOK margin/Net Debt/FAVOK + NAV hesabi + holding discount analizi

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **6/28 metrik — %79 eksik** — mandatory_metrics_complete: FALSE. EBITDAR, FCF, OCF, ROIC, DSO/DIO/DPO/CCC, NWC/Revenue ve daha fazlası null. Bu oran havacılık analizini temelsiz bırakır.
- **EBITDAR null — 3. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null iken EBITDAR = EBITDA + Kira Gideri; IFRS 16 kira gideri context'ten çekilip proxy EBITDAR üretilebilirdi.
- **Sektör "industrial" — cascade etkisi** — sector_competition ve QA bunu aynen aldı. Ticker-based mapping (THYAO → aviation) uygulanmadı.
- **DSO/DIO/DPO engine_snapshot'ta var ama metrics_array'de yok** — DSO=17.25, DIO=18.66, DPO=35.39 hesaplandı ✓ ama zorunlu metrik listesine dahil edilmedi.
- **ROE %13 ile TRY CoE ~%30 karşılaştırması yapılmadı** — ROE < CoE → değer yıkımı. Bu fundamental bulgu havacılık çerçevesinde yorumlanmadı.

### Bundan Sonra:
- **EBITDAR proxy hesabı** — EBITDA null ise: Operating Income + D&A proxy (sektör) + Kira Gideri (IFRS 16 dipnotu veya context) = EBITDAR. `[conf: MEDIUM, tahmin]` etiketle; null bırakma.
- **DSO/DIO/DPO engine_snapshot'tan metrics_array'e taşı** — Hesaplandıysa görünür olmalı; Chairman metrik listesi bunu zorunlu kılıyor.
- **ROE < CoE bulgusu zorunlu yorum** — ROE ile TRY sermaye maliyeti (~%25-30) karşılaştırması; "değer yıkıyor" veya "eşiğe yakın" yorumu narrative'de zorunlu.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK-EREGL arasi 6+ raporda ayni eksikler tekrarlandi: working capital, cash flow, likidite metrikleri SIFIR
- Exit code 143 crash (KCHOL): Tum islemleri tek seferde calistirma — yuk bolunmeli
- TUPRS'ta Bolum 1-9 pipeline'a iletilmedi, sadece Bolum 10-11 gitti — TUM bolumler iletilmeli
- EBITDA celiskisi (TUPRS 62B vs 53.78B) cozulmeden rapor gonderildi — her iki degerle senaryo analizi zorunlu
- mandatory_metrics_complete: TRUE verip metrikler ciktida gorunmedi — yaniltici beyan YASAK

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Yalnızca 7/28 metrik üretildi (%75 eksik)** — mandatory_metrics_complete: FALSE. EBITDA_MARGIN, FCF, ROIC, DSO/DIO/DPO/CCC, NWC/Revenue, IAS29 adjusted metrikler, savunma KPI'ları tümü null veya eksik.
- **Sektör = "industrial" — ASELS için de yanlış** — ASELS açıkça savunma elektroniği; "industrial" fallback sector_competition'a yanlış sektör verdi ve peer_group [] sonucuna yol açtı.
- **DSO/DIO/DPO engine_snapshot'ta hesaplandı ama metrics_array'de görünmüyor** — THYAO dersinin aynısı ASELS'te tekrarlandı. Hesaplandıysa görünür olmalı.
- **Savunma KPI'ları tamamen eksik** — Backlog/Revenue, AR-GE harcaması/ciro, ihracat oranı, CCC 390.95 gün savunma sektörü benchmarkıyla karşılaştırılmadı (sektör ort. ~180-270 gün; 390 gün yüksek).
- **EBITDA null zinciri çözülmeden üretildi** — D&A parse'dan gelmiyor; EBITDA proxy üretilmedi ve "EBITDA NULL — D&A eksik" escalasyonu tetiklenmedi.
- **IAS 29 ayrıştırması yapılmadı** — ASELS Turkish GAAP/IAS 29 kapsamında; nominal Net Kar vs IAS 29 adjusted Net Kar karşılaştırması yoktu.

### Bundan Sonra:
- **Savunma sektörü zorunlu ek metrikler (her savunma analizinde):**
  1. Backlog/Revenue oranı (sipariş görünürlüğü)
  2. AR-GE harcaması/ciro % (maliyet yapısı ve rekabet avantajı)
  3. İhracat gelirleri/toplam ciro % (FX pozisyonu ve büyüme trendi)
  4. CCC savunma sektörü benchmark karşılaştırması (normal: ~180-270 gün)
- **Sektör override savunma şirketleri için zorunlu** — ASELS/ASELSAN, ROKET, FNSS → "defense_electronics" veya "defense". "industrial" fallback kabul edilmez.
- **DSO/DIO/DPO engine_snapshot'ta varsa metrics_array'e de ekle** — 3. direktif; artık hard kural.
- Cash FAVOK hic hesaplanmadi (TUPRS) — FAVOK != Cash FAVOK, ayri hesapla

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **6/28 metrik (%21 tamamlama) — 5. THYAO analizi, sistematik arıza** — Üretilen: GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. Geri kalan 22 metrik null.
- **EBITDAR null — 5. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null → EBITDAR proxy bile üretilmedi.
- **Sektör "industrial" — 5. THYAO analizi, sistematik arıza** — THYAO = aviation; "industrial" fallback 5 analizdir düzeltilmedi. Upstream override yapılmadan çalışılamaz.
- **DSO/DIO/DPO engine_snapshot'ta hesaplandı ama metrics[] dizisine eklenmedi — 4. THYAO** — Chairman metrik listesinde zorunlu; hesaplandı ama görünmüyor.
- **ROE %12.96 TRY CoE ile karşılaştırılmadı** — TRY sermaye maliyeti ~%28-30; ROE < CoE = değer imhası yorumu yapılmadı.
- **Havacılık KPI (CASK/RASK/LF/RPK/ASK) hesaplanmadı** — Context_extraction'dan dahi alınabilirdi; 5 analizdir eksik.
- **IAS 29 adjusted metrikler yok** — Türkiye'de zorunlu; THYAO USD ağırlıklı olsa da ayrıştırılmadı.

### Bundan Sonra:
- **EBITDAR proxy zorunlu (5. direktif, tolerans sıfır)** — EBITDA null ise: Operating Income + D&A sektör proxy (%15-18 of Revenue) + IFRS16 kira = EBITDAR [conf: MEDIUM]. Null → metrics array'de "[EBITDAR NULL — D&A eksik, eskalasyon tetiklendi]".
- **Sektör override başlangıç adımı** — THYAO/PEGYS/ONUIR → sector = "aviation" hard-coded; upstream ne gelirse gelsin. "industrial" fallback YASAK.
- **metrics array = engine_snapshot ile eşit** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine de eklenir. DSO/DIO/DPO/CCC bu listeye zorunlu dahil.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
