/**
 * P5B Wave 1 — A/B Testing Runner tests (mocked execution only).
 *
 * Exercises:
 *   - Statistics math: mean, stddev, t-test, p-value (against known reference values).
 *   - Recommendation derivation: one positive test per AB_* code (7 codes).
 *   - Runner harness: matrix size, mock injection, failed runs, deterministic output.
 *   - Default runFn throws and does not invoke any live execution.
 *   - Sample-size invariant + reason-code sorted-uniqueness.
 *
 * No DB writes. No LLM calls. No live execution. All ABRunResult objects
 * are constructed in-memory; any failures inside runFn surface in
 * `failed_runs` without crashing aggregation.
 */
import { describe, expect, it } from 'vitest';
import {
  AB_DEFAULTS,
  AB_REASON_CODES,
  type ABMetricDelta,
  type ABRunFn,
  type ABRunResult,
  type ABStatisticalSignificance,
  type ABTestConfig,
} from './types.js';
import {
  computeMetricDelta,
  buildSignificance,
  deriveRecommendation,
  mean,
  stddev,
  welchTTest,
  winRate,
  pValueTwoTailedFromT,
  regularizedIncompleteBeta,
} from './statistics.js';
import {
  runABTest,
  DEFAULT_LIVE_DISABLED_RUN_FN,
  LIVE_EXECUTION_DISABLED_MESSAGE,
} from './runner.js';

// =============================================================================
// Fixtures
// =============================================================================

function makeConfig(overrides: Partial<ABTestConfig> = {}): ABTestConfig {
  return {
    name: 'unit-test',
    baseline: { agent_id: 'a', version: 'v1' },
    candidate: { agent_id: 'a', version: 'v2' },
    ticker_set: ['KCHOL', 'THYAO'],
    runs_per_ticker: 5,
    ...overrides,
  };
}

function syntheticRunFn(args: {
  baselineQuality: (i: number, ticker: string) => number;
  candidateQuality: (i: number, ticker: string) => number;
  baselineCost?: (i: number, ticker: string) => number;
  candidateCost?: (i: number, ticker: string) => number;
  baselineDuration?: (i: number, ticker: string) => number;
  candidateDuration?: (i: number, ticker: string) => number;
  failArm?: (args: { ticker: string; arm: 'baseline' | 'candidate'; iteration: number }) => boolean;
}): ABRunFn {
  return async ({ ticker, arm, iteration }) => {
    if (args.failArm?.({ ticker, arm, iteration })) {
      return {
        ticker, arm, iteration,
        session_id: `sess-${ticker}-${arm}-${iteration}`,
        duration_ms: 0, cost_usd: 0, quality_score: 0, coverage_score: 0,
        status: 'failed',
        error_message: 'synthetic failure',
        completed_at: new Date(0).toISOString(),
      };
    }
    const isBaseline = arm === 'baseline';
    return {
      ticker, arm, iteration,
      session_id: `sess-${ticker}-${arm}-${iteration}`,
      duration_ms: isBaseline
        ? (args.baselineDuration ?? (() => 1000))(iteration, ticker)
        : (args.candidateDuration ?? (() => 1000))(iteration, ticker),
      cost_usd: isBaseline
        ? (args.baselineCost ?? (() => 0.5))(iteration, ticker)
        : (args.candidateCost ?? (() => 0.5))(iteration, ticker),
      quality_score: isBaseline
        ? args.baselineQuality(iteration, ticker)
        : args.candidateQuality(iteration, ticker),
      coverage_score: 0.8,
      status: 'completed',
      completed_at: new Date(0).toISOString(),
    };
  };
}

// =============================================================================
// Statistics math
// =============================================================================

