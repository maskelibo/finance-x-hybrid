# U8 — E2E Regression Tests — Exit Report

- **Faz:** U8 (Block U) — Kategori B (regresyon + mini-benchmark)
- **Branch:** `finance-x-execution`
- **Tarih:** 2026-04-23

---

## STEP 1 — IMPLEMENTATION

### `scripts/u8-e2e-regression-test.ts` (~360 satır, tek dosya)

3-faz test suite:

**Phase 1 — 20-Q RAG acceptance** (canlı Qdrant, 5 ticker)

| Ticker | Soru sayısı |
|---|---|
| EREGL | 6 (EBITDA margin, CBAM, net debt/EBITDA, HRC spread, demir cevheri, EAF) |
| TUPRS | 4 (rafineri kapasite, IAS 29, rafinaj marjı, KCHOL) |
| AKBNK | 4 (NIM, NPL, CAR, aktif kalite) |
| ARCLK | 3 (Avrupa gelir, beyaz eşya hacmi, Whirlpool) |
| BIMAS | 3 (mağaza sayısı, özel markalar, LFL) |

**Phase 2 — Pipeline regression** (18 assertion)
- LAYER_AGENTS.knowledge 4 agent ile
- AGENT_PIPELINE re-order (knowledge_base < context_extraction, document_evidence < financial_analysis)
- 4 target agent AGENT_DEPENDENCIES'te document_evidence_output
- canonical pipeline_modes.yaml 10 layer (YAML inline parser — test ext dep eklemedi)
- Registry 27 agent (23 orijinal incl. orchestrator + 4 U5 new)
- analysis-config.ts knowledge layer

**Phase 3 — 4+1 agent + evidence integration regression** (23 assertion)
- 4 yeni agent (research_brief/knowledge_base/document_evidence/external_research) schema + prompt (≥50 satır)
- external_research active (U7 kanıt: WebSearch + WebFetch directive)
- external_research credibility field
- 4 target agent (financial_analysis/context_extraction/valuation_agent/esg_agent) document_evidence_citations[{claim,doc_id,page}]
- financial_analysis profitability ebitda_ias29 + ebitda_margin_ias29 required
- parse_standardization.Ias29Block schema
- Python: financial_engine.py emits ebitda_ias29; ias29.py module + compute_ebitda_ias29
- deep-research 5 file (types/scope/execute/synthesize/index)
- IAS29 skill formula düzeltme kanıtı (operating_profit + D&A_restated; NMP EXCLUDED)

---

## STEP 2 — SMOKE TEST

- Backend `npx tsc --noEmit` → ✅ Exit 0 (U7'den kalma)
- u8-e2e-regression-test.ts runtime: 263.8 sn (çoğu RAG query × 20)

---

## STEP 3 — LIVE BENCHMARK (Kategori B — regresyon standart)

### RAG acceptance sonuç (20/20)

```
avg_top_rel = 0.995    (master threshold 0.60 → 65.8% üstünde)
zero_evidence_rate = 0.0%    (master tolerance < 15%)
```

Hiçbir sorgu chunks=0 dönmedi; 5/5 chunk her soruda geldi. Retrieval quality tüm ticker'larda stabil.

Per-ticker dağılım:
- EREGL 6/6 (avg top ~0.997)
- TUPRS 4/4 (avg top ~0.989)
- AKBNK 4/4 (avg top ~0.994)
- ARCLK 3/3 (avg top ~0.996)
- BIMAS 3/3 (avg top ~0.998)

### 49/49 ASSERTION PASS

Phase 1 (RAG): 8/8 ✅
Phase 2 (pipeline): 18/18 ✅
Phase 3 (agent regression): 23/23 ✅

---

## STEP 4 — DEFECT DETECTION

1. **İlk iterasyonda `yaml` modülü import hatası:** tsx ESM resolve root cwd'ye göre aradı, backend/node_modules'u bulamadı. Fix: benchmark kendisi için minimal YAML layer-scan inline parser yazıldı (20 satır) — production kütüphane bağımlılığı eklemedi.
2. **Registry 26 → 27 düzeltmesi:** Orijinal registry'de `orchestrator` pseudo entry var. Beklenti 26'dan 27'ye (23 orijinal + 4 U5 new).

**0 açık blocker.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 1 script, 3 phase, 49 assertion
STEP 2: ✅ typecheck exit 0
STEP 3: ✅ 49/49 canlı + regresyon PASS
STEP 4: ✅ 0 blocker
```

🟢 **GO — U8 tamamlandı. U9'a otonom geçiliyor.**

---

## U8 COMMIT

U9 ile birleştirilip tek commit yapılacak (kullanıcı talebi: "U8 bitince U9'a otomatik geç. U9 bitince DUR").
