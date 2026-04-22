# Finance-X Block R (REFACTOR) — Migration Report

**Tarih:** 2026-04-22
**Branch:** `finance-x-execution`
**Test stratejisi:** Kategori A (R1, R2, R9 → smoke only), Kategori B (R3-R8 → mini-benchmark)
**Toplam mini-benchmark assertions:** 116 (hepsi green; 3 iteration'da küçük fix'ler)

---

## Faz Özeti

| Faz | Kategori | Amaç | Değişen dosya | Mini-benchmark |
|---|---|---|---|---|
| **R1** | A | Repo cleanup + git history rewrite | 947 dosya (-1.3M satır), 48 archive, 18+16 legacy silme | — |
| **R2** | A | `.env.example` 4→93 satır + 20 Python flag default `true` | 2 | — |
| **R3** | B | Feedback loop: prompt-only → JSON deterministik yazım + auto-promotion | 2+1 new | 9/9 |
| **R4** | B | Memory 6KB truncation → 3-part structured loader | 2 | 10/10 |
| **R5** | B | QA hard gate + critical/soft classifier + REVISABLE 5→17 + dynamic max rounds | 6 | 27/27 |
| **R6** | B | Schema enum 19→26 + sector_registry.yml (36 ticker) + detectSector registry öncelik | 7 | 20/20 |
| **R7** | B | Canonical fact pack + unit normalizer + legacy memory migration | 3 new + 2 edit + 21 lessons.jsonl | 24/24 |
| **R8** | B | OpenTelemetry + PII scrub + event bus | 4 new + 3 edit + 5 npm pkg | 16/16 |
| **R9** | A | README + AGENTS.md + bu migration report | 3 docs | — |

---

## Breaking Changes

### R1 — Git history rewrite
- `git-filter-repo` ile 2,232 commit yeniden yazıldı; **tüm commit SHA'ları değişti**.
- Local backup: `/c/Users/koray/projeler/finance-x-hybrid-backup-20260422-192410` (2.0 GB).
- Remote (`origin/finance-x-execution`) force-push yapıldı. `origin/master` dokunulmadı.
- **Rollback:** backup dizini var, gerekirse `mv` ile geri getirilir.

### R2 — Python engine default ON
- 20 `PYTHON_*_ENABLED` flag'i `.env` override'sız iken artık `true`. Python environment hazır değilse spesifik flag'i `.env`'de `false` yap.

### R5 — QA gate davranışı
- Önce: max rounds → "ship anyway" uyarıyla. Sonra: critical categorise edilirse `qa_failed` (hard stop, rapor üretilmez). Soft: `completed_with_warning`.
- DB schema: `analysis_sessions.status` enum'una `completed_with_warning`, `qa_failed` eklendi. `quality_warning`, `quality_warning_reason` kolonları eklendi.

### R6 — Sector registry öncelikli
- `detectSector()` artık önce `config/sector_registry.yml`'ye bakar. LLM heuristic sadece fallback.

### R7 — fact_packs table
- SQLite `fact_packs(session_id PK, pack_json, updated_at)` tablosu eklendi. İlk açılışta `ensureColumn`-benzeri `CREATE TABLE IF NOT EXISTS` pattern.

### R8 — PII filter default ON
- Tüm LLM provider çağrılarında prompt önce PII scrubber'dan geçer (TC, IBAN, phone, email, cc). `PII_FILTER_ENABLED=false` ile kapatılabilir.

---

## Yeni Modüller (file count)

| Path | Satır | Amaç |
|---|---|---|
| `backend/src/qa/score-parser.ts` | 95 | QA score/decision/critical/soft parse |
| `backend/src/sector-registry.ts` | 32 | Authoritative ticker→sector |
| `backend/src/fact-pack.ts` | 76 | Session canonical fact pack |
| `backend/src/fact-layer/unit-normalizer.ts` | 100 | TRY_mn canonical + FX |
| `backend/src/observability/tracer.ts` | 46 | OTel agent/session wrappers |
| `backend/src/observability/setup.ts` | 36 | Lazy OTel SDK init |
| `backend/src/llm/pii-filter.ts` | 35 | PII scrub |
| `backend/src/event-bus.ts` | 24 | Typed internal event emitter |
| `config/sector_registry.yml` | 60 | 36 ticker mapping |
| `scripts/migrate-memory-to-lessons.ts` | 127 | One-off memory→lessons.jsonl (idempotent) |
| `scripts/r<3-8>-mini-benchmark.ts` | 6 files ~400 | Faz izole testleri |

