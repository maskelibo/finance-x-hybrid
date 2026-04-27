import { describe, it, expect } from 'vitest';
import { populateTruthAssertions } from './preflight.js';
import {
  runContradictionHunter,
  CONTRADICTION_CONTEXT_KEYS,
} from './contradiction_hunter.js';

// =============================================================================
// Test fixtures — synthetic minimal accumulatedContext shapes
// =============================================================================

function ctxBase(): Record<string, unknown> {
  // Truth assertions populated for KCHOL — required for valuation method mismatch
  // detector to have a comparison baseline.
  const ctx: Record<string, unknown> = {};
  populateTruthAssertions('KCHOL', ctx);
  return ctx;
}

function withFa(ctx: Record<string, unknown>, opts: { confidence: 'low' | 'medium' | 'high'; criticalCount: number }): Record<string, unknown> {
  ctx['financial_analysis_output'] = JSON.stringify({
    confidence: opts.confidence,
    critical_flag_count: opts.criticalCount,
    red_flags: Array.from({ length: opts.criticalCount }, (_, i) => ({ severity: 'critical', code: `R${i}` })),
  });
  return ctx;
}

function withSynth(ctx: Record<string, unknown>, opts: { confidence: 'low' | 'medium' | 'high'; convergenceScore: number; divergences?: string[] }): Record<string, unknown> {
  ctx['strategic_synthesis_output'] = JSON.stringify({
    confidence: opts.confidence,
    convergence_score: opts.convergenceScore,
    divergences: opts.divergences ?? [],
  });
  return ctx;
}

function withValuation(ctx: Record<string, unknown>, payload: Record<string, unknown>): Record<string, unknown> {
  ctx['valuation_agent_output'] = JSON.stringify(payload);
  return ctx;
}

// =============================================================================
// Empty / smoke
// =============================================================================

describe('contradiction hunter — smoke + invariants', () => {
  it('empty context → all detectors skipped, finding_count=0', () => {
    const ctx: Record<string, unknown> = {};
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.finding_count).toBe(0);
    expect(r.findings).toEqual([]);
    expect(r.detectors_run).toHaveLength(6);
    expect(r.detectors_skipped).toHaveLength(6);
    expect(r.by_severity).toEqual({ high: 0, medium: 0, low: 0 });
  });

  it('writes contradiction_report + contradiction_report_json to context', () => {
    const ctx: Record<string, unknown> = {};
    runContradictionHunter('KCHOL', ctx);
    expect(ctx[CONTRADICTION_CONTEXT_KEYS.REPORT]).toBeDefined();
    expect(typeof ctx[CONTRADICTION_CONTEXT_KEYS.REPORT_JSON]).toBe('string');
    const parsed = JSON.parse(String(ctx[CONTRADICTION_CONTEXT_KEYS.REPORT_JSON]));
    expect(parsed.ticker).toBe('KCHOL');
  });

  it('does not mutate upstream agent outputs', () => {
    const ctx = ctxBase();
    const fa = JSON.stringify({ confidence: 'high', critical_flag_count: 0 });
    ctx['financial_analysis_output'] = fa;
    runContradictionHunter('KCHOL', ctx);
    expect(ctx['financial_analysis_output']).toBe(fa); // identical reference content
  });

  it('clean context (high FA confidence, no flags, no divergences) → finding_count=0', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'high', criticalCount: 0 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0.2 });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.finding_count).toBe(0);
  });
});

// =============================================================================
// Detector 1 — valuation_method_mismatch
// =============================================================================

describe('detector: valuation_method_mismatch', () => {
  it('skips when no valuation_agent_output', () => {
    const ctx = ctxBase();
    const r = runContradictionHunter('KCHOL', ctx);
    const skip = r.detectors_skipped.find(s => s.detector === 'valuation_method_mismatch');
    expect(skip).toBeDefined();
  });

  it('skips when valuation chosen method matches FTL primary', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_sotp' });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'valuation_method_mismatch');
    expect(finding).toBeUndefined();
  });

  it('flags HIGH for KCHOL valuation choosing val_dcf (structural)', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_dcf' });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'valuation_method_mismatch');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
    expect(finding!.evidence['chosen_method']).toBe('val_dcf');
    expect(finding!.evidence['ftl_primary_method']).toBe('val_sotp');
  });
});

// =============================================================================
// Detector 2 — target_spread
// =============================================================================

