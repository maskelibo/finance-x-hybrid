/**
 * Finance-X internal event bus — publishers: kap_watch, heartbeat, qa_review.
 * Subscribers: auto-trigger sessions on material disclosures, etc.
 */
import { EventEmitter } from 'node:events';

export type FinanceXEvent =
  | { type: 'kap_new_disclosure'; ticker: string; disclosure_id: string; material: boolean }
  | { type: 'price_alert'; ticker: string; price: number; change_pct: number; direction: 'up' | 'down' }
  | { type: 'session_started'; session_id: string; ticker: string }
  | { type: 'session_completed'; session_id: string; ticker: string; qa_score: number | null }
  | { type: 'qa_blocked'; session_id: string; ticker: string; reason: string }
  | { type: 'heartbeat_cycle'; cycle_no: number };

class FinanceXEventBus extends EventEmitter {
  emitEvent(ev: FinanceXEvent): void {
    super.emit('event', ev);
    super.emit(ev.type, ev);
    console.log(`[bus] ${ev.type}: ${JSON.stringify(ev).slice(0, 200)}`);
  }
}

export const bus = new FinanceXEventBus();
