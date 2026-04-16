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

  // Soft-fail: fa=null still yields a valid output (sector resolver
  // falls back to ticker, warnings flag the data gap). Downstream
  // strategic_synthesis + LLM layers can still use it.
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:valuation — fa=${fa ? 'ok' : 'null'} sector=${legacy.sector} dcf=${legacy.dcf ? 'present' : 'missing'} flags=${[legacy.try_wacc_warning, legacy.holding_sotp_required, legacy.banking_sector_warning].filter(Boolean).length}`,
    runId,
  );

  accumulatedContext['valuation_agent_output'] = outputJson;
  console.log(
    `[PYTHON:valuation_agent] ok fa=${fa ? 'ok' : 'null'} sector=${legacy.sector} warnings=${legacy.warnings.length}`,
  );
  return 'ok';
}
