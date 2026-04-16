/**
 * Python-path implementation of macro_analysis.
 * Flag: PYTHON_MACRO_ANALYSIS_ENABLED.
 *
 * Live TCMB FX snapshot only — policy rate / CPI stay None unless
 * supplied via env (PYTHON_MACRO_POLICY_RATE, _CPI, _PPI, _GDP).
 * LLM macro_analysis adds geopolitics later (flag should stay off
 * until context_extraction migration lands with the faaliyet
 * raporu management-macro-assessment text).
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runMacroSnapshot } from '../runners.js';
import {
  adaptPythonMacroForLegacy,
  type PythonMacroSnapshot,
} from '../adapters/macro_analysis.js';


export type RunOutcome = 'ok' | 'failed';


export async function runPythonMacroAnalysis(
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
    const res = await runMacroSnapshot(undefined, { timeoutMs: 60_000 });
    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python macro failed', runId);
      console.warn(`[PYTHON:macro_analysis] failed — ${res.error}`);
      return 'failed';
    }

    // Overlay env-supplied policy figures when TCMB EVDS key isn't wired.
    const snap: PythonMacroSnapshot = {
      ...(res.data as PythonMacroSnapshot ?? {}),
      tcmb_policy_rate: process.env.PYTHON_MACRO_POLICY_RATE ?? (res.data as PythonMacroSnapshot)?.tcmb_policy_rate ?? null,
      cpi_yoy: process.env.PYTHON_MACRO_CPI ?? (res.data as PythonMacroSnapshot)?.cpi_yoy ?? null,
      ppi_yoy: process.env.PYTHON_MACRO_PPI ?? (res.data as PythonMacroSnapshot)?.ppi_yoy ?? null,
      gdp_yoy: process.env.PYTHON_MACRO_GDP ?? (res.data as PythonMacroSnapshot)?.gdp_yoy ?? null,
    };

    const legacy = adaptPythonMacroForLegacy(snap, ticker, `macro-out-${nanoid()}`);
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
      `python:financex macro snapshot`,
      runId,
    );

    accumulatedContext['macro_analysis_output'] = outputJson;
    console.log(
      `[PYTHON:macro_analysis] ok — USD/TRY=${legacy.fx.usd_try ?? 'n/a'}, EUR/TRY=${legacy.fx.eur_try ?? 'n/a'}, rate=${legacy.rates.policy_rate ?? 'n/a'}`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:macro_analysis] exception:`, err);
    return 'failed';
  }
}
