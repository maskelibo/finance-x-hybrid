/**
 * Quality Budget + Final Publishable Score (Block P — Plan P2E Wave 1).
 *
 * Top-level aggregator that consumes the full Block P signal stack:
 *   - confidence (P1A)
 *   - lineage / methodology (P1B / P1C)
 *   - truth arbitration readiness (P1D)
 *   - contradictions (P2A)
 *   - structured QA rubric (P2B)
 *   - required-fact coverage (P2C)
 *   - citation gaps + hallucination detector (P2D)
 *
 * Produces:
 *   - components: per-signal scores 0..1
 *   - publishable_score: weighted aggregate 0..1
 *   - lifecycle_status: publishable / publishable_with_warnings / degraded / hold
 *   - blockers: list of hard-fail reasons (empty when status ≥ degraded)
 *
 * Strict invariants:
 *   - Wave 1 is read-only: no DB writes, no narrative deletion, no
 *     formatter mutation
 *   - Critical contradictions / critical citation gaps DEGRADE the
 *     status (cap at 'degraded') but never silently delete content
 *   - QA decision status='reject' → lifecycle 'hold'
 *   - Deterministic: same inputs → same status
 */

import { detectContradictions, type ContradictionReport } from './contradiction-engine.js';
import { detectCitationGaps, type CitationReport } from './citation-enforcement.js';
import { computeCoverageReport, type CoverageReport } from './coverage-engine.js';
import { computeAutoQARubric, type QADecision } from './qa-decision.js';
import { buildFactConfidenceSummary, type FactConfidenceSummary } from '../fact-layer/summary.js';
import { detectHallucinations, type HallucinationReport } from './hallucination-detector.js';

// =============================================================================
// Types
// =============================================================================

export type LifecycleStatus =
  | 'publishable'
  | 'publishable_with_warnings'
  | 'degraded'
  | 'hold';

export interface ComponentScore {
  name: string;
  score: number;        // 0..1
  weight: number;       // 0..1; sum across components = 1
  /** Optional human note for downstream UI / logs. */
  note?: string;
}

export interface QualityBudgetReport {
  session_id: string;
  publishable_score: number;        // 0..1
  lifecycle_status: LifecycleStatus;
  components: ComponentScore[];
  /** Hard-fail blockers (critical citation gaps, qa=reject, etc.). */
  blockers: string[];
  /** Soft warnings (material contradictions, low confidence, etc.). */
  warnings: string[];
  /** Embedded sub-reports for downstream consumption. */
  sub_reports: {
    confidence: FactConfidenceSummary;
    contradictions: ContradictionReport;
    coverage: CoverageReport;
    citation: CitationReport;
    qa: QADecision;
    hallucinations: HallucinationReport | null;  // optional — caller supplies text
  };
  generated_at: string;
}

export interface QualityBudgetOptions {
  /** Optional narrative text for hallucination scan. When omitted, the
   *  hallucinations sub-report is null and the component is skipped from
   *  the aggregate (weight redistributed). */
  narrative_text?: string;
}

// =============================================================================
// Weights (Wave 1 baseline; tweakable in P2E Wave 2)
// =============================================================================

const COMPONENT_WEIGHTS = {
  confidence:    0.20,
  consistency:   0.25,
  coverage:      0.20,
  citation:      0.15,
  qa:            0.15,
  hallucination: 0.05,  // when narrative_text supplied; else weight redistributed
} as const;

// Status thresholds. Critical findings (severity floor) override these.
const STATUS_THRESHOLDS = {
  publishable: 0.85,
  publishable_with_warnings: 0.65,
  degraded: 0.40,
} as const;

// =============================================================================
// Main entry
// =============================================================================

