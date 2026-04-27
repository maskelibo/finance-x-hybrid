import { describe, it, expect } from 'vitest';
import { populateTruthAssertions, populateFaFilingHint } from './preflight.js';
import { runContradictionHunter } from './contradiction_hunter.js';
import {
  runCitationBackfill,
  CITATION_CONTEXT_KEYS,
  type CitationReport,
} from './citation_backfill.js';
import type { ChairmanQuestionReport } from './chairman_anticipator.js';
import type { ContradictionReport } from './contradiction_hunter.js';

// =============================================================================
// Helpers
// =============================================================================

function makeKcholCtx(): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  populateTruthAssertions('KCHOL', ctx);

  ctx['kap_watch_output'] = {
    disclosure_inventory: [
      {
        disclosure_id: '1555903',
        title: 'Konsolide Finansal Tablolar — Bağımsız Denetim Raporu Yıllık FY-2025',
        published_at: '2026-02-11T18:00:00Z',
        category: 'FR', subcategory: 'FR',
      },
    ],
  };
  populateFaFilingHint('KCHOL', ctx);

  ctx['data_collection_output'] = JSON.stringify({
    data_manifest: {
      financial_reports: [
        { disclosure_id: '1555903', title: 'KCHOL FY2025 Konsolide', period_label: 'FY-2025', local_path: '/x/y.pdf' },
      ],
    },
  });

  ctx['financial_analysis_output'] = JSON.stringify({
    confidence: 'low',
    critical_flag_count: 1,
    red_flags: [{ severity: 'critical', code: 'ALTMAN_Z', message: 'Z=1.2 distress zone' }],
    highlights: [{ code: 'ROE', value: 0.18 }, { code: 'NET_MARGIN', value: 0.07 }],
  });
  ctx['strategic_synthesis_output'] = JSON.stringify({
    confidence: 'medium',
    convergence_score: 0.36,
    divergences: ['FA flagged altman z but synthesis stayed positive'],
  });
  ctx['valuation_agent_output'] = JSON.stringify({ primary_method: 'val_sotp' });

  runContradictionHunter('KCHOL', ctx);
  return ctx;
}

function withChairmanReport(ctx: Record<string, unknown>, q: ChairmanQuestionReport): void {
  ctx['chairman_questions'] = q;
  ctx['chairman_questions_json'] = JSON.stringify(q);
}

function makeQReport(opts: {
  category: 'valuation_challenge' | 'financial_risk_challenge' | 'methodology_challenge' | 'management_strategy' | 'downside_scenario';
  confidence: 'high' | 'medium' | 'low';
  evidence_refs?: string[];
  questionId?: string;
}): ChairmanQuestionReport {
  return {
    ticker: 'KCHOL',
    generated_at: new Date().toISOString(),
    question_count: 1,
    by_category: { valuation_challenge: 0, financial_risk_challenge: 0, methodology_challenge: 0, management_strategy: 0, downside_scenario: 0, [opts.category]: 1 } as any,
    questions: [{
      id: opts.questionId ?? 'cq-test-1',
      category: opts.category,
      question: 'Test question?',
      proactive_answer: 'Test answer',
      evidence_refs: opts.evidence_refs ?? [],
      confidence: opts.confidence,
    }],
    source: 'llm',
    llm_model: 'claude-sonnet-4-6',
    llm_duration_ms: 1000,
    llm_input_tokens: null,
    llm_output_tokens: null,
    llm_cost_usd: 0.04,
    warnings: [],
  };
}

// =============================================================================
// Smoke tests
// =============================================================================

