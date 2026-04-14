import { spawn } from 'node:child_process';
import { CLAUDE_PERMISSION_MODE, CLAUDE_SPAWN_OPTIONS } from '../config.js';
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
      const args = [
        '-p',
        input.prompt,
        '--model',
        input.model,
        '--output-format',
        'json',
      ];

      if (CLAUDE_PERMISSION_MODE) {
        args.push('--permission-mode', CLAUDE_PERMISSION_MODE);
      }

      const child = spawn('claude', args, {
        ...CLAUDE_SPAWN_OPTIONS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdoutBuf = '';
      let stderrBuf = '';
      let timedOut = false;

      const timeoutHandle = input.timeoutMs
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
          }, input.timeoutMs)
        : null;

      child.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        stdoutBuf += text;
        input.onStdout?.(text);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        stderrBuf += text;
        input.onStderr?.(text);
      });

      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
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
        const durationMs = Date.now() - startedAt;

        if (code !== 0) {
          const errorType = timedOut || code === 143
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
