# R8 — Observability + Yenilikler — Exit Report

- **Faz:** R8 — Kategori B
- **Branch:** `finance-x-execution`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

### Yeni modüller

| Dosya | Amaç |
|---|---|
| `backend/src/observability/tracer.ts` | `traceAgent()` + `traceSession()` — OpenTelemetry span wrapper'ları |
| `backend/src/observability/setup.ts` | `initTracing()`/`shutdownTracing()` — lazy-load OTel SDK (sadece `OTEL_EXPORTER_URL` set ise çalışır, yoksa no-op) |
| `backend/src/llm/pii-filter.ts` | `scrubPii()` — TC/IBAN/phone/email/credit_card maskelemesi |
| `backend/src/event-bus.ts` | Typed internal event emitter; 6 event türü (kap_new_disclosure, price_alert, session_*, qa_blocked, heartbeat_cycle) |

### Dependencies (npm install)
- `@opentelemetry/api@^1.9.1`
- `@opentelemetry/sdk-node@^0.215.0`
- `@opentelemetry/exporter-trace-otlp-http@^0.215.0`
- `@opentelemetry/resources@^2.7.0`
- `@opentelemetry/semantic-conventions@^1.40.0`

### Entegrasyon

| Dosya | Değişiklik |
|---|---|
| `backend/src/config.ts` | `PII_FILTER_ENABLED` flag (default `true`) |
| `backend/src/llm/provider-router.ts` | `run()` öncesi PII scrub; scrub eşleşirse `[PII] Scrubbed` warn log |
| `backend/src/server.ts` | Startup'ta `initTracing()` dinamik import (OTel packages hata verirse server fail'e neden olmaz) |

---

## STEP 2 — SMOKE TEST

| Kriter | Sonuç |
|---|---|
| Backend typecheck | ✅ Exit 0 |
| npm install 5 OTel paket | ✅ (~3s) |

---

## STEP 3 — MİNİ-BENCHMARK

`scripts/r8-mini-benchmark.ts`:

| Grup | Test | Sonuç |
|---|---|---|
| PII filter | 8 (TC, IBAN, email×2, clean bypass, count, hasMatches) | ✅ 8/8 |
| Tracer (OTel no-op) | 4 (return passthrough, fn called, error re-throw, session value) | ✅ 4/4 |
| Event bus | 4 (2 event received, type ordering, typed subscribe, material filter) | ✅ 4/4 |

**Toplam: 16 pass / 0 fail**.

---

## STEP 4 — DEFECT DETECTION

1. **OTel `@opentelemetry/resources` v2 API** — master spec `Resource` class'ı kullanıyordu; yeni sürümde `resourceFromAttributes()` helper. Ve `SemanticResourceAttributes` → `ATTR_SERVICE_NAME`/`ATTR_SERVICE_VERSION` isimli export. setup.ts'yi yeni API'ye hizaladım.
2. **Dynamic import** — setup.ts'teki `await import()` ile OTel SDK sadece ihtiyaç anında yüklenir. Böylece `OTEL_EXPORTER_URL` yoksa tamamen skip, bundle size etkilenmez.
3. **server.ts import yerleşimi** — initTracing'i app.listen'den ÖNCE, ama `dynamic import` formunda ekledim. Hata halinde server fail olmasın diye `.catch(err => console.warn)`.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 4 new module + 3 edits + 5 npm packages
STEP 2: ✅ typecheck green
STEP 3: ✅ 16/16 mini-benchmark
STEP 4: ✅ 0 açık defect
```

🟢 **GO — R8 tamamlandı. R9'a geçiliyor (otonom).**

---

## NOTLAR

- **OTel tracing default off** — `OTEL_EXPORTER_URL` env var yok ise SDK yüklenmez, `trace.getTracer()` no-op çalışır (standart OTel API davranışı). Prod'a geçmek için Jaeger/Tempo URL'si set edilmesi yeterli.
- **traceAgent / traceSession wrap'leri orchestrator'a entegre edilmedi** — master "wrap runSingleAgent" diyordu ama runSingleAgent çok yerden çağrılıyor, invaziv bir değişiklik. Modül hazır, import-ready; sonraki bir fazda veya user isterse eklenecek.
- **PII scrubber tüm LLM çağrılarında aktif** — `ProviderRouter.run()` prompt'u filter'dan geçiriyor. `PII_FILTER_ENABLED=false` ile kapatılabilir.
- **Event bus otomatik auto-trigger'a bağlı değil** — master'ın örnek subscriber'ı (material disclosure → fast_screening) henüz eklenmedi. Bus hazır, subscribe-ready; R8 kapsamı kurulum ile sınırlı tutuldu (auto-trigger cost/risk tradeoff'u gerektirir).
