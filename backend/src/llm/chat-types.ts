import type { ChildProcess } from 'node:child_process';

export type ChatProviderId = 'claude';
export type ChatErrorType = 'rate_limit' | 'auth' | 'timeout' | 'unknown';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ChatSessionState = {
  history: ChatMessage[];
  providerSessions: Partial<Record<ChatProviderId, string>>;
  lastProvider?: ChatProviderId;
};

export type ChatRunResult = {
  content: string;
  durationMs: number;
  provider: ChatProviderId;
  providerSessionId?: string;
};

export type StreamChatCallbacks = {
  onText: (text: string) => void;
  onDone: (payload: { aborted?: boolean; durationMs?: number; provider: ChatProviderId; providerSessionId?: string }) => void;
  onError: (payload: { message: string; errorType?: ChatErrorType; provider: ChatProviderId }) => void;
  onComplete?: (result: ChatRunResult) => void;
};

export type StreamChatResult = {
  provider: ChatProviderId;
  process: ChildProcess;
  abort: () => void;
};

export class ChatProviderError extends Error {
  readonly errorType: ChatErrorType;
  readonly provider: ChatProviderId;

  constructor(provider: ChatProviderId, message: string, errorType: ChatErrorType = 'unknown') {
    super(message);
    this.name = 'ChatProviderError';
    this.provider = provider;
    this.errorType = errorType;
  }
}
