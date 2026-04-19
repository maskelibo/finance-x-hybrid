# AGENTS.md — Finance X Contributor Guide

Human ve AI contributor'lar için bu repo'da çalışma rehberi.

## 1. Amaç

Finance X, BIST şirketleri için **22 ajanlı kurumsal araştırma orkestrasyon platformu**. Veri toplamadan (KAP, bilançolar) 12 bölümlü Yönetim Kurulu PDF raporuna kadar tüm zinciri bir arada koşturur.

## 2. Önce Bunları Oku

1. `README.md` — üst düzey proje özeti
2. `workflows/full_integrated_analysis.md` — 10 katmanlı pipeline spec
3. `agents/ceo/system_prompt.md` — CEO governance ve review kuralları
4. `agents/orchestrator/system_prompt.md` — dependency chain, task dispatch
5. `agents/report_formatter/system_prompt.md` — rapor format kuralları, metin-görsel dengesi
6. `schemas/shared/agent_output_contract.schema.json` — universal output zarfı

## 3. Repo Haritası

- `backend/` — Node.js orchestrator + Express API + Puppeteer PDF
  - `src/orchestrator.ts` — 22-agent DAG dispatcher
  - `src/agent-runner.ts` — LLM call + prompt injection
  - `src/heartbeat.ts` — otonom CEO döngüsü
  - `src/python/report_formatter/` — deterministik HTML + theme render
  - `src/python/agent_runners/` — 22 Python adapter
  - `src/llm/` — Claude provider + prompt caching
- `dashboard/` — React + Vite UI
- `agents/` — 22 ajan: system_prompt, knowledge, memory, output_schema, agent_spec
- `python-services/` — deterministik hesaplayıcılar (ratio, DCF, macro, technical)
- `prompts/` — shared_directives.md
- `schemas/` — JSON Schema contracts
- `templates/` — legacy root template (canonical: `backend/src/python/report_formatter/template.html`)
- `workflows/` — pipeline workflow specs
- `evals/` — regression evals, golden tests
- `skills/` — Claude Code skills (örn. `para-memory-files`)
- `output/` — generated reports (HTML + PDF)
- `scripts/` — Finance-X özel araçlar (BIST30 indirme, HTML→PDF)

## 4. Geliştirme Kurulumu

```bash
pnpm install
cp .env.example .env   # ANTHROPIC_API_KEY'i doldur
pnpm dev               # backend @ localhost:4000
pnpm dev:dashboard     # dashboard @ localhost:5173
```

## 5. Hızlı Kontroller

```bash
pnpm typecheck         # TS tip kontrolü
pnpm test:run          # Vitest (backend)
```

## 6. Pipeline Modları

| Mod | Süre | Agent sayısı |
|---|---|---|
| `fast_screening` | 10-20 min | ~6 |
| `standard_institutional` | 30-60 min | ~15 |
| `deep_dive` | 90-180 min | 22 |

## 7. Rapor Üretim Akışı

1. CEO task_contract oluşturur
2. Orchestrator DAG'ı çözer, ajanları sırayla/paralel çalıştırır
3. Her ajan `agent_output_contract` zarfında çıktı döner (AJV ile schema validate)
4. QA Review rubric skorlaması yapar; revision_requested ise max 2 retry
5. Strategic_synthesis + final_summary sentezi
6. CEO onayı
7. report_formatter → HTML (deterministik `compose.ts` + opsiyonel LLM narrative)
8. Puppeteer PDF render → `output/pdfs/{ticker}_Yonetim_Kurulu_Raporu_{YYYYMMDD}.pdf`

## 8. Kritik Kurallar

- **Her sayıda** `[KAYNAK: document_id]` veya `[VERİ YOK]` etiketi olmalı (Chairman direktifi)
- Rapor formatter **12 bölümlü** şemaya uyar (canonical: `backend/src/python/report_formatter/template.html`)
- Chart.js **yasaktır**; grafikler `svg_charts.ts` ile deterministik SVG üretilir
- Metin sandviç: her tablo/grafiğin önünde 2 cümle, arkasında 3-5 cümle yorum
- Brand identity: `context_extraction.brand_identity` → CSS `:root` variables → theme preset

## 9. Test Etiket Formatı

Evals ve regression golden'ları ticker başlığıyla dizilir:
- `evals/golden/{TICKER}.expected.json` — beklenen bölüm sayısı, char count, SVG sayısı
- `evals/run-eval.ts` CI'da tüm ticker'ları döngüler

## 10. Lisans

MIT © 2026 Finance X. Katkılar welcome.
