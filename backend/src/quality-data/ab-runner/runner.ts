/**
 * P5B Wave 1 — A/B Testing Runner Harness (mocked execution only).
 *
 * `runABTest(config, runFn?)` loops `ticker_set × runs_per_ticker × {baseline,
 * candidate}` and aggregates per-cell `ABRunResult` objects produced by the
 * caller-supplied `runFn`. The DEFAULT runFn is a stub that THROWS — Wave 1
 * does NOT invoke `startAnalysisSession` or any other paid path.
 *
 * Wave 1 invariants:
 *   - No DB writes.
 *   - No LLM calls.
 *   - No live execution.
 *   - Failed runs (status='failed') are surfaced in `failed_runs[]`; metrics
 *     aggregation excludes them. The runner does not crash on per-cell
 *     failures.
 *   - Output is deterministic mod `generated_at` for any deterministic
 *     `runFn`.
 */

import {
  AB_DEFAULTS,
  AB_REASON_CODES,
  type ABArm,
  type ABPerTicker,
  type ABReport,
  type ABRunFn,
  type ABRunResult,
  type ABTestConfig,
} from './types.js';
import {
  buildSignificance,
  computeMetricDelta,
  deriveRecommendation,
  winRate,
} from './statistics.js';

// =============================================================================
// Default runFn — Wave 1 does not allow live execution
// =============================================================================

const LIVE_EXECUTION_DISABLED_MESSAGE =
  '[P5B-wave1] Live A/B execution is disabled. ' +
  'Wave 1 ships only the mocked runner harness — no startAnalysisSession ' +
  'invocation, no paid LLM runs. To exercise the runner, supply a runFn ' +
  'that returns synthetic/recorded ABRunResult objects. Live execution ' +
  'requires a future P5B-wave2 scope with explicit paid-run authorization ' +
  '(GOVERNANCE_AB_LIVE_RUN env flag, not yet wired).';

export const DEFAULT_LIVE_DISABLED_RUN_FN: ABRunFn = () => {
  throw new Error(LIVE_EXECUTION_DISABLED_MESSAGE);
};

// =============================================================================
// Main entry — runABTest
// =============================================================================

