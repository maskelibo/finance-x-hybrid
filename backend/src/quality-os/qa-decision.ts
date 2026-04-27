/**
 * Structured QA Decision (Block P — Plan P2B Wave 1).
 *
 * JSON-schema decision shape + deterministic auto-rubric. Wave 1 ships:
 *   - QADecision type with strict validator
 *   - parseQADecisionFromText: best-effort JSON-extract from free-text
 *     qa_review output (mirrors runner.parseLooseJson loose-parse rules)
 *   - computeAutoQARubric(sessionId): pure deterministic rubric assembled
 *     from fact-layer signals (confidence summary + contradiction engine)
 *   - requestTargetedRevision: structured revision request that NEVER
 *     instructs deletion of analytical narrative
 *
 * Strict invariants:
 *   - schema-driven: every QADecision must pass validateQADecision
 *   - non-destructive: revision requests carry scope + reason + must_not_delete
 *   - deterministic auto-rubric: same inputs → same scores
 */

import { detectContradictions } from './contradiction-engine.js';
import { buildFactConfidenceSummary } from '../fact-layer/summary.js';

// =============================================================================
// JSON schema-equivalent types
// =============================================================================

export type QADecisionStatus = 'pass' | 'pass_with_warnings' | 'revision_required' | 'reject';

export interface QAComponentScore {
  name: string;
  score: number;          // 0..1
  /** Optional human-readable note. Never directives like "delete X". */
  note?: string;
}

export interface QARevisionRequest {
  /** What to revise. */
  scope: string;
  /** Why a revision is needed. */
  reason: string;
  /** Must always be true — narrative deletion is forbidden by design. */
  must_not_delete: true;
  /** Optional pointer (fact_key / section title) for targeted handling. */
  target_ref?: string;
}

export interface QADecision {
  session_id: string;
  status: QADecisionStatus;
  /** 0..1 aggregate of component scores. */
  overall_score: number;
  components: QAComponentScore[];
  warnings: string[];
  revision_requests: QARevisionRequest[];
  decided_at: string;
}

// =============================================================================
// Validation
// =============================================================================

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const ALLOWED_STATUSES = new Set<QADecisionStatus>(['pass', 'pass_with_warnings', 'revision_required', 'reject']);

export function validateQADecision(value: unknown): ValidationResult {
  const errors: string[] = [];
  const v = value as Record<string, unknown> | null;
  if (!v || typeof v !== 'object') {
    return { ok: false, errors: ['value is not an object'] };
  }
  if (typeof v.session_id !== 'string' || v.session_id.length === 0) errors.push('session_id missing or empty');
  if (typeof v.status !== 'string' || !ALLOWED_STATUSES.has(v.status as QADecisionStatus)) errors.push(`status invalid (${v.status})`);
  if (typeof v.overall_score !== 'number' || !Number.isFinite(v.overall_score) || v.overall_score < 0 || v.overall_score > 1) errors.push('overall_score must be 0..1');
  if (!Array.isArray(v.components)) {
    errors.push('components must be array');
  } else {
    for (let i = 0; i < v.components.length; i++) {
      const c = v.components[i] as Record<string, unknown>;
      if (typeof c.name !== 'string') errors.push(`components[${i}].name not string`);
      if (typeof c.score !== 'number' || !Number.isFinite(c.score) || c.score < 0 || c.score > 1) errors.push(`components[${i}].score must be 0..1`);
    }
  }
  if (!Array.isArray(v.warnings)) errors.push('warnings must be array');
  if (!Array.isArray(v.revision_requests)) {
    errors.push('revision_requests must be array');
  } else {
    for (let i = 0; i < v.revision_requests.length; i++) {
      const r = v.revision_requests[i] as Record<string, unknown>;
      if (typeof r.scope !== 'string' || r.scope.length === 0) errors.push(`revision_requests[${i}].scope missing`);
      if (typeof r.reason !== 'string' || r.reason.length === 0) errors.push(`revision_requests[${i}].reason missing`);
      if (r.must_not_delete !== true) errors.push(`revision_requests[${i}].must_not_delete must be true`);
    }
  }
  if (typeof v.decided_at !== 'string') errors.push('decided_at must be string');
  return { ok: errors.length === 0, errors };
}

// =============================================================================
// Best-effort parse from free-text QA output
// =============================================================================

