/**
 * P5B Wave 1 — Statistical math for A/B testing (pure TypeScript, no deps).
 *
 * - mean, sample stddev (n-1)
 * - Welch's two-sample t-test (statistic + Welch-Satterthwaite df)
 * - Two-tailed p-value via the regularized incomplete beta function
 *   (numerical recipes-style continued fraction; no external deps)
 * - Win-rate (paired comparison), metric delta + delta_pct
 * - Recommendation derivation respecting frozen AB_REASON_CODES
 */

import {
  AB_DEFAULTS,
  AB_REASON_CODES,
  type ABMetricDelta,
  type ABReasonCode,
  type ABRecommendation,
  type ABStatisticalSignificance,
} from './types.js';

// =============================================================================
// Basic descriptive stats
// =============================================================================

export function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Sample standard deviation (n-1 denominator). Returns 0 for n < 2. */
export function stddev(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  let s = 0;
  for (const v of values) {
    const d = v - m;
    s += d * d;
  }
  return Math.sqrt(s / (n - 1));
}

// =============================================================================
// Metric delta (baseline vs candidate)
// =============================================================================

export function computeMetricDelta(
  baselineValues: ReadonlyArray<number>,
  candidateValues: ReadonlyArray<number>,
): ABMetricDelta {
  const baselineMean = mean(baselineValues);
  const candidateMean = mean(candidateValues);
  const delta = candidateMean - baselineMean;
  const denom = Math.max(Math.abs(baselineMean), Number.EPSILON);
  const deltaPct = baselineMean === 0 && candidateMean === 0 ? 0 : delta / denom;
  return {
    baseline_mean: round6(baselineMean),
    candidate_mean: round6(candidateMean),
    delta: round6(delta),
    delta_pct: round6(deltaPct),
    baseline_stddev: round6(stddev(baselineValues)),
    candidate_stddev: round6(stddev(candidateValues)),
  };
}

/**
 * Pair-wise win rate: fraction of (baseline_i, candidate_i) pairs where
 * candidate_i > baseline_i. Pairs are formed by index (callers must order
 * arrays consistently — typically by ticker × iteration). Mismatched
 * lengths are truncated to the shorter array. Returns NaN when no pairs.
 */
export function winRate(
  baseline: ReadonlyArray<number>,
  candidate: ReadonlyArray<number>,
): number {
  const n = Math.min(baseline.length, candidate.length);
  if (n === 0) return Number.NaN;
  let wins = 0;
  for (let i = 0; i < n; i++) {
    if (candidate[i] > baseline[i]) wins++;
  }
  return round6(wins / n);
}

// =============================================================================
// Welch's t-test
// =============================================================================

export interface WelchResult {
  t_statistic: number;
  degrees_of_freedom: number;
  p_value: number;
}

/**
 * Welch's two-sample t-test (unequal variances).
 *
 * Returns a result with NaN fields when either sample size < 2 OR both
 * variances are zero (no signal to test).
 */
export function welchTTest(
  a: ReadonlyArray<number>,
  b: ReadonlyArray<number>,
): WelchResult {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) {
    return { t_statistic: Number.NaN, degrees_of_freedom: Number.NaN, p_value: Number.NaN };
  }
  const ma = mean(a);
  const mb = mean(b);
  const sa = stddev(a);
  const sb = stddev(b);
  const va = sa * sa;
  const vb = sb * sb;
  if (va === 0 && vb === 0) {
    // Degenerate case: identical constant samples. p=1.0 if means equal,
    // p=0 if means differ (both arms are constants but different ones).
    return {
      t_statistic: ma === mb ? 0 : (ma > mb ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY),
      degrees_of_freedom: Number.NaN,
      p_value: ma === mb ? 1 : 0,
    };
  }
  const seSquared = va / na + vb / nb;
  const se = Math.sqrt(seSquared);
  const t = (mb - ma) / se;
  // Welch-Satterthwaite degrees of freedom
  const numerator = seSquared * seSquared;
  const denomA = (va * va) / (na * na * (na - 1));
  const denomB = (vb * vb) / (nb * nb * (nb - 1));
  const df = numerator / (denomA + denomB);
  const p = pValueTwoTailedFromT(Math.abs(t), df);
  return {
    t_statistic: round6(t),
    degrees_of_freedom: round6(df),
    p_value: round6(p),
  };
}

/** Two-tailed p-value via I_x(df/2, 1/2) where x = df/(df + t^2). */
export function pValueTwoTailedFromT(absT: number, df: number): number {
  if (!Number.isFinite(absT) || !Number.isFinite(df) || df <= 0) {
    return Number.NaN;
  }
  if (absT === 0) return 1;
  const x = df / (df + absT * absT);
  return regularizedIncompleteBeta(df / 2, 0.5, x);
}

