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

  // Soft-fail on upstream gap — adapter still emits a valid empty
  // bucket (convergence_score=0, confidence='low', warnings flag the
  // data gap). Let downstream LLMs pick it up.
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:strategic_synthesis — fa=${fa ? 'ok' : 'null'} signals=${legacy.signals.positive.length}p/${legacy.signals.negative.length}n/${legacy.signals.neutral.length}=, score=${legacy.convergence_score}`,
    runId,
  );

  accumulatedContext['strategic_synthesis_output'] = outputJson;
  console.log(
    `[PYTHON:strategic_synthesis] ok fa=${fa ? 'ok' : 'null'} score=${legacy.convergence_score} confidence=${legacy.confidence} divergences=${legacy.divergences.length}`,
  );
  return 'ok';
}
