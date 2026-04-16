import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptStrategicSynthesisForLegacy,
  extractEventImpact,
  extractFinancialAnalysis,
  extractMacro,
  extractSectorCompetition,
  extractTechnical,
} from '../adapters/strategic_synthesis.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonStrategicSynthesis(
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

  const fa = extractFinancialAnalysis(accumulatedContext['financial_analysis_output']);
  const sc = extractSectorCompetition(accumulatedContext['sector_competition_output']);
  const ta = extractTechnical(accumulatedContext['technical_analysis_output']);
  const ma = extractMacro(accumulatedContext['macro_analysis_output']);
  const ev = extractEventImpact(accumulatedContext['event_impact_mapper_output']);

  const legacy = adaptStrategicSynthesisForLegacy(
    { financialAnalysis: fa, sectorCompetition: sc, technical: ta, macro: ma, eventImpact: ev },
    ticker,
    `ss-out-${nanoid()}`,
  );
  const outputJson = JSON.stringify(legacy, null, 2);

  const status = fa ? 'completed' : 'failed';
  const errorMsg = fa ? null : 'strategic_synthesis: missing financial_analysis_output in upstream';

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
    `python:strategic_synthesis — signals=${legacy.signals.positive.length}p/${legacy.signals.negative.length}n/${legacy.signals.neutral.length}=, score=${legacy.convergence_score}`,
    errorMsg,
    runId,
  );

  accumulatedContext['strategic_synthesis_output'] = outputJson;
  console.log(
    `[PYTHON:strategic_synthesis] score=${legacy.convergence_score} confidence=${legacy.confidence} divergences=${legacy.divergences.length}`,
  );
  return status === 'completed' ? 'ok' : 'failed';
}
