import { ProviderRouter } from './provider-router.js';
import type { ProviderId } from './types.js';

export function resolvePrimaryProviderId(): ProviderId {
  return 'claude';
}

export function createDefaultProviderRouter(): ProviderRouter {
  return new ProviderRouter({
    primaryProvider: resolvePrimaryProviderId(),
  });
}
