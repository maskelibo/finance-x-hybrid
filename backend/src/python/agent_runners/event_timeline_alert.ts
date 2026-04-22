/**
 * Python-path implementation of the event_timeline_alert agent.
 *
 * Called from orchestrator.runSingleAgent when
 * PYTHON_EVENT_TIMELINE_ALERT_ENABLED is true. Fulfils the same DB
 * contract (agent_runs row marked completed with output_text) so
 * downstream agents don't notice the switch.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

import { nanoid } from 'nanoid';

import { PROJECT_ROOT } from '../../config.js';
import { db } from '../../db.js';
import {
  adaptLegacyImpactsForPython,
  adaptPythonTimelineForLegacy,
  type EventForTimeline,
  type PythonTimelineOutput,
} from '../adapters/event_timeline_alert.js';

// Platform-aware venv path (R-close infra): Windows uses Scripts/*.exe, POSIX uses bin/
const DEFAULT_BIN = process.platform === 'win32'
  ? path.join(PROJECT_ROOT, 'python-services', '.venv', 'Scripts', 'financex.exe')
  : path.join(PROJECT_ROOT, 'python-services', '.venv', 'bin', 'financex');
const DEFAULT_CWD = path.join(PROJECT_ROOT, 'python-services');
const DEFAULT_TIMEOUT_MS = 60_000;


interface FinancexPipeResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  error?: string;
}


/** Pipe JSON into `financex timeline bucket --in -`. */
function runFinancexTimelineBucket(
  events: EventForTimeline[],
  referenceDate: string,
): Promise<FinancexPipeResult> {
  const startedAt = Date.now();
  const bin = process.env.FINANCEX_PYTHON_BIN ?? DEFAULT_BIN;

  return new Promise((resolve) => {
    const child = spawn(bin, ['timeline', 'bucket', '--reference-date', referenceDate], {
      cwd: DEFAULT_CWD,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => child.kill('SIGTERM'), DEFAULT_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf-8'); });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false, stdout, stderr,
        exitCode: null, durationMs: Date.now() - startedAt,
        error: `spawn error: ${err.message}`,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        stdout, stderr,
        exitCode: code,
        durationMs: Date.now() - startedAt,
        error: code === 0 ? undefined : stderr.trim() || `exit ${code}`,
      });
    });

    child.stdin.write(JSON.stringify(events));
    child.stdin.end();
  });
}


export type RunOutcome = 'ok' | 'failed';


export async function runPythonEventTimelineAlert(
  sessionId: string,
  runId: string,
  _ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const startedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL, provider_used = 'python' WHERE id = ?`,
  ).run(startedAt, runId);

  try {
    const upstream = accumulatedContext['event_impact_mapper_output'];
    const events = adaptLegacyImpactsForPython(upstream);
    const referenceDate = new Date().toISOString().slice(0, 10);

    const pyResult = await runFinancexTimelineBucket(events, referenceDate);
    if (!pyResult.success) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, pyResult.durationMs, pyResult.error ?? 'python runner failed', runId);
      console.warn(`[PYTHON:event_timeline_alert] failed — ${pyResult.error}`);
      return 'failed';
    }

    let parsed: PythonTimelineOutput = {};
    try {
      parsed = JSON.parse(pyResult.stdout.trim()) as PythonTimelineOutput;
    } catch (err) {
      console.warn(`[PYTHON:event_timeline_alert] unparseable stdout: ${(err as Error).message}`);
    }

    const legacy = adaptPythonTimelineForLegacy(parsed, `eta-out-${nanoid()}`);
    const outputJson = JSON.stringify(legacy, null, 2);

    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
       output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
       provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt, pyResult.durationMs, outputJson,
      `python:financex timeline bucket (${events.length} events → ${legacy.impact_timeline.length} bucketed, ${legacy.priority_alerts.length} alerts)`,
      runId,
    );

    accumulatedContext['event_timeline_alert_output'] = outputJson;
    console.log(
      `[PYTHON:event_timeline_alert] ok — ${events.length} events → ${legacy.impact_timeline.length} bucketed, ${legacy.priority_alerts.length} alerts`,
    );
    return 'ok';
  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = (err as Error).message;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = 0,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, msg, runId);
    console.error(`[PYTHON:event_timeline_alert] exception:`, err);
    return 'failed';
  }
}
