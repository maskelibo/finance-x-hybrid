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

import { resolveSector } from './llm_fallback.js';

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
  is_blocker?: boolean;
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
  qa_decision: 'pass' | 'conditional_pass' | 'fail' | 'hard_fail';
  escalation_recommendation: 'none' | 'escalate_to_CEO' | 'deep_review_required' | 'block_publish';
  blocker_failures?: string[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


// Wave 2 (2026-04-28) — financial truth context. Adapter callers can
// supply what they know; missing fields receive mid-score 0.5 (not 0)
// to keep legacy callers from spurious hard-fails.
export interface QaTruthContext {
  multi_year_periods?: number;
  peer_count?: number;
  ownership_source?: 'kap_filing' | 'static_fallback' | 'context_extraction' | 'curated_pending_review' | string;
  ownership_age_days?: number;
  cfs_operating_cash_flow_parsed?: boolean;
  cfs_capex_parsed?: boolean;
  reconciliation_period?: string;
  english_residue_count?: number;
  estimate_judgment_rewrites?: number;
  // Phase E (2026-04-28) — visual coverage. Caller supplies the count
  // of "ready" charts (data-availability proxy). compose.ts has 13
  // distinct chart placeholders, all conditionally rendered. The QA
  // gate flags board-grade insufficiency when fewer than 6 are ready.
  charts_ready_count?: number;
  charts_total_count?: number;
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
      label: 'Reconciliation pass rate (excluding skipped)',
      score: 0,
      evidence: 'no reconciliation report supplied',
    };
  }
  // Wave 2 (2026-04-28) — distinguish truly_passed from skipped.
  // Old behaviour treated `passed=True (skipped: totals are zero)` as a
  // pass, creating the "7/7 passed when 7 were skipped" false positive.
  const checks = rec.checks ?? rec.check_results ?? [];
  const total = checks.length;
  const isSkipped = (c: { passed?: boolean | null; message?: string | null }): boolean =>
    Boolean(c.passed) && /^skipped\b/i.test(String(c.message ?? ''));
  const truly_passed = checks.filter((c) => Boolean(c.passed) && !isSkipped(c)).length;
  const skipped = checks.filter(isSkipped).length;
  const failedCodes = checks.filter((c) => !c.passed).map((c) => c.code);
  const real_total = total - skipped;
  const score = real_total > 0 ? truly_passed / real_total : 0;
  return {
    code: 'MATH_CONSISTENCY',
    label: 'Reconciliation pass rate (excluding skipped)',
    score: round2(score),
    evidence: total === 0
      ? 'no reconciliation checks to score'
      : `${truly_passed}/${real_total} truly passed; ${skipped} skipped (data missing); ${failedCodes.length ? `failures: ${failedCodes.join(', ')}` : 'no real failures'}`,
  };
}