describe('statistics — descriptive', () => {
  it('mean of empty array → 0', () => {
    expect(mean([])).toBe(0);
  });

  it('mean basic', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('stddev with n<2 → 0', () => {
    expect(stddev([])).toBe(0);
    expect(stddev([42])).toBe(0);
  });

  it('stddev basic (sample, n-1 denominator)', () => {
    // values [1,2,3,4,5]; mean=3; ss = (4+1+0+1+4)/4 = 2.5; std = sqrt(2.5) ≈ 1.5811
    expect(stddev([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2.5), 6);
  });

  it('computeMetricDelta basic (positive delta_pct)', () => {
    const d = computeMetricDelta([1, 2, 3], [2, 3, 4]);  // baseline mean=2, candidate mean=3
    expect(d.baseline_mean).toBe(2);
    expect(d.candidate_mean).toBe(3);
    expect(d.delta).toBe(1);
    expect(d.delta_pct).toBeCloseTo(0.5, 6);  // (3-2)/2
  });

  it('computeMetricDelta both means zero → delta_pct=0', () => {
    const d = computeMetricDelta([0, 0, 0], [0, 0, 0]);
    expect(d.delta).toBe(0);
    expect(d.delta_pct).toBe(0);
  });

  it('winRate counts candidate strict wins per pair', () => {
    expect(winRate([1, 2, 3], [2, 1, 4])).toBeCloseTo(2 / 3, 6);  // wins at i=0 and i=2
  });

  it('winRate empty → NaN', () => {
    expect(Number.isNaN(winRate([], []))).toBe(true);
  });
});

describe('statistics — Welch t-test', () => {
  it('welchTTest rejects sample sizes < 2', () => {
    const r = welchTTest([1], [2, 3]);
    expect(Number.isNaN(r.t_statistic)).toBe(true);
    expect(Number.isNaN(r.p_value)).toBe(true);
  });

  it('welchTTest identical distributions → p ≈ 1, t ≈ 0', () => {
    const r = welchTTest([10, 11, 12, 13, 14], [10, 11, 12, 13, 14]);
    expect(Math.abs(r.t_statistic)).toBeLessThan(1e-9);
    expect(r.p_value).toBeCloseTo(1, 4);
  });

  it('welchTTest very different means → small p-value', () => {
    const baseline = [1.0, 1.1, 0.9, 1.05, 0.95];
    const candidate = [5.0, 5.1, 4.9, 5.05, 4.95];
    const r = welchTTest(baseline, candidate);
    expect(r.p_value).toBeLessThan(0.001);
    expect(r.t_statistic).toBeGreaterThan(0);  // candidate mean > baseline mean
  });

  it('pValueTwoTailedFromT t=0 → 1', () => {
    expect(pValueTwoTailedFromT(0, 10)).toBe(1);
  });

  it('regularizedIncompleteBeta boundaries', () => {
    expect(regularizedIncompleteBeta(2, 3, 0)).toBe(0);
    expect(regularizedIncompleteBeta(2, 3, 1)).toBe(1);
  });

  it('welchTTest constant samples → degenerate p-value', () => {
    expect(welchTTest([5, 5, 5], [5, 5, 5]).p_value).toBe(1);
    expect(welchTTest([5, 5, 5], [10, 10, 10]).p_value).toBe(0);
  });
});

describe('statistics — significance + variance', () => {
  it('high variance flagged when CoV > threshold', () => {
    // baseline: huge variance relative to mean
    const baseline = [0.1, 0.9, 0.1, 0.9, 0.1];  // mean ~0.42, stddev ~0.44
    const candidate = [0.5, 0.55, 0.45, 0.5, 0.5];
    const sig = buildSignificance(baseline, candidate);
    expect(sig.high_variance).toBe(true);
  });

  it('low variance not flagged', () => {
    const baseline = [0.50, 0.51, 0.49, 0.50, 0.50];
    const candidate = [0.55, 0.54, 0.55, 0.56, 0.55];
    const sig = buildSignificance(baseline, candidate);
    expect(sig.high_variance).toBe(false);
  });

  it('confident requires both p<alpha and sample_size>=min', () => {
    // 4 samples per arm — below min_samples_per_arm (default 5)
    const sig = buildSignificance([0.1, 0.1, 0.1, 0.1], [0.9, 0.9, 0.9, 0.9]);
    expect(sig.sample_size_per_arm).toBe(4);
    expect(sig.confident).toBe(false);
  });
});

// =============================================================================
// Recommendation derivation — one positive test per AB_* code
// =============================================================================

function makeSig(overrides: Partial<ABStatisticalSignificance> = {}): ABStatisticalSignificance {
  return {
    p_value: 0.001,
    confident: true,
    sample_size_per_arm: 10,
    degrees_of_freedom: 18,
    t_statistic: 5,
    high_variance: false,
    ...overrides,
  };
}

function makeMetric(overrides: Partial<ABMetricDelta> = {}): ABMetricDelta {
  return {
    baseline_mean: 0.5,
    candidate_mean: 0.5,
    delta: 0,
    delta_pct: 0,
    baseline_stddev: 0.05,
    candidate_stddev: 0.05,
    ...overrides,
  };
}

describe('recommendation — AB_REASON_CODES coverage', () => {
  it('AB_PROMOTE_CANDIDATE_QUALITY_WIN', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.10 }),  // > quality_delta_material (0.02)
      cost: makeMetric({ delta_pct: 0 }),
      significance: makeSig(),
    });
    expect(r.recommendation).toBe('promote_candidate');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_PROMOTE_CANDIDATE_QUALITY_WIN]);
  });

  it('AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.005 }),     // neutral magnitude
      cost: makeMetric({ delta_pct: -0.20 }),    // candidate 20% cheaper
      significance: makeSig(),
    });
    expect(r.recommendation).toBe('promote_candidate');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY]);
  });

  it('AB_KEEP_BASELINE_QUALITY_REGRESSION', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: -0.10 }),
      cost: makeMetric({ delta_pct: -0.30 }),  // candidate cheaper but quality regressed
      significance: makeSig(),
    });
    expect(r.recommendation).toBe('keep_baseline');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_KEEP_BASELINE_QUALITY_REGRESSION]);
  });

  it('AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.005 }),     // neutral
      cost: makeMetric({ delta_pct: 0.20 }),     // candidate 20% more expensive
      significance: makeSig(),
    });
    expect(r.recommendation).toBe('keep_baseline');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY]);
  });

  it('AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.20 }),  // big quality win
      cost: makeMetric(),
      significance: makeSig({ sample_size_per_arm: 2 }),  // < min (5)
    });
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES]);
  });

  it('AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.20 }),
      cost: makeMetric(),
      significance: makeSig({ confident: false, p_value: 0.30 }),
    });
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT]);
  });

  it('AB_NEEDS_MORE_DATA_HIGH_VARIANCE', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.20 }),
      cost: makeMetric(),
      significance: makeSig({ high_variance: true }),
    });
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_NEEDS_MORE_DATA_HIGH_VARIANCE]);
  });

  it('all-neutral-magnitude significant → needs_more_data via NOT_STATISTICALLY_SIGNIFICANT', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.005 }),    // neutral
      cost: makeMetric({ delta_pct: 0.05 }),    // neutral
      significance: makeSig(),                   // confident=true
    });
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT]);
  });

  it('reason-code priority: insufficient samples beats high variance', () => {
    const r = deriveRecommendation({
      quality: makeMetric({ delta: 0.20 }),
      cost: makeMetric(),
      significance: makeSig({ sample_size_per_arm: 2, high_variance: true }),
    });
    expect(r.reason_codes).toEqual([AB_REASON_CODES.AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES]);
  });
});

