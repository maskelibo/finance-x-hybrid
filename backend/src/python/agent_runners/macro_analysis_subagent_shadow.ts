/**
 * Shadow fan-out for macro_analysis (Part 2 / Block S, FAZ S6).
 *
 * Same pattern as financial_analysis shadow: the existing Python + LLM
 * enrichment in orchestrator remains authoritative; this module runs the
 * 3 macro sub-agents alongside without blocking the pipeline.
 *
 * Note on execution strategy: ma_company_transmission has parallelizable=false
 * because it consumes the first two sub-agents' outputs. The current
 * parent-orchestrator falls back to sequential when any child is
 * non-parallelizable; that's slower than "2 parallel, then 1" but correct.
 * S12 cutover refines this into a true hybrid strategy.
 */

import {
  SUBAGENT_MACRO_ANALYSIS_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';

export function macroAnalysisShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_MACRO_ANALYSIS_ENABLED;
}

export function fireMacroAnalysisShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!macroAnalysisShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] macro_analysis sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  await executeWithSubAgents(
    'macro_analysis',
    runId,
    sessionId,
    {
      ticker,
      sector: accumulatedContext['sector'] ?? null,
      macro_snapshot: accumulatedContext['macro_snapshot'] ?? null,
      external_research_output: accumulatedContext['external_research_output'] ?? null,
    },
    accumulatedContext,
    compileMacroAnalysis,
  );
}

async function compileMacroAnalysis(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const compiled: Record<string, unknown> = {
    ticker: parentCtx['ticker'],
    sub_agent_breakdown: {} as Record<string, { status: string; duration_ms: number }>,
  };
  const breakdown = compiled['sub_agent_breakdown'] as Record<string, { status: string; duration_ms: number }>;

  for (const r of subResults) {
    breakdown[r.sub_agent_id] = { status: r.status, duration_ms: r.duration_ms };
    if (r.status !== 'completed' || !r.output_parsed) continue;
    compiled[r.sub_agent_id] = r.output_parsed;
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
