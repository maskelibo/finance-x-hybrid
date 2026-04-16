/**
 * qa_review adapter — rubric-based automatic quality checks.
 *
 * Ported from python-services/src/financex/calculators/qa_review.py.
 * Five deterministic dimensions scored on [0, 1] using the upstream
 * financial_analysis + reconciliation outputs already in
 * accumulatedContext. The LLM qa_review agent does more (report
 * integrity, narrative sandwich, Layer 1/2/3 section checks); the
 * Python subset is a rollback target for the deterministic rubric.
 */

export interface UpstreamFinancialAnalysis {
  ticker?: string;
  period_label?: string;
  sector?: string;
  highlights?: Array<{ code: string; narrative_hint?: string | null }>;
  metrics?: Array<{ code: string; narrative_hint?: string | null }>;
  red_flags?: Array<{ code: string; severity: string; message?: string }>;
  canonical_numbers?: Record<string, unknown>;
}

export interface UpstreamReconciliationCheck {
  code: string;
  passed: boolean;
}

export interface UpstreamReconciliation {
  ticker?: string;
  checks?: UpstreamReconciliationCheck[];
  check_results?: UpstreamReconciliationCheck[];
}


export interface DimensionScore {
  code: string;
  label: string;
  score: number;
  evidence: string;
}


export interface LegacyQaOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string;
  dimension_scores: DimensionScore[];
  quality_flags: string[];
  overall_score: number;
  overall_pass: boolean;
  qa_decision: 'pass' | 'conditional_pass' | 'fail';
  escalation_recommendation: 'none' | 'escalate_to_CEO' | 'deep_review_required';
  warnings: string[];
  review_status: string;
  source: 'python';
}


const PASS_THRESHOLD = 0.7;
const CONDITIONAL_THRESHOLD = 0.5;


function round2(x: number): number {
  return Math.round(x * 100) / 100;
}


// ---------- unwrap upstream JSON (supports string or object) ----------

function unwrap<T = unknown>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
}


export function extractFinancialAnalysis(upstream: unknown): UpstreamFinancialAnalysis | null {
  return unwrap<UpstreamFinancialAnalysis>(upstream);
}


export function extractReconciliation(upstream: unknown): UpstreamReconciliation | null {
  return unwrap<UpstreamReconciliation>(upstream);
}


// ---------- dimension scorers ----------

function evidenceSufficiency(fa: UpstreamFinancialAnalysis): DimensionScore {
  const numbers = fa.canonical_numbers ?? {};
  const total = Object.keys(numbers).length;
  const filled = Object.values(numbers).filter(v => v != null && v !== '').length;
  const score = total > 0 ? filled / total : 0;
  return {
    code: 'EVIDENCE_SUFFICIENCY',
    label: 'Canonical number coverage',
    score: round2(score),
    evidence: `${filled}/${total} canonical values populated`,
  };
}


function mathConsistency(rec: UpstreamReconciliation | null): DimensionScore {
  if (!rec) {
    return {
      code: 'MATH_CONSISTENCY',
      label: 'Reconciliation pass rate',
      score: 0,
      evidence: 'no reconciliation report supplied',
    };
  }
  const checks = rec.checks ?? rec.check_results ?? [];
  const total = checks.length;
  const passed = checks.filter(c => c.passed).length;
  const failedCodes = checks.filter(c => !c.passed).map(c => c.code);
  const score = total > 0 ? passed / total : 0;
  return {
    code: 'MATH_CONSISTENCY',
    label: 'Reconciliation pass rate',
    score: round2(score),
    evidence: total === 0
      ? 'no reconciliation checks to score'
      : `${passed}/${total} reconciliation checks passed. ${failedCodes.length ? `Failures: ${failedCodes.join(', ')}` : 'All clean.'}`,
  };
}


function completeness(fa: UpstreamFinancialAnalysis): DimensionScore {
  const sector = (fa.sector ?? 'industrial').toLowerCase();
  const required = sector === 'banking'
    ? new Set(['NIM', 'BANK_ROE', 'COST_TO_INCOME'])
    : new Set(['NET_MARGIN', 'ROE']);
  const highlights = fa.highlights ?? fa.metrics ?? [];
  const present = new Set<string>();
  for (const h of highlights) if (required.has(h.code)) present.add(h.code);
  const score = required.size > 0 ? present.size / required.size : 0;
  return {
    code: 'COMPLETENESS',
    label: 'Core highlights present',
    score: round2(score),
    evidence: `required=[${[...required].sort().join(',')}]; present=[${[...present].sort().join(',')}]`,
  };
}