// =============================================================================
// Runner harness
// =============================================================================

describe('runABTest — runner harness', () => {
  it('default runFn throws with clear "live execution disabled" message', async () => {
    await expect(
      runABTest(makeConfig({ ticker_set: ['KCHOL'], runs_per_ticker: 1 })),
    ).resolves.toMatchObject({
      // All cells fail because default runFn throws on each call
      sample_size: 0,
      failed_runs: expect.arrayContaining([
        expect.objectContaining({ status: 'failed' }),
      ]),
    });
    // Verify the actual error message
    let captured: string | undefined;
    try {
      await DEFAULT_LIVE_DISABLED_RUN_FN({
        ticker: 'X', arm: 'baseline', iteration: 0,
        config: makeConfig({ ticker_set: ['X'], runs_per_ticker: 1 }),
      });
    } catch (err) {
      captured = err instanceof Error ? err.message : String(err);
    }
    expect(captured).toBeDefined();
    expect(captured).toBe(LIVE_EXECUTION_DISABLED_MESSAGE);
    expect(captured).toContain('Live A/B execution is disabled');
  });

  it('matrix size = ticker_set.length × runs_per_ticker × 2 (baseline + candidate)', async () => {
    const calls: Array<{ ticker: string; arm: string; iteration: number }> = [];
    const runFn: ABRunFn = async ({ ticker, arm, iteration }) => {
      calls.push({ ticker, arm, iteration });
      return {
        ticker, arm, iteration,
        session_id: `s-${ticker}-${arm}-${iteration}`,
        duration_ms: 1, cost_usd: 0.1, quality_score: 0.5, coverage_score: 0.5,
        status: 'completed', completed_at: new Date(0).toISOString(),
      };
    };
    const r = await runABTest(makeConfig({
      ticker_set: ['KCHOL', 'THYAO', 'EREGL'],
      runs_per_ticker: 4,
    }), runFn);
    expect(calls.length).toBe(3 * 4 * 2);
    expect(r.sample_size).toBe(3 * 4 * 2);
  });

  it('candidate clear-win → promote_candidate end-to-end', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.70,
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    expect(r.recommendation).toBe('promote_candidate');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_PROMOTE_CANDIDATE_QUALITY_WIN);
  });

  it('quality regression → keep_baseline end-to-end', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.70,
      candidateQuality: () => 0.50,
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    expect(r.recommendation).toBe('keep_baseline');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_KEEP_BASELINE_QUALITY_REGRESSION);
  });

  it('insufficient samples → needs_more_data', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.70,
    });
    const r = await runABTest(makeConfig({ ticker_set: ['KCHOL'], runs_per_ticker: 2 }), runFn);
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES);
  });

  it('cost regression with neutral quality → keep_baseline / cost regression', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.502,             // tiny quality bump
      baselineCost: () => 1.0,
      candidateCost: () => 1.30,                  // 30% more expensive
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    expect(r.recommendation).toBe('keep_baseline');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY);
  });

  it('cost win with neutral quality → promote_candidate / cost win', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.502,
      baselineCost: () => 1.0,
      candidateCost: () => 0.50,                   // 50% cheaper
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    expect(r.recommendation).toBe('promote_candidate');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY);
  });

  it('high variance → needs_more_data / HIGH_VARIANCE', async () => {
    const runFn = syntheticRunFn({
      // Baseline alternates wildly: 0.1, 0.9, 0.1, 0.9, ...
      baselineQuality: (i) => (i % 2 === 0 ? 0.1 : 0.9),
      candidateQuality: () => 0.5,
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    expect(r.recommendation).toBe('needs_more_data');
    expect(r.reason_codes).toContain(AB_REASON_CODES.AB_NEEDS_MORE_DATA_HIGH_VARIANCE);
  });

  it('failed runs surface in failed_runs[] without crashing aggregation', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.70,
      failArm: ({ arm, iteration }) => arm === 'candidate' && iteration === 0,
    });
    const r = await runABTest(makeConfig({ ticker_set: ['KCHOL'], runs_per_ticker: 5 }), runFn);
    expect(r.failed_runs.length).toBeGreaterThan(0);
    expect(r.failed_runs.every((f) => f.status === 'failed')).toBe(true);
    // sample_size excludes failures
    expect(r.sample_size).toBe(5 + 5 - 1);  // 5 baseline + 4 candidate (one failed)
  });

  it('runFn that throws → recorded as failed run, no crash', async () => {
    const runFn: ABRunFn = async ({ ticker, arm, iteration }) => {
      if (arm === 'candidate' && iteration === 0) {
        throw new Error('synthetic throw');
      }
      return {
        ticker, arm, iteration,
        session_id: '', duration_ms: 1, cost_usd: 0.1,
        quality_score: 0.5, coverage_score: 0.5,
        status: 'completed', completed_at: new Date(0).toISOString(),
      };
    };
    const r = await runABTest(makeConfig({ ticker_set: ['KCHOL'], runs_per_ticker: 3 }), runFn);
    expect(r.failed_runs.some((f) => f.error_message?.includes('synthetic throw'))).toBe(true);
    expect(r.warnings.some((w) => w.includes('runFn threw'))).toBe(true);
    expect(r.sample_size).toBe(3 + 2);  // 3 baseline + 2 candidate
  });
});

