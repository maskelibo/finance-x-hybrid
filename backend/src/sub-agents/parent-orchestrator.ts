/**
 * Parent orchestrator.
 *
 * Wraps dispatchSubAgents with the "fan out then compile" pattern each
 * parent agent follows: pick the sub-agents registered for you, dispatch,
 * collect results, then hand the results to a caller-supplied compile
 * function that produces the parent's final output string.
 *
 * Fallback to the legacy (monolithic) agent is the CALLER's responsibility —
 * this module only reports which sub-agents failed.
 */

import { dispatchSubAgents } from './dispatcher.js';
import { getSubAgentsForParent } from './registry.js';
import type {
  SubAgentResult,
  SubAgentTask,
} from './types.js';

export type ParentCompileFunction = (
  subResults: SubAgentResult[],
  parentContext: Record<string, unknown>,
) => Promise<string>;

export type ParentExecutionResult = {
  output: string;
  sub_agent_results: SubAgentResult[];
  failed_sub_agents: string[];
};

export async function executeWithSubAgents(
  parentAgentId: string,
  parentRunId: string,
  parentSessionId: string,
  taskInputs: Record<string, unknown>,
  parentContext: Record<string, unknown>,
  compile: ParentCompileFunction,
): Promise<ParentExecutionResult> {
  const subAgents = getSubAgentsForParent(parentAgentId);
  if (subAgents.length === 0) {
    throw new Error(`No sub-agents registered for parent: ${parentAgentId}`);
  }

  const tasks: SubAgentTask[] = subAgents.map((sa) => ({
    sub_agent_id: sa.id,
    parent_session_id: parentSessionId,
    parent_run_id: parentRunId,
    parent_agent_id: parentAgentId,
    task_description: `Sub-agent task for ${parentAgentId}`,
    task_inputs: taskInputs,
  }));

  const strategy = subAgents.every((sa) => sa.parallelizable) ? 'parallel' : 'sequential';

  console.log(
    `[sub-agent] ${parentAgentId} dispatching ${tasks.length} sub-agent${tasks.length === 1 ? '' : 's'} (${strategy})`,
  );

  const results = await dispatchSubAgents(tasks, strategy, parentContext);

  const failed = results
    .filter((r) => r.status !== 'completed')
    .map((r) => r.sub_agent_id);
  if (failed.length > 0) {
    console.warn(`[sub-agent] ${parentAgentId} — failed sub-agents: ${failed.join(', ')}`);
  }

  const output = await compile(results, parentContext);

  return {
    output,
    sub_agent_results: results,
    failed_sub_agents: failed,
  };
}
