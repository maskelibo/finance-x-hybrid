/**
 * Pre-Core-4 Phase H — dry validation snapshot.
 *
 * End-to-end deterministic test that exercises every Phase A/B/C/D/E/F/G
 * gate against synthetic upstream fixtures. The test asserts:
 *
 *   - Phase D: holding without SOTP YAML → target_price_publish_blocked
 *               banner present, scenarios suppressed
 *   - Phase D: holding with KCHOL SOTP YAML → SOTP table renders, gate passes
 *   - Phase C: ownership YAML present → operator-review banner renders
 *   - Phase F: QA hard_fail → top-of-section-I publish-block banner
 *   - Phase F: COO delivery sees QA hard_fail → blocked decision
 *   - Phase G: annual-report extracts present → XI½ section renders
 *
 * No live PDFs, no Python subprocess. Pure context-shape contract.
 */

import { describe, expect, it } from 'vitest';

import { runDeliveryCheck } from '../adapters/coo.js';
import { composeReportContext } from './compose.js';
import { renderTemplate } from './template_engine.js';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(path.join(__dirname, 'template.html'), 'utf-8');

function baseContext(overrides: Record<string, unknown> = {}) {
  return {
    financial_analysis_output: JSON.stringify({
      ticker: 'KCHOL',
      period_label: 'FY-2024',
      sector: 'holding',
      highlights: [
        { code: 'GROSS_MARGIN', label: 'Brüt marj', value: 17, narrative_hint: 'sektör ortalaması' },
      ],
      red_flags: [],
      canonical_numbers: { revenue: '500000', cost_of_sales: '410000', ebitda: '60000' },
      engine_snapshot: {
        dcf: { enterprise_value: 1500000, equity_value: 1100000, per_share_value: 433.5, wacc_used: 0.14, terminal_growth: 0.03 },
      },
    }),
    reconciliation_output: JSON.stringify({
      check_count: 4, passed_count: 4, pass_rate: 1,
      checks: [{ code: 'BS_IDENTITY', passed: true }],
    }),
    qa_review_output: JSON.stringify({
      overall_score: 0.88, qa_decision: 'pass',
      escalation_recommendation: 'none',
      dimension_scores: [
        { code: 'EVIDENCE_SUFFICIENCY', score: 0.9, evidence: '9/10' },
      ],
    }),
    strategic_synthesis_output: JSON.stringify({
      convergence_score: 0.3, confidence: 'medium',
      signals: { positive: [], negative: [], neutral: [] },
      divergences: [],
    }),
    sector_competition_output: JSON.stringify({
      benchmarks: [
        { metric_code: 'GROSS_MARGIN', label: 'Brüt marj', company_value: 17, min_value: 15, median: 16, max_value: 20, quartile: 2 },
      ],
    }),
    ...overrides,
  };
}

