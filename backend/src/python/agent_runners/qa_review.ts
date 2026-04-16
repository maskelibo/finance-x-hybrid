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

  const faRaw = accumulatedContext['financial_analysis_output'];
  const fa = extractFinancialAnalysis(faRaw);
  const rec = extractReconciliation(accumulatedContext['reconciliation_output']);

  const llmMarkdownSource = typeof faRaw === 'string' ? faRaw : null;
  const legacy = adaptQaReviewForLegacy(fa, rec, ticker, `qa-out-${nanoid()}`, { llmMarkdownSource });
  const outputJson = JSON.stringify(legacy, null, 2);

  // Soft-fail on upstream gap. The legacy output still encodes the
  // qa_decision ('fail' on null fa) so governance can pick up the
  // signal deterministically — we don't need to also mark the
  // agent_run itself failed.
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:qa_review rubric score (fa=${fa ? 'ok' : 'missing'}, rec=${rec ? 'ok' : 'missing'})`,
    runId,
  );

  accumulatedContext['qa_review_output'] = outputJson;
  console.log(
    `[PYTHON:qa_review] ok decision=${legacy.qa_decision} overall=${legacy.overall_score} flags=${legacy.quality_flags.length}`,
  );
  return 'ok';
}
