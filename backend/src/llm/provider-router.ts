import { ClaudeProvider } from './claude-provider.js';
import type { LLMProvider } from './provider-interface.js';
import type { ProviderAvailability, ProviderId, ProviderRunInput, ProviderRunResult } from './types.js';

export type ProviderRouterOptions = {
  primaryProvider?: ProviderId;
};

export class ProviderRouter {
  private readonly provider: LLMProvider;

  constructor(_options: ProviderRouterOptions = {}) {
    this.provider = new ClaudeProvider();
  }

  async run(input: ProviderRunInput): Promise<ProviderRunResult> {
    return this.provider.run(input);
  }

  getProvider(_id: ProviderId): LLMProvider {
    return this.provider;
  }

  getPrimaryProvider(): LLMProvider {
    return this.provider;
  }

  async probeRoutedAvailability(): Promise<ProviderAvailability & { provider?: ProviderId }> {
    const availability = this.provider.probeAvailability
      ? await this.provider.probeAvailability()
      : { available: true };
    return {
      ...availability,
      provider: this.provider.id,
    };
  }
}
