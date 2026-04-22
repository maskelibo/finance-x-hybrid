/**
 * Sub-agent runner — Phase 8H (brief §7 map-reduce).
 *
 * Gives an agent implementation the ability to split a large job into N
 * mini-tasks, run them in parallel with bounded concurrency, and reduce
 * the outputs back into one result.
 *
 * Best-fit agents (future wiring — NOT in this commit):
 *   - qa_review: split by finding severity for focused reasoning
 *   - sector_competition: split by peer for deep compare
 *   - report_formatter (LLM mode): split by section to avoid truncation
 *
 * This commit ships infrastructure + unit tests only. Pilot agent wiring
 * is Phase 8H-b. Keep default maxConcurrency conservative (3) to respect
 * Claude CLI 5-hour rate limit. Each sub-task pays full input cost — cost
 * grows linearly with task count; only use when quality benefit is clear.
 */

import { runAgent, type AgentRunResult } from './agent-runner.js';

export type SubTask = {
  /** Short identifier for logs/results. */
  id: string;
  /** The agent to invoke. Usually the SAME agent ID repeated per task. */
  agentId: string;
  /** Task-specific prompt override. Omit to use the agent's default. */
  taskPrompt: string;
  /** Optional accumulated context (same shape as runAgent's context). */
  context?: Record<string, unknown>;
  /** Override the agent's default timeout. */
  timeoutMs?: number;
};

export type SubTaskResult = {
  id: string;
  agentId: string;
  result: AgentRunResult;
  durationMs: number;
};

export type SubAgentRunOptions = {
  /** Max parallel sub-tasks. Default: env SUB_AGENT_MAX_CONCURRENCY or 3. */
  maxConcurrency?: number;
  /** If true, the runner resolves even when some sub-tasks fail. Default true
   *  — let the caller decide how to reduce partial results. */
  continueOnError?: boolean;
  /** If true, logs timing per sub-task to console. */
  verbose?: boolean;
};

const DEFAULT_MAX_CONCURRENCY = parseInt(
  process.env.SUB_AGENT_MAX_CONCURRENCY || '3',
  10,
);

/**
 * Run a list of sub-tasks in parallel with bounded concurrency. Returns
 * results in input order (not completion order) so the caller can zip
 * against the input list without tracking task IDs.
 *
 * Concurrency strategy: a simple worker pool. Each worker pulls the next
 * task until the queue drains. This is token-efficient — no task_done
 * signalling, no complex scheduling — and maps cleanly to the 3-agent
 * parallel group limit used in orchestrator.ts.
 */
export async function runParallelSubAgents(
  tasks: ReadonlyArray<SubTask>,
  opts: SubAgentRunOptions = {},
): Promise<SubTaskResult[]> {
  const maxConcurrency = Math.max(
    1,
    opts.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY,
  );
  const continueOnError = opts.continueOnError ?? true;
  const verbose = opts.verbose ?? false;

  if (tasks.length === 0) return [];

  const results: (SubTaskResult | null)[] = new Array(tasks.length).fill(null);
  let cursor = 0;

  const workerCount = Math.min(maxConcurrency, tasks.length);

  async function worker(workerId: number): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= tasks.length) return;
      const task = tasks[i];
      const taskStartedAt = Date.now();
      if (verbose) {
        console.log(`[sub-agent] worker=${workerId} task=${task.id} (${task.agentId}) started`);
      }
      try {
        const result = await runAgent({
          agentId: task.agentId,
          taskPrompt: task.taskPrompt,
          context: task.context,
          timeoutMs: task.timeoutMs,
        });
        const durationMs = Date.now() - taskStartedAt;
        results[i] = { id: task.id, agentId: task.agentId, result, durationMs };
        if (verbose) {
          const status = result.success ? 'ok' : 'FAIL';
          console.log(`[sub-agent] worker=${workerId} task=${task.id} ${status} ${Math.round(durationMs/1000)}s`);
        }
        if (!result.success && !continueOnError) {
          cursor = tasks.length; // drain queue, stop new work
          return;
        }
      } catch (err: unknown) {
        const durationMs = Date.now() - taskStartedAt;
        const msg = err instanceof Error ? err.message : String(err);
        results[i] = {
          id: task.id,
          agentId: task.agentId,
          result: {
            success: false,
            output: '',
            error: `Sub-agent exception: ${msg}`,
            errorType: 'unknown',
            durationMs,
            tokensUsed: 0,
            costUsd: 0,
            provider: 'claude',
          },
          durationMs,
        };
        if (verbose) {
          console.error(`[sub-agent] worker=${workerId} task=${task.id} EXCEPTION ${msg}`);
        }
        if (!continueOnError) {
          cursor = tasks.length;
          return;
        }
      }
    }
  }

  const workers = Array.from({ length: workerCount }, (_, i) => worker(i));
  await Promise.all(workers);

  // Fill in any unprocessed slots with explicit "skipped" results — happens
  // only when continueOnError=false and an earlier task bailed the queue.
  for (let i = 0; i < results.length; i++) {
    if (results[i] === null) {
      results[i] = {
        id: tasks[i].id,
        agentId: tasks[i].agentId,
        result: {
          success: false,
          output: '',
          error: 'Sub-agent skipped — earlier task failed with continueOnError=false',
          errorType: 'unknown',
          durationMs: 0,
          tokensUsed: 0,
          costUsd: 0,
          provider: 'claude',
        },
        durationMs: 0,
      };
    }
  }

  return results as SubTaskResult[];
}

/**
 * Convenience reducer: concatenates successful sub-task outputs with a
 * separator. Useful for simple map-reduce where order matters and outputs
 * are stand-alone sections.
 */
export function concatenateOutputs(
  results: ReadonlyArray<SubTaskResult>,
  separator: string = '\n\n---\n\n',
): string {
  return results
    .filter(r => r.result.success && r.result.output.length > 0)
    .map(r => r.result.output)
    .join(separator);
}

/**
 * Convenience reducer: aggregate cost/tokens/success-rate across sub-tasks.
 */
export function summarizeSubTaskResults(
  results: ReadonlyArray<SubTaskResult>,
): {
  totalCostUsd: number;
  totalTokens: number;
  successCount: number;
  failureCount: number;
  totalDurationMs: number;
  maxDurationMs: number;
} {
  let totalCostUsd = 0;
  let totalTokens = 0;
  let successCount = 0;
  let failureCount = 0;
  let totalDurationMs = 0;
  let maxDurationMs = 0;
  for (const r of results) {
    totalCostUsd += r.result.costUsd ?? 0;
    totalTokens += r.result.tokensUsed ?? 0;
    if (r.result.success) successCount++;
    else failureCount++;
    totalDurationMs += r.durationMs;
    if (r.durationMs > maxDurationMs) maxDurationMs = r.durationMs;
  }
  return { totalCostUsd, totalTokens, successCount, failureCount, totalDurationMs, maxDurationMs };
}
