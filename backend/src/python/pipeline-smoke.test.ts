/**
 * Pipeline smoke test.
 *
 * Feeds each of the reshape-only Python runners (waves 10+) with a
 * realistic accumulatedContext — mimicking what the LLM or earlier
 * Python agents would have produced — and verifies the full handoff
 * chain:
 *
 *   1. Runner returns 'ok'.
 *   2. accumulatedContext gains the expected `<agent>_output` key.
 *   3. DB row for the run lands at status='completed' with
 *      provider_used='python' and parseable output_text JSON.
 *   4. Downstream runner can actually consume the upstream output
 *      (so the inter-adapter schemas line up).
 *
 * Skipped from this file: kap_watch, data_collection,
 * parse_standardization, reconciliation, financial_analysis,
 * macro_analysis, sentiment_news, technical_analysis. Those runners
 * spawn the Python CLI and are covered by bridge.test.ts +
 * runners.test.ts. Smoke target is the 8 in-process reshape
 * adapters that came out of Wave 10.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';

import { db } from '../db.js';
import { runPythonEventClassification } from './agent_runners/event_classification.js';
import { runPythonEventImpactMapper } from './agent_runners/event_impact_mapper.js';
import { runPythonEventTimelineAlert } from './agent_runners/event_timeline_alert.js';
import { runPythonCoo } from './agent_runners/coo.js';
import { runPythonQaReview } from './agent_runners/qa_review.js';
import { runPythonSectorCompetition } from './agent_runners/sector_competition.js';
import { runPythonStrategicSynthesis } from './agent_runners/strategic_synthesis.js';
import { runPythonValuation } from './agent_runners/valuation.js';
import { runPythonAnalystConsensus } from './agent_runners/analyst_consensus.js';
import { runPythonEsg } from './agent_runners/esg.js';


const sessionId = `smoke-${nanoid()}`;
const ticker = 'SMOKE';
const now = new Date().toISOString();

// Agents we'll exercise, in dependency order.
const AGENTS = [
  'coo_preflight',
  'event_classification',
  'event_impact_mapper',
  'event_timeline_alert',
  'sector_competition',
  'qa_review',
  'strategic_synthesis',
  'valuation_agent',
  'analyst_consensus_agent',
  'esg_agent',
  'coo_delivery',
] as const;

const runIds: Record<string, string> = {};


beforeAll(() => {
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(sessionId, ticker, 'test', 'running', now);

  for (const name of AGENTS) {
    // Map display id — the two coo invocations share agent_id='coo' in
    // prod, but we want distinct rows in the test DB for clarity.
    const rid = `${name}-${nanoid()}`;
    runIds[name] = rid;
    const agentId = name.startsWith('coo_') ? 'coo' : name;
    db.prepare(
      `INSERT INTO agent_runs (id, session_id, agent_id, agent_display_name, status)
       VALUES (?, ?, ?, ?, 'pending')`,
    ).run(rid, sessionId, agentId, agentId);
  }
});


afterAll(() => {
  db.prepare('DELETE FROM analysis_sessions WHERE id = ?').run(sessionId);
  // agent_runs rows cascade via FK
});


function readRunRow(runId: string) {
  return db.prepare(
    `SELECT status, provider_used, output_text, error_message, input_prompt
     FROM agent_runs WHERE id = ?`,
  ).get(runId) as {
    status: string;
    provider_used: string | null;
    output_text: string | null;
    error_message: string | null;
    input_prompt: string | null;
  };
}


// ---------------------------------------------------------------------
// Realistic synthetic upstream payloads — shapes must match what the
// earlier agents (or their Python adapters) actually emit in prod.
// ---------------------------------------------------------------------

const kapWatchOutput = {
  ticker: 'SMOKE',
  window_start: '2025-10-01',
  window_end: '2026-04-16',
  disclosure_inventory: [
    {
      disclosure_id: 'kap-1',
      title: '2025 Kâr Payı Dağıtımı Hakkında',
      url: 'https://kap.org.tr/tr/Bildirim/kap-1',
      published_at: '2026-03-28T15:00:00Z',
      event_type_hint: 'dividend',
      confidence_hint: 'high',
      is_material: true,
      quantitative_impact_try: 5_000_000_000,
    },
    {
      disclosure_id: 'kap-2',
      title: 'Yeni Tedarik Sözleşmesi İmzalandı',
      url: 'https://kap.org.tr/tr/Bildirim/kap-2',
      published_at: '2026-02-15T10:00:00Z',
      event_type_hint: 'new_contract',
      confidence_hint: 'medium',
      is_material: true,
    },
    {
      disclosure_id: 'kap-3',
      title: 'Olağan Genel Kurul Çağrısı',
      url: 'https://kap.org.tr/tr/Bildirim/kap-3',
      published_at: '2026-03-05T09:00:00Z',
      event_type_hint: 'governance',
      confidence_hint: 'medium',
      is_material: false,
    },
    {
      disclosure_id: 'kap-4',
      title: 'Sıradan bildirim',
      url: 'https://kap.org.tr/tr/Bildirim/kap-4',
      published_at: '2026-01-10T12:00:00Z',
      event_type_hint: 'other',
      confidence_hint: 'low',
      is_material: null,
    },
  ],
};

const financialAnalysisOutput = {
  ticker: 'SMOKE',
  period_label: 'FY-2024',
  sector: 'industrial',
  highlights: [
    { code: 'GROSS_MARGIN',       label: 'Gross margin',       value: 18, narrative_hint: 'Marj tarihsel ortalamanın üzerinde' },
    { code: 'EBITDA_MARGIN',      label: 'EBITDA margin',      value: 12, narrative_hint: 'Güçlü operasyonel kâr' },
    { code: 'NET_MARGIN',         label: 'Net margin',         value: 6,  narrative_hint: 'Finansal giderler marjı sınırlıyor' },
    { code: 'ROE',                label: 'Return on equity',   value: 14, narrative_hint: 'Sektör ortalaması üstünde' },
    { code: 'NET_DEBT_TO_EBITDA', label: 'Net debt/EBITDA',    value: 2.1, narrative_hint: 'Sağlıklı kaldıraç' },
  ],
  red_flags: [
    { code: 'MINOR_CAPEX_SPIKE', severity: 'info', message: 'Q4 CAPEX ≈ 2× Q3 (tek seferlik)' },
  ],
  canonical_numbers: {
    revenue: '250000', ebitda: '30000', net_income: '15000',
    total_debt: '63000', cash: '0', total_equity: '107143',
  },
  engine_snapshot: {
    dcf: {
      enterprise_value: 180000,
      equity_value: 117000,
      per_share_value: 47.5,
      wacc_used: 0.14,
      terminal_growth: 0.03,
    },
  },
};

const reconciliationOutput = {
  ticker: 'SMOKE',
  period_label: 'FY-2024',
  checks: [
    { code: 'BS_IDENTITY',          passed: true,  message: 'assets = liab + equity' },
    { code: 'IS_NET_SPLIT',         passed: true,  message: 'gross → operating → net chain clean' },
    { code: 'CF_NET_INCOME_CHAIN',  passed: true,  message: 'OCF starts from net income' },
    { code: 'NET_DEBT_CHAIN',       passed: false, message: 'trade payables incorrectly included' },
  ],
};

const peerAnalyses = [
  {
    ticker: 'PEER1',
    sector: 'industrial',
    highlights: [
      { code: 'GROSS_MARGIN',       value: 22 },
      { code: 'EBITDA_MARGIN',      value: 14 },
      { code: 'NET_MARGIN',         value: 8 },
      { code: 'ROE',                value: 17 },
      { code: 'NET_DEBT_TO_EBITDA', value: 1.8 },
    ],
  },
  {
    ticker: 'PEER2',
    sector: 'industrial',
    highlights: [
      { code: 'GROSS_MARGIN',       value: 15 },
      { code: 'EBITDA_MARGIN',      value: 9 },
      { code: 'NET_MARGIN',         value: 3 },
      { code: 'ROE',                value: 9 },
      { code: 'NET_DEBT_TO_EBITDA', value: 3.2 },
    ],
  },
];

const technicalAnalysisOutput = { ticker: 'SMOKE', overall_trend: 'bullish', rsi_14: 62 };
const macroAnalysisOutput = { ticker: 'SMOKE', tilt: 'negative', usd_try: '38.45' };

const reportFormatterHtml = `<!doctype html>
<html lang="tr">
  <body>
    <h1>SMOKE — Rapor</h1>
    <table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody><tr><td>Revenue</td><td>250.000</td></tr></tbody>
    </table>
    <p>Bu bir analiz özetidir, ${'detay '.repeat(1000)} yatırım tavsiyesi değildir.</p>
  </body>
</html>`;


// ---------------------------------------------------------------------
// Tests — each runs sequentially; we accumulate state across them.
// ---------------------------------------------------------------------

const ctx: Record<string, unknown> = {};


describe('Pipeline smoke — reshape-only Python runners', () => {

  it('01 — coo preflight runs before data_collection with empty context', async () => {
    // Preflight does NOT set delivery_check_mode
    const outcome = await runPythonCoo(sessionId, runIds.coo_preflight, ticker, ctx);
    expect(outcome).toBe('ok');
    const row = readRunRow(runIds.coo_preflight);
    expect(row.status).toBe('completed');
    expect(row.provider_used).toBe('python');
    const parsed = JSON.parse(row.output_text!);
    expect(parsed.phase).toBe('preflight');
    expect(parsed.decision).toBe('go');
    expect(ctx.coo_output).toBeTruthy();
  });

  it('02 — event_classification consumes kap_watch_output and produces classified_events', async () => {
    ctx.kap_watch_output = JSON.stringify(kapWatchOutput);
    const outcome = await runPythonEventClassification(sessionId, runIds.event_classification, ticker, ctx);
    expect(outcome).toBe('ok');
    const row = readRunRow(runIds.event_classification);
    expect(row.status).toBe('completed');
    const parsed = JSON.parse(row.output_text!);
    expect(parsed.classified_events.length).toBe(4);
    expect(parsed.high_confidence_count + parsed.medium_confidence_count + parsed.low_confidence_count).toBe(4);
    expect(ctx.event_classification_output).toBeTruthy();
  });

  it('03 — event_impact_mapper consumes event_classification_output', async () => {
    const outcome = await runPythonEventImpactMapper(sessionId, runIds.event_impact_mapper, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.event_impact_mapper).output_text!);
    expect(parsed.event_impacts.length).toBe(4);
    const dividend = parsed.event_impacts.find((e: { event_type: string }) => e.event_type === 'dividend');
    expect(dividend.affected_statements).toContain('CF');
    expect(dividend.quantification_possible).toBe(true);
    expect(ctx.event_impact_mapper_output).toBeTruthy();
  });

  it('04 — event_timeline_alert consumes classification + impact outputs', async () => {
    const outcome = await runPythonEventTimelineAlert(sessionId, runIds.event_timeline_alert, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.event_timeline_alert).output_text!);
    expect(parsed).toHaveProperty('agent_id', 'event_timeline_alert');
    expect(ctx.event_timeline_alert_output).toBeTruthy();
  });

  it('05 — sector_competition consumes financial_analysis + peers', async () => {
    ctx.financial_analysis_output = JSON.stringify(financialAnalysisOutput);
    ctx.sector_competition_peers = JSON.stringify(peerAnalyses);
    const outcome = await runPythonSectorCompetition(sessionId, runIds.sector_competition, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.sector_competition).output_text!);
    expect(parsed.benchmarks.length).toBeGreaterThanOrEqual(5);
    expect(parsed.peer_group).toEqual(['PEER1', 'PEER2']);
    expect(ctx.sector_competition_output).toBeTruthy();
  });

  it('06 — qa_review consumes financial_analysis + reconciliation', async () => {
    ctx.reconciliation_output = JSON.stringify(reconciliationOutput);
    const outcome = await runPythonQaReview(sessionId, runIds.qa_review, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.qa_review).output_text!);
    expect(parsed.dimension_scores.length).toBe(5);
    expect(['pass', 'conditional_pass', 'fail']).toContain(parsed.qa_decision);
    const mc = parsed.dimension_scores.find((d: { code: string }) => d.code === 'MATH_CONSISTENCY');
    expect(mc.score).toBe(0.75); // 3/4 reconciliation checks passed
    expect(ctx.qa_review_output).toBeTruthy();
  });

  it('07 — strategic_synthesis consumes all 5 upstream signal sources', async () => {
    ctx.technical_analysis_output = JSON.stringify(technicalAnalysisOutput);
    ctx.macro_analysis_output = JSON.stringify(macroAnalysisOutput);
    const outcome = await runPythonStrategicSynthesis(sessionId, runIds.strategic_synthesis, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.strategic_synthesis).output_text!);
    expect(parsed.signals.positive.length + parsed.signals.negative.length + parsed.signals.neutral.length).toBeGreaterThan(0);
    expect(parsed.convergence_score).toBeGreaterThanOrEqual(-1);
    expect(parsed.convergence_score).toBeLessThanOrEqual(1);
    expect(['low', 'medium', 'high']).toContain(parsed.confidence);
    expect(ctx.strategic_synthesis_output).toBeTruthy();
  });

  it('08 — valuation consumes financial_analysis engine_snapshot + sector_competition benchmarks', async () => {
    const outcome = await runPythonValuation(sessionId, runIds.valuation_agent, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.valuation_agent).output_text!);
    expect(parsed.dcf).toBeTruthy();
    expect(parsed.dcf.per_share_value).toBe(47.5);
    expect(parsed.try_wacc_warning).toBe(false); // WACC = 0.14, USD-like
    expect(parsed.banking_sector_warning).toBe(false);
    expect(parsed.peer_ev_ebitda).not.toBeNull();
    expect(ctx.valuation_agent_output).toBeTruthy();
  });

  it('09a — analyst_consensus consumes analyst_consensus_reports context', async () => {
    ctx.analyst_consensus_reports = JSON.stringify([
      { broker: 'Is Yatirim',   recommendation: 'buy',  target_price: 55, report_date: '2026-04-10' },
      { broker: 'Ak Yatirim',   recommendation: 'hold', target_price: 48, report_date: '2026-03-25' },
      { broker: 'Garanti BBVA', recommendation: 'buy',  target_price: 52, report_date: '2026-04-05' },
    ]);
    ctx.last_close_trym = 45;
    const outcome = await runPythonAnalystConsensus(sessionId, runIds.analyst_consensus_agent, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.analyst_consensus_agent).output_text!);
    expect(parsed.count).toBe(3);
    expect(parsed.distribution_buy).toBe(2);
    expect(parsed.distribution_hold).toBe(1);
    expect(parsed.target_price_mean).toBeGreaterThan(0);
    expect(parsed.upside_vs_last_close_pct).toBeGreaterThan(0);
    expect(ctx.analyst_consensus_agent_output).toBeTruthy();
  });

  it('09b — esg_agent runs CBAM math when esg_cbam_inputs supplied', async () => {
    ctx.esg_cbam_inputs = JSON.stringify({
      scope1_tco2: 5_000_000,          // heavy emitter scale (steel)
      carbon_price_eur_per_t: 85,
      ets_free_allowance_pct: 0.5,
      cbam_coverage_pct: 0.485,
      eur_try: 45,
    });
    const outcome = await runPythonEsg(sessionId, runIds.esg_agent, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.esg_agent).output_text!);
    expect(parsed.cbam).not.toBeNull();
    expect(parsed.cbam.total_annual_cost_eur).toBeGreaterThan(0);
    expect(parsed.cbam.total_annual_cost_try).toBeGreaterThan(0);
    expect(parsed.sector_hint).toBe('industrial');   // picked up from fa upstream
    expect(ctx.esg_agent_output).toBeTruthy();
  });

  it('09 — coo delivery consumes report_formatter_html', async () => {
    ctx.delivery_check_mode = true;
    ctx.report_formatter_html = reportFormatterHtml;
    const outcome = await runPythonCoo(sessionId, runIds.coo_delivery, ticker, ctx);
    expect(outcome).toBe('ok');
    const parsed = JSON.parse(readRunRow(runIds.coo_delivery).output_text!);
    expect(parsed.phase).toBe('delivery');
    expect(parsed.decision).toBe('approved');
  });


  it('10 — full chain summary: every agent completed, every output_key populated', () => {
    for (const name of AGENTS) {
      const row = readRunRow(runIds[name]);
      expect(row.status, `${name} must complete`).toBe('completed');
      expect(row.provider_used, `${name} must be marked python`).toBe('python');
      expect(row.output_text, `${name} must have output_text`).toBeTruthy();
      expect(row.error_message, `${name} must have no error`).toBeNull();
    }
    // accumulated context fed forward correctly
    const expectedKeys = [
      'coo_output',
      'event_classification_output',
      'event_impact_mapper_output',
      'event_timeline_alert_output',
      'sector_competition_output',
      'qa_review_output',
      'strategic_synthesis_output',
      'valuation_agent_output',
      'analyst_consensus_agent_output',
      'esg_agent_output',
    ];
    for (const k of expectedKeys) {
      expect(ctx[k], `ctx.${k} must be populated`).toBeTruthy();
    }
  });
});
