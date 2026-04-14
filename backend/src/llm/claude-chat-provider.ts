import { spawn } from 'node:child_process';
import { CLAUDE_MODEL, CLAUDE_PERMISSION_MODE, CLAUDE_SPAWN_OPTIONS } from '../config.js';
import type { ChatProvider, ChatProviderPrompt } from './chat-provider-interface.js';
import { ChatProviderError, type ChatErrorType, type ChatRunResult, type StreamChatCallbacks, type StreamChatResult } from './chat-types.js';

function detectClaudeChatErrorType(stderr: string, stdout: string): ChatErrorType {
  const combined = `${stderr}\n${stdout}`.toLowerCase();
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

function parseClaudeJson(stdout: string): {
  content: string;
  providerSessionId?: string;
  isError: boolean;
  errorType: ChatErrorType;
  errorMessage: string;
} {
  let content = stdout;
  let providerSessionId: string | undefined;
  let isError = false;
  let errorType: ChatErrorType = 'unknown';
  let errorMessage = '';

  try {
    const parsed = JSON.parse(stdout);
    if (typeof parsed.result === 'string') content = parsed.result;
    if (typeof parsed.session_id === 'string') providerSessionId = parsed.session_id;
    if (parsed.is_error === true) {
      isError = true;
      errorMessage = typeof parsed.result === 'string' ? parsed.result : 'Claude returned an error result';
      errorType = detectClaudeChatErrorType('', `${parsed.result ?? ''}\n${parsed.error ?? ''}`);
      if (parsed.error === 'authentication_failed') {
        errorType = 'auth';
      }
    }
  } catch {
    // Keep raw output.
  }

  return { content, providerSessionId, isError, errorType, errorMessage };
}

function getClaudeSessionId(input: ChatProviderPrompt): string | undefined {
  return input.session.providerSessions.claude;
}

function buildClaudeArgs(input: ChatProviderPrompt, outputFormat: 'json' | 'stream-json', includePrint = false): string[] {
  const args = [
    ...(includePrint ? ['--print'] : []),
    '-p',
    input.prompt,
    '--model',
    CLAUDE_MODEL,
    '--output-format',
    outputFormat,
  ];

  if (outputFormat === 'stream-json') {
    args.push('--verbose');
  }

  if (CLAUDE_PERMISSION_MODE) {
    args.push('--permission-mode', CLAUDE_PERMISSION_MODE);
  }

  const providerSessionId = getClaudeSessionId(input);
  if (providerSessionId) {
    args.push('--resume', providerSessionId);
  }

  return args;
}

export class ClaudeChatProvider implements ChatProvider {
  readonly id = 'claude' as const;

  async chat(input: ChatProviderPrompt): Promise<ChatRunResult> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn('claude', buildClaudeArgs(input, 'json'), {
        ...CLAUDE_SPAWN_OPTIONS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      input.onProcess?.(child);

      let stdoutBuf = '';
      let stderrBuf = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString('utf8');
      });

      const timeoutHandle = input.timeoutMs
        ? setTimeout(() => child.kill('SIGTERM'), input.timeoutMs)
        : null;

      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new Error(`Claude process error: ${err.message}`));
      });

      child.on('close', (code, signal) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);

        if (signal === 'SIGTERM') {
          resolve({
            content: '⏹ Sohbet kullanıcı tarafından durduruldu.',
            durationMs: Date.now() - startedAt,
            provider: this.id,
          });
          return;
        }

        if (code !== 0) {
          reject(new ChatProviderError(
            this.id,
            stderrBuf || `Claude exited with code ${code}`,
            detectClaudeChatErrorType(stderrBuf, stdoutBuf),
          ));
          return;
        }

        const parsed = parseClaudeJson(stdoutBuf);
        if (parsed.isError) {
          reject(new ChatProviderError(
            this.id,
            parsed.errorMessage || stderrBuf || 'Claude returned an error result',
            parsed.errorType,
          ));
          return;
        }

        resolve({
          content: parsed.content,
          durationMs: Date.now() - startedAt,
          provider: this.id,
          providerSessionId: parsed.providerSessionId,
        });
      });
    });
  }

  streamChat(input: ChatProviderPrompt, callbacks: StreamChatCallbacks): StreamChatResult {
    const startedAt = Date.now();
    const child = spawn('claude', buildClaudeArgs(input, 'stream-json', true), {
      ...CLAUDE_SPAWN_OPTIONS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    input.onProcess?.(child);

    let fullContent = '';
    let lineBuf = '';
    let lastProviderSessionId = getClaudeSessionId(input);
    let stderrBuf = '';

    child.stdout.on('data', (chunk: Buffer) => {
      lineBuf += chunk.toString('utf8');
      const lines = lineBuf.split('\n');
      lineBuf = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);

          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'text' && block.text) {
                const newText = block.text.slice(fullContent.length);
                if (newText) {
                  fullContent = block.text;
                  callbacks.onText(newText);
                }
              }
            }
            if (event.session_id) lastProviderSessionId = event.session_id;
          } else if (event.type === 'result') {
            if (event.session_id) lastProviderSessionId = event.session_id;
            if (event.result && !fullContent) {
              fullContent = event.result;
              callbacks.onText(event.result);
            }
          }
        } catch {
          // Ignore malformed lines to preserve current streaming behavior.
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf8');
    });

    child.on('close', (code, signal) => {
      if (lineBuf.trim()) {
        try {
          const event = JSON.parse(lineBuf);
          if (event.type === 'result') {
            if (event.is_error) {
              const message = typeof event.result === 'string' ? event.result : 'Claude returned an error result';
              callbacks.onError({
                message,
                errorType: event.error === 'authentication_failed' ? 'auth' : detectClaudeChatErrorType('', message),
                provider: this.id,
              });
              return;
            }
            if (!fullContent) fullContent = event.result || '';
            lastProviderSessionId = event.session_id || lastProviderSessionId;
          }
        } catch {
          // Ignore malformed tail event.
        }
      }

      if (signal === 'SIGTERM') {
        callbacks.onDone({ aborted: true, provider: this.id, providerSessionId: lastProviderSessionId });
        return;
      }

      if (code !== 0) {
        callbacks.onError({
          message: stderrBuf || `Claude exited with code ${code}`,
          errorType: detectClaudeChatErrorType(stderrBuf, fullContent),
          provider: this.id,
        });
        return;
      }

      const result: ChatRunResult = {
        content: fullContent,
        durationMs: Date.now() - startedAt,
        provider: this.id,
        providerSessionId: lastProviderSessionId,
      };
      callbacks.onComplete?.(result);
      callbacks.onDone({
        durationMs: result.durationMs,
        provider: result.provider,
        providerSessionId: result.providerSessionId,
      });
    });

    child.on('error', (err) => {
      callbacks.onError({
        message: err.message,
        errorType: 'unknown',
        provider: this.id,
      });
    });

    return {
      provider: this.id,
      process: child,
      abort: () => child.kill('SIGTERM'),
    };
  }
}