describe('citation backfill — smoke + invariants', () => {
  it('empty context → 0 citations, 0 annotations, uncited_must_count=0', () => {
    const r = runCitationBackfill('KCHOL', {});
    expect(r.source_count).toBe(0);
    expect(r.claim_annotations).toEqual([]);
    expect(r.uncited_must_count).toBe(0);
    expect(r.by_status.cited).toBe(0);
  });

  it('writes report to context under canonical keys', () => {
    const ctx = makeKcholCtx();
    runCitationBackfill('KCHOL', ctx);
    expect(ctx[CITATION_CONTEXT_KEYS.REPORT]).toBeDefined();
    expect(typeof ctx[CITATION_CONTEXT_KEYS.REPORT_JSON]).toBe('string');
    const parsed = JSON.parse(String(ctx[CITATION_CONTEXT_KEYS.REPORT_JSON])) as CitationReport;
    expect(parsed.ticker).toBe('KCHOL');
  });

  it('does not mutate upstream agent outputs', () => {
    const ctx = makeKcholCtx();
    const beforeFa = ctx['financial_analysis_output'];
    const beforeSynth = ctx['strategic_synthesis_output'];
    const beforeContra = ctx['contradiction_report'];
    runCitationBackfill('KCHOL', ctx);
    expect(ctx['financial_analysis_output']).toBe(beforeFa);
    expect(ctx['strategic_synthesis_output']).toBe(beforeSynth);
    expect(ctx['contradiction_report']).toBe(beforeContra);
  });

  it('only adds the two canonical keys to context', () => {
    const ctx = makeKcholCtx();
    const before = new Set(Object.keys(ctx));
    runCitationBackfill('KCHOL', ctx);
    const newKeys = [...Object.keys(ctx)].filter(k => !before.has(k)).sort();
    expect(newKeys).toEqual([CITATION_CONTEXT_KEYS.REPORT, CITATION_CONTEXT_KEYS.REPORT_JSON].sort());
  });
});

// =============================================================================
// Source extraction
// =============================================================================

describe('citation source extraction', () => {
  it('extracts kap_disclosure citations from filing_selection + data_manifest', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const kapCitations = r.citations.filter(c => c.source_type === 'kap_disclosure');
    expect(kapCitations.length).toBeGreaterThanOrEqual(1);
    expect(kapCitations.some(c => c.source_ref === 'kap:1555903')).toBe(true);
    expect(kapCitations[0].confidence).toBe('authoritative');
  });

  it('extracts fa_red_flag citations from FA red_flags', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const redFlag = r.citations.find(c => c.source_ref === 'fa_red_flag:ALTMAN_Z');
    expect(redFlag).toBeDefined();
    expect(redFlag!.excerpt).toContain('ALTMAN_Z');
    expect(redFlag!.excerpt).toContain('critical');
  });

  it('extracts fa_metric citations from highlights', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.citations.some(c => c.source_ref === 'fa_metric:ROE')).toBe(true);
    expect(r.citations.some(c => c.source_ref === 'fa_metric:NET_MARGIN')).toBe(true);
  });

  it('extracts truth_assertion + methodology_decision citations', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.citations.some(c => c.source_ref === 'ftl:methodology:primary_method')).toBe(true);
    expect(r.citations.some(c => c.source_ref === 'ftl:methodology:weights')).toBe(true);
    expect(r.citations.some(c => c.source_ref === 'ftl:classification')).toBe(true);
    expect(r.citations.some(c => c.source_type === 'methodology_decision')).toBe(true);
  });

  it('extracts synthesis_score + synthesis_divergence citations', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.citations.some(c => c.source_ref === 'synth_score')).toBe(true);
    expect(r.citations.some(c => c.source_ref === 'synth_div:0')).toBe(true);
  });

  it('extracts contradiction_finding citations', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const cf = r.citations.filter(c => c.source_type === 'contradiction_finding');
    expect(cf.length).toBeGreaterThanOrEqual(1); // KCHOL fixture produces ≥1 finding
  });
});

// =============================================================================
// Claim annotation
// =============================================================================