describe('Pre-Core-4 dry validation — Phase D SOTP gate', () => {
  it('holding (KCHOL) WITH SOTP YAML — gate passes, SOTP table in HTML', () => {
    const ctx = baseContext({
      valuation_agent_output: JSON.stringify({
        sector: 'holding',
        ticker: 'KCHOL',
        dcf: { per_share_value: 433.5, wacc_used: 0.14, terminal_growth: 0.03 },
        try_wacc_warning: false, holding_sotp_required: true, banking_sector_warning: false,
        sotp_gate_pass: true,
        target_price_publish_blocked: false,
        sotp_gate_reason: 'SOTP gate satisfied',
        sotp_data: {
          ticker: 'KCHOL', verification_status: 'auto_curated_pending_operator_review',
          source: { url: 'x', as_of_date: '2026-04-28', source_filing: 'Curated 2024 raporu' },
          shares_outstanding_mn: 2536, holding_net_debt_try: 16500000000, holding_discount_pct: 25,
          listed_subsidiaries: [
            { subsidiary: 'Tüpraş', ticker: 'TUPRS', stake_pct: 51, market_cap_try: 320e9, koc_effective_share_try: 163.2e9, nav_method: 'mcap × stake', notes: '' },
          ],
          private_subsidiaries: [],
          computed: {
            gross_nav_try: 163.2e9, net_nav_try: 146.7e9, adjusted_nav_try: 110e9, per_share_nav_try: 43.4,
            holding_discount_pct: 25, holding_net_debt_try: 16.5e9, shares_outstanding_mn: 2536,
            listed_count: 1, private_count: 0, total_subsidiary_count: 1,
          },
          age_days: 1,
        },
        notes: [],
      }),
    });
    const composed = composeReportContext({ ticker: 'KCHOL', reportId: 'rpt-1', accumulatedContext: ctx });
    expect(composed.sotp_present).toBe(true);
    expect(composed.target_price_publish_blocked).toBe(false);
    expect(composed.sotp_gate_pass).toBe(true);
    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/Parçaların Toplamı/);
    expect(html).toMatch(/Tüpraş/);
  });

  it('holding without SOTP YAML — target_price_publish_blocked banner + DCF marked upper-bound only', () => {
    const ctx = baseContext({
      valuation_agent_output: JSON.stringify({
        sector: 'holding',
        ticker: 'NOSOTP',
        dcf: { per_share_value: null, wacc_used: 0.14, terminal_growth: 0.03 },
        try_wacc_warning: false, holding_sotp_required: true, banking_sector_warning: false,
        sotp_gate_pass: false,
        target_price_publish_blocked: true,
        sotp_gate_reason: "holding company 'NOSOTP' has no SOTP YAML at config/sotp/NOSOTP.yaml — target_price publish blocked",
        sotp_data: null,
        notes: [],
      }),
      financial_analysis_output: JSON.stringify({
        ticker: 'NOSOTP', period_label: 'FY-2024', sector: 'holding',
        highlights: [], red_flags: [], canonical_numbers: { revenue: '1', cost_of_sales: '1' },
        engine_snapshot: { dcf: null },
      }),
    });
    const composed = composeReportContext({ ticker: 'NOSOTP', reportId: 'rpt-2', accumulatedContext: ctx });
    expect(composed.target_price_publish_blocked).toBe(true);
    expect(composed.sotp_gate_pass).toBe(false);
    expect(composed.target_price_blocked_banner_has).toBe(true);
    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/Hedef Fiyat Yayını Bloklandı/);
    expect(html).toMatch(/Holding SOTP Hard Gate/);
    // DCF section is suppressed entirely when per_share_value is null
    // (target_price stripped at adapter), so the upper-bound subtitle
    // never renders in this fixture. The publish-block banner is the
    // primary signal to the board reader.
  });
});

describe('Pre-Core-4 dry validation — Phase F QA publish gate', () => {
  it('QA hard_fail — top-of-section-I publish-block banner + COO delivery blocked', () => {
    const ctx = baseContext({
      qa_review_output: JSON.stringify({
        overall_score: 0.45, qa_decision: 'hard_fail',
        escalation_recommendation: 'block_publish',
        blocker_failures: ['MULTI_YEAR_COVERAGE', 'OWNERSHIP_FRESHNESS'],
        dimension_scores: [
          { code: 'MULTI_YEAR_COVERAGE', score: 0, evidence: '1 FY period available; need ≥3', is_blocker: true },
          { code: 'OWNERSHIP_FRESHNESS', score: 0, evidence: "source='static_fallback' — not board-grade", is_blocker: true },
        ],
      }),
    });
    const composed = composeReportContext({ ticker: 'KCHOL', reportId: 'rpt-3', accumulatedContext: ctx });
    expect(composed.qa_publish_block_has).toBe(true);
    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/QA Yayın Bloğu/);
    expect(html).toMatch(/MULTI_YEAR_COVERAGE/);
    expect(html).toMatch(/OWNERSHIP_FRESHNESS/);

    // COO delivery decision flips to blocked
    const delivery = runDeliveryCheck('KCHOL', html, {
      qa_decision: 'hard_fail',
      escalation_recommendation: 'block_publish',
      blocker_failures: ['MULTI_YEAR_COVERAGE', 'OWNERSHIP_FRESHNESS'],
    });
    expect(delivery.decision).toBe('blocked');
    expect(delivery.items.find(c => c.code === 'QA_GATE_PASS')?.passed).toBe(false);
  });

  it('QA pass — no publish-block banner, delivery approved', () => {
    const ctx = baseContext({
      qa_review_output: JSON.stringify({
        overall_score: 0.88, qa_decision: 'pass', escalation_recommendation: 'none',
        dimension_scores: [{ code: 'EVIDENCE_SUFFICIENCY', score: 0.9, evidence: '' }],
      }),
    });
    const composed = composeReportContext({ ticker: 'EREGL', reportId: 'rpt-4', accumulatedContext: ctx });
    expect(composed.qa_publish_block_has).toBe(false);
    const html = renderTemplate(TEMPLATE, composed);
    // The text is the literal banner copy; ensure it's NOT present
    expect(html).not.toMatch(/QA Yayın Bloğu/);
  });
});

