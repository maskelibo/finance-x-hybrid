/**
 * P6A Wave 1 — Pluggable secrets provider.
 *
 * Design (per finance-x-polish P6A scope):
 *   - SecretsProvider interface with three back-ends:
 *       env       — full implementation, reads from process.env (default)
 *       1password — stub-throws (op CLI integration deferred)
 *       vault     — stub-throws (HashiCorp Vault integration deferred)
 *   - Active provider selected via SECRETS_MODE env var (case-insensitive).
 *     Unset / unrecognised values fall back to 'env' silently — preserving
 *     byte-identical current behaviour when the variable is absent.
 *   - Module load is side-effect-free. Provider instantiation is lazy and
 *     memoised via getActiveProvider().
 *   - loadSecrets() is the boot-time hydration hook:
 *       env-mode    → no-op early return (current behaviour preserved)
 *       alt-mode    → enumerate provider, hydrate any missing process.env keys
 *
 * Behaviour-preservation invariant: when SECRETS_MODE is unset OR equals
 * 'env' (any case), no module-level side effects fire and loadSecrets()
 * returns immediately without touching process.env. The boot path of a
 * SECRETS_MODE-unset deployment is byte-for-byte identical to a build
 * without this module.
 */

export type SecretsMode = 'env' | '1password' | 'vault';

export interface SecretsProvider {
  readonly mode: SecretsMode;
  /** Returns the secret value, or null if not present. Must not throw on missing. */
  get(key: string): string | null;
  /**
   * Optional bulk hydration. Called once at boot in alternate-mode to populate
   * process.env from the underlying store. env-mode skips this entirely.
   */
  hydrate?(): void;
}

// ---------------------------------------------------------------------------
// EnvSecretsProvider — full implementation
// ---------------------------------------------------------------------------

export class EnvSecretsProvider implements SecretsProvider {
  readonly mode: SecretsMode = 'env';

  get(key: string): string | null {
    const v = process.env[key];
    if (v === undefined || v === '') return null;
    return v;
  }
}

// ---------------------------------------------------------------------------
// OnePasswordCLIProvider — stub (deferred to a future P6A wave)
// ---------------------------------------------------------------------------

export class OnePasswordCLIProvider implements SecretsProvider {
  readonly mode: SecretsMode = '1password';

  get(_key: string): string | null {
    throw new Error(
      '[secrets] OnePasswordCLIProvider is not implemented in P6A Wave 1. ' +
        "Set SECRETS_MODE='env' (or unset it) to use the default env-based provider.",
    );
  }

  hydrate(): void {
    throw new Error(
      '[secrets] OnePasswordCLIProvider.hydrate is not implemented in P6A Wave 1. ' +
        "Set SECRETS_MODE='env' (or unset it) to use the default env-based provider.",
    );
  }
}

// ---------------------------------------------------------------------------
// HashiCorpVaultProvider — stub (deferred to a future P6A wave)
// ---------------------------------------------------------------------------

export class HashiCorpVaultProvider implements SecretsProvider {
  readonly mode: SecretsMode = 'vault';

  get(_key: string): string | null {
    throw new Error(
      '[secrets] HashiCorpVaultProvider is not implemented in P6A Wave 1. ' +
        "Set SECRETS_MODE='env' (or unset it) to use the default env-based provider.",
    );
  }

  hydrate(): void {
    throw new Error(
      '[secrets] HashiCorpVaultProvider.hydrate is not implemented in P6A Wave 1. ' +
        "Set SECRETS_MODE='env' (or unset it) to use the default env-based provider.",
    );
  }
}

// ---------------------------------------------------------------------------
// Provider selection (lazy, memoised)
// ---------------------------------------------------------------------------

function resolveMode(): SecretsMode {
  const raw = process.env.SECRETS_MODE;
  if (raw === undefined || raw === '') return 'env';
  const normalised = raw.toLowerCase().trim();
  if (normalised === 'env') return 'env';
  if (normalised === '1password') return '1password';
  if (normalised === 'vault') return 'vault';
  // Unrecognised value → silent fallback to 'env'. Preserves boot in misconfigured
  // deployments; visible via the provider's .mode property if needed.
  return 'env';
}

let _activeProvider: SecretsProvider | null = null;

export function getActiveProvider(): SecretsProvider {
  if (_activeProvider !== null) return _activeProvider;
  const mode = resolveMode();
  switch (mode) {
    case 'env':
      _activeProvider = new EnvSecretsProvider();
      break;
    case '1password':
      _activeProvider = new OnePasswordCLIProvider();
      break;
    case 'vault':
      _activeProvider = new HashiCorpVaultProvider();
      break;
  }
  return _activeProvider;
}

/**
 * Test-only: reset the memoised active provider so a subsequent call to
 * getActiveProvider() re-reads process.env.SECRETS_MODE. Not for production use.
 */
export function _resetActiveProviderForTests(): void {
  _activeProvider = null;
}

// ---------------------------------------------------------------------------
// Public read API
// ---------------------------------------------------------------------------

/**
 * Fetch a secret. Throws if the key is not present. Use tryGetSecret for
 * optional secrets.
 */
export function getSecret(key: string): string {
  const v = getActiveProvider().get(key);
  if (v === null) {
    throw new Error(`[secrets] Required secret '${key}' is not set under provider '${getActiveProvider().mode}'.`);
  }
  return v;
}

/**
 * Fetch a secret. Returns null if the key is not present. Will still throw
 * if the underlying provider is a not-yet-implemented stub.
 */
export function tryGetSecret(key: string): string | null {
  return getActiveProvider().get(key);
}

// ---------------------------------------------------------------------------
// Boot-time hydration
// ---------------------------------------------------------------------------

/**
 * Boot-time hook. In env-mode this is a no-op early return — process.env is
 * already the source of truth. In alternate modes, the provider's hydrate()
 * pulls secrets and writes them onto process.env so downstream code (which
 * reads process.env directly) keeps working unchanged.
 *
 * Behaviour preservation: with SECRETS_MODE unset or set to 'env', this
 * function returns synchronously with zero side effects.
 */
export async function loadSecrets(): Promise<void> {
  const provider = getActiveProvider();
  if (provider.mode === 'env') return;
  if (typeof provider.hydrate === 'function') {
    provider.hydrate();
  }
}