/**
 * Extract a QADecision JSON object from free-text qa_review output.
 * Recovers from LLM preambles / trailing prose by taking the longest
 * brace-bounded slice (mirrors runner.parseLooseJson). Returns null on
 * parse failure or schema mismatch.
 */
export function parseQADecisionFromText(text: string): QADecision | null {
  if (typeof text !== 'string' || !text.trim()) return null;
  const trimmed = text.trim();
  let candidate: unknown;
  try { candidate = JSON.parse(trimmed); } catch {
    const a = trimmed.indexOf('{');
    const b = trimmed.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { candidate = JSON.parse(trimmed.slice(a, b + 1)); } catch { return null; }
  }
  const v = validateQADecision(candidate);
  return v.ok ? candidate as QADecision : null;
}

// =============================================================================
// Targeted revision request — structured, non-destructive
// =============================================================================

export function requestTargetedRevision(
  scope: string,
  reason: string,
  target_ref?: string,
): QARevisionRequest {
  return {
    scope,
    reason,
    must_not_delete: true,
    ...(target_ref ? { target_ref } : {}),
  };
}

// =============================================================================
// Deterministic auto-rubric
// =============================================================================

const STATUS_THRESHOLDS = {
  pass: 0.85,
  pass_with_warnings: 0.65,
  revision_required: 0.40,
  // < 0.40 → reject
} as const;

/**
 * Build a deterministic QADecision by reading existing fact-layer signals.
 * Wave 1 components:
 *   - confidence_floor: 1 - (low_confidence_count / scored_count); 1.0 when none low
 *   - consistency: contradiction-engine overall_consistency_score
 *   - traced_coverage: scored_fact_count / fact_count (0 when no facts)
 *   - dispute_index: 1 - (disputed_count / fact_count)
 *
 * Wave 1 emits no revision_requests automatically — those come from a
 * future P2B Wave 2 (LLM-side QA agent integration). Auto-rubric only
 * surfaces warnings.
 */
export function computeAutoQARubric(sessionId: string): QADecision {
  const summary = buildFactConfidenceSummary(sessionId);
  const contra = detectContradictions(sessionId);

  const scored = summary.scored_fact_count;
  const total = summary.fact_count;
  const lowCount = summary.low_confidence_keys.length;
  const disputed = contra.conflicts.length;

  const confidenceFloor = scored > 0 ? clamp01(1 - lowCount / scored) : 1;
  const consistency = clamp01(contra.overall_consistency_score);
  const tracedCoverage = total > 0 ? clamp01(scored / total) : 1;
  const disputeIndex = total > 0 ? clamp01(1 - disputed / total) : 1;

  const components: QAComponentScore[] = [
    { name: 'confidence_floor', score: round3(confidenceFloor), note: `${lowCount}/${scored} facts below 0.55 confidence` },
    { name: 'consistency',      score: round3(consistency),      note: `${contra.total_conflicts} contradictions (${contra.by_severity.critical} critical / ${contra.by_severity.material} material / ${contra.by_severity.soft} soft)` },
    { name: 'traced_coverage',  score: round3(tracedCoverage),   note: `${scored}/${total} facts have lineage trace` },
    { name: 'dispute_index',    score: round3(disputeIndex),     note: `${disputed} disputed fact_keys` },
  ];

  // Aggregate: simple unweighted mean.
  const overall = components.length > 0
    ? round3(components.reduce((acc, c) => acc + c.score, 0) / components.length)
    : 0;

  const status = statusFor(overall);

  const warnings: string[] = [];
  if (contra.by_severity.critical > 0) warnings.push(`${contra.by_severity.critical} critical contradiction(s) detected`);
  if (lowCount > 0) warnings.push(`${lowCount} fact(s) below 0.55 confidence`);
  if (total === 0) warnings.push('no facts extracted — pipeline preflight check recommended');

  return {
    session_id: sessionId,
    status,
    overall_score: overall,
    components,
    warnings,
    revision_requests: [],   // Wave 1 emits empty; LLM-side QA fills these
    decided_at: new Date().toISOString(),
  };
}

function statusFor(score: number): QADecisionStatus {
  if (score >= STATUS_THRESHOLDS.pass) return 'pass';
  if (score >= STATUS_THRESHOLDS.pass_with_warnings) return 'pass_with_warnings';
  if (score >= STATUS_THRESHOLDS.revision_required) return 'revision_required';
  return 'reject';
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
