import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptQaReviewForLegacy,
  extractFinancialAnalysis,
  extractReconciliation,
} from '../adapters/qa_review.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonQaReview(
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
  const rec = extractReconciliation(accumulatedContext['reconciliation_output']);

  const legacy = adaptQaReviewForLegacy(fa, rec, ticker, `qa-out-${nanoid()}`);
  const outputJson = JSON.stringify(legacy, null, 2);

  const completedAt = new Date().toISOString();
  const status = fa ? 'completed' : 'failed';
  const errorMsg = fa ? null : 'qa_review: missing financial_analysis_output in upstream';

  db.prepare(
    `UPDATE agent_runs SET status = ?, completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = ?,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    status,
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:qa_review rubric score (fa=${fa ? 'ok' : 'missing'}, rec=${rec ? 'ok' : 'missing'})`,
    errorMsg,
    runId,
  );

  accumulatedContext['qa_review_output'] = outputJson;
  console.log(
    `[PYTHON:qa_review] decision=${legacy.qa_decision} overall=${legacy.overall_score} flags=${legacy.quality_flags.length}`,
  );
  return status === 'completed' ? 'ok' : 'failed';
}
