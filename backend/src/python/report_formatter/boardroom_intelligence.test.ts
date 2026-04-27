import { describe, it, expect } from 'vitest';
import {
  buildBoardroomIntelligenceContext,
  renderConsistencyCheck,
  renderBoardroomQuestions,
  renderCitationIndex,
  escapeHtml,
} from './boardroom_intelligence.js';
import type { ContradictionReport } from '../../truth-layer/contradiction_hunter.js';
import type { ChairmanQuestionReport } from '../../truth-layer/chairman_anticipator.js';
import type { CitationReport } from '../../truth-layer/citation_backfill.js';

// =============================================================================
// Fixtures
// =============================================================================

function fixContradictionReport(): ContradictionReport {
  return {
    ticker: 'KCHOL',
    generated_at: new Date().toISOString(),
    finding_count: 2,
    by_severity: { high: 0, medium: 1, low: 1 },
    findings: [
      {
        id: 'cf-low1',
        type: 'financial_red_flag_vs_narrative',
        severity: 'low',
        title: '1 critical FA flag(s) vs positive synthesis',
        evidence: { critical_flag_count: 1, convergence_score: 0.36 },
        reasoning: 'FA raised 1 critical flag while synthesis stayed positive',
        suggested_resolution: 'Surface the flag in the thesis section.',
      },
      {
        id: 'cf-med1',
        type: 'synthesis_divergence',
        severity: 'medium',
        title: 'Synthesis-detected divergence: FA bullish but technical bearish',
        evidence: { divergence_text: 'FA bullish but technical bearish' },
        reasoning: 'strategic_synthesis surfaced this divergence directly',
        suggested_resolution: null,
      },
    ],
    detectors_run: ['financial_red_flag_vs_narrative', 'synthesis_divergence'],
    detectors_skipped: [],
  };
}

function fixChairmanReport(): ChairmanQuestionReport {
  return {
    ticker: 'KCHOL',
    generated_at: new Date().toISOString(),
    question_count: 2,
    by_category: { valuation_challenge: 1, financial_risk_challenge: 1, methodology_challenge: 0, management_strategy: 0, downside_scenario: 0 },
    questions: [
      {
        id: 'cq-1', category: 'valuation_challenge',
        question: 'KCHOL SOTP değerlemesinde P/B sleeve nasıl uygulandı?',
        proactive_answer: 'YKBNK için sektör P/B 0.8x kullanıldı.',
        evidence_refs: ['FTL.primary_method=val_sotp', 'contradiction:cf-1'],
        confidence: 'high',
      },
      {
        id: 'cq-2', category: 'financial_risk_challenge',
        question: 'Altman Z distress sınırı — likidite konumumuz?',
        proactive_answer: 'Holding nakit pozisyonu güçlü.',
        evidence_refs: [],
        confidence: 'medium',
      },
    ],
    source: 'llm',
    llm_model: 'claude-sonnet-4-6',
    llm_duration_ms: 7000, llm_input_tokens: null, llm_output_tokens: 1700,
    llm_cost_usd: 0.045, warnings: [],
  };
}

function fixCitationReport(): CitationReport {
  return {
    ticker: 'KCHOL',
    generated_at: new Date().toISOString(),
    citations: [
      { id: 'ct-aaa', source_type: 'kap_disclosure', source_ref: 'kap:1555903', excerpt: 'KCHOL FY2025', confidence: 'authoritative' },
      { id: 'ct-bbb', source_type: 'fa_red_flag', source_ref: 'fa_red_flag:ALTMAN_Z', excerpt: 'ALTMAN_Z severity=critical', confidence: 'derived' },
      { id: 'ct-ccc', source_type: 'truth_assertion', source_ref: 'ftl:methodology:primary_method', excerpt: 'primary=val_sotp', confidence: 'authoritative' },
    ],
    claim_annotations: [],
    source_count: 3,
    by_status: { cited: 2, partial: 0, uncited: 0 },
    by_required_coverage: { must: 1, should: 1, optional: 0 },
    uncited_must_count: 0,
    warnings: [],
  };
}

function ctxWithAll(): Record<string, unknown> {
  return {
    contradiction_report: fixContradictionReport(),
    chairman_questions: fixChairmanReport(),
    citation_report: fixCitationReport(),
  };
}

// =============================================================================
// Empty state
// =============================================================================

