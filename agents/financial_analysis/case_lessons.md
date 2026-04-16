# Financial Analysis Agent — Vaka Bazlı Dersler (Katman 2b)

> Önceki analizlerden CEO geri bildirimi ve vaka bazlı öğrenimler.
> Aynı şirketi veya benzer sektörü analiz ederken `Read` ile aç.

---

## CEO Geri Bildirimi — THYAO Raporu

### Eksikler:
- DSO, DIO, DPO, CCC, FCF, CAPEX/EBITDA, ROCE tamamen BLOCKED — CF tablosu olmadan hesaplanamadı.
- THYAO financial_analysis çıktısı yerine strategic_synthesis çıktısı iletildi — output yönlendirme hatası.
- IAS 29 parasal kazanç ayrıştırması yok.
- Havacılık sektörü ek metrikleri eksik — RPK, ASK, CASK, RASK, Yield, doluluk oranı, yakıt maliyet oranı.
- EBITDAR hesaplanmadı — Havacılıkta EBITDA yerine EBITDAR birincil metrik (IFRS 16).

### Havacılık kuralları:
- EBITDAR zorunlu (EBITDA + Lease). Peer karşılaştırması EBITDAR bazlı.
- Havacılık KPI'ları zorunlu: RPK, ASK, Load Factor, CASK, RASK, Yield, kargo ton-km.
- CF olmadan WC metrikleri "BLOCKED" olarak işaretle, tahmin üretme.
- EBITDAR marj benchmark: THYAO 2025 %23.2, global sektör ort. %16.1 (IATA).
- CASK US¢8.55, RASK US¢7.21, global load factor %83.6 referans.

---

## CEO Geri Bildirimi — BIMAS Raporu

### Eksikler:
- Output truncated — ROE yorumu yarıda kesildi.
- DSO, DIO, DPO, CCC tamamen BLOCKED — perakendede CCC kritik.
- Cari Oran ve Asit-Test çıktıda görünmüyor — BS mevcuttu, hesaplanabilirdi.
- NWC/Hasılat oranı eksik. OCF/FAVÖK eksik. CAPEX/EBITDA %81.9 yorumu eksik.

### Perakende kuralları:
- 4 ek metrik zorunlu: SSSG katkısı, Revenue per Store, Gross Margin by segment, IFRS 16 normalize FAVÖK.
- BS mevcutsa Cari Oran + Asit-Test HER ZAMAN hesapla — CF bloker değil.
- NWC/Hasılat BS'ten hesaplanabilir: NWC = (Cari Varlıklar - Cari Borçlar - KV Finansal Borçlar).

---

## CEO Geri Bildirimi — KCHOL Delta Raporu

### Eksikler:
- Revenue Q4/FY karışıklığı Round 2'de de sürdü — 802.669B = Q4, FY = 2.76T TRY.
- Revenue anomalisi sorgulanmadı — 3.4x fark görülünce dönem tanımı kontrol edilmedi.
- DSO tamamen BLOCKED, tahmin bile üretilmedi.
- COGS tahmini %70 gerekçesiz. IAS 29 ayrıştırması yapılmadı. 3 katlı analiz eksik.

### Holding kuralları:
- Revenue anomalisini her zaman sorgula — önceki dönemle >%50 sapma → dönem kontrolü mandatory.
- Holding gelir tablosunda 3 katman: Solo/Parent + Konsolide + Segment.
- DSO blocked olsa bile sector proxy ver — sıfır bırakma.

---

## CEO Geri Bildirimi — SAHOL Raporu

### Eksikler:
- DSO, DIO, DPO, CCC, NWC/Hasılat, Faiz Karşılama, Cari Oran, Asit-Test, ROCE, ROIC, Cash FAVÖK eksik.
- Bölüm 5 (IAS29 ROE tablosu) truncated.
- 5 yıllık IS trendi sadece 2 yıl.

### Kurallar:
- Chairman'ın 25 metrik listesi her analizde kontrol listesi olarak kullanılacak.
- WC metrikleri upstream eksik olsa bile BS'ten hesaplanacak.
- Bölüm truncation = output geçersiz. İkiye böl, yarım bölüm YASAK.

---

## Sektör Bilgi Bankası (Aktif Şirket Referansları)

**BIST değerleme (Nisan 2026):** P/E ~8-10x (tarihsel ortalama altı).
- TUPRS: Bear 110 / Baz 220 / Bull 325 TL (Mevcut ~254.50)
- THYAO: Bear 220 / Baz 550 / Bull 1,000 TRY (Mevcut ~316.75)
- KCHOL: Bear 170 / Baz 252 / Bull 338 TL (Mevcut ~204)
- SAHOL: Bear 108 / Baz 131 / Bull 155 TL (Mevcut ~89.30)
- ASTOR: Bear 140 / Baz 220 / Bull 265 TL (Mevcut ~203.50)

---

*Dosya sahibi: Financial Analysis Agent | Güncelleyen: CEO Feedback Loop*
