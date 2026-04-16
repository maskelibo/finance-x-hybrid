/**
 * Python-path implementation of technical_analysis.
 * Flag: PYTHON_TECHNICAL_ANALYSIS_ENABLED.
 */

import { nanoid } from 'nanoid';

import { PYTHON_TECHNICAL_BARS } from '../../config.js';
import { db } from '../../db.js';
import { runTechnicalFetch } from '../runners.js';
import {
  adaptPythonTechnicalForLegacy,
  type PythonTechnicalIndicators,
} from '../adapters/technical_analysis.js';


export type RunOutcome = 'ok' | 'failed';


export async function runPythonTechnicalAnalysis(
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

  try {
    const res = await runTechnicalFetch(
      ticker,
      { bars: PYTHON_TECHNICAL_BARS, output: 'indicators' },
      { timeoutMs: 120_000 },
    );

    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python runner failed', runId);
      console.warn(`[PYTHON:technical_analysis] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonTechnicalForLegacy(
      (res.data ?? {}) as PythonTechnicalIndicators,
      ticker,
      `ta-out-${nanoid()}`,
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
      `python:financex technical fetch ${ticker} --bars ${PYTHON_TECHNICAL_BARS}`,
      runId,
    );

    accumulatedContext['technical_analysis_output'] = outputJson;
    console.log(
      `[PYTHON:technical_analysis] ok — trend=${legacy.trend ?? 'n/a'} rsi=${legacy.momentum.rsi_14 ?? 'n/a'}`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:technical_analysis] exception:`, err);
    return 'failed';
  }
}