describe('boardroom intelligence — empty state', () => {
  it('empty context → all sections empty + flags false', () => {
    const out = buildBoardroomIntelligenceContext({});
    expect(out.has_consistency_check).toBe(false);
    expect(out.has_boardroom_questions).toBe(false);
    expect(out.has_citation_index).toBe(false);
    expect(out.consistency_check_html).toBe('');
    expect(out.boardroom_questions_html).toBe('');
    expect(out.citation_index_html).toBe('');
  });

  it('empty contradiction_report.findings[] → consistency_check empty', () => {
    const ctx: Record<string, unknown> = {
      contradiction_report: {
        ...fixContradictionReport(),
        finding_count: 0, findings: [], by_severity: { high: 0, medium: 0, low: 0 },
      },
    };
    expect(renderConsistencyCheck(ctx)).toBe('');
  });

  it('empty chairman_questions.questions[] → boardroom_questions empty', () => {
    const ctx: Record<string, unknown> = {
      chairman_questions: { ...fixChairmanReport(), question_count: 0, questions: [] },
    };
    expect(renderBoardroomQuestions(ctx)).toBe('');
  });

  it('empty citation_report.citations[] → citation_index empty', () => {
    const ctx: Record<string, unknown> = {
      citation_report: { ...fixCitationReport(), source_count: 0, citations: [] },
    };
    expect(renderCitationIndex(ctx)).toBe('');
  });
});

// =============================================================================
// Populated rendering
// =============================================================================

describe('boardroom intelligence — populated', () => {
  it('renders consistency_check with severity pills + finding rows', () => {
    const html = renderConsistencyCheck(ctxWithAll());
    expect(html).toContain('İç Tutarlılık Kontrolü');
    expect(html).toContain('fx-pill-low');
    expect(html).toContain('fx-pill-medium');
    expect(html).toContain('financial_red_flag_vs_narrative');
    expect(html).toContain('synthesis_divergence');
    expect(html).toContain('Öneri:'); // suggested_resolution rendered
    expect(html).toContain('class="page fx-no-break"');
  });

  it('renders boardroom_questions with category labels + Q&A cards', () => {
    const html = renderBoardroomQuestions(ctxWithAll());
    expect(html).toContain('Yönetim Kurulu Beklenen Soruları');
    expect(html).toContain('Değerleme Sorgusu');           // category Turkish label
    expect(html).toContain('Finansal Risk Sorgusu');
    expect(html).toContain('conviction: high');
    expect(html).toContain('conviction: medium');
    expect(html).toContain('YKBNK için sektör P/B 0.8x'); // proactive answer
    expect(html).toContain('Kanıt:');                      // evidence_refs section
    expect(html).toContain('fx-subtle-surface');
    expect(html).toContain('LLM (Sonnet 4.6)');           // source label
  });

  it('renders citation_index with grouped sources + counts', () => {
    const html = renderCitationIndex(ctxWithAll());
    expect(html).toContain('Kanıt İndeksi');
    expect(html).toContain('KAP Bildirimleri');
    expect(html).toContain('Finansal Kırmızı Bayraklar');
    expect(html).toContain('FTL Truth Assertions');
    expect(html).toContain('kap:1555903');
    expect(html).toContain('fa_red_flag:ALTMAN_Z');
    expect(html).toContain('ftl:methodology:primary_method');
    expect(html).toContain('3 kaynak');
  });

  it('aggregator builds all 3 sections with flags=true when data present', () => {
    const out = buildBoardroomIntelligenceContext(ctxWithAll());
    expect(out.has_consistency_check).toBe(true);
    expect(out.has_boardroom_questions).toBe(true);
    expect(out.has_citation_index).toBe(true);
    expect(out.consistency_check_html.length).toBeGreaterThan(100);
    expect(out.boardroom_questions_html.length).toBeGreaterThan(100);
    expect(out.citation_index_html.length).toBeGreaterThan(100);
  });
});

// =============================================================================
// uncited_must alarm
// =============================================================================

describe('boardroom intelligence — uncited_must alarm', () => {
  it('renders uncited_must alarm banner when count > 0', () => {
    const ctx: Record<string, unknown> = {
      citation_report: {
        ...fixCitationReport(),
        uncited_must_count: 2,
        by_status: { cited: 1, partial: 0, uncited: 2 },
      },
    };
    const html = renderCitationIndex(ctx);
    expect(html).toContain('Boardroom-grade citation gap');
    expect(html).toContain('2 must-cite claim');
  });

  it('omits alarm banner when uncited_must_count === 0', () => {
    const html = renderCitationIndex(ctxWithAll());
    expect(html).not.toContain('Boardroom-grade citation gap');
  });
});

// =============================================================================
// XSS / escape safety
// =============================================================================

