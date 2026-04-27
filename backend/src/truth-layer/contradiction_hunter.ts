/**
 * Financial Truth Layer — Contradiction Hunter (P3.alpha v1).
 *
 * Pure deterministic detector layer. Reads structured agent outputs from
 * accumulatedContext and emits a list of cross-agent inconsistencies that
 * a human reviewer (or chairman reading the report) would flag.
 *
 * Design rules (per scope, P3.alpha):
 *   - additive only: never mutates upstream agent outputs
 *   - no schema break: only adds two optional context keys
 *   - no LLM calls: pure structured-field comparison
 *   - no narrative parsing: final_summary LLM text is NOT inspected
 *   - false-positive averse: every detector has a guarded no-op fallback
 *   - high severity is hard to reach by design (boardroom-grade restraint)
 *
 * Public API:
 *   runContradictionHunter(ticker, ctx) — main entry, returns ContradictionReport
 *   logContradictionSummary(report)     — orchestrator console pretty-print
 *
 * Output is written to ctx['contradiction_report'] + ctx[
 * 'contradiction_report_json']; downstream agents that don't read these
 * keys are unaffected (zero-blast-radius observability).
 */

import { createHash } from 'node:crypto';
import { assertMethodologyAlignment } from './preflight.js';

// =============================================================================
// Types
// =============================================================================

export type ContradictionSeverity = 'low' | 'medium' | 'high';

export type ContradictionType =
  | 'valuation_method_mismatch'
  | 'target_spread'
  | 'thesis_vs_valuation'
  | 'confidence_vs_conviction'
  | 'financial_red_flag_vs_narrative'
  | 'synthesis_divergence';

export interface ContradictionFinding {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  title: string;
  evidence: Record<string, unknown>;
  reasoning: string;
  suggested_resolution: string | null;
}

export interface ContradictionReport {
  ticker: string;
  generated_at: string;
  finding_count: number;
  by_severity: { high: number; medium: number; low: number };
  findings: ContradictionFinding[];
  detectors_run: string[];
  detectors_skipped: Array<{ detector: string; reason: string }>;
}

export const CONTRADICTION_CONTEXT_KEYS = {
  REPORT: 'contradiction_report',
  REPORT_JSON: 'contradiction_report_json',
} as const;

// =============================================================================
// Helpers
// =============================================================================

function findingId(ticker: string, type: ContradictionType, key: string): string {
  const h = createHash('sha1').update(`${ticker}|${type}|${key}`).digest('hex').slice(0, 10);
  return `cf-${h}`;
}

function parseJsonLoose(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed) as Record<string, unknown>; } catch { /* fall through */ }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1]) as Record<string, unknown>; } catch { /* swallow */ }
  }
  return null;
}

function asFiniteNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// =============================================================================
// Detector results (internal)
// =============================================================================

type DetectorResult =
  | { kind: 'finding'; finding: ContradictionFinding }
  | { kind: 'multi'; findings: ContradictionFinding[] }
  | { kind: 'skip'; reason: string };

// =============================================================================
// Detector 1 — valuation_method_mismatch
// =============================================================================

function detectValuationMethodMismatch(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const valuation = parseJsonLoose(ctx['valuation_agent_output']);
  if (!valuation) return { kind: 'skip', reason: 'no valuation_agent_output' };

  // Best-effort extraction — common field names across legacy/hybrid shapes
  const chosen = pickFirstString(valuation, [
    'primary_method', 'recommended_method', 'methodology', 'method',
  ]);
  if (!chosen) return { kind: 'skip', reason: 'no chosen method extractable' };

  const alignment = assertMethodologyAlignment(ctx, chosen);
  if (!alignment) return { kind: 'skip', reason: 'no truth_assertions populated' };
  if (alignment.aligned) return { kind: 'skip', reason: 'aligned with FTL primary' };

  return {
    kind: 'finding',
    finding: {
      id: findingId(ticker, 'valuation_method_mismatch', `${alignment.expected_method}-${alignment.chosen_method}`),
      type: 'valuation_method_mismatch',
      severity: alignment.severity === 'none' ? 'low' : alignment.severity,
      title: `Valuation method mismatch — chose ${alignment.chosen_method}, FTL recommends ${alignment.expected_method}`,
      evidence: {
        chosen_method: alignment.chosen_method,
        ftl_primary_method: alignment.expected_method,
        ftl_classification: alignment.classification_label,
        ftl_confidence: alignment.ftl_confidence,
        guard_severity_downgraded: alignment.severity_downgraded,
      },
      reasoning: alignment.reasoning,
      suggested_resolution:
        `Reconcile valuation narrative to either honor FTL primary (${alignment.expected_method}) or ` +
        `explicitly justify deviation in the report.`,
    },
  };
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function pickFirstNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = asFiniteNumber(obj[k]);
    if (n !== null) return n;
  }
  return null;
}

