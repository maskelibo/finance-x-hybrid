import type { ChatProviderId, ChatRunResult, ChatSessionState, StreamChatCallbacks, StreamChatResult } from './chat-types.js';

export type ChatProviderPrompt = {
  prompt: string;
  session: ChatSessionState;
  timeoutMs?: number;
  onProcess?: (process: import('node:child_process').ChildProcess) => void;
};

export interface ChatProvider {
  readonly id: ChatProviderId;
  chat(input: ChatProviderPrompt): Promise<ChatRunResult>;
  streamChat(input: ChatProviderPrompt, callbacks: StreamChatCallbacks): StreamChatResult;
}
