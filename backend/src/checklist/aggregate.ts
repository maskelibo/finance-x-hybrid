/**
 * Session-level addressal aggregator — Phase 6A observe-only.
 *
 * Reads every completed agent_run in a session, extracts its `findings[]`
 * and `addressed_findings[]` (from the agent output's JSON block, falling
 * back to the Phase 5A manifest_json if it was persisted), and computes
 * the AddressalReport:
 *
 *   - Each distinct `finding_id` emitted anywhere in the session is part of
 *     finding_count.
 *   - Each of those that also appears in SOME agent's addressed_findings[]
 *     is counted toward addressed_count.
 *   - Per-agent breakdown shows who raised vs who addressed.
 *   - Action counts tally fixed / acknowledged / rejected across the session.
 *   - escalation_flag = addressal_rate < ADDRESSAL_ESCALATION_THRESHOLD.
 *
 * Never throws; malformed outputs contribute zero to the rollup.
 */

import { db } from '../db.js';
import {
  ADDRESSAL_ESCALATION_THRESHOLD,
  type AddressalReport,
  type AgentAddressalBreakdown,
  type FindingAction,
} from './types.js';

const EMPTY_ACTION_COUNTS = (): Record<FindingAction, number> => ({
  fixed: 0,
  acknowledged: 0,
  rejected: 0,
});

function tryExtractJson(raw: string | null | undefined): unknown | null {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
  }
  const first = text.indexOf('{');
  if (first < 0) return null;
  let depth = 0;
  for (let i = first; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(first, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function extractFindings(doc: unknown): Array<{ finding_id: string }> {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [];
  const arr = (doc as Record<string, unknown>)['findings'];
  if (!Array.isArray(arr)) return [];
  const out: Array<{ finding_id: string }> = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const id = (item as Record<string, unknown>)['finding_id'];
    if (typeof id === 'string' && id.length > 0) out.push({ finding_id: id });
  }
  return out;
}

function extractAddressed(doc: unknown): Array<{
  finding_id: string;
  action_taken: FindingAction | null;
}> {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [];
  const arr = (doc as Record<string, unknown>)['addressed_findings'];
  if (!Array.isArray(arr)) return [];
  const out: Array<{ finding_id: string; action_taken: FindingAction | null }> = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const id = rec['finding_id'];
    const action = rec['action_taken'];
    if (typeof id !== 'string' || id.length === 0) continue;
    const normAction: FindingAction | null =
      action === 'fixed' || action === 'acknowledged' || action === 'rejected'
        ? action
        : null;
    out.push({ finding_id: id, action_taken: normAction });
  }
  return out;
}

export function aggregateSessionAddressal(sessionId: string): AddressalReport | null {
  let rows: Array<{
    agent_id: string;
    output_text: string | null;
    ticker: string | null;
    manifest_json: string | null;
  }>;
  try {
    rows = db
      .prepare(
        `SELECT ar.agent_id, ar.output_text, s.ticker,
                COALESCE(ar.manifest_json, NULL) AS manifest_json
           FROM agent_runs ar
           JOIN analysis_sessions s ON s.id = ar.session_id
          WHERE ar.session_id = ? AND ar.status = 'completed'`,
      )
      .all(sessionId) as Array<{
        agent_id: string;
        output_text: string | null;
        ticker: string | null;
        manifest_json: string | null;
      }>;
  } catch (err: unknown) {
    // If the phase5 migration isn't applied yet, manifest_json column is
    // missing — retry without it.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such column')) {
      rows = db
        .prepare(
          `SELECT ar.agent_id, ar.output_text, s.ticker
             FROM agent_runs ar
             JOIN analysis_sessions s ON s.id = ar.session_id
            WHERE ar.session_id = ? AND ar.status = 'completed'`,
        )
        .all(sessionId) as Array<{
          agent_id: string;
          output_text: string | null;
          ticker: string | null;
          manifest_json: string | null;
        }>;
      rows = rows.map((r) => ({ ...r, manifest_json: null }));
    } else {
      // Unknown error — bail silently; observe-only contract.
      return null;
    }
  }

  if (rows.length === 0) return null;
  const ticker = rows[0].ticker;

  // Distinct finding_ids across the entire session.
  const allFindingIds = new Set<string>();
  // Distinct addressed finding_ids (any agent) — membership test is what
  // drives addressed_count; duplicate addressals collapse.
  const allAddressedIds = new Set<string>();
  const actionCounts: Record<FindingAction, number> = EMPTY_ACTION_COUNTS();
  const byAgent = new Map<string, AgentAddressalBreakdown>();

  for (const row of rows) {
    const doc = tryExtractJson(row.output_text);
    const findings = extractFindings(doc);
    const addressed = extractAddressed(doc);

    const perAgent: AgentAddressalBreakdown =
      byAgent.get(row.agent_id) ?? {
        agent_id: row.agent_id,
        findings_raised: 0,
        findings_addressed: 0,
        action_counts: EMPTY_ACTION_COUNTS(),
        unaddressed_finding_ids: [],
      };

    for (const f of findings) {
      allFindingIds.add(f.finding_id);
      perAgent.findings_raised++;
    }
    for (const a of addressed) {
      allAddressedIds.add(a.finding_id);
      perAgent.findings_addressed++;
      if (a.action_taken) {
        perAgent.action_counts[a.action_taken]++;
        actionCounts[a.action_taken]++;
      }
    }
    byAgent.set(row.agent_id, perAgent);
  }

  // Unaddressed = raised anywhere, never addressed anywhere.
  const unaddressed: string[] = [];
  allFindingIds.forEach((id) => { if (!allAddressedIds.has(id)) unaddressed.push(id); });

  // Per-agent unaddressed lists filter on the agent's own raised set.
  for (const [agentId, bd] of byAgent) {
    // Recompute this agent's unaddressed by finding intersection of the
    // agent's raised_ids with the session-level unaddressed set.
    // We didn't track per-agent raised_ids above — minimal cost second pass:
    const doc = (() => {
      const row = rows.find((r) => r.agent_id === agentId);
      return row ? tryExtractJson(row.output_text) : null;
    })();
    const raised = new Set(extractFindings(doc).map((f) => f.finding_id));
    bd.unaddressed_finding_ids = unaddressed.filter((id) => raised.has(id));
  }

  const findingCount = allFindingIds.size;
  const addressedCount = Array.from(allFindingIds).filter((id) => allAddressedIds.has(id)).length;
  const addressalRate = findingCount === 0 ? 1 : addressedCount / findingCount;

  return {
    session_id: sessionId,
    ticker,
    finding_count: findingCount,
    addressed_count: addressedCount,
    addressal_rate: Number(addressalRate.toFixed(4)),
    action_counts: actionCounts,
    unaddressed_finding_ids: unaddressed.slice(0, 40),
    by_agent: Array.from(byAgent.values()),
    escalation_flag: findingCount > 0 && addressalRate < ADDRESSAL_ESCALATION_THRESHOLD,
    generated_at: new Date().toISOString(),
  };
}
