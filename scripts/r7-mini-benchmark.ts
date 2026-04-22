/**
 * R7 mini-benchmark: fact pack upsert/get + unit normalizer + migration smoke.
 */
import fs from 'node:fs';
import path from 'node:path';
import { initFactPack, updateFactPack, getFactPack } from '../backend/src/fact-pack.js';
import { normalizeFactValue, normalizeToTRYMn, normalizePercentage, setFxRates } from '../backend/src/fact-layer/unit-normalizer.js';
import { db } from '../backend/src/db.js';
import { PROJECT_ROOT } from '../backend/src/config.js';
import { nanoid } from 'nanoid';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- fact_packs table exists?
const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='fact_packs'`).get();
a(!!tableCheck, 'Schema: fact_packs tablosu oluşturulmuş');

// --- initFactPack + getFactPack roundtrip (fake session id)
const SESSION_ID = `test-${nanoid(8)}`;
// analysis_sessions FK var — önce fake row ekle
const now = new Date().toISOString();
db.prepare(`INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at, total_cost_usd, total_tokens) VALUES (?, ?, 'fast_screening', 'running', ?, 0, 0)`)
  .run(SESSION_ID, 'TEST', now);
try {
  const pack = initFactPack(SESSION_ID, 'TEST', 'testing');
  a(pack.session_id === SESSION_ID, 'FactPack: init session_id doğru');
  a(pack.ticker === 'TEST', 'FactPack: ticker uppercase stored');
  a(pack.sector_canonical === 'testing', 'FactPack: sector persisted');

  const fetched = getFactPack(SESSION_ID);
  a(fetched !== null, 'FactPack: get after init non-null');
  a(fetched!.created_at === pack.created_at, 'FactPack: created_at preserved');

  const updated = updateFactPack(SESSION_ID, {
    fiscal_periods: ['2025FY', '2024FY'],
    key_metrics: { ebitda_try_mn: 20452 },
    evidence: { ebitda_try_mn: { source: 'TUPRS_FAR_2025', confidence: 0.9 } },
  });
  a(updated.fiscal_periods.length === 2, 'FactPack: update fiscal_periods');
  a(updated.key_metrics.ebitda_try_mn === 20452, 'FactPack: update key_metric');

  const refetch = getFactPack(SESSION_ID);
  a(refetch!.evidence.ebitda_try_mn.source === 'TUPRS_FAR_2025', 'FactPack: evidence persisted');
  a(refetch!.fiscal_periods.length === 2, 'FactPack: refetch has fiscal_periods');
} finally {
  // Cleanup
  db.prepare(`DELETE FROM fact_packs WHERE session_id = ?`).run(SESSION_ID);
  db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(SESSION_ID);
}

// --- Unit normalizer: currencies
const r1 = normalizeToTRYMn(20452, 'TRY_mn');
a(r1.normalized_value === 20452, 'Normalize: TRY_mn passthrough');
const r2 = normalizeToTRYMn(20.452, 'TRY_bn');
a(Math.abs(r2.normalized_value - 20452) < 0.01, 'Normalize: TRY_bn → TRY_mn ×1000');
const r3 = normalizeToTRYMn(1_000_000_000, 'TRY');
a(r3.normalized_value === 1000, 'Normalize: raw TRY → TRY_mn /1e6');
const r4 = normalizeToTRYMn(500, 'USD_mn');
a(r4.normalized_value === 500 * 42.5, 'Normalize: USD_mn × FX');
const r5 = normalizeToTRYMn(1, 'EUR_bn');
a(Math.abs(r5.normalized_value - 46.2 * 1000) < 0.01, 'Normalize: EUR_bn → TRY_mn');

// --- Percentage
a(normalizePercentage(15, 'pct') === 0.15, 'Normalize %: 15 pct → 0.15');
a(normalizePercentage(0.23, 'decimal') === 0.23, 'Normalize %: 0.23 decimal passthrough');

// --- normalizeFactValue (key-driven routing)
const f1 = normalizeFactValue('ebitda_try_mn_2025', 20452, 'TRY_mn');
a(f1.value === 20452 && f1.unit === 'TRY_mn', 'FactValue: ebitda_try_mn passthrough');
const f2 = normalizeFactValue('gross_margin_pct', 23.2, 'pct');
a(Math.abs(f2.value - 0.232) < 1e-9 && f2.unit === 'decimal', 'FactValue: margin pct → decimal');
const f3 = normalizeFactValue('ccc_days', 47.6, 'days');
a(f3.value === 48 && f3.unit === 'days', 'FactValue: CCC rounded');
const f4 = normalizeFactValue('ev_ebitda_x', 6.5, 'x');
a(f4.value === 6.5 && f4.unit === 'x', 'FactValue: multiple passthrough');

// --- FX override
setFxRates({ USD: 50 });
const f5 = normalizeToTRYMn(100, 'USD_mn');
a(f5.normalized_value === 5000, 'Normalize: FX override applied');
setFxRates({ USD: 42.5 }); // reset

// --- Migration script exists + typecheck clean (just existence)
const migratePath = path.join(PROJECT_ROOT, 'scripts/migrate-memory-to-lessons.ts');
a(fs.existsSync(migratePath), 'Migration script exists');
const migrateContent = fs.readFileSync(migratePath, 'utf8');
a(migrateContent.includes('feedbackPattern') && migrateContent.includes('findSimilar'), 'Migration script content valid');

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
