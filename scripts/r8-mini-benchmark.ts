/**
 * R8 mini-benchmark: OTel tracer no-op + PII scrub + event bus.
 */
import { scrubPii } from '../backend/src/llm/pii-filter.js';
import { traceAgent, traceSession } from '../backend/src/observability/tracer.js';
import { bus, type FinanceXEvent } from '../backend/src/event-bus.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- PII filter
const r1 = scrubPii('TC: 12345678901 müşteri');
a(r1.cleaned.includes('[REDACTED:TC_KIMLIK]'), 'PII: TC Kimlik redacted');
a(r1.matches.tc_kimlik === 1, 'PII: TC counted');
a(r1.hasMatches === true, 'PII: hasMatches true');

const r2 = scrubPii('IBAN: TR330006100519786457841326 aktarıldı');
a(r2.cleaned.includes('[REDACTED:IBAN_TR]'), 'PII: IBAN redacted');
a(r2.matches.iban_tr === 1, 'PII: IBAN counted');

const r3 = scrubPii('Email: test@example.com, alert to test@financex.io');
a(r3.matches.email === 2, 'PII: 2 emails');

const r4 = scrubPii('Temiz metin, sorun yok');
a(r4.hasMatches === false, 'PII: clean text → no matches');
a(r4.cleaned === 'Temiz metin, sorun yok', 'PII: clean text unchanged');

// --- Tracer no-op (without OTel SDK init)
let fnCalled = false;
const tracedResult = await traceAgent('test_agent', 'test-session', 'Test Phase', async () => {
  fnCalled = true;
  return 'ok';
});
a(tracedResult === 'ok', 'Tracer: return value passthrough');
a(fnCalled, 'Tracer: inner fn called');

const tracedError = await traceAgent('err_agent', 'test-session', 'Test', async () => {
  throw new Error('intentional');
}).catch(e => e.message);
a(tracedError === 'intentional', 'Tracer: error re-thrown');

const sessionResult = await traceSession('sess-abc', 'THYAO', async () => 42);
a(sessionResult === 42, 'Tracer: session return value');

// --- Event bus
const received: FinanceXEvent[] = [];
bus.on('event', (ev) => received.push(ev));

bus.emitEvent({ type: 'session_started', session_id: 's1', ticker: 'THYAO' });
bus.emitEvent({ type: 'kap_new_disclosure', ticker: 'EREGL', disclosure_id: 'd1', material: true });

a(received.length === 2, `Bus: 2 events received (got ${received.length})`);
a(received[0].type === 'session_started', 'Bus: first event type');
a(received[1].type === 'kap_new_disclosure', 'Bus: second event type');

// Type-specific subscription
let materialCount = 0;
bus.on('kap_new_disclosure', (ev: any) => { if (ev.material) materialCount++; });
bus.emitEvent({ type: 'kap_new_disclosure', ticker: 'KCHOL', disclosure_id: 'd2', material: true });
bus.emitEvent({ type: 'kap_new_disclosure', ticker: 'TUPRS', disclosure_id: 'd3', material: false });
a(materialCount === 1, 'Bus: typed subscription + material filter');

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
