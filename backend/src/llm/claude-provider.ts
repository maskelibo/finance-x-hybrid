import { spawn } from 'node:child_process';
import { CLAUDE_PERMISSION_MODE, CLAUDE_SPAWN_OPTIONS, PROVIDER_STALL_TIMEOUT_S } from '../config.js';
import type { LLMProvider } from './provider-interface.js';
import type { LLMErrorType, ProviderAvailability, ProviderRunInput, ProviderRunResult } from './types.js';

function detectClaudeErrorType(stderr: string, stdout: string): LLMErrorType {
  const combined = (stderr + ' ' + stdout).toLowerCase();
  if (
    combined.includes('usage limit') ||
    combined.includes('rate limit') ||
    combined.includes('5-hour limit') ||
    combined.includes('weekly limit') ||
    combined.includes('quota') ||
    combined.includes('too many requests') ||
    combined.includes('429') ||
    combined.includes('hit your limit') ||
    combined.includes("you've hit your limit") ||
    combined.includes('resets 2am') ||
    combined.includes('resets at')
  ) {
    return 'rate_limit';
  }
  if (combined.includes('not logged in') || combined.includes('authentication') || combined.includes('401')) {
    return 'auth';
  }
  if (combined.includes('timeout')) {
    return 'timeout';
  }
  return 'unknown';
}

export class ClaudeProvider implements LLMProvider {
  readonly id = 'claude' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunResult> {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      // Pass the prompt on stdin (not argv) so large prompts don't hit
      // cmd.exe's ~8KB command-line ceiling on Windows (ENAMETOOLONG) and
      // so that on POSIX we avoid `E2BIG` for >128KB prompts too.
      const args = [
        '-p',
        '--model',
        input.model,
        '--output-format',
        'json',
        '--input-format',
        'text',
      ];

      if (CLAUDE_PERMISSION_MODE) {
        args.push('--permission-mode', CLAUDE_PERMISSION_MODE);
      }

      // Windows: spawn the `.cmd` wrapper. Node 20+ blocks direct .cmd
      // execution as EINVAL, so we go through `cmd.exe /d /s /c` which
      // doesn't have that restriction and doesn't inflate the command
      // line (prompt is on stdin, argv stays small).
      const isWin = process.platform === 'win32';
      const binary = isWin ? 'cmd.exe' : 'claude';
      const spawnArgs = isWin ? ['/d', '/s', '/c', 'claude.cmd', ...args] : args;

      const child = spawn(binary, spawnArgs, {
        ...CLAUDE_SPAWN_OPTIONS,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Write the prompt and close stdin so Claude starts generating.
      if (child.stdin) {
        child.stdin.write(input.prompt);
        child.stdin.end();
      }

      let stdoutBuf = '';
      let stderrBuf = '';
      let timedOut = false;
      let stalled = false;
      let lastOutputAt = Date.now();
      // Progress heartbeat: any activity — stdout OR stderr — counts as "alive".
      // With --output-format=json Claude buffers the entire response until done,
      // so stdoutBuf can be empty for 10+ minutes on large outputs (FA, synthesis).
      // stderr still trickles session/progress info, so we use it to differentiate
      // "hung process" from "long-running process with buffered output".
      let lastActivityAt = Date.now();

      const timeoutHandle = input.timeoutMs
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
          }, input.timeoutMs)
        : null;

      // Stall detection: progressive — warn at 3min, kill at stall timeout.
      // Kill condition is "no stdout bytes at all" AND "no activity anywhere
      // in {stall_timeout}s". If Claude is actively working stderr will have
      // heartbeat chatter, resetting lastActivityAt and avoiding false kills
      // on legitimately-long generations.
      const stallCheckInterval = setInterval(() => {
        const silentSecs = (Date.now() - lastOutputAt) / 1000;
        const inactiveSecs = (Date.now() - lastActivityAt) / 1000;

        if (silentSecs > 180 && stdoutBuf.length === 0) {
          console.warn(`[PROVIDER:claude] Warning — ${Math.round(silentSecs)}s with 0 output tokens (activity ${Math.round(inactiveSecs)}s ago)`);
        }

        // Only kill when BOTH stdout is empty AND process has produced nothing
        // on either stream for PROVIDER_STALL_TIMEOUT_S seconds. A single byte
        // on stderr (progress, notice, session id) is enough to keep alive.
        if (
          inactiveSecs > PROVIDER_STALL_TIMEOUT_S &&
          stdoutBuf.length === 0
        ) {
          stalled = true;
          console.warn(
            `[PROVIDER:claude] Stall confirmed — no stdout AND no stderr for ${Math.round(inactiveSecs)}s, killing process`,
          );
          child.kill('SIGTERM');
          clearInterval(stallCheckInterval);
        }
      }, 30000);

      child.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        stdoutBuf += text;
        lastOutputAt = Date.now();
        lastActivityAt = Date.now();
        input.onStdout?.(text);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        stderrBuf += text;
        lastActivityAt = Date.now();
        input.onStderr?.(text);
      });


      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        clearInterval(stallCheckInterval);
        resolve({
          success: false,
          output: '',
          error: `Process error: ${err.message}`,
          errorType: 'unknown',
          durationMs: Date.now() - startedAt,
          tokensUsed: 0,
          costUsd: 0,
          provider: this.id,
          rawOutput: stdoutBuf,
        });
      });

      child.on('close', (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        clearInterval(stallCheckInterval);
        const durationMs = Date.now() - startedAt;

        if (code !== 0) {
          const errorType = timedOut || stalled || code === 143
            ? 'timeout'
            : detectClaudeErrorType(stderrBuf, stdoutBuf);
          const timeoutSecs = input.timeoutMs ? Math.round(input.timeoutMs / 1000) : 0;
          const errorMsg = timedOut
            ? `Agent timeout after ${timeoutSecs}s (exit code 143) — increase timeout or optimize agent`
            : (stderrBuf || stdoutBuf || `Claude exited with code ${code}`);
          resolve({
            success: false,
            output: stdoutBuf,
            error: errorMsg,
            errorType,
            durationMs,
            tokensUsed: 0,
            costUsd: 0,
            provider: this.id,
            rawOutput: stdoutBuf,
          });
          return;
        }

        let parsedOutput = stdoutBuf;
        let tokensUsed = 0;
        let costUsd = 0;

        try {
          const parsed = JSON.parse(stdoutBuf);
          if (parsed.result) parsedOutput = parsed.result;
          if (parsed.total_cost_usd) costUsd = parsed.total_cost_usd;
          if (parsed.usage) {
            tokensUsed = (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0);
          }
        } catch {
          // Keep raw output if provider didn't return JSON.
        }

        resolve({
          success: true,
          output: parsedOutput,
          durationMs,
          tokensUsed,
          costUsd,
          provider: this.id,
          rawOutput: stdoutBuf,
        });
      });
    });
  }

  async probeAvailability(): Promise<ProviderAvailability> {
    const result = await this.run({
      prompt: 'ok',
      model: 'claude-haiku-4-5',
      timeoutMs: 30_000,
    });

    return {
      available: result.success,
      reason: result.error,
    };
  }
}
