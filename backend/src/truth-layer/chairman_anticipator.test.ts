import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { populateTruthAssertions } from './preflight.js';
import { runContradictionHunter } from './contradiction_hunter.js';
import {
  runChairmanAnticipator,
  buildChallengeBrief,
  setProviderRunner,
  resetProviderRunner,
  CHAIRMAN_CONTEXT_KEYS,
  type ProviderCallResult,
  type ProviderRunner,
} from './chairman_anticipator.js';

// =============================================================================
// Helpers — synthetic KCHOL-shaped accumulatedContext
// =============================================================================

function ctxKchol(): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  populateTruthAssertions('KCHOL', ctx);
  ctx['financial_analysis_output'] = JSON.stringify({
    confidence: 'low',
    critical_flag_count: 1,
    red_flags: [{ severity: 'critical', code: 'ALTMAN_Z' }],
  });
  ctx['strategic_synthesis_output'] = JSON.stringify({
    confidence: 'medium',
    convergence_score: 0.36,
    divergences: ['FA flagged altman z but synthesis stayed positive'],
  });
  ctx['valuation_agent_output'] = JSON.stringify({ primary_method: 'val_sotp' });
  // Run Hunter so contradiction_report is in context (P3.alpha consumer pattern)
  runContradictionHunter('KCHOL', ctx);
  return ctx;
}

function mockSuccess(json: string, durationMs = 5_000, costUsd = 0.04, tokensUsed = 1500): ProviderRunner {
  return async () => ({ success: true, output: json, durationMs, tokensUsed, costUsd });
}

function mockTimeout(): ProviderRunner {
  return async () => ({
    success: false,
    output: '',
    durationMs: 90_000,
    tokensUsed: 0,
    costUsd: 0,
    error: 'timeout after 90s',
  });
}

function mockMalformed(): ProviderRunner {
  return async () => ({
    success: true,
    output: 'I cannot output JSON, here is some prose instead.',
    durationMs: 2_000,
    tokensUsed: 200,
    costUsd: 0.005,
  });
}

function mockEmpty(): ProviderRunner {
  return async () => ({ success: true, output: '', durationMs: 1_000, tokensUsed: 0, costUsd: 0 });
}

const VALID_LLM_JSON = JSON.stringify({
  questions: [
    {
      category: 'valuation_challenge',
      question: 'KCHOL SOTP değerlemesinde bankacılık iştirakı için P/B sleeve nasıl hesaplandı?',
      proactive_answer: 'YKBNK için sektör ortalaması P/B 0.8x kullanıldı; defter değeri üzerinden TRY 60bn katkı hesaplandı.',
      evidence_refs: ['FTL.primary_method=val_sotp'],
      confidence: 'high',
    },
    {
      category: 'financial_risk_challenge',
      question: 'Altman Z distress sınırına yakın — likidite konumumuz nedir?',
      proactive_answer: 'Holding düzeyinde nakit pozisyonu güçlü; 12 ay içinde refinansman ihtiyacı düşük.',
      evidence_refs: ['FA.critical_flag_count=1', 'contradiction:cf-test'],
      confidence: 'medium',
    },
    {
      category: 'methodology_challenge',
      question: 'DCF neden sadece %10 ağırlıkla kullanıldı?',
      proactive_answer: 'Holding banking-heavy yapısı konsolide DCF varsayımlarını bozar; FTL kanonik tavsiyesi.',
      evidence_refs: ['FTL.weights={...}'],
      confidence: 'high',
    },
    {
      category: 'management_strategy',
      question: 'Bankacılık iştirakı baskısında temettü politikası nedir?',
      proactive_answer: 'Yönetim ana faaliyet kollarına yatırım önceliği; temettü oranı %30-40 arası korunuyor.',
      evidence_refs: [],
      confidence: 'low',
    },
    {
      category: 'downside_scenario',
      question: 'TL %20 değer kaybederse holding NAV nasıl etkilenir?',
      proactive_answer: 'USD-bazlı varlıklar nedeniyle nominal NAV korunur ancak TRY karşılığı %12-15 artar.',
      evidence_refs: [],
      confidence: 'medium',
    },
  ],
});