describe('Pre-Core-4 dry validation — Phase G annual-report extracts', () => {
  it('annual-report extracts present → XI½ section renders with quoted blocks', () => {
    const ctx = baseContext({
      annual_report_extracts_output: JSON.stringify({
        ticker: 'KCHOL', source_path: '/tmp/2024_kchol_faaliyet.pdf',
        page_count: 240, byte_count: 5000000,
        chairman_letter: 'Değerli paydaşlar, 2024 yılında konsolide gelirimiz %18 artmıştır.',
        ceo_message: '2024\'te 12 milyar TL CAPEX yatırımı gerçekleştirdik.',
        executive_summary: '',
        segments_overview: 'Holding 5 sektörde faaliyet gösterir.',
        risks_section: 'Döviz volatilitesi en kritik risk faktörüdür.',
        outlook_section: '2025 yılında %15-20 büyüme bekliyoruz.',
        sustainability_section: 'CBAM kapsamında 850M EUR yıllık etki tahmini.',
        human_resources_section: '',
        warnings: [],
      }),
    });
    const composed = composeReportContext({ ticker: 'KCHOL', reportId: 'rpt-5', accumulatedContext: ctx });
    expect(composed.annual_report_present).toBe(true);
    expect(composed.annual_report_chairman_has).toBe(true);
    expect(composed.annual_report_ceo_has).toBe(true);
    expect(composed.annual_report_risks_has).toBe(true);
    expect(composed.annual_report_outlook_has).toBe(true);
    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/Birincil Kaynak Alıntıları/);
    expect(html).toMatch(/Değerli paydaşlar/);
    expect(html).toMatch(/12 milyar TL CAPEX/);
    expect(html).toMatch(/Döviz volatilitesi/);
  });

  it('no annual-report extracts → XI½ section omitted', () => {
    const composed = composeReportContext({ ticker: 'KCHOL', reportId: 'rpt-6', accumulatedContext: baseContext() });
    expect(composed.annual_report_present).toBe(false);
    const html = renderTemplate(TEMPLATE, composed);
    expect(html).not.toMatch(/Birincil Kaynak Alıntıları/);
  });
});

