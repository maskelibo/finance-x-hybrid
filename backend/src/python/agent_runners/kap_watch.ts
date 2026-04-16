/**
 * Python-path implementation of kap_watch.
 * Flag: PYTHON_KAP_WATCH_ENABLED.
 *
 * Default window: last 12 months — matches the LLM agent's default
 * monitoring horizon.
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runKapWatch } from '../runners.js';
import {
  adaptPythonKapForLegacy,
  type PythonKapEvents,
} from '../adapters/kap_watch.js';


export type RunOutcome = 'ok' | 'failed';


function oneYearAgoISO(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}


export async function runPythonKapWatch(
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

  const since = process.env.PYTHON_KAP_WATCH_SINCE || oneYearAgoISO();

  try {
    const res = await runKapWatch(ticker, { since }, { timeoutMs: 120_000 });

    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python kap_watch failed', runId);
      console.warn(`[PYTHON:kap_watch] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonKapForLegacy(
      (res.data ?? {}) as PythonKapEvents,
      ticker,
      `kap-out-${nanoid()}`,
    );
    const outputJson = JSON.stringify(legacy, null, 2);

    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
       output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
       provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      res.durationMs,
      outputJson,
      `python:financex kap watch ${ticker} --since ${since}`,
      runId,
    );

    accumulatedContext['kap_watch_output'] = outputJson;
    console.log(
      `[PYTHON:kap_watch] ok — ${legacy.disclosure_count} disclosures since ${since} (material=${legacy.material_count})`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:kap_watch] exception:`, err);
    return 'failed';
  }
}
