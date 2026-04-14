import type { ProviderAvailability, ProviderId, ProviderRunInput, ProviderRunResult } from './types.js';

export interface LLMProvider {
  readonly id: ProviderId;
  run(input: ProviderRunInput): Promise<ProviderRunResult>;
  probeAvailability?(): Promise<ProviderAvailability>;
}
