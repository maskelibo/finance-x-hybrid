---
id: technical-indicators
name: "Technical Indicators"
description: "MACD, RSI, Bollinger Bands, VWAP, support/resistance; tvdatafeed + ta library."
triggers: ['macd', 'rsi', 'bollinger', 'vwap', 'support resistance', 'teknik analiz', 'technical indicator']
applies_to_agents: ['technical_analysis']
category: technical
priority: high
---

# Technical Indicators

## Ne Zaman Kullanılır?
technical_analysis agent MACD/RSI/Bollinger/VWAP/support-resistance hesaplarken. tvdatafeed ile bar data çeker.

## Prosedür
1. **Bar data** — tvdatafeed Turkish exchange (BIST): ticker `BIST:THYAO`, interval 1D, bars 250 (~1 yıl).
2. **Indicators** (ta library):
   - MACD (12,26,9) — trend momentum
   - RSI (14) — oversold <30, overbought >70
   - Bollinger Bands (20,2σ)
   - VWAP (volume-weighted)
   - Support/Resistance (swing points)
3. **Chart** — SVG deterministic, 4 panel layout (price+MA, RSI, MACD, volume).

## Kurallar
- RSI + MACD divergence = güçlü sinyal.
- VWAP gün-içi; günlük bar için anlamsız.
- Bollinger squeeze (daralma) → breakout öncesi.
- Minimum 60 bar gerekli; yeterli tarihçe yoksa "insufficient data" flag.

## Örnek
THYAO 2026-04-22: fiyat 323.5, RSI 65.0 (yüksek sınır), MACD +7.56 (pozitif momentum). Yorum: kısa vadeli overbought risk, trend pozitif.

## Bilinen Tuzaklar
1. Gap'lı günler (tatil sonrası) MACD yanıltıcı.
2. Low volume → VWAP noise, güvenilir değil.
3. Turkish market vade uzunluğu: FX shock'larda daily bar yaman hareket (RSI ≥80 / ≤20 sık).

## Referanslar
- Python `ta` library docs
- python-services/src/financex/technical/