export async function runABTest(
  config: ABTestConfig,
  runFn: ABRunFn = DEFAULT_LIVE_DISABLED_RUN_FN,
): Promise<ABReport> {
  validateConfig(config);
  const alpha = typeof config.significance_alpha === 'number' && Number.isFinite(config.significance_alpha)
    ? config.significance_alpha
    : AB_DEFAULTS.significance_alpha;

  const allResults: ABRunResult[] = [];
  const failedRuns: ABRunResult[] = [];
  const warnings: string[] = [];

  // -------------------------------------------------------------------------
  // Loop the matrix: ticker × iteration × {baseline, candidate}
  // Order is deterministic: tickers in input order, iterations 0..N-1,
  // baseline before candidate per cell.
  // -------------------------------------------------------------------------
  for (const ticker of config.ticker_set) {
    for (let iteration = 0; iteration < config.runs_per_ticker; iteration++) {
      for (const arm of ['baseline', 'candidate'] as ABArm[]) {
        try {
          const result = await runFn({ ticker, arm, iteration, config });
          // Defensive: copy the caller's result with normalized fields.
          allResults.push(normalizeResult(result, { ticker, arm, iteration }));
        } catch (err) {
          // Caller's runFn threw — record a failed run with the error message.
          failedRuns.push({
            ticker,
            arm,
            iteration,
            session_id: '',
            duration_ms: 0,
            cost_usd: 0,
            quality_score: 0,
            coverage_score: 0,
            status: 'failed',
            error_message: err instanceof Error ? err.message : String(err),
            completed_at: new Date(0).toISOString(),
          });
          warnings.push(`runFn threw at ticker=${ticker} arm=${arm} iter=${iteration}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  // Failed runs that came back with status='failed' (not via thrown errors).
  for (const r of allResults.filter((r) => r.status === 'failed')) {
    failedRuns.push(r);
  }

  const completed = allResults.filter((r) => r.status === 'completed');
  const baselineResults = completed.filter((r) => r.arm === 'baseline');
  const candidateResults = completed.filter((r) => r.arm === 'candidate');

  const metrics = {
    duration_ms: computeMetricDelta(
      baselineResults.map((r) => r.duration_ms),
      candidateResults.map((r) => r.duration_ms),
    ),
    cost_usd: computeMetricDelta(
      baselineResults.map((r) => r.cost_usd),
      candidateResults.map((r) => r.cost_usd),
    ),
    quality_score: computeMetricDelta(
      baselineResults.map((r) => r.quality_score),
      candidateResults.map((r) => r.quality_score),
    ),
    coverage_score: computeMetricDelta(
      baselineResults.map((r) => r.coverage_score),
      candidateResults.map((r) => r.coverage_score),
    ),
    quality_win_rate: pairedWinRateAcrossTickers(baselineResults, candidateResults),
  };

  const significance = buildSignificance(
    baselineResults.map((r) => r.quality_score),
    candidateResults.map((r) => r.quality_score),
    alpha,
  );

  const derivation = deriveRecommendation({
    quality: metrics.quality_score,
    cost: metrics.cost_usd,
    significance,
  });

  // Always include the overall reason code(s); guarantee ≥ 1 entry sorted-unique.
  const reasonCodes = sortedUnique(derivation.reason_codes);
  if (reasonCodes.length === 0) {
    // Defensive: should never happen because deriveRecommendation always
    // returns ≥ 1, but enforce the invariant.
    reasonCodes.push(AB_REASON_CODES.AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT);
  }

  const perTicker: ABPerTicker[] = config.ticker_set.map((ticker) => {
    const tBaseline = baselineResults.filter((r) => r.ticker === ticker);
    const tCandidate = candidateResults.filter((r) => r.ticker === ticker);
    const qd = computeMetricDelta(
      tBaseline.map((r) => r.quality_score),
      tCandidate.map((r) => r.quality_score),
    );
    const cd = computeMetricDelta(
      tBaseline.map((r) => r.cost_usd),
      tCandidate.map((r) => r.cost_usd),
    );
    return {
      ticker,
      baseline: tBaseline,
      candidate: tCandidate,
      quality_delta: qd.delta,
      cost_delta_usd: cd.delta,
    };
  });

  return {
    config,
    generated_at: new Date().toISOString(),
    sample_size: completed.length,
    metrics,
    statistical_significance: significance,
    recommendation: derivation.recommendation,
    reason_codes: reasonCodes,
    per_ticker: perTicker,
    failed_runs: failedRuns,
    warnings,
  };
}

// =============================================================================
// Helpers
// =============================================================================

function validateConfig(config: ABTestConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('runABTest: config is required');
  }
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new Error('runABTest: config.name is required');
  }
  if (!Array.isArray(config.ticker_set) || config.ticker_set.length === 0) {
    throw new Error('runABTest: config.ticker_set must be a non-empty array');
  }
  if (typeof config.runs_per_ticker !== 'number' || config.runs_per_ticker < 1) {
    throw new Error('runABTest: config.runs_per_ticker must be ≥ 1');
  }
  if (!config.baseline || !config.candidate) {
    throw new Error('runABTest: config.baseline and config.candidate are required');
  }
}

function normalizeResult(
  raw: ABRunResult,
  expected: { ticker: string; arm: ABArm; iteration: number },
): ABRunResult {
  return {
    ticker: expected.ticker,
    arm: expected.arm,
    iteration: expected.iteration,
    session_id: typeof raw.session_id === 'string' ? raw.session_id : '',
    duration_ms: clampNumber(raw.duration_ms),
    cost_usd: clampNumber(raw.cost_usd),
    quality_score: clampNumber(raw.quality_score),
    coverage_score: clampNumber(raw.coverage_score),
    status: raw.status === 'completed' ? 'completed' : 'failed',
    error_message: raw.error_message,
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : new Date(0).toISOString(),
  };
}

function clampNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function sortedUnique<T extends string>(values: ReadonlyArray<T>): T[] {
  return Array.from(new Set(values)).sort() as T[];
}

/**
 * Per-ticker pairing: pair baseline iteration_i against candidate
 * iteration_i for each ticker, then aggregate wins. Cleaner than naive
 * index-based pairing across tickers.
 */
function pairedWinRateAcrossTickers(
  baselineResults: ReadonlyArray<ABRunResult>,
  candidateResults: ReadonlyArray<ABRunResult>,
): number {
  // Group both by `${ticker}|${iteration}`.
  const baselineMap = new Map<string, number>();
  for (const r of baselineResults) {
    baselineMap.set(`${r.ticker}|${r.iteration}`, r.quality_score);
  }
  const baseline: number[] = [];
  const candidate: number[] = [];
  for (const r of candidateResults) {
    const key = `${r.ticker}|${r.iteration}`;
    const b = baselineMap.get(key);
    if (typeof b === 'number') {
      baseline.push(b);
      candidate.push(r.quality_score);
    }
  }
  return winRate(baseline, candidate);
}

// =============================================================================
// Test exports
// =============================================================================

export { LIVE_EXECUTION_DISABLED_MESSAGE };
