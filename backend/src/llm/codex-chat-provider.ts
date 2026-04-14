import { spawn } from 'node:child_process';
import { CODEX_MODEL, CODEX_SPAWN_OPTIONS } from '../config.js';
import type { ChatProvider, ChatProviderPrompt } from './chat-provider-interface.js';
import { ChatProviderError, type ChatErrorType, type ChatRunResult, type StreamChatCallbacks, type StreamChatResult } from './chat-types.js';

function detectCodexChatErrorType(stderr: string, stdout: string): ChatErrorType {
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

function parseCodexJsonl(stdout: string): { content: string; errorMessage: string } {
  const messages: string[] = [];
  let errorMessage = '';

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
      if (event.type === 'turn.failed' && typeof event.error?.message === 'string') {
        errorMessage = event.error.message.trim();
      }
    } catch {
      continue;
    }
  }

  return {
    content: messages.join('\n\n').trim(),
    errorMessage,
  };
}

export class CodexChatProvider implements ChatProvider {
  readonly id = 'codex' as const;

  async chat(input: ChatProviderPrompt): Promise<ChatRunResult> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const args = ['exec', '--json', '--model', CODEX_MODEL, '-'];
      const child = spawn('codex', args, {
        ...CODEX_SPAWN_OPTIONS,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      input.onProcess?.(child);

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
        stdoutBuf += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString('utf8');
      });

      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new ChatProviderError(this.id, `Codex process error: ${err.message}`, 'unknown'));
      });

      child.on('close', (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        const parsed = parseCodexJsonl(stdoutBuf);

        if (timedOut) {
          reject(new ChatProviderError(this.id, 'Codex chat timeout', 'timeout'));
          return;
        }

        if (code !== 0) {
          reject(new ChatProviderError(
            this.id,
            parsed.errorMessage || stderrBuf || `Codex exited with code ${code}`,
            detectCodexChatErrorType(stderrBuf, stdoutBuf),
          ));
          return;
        }

        // Exit code 0 but error message present (rate limit returned as JSONL error event)
        if (parsed.errorMessage && !parsed.content) {
          reject(new ChatProviderError(
            this.id,
            parsed.errorMessage,
            detectCodexChatErrorType(parsed.errorMessage, stdoutBuf),
          ));
          return;
        }

        resolve({
          content: parsed.content || stdoutBuf,
          durationMs: Date.now() - startedAt,
          provider: this.id,
        });
      });
    });
  }

  streamChat(input: ChatProviderPrompt, callbacks: StreamChatCallbacks): StreamChatResult {
    const startedAt = Date.now();
    const args = ['exec', '--json', '--model', CODEX_MODEL, '-'];
    const child = spawn('codex', args, {
      ...CODEX_SPAWN_OPTIONS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    input.onProcess?.(child);

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
      stdoutBuf += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf8');
    });

    child.on('close', (code, signal) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (signal === 'SIGTERM') {
        callbacks.onDone({ aborted: true, provider: this.id });
        return;
      }

      const parsed = parseCodexJsonl(stdoutBuf);

      if (timedOut) {
        callbacks.onError({ message: 'Codex chat timeout', errorType: 'timeout', provider: this.id });
        return;
      }

      if (code !== 0) {
        callbacks.onError({
          message: parsed.errorMessage || stderrBuf || `Codex exited with code ${code}`,
          errorType: detectCodexChatErrorType(stderrBuf, stdoutBuf),
          provider: this.id,
        });
        return;
      }

      // Exit code 0 but error message present (rate limit returned as JSONL error event)
      if (parsed.errorMessage && !parsed.content) {
        callbacks.onError({
          message: parsed.errorMessage,
          errorType: detectCodexChatErrorType(parsed.errorMessage, stdoutBuf),
          provider: this.id,
        });
        return;
      }

      const content = parsed.content || stdoutBuf;
      if (content) {
        callbacks.onText(content);
      }

      const result: ChatRunResult = {
        content,
        durationMs: Date.now() - startedAt,
        provider: this.id,
      };
      callbacks.onComplete?.(result);
      callbacks.onDone({ durationMs: result.durationMs, provider: result.provider });
    });

    child.on('error', (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      callbacks.onError({ message: err.message, errorType: 'unknown', provider: this.id });
    });

    return {
      provider: this.id,
      process: child,
      abort: () => child.kill('SIGTERM'),
    };
  }
}
