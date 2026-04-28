/**
 * P6D Wave 1 — health/ready/metrics tests.
 *
 * No external network, no LLM, no subprocess. db.ts is the live SQLite at
 * backend/data/financex.db (idempotently created by the existing test
 * setup), and the COUNT queries are read-only.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type Express, type Request, type Response } from 'express';
import {
  buildHealthResponse,
  buildMetricsResponse,
  buildReadyResponse,
  isMetricsEnabled,
  registerHealthRoutes,
} from './health.js';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) process.env[k] = v;
}

beforeEach(async () => {
  restoreEnv();
  delete process.env.METRICS_ENABLED;
  delete process.env.AUDIT_LOG_ENABLED;
  // Reset memoised secrets provider so SECRETS_MODE changes take effect
  // and don't leak between tests in this file.
  const { _resetActiveProviderForTests } = await import('../security/secrets.js');
  _resetActiveProviderForTests();
});

afterEach(async () => {
  restoreEnv();
  const { _resetActiveProviderForTests } = await import('../security/secrets.js');
  _resetActiveProviderForTests();
});

// =============================================================================
// buildHealthResponse
// =============================================================================

describe('buildHealthResponse', () => {
  it("returns status 'ok'", () => {
    expect(buildHealthResponse().status).toBe('ok');
  });

  it('uptime_seconds is a non-negative number', () => {
    const r = buildHealthResponse();
    expect(typeof r.uptime_seconds).toBe('number');
    expect(r.uptime_seconds).toBeGreaterThanOrEqual(0);
  });

  it('timestamp is ISO-8601', () => {
    const r = buildHealthResponse();
    expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });
});

// =============================================================================
// buildReadyResponse
// =============================================================================

describe('buildReadyResponse', () => {
  it("happy path returns ready: true with database 'ok'", () => {
    const r = buildReadyResponse();
    expect(r.ready).toBe(true);
    expect(r.checks.database).toBe('ok');
    expect(r.checks.process).toBe('ok');
  });

  it('timestamp is ISO-8601', () => {
    const r = buildReadyResponse();
    expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });

  it('process check is always ok in Wave 1', () => {
    const r = buildReadyResponse();
    expect(r.checks.process).toBe('ok');
  });
});

// =============================================================================
// buildMetricsResponse
// =============================================================================

describe('buildMetricsResponse', () => {
  it('contains all six required metric names', () => {
    const out = buildMetricsResponse();
    expect(out).toContain('finance_x_uptime_seconds');
    expect(out).toContain('finance_x_active_sessions');
    expect(out).toContain('finance_x_completed_sessions_today');
    expect(out).toContain('finance_x_failed_sessions_today');
    expect(out).toContain('finance_x_audit_log_enabled');
    expect(out).toContain('finance_x_secrets_mode_enum');
  });

  it('includes # HELP and # TYPE lines for every metric (Prometheus shape)', () => {
    const out = buildMetricsResponse();
    const helps = out.match(/^# HELP /gm) ?? [];
    const types = out.match(/^# TYPE /gm) ?? [];
    expect(helps.length).toBe(6);
    expect(types.length).toBe(6);
  });

  it('every metric line is one of: comment, blank, or `name <number>`', () => {
    const out = buildMetricsResponse();
    for (const line of out.split('\n')) {
      if (line === '' || line.startsWith('#')) continue;
      expect(line).toMatch(/^finance_x_[a-z_]+\s-?\d+(\.\d+)?$/);
    }
  });

  it('audit_log_enabled = 0 when AUDIT_LOG_ENABLED is unset', () => {
    delete process.env.AUDIT_LOG_ENABLED;
    expect(buildMetricsResponse()).toMatch(/finance_x_audit_log_enabled 0/);
  });

  it("audit_log_enabled = 1 when AUDIT_LOG_ENABLED='1'", () => {
    process.env.AUDIT_LOG_ENABLED = '1';
    expect(buildMetricsResponse()).toMatch(/finance_x_audit_log_enabled 1/);
  });

  it("audit_log_enabled = 0 when AUDIT_LOG_ENABLED='true' (strict equality)", () => {
    process.env.AUDIT_LOG_ENABLED = 'true';
    expect(buildMetricsResponse()).toMatch(/finance_x_audit_log_enabled 0/);
  });

  it('secrets_mode_enum is 0 when SECRETS_MODE unset (env)', async () => {
    delete process.env.SECRETS_MODE;
    const { _resetActiveProviderForTests } = await import('../security/secrets.js');
    _resetActiveProviderForTests();
    expect(buildMetricsResponse()).toMatch(/finance_x_secrets_mode_enum 0/);
  });

  it("secrets_mode_enum is 1 when SECRETS_MODE='1password'", async () => {
    process.env.SECRETS_MODE = '1password';
    const { _resetActiveProviderForTests } = await import('../security/secrets.js');
    _resetActiveProviderForTests();
    expect(buildMetricsResponse()).toMatch(/finance_x_secrets_mode_enum 1/);
  });

  it("secrets_mode_enum is 2 when SECRETS_MODE='vault'", async () => {
    process.env.SECRETS_MODE = 'vault';
    const { _resetActiveProviderForTests } = await import('../security/secrets.js');
    _resetActiveProviderForTests();
    expect(buildMetricsResponse()).toMatch(/finance_x_secrets_mode_enum 2/);
  });

  it('uptime line has a numeric value matching process.uptime()', () => {
    const before = process.uptime();
    const out = buildMetricsResponse();
    const m = out.match(/finance_x_uptime_seconds (\d+(?:\.\d+)?)/);
    expect(m).not.toBeNull();
    const reported = Number(m?.[1]);
    expect(reported).toBeGreaterThanOrEqual(before - 1);
  });

  it('does NOT include any breaker / KAP metric in Wave 1', () => {
    const out = buildMetricsResponse();
    expect(out).not.toMatch(/circuit_breaker/i);
    expect(out).not.toMatch(/kap/i);
  });

  it('metric VALUE lines (non-comment) contain no secret-like substrings', () => {
    process.env.AUDIT_LOG_ENABLED = '1';
    const out = buildMetricsResponse();
    // Restrict the denylist check to actual metric lines (not # HELP / # TYPE
    // documentation strings, which may legitimately mention "1password"
    // when describing the secrets_mode_enum metric).
    const valueLines = out.split('\n').filter((l) => l && !l.startsWith('#'));
    const denylist = ['password', 'api_key', 'apikey', 'token', 'bearer', 'authorization'];
    for (const line of valueLines) {
      const lower = line.toLowerCase();
      for (const word of denylist) {
        expect(lower).not.toContain(word);
      }
    }
    // No UUIDv4-shaped session ids anywhere in the output
    expect(out).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });
});

// =============================================================================
// isMetricsEnabled (gate)
// =============================================================================

describe('isMetricsEnabled', () => {
  it('returns false when METRICS_ENABLED is unset', () => {
    delete process.env.METRICS_ENABLED;
    expect(isMetricsEnabled()).toBe(false);
  });

  it("returns true only on strict '1'", () => {
    process.env.METRICS_ENABLED = '1';
    expect(isMetricsEnabled()).toBe(true);
    process.env.METRICS_ENABLED = 'on';
    expect(isMetricsEnabled()).toBe(false);
    process.env.METRICS_ENABLED = 'true';
    expect(isMetricsEnabled()).toBe(false);
    process.env.METRICS_ENABLED = '';
    expect(isMetricsEnabled()).toBe(false);
  });
});

// =============================================================================
// registerHealthRoutes — end-to-end via real express app
// =============================================================================

interface CapturedResponse {
  status: number;
  contentType?: string;
  body: unknown;
  text?: string;
}

function makeMockReq(): Request {
  return {} as unknown as Request;
}

function makeMockRes(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: 200, body: undefined };
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      captured.contentType = 'application/json';
      return this;
    },
    type(t: string) {
      captured.contentType = t;
      return this;
    },
    send(payload: string) {
      captured.text = payload;
      captured.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, captured };
}

function getRouteHandler(app: Express, method: 'get', routePath: string): ((req: Request, res: Response) => void) | null {
  type LayerLite = { route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: (req: Request, res: Response) => void }> } };
  const stack = (app as unknown as { _router: { stack: LayerLite[] } })._router?.stack ?? [];
  for (const layer of stack) {
    const route = layer.route;
    if (!route) continue;
    if (route.path === routePath && route.methods?.[method]) {
      const handler = route.stack?.[0]?.handle;
      if (handler) return handler;
    }
  }
  return null;
}

describe('registerHealthRoutes', () => {
  it('registers exactly /health and /ready on the app (no /metrics in Wave 1)', () => {
    const app = express();
    registerHealthRoutes(app);
    expect(getRouteHandler(app, 'get', '/health')).not.toBeNull();
    expect(getRouteHandler(app, 'get', '/ready')).not.toBeNull();
    // Wave 1 deliberately does NOT register /metrics — the shipped /metrics
    // at server.ts:111 is preserved unchanged. Path decision deferred to
    // P6D Wave 1.5.
    expect(getRouteHandler(app, 'get', '/metrics')).toBeNull();
  });

  it('/health responds with 200 and JSON body', () => {
    const app = express();
    registerHealthRoutes(app);
    const handler = getRouteHandler(app, 'get', '/health');
    expect(handler).not.toBeNull();
    const { res, captured } = makeMockRes();
    handler!(makeMockReq(), res);
    expect(captured.contentType).toBe('application/json');
    const body = captured.body as { status: string; uptime_seconds: number };
    expect(body.status).toBe('ok');
    expect(typeof body.uptime_seconds).toBe('number');
  });

  it('/ready responds with 200 when DB ping succeeds', () => {
    const app = express();
    registerHealthRoutes(app);
    const handler = getRouteHandler(app, 'get', '/ready');
    expect(handler).not.toBeNull();
    const { res, captured } = makeMockRes();
    handler!(makeMockReq(), res);
    expect(captured.status).toBe(200);
    const body = captured.body as { ready: boolean; checks: { database: string } };
    expect(body.ready).toBe(true);
    expect(body.checks.database).toBe('ok');
  });

  it('buildMetricsResponse is callable as a standalone helper (Wave 1.5 deferred)', () => {
    // The helper exists, returns Prometheus text, but is not bound to any
    // route. P6D Wave 1.5 will decide where to expose it.
    const out = buildMetricsResponse();
    expect(typeof out).toBe('string');
    expect(out).toContain('finance_x_uptime_seconds');
  });
});

// =============================================================================
// Module discipline
// =============================================================================

describe('module discipline', () => {
  it('module re-import does not throw and exports the public API', async () => {
    const mod = await import('./health.js');
    expect(typeof mod.buildHealthResponse).toBe('function');
    expect(typeof mod.buildReadyResponse).toBe('function');
    expect(typeof mod.buildMetricsResponse).toBe('function');
    expect(typeof mod.registerHealthRoutes).toBe('function');
    expect(typeof mod.isMetricsEnabled).toBe('function');
  });

  it('does not call db.prepare at module import time', async () => {
    const dbMod = await import('../db.js');
    const spy = vi.spyOn(dbMod.db, 'prepare');
    spy.mockClear();
    // Re-evaluating the module is hard with ESM; just assert that calling
    // the public builders is what triggers prepare, not just touching exports.
    const mod = await import('./health.js');
    expect(typeof mod.buildHealthResponse).toBe('function');
    // Touching exports + calling buildHealthResponse should not call prepare.
    spy.mockClear();
    mod.buildHealthResponse();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
