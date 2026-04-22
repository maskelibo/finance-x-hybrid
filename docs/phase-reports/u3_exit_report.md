# U3 — Document Intelligence Foundation — Exit Report

- **Faz:** U3 (Block U) — Kategori C (tam canlı test)
- **Branch:** `finance-x-execution`
- **Commit:** `10232b59`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

### İnfra (Docker-less hybrid)
- **Qdrant v1.17.1** Windows binary (`qdrant-x86_64-pc-windows-msvc.zip`, 28 MB) `_qdrant/` altına yerleşti, `localhost:6333` REST + `6334` gRPC.
- **Python deps**: `qdrant-client 1.17.1`, `sentence-transformers 5.4.1`, `torch 2.11.0`, `transformers 5.6.0` (pip install python-services/.venv).
- **Local embedder**: `intfloat/multilingual-e5-small` (118 MB, 384-dim, Turkish-capable) — first run HuggingFace Hub'dan indirir, sonra cache.

### Yeni modül: `python-services/src/financex/document_intel/`
| Dosya | İçerik |
|---|---|
| `embedding.py` | `EmbeddingProvider` Protocol + `LocalE5Embedder` (default) + `OpenAIEmbedder` (EMBEDDING_PROVIDER=openai ile aktif); `get_default_embedder()` factory. |
| `ingest.py` | `parse_pdf` (fitz/PyMuPDF + sentence sliding chunker + section heuristic), `ingest_pdf` (collection ensure + batch embed + Qdrant upsert). |
| `retriever.py` | `retrieve()` — `client.query_points()` (v1.17 API) + custom lightweight BM25 (k1=1.5, b=0.75) + 70/30 vector/BM25 blend. |
| `cited_rag.py` | `query_company_knowledge()` + `EvidencePack`; CLI entry `python -m financex.document_intel.cited_rag TICKER QUESTION`. |
| `__init__.py` | Public exports. |

### Node bridge
- `backend/src/document-intel/bridge.ts` — `queryCompanyKnowledge()` Python spawn (UTF-8 stdio, PYTHONPATH, 60s timeout) + `formatEvidenceForAgent()` prompt helper.
- `backend/src/config.ts`: `DOCUMENT_INTEL_ENABLED` (true), `QDRANT_URL` (`http://localhost:6333`), `EMBEDDING_PROVIDER` (`local`|`openai`).

---

## STEP 2 — SMOKE TEST

- Backend `npx tsc --noEmit` → ✅ Exit 0
- Qdrant REST ping → ✅ `{"title":"qdrant","version":"1.17.1"}`
- Embedder smoke → ✅ 384-dim vector, 118 MB model yüklendi

---

## STEP 3 — LIVE BENCHMARK (Kategori C)

### Ingestion
- `EREGL_Yonetim_Kurulu_Raporu_20260413.pdf` (3.4 MB, 37 sayfa) → **88 chunk** Qdrant collection `finance_x__EREGL`'e upsert.
- Embedder: `local:intfloat/multilingual-e5-small`. Süre: ~15 sn.

### Acceptance test (`scripts/u3-rag-acceptance.ts`)

5 farklı EREGL sorusu, her biri top-5 chunk döndürmeli, relevance@1 ≥ 0.60, top-3 snippets'ta beklenen keyword'lerin ≥1'i olmalı.

| Soru | Top relevance | Keyword hits / toplam |
|---|---|---|
| "HRC spread ve çelik marjı 2025" | **0.997** | 1/4 |
| "EBITDA marjı 2025" | **1.000** | 3/3 |
| "Net borç EBITDA oranı" | **1.000** | 3/3 |
| "CBAM karbon düzenlemesi etkisi" | **0.984** | 2/3 |
| "Demir cevheri maliyet yapısı" | **1.000** | 2/3 |

**Toplam: 16/16 assertion pass, avg top-1 relevance = 0.996** (master spec threshold 0.60).

### Retrieval kalitesi örneği
Query: "EBITDA marjı 2025" →
> Top hit (relevance 1.000, p.12): *"Brüt Marj %16.1 %19.7 %16.5 %9.8 %8.9, EBITDA Marjı %15.1 %16.1 %10.5 %10.3 %9.8, Net Marj %4.9 %10.9 %2.7 %6.6 %0.25... Brüt marjın 2025'te %8.9'a, EBITDA marjının %9.8'e inmesi..."*

Sayısal değerler doğru (EBITDA %9.8 2025), metin sağlam, page/section citation mevcut.

---

## STEP 4 — DEFECT DETECTION

1. **Qdrant client API upgrade** — `client.search()` → `client.query_points()` (v1.17 breaking change). retriever.py güncellendi.
2. **Terminal cp1254 rendering** — CLI JSON output Türkçe karakterleri git-bash terminal'de `�` olarak gösteriyor. Kaynak JSON UTF-8 (ensure_ascii=False), Qdrant payload doğru — sadece display issue. Bridge.ts'in parse ettiği data sağlam; eski bir infra-fix (PYTHONIOENCODING=utf-8) zaten aktif.
3. **HuggingFace cache symlink warning** — Windows non-admin user için Dev Mode gerekir; impact yok, sadece disk space inefficient.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 5 Python module + 1 Node bridge + 3 config flag + 1 acceptance test
STEP 2: ✅ typecheck green + Qdrant ping OK
STEP 3: ✅ 16/16 acceptance (avg relevance 0.996 > 0.60 threshold)
STEP 4: ✅ 0 açık defect
```

🟢 **GO — U3 tamamlandı. U4 (Ingestion Pipeline + Corpus Seed) başlıyor (otonom).**

---

## NOTLAR

- **Pluggable embedding** hazır — `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY` ile prod'a geçiş env change.
- **BM25 custom** — `rank-bm25` paketi yerine self-contained implementation (lighter dep tree).
- **Collection-per-ticker** strategy (`finance_x__EREGL`) — per-company isolation, filter-at-query needed only for cross-ticker queries.
- **Qdrant binary standalone** — Docker alternative; `_qdrant/qdrant.exe` process olarak çalışıyor. Restart için: kill + start from `_qdrant/`.
- **e5 asymmetric retrieval** — ingest `passage: ...` prefix, query `query: ...` prefix (bge/e5 family convention). Implemented in retriever.py.