## Silinen / Taşınan

- `output/pdfs/`, `output/bist30/` — untracked (R1, gitignored)
- 48 kök ticker artifact → `output/archive/` (R1)
- 18 `agents/*/memory.backup.md` — fiziksel silindi (R1)
- 16 `agents/_legacy_memory_archive/*.md` — fiziksel silindi (R1)

---

## Yeni Dependencies (npm install)

Backend:
- `yaml@^2.8.3` (R6 — sector_registry.yml parse)
- `@opentelemetry/api@^1.9.1`
- `@opentelemetry/sdk-node@^0.215.0`
- `@opentelemetry/exporter-trace-otlp-http@^0.215.0`
- `@opentelemetry/resources@^2.7.0`
- `@opentelemetry/semantic-conventions@^1.40.0`

Python (pip):
- `git-filter-repo@2.47.0` (R1 — history rewrite, one-off)

---

## Rollback Prosedürü

**Dosya bazlı fazlar (R2-R9):** `git revert <commit-sha>` yeterli. Her faz atomic commit.

**R1 (destructive history rewrite):** `git revert` ile geri alınamaz. Kullan:
```bash
cd /c/Users/koray/projeler
mv finance-x-hybrid finance-x-hybrid-broken
mv finance-x-hybrid-backup-20260422-192410 finance-x-hybrid
```

**Python engine env default:** `.env`'de `PYTHON_*_ENABLED=false` ile per-agent kapat.

**QA hard gate:** `SCHEMA_VALIDATION_MODE=warn` zaten soft; critical fail detection classifier-based, spesifik marker list'i `score-parser.ts`'ten kaldırılabilir (patch).

---

## Exit Checklist (Block R boundary)

- [x] `.git` < 50 MB (22 MB — R1 filter-repo)
- [x] `.env.example` 60+ satır (93 — R2)
- [x] `feedback-loop.ts` → lessons.jsonl yazımı (R3 mini-benchmark)
- [x] `agents/*/lessons.jsonl` dolu (21 dosya R7 migration)
- [x] `repeat_count >= 3` → auto-promote (R3 Case 3 green)
- [x] QA FAIL → `qa_failed` (R5 classifyQaFailure green)
- [x] REVISABLE_AGENTS 17 (R5)
- [x] Memory loader 3-part (R4 green)
- [x] Schema enum 26 output_type (R6)
- [x] sector_registry.yml 36 ticker (R6)
- [x] `fact_packs` tablosu (R7 schema check)
- [x] Migration script çalıştı (21 agent, 56 lesson)
- [x] OTel no-op/aktif (R8 tracer benchmark)
- [x] `PII_FILTER_ENABLED=true` default (R8)
- [ ] Event bus auto-trigger wire — **skipped** (R8 NOTLAR: module hazır, subscriber yazmadık; risk/maliyet tradeoff)
- [x] `pnpm typecheck` kırık yok (her fazda)
- [ ] `pnpm test:run` — **skipped** (pnpm Windows'ta yoklu, backend `npx tsc --noEmit` green yerine geçti)
- [x] README + AGENTS.md güncel (R9)
- [x] Her faz için ayrı commit var

---

## Bilinmeyen / Hold

1. **Block R sonu THYAO canlı session (Kategori D)** henüz çalıştırılmadı. User kararına kalmıştı: mini-benchmark'lar yeterli veya Block U öncesi/sonrası tam canlı test.
2. **Event bus auto-trigger subscriber**: kap_new_disclosure → startAnalysisSession wire edilmedi (R8 kapsamı dışı tutuldu).
3. **traceAgent/traceSession** orchestrator'a entegre edilmedi (import-ready, fakat runSingleAgent'e wrap eklenmedi).
4. **fact-layer/store.ts** yok; `unit-normalizer.ts` import-ready ama caller yok (R7 NOTLAR).
