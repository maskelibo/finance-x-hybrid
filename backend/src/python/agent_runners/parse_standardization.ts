/**
 * Python-path implementation of parse_standardization.
 * Flag: PYTHON_PARSE_STANDARDIZATION_ENABLED.
 *
 * Reads PDF paths from the upstream data_collection output, parses
 * each one with `financex parse financials <path>`, adapts the
 * bundle into the legacy standardized_statements schema.
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runParseFinancials } from '../runners.js';
import {
  adaptParsedPeriodsForLegacy,
  extractPdfPathsFromManifest,
  type PythonPeriodFinancials,
} from '../adapters/parse_standardization.js';


export type RunOutcome = 'ok' | 'failed';


export async function runPythonParseStandardization(
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

  const upstream = accumulatedContext['data_collection_output'];
  const pdfPaths = extractPdfPathsFromManifest(upstream);

  if (pdfPaths.length === 0) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      Date.now() - startedAtMs,
      'data_collection output missing PDF paths — cannot parse',
      runId,
    );
    console.warn('[PYTHON:parse_standardization] no PDF paths in upstream output');
    return 'failed';
  }

  const parsed: Array<{ pdf: string; parsed: PythonPeriodFinancials }> = [];
  const failures: string[] = [];

  for (const pdf of pdfPaths) {
    const res = await runParseFinancials(pdf, { timeoutMs: 180_000 });
    if (res.success && res.data) {
      parsed.push({ pdf, parsed: res.data as PythonPeriodFinancials });
    } else {
      failures.push(`${pdf}: ${res.error ?? 'parse failed'}`);
    }
  }

  if (parsed.length === 0) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      Date.now() - startedAtMs,
      `All ${pdfPaths.length} PDF parse attempts failed: ${failures.join('; ')}`,
      runId,
    );
    console.warn('[PYTHON:parse_standardization] every parse attempt failed');
    return 'failed';
  }

  const legacy = adaptParsedPeriodsForLegacy(parsed, ticker, `ps-out-${nanoid()}`);
  if (failures.length) legacy.errors.push(...failures);

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
    `python:financex parse financials × ${pdfPaths.length} (${parsed.length} success, ${failures.length} fail)`,
    runId,
  );

  accumulatedContext['parse_standardization_output'] = outputJson;
  console.log(
    `[PYTHON:parse_standardization] ok — ${parsed.length}/${pdfPaths.length} PDFs parsed, ${legacy.period_count} periods, 5yr=${legacy.auto_checks.five_year_coverage}`,
  );
  return 'ok';
}
