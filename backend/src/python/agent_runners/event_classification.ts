import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptDisclosuresToClassification,
  extractDisclosuresFromUpstream,
} from '../adapters/event_classification.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonEventClassification(
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

  const upstream = accumulatedContext['kap_watch_output'];
  const disclosures = extractDisclosuresFromUpstream(upstream);

  if (disclosures.length === 0) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, 'event_classification: no upstream disclosures', runId);
    console.warn('[PYTHON:event_classification] empty upstream');
    return 'failed';
  }

  const legacy = adaptDisclosuresToClassification(disclosures, ticker, `ec-out-${nanoid()}`);
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
    `python:reshape kap_watch hints into classification (${disclosures.length} disclosures)`,
    runId,
  );

  accumulatedContext['event_classification_output'] = outputJson;
  console.log(
    `[PYTHON:event_classification] ok — ${legacy.classified_events.length} events (high=${legacy.high_confidence_count}, medium=${legacy.medium_confidence_count}, low=${legacy.low_confidence_count})`,
  );
  return 'ok';
}
