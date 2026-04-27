/**
 * Financial Truth Arbitration (Block P — Plan P1D Wave 1).
 *
 * Deterministic canonical-truth selection. Given multiple candidate values
 * for the same fact_key, scores each candidate by source priority +
 * confidence + freshness + conflict signals and returns a winner with
 * preserved (annotated) alternatives. Wave 1 is OFFLINE — callers gather
 * candidates and invoke arbitrateTruth; no in-line write blocking, no
 * canonical_facts mutation.
 *
 * Strict invariants:
 *   - Pure scoring; same inputs → same decision (deterministic)
 *   - Single-candidate input is a trivial decision (reason: "single source")
 *   - Empty candidate list throws (caller bug)
 *   - "Rejected" candidates are PRESERVED with rejection_reason — never
 *     dropped silently. P1D never suppresses analytical narrative.
 *   - Arbitration NEVER writes to canonical_facts in Wave 1 — pure query
 */

import { db } from '../db.js';
import { listFacts, type FactValue } from './store.js';
import { mapSourceTypeToPlan, type PlanFactSourceType } from './confidence.js';
import { checkOwnership, type OwnershipCheck } from './ownership.js';

// =============================================================================
// Types
// =============================================================================

export interface TruthCandidate {
  fact_key: string;
  value: FactValue;
  /** 0..1 (matches FactConfidence.score). Caller-supplied. */
  confidence_score: number;
  /** Plan P1A 6-tier source taxonomy. */
  source_type: PlanFactSourceType;
  freshness_days: number;
  computed_by: string;
  has_conflict?: boolean;
  /** Optional methodology version for audit. */
  methodology_version?: string;
}

export interface RejectedCandidate {
  computed_by: string;
  value: FactValue;
  arbitration_score: number;
  rejection_reason: string;
}

export interface TruthDecision {
  fact_key: string;
  canonical_value: FactValue;
  canonical_source: string;
  arbitration_score: number;
  rejected_candidates: RejectedCandidate[];
  decision_reason: string;
  arbitration_timestamp: string;
  /** P1D Wave 1 — ownership check result for the winner (informational). */
  ownership: OwnershipCheck | null;
}

// =============================================================================
// Scoring
// =============================================================================

/**
 * Source priority — deterministic, authoritative-to-inferred. Mirrors
 * confidence.ts SOURCE_QUALITY × 100 with the same plan_type taxonomy.
 */
const SOURCE_PRIORITY: Record<PlanFactSourceType, number> = {
  direct_disclosure: 100,
  computed: 90,
  management_quote: 75,
  analyst_estimate: 50,
  peer_proxy: 40,
  inferred: 20,
};

const FRESHNESS_PENALTY_PER_DAY = 0.1;   // up to ~20 over 200 days
const FRESHNESS_PENALTY_CAP = 20;
const CONFLICT_PENALTY = 10;

function computeArbitrationScore(c: TruthCandidate): number {
  const sourcePriority = SOURCE_PRIORITY[c.source_type] ?? 0;
  const confidenceBoost = clamp01(c.confidence_score) * 100;
  const freshnessPenalty = Math.min(FRESHNESS_PENALTY_CAP, Math.max(0, c.freshness_days * FRESHNESS_PENALTY_PER_DAY));
  const conflictPenalty = c.has_conflict ? CONFLICT_PENALTY : 0;
  return sourcePriority + confidenceBoost - freshnessPenalty - conflictPenalty;
}

