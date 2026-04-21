# Phase 5A Summary — Manifest Observation (Observe-Only)

- Branch: `refactor/phase-5a-manifest-observe`
- Başlangıç: `refactor/phase-4a-schema-observe` HEAD (commit 55282f4e)
- Mode: autonomous, user-authorized ("devam en son test ederiz")
- Davranış değişimi: **SIFIR**. Rapor üreteci bugünkü davranışını koruyor.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §6.6 (Manifest + retrieval pattern) + §7.7 (Report
section manifest). Brief Faz 5 (Context Engineering — manifest + retrieval).

Problemler (brief §3.10 + §6.6):
- High-fan-out agent'lar 50-100+ KB çıktı üretiyor
- Downstream prompt'lara ham sekilde akıyor
- Lost-in-the-middle + attention dilution kaçınılmaz
- Downstream agent CONTEXT_CHAR_LIMIT'e takılıyor, önemli kısım kesiliyor

Çözüm (3 aşamalı rollout):
- **Phase 5A (bu commit):** Her agent run için compact manifest üret, DB'ye yaz, ölç.
- **Phase 5B (sonraki):** Dual-write — manifest + raw ikisi birden disk'e.
- **Phase 5C:** Dual-read — downstream prompt assembly manifest-first, raw fallback.
- **Phase 5D:** Cutover — manifest-only; raw sadece debug/audit için.

## Ne yapıldı

### 1. Manifest tipi (`backend/src/manifest/types.ts`)

Canonical şekil — schema_version: `1.0.0`:

```ts
type AgentOutputManifest = {
  schema_version: '1.0.0';
  agent_id, ticker, runtime_mode;

  // Size accounting
  raw_output_bytes; manifest_bytes; compression_ratio; truncation_risk;

  // Content catalog
  sections[];                  // id, title, offset, length (+ metric_ids opt)
  metric_ids[];                // MM-XX codes (from metrics_array[] + prose)
  finding_ids[];               // findings[].finding_id
  addressed_finding_ids[];     // addressed_findings[].finding_id
  evidence_ref_count;
  evidence_source_types[];     // kap_disclosure, financial_statement_*, …
  missing_data_codes[];        // NH-XXX from canonical
  canonical_refs[];            // MM/NH/CT/OI/IAS29/SR/TM ids

  // Shape flags for retrieval planning
  has_interpretations, has_engine_snapshot, has_metrics_array,
  has_claims, has_findings, has_addressed_findings;

  // Provenance
  extraction_mode: 'json' | 'heuristic' | 'mixed';
  extraction_duration_ms;
  generated_at;
};
```

Sabit budget: `MANIFEST_MAX_BYTES = 16_000`. Overshoot olursa sections ve
ref listeleri top-N'e kısıtlanıyor.

### 2. Extractor (`backend/src/manifest/extract.ts`)

İki pass:

**Pass 1 — JSON parse** (Phase 3A+ ile aynı progressive fallback):
1. Whole-string JSON
2. ```` ```json ... ``` ```` fenced block
3. Balanced top-level `{...}` scan

JSON parse başarılıysa structured field'lardan verbatim:
- `metrics_array[].id` → `metric_ids`
- `findings[].finding_id` → `finding_ids`
- `addressed_findings[].finding_id` → `addressed_finding_ids`
- Recursive `evidence_refs[]` walk → `evidence_ref_count` + `source_types`
- Top-level key varlığı → `has_*` flags

**Pass 2 — Regex** (her zaman çalışır, markdown için):
- Canonical id pattern: `MM-\d{2}|NH-\d{3}|OI-\d{3}|IAS29-\d{3}|SR-\w+-\d{3}|TM-\w+`
- Prose finding id mention: `finding_id[:\s]+[\w-]+`
- Section heading: `^#{1,3}\s+.+`

İki pass merge edilir + dedup + sort. JSON yoksa `extraction_mode='heuristic'`,
ikisi de varsa `'mixed'`, sadece JSON varsa `'json'`.

**Never throws**: malformed input → minimal manifest (rawBytes, truncation_risk,
empty arrays). Orchestrator bile try/catch içinde sarıyor.