// =============================================================================
// Detector 2 — target_spread (DCF vs SOTP)
// =============================================================================

function detectTargetSpread(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const valuation = parseJsonLoose(ctx['valuation_agent_output']);
  if (!valuation) return { kind: 'skip', reason: 'no valuation_agent_output' };

  const dcf = pickFirstNumber(valuation, ['dcf_target_try', 'dcf_target', 'dcf_implied_price', 'dcf_fair_value']);
  const sotp = pickFirstNumber(valuation, ['sotp_target_try', 'sotp_target', 'sotp_implied_price', 'sotp_nav_per_share']);

  if (dcf === null || sotp === null) {
    return { kind: 'skip', reason: 'no structured DCF and SOTP targets' };
  }
  const denom = Math.max(Math.abs(dcf), Math.abs(sotp));
  if (denom === 0) return { kind: 'skip', reason: 'zero target denominator' };

  const spread = Math.abs(dcf - sotp) / denom;
  if (spread < 0.15) return { kind: 'skip', reason: `spread ${spread.toFixed(3)} below 0.15 threshold` };

  let severity: ContradictionSeverity;
  if (spread >= 0.30) severity = 'high';
  else if (spread >= 0.20) severity = 'medium';
  else severity = 'low';

  return {
    kind: 'finding',
    finding: {
      id: findingId(ticker, 'target_spread', `${dcf.toFixed(2)}-${sotp.toFixed(2)}`),
      type: 'target_spread',
      severity,
      title: `DCF vs SOTP target spread ${(spread * 100).toFixed(1)}% — reconciliation gap`,
      evidence: { dcf_target: dcf, sotp_target: sotp, spread_ratio: spread },
      reasoning:
        `DCF target=${dcf.toFixed(2)} vs SOTP target=${sotp.toFixed(2)} differ by ${(spread * 100).toFixed(1)}% ` +
        `(threshold 15%). Boardroom expects an explicit reconciliation note when methods diverge this much.`,
      suggested_resolution:
        'Add a "method reconciliation" paragraph explaining why DCF and SOTP imply different fair values.',
    },
  };
}

// =============================================================================
// Detector 3 — thesis_vs_valuation
// =============================================================================
//
// v1 deterministic — only fires when BOTH a structured upside% and a
// structured recommendation are exposed by the valuation agent. final_
// summary narrative is NOT parsed in v1.

