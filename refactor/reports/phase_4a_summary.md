# Phase 4A Summary — Schema Hardening (Observe-Only)

- Branch: `refactor/phase-4a-schema-observe`
- Başlangıç: `refactor/phase-3a-observe-only` HEAD (commit 6613a289 — MacBook handoff)
- Mode: autonomous, user-authorized ("kaldığın yerden devam et")
- Davranış değişimi: **SIFIR**. Rapor üreteci bugünkü davranışını koruyor.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §8 uygulama sırası adım 5-6: **schema hardening** ve
**validation gate + 4-kategori retry**. Her ikisi de Codex'in 7-aşamalı
rollout kuralının Aşama 1 (observe-only) kısmında. Pipeline, mevcut
davranışın yanına "bugün sert schema olsaydı ne olurdu?" sorusunun cevabını
log'luyor.

## Ne yapıldı

### 1. Şema hardening (şekil tanımları, opsiyonel)

`schemas/shared/agent_output_contract.schema.json` — 7 yeni opsiyonel alan
eklendi. Root'taki `additionalProperties: false` zaten vardı; alanlar
`properties` altında tanımlandığı için mevcut payload'lar aynen geçer.

| alan | amaç | canonical bağlantı |
| --- | --- | --- |
| `findings[]` | Agent'ın upstream veya kendi eksikliği için raise ettiği bulgu listesi | — |
| `addressed_findings[]` | Downstream'in upstream finding'lere `fixed / acknowledged / rejected` cevabı | — |
| `metrics_array[]` | 28 zorunlu metrik (MM-01..MM-28) | `canonical/rules/mandatory_metrics.yaml` |
| `engine_snapshot` | Deterministic engine'in hesapladığı alt küme | `OI-002` |
| `interpretations[]` | Yorumsal bloklar (topic + observation ≥80, reasoning ≥120, counterargument ≥60, implication ≥80) | `interpretation_depth` |
| `counterargument` / `implication` | Tek bloklu çıktılar için top-level karşı-argüman ve implikasyon | `MM-25_roe_without_coe` |

Alanlar çok özel canonical kuralları (finding_id, MM-XX pattern, category
enum, severity enum) enforce ediyor **şekilsel olarak**; runtime schema
validator bunlar için hâlâ `warn` modunda — shadow-validator ve
validation-gate derinlik kuralını takip ediyor.

### 2. Kırık `$ref` fix

`refactor/inventory/schema_audit.md` Phase 1'de işaretlediği 2 broken ref:

```
agents/event_impact_mapper/output_schema.json  → https://financex.io/schemas/shared/evidence  ❌
agents/financial_analysis/output_schema.json   → https://financex.io/schemas/shared/evidence  ❌
```

İkisi de `https://financex.internal/schemas/shared/evidence.schema.json`'a
düzeltildi (zaten repo'da olan dosyanın `$id`'si). `$id` domain mismatch'i
repo genelindeki diğer agent şemalarında (`financex.io`) korunuyor —
toplu rename Phase 4B/C işi.

### 3. Schema shadow validator — 4 yeni kural

`backend/src/schema-shadow-validator.ts`:

| kural | ne bakar |
| --- | --- |
| `qa_overall_score_missing` | qa_review çıktısında `overall_score` (0..1 sayı) bulunuyor mu |
| `addressed_findings_set_mismatch` | Aynı doküman içinde `findings[]` ve `addressed_findings[]` varsa `finding_id` kümeleri eşit mi |
| `addressed_finding_shallow` | `addressed_findings[].explanation` 30 karakterden kısa mı |
| `metrics_array_item_malformed` | `metrics_array[].id` canonical MM-XX pattern'ine uyuyor mu |

`shadowValidate()` signature'ı **additive**: hâlâ void callback'lere uygun,
ek olarak `{ violations: Violation[] }` return ediyor (validation-gate bunu
kullanıyor).

### 4. Validation gate scaffold

Yeni dosya `backend/src/validation-gate.ts` — 4-kategori taxonomy'sinin
canonical classifier'ı:

- `missing_metric` — metrics_array_size, metrics_array_item_malformed
- `unaddressed_finding` — addressed_findings_set_mismatch,
  upstream_finding_not_addressed (cross-agent)
- `shallow_interpretation` — interpretation_depth, addressed_finding_shallow,
  qa_overall_score_missing
- `broken_structure` — json_block_missing, OI-002_engine_snapshot_subset,
  IAS29-001_trio_missing, MM-25_roe_without_coe, shadow_validator_internal_error

`classifyAndRecord({ sessionId, agentId, … })`:

1. Shadow validator'ın raise ettiği violation'ları alır.
2. **Cross-agent acknowledgement check:** session'ın son qa_review çıktısını
   oku, `quality_flags[]` içinden bu agent'ı target alan finding'leri bul,
   current output'un `addressed_findings[]` ile eşleştir. Eşleşmeyen her ID
   → `upstream_finding_not_addressed` violation.
