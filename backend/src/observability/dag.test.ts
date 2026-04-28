/**
 * P7B Wave 1 — DAG snapshot unit tests.
 *
 * Uses the real SQLite at backend/data/financex.db. Each test creates an
 * isolated session id under a "TEST_DAG_*" prefix, asserts behaviour,
 * and cleans up via DELETE. Read-only on production rows.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express, { type Express } from 'express';
import { db } from '../db.js';
import { buildDagSnapshot, isDagEnabled, registerDagRoutes } from './dag.js';

const TEST_PREFIX = 'TEST_DAG_';

function unique(label: string): string {
  return `${TEST_PREFIX}${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function insertSession(id: string, ticker = 'KCHOL'): void {
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, ?, 'standard_institutional', 'running', ?)`,
  ).run(id, ticker, '2026-04-28T10:00:00.000Z');
}

function insertAgentRun(opts: {
  id: string;
  session_id: string;
  agent_id: string;
  agent_display_name: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
}): void {
  db.prepare(
    `INSERT INTO agent_runs (id, session_id, agent_id, agent_display_name, status, started_at, completed_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    opts.session_id,
    opts.agent_id,
    opts.agent_display_name,
    opts.status,
    opts.started_at ?? null,
    opts.completed_at ?? null,
    opts.duration_ms ?? null,
  );
}

function insertSubAgentRun(opts: {
  id: string;
  parent_run_id: string;
  sub_agent_id: string;
  parent_agent_id: string;
  status: string;
  started_at?: string | null;
  duration_ms?: number | null;
}): void {
  db.prepare(
    `INSERT INTO sub_agent_runs (id, parent_run_id, sub_agent_id, parent_agent_id, status, started_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opts.id,
    opts.parent_run_id,
    opts.sub_agent_id,
    opts.parent_agent_id,
    opts.status,
    opts.started_at ?? null,
    opts.duration_ms ?? null,
  );
}

function cleanupTestRows(): void {
  // sub_agent_runs first (FK to agent_runs)
  db.prepare(
    `DELETE FROM sub_agent_runs WHERE parent_run_id IN (
       SELECT id FROM agent_runs WHERE session_id LIKE ?
     )`,
  ).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM agent_runs WHERE session_id LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM analysis_sessions WHERE id LIKE ?`).run(`${TEST_PREFIX}%`);
}

beforeEach(() => {
  delete process.env.DAG_ENABLED;
  cleanupTestRows();
});

afterEach(() => {
  cleanupTestRows();
});

// =============================================================================
// buildDagSnapshot
// =============================================================================

describe('buildDagSnapshot', () => {
  it('returns { found: false } for an unknown session id', () => {
    const r = buildDagSnapshot('no-such-session-xyz-123');
    expect(r.found).toBe(false);
  });

  it('returns { found: false } for empty / non-string sessionId', () => {
    expect(buildDagSnapshot('').found).toBe(false);
    expect(buildDagSnapshot(null as unknown as string).found).toBe(false);
    expect(buildDagSnapshot(undefined as unknown as string).found).toBe(false);
  });

  it('returns a snapshot for a session with no agents (empty arrays + zero summary)', () => {
    const sid = unique('empty');
    insertSession(sid);
    const r = buildDagSnapshot(sid);
    expect(r.found).toBe(true);
    expect(r.snapshot?.session_id).toBe(sid);
    expect(r.snapshot?.agents).toEqual([]);
    expect(r.snapshot?.summary).toEqual({
      total_agents: 0,
      completed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      total_sub_agents: 0,
    });
  });

  it('lists agents with their lifecycle metadata', () => {
    const sid = unique('agents');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_run1`,
      session_id: sid,
      agent_id: 'financial_analysis',
      agent_display_name: 'Financial Analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      completed_at: '2026-04-28T10:00:30.000Z',
      duration_ms: 30000,
    });
    insertAgentRun({
      id: `${sid}_run2`,
      session_id: sid,
      agent_id: 'macro_analysis',
      agent_display_name: 'Macro Analysis',
      status: 'failed',
      started_at: '2026-04-28T10:00:30.000Z',
      completed_at: '2026-04-28T10:01:00.000Z',
      duration_ms: 30000,
    });
    insertAgentRun({
      id: `${sid}_run3`,
      session_id: sid,
      agent_id: 'sector_competition',
      agent_display_name: 'Sector Competition',
      status: 'running',
      started_at: '2026-04-28T10:01:00.000Z',
    });
    const r = buildDagSnapshot(sid);
    expect(r.snapshot?.agents.length).toBe(3);
    expect(r.snapshot?.summary).toMatchObject({
      total_agents: 3,
      completed: 1,
      failed: 1,
      running: 1,
      pending: 0,
      total_sub_agents: 0,
    });
  });

  it('groups sub-agents under their parent agent', () => {
    const sid = unique('subs');
    insertSession(sid);
    const parent = `${sid}_p1`;
    insertAgentRun({
      id: parent,
      session_id: sid,
      agent_id: 'financial_analysis',
      agent_display_name: 'Financial Analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      completed_at: '2026-04-28T10:00:30.000Z',
      duration_ms: 30000,
    });
    insertSubAgentRun({
      id: `${sid}_s1`,
      parent_run_id: parent,
      sub_agent_id: 'fa_extractor',
      parent_agent_id: 'financial_analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      duration_ms: 4000,
    });
    insertSubAgentRun({
      id: `${sid}_s2`,
      parent_run_id: parent,
      sub_agent_id: 'fa_synthesizer',
      parent_agent_id: 'financial_analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:04.000Z',
      duration_ms: 6000,
    });
    const r = buildDagSnapshot(sid);
    expect(r.snapshot?.agents.length).toBe(1);
    expect(r.snapshot?.agents[0].sub_agents.length).toBe(2);
    expect(r.snapshot?.summary.total_sub_agents).toBe(2);
    const ids = r.snapshot!.agents[0].sub_agents.map((s) => s.sub_agent_id).sort();
    expect(ids).toEqual(['fa_extractor', 'fa_synthesizer']);
  });

  it('orders agents by started_at ASC', () => {
    const sid = unique('order');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_late`,
      session_id: sid,
      agent_id: 'late_agent',
      agent_display_name: 'Late',
      status: 'completed',
      started_at: '2026-04-28T10:05:00.000Z',
    });
    insertAgentRun({
      id: `${sid}_early`,
      session_id: sid,
      agent_id: 'early_agent',
      agent_display_name: 'Early',
      status: 'completed',
      started_at: '2026-04-28T10:01:00.000Z',
    });
    const r = buildDagSnapshot(sid);
    const ids = r.snapshot!.agents.map((a) => a.agent_id);
    expect(ids).toEqual(['early_agent', 'late_agent']);
  });

  it('does NOT expose output_text, input_prompt, or error_message fields', () => {
    const sid = unique('nopromp');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_run1`,
      session_id: sid,
      agent_id: 'fa',
      agent_display_name: 'FA',
      status: 'completed',
    });
    const r = buildDagSnapshot(sid);
    const node = r.snapshot!.agents[0] as unknown as Record<string, unknown>;
    expect(Object.keys(node)).not.toContain('output_text');
    expect(Object.keys(node)).not.toContain('input_prompt');
    expect(Object.keys(node)).not.toContain('error_message');
    expect(Object.keys(node)).not.toContain('tokens_used');
    expect(Object.keys(node)).not.toContain('cost_usd');
  });

  it('generated_at is ISO-8601', () => {
    const sid = unique('ts');
    insertSession(sid);
    const r = buildDagSnapshot(sid);
    expect(r.snapshot?.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });
});

// =============================================================================
// isDagEnabled
// =============================================================================

describe('isDagEnabled', () => {
  it('returns false when DAG_ENABLED is unset', () => {
    delete process.env.DAG_ENABLED;
    expect(isDagEnabled()).toBe(false);
  });

  it("returns true only on strict '1'", () => {
    process.env.DAG_ENABLED = '1';
    expect(isDagEnabled()).toBe(true);
    process.env.DAG_ENABLED = 'on';
    expect(isDagEnabled()).toBe(false);
    process.env.DAG_ENABLED = 'true';
    expect(isDagEnabled()).toBe(false);
    delete process.env.DAG_ENABLED;
  });
});

// =============================================================================
// registerDagRoutes
// =============================================================================

function getRouteRegistered(app: Express, method: string, routePath: string): boolean {
  type LayerLite = { route?: { path?: string; methods?: Record<string, boolean> } };
  const stack = (app as unknown as { _router: { stack: LayerLite[] } })._router?.stack ?? [];
  return stack.some((l) => l.route?.path === routePath && l.route?.methods?.[method]);
}

describe('registerDagRoutes', () => {
  it('registers GET /api/sessions/:sessionId/dag', () => {
    const app = express();
    registerDagRoutes(app);
    expect(getRouteRegistered(app, 'get', '/api/sessions/:sessionId/dag')).toBe(true);
  });
});
