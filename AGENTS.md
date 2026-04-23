# AGENTS.md — Finance X Contributor Guide

Human ve AI contributor'lar için bu repo'da çalışma rehberi.

## 1. Amaç

Finance X, BIST şirketleri için **26 ajanlı kurumsal araştırma orkestrasyon platformu** (Block R: 22, Block U: +4 evidence-driven agent). Veri toplamadan (KAP, bilançolar) 12 bölümlü Yönetim Kurulu PDF raporuna kadar tüm zinciri bir arada koşturur. Block U sonrası: doküman RAG (Qdrant), evidence-driven agent integration, IAS 29 operating-only EBITDA, deep research orchestration.

## 2. Önce Bunları Oku

1. `README.md` — üst düzey proje özeti (Block U features dahil)
2. `docs/phase-reports/` — Block R (R1-R9) + Block U (U1-U9) exit reports
3. `workflows/full_integrated_analysis.md` — 10 katmanlı pipeline spec
4. `agents/ceo/system_prompt.md` — CEO governance ve review kuralları
5. `agents/report_formatter/system_prompt.md` — rapor format kuralları, metin-görsel dengesi
6. `schemas/shared/agent_output_contract.schema.json` — universal output zarfı (26 output_type)
7. `canonical/contracts/pipeline_modes.yaml` — 10 layer + mode → agent eşlemesi (ground truth)
8. `skills/ias29-inflation-accounting/SKILL.md` — IAS 29 formula + reconciliation kuralı (U6 corrected)

## 3. Repo Haritası

- `backend/` — Node.js orchestrator + Express API + Puppeteer PDF
  - `src/orchestrator.ts` — 26-agent DAG dispatcher (post-U5 ordering: research_brief → data → parse → knowledge_base → document_evidence → context_extraction → financial_analysis → ...), QA hard gate (critical→qa_failed, soft→completed_with_warning)
  - `src/agent-runner.ts` — LLM call + structured 3-part memory loader (permanent_rules + memory kurallar + lessons.jsonl)
  - `src/feedback-loop.ts` — deterministic JSON-driven feedback writer, dedup + auto-promotion
  - `src/fact-pack.ts` — canonical fact pack per session
  - `src/fact-layer/unit-normalizer.ts` — TRY_mn canonical, FX normalization
  - `src/qa/score-parser.ts` — score extraction + critical/soft classifier
  - `src/sector-registry.ts` — authoritative ticker→sector
  - `src/observability/` — OpenTelemetry tracer + lazy SDK init
  - `src/llm/pii-filter.ts` — TC/IBAN/email/phone/cc scrub
  - `src/event-bus.ts` — typed internal event emitter
  - `src/heartbeat.ts` — otonom CEO döngüsü
  - `src/document-intel/bridge.ts` — (Block U U3) Python cited_rag spawn + EvidencePack typing + formatEvidenceForAgent
  - `src/deep-research/` — (Block U U7) scope/execute/synthesize; `WebSearchFn` injectable; credibility ladder (18 HIGH / 9 MEDIUM pattern)
  - `src/python/adapters/ias29.ts` — (Block U U6) buildIas29Block + formatIas29ForAgent (NMP reconciliation)
  - `src/python/report_formatter/` — deterministik HTML + theme render
  - `src/python/agent_runners/` — 22 Python adapter
  - `src/llm/` — Claude provider + prompt caching
- `dashboard/` — React + Vite UI
- `agents/` — 26 ajan: system_prompt, knowledge, memory, output_schema, agent_spec, `permanent_rules.md`, `lessons.jsonl`, `case_lessons.md`
  - 4 Block U ajanı: `research_brief/`, `knowledge_base/`, `document_evidence/`, `external_research/`