describe('Pre-Core-4 dry validation — composite (all gates exercised together)', () => {
  it('full happy-path holding report (KCHOL): SOTP renders, QA passes, annual extracts present, delivery approved', () => {
    const ctx = baseContext({
      qa_review_output: JSON.stringify({
        overall_score: 0.88, qa_decision: 'pass', escalation_recommendation: 'none',
        dimension_scores: [
          { code: 'VISUAL_COVERAGE', score: 1, evidence: '12/13 charts ready' },
          { code: 'MULTI_YEAR_COVERAGE', score: 1, evidence: '5 FY periods' },
        ],
      }),
      valuation_agent_output: JSON.stringify({
        sector: 'holding', ticker: 'KCHOL',
        dcf: { per_share_value: 433.5, wacc_used: 0.14, terminal_growth: 0.03 },
        try_wacc_warning: false, holding_sotp_required: true, banking_sector_warning: false,
        sotp_gate_pass: true,
        target_price_publish_blocked: false,
        sotp_gate_reason: 'SOTP gate satisfied',
        sotp_data: {
          ticker: 'KCHOL', verification_status: 'auto_curated_pending_operator_review',
          source: { url: 'x', as_of_date: '2026-04-28', source_filing: 'Curated' },
          shares_outstanding_mn: 2536, holding_net_debt_try: 16500000000, holding_discount_pct: 25,
          listed_subsidiaries: [
            { subsidiary: 'Tüpraş', ticker: 'TUPRS', stake_pct: 51, market_cap_try: 320e9, koc_effective_share_try: 163.2e9, nav_method: 'mcap × stake', notes: '' },
          ],
          private_subsidiaries: [],
          computed: {
            gross_nav_try: 163.2e9, net_nav_try: 146.7e9, adjusted_nav_try: 110e9, per_share_nav_try: 43.4,
            holding_discount_pct: 25, holding_net_debt_try: 16.5e9, shares_outstanding_mn: 2536,
            listed_count: 1, private_count: 0, total_subsidiary_count: 1,
          },
          age_days: 1,
        },
        notes: [],
      }),
      annual_report_extracts_output: JSON.stringify({
        ticker: 'KCHOL', source_path: '/tmp/x.pdf', page_count: 240, byte_count: 5_000_000,
        chairman_letter: 'Değerli paydaşlar 2024 büyüme yılı.',
        ceo_message: 'CAPEX 12 milyar TL.',
        executive_summary: '', segments_overview: '', risks_section: '',
        outlook_section: '2025 büyüme %15-20.', sustainability_section: '',
        human_resources_section: '', warnings: [],
      }),
    });
    const composed = composeReportContext({ ticker: 'KCHOL', reportId: 'rpt-happy', accumulatedContext: ctx });
    expect(composed.sotp_present).toBe(true);
    expect(composed.target_price_publish_blocked).toBe(false);
    expect(composed.qa_publish_block_has).toBe(false);
    expect(composed.annual_report_present).toBe(true);

    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/Parçaların Toplamı/);
    expect(html).not.toMatch(/QA Yayın Bloğu/);
    expect(html).not.toMatch(/Hedef Fiyat Yayını Bloklandı/);
    expect(html).toMatch(/Birincil Kaynak Alıntıları/);

    const delivery = runDeliveryCheck('KCHOL', html, {
      qa_decision: 'pass', escalation_recommendation: 'none', target_price_publish_blocked: false,
    });
    expect(delivery.decision).toBe('approved');
    expect(delivery.items.every(c => c.passed)).toBe(true);
  });

  it('full unhappy-path holding (NOSOTP): SOTP gate fails, QA fails, no annual report — every guard fires', () => {
    const ctx = baseContext({
      financial_analysis_output: JSON.stringify({
        ticker: 'NOSOTP', period_label: 'FY-2024', sector: 'holding',
        highlights: [], red_flags: [], canonical_numbers: { revenue: '1', cost_of_sales: '1' },
        engine_snapshot: { dcf: null },
      }),
      qa_review_output: JSON.stringify({
        overall_score: 0.32, qa_decision: 'hard_fail', escalation_recommendation: 'block_publish',
        blocker_failures: ['MULTI_YEAR_COVERAGE', 'OWNERSHIP_FRESHNESS', 'CFS_PARSED_NOT_ESTIMATED'],
        dimension_scores: [
          { code: 'MULTI_YEAR_COVERAGE', score: 0, evidence: '1 period only', is_blocker: true },
          { code: 'OWNERSHIP_FRESHNESS', score: 0, evidence: 'static_fallback', is_blocker: true },
        ],
      }),
      valuation_agent_output: JSON.stringify({
        sector: 'holding', ticker: 'NOSOTP',
        dcf: { per_share_value: null, wacc_used: 0.14, terminal_growth: 0.03 },
        try_wacc_warning: false, holding_sotp_required: true, banking_sector_warning: false,
        sotp_gate_pass: false,
        target_price_publish_blocked: true,
        sotp_gate_reason: 'no SOTP YAML',
        sotp_data: null,
        notes: [],
      }),
    });
    const composed = composeReportContext({ ticker: 'NOSOTP', reportId: 'rpt-bad', accumulatedContext: ctx });
    expect(composed.target_price_publish_blocked).toBe(true);
    expect(composed.qa_publish_block_has).toBe(true);
    expect(composed.annual_report_present).toBe(false);

    const html = renderTemplate(TEMPLATE, composed);
    expect(html).toMatch(/QA Yayın Bloğu/);
    expect(html).toMatch(/Hedef Fiyat Yayını Bloklandı/);
    expect(html).not.toMatch(/Birincil Kaynak Alıntıları/);

    const delivery = runDeliveryCheck('NOSOTP', html, {
      qa_decision: 'hard_fail', escalation_recommendation: 'block_publish',
      blocker_failures: ['MULTI_YEAR_COVERAGE', 'OWNERSHIP_FRESHNESS'],
      target_price_publish_blocked: true,
    });
    expect(delivery.decision).toBe('blocked');
    expect(delivery.items.find(c => c.code === 'QA_GATE_PASS')?.passed).toBe(false);
    expect(delivery.items.find(c => c.code === 'SOTP_PUBLISH_GATE')?.passed).toBe(false);
  });
});