beforeEach(() => { resetProviderRunner(); });
afterEach(() => { resetProviderRunner(); });

// =============================================================================
// Brief builder
// =============================================================================

describe('challenge brief builder', () => {
  it('produces brief under 5KB cap with all expected sections', () => {
    const ctx = ctxKchol();
    const brief = buildChallengeBrief('KCHOL', ctx);
    expect(brief.length).toBeLessThanOrEqual(5000);
    expect(brief).toContain('TICKER: KCHOL');
    expect(brief).toContain('CLASSIFICATION:');
    expect(brief).toContain('METHODOLOGY:');
    expect(brief).toContain('FINANCIAL ANALYSIS:');
    expect(brief).toContain('STRATEGIC SYNTHESIS:');
    expect(brief).toContain('CONTRADICTIONS DETECTED');
  });

  it('does NOT include final_summary_output content', () => {
    const ctx = ctxKchol();
    ctx['final_summary_output'] = 'BU UZUN NARRATIVE LLM TARAFINDAN OKUNMAMALI ' + 'X'.repeat(5000);
    const brief = buildChallengeBrief('KCHOL', ctx);
    expect(brief).not.toContain('BU UZUN NARRATIVE LLM TARAFINDAN OKUNMAMALI');
  });

  it('truncates if oversized brief is somehow constructed', () => {
    const ctx = ctxKchol();
    // Inject pathologically long divergences to force cap
    ctx['strategic_synthesis_output'] = JSON.stringify({
      confidence: 'medium', convergence_score: 0,
      divergences: Array.from({ length: 50 }, (_, i) => `divergence ${i} ` + 'A'.repeat(300)),
    });
    runContradictionHunter('KCHOL', ctx);
    const brief = buildChallengeBrief('KCHOL', ctx);
    expect(brief.length).toBeLessThanOrEqual(5000);
  });

  it('handles empty context gracefully', () => {
    const brief = buildChallengeBrief('KCHOL', {});
    expect(brief).toContain('TICKER: KCHOL');
    expect(brief).toContain('CONTRADICTIONS DETECTED: none');
  });
});

// =============================================================================
// LLM happy path
// =============================================================================

describe('LLM mock — success path', () => {
  it('parses valid JSON and produces 5 questions across all categories', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('llm');
    expect(r.question_count).toBe(5);
    expect(r.by_category.valuation_challenge).toBe(1);
    expect(r.by_category.financial_risk_challenge).toBe(1);
    expect(r.by_category.methodology_challenge).toBe(1);
    expect(r.by_category.management_strategy).toBe(1);
    expect(r.by_category.downside_scenario).toBe(1);
  });

  it('records LLM metadata (model/duration/cost/tokens)', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON, 7_000, 0.05, 1800));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.llm_model).toBe('claude-sonnet-4-6');
    expect(r.llm_duration_ms).toBe(7_000);
    expect(r.llm_cost_usd).toBeCloseTo(0.05);
    expect(r.llm_output_tokens).toBe(1800);
  });

  it('caps to 7 questions even when LLM emits more', async () => {
    const overflow = {
      questions: Array.from({ length: 10 }, (_, i) => ({
        category: 'valuation_challenge',
        question: `Q${i}`, proactive_answer: 'A',
        evidence_refs: [], confidence: 'medium',
      })),
    };
    setProviderRunner(mockSuccess(JSON.stringify(overflow)));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.question_count).toBe(7);
  });

  it('writes report to accumulatedContext under canonical keys', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON));
    const ctx = ctxKchol();
    await runChairmanAnticipator('KCHOL', ctx);
    expect(ctx[CHAIRMAN_CONTEXT_KEYS.REPORT]).toBeDefined();
    expect(typeof ctx[CHAIRMAN_CONTEXT_KEYS.REPORT_JSON]).toBe('string');
  });

  it('parses JSON wrapped in markdown fences', async () => {
    const fenced = '```json\n' + VALID_LLM_JSON + '\n```';
    setProviderRunner(mockSuccess(fenced));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('llm');
    expect(r.question_count).toBe(5);
  });
});

