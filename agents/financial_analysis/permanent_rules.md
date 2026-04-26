# Financial Analysis Agent — Kalıcı Kurallar

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

## Bilinen Hatalar

- AKBNK-EREGL arasi 6+ raporda ayni eksikler tekrarlandi: working capital, cash flow, likidite metrikleri SIFIR
- Exit code 143 crash (KCHOL): Tum islemleri tek seferde calistirma — yuk bolunmeli
- TUPRS'ta Bolum 1-9 pipeline'a iletilmedi, sadece Bolum 10-11 gitti — TUM bolumler iletilmeli
- EBITDA celiskisi (TUPRS 62B vs 53.78B) cozulmeden rapor gonderildi — her iki degerle senaryo analizi zorunlu
- mandatory_metrics_complete: TRUE verip metrikler ciktida gorunmedi — yaniltici beyan YASAK
- Cash FAVOK hic hesaplanmadi (TUPRS) — FAVOK != Cash FAVOK, ayri hesapla

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*

## 2026-04-25 — Auto-promoted (repeat_count=3)

**Kural:** Pipeline üst düzey config'de ticker→sector mapping tutulmalı: THYAO→aviation, PGSUS→aviation. financial_analysis ve sector_competition bu map'i override olarak okumalı; engine'in sektör tahminine güvenmemeli. Conflict varsa config kazanır.

**Kaynak:** THYAO analizinde 3 kez tekrarlandı (sector='industrial' — THYAO havacılık şirketi. Sonuçları: (1) EBITDAR hesaplanmadı, (2) EBITDA eşiği yanlış (%10 industrial vs %15 aviation), (3) ROE benchmark yanlış, (4) Piotroski F skoru havacılık normlarıyla yorumlanamadı. sector_competition de aynı hatayı devraldı.)
