/**
 * Python-path implementation of financial_analysis.
 * Flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED.
 *
 * Runs `financex analyze pdf <path> --ticker <T>` on the latest
 * financial-report PDF. Market cap / shares can optionally be
 * supplied via env (PYTHON_FA_MARKET_CAP, PYTHON_FA_SHARES) — the
 * downstream LLM valuation agent is usually the better source for
 * these anyway.
 */

import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { runAnalyzePdf } from '../runners.js';
import {
  adaptPythonFinancialAnalysisForLegacy,
  type PythonFinancialAnalysisOutput,
} from '../adapters/financial_analysis.js';
import { extractPdfPathsFromManifest } from '../adapters/parse_standardization.js';


export type RunOutcome = 'ok' | 'failed';


function latestFinancialReportPath(upstream: unknown): string | null {
  const paths = extractPdfPathsFromManifest(upstream);
  if (paths.length === 0) return null;
  const financial = paths.filter(p => p.includes('financial_report'));
  const list = financial.length > 0 ? financial : paths;
  list.sort();
  return list[list.length - 1] ?? null;
}


/**
 * P1.gamma — resolve fa_filing_hint to a local PDF path by walking the
 * upstream data_collection manifest. Only matches inside
 * `data_manifest.financial_reports[]` to avoid landing on
 * faaliyet_raporu / ozel_durum filings the FA engine cannot parse.
 *
 * Returns null when:
 *   - hint is empty / not a string
 *   - manifest cannot be parsed
 *   - no financial_reports entry has disclosure_id === hint
 */
export function resolvePdfByFilingHint(upstream: unknown, filingHint: string): string | null {
  const hint = String(filingHint ?? '').trim();
  if (!hint) return null;

  let parsed: unknown = upstream;
  if (typeof upstream === 'string') {
    try { parsed = JSON.parse(upstream); } catch { return null; }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const manifest = (parsed as Record<string, unknown>)['data_manifest'];
  if (!manifest || typeof manifest !== 'object') return null;
  const financialReports = (manifest as Record<string, unknown>)['financial_reports'];
  if (!Array.isArray(financialReports)) return null;

  for (const raw of financialReports) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const did = String(rec['disclosure_id'] ?? '').trim();
    if (did !== hint) continue;
    const local = rec['local_path'];
    if (typeof local === 'string' && local.toLowerCase().endsWith('.pdf')) {
      return local;
    }
  }
  return null;
}


export async function runPythonFinancialAnalysis(
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

  // P1.gamma — fa_filing_hint authoritative when it resolves to a PDF inside
  // data_manifest.financial_reports[]. Otherwise fall back to the legacy
  // latest-financial-report selection (P1.beta semantics preserved exactly).
  const filingHintRaw = accumulatedContext['fa_filing_hint'];
  const filingHint = typeof filingHintRaw === 'string' ? filingHintRaw : null;
  const hintedPath = filingHint ? resolvePdfByFilingHint(upstream, filingHint) : null;
  const pdfPath = hintedPath ?? latestFinancialReportPath(upstream);
  const pdfSource: 'hint' | 'fallback' = hintedPath ? 'hint' : 'fallback';

  if (!pdfPath) {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      Date.now() - startedAtMs,
      'financial_analysis: no financial_report PDF path found in upstream output',
      runId,
    );
    console.warn('[PYTHON:financial_analysis] no PDF path');
    return 'failed';
  }

  if (filingHint && pdfSource === 'fallback') {
    console.log(
      `[PYTHON:financial_analysis] pdf=${pdfPath} source=fallback (hint=${filingHint} unresolved in financial_reports[])`,
    );
  } else {
    console.log(`[PYTHON:financial_analysis] pdf=${pdfPath} source=${pdfSource}`);
  }

  const marketCap = process.env.PYTHON_FA_MARKET_CAP;
  const shares = process.env.PYTHON_FA_SHARES;

  try {
    const res = await runAnalyzePdf(
      pdfPath, ticker,
      { marketCap, sharesOutstanding: shares },
      { timeoutMs: 180_000 },
    );

    if (!res.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, res.error ?? 'python analyze failed', runId);
      console.warn(`[PYTHON:financial_analysis] failed — ${res.error}`);
      return 'failed';
    }

    const legacy = adaptPythonFinancialAnalysisForLegacy(
      (res.data ?? {}) as PythonFinancialAnalysisOutput,
      ticker,
      `fa-out-${nanoid()}`,
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
      `python:financex analyze pdf ${pdfPath} --ticker ${ticker}`,
      runId,
    );

    accumulatedContext['financial_analysis_output'] = outputJson;
    console.log(
      `[PYTHON:financial_analysis] ok — ${legacy.metric_count} metrics, ${legacy.red_flags.length} flags (${legacy.critical_flag_count} critical), confidence=${legacy.confidence}`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:financial_analysis] exception:`, err);
    return 'failed';
  }
}