function detectThesisVsValuation(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const valuation = parseJsonLoose(ctx['valuation_agent_output']);
  if (!valuation) return { kind: 'skip', reason: 'no valuation_agent_output' };

  const recommendation = pickFirstString(valuation, [
    'recommendation', 'rating', 'investment_recommendation', 'investment_rating',
  ]);
  const upsidePct = pickFirstNumber(valuation, ['upside_pct', 'implied_upside_pct', 'expected_return_pct']);

  if (!recommendation || upsidePct === null) {
    return { kind: 'skip', reason: 'no structured recommendation+upside pair' };
  }

  const recLower = recommendation.toLowerCase();
  const isBuySignal = /\b(buy|strong[\s_-]?buy|outperform|al)\b/.test(recLower);
  const isSellSignal = /\b(sell|underperform|sat)\b/.test(recLower);

  // BUY but small/negative upside
  if (isBuySignal && upsidePct < 5) {
    const severity: ContradictionSeverity = upsidePct < 0 ? 'high' : upsidePct < 2 ? 'medium' : 'low';
    return {
      kind: 'finding',
      finding: {
        id: findingId(ticker, 'thesis_vs_valuation', `buy-${upsidePct.toFixed(2)}`),
        type: 'thesis_vs_valuation',
        severity,
        title: `BUY-style recommendation with only ${upsidePct.toFixed(1)}% implied upside`,
        evidence: { recommendation, upside_pct: upsidePct },
        reasoning:
          `Recommendation '${recommendation}' implies upside conviction, but valuation upside is ${upsidePct.toFixed(1)}% ` +
          `(below 5% threshold). Thesis and price target are out of sync.`,
        suggested_resolution:
          'Either soften recommendation to HOLD, raise target, or document why upside understates conviction (e.g., dividend yield, optionality).',
      },
    };
  }
  // SELL but large positive upside
  if (isSellSignal && upsidePct > 25) {
    const severity: ContradictionSeverity = upsidePct > 50 ? 'high' : 'medium';
    return {
      kind: 'finding',
      finding: {
        id: findingId(ticker, 'thesis_vs_valuation', `sell-${upsidePct.toFixed(2)}`),
        type: 'thesis_vs_valuation',
        severity,
        title: `SELL-style recommendation with ${upsidePct.toFixed(1)}% positive upside`,
        evidence: { recommendation, upside_pct: upsidePct },
        reasoning:
          `Recommendation '${recommendation}' implies negative conviction, but valuation upside is ${upsidePct.toFixed(1)}% ` +
          `(above 25% threshold). Thesis and price target are out of sync.`,
        suggested_resolution:
          'Reconcile by lowering target, upgrading recommendation, or surfacing the structural risk that overrides quantitative upside.',
      },
    };
  }

  return { kind: 'skip', reason: 'recommendation/upside pair within tolerance' };
}

// =============================================================================
// Detector 4 — confidence_vs_conviction
// =============================================================================

function detectConfidenceVsConviction(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const fa = parseJsonLoose(ctx['financial_analysis_output']);
  const synth = parseJsonLoose(ctx['strategic_synthesis_output']);
  if (!fa) return { kind: 'skip', reason: 'no financial_analysis_output' };
  if (!synth) return { kind: 'skip', reason: 'no strategic_synthesis_output' };

  const faConfidence = String(fa['confidence'] ?? '').toLowerCase();
  const synthConfidence = String(synth['confidence'] ?? '').toLowerCase();
  const convergenceScore = asFiniteNumber(synth['convergence_score']);

  if (faConfidence !== 'low') {
    return { kind: 'skip', reason: `FA confidence='${faConfidence || '<missing>'}', not low` };
  }
  if (synthConfidence !== 'high') {
    return { kind: 'skip', reason: `synthesis confidence='${synthConfidence || '<missing>'}', not high` };
  }
  if (convergenceScore === null || Math.abs(convergenceScore) < 0.5) {
    return { kind: 'skip', reason: `convergence_score=${convergenceScore} below |0.5| threshold` };
  }

  return {
    kind: 'finding',
    finding: {
      id: findingId(ticker, 'confidence_vs_conviction', `${faConfidence}-${synthConfidence}-${convergenceScore.toFixed(2)}`),
      type: 'confidence_vs_conviction',
      severity: 'high',
      title: `FA confidence=low but synthesis is high-conviction (score=${convergenceScore.toFixed(2)})`,
      evidence: {
        fa_confidence: faConfidence,
        synthesis_confidence: synthConfidence,
        convergence_score: convergenceScore,
      },
      reasoning:
        `Financial analysis flagged its own output as low-confidence, yet strategic synthesis declares high ` +
        `conviction with convergence_score=${convergenceScore.toFixed(2)}. The thesis is built on data the ` +
        `data agent itself does not trust.`,
      suggested_resolution:
        'Either downgrade synthesis confidence to medium, or add a methodology note explaining why directional signal survives despite FA caveats.',
    },
  };
}

