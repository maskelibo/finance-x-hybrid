/**
 * Typed Python-runner helpers.
 *
 * Thin wrappers on top of bridge.ts that build the CLI argv list,
 * call the Python subprocess, and narrow the return type. Each helper
 * corresponds to one of the deterministic Python runners in
 * python-services/src/financex/.
 *
 * These functions are opt-in — call sites continue to use the LLM
 * agents via ClaudeProvider unless the matching PYTHON_*_ENABLED
 * feature flag is set (see config.ts).
 */

import {
  type FinancexJsonResult,
  type FinancexRunResult,
  type RunOptions,
  runFinancexCommand,
  runFinancexJson,
  runFinancexTickerPackage,
} from './bridge.js';

// ---------------------------------------------------------------------
// kap_watch — disclosure list fetch
// ---------------------------------------------------------------------

export interface KapWatchOptions {
  since: string;           // ISO date
  until?: string;
  fixtureFile?: string;    // opt-in offline mode
}

export function runKapWatch(
  ticker: string,
  opts: KapWatchOptions,
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['kap', 'watch', ticker.toUpperCase(), '--since', opts.since];
  if (opts.until) args.push('--until', opts.until);
  if (opts.fixtureFile) args.push('--fixture', opts.fixtureFile);
  return runFinancexJson(args, runOpts);
}

// ---------------------------------------------------------------------
// data collection — KAP PDFs to disk
// ---------------------------------------------------------------------

export interface DataCollectOptions {
  since?: string;
  until?: string;
  years?: number;
  pdfDir?: string;
  kinds?: string;          // 'financial_report,activity_report'
  prefetchedFile?: string; // kap_watch output JSON — skips byCriteria
}

export function runDataCollect(
  ticker: string,
  opts: DataCollectOptions = {},
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['data', 'collect', ticker.toUpperCase()];
  if (opts.years !== undefined) args.push('--years', String(opts.years));
  if (opts.since) args.push('--since', opts.since);
  if (opts.until) args.push('--until', opts.until);
  if (opts.pdfDir) args.push('--pdf-dir', opts.pdfDir);
  if (opts.kinds) args.push('--kinds', opts.kinds);
  if (opts.prefetchedFile) args.push('--prefetched', opts.prefetchedFile);
  // data_collection PDF downloads can run long on slow links; give it headroom.
  const withTimeout = { timeoutMs: 300_000, ...(runOpts ?? {}) };
  return runFinancexJson(args, withTimeout);
}

// ---------------------------------------------------------------------
// parse_standardization — PDF → PeriodFinancials
// ---------------------------------------------------------------------

export function runParseFinancials(
  pdfPath: string,
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  return runFinancexJson(['parse', 'financials', pdfPath], runOpts);
}

// ---------------------------------------------------------------------
// reconciliation — 7-8 math checks
// ---------------------------------------------------------------------

export function runReconcile(
  pdfPath: string,
  ticker: string,
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  return runFinancexJson(
    ['reconcile', 'pdf', pdfPath, '--ticker', ticker.toUpperCase()],
    runOpts,
  );
}

// ---------------------------------------------------------------------
// technical_analysis — TradingView bars → indicators
// ---------------------------------------------------------------------

export interface TechnicalFetchOptions {
  exchange?: string;
  interval?: string;
  bars?: number;
  output?: 'indicators' | 'bars';
}

export function runTechnicalFetch(
  ticker: string,
  opts: TechnicalFetchOptions = {},
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['technical', 'fetch', ticker.toUpperCase()];
  if (opts.exchange) args.push('--exchange', opts.exchange);
  if (opts.interval) args.push('--interval', opts.interval);
  if (opts.bars !== undefined) args.push('--bars', String(opts.bars));
  if (opts.output) args.push('--output', opts.output);
  return runFinancexJson(args, runOpts);
}

// ---------------------------------------------------------------------
// macro_analysis — TCMB snapshot
// ---------------------------------------------------------------------

export function runMacroSnapshot(
  asOf?: string,
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['macro', 'snapshot'];
  if (asOf) args.push('--as-of', asOf);
  return runFinancexJson(args, runOpts);
}

// ---------------------------------------------------------------------
// sentiment_news — Google News RSS
// ---------------------------------------------------------------------

export interface NewsAnalyzeOptions {
  query?: string;
  limit?: number;
  enrich?: boolean;
}

export function runNewsAnalyze(
  ticker: string,
  opts: NewsAnalyzeOptions = {},
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['news', 'analyze', ticker.toUpperCase()];
  if (opts.query) args.push('--query', opts.query);
  if (opts.limit !== undefined) args.push('--limit', String(opts.limit));
  if (opts.enrich) args.push('--enrich');
  return runFinancexJson(args, runOpts);
}

// ---------------------------------------------------------------------
// analyze — one-shot parse → engine → analysis
// ---------------------------------------------------------------------

export interface AnalyzeOptions {
  marketCap?: string;
  sharesOutstanding?: string;
}

export function runAnalyzePdf(
  pdfPath: string,
  ticker: string,
  opts: AnalyzeOptions = {},
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  const args = ['analyze', 'pdf', pdfPath, '--ticker', ticker.toUpperCase()];
  if (opts.marketCap) args.push('--market-cap', opts.marketCap);
  if (opts.sharesOutstanding) args.push('--shares', opts.sharesOutstanding);
  return runFinancexJson(args, runOpts);
}

/**
 * Phase 7 FULL — multi-PDF historical analysis.
 *
 * Caller supplies chronologically-sorted historical KAP financial-
 * report PDFs (e.g., FY2025/FY2023/FY2021 — each yields current +
 * prior-column → 6 distinct annual years total). The Python side
 * dedupes by year and rejects interim periods. Returns a
 * FinancialAnalysisOutput whose canonical_numbers.__historical__
 * embeds every distinct annual period.
 *
 * If <5 annual periods are extractable, the result still emits, but
 * the formatter's Wave 5 trend banner + Wave 2 MULTI_YEAR_COVERAGE
 * QA dimension will suppress the 5Y chart and surface "missing
 * official annual coverage" honestly.
 */
export function runAnalyzeMultiPdf(
  pdfPaths: string[],
  ticker: string,
  opts: AnalyzeOptions = {},
  runOpts?: RunOptions,
): Promise<FinancexJsonResult<unknown>> {
  if (pdfPaths.length === 0) {
    throw new Error('runAnalyzeMultiPdf: at least one PDF path required');
  }
  const args = ['analyze', 'multi-pdf', ...pdfPaths, '--ticker', ticker.toUpperCase()];
  if (opts.marketCap) args.push('--market-cap', opts.marketCap);
  if (opts.sharesOutstanding) args.push('--shares', opts.sharesOutstanding);
  return runFinancexJson(args, runOpts);
}

// ---------------------------------------------------------------------
// Re-exports — keep callers importing from one place.
// ---------------------------------------------------------------------
export {
  runFinancexCommand,
  runFinancexJson,
  runFinancexTickerPackage,
  type FinancexRunResult,
  type FinancexJsonResult,
  type RunOptions,
};
