import { CodexProvider } from './codex-provider.js';
import { ClaudeProvider } from './claude-provider.js';
import type { LLMProvider } from './provider-interface.js';
import type { ProviderAvailability, ProviderId, ProviderRunInput, ProviderRunResult } from './types.js';

export type ProviderRouterOptions = {
  primaryProvider?: ProviderId;
  fallbackProvider?: ProviderId | null;
};

export class ProviderRouter {
  private readonly providers: Record<ProviderId, LLMProvider>;
  private readonly primaryProvider: ProviderId;
  private readonly fallbackProvider: ProviderId | null;

  constructor(options: ProviderRouterOptions = {}) {
    this.providers = {
      claude: new ClaudeProvider(),
      codex: new CodexProvider(),
    };
    this.primaryProvider = options.primaryProvider || 'claude';
    this.fallbackProvider = options.fallbackProvider === undefined ? 'codex' : options.fallbackProvider;
  }

  async run(input: ProviderRunInput): Promise<ProviderRunResult> {
    const primary = this.providers[this.primaryProvider];
    const primaryResult = await primary.run(input);
    if (
      primaryResult.success ||
      primaryResult.errorType !== 'rate_limit' ||
      !this.fallbackProvider ||
      this.fallbackProvider === this.primaryProvider
    ) {
      return primaryResult;
    }

    const fallback = this.providers[this.fallbackProvider];
    const availability = fallback.probeAvailability ? await fallback.probeAvailability() : { available: true };
    if (!availability.available) {
      return primaryResult;
    }

    const fallbackResult = await fallback.run({
      ...input,
      model: input.fallbackModel || input.model,
    });
    if (fallbackResult.success) {
      return fallbackResult;
    }

    return primaryResult;
  }

  getProvider(id: ProviderId): LLMProvider {
    return this.providers[id];
  }

  getPrimaryProvider(): LLMProvider {
    return this.providers[this.primaryProvider];
  }

  getFallbackProvider(): LLMProvider | null {
    if (!this.fallbackProvider) return null;
    return this.providers[this.fallbackProvider];
  }

  async probeRoutedAvailability(): Promise<ProviderAvailability & { provider?: ProviderId }> {
    const primary = this.getPrimaryProvider();
    const primaryAvailability = primary.probeAvailability
      ? await primary.probeAvailability()
      : { available: true };
    if (primaryAvailability.available) {
      return {
        ...primaryAvailability,
        provider: primary.id,
      };
    }

    const fallback = this.getFallbackProvider();
    if (!fallback || fallback.id === primary.id) {
      return {
        ...primaryAvailability,
        provider: primary.id,
      };
    }

    const fallbackAvailability = fallback.probeAvailability
      ? await fallback.probeAvailability()
      : { available: true };
    if (fallbackAvailability.available) {
      return {
        ...fallbackAvailability,
        provider: fallback.id,
      };
    }

    return {
      available: false,
      reason: fallbackAvailability.reason || primaryAvailability.reason,
      provider: primary.id,
    };
  }
}