// =============================================================================
// Detector 5 — financial_red_flag_vs_narrative (TIGHTENED v1)
// =============================================================================
//
// Per scope tightening: HIGH severity must be hard to reach. v1 thresholds:
//   - HIGH only when ≥3 critical flags AND convergence_score ≥ 0.5
//   - MEDIUM when 2 critical flags AND score ≥ 0.4
//   - LOW when 1 critical flag AND score ≥ 0.3
//   - asymmetric (zero criticals + very negative synth) → MEDIUM ceiling
//
// Detector skips if either FA or synthesis structured output is absent.

function detectFinancialRedFlagVsNarrative(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const fa = parseJsonLoose(ctx['financial_analysis_output']);
  const synth = parseJsonLoose(ctx['strategic_synthesis_output']);
  if (!fa) return { kind: 'skip', reason: 'no financial_analysis_output' };
  if (!synth) return { kind: 'skip', reason: 'no strategic_synthesis_output' };

  const criticalCount = asFiniteNumber(fa['critical_flag_count']) ?? 0;
  const score = asFiniteNumber(synth['convergence_score']);
  if (score === null) return { kind: 'skip', reason: 'no convergence_score' };

  // Positive synthesis ignoring critical flags
  if (criticalCount >= 1 && score >= 0.3) {
    let severity: ContradictionSeverity;
    if (criticalCount >= 3 && score >= 0.5) severity = 'high';
    else if (criticalCount >= 2 && score >= 0.4) severity = 'medium';
    else severity = 'low';
    return {
      kind: 'finding',
      finding: {
        id: findingId(ticker, 'financial_red_flag_vs_narrative', `pos-${criticalCount}-${score.toFixed(2)}`),
        type: 'financial_red_flag_vs_narrative',
        severity,
        title: `${criticalCount} critical FA flag(s) vs positive synthesis (score=${score.toFixed(2)})`,
        evidence: { critical_flag_count: criticalCount, convergence_score: score, direction: 'positive_synthesis' },
        reasoning:
          `FA raised ${criticalCount} critical red flag(s) while strategic synthesis points positive ` +
          `(convergence_score=${score.toFixed(2)}). Boardroom will ask whether the flags are addressed in the thesis.`,
        suggested_resolution:
          'Surface each critical FA flag in the thesis section with an explicit remediation/why-not-blocker note.',
      },
    };
  }

  // Negative synthesis with no critical FA flags — possible over-pessimism
  if (criticalCount === 0 && score <= -0.5) {
    return {
      kind: 'finding',
      finding: {
        id: findingId(ticker, 'financial_red_flag_vs_narrative', `neg-${score.toFixed(2)}`),
        type: 'financial_red_flag_vs_narrative',
        severity: 'medium',
        title: `No critical FA flags but synthesis is strongly negative (score=${score.toFixed(2)})`,
        evidence: { critical_flag_count: 0, convergence_score: score, direction: 'negative_synthesis' },
        reasoning:
          `Strategic synthesis is strongly negative (convergence_score=${score.toFixed(2)}) yet FA raised zero ` +
          `critical red flags. Either negative drivers are non-financial (macro/sector) or synthesis overcorrects.`,
        suggested_resolution:
          'Document the non-financial drivers of the negative thesis explicitly so reviewers understand the gap.',
      },
    };
  }

  return { kind: 'skip', reason: `criticalCount=${criticalCount} score=${score.toFixed(2)} within tolerance` };
}

// =============================================================================
// Detector 6 — synthesis_divergence pass-through
// =============================================================================

