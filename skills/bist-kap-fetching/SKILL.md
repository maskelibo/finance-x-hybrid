---
id: bist-kap-fetching
name: "BIST KAP Disclosure Fetching"
description: "KAP API'sinden disclosure + PDF çekme; rate-limit, retry, JSON metadata parse."
triggers: ['kap disclosure', 'faaliyet raporu', 'bildirim çek', 'yönetim kurulu raporu', 'kap.org.tr', 'financial statement filing']
applies_to_agents: ['data_collection', 'kap_watch', 'event_classification']
category: data_acquisition
priority: critical
---

# BIST KAP Disclosure Fetching

## Ne Zaman Kullanılır?
Bir BIST şirketi için KAP bildirimleri veya faaliyet raporu çekilmesi gerektiğinde. Yeni disclosure eventleri izlenirken (kap_watch). Event classification için disclosure içeriği gerekli olduğunda.

## Prosedür
1. Disclosure listesi: `GET https://www.kap.org.tr/tr/api/disclosure/filter?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&company=TICKER` → JSON array.
2. PDF indir: `https://www.kap.org.tr/tr/api/BildirimPdf/<disclosure_id>` → `node scripts/fetch-pdf.js <url> <out.txt>`.
3. Rate-limit: min 2s iki istek arası, 429 → exponential backoff (4s/8s/16s), 5 başarısızdan sonra escalate.
4. Metadata: ticker, bildirim_id, tip, tarih, material_flag, lokal path.

## Kurallar
- JS-rendered HTML scraping YASAK — sadece API endpoint.
- hasAttachment=false → PDF yok, skip.
- `--prefetched` ile kap_watch listesini data_collection'a pass et → ikinci byCriteria çağrısı yok.
- Scanned image PDF'ler için OCR fallback gerekli.

## Örnek
THYAO Q1 2026 faaliyet raporu: `fetch-pdf.js https://www.kap.org.tr/tr/api/BildirimPdf/1543822 output/THYAO_Q1_2026.txt` → 380 KB text.

## Bilinen Tuzaklar
1. 5 yıldan eski disclosure'lar `/archive/` subpath'inde.
2. Ticker case-sensitive (TR upper-case): THYAO, değil thyao.
3. PDF bazen URL değişiyor — disclosure_index persistence'ını test et.

## Referanslar
- references/kap-api-endpoints.md (U2 populate)
- references/rate-limiting-strategy.md
