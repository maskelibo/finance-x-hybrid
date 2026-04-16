import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptClassifiedToImpacts,
  extractClassifiedEventsFromUpstream,
} from '../adapters/event_impact_mapper.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonEventImpactMapper(
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

  const upstream = accumulatedContext['event_classification_output'];
  const classified = extractClassifiedEventsFromUpstream(upstream);

  if (classified.length === 0) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, 'event_impact_mapper: no upstream classified events', runId);
    console.warn('[PYTHON:event_impact_mapper] empty upstream');
    return 'failed';
  }

  const legacy = adaptClassifiedToImpacts(
    classified,
    ticker,
    `eim-out-${nanoid()}`,
    sessionId,
    null,
  );
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
    `python:template-route classified events into impact mapping (${classified.length} events)`,
    runId,
  );

  accumulatedContext['event_impact_mapper_output'] = outputJson;
  console.log(
    `[PYTHON:event_impact_mapper] ok — ${legacy.event_impacts.length} events (direct=${legacy.events_requiring_full_mapping}, routine=${legacy.routine_filings_noted})`,
  );
  return 'ok';
}
