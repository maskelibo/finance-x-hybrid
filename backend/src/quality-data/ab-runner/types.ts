/**
 * P5B Wave 1 — A/B Testing Runner type surface.
 *
 * Wave 1 ships L1 (types) + L2 (statistical math) + L3a (mocked runner
 * harness). The live execution path (L3b) that would invoke
 * `startAnalysisSession` is explicitly DEFERRED to a future scope cycle
 * requiring paid-run authorization.
 *
 * No runtime code in this file — declarations + frozen reason-code
 * constants only.
 */

// =============================================================================
// Frozen reason codes (7) — every recommendation must carry ≥ 1 of these
// =============================================================================

export const AB_REASON_CODES = {
  AB_PROMOTE_CANDIDATE_QUALITY_WIN: 'AB_PROMOTE_CANDIDATE_QUALITY_WIN',
  AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY: 'AB_PROMOTE_CANDIDATE_COST_WIN_NEUTRAL_QUALITY',
  AB_KEEP_BASELINE_QUALITY_REGRESSION: 'AB_KEEP_BASELINE_QUALITY_REGRESSION',
  AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY: 'AB_KEEP_BASELINE_COST_REGRESSION_NEUTRAL_QUALITY',
  AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES: 'AB_NEEDS_MORE_DATA_INSUFFICIENT_SAMPLES',
  AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT: 'AB_NEEDS_MORE_DATA_NOT_STATISTICALLY_SIGNIFICANT',
  AB_NEEDS_MORE_DATA_HIGH_VARIANCE: 'AB_NEEDS_MORE_DATA_HIGH_VARIANCE',
} as const;

export type ABReasonCode = typeof AB_REASON_CODES[keyof typeof AB_REASON_CODES];

// =============================================================================
// Config + result types
// =============================================================================

export type ABArm = 'baseline' | 'candidate';

export interface ABTestArm {
  agent_id: string;
  /** semver / git ref / arbitrary tag for traceability. */
  version: string;
  /** Free-form per-arm overrides forwarded to the runFn. */
  config_override?: Record<string, unknown>;
}

export interface ABTestConfig {
  name: string;
  baseline: ABTestArm;
  candidate: ABTestArm;
  ticker_set: string[];
  runs_per_ticker: number;
  /** Default 0.05 — caller-overridable α threshold for `confident`. */
  significance_alpha?: number;
}

export interface ABRunResult {
  ticker: string;
  arm: ABArm;
  iteration: number;
  session_id: string;
  duration_ms: number;
  cost_usd: number;
  /** Composite quality in [0, 1]. The runner is signal-agnostic — the caller
   *  computes this from any upstream (quality_budget.publishable_score,
   *  golden-eval composite, etc.). */
  quality_score: number;
  /** Coverage in [0, 1]. */
  coverage_score: number;
  status: 'completed' | 'failed';
  error_message?: string;
  /** ISO timestamp the run finished (or attempted). */
  completed_at: string;
}

export interface ABMetricDelta {
  baseline_mean: number;
  candidate_mean: number;
  /** candidate_mean − baseline_mean (signed). */
  delta: number;
  /** delta / max(|baseline|, ε); positive = candidate > baseline. */
  delta_pct: number;
  baseline_stddev: number;
  candidate_stddev: number;
}

export interface ABStatisticalSignificance {
  /** Welch's two-tailed t-test p-value on quality_score. NaN when sample
   *  sizes are too small or variances are zero. */
  p_value: number;
  /** True iff `p_value < significance_alpha` AND `sample_size_per_arm ≥
   *  MIN_SAMPLES_PER_ARM`. */
  confident: boolean;
  /** Number of completed runs per arm (post-failure-filter). */
  sample_size_per_arm: number;
  /** Welch-Satterthwaite degrees of freedom. NaN when undefined. */
  degrees_of_freedom: number;
  /** Welch t-statistic. NaN when undefined. */
  t_statistic: number;
  /** True iff either arm's quality CoV (stddev / |mean|) exceeds the
   *  high-variance threshold. */
  high_variance: boolean;
}

export type ABRecommendation =
  | 'promote_candidate'
  | 'keep_baseline'
  | 'needs_more_data';

export interface ABPerTicker {
  ticker: string;
  baseline: ABRunResult[];
  candidate: ABRunResult[];
  /** candidate quality mean − baseline quality mean (per ticker, completed runs only). */
  quality_delta: number;
  /** candidate cost mean − baseline cost mean (per ticker, completed runs only). */
  cost_delta_usd: number;
}

export interface ABReport {
  config: ABTestConfig;
  generated_at: string;
  /** Total COMPLETED runs across both arms. Failed runs are excluded from
   *  metrics aggregation but appear in `failed_runs` for operator review. */
  sample_size: number;
  metrics: {
    duration_ms: ABMetricDelta;
    cost_usd: ABMetricDelta;
    quality_score: ABMetricDelta;
    coverage_score: ABMetricDelta;
    /** Fraction of paired runs (per ticker × iteration) where candidate
     *  quality > baseline quality. NaN when no pairs are available. */
    quality_win_rate: number;
  };
  statistical_significance: ABStatisticalSignificance;
  recommendation: ABRecommendation;
  /** Sorted-unique AB_* codes from AB_REASON_CODES. ≥ 1 always present. */
  reason_codes: string[];
  per_ticker: ABPerTicker[];
  /** Runs whose status is 'failed' across both arms. */
  failed_runs: ABRunResult[];
  warnings: string[];
}

/**
 * Caller-supplied per-cell run function.
 *
 * Wave 1 default implementation throws — the runner harness explicitly
 * does NOT invoke `startAnalysisSession`. Tests inject a synthetic runFn
 * that returns deterministic ABRunResult objects without any side effects.
 *
 * To run live A/B tests in a future Wave 2, the operator must:
 *   - authorize a paid-run budget envelope,
 *   - implement a runFn that wraps `startAnalysisSession`,
 *   - gate it behind GOVERNANCE_AB_LIVE_RUN=on (not yet wired).
 */
export type ABRunFn = (args: {
  ticker: string;
  arm: ABArm;
  iteration: number;
  config: ABTestConfig;
}) => Promise<ABRunResult>;

// =============================================================================
// Tunables (module-private but re-exported for tests)
// =============================================================================

export const AB_DEFAULTS = {
  /** Welch t-test α threshold for `confident`. */
  significance_alpha: 0.05,
  /** Below this per-arm completed-sample count, recommendation is
   *  needs_more_data / INSUFFICIENT_SAMPLES regardless of other signals. */
  min_samples_per_arm: 5,
  /** Quality magnitude threshold (absolute units on the [0,1] scale).
   *  Below this the quality direction is treated as neutral. */
  quality_delta_material: 0.02,
  /** Cost magnitude threshold (relative %). Below this the cost direction
   *  is treated as neutral. */
  cost_delta_material_pct: 0.10,
  /** Coefficient of variation (stddev / |mean|) above which an arm's
   *  quality distribution is flagged high-variance and the recommendation
   *  is needs_more_data / HIGH_VARIANCE. */
  high_variance_cov_threshold: 0.5,
} as const;
