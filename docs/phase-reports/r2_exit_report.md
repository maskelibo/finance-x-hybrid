# R2 — .env.example + Python Engine Default — Exit Report

- **Faz:** R2 (Block R)
- **Kategori:** A (smoke test yeterli)
- **Branch:** `finance-x-execution`
- **Commit:** `fa4ec7f4` — `feat(config): enable Python hybrid engine defaults + complete .env.example [finance-x-audit R]`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

### `.env.example` tam yeniden yazım

**Önce:** 4 satır (PORT, 2 provider, permission mode).
**Sonra:** **93 satır**, 9 kategori section:

| Section | Vars |
|---|---|
| Core LLM / Claude | 6 (ANTHROPIC_API_KEY, CLAUDE_MODEL, CLAUDE_MODEL_LIGHT, CLAUDE_OUTPUT_FORMAT, CLAUDE_PERMISSION_MODE, CLAUDE_PATH) |
| LLM routing | 2 (LLM_PRIMARY/FALLBACK_PROVIDER) |
| Server | 3 (PORT, FINANCE_X_ROOT, FINANCE_X_ALLOWED_ORIGINS) |
| Context / Digest | 4 (CONTEXT_CHAR_LIMIT, DIGEST_MODE, TARGETED_KNOWLEDGE_INJECTION, UPSTREAM_DIGEST_MODE) |
| Core feature flags | 6 (FINANCIAL_ENGINE, REPORT_PAYLOAD_MODE, FORMATTER_MINIMAL_CONTEXT, OPTIMIZED_PIPELINE, REGRESSION_EVAL, BYPASS_CEO_FOR_TESTS) |
| Schema validation | 2 (SCHEMA_VALIDATION_MODE=warn, SCHEMA_SOFT_BLOCK_AGENTS) |
| QA checklist | 2 (CHECKLIST_ENFORCEMENT_MODE, CHECKLIST_MIN_ADDRESSAL_RATE) |
| Timeouts / Stall / Heartbeats | 5 (STUCK_AGENT_THRESHOLD_MS, PROVIDER_STALL_TIMEOUT_S, HEARTBEAT/WATCHDOG/NIGHT_TRAINING) |
| **Python hybrid (21)** | PYTHON_PIPELINE + 19 per-agent _ENABLED + PYTHON_TECHNICAL_BARS (hepsi default `true`, BARS=250) |
| External data providers | 7 (EVDS_API_KEY, NEWSAPI_KEY, OPENAI_API_KEY, QDRANT_URL/API_KEY, DOCUMENT_INTEL_ENABLED, SKILLS_ENABLED) |
| Logging | 2 (LOG_LEVEL, LOG_FORMAT) |

**Kaynak:** `_audit/03_ENV_EXAMPLE_TASLAK.md` diskte yoktu (B seçeneği onaylandı). `backend/src/config.ts`'deki tüm `process.env.*` kullanımları derlendi + master spec'in key points'i eklendi (ANTHROPIC_API_KEY, EVDS, NEWSAPI, LOG_LEVEL, LOG_FORMAT, DOCUMENT_INTEL, SKILLS).

### `backend/src/config.ts` — Python flag default flip

20 satır `|| 'false'` → `?? 'true'` dönüştürüldü (L.128-148, TECHNICAL_BARS hariç):

```
PYTHON_PIPELINE_ENABLED, PYTHON_KAP_WATCH_ENABLED, PYTHON_DATA_COLLECTION_ENABLED,
PYTHON_PARSE_STANDARDIZATION_ENABLED, PYTHON_RECONCILIATION_ENABLED,
PYTHON_FINANCIAL_ANALYSIS_ENABLED, PYTHON_TECHNICAL_ANALYSIS_ENABLED,
PYTHON_MACRO_ANALYSIS_ENABLED, PYTHON_ANALYST_CONSENSUS_ENABLED,
PYTHON_SENTIMENT_NEWS_ENABLED, PYTHON_ESG_ENABLED,
PYTHON_EVENT_CLASSIFICATION_ENABLED, PYTHON_EVENT_IMPACT_MAPPER_ENABLED,
PYTHON_EVENT_TIMELINE_ALERT_ENABLED, PYTHON_VALUATION_ENABLED,
PYTHON_STRATEGIC_SYNTHESIS_ENABLED, PYTHON_QA_REVIEW_ENABLED,
PYTHON_COO_ENABLED, PYTHON_REPORT_FORMATTER_ENABLED, PYTHON_SECTOR_COMPETITION_ENABLED
```

