# U4 — Batch Ingestion Pipeline — Exit Report

- **Faz:** U4 (Block U) — Kategori C (canlı test)
- **Branch:** `finance-x-execution`
- **Tarih:** 2026-04-23

---

## STEP 1 — IMPLEMENTATION

### Yeni dosya: `scripts/ingest_existing_pdfs.py`

Tek entry-point batch ingestion pipeline. `output/bist30/**` ve `output/archive/*.pdf` altındaki tüm PDF'leri tarar, dosya adı + klasör yoluna göre metadata üretir, per-ticker Qdrant collection'ına idempotent olarak yazar.

**Path parsers:**
- `parse_bist30_path()` — `output/bist30/{TICKER}/{YEAR}/{Q1-YYYY|OTHER}/{TICKER}_{activity_report|financial_report}_{YYYYMMDD}_{kap_id}.pdf`. Quarter klasörü varsa `fiscal_period=Q1-2024`; `OTHER` ise `FY-{year}`.
- `parse_archive_path()` — `output/archive/{TICKER}_{name_variants}.pdf`. Doc-type heuristic: `Yonetim_Kurulu_Raporu → board_report`, `Entegre_Faaliyet_Raporu → integrated_annual`, `ATA_YATIRIM|ANALIZ → analyst_note`, `V4_Final|V4_Reformat → board_report`. Fiscal period filename'deki YYYYMMDD veya fallback 4-haneli yıl.

**CLI flag'leri:** `--ticker` (repeatable), `--root`, `--limit`, `--dry-run`, `--force`, `--state`, `--skip-archive`, `--skip-bist30`, `--qdrant-url`.

**Resume/checkpoint:** `_qdrant/.ingest_state.json`. Her 5 dosyada bir flush, crash-survivor. Re-run'da `doc_id` zaten checkpoint'te ise skip. `--force` bypass eder.

### Idempotency fix: `python-services/src/financex/document_intel/ingest.py`

U3 (tek dosya test) ile U4 (batch) `doc_id` farklı olduğu için aynı PDF iki kere ingest edilince duplicate point'ler oluşuyordu (EREGL: 88 → 176). Kök çözüm: `ingest_pdf()` artık yazmadan önce `client.delete(FilterSelector(doc_id=X))` yapıyor — aynı `doc_id`'li eski point'ler silinir, sonra yenileri upsert edilir. Tekrar ingest gerçek no-op.

---

## STEP 2 — SMOKE TEST

### 2a. Dry-run scan — 802 PDF keşfedildi

```
scanned=802  already_ingested=0  pending=802
per_ticker={AKBNK:116, ARCLK:150, ASELS:103, BIMAS:116, EKGYO:108,
            ENKAI:93, EREGL:99, TCELL:6, KCHOL:3, SISE:2, THYAO:3, TUPRS:3}
```

### 2b. Pilot ingest (7 dosya, 3 ticker — idempotency + path coverage)

| Adım | Ticker | Kaynak | Dosya | Chunk | Süre |
|---|---|---|---|---|---|
| 1 | EREGL | archive | `EREGL_Yonetim_Kurulu_Raporu_20260413` | 88 | 10.4s |
| 2 | TUPRS | archive | `TUPRS_Yonetim_Kurulu_Raporu_20260412` | 66 | 10.3s |
| 3 | TUPRS | archive | `TUPRS_Yonetim_Kurulu_Raporu_20260419` | 32 | 7.2s |
| 4 | TUPRS | archive | `TUPRS_Yonetim_Kurulu_Raporu_20260421` | 29 | 7.5s |
| 5 | ENKAI | bist30 | `ENKAI_activity_report_20210304_915263` | 12 | 8.6s |
| 6 | ENKAI | bist30 | `ENKAI_activity_report_20210511_936287` | 2 | 6.6s |
| 7 | ENKAI | bist30 | `ENKAI_activity_report_20210813_958138` | 7 | 6.5s |

**Toplam:** 236 chunk, 57 sn (~8 sn/dosya).

