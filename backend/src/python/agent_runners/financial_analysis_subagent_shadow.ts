/**
 * Shadow-mode fan-out for financial_analysis (Part 2 / Block S, FAZ S4).
 *
 * Unlike data_collection / parse_standardization, financial_analysis already
 * uses a Python + LLM hybrid path. Rewriting that flow to route through the
 * sub-agent wrapper is premature — instead, this module runs the 5
 * financial_analysis sub-agents *alongside* the legacy flow when the
 * shadow / enable flags are on, without touching the legacy agent_runs row.
 *
 * Invoked from orchestrator after the legacy financial_analysis has
 * completed. Fire-and-forget so pipeline latency is unaffected.
 */

import {
  SUBAGENT_FINANCIAL_ANALYSIS_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';

const REQUIRED_28_METRICS = [
  // Profitability
  'revenue_5y', 'gross_margin_5y_pct', 'ebitda_5y_try_mn', 'ebitda_margin_5y_pct', 'net_income_5y_try_mn',
  // Working Capital
  'dso_5y', 'dio_5y', 'dpo_5y', 'ccc_5y', 'nwc_revenue_pct_5y',
  // Leverage & Liquidity
  'net_debt_5y_try_mn', 'net_debt_ebitda_5y', 'current_ratio_5y', 'acid_test_5y', 'interest_coverage_5y',
  // Cash Flow
  'ocf_5y_try_mn', 'fcf_5y_try_mn', 'capex_5y_try_mn', 'capex_ebitda_5y_pct', 'ocf_ebitda_5y',
  // IAS 29 & sector
  'ias29_adjusted_ebitda_5y_try_mn', 'ias29_adjusted_ni_5y_try_mn', 'monetary_gain_loss_5y_try_mn',
  'ebitdar_5y_try_mn', 'ebitdar_margin_5y_pct',
  // Red flags / bridge (boolean / object presence)
  'cash_ebitda_bridge', 'red_flags_present', 'sector_kpis_present',
];

export function financialAnalysisShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_FINANCIAL_ANALYSIS_ENABLED;
}

export function fireFinancialAnalysisShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!financialAnalysisShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] financial_analysis sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  await executeWithSubAgents(
    'financial_analysis',
    runId,
    sessionId,
    {
      ticker,
      sector: accumulatedContext['sector'] ?? null,
      parse_standardization_output: accumulatedContext['parse_standardization_output'] ?? null,
      reconciliation_output: accumulatedContext['reconciliation_output'] ?? null,
      fact_pack: accumulatedContext['fact_pack'] ?? null,
    },
    accumulatedContext,
    compileFinancialAnalysis,
  );
}

async function compileFinancialAnalysis(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const compiled: Record<string, unknown> = {
    ticker: parentCtx['ticker'],
    sector: parentCtx['sector'],
    metrics: {} as Record<string, unknown>,
    sub_agent_breakdown: {} as Record<string, { status: string; duration_ms: number }>,
  };

  const metrics = compiled['metrics'] as Record<string, unknown>;
  const breakdown = compiled['sub_agent_breakdown'] as Record<string, { status: string; duration_ms: number }>;

  for (const r of subResults) {
    breakdown[r.sub_agent_id] = { status: r.status, duration_ms: r.duration_ms };
    if (r.status !== 'completed' || !r.output_parsed || typeof r.output_parsed !== 'object') continue;
    const parsed = r.output_parsed as Record<string, unknown>;
    const m = parsed['metrics'] ?? parsed['kpis'];
    if (m && typeof m === 'object') Object.assign(metrics, m);
    if (r.sub_agent_id === 'fa_cash_flow') {
      metrics['cash_ebitda_bridge'] = parsed['cash_ebitda_bridge'] ?? null;
      const rf = parsed['red_flags'];
      metrics['red_flags_present'] = Array.isArray(rf) && rf.length > 0;
    }
    if (r.sub_agent_id === 'fa_sector_kpi') {
      metrics['sector_kpis_present'] = !!parsed['kpis'];
    }
  }

  const completed = subResults.filter((r) => r.status === 'completed').length;
  const present = REQUIRED_28_METRICS.filter((k) => metrics[k] !== undefined).length;
  compiled['composite_quality_score'] = Math.round((completed / subResults.length) * 100) / 100;
  compiled['mandatory_metrics_present'] = present;
  compiled['mandatory_metrics_total'] = REQUIRED_28_METRICS.length;
  compiled['mandatory_metrics_missing'] = REQUIRED_28_METRICS.filter((k) => metrics[k] === undefined);

  return JSON.stringify(compiled, null, 2);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
