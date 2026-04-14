import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CODEX_SPAWN_OPTIONS } from '../config.js';
import type { LLMProvider } from './provider-interface.js';
import type { LLMErrorType, ProviderAvailability, ProviderRunInput, ProviderRunResult } from './types.js';

function detectCodexErrorType(stderr: string, stdout: string): LLMErrorType {
  const combined = `${stderr}\n${stdout}`.toLowerCase();
  if (
    combined.includes('rate limit') ||
    combined.includes('usage limit') ||
    combined.includes('quota') ||
    combined.includes('too many requests') ||
    combined.includes('429')
  ) {
    return 'rate_limit';
  }
  if (
    combined.includes('api key') ||
    combined.includes('authentication') ||
    combined.includes('unauthorized') ||
    combined.includes('login required') ||
    combined.includes('401')
  ) {
    return 'auth';
  }
  if (combined.includes('timeout')) {
    return 'timeout';
  }
  return 'unknown';
}

function parseCodexJsonl(stdout: string) {
  const messages: string[] = [];
  let errorMessage = '';
  let inputTokens = 0;
  let cachedInputTokens = 0;
  let outputTokens = 0;

  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    try {
      const event = JSON.parse(line);
      if (event.type === 'error' && typeof event.message === 'string') {
        errorMessage = event.message.trim();
      }
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && typeof event.item?.text === 'string') {
        messages.push(event.item.text);
      }
      if (event.type === 'turn.completed' && event.usage) {
        inputTokens = Number(event.usage.input_tokens || inputTokens);
        cachedInputTokens = Number(event.usage.cached_input_tokens || cachedInputTokens);
        outputTokens = Number(event.usage.output_tokens || outputTokens);
      }
      if (event.type === 'turn.failed' && typeof event.error?.message === 'string') {
        errorMessage = event.error.message.trim();
      }
    } catch {
      continue;
    }
  }

  return {
    summary: messages.join('\n\n').trim(),
    errorMessage,
    usage: {
      inputTokens,
      cachedInputTokens,
      outputTokens,
    },
  };
}

export class CodexProvider implements LLMProvider {
  readonly id = 'codex' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunResult> {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const args = ['exec', '--json', '--full-auto'];
      if (input.model) {
        args.push('--model', input.model);
      }
      args.push('-');

      const child = spawn('codex', args, {
        ...CODEX_SPAWN_OPTIONS,
        stdio: ['pipe', 'pipe', 'pipe'],
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

      child.stdin.write(input.prompt);
      child.stdin.end();

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
        const parsed = parseCodexJsonl(stdoutBuf);

        if (code !== 0) {
          resolve({
            success: false,
            output: parsed.summary || stdoutBuf,
            error: timedOut
              ? `Agent timeout after ${Math.round((input.timeoutMs || 0) / 1000)}s`
              : (parsed.errorMessage || stderrBuf || `Codex exited with code ${code}`),
            errorType: timedOut ? 'timeout' : detectCodexErrorType(stderrBuf, stdoutBuf),
            durationMs,
            tokensUsed: 0,
            costUsd: 0,
            provider: this.id,
            rawOutput: stdoutBuf,
          });
          return;
        }

        resolve({
          success: true,
          output: parsed.summary || stdoutBuf,
          durationMs,
          tokensUsed: parsed.usage.inputTokens + parsed.usage.cachedInputTokens + parsed.usage.outputTokens,
          costUsd: 0,
          provider: this.id,
          rawOutput: stdoutBuf,
        });
      });
    });
  }

  async probeAvailability(): Promise<ProviderAvailability> {
    const codexHome = process.env.CODEX_HOME?.trim() || path.join(os.homedir(), '.codex');
    const hasNativeAuth = fs.existsSync(path.join(codexHome, 'auth.json'));
    const hasApiKey = typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.trim().length > 0;
    if (!hasNativeAuth && !hasApiKey) {
      return {
        available: false,
        reason: 'Codex authentication is not configured',
      };
    }

    return {
      available: true,
    };
  }
}