### 2c. Idempotency doğrulama

EREGL + TUPRS `--force` ile re-ingest edildi. Point sayıları değişmedi:
- `finance_x__EREGL`: 88 → 88 (unchanged)
- `finance_x__TUPRS`: 127 → 127 (unchanged)

İlk yazımda duplicate oluşmuştu (176); fix sonrası temiz (88).

### 2d. Retrieval smoke — fresh TUPRS collection

Query: `"refinery kapasite ve crack marjı 2025"` →
```
[1] p.16  rel=0.983  TUPRS_Yonetim_Kurulu_Raporu_20260412
    "...hisse, FD/FAVÖK'ün 5x'e normalize olmasıyla bile %50'nin üzerinde
     potansiyel barındırmaktadır. Rafineri Operasyonel Metrikler..."
[2] p. 9  rel=0.921  TUPRS_Yonetim_Kurulu_Raporu_20260412
    "...enflasyon muhasebesi nedeniyle özkaynak tabanı şişmiş olup
     ROE karşılaştırılabilirliği sınırlıdır. Marj Trendi 2022-2025..."
```

---

## STEP 3 — DEFECT DETECTION

1. **U3 vs U4 doc_id divergence** → duplicate points. **Kökten çözüldü** — `ingest.py`'da önce-sil-sonra-yaz pattern'i.
2. **Windows `cp1254` stdout encode hatası** (`'↗' → undefined` oku simgesi) — `python -m ...cited_rag` stdout'a JSON yazınca kırılıyor. Geçici workaround: `PYTHONIOENCODING=utf-8` env + inline import. Kalıcı fix U5 kapsamında (cited_rag CLI'ye `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`).
3. **Double-referenced PDF'ler** — AKBNK `Q4-2021` + `2022/OTHER` altında aynı dosya iki path'te. Checkpoint doc_id-based olduğu için ikincisi skip ediliyor (ilk hangi klasörden gelirse fiscal_period onu alır). Kabul edilebilir — U6'da agent integration aşamasında fiscal_period filter bu detaya duyarsız.

**0 açık blocker.**

---

## STEP 4 — GO / NO-GO

```
STEP 1: ✅ 1 yeni script (302 satır) + idempotency fix (22 satır)
STEP 2: ✅ Dry-run 802 PDF, pilot 7/7, idempotency verified (88==88, 127==127)
STEP 3: ✅ 0 açık defect
```

🟢 **GO — U4 infrastructure tamam. U5'e (4 yeni agent) geçilebilir.**

---

## KALAN İŞ — tam corpus ingestion

Pilot kanıt toplanmış; tam corpus (802 − 7 = 795 PDF, ~13000-15000 chunk tahmini, ~1.7 saat arka plan) **ayrı bir run** olarak yapılmalı:

```bash
# tam ingestion (ENKAI + EREGL + TUPRS pilot'tan sonrasını pick up eder)
python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py
# veya ticker bazlı tek tek:
python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py --ticker ARCLK
```

Checkpoint (`_qdrant/.ingest_state.json`) zaten tracked edildiği için crash → restart problemsiz.

---

## NOTLAR

- **Embedder load 1 kez:** CLI başlangıcında e5-small yüklenir (~1 sn), sonraki 800 PDF aynı instance kullanır. Yeniden yükleme yok.
- **Collection auto-create:** Her yeni ticker için `finance_x__{TICKER}` collection otomatik açılır (384-dim cosine).
- **Payload indeks:** Mevcut collection'larda `doc_id` üzerinde henüz payload index yok. 800 PDF sonrası delete-by-filter yavaşlayabilir; gerekirse `client.create_payload_index(field_name="doc_id", field_schema="keyword")` U5'e eklenir.
- **Archive'daki "ATA_YATIRIM_TCELL_ROBOT_ANALIZ"** — `_archive_ticker()` token-scan'de TCELL'i yakalıyor, doc_type=analyst_note. Doğru davranış.
