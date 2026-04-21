/**
 * Refactor observability dashboard — Phase 11A.
 *
 * Aggregates the Phase 3A/4A/5A/6A/7A observer data into a handful of
 * read-only JSON endpoints. Each query is defensive: if the relevant
 * migration has not been applied, the endpoint returns an empty payload
 * with `migration_applied: false` instead of raising a 500.
 *
 * Endpoints (mounted under /api/refactor/):
 *
 *   GET /api/refactor/gates              Phase 3A QA/CEO/schema_shadow gate events
 *   GET /api/refactor/validation         Phase 4A category distribution
 *   GET /api/refactor/manifest           Phase 5A manifest size/compression trends
 *   GET /api/refactor/checklist          Phase 6A session addressal + escalation
 *   GET /api/refactor/doctrine           Phase 7A OI-* formatter violations
 *   GET /api/refactor/overview           Rollup of all of the above
 *
 * The dashboard HTML at /refactor-dashboard hits these endpoints client-side.
 *
 * Design note: no writes, no side effects. Safe to scrape from Prometheus
 * or a cron job.
 */

import type { Request, Response, Express } from 'express';
import { db } from '../db.js';

type MigrationStatus = { migration_applied: boolean; reason?: string };

function safeQuery<T>(sql: string, params: unknown[] = []): T[] | null {
  try {
    return db.prepare(sql).all(...params) as T[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table') || msg.includes('no such column')) return null;
    console.warn(`[refactor-dashboard] query failed: ${msg}`);
    return null;
  }
}

function safeQueryOne<T>(sql: string, params: unknown[] = []): T | null {
  try {
    return db.prepare(sql).get(...params) as T | null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table') || msg.includes('no such column')) return null;
    console.warn(`[refactor-dashboard] query failed: ${msg}`);
    return null;
  }
}

// ── Phase 3A — gate events ────────────────────────────────────────────────
function gatesHandler(_req: Request, res: Response): void {
  const byKind = safeQuery<{ gate_kind: string; decision_taken: string; n: number }>(
    `SELECT gate_kind, decision_taken, COUNT(*) AS n
       FROM agent_run_gate_events
      GROUP BY gate_kind, decision_taken
      ORDER BY gate_kind, n DESC`,
  );
  if (byKind === null) {
    res.json({ migration_applied: false, reason: 'phase3a_gate_events.sql not applied' } satisfies MigrationStatus);
    return;
  }
  const blockedCandidates = safeQuery<{ gate_kind: string; n: number }>(
    `SELECT gate_kind, COUNT(*) AS n
       FROM agent_run_gate_events
      WHERE would_have_blocked = 1
      GROUP BY gate_kind`,
  );
  const recent = safeQuery<{
    id: string;
    session_id: string;
    ticker: string | null;
    gate_kind: string;
    decision_taken: string;
    would_have_blocked: number;
    reason: string | null;
    created_at: string;
  }>(
    `SELECT id, session_id, ticker, gate_kind, decision_taken,
            would_have_blocked, reason, created_at
       FROM agent_run_gate_events
      ORDER BY created_at DESC
      LIMIT 25`,
  );
  res.json({
    migration_applied: true,
    by_kind: byKind,
    would_have_blocked: blockedCandidates ?? [],
    recent: recent ?? [],
  });
}

// ── Phase 4A — validation categories ──────────────────────────────────────
function validationHandler(_req: Request, res: Response): void {
  const byCategory = safeQuery<{ validation_category: string; n: number }>(
    `SELECT validation_category, COUNT(*) AS n
       FROM agent_runs
      WHERE validation_category IS NOT NULL
      GROUP BY validation_category
      ORDER BY n DESC`,
  );
  if (byCategory === null) {
    res.json({ migration_applied: false, reason: 'phase4_schema_observation.sql not applied' } satisfies MigrationStatus);
    return;
  }
  const byAgent = safeQuery<{ agent_id: string; validation_category: string; n: number }>(
    `SELECT agent_id, validation_category, COUNT(*) AS n
       FROM agent_runs
      WHERE validation_category IS NOT NULL
      GROUP BY agent_id, validation_category
      ORDER BY n DESC
      LIMIT 40`,
  );
  res.json({
    migration_applied: true,
    by_category: byCategory,
    top_agent_category_pairs: byAgent ?? [],
  });
}

// ── Phase 5A — manifest sizes ─────────────────────────────────────────────
function manifestHandler(_req: Request, res: Response): void {
  const byAgent = safeQuery<{
    agent_id: string;
    avg_raw_bytes: number;
    avg_manifest_bytes: number;
    compression_ratio: number;
    truncation_risk_count: number;
    n: number;
  }>(
    `SELECT agent_id,
            AVG(manifest_raw_size_bytes)        AS avg_raw_bytes,
            AVG(manifest_compressed_size_bytes) AS avg_manifest_bytes,
            CAST(AVG(manifest_raw_size_bytes) AS REAL)
              / NULLIF(AVG(manifest_compressed_size_bytes), 0) AS compression_ratio,
            SUM(manifest_truncation_risk) AS truncation_risk_count,
            COUNT(*) AS n
       FROM agent_runs
      WHERE manifest_raw_size_bytes IS NOT NULL
      GROUP BY agent_id
      ORDER BY compression_ratio DESC`,
  );
  if (byAgent === null) {
    res.json({ migration_applied: false, reason: 'phase5_manifest_observation.sql not applied' } satisfies MigrationStatus);
    return;
  }
  res.json({ migration_applied: true, by_agent: byAgent });
}

// ── Phase 6A — checklist ──────────────────────────────────────────────────
function checklistHandler(_req: Request, res: Response): void {
  const rollup = safeQueryOne<{
    sessions_scored: number;
    avg_addressal_rate: number | null;
    escalation_count: number;
  }>(
    `SELECT COUNT(*) AS sessions_scored,
            AVG(addressal_rate) AS avg_addressal_rate,
            SUM(CASE WHEN addressal_escalation_flag = 1 THEN 1 ELSE 0 END) AS escalation_count
       FROM analysis_sessions
      WHERE addressal_rate IS NOT NULL`,
  );
  if (rollup === null) {
    res.json({ migration_applied: false, reason: 'phase6_checklist_observation.sql not applied' } satisfies MigrationStatus);
    return;
  }
  const recentEscalations = safeQuery<{
    id: string;
    ticker: string | null;
    addressal_rate: number;
    findings_total: number;
    findings_addressed: number;
    created_at: string;
  }>(
    `SELECT id, ticker, addressal_rate, findings_total, findings_addressed, created_at
       FROM analysis_sessions
      WHERE addressal_escalation_flag = 1
      ORDER BY created_at DESC
      LIMIT 25`,
  );
  const byTicker = safeQuery<{ ticker: string; avg_rate: number; n: number }>(
    `SELECT ticker, AVG(addressal_rate) AS avg_rate, COUNT(*) AS n
       FROM analysis_sessions
      WHERE addressal_rate IS NOT NULL
      GROUP BY ticker
      ORDER BY avg_rate ASC`,
  );
  res.json({
    migration_applied: true,
    rollup,
    recent_escalations: recentEscalations ?? [],
    by_ticker: byTicker ?? [],
  });
}

// ── Phase 7A — formatter doctrine (derived from shadow events) ────────────
function doctrineHandler(_req: Request, res: Response): void {
  // Doctrine violations live in gate_events (detail_json.violations[].rule)
  // because Phase 7A routes them through shadow_validator. We count rule hits
  // for the OI-* prefix.
  const rows = safeQuery<{ detail_json: string }>(
    `SELECT detail_json
       FROM agent_run_gate_events
      WHERE gate_kind = 'schema_shadow'
        AND detail_json IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5000`,
  );
  if (rows === null) {
    res.json({ migration_applied: false, reason: 'phase3a_gate_events.sql not applied' } satisfies MigrationStatus);
    return;
  }
  const hits: Record<string, number> = {};
  let parsedRows = 0;
  for (const row of rows) {
    try {
      const detail = JSON.parse(row.detail_json);
      const violations = detail?.violations;
      if (!Array.isArray(violations)) continue;
      parsedRows++;
      for (const v of violations) {
        if (!v || typeof v !== 'object') continue;
        const rule = (v as Record<string, unknown>).rule;
        if (typeof rule !== 'string') continue;
        if (!rule.startsWith('OI-')) continue;
        hits[rule] = (hits[rule] ?? 0) + 1;
      }
    } catch {
      // skip malformed row
    }
  }
  const sorted = Object.entries(hits)
    .map(([rule, n]) => ({ rule, n }))
    .sort((a, b) => b.n - a.n);
  res.json({
    migration_applied: true,
    parsed_shadow_rows: parsedRows,
    oi_violations: sorted,
  });
}

// ── Overview — compact rollup for the dashboard hero cards ────────────────
function overviewHandler(_req: Request, res: Response): void {
  const totalSessions = safeQueryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM analysis_sessions`,
  );
  const gateTotal = safeQueryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM agent_run_gate_events`,
  );
  const validationTotal = safeQueryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM agent_runs WHERE validation_category IS NOT NULL`,
  );
  const manifestTotal = safeQueryOne<{ n: number; avg_ratio: number | null }>(
    `SELECT COUNT(*) AS n,
            AVG(CAST(manifest_raw_size_bytes AS REAL)
              / NULLIF(manifest_compressed_size_bytes, 0)) AS avg_ratio
       FROM agent_runs
      WHERE manifest_raw_size_bytes IS NOT NULL`,
  );
  const checklistTotal = safeQueryOne<{ n: number; escalations: number }>(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN addressal_escalation_flag = 1 THEN 1 ELSE 0 END) AS escalations
       FROM analysis_sessions
      WHERE addressal_rate IS NOT NULL`,
  );

  res.json({
    total_sessions: totalSessions?.n ?? 0,
    phase_3a_gate_events: gateTotal,
    phase_4a_validation_records: validationTotal,
    phase_5a_manifest_records: manifestTotal,
    phase_6a_checklist_records: checklistTotal,
    generated_at: new Date().toISOString(),
  });
}

export function registerRefactorDashboardRoutes(app: Express): void {
  app.get('/api/refactor/overview', overviewHandler);
  app.get('/api/refactor/gates', gatesHandler);
  app.get('/api/refactor/validation', validationHandler);
  app.get('/api/refactor/manifest', manifestHandler);
  app.get('/api/refactor/checklist', checklistHandler);
  app.get('/api/refactor/doctrine', doctrineHandler);
}
