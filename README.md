# Finance X

BIST şirketleri için 22 ajanlı kurumsal araştırma orkestrasyonu. Veri toplamadan Yönetim Kurulu düzeyinde PDF rapora kadar tüm zinciri deterministik Python + LLM hibrit akışında çalıştırır.

## Özellikler

- **22 özel ajan** — data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent, ceo, coo, report_formatter
- **10 katmanlı pipeline** — orchestrator DAG dependency resolver, runtime modları (fast_screening, standard_institutional, deep_dive)
- **Hibrit çalıştırma** — deterministik Python hesaplayıcılar (ratio, DCF, Altman Z, macro) + LLM narrative (Claude 4.7/4.6/4.5)
- **Template tabanlı rapor** — 12 bölümlü HTML template, Puppeteer ile A4 PDF; çoklu tema desteği (institutional, anthropic, minimal)
- **JSON schema validation** — AJV tabanlı, her agent output'u `schemas/shared/agent_output_contract.schema.json` ile doğrulanır
- **Otonom heartbeat** — CEO her 30 dakikada watchlist + KAP izleme döngüsü çalıştırır
- **Brand identity entegrasyonu** — context_extraction şirketin kurumsal renk ve logo dilini çıkarır, formatter CSS değişkenlerine yansıtır

## Gereksinimler

- Node.js 20+
- pnpm 9.15+
- Anthropic API erişimi (Claude CLI veya SDK) — `.env` içinde `ANTHROPIC_API_KEY`
- SQLite (better-sqlite3 ile embed)

## Kurulum

```bash
pnpm install
cp .env.example .env   # ANTHROPIC_API_KEY ve diğer ayarları doldur
pnpm dev               # backend server @ localhost:4000
```

Dashboard için ayrı terminal:

```bash
pnpm dev:dashboard     # dashboard @ localhost:5173
```

## Proje Yapısı

```
backend/              Node.js orchestration server (Express + SQLite + Puppeteer)
  src/orchestrator.ts    22-agent DAG dispatcher
  src/agent-runner.ts    LLM call + prompt injection
  src/heartbeat.ts       Otonom CEO döngüsü
  src/python/
    report_formatter/    Deterministic HTML/PDF composer
    agent_runners/       22 Python adapter wrapper
  src/llm/               Claude provider + prompt caching
dashboard/            React + Vite UI (finance-x-dashboard)
agents/               22 ajan: system_prompt.md, knowledge.md, memory.md, output_schema.json, agent_spec.json
python-services/      Deterministic Python calculators (ratio, DCF, macro, technical)
prompts/              Shared directives across agents
schemas/              JSON Schema contracts (task_contract, agent_output, confidence, evidence)
templates/            report_base.html (root template — legacy, backend/src/python/report_formatter/template.html canonical)
skills/               Claude Code skill definitions
workflows/            Pipeline workflow specs (full_integrated_analysis, fast_screening, degraded_mode, event_driven_update)
evals/                Regression evals, golden tests
output/               Generated reports (HTML + PDF per ticker)
scripts/              Finance-X özel araçlar (BIST30 indirme, HTML→PDF)
```

## Runtime Modları

| Mod | Süre | Agent sayısı |
|---|---|---|
| `fast_screening` | 10-20 min | 6 (ceo, data_collection, financial_analysis, technical_analysis, final_summary, report_formatter) |
| `standard_institutional` | 30-60 min | ~15 |
| `deep_dive` | 90-180 min | 22 (hepsi) |

## Geliştirme

```bash
pnpm typecheck         # TS tip kontrolü (backend)
pnpm test:run          # Vitest (backend)
pnpm build             # pnpm -r build
```

## Lisans

MIT — bkz. [LICENSE](LICENSE)
