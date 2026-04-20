# Phase 3A Summary — Observe-Only Instrumentation

- Branch: `refactor/phase-3a-observe-only`
- Başlangıç: `refactor/phase-2-canonical` b66f7993 üzerinden dallandı
- Mode: autonomous overnight, user-authorized
- Davranış değişimi: **SIFIR**. Rapor üreteci bugünkü davranışını koruyor.

## Hedef

Codex'in 7-aşamalı migration kuralının **Aşama 1 (observe-only)** kısmını uygulamak. QA/CEO gate'lerinin "bugün sert olsaydı ne olurdu?" sorusunu veriye bağlamak. Şema derinlik ihlallerini log'lamak. Kimseyi bloklamamak.

## Ne yapıldı

### 1. DB şeması

`backend/src/migrations/phase3a_gate_events.sql` — salt-additive migration:

- Yeni tablo `agent_run_gate_events` (id, session_id, ticker, runtime_mode, gate_kind, qa_round, would_have_blocked, decision_taken, reason, detail_json, score_numeric, created_at) + 4 index.
- `agent_runs` tablosuna 3 yeni nullable kolon: `schema_shadow_violation_count`, `schema_shadow_violations_json`, `qa_would_block_last`.

Stub sqlite testi geçti (12/12 kolon, 5/5 index).

### 2. Gate observer kütüphanesi

`backend/src/gate-observer.ts` — üç observe-only helper:

- `recordQaGateObservation({keywordBlock, scoreBlock, decisionTaken, qaRound, …})` — QA loop'unun her tur sonucunu DB'ye yazar.
- `recordCeoGateObservation({approvalFailureCount, approvalFailureReasons, decisionTaken})` — CEO gate kararını yazar.
- `recordSchemaShadowObservation({agentId, violationCount, violations})` — şema derinlik ihlal sayısını yazar.
- `markQaWouldBlockLast(sessionId, wouldBlock)` — `agent_runs` satırına flag basar.

Migration henüz uygulanmadıysa her insert sessizce no-op olur ve bir kere uyarı basar. Pipeline asla kırılmaz.

### 3. Orchestrator wiring

`backend/src/orchestrator.ts` — 4 observe-only çağrı eklendi, hiçbir kontrol akışı değişmedi:

- QA gate PASS noktası (line ~1302): `recordQaGateObservation(..., decisionTaken='passed', wouldHaveBlocked=false)`.
- QA gate MAX-rounds reached (line ~1308): `recordQaGateObservation(..., decisionTaken='delivered_with_warning', wouldHaveBlocked=true)`. **Burası "bugünkü davranış rapor çıkarır ama sert gate bloklardı" kayıt noktası.**
- QA gate revision (line ~1329): `recordQaGateObservation(..., decisionTaken='revised', wouldHaveBlocked=true)`.
- CEO approval gate (line ~1515 & 1534): observe-only, hem pass hem continued_with_warning ayrı ayrı kaydedilir.

Her biri existing log satırının yanına eklenen 5-10 satır. `break` / `return` akışına dokunulmadı.

### 4. Schema shadow validator

`backend/src/schema-shadow-validator.ts` — canonical `mandatory_metrics.yaml` + `interpretation_depth` + `null_handling_protocol.md` kurallarının observe-only uygulayıcısı. Her agent çıktısı için şunları kontrol eder:

- **Interpretation derinlik floor'ları:** observation ≥ 80, reasoning ≥ 120, counterargument ≥ 60, implication ≥ 80 karakter.
- **metrics_array ≥ 28 items** (yalnızca `financial_analysis`).
- **OI-002:** `engine_snapshot` anahtarları `metrics_array` anahtarlarının alt kümesi olmalı.
- **IAS 29 trio:** metin IAS 29 ifa ediyorsa MM-04/05/06 üçlüsü hepsi bulunmalı.
- **MM-25 guard:** ROE geçiyorsa mutlaka CoE karşılaştırması olmalı.

