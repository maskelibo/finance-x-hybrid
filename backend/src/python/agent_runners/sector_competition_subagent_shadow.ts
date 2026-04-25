/**
 * Shadow fan-out for sector_competition (Part 2 / Block S, FAZ S8).
 *
 * Three sub-agents:
 *   sc_peer_mapper        haiku, sequential first — emits sector + peer_set + segments[]
 *   sc_benchmark_builder  sonnet, parallel — quartile tables; holding sector spawns N
 *                         instances (one per segment) using the same sub_agent_id
 *   sc_structure_analyst  sonnet, parallel — Porter 5 + SWOT + positioning
 *
 * Holding dynamic spawn: when sc_peer_mapper.is_holding=true, the parent
 * orchestrator spawns one sc_benchmark_builder per segment in segments[],
 * passing { peer_set, segment } in task_inputs. Non-holding emits a single
 * consolidated sc_benchmark_builder with just { peer_set }.
 *
 * We bypass executeWithSubAgents() because that helper assumes one task per
 * registered sub-agent. Holding case needs N tasks of the same sub_agent_id,
 * so we drive dispatchSubAgents() directly.
 */

import {
  SUBAGENT_SECTOR_COMPETITION_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { dispatchSubAgents } from '../../sub-agents/dispatcher.js';
import type {
  SubAgentResult,
  SubAgentTask,
} from '../../sub-agents/types.js';

export function sectorCompetitionShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_SECTOR_COMPETITION_ENABLED;
}

export function fireSectorCompetitionShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!sectorCompetitionShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] sector_competition sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  const baseInputs = {
    ticker,
    sector: accumulatedContext['sector'] ?? accumulatedContext['sector_override'] ?? null,
    fact_pack: accumulatedContext['fact_pack'] ?? null,
    financial_analysis_output: accumulatedContext['financial_analysis_output'] ?? null,
    macro_analysis_output: accumulatedContext['macro_analysis_output'] ?? null,
  };

  const peerMapTask: SubAgentTask = {
    sub_agent_id: 'sc_peer_mapper',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'sector_competition',
    task_description: 'Identify canonical sector, segment breakdown (if holding), and peer set.',
    task_inputs: baseInputs,
  };

  const startedAt = Date.now();

  // Step 1: peer mapper (sequential — its output drives the next batch).
  const peerResults = await dispatchSubAgents([peerMapTask], 'sequential', accumulatedContext);
  const peerResult = peerResults[0];

  const peerOut = peerResult.status === 'completed'
    ? (peerResult.output_parsed as PeerMapperOutput | null)
    : null;
  const peerSet = peerOut?.peer_set ?? [];
  const isHolding = peerOut?.is_holding === true;
  const segments = (peerOut?.segments ?? []).filter((s) => s && typeof s.name === 'string');

  console.log(
    `[shadow:sector_competition] peer_mapper status=${peerResult.status} is_holding=${isHolding} segments=${segments.length} peers=${peerSet.length}`,
  );

  // Step 2: build downstream task batch (parallel).
  const downstream: SubAgentTask[] = [];

  if (isHolding && segments.length > 0) {
    // One benchmark per segment, with the segment's pure-play peer ticker
    // names if sc_peer_mapper marked them.
    for (const seg of segments) {
      const segPeers = peerSet.filter((p) => p.segment === seg.name);
      downstream.push({
        sub_agent_id: 'sc_benchmark_builder',
        parent_session_id: sessionId,
        parent_run_id: runId,
        parent_agent_id: 'sector_competition',
        task_description: `Quartile benchmark for segment "${seg.name}" of ${ticker}.`,
        task_inputs: {
          ...baseInputs,
          peer_set: segPeers.length > 0 ? segPeers : peerSet,
          segment: seg.name,
        },
      });
    }
  } else {
    downstream.push({
      sub_agent_id: 'sc_benchmark_builder',
      parent_session_id: sessionId,
      parent_run_id: runId,
      parent_agent_id: 'sector_competition',
      task_description: `Consolidated quartile benchmark for ${ticker}.`,
      task_inputs: { ...baseInputs, peer_set: peerSet },
    });
  }

  downstream.push({
    sub_agent_id: 'sc_structure_analyst',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'sector_competition',
    task_description: `Industry structure (Porter 5 + SWOT + positioning) for ${ticker}.`,
    task_inputs: { ...baseInputs, peer_set: peerSet, sector_canonical: peerOut?.sector_canonical ?? null },
  });

  const downstreamResults = await dispatchSubAgents(downstream, 'parallel', accumulatedContext);
  const allResults = [peerResult, ...downstreamResults];

  const compiled = compileSectorCompetition(allResults, ticker, isHolding, segments.map((s) => s.name));

  const totalMs = Date.now() - startedAt;
  const completedCount = allResults.filter((r) => r.status === 'completed').length;
  console.log(
    `[shadow:sector_competition] done ${completedCount}/${allResults.length} sub-agents in ${Math.round(totalMs / 1000)}s — composite_quality=${compiled.composite_quality_score}`,
  );
}

interface PeerMapperOutput {
  ticker?: string;
  sector_canonical?: string;
  is_holding?: boolean;
  segments?: Array<{ name: string; revenue_share_pct?: number | null; primary_subsidiaries?: string[] }>;
  peer_set?: Array<{ ticker: string; name?: string; rationale?: string; segment?: string | null }>;
}

interface CompiledSectorCompetition {
  ticker: string;
  is_holding: boolean;
  segments: string[];
  sub_agent_breakdown: Record<string, { status: string; duration_ms: number; segment?: string }>;
  sc_peer_mapper?: unknown;
  sc_benchmark_builder?: unknown[];
  sc_structure_analyst?: unknown;
  composite_quality_score: number;
}

function compileSectorCompetition(
  subResults: SubAgentResult[],
  ticker: string,
  isHolding: boolean,
  segmentNames: string[],
): CompiledSectorCompetition {
  const breakdown: Record<string, { status: string; duration_ms: number; segment?: string }> = {};
  const benchmarks: unknown[] = [];
  let segmentCursor = 0;
  let peerMapperOut: unknown = undefined;
  let structureOut: unknown = undefined;

  for (const r of subResults) {
    if (r.sub_agent_id === 'sc_benchmark_builder') {
      const segName = isHolding ? segmentNames[segmentCursor] : 'consolidated';
      segmentCursor += 1;
      const key = `sc_benchmark_builder[${segName}]`;
      breakdown[key] = { status: r.status, duration_ms: r.duration_ms, segment: segName };
      if (r.status === 'completed' && r.output_parsed) {
        benchmarks.push({ segment: segName, ...(r.output_parsed as Record<string, unknown>) });
      }
    } else {
      breakdown[r.sub_agent_id] = { status: r.status, duration_ms: r.duration_ms };
      if (r.status === 'completed' && r.output_parsed) {
        if (r.sub_agent_id === 'sc_peer_mapper') peerMapperOut = r.output_parsed;
        if (r.sub_agent_id === 'sc_structure_analyst') structureOut = r.output_parsed;
      }
    }
  }

  const completed = subResults.filter((r) => r.status === 'completed').length;
  const compositeQuality = subResults.length > 0
    ? Math.round((completed / subResults.length) * 100) / 100
    : 0;

  return {
    ticker,
    is_holding: isHolding,
    segments: segmentNames,
    sub_agent_breakdown: breakdown,
    sc_peer_mapper: peerMapperOut,
    sc_benchmark_builder: benchmarks,
    sc_structure_analyst: structureOut,
    composite_quality_score: compositeQuality,
  };
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
