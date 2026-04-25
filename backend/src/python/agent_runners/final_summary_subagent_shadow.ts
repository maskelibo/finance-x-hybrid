/**
 * Shadow fan-out for final_summary (Part 2 / Block S, FAZ S10).
 *
 * Three sub-agents:
 *   fs_executive_summary_writer  sonnet, parallel — exec_summary + key_findings + investment_view + risk_summary
 *   fs_scorecard_builder         sonnet, parallel — 6-dimension scorecard + Bear/Base/Bull scenarios
 *   fs_disclosure_guard          deterministic Python, parallel — SPK / KAP material disclosures + disclaimers
 *
 * S10 introduces compact_summary_pack as a NEW architectural layer between
 * the orchestrator's accumulatedContext and the sub-agent task_inputs.
 * Raw upstream outputs (50-100KB JSON each) never reach the sub-agents
 * directly — instead, this shadow runner builds a single compact pack
 * (top-N insights, contradictions, citation facts) once, then hands each
 * sub-agent only the slice it needs (`packForSubAgent`).
 *
 * Why this matters: even with the dispatcher sanitizer (sanitizeTaskInputs),
 * raw upstream truncation throws away a lot of signal — most truncated bytes
 * are markdown narrative noise, while the high-signal items the sub-agent
 * actually needs are the top decisions/insights. The compact pack does
 * domain-aware top-N extraction so the sub-agent's prompt is small AND
 * information-dense.
 *
 * Each sub-agent's task_inputs still pass through dispatcher's
 * sanitizeTaskInputs() as a defensive last line, but the pack itself is
 * already small (<15KB total).
 */

import {
  SUBAGENT_FINAL_SUMMARY_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { dispatchSubAgents } from '../../sub-agents/dispatcher.js';
import { getSubAgentsForParent } from '../../sub-agents/registry.js';
import { buildCompactSummaryPack, packForSubAgent } from '../../sub-agents/compact_summary_pack.js';
import type { SubAgentResult, SubAgentTask } from '../../sub-agents/types.js';

export function finalSummaryShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_FINAL_SUMMARY_ENABLED;
}

export function fireFinalSummaryShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!finalSummaryShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] final_summary sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  // Single-pass compact pack build — sub-agent başına ayrı parse yok.
  const pack = buildCompactSummaryPack(accumulatedContext);
  const packBytes = JSON.stringify(pack).length;
  console.log(
    `[shadow:final_summary] compact_pack built — ticker=${pack.ticker} sector=${pack.sector ?? '-'} is_holding=${pack.is_holding} total=${Math.round(packBytes / 1024)}KB ` +
      `[fin=${pack.top_financial_insights.length} val=${pack.top_valuation_outputs.length} sec=${pack.top_sector_findings.length} mac=${pack.top_macro_impacts.length} evt=${pack.top_event_conclusions.length} contra=${pack.unresolved_contradictions.length} cit=${pack.citation_sensitive_facts.length}]`,
  );

  const subs = getSubAgentsForParent('final_summary');
  if (subs.length === 0) {
    console.warn('[shadow:final_summary] no sub-agents registered — skipping');
    return;
  }

  // Per-sub-agent slice; raw upstream outputs INTENTIONALLY excluded from
  // task_inputs so the dispatcher only sees the compact pack subset.
  const tasks: SubAgentTask[] = subs.map((sa) => ({
    sub_agent_id: sa.id,
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'final_summary',
    task_description: `final_summary sub-agent: ${sa.display_name} — uses compact_summary_pack subset only.`,
    task_inputs: packForSubAgent(sa.id, pack) as Record<string, unknown>,
  }));

  const startedAt = Date.now();
  const strategy = subs.every((sa) => sa.parallelizable) ? 'parallel' : 'sequential';
  const results = await dispatchSubAgents(tasks, strategy, accumulatedContext);
  const totalMs = Date.now() - startedAt;

  // Per-sub-agent dur + bytes + status — kullanıcının S10 kural #6.
  for (const r of results) {
    const bytes = (r.output ?? '').length;
    console.log(
      `[shadow:final_summary] ${r.sub_agent_id} status=${r.status} dur=${Math.round((r.duration_ms ?? 0) / 1000)}s bytes=${bytes}` +
        (r.error ? ` err=${String(r.error).slice(0, 140)}` : ''),
    );
  }

  const compiled = compileFinalSummary(results, ticker);
  const completed = results.filter((r) => r.status === 'completed').length;
  console.log(
    `[shadow:final_summary] done ${completed}/${results.length} sub-agents in ${Math.round(totalMs / 1000)}s — composite_quality=${compiled.composite_quality_score}`,
  );
}

interface CompiledFinalSummary {
  ticker: string;
  sub_agent_breakdown: Record<string, { status: string; duration_ms: number; bytes: number }>;
  fs_executive_summary_writer?: unknown;
  fs_scorecard_builder?: unknown;
  fs_disclosure_guard?: unknown;
  composite_quality_score: number;
}

function compileFinalSummary(
  subResults: SubAgentResult[],
  ticker: string,
): CompiledFinalSummary {
  const compiled: CompiledFinalSummary = {
    ticker,
    sub_agent_breakdown: {},
    composite_quality_score: 0,
  };

  for (const r of subResults) {
    compiled.sub_agent_breakdown[r.sub_agent_id] = {
      status: r.status,
      duration_ms: r.duration_ms,
      bytes: (r.output ?? '').length,
    };
    if (r.status === 'completed' && r.output_parsed) {
      (compiled as unknown as Record<string, unknown>)[r.sub_agent_id] = r.output_parsed;
    }
  }

  const completed = subResults.filter((r) => r.status === 'completed').length;
  compiled.composite_quality_score = subResults.length > 0
    ? Math.round((completed / subResults.length) * 100) / 100
    : 0;
  return compiled;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
