/**
 * Event-bus subscribers — wires auto-triggers at startup.
 * Publishers (kap_watch etc.) emit via bus.emitEvent(); subscribers listen here.
 *
 * Note: the "kap_new_disclosure" publisher is not yet implemented — subscriber is
 * harmless (zero events → zero fires). Once kap_watch publishes, material disclosures
 * auto-start a fast_screening session.
 */
import { bus } from './event-bus.js';
import { startAnalysisSession } from './orchestrator.js';

export function initEventBusWiring(): void {
  bus.on('kap_new_disclosure', (ev) => {
    if (!ev.material) return;
    console.log(`[auto-trigger] Material disclosure ${ev.ticker} (${ev.disclosure_id}) → fast_screening`);
    // Fire-and-forget — errors logged, not thrown
    Promise.resolve()
      .then(() => startAnalysisSession(ev.ticker, 'fast_screening', ['events']))
      .catch((err: unknown) => {
        console.error(`[auto-trigger] Failed for ${ev.ticker}: ${err instanceof Error ? err.message : err}`);
      });
  });

  bus.on('qa_blocked', (ev) => {
    console.warn(`[bus-listener] QA block: session=${ev.session_id} ticker=${ev.ticker} reason=${ev.reason}`);
  });

  bus.on('session_completed', (ev) => {
    console.log(`[bus-listener] Session done: ${ev.ticker} session=${ev.session_id} qa_score=${ev.qa_score}`);
  });

  console.log('[event-bus] subscribers wired (kap_new_disclosure, qa_blocked, session_completed)');
}
