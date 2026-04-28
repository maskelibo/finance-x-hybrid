/**
 * P7C Wave 1 — Session replay / debug tool.
 *
 * Pure, read-only helper. Walks a session's agent + sub-agent execution
 * history and assembles a chronologically merged timeline plus a
 * bottleneck summary (slowest agent / slowest sub-agent).
 *
 * Wave 1 deliberately ships ONLY the slices backed by shipped DB
 * tables (`analysis_sessions`, `agent_runs`, `sub_agent_runs`). The
 * master plan references `escalations` and `contradictions` tables
 * and a `fact_pack_snapshots` source — none of which exist in the
 * shipped schema. Those are deferred to a future P7C Wave 2 (alongside
 * any DB migration that creates them).
 *
 * No LLM, no network, no DB writes. Safe to call from CLI scripts and
 * unit tests against the live SQLite.
 */

import { db } from '../db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionRow {
  id: string;
  ticker: string | null;
  status: string | null;
  current_phase: string | null;
  started_at: string | null;
  completed_at: string | null;
  runtime_mode: string | null;
}

export interface AgentRunRow {
  id: string;
  session_id: string;
  agent_id: string;
  agent_display_name: string;
  status: string;
  provider_used: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface SubAgentRunRow {
  id: string;
  parent_run_id: string;
  sub_agent_id: string;
  parent_agent_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

export type TimelineKind = 'agent' | 'sub_agent';

export interface TimelineEntry {
  kind: TimelineKind;
  agent_id: string;
  parent_agent_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface Bottleneck {
  slowest_agent: { agent_id: string; duration_ms: number } | null;
  slowest_sub_agent: { sub_agent_id: string; parent_agent_id: string; duration_ms: number } | null;
  total_duration_ms: number;
}

export interface ReplayReport {
  session_id: string;
  found: boolean;
  session?: SessionRow;
  timeline: TimelineEntry[];
  agents: AgentRunRow[];
  sub_agents: SubAgentRunRow[];
  bottleneck: Bottleneck;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers — exported for tests
// ---------------------------------------------------------------------------

export function mergeTimeline(agents: AgentRunRow[], subAgents: SubAgentRunRow[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const a of agents) {
    entries.push({
      kind: 'agent',
      agent_id: a.agent_id,
      parent_agent_id: null,
      status: a.status,
      started_at: a.started_at,
      completed_at: a.completed_at,
      duration_ms: a.duration_ms,
    });
  }
  for (const s of subAgents) {
    entries.push({
      kind: 'sub_agent',
      agent_id: s.sub_agent_id,
      parent_agent_id: s.parent_agent_id,
      status: s.status,
      started_at: s.started_at,
      completed_at: s.completed_at,
      duration_ms: s.duration_ms,
    });
  }
  entries.sort((x, y) => {
    const xs = x.started_at ?? '';
    const ys = y.started_at ?? '';
    if (xs < ys) return -1;
    if (xs > ys) return 1;
    return x.kind === y.kind ? 0 : x.kind === 'agent' ? -1 : 1;
  });
  return entries;
}

export function findBottleneck(agents: AgentRunRow[], subAgents: SubAgentRunRow[]): Bottleneck {
  let slowestAgent: Bottleneck['slowest_agent'] = null;
  for (const a of agents) {
    if (typeof a.duration_ms === 'number' && a.duration_ms > 0) {
      if (slowestAgent === null || a.duration_ms > slowestAgent.duration_ms) {
        slowestAgent = { agent_id: a.agent_id, duration_ms: a.duration_ms };
      }
    }
  }
  let slowestSub: Bottleneck['slowest_sub_agent'] = null;
  for (const s of subAgents) {
    if (typeof s.duration_ms === 'number' && s.duration_ms > 0) {
      if (slowestSub === null || s.duration_ms > slowestSub.duration_ms) {
        slowestSub = {
          sub_agent_id: s.sub_agent_id,
          parent_agent_id: s.parent_agent_id,
          duration_ms: s.duration_ms,
        };
      }
    }
  }
  const total = agents.reduce((sum, a) => sum + (a.duration_ms ?? 0), 0);
  return {
    slowest_agent: slowestAgent,
    slowest_sub_agent: slowestSub,
    total_duration_ms: total,
  };
}

// ---------------------------------------------------------------------------
// Public — replaySession
// ---------------------------------------------------------------------------

export function replaySession(sessionId: string): ReplayReport {
  const generatedAt = new Date().toISOString();
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return {
      session_id: String(sessionId ?? ''),
      found: false,
      timeline: [],
      agents: [],
      sub_agents: [],
      bottleneck: { slowest_agent: null, slowest_sub_agent: null, total_duration_ms: 0 },
      generated_at: generatedAt,
    };
  }

  const session = db
    .prepare(
      `SELECT id, ticker, status, current_phase, started_at, completed_at, runtime_mode
       FROM analysis_sessions WHERE id = ?`,
    )
    .get(sessionId) as SessionRow | undefined;

  if (!session) {
    return {
      session_id: sessionId,
      found: false,
      timeline: [],
      agents: [],
      sub_agents: [],
      bottleneck: { slowest_agent: null, slowest_sub_agent: null, total_duration_ms: 0 },
      generated_at: generatedAt,
    };
  }

  const agents = db
    .prepare(
      `SELECT id, session_id, agent_id, agent_display_name, status, provider_used,
              started_at, completed_at, duration_ms
       FROM agent_runs WHERE session_id = ?
       ORDER BY COALESCE(started_at, '') ASC`,
    )
    .all(sessionId) as AgentRunRow[];

  const subAgents =
    agents.length === 0
      ? []
      : (db
          .prepare(
            `SELECT id, parent_run_id, sub_agent_id, parent_agent_id, status,
                    started_at, completed_at, duration_ms
             FROM sub_agent_runs WHERE parent_run_id IN (
               SELECT id FROM agent_runs WHERE session_id = ?
             )
             ORDER BY COALESCE(started_at, '') ASC`,
          )
          .all(sessionId) as SubAgentRunRow[]);

  return {
    session_id: sessionId,
    found: true,
    session,
    timeline: mergeTimeline(agents, subAgents),
    agents,
    sub_agents: subAgents,
    bottleneck: findBottleneck(agents, subAgents),
    generated_at: generatedAt,
  };
}

// ---------------------------------------------------------------------------
// CLI-friendly text rendering
// ---------------------------------------------------------------------------

export function formatReplayText(report: ReplayReport): string {
  const lines: string[] = [];
  lines.push(`# Session replay: ${report.session_id}`);
  lines.push(`generated_at: ${report.generated_at}`);
  if (!report.found) {
    lines.push('STATUS: not_found');
    return lines.join('\n');
  }
  const s = report.session!;
  lines.push(`ticker: ${s.ticker ?? '-'}`);
  lines.push(`status: ${s.status ?? '-'}`);
  lines.push(`current_phase: ${s.current_phase ?? '-'}`);
  lines.push(`started_at: ${s.started_at ?? '-'}`);
  lines.push(`completed_at: ${s.completed_at ?? '-'}`);
  lines.push('');
  lines.push(`# Timeline (${report.timeline.length} entries)`);
  for (const e of report.timeline) {
    const dur = typeof e.duration_ms === 'number' ? `${e.duration_ms}ms` : '-';
    const parent = e.parent_agent_id ? ` parent=${e.parent_agent_id}` : '';
    lines.push(`  [${e.started_at ?? '-'}] ${e.kind} ${e.agent_id} status=${e.status} dur=${dur}${parent}`);
  }
  lines.push('');
  lines.push('# Bottleneck');
  if (report.bottleneck.slowest_agent) {
    lines.push(
      `  slowest_agent: ${report.bottleneck.slowest_agent.agent_id} ${report.bottleneck.slowest_agent.duration_ms}ms`,
    );
  } else {
    lines.push('  slowest_agent: -');
  }
  if (report.bottleneck.slowest_sub_agent) {
    lines.push(
      `  slowest_sub_agent: ${report.bottleneck.slowest_sub_agent.sub_agent_id} (parent=${report.bottleneck.slowest_sub_agent.parent_agent_id}) ${report.bottleneck.slowest_sub_agent.duration_ms}ms`,
    );
  } else {
    lines.push('  slowest_sub_agent: -');
  }
  lines.push(`  total_duration_ms: ${report.bottleneck.total_duration_ms}`);
  return lines.join('\n');
}

export function formatReplayHtml(report: ReplayReport): string {
  const escape = (s: string): string =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
  const rows = report.timeline
    .map(
      (e) =>
        `<tr><td>${escape(e.started_at ?? '-')}</td><td>${escape(e.kind)}</td><td>${escape(e.agent_id)}</td><td>${escape(e.parent_agent_id ?? '')}</td><td>${escape(e.status)}</td><td>${typeof e.duration_ms === 'number' ? e.duration_ms : ''}</td></tr>`,
    )
    .join('\n');
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>Session replay</title>',
    '<style>body{font-family:system-ui,sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:4px 8px;font-size:13px}th{background:#f4f4f4;text-align:left}h1,h2{margin-top:18px}</style>',
    '</head><body>',
    `<h1>Session replay: ${escape(report.session_id)}</h1>`,
    `<p>generated_at: ${escape(report.generated_at)}</p>`,
    !report.found
      ? '<p><strong>not_found</strong></p>'
      : `<table><tr><th>started_at</th><th>kind</th><th>agent_id</th><th>parent</th><th>status</th><th>duration_ms</th></tr>${rows}</table>`,
    '</body></html>',
  ].join('\n');
}
