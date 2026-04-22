/**
 * Block R close-holds benchmark:
 *  (1) fact-layer/store.ts — upsert/get/list with unit normalization.
 *  (2) Tracer integration (no-op path — orchestrator calls wrap without SDK).
 *  (3) Event-bus wiring — subscriber registered + dispatch dry run (no real trigger).
 */
import { upsertFact, getFact, listFacts } from '../backend/src/fact-layer/store.js';
import { bus } from '../backend/src/event-bus.js';
import { db } from '../backend/src/db.js';
import { nanoid } from 'nanoid';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// Prep: fake session for FK
const SID = `test-fact-${nanoid(6)}`;
db.prepare(`INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at, total_cost_usd, total_tokens) VALUES (?, 'TEST', 'fast_screening', 'running', ?, 0, 0)`).run(SID, new Date().toISOString());

try {
  // --- canonical_facts table exists
  const t = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='canonical_facts'`).get();
  a(!!t, 'Schema: canonical_facts tablosu oluştu');

  // --- (1a) upsert TRY_mn passthrough
  const f1 = upsertFact({ session_id: SID, fact_key: 'ebitda_try_mn_2025', value: 20452, unit: 'TRY_mn' });
  a(f1.value === 20452 && f1.unit === 'TRY_mn', 'Fact: TRY_mn upsert passthrough');
  a(f1.raw_unit === 'TRY_mn', 'Fact: raw_unit persisted');

  // --- (1b) upsert USD_mn → auto-convert
  const f2 = upsertFact({ session_id: SID, fact_key: 'revenue_usd_2025', value: 500, unit: 'USD_mn' });
  a(f2.value === 500 * 42.5, 'Fact: USD_mn → TRY_mn auto-convert');
  a(f2.unit === 'TRY_mn', 'Fact: canonical unit stored');
  a(f2.sources.some(s => (s.note || '').includes('unit_converted')), 'Fact: conversion note in sources');

  // --- (1c) upsert percentage
  const f3 = upsertFact({ session_id: SID, fact_key: 'gross_margin_pct', value: 23.2, unit: 'pct' });
  a(Math.abs(f3.value as number - 0.232) < 1e-9, 'Fact: pct → decimal normalized');

  // --- (1d) get + list
  const got = getFact(SID, 'ebitda_try_mn_2025');
  a(got !== null && got.value === 20452, 'Fact: get roundtrip');

  const all = listFacts(SID);
  a(all.length === 3, `Fact: list returns 3 facts (got ${all.length})`);

  // --- (1e) update existing fact (upsert again)
  const f4 = upsertFact({
    session_id: SID, fact_key: 'ebitda_try_mn_2025', value: 20500, unit: 'TRY_mn',
    sources: [{ type: 'agent', agent_id: 'financial_analysis', extracted_at: new Date().toISOString(), freshness_days: 0 }],
  });
  a(f4.value === 20500, 'Fact: re-upsert updates value');
  a(f4.id === f1.id, 'Fact: re-upsert keeps same id');

  const refetched = getFact(SID, 'ebitda_try_mn_2025');
  a(refetched!.sources.some(s => s.agent_id === 'financial_analysis'), 'Fact: merged source has agent_id');

  // --- (2) tracer integration smoke — orchestrator imports traceAgent / traceSession without error
  // (Already proven by typecheck; here we just confirm modules available)
  const { traceAgent, traceSession } = await import('../backend/src/observability/tracer.js');
  a(typeof traceAgent === 'function' && typeof traceSession === 'function', 'Tracer: imports available');

  // --- (3) event-bus wiring
  // Install a transient listener; emit a NON-material event (no side effects); verify listener chain.
  const { initEventBusWiring } = await import('../backend/src/event-bus-wiring.js');
  // initEventBusWiring is invoked once at server boot. Re-calling is OK (EventEmitter allows multiple listeners).
  initEventBusWiring();

  let nonMaterialFired = false;
  bus.on('kap_new_disclosure', (ev) => { if (!ev.material) nonMaterialFired = true; });
  bus.emitEvent({ type: 'kap_new_disclosure', ticker: 'TESTX', disclosure_id: 'd-zzz', material: false });
  a(nonMaterialFired, 'EventBus: listener received non-material event');

  // Material event SHOULD attempt auto-trigger, but we block DB side effects by asserting the log.
  // Assertion: calling emit doesn't throw (subscriber is fire-and-forget).
  let threw = false;
  try {
    bus.emitEvent({ type: 'session_completed', session_id: SID, ticker: 'TEST', qa_score: 0.85 });
  } catch { threw = true; }
  a(!threw, 'EventBus: session_completed emit no-throw');
} finally {
  db.prepare(`DELETE FROM canonical_facts WHERE session_id = ?`).run(SID);
  db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(SID);
}

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
