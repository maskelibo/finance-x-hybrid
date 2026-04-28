/**
 * P7A Wave 1 — SSE module unit tests.
 *
 * Tests cover:
 *   - Wire format (formatSseFrame)
 *   - Subscriber lifecycle (subscribe → connected → broadcast → cleanup)
 *   - Multi-subscriber fan-out
 *   - Per-session isolation
 *   - Default-OFF gate
 *   - Route registration
 *   - Bus subscription idempotence
 *
 * No live HTTP, no real network. Mock req/res objects keep the test
 * synchronous and deterministic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type Express, type Request, type Response } from 'express';
import { EventEmitter } from 'node:events';
import { bus, type FinanceXEvent } from '../event-bus.js';
import {
  _FORWARDED_EVENT_TYPES_FOR_TESTS,
  _getActiveSessionCountForTests,
  _getSessionStreamCountForTests,
  _resetSseStateForTests,
  broadcastToSession,
  formatSseFrame,
  handleSessionSSE,
  isSseEnabled,
  registerSseRoutes,
  sendSSE,
} from './sse.js';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) process.env[k] = v;
}

interface MockResponse extends Partial<Response> {
  _writes: string[];
  _headers: Record<string, string>;
  _statusCode: number;
  _ended: boolean;
}

function makeMockReq(sessionId: string, emitter: EventEmitter = new EventEmitter()): Request {
  const req = emitter as unknown as Request;
  (req as unknown as { params: Record<string, string> }).params = { sessionId };
  return req;
}

function makeMockRes(): MockResponse {
  const res: MockResponse = {
    _writes: [],
    _headers: {},
    _statusCode: 200,
    _ended: false,
    setHeader(name: string, value: string) {
      this._headers[name] = value;
      return this as unknown as Response;
    },
    write(chunk: string) {
      this._writes.push(chunk);
      return true;
    },
    end() {
      this._ended = true;
      return this as unknown as Response;
    },
    status(code: number) {
      this._statusCode = code;
      return this as unknown as Response;
    },
    json(body: unknown) {
      this._writes.push(JSON.stringify(body));
      this._ended = true;
      return this as unknown as Response;
    },
    flushHeaders() {
      // no-op
    },
  };
  return res;
}

beforeEach(() => {
  restoreEnv();
  delete process.env.SSE_ENABLED;
  _resetSseStateForTests();
});

afterEach(() => {
  restoreEnv();
  _resetSseStateForTests();
});

// =============================================================================
// formatSseFrame
// =============================================================================

describe('formatSseFrame', () => {
  it('produces canonical SSE frame: event + data + double newline', () => {
    const f = formatSseFrame('agent_started', { session_id: 'abc', agent_id: 'fa' });
    expect(f).toMatch(/^event: agent_started\ndata: \{.*\}\n\n$/);
  });

  it('JSON-stringifies the data payload', () => {
    const f = formatSseFrame('foo', { a: 1, b: [2, 3] });
    expect(f).toContain('data: {"a":1,"b":[2,3]}');
  });

  it('handles primitive payloads', () => {
    expect(formatSseFrame('bar', 42)).toContain('data: 42');
    expect(formatSseFrame('bar', 'x')).toContain('data: "x"');
    expect(formatSseFrame('bar', null)).toContain('data: null');
  });
});

// =============================================================================
// handleSessionSSE — connection lifecycle
// =============================================================================

describe('handleSessionSSE', () => {
  it('rejects request with missing sessionId (400)', () => {
    const req = makeMockReq('');
    const res = makeMockRes();
    handleSessionSSE(req, res as unknown as Response);
    expect(res._statusCode).toBe(400);
  });

  it('sets SSE headers and writes initial connected frame', () => {
    const req = makeMockReq('sid-1');
    const res = makeMockRes();
    handleSessionSSE(req, res as unknown as Response);
    expect(res._headers['Content-Type']).toBe('text/event-stream');
    expect(res._headers['Cache-Control']).toContain('no-cache');
    expect(res._headers['Connection']).toBe('keep-alive');
    expect(res._writes.length).toBe(1);
    expect(res._writes[0]).toContain('event: connected');
    expect(res._writes[0]).toContain('"session_id":"sid-1"');
  });

  it('registers the response in sessionStreams under the sessionId', () => {
    const req = makeMockReq('sid-2');
    const res = makeMockRes();
    handleSessionSSE(req, res as unknown as Response);
    expect(_getSessionStreamCountForTests('sid-2')).toBe(1);
  });

  it('removes the subscriber when req emits close', () => {
    const emitter = new EventEmitter();
    const req = makeMockReq('sid-3', emitter);
    const res = makeMockRes();
    handleSessionSSE(req, res as unknown as Response);
    expect(_getSessionStreamCountForTests('sid-3')).toBe(1);
    emitter.emit('close');
    expect(_getSessionStreamCountForTests('sid-3')).toBe(0);
    expect(_getActiveSessionCountForTests()).toBe(0);
  });

  it('removes the subscriber when req emits aborted', () => {
    const emitter = new EventEmitter();
    const req = makeMockReq('sid-4', emitter);
    const res = makeMockRes();
    handleSessionSSE(req, res as unknown as Response);
    emitter.emit('aborted');
    expect(_getSessionStreamCountForTests('sid-4')).toBe(0);
  });
});

// =============================================================================
// broadcastToSession — fan-out
// =============================================================================

describe('broadcastToSession', () => {
  it('writes the frame to every subscriber of the session', () => {
    const r1 = makeMockRes();
    const r2 = makeMockRes();
    handleSessionSSE(makeMockReq('sid-X'), r1 as unknown as Response);
    handleSessionSSE(makeMockReq('sid-X'), r2 as unknown as Response);
    broadcastToSession('sid-X', 'qa_blocked', { session_id: 'sid-X', reason: 'low_score' });
    expect(r1._writes.some((w) => w.includes('event: qa_blocked'))).toBe(true);
    expect(r2._writes.some((w) => w.includes('event: qa_blocked'))).toBe(true);
  });

  it('does not write to subscribers of other sessions', () => {
    const r1 = makeMockRes();
    const r2 = makeMockRes();
    handleSessionSSE(makeMockReq('sid-A'), r1 as unknown as Response);
    handleSessionSSE(makeMockReq('sid-B'), r2 as unknown as Response);
    broadcastToSession('sid-A', 'session_started', { session_id: 'sid-A', ticker: 'KCHOL' });
    expect(r1._writes.some((w) => w.includes('event: session_started'))).toBe(true);
    expect(r2._writes.some((w) => w.includes('event: session_started'))).toBe(false);
  });

  it('is a no-op when there are no subscribers for the session', () => {
    expect(() =>
      broadcastToSession('no-subs', 'session_completed', { session_id: 'no-subs' }),
    ).not.toThrow();
  });

  it('drops a subscriber whose write throws and continues to the others', () => {
    const r1 = makeMockRes();
    const r2 = makeMockRes();
    handleSessionSSE(makeMockReq('sid-Y'), r1 as unknown as Response);
    handleSessionSSE(makeMockReq('sid-Y'), r2 as unknown as Response);
    r1.write = () => {
      throw new Error('client gone');
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    broadcastToSession('sid-Y', 'qa_blocked', { session_id: 'sid-Y' });
    expect(r2._writes.some((w) => w.includes('event: qa_blocked'))).toBe(true);
    expect(_getSessionStreamCountForTests('sid-Y')).toBe(1);
    warnSpy.mockRestore();
  });
});

// =============================================================================
// Bus → SSE wiring
// =============================================================================

describe('bus → SSE wiring', () => {
  it('forwards a session_completed event from bus to subscribers of the session_id', () => {
    const r1 = makeMockRes();
    handleSessionSSE(makeMockReq('sid-bus-1'), r1 as unknown as Response);
    registerSseRoutes(express()); // ensures bus subscription
    const ev: FinanceXEvent = { type: 'session_completed', session_id: 'sid-bus-1', ticker: 'KCHOL', qa_score: 0.9 };
    bus.emitEvent(ev);
    expect(r1._writes.some((w) => w.includes('event: session_completed'))).toBe(true);
    expect(r1._writes.some((w) => w.includes('"qa_score":0.9'))).toBe(true);
  });

  it('does not forward when event has no session_id', () => {
    const r1 = makeMockRes();
    handleSessionSSE(makeMockReq('sid-bus-2'), r1 as unknown as Response);
    registerSseRoutes(express());
    const baseline = r1._writes.length;
    bus.emitEvent({ type: 'heartbeat_cycle', cycle_no: 1 });
    expect(r1._writes.length).toBe(baseline);
  });

  it('subscribes to all six declared bus event types', () => {
    expect(_FORWARDED_EVENT_TYPES_FOR_TESTS.length).toBe(6);
    expect(new Set(_FORWARDED_EVENT_TYPES_FOR_TESTS)).toContain('session_completed');
    expect(new Set(_FORWARDED_EVENT_TYPES_FOR_TESTS)).toContain('qa_blocked');
  });
});

// =============================================================================
// Default-OFF gate
// =============================================================================

describe('isSseEnabled', () => {
  it('returns false when SSE_ENABLED is unset', () => {
    delete process.env.SSE_ENABLED;
    expect(isSseEnabled()).toBe(false);
  });

  it("returns true only on strict '1'", () => {
    process.env.SSE_ENABLED = '1';
    expect(isSseEnabled()).toBe(true);
    process.env.SSE_ENABLED = 'true';
    expect(isSseEnabled()).toBe(false);
    process.env.SSE_ENABLED = 'on';
    expect(isSseEnabled()).toBe(false);
  });
});

// =============================================================================
// Route registration
// =============================================================================

describe('registerSseRoutes', () => {
  it('registers /api/sessions/:sessionId/stream on the app', () => {
    const app = express();
    registerSseRoutes(app);
    type LayerLite = { route?: { path?: string; methods?: Record<string, boolean> } };
    const stack = (app as unknown as { _router: { stack: LayerLite[] } })._router?.stack ?? [];
    const found = stack.some((l) => l.route?.path === '/api/sessions/:sessionId/stream' && l.route?.methods?.get);
    expect(found).toBe(true);
  });

  it('repeated registration does not duplicate bus subscriptions (no listener leak)', () => {
    const before = bus.listenerCount('session_completed');
    registerSseRoutes(express());
    registerSseRoutes(express());
    registerSseRoutes(express());
    const after = bus.listenerCount('session_completed');
    // First registerSseRoutes adds at most 1 listener; subsequent calls must
    // not add more (idempotent ensureBusSubscriptions).
    expect(after - before).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// Module discipline
// =============================================================================

describe('module discipline', () => {
  it('module exports the public API and helpers', () => {
    expect(typeof formatSseFrame).toBe('function');
    expect(typeof sendSSE).toBe('function');
    expect(typeof broadcastToSession).toBe('function');
    expect(typeof handleSessionSSE).toBe('function');
    expect(typeof registerSseRoutes).toBe('function');
    expect(typeof isSseEnabled).toBe('function');
  });
});
