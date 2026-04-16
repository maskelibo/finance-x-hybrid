/**
 * Node ↔ Python bridge.
 *
 * Spawns the `financex` CLI (from python-services/.venv/bin/) as a
 * subprocess, captures stdout, and offers helpers to parse JSON +
 * validate the result against the shared TickerPackage schema.
 *
 * This is intentionally small — no stall detection, no retries.
 * The Python side is fast and deterministic; the complex retry/stall
 * dance only belongs around LLM provider calls (ClaudeProvider).
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

import { PROJECT_ROOT } from '../config.js';
import type { TickerPackage } from './types.js';
import {
  type PackageValidationResult,
  validateTickerPackage,
} from './package-validator.js';

// ---------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------
const DEFAULT_BIN = path.join(PROJECT_ROOT, 'python-services', '.venv', 'bin', 'financex');
const DEFAULT_CWD = path.join(PROJECT_ROOT, 'python-services');
const DEFAULT_TIMEOUT_MS = 60_000;

export interface RunOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  binaryPath?: string;
}

// ---------------------------------------------------------------------
// Raw command result
// ---------------------------------------------------------------------
export interface FinancexRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  error?: string;
}

export function runFinancexCommand(
  args: string[],
  opts: RunOptions = {},
): Promise<FinancexRunResult> {
  const bin = opts.binaryPath ?? process.env.FINANCEX_PYTHON_BIN ?? DEFAULT_BIN;
  const cwd = opts.cwd ?? DEFAULT_CWD;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  return new Promise<FinancexRunResult>((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...opts.env },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        durationMs: Date.now() - startedAt,
        error: `spawn error: ${err.message}`,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      if (timedOut) {
        resolve({
          success: false,
          stdout,
          stderr,
          exitCode: code,
          durationMs,
          error: `timeout after ${timeoutMs}ms`,
        });
        return;
      }
      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code,
        durationMs,
        error: code === 0 ? undefined : stderr.trim() || `exited with code ${code}`,
      });
    });
  });
}

// ---------------------------------------------------------------------
// JSON-parsed variant
// ---------------------------------------------------------------------
export interface FinancexJsonResult<T = unknown> extends FinancexRunResult {
  data?: T;
  parseError?: string;
}

export async function runFinancexJson<T = unknown>(
  args: string[],
  opts?: RunOptions,
): Promise<FinancexJsonResult<T>> {
  const res = await runFinancexCommand(args, opts);
  if (!res.success) return res;
  try {
    const parsed = JSON.parse(res.stdout.trim()) as T;
    return { ...res, data: parsed };
  } catch (err) {
    return { ...res, parseError: (err as Error).message };
  }
}

// ---------------------------------------------------------------------
// TickerPackage variant — run, parse, validate.
// ---------------------------------------------------------------------
export interface FinancexTickerPackageResult extends FinancexJsonResult<unknown> {
  validation?: PackageValidationResult;
  package?: TickerPackage;
}

export async function runFinancexTickerPackage(
  args: string[],
  opts?: RunOptions,
): Promise<FinancexTickerPackageResult> {
  const res = await runFinancexJson<unknown>(args, opts);
  if (!res.success || res.data === undefined) return res;

  const validation = validateTickerPackage(res.data);
  return {
    ...res,
    validation,
    package: validation.valid ? validation.data : undefined,
  };
}