describe('detector: target_spread', () => {
  it('skips when DCF or SOTP target is missing', () => {
    const ctx = ctxBase();
    withValuation(ctx, { dcf_target_try: 100 }); // sotp missing
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'target_spread');
    expect(finding).toBeUndefined();
  });

  it('skips when spread below 15%', () => {
    const ctx = ctxBase();
    withValuation(ctx, { dcf_target_try: 100, sotp_target_try: 110 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'target_spread');
    expect(finding).toBeUndefined();
  });

  it('LOW severity for spread 15-20%', () => {
    const ctx = ctxBase();
    withValuation(ctx, { dcf_target_try: 100, sotp_target_try: 118 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'target_spread');
    expect(finding!.severity).toBe('low');
  });

  it('MEDIUM severity for spread 20-30%', () => {
    const ctx = ctxBase();
    withValuation(ctx, { dcf_target_try: 100, sotp_target_try: 125 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'target_spread');
    expect(finding!.severity).toBe('medium');
  });

  it('HIGH severity for spread ≥30%', () => {
    const ctx = ctxBase();
    withValuation(ctx, { dcf_target_try: 100, sotp_target_try: 145 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'target_spread');
    expect(finding!.severity).toBe('high');
  });
});

// =============================================================================
// Detector 3 — thesis_vs_valuation
// =============================================================================

describe('detector: thesis_vs_valuation', () => {
  it('skips when no structured recommendation+upside pair', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_sotp' });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'thesis_vs_valuation');
    expect(finding).toBeUndefined();
  });

  it('flags MEDIUM for BUY with 1% upside', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_sotp', recommendation: 'BUY', upside_pct: 1 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'thesis_vs_valuation');
    expect(finding!.severity).toBe('medium');
  });

  it('flags HIGH for SELL with 60% upside', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_sotp', recommendation: 'SELL', upside_pct: 60 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'thesis_vs_valuation');
    expect(finding!.severity).toBe('high');
  });

  it('skips for HOLD with mid upside', () => {
    const ctx = ctxBase();
    withValuation(ctx, { primary_method: 'val_sotp', recommendation: 'HOLD', upside_pct: 12 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'thesis_vs_valuation');
    expect(finding).toBeUndefined();
  });
});

// =============================================================================
// Detector 4 — confidence_vs_conviction
// =============================================================================

describe('detector: confidence_vs_conviction', () => {
  it('skips when FA confidence is not low', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'medium', criticalCount: 0 });
    withSynth(ctx, { confidence: 'high', convergenceScore: 0.6 });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.findings.find(f => f.type === 'confidence_vs_conviction')).toBeUndefined();
  });

  it('skips when synthesis confidence is not high', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 0 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0.6 });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.findings.find(f => f.type === 'confidence_vs_conviction')).toBeUndefined();
  });

  it('skips when convergence_score under |0.5|', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 0 });
    withSynth(ctx, { confidence: 'high', convergenceScore: 0.4 });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.findings.find(f => f.type === 'confidence_vs_conviction')).toBeUndefined();
  });

  it('flags HIGH severity when FA=low + synth=high + score≥0.5', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 0 });
    withSynth(ctx, { confidence: 'high', convergenceScore: 0.7 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'confidence_vs_conviction');
    expect(finding!.severity).toBe('high');
  });
});

// =============================================================================
// Detector 5 — financial_red_flag_vs_narrative (TIGHTENED)
// =============================================================================

describe('detector: financial_red_flag_vs_narrative (false-positive averse)', () => {
  it('LOW severity for 1 critical flag + score 0.36 (KCHOL live signal)', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 1 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0.36 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding!.severity).toBe('low');
  });

  it('MEDIUM severity for 2 critical flags + score 0.4', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 2 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0.4 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding!.severity).toBe('medium');
  });

  it('HIGH severity ONLY when 3+ critical AND score≥0.5 (boardroom-grade restraint)', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 3 });
    withSynth(ctx, { confidence: 'high', convergenceScore: 0.55 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding!.severity).toBe('high');
  });

  it('NOT high when 3 critical but score under 0.5', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 3 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0.4 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding!.severity).toBe('medium'); // not high
  });

  it('skips when score under 0.3 (no positive synthesis tension)', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 1 });
    withSynth(ctx, { confidence: 'low', convergenceScore: 0.1 });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.findings.find(f => f.type === 'financial_red_flag_vs_narrative')).toBeUndefined();
  });

  it('asymmetric MEDIUM (zero criticals but score ≤ -0.5)', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'high', criticalCount: 0 });
    withSynth(ctx, { confidence: 'medium', convergenceScore: -0.6 });
    const r = runContradictionHunter('KCHOL', ctx);
    const finding = r.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding!.severity).toBe('medium');
  });
});

// =============================================================================
// Detector 6 — synthesis_divergence pass-through
// =============================================================================

describe('pass-through: synthesis_divergence', () => {
  it('skips when divergences array empty', () => {
    const ctx = ctxBase();
    withSynth(ctx, { confidence: 'medium', convergenceScore: 0, divergences: [] });
    const r = runContradictionHunter('KCHOL', ctx);
    expect(r.findings.find(f => f.type === 'synthesis_divergence')).toBeUndefined();
  });

  it('emits one MEDIUM finding per divergence text', () => {
    const ctx = ctxBase();
    withSynth(ctx, {
      confidence: 'medium',
      convergenceScore: 0,
      divergences: ['FA bullish but technical bearish', 'Macro headwinds vs sector tailwinds'],
    });
    const r = runContradictionHunter('KCHOL', ctx);
    const passes = r.findings.filter(f => f.type === 'synthesis_divergence');
    expect(passes).toHaveLength(2);
    expect(passes[0].severity).toBe('medium');
    expect(passes[0].evidence['source']).toBe('strategic_synthesis.divergences');
  });
});

// =============================================================================
// KCHOL live-fixture spot
// =============================================================================

describe('KCHOL live-signal fixture', () => {
  it('reproduces the live KCHOL run signals (FA conf=low, criticals=1, score=0.36, divergences=1)', () => {
    const ctx = ctxBase();
    withFa(ctx, { confidence: 'low', criticalCount: 1 });
    withSynth(ctx, {
      confidence: 'medium',
      convergenceScore: 0.36,
      divergences: ['FA flagged altman z but synthesis stayed positive'],
    });
    const r = runContradictionHunter('KCHOL', ctx);
    // Expected: financial_red_flag_vs_narrative LOW + synthesis_divergence pass-through
    // No HIGH severity for KCHOL on this signal set (boardroom-grade restraint)
    expect(r.by_severity.high).toBe(0);
    expect(r.finding_count).toBeGreaterThanOrEqual(2);
    expect(r.findings.some(f => f.type === 'financial_red_flag_vs_narrative' && f.severity === 'low')).toBe(true);
    expect(r.findings.some(f => f.type === 'synthesis_divergence')).toBe(true);
  });
});
