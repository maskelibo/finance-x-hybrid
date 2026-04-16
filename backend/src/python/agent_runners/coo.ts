import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptCooForLegacy,
  runDeliveryCheck,
  runPreflight,
} from '../adapters/coo.js';
import { guessSectorFromTicker } from '../adapters/llm_fallback.js';

export type RunOutcome = 'ok' | 'failed';


export async function runPythonCoo(
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

  const isDelivery = Boolean(accumulatedContext['delivery_check_mode']);
  const outputId = `coo-out-${nanoid()}`;

  let legacy;
  let summary: string;

  if (isDelivery) {
    const html = String(accumulatedContext['report_formatter_html'] || '');
    if (html.length === 0) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, 'coo delivery: no report_formatter_html in context', runId);
      console.warn('[PYTHON:coo] delivery mode but no HTML in context');
      return 'failed';
    }
    const report = runDeliveryCheck(ticker, html);
    legacy = adaptCooForLegacy(report, 'delivery', outputId);
    summary = `python:coo delivery (${report.decision}, ${report.items.length} checks, ${html.length}B)`;
  } else {
    const sector = guessSectorFromTicker(ticker);
    const report = runPreflight(ticker, sector);
    legacy = adaptCooForLegacy(report, 'preflight', outputId);
    summary = `python:coo preflight (${sector}, ${report.decision}, ${report.items.length} rules)`;
  }

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
    summary,
    runId,
  );

  accumulatedContext['coo_output'] = outputJson;
  console.log(
    `[PYTHON:coo] ${isDelivery ? 'delivery' : 'preflight'} — decision=${legacy.decision} (${legacy.checks.length} checks)`,
  );
  return 'ok';
}
