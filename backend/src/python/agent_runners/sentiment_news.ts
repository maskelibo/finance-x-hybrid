import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runNewsAnalyze } from '../runners.js';
import {
  adaptPythonNewsForLegacy,
  type PythonNewsAnalysisOutput,
} from '../adapters/sentiment_news.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonSentimentNews(
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

  const limit = parseInt(process.env.PYTHON_NEWS_LIMIT || '30', 10);
  const enrich = (process.env.PYTHON_NEWS_ENRICH || 'false') === 'true';

  try {
    const res = await runNewsAnalyze(ticker, { limit, enrich }, { timeoutMs: 180_000 });
    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python news failed', runId);
      console.warn(`[PYTHON:sentiment_news] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonNewsForLegacy(
      (res.data ?? {}) as PythonNewsAnalysisOutput,
      ticker,
      `news-out-${nanoid()}`,
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
      `python:financex news analyze ${ticker} --limit ${limit}${enrich ? ' --enrich' : ''}`,
      runId,
    );

    accumulatedContext['sentiment_news_agent_output'] = outputJson;
    console.log(
      `[PYTHON:sentiment_news] ok — ${legacy.news_count} items, sentiment=${JSON.stringify(legacy.sentiment_distribution)}, score=${legacy.overall_sentiment_score}`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:sentiment_news] exception:`, err);
    return 'failed';
  }
}
