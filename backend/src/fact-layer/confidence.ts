/**
 * Fact-Level Confidence Scoring (Block P — Plan P1A Wave 1).
 *
 * Deterministic claim-level confidence scoring that augments the existing
 * R7 fact-layer store. Wave 1 is additive: callers may pass optional
 * confidence_inputs to upsertFact; if absent the store behaves exactly as
 * before. No agent-runner integration in this wave.
 *
 * Strict invariants:
 *   - pure function: same inputs → same output, no I/O, no Date.now() reads
 *   - safe defaults: every missing input collapses to a conservative score;
 *     the explanation records WHY a default was used (no silent invention)
 *   - existing FactSource taxonomy {agent, computed, user, document} is
 *     preserved verbatim; this module maps it INTO plan P1A's scoring
 *     taxonomy {direct_disclosure, computed, management_quote,
 *     analyst_estimate, peer_proxy, inferred} without rewriting the source
 *     of truth
 *   - inputs are never mutated
 */

import type { FactSource } from './store.js';

// =============================================================================
// Plan P1A scoring taxonomy
// =============================================================================
//
// Plan P1A defines 6 source-quality tiers. The runtime currently uses 4 source
// types (`agent` / `computed` / `user` / `document`). The mapping helper below
// projects the runtime taxonomy into the plan taxonomy without altering the
// runtime types — preserving the R7 fact-store API.

export type PlanFactSourceType =
  | 'direct_disclosure'
  | 'computed'
  | 'management_quote'
  | 'analyst_estimate'
  | 'peer_proxy'
  | 'inferred';

const SOURCE_QUALITY: Record<PlanFactSourceType, number> = {
  direct_disclosure: 1.0,
  computed: 0.9,
  management_quote: 0.85,
  analyst_estimate: 0.6,
  peer_proxy: 0.5,
  inferred: 0.35,
};

// Agent IDs that produce facts directly from primary documents. Mapping
// these to `direct_disclosure` reflects their actual provenance — they
// extract numbers verbatim from KAP filings, annual reports, etc.
const DOCUMENT_BACKED_AGENT_IDS: ReadonlySet<string> = new Set([
  'parse_standardization',
  'document_evidence',
  'kap_watch',
  'data_collection',
]);

// Agent IDs whose output is a deterministic computation over upstream
// canonical numbers (ratios, balances, reconciliation deltas).
const COMPUTED_AGENT_IDS: ReadonlySet<string> = new Set([
  'financial_analysis',
  'reconciliation',
  'valuation_agent',
  'macro_analysis',
]);

/**
 * Project a runtime FactSource onto the plan's quality taxonomy. Conservative:
 * unknown agent ids fall to `inferred` (lowest non-null tier) and the choice
 * is recorded in the returned reason for breakdown display.
 */
export function mapSourceTypeToPlan(
  source: Pick<FactSource, 'type' | 'agent_id'>,
): { plan_type: PlanFactSourceType; mapping_reason: string } {
  switch (source.type) {
    case 'document':
      return {
        plan_type: 'direct_disclosure',
        mapping_reason: 'runtime FactSource.type=document → direct_disclosure',
      };
    case 'user':
      return {
        plan_type: 'direct_disclosure',
        mapping_reason: 'runtime FactSource.type=user (deliberate override) → direct_disclosure',
      };
    case 'computed':
      return {
        plan_type: 'computed',
        mapping_reason: 'runtime FactSource.type=computed (deterministic derivation) → computed',
      };
    case 'agent': {
      const aid = source.agent_id ?? '';
      if (DOCUMENT_BACKED_AGENT_IDS.has(aid)) {
        return {
          plan_type: 'direct_disclosure',
          mapping_reason: `agent_id=${aid} extracts from primary documents → direct_disclosure`,
        };
      }
      if (COMPUTED_AGENT_IDS.has(aid)) {
        return {
          plan_type: 'computed',
          mapping_reason: `agent_id=${aid} produces deterministic computations → computed`,
        };
      }
      // Unknown / synthesis / qa / context_extraction etc. — conservative
      // default: inferred. Recorded so callers can see why a fact got the
      // lowest tier.
      return {
        plan_type: 'inferred',
        mapping_reason: aid
          ? `agent_id=${aid} not in document-backed or computed registry → inferred (conservative)`
          : 'runtime FactSource.type=agent without agent_id → inferred (conservative)',
      };
    }
    default: {
      // Defensive: future-proof against new FactSource.type values added in
      // R7+ without crashing this scorer. Conservative fallback.
      return {
        plan_type: 'inferred',
        mapping_reason: `unrecognised FactSource.type=${(source as { type: string }).type} → inferred (conservative)`,
      };
    }
  }
}

