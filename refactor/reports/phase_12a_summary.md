# Phase 12A Summary — Node Migration Apply Tool

- Branch: `refactor/phase-12a-migration-tool`
- Başlangıç: `refactor/phase-11a-observability-dashboard` HEAD (commit 9d51a312)
- Davranış değişimi: **SIFIR runtime change**. Canlı DB üzerinde yürütülen 5 migration'ın kendi davranış değişimi sıfır (hepsi observe-only already).

## Hedef

`sqlite3` CLI'ı bağımsız kalmak, Windows makinelerde migration aşamasını
açmak, her migration sonrası backup alarak Phase 3A/4A/5A/6A observer
kolonlarını canlı DB'ye taşımak.

## Problem

- `backend/finance-x.db` 0 byte (eski konum), gerçek DB `backend/data/financex.db`
- Windows'ta `sqlite3` CLI yoktu → migration uygulanamıyordu
- Phase 3A-6A observer'lar "migration_applied: false" modunda sessiz no-op'lardı
- Phase 11A dashboard data göremiyordu

## Ne yapıldı

### 1. `backend/src/scripts/apply-migrations.ts` (YENİ)

Node-native migration runner. `better-sqlite3` (zaten dep) kullanır.

Komutlar:

```bash
npx tsx src/scripts/apply-migrations.ts --help
npx tsx src/scripts/apply-migrations.ts --status              # list + applied yes/no
npx tsx src/scripts/apply-migrations.ts --all                 # apply all pending
npx tsx src/scripts/apply-migrations.ts --file=phase4_schema_observation
npx tsx src/scripts/apply-migrations.ts --all --dry-run       # no writes
```

Özellikler:

- **Registry:** `schema_migrations` tablosu (id, applied_at, source_file, sha256). Uygulanmış migration re-apply'da "skipped" döner — idempotent.
- **Backup:** her migration öncesi `data/backups/financex.pre-<basename>-<ISO_TS>.db` olarak kopya. Dry-run'da skip.
- **Transaction strip:** SQL dosyalarındaki `BEGIN TRANSACTION` / `COMMIT` satırları runtime'da strip edilir (better-sqlite3 nested tx desteklemiyor). Dosyada bulunmaları human-run sqlite3 CLI uyumluluğu için yine korundu.
- **Atomic apply:** her migration → outer `db.transaction(() => { exec(innerSQL); INSERT registry; })` — eğer registry INSERT fail olursa ALTER TABLE da rollback.
- **Error halts chain:** bir migration hata verirse sonrakiler uygulanmaz, işler consistent state'te kalır.

### 2. Canlı DB'ye 5 migration uygulandı

Bu commit'in kendisi tarafından:

```
✅ phase2_context_budget.sql        (2523 bytes, 13 cols + 3 idx on agent_runs)
✅ phase3a_gate_events.sql          (1777 bytes, gate_events table + 3 cols + 4 idx)
✅ phase4_schema_observation.sql    (1100 bytes, validation_category + details + idx)
✅ phase5_manifest_observation.sql  (1557 bytes, 5 manifest cols + 2 idx)
✅ phase6_checklist_observation.sql (1355 bytes, 5 session cols + 4 agent cols + 2 idx)

summary: applied=5 skipped=0 errors=0
DB size:  1183744 → 1437696 bytes
```

Backup'lar `backend/data/backups/` altında (gitignore'da — yeterince büyük).

### 3. Re-apply idempotency test

```
npx tsx src/scripts/apply-migrations.ts --all
  → summary: applied=0 skipped=5 errors=0
```

Doğrulandı.

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
npx tsx src/scripts/apply-migrations.ts --help              exit 0
npx tsx src/scripts/apply-migrations.ts --status            exit 0 (shows all 5 applied)
npx tsx src/scripts/apply-migrations.ts --all               exit 0 (idempotent no-op)
python canonical/_loader/python/loader.py --selftest        OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json                          OK (15/15)
python evals/golden/canonical_structure_test.py             OK
```

## Canlı davranış beklenen değişimi

- Migration uygulandığından itibaren her session çalıştırıldığında:
  - `agent_run_gate_events` tablosu dolar (Phase 3A)
  - `agent_runs.schema_shadow_violation_count` / `validation_category` / `manifest_*` kolonları dolar (Phase 3A/4A/5A)
  - `analysis_sessions.addressal_rate` session bitiminde hesaplanır (Phase 6A)
- Phase 11A dashboard endpoints (`/api/refactor/*`) artık gerçek data döner.

## Migration → Phase 3B shadow-warn geçiş

Migration uygulandığı için Phase 3B/4B/5B/6B/7B geçiş kapısının adım 1 (migration applied) ✅. Kalan gate'ler:

- 10+ live session observe data
- Category/rule/addressal distribution review
- Human sign-off

Hiçbiri bu commit'te değiştirilmedi.

## Kapsam dışında (sonraki)

- Phase 12B: migration down/rollback (şu an forward-only).
- Phase 12C: schema registry diff (agent_runs expected cols vs live cols).
- CI integration — auto apply on deploy (production senaryosu).