3. Hepsini 4 kategoriye ayır.
4. En kötü kategoriyi `agent_runs.validation_category`'ye yaz.
5. Tam breakdown'u `agent_runs.validation_category_details_json`'a yaz
   (≤8 KB, top 20 violation).

**Hiçbiri bloklamaz, routing yapmaz, retry tetiklemez.** Phase 4A
contract'ı: *"sadece gözle, kayıt al, insan karar verene kadar bekle"*.

### 5. Migration (UYGULANMADI)

`backend/src/migrations/phase4_schema_observation.sql`:

```sql
ALTER TABLE agent_runs ADD COLUMN validation_category TEXT;
ALTER TABLE agent_runs ADD COLUMN validation_category_details_json TEXT;
CREATE INDEX IF NOT EXISTS idx_agent_runs_validation_category
  ON agent_runs(validation_category);
```

Strictly additive, salt-additive ALTER TABLE. Migration README'e satır
eklendi. `validation-gate.ts` kolonlar yokken sessiz no-op olur.

### 6. Orchestrator wiring

`backend/src/orchestrator.ts` — line ~988 civarındaki Phase 3A
`shadowValidate` çağrısının tam altına `classifyAndRecord` eklendi. Yapı:

```ts
const shadowResult = shadowValidate(agentId, result.output, { ... });
try {
  classifyAndRecord({
    sessionId, agentId, ticker,
    runtimeMode: runtimeModeForShadow,
    shadowViolations: shadowResult.violations,
    currentOutput: result.output,
  });
} catch { /* validation-gate must not break the pipeline */ }
```

İç `try/catch` dış Phase 3A try/catch'inin içinde — çift güvenlik halkası.
`break` / `return` akışına dokunulmadı.

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
python canonical/_loader/python/loader.py --selftest       OK (50+ cross-checks)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json
                                                           OK (15/15 no regression)
python refactor/tools/prompt_memory_lint.py                20 hard / 27 soft / 130 info
                                                           (baseline eşit, regresyon yok)
```

## Canlı davranış beklenen değişimi

**Hiçbir.** Aynı süre, aynı süreç, aynı çıktı. Migration uygulandığında
agent_runs satırlarına `validation_category` kolonu dolmaya başlar; bu
dashboard ve Phase 4B shadow-warn eşiklerinin okuma noktası.

Migration uygulama (Phase 4A'ya özgü):

```bash
cp backend/finance-x.db backups/finance-x_pre_phase4a_$(date +%Y%m%d_%H%M%S).db
sqlite3 backend/finance-x.db < backend/src/migrations/phase4_schema_observation.sql
sqlite3 backend/finance-x.db 'PRAGMA table_info(agent_runs);' | grep validation_category
```

Phase 2 + 3A migration'ları daha önce uygulanmamışsa aynı sırayla
öncelikle onlar. Migration'lar idempotent değil (çifte ALTER hata verir),
sadece bir kez.

## Phase 4A → 4B geçiş kapısı

4B shadow-warn'a geçmek için:

1. Migration uygulandı.
2. En az 10 seans çalıştırıldı (her mode'dan en az 1).
3. Kullanıcı
   `SELECT validation_category, COUNT(*) FROM agent_runs WHERE validation_category IS NOT NULL GROUP BY 1 ORDER BY 2 DESC;`
   sonucuna baktı — hangi kategoride en çok ihlal var, hangi agent en sık
   hatalı.
4. Kullanıcı `SELECT agent_id, validation_category, COUNT(*) FROM agent_runs GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20;`
   ile en sık ihlal eden agent + kategori çiftlerini çıkardı.
5. Cross-agent acknowledgement oranı (upstream_finding_not_addressed sayısı
   / qa_review'den geçen finding sayısı) hesaplandı.
6. İnsan "bu veriyle güvenle 'warn' aşamasına geçebilirim" dedi.

Bu karar otomatik değil — her aşama geçişinde insan gate'i var.

## Sonraki adımlar

- **Phase 4B — shadow-warn:** `validation_category` eşik üstüne çıkınca
  dashboard kırmızı bayrak + ceo_activities log + konsol uyarısı. Hâlâ
  blocking değil.
- **Phase 4C — feature flag + cohort:** `FINANCEX_VALIDATION_GATE_RETRY=1`
  env flag + `FINANCEX_VALIDATION_GATE_COHORT=TUPRS,ASELS` ticker listesi.
  Açıkken validation-gate retry tetikler (missing_metric kategorisi →
  financial_analysis yeniden, unaddressed_finding → downstream agent yeniden).
- **Phase 4D — kademeli:** cohort 1 → 3 → 10 → BIST30.
- **Phase 4E — hard:** flag default-on.

Master prompt §8 adım 7 (manifest + retrieval) Phase 5'e geçiş için bu
aşamanın tamamlanması gerekmiyor — paralel başlayabilir.