// =============================================================================
// Confidence inputs + result types
// =============================================================================

export interface FactConfidenceInputs {
  /** Live FactSource[] from the store. May be empty (rare; conservative). */
  sources: ReadonlyArray<FactSource>;
  /** True when another fact (or another agent) reports a different value. */
  has_conflict?: boolean;
  /** Severity of conflict, if known. Ignored when has_conflict=false. */
  conflict_severity?: 'minor' | 'material' | 'critical';
  /** 0 = verbatim extraction, 3 = multi-step inference. Default 0. */
  computation_complexity?: 0 | 1 | 2 | 3;
  /** How many independent agents arrived at the same value. Default 1. */
  cross_agent_agreement_count?: number;
}

export type FactConfidenceTier = 'CERTAIN' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SPECULATIVE';

export interface FactConfidenceComponents {
  source_quality: number;
  source_count_bonus: number;
  freshness_penalty: number;
  conflict_penalty: number;
  complexity_penalty: number;
  agreement_bonus: number;
}

export interface FactConfidence {
  /** 0..1, three decimals. */
  score: number;
  tier: FactConfidenceTier;
  components: FactConfidenceComponents;
  /** Per-source mapping decisions (Wave 1 visibility into the projection). */
  source_mappings: Array<{
    plan_type: PlanFactSourceType;
    mapping_reason: string;
  }>;
  /** Human-readable summary of the score with degradation reasons surfaced. */
  explanation: string;
  /**
   * Notes describing every conservative default that fired (missing inputs,
   * unrecognised source types, empty sources). Empty when all inputs were
   * well-formed.
   */
  decay_reasons: string[];
}

// =============================================================================
// Component math (kept pure)
// =============================================================================

const FRESHNESS_BANDS = [
  { upper_days: 30, penalty: 0 },
  { upper_days: 90, penalty: 0.05 },
  { upper_days: Number.POSITIVE_INFINITY, penalty: 0.10 },
] as const;

function freshnessPenaltyFor(avgDays: number): number {
  for (const band of FRESHNESS_BANDS) {
    if (avgDays <= band.upper_days) return band.penalty;
  }
  return 0.10;
}

function conflictPenaltyFor(
  has: boolean,
  severity: FactConfidenceInputs['conflict_severity'],
): number {
  if (!has) return 0;
  switch (severity) {
    case 'critical': return 0.40;
    case 'material': return 0.20;
    case 'minor':    return 0.05;
    default:         return 0.05; // unknown severity but conflict acknowledged → minor
  }
}

