import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptValuationForLegacy,
  extractFinancialAnalysis,
  extractSectorCompetition,
} from '../adapters/valuation.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonValuation(
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

  const faRaw = accumulatedContext['financial_analysis_output'];
  const fa = extractFinancialAnalysis(faRaw);
  const sc = extractSectorCompetition(accumulatedContext['sector_competition_output']);

  // If upstream fa is LLM markdown (mixed-flag mode), let the adapter
  // sniff sector from the prose rather than silently defaulting to
  // industrial. Stringify whatever faRaw is for the sniffer.
  const llmMarkdownSource = typeof faRaw === 'string' ? faRaw : null;
  const legacy = adaptValuationForLegacy(fa, sc, ticker, `val-out-${nanoid()}`, { llmMarkdownSource });
  const outputJson = JSON.stringify(legacy, null, 2);

  const status = fa ? 'completed' : 'failed';
  const errorMsg = fa ? null : 'valuation_agent: missing financial_analysis_output in upstream';

  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = ?, completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = ?,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    status,
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:valuation — sector=${legacy.sector} dcf=${legacy.dcf ? 'present' : 'missing'} flags=${[legacy.try_wacc_warning, legacy.holding_sotp_required, legacy.banking_sector_warning].filter(Boolean).length}`,
    errorMsg,
    runId,
  );

  accumulatedContext['valuation_agent_output'] = outputJson;
  console.log(
    `[PYTHON:valuation_agent] ${status} sector=${legacy.sector} notes=${legacy.notes.length}`,
  );
  return status === 'completed' ? 'ok' : 'failed';
}
