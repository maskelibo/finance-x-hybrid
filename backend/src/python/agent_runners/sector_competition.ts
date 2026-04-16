import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptSectorCompetitionForLegacy,
  extractFinancialAnalysis,
  extractPeers,
} from '../adapters/sector_competition.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonSectorCompetition(
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
  const peers = extractPeers(accumulatedContext['sector_competition_peers']);

  const llmMarkdownSource = typeof faRaw === 'string' ? faRaw : null;
  const legacy = adaptSectorCompetitionForLegacy(
    fa, peers, ticker, `sc-out-${nanoid()}`, { llmMarkdownSource },
  );
  const outputJson = JSON.stringify(legacy, null, 2);

  const status = fa ? 'completed' : 'failed';
  const errorMsg = fa ? null : 'sector_competition: missing financial_analysis_output in upstream';

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
    `python:sector_competition (peers=${peers.length}, benchmarks=${legacy.benchmarks.length})`,
    errorMsg,
    runId,
  );

  accumulatedContext['sector_competition_output'] = outputJson;
  console.log(
    `[PYTHON:sector_competition] ${status} — peers=${peers.length}, strengths=${legacy.strengths.length}, weaknesses=${legacy.weaknesses.length}`,
  );
  return status === 'completed' ? 'ok' : 'failed';
}
