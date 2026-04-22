# Finance X

BIST şirketleri için 22 ajanlı (Block U ile 26 ajan hedefi) kurumsal araştırma orkestrasyonu. Veri toplamadan Yönetim Kurulu düzeyinde PDF rapora kadar tüm zinciri deterministik Python + LLM hibrit akışında çalıştırır.

## Özellikler

- **22 özel ajan** (pipeline) — data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent, ceo, coo, report_formatter. (Block U: +4 meta agent — research_brief, knowledge_base, document_evidence, external_research)
- **10 katmanlı pipeline** — orchestrator DAG dependency resolver, runtime modları (fast_screening, standard_institutional, deep_dive). QA hard gate — critical fail → `qa_failed`, soft → `completed_with_warning`.
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
- Anthropic API erişimi (Claude CLI veya SDK) — `.env` içinde `ANTHROPIC_API_KEY`
- SQLite (better-sqlite3 ile embed)

## Kurulum

```bash
pnpm install
cp .env.example .env   # ANTHROPIC_API_KEY ve diğer ayarları doldur (93+ satır env)
pnpm dev               # backend server @ localhost:4000
```

Dashboard için ayrı terminal:

```bash
pnpm dev:dashboard     # dashboard @ localhost:5173
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
  src/python/
    report_formatter/       Deterministic HTML/PDF composer
    agent_runners/          22 Python adapter wrapper
  src/llm/                  Claude provider + prompt caching
dashboard/            React + Vite UI (finance-x-dashboard)
agents/               22 ajan: system_prompt.md, knowledge.md, memory.md, output_schema.json,
                      agent_spec.json, permanent_rules.md (auto), lessons.jsonl, case_lessons.md
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
| `fast_screening` | 10-20 min | 6 (ceo, data_collection, financial_analysis, technical_analysis, final_summary, report_formatter) | 2 |
| `standard_institutional` | 30-60 min | ~15 | 3 |
| `deep_dive` | 90-180 min | 22 (hepsi) | 5 |

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

## Geliştirme

```bash
pnpm typecheck                         # TS tip kontrolü (backend)
pnpm test:run                          # Vitest (backend)
pnpm build                             # pnpm -r build

# Mini-benchmarks (Block R fazları için)
npx tsx scripts/r3-mini-benchmark.ts   # Feedback loop
npx tsx scripts/r4-mini-benchmark.ts   # Memory loader
npx tsx scripts/r5-mini-benchmark.ts   # QA parser
npx tsx scripts/r6-mini-benchmark.ts   # Sector registry
npx tsx scripts/r7-mini-benchmark.ts   # Fact pack + unit normalizer
npx tsx scripts/r8-mini-benchmark.ts   # PII + tracer + event bus

# Memory migration (one-off, idempotent)
npx tsx scripts/migrate-memory-to-lessons.ts
```

## Lisans

MIT — bkz. [LICENSE](LICENSE)