function passThroughSynthesisDivergences(
  ticker: string,
  ctx: Record<string, unknown>,
): DetectorResult {
  const synth = parseJsonLoose(ctx['strategic_synthesis_output']);
  if (!synth) return { kind: 'skip', reason: 'no strategic_synthesis_output' };
  const divergences = synth['divergences'];
  if (!Array.isArray(divergences) || divergences.length === 0) {
    return { kind: 'skip', reason: 'no divergences in synthesis output' };
  }

  const findings: ContradictionFinding[] = [];
  let idx = 0;
  for (const d of divergences) {
    const text = String(d ?? '').trim();
    if (!text) continue;
    findings.push({
      id: findingId(ticker, 'synthesis_divergence', `${idx}-${text.slice(0, 40)}`),
      type: 'synthesis_divergence',
      severity: 'medium',
      title: `Synthesis-detected divergence: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
      evidence: { divergence_text: text, source: 'strategic_synthesis.divergences' },
      reasoning: `strategic_synthesis surfaced this divergence directly: "${text}"`,
      suggested_resolution: null,
    });
    idx++;
  }
  if (findings.length === 0) return { kind: 'skip', reason: 'all divergence entries empty' };
  return { kind: 'multi', findings };
}

// =============================================================================
// Aggregator
// =============================================================================

interface DetectorSpec {
  name: string;
  run: (ticker: string, ctx: Record<string, unknown>) => DetectorResult;
}

const DETECTORS: DetectorSpec[] = [
  { name: 'valuation_method_mismatch', run: detectValuationMethodMismatch },
  { name: 'target_spread', run: detectTargetSpread },
  { name: 'thesis_vs_valuation', run: detectThesisVsValuation },
  { name: 'confidence_vs_conviction', run: detectConfidenceVsConviction },
  { name: 'financial_red_flag_vs_narrative', run: detectFinancialRedFlagVsNarrative },
  { name: 'synthesis_divergence', run: passThroughSynthesisDivergences },
];

/**
 * Main entry — runs all detectors, assembles a ContradictionReport, writes
 * it to accumulatedContext under the canonical keys, and returns it.
 *
 * Pure-ish: only context writes are the two report keys. Upstream agent
 * outputs are read-only.
 */
export function runContradictionHunter(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): ContradictionReport {
  const findings: ContradictionFinding[] = [];
  const detectorsRun: string[] = [];
  const detectorsSkipped: Array<{ detector: string; reason: string }> = [];

  for (const spec of DETECTORS) {
    let result: DetectorResult;
    try {
      result = spec.run(ticker, accumulatedContext);
    } catch (err) {
      result = {
        kind: 'skip',
        reason: `detector threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    detectorsRun.push(spec.name);
    if (result.kind === 'skip') {
      detectorsSkipped.push({ detector: spec.name, reason: result.reason });
    } else if (result.kind === 'finding') {
      findings.push(result.finding);
    } else {
      findings.push(...result.findings);
    }
  }

  const bySeverity = { high: 0, medium: 0, low: 0 };
  for (const f of findings) bySeverity[f.severity]++;

  const report: ContradictionReport = {
    ticker,
    generated_at: new Date().toISOString(),
    finding_count: findings.length,
    by_severity: bySeverity,
    findings,
    detectors_run: detectorsRun,
    detectors_skipped: detectorsSkipped,
  };

  accumulatedContext[CONTRADICTION_CONTEXT_KEYS.REPORT] = report;
  accumulatedContext[CONTRADICTION_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(report);
  return report;
}

/** Console pretty-print for orchestrator logs. Side-effect: console.log only. */
export function logContradictionSummary(report: ContradictionReport): void {
  const skipCount = report.detectors_skipped.length;
  console.log(
    `[contradiction-hunter] ticker=${report.ticker} findings=${report.finding_count} ` +
      `high=${report.by_severity.high} medium=${report.by_severity.medium} low=${report.by_severity.low} ` +
      `detectors=${report.detectors_run.length}/${DETECTORS.length} skipped=${skipCount}`,
  );
  for (const f of report.findings) {
    console.log(`[contradiction-hunter]   [${f.severity}] ${f.type}: ${f.title}`);
  }
}