### 3. Migration (UYGULANMADI)

`backend/src/migrations/phase5_manifest_observation.sql`:

```sql
ALTER TABLE agent_runs ADD COLUMN manifest_raw_size_bytes INTEGER;
ALTER TABLE agent_runs ADD COLUMN manifest_compressed_size_bytes INTEGER;
ALTER TABLE agent_runs ADD COLUMN manifest_section_count INTEGER;
ALTER TABLE agent_runs ADD COLUMN manifest_truncation_risk INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN manifest_json TEXT;
CREATE INDEX idx_agent_runs_manifest_truncation_risk ON agent_runs(manifest_truncation_risk);
CREATE INDEX idx_agent_runs_manifest_raw_size ON agent_runs(manifest_raw_size_bytes);
```

### 4. Recorder (`backend/src/manifest/record.ts`)

`recordManifest({ sessionId, agentId, manifest })` — tek UPDATE satırı.
Migration yoksa `no such column` error silent no-op, bir kere stdout uyarı.

### 5. Orchestrator wiring

`backend/src/orchestrator.ts` — Phase 4A `classifyAndRecord` çağrısının
altına, `shadowValidate` outer try/catch içinde:

```ts
try {
  const manifest = extractManifest(result.output, {
    agentId, ticker, runtimeMode: runtimeModeForShadow,
  });
  recordManifest({ sessionId, agentId, manifest });
} catch { /* manifest extraction must not break the pipeline */ }
```

Triple try/catch stacking (phase 3A outer + phase 5A inner + recorder's own
catch inside `safeInsert`-style swallow). `break` / `return` flow'una
dokunulmadı.

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
agent_runs satırlarında `manifest_*` kolonları dolmaya başlar.

Migration uygulama sırası (Phase 2/3A/4A/5A birlikte — tek seferde güvenli):

```bash
cp backend/finance-x.db backups/finance-x_pre_phase5a_$(date +%Y%m%d_%H%M%S).db
sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql
sqlite3 backend/finance-x.db < backend/src/migrations/phase3a_gate_events.sql
sqlite3 backend/finance-x.db < backend/src/migrations/phase4_schema_observation.sql
sqlite3 backend/finance-x.db < backend/src/migrations/phase5_manifest_observation.sql
sqlite3 backend/finance-x.db 'PRAGMA table_info(agent_runs);' | grep manifest_
```

## Phase 5A → 5B geçiş kapısı

5B dual-write'a geçmek için:

1. Migration uygulandı.
2. En az 10 seans çalıştırıldı.
3. Analiz sorgusu:
   ```sql
   SELECT agent_id,
          AVG(manifest_raw_size_bytes) AS avg_raw,
          AVG(manifest_compressed_size_bytes) AS avg_manifest,
          CAST(AVG(manifest_raw_size_bytes) AS REAL)
            / NULLIF(AVG(manifest_compressed_size_bytes), 0) AS ratio,
          SUM(manifest_truncation_risk) AS truncation_risk_count
     FROM agent_runs
    WHERE manifest_raw_size_bytes IS NOT NULL
    GROUP BY agent_id
    ORDER BY ratio DESC;
   ```
4. İnsan "manifest sıkıştırma oranı ≥ 5x, truncation_risk sıklığı anlamlı,
   dual-write yaparsak kazanç var" dedi.
5. Kullanıcı tasarımı onayladı: dual-write dosya layout'u
   (`data/manifests/{sessionId}/{agentId}.json`), retention policy, hash.
6. Phase 5B branch açıldı.

## Bilinen sınırlamalar (Phase 5B'nin çözeceği)

- Manifest şu an yalnızca DB'de. Phase 5B disk artifact'i ekler.
- `sections[].offset/length` retrieval katmanı yok — henüz kimse kullanmıyor.
- Section aware metric_ids henüz doldurulmuyor (optional field boş).
  Phase 5B bu mapping'i ekler — hangi metrik hangi section'da.
- JSON pass `json` mode raporluyor ama ham prose'un canonical refleri yine
  merge ediliyor — bu bilinçli davranış (mixed provenance).
