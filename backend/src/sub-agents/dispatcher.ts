/**
 * Sub-agent dispatcher.
 *
 * Given a list of SubAgentTask entries, runs them according to the chosen
 * strategy (parallel by default) and returns one SubAgentResult per task.
 * One failing sub-agent never aborts the others: all failures are captured
 * in-band as SubAgentResult.status !== 'completed'.
 *
 * Each sub-agent run is persisted to the sub_agent_runs table for
 * observability and later shadow-mode comparison. Schema validation
 * (per sub-agent output_schema_path) flips status to 'schema_invalid'
 * when the output cannot be parsed or fails required-field checks.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { createDefaultProviderRouter } from '../llm/default-router.js';
import { PROJECT_ROOT } from '../config.js';
import { getSubAgentDef, loadSubAgentSystemPrompt } from './registry.js';
import type {
  SubAgentDef,
  SubAgentExecutionStrategy,
  SubAgentResult,
  SubAgentTask,
} from './types.js';

const providerRouter = createDefaultProviderRouter();

const MODEL_IDS: Record<'sonnet' | 'haiku', string> = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
};

export async function dispatchSubAgents(
  tasks: SubAgentTask[],
  strategy: SubAgentExecutionStrategy = 'parallel',
  parentContext: Record<string, unknown> = {},
): Promise<SubAgentResult[]> {
  if (tasks.length === 0) return [];

  if (strategy === 'sequential') {
    const results: SubAgentResult[] = [];
    for (const task of tasks) {
      results.push(await runSubAgent(task, parentContext));
    }
    return results;
  }

  // 'parallel' and 'hybrid' both run all tasks concurrently at this layer.
  // 'hybrid' is reserved for parent orchestrators that stage some sub-agents
  // before others — this dispatcher treats them the same.
  const settled = await Promise.allSettled(
    tasks.map((t) => runSubAgent(t, parentContext)),
  );

  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return buildFailure(tasks[i].sub_agent_id, r.reason);
  });
}

async function runSubAgent(
  task: SubAgentTask,
  parentContext: Record<string, unknown>,
): Promise<SubAgentResult> {
  const def = getSubAgentDef(task.sub_agent_id);
  if (!def) {
    return buildFailure(task.sub_agent_id, `Sub-agent definition not found: ${task.sub_agent_id}`);
  }

  const startTime = Date.now();
  const runId = nanoid();

  try {
    db.prepare(`
      INSERT INTO sub_agent_runs (id, parent_run_id, sub_agent_id, parent_agent_id, status, started_at)
      VALUES (?, ?, ?, ?, 'running', ?)
    `).run(runId, task.parent_run_id, def.id, def.parent_agent_id, new Date().toISOString());
  } catch (err) {
    console.warn(`[sub-agents] failed to persist start row for ${def.id}: ${errMsg(err)}`);
  }

  let result: SubAgentResult;
  try {
    if (def.tier === 'deterministic') {
      result = await runDeterministicSubAgent(def, task);
    } else {
      result = await runLlmSubAgent(def, task, parentContext);
    }

    if (result.status === 'completed' && def.output_schema_path) {
      const validation = validateAgainstSchemaFile(
        result.output_parsed,
        path.join(PROJECT_ROOT, def.output_schema_path),
      );
      if (!validation.valid) {
        result.status = 'schema_invalid';
        result.schema_validation_errors = validation.errors;
      }
    }

    result.duration_ms = Date.now() - startTime;
  } catch (err) {
    result = {
      sub_agent_id: def.id,
      status: 'failed',
      output: '',
      output_parsed: null,
      duration_ms: Date.now() - startTime,
      tokens_used: 0,
      cost_usd: 0,
      error: errMsg(err),
    };
  }

  try {
    db.prepare(`
      UPDATE sub_agent_runs
      SET status = ?, output_text = ?, error_message = ?, duration_ms = ?,
          tokens_used = ?, cost_usd = ?, completed_at = ?
      WHERE id = ?
    `).run(
      result.status,
      (result.output ?? '').slice(0, 50000),
      result.error ?? null,
      result.duration_ms,
      result.tokens_used,
      result.cost_usd,
      new Date().toISOString(),
      runId,
    );
  } catch (err) {
    console.warn(`[sub-agents] failed to persist end row for ${def.id}: ${errMsg(err)}`);
  }

  return result;
}

async function runLlmSubAgent(
  def: SubAgentDef,
  task: SubAgentTask,
  parentContext: Record<string, unknown>,
): Promise<SubAgentResult> {
  const systemPrompt = loadSubAgentSystemPrompt(def.id);

  const context = def.isolated_context
    ? {
        ticker: parentContext['ticker'],
        fact_pack: parentContext['fact_pack'],
      }
    : parentContext;

  const contextStr = JSON.stringify(
    context,
    (_k, v) => (typeof v === 'string' && v.length > 5000 ? v.slice(0, 5000) + '...' : v),
    2,
  ).slice(0, 20000);

  const fullPrompt = [
    `# Sub-Agent: ${def.display_name} (${def.id})`,
    `## Parent: ${def.parent_agent_id}`,
    ``,
    `## System Instructions`,
    systemPrompt,
    ``,
    `## Task`,
    task.task_description,
    ``,
    `## Inputs`,
    JSON.stringify(task.task_inputs, null, 2),
    ``,
    `## Parent Context (read-only)`,
    contextStr,
    ``,
    `## Output`,
    `Respond with JSON matching the schema at ${def.output_schema_path}. No narration around the JSON.`,
  ].join('\n');

  const modelKey = def.model ?? 'sonnet';
  const providerResult = await providerRouter.run({
    prompt: fullPrompt,
    model: MODEL_IDS[modelKey],
    timeoutMs: def.timeout_ms,
  });

  if (!providerResult.success) {
    return {
      sub_agent_id: def.id,
      status: 'failed',
      output: providerResult.output ?? '',
      output_parsed: null,
      duration_ms: providerResult.durationMs,
      tokens_used: providerResult.tokensUsed ?? 0,
      cost_usd: providerResult.costUsd ?? 0,
      error: providerResult.error ?? 'LLM call failed',
    };
  }

  const parsed = tryParseJsonOutput(providerResult.output);
  if (!parsed.ok) {
    return {
      sub_agent_id: def.id,
      status: 'failed',
      output: providerResult.output,
      output_parsed: null,
      duration_ms: providerResult.durationMs,
      tokens_used: providerResult.tokensUsed ?? 0,
      cost_usd: providerResult.costUsd ?? 0,
      error: `JSON parse failed: ${parsed.error}`,
    };
  }

  return {
    sub_agent_id: def.id,
    status: 'completed',
    output: providerResult.output,
    output_parsed: parsed.value,
    duration_ms: providerResult.durationMs,
    tokens_used: providerResult.tokensUsed ?? 0,
    cost_usd: providerResult.costUsd ?? 0,
  };
}

/**
 * Platform-aware Python binary path for deterministic sub-agents.
 *
 * Mirrors src/python/bridge.ts so we stay on the same venv that already
 * hosts the financex CLI. Overridable via FINANCEX_PYTHON_BIN — useful
 * when running outside the repo-local venv.
 *
 * We call python.exe / python directly (not `uv run`) because `uv` is not
 * guaranteed to be on PATH (Windows dev boxes in particular), and Node's
 * spawn() without a shell does not do PATH resolution the same way bash
 * does. Spawn errors without an 'error' handler crash the whole backend
 * (seen 2026-04-24 Block S benchmark). The runDeterministicSubAgent()
 * below attaches an 'error' listener, so ENOENT returns a SubAgentResult
 * instead of unwinding the process.
 */