// =============================================================================
// Regularized incomplete beta function (numerical recipes style)
// =============================================================================

function lgamma(x: number): number {
  // Lanczos approximation, g=7, n=9.
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  const xMinusOne = x - 1;
  let a = c[0];
  const t = xMinusOne + 7.5;
  for (let i = 1; i < c.length; i++) {
    a += c[i] / (xMinusOne + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (xMinusOne + 0.5) * Math.log(t) - t + Math.log(a);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) return h;
  }
  return h; // best-effort — should converge in practice
}

export function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(x)) return Number.NaN;
  if (x < 0 || x > 1) return Number.NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;
  const lnBt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(lnBt);
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

// =============================================================================
// Significance + variance summary
// =============================================================================

export function buildSignificance(
  baselineQuality: ReadonlyArray<number>,
  candidateQuality: ReadonlyArray<number>,
  alpha: number = AB_DEFAULTS.significance_alpha,
): ABStatisticalSignificance {
  const sampleSize = Math.min(baselineQuality.length, candidateQuality.length);
  const welch = welchTTest(baselineQuality, candidateQuality);
  const baselineMean = mean(baselineQuality);
  const candidateMean = mean(candidateQuality);
  const baselineCov = baselineMean === 0 ? 0 : stddev(baselineQuality) / Math.abs(baselineMean);
  const candidateCov = candidateMean === 0 ? 0 : stddev(candidateQuality) / Math.abs(candidateMean);
  const highVariance =
    baselineCov > AB_DEFAULTS.high_variance_cov_threshold ||
    candidateCov > AB_DEFAULTS.high_variance_cov_threshold;
  const confident =
    Number.isFinite(welch.p_value) &&
    welch.p_value < alpha &&
    sampleSize >= AB_DEFAULTS.min_samples_per_arm;
  return {
    p_value: welch.p_value,
    confident,
    sample_size_per_arm: sampleSize,
    degrees_of_freedom: welch.degrees_of_freedom,
    t_statistic: welch.t_statistic,
    high_variance: highVariance,
  };
}

// =============================================================================
// Recommendation derivation
// =============================================================================

export interface RecommendationDerivation {
  recommendation: ABRecommendation;
  reason_codes: ABReasonCode[];
}

export function deriveRecommendation(args: {
  quality: ABMetricDelta;
  cost: ABMetricDelta;
  significance: ABStatisticalSignificance;
}): RecommendationDerivation {
  const { quality, cost, significance } = args;

  // 1) Sample-size gate (lowest threshold first).
  if (significance.sample_size_per_arm < AB_DEFAULTS.min_samples_per_arm) {
    return {
      recommendation: 'needs_more_data',
      reason_codes: [AB_REASON_CODES.AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES],
    };
  }

  // 2) High variance check.
  if (significance.high_variance) {
    return {
      recommendation: 'needs_more_data',
      reason_codes: [AB_REASON_CODES.AB_NEEDS_MORE_DATA_HIGH_VARIANCE],
    };
  }

  // 3) Statistical significance gate (Welch t-test on quality).
  if (!significance.confident) {
    return {
      recommendation: 'needs_more_data',
      reason_codes: [AB_REASON_CODES.AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT],
    };
  }

  // 4) Significant — decide direction. Quality first, cost as tiebreaker.
  if (quality.delta < -AB_DEFAULTS.quality_delta_material) {
    return {
      recommendation: 'keep_baseline',
      reason_codes: [AB_REASON_CODES.AB_KEEP_BASELINE_QUALITY_REGRESSION],
    };
  }
  if (quality.delta > AB_DEFAULTS.quality_delta_material) {
    return {
      recommendation: 'promote_candidate',
      reason_codes: [AB_REASON_CODES.AB_PROMOTE_CANDIDATE_QUALITY_WIN],
    };
  }

  // 5) Quality is neutral magnitude — fall through to cost direction.
  if (cost.delta_pct < -AB_DEFAULTS.cost_delta_material_pct) {
    return {
      recommendation: 'promote_candidate',
      reason_codes: [AB_REASON_CODES.AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY],
    };
  }
  if (cost.delta_pct > AB_DEFAULTS.cost_delta_material_pct) {
    return {
      recommendation: 'keep_baseline',
      reason_codes: [AB_REASON_CODES.AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY],
    };
  }

  // 6) Both quality and cost are neutral — significant difference exists but
  //    not on a material magnitude. Treat as inconclusive (more data may
  //    surface a directional preference).
  return {
    recommendation: 'needs_more_data',
    reason_codes: [AB_REASON_CODES.AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT],
  };
}

// =============================================================================
// Helpers
// =============================================================================

function round6(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.round(n * 1e6) / 1e6;
}

export { round6 };
