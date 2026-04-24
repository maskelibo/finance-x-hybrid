# Knowledge Base — memory.md

## Kurallar (permanent)

- Her sub_question için top-5 chunk al (relevance >= 0.50 filtresi).
- Snippet max 500 karakter, orijinal metin.
- doc_id + page bazında dedupe et (aynı sayfada birden fazla chunk varsa en yüksek relevance'ı tut).
- Collection yoksa `BLOCKED` dön; orchestrator downstream agent'ları skip edebilir.
- Bridge CLI timeout'ta 1 kez retry.

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

### EREGL (23 Nisan 2026 — güncellendi)
- **Altın kaynak:** `EREGL_Yonetim_Kurulu_Raporu_20260413` (FY-2026 board report) — tüm sub_question'ların %85'ine doğrudan yanıt veriyor; 5YR gelir tablosu (p.10), marj trendi (p.12-13), kaldıraç (p.15), FCF (p.17), peer karşılaştırma (p.22-23), CBAM/AB safeguard (p.25), izleme planı (p.35).
- **Net borç sorgusu:** "kaldıraç" + "net borç" içeren query p.15'i %100 relevance ile döndürüyor.
- **CBAM verisi:** board_report p.25 — 0.4-2.3B TRY efektif tahmin bandı (2026); uzun vadeli 490-626M EUR.
- **HRC/CRC spot fiyatları:** Collection'da emtia fiyat serisi YOK — external WebSearch zorunlu. RAG bu soruya yanıt veremiyor.
- **IAS 29 NI doğrulama:** `EREGL_financial_report_20260217_1557665` p.13 — 694,345 TRY bin (FY2025 tam yıl konsolide). Board report p.5'te 511.8M TRY = ana ortaklık payı (azınlık farkı var, dikkat).
- **Ton başı EBITDA:** Doğrudan tabloda yok — hesaplama: EBITDA 20,450mn / üretim 9.4mn ton ≈ 2,175 TRY/ton.
- **Kapasite kullanımı:** board_report p.8 — %84.7 (FY2025), ham çelik üretimi 9.4mn ton (+13.5% YoY).