function resolveSubagentPythonBin(): string {
  const override = process.env.FINANCEX_PYTHON_BIN;
  if (override && override.trim().length > 0) return override;
  return process.platform === 'win32'
    ? path.join(PROJECT_ROOT, 'python-services', '.venv', 'Scripts', 'python.exe')
    : path.join(PROJECT_ROOT, 'python-services', '.venv', 'bin', 'python');
}

async function runDeterministicSubAgent(
  def: SubAgentDef,
  task: SubAgentTask,
): Promise<SubAgentResult> {
  if (!def.python_module) {
    throw new Error(`Deterministic sub-agent ${def.id} has no python_module`);
  }

  const startedAt = Date.now();
  const pythonBin = resolveSubagentPythonBin();
  const args = ['-m', def.python_module, JSON.stringify(task.task_inputs)];
  const cwd = path.join(PROJECT_ROOT, 'python-services');

  return new Promise((resolve) => {
    let resolved = false;
    const settle = (result: SubAgentResult) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(pythonBin, args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
        },
      });
    } catch (err) {
      return settle({
        sub_agent_id: def.id,
        status: 'failed',
        output: '',
        output_parsed: null,
        duration_ms: Date.now() - startedAt,
        tokens_used: 0,
        cost_usd: 0,
        error: `spawn threw: ${errMsg(err)} (bin=${pythonBin})`,
      });
    }

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => (stdout += d.toString('utf-8')));
    proc.stderr?.on('data', (d) => (stderr += d.toString('utf-8')));

    const timer = setTimeout(() => {
      try { proc.kill('SIGTERM'); } catch { /* ignore */ }
      settle({
        sub_agent_id: def.id,
        status: 'timeout',
        output: stdout,
        output_parsed: null,
        duration_ms: def.timeout_ms,
        tokens_used: 0,
        cost_usd: 0,
        error: `Deterministic sub-agent timeout after ${def.timeout_ms}ms`,
      });
    }, def.timeout_ms);

    // CRITICAL: handle 'error' event — without this, an ENOENT from spawn()
    // becomes an unhandled ChildProcess error that kills the backend.
    // Seen 2026-04-24 when `uv` was used on a Windows box.
    proc.on('error', (err) => {
      clearTimeout(timer);
      settle({
        sub_agent_id: def.id,
        status: 'failed',
        output: stdout,
        output_parsed: null,
        duration_ms: Date.now() - startedAt,
        tokens_used: 0,
        cost_usd: 0,
        error: `spawn error: ${err.message} (bin=${pythonBin})`,
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      if (code !== 0) {
        return settle({
          sub_agent_id: def.id,
          status: 'failed',
          output: stdout,
          output_parsed: null,
          duration_ms: durationMs,
          tokens_used: 0,
          cost_usd: 0,
          error: stderr.trim() || `Python module exited with code ${code}`,
        });
      }
      try {
        const parsed = JSON.parse(stdout);
        settle({
          sub_agent_id: def.id,
          status: 'completed',
          output: stdout,
          output_parsed: parsed,
          duration_ms: durationMs,
          tokens_used: 0,
          cost_usd: 0,
        });
      } catch (err) {
        settle({
          sub_agent_id: def.id,
          status: 'failed',
          output: stdout,
          output_parsed: null,
          duration_ms: durationMs,
          tokens_used: 0,
          cost_usd: 0,
          error: `JSON parse failed: ${errMsg(err)} | stderr=${stderr.trim().substring(0, 300)}`,
        });
      }
    });
  });
}

