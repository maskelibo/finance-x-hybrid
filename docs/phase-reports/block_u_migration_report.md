# Block U — Migration Report

- **Branch:** `finance-x-execution`
- **Tarih aralığı:** 2026-04-22 (U1 başlangıç) → 2026-04-23 (U9 kapanış)
- **Commit zinciri:** `da84d8a8` (U1 başla) → `1d0605a1` (U7 bit)
- **Assertion toplamı:** 107 canlı+regresyon (U3: 16, U5: 8, U6: 14, U7: 20, U8: 49)

---

## 1. Block U amacı

Finance-X'i 22-ajanlı metin-based analysis'tan, **evidence-driven, cited-RAG tabanlı** 26-ajanlı kurumsal araştırma platformuna dönüştürmek. 3 ana eksen:

1. **Doküman kanıtı** — KAP PDF corpus'u Qdrant'a ingest et, per-ticker collection, hybrid retrieval
2. **Evidence-driven agent integration** — 4 yeni meta-agent + 4 analytical agent'a `document_evidence_output` injection + `document_evidence_citations[]` zorunluluğu
3. **Deterministik hesaplamalar** — IAS 29 operating-only EBITDA (Block R'den deferred kritik item) + external research orchestration

---

## 2. Faz özetleri

| Faz | Kategori | Commit | Özet | Kanıt |
|---|---|---|---|---|
| **U1** Skills infra | B | `da84d8a8` / `8235826d` | 20-skill registry + excerpt engine + agent-runner injection | 19/19 benchmark |
| **U2** 20 Skill content | B | `e84b9c2e` / `cfc89a87` | Production-grade SKILL.md × 20 (IAS29, IFRS16, DCF, Piotroski, 8 sector playbook) | 10/10 benchmark |
| **U3** RAG foundation | C | `10232b59` / `96a2be1b` | Qdrant + local e5-small (118MB/384d) + hybrid vector+BM25 retrieval; EREGL pilot | 16/16, avg top-rel 0.996 |
| **U4** Batch ingest | C | `470a72b7` | 802-PDF scanner + path/filename metadata parser + idempotent upsert (delete-by-doc_id pre-write) + checkpoint resume | 7-PDF pilot + corpus ingest active |
| **U5** 4 new agents | C | `410a2147` | research_brief + knowledge_base + document_evidence + external_research; new `knowledge` layer; pipeline wiring; cited_rag CLI cp1254 fix | 8/8 (EREGL avg top-rel 0.992) |
| **U6** Evidence integration + IAS 29 | C | `011dbe6c` | Python `ias29.py` (correct formula: operating_profit + D&A, NMP EXCLUDED); engine `ebitda_ias29` ratio; 4 target agents inject + citations schema; pipeline re-order (knowledge_base→document_evidence→context_extraction); SKILL.md formula fix | 14/14 (EREGL FY2024 reconciliation detects NMP contamination) |
| **U7** Deep research | C | `1d0605a1` | `backend/src/deep-research/` scope/execute/synthesize; deterministic credibility ladder (18 HIGH + 9 MEDIUM pattern); external_research stub→active (WebSearch+WebFetch directive); LIVE EU Commission CBAM via WebFetch proof | 20/20 including live WebFetch |
| **U8** E2E regression | B | (with U9) | 20-Q RAG suite + pipeline regression + 4+1 agent regression | 49/49 (RAG avg 0.995, 0% zero-evidence) |
| **U9** Docs | A | (with U8) | README + AGENTS.md + Block U migration report; skill fix cross-references | smoke only per plan |

---

## 3. IAS 29 EBITDA — kritik bulgu (U6)

### Master'ın önerdiği formül (3 yapısal kusur)

```
ebitda_ias29 = opex_restated + (D&A × cpi_multiplier) + net_monetary_gain
```

| Kusur | Açıklama |
|---|---|
| 1 | **EBITDA ≠ opex + D&A.** EBITDA = Revenue − Opex (excl D&A) = Operating Profit + D&A. Opex + D&A toplamı "total operating cost" tur, EBITDA değil |
| 2 | **D&A × cpi_multiplier çift sayım.** Türk IFRS (2022+) statements zaten restated; D&A restated PP&E base üzerinden hesaplandı, tekrar CPI ile çarpmak yanlış |
| 3 | **NMP EBITDA'ya eklemek kontaminasyon.** IAS 29 / TMS 29 altında NMP **Not 35 tipik**, finansal giderlerin ALTINDA, vergi öncesi kârın ÜSTÜNDE; **non-operating** |

### Kaynak doğrulama (U6 araştırma)

| Kaynak | Bulgu |
|---|---|
| EREGL FY2024 KAP bildirim 1392292 | Not 35: "Net Parasal Pozisyon Kazançları (Kayıpları)" = **-529.928 bin TL**, AYRI P&L satırı |
| ARCLK FY2024 H1 KAP bildirim 1317392 | Not 2.1 "TMS 29 uygulaması açıklaması" + NMP = 5.299.334 bin TL ayrı satır |
| Existing `skills/ias29-inflation-accounting/SKILL.md` | Eski formula "Reported EBITDA − Net Monetary Gain" — cleansing formülü ama gerekçesi belirsizdi; U6'da operating-only hesap + reconciliation olarak revize edildi |

### U6'da implement edilen doğru formül

```python
EBITDA_ias29 = operating_profit_restated + D&A_restated
# NMP ayrı izlenir (excluded_items), reconciliation için kullanılır.
```

Python: `python-services/src/financex/calculators/ias29.py::compute_ebitda_ias29`
Engine: `financial_engine.py::compute_for_period` → `ratios.ebitda_ias29` + `ratios.ebitda_margin_ias29`
Node: `backend/src/python/adapters/ias29.ts::buildIas29Block` + `formatIas29ForAgent`

---

## 4. Pipeline değişiklikleri

### Agent listesi (22 → 26)

| Grup | Agent'lar |
|---|---|
| Management | ceo, coo, orchestrator (pseudo) |
| Data ingest | data_collection, parse_standardization, reconciliation, kap_watch |
| **Knowledge (Block U — new)** | **research_brief, knowledge_base, document_evidence, external_research** |
| Qualitative interpret | context_extraction |
| Analytical | financial_analysis, sector_competition, macro_analysis, technical_analysis, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent |
| Events | event_classification, event_impact_mapper, event_timeline_alert |
| Synthesis | qa_review, strategic_synthesis, final_summary, report_formatter |

### Pipeline sırası (post-U6 re-order)

```
ceo → coo → research_brief →
  data_collection → parse_standardization → reconciliation →
  knowledge_base → document_evidence → external_research →
  context_extraction → financial_analysis →
    sector_competition → macro_analysis → technical_analysis →
    kap_watch → event_classification → event_impact_mapper → event_timeline_alert →
    qa_review → strategic_synthesis → final_summary →
    valuation_agent → sentiment_news_agent → analyst_consensus_agent → esg_agent →
    report_formatter
```

### AGENT_DEPENDENCIES evidence propagation

- `context_extraction` ← + `document_evidence_output`
- `financial_analysis` ← + `document_evidence_output`
- `valuation_agent` ← + `document_evidence_output`
- `esg_agent` ← + `document_evidence_output`
- `strategic_synthesis` / `final_summary` / `report_formatter` ← + `document_evidence_output` (U5'te eklenmişti)

### Yeni `knowledge` layer

`canonical/contracts/pipeline_modes.yaml` + `analysis-config.ts` + orchestrator `LAYER_AGENTS`:
```yaml
layers:
  knowledge: [research_brief, knowledge_base, document_evidence, external_research]
```
deep_dive varsayılan aktif; fast/standard opt-in.

---

## 5. Altyapı eklenenler

### Qdrant (Block U U3+)

- Binary: `_qdrant/qdrant.exe` v1.17.1 Windows standalone, gitignored
- Port: 6333 (REST) + 6334 (gRPC)
- 8+ per-ticker collection: `finance_x__{TICKER}` (AKBNK, ARCLK, ASELS, BIMAS, EKGYO, ENKAI, EREGL, TUPRS, +TCELL, KCHOL, SISE, THYAO ingest ilerlerken)
- 384-dim cosine distance
- Storage persist: `_qdrant/storage/`

### Python deps (python-services/.venv)

- `qdrant-client` 1.17.1
- `sentence-transformers` 5.4.1
- `torch` 2.11.0
- `transformers` 5.6.0
- `PyMuPDF/fitz` (PDF parsing)

### Embedder

- `intfloat/multilingual-e5-small` (118MB, 384-dim, Turkish-capable)
- HF Hub cache: `~/.cache/huggingface/hub/models--intfloat--multilingual-e5-small/`
- Pluggable: `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY` ile OpenAI'ya geçiş tek config

### Env vars eklenen

- `DOCUMENT_INTEL_ENABLED=true`
- `QDRANT_URL=http://localhost:6333`
- `EMBEDDING_PROVIDER=local`

---

## 6. Yeni çıktı alanları (schema)

| Agent | Yeni field |
|---|---|
| `parse_standardization` | `parsed_statements.ias29` sub-obj (operating_profit_restated, depreciation_restated, amortization_restated, net_monetary_position_gain_loss, reported_ebitda, restatement_note_ref, ias29_applied) |
| `reconciliation` | `reconciled_data.ias29` (same shape) |
| `financial_analysis` | `profitability.ebitda_ias29` + `.ebitda_margin_ias29` (required); `document_evidence_citations[{claim, doc_id, page, snippet_excerpt, relevance}]` |
| `context_extraction` | `document_evidence_citations` |
| `valuation_agent` | `document_evidence_citations` |
| `esg_agent` | `document_evidence_citations` |
| `external_research` | `sources.items.credibility` + `credibility_reason` |

---

## 7. Defects — tamamlananlar

| # | Defect | Fix commit |
|---|---|---|
| Block R | `ebitda_ias29` formülü (deferred) | U6 `011dbe6c` |
| U3 | Qdrant client API v1.17 breaking change (`client.search()` → `query_points`) | U3 `10232b59` |
| U4 | Duplicate point IDs on re-ingest (U3 vs U4 doc_id divergence) | U4 `470a72b7` — delete-by-doc_id pre-write |
| U5 | Windows cp1254 stdout break on `↗` karakter → CLI JSON pipe kırık | U5 `410a2147` (`sys.stdout.reconfigure(utf-8)`) |
| U6 | Pipeline cycle — context_extraction upstream of knowledge_base | U6 `011dbe6c` (pipeline re-order) |
| U6 | Master's 3-flaw EBITDA formula | U6 correct formula + `skills/ias29-.../SKILL.md` rewrite |

---

## 8. Bekleyen (Block V veya U8-extended için)

1. **External research canlı agent spawn** — U7'de module + prompt + schema hazır; orchestrator → external_research agent-runner entegrasyonu U8 regression + live session'da doğrulanacak.
2. **Full corpus ingest** — U4'ten başlayıp arka planda çalışıyor (800/802 yaklaşık), 11 ticker collection aktif olacak.
3. **Parse agent IAS 29 block doldurma canlı test** — schema + prompt hazır; canlı TUPRS/THYAO session ile parse prompt'ının Not 35 değerlerini doğru çıkarması ölçülecek.
4. **LLM agent integration live run** — 4 Block U agent'ının Claude Code CLI üzerinden spawn edilip citation-rich output üretmesi canlı pipeline session'da doğrulanacak.
5. **Dashboard RAG UI** — Qdrant collection stats + query tester + evidence pack viewer.

---

## 9. Commit log

```
011dbe6c feat(u6): evidence-driven integration + IAS 29 EBITDA correct formula
410a2147 feat(u5): 4 evidence-driven agents + knowledge layer + pipeline wiring
470a72b7 feat(u4): batch ingestion pipeline — 802 PDF scanner + idempotent Qdrant upsert
66e1263d checkpoint: Block U U1-U3 complete, U4-U9 pending
96a2be1b docs(u3): phase exit report — RAG foundation + EREGL live acceptance 0.996 avg
10232b59 feat(document-intel): Qdrant RAG foundation + local bge-family embedder + hybrid retrieval
cfc89a87 docs(u2): phase exit report — 20 skill content production-grade
e84b9c2e feat(skills): populate 20 SKILL.md files with sector/accounting/valuation procedures
8235826d docs(u1): phase exit report — skills infrastructure + excerpt engine
da84d8a8 feat(skills): infrastructure + registry + agent-runner injection
1d0605a1 feat(u7): deep-research orchestration + external_research active
(U8+U9 birleşik commit — bu dosya + U8 exit report + README + AGENTS.md)
```

---

## 10. Block U metrikleri

- **Yeni kod:** ~3,000 satır (Python + TypeScript, test dahil)
- **Yeni dosya:** 35+ (agents, modüller, benchmark script'leri, exit report'lar)
- **Canlı test assertion:** 107 PASS (hepsi green)
- **Retrieval accuracy (U8 20-Q canlı):** avg top-1 relevance **0.995**, zero-evidence rate **%0**
- **Corpus:** 802 PDF (tüm KAP BIST30 + archive), ingest devam ediyor (~700+ dosya Qdrant'ta)
- **New capability breakthrough:** evidence-backed claim üretimi + cited RAG + deterministic credibility ranking + IAS 29 operating-only EBITDA (Block R'den 13 gün sonra çözüldü)
