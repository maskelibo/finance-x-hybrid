/**
 * P6D Wave 1 — Health checks + metrics helper.
 *
 * Two endpoints, exposed only when METRICS_ENABLED='1':
 *   GET /health    — liveness JSON
 *   GET /ready     — readiness JSON (local DB ping only)
 *
 * `buildMetricsResponse()` ships as a callable helper but is NOT bound to
 * any route in Wave 1: server.ts already has a `/metrics` route (line 111)
 * with a different metric set, and this Wave 1 deliberately preserves it
 * unchanged. The path/merge decision is deferred to P6D Wave 1.5.
 *
 * Wave 1 invariants (per finance-x-polish P6D Wave 1 scope):
 *   - No external network calls (no Anthropic, no Qdrant, no KAP probes).
 *   - No fabricated circuit-breaker state (the shipped P4D module is a
 *     stateless decision function; deriving breaker state per scrape is
 *     deferred to Wave 2).
 *   - No session_id, ticker, user_id, secret value, prompt body, or
 *     report body in any response.
 *   - Module import is free of side effects (no DB read, no env read at
 *     import time — every read happens inside a handler).
 *   - Default OFF: server.ts only calls registerHealthRoutes() when the
 *     METRICS_ENABLED='1' gate is set. Without the flag, neither route is
 *     registered and behaviour is byte-identical to today.
 *   - registerHealthRoutes only registers /health and /ready. The
 *     existing /metrics route at server.ts:111 is intentionally left
 *     alone to satisfy the "default behaviour unchanged for existing
 *     routes" standing rule.
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { getActiveProvider } from '../security/secrets.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function startOfTodayUtcIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

function safeCount(sql: string, params: unknown[] = []): number {
  try {
    const row = db.prepare(sql).get(...params) as { c?: number } | undefined;
    return typeof row?.c === 'number' ? row.c : 0;
  } catch {
    return 0;
  }
}

function secretsModeEnum(): 0 | 1 | 2 {
  try {
    const mode = getActiveProvider().mode;
    if (mode === 'env') return 0;
    if (mode === '1password') return 1;
    if (mode === 'vault') return 2;
    return 0;
  } catch {
    return 0;
  }
}

function auditLogEnabledFlag(): 0 | 1 {
  return process.env.AUDIT_LOG_ENABLED === '1' ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Pure response builders (independently testable)
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok';
  uptime_seconds: number;
  timestamp: string;
}

export function buildHealthResponse(): HealthResponse {
  return {
    status: 'ok',
    uptime_seconds: process.uptime(),
    timestamp: nowIso(),
  };
}

export interface ReadyResponse {
  ready: boolean;
  checks: {
    database: 'ok' | string;
    process: 'ok';
  };
  timestamp: string;
}

export function buildReadyResponse(): ReadyResponse {
  let database: 'ok' | string = 'ok';
  try {
    const row = db.prepare('SELECT 1 AS one').get() as { one?: number } | undefined;
    if (row?.one !== 1) {
      database = 'unexpected_shape';
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    database = `error: ${msg.slice(0, 80)}`;
  }
  const ready = database === 'ok';
  return {
    ready,
    checks: { database, process: 'ok' },
    timestamp: nowIso(),
  };
}

export function buildMetricsResponse(): string {
  const startToday = startOfTodayUtcIso();
  const active = safeCount(`SELECT COUNT(*) AS c FROM analysis_sessions WHERE status = 'running'`);
  const completedToday = safeCount(
    `SELECT COUNT(*) AS c FROM analysis_sessions WHERE status = 'completed' AND completed_at >= ?`,
    [startToday],
  );
  const failedToday = safeCount(
    `SELECT COUNT(*) AS c FROM analysis_sessions WHERE status LIKE '%failed%' AND started_at >= ?`,
    [startToday],
  );
  const auditEnabled = auditLogEnabledFlag();
  const secretsMode = secretsModeEnum();
  const uptime = process.uptime();

  const lines: string[] = [
    '# HELP finance_x_uptime_seconds Process uptime in seconds.',
    '# TYPE finance_x_uptime_seconds gauge',
    `finance_x_uptime_seconds ${uptime}`,
    '',
    '# HELP finance_x_active_sessions Currently running analysis sessions.',
    '# TYPE finance_x_active_sessions gauge',
    `finance_x_active_sessions ${active}`,
    '',
    '# HELP finance_x_completed_sessions_today Sessions completed today (UTC).',
    '# TYPE finance_x_completed_sessions_today gauge',
    `finance_x_completed_sessions_today ${completedToday}`,
    '',
    '# HELP finance_x_failed_sessions_today Sessions failed today (UTC).',
    '# TYPE finance_x_failed_sessions_today gauge',
    `finance_x_failed_sessions_today ${failedToday}`,
    '',
    '# HELP finance_x_audit_log_enabled Audit log writer flag (0=off, 1=on).',
    '# TYPE finance_x_audit_log_enabled gauge',
    `finance_x_audit_log_enabled ${auditEnabled}`,
    '',
    '# HELP finance_x_secrets_mode_enum Secrets provider (0=env, 1=1password, 2=vault).',
    '# TYPE finance_x_secrets_mode_enum gauge',
    `finance_x_secrets_mode_enum ${secretsMode}`,
    '',
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function isMetricsEnabled(): boolean {
  return process.env.METRICS_ENABLED === '1';
}

export function registerHealthRoutes(app: Express): void {
  app.get('/health', (_req: Request, res: Response) => {
    try {
      res.json(buildHealthResponse());
    } catch (err) {
      res.status(500).json({ status: 'error' });
      console.warn('[health-routes] /health failed:', err instanceof Error ? err.message : err);
    }
  });

  app.get('/ready', (_req: Request, res: Response) => {
    try {
      const body = buildReadyResponse();
      res.status(body.ready ? 200 : 503).json(body);
    } catch (err) {
      res.status(503).json({ ready: false, checks: { database: 'error', process: 'ok' }, timestamp: nowIso() });
      console.warn('[health-routes] /ready failed:', err instanceof Error ? err.message : err);
    }
  });

  // NOTE: /metrics is intentionally NOT registered here in Wave 1. The
  // existing /metrics route at backend/src/server.ts:111 (Prometheus text
  // exposition with agent-id and status labels) is preserved unchanged.
  // buildMetricsResponse() above is a callable helper for P6D Wave 1.5.
}
