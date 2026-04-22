---
id: brand-identity-extraction
name: "Brand Identity Extraction"
description: "Sirket logo/renk/font/CSS identity cikarimi; theme preset integrasyonu."
triggers: ['brand identity', 'logo', 'kurumsal renk', 'css theme', 'marka kimlik']
applies_to_agents: ['context_extraction', 'report_formatter']
category: report_format
priority: medium
---

# Brand Identity Extraction

## Ne Zaman Kullanılır?
context_extraction agent şirket kurumsal kimliğini çıkarırken. report_formatter theme preset uygularken.

## Prosedür
1. Şirket web sitesinden CSS variables çek (primary color, logo font).
2. Eğer yoksa annual report PDF'te logo renk + typography detect.
3. JSON schema:
```json
{
  "primary_color": "#C41E3A",
  "secondary_color": "#1A365D",
  "logo_url": "...",
  "font_family": "Open Sans",
  "theme_preset": "institutional"
}
```
4. Report formatter CSS `:root` variables'a inject.

## Kurallar
- 3 theme preset: `institutional`, `anthropic`, `minimal`.
- Brand default `institutional` eğer brand detection başarısız.
- Logo aspect ratio preserve (max 200×80).
- Color accessibility: primary vs arka plan contrast ≥ 4.5:1 (WCAG AA).

## Örnek
THYAO: primary `#E10600` (red), secondary `#1B1D29`, logo `thy-logo.svg`, theme `institutional`.

## Bilinen Tuzaklar
1. PDF'teki logo imajı düşük çözünürlük → vektör için web scrape.
2. Bazı markalar CMYK'dan RGB'ye convert hatası → renk sapması.
3. Global marka lokal logo farklı (Coca Cola TR vs global).

## Referanslar
- templates/report_base.html CSS variable section
