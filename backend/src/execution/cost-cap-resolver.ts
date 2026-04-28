/**
 * Calibrated Cost-Cap Resolver (Block P — Pre-P5 Wave A2).
 *
 * Returns the per-ticker cost cap derived from the Pre-P5 Cost-Cap
 * Calibration phase (commit `e9124e0e`). The calibration evaluated five
 * candidate strategies against 10 stored completed sessions; the winning
 * strategy was `per-ticker p95 + 20%`, which achieved 0% false-abort and
 * 0% false-skip while keeping the cap as a meaningful guard (mean cap
 * $5.16 vs the over-permissive $8 global flat).
 *
 * Calibration findings (frozen at e9124e0e):
 *   - KCHOL p95 $6.2165 → cap $7.46
 *   - THYAO p95 $2.2364 → cap $2.68
 *   - EREGL p95 $4.6059 → cap $5.53
 *   - Unknown / cold-start tickers: fallback to $8.00, the global-flat cap
 *     that achieved 0% false-abort across the same dataset (so the
 *     fallback is provably safe for any ticker whose real envelope is
 *     ≤ that of the observed dataset).
 *
 * Wave invariants (Pre-P5 Wave A2):
 *   - This module is a PURE function. No DB access, no network, no LLM,
 *     no I/O.
 *   - The calibrated table is a frozen module-private constant. Future
 *     re-calibration phases may add new tickers here; values must be
 *     traceable to a calibration run commit (cited in this module's
 *     header).
 *   - Every resolution carries a frozen `reason_code` and `source` so
 *     downstream auditors can see whether a cap was data-derived or
 *     fallback-derived.
 *   - Shadow-mode only — the resolver is consumed by
 *     `orchestrator-governance.ts` to populate `runCostGovernor`'s
 *     `budget_cap_usd` option. No enforcement is enabled by this module.
 */

// =============================================================================
// Frozen reason-code constants
// =============================================================================

export const COST_CAP_REASON_CODES = {
  COST_CAP_CALIBRATED: 'COST_CAP_CALIBRATED',
  COST_CAP_FALLBACK_UNKNOWN_TICKER: 'COST_CAP_FALLBACK_UNKNOWN_TICKER',
  COST_CAP_FALLBACK_MISSING_TICKER: 'COST_CAP_FALLBACK_MISSING_TICKER',
} as const;

export type CostCapReasonCode =
  typeof COST_CAP_REASON_CODES[keyof typeof COST_CAP_REASON_CODES];

export type CostCapSource = 'per_ticker_p95_plus_20' | 'fallback_global_safe_cap';

// =============================================================================
// Calibrated table (frozen, derived from commit e9124e0e calibration run)
// =============================================================================

const CALIBRATED_CAPS_USD: Readonly<Record<string, number>> = Object.freeze({
  KCHOL: 7.46,
  THYAO: 2.68,
  EREGL: 5.53,
});

/**
 * Conservative fallback for unknown / cold-start tickers. Derived from the
 * calibration's `global $8` strategy which also achieved 0% false-abort
 * across the observed dataset. Higher than any per-ticker calibrated cap
 * so it is safe by construction for tickers whose real envelope is at or
 * below the observed dataset.
 */
export const COST_CAP_FALLBACK_USD = 8.00;

/** Calibration source commit, surfaced in resolution.details for auditability. */
const CALIBRATION_SOURCE_COMMIT = 'e9124e0e';

// =============================================================================
// Public API
// =============================================================================

export interface CostCapResolution {
  /** Normalized ticker (uppercase) when supplied, null when missing. */
  ticker: string | null;
  /** Resolved cap in USD. */
  cap_usd: number;
  /** Frozen reason code from COST_CAP_REASON_CODES. */
  reason_code: CostCapReasonCode;
  /** Provenance — `per_ticker_p95_plus_20` (data-derived) or
   *  `fallback_global_safe_cap` (conservative fallback). */
  source: CostCapSource;
  /** Human-readable Turkish summary, including calibration source commit. */
  details: string;
}

/**
 * Resolve the cost cap for a session given the ticker. Pure function;
 * deterministic; never throws.
 *
 * - Known calibrated ticker → `cap_usd` from the frozen table.
 * - Unknown ticker → `COST_CAP_FALLBACK_USD` with `FALLBACK_UNKNOWN_TICKER`.
 * - Missing / empty ticker → `COST_CAP_FALLBACK_USD` with
 *   `FALLBACK_MISSING_TICKER`.
 *
 * Ticker normalization: trim whitespace + uppercase. `'kchol '`, `'KCHOL'`,
 * and `' KcHoL '` all resolve identically.
 */
export function resolveCostCap(ticker: string | null | undefined): CostCapResolution {
  // Missing / empty ticker
  if (typeof ticker !== 'string') {
    return {
      ticker: null,
      cap_usd: COST_CAP_FALLBACK_USD,
      reason_code: COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER,
      source: 'fallback_global_safe_cap',
      details: `Ticker eksik — kalibrasyonla kanıtlanmış global güvenli üst sınır $${COST_CAP_FALLBACK_USD.toFixed(2)} kullanılıyor (Pre-P5 calibration ${CALIBRATION_SOURCE_COMMIT}).`,
    };
  }
  const trimmed = ticker.trim();
  if (trimmed.length === 0) {
    return {
      ticker: null,
      cap_usd: COST_CAP_FALLBACK_USD,
      reason_code: COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER,
      source: 'fallback_global_safe_cap',
      details: `Ticker boş — kalibrasyonla kanıtlanmış global güvenli üst sınır $${COST_CAP_FALLBACK_USD.toFixed(2)} kullanılıyor (Pre-P5 calibration ${CALIBRATION_SOURCE_COMMIT}).`,
    };
  }
  const upper = trimmed.toUpperCase();
  const calibrated = CALIBRATED_CAPS_USD[upper];
  if (typeof calibrated === 'number' && Number.isFinite(calibrated)) {
    return {
      ticker: upper,
      cap_usd: calibrated,
      reason_code: COST_CAP_REASON_CODES.COST_CAP_CALIBRATED,
      source: 'per_ticker_p95_plus_20',
      details: `${upper} kalibre cap = $${calibrated.toFixed(2)} (per-ticker p95 + 20%, Pre-P5 calibration ${CALIBRATION_SOURCE_COMMIT}).`,
    };
  }
  // Unknown ticker → conservative fallback
  return {
    ticker: upper,
    cap_usd: COST_CAP_FALLBACK_USD,
    reason_code: COST_CAP_REASON_CODES.COST_CAP_FALLBACK_UNKNOWN_TICKER,
    source: 'fallback_global_safe_cap',
    details: `${upper} kalibrasyon kapsamı dışında — global güvenli üst sınır $${COST_CAP_FALLBACK_USD.toFixed(2)} kullanılıyor (Pre-P5 calibration ${CALIBRATION_SOURCE_COMMIT}).`,
  };
}

/** Test helper: list of currently calibrated tickers. */
export function listCalibratedTickers(): string[] {
  return Object.keys(CALIBRATED_CAPS_USD).sort();
}

// =============================================================================
// Test exports
// =============================================================================

export { CALIBRATED_CAPS_USD, CALIBRATION_SOURCE_COMMIT };
