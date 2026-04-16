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
      // KAP live fetch failed — try to fall back to a cached successful
      // kap_watch output from the last 24h for the same ticker. KAP's
      // 500s are often transient; a ≤24h old disclosure list still
      // captures all material events we'd need for a same-day report.
      const cached = db.prepare(
        `SELECT ar.output_text FROM agent_runs ar
         JOIN analysis_sessions s ON s.id = ar.session_id
         WHERE s.ticker = ? AND ar.agent_id = 'kap_watch' AND ar.status = 'completed'
           AND ar.output_text IS NOT NULL
           AND ar.completed_at > datetime('now', '-24 hours')
         ORDER BY ar.completed_at DESC LIMIT 1`,
      ).get(ticker.toUpperCase()) as { output_text: string } | undefined;

      if (cached?.output_text) {
        const completedAt = new Date().toISOString();
        db.prepare(
          `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
           output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = ?,
           provider_used = 'python-cache' WHERE id = ?`,
        ).run(
          completedAt,
          Date.now() - startedAtMs,
          cached.output_text,
          `python:kap_watch FALLBACK — KAP 500, using <24h cached disclosure list for ${ticker}`,
          'Canlı KAP erişimi başarısız; son 24 saatteki cache kullanıldı',
          runId,
        );
        accumulatedContext['kap_watch_output'] = cached.output_text;
        console.warn(`[PYTHON:kap_watch] ⚠ KAP live fetch failed — using 24h cache for ${ticker}`);
        return 'ok';
      }

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
