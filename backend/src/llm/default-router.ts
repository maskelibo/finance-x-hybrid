import { LLM_FALLBACK_PROVIDER, LLM_PRIMARY_PROVIDER } from '../config.js';
import { ProviderRouter } from './provider-router.js';
import type { ProviderId } from './types.js';

export function resolvePrimaryProviderId(): ProviderId {
  return LLM_PRIMARY_PROVIDER === 'codex' ? 'codex' : 'claude';
}

export function resolveFallbackProviderId(): ProviderId | null {
  return LLM_FALLBACK_PROVIDER === 'claude' || LLM_FALLBACK_PROVIDER === 'codex'
    ? LLM_FALLBACK_PROVIDER
    : null;
}

export function createDefaultProviderRouter(): ProviderRouter {
  return new ProviderRouter({
    primaryProvider: resolvePrimaryProviderId(),
    fallbackProvider: resolveFallbackProviderId(),
  });
}
