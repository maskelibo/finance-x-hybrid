export type LLMErrorType = 'rate_limit' | 'auth' | 'timeout' | 'unknown';

export type ProviderId = 'claude';

export type ProviderRunInput = {
  prompt: string;
  model: string;
  timeoutMs?: number;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
};

export type ProviderRunResult = {
  success: boolean;
  output: string;
  error?: string;
  errorType?: LLMErrorType;
  durationMs: number;
  tokensUsed: number;
  costUsd: number;
  provider: ProviderId;
  rawOutput?: string;
};

export type ProviderAvailability = {
  available: boolean;
  reason?: string;
};