function completeness(fa: UpstreamFinancialAnalysis, sectorOverride?: string): DimensionScore {
  const sector = (sectorOverride ?? fa.sector ?? 'industrial').toLowerCase();
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


// ---------- Wave 2 truth dimension scorers ----------

function multiYearCoverage(ctx: QaTruthContext | undefined): DimensionScore {
  const n = ctx?.multi_year_periods;
  if (n == null) {
    return {
      code: 'MULTI_YEAR_COVERAGE',
      label: 'Multi-year FY coverage',
      score: 0.5,
      evidence: 'multi_year_periods not supplied — uncertain',
    };
  }
  const score = n >= 5 ? 1 : n >= 3 ? 0.7 : 0;
  return {
    code: 'MULTI_YEAR_COVERAGE',
    label: 'Multi-year FY coverage',
    score: round2(score),
    evidence: `${n} FY period(s) with revenue available`,
    is_blocker: n < 3,
  };
}

function peerCountSufficient(ctx: QaTruthContext | undefined): DimensionScore {
  const n = ctx?.peer_count;
  if (n == null) {
    return {
      code: 'PEER_COUNT_SUFFICIENT',
      label: 'Peer benchmark count',
      score: 0.5,
      evidence: 'peer_count not supplied — uncertain',
    };
  }
  const score = n >= 4 ? 1 : n >= 3 ? 0.6 : 0;
  return {
    code: 'PEER_COUNT_SUFFICIENT',
    label: 'Peer benchmark count',
    score: round2(score),
    evidence: `peer_count=${n} — ${n >= 3 ? 'sufficient' : 'insufficient (need ≥3)'}`,
    is_blocker: n === 0,
  };
}

function ownershipFreshness(ctx: QaTruthContext | undefined): DimensionScore {
  const src = ctx?.ownership_source;
  const age = ctx?.ownership_age_days;
  if (src == null) {
    return {
      code: 'OWNERSHIP_FRESHNESS',
      label: 'Ownership data freshness',
      score: 0.5,
      evidence: 'ownership_source not supplied — uncertain',
    };
  }
  if (src === 'kap_filing' || src === 'context_extraction') {
    if (age == null || age <= 90) {
      return {
        code: 'OWNERSHIP_FRESHNESS',
        label: 'Ownership data freshness',
        score: 1,
        evidence: `sourced from ${src}, age=${age ?? 'unknown'} days`,
      };
    }
    return {
      code: 'OWNERSHIP_FRESHNESS',
      label: 'Ownership data freshness',
      score: 0.4,
      evidence: `${src} but stale (age=${age} days > 90)`,
    };
  }
  // Phase I (2026-04-29) — third tier between operator-verified and
  // hardcoded fallback. A YAML config under config/ownership/<TICKER>.yaml
  // with verification_status='auto_curated_pending_operator_review' is
  // materially better than the legacy compose hardcoded lookup: it
  // carries explicit source attribution + as_of_date + a structured
  // shareholders list. The board reader sees an honest "Operatör
  // İncelemesi Bekliyor" banner; QA flags the dim as conditional but
  // does NOT hard-fail. Operator can flip to 'operator_verified' to
  // graduate to score=1.0.
  if (src === 'curated_pending_review') {
    if (age == null || age <= 180) {
      return {
        code: 'OWNERSHIP_FRESHNESS',
        label: 'Ownership data freshness',
        score: 0.5,
        evidence: `curated YAML pending operator review, age=${age ?? 'unknown'} days — conditional (not blocker)`,
      };
    }
    return {
      code: 'OWNERSHIP_FRESHNESS',
      label: 'Ownership data freshness',
      score: 0.3,
      evidence: `curated YAML stale (age=${age} days > 180) and not operator-verified`,
    };
  }
  return {
    code: 'OWNERSHIP_FRESHNESS',
    label: 'Ownership data freshness',
    score: 0,
    evidence: `source='${src}' — static fallback; not board-grade`,
    is_blocker: true,
  };
}

function cfsParsedNotEstimated(ctx: QaTruthContext | undefined): DimensionScore {
  const ocf = ctx?.cfs_operating_cash_flow_parsed;
  const capex = ctx?.cfs_capex_parsed;
  if (ocf == null && capex == null) {
    return {
      code: 'CFS_PARSED_NOT_ESTIMATED',
      label: 'Cash flow statement parsed',
      score: 0.5,
      evidence: 'cfs_*_parsed not supplied — uncertain',
    };
  }
  if (ocf && capex) {
    return {
      code: 'CFS_PARSED_NOT_ESTIMATED',
      label: 'Cash flow statement parsed',
      score: 1,
      evidence: 'OCF + CAPEX both parsed from source filing',
    };
  }
  if (ocf || capex) {
    return {
      code: 'CFS_PARSED_NOT_ESTIMATED',
      label: 'Cash flow statement parsed',
      score: 0.5,
      evidence: `partial: ocf_parsed=${ocf}, capex_parsed=${capex} — derived metrics will be incomplete`,
      is_blocker: true,
    };
  }
  return {
    code: 'CFS_PARSED_NOT_ESTIMATED',
    label: 'Cash flow statement parsed',
    score: 0,
    evidence: 'OCF + CAPEX not parsed — board-grade CFS analysis impossible',
    is_blocker: true,
  };
}

function periodConsistency(fa: UpstreamFinancialAnalysis, ctx: QaTruthContext | undefined): DimensionScore {
  const recPeriod = ctx?.reconciliation_period;
  if (recPeriod == null) {
    return {
      code: 'PERIOD_CONSISTENCY',
      label: 'Period label consistency',
      score: 0.5,
      evidence: 'reconciliation_period not supplied — uncertain',
    };
  }
  if (String(recPeriod) === String(fa.period_label)) {
    return {
      code: 'PERIOD_CONSISTENCY',
      label: 'Period label consistency',
      score: 1,
      evidence: `FA + reconciliation both '${fa.period_label}'`,
    };
  }
  return {
    code: 'PERIOD_CONSISTENCY',
    label: 'Period label consistency',
    score: 0,
    evidence: `mismatch: FA='${fa.period_label}' vs reconciliation='${recPeriod}'`,
    is_blocker: true,
  };
}

function visualCoverage(ctx: QaTruthContext | undefined): DimensionScore {
  const ready = ctx?.charts_ready_count;
  const total = ctx?.charts_total_count ?? 13;
  if (ready == null) {
    return {
      code: 'VISUAL_COVERAGE',
      label: 'Visual coverage (charts ready)',
      score: 0.5,
      evidence: 'charts_ready_count not supplied — uncertain',
    };
  }
  const ratio = total > 0 ? ready / total : 0;
  let score: number;
  if (ratio >= 0.75) score = 1;
  else if (ratio >= 0.55) score = 0.7;
  else if (ratio >= 0.4) score = 0.5;
  else score = 0;
  return {
    code: 'VISUAL_COVERAGE',
    label: 'Visual coverage (charts ready)',
    score: round2(score),
    evidence: `${ready}/${total} charts data-ready (${(ratio * 100).toFixed(0)}%)`,
    is_blocker: ready < 4,
  };
}

function languagePurity(ctx: QaTruthContext | undefined): DimensionScore {
  const residue = ctx?.english_residue_count;
  const rewrites = ctx?.estimate_judgment_rewrites;
  if (residue == null && rewrites == null) {
    return {
      code: 'LANGUAGE_PURITY',
      label: 'Language purity',
      score: 0.5,
      evidence: 'language metrics not supplied — uncertain',
    };
  }
  const residueClean = residue == null || residue === 0;
  const rewritesClean = rewrites == null || rewrites === 0;
  if (residueClean && rewritesClean) {
    return {
      code: 'LANGUAGE_PURITY',
      label: 'Language purity',
      score: 1,
      evidence: `english_residue=${residue ?? 0}, estimate_judgment_rewrites=${rewrites ?? 0} — clean`,
    };
  }
  const score = (residue ?? 0) <= 3 ? 0.3 : 0;
  return {
    code: 'LANGUAGE_PURITY',
    label: 'Language purity',
    score,
    evidence: `english_residue=${residue ?? 'n/a'}, estimate_judgment_rewrites=${rewrites ?? 'n/a'}`,
    is_blocker: (residue != null && residue > 5),
  };
}


// ---------- public entry point ----------

export function adaptQaReviewForLegacy(
  fa: UpstreamFinancialAnalysis | null,
  rec: UpstreamReconciliation | null,
  ticker: string,
  outputId: string,
  opts: { llmMarkdownSource?: string | null; truthContext?: QaTruthContext } = {},
): LegacyQaOutput {
  const warnings: string[] = [];
  const sectorResolution = resolveSector({
    structuredSector: fa?.sector ?? null,
    markdownSource: opts.llmMarkdownSource ?? null,
    ticker,
  });
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

  const ctx = opts.truthContext;
  const dimensions: DimensionScore[] = [
    // Legacy 5
    evidenceSufficiency(fa),
    mathConsistency(rec),
    completeness(fa, sectorResolution.sector),
    flagAcknowledgement(fa),
    narrativeCoverage(fa),
    // Wave 2 truth (6)
    multiYearCoverage(ctx),
    peerCountSufficient(ctx),
    ownershipFreshness(ctx),
    cfsParsedNotEstimated(ctx),
    periodConsistency(fa, ctx),
    languagePurity(ctx),
    // Phase E truth (1) — visual coverage
    visualCoverage(ctx),
  ];
  const overall = round2(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);

  const flags: string[] = [];
  for (const d of dimensions) {
    if (d.score < CONDITIONAL_THRESHOLD) {
      flags.push(`${d.code} below ${CONDITIONAL_THRESHOLD} — ${d.evidence}`);
    }
  }

  // Wave 2 hard-fail: any blocker dim with score == 0 → hard_fail.
  const blockerFailures = dimensions
    .filter((d) => d.is_blocker && d.score === 0)
    .map((d) => d.code);

  let decision: LegacyQaOutput['qa_decision'];
  let escalation: LegacyQaOutput['escalation_recommendation'];
  let overallPass = false;
  if (blockerFailures.length > 0) {
    decision = 'hard_fail';
    escalation = 'block_publish';
    overallPass = false;
  } else if (overall >= PASS_THRESHOLD) {
    decision = flags.length === 0 ? 'pass' : 'conditional_pass';
    escalation = 'none';
    overallPass = true;
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
    overall_pass: overallPass,
    qa_decision: decision,
    escalation_recommendation: escalation,
    blocker_failures: blockerFailures.length > 0 ? blockerFailures : undefined,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
