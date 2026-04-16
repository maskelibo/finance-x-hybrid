/**
 * Python-path implementation of data_collection.
 * Flag: PYTHON_DATA_COLLECTION_ENABLED.
 *
 * Defaults: 6 calendar years of disclosures, financial_report +
 * activity_report kinds, PDFs land in ../output/pdfs/ (repo-relative).
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runDataCollect } from '../runners.js';
import {
  adaptPythonDataCollectionForLegacy,
  type PythonDataCollectionManifest,
} from '../adapters/data_collection.js';


export type RunOutcome = 'ok' | 'failed';


export async function runPythonDataCollection(
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

  const years = parseInt(process.env.PYTHON_DATA_COLLECTION_YEARS || '6', 10);
  const kinds = process.env.PYTHON_DATA_COLLECTION_KINDS || 'financial_report,activity_report';
  const pdfDir = process.env.PYTHON_DATA_COLLECTION_PDF_DIR;

  try {
    const res = await runDataCollect(
      ticker,
      {
        years,
        kinds,
        ...(pdfDir ? { pdfDir } : {}),
      },
      { timeoutMs: 600_000 },  // 10 min for PDF downloads
    );

    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python data_collection failed', runId);
      console.warn(`[PYTHON:data_collection] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonDataCollectionForLegacy(
      (res.data ?? {}) as PythonDataCollectionManifest,
      `dc-out-${nanoid()}`,
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
      `python:financex data collect ${ticker} --years ${years} --kinds ${kinds}`,
      runId,
    );

    accumulatedContext['data_collection_output'] = outputJson;
    console.log(
      `[PYTHON:data_collection] ok — ${legacy.document_count} documents (FR=${legacy.data_manifest.financial_reports.length}, FR=${legacy.data_manifest.activity_reports.length})`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:data_collection] exception:`, err);
    return 'failed';
  }
}
