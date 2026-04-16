/**
 * Python-path implementation of data_collection.
 * Flag: PYTHON_DATA_COLLECTION_ENABLED.
 *
 * Defaults: 6 calendar years of disclosures, financial_report +
 * activity_report kinds, PDFs land in ../output/pdfs/ (repo-relative).
 */

import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runDataCollect } from '../runners.js';
import {
  adaptPythonDataCollectionForLegacy,
  type PythonDataCollectionManifest,
} from '../adapters/data_collection.js';


/** Write the kap_watch output to a temp file so data_collection can
 *  reuse it via `--prefetched` and skip the byCriteria call. Returns
 *  the tmp path, or null if upstream kap_watch is missing/unparseable. */
function materialisePrefetched(accumulatedContext: Record<string, unknown>): string | null {
  const raw = accumulatedContext['kap_watch_output'];
  if (raw == null) return null;
  let text: string;
  if (typeof raw === 'string') {
    text = raw;
    // Validate it parses before committing a tempfile.
    try { JSON.parse(text); } catch { return null; }
  } else if (typeof raw === 'object') {
    text = JSON.stringify(raw);
  } else {
    return null;
  }
  const tmpPath = path.join(tmpdir(), `finance-x-kapwatch-${nanoid()}.json`);
  writeFileSync(tmpPath, text, 'utf-8');
  return tmpPath;
}


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

  // Reuse kap_watch's disclosure list if it's already in upstream —
  // skips a duplicate KAP byCriteria POST that trips the rate-limit.
  const prefetchedFile = materialisePrefetched(accumulatedContext);
  if (prefetchedFile) {
    console.log(`[PYTHON:data_collection] reusing kap_watch list (prefetched=${prefetchedFile})`);
  }

  try {
    const res = await runDataCollect(
      ticker,
      {
        years,
        kinds,
        ...(pdfDir ? { pdfDir } : {}),
        ...(prefetchedFile ? { prefetchedFile } : {}),
      },
      { timeoutMs: 600_000 },  // 10 min for PDF downloads
    );

    if (!res.success) {
      if (prefetchedFile) try { unlinkSync(prefetchedFile); } catch { /* ignore */ }

      // KAP live fetch failed — fall back to last successful
      // data_collection output (<24h) for this ticker if we have
      // the PDFs on disk. PDFs are content-hashed; reusing them is
      // safe as long as no new financial filings landed between runs.
      const cached = db.prepare(
        `SELECT ar.output_text FROM agent_runs ar
         JOIN analysis_sessions s ON s.id = ar.session_id
         WHERE s.ticker = ? AND ar.agent_id = 'data_collection' AND ar.status = 'completed'
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
          `python:data_collection FALLBACK — KAP 500, <24h cached manifest for ${ticker}`,
          'Canlı KAP erişimi başarısız; son 24 saatteki manifest cache kullanıldı',
          runId,
        );
        accumulatedContext['data_collection_output'] = cached.output_text;
        console.warn(`[PYTHON:data_collection] ⚠ KAP live fetch failed — using 24h cached manifest for ${ticker}`);
        return 'ok';
      }

      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python data_collection failed', runId);
      console.warn(`[PYTHON:data_collection] failed — ${res.error}`);
      return 'failed';
    }

    if (prefetchedFile) try { unlinkSync(prefetchedFile); } catch { /* ignore */ }

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