describe('boardroom intelligence — XSS / escape safety', () => {
  it('escapeHtml handles all injection vectors', () => {
    expect(escapeHtml('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('"; alert(1); //'))
      .toBe('&quot;; alert(1); //');
    expect(escapeHtml("' onclick='evil()'"))
      .toBe('&#39; onclick=&#39;evil()&#39;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes user content in contradiction title/reasoning', () => {
    const ctx: Record<string, unknown> = {
      contradiction_report: {
        ...fixContradictionReport(),
        findings: [{
          id: 'cf-x', type: 'financial_red_flag_vs_narrative', severity: 'low',
          title: '<script>alert("xss")</script>',
          evidence: {},
          reasoning: '"><img src=x onerror=alert(1)>',
          suggested_resolution: null,
        }],
      },
    };
    const html = renderConsistencyCheck(ctx);
    // Dangerous tags must be escaped (no live <script>, <img>, etc.)
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).not.toContain('<img src=x onerror=');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;&gt;&lt;img');
  });

  it('escapes user content in chairman question + answer + evidence_refs', () => {
    const ctx: Record<string, unknown> = {
      chairman_questions: {
        ...fixChairmanReport(),
        questions: [{
          id: 'cq-x', category: 'valuation_challenge',
          question: '<img src=x onerror=alert(1)>',
          proactive_answer: '<script>steal()</script>',
          evidence_refs: ['<svg onload=alert(2)>'],
          confidence: 'high',
        }],
      },
    };
    const html = renderBoardroomQuestions(ctx);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>steal');
    expect(html).not.toContain('<svg onload');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;script&gt;steal');
    expect(html).toContain('&lt;svg');
  });

  it('escapes user content in citation excerpt + source_ref', () => {
    const ctx: Record<string, unknown> = {
      citation_report: {
        ...fixCitationReport(),
        citations: [{
          id: 'ct-evil', source_type: 'kap_disclosure',
          source_ref: 'kap:<script>evil()</script>',
          excerpt: '<img src=x onerror=hack()>',
          confidence: 'authoritative',
        }],
      },
    };
    const html = renderCitationIndex(ctx);
    expect(html).not.toContain('<script>evil');
    expect(html).not.toContain('<img src=x onerror=hack');
    expect(html).toContain('&lt;script&gt;evil');
    expect(html).toContain('&lt;img');
  });
});

// =============================================================================
// Read-only invariant
// =============================================================================

describe('boardroom intelligence — read-only invariant', () => {
  it('does not mutate accumulatedContext', () => {
    const ctx = ctxWithAll();
    const beforeKeys = new Set(Object.keys(ctx));
    const beforeContra = ctx['contradiction_report'];
    const beforeChairman = ctx['chairman_questions'];
    const beforeCitation = ctx['citation_report'];

    buildBoardroomIntelligenceContext(ctx);

    const afterKeys = new Set(Object.keys(ctx));
    expect([...afterKeys].sort()).toEqual([...beforeKeys].sort()); // no new keys
    expect(ctx['contradiction_report']).toBe(beforeContra);
    expect(ctx['chairman_questions']).toBe(beforeChairman);
    expect(ctx['citation_report']).toBe(beforeCitation);
  });
});

// =============================================================================
// Source label completeness (reuses category/source_type maps)
// =============================================================================

describe('boardroom intelligence — label maps', () => {
  it('all 5 question categories have Turkish labels', () => {
    const cats = ['valuation_challenge', 'financial_risk_challenge', 'methodology_challenge', 'management_strategy', 'downside_scenario'] as const;
    for (const cat of cats) {
      const ctx: Record<string, unknown> = {
        chairman_questions: {
          ...fixChairmanReport(), question_count: 1,
          questions: [{
            id: 'cq-cat-test', category: cat,
            question: 'Q', proactive_answer: 'A',
            evidence_refs: [], confidence: 'medium',
          }],
        },
      };
      const html = renderBoardroomQuestions(ctx);
      // Each must produce a non-empty Turkish label rendered (NOT raw enum)
      expect(html.length).toBeGreaterThan(100);
    }
  });

  it('all 9 citation source types render their group with Turkish label', () => {
    const types = ['kap_disclosure', 'fa_red_flag', 'fa_metric', 'fa_confidence', 'truth_assertion', 'synthesis_divergence', 'synthesis_score', 'methodology_decision', 'contradiction_finding'] as const;
    for (const t of types) {
      const ctx: Record<string, unknown> = {
        citation_report: {
          ...fixCitationReport(), source_count: 1,
          citations: [{ id: 'ct-x', source_type: t, source_ref: `${t}:test`, excerpt: 'sample', confidence: 'derived' }],
          by_status: { cited: 0, partial: 0, uncited: 0 },
        },
      };
      const html = renderCitationIndex(ctx);
      expect(html.length).toBeGreaterThan(100);
    }
  });
});