- `config/sector_registry.yml` — 36 BIST ticker sector mapping
- `python-services/` — deterministik hesaplayıcılar + document_intel
  - `src/financex/calculators/financial_engine.py` — ratio + Altman + Piotroski (Block U U6'da `ebitda_ias29` + `ebitda_margin_ias29` eklendi)
  - `src/financex/calculators/ias29.py` — (Block U U6) `compute_ebitda_ias29()` + reconciliation detector
  - `src/financex/document_intel/` — (Block U U3) embedding.py + ingest.py + retriever.py + cited_rag.py
- `prompts/` — shared_directives.md
- `schemas/` — JSON Schema contracts (26 output_type)
- `skills/` — (Block U U1-U2) 20 sector/accounting/valuation skills + Claude Code skills
- `templates/` — legacy root template (canonical: `backend/src/python/report_formatter/template.html`)
- `canonical/contracts/pipeline_modes.yaml` — ground truth for 10 layers + mode → agent mapping
- `workflows/` — pipeline workflow specs
- `evals/` — regression evals, golden tests
- `_qdrant/` — (Block U U3+) Qdrant standalone binary + storage (gitignored)
- `docs/phase-reports/` — Block R (R1-R9) + Block U (U1-U9) exit reports
- `output/` — generated reports (gitignored)
- `scripts/` — Finance-X özel araçlar + mini-benchmark scripts
  - `ingest_existing_pdfs.py` — (Block U U4) batch corpus ingestion with idempotent upsert + resume checkpoint
  - `u3-...-u8-*` — Block U acceptance benchmarks

## 4. Geliştirme Kurulumu

```bash
pnpm install
cp .env.example .env   # ANTHROPIC_API_KEY'i doldur + 93 satır env
pnpm dev               # backend @ localhost:4000
pnpm dev:dashboard     # dashboard @ localhost:5173
```

## 5. Hızlı Kontroller

```bash
pnpm typecheck                        # TS tip kontrolü
pnpm test:run                         # Vitest (backend)
npx tsx scripts/r<N>-mini-benchmark.ts  # Block R faz testi
```

## 6. Pipeline Modları + QA + Katmanlar

10 layer (`canonical/contracts/pipeline_modes.yaml`): fundamental, technical, events, sector, macro, valuation, sentiment, consensus, esg, **knowledge** (Block U).

| Mod | Süre | Agent | QA max rounds | knowledge layer |
|---|---|---|---|---|
| `fast_screening` | 10-20 min | 16 | 2 | opt-in |
| `standard_institutional` | 30-60 min | 18 | 3 | opt-in |
| `deep_dive` | 90-180 min | 26 | 5 | **default** |

Block U'da eklenen **knowledge** layer çalışma sırası:
```
research_brief (ceo/coo sonrası, sub_questions üretir)
  → knowledge_base (Qdrant'tan cited evidence çeker)
  → document_evidence (claim-citation eşleme yapar)
  → external_research (U7 aktif: WebSearch + WebFetch)
```
4 target agent (context_extraction, financial_analysis, valuation_agent, esg_agent) `document_evidence_output` tüketir ve kendi output'unda `document_evidence_citations[{claim, doc_id, page, snippet_excerpt, relevance}]` alanını doldurur.

QA hard gate (R5): max round bittiğinde output'un kategori sınıflandırmasına göre davranış —
- **Critical** (`factual_error`, `valuation_math_error`, `structural_breakdown`...) → `status = qa_failed`, rapor üretimi **DURDURULUR**.
- **Soft** (`narrative_weak`, `section_short`, `coverage_gap`...) → `status = completed_with_warning`, rapor teslim edilir, banner uyarısı eklenir.

## 7. Memory Mimarisi (R4)

Agent prompt'una 3 parça memory yüklenir (ESKİ 6KB kör kırpma ARTIK YOK):
1. **Kalıcı Kurallar** — `permanent_rules.md` (≤4KB)
2. **Memory Kurallar** — `memory.md` içinde `## Kalıcı Kurallar` bölümü (≤2KB); yoksa fallback ilk 2KB
3. **Son Açık Öğrenimler** — `lessons.jsonl`'dan son 10 `status=open` lesson (yapılandırılmış)

Feedback loop (R3): CEO JSON döner → orchestrator lessons.jsonl'a yazar → `repeat_count >= 3` → `permanent_rules.md`'ye otomatik promote.

## 8. Rapor Üretim Akışı

1. CEO task_contract oluşturur
2. **initFactPack** — session için canonical fact pack DB'de oluşur (R7)
3. Orchestrator DAG'ı çözer, ajanları sırayla/paralel çalıştırır
4. Her ajan `agent_output_contract` zarfında çıktı döner (AJV ile schema validate)
5. QA Review rubric skorlaması yapar; **dynamic max rounds** (profile-aware); critical fail → hard block
6. Strategic_synthesis + final_summary sentezi
7. CEO onayı
8. report_formatter → HTML (deterministik `compose.ts` + opsiyonel LLM narrative)
9. Puppeteer PDF render → `output/pdfs/{ticker}_Yonetim_Kurulu_Raporu_{YYYYMMDD}.pdf`
10. Post-session feedback loop (R3) — CEO structured JSON → lessons.jsonl

## 9. Kritik Kurallar

- **Her sayıda** `[KAYNAK: document_id]` veya `[VERİ YOK]` etiketi olmalı (Chairman direktifi)
- Rapor formatter **12 bölümlü** şemaya uyar (canonical: `backend/src/python/report_formatter/template.html`)
- Chart.js **yasaktır**; grafikler `svg_charts.ts` ile deterministik SVG
- Metin sandviç: her tablo/grafiğin önünde 2 cümle, arkasında 3-5 cümle yorum
- Brand identity: `context_extraction.brand_identity` → CSS `:root` variables → theme preset
- **Sektör sadece registry'den** — LLM sektör tahmini fallback'tir (R6)
- **Numeric fact'ler canonical unit'te** — `TRY_mn` para, `decimal` yüzde (R7 unit normalizer)
- **IAS 29 EBITDA doğru formül** (U6, kaynak: EREGL FY2024 Not 35, ARCLK FY2024 H1 Not 2.1):
  - `EBITDA_ias29 = operating_profit_restated + D&A_restated`
  - Net Parasal Pozisyon Kazanç/Kayıp (NMP) **EBITDA'ya DAHİL EDİLMEZ** — non-operating, Not 35 tipik
  - Management-reported EBITDA NMP içeriyorsa reconciliation: `|divergence - NMP| < 0.05*reported` → kontaminasyon tespit
  - Kaynak modül: `python-services/src/financex/calculators/ias29.py`
- **Document evidence citations zorunlu** (U6, 4 target agent): context_extraction, financial_analysis, valuation_agent, esg_agent — her qualitative claim için ≥1 `{claim, doc_id, page}` citation
- **External research credibility ladder** (U7, deterministic): HIGH = regulatörler + standart koyucular (EU Comm/ECB/BIS/TCMB/BDDK/SPK/IASB/IMF/IEA/OPEC...); MEDIUM = büyük finans basını + Big 4 + S&P/Moody's/Fitch; LOW = eşleşmemiş publisher (flag for manual verify)

## 10. Test Etiket Formatı

- `evals/golden/{TICKER}.expected.json` — beklenen bölüm sayısı, char count, SVG sayısı
- `evals/run-eval.ts` CI'da tüm ticker'ları döngüler
- `scripts/r<N>-mini-benchmark.ts` — Block R faz izole test (LLM'siz, ~3 sn)
- `scripts/u<N>-*-test.ts` — Block U acceptance testleri (u3: RAG 16/16; u5: evidence pipeline 8/8; u6: IAS29 + schema 14/14; u7: deep-research 20/20; u8: E2E regression 49/49)

## 11. Lisans

MIT © 2026 Finance X. Katkılar welcome.
