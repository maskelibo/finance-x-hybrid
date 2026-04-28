/**
 * P7A Wave 1 — Server-Sent Events for session progress.
 *
 * Standalone SSE plumbing. Wave 1 deliberately ships ONLY the consumer
 * side: handler, subscriber registration, broadcast helper. Publisher
 * emissions in orchestrator.ts and agent-runner.ts are NOT added in this
 * sprint — those are runtime forbidden-file touches and belong in their
 * own approval cycle (P7A Wave 2 alongside P6B/orchestrator wiring).
 *
 * Without publishers the route still works: it produces a `connected`
 * event on subscription, then any future bus.emitEvent() automatically
 * fans out to subscribed clients. No bus type changes required.
 *
 * Wave 1 invariants:
 *   - Default OFF: server.ts gates registerSseRoutes() behind
 *     SSE_ENABLED='1'.
 *   - Module import is side-effect-free aside from a single bus.on()
 *     subscription per supported event type. Subscriptions are
 *     idempotent via a memoised registration flag so re-imports do not
 *     leak listeners.
 *   - No external network. No DB writes. No LLM. No subprocess.
 *   - No PII / secret values in event payloads (responsibility falls
 *     on publishers; SSE just forwards JSON-stringified events).
 */

import type { Request, Response, Express } from 'express';
import { bus, type FinanceXEvent } from '../event-bus.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const sessionStreams: Map<string, Set<Response>> = new Map();
let _busSubscribed = false;

// Event types we forward when present on the bus. We subscribe to ALL
// declared FinanceXEvent types so future publishers light up automatically.
const FORWARDED_EVENT_TYPES: ReadonlyArray<FinanceXEvent['type']> = [
  'session_started',
  'session_completed',
  'qa_blocked',
  'kap_new_disclosure',
  'price_alert',
  'heartbeat_cycle',
];

// ---------------------------------------------------------------------------
// SSE wire-format helper
// ---------------------------------------------------------------------------

export function formatSseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function sendSSE(res: Response, event: string, data: unknown): void {
  res.write(formatSseFrame(event, data));
}

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

export function broadcastToSession(sessionId: string, event: string, data: unknown): void {
  const streams = sessionStreams.get(sessionId);
  if (!streams || streams.size === 0) return;
  for (const res of streams) {
    try {
      sendSSE(res, event, data);
    } catch (err) {
      console.warn('[sse] broadcast failed; dropping subscriber:', err instanceof Error ? err.message : err);
      streams.delete(res);
    }
  }
}

// ---------------------------------------------------------------------------
// Bus subscription (idempotent)
// ---------------------------------------------------------------------------

function ensureBusSubscriptions(): void {
  if (_busSubscribed) return;
  for (const type of FORWARDED_EVENT_TYPES) {
    bus.on(type, (ev: FinanceXEvent) => {
      const sessionId = (ev as { session_id?: string }).session_id;
      if (typeof sessionId !== 'string' || sessionId.length === 0) return;
      broadcastToSession(sessionId, type, ev);
    });
  }
  _busSubscribed = true;
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

export function handleSessionSSE(req: Request, res: Response): void {
  const sessionId = (req.params as { sessionId?: string }).sessionId;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    res.status(400).json({ error: 'sessionId_required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as Response & { flushHeaders?: () => void }).flushHeaders === 'function') {
    (res as Response & { flushHeaders: () => void }).flushHeaders();
  }

  let bucket = sessionStreams.get(sessionId);
  if (!bucket) {
    bucket = new Set();
    sessionStreams.set(sessionId, bucket);
  }
  bucket.add(res);

  sendSSE(res, 'connected', { session_id: sessionId, ts: new Date().toISOString() });

  const cleanup = () => {
    const set = sessionStreams.get(sessionId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) sessionStreams.delete(sessionId);
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function isSseEnabled(): boolean {
  return process.env.SSE_ENABLED === '1';
}

export function registerSseRoutes(app: Express): void {
  ensureBusSubscriptions();
  app.get('/api/sessions/:sessionId/stream', handleSessionSSE);
}

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

export function _resetSseStateForTests(): void {
  for (const set of sessionStreams.values()) set.clear();
  sessionStreams.clear();
  // Note: _busSubscribed is intentionally NOT reset — bus listeners are
  // idempotent for the lifetime of the process. Tests that need a clean
  // bus should remove listeners on the bus directly.
}

export function _getSessionStreamCountForTests(sessionId: string): number {
  return sessionStreams.get(sessionId)?.size ?? 0;
}

export function _getActiveSessionCountForTests(): number {
  return sessionStreams.size;
}

export const _FORWARDED_EVENT_TYPES_FOR_TESTS = FORWARDED_EVENT_TYPES;
