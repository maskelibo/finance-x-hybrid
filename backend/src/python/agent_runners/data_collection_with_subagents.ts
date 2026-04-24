/**
 * Sub-agent aware data_collection runner.
 *
 * Part 2 / Block S wraps the legacy data_collection agent in a 4-way
 * sub-agent fan-out. Flag model during S2..S11:
 *
 *   SUBAGENT_DATA_COLLECTION_ENABLED  SUBAGENT_SHADOW_MODE  Behaviour
 *   --------------------------------  --------------------  ----------
 *   false                             false                 legacy only (no sub-agents)
 *   *                                 true                  legacy authoritative + shadow fan-out persisted
 *
 * Authoritative cutover to sub-agents happens at S12 — until then, legacy
 * always writes the parent agent_runs row. Shadow results land in
 * sub_agent_runs for offline comparison.
 */

import {
  SUBAGENT_DATA_COLLECTION_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';
import { runPythonDataCollection, type RunOutcome } from './data_collection.js';

export async function runDataCollectionSubagentAware(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const shadowActive = SUBAGENT_SHADOW_MODE || SUBAGENT_DATA_COLLECTION_ENABLED;

  const legacyOutcome = await runPythonDataCollection(sessionId, runId, ticker, accumulatedContext);

  if (shadowActive) {
    // Fire-and-forget so sub-agent latency does not stretch the pipeline.
    // Results land in sub_agent_runs via the dispatcher.
    void runSubAgents(sessionId, runId, ticker, accumulatedContext).catch((err) => {
      console.warn(`[shadow] data_collection sub-agents failed: ${errMsg(err)}`);
    });
  }

  return legacyOutcome;
}

async function runSubAgents(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): ReturnType<typeof executeWithSubAgents> {
  return executeWithSubAgents(
    'data_collection',
    runId,
    sessionId,
    {
      ticker,
      fact_pack: accumulatedContext['fact_pack'] ?? null,
      // D-listesi fix (2026-04-24): dc_financials_collector is deterministic
      // and parses the legacy manifest directly — pass it through task_inputs
      // so the sub-agent doesn't need to re-crawl KAP.
      data_collection_output: accumulatedContext['data_collection_output'] ?? null,
    },
    accumulatedContext,
    compileDataCollectionOutput,
  );
}

async function compileDataCollectionOutput(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const findings: Record<string, unknown> = { ticker: parentCtx['ticker'] };

  for (const r of subResults) {
    if (r.status !== 'completed' || !r.output_parsed) {
      findings[`${r.sub_agent_id}_status`] = r.status;
      findings[`${r.sub_agent_id}_error`] = r.error ?? null;
      continue;
    }
    findings[r.sub_agent_id] = r.output_parsed;
  }

  const fin = findings['dc_financials_collector'] as { statements?: { income_statement?: unknown[] } } | undefined;
  const disc = findings['dc_disclosure_collector'] as { disclosures?: unknown[] } | undefined;
  const refs = findings['dc_reference_docs_collector'] as { documents?: unknown[] } | undefined;

  const totalDocs =
    (fin?.statements?.income_statement?.length ?? 0) +
    (disc?.disclosures?.length ?? 0) +
    (refs?.documents?.length ?? 0);

  findings['data_collection_summary'] = {
    total_documents_collected: totalDocs,
    sub_agents_succeeded: subResults.filter((r) => r.status === 'completed').length,
    sub_agents_failed: subResults.filter((r) => r.status !== 'completed').length,
    composite_data_quality_score: computeDataQualityScore(subResults),
  };

  return JSON.stringify(findings, null, 2);
}

function computeDataQualityScore(results: SubAgentResult[]): number {
  if (results.length === 0) return 0;
  const completedRatio = results.filter((r) => r.status === 'completed').length / results.length;
  return Math.round(completedRatio * 100) / 100;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
