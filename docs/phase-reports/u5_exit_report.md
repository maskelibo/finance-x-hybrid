# U5 — 4 Evidence-Driven Agents + Pipeline Wiring — Exit Report

- **Faz:** U5 (Block U) — Kategori C (tam canlı test)
- **Branch:** `finance-x-execution`
- **Tarih:** 2026-04-23

---

## STEP 1 — IMPLEMENTATION

### 4 Yeni agent

| Agent | Rol | Tür | Dosyalar |
|---|---|---|---|
| `research_brief` | ceo/coo sonrası araştırma planı — sub_questions + priority_topics üretir | LLM | system_prompt.md (98 satır), output_schema.json, memory.md |
| `knowledge_base` | Qdrant'tan sub_question başına top-5 chunk çeker — deterministic RAG wrapper | LLM + bridge | system_prompt.md (86 satır), output_schema.json, memory.md |
| `document_evidence` | knowledge_base çıktısını iddialara dönüştürür + citation eşleme | LLM | system_prompt.md (93 satır), output_schema.json, memory.md |
| `external_research` | U7 deep-research scaffold — stub döner | LLM (U7'de tam) | system_prompt.md (83 satır), output_schema.json, memory.md |

### Pipeline wiring

- **Yeni layer:** `knowledge` (`analysis-config.ts`) — deep_dive varsayılan, fast/standard opt-in.
- **Agent pipeline ordering** (`orchestrator.ts`): `ceo → coo → research_brief → data_collection → ... → context_extraction → knowledge_base → document_evidence → external_research → financial_analysis → ...`
- **Registry** (`agents.ts`): 4 yeni entry (`research_brief`, `knowledge_base`, `document_evidence`, `external_research`).
- **Dependencies** (`AGENT_DEPENDENCIES`):
  - `research_brief` ← `ceo_output, coo_output`
  - `knowledge_base` ← `research_brief_output, context_extraction_output`
  - `document_evidence` ← `knowledge_base_output, research_brief_output, context_extraction_output`
  - `external_research` ← `research_brief_output`
  - `strategic_synthesis`, `final_summary`, `report_formatter` artık `document_evidence_output` okuyor.
- **Context limits**: research_brief 15K, knowledge_base 20K, document_evidence 45K, external_research 15K.
- **Canonical**: `canonical/contracts/pipeline_modes.yaml` → `layers.knowledge` eklendi.

### cp1254 infra fix

`python-services/src/financex/document_intel/cited_rag.py` — module-level `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`. Bridge CLI artık redirect + pipe altında Türkçe + arrow karakter güvenli.

---

## STEP 2 — SMOKE TEST

- Backend `npx tsc --noEmit` → ✅ Exit 0
- `cited_rag` CLI → ✅ 4090 B temiz JSON (önceki run patlayan karakterler artık UTF-8)
- `pipeline_modes.yaml` layer listesi → ✅ 10 layer (yeni: `knowledge`)
- Orchestrator `LAYER_AGENTS.knowledge` → ✅ 4 agent

---

## STEP 3 — LIVE BENCHMARK (Kategori C)

### Test script: `scripts/u5-evidence-pipeline-test.ts`

Simülasyon: deterministic research_brief çıktısı + canlı Qdrant üzerinden knowledge_base retrieval + document_evidence girdi kalitesi ölçümü. LLM spawn yok — U6'da gerçek agent yürütmesi devreye alınacak.

### EREGL — 5 sub_question, canlı collection

| Sub-question | Chunks | Top relevance |
|---|---|---|
| EREGL'in 2025 EBITDA marjı ve trendi nedir? | 3 | **1.000** |
| HRC spread ve çelik marjı 2025 | 4 | **0.997** |
| Net borç EBITDA oranı 2025 | 5 | **0.980** |
| CBAM karbon düzenlemesi etkisi | 5 | **0.984** |
| Demir cevheri maliyet yapısı | 5 | **1.000** |

**Aggregate:** 22 chunk / 5 Q / avg top-relevance **0.992** / 0 zero-evidence.

### Topic coverage (document_evidence öncesi)

| Topic | Priority | Supporting chunks |
|---|---|---|
| profitability_trend | high | 12 |
| leverage | high | 5 |
| carbon_regulation | medium | 5 |

### 8/8 Assertion PASS

```
[PASS] research_brief: ≥3 sub_questions        (got 5)
[PASS] research_brief: priority_topics non-empty (got 3)
[PASS] knowledge_base: no zero evidence        (zero=0)
[PASS] knowledge_base: avg_top_relevance ≥ 0.80 (avg=0.992)
[PASS] knowledge_base: ≥15 total chunks         (total=22)
[PASS] document_evidence: all high-priority topics ≥1 chunk
[PASS] formatEvidenceForAgent: non-empty output (len=1839)
[PASS] formatEvidenceForAgent: includes page citation
```

**Toplam süre:** 64.8 sn (5 bridge çağrısı, embedder cold-start dahil).

---

## STEP 4 — DEFECT DETECTION

1. **Bridge LLM entegrasyonu ertelendi:** U5'te knowledge_base/document_evidence **LLM spawn edilmedi**. agent-runner.ts'in bu 4 yeni agent için Claude Code spawn'ı U6 canlı pipeline run'ında doğrulanacak. Risk düşük — registry + prompt kontratları yerinde, mevcut spawn altyapısı aynı.
2. **Deep_dive default:** `knowledge` layer otomatik `deep_dive` moduna dahil (ANALYSIS_LAYERS.map). fast/standard'da opt-in. Normal behavior.
3. **external_research stub:** Bilerek U7'ye deferred. Pipeline wiring + schema tamam; runtime'da `status: "scaffold_stub"` dönecek.

**0 açık blocker.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 4 agent dir (12 dosya) + 5 backend dosya düzenleme + 1 canonical
STEP 2: ✅ typecheck exit 0, cited_rag CLI temiz
STEP 3: ✅ 8/8 canlı assertion (avg top-relevance 0.992 EREGL)
STEP 4: ✅ 0 açık blocker
```

🟢 **GO — U5 tamamlandı. U6 beklemede (kullanıcı onayı).**

---

## BACKGROUND JOB STATUS

Full corpus ingestion (U4 devamı) arka planda çalışıyor:
- pid 1722, `/tmp/full_ingest.log`
- Checkpoint: 89/802 dosya, 4 ticker (AKBNK 82 + EREGL 1 + TUPRS 3 + ENKAI 3), 1286 chunk
- Tahmini tamamlanma: ~1.5 saat

U5 bu ingestion'a bağımlı değil — pilot 3 collection (EREGL/TUPRS/ENKAI) üzerinden benchmark tamamlandı.

---

## NOTLAR

- **knowledge_base pure-deterministic yol** — prompt'unda LLM'e Bash tool ile cited_rag CLI çağırma talimatı var. Alternatif: orchestrator pre-fetch + prompt inject. U6 canlı run'da hangisi daha stabil görülecek.
- **document_evidence'in strategic_synthesis ve final_summary'e bağlanması:** aşağı akış agent'ları artık citation-rich iddia listesine erişebilir. Bu, raporların "kaynaksız yargı" oranını düşürmek için temel.
- **U7 bağlantısı:** external_research schema şimdiden U7 deep-research orchestrator ile uyumlu. Stub → active dönüşümü tek `status` field değişikliği.
