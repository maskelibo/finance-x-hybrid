/**
 * Sub-agent aware parse_standardization runner (Part 2 / Block S, FAZ S3).
 *
 * Mirrors the shadow-mode pattern from data_collection_with_subagents:
 * legacy remains authoritative; when SUBAGENT_PARSE_STD_ENABLED or
 * SUBAGENT_SHADOW_MODE is on, the 3 sub-agents (statement_extractor,
 * notes_parser, report_section_parser) run fan-out and persist to
 * sub_agent_runs. Authoritative cutover is reserved for S12.
 */

import {
  SUBAGENT_PARSE_STD_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import type { SubAgentResult } from '../../sub-agents/types.js';
import { runPythonParseStandardization, type RunOutcome } from './parse_standardization.js';

export async function runParseStandardizationSubagentAware(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const shadowActive = SUBAGENT_SHADOW_MODE || SUBAGENT_PARSE_STD_ENABLED;
  const legacyOutcome = await runPythonParseStandardization(sessionId, runId, ticker, accumulatedContext);

  if (shadowActive) {
    void runSubAgents(sessionId, runId, ticker, accumulatedContext).catch((err) => {
      console.warn(`[shadow] parse_standardization sub-agents failed: ${errMsg(err)}`);
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
  // Pass along data_collection output so statement_extractor can
  // pick up PDF paths when they've been written by the legacy path.
  const dcOutput = accumulatedContext['data_collection_output'] ?? null;
  return executeWithSubAgents(
    'parse_standardization',
    runId,
    sessionId,
    { ticker, data_collection: dcOutput },
    accumulatedContext,
    compileParseOutput,
  );
}

async function compileParseOutput(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const compiled: Record<string, unknown> = {
    ticker: parentCtx['ticker'],
    parsed_statements: null,
    parsed_notes: null,
    parsed_sections: null,
    composite_quality: {} as Record<string, unknown>,
  };

  for (const r of subResults) {
    if (r.status !== 'completed') continue;
    if (r.sub_agent_id === 'ps_statement_extractor') compiled['parsed_statements'] = r.output_parsed;
    else if (r.sub_agent_id === 'ps_notes_parser') compiled['parsed_notes'] = r.output_parsed;
    else if (r.sub_agent_id === 'ps_report_section_parser') compiled['parsed_sections'] = r.output_parsed;
  }

  // Simple cross-validation hook: flag when notes parser yielded a D&A
  // value but statement extractor did not — useful for the S3 promotion
  // gate to measure "D&A null reduction" claim.
  const notes = compiled['parsed_notes'] as
    | { notes?: { depreciation_amortization?: { value_try_mn?: unknown } } }
    | null;
  const stmts = compiled['parsed_statements'] as
    | { statements_by_period?: unknown[] }
    | null;
  const quality = compiled['composite_quality'] as Record<string, unknown>;
  quality['notes_have_da'] = notes?.notes?.depreciation_amortization?.value_try_mn != null;
  quality['statements_parsed_count'] = stmts?.statements_by_period?.length ?? 0;

  return JSON.stringify(compiled, null, 2);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