function flagAcknowledgement(fa: UpstreamFinancialAnalysis): DimensionScore {
  const flags = fa.red_flags ?? [];
  const critical = flags.filter(f => (f.severity ?? '').toLowerCase() === 'critical');
  const hl = (fa.highlights ?? fa.metrics ?? []).length;
  if (critical.length === 0) {
    return {
      code: 'FLAG_ACKNOWLEDGEMENT',
      label: 'Critical flags surfaced',
      score: 1,
      evidence: 'no critical flags raised',
    };
  }
  if (hl > 0) {
    return {
      code: 'FLAG_ACKNOWLEDGEMENT',
      label: 'Critical flags surfaced',
      score: 1,
      evidence: `${critical.length} critical flag(s) present alongside narrative hooks`,
    };
  }
  return {
    code: 'FLAG_ACKNOWLEDGEMENT',
    label: 'Critical flags surfaced',
    score: 0,
    evidence: 'critical flags raised but no highlights — analyst may miss them',
  };
}


function narrativeCoverage(fa: UpstreamFinancialAnalysis): DimensionScore {
  const hl = fa.highlights ?? fa.metrics ?? [];
  if (hl.length === 0) {
    return {
      code: 'NARRATIVE_COVERAGE',
      label: 'Highlights carry narrative hints',
      score: 0,
      evidence: 'no highlights produced',
    };
  }
  const withHints = hl.filter(h => h.narrative_hint != null && String(h.narrative_hint).trim().length > 0).length;
  const score = withHints / hl.length;
  return {
    code: 'NARRATIVE_COVERAGE',
    label: 'Highlights carry narrative hints',
    score: round2(score),
    evidence: `${withHints}/${hl.length} highlights include a narrative hint`,
  };
}


// ---------- public entry point ----------

export function adaptQaReviewForLegacy(
  fa: UpstreamFinancialAnalysis | null,
  rec: UpstreamReconciliation | null,
  ticker: string,
  outputId: string,
): LegacyQaOutput {
  const warnings: string[] = [];
  if (!fa) {
    warnings.push('No financial_analysis output supplied — qa_review scoring cannot run');
    return {
      agent_id: 'qa_review',
      output_id: outputId,
      ticker: ticker.toUpperCase(),
      period_label: 'unknown',
      dimension_scores: [],
      quality_flags: ['NO_FINANCIAL_ANALYSIS — cannot score'],
      overall_score: 0,
      overall_pass: false,
      qa_decision: 'fail',
      escalation_recommendation: 'escalate_to_CEO',
      warnings,
      review_status: 'pending_ceo_review',
      source: 'python',
    };
  }

  const dimensions: DimensionScore[] = [
    evidenceSufficiency(fa),
    mathConsistency(rec),
    completeness(fa),
    flagAcknowledgement(fa),
    narrativeCoverage(fa),
  ];
  const overall = round2(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);

  const flags: string[] = [];
  for (const d of dimensions) {
    if (d.score < CONDITIONAL_THRESHOLD) {
      flags.push(`${d.code} below ${CONDITIONAL_THRESHOLD} — ${d.evidence}`);
    }
  }

  let decision: LegacyQaOutput['qa_decision'];
  let escalation: LegacyQaOutput['escalation_recommendation'];
  if (overall >= PASS_THRESHOLD) {
    decision = flags.length === 0 ? 'pass' : 'conditional_pass';
    escalation = 'none';
  } else if (overall >= CONDITIONAL_THRESHOLD) {
    decision = 'conditional_pass';
    escalation = 'escalate_to_CEO';
  } else {
    decision = 'fail';
    escalation = 'deep_review_required';
  }

  return {
    agent_id: 'qa_review',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    period_label: fa.period_label ?? 'unknown',
    dimension_scores: dimensions,
    quality_flags: flags,
    overall_score: overall,
    overall_pass: overall >= PASS_THRESHOLD,
    qa_decision: decision,
    escalation_recommendation: escalation,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
