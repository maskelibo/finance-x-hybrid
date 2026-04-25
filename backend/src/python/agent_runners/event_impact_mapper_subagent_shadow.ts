/**
 * Shadow fan-out for event_impact_mapper (Part 2 / Block S, FAZ S9).
 *
 * Two parallel sub-agents:
 *   eim_quant_mapper       sonnet — per-event sayısal etki (mn TL, %)
 *   eim_accounting_mapper  sonnet — per-event IS/BS/CF kalem etkisi
 *
 * Both run after the legacy Python event_impact_mapper completes; this is a
 * fire-and-forget shadow, the legacy output stays authoritative.
 *
 * Uses the standard executeWithSubAgents helper (no dynamic spawn — the
 * holding case complexity from S8 doesn't apply here; both sub-agents see
 * the same classified events list).
 */

import {
  SUBAGENT_EVENT_IMPACT_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';

export function eventImpactShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_EVENT_IMPACT_ENABLED;
}

export function fireEventImpactShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!eventImpactShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] event_impact_mapper sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  await executeWithSubAgents(
    'event_impact_mapper',
    runId,
    sessionId,
    {
      ticker,
      sector: accumulatedContext['sector'] ?? accumulatedContext['sector_override'] ?? null,
      event_classification_output: accumulatedContext['event_classification_output'] ?? null,
      event_impact_mapper_output: accumulatedContext['event_impact_mapper_output'] ?? null,
      financial_analysis_output: accumulatedContext['financial_analysis_output'] ?? null,
      parse_standardization_output: accumulatedContext['parse_standardization_output'] ?? null,
      fact_pack: accumulatedContext['fact_pack'] ?? null,
    },
    accumulatedContext,
    compileEventImpact,
  );
}

async function compileEventImpact(
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
    if (r.status === 'completed' && r.output_parsed) {
      compiled[r.sub_agent_id] = r.output_parsed;
    }
  }

  // Convenience surface: counts from each sub-agent so downstream consumers
  // don't have to reach into the per-agent JSON.
  const quant = compiled['eim_quant_mapper'] as { event_impacts?: unknown[]; summary?: { net_direction?: string } } | undefined;
  const acc = compiled['eim_accounting_mapper'] as { event_accounting_impacts?: unknown[] } | undefined;
  compiled['quant_events_analyzed'] = quant?.event_impacts?.length ?? 0;
  compiled['accounting_events_analyzed'] = acc?.event_accounting_impacts?.length ?? 0;
  compiled['net_direction'] = quant?.summary?.net_direction ?? null;

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