function tierFor(score: number): FactConfidenceTier {
  if (score >= 0.9)  return 'CERTAIN';
  if (score >= 0.75) return 'HIGH';
  if (score >= 0.55) return 'MEDIUM';
  if (score >= 0.3)  return 'LOW';
  return 'SPECULATIVE';
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// =============================================================================
// Main scorer
// =============================================================================

export function computeFactConfidence(inputs: FactConfidenceInputs): FactConfidence {
  const decayReasons: string[] = [];
  const sources = Array.isArray(inputs.sources) ? inputs.sources : [];

  // 1) Source quality — pick the best plan-mapped source quality. Empty
  //    sources collapse to the most conservative tier ("inferred" / 0.35)
  //    and a decay reason is recorded.
  let bestSourceQuality: number;
  const sourceMappings: FactConfidence['source_mappings'] = [];
  if (sources.length === 0) {
    bestSourceQuality = SOURCE_QUALITY.inferred;
    decayReasons.push('no_sources_supplied: defaulting source_quality to "inferred" (0.35)');
  } else {
    let bestSeen = -Infinity;
    for (const s of sources) {
      const m = mapSourceTypeToPlan(s);
      sourceMappings.push(m);
      const q = SOURCE_QUALITY[m.plan_type];
      if (q > bestSeen) bestSeen = q;
    }
    bestSourceQuality = bestSeen;
  }

  // 2) Source count bonus (corroboration). Cap at 0.15.
  const sourceCountBonus = Math.min(0.15, Math.max(0, (sources.length - 1) * 0.05));

  // 3) Freshness penalty. Avg of sources.freshness_days; missing ⇒ neutral.
  let freshnessPenalty = 0;
  if (sources.length === 0) {
    decayReasons.push('no_sources_supplied: freshness_penalty=0 (cannot evaluate)');
  } else {
    const fresh = sources
      .map((s) => (typeof s.freshness_days === 'number' && Number.isFinite(s.freshness_days) ? s.freshness_days : null))
      .filter((n): n is number => n !== null);
    if (fresh.length === 0) {
      decayReasons.push('sources lack freshness_days: freshness_penalty=0 (cannot evaluate)');
    } else {
      const avg = fresh.reduce((a, b) => a + b, 0) / fresh.length;
      freshnessPenalty = freshnessPenaltyFor(avg);
    }
  }

  // 4) Conflict penalty. Default false → 0.
  const hasConflict = inputs.has_conflict === true;
  const conflictPenalty = conflictPenaltyFor(hasConflict, inputs.conflict_severity);
  if (hasConflict && !inputs.conflict_severity) {
    decayReasons.push('has_conflict=true but conflict_severity missing: defaulting to "minor" (0.05)');
  }

  // 5) Complexity penalty. Default 0 (verbatim).
  const complexity = (() => {
    const c = inputs.computation_complexity;
    if (c === undefined) return 0;
    if (c === 0 || c === 1 || c === 2 || c === 3) return c;
    decayReasons.push(`computation_complexity out of range (${c}); clamping to 0..3`);
    return Math.max(0, Math.min(3, Math.trunc(Number(c)))) as 0 | 1 | 2 | 3;
  })();
  const complexityPenalty = complexity * 0.05;

  // 6) Cross-agent agreement bonus. Default 1 (single source).
  const agreementCount = (() => {
    const n = inputs.cross_agent_agreement_count;
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 1) {
      if (n !== undefined) decayReasons.push(`cross_agent_agreement_count invalid (${n}); defaulting to 1`);
      return 1;
    }
    return Math.trunc(n);
  })();
  const agreementBonus = Math.min(0.10, Math.max(0, (agreementCount - 1) * 0.03));

  // Composite
  const raw = bestSourceQuality
    + sourceCountBonus
    - freshnessPenalty
    - conflictPenalty
    - complexityPenalty
    + agreementBonus;
  const score = round3(clamp01(raw));
  const tier = tierFor(score);

  const explanation = buildExplanation({
    tier, score, sources, sourceMappings,
    hasConflict, conflictSeverity: inputs.conflict_severity,
    complexity, agreementCount,
  });

  return {
    score,
    tier,
    components: {
      source_quality: round3(bestSourceQuality),
      source_count_bonus: round3(sourceCountBonus),
      freshness_penalty: round3(freshnessPenalty),
      conflict_penalty: round3(conflictPenalty),
      complexity_penalty: round3(complexityPenalty),
      agreement_bonus: round3(agreementBonus),
    },
    source_mappings: sourceMappings,
    explanation,
    decay_reasons: decayReasons,
  };
}

interface ExplanationInputs {
  tier: FactConfidenceTier;
  score: number;
  sources: ReadonlyArray<FactSource>;
  sourceMappings: FactConfidence['source_mappings'];
  hasConflict: boolean;
  conflictSeverity?: FactConfidenceInputs['conflict_severity'];
  complexity: number;
  agreementCount: number;
}

function buildExplanation(e: ExplanationInputs): string {
  const parts: string[] = [];
  parts.push(`${e.tier} (${(e.score * 100).toFixed(1)}%)`);
  parts.push(`${e.sources.length} source${e.sources.length === 1 ? '' : 's'}`);

  // Surface unique plan-mapped types in display order
  const uniqueTypes = Array.from(new Set(e.sourceMappings.map((m) => m.plan_type)));
  if (uniqueTypes.length > 0) parts.push(`type${uniqueTypes.length === 1 ? '' : 's'}: ${uniqueTypes.join(', ')}`);

  if (e.hasConflict) parts.push(`conflict: ${e.conflictSeverity ?? 'minor'}`);
  if (e.complexity > 0) parts.push(`complexity: ${e.complexity}/3`);
  if (e.agreementCount > 1) parts.push(`${e.agreementCount} agents agree`);
  return parts.join(' | ');
}
