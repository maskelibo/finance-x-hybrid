# Phase 6A Summary — QA Checklist Enforcement (Observe-Only)

- Branch: `refactor/phase-6a-checklist-observe`
- Başlangıç: `refactor/phase-5a-manifest-observe` HEAD (commit db6c66cf)
- Davranış değişimi: **SIFIR**. CEO gate kararı aynı, QA revision davranışı aynı.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §6.7 (QA loop'u gercekten kapat). Brief §6 ilke 5
(Checklist Enforcement).

Problem: downstream agent upstream QA finding'lerinin tamamını adreslemiyor.
Schema'da `addressed_findings[]` optional, oranı ölçülmüyor, kimse
"bu session kaç finding kaç adresle çıktı?" sorusunu DB'den cevaplayamıyor.

Hedef state (Phase 6D sonunda):
- downstream her finding için `addressed_findings[]` yazsın (required)
- action_taken ∈ {fixed, acknowledged, rejected}
- explanation ≥ 30 chars
- eksik finding varsa retry
- ikinci retry sonrası CEO escalation

Phase 4A zaten şekli tanımladı ve shadow validator intra-doc eşitliği
kontrol ediyor. Phase 6A session-level roll-up + escalation candidate
flagging ekler.

## Ne yapıldı

### 1. `backend/src/checklist/types.ts`

```ts
type AddressalReport = {
  session_id; ticker;
  finding_count;                  // distinct finding_ids raised anywhere
  addressed_count;                // of those, appeared in any addressed_findings[]
  addressal_rate;                 // addressed_count / finding_count
  action_counts;                  // { fixed, acknowledged, rejected }
  unaddressed_finding_ids[];      // what escaped
  by_agent: AgentAddressalBreakdown[];
  escalation_flag;                // rate < 0.7 with ≥1 finding
  generated_at;
};
```

Sabit: `ADDRESSAL_ESCALATION_THRESHOLD = 0.7`. Phase 6B dashboard bu
eşiğe göre kırmızı/yeşil işaretler.

### 2. `backend/src/checklist/aggregate.ts`

`aggregateSessionAddressal(sessionId)`:

1. Session'daki tüm `completed` agent_run'ları oku (output_text + manifest_json
   fallback).
2. Her satırdan progressive JSON parse (aynı Phase 3A+ fallback chain).
3. `findings[].finding_id` ve `addressed_findings[].{finding_id, action_taken}`
   extract et.
4. Session genelinde:
   - Distinct raised id seti
   - Distinct addressed id seti
   - Action counts (fixed/acknowledged/rejected)
5. Per-agent breakdown: her agent'ın raise ettikleri + adresledikleri +
   hâlâ açık olanları.
6. `escalation_flag = finding_count > 0 && addressal_rate < 0.7`.

Malformed output → 0 katkı, asla throw.

### 3. `backend/src/checklist/persist.ts`

`persistAddressalReport(report)`:

- `analysis_sessions` güncelle: `addressal_rate`, `findings_total`,
  `findings_addressed`, `addressal_escalation_flag`, `addressal_report_json`.
- Her `agent_runs` satırı için `addressal_rate` +
  `finding_action_{fixed,acknowledged,rejected}_count`.

Migration yoksa `no such column` silent swallow + bir kere stdout uyarı.

### 4. Migration (UYGULANMADI)

`backend/src/migrations/phase6_checklist_observation.sql`:

```sql
-- analysis_sessions
ALTER TABLE analysis_sessions ADD COLUMN addressal_rate REAL;
ALTER TABLE analysis_sessions ADD COLUMN findings_total INTEGER;
ALTER TABLE analysis_sessions ADD COLUMN findings_addressed INTEGER;
ALTER TABLE analysis_sessions ADD COLUMN addressal_escalation_flag INTEGER DEFAULT 0;
ALTER TABLE analysis_sessions ADD COLUMN addressal_report_json TEXT;
CREATE INDEX idx_analysis_sessions_addressal_flag  ON analysis_sessions(addressal_escalation_flag);
CREATE INDEX idx_analysis_sessions_addressal_rate  ON analysis_sessions(addressal_rate);

-- agent_runs
ALTER TABLE agent_runs ADD COLUMN addressal_rate REAL;
ALTER TABLE agent_runs ADD COLUMN finding_action_fixed_count INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN finding_action_acknowledged_count INTEGER DEFAULT 0;
ALTER TABLE agent_runs ADD COLUMN finding_action_rejected_count INTEGER DEFAULT 0;
```

### 5. Orchestrator wiring

`executeSession()` sonunda, CEO approval gate'ten **hemen önce**:

```ts
try {
  const addressalReport = aggregateSessionAddressal(sessionId);
  if (addressalReport) {
    persistAddressalReport(addressalReport);
    if (addressalReport.escalation_flag) {
      console.log(`[CHECKLIST] session ${sessionId} addressal_rate=…`);
    }
  }
} catch (err) { /* non-fatal */ }
```

Phase 6A observe-only: console.log escalation candidate için bilgi basar,
**CEO gate kararını değiştirmez**. Phase 6B bu log'u dashboard kırmızı
bayrağına bağlar; Phase 6C gerçek retry route + CEO escalation.

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
python canonical/_loader/python/loader.py --selftest       OK (50+ cross-checks)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json
                                                           OK (15/15 no regression)
python refactor/tools/prompt_memory_lint.py                20 hard / 27 soft / 130 info (baseline)
```

## Canlı davranış beklenen değişimi

**Hiçbir.** Aynı süre, aynı süreç, aynı çıktı. Migration uygulandığında
her session bitiminde `addressal_*` kolonları dolmaya başlar; escalation
candidate'lar stdout'ta görünür.

Migration sırası (Phase 2/3A/4A/5A/6A — tek seferde güvenli):

```bash
cp backend/finance-x.db backups/finance-x_pre_phase6a_$(date +%Y%m%d_%H%M%S).db
for m in phase2_context_budget phase3a_gate_events phase4_schema_observation \
         phase5_manifest_observation phase6_checklist_observation; do
  sqlite3 backend/finance-x.db < backend/src/migrations/${m}.sql
done
```

## Phase 6A → 6B geçiş kapısı

6B shadow-warn'a geçmek için:

1. Migration uygulandı.
2. En az 10 seans çalıştırıldı.
3. Analiz sorgusu:
   ```sql
   SELECT ticker, runtime_mode,
          AVG(addressal_rate) AS avg_rate,
          SUM(CASE WHEN addressal_escalation_flag = 1 THEN 1 ELSE 0 END) AS escalations,
          COUNT(*) AS sessions
     FROM analysis_sessions
    WHERE addressal_rate IS NOT NULL
    GROUP BY ticker, runtime_mode
    ORDER BY avg_rate ASC;
   ```
4. Insan "eşik 0.7 doğru mu, false positive oranı ne?" sorusunu cevapladı.
5. Eşik tuned edildiyse `ADDRESSAL_ESCALATION_THRESHOLD` sabiti Phase 6B
   branch'ında güncellenir.
6. Phase 6B dashboard kırmızı bayrak wiring başlar.

## Kapsamı dışında bırakılan (sonraki fazlar)

- Retry routing (`retry_route_for_finding(finding_id)`) — Phase 6C.
- CEO escalation modal — Phase 6C.
- addressal_rate → final_summary prompt injection — Phase 6C.
- Cross-session addressal trend — Phase 11 (dashboard).