describe('claim annotation — contradictions', () => {
  it('annotates each contradiction finding with required_coverage', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const contraAnns = r.claim_annotations.filter(a => a.claim_origin === 'contradiction_finding');
    expect(contraAnns.length).toBeGreaterThanOrEqual(1);
    // All KCHOL fixture findings are low/medium → should/optional, not must
    expect(contraAnns.every(a => a.required_coverage !== 'must')).toBe(true);
  });

  it('financial_red_flag_vs_narrative finding cites fa_red_flag + synth_score', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const cReport = ctx['contradiction_report'] as ContradictionReport;
    const finding = cReport.findings.find(f => f.type === 'financial_red_flag_vs_narrative');
    expect(finding).toBeDefined();
    const ann = r.claim_annotations.find(a => a.claim_id === `contradiction:${finding!.id}`);
    expect(ann).toBeDefined();
    expect(ann!.citation_ids.length).toBeGreaterThanOrEqual(1);
    expect(ann!.status).toBe('cited');
    const cites = ann!.citation_ids.map(id => r.citations.find(c => c.id === id));
    const types = cites.map(c => c?.source_type);
    expect(types).toContain('fa_red_flag');
    expect(types).toContain('synthesis_score');
  });

  it('synthesis_divergence finding cites the matching synth_div', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    const cReport = ctx['contradiction_report'] as ContradictionReport;
    const finding = cReport.findings.find(f => f.type === 'synthesis_divergence');
    expect(finding).toBeDefined();
    const ann = r.claim_annotations.find(a => a.claim_id === `contradiction:${finding!.id}`);
    expect(ann).toBeDefined();
    expect(ann!.status).toBe('cited');
    const cites = ann!.citation_ids.map(id => r.citations.find(c => c.id === id));
    expect(cites.some(c => c?.source_type === 'synthesis_divergence')).toBe(true);
  });
});

