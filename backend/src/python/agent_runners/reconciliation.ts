/**
 * Python-path implementation of reconciliation.
 * Flag: PYTHON_RECONCILIATION_ENABLED.
 *
 * Runs `financex reconcile pdf <most-recent-financial-report>` and
 * adapts the 7–8 math-check report into the legacy shape.
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runReconcile } from '../runners.js';
import {
  adaptPythonReconciliationForLegacy,
  type PythonReconciliationReport,
} from '../adapters/reconciliation.js';
import { extractPdfPathsFromManifest } from '../adapters/parse_standardization.js';


export type RunOutcome = 'ok' | 'failed';


function pickLatestFinancialReportPath(upstream: unknown): string | null {
  // Prefer the PDF carrying the most recent date in its filename.
  const paths = extractPdfPathsFromManifest(upstream);
  if (paths.length === 0) return null;
  const financial = paths.filter(p => p.includes('financial_report'));
  const list = financial.length > 0 ? financial : paths;
  // Filenames conventionally end in _YYYYMMDD_<idx>.pdf — sort lexicographically, last wins.
  list.sort();
  return list[list.length - 1] ?? null;
}


export async function runPythonReconciliation(
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

  const upstream = accumulatedContext['data_collection_output'] ??
                   accumulatedContext['parse_standardization_output'];
  const pdfPath = pickLatestFinancialReportPath(upstream);

  if (!pdfPath) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      Date.now() - startedAtMs,
      'reconciliation: no financial_report PDF path found in upstream output',
      runId,
    );
    console.warn('[PYTHON:reconciliation] no PDF path in upstream');
    return 'failed';
  }

  try {
    const res = await runReconcile(pdfPath, ticker, { timeoutMs: 180_000 });

    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python reconcile failed', runId);
      console.warn(`[PYTHON:reconciliation] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonReconciliationForLegacy(
      (res.data ?? {}) as PythonReconciliationReport,
      ticker,
      `rec-out-${nanoid()}`,
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
      `python:financex reconcile pdf ${pdfPath} --ticker ${ticker}`,
      runId,
    );

    accumulatedContext['reconciliation_output'] = outputJson;
    console.log(
      `[PYTHON:reconciliation] ok — ${legacy.passed_count}/${legacy.check_count} real pass, ${legacy.skipped_count} skipped, ${legacy.failed_count} failed (${legacy.overall_decision})`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:reconciliation] exception:`, err);
    return 'failed';
  }
}
