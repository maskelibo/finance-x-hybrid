import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptEsgForLegacy,
  extractCbamInputs,
} from '../adapters/esg.js';

export type RunOutcome = 'ok' | 'failed';


function readSector(accumulatedContext: Record<string, unknown>): string | null {
  const fa = accumulatedContext['financial_analysis_output'];
  if (!fa) return null;
  try {
    const parsed = typeof fa === 'string' ? JSON.parse(fa) : fa;
    return parsed?.sector ?? null;
  } catch {
    return null;
  }
}


export async function runPythonEsg(
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

  const cbamInputs = extractCbamInputs(accumulatedContext['esg_cbam_inputs']);
  const sectorHint = readSector(accumulatedContext);

  const legacy = adaptEsgForLegacy(cbamInputs, ticker, `esg-out-${nanoid()}`, {
    sectorHint,
    externalRatingsSupplied: Boolean(accumulatedContext['esg_external_ratings']),
  });
  const outputJson = JSON.stringify(legacy, null, 2);

  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:esg — cbam=${legacy.cbam ? 'computed' : 'skipped'} sector=${legacy.sector_hint}`,
    runId,
  );

  accumulatedContext['esg_agent_output'] = outputJson;
  console.log(
    `[PYTHON:esg_agent] cbam=${legacy.cbam ? `${legacy.cbam.total_annual_cost_eur}€` : 'n/a'} warnings=${legacy.warnings.length}`,
  );
  return 'ok';
}