### `SCHEMA_VALIDATION_MODE` default değişti
`'soft_block'` → `'warn'` (master spec istiyor). `??` ile nullish-coalesce semantik eşleme (önceki `||` boş-string'i de düşürüyordu; farkın operasyonel etkisi yok çünkü env var ya set ya değil).

---

## STEP 2 — SMOKE TEST

| Kriter | Komut | Sonuç |
|---|---|---|
| `.env.example` 60+ satır | `wc -l .env.example` | ✅ **93** |
| 20 `PYTHON_*_ENABLED` export | `grep -cE "^export const PYTHON_.*_ENABLED "` | ✅ **20** |
| Tüm Python flag'i `?? 'true'` | `grep -cE "PYTHON_.*_ENABLED \?\? 'true'"` | ✅ **20** |
| Python flag'de residual `\|\| 'false'` | `grep -cE "PYTHON_.*_ENABLED.*\|\| 'false'"` | ✅ **0** |
| `SCHEMA_VALIDATION_MODE = 'warn'` | grep | ✅ **L.281** confirmed |
| TypeScript typecheck | `cd backend && npx tsc --noEmit` | ✅ **Exit 0** |

Sadece 1 non-Python flag `|| 'false'` kullanıyor: `BYPASS_CEO_FOR_TESTS` (L.103) — doğru (test-only bypass, default false kalmalı).

---

## STEP 3 — LIVE BENCHMARK

⏭️ **SKIPPED — Kategori A.**

Gerekçe: R2 sadece config default'larını değiştirdi. Python agent davranışı `.env` dosyası ile override edilmediği sürece artık "true" başlıyor olacak — bu, canlı session'da görülür ama R2'nin kendisi davranış üretmez. Python agent'ların gerçekten çalışıp çalışmadığı sonraki fazların benchmark'ında doğrulanacak (R3 feedback loop → mini-benchmark; block sonu THYAO full).

---

## STEP 4 — DEFECT DETECTION

**Bulunan sorunlar:**
- `_audit/03_ENV_EXAMPLE_TASLAK.md` kaynağı diskte yok — user onayıyla B seçeneği uygulandı (config.ts + master derleme).
- Cwd persist leak `cd backend` sonrası — absolute path ile düzeltildi.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 2 dosya değişti (+112 -23), 20+ env var dokümante edildi, 21 flag true'ya çekildi
STEP 2: ✅ 5/5 acceptance + typecheck green
STEP 3: ⏭️ SKIPPED (Kategori A)
STEP 4: ✅ 0 açık defect
```

🟢 **GO — R2 tamamlandı. R3'e geçiliyor (otonom mod).**

---

## NOTLAR

- **Python dependency chain uyarısı**: `validatePythonFlagDependencies()` (config.ts L.173-247) modül yüklemede çalışıyor; default=true durumunda tüm zincir eşit (tümü true) olduğu için uyarı üretmeyecek. Kullanıcı `.env`'de herhangi birini false yaparsa downstream uyarı görünür (beklenen davranış).
- **BYPASS_CEO_FOR_TESTS** default `false` bırakıldı — CEO gate test senaryoları için bypass.
- **Default shift operasyonel etkisi**: Python adapter'lar artık .env override olmadığında **hepsi aktif**. Eğer Python servisi (python-services/) kurulu değil veya import hataları varsa, LLM fallback'e düşmeli (`llm_fallback.ts`). İlk canlı session'da gözlenecek; R3-R8 mini-benchmark'larda sinyal gelirse root-cause analiz edilir.
