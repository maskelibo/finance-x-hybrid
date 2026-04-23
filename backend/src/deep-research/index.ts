/**
 * Deep research entrypoint — scope → execute → synthesize.
 *
 * Orchestrates the three phases and is the only thing external callers
 * need to reach. The web-search implementation is INJECTED, so this
 * module stays testable and agnostic to whether the real run uses
 * WebFetch, a CLI tool, or a mock.
 */
import { executeScope, type ExecuteOptions } from './execute.js';
import { buildScope, type ResearchBriefLike } from './scope.js';
import { synthesize } from './synthesize.js';
import type { DeepResearchResult } from './types.js';

export async function deepResearch(
  researchBrief: ResearchBriefLike,
  opts: ExecuteOptions,
): Promise<DeepResearchResult> {
  const plan = buildScope(researchBrief);
  if (plan.queries.length === 0) {
    return {
      ticker: plan.ticker,
      scope_queries: [],
      findings: [],
      aggregate_metrics: {
        queries_total: 0,
        sources_total: 0,
        sources_high_credibility: 0,
        sources_unique_publishers: 0,
      },
      status: 'failed',
      warnings: ['empty external_research_scope — nothing to fetch'],
      confidence_overall: 'low',
    };
  }

  const execOut = await executeScope(plan, opts);
  return synthesize({ ticker: plan.ticker, executed: execOut.results });
}

export { buildScope } from './scope.js';
export { executeScope } from './execute.js';
export { synthesize } from './synthesize.js';
export * from './types.js';