export function computeQualityBudget(
  sessionId: string,
  options: QualityBudgetOptions = {},
): QualityBudgetReport {
  const confidence = buildFactConfidenceSummary(sessionId);
  const contradictions = detectContradictions(sessionId);
  const coverage = computeCoverageReport(sessionId);
  const citation = detectCitationGaps(sessionId);
  const qa = computeAutoQARubric(sessionId);
  const hallucinations = options.narrative_text
    ? detectHallucinations(sessionId, options.narrative_text)
    : null;

  // Component scores
  const confidenceScore = confidence.scored_fact_count > 0
    ? confidence.avg_score
    : 1; // empty session → neutral
  const consistencyScore = contradictions.overall_consistency_score;
  const coverageScore = coverage.overall_coverage;
  const citationScore = citation.coverage_ratio;
  const qaScore = qa.overall_score;
  const hallucinationScore = hallucinations
    ? (hallucinations.total_claims_scanned > 0
        ? hallucinations.backed_claims / hallucinations.total_claims_scanned
        : 1)
    : null;

  // Build component list with effective weights
  const baseComponents: Array<Omit<ComponentScore, 'weight'> & { rawWeight: number; included: boolean }> = [
    { name: 'confidence',    score: round3(confidenceScore),   rawWeight: COMPONENT_WEIGHTS.confidence,    included: true,
      note: `${confidence.scored_fact_count} scored / ${confidence.fact_count} total facts; avg=${confidence.avg_score}` },
    { name: 'consistency',   score: round3(consistencyScore),  rawWeight: COMPONENT_WEIGHTS.consistency,   included: true,
      note: `${contradictions.total_conflicts} contradictions (crit=${contradictions.by_severity.critical}, mat=${contradictions.by_severity.material}, soft=${contradictions.by_severity.soft})` },
    { name: 'coverage',      score: round3(coverageScore),     rawWeight: COMPONENT_WEIGHTS.coverage,      included: true,
      note: `${coverage.total_present}/${coverage.total_required} required stems present` },
    { name: 'citation',      score: round3(citationScore),     rawWeight: COMPONENT_WEIGHTS.citation,      included: true,
      note: `${citation.facts_with_citation}/${citation.total_facts_with_lineage} facts cited (${citation.critical_gaps.length} critical gaps)` },
    { name: 'qa',            score: round3(qaScore),           rawWeight: COMPONENT_WEIGHTS.qa,            included: true,
      note: `qa_status=${qa.status}` },
    { name: 'hallucination', score: hallucinationScore != null ? round3(hallucinationScore) : 1,
      rawWeight: COMPONENT_WEIGHTS.hallucination, included: hallucinations !== null,
      note: hallucinations
        ? `${hallucinations.backed_claims}/${hallucinations.total_claims_scanned} claims backed`
        : 'no narrative supplied; component skipped' },
  ];

  // Renormalise weights over included components (skipped components
  // redistribute their weight proportionally).
  const totalIncludedRawWeight = baseComponents
    .filter((c) => c.included)
    .reduce((acc, c) => acc + c.rawWeight, 0);
  const components: ComponentScore[] = baseComponents.map((c) => ({
    name: c.name,
    score: c.score,
    weight: c.included && totalIncludedRawWeight > 0
      ? round3(c.rawWeight / totalIncludedRawWeight)
      : 0,
    note: c.note,
  }));

  // Aggregate publishable score
  const publishableScore = round3(
    components.reduce((acc, c) => acc + c.score * c.weight, 0),
  );

  // Hard-fail blockers
  const blockers: string[] = [];
  if (citation.critical_gaps.length > 0) {
    blockers.push(`${citation.critical_gaps.length} critical citation gap(s): ${citation.critical_gaps.slice(0, 3).map((g) => g.fact_key).join(', ')}`);
  }
  if (qa.status === 'reject') {
    blockers.push('qa_status=reject');
  }

  // Soft warnings
  const warnings: string[] = [];
  if (contradictions.by_severity.critical > 0) {
    warnings.push(`${contradictions.by_severity.critical} critical contradiction(s)`);
  }
  if (contradictions.by_severity.material > 0) {
    warnings.push(`${contradictions.by_severity.material} material contradiction(s)`);
  }
  if (citation.non_critical_gaps.length > 0) {
    warnings.push(`${citation.non_critical_gaps.length} non-critical citation gap(s)`);
  }
  if (coverage.overall_coverage < 0.5) {
    warnings.push(`coverage ${(coverage.overall_coverage * 100).toFixed(0)}% below 50%`);
  }
  if (confidence.scored_fact_count > 0 && confidence.low_confidence_keys.length > 0) {
    warnings.push(`${confidence.low_confidence_keys.length} fact(s) below 0.55 confidence`);
  }

  // Lifecycle status — score-driven, then degraded by hard floors
  let status = lifecycleFromScore(publishableScore);
  if (qa.status === 'reject') {
    status = 'hold';
  } else if (citation.critical_gaps.length > 0) {
    // Critical citation gap caps lifecycle at 'degraded' (publish blocked)
    status = downgradeToDegraded(status);
  } else if (contradictions.by_severity.critical > 0) {
    // Critical contradictions also cap at 'degraded'
    status = downgradeToDegraded(status);
  }

  return {
    session_id: sessionId,
    publishable_score: publishableScore,
    lifecycle_status: status,
    components,
    blockers,
    warnings,
    sub_reports: {
      confidence,
      contradictions,
      coverage,
      citation,
      qa,
      hallucinations,
    },
    generated_at: new Date().toISOString(),
  };
}

// =============================================================================
// Status mapping
// =============================================================================

function lifecycleFromScore(score: number): LifecycleStatus {
  if (score >= STATUS_THRESHOLDS.publishable) return 'publishable';
  if (score >= STATUS_THRESHOLDS.publishable_with_warnings) return 'publishable_with_warnings';
  if (score >= STATUS_THRESHOLDS.degraded) return 'degraded';
  return 'hold';
}

function downgradeToDegraded(status: LifecycleStatus): LifecycleStatus {
  if (status === 'hold') return 'hold'; // already lower
  return 'degraded';
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