// =============================================================================
// Fallback paths
// =============================================================================

describe('LLM timeout — fallback', () => {
  it('falls back to deterministic when LLM call fails (timeout)', async () => {
    setProviderRunner(mockTimeout());
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('fallback_deterministic');
    expect(r.warnings.some(w => w.includes('llm_call_failed'))).toBe(true);
    // KCHOL fixture has Hunter findings (financial_red_flag_vs_narrative + synthesis_divergence)
    expect(r.question_count).toBeGreaterThanOrEqual(1);
  });

  it('fallback question_count tracks Hunter findings', async () => {
    setProviderRunner(mockTimeout());
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.questions.every(q => q.evidence_refs[0]?.startsWith('contradiction:'))).toBe(true);
  });
});

describe('LLM malformed JSON — fallback', () => {
  it('falls back when LLM returns prose instead of JSON', async () => {
    setProviderRunner(mockMalformed());
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('fallback_deterministic');
    expect(r.warnings.some(w => w.includes('parse_failed'))).toBe(true);
  });

  it('falls back when LLM returns empty output', async () => {
    setProviderRunner(mockEmpty());
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('fallback_deterministic');
  });

  it('falls back when LLM returns valid JSON but no questions key', async () => {
    setProviderRunner(mockSuccess(JSON.stringify({ message: 'no can do' })));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('fallback_deterministic');
  });
});

// =============================================================================
// Context mutation guard + KCHOL fixture spot
// =============================================================================

describe('context mutation guard', () => {
  it('does not modify upstream agent outputs', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON));
    const ctx = ctxKchol();
    const beforeFa = ctx['financial_analysis_output'];
    const beforeSynth = ctx['strategic_synthesis_output'];
    const beforeContra = ctx['contradiction_report'];
    await runChairmanAnticipator('KCHOL', ctx);
    expect(ctx['financial_analysis_output']).toBe(beforeFa);
    expect(ctx['strategic_synthesis_output']).toBe(beforeSynth);
    expect(ctx['contradiction_report']).toBe(beforeContra);
  });

  it('only adds the two canonical keys to context', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON));
    const ctx = ctxKchol();
    const before = new Set(Object.keys(ctx));
    await runChairmanAnticipator('KCHOL', ctx);
    const newKeys = [...Object.keys(ctx)].filter(k => !before.has(k));
    expect(newKeys.sort()).toEqual([CHAIRMAN_CONTEXT_KEYS.REPORT, CHAIRMAN_CONTEXT_KEYS.REPORT_JSON].sort());
  });
});

describe('KCHOL synthetic fixture spot', () => {
  it('LLM happy path produces structured 5-cat report consumable by orchestrator log', async () => {
    setProviderRunner(mockSuccess(VALID_LLM_JSON, 8500, 0.045));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.ticker).toBe('KCHOL');
    expect(r.source).toBe('llm');
    expect(r.questions.every(q => q.question.length > 0 && q.proactive_answer.length > 0)).toBe(true);
    // No category-empty warning when all 5 are populated
    expect(r.warnings.filter(w => w.startsWith('category_empty:'))).toHaveLength(0);
  });

  it('LLM partial output (only 2 cats) surfaces empty-category warnings', async () => {
    const partial = {
      questions: [
        { category: 'valuation_challenge', question: 'Q1', proactive_answer: 'A1', evidence_refs: [], confidence: 'high' },
        { category: 'financial_risk_challenge', question: 'Q2', proactive_answer: 'A2', evidence_refs: [], confidence: 'medium' },
      ],
    };
    setProviderRunner(mockSuccess(JSON.stringify(partial)));
    const ctx = ctxKchol();
    const r = await runChairmanAnticipator('KCHOL', ctx);
    expect(r.source).toBe('llm');
    expect(r.question_count).toBe(2);
    const emptyCats = r.warnings.filter(w => w.startsWith('category_empty:'));
    expect(emptyCats.length).toBe(3); // methodology_challenge, management_strategy, downside_scenario
  });
});
