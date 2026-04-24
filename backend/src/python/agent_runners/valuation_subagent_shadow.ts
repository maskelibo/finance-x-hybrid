/**
 * Shadow fan-out for valuation_agent (Part 2 / Block S, FAZ S7).
 *
 * Same pattern as financial_analysis / macro_analysis shadow: the existing
 * Python + LLM hybrid flow stays authoritative; this module runs the 4
 * valuation sub-agents alongside without blocking the pipeline.
 *
 * val_scenario_builder is parallelizable=false — the parent-orchestrator
 * falls back to full sequential dispatch when any child is non-parallelizable.
 * That turns 4 concurrent tasks into 4 sequential tasks (slower but correct).
 * True "3 parallel then 1" hybrid strategy lands in S12 cutover.
 */

import {
  SUBAGENT_VALUATION_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';

export function valuationShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_VALUATION_ENABLED;
}

export function fireValuationShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!valuationShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] valuation_agent sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  await executeWithSubAgents(
    'valuation_agent',
    runId,
    sessionId,
    {
      ticker,
      sector: accumulatedContext['sector'] ?? null,
      current_price_try: accumulatedContext['current_price'] ?? null,
      market_cap_try_mn: accumulatedContext['market_cap_try_mn'] ?? null,
      shares_outstanding_mn: accumulatedContext['shares_outstanding_mn'] ?? null,
      financial_analysis_output: accumulatedContext['financial_analysis_output'] ?? null,
      macro_analysis_output: accumulatedContext['macro_analysis_output'] ?? null,
      sector_competition_output: accumulatedContext['sector_competition_output'] ?? null,
      fact_pack: accumulatedContext['fact_pack'] ?? null,
    },
    accumulatedContext,
    compileValuation,
  );
}

async function compileValuation(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const compiled: Record<string, unknown> = {
    ticker: parentCtx['ticker'],
    sector: parentCtx['sector'],
    sub_agent_breakdown: {} as Record<string, { status: string; duration_ms: number }>,
  };
  const breakdown = compiled['sub_agent_breakdown'] as Record<string, { status: string; duration_ms: number }>;

  for (const r of subResults) {
    breakdown[r.sub_agent_id] = { status: r.status, duration_ms: r.duration_ms };
    if (r.status !== 'completed' || !r.output_parsed) continue;
    compiled[r.sub_agent_id] = r.output_parsed;
  }

  // Surface a composite target derived from val_scenario_builder when
  // present — that's the designated aggregator of the other three.
  const sb = compiled['val_scenario_builder'] as { weighted_blended_target_try?: number } | undefined;
  if (sb?.weighted_blended_target_try != null) {
    compiled['composite_target_price_try'] = sb.weighted_blended_target_try;
  }

  const completed = subResults.filter((r) => r.status === 'completed').length;
  compiled['composite_quality_score'] = subResults.length > 0
    ? Math.round((completed / subResults.length) * 100) / 100
    : 0;

  return JSON.stringify(compiled, null, 2);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