function explainRejection(
  winner: TruthCandidate & { arbitration_score: number },
  loser: TruthCandidate & { arbitration_score: number },
): string {
  const reasons: string[] = [];
  if ((SOURCE_PRIORITY[winner.source_type] ?? 0) > (SOURCE_PRIORITY[loser.source_type] ?? 0)) {
    reasons.push(`stronger source (${winner.source_type} vs ${loser.source_type})`);
  }
  if (winner.confidence_score > loser.confidence_score + 0.1) {
    reasons.push(`higher confidence (${winner.confidence_score.toFixed(2)} vs ${loser.confidence_score.toFixed(2)})`);
  }
  if (loser.freshness_days > winner.freshness_days + 30) {
    reasons.push(`fresher (${winner.freshness_days}d vs ${loser.freshness_days}d)`);
  }
  if (loser.has_conflict && !winner.has_conflict) {
    reasons.push(`loser has unresolved conflict`);
  }
  if (reasons.length === 0) {
    reasons.push(`score diff: ${(winner.arbitration_score - loser.arbitration_score).toFixed(1)}`);
  }
  return reasons.join('; ');
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// =============================================================================
// Main entry
// =============================================================================

export function arbitrateTruth(
  candidates: ReadonlyArray<TruthCandidate>,
  /** Optional ISO timestamp; defaults to now. Pure function when supplied. */
  options?: { arbitration_timestamp?: string },
): TruthDecision {
  if (candidates.length === 0) {
    throw new Error('arbitrateTruth: candidates array is empty');
  }
  const ts = options?.arbitration_timestamp ?? new Date().toISOString();

  if (candidates.length === 1) {
    const only = candidates[0];
    const score = computeArbitrationScore(only);
    return {
      fact_key: only.fact_key,
      canonical_value: only.value,
      canonical_source: only.computed_by,
      arbitration_score: score,
      rejected_candidates: [],
      decision_reason: 'single candidate; arbitration trivial',
      arbitration_timestamp: ts,
      ownership: checkOwnership(only.fact_key, only.computed_by),
    };
  }

  // Score every candidate then sort descending. Deterministic tiebreak via
  // (computed_by ASC) so identical-score candidates produce identical output.
  const scored = candidates.map((c) => ({ ...c, arbitration_score: computeArbitrationScore(c) }));
  scored.sort((a, b) => {
    if (b.arbitration_score !== a.arbitration_score) return b.arbitration_score - a.arbitration_score;
    return a.computed_by.localeCompare(b.computed_by);
  });

  const winner = scored[0];
  const losers = scored.slice(1);
  return {
    fact_key: winner.fact_key,
    canonical_value: winner.value,
    canonical_source: winner.computed_by,
    arbitration_score: winner.arbitration_score,
    rejected_candidates: losers.map((l) => ({
      computed_by: l.computed_by,
      value: l.value,
      arbitration_score: l.arbitration_score,
      rejection_reason: explainRejection(winner, l),
    })),
    decision_reason: `arbitration_score=${winner.arbitration_score.toFixed(1)} (source=${winner.source_type}, confidence=${winner.confidence_score.toFixed(2)})`,
    arbitration_timestamp: ts,
    ownership: checkOwnership(winner.fact_key, winner.computed_by),
  };
}

// =============================================================================
// Live arbitration — assemble candidates from existing fact-layer state
// =============================================================================

interface LineageRow {
  computed_by: string;
  computed_at: string;
  raw_value: string | null;
  normalized_value: string | null;
  node_type: string;
}

/**
 * Build candidates for a fact_key from the lineage_nodes table + the
 * canonical_facts row's confidence. Each lineage_node represents one
 * agent's write attempt for that fact_key in this session. Wave 1 emits
 * raw_extracted nodes only, so all candidates inherit the fact's
 * persisted confidence (single canonical row); the arbitration matters
 * once Wave 2 of P1B starts producing computed nodes.
 */
export function arbitrateFactFromLineage(
  sessionId: string,
  factKey: string,
  /** Reference timestamp for freshness calc. Defaults to now. */
  options?: { reference_at?: string; arbitration_timestamp?: string },
): TruthDecision | null {
  const refDate = new Date(options?.reference_at ?? new Date().toISOString());

  const rows = db.prepare(`
    SELECT computed_by, computed_at, raw_value, normalized_value, node_type
    FROM lineage_nodes
    WHERE session_id = ? AND fact_key = ?
  `).all(sessionId, factKey) as LineageRow[];
  if (rows.length === 0) return null;

  // Pull persisted fact + confidence (single canonical row per fact_key)
  const fact = listFacts(sessionId).find((f) => f.fact_key === factKey);
  const confidenceScore = fact?.confidence?.score ?? 0;
  const hasConflict = (fact?.confidence?.components?.conflict_penalty ?? 0) > 0;

  const candidates: TruthCandidate[] = rows.map((row) => {
    const normalized = parseJsonOrNull(row.normalized_value);
    // Map agent_id → plan source taxonomy. Defaults to 'inferred' (conservative).
    const m = mapSourceTypeToPlan({ type: 'agent', agent_id: row.computed_by });
    const computedAt = new Date(row.computed_at);
    const freshnessDays = Math.max(0, Math.round(
      (refDate.getTime() - computedAt.getTime()) / (1000 * 60 * 60 * 24),
    ));
    return {
      fact_key: factKey,
      value: (typeof normalized === 'number' || typeof normalized === 'string' || typeof normalized === 'boolean')
        ? normalized as FactValue
        : null,
      confidence_score: confidenceScore,
      source_type: m.plan_type,
      freshness_days: freshnessDays,
      computed_by: row.computed_by,
      has_conflict: hasConflict,
    };
  });

  return arbitrateTruth(candidates, { arbitration_timestamp: options?.arbitration_timestamp });
}

function parseJsonOrNull(s: string | null): unknown {
  if (s == null) return null;
  try { return JSON.parse(s); } catch { return null; }
}
