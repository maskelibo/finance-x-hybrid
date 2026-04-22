/**
 * Gate observer — Phase 3A observe-only instrumentation.
 *
 * This module records "what the hard gate WOULD have done" without
 * influencing the live control flow. Every function here is pure
 * write-only to the agent_run_gate_events table; none of them mutates
 * orchestrator state or returns a blocking signal.
 *
 * Usage from orchestrator.ts:
 *
 *   import { recordQaGateObservation, recordCeoGateObservation } from './gate-observer';
 *
 *   recordQaGateObservation({
 *     sessionId, ticker, runtimeMode,
 *     qaRound, wouldHaveBlocked, decisionTaken: 'continued',
 *     reason: 'keyword-block-triggered',
 *     scoreNumeric: 0.62,
 *     detail: { keywords: [...], matchedPhrase: '...' },
 *   });
 *
 * Safe even if the phase3a_gate_events migration has not been applied:
 * the helpers swallow "no such table" errors and log a one-time warning
 * so the caller never fails.
 */

import { nanoid } from 'nanoid';
import { db } from './db';

let tableMissingWarned = false;

function safeInsert(row: Record<string, unknown>): void {
  try {
    db.prepare(`
      INSERT INTO agent_run_gate_events
        (id, session_id, ticker, runtime_mode, gate_kind, qa_round,
         would_have_blocked, decision_taken, reason, detail_json,
         score_numeric, created_at)
      VALUES
        (@id, @session_id, @ticker, @runtime_mode, @gate_kind, @qa_round,
         @would_have_blocked, @decision_taken, @reason, @detail_json,
         @score_numeric, @created_at)
    `).run(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such table')) {
      if (!tableMissingWarned) {
        console.warn('[gate-observer] agent_run_gate_events table missing — apply backend/src/migrations/phase3a_gate_events.sql to enable observe-only logging. Continuing without logging.');
        tableMissingWarned = true;
      }
      return;
    }
    console.warn(`[gate-observer] failed to persist gate event: ${msg}`);
  }
}

export type QaGateObservation = {
  sessionId: string;
  ticker: string | null;
  runtimeMode: string | null;
  qaRound: number;
  keywordBlock: boolean;
  scoreBlock: boolean;
  wouldHaveBlocked: boolean;            // keywordBlock || scoreBlock
  decisionTaken: 'continued' | 'revised' | 'delivered_with_warning' | 'passed' | 'blocked';
  reason: string;
  scoreNumeric: number | null;
  detail?: unknown;
};

export function recordQaGateObservation(obs: QaGateObservation): void {
  safeInsert({
    id: nanoid(),
    session_id: obs.sessionId,
    ticker: obs.ticker,
    runtime_mode: obs.runtimeMode,
    gate_kind: 'qa',
    qa_round: obs.qaRound,
    would_have_blocked: obs.wouldHaveBlocked ? 1 : 0,
    decision_taken: obs.decisionTaken,
    reason: obs.reason.slice(0, 400),
    detail_json: obs.detail ? JSON.stringify({
      keywordBlock: obs.keywordBlock,
      scoreBlock: obs.scoreBlock,
      ...((obs.detail && typeof obs.detail === 'object') ? obs.detail as object : { raw: obs.detail }),
    }).slice(0, 8000) : null,
    score_numeric: obs.scoreNumeric,
    created_at: new Date().toISOString(),
  });
}

export type CeoGateObservation = {
  sessionId: string;
  ticker: string | null;
  runtimeMode: string | null;
  wouldHaveBlocked: boolean;
  decisionTaken: 'continued_with_warning' | 'passed';
  approvalFailureCount: number;
  approvalFailureReasons: string[];
};

export function recordCeoGateObservation(obs: CeoGateObservation): void {
  safeInsert({
    id: nanoid(),
    session_id: obs.sessionId,
    ticker: obs.ticker,
    runtime_mode: obs.runtimeMode,
    gate_kind: 'ceo_approval',
    qa_round: null,
    would_have_blocked: obs.wouldHaveBlocked ? 1 : 0,
    decision_taken: obs.decisionTaken,
    reason: obs.approvalFailureReasons.slice(0, 3).join(' | ').slice(0, 400),
    detail_json: JSON.stringify({
      approval_failure_count: obs.approvalFailureCount,
      approval_failure_reasons: obs.approvalFailureReasons,
    }).slice(0, 8000),
    score_numeric: null,
    created_at: new Date().toISOString(),
  });
}

export type SchemaShadowObservation = {
  sessionId: string;
  ticker: string | null;
  runtimeMode: string | null;
  agentId: string;
  violationCount: number;
  violations: Array<{ rule: string; path?: string; detail?: string }>;
};

export function recordSchemaShadowObservation(obs: SchemaShadowObservation): void {
  safeInsert({
    id: nanoid(),
    session_id: obs.sessionId,
    ticker: obs.ticker,
    runtime_mode: obs.runtimeMode,
    gate_kind: 'schema_shadow',
    qa_round: null,
    would_have_blocked: obs.violationCount > 0 ? 1 : 0,
    decision_taken: 'passed',
    reason: `${obs.agentId}: ${obs.violationCount} violations`.slice(0, 400),
    detail_json: JSON.stringify({
      agent_id: obs.agentId,
      violation_count: obs.violationCount,
      violations: obs.violations.slice(0, 20),
    }).slice(0, 8000),
    score_numeric: null,
    created_at: new Date().toISOString(),
  });

  // Also upsert aggregate counts on the agent_runs row for quick reporting.
  try {
    db.prepare(`
      UPDATE agent_runs
         SET schema_shadow_violation_count = ?,
             schema_shadow_violations_json = ?
       WHERE session_id = ? AND agent_id = ?
    `).run(
      obs.violationCount,
      JSON.stringify(obs.violations.slice(0, 20)).slice(0, 8000),
      obs.sessionId,
      obs.agentId,
    );
  } catch {
    /* column missing => phase3a migration not applied, ignore silently */
  }
}

/**
 * Upsert the "last round QA would have blocked" flag on the agent_runs row
 * for qa_review. Lets the dashboard filter "sessions that QA-wanted-to-block".
 */
export function markQaWouldBlockLast(sessionId: string, wouldBlock: boolean): void {
  try {
    db.prepare(`UPDATE agent_runs SET qa_would_block_last = ? WHERE session_id = ? AND agent_id = 'qa_review'`)
      .run(wouldBlock ? 1 : 0, sessionId);
  } catch {
    /* pre-migration silent no-op */
  }
}