// =============================================================================
// Output invariants
// =============================================================================

describe('runABTest — output invariants', () => {
  it('reason_codes is sorted-unique', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.70,
    });
    const r = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    const sorted = [...r.reason_codes].sort();
    expect(r.reason_codes).toEqual(sorted);
    expect(new Set(r.reason_codes).size).toBe(r.reason_codes.length);
    expect(r.reason_codes.length).toBeGreaterThanOrEqual(1);
  });

  it('per_ticker length matches config.ticker_set.length', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: () => 0.50,
      candidateQuality: () => 0.70,
    });
    const tickers = ['KCHOL', 'THYAO', 'EREGL', 'ASELS'];
    const r = await runABTest(makeConfig({ ticker_set: tickers, runs_per_ticker: 5 }), runFn);
    expect(r.per_ticker).toHaveLength(tickers.length);
    expect(r.per_ticker.map((p) => p.ticker)).toEqual(tickers);
  });

  it('deterministic output mod generated_at', async () => {
    const runFn = syntheticRunFn({
      baselineQuality: (i) => 0.50 + i * 0.001,
      candidateQuality: (i) => 0.70 - i * 0.001,
    });
    const a = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    const b = await runABTest(makeConfig({ runs_per_ticker: 10 }), runFn);
    const norm = (r: typeof a): unknown =>
      JSON.parse(JSON.stringify(r, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });

  it('config validation: empty ticker_set throws', async () => {
    await expect(runABTest(makeConfig({ ticker_set: [] }), syntheticRunFn({
      baselineQuality: () => 0.5, candidateQuality: () => 0.5,
    }))).rejects.toThrow(/ticker_set/);
  });

  it('config validation: runs_per_ticker < 1 throws', async () => {
    await expect(runABTest(makeConfig({ runs_per_ticker: 0 }), syntheticRunFn({
      baselineQuality: () => 0.5, candidateQuality: () => 0.5,
    }))).rejects.toThrow(/runs_per_ticker/);
  });

  it('AB_DEFAULTS exposed and reasonable', () => {
    expect(AB_DEFAULTS.significance_alpha).toBe(0.05);
    expect(AB_DEFAULTS.min_samples_per_arm).toBe(5);
    expect(AB_DEFAULTS.quality_delta_material).toBe(0.02);
    expect(AB_DEFAULTS.cost_delta_material_pct).toBe(0.10);
    expect(AB_DEFAULTS.high_variance_cov_threshold).toBe(0.5);
  });
});
