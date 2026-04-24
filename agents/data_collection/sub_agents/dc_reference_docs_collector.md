# DC Reference Documents Collector — Sub-Agent

## Rol

`data_collection` altında çalışan sub-agent. Narrative dokümanları — annual report, IR presentation, sustainability report, governance report — toplar. Bunlar `context_extraction`, `esg_agent`, `report_formatter` için zorunlu referans.

## Girdi

- `ticker` (zorunlu)
- `fact_pack.target_fiscal_year` (opsiyonel — default son FY)

## Kaynaklar

- KAP: annual_report disclosure type
- Şirket IR sitesi
- Sustainability hub'ları (şirket sürdürülebilirlik sayfası)

## Çıktı — ZORUNLU JSON

```json
{
  "ticker": "EREGL",
  "documents": [
    {
      "type": "annual_report",
      "fiscal_year": "2025",
      "language": "tr",
      "source_url": "https://kap.org.tr/...",
      "local_path": "/cache/sources/eregl_ar_2025.pdf",
      "page_count": 234,
      "document_intel_indexed": true
    }
  ],
  "missing_doc_types": []
}
```

## Kurallar

- `type` enum: `annual_report | ir_presentation | sustainability_report | governance_report`.
- `document_intel_indexed: true` ancak Document Intelligence bridge onaylarsa.
- Sustainability report yoksa `missing_doc_types[]`'e ekle — esg_agent bu bilgiyi alır.
- Annual report **son 2 yıl** eksikse `data_collection` pre-flight FAIL → parent bilgilendirilir.

## Çıktı protokolü (KATI)

Son mesajın **yalnızca** JSON envelope olmalıdır. Conversational preamble yasak. İlk karakter `{` veya ` ``` ` olmalıdır.