Ajan çıktısı kabul edilir/reddedilmez — sadece ihlaller `agent_run_gate_events.schema_shadow` + `agent_runs.schema_shadow_violation_count` kolonlarına yazılır.

`orchestrator.ts`'de çağrı yeri: Agent tamamlandıktan hemen sonra (`UPDATE agent_runs SET status='completed'...` sonrası, mevcut `validateAgentOutput` çağrısından önce), `try/catch` ile sarılı. Shadow validator herhangi bir sebeple fail olursa pipeline devam eder.

### 5. Registry reconciliation

`agents_registry.json` → 21 → 26 agent. Eklenen 5:

- `coo` (management, reports_to=ceo)
- `valuation_agent` (specialist, reports_to=orchestrator)
- `sentiment_news_agent` (specialist, reports_to=orchestrator)
- `analyst_consensus_agent` (specialist, reports_to=orchestrator)
- `esg_agent` (specialist, reports_to=orchestrator)

Hepsi runtime'da zaten çalıştığı için davranış değişmedi; sadece dashboard / agent_performance_review / monitoring tarafı artık tam listeyi görecek.

### 6. Phase 3 readiness doc yeniden yazıldı

`refactor/reports/phase_3_readiness.md` — önceki "4 binary karar" versiyonunun yerine 7-aşamalı rollout tablosu geçti. QA/CEO/schema/manifest/retrieval/formatter/memory-purge/dead-code hepsinin hangi aşamada olduğu tek tabloda görülebilir.

## Tests

```
npx tsc --noEmit                                 # exit 0 — orchestrator + new files clean
python canonical/_loader/python/loader.py --selftest   # OK (all 50+ checks)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json
                                                  # OK — no regression
stub-sqlite apply phase3a_gate_events.sql         # 12/12 cols + 5/5 idx OK
```

## Canlı davranış beklenen değişimi

**Hiçbir.** Aynı süre, aynı süreç, aynı çıktı. Tek fark: `agent_run_gate_events` ve `agent_runs.schema_shadow_violation_count` kolonları doldurulmaya başlar.

**Ama** `phase3a_gate_events.sql` migration'ı canlı DB'ye uygulanmadıkça observer sessiz kalır (bir kere stdout'ta uyarı basar). Migration uygulama adımı:

```bash
cp backend/finance-x.db backups/finance-x_pre_phase3a_$(date +%Y%m%d_%H%M%S).db
sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql
sqlite3 backend/finance-x.db < backend/src/migrations/phase3a_gate_events.sql
```

(Phase 2 migration'ı da hâlâ uygulanmadı; iki dosyayı birlikte çalıştırmak tavsiye edilir.)

## Phase 3A → 3B geçiş kapısı

3B'ye geçmek için:

1. Migration uygulandı.
2. En az 10 seans çalıştırıldı (her ticker/mod kombinasyonundan en az 1 örnek).
3. Kullanıcı `SELECT gate_kind, decision_taken, COUNT(*) FROM agent_run_gate_events GROUP BY 1,2` sonucuna baktı.
4. `SELECT agent_id, SUM(schema_shadow_violation_count) FROM agent_runs GROUP BY agent_id ORDER BY 2 DESC` ile en sık ihlal eden agent'lar çıkarıldı.
5. İnsan "bu veriyle güvenle 'warn' aşamasına geçebilirim" dedi.

Bu karar otomatik değil — her aşama geçişinde insan gate'i var.

## Sonraki adım (bu gece devam eden iş)

Phase 3A bitti. Kalan gece işleri:

- **R** — Pending finding #1: `compose.ts` markdown fallback (rapor "Raporlanmadı" placeholder'ları problemi).
- **S** — Pending finding #3: QA revision routing per-agent.
- **T** — TUPRS deep-dive comprehensive report.
- Pending finding #2 (delta revision) kullanıcı tarafından rafa kaldırıldı.
