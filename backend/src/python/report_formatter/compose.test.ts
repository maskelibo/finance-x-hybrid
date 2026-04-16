import { describe, expect, it } from 'vitest';

import { composeReportContext } from './compose.js';


describe('composeReportContext — reads from accumulatedContext JSON', () => {
  const accumulatedContext = {
    financial_analysis_output: JSON.stringify({
      ticker: 'EREGL',
      period_label: 'FY-2024',
      sector: 'industrial',
      highlights: [
        { code: 'GROSS_MARGIN', label: 'Brüt marj', value: 18.5, narrative_hint: 'Sektör ortalamasının üzerinde' },
        { code: 'NET_MARGIN', label: 'Net marj', value: 6.2, narrative_hint: 'Hafif kompresyon' },
      ],
      red_flags: [
        { code: 'CRITICAL_DEBT', severity: 'critical', message: 'Net borç/FAVÖK 3.2x' },
      ],
      engine_snapshot: {
        dcf: { enterprise_value: 180000, equity_value: 117000, per_share_value: 47.5, wacc_used: 0.14, terminal_growth: 0.03 },
      },
    }),
    reconciliation_output: JSON.stringify({
      check_count: 4, passed_count: 3, pass_rate: 0.75,
    }),
    qa_review_output: JSON.stringify({
      overall_score: 0.88, qa_decision: 'pass',
      dimension_scores: [
        { code: 'EVIDENCE_SUFFICIENCY', score: 0.9, evidence: '9/10' },
      ],
    }),
    strategic_synthesis_output: JSON.stringify({
      convergence_score: 0.32, confidence: 'medium',
      signals: { positive: [1, 2, 3], negative: [4], neutral: [] },
      divergences: [],
    }),
    valuation_agent_output: JSON.stringify({
      dcf: { enterprise_value: 180000, equity_value: 117000, per_share_value: 47.5, wacc_used: 0.14, terminal_growth: 0.03 },
      try_wacc_warning: false,
      holding_sotp_required: false,
      banking_sector_warning: false,
      notes: [],
    }),
    sector_competition_output: JSON.stringify({
      benchmarks: [
        { metric_code: 'GROSS_MARGIN', label: 'Brüt marj', company_value: 18.5, min_value: 15, median: 17, max_value: 22, quartile: 2, higher_is_better: true },
      ],
    }),
    event_impact_mapper_output: JSON.stringify({
      event_impacts: [
        { event_type: 'dividend', event_summary: '2024 Kar Payı Dağıtımı', impact_direction: 'negative', timing_horizon: 'immediate' },
      ],
    }),
  };

  const result = composeReportContext({
    ticker: 'EREGL',
    reportId: 'rpt-test-1',
    accumulatedContext,
  });

  it('populates ticker + report metadata', () => {
    expect(result.ticker).toBe('EREGL');
    expect(result.report_id).toBe('rpt-test-1');
    expect(result.period_label).toBe('FY-2024');
    expect(result.sector_label).toBe('industrial');
  });

  it('formats qa + reconciliation + convergence scorecards', () => {
    expect(result.qa_score).toBe('0.88');
    expect(result.qa_decision_label).toBe('Geçer');        // translated to TR
    expect(result.convergence_score).toBe('+0.32');
    expect(result.signal_confidence).toBe('orta');           // translated to TR
    expect(result.reconciliation_pass_rate).toBe('%75');
    expect(result.reconciliation_passed).toBe(3);
    expect(result.reconciliation_total).toBe(4);
  });

  it('surfaces critical findings from red_flags', () => {
    expect(Array.isArray(result.critical_findings)).toBe(true);
    expect((result.critical_findings as string[])).toContain('Net borç/FAVÖK 3.2x');
  });

  it('formats highlights with sector-aware unit inference', () => {
    const hls = result.highlights as Array<{ label: string; value_formatted: string }>;
    expect(hls.length).toBe(2);
    expect(hls[0].value_formatted).toMatch(/^%/);   // GROSS_MARGIN → percent
  });

  it('builds DCF block with formatted numbers', () => {
    expect(result.dcf_present).toBe(true);
    expect(String(result.dcf_per_share_formatted)).toContain('47,50');
    expect(String(result.dcf_wacc_formatted)).toMatch(/%.*14/);
  });

  it('empty valuation warnings when sector is industrial and WACC is USD-like', () => {
    expect(result.valuation_warnings).toEqual([]);
  });

  it('benchmarks formatted with labels and quartile', () => {
    const bm = result.benchmarks as Array<{ label: string; quartile_badge: string }>;
    expect(bm.length).toBe(1);
    expect(bm[0].quartile_badge).toBe('Q2');
  });

  it('event impacts formatted', () => {
    const ev = result.event_impacts as Array<{ type: string; direction: string }>;
    expect(ev.length).toBe(1);
    expect(ev[0].type).toBe('dividend');
    expect(ev[0].direction).toBe('Negatif');               // translated
  });

  it('narrative blocks fall back to auto-commentary when LLM narrative missing', () => {
    // narrative_executive_summary now falls back to deterministic Turkish
    // commentary built from QA + convergence + ROE etc. So it's no longer
    // empty even when buildNarrativeBlocks returns nothing.
    const len = String(result.narrative_executive_summary ?? '').length;
    expect(len).toBeGreaterThan(50);
  });
});


describe('composeReportContext — banking/holding warnings surface', () => {
  it('fires all three flags when Python valuation flagged them', () => {
    const out = composeReportContext({
      ticker: 'X',
      reportId: 'r-1',
      accumulatedContext: {
        valuation_agent_output: JSON.stringify({
          dcf: null,
          try_wacc_warning: true,
          holding_sotp_required: true,
          banking_sector_warning: true,
          notes: ['Special case: holding with banking subsidiary'],
        }),
      },
    });
    const warnings = out.valuation_warnings as string[];
    expect(warnings.some(w => w.includes('TRY WACC'))).toBe(true);
    expect(warnings.some(w => w.includes('SOTP'))).toBe(true);
    expect(warnings.some(w => w.includes('FCF-DCF'))).toBe(true);
    expect(warnings).toContain('Special case: holding with banking subsidiary');
  });
});


describe('composeReportContext — resilient to missing upstream', () => {
  it('fills em-dashes when upstream outputs are missing', () => {
    const out = composeReportContext({
      ticker: 'X',
      reportId: 'r-1',
      accumulatedContext: {},
    });
    expect(out.qa_score).toBe('—');
    expect(out.dcf_present).toBe(false);
    expect(out.highlights).toEqual([]);
    expect(out.critical_findings).toEqual([]);
    expect(out.benchmarks).toEqual([]);
  });

  it('accepts narrative blocks when supplied', () => {
    const out = composeReportContext({
      ticker: 'X',
      reportId: 'r-1',
      accumulatedContext: {},
      narrativeBlocks: {
        // Need to be ≥200 chars for fallbackNarrative() to prefer LLM over auto.
        card_summary: 'Şirket güçlü sinyaller veriyor. '.repeat(10),
        valuation: 'DCF değerleme makul. '.repeat(12),
      },
    });
    // Explicit narrative wins when it's longer than the fallback threshold.
    expect(out.narrative_executive_summary).toContain('Şirket güçlü sinyaller');
    expect(out.narrative_valuation).toContain('DCF değerleme makul');
    // narrative_closing still falls through to auto-commentary.
    expect(String(out.narrative_closing).length).toBeGreaterThan(0);
  });
});