describe('claim annotation — chairman questions', () => {
  it('financial_risk_challenge ALWAYS required=must (even at low confidence)', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({ category: 'financial_risk_challenge', confidence: 'low' }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    expect(ann!.required_coverage).toBe('must');
  });

  it('valuation_challenge with high confidence → must', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({ category: 'valuation_challenge', confidence: 'high' }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    expect(ann!.required_coverage).toBe('must');
  });

  it('management_strategy low confidence → optional', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({ category: 'management_strategy', confidence: 'low' }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    expect(ann!.required_coverage).toBe('optional');
  });

  it('canonicalizes evidence_refs (FTL.primary_method → ftl:methodology:primary_method)', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({
      category: 'valuation_challenge',
      confidence: 'high',
      evidence_refs: ['FTL.primary_method=val_sotp', 'FTL.weights'],
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    expect(ann!.status).toBe('cited');
    const cites = ann!.citation_ids.map(id => r.citations.find(c => c.id === id));
    expect(cites.some(c => c?.source_ref === 'ftl:methodology:primary_method')).toBe(true);
    expect(cites.some(c => c?.source_ref === 'ftl:methodology:weights')).toBe(true);
  });

  it('partial status when some evidence_refs unmatched', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({
      category: 'methodology_challenge',
      confidence: 'high',
      evidence_refs: ['FTL.primary_method', 'totally_bogus_random_string_xyz'],
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    expect(ann!.status).toBe('partial');
    expect(r.warnings.some(w => w.includes('unmatched_evidence_ref'))).toBe(true);
  });

  it('FA.critical_flag_count evidence_ref maps to fa_red_flag citations', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({
      category: 'financial_risk_challenge',
      confidence: 'medium',
      evidence_refs: ['FA.critical_flag_count=1'],
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations.find(a => a.claim_origin === 'chairman_question');
    const cites = ann!.citation_ids.map(id => r.citations.find(c => c.id === id));
    expect(cites.some(c => c?.source_type === 'fa_red_flag')).toBe(true);
  });
});

// =============================================================================
// Deduplication
// =============================================================================

describe('citation deduplication', () => {
  it('same source_ref referenced by multiple claims → 1 Citation, multi annotation refs', () => {
    const ctx = makeKcholCtx();
    // Two questions both referencing FTL.primary_method
    const dual: ChairmanQuestionReport = {
      ticker: 'KCHOL',
      generated_at: new Date().toISOString(),
      question_count: 2,
      by_category: { valuation_challenge: 1, financial_risk_challenge: 0, methodology_challenge: 1, management_strategy: 0, downside_scenario: 0 },
      questions: [
        { id: 'cq-1', category: 'valuation_challenge', question: 'Q1', proactive_answer: 'A1', evidence_refs: ['FTL.primary_method'], confidence: 'high' },
        { id: 'cq-2', category: 'methodology_challenge', question: 'Q2', proactive_answer: 'A2', evidence_refs: ['FTL.primary_method'], confidence: 'high' },
      ],
      source: 'llm', llm_model: 'claude-sonnet-4-6', llm_duration_ms: 1000,
      llm_input_tokens: null, llm_output_tokens: null, llm_cost_usd: 0.04, warnings: [],
    };
    withChairmanReport(ctx, dual);
    const r = runCitationBackfill('KCHOL', ctx);
    // Find primary_method citation
    const pm = r.citations.filter(c => c.source_ref === 'ftl:methodology:primary_method');
    expect(pm).toHaveLength(1); // deduplicated to single entry

    const anns = r.claim_annotations.filter(a => a.claim_origin === 'chairman_question');
    const refsToPm = anns.filter(a => a.citation_ids.includes(pm[0].id));
    expect(refsToPm.length).toBe(2); // both questions reference the same Citation
  });
});

// =============================================================================
// uncited_must_count
// =============================================================================

describe('uncited_must_count', () => {
  it('reports 0 when must-cite claims have sources', () => {
    const ctx = makeKcholCtx();
    withChairmanReport(ctx, makeQReport({
      category: 'financial_risk_challenge',
      confidence: 'medium',
      evidence_refs: ['FA.critical_flag_count'],
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.uncited_must_count).toBe(0);
  });

  it('reports >0 when a must-cite claim has no structured source', () => {
    // financial_risk_challenge → must; but strip FA output so no fa_red_flag/fa_confidence exists
    const ctx: Record<string, unknown> = {};
    populateTruthAssertions('KCHOL', ctx);
    // No FA, no synth, no kap, no contradictions
    withChairmanReport(ctx, makeQReport({
      category: 'financial_risk_challenge',
      confidence: 'medium',
      evidence_refs: [], // no refs at all
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.uncited_must_count).toBe(1);
    expect(r.warnings.some(w => w.includes('uncited_must_count'))).toBe(true);
  });

  it('does not fabricate citations — uncited stays uncited', () => {
    const ctx: Record<string, unknown> = {};
    populateTruthAssertions('KCHOL', ctx);
    withChairmanReport(ctx, makeQReport({
      category: 'downside_scenario', // no category fallback in v1
      confidence: 'high',
      evidence_refs: [],
    }));
    const r = runCitationBackfill('KCHOL', ctx);
    const ann = r.claim_annotations[0];
    expect(ann.status).toBe('uncited');
    expect(ann.citation_ids).toEqual([]);
  });
});

// =============================================================================
// KCHOL synthetic fixture spot
// =============================================================================

describe('KCHOL synthetic fixture spot', () => {
  it('produces structured citation report with KAP + FA + FTL + synth + contradictions', () => {
    const ctx = makeKcholCtx();
    const r = runCitationBackfill('KCHOL', ctx);
    expect(r.source_count).toBeGreaterThan(5);
    // Cover all 9 source types where possible
    const types = new Set(r.citations.map(c => c.source_type));
    expect(types.has('kap_disclosure')).toBe(true);
    expect(types.has('fa_red_flag')).toBe(true);
    expect(types.has('fa_confidence')).toBe(true);
    expect(types.has('truth_assertion')).toBe(true);
    expect(types.has('synthesis_divergence')).toBe(true);
    expect(types.has('synthesis_score')).toBe(true);
    expect(types.has('methodology_decision')).toBe(true);
    expect(types.has('contradiction_finding')).toBe(true);
  });
});
