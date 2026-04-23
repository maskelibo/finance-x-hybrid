# Finance X

BIST şirketleri için 26 ajanlı kurumsal araştırma orkestrasyonu. Veri toplamadan Yönetim Kurulu düzeyinde PDF rapora kadar tüm zinciri deterministik Python + LLM hibrit akışında çalıştırır. Block U sonrası: canonical doküman RAG (Qdrant + e5 embedder), evidence-driven agent integration, IAS 29 EBITDA operating-only formülü, dış-kaynak deep research orchestration.

## Özellikler

- **26 özel ajan** (22 orijinal + Block U'nun 4 evidence-driven ajanı: research_brief, knowledge_base, document_evidence, external_research). Orchestrator: ceo, coo. Data: data_collection, parse_standardization, reconciliation, context_extraction. Analytical: financial_analysis, sector_competition, macro_analysis, technical_analysis, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent. Events: kap_watch, event_classification, event_impact_mapper, event_timeline_alert. Synthesis: qa_review, strategic_synthesis, final_summary, report_formatter.
- **10 katmanlı pipeline** (yeni `knowledge` layer dahil) — orchestrator DAG dependency resolver, runtime modları (fast_screening, standard_institutional, deep_dive). QA hard gate — critical fail → `qa_failed`, soft → `completed_with_warning`.
- **Skills runtime** (Block U U1-U2) — 20 sektör/muhasebe/değerleme skill'i (`skills/`), trigger-based auto-inject, per-agent `applies_to_agents` filter. IAS 29 / IFRS 16 / DCF / Piotroski / sector-specific (banking, refinery, steel, retail, telecom, aviation, defense, holding).
- **Document RAG foundation** (Block U U3-U4) — Qdrant vector DB (1.17.1), local multilingual-e5-small embedder (384-dim, Turkish capable). Per-ticker collections (`finance_x__{TICKER}`). Hybrid retrieval: vector (70%) + custom BM25 (30%). 802-PDF batch ingestion pipeline (`scripts/ingest_existing_pdfs.py`) with idempotent upsert + resume checkpoint.
- **Evidence-driven integration** (Block U U5-U6) — research_brief (planner) → knowledge_base (cited RAG) → document_evidence (claim-citation mapper) → external_research. 4 analytical agents (context_extraction, financial_analysis, valuation_agent, esg_agent) consume `document_evidence_output` and emit `document_evidence_citations[{claim, doc_id, page, snippet_excerpt, relevance}]`.
- **IAS 29 / TMS 29 operating-only EBITDA** (Block U U6) — `EBITDA_ias29 = operating_profit_restated + D&A_restated`. Net Monetary Position Gain/Loss is EXCLUDED (non-operating, typically Note 35). Reconciliation detects management-disclosed EBITDA contamination. Formula validated against EREGL FY2024 and ARCLK FY2024 source filings. `python-services/src/financex/calculators/ias29.py`, engine ratio: `ebitda_ias29`, `ebitda_margin_ias29`.
- **Deep research orchestration** (Block U U7) — `backend/src/deep-research/` (scope → execute → synthesize). Deterministic publisher credibility ranking: 18 HIGH patterns (EU Commission, ECB, BIS, TCMB, BDDK, SPK, EPDK, IASB, IMF, IEA, OPEC, KAP, worldsteel, IATA, ICAO), 9 MEDIUM (Reuters, Bloomberg, FT, WSJ, Big 4, S&P/Moody's/Fitch). WebSearch + WebFetch tool directives for external_research agent.
- **Hibrit çalıştırma** — Deterministik Python hesaplayıcılar (ratio, DCF, Altman Z, macro) + LLM narrative (Claude 4.7/4.6/4.5). **Python engine default aktif** (Block R R2): 20 `PYTHON_*_ENABLED` flag'i `.env`'de tek tek override edilebilir; per-agent rollback destekli.
- **Structured memory (Block R)** — 3 katman: `permanent_rules.md` (kalıcı) + `memory.md` "Kurallar" bölümü + `lessons.jsonl` (son 10 open). Feedback loop JSON-based deterministik yazım; `repeat_count >= 3` → auto-promote to permanent rules.
- **Authoritative sector registry** — `config/sector_registry.yml` (36 BIST ticker eşlemesi). LLM sektör tahmin etmez; registry overrides.
- **Canonical Fact Pack** — Her session için `fact_packs` tablosunda tek authoritative kaynak. Unit normalizer (TRY_mn canonical; USD/EUR FX conversion) — fake contradiction'ları engeller.
- **Template tabanlı rapor** — 12 bölümlü HTML template, Puppeteer ile A4 PDF; çoklu tema (institutional, anthropic, minimal).
- **JSON schema validation** — AJV, her agent output'u `schemas/shared/agent_output_contract.schema.json` (26 output_type) ile doğrulanır.
- **Otonom heartbeat** — CEO her 30 dakikada watchlist + KAP izleme döngüsü çalıştırır.
- **Observability (OpenTelemetry)** — `OTEL_EXPORTER_URL` set edildiğinde agent/session span'leri Jaeger/Tempo'ya akar. Yoksa no-op.
- **PII scrubber** — TC/IBAN/phone/email/credit card maskelemesi; LLM provider'a prompt gitmeden önce. `PII_FILTER_ENABLED=true` (default).
- **Event bus** — kap_new_disclosure, session_*, qa_blocked, heartbeat_cycle event'leri; auto-trigger altyapısı hazır.

## Gereksinimler

- Node.js 20+
- pnpm 9.15+ (veya npm)
- Python 3.12+ (python-services venv)
- Anthropic API erişimi (Claude CLI veya SDK) — `.env` içinde `ANTHROPIC_API_KEY`
- SQLite (better-sqlite3 ile embed)
- **Qdrant 1.17+** (Docker veya `_qdrant/qdrant.exe` standalone binary, Block U RAG için)

## Kurulum

```bash
pnpm install
cp .env.example .env   # ANTHROPIC_API_KEY ve diğer ayarları doldur (93+ satır env)

# Python services (hybrid engine)
cd python-services && python -m venv .venv && .venv/Scripts/pip install -e .

# Qdrant (Block U RAG)
#  - Docker: docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/_qdrant/storage:/qdrant/storage qdrant/qdrant:v1.17.1
#  - Windows binary: _qdrant/qdrant.exe   (gitignored; indir: https://github.com/qdrant/qdrant/releases)

pnpm dev               # backend server @ localhost:4000
```

Dashboard için ayrı terminal:

```bash
pnpm dev:dashboard     # dashboard @ localhost:5173
```

Corpus ingest (Block U U4):

```bash
# Tüm output/bist30 + output/archive PDF'lerini Qdrant'a yükle (idempotent, resume-safe)
python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py

# Tek ticker
python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py --ticker EREGL

# Dry-run (planı göster, yazma)
python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py --dry-run
```

## Proje Yapısı

```
backend/              Node.js orchestration server (Express + SQLite + Puppeteer)
  src/orchestrator.ts       DAG dispatcher + QA hard gate
  src/agent-runner.ts       LLM call + 3-part structured memory loader
  src/feedback-loop.ts      Deterministic JSON-based feedback → lessons.jsonl
  src/fact-pack.ts          Canonical fact pack per session
  src/fact-layer/           Unit normalizer (TRY_mn canonical)
  src/qa/score-parser.ts    QA score + critical/soft classifier
  src/sector-registry.ts    Authoritative ticker→sector lookup
  src/observability/        OpenTelemetry tracer + lazy SDK init
  src/llm/pii-filter.ts     PII scrub (TC/IBAN/email/phone/cc)
  src/event-bus.ts          Typed internal event emitter
  src/heartbeat.ts          Otonom CEO döngüsü
  src/document-intel/       (Block U U3-U5) Cited RAG bridge — Python spawn for evidence packs
  src/deep-research/        (Block U U7) scope/execute/synthesize orchestrator + credibility ranking
  src/python/
    report_formatter/       Deterministic HTML/PDF composer
    agent_runners/          22 Python adapter wrapper
    adapters/ias29.ts       (Block U U6) IAS 29 reconciliation + prompt formatter
  src/llm/                  Claude provider + prompt caching
dashboard/            React + Vite UI (finance-x-dashboard)
agents/               26 ajan: system_prompt.md, knowledge.md, memory.md, output_schema.json,
                      agent_spec.json, permanent_rules.md (auto), lessons.jsonl, case_lessons.md
  research_brief/           (Block U U5) Sub-question planner
  knowledge_base/           (Block U U5) Qdrant cited retrieval wrapper
  document_evidence/        (Block U U5) Claim→citation mapper
  external_research/        (Block U U5/U7) WebSearch + WebFetch external evidence
skills/               20 Block U skills: IAS29, IFRS16, DCF, Piotroski, sector playbooks (8)
python-services/      Deterministic Python calculators + document_intel module
  src/financex/calculators/
    financial_engine.py     Ratio + Altman + Piotroski (ebitda_ias29 added in U6)
    ias29.py                (Block U U6) compute_ebitda_ias29 + reconciliation
  src/financex/document_intel/
    embedding.py            (Block U U3) Local e5-small + pluggable OpenAI
    ingest.py               (Block U U3) PDF chunker + Qdrant upsert, idempotent
    retriever.py            (Block U U3) Hybrid vector + BM25 retrieval
    cited_rag.py            (Block U U3) Evidence pack CLI entrypoint
_qdrant/              Qdrant storage (gitignored) — binary + collections + snapshots
config/
  sector_registry.yml       36 ticker → sector authoritative
python-services/      Deterministik Python calculators (ratio, DCF, macro, technical)
prompts/              Shared directives across agents
schemas/              JSON Schema contracts (task_contract, agent_output, confidence, evidence)
templates/            report_base.html (legacy; canonical in backend/src/python/report_formatter/)
skills/               Claude Code skill definitions
workflows/            Pipeline workflow specs
evals/                Regression evals, golden tests
docs/phase-reports/   Block R faz çıkış raporları (R1-R9)
output/               Generated reports (gitignored; .pdf/.html/.md/.json at any depth)
scripts/              Finance-X özel araçlar (BIST30 indirme, mini-benchmark scripts)
```

## Runtime Modları

| Mod | Süre | Agent sayısı | QA max rounds |
|---|---|---|---|
| `fast_screening` | 10-20 min | 16 (backbone + fundamental + technical + events) | 2 |
| `standard_institutional` | 30-60 min | 18 (+ sector + macro) | 3 |
| `deep_dive` | 90-180 min | 26 (+ valuation + sentiment + consensus + esg + **knowledge layer**) | 5 |

`knowledge` layer Block U'da eklendi — deep_dive'da varsayılan aktif, fast/standard'da opt-in. research_brief → knowledge_base → document_evidence → external_research sırasıyla çalışır ve downstream agent'lara evidence pack sağlar.

## Önemli Environment Variables

Bkz. `.env.example` (93 satır, 9 kategori). Öne çıkanlar:

| Var | Default | Açıklama |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Claude API anahtarı (zorunlu) |
| `CLAUDE_MODEL` / `CLAUDE_MODEL_LIGHT` | sonnet-4-6 / haiku-4-5 | Agent bazlı model routing |
| `PYTHON_PIPELINE_ENABLED` | `true` | Python hybrid master switch |
| `PYTHON_*_ENABLED` (20 adet) | `true` | Per-agent Python adapter toggle |
| `SCHEMA_VALIDATION_MODE` | `warn` | `off`/`warn`/`soft_block` |
| `PII_FILTER_ENABLED` | `true` | Prompt provider'a gitmeden PII scrub |
| `OTEL_EXPORTER_URL` | (unset) | Jaeger/Tempo OTLP endpoint — set edilince tracing aktif |
| `MAX_QA_ROUNDS` | `3` | Runtime mode'dan override edilmezse fallback |
| `DOCUMENT_INTEL_ENABLED` | `true` | (Block U) Cited RAG bridge master switch |
| `QDRANT_URL` | `http://localhost:6333` | (Block U) Qdrant REST endpoint |
| `EMBEDDING_PROVIDER` | `local` | `local` (e5-small 384d) or `openai` (requires `OPENAI_API_KEY`) |

## Geliştirme

```bash
pnpm typecheck                         # TS tip kontrolü (backend)
pnpm test:run                          # Vitest (backend)
pnpm build                             # pnpm -r build

# Block R mini-benchmarks (R3-R8)
npx tsx scripts/r3-mini-benchmark.ts   # Feedback loop
npx tsx scripts/r4-mini-benchmark.ts   # Memory loader
npx tsx scripts/r5-mini-benchmark.ts   # QA parser
npx tsx scripts/r6-mini-benchmark.ts   # Sector registry
npx tsx scripts/r7-mini-benchmark.ts   # Fact pack + unit normalizer
npx tsx scripts/r8-mini-benchmark.ts   # PII + tracer + event bus

# Block U benchmarks
npx tsx scripts/u3-rag-acceptance.ts          # U3 EREGL RAG acceptance
npx tsx scripts/u5-evidence-pipeline-test.ts  # U5 research_brief→knowledge_base→document_evidence
npx tsx scripts/u6-evidence-integration-test.ts  # U6 IAS 29 EBITDA + 4-agent schema
npx tsx scripts/u7-deep-research-test.ts      # U7 scope/execute/synthesize + LIVE WebFetch
npx tsx scripts/u8-e2e-regression-test.ts     # U8 20-Q RAG + pipeline + agent regression

# Memory migration (one-off, idempotent)
npx tsx scripts/migrate-memory-to-lessons.ts
```

## Lisans

MIT — bkz. [LICENSE](LICENSE)
