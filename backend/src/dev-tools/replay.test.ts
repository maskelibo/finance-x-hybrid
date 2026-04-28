/**
 * P7C Wave 1 — replay tests.
 *
 * Uses the live SQLite DB at backend/data/financex.db. Each test uses a
 * TEST_REPLAY_*-prefixed session and cleans up via DELETE.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db.js';
import {
  findBottleneck,
  formatReplayHtml,
  formatReplayText,
  mergeTimeline,
  replaySession,
  type AgentRunRow,
  type SubAgentRunRow,
} from './replay.js';

const TEST_PREFIX = 'TEST_REPLAY_';

function unique(label: string): string {
  return `${TEST_PREFIX}${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function insertSession(id: string, ticker = 'KCHOL'): void {
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at, completed_at)
     VALUES (?, ?, 'standard_institutional', 'completed', ?, ?)`,
  ).run(id, ticker, '2026-04-28T10:00:00.000Z', '2026-04-28T10:05:00.000Z');
}

function insertAgentRun(opts: {
  id: string;
  session_id: string;
  agent_id: string;
  agent_display_name?: string;
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
    opts.agent_display_name ?? opts.agent_id,
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

function cleanup(): void {
  db.prepare(
    `DELETE FROM sub_agent_runs WHERE parent_run_id IN (
       SELECT id FROM agent_runs WHERE session_id LIKE ?
     )`,
  ).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM agent_runs WHERE session_id LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM analysis_sessions WHERE id LIKE ?`).run(`${TEST_PREFIX}%`);
}

beforeEach(cleanup);
afterEach(cleanup);

// =============================================================================
// mergeTimeline
// =============================================================================

describe('mergeTimeline', () => {
  it('returns empty array for empty inputs', () => {
    expect(mergeTimeline([], [])).toEqual([]);
  });

  it('orders by started_at ASC across kinds', () => {
    const agents: AgentRunRow[] = [
      {
        id: 'a1',
        session_id: 's',
        agent_id: 'A',
        agent_display_name: 'A',
        status: 'completed',
        provider_used: null,
        started_at: '2026-04-28T10:00:00.000Z',
        completed_at: null,
        duration_ms: 1000,
      },
      {
        id: 'a2',
        session_id: 's',
        agent_id: 'B',
        agent_display_name: 'B',
        status: 'completed',
        provider_used: null,
        started_at: '2026-04-28T10:00:10.000Z',
        completed_at: null,
        duration_ms: 1000,
      },
    ];
    const subs: SubAgentRunRow[] = [
      {
        id: 's1',
        parent_run_id: 'a1',
        sub_agent_id: 'sa1',
        parent_agent_id: 'A',
        status: 'completed',
        started_at: '2026-04-28T10:00:05.000Z',
        completed_at: null,
        duration_ms: 500,
      },
    ];
    const t = mergeTimeline(agents, subs);
    expect(t.map((e) => e.agent_id)).toEqual(['A', 'sa1', 'B']);
    expect(t.map((e) => e.kind)).toEqual(['agent', 'sub_agent', 'agent']);
  });

  it('places agent before sub_agent at identical timestamp', () => {
    const ts = '2026-04-28T10:00:00.000Z';
    const agents: AgentRunRow[] = [
      {
        id: 'a',
        session_id: 's',
        agent_id: 'A',
        agent_display_name: 'A',
        status: 'completed',
        provider_used: null,
        started_at: ts,
        completed_at: null,
        duration_ms: null,
      },
    ];
    const subs: SubAgentRunRow[] = [
      {
        id: 'sa',
        parent_run_id: 'a',
        sub_agent_id: 'sub',
        parent_agent_id: 'A',
        status: 'completed',
        started_at: ts,
        completed_at: null,
        duration_ms: null,
      },
    ];
    const t = mergeTimeline(agents, subs);
    expect(t[0].kind).toBe('agent');
    expect(t[1].kind).toBe('sub_agent');
  });
});

// =============================================================================
// findBottleneck
// =============================================================================

describe('findBottleneck', () => {
  it('returns nulls when no durations are present', () => {
    expect(findBottleneck([], [])).toEqual({
      slowest_agent: null,
      slowest_sub_agent: null,
      total_duration_ms: 0,
    });
  });

  it('picks the longest-running agent and sub_agent', () => {
    const agents: AgentRunRow[] = [
      makeAgentRow('A', 1000),
      makeAgentRow('B', 5000),
      makeAgentRow('C', 2000),
    ];
    const subs: SubAgentRunRow[] = [makeSubRow('s1', 'A', 100), makeSubRow('s2', 'B', 4500)];
    const b = findBottleneck(agents, subs);
    expect(b.slowest_agent?.agent_id).toBe('B');
    expect(b.slowest_agent?.duration_ms).toBe(5000);
    expect(b.slowest_sub_agent?.sub_agent_id).toBe('s2');
    expect(b.slowest_sub_agent?.parent_agent_id).toBe('B');
    expect(b.total_duration_ms).toBe(8000);
  });
});

function makeAgentRow(agent_id: string, duration_ms: number | null): AgentRunRow {
  return {
    id: `r_${agent_id}`,
    session_id: 's',
    agent_id,
    agent_display_name: agent_id,
    status: 'completed',
    provider_used: null,
    started_at: null,
    completed_at: null,
    duration_ms,
  };
}

function makeSubRow(sub_agent_id: string, parent_agent_id: string, duration_ms: number | null): SubAgentRunRow {
  return {
    id: `s_${sub_agent_id}`,
    parent_run_id: `r_${parent_agent_id}`,
    sub_agent_id,
    parent_agent_id,
    status: 'completed',
    started_at: null,
    completed_at: null,
    duration_ms,
  };
}

// =============================================================================
// replaySession (live DB)
// =============================================================================

describe('replaySession', () => {
  it('returns found:false for unknown session', () => {
    const r = replaySession('does-not-exist');
    expect(r.found).toBe(false);
    expect(r.timeline).toEqual([]);
    expect(r.agents).toEqual([]);
  });

  it('returns found:false for empty / non-string id', () => {
    expect(replaySession('').found).toBe(false);
    expect(replaySession(null as unknown as string).found).toBe(false);
  });

  it('builds a full report for a session with agents + sub-agents', () => {
    const sid = unique('full');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_p`,
      session_id: sid,
      agent_id: 'financial_analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      duration_ms: 30000,
    });
    insertSubAgentRun({
      id: `${sid}_s1`,
      parent_run_id: `${sid}_p`,
      sub_agent_id: 'fa_extractor',
      parent_agent_id: 'financial_analysis',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.500Z',
      duration_ms: 4000,
    });
    const r = replaySession(sid);
    expect(r.found).toBe(true);
    expect(r.agents.length).toBe(1);
    expect(r.sub_agents.length).toBe(1);
    expect(r.timeline.length).toBe(2);
    expect(r.bottleneck.slowest_agent?.agent_id).toBe('financial_analysis');
    expect(r.bottleneck.slowest_sub_agent?.sub_agent_id).toBe('fa_extractor');
  });

  it('handles a session with zero agent runs', () => {
    const sid = unique('empty');
    insertSession(sid);
    const r = replaySession(sid);
    expect(r.found).toBe(true);
    expect(r.agents.length).toBe(0);
    expect(r.sub_agents.length).toBe(0);
    expect(r.timeline.length).toBe(0);
    expect(r.bottleneck.total_duration_ms).toBe(0);
  });
});

// =============================================================================
// formatReplayText / formatReplayHtml
// =============================================================================

describe('formatReplayText', () => {
  it('renders not_found banner when found is false', () => {
    const text = formatReplayText({
      session_id: 'X',
      found: false,
      timeline: [],
      agents: [],
      sub_agents: [],
      bottleneck: { slowest_agent: null, slowest_sub_agent: null, total_duration_ms: 0 },
      generated_at: '2026-04-28T00:00:00.000Z',
    });
    expect(text).toContain('STATUS: not_found');
  });

  it('renders timeline entries and bottleneck for a found session', () => {
    const sid = unique('text');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_p`,
      session_id: sid,
      agent_id: 'fa',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      duration_ms: 1234,
    });
    const text = formatReplayText(replaySession(sid));
    expect(text).toContain(sid);
    expect(text).toContain('agent fa status=completed');
    expect(text).toContain('slowest_agent: fa 1234ms');
  });
});

describe('formatReplayHtml', () => {
  it('renders an HTML document with table for a found session', () => {
    const sid = unique('html');
    insertSession(sid);
    insertAgentRun({
      id: `${sid}_p`,
      session_id: sid,
      agent_id: 'fa',
      status: 'completed',
      started_at: '2026-04-28T10:00:00.000Z',
      duration_ms: 100,
    });
    const html = formatReplayHtml(replaySession(sid));
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<table>');
    expect(html).toContain(sid);
    expect(html).toContain('fa');
  });

  it('escapes HTML-special characters', () => {
    const html = formatReplayHtml({
      session_id: '<script>',
      found: true,
      session: {
        id: '<script>',
        ticker: 'KCHOL',
        status: 'running',
        current_phase: null,
        started_at: null,
        completed_at: null,
        runtime_mode: null,
      },
      timeline: [
        {
          kind: 'agent',
          agent_id: 'a&b',
          parent_agent_id: null,
          status: 'completed',
          started_at: null,
          completed_at: null,
          duration_ms: null,
        },
      ],
      agents: [],
      sub_agents: [],
      bottleneck: { slowest_agent: null, slowest_sub_agent: null, total_duration_ms: 0 },
      generated_at: '2026-04-28T00:00:00.000Z',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('a&amp;b');
  });
});
