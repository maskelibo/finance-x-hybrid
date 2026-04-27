/**
 * Compact confidence summary (Block P — Plan P1A Wave 2).
 *
 * Read-only JSON summariser intended for downstream P1D truth arbitration.
 * Wave 2 ships the producer only; no consumer is wired in this phase.
 *
 * Strict invariants:
 *   - Pure projection of `getCanonicalFactPackV2` — no DB writes
 *   - Output shape is deterministic and stable across calls; consumers may
 *     persist or hash it without expecting field-order drift
 *   - Never throws on empty/missing data — empty session yields a
 *     well-formed empty summary
 */

import { getCanonicalFactPackV2 } from './pack-v2.js';
import type { FactConfidenceTier } from './confidence.js';

// =============================================================================
// Output shape
// =============================================================================

export interface FactConfidenceSummary {
  session_id: string;
  ticker: string | null;
  fact_count: number;
  scored_fact_count: number;
  unscored_fact_count: number;
  avg_score: number;
  tier_counts: Record<FactConfidenceTier, number>;
  /** Sorted alphabetically. */
  low_confidence_keys: string[];
  /** Sorted alphabetically. Subset of low_confidence_keys. */
  speculative_keys: string[];
  /** Sorted alphabetically — facts persisted before P1A or with confidence_inputs omitted. */
  unscored_keys: string[];
  /** Sorted alphabetically. */
  disputed_keys: string[];
  conflict_severity_counts: { minor: number; material: number; critical: number };
  composed_at: string;
}

export function buildFactConfidenceSummary(sessionId: string): FactConfidenceSummary {
  const pack = getCanonicalFactPackV2(sessionId);
  const scoredCount = pack.fact_count - pack.confidence_summary.unscored_keys.length;
  return {
    session_id: pack.session_id,
    ticker: pack.ticker,
    fact_count: pack.fact_count,
    scored_fact_count: scoredCount,
    unscored_fact_count: pack.confidence_summary.unscored_keys.length,
    avg_score: pack.confidence_summary.avg_score,
    tier_counts: pack.confidence_summary.tier_counts,
    low_confidence_keys: [...pack.confidence_summary.low_confidence_keys],
    speculative_keys: [...pack.confidence_summary.speculative_keys],
    unscored_keys: [...pack.confidence_summary.unscored_keys],
    disputed_keys: [...pack.conflict_summary.disputed_keys],
    conflict_severity_counts: { ...pack.conflict_summary.by_severity },
    composed_at: pack.composed_at,
  };
}
