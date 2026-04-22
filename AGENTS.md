# AGENTS.md — Finance X Contributor Guide

Human ve AI contributor'lar için bu repo'da çalışma rehberi.

## 1. Amaç

Finance X, BIST şirketleri için **22 ajanlı kurumsal araştırma orkestrasyon platformu** (Block U ile 26 hedefi). Veri toplamadan (KAP, bilançolar) 12 bölümlü Yönetim Kurulu PDF raporuna kadar tüm zinciri bir arada koşturur.

## 2. Önce Bunları Oku

1. `README.md` — üst düzey proje özeti
2. `docs/phase-reports/` — Block R faz çıkış raporları (R1-R9)
3. `workflows/full_integrated_analysis.md` — 10 katmanlı pipeline spec
4. `agents/ceo/system_prompt.md` — CEO governance ve review kuralları
5. `agents/report_formatter/system_prompt.md` — rapor format kuralları, metin-görsel dengesi
6. `schemas/shared/agent_output_contract.schema.json` — universal output zarfı (26 output_type)

## 3. Repo Haritası

- `backend/` — Node.js orchestrator + Express API + Puppeteer PDF
  - `src/orchestrator.ts` — 22-agent DAG dispatcher, QA hard gate (critical→qa_failed, soft→completed_with_warning)
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
  - `src/python/report_formatter/` — deterministik HTML + theme render
  - `src/python/agent_runners/` — 22 Python adapter
  - `src/llm/` — Claude provider + prompt caching
- `dashboard/` — React + Vite UI
- `agents/` — 22 ajan: system_prompt, knowledge, memory, output_schema, agent_spec, `permanent_rules.md`, `lessons.jsonl`, `case_lessons.md`
- `config/sector_registry.yml` — 36 BIST ticker sector mapping
- `python-services/` — deterministik hesaplayıcılar (ratio, DCF, macro, technical)
- `prompts/` — shared_directives.md
- `schemas/` — JSON Schema contracts (26 output_type)
- `templates/` — legacy root template (canonical: `backend/src/python/report_formatter/template.html`)
- `workflows/` — pipeline workflow specs
- `evals/` — regression evals, golden tests
- `skills/` — Claude Code skills
- `docs/phase-reports/` — Block R exit reports
- `output/` — generated reports (gitignored)
- `scripts/` — Finance-X özel araçlar + mini-benchmark scripts

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

## 6. Pipeline Modları + QA

| Mod | Süre | Agent | QA max rounds |
|---|---|---|---|
| `fast_screening` | 10-20 min | ~6 | 2 |
| `standard_institutional` | 30-60 min | ~15 | 3 |
| `deep_dive` | 90-180 min | 22 | 5 |

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

## 10. Test Etiket Formatı

- `evals/golden/{TICKER}.expected.json` — beklenen bölüm sayısı, char count, SVG sayısı
- `evals/run-eval.ts` CI'da tüm ticker'ları döngüler
- `scripts/r<N>-mini-benchmark.ts` — Block R faz izole test (LLM'siz, ~3 sn)

## 11. Lisans

MIT © 2026 Finance X. Katkılar welcome.