function tryParseJsonOutput(output: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const fenceMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : output;
  try {
    return { ok: true, value: JSON.parse(candidate.trim()) };
  } catch (err) {
    return { ok: false, error: errMsg(err) };
  }
}

function validateAgainstSchemaFile(
  parsed: unknown,
  schemaAbsPath: string,
): { valid: boolean; errors: string[] } {
  if (!fs.existsSync(schemaAbsPath)) {
    return { valid: true, errors: [] };
  }
  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(fs.readFileSync(schemaAbsPath, 'utf8'));
  } catch (err) {
    return { valid: true, errors: [`schema unreadable: ${errMsg(err)}`] };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['output is not a JSON object'] };
  }
  const required = Array.isArray(schema['required']) ? (schema['required'] as string[]) : [];
  const obj = parsed as Record<string, unknown>;
  const missing = required.filter((k) => !(k in obj));
  return { valid: missing.length === 0, errors: missing.map((k) => `missing required field: ${k}`) };
}

function buildFailure(subAgentId: string, reason: unknown): SubAgentResult {
  return {
    sub_agent_id: subAgentId,
    status: 'failed',
    output: '',
    output_parsed: null,
    duration_ms: 0,
    tokens_used: 0,
    cost_usd: 0,
    error: errMsg(reason),
  };
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
