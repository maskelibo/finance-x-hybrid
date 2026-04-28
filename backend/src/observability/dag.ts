/**
 * P7B Wave 1 — Observable DAG snapshot.
 *
 * Returns a JSON representation of a session's agent + sub-agent execution
 * graph for live status panels / gantt charts. Pure read-only DB query;
 * no LLM, no network, no writes, no mutation.
 *
 * Wave 1 ships ONLY the backend snapshot. The frontend React component
 * (dashboard/src/components/SessionDAG.tsx in the master plan) is out of
 * the CI test path and deferred.
 *
 * Default OFF: server.ts only registers the route under DAG_ENABLED='1'.
 *
 * Privacy: the snapshot returns operational metadata only (agent ids,
 * statuses, timestamps, durations). It deliberately omits output_text,
 * input_prompt, and error_message bodies — these can contain prompt
 * fragments or LLM outputs and aren't suitable for a debug-panel
 * surface that may be embedded in shared dashboards. Pull the full
 * row through a different surface if you need it.
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DagAgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | string;

export interface DagSubAgentNode {
  id: string;
  sub_agent_id: string;
  parent_agent_id: string;
  status: DagAgentStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface DagAgentNode {
  id: string;
  agent_id: string;
  agent_display_name: string;
  status: DagAgentStatus;
  provider_used: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  sub_agents: DagSubAgentNode[];
}

export interface DagSummary {
  total_agents: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  total_sub_agents: number;
}

export interface DagSnapshot {
  session_id: string;
  ticker: string | null;
  status: string | null;
  current_phase: string | null;
  started_at: string | null;
  completed_at: string | null;
  agents: DagAgentNode[];
  summary: DagSummary;
  generated_at: string;
}

export interface DagSnapshotResult {
  found: boolean;
  snapshot?: DagSnapshot;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string;
  ticker: string | null;
  status: string | null;
  current_phase: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface AgentRunRow {
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

interface SubAgentRunRow {
  id: string;
  parent_run_id: string;
  sub_agent_id: string;
  parent_agent_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

export function buildDagSnapshot(sessionId: string): DagSnapshotResult {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { found: false };
  }
  const session = db
    .prepare(
      `SELECT id, ticker, status, current_phase, started_at, completed_at
       FROM analysis_sessions WHERE id = ?`,
    )
    .get(sessionId) as SessionRow | undefined;
  if (!session) return { found: false };

  const agentRuns = db
    .prepare(
      `SELECT id, session_id, agent_id, agent_display_name, status, provider_used,
              started_at, completed_at, duration_ms
       FROM agent_runs WHERE session_id = ?
       ORDER BY COALESCE(started_at, '') ASC, agent_id ASC`,
    )
    .all(sessionId) as AgentRunRow[];

  const subRunsByParent = new Map<string, SubAgentRunRow[]>();
  if (agentRuns.length > 0) {
    const parentIds = agentRuns.map((r) => r.id);
    const placeholders = parentIds.map(() => '?').join(',');
    const subRuns = db
      .prepare(
        `SELECT id, parent_run_id, sub_agent_id, parent_agent_id, status,
                started_at, completed_at, duration_ms
         FROM sub_agent_runs WHERE parent_run_id IN (${placeholders})
         ORDER BY COALESCE(started_at, '') ASC, sub_agent_id ASC`,
      )
      .all(...parentIds) as SubAgentRunRow[];
    for (const sr of subRuns) {
      const list = subRunsByParent.get(sr.parent_run_id) ?? [];
      list.push(sr);
      subRunsByParent.set(sr.parent_run_id, list);
    }
  }

  const agents: DagAgentNode[] = agentRuns.map((row) => {
    const subs = (subRunsByParent.get(row.id) ?? []).map((s) => ({
      id: s.id,
      sub_agent_id: s.sub_agent_id,
      parent_agent_id: s.parent_agent_id,
      status: s.status,
      started_at: s.started_at,
      completed_at: s.completed_at,
      duration_ms: s.duration_ms,
    } satisfies DagSubAgentNode));
    return {
      id: row.id,
      agent_id: row.agent_id,
      agent_display_name: row.agent_display_name,
      status: row.status,
      provider_used: row.provider_used,
      started_at: row.started_at,
      completed_at: row.completed_at,
      duration_ms: row.duration_ms,
      sub_agents: subs,
    } satisfies DagAgentNode;
  });

  let completed = 0;
  let failed = 0;
  let running = 0;
  let pending = 0;
  for (const a of agents) {
    if (a.status === 'completed') completed++;
    else if (a.status === 'failed') failed++;
    else if (a.status === 'running') running++;
    else if (a.status === 'pending') pending++;
  }
  const totalSubAgents = agents.reduce((s, a) => s + a.sub_agents.length, 0);

  return {
    found: true,
    snapshot: {
      session_id: session.id,
      ticker: session.ticker,
      status: session.status,
      current_phase: session.current_phase,
      started_at: session.started_at,
      completed_at: session.completed_at,
      agents,
      summary: {
        total_agents: agents.length,
        completed,
        failed,
        running,
        pending,
        total_sub_agents: totalSubAgents,
      },
      generated_at: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function isDagEnabled(): boolean {
  return process.env.DAG_ENABLED === '1';
}

export function registerDagRoutes(app: Express): void {
  app.get('/api/sessions/:sessionId/dag', (req: Request, res: Response) => {
    try {
      const sessionId = (req.params as { sessionId?: string }).sessionId;
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        res.status(400).json({ error: 'sessionId_required' });
        return;
      }
      const result = buildDagSnapshot(sessionId);
      if (!result.found) {
        res.status(404).json({ error: 'session_not_found' });
        return;
      }
      res.json(result.snapshot);
    } catch (err) {
      res.status(500).json({ error: 'dag_snapshot_failed' });
      console.warn('[dag-routes] /dag failed:', err instanceof Error ? err.message : err);
    }
  });
}
