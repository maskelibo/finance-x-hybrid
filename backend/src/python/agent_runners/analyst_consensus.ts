import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptAnalystConsensusForLegacy,
  extractReports,
} from '../adapters/analyst_consensus.js';

export type RunOutcome = 'ok' | 'failed';


function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


export async function runPythonAnalystConsensus(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  db.prepare(
    `UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL, provider_used = 'python' WHERE id = ?`,
  ).run(startedAt, runId);

  const reports = extractReports(accumulatedContext['analyst_consensus_reports']);
  const lastClose = parseNumber(accumulatedContext['last_close_trym']);

  const legacy = adaptAnalystConsensusForLegacy(reports, ticker, `ac-out-${nanoid()}`, { lastClose });
  const outputJson = JSON.stringify(legacy, null, 2);

  const completedAt = new Date().toISOString();
  // Even zero-report output is a valid "no consensus data" result —
  // mark completed so downstream agents can still proceed; they will
  // see count=0 + the warning and can either skip or run web research.
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:analyst_consensus — reports=${reports.length}, buy/hold/sell=${legacy.distribution_buy}/${legacy.distribution_hold}/${legacy.distribution_sell}`,
    runId,
  );

  accumulatedContext['analyst_consensus_agent_output'] = outputJson;
  console.log(
    `[PYTHON:analyst_consensus] reports=${reports.length} mean=${legacy.target_price_mean} upside=${legacy.upside_vs_last_close_pct} trend=${legacy.revision_trend}`,
  );
  return 'ok';
}
