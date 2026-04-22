import { spawn } from 'node:child_process';
import {
  CLAUDE_PERMISSION_MODE,
  CLAUDE_SPAWN_OPTIONS,
  PROVIDER_STALL_TIMEOUT_S,
  CLAUDE_OUTPUT_FORMAT,
} from '../config.js';
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

/**
 * Stream-json event accumulator — Phase 8G.
 *
 * Claude CLI with `--output-format stream-json --verbose` emits NDJSON:
 *   {"type":"system","subtype":"init","session_id":"...","model":"..."}
 *   {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
 *   ... more assistant events as generation streams ...
 *   {"type":"result","subtype":"success","result":"...","total_cost_usd":..,"usage":{...}}
 *
 * We accumulate assistant-message text chunks; if the final `result` event
 * carries a result string we prefer that (it's the canonical final form).
 * Cost/tokens come from the result event's total_cost_usd/usage.
 *
 * Fail-safe: any parse error on a line is swallowed and the line is kept
 * in rawBuf so the caller can still see raw stdout in `rawOutput`.
 */
class StreamJsonAccumulator {
  private pendingLine = '';
  private assistantText = '';
  private finalResult: string | null = null;
  private costUsd = 0;
  private inputTokens = 0;
  private outputTokens = 0;
  private sessionId: string | null = null;

  feed(chunk: string): void {
    this.pendingLine += chunk;
    let idx: number;
    while ((idx = this.pendingLine.indexOf('\n')) !== -1) {
      const line = this.pendingLine.slice(0, idx).trim();
      this.pendingLine = this.pendingLine.slice(idx + 1);
      if (!line) continue;
      this.handleLine(line);
    }
  }

  flush(): void {
    const tail = this.pendingLine.trim();
    this.pendingLine = '';
    if (tail) this.handleLine(tail);
  }

  private handleLine(line: string): void {
    let evt: unknown;
    try {
      evt = JSON.parse(line);
    } catch {
      // Not a JSON event — could be a startup warning, noise, etc. Ignore.
      return;
    }
    if (!evt || typeof evt !== 'object') return;
    const e = evt as Record<string, unknown>;
    const type = typeof e.type === 'string' ? e.type : '';

    if (type === 'system') {
      const sid = e.session_id;
      if (typeof sid === 'string') this.sessionId = sid;
      return;
    }

    if (type === 'assistant') {
      const msg = e.message;
      if (msg && typeof msg === 'object') {
        const content = (msg as Record<string, unknown>).content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block && typeof block === 'object') {
              const b = block as Record<string, unknown>;
              const btype = typeof b.type === 'string' ? b.type : '';
              if (btype === 'text' && typeof b.text === 'string') {
                this.assistantText += b.text;
              }
            }
          }
        }
      }
      return;
    }

    if (type === 'result') {
      const res = e.result;
      if (typeof res === 'string' && res.length > 0) {
        this.finalResult = res;
      }
      if (typeof e.total_cost_usd === 'number') this.costUsd = e.total_cost_usd;
      const usage = e.usage;
      if (usage && typeof usage === 'object') {
        const u = usage as Record<string, unknown>;
        if (typeof u.input_tokens === 'number') this.inputTokens = u.input_tokens;
        if (typeof u.output_tokens === 'number') this.outputTokens = u.output_tokens;
      }
      return;
    }
  }

  getOutput(): string {
    return this.finalResult ?? this.assistantText;
  }

  getCostUsd(): number { return this.costUsd; }
  getTokensUsed(): number { return this.inputTokens + this.outputTokens; }
  getSessionId(): string | null { return this.sessionId; }
}

export class ClaudeProvider implements LLMProvider {
  readonly id = 'claude' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunResult> {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const useStreamJson = CLAUDE_OUTPUT_FORMAT === 'stream-json';
      const args: string[] = [
        '-p',
        '--model', input.model,
        '--input-format', 'text',
        '--output-format', useStreamJson ? 'stream-json' : 'json',
      ];
      if (useStreamJson) {
        // stream-json requires --verbose; partial messages give us a heartbeat
        // so stall detection doesn't false-positive on large outputs.
        args.push('--verbose', '--include-partial-messages');
      }
      if (CLAUDE_PERMISSION_MODE) {
        args.push('--permission-mode', CLAUDE_PERMISSION_MODE);
      }

      // Windows: spawn through cmd.exe /d /s /c so Node 20+ .cmd EINVAL
      // restriction is bypassed and the prompt (on stdin) doesn't inflate
      // the command line past cmd.exe's ~8KB ceiling.
      const isWin = process.platform === 'win32';
      const binary = isWin ? 'cmd.exe' : 'claude';
      const spawnArgs = isWin ? ['/d', '/s', '/c', 'claude.cmd', ...args] : args;

      const child = spawn(binary, spawnArgs, {
        ...CLAUDE_SPAWN_OPTIONS,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (child.stdin) {
        child.stdin.write(input.prompt);
        child.stdin.end();
      }

      let stdoutBuf = '';
      let stderrBuf = '';
      let timedOut = false;
      let stalled = false;
      let lastOutputAt = Date.now();
      let lastActivityAt = Date.now();
      const accumulator = useStreamJson ? new StreamJsonAccumulator() : null;

      const timeoutHandle = input.timeoutMs
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
          }, input.timeoutMs)
        : null;

      // Stall detection — Phase 8E (stderr-aware) + 8G (stream-json events
      // flow steadily so stdout is rarely silent in the first place).
      const stallCheckInterval = setInterval(() => {
        const silentSecs = (Date.now() - lastOutputAt) / 1000;
        const inactiveSecs = (Date.now() - lastActivityAt) / 1000;

        if (silentSecs > 180 && stdoutBuf.length === 0) {
          console.warn(
            `[PROVIDER:claude] Warning — ${Math.round(silentSecs)}s with 0 output tokens (activity ${Math.round(inactiveSecs)}s ago)`,
          );
        }

        if (inactiveSecs > PROVIDER_STALL_TIMEOUT_S && stdoutBuf.length === 0) {
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
        if (accumulator) accumulator.feed(text);
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

        if (accumulator) {
          accumulator.flush();
          const acc = accumulator.getOutput();
          if (acc.length > 0) parsedOutput = acc;
          costUsd = accumulator.getCostUsd();
          tokensUsed = accumulator.getTokensUsed();
        } else {
          // Legacy json mode: single JSON blob at end.
          try {
            const parsed = JSON.parse(stdoutBuf);
            if (parsed.result) parsedOutput = parsed.result;
            if (parsed.total_cost_usd) costUsd = parsed.total_cost_usd;
            if (parsed.usage) {
              tokensUsed = (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0);
            }
          } catch {
            // Raw fallback — keep stdoutBuf as-is.
          }
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
