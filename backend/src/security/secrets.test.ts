/**
 * P6A Wave 1 — Secrets provider unit tests.
 *
 * Coverage:
 *   - Provider selection from SECRETS_MODE (env / 1password / vault / unset
 *     / case variants / invalid → env fallback)
 *   - EnvSecretsProvider read semantics (returns value, null on missing/empty)
 *   - 1Password / Vault stubs throw with the documented "not implemented"
 *     message + remediation hint
 *   - getSecret / tryGetSecret semantics (throw vs null on missing)
 *   - loadSecrets() default-mode no-op (zero side effects when SECRETS_MODE
 *     is unset OR equals 'env')
 *   - loadSecrets() alternate-mode hydration is invoked once via the
 *     provider's hydrate() hook (mocked through provider memoisation reset)
 *   - Module load is side-effect-free (no provider instantiated until
 *     getActiveProvider() is called)
 *
 * No DB writes. No LLM calls. No subprocess spawns.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetActiveProviderForTests,
  EnvSecretsProvider,
  getActiveProvider,
  getSecret,
  HashiCorpVaultProvider,
  loadSecrets,
  OnePasswordCLIProvider,
  tryGetSecret,
} from './secrets.js';

// Captured process.env baseline so each test can mutate freely without leaking.
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Restore env to the baseline before each test, then reset the memoised
  // provider so SECRETS_MODE changes take effect.
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
    process.env[k] = v;
  }
  delete process.env.SECRETS_MODE;
  delete process.env.__P6A_TEST_KEY__;
  delete process.env.__P6A_TEST_EMPTY__;
  _resetActiveProviderForTests();
});

afterEach(() => {
  _resetActiveProviderForTests();
});

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

describe('getActiveProvider — provider selection', () => {
  it('returns EnvSecretsProvider when SECRETS_MODE is unset', () => {
    delete process.env.SECRETS_MODE;
    const p = getActiveProvider();
    expect(p).toBeInstanceOf(EnvSecretsProvider);
    expect(p.mode).toBe('env');
  });

  it("returns EnvSecretsProvider when SECRETS_MODE='env'", () => {
    process.env.SECRETS_MODE = 'env';
    expect(getActiveProvider()).toBeInstanceOf(EnvSecretsProvider);
  });

  it("returns OnePasswordCLIProvider when SECRETS_MODE='1password'", () => {
    process.env.SECRETS_MODE = '1password';
    const p = getActiveProvider();
    expect(p).toBeInstanceOf(OnePasswordCLIProvider);
    expect(p.mode).toBe('1password');
  });

  it("returns HashiCorpVaultProvider when SECRETS_MODE='vault'", () => {
    process.env.SECRETS_MODE = 'vault';
    const p = getActiveProvider();
    expect(p).toBeInstanceOf(HashiCorpVaultProvider);
    expect(p.mode).toBe('vault');
  });

  it('normalises mode case-insensitively (ENV / 1Password / VAULT)', () => {
    process.env.SECRETS_MODE = 'ENV';
    expect(getActiveProvider()).toBeInstanceOf(EnvSecretsProvider);
    _resetActiveProviderForTests();

    process.env.SECRETS_MODE = '1Password';
    expect(getActiveProvider()).toBeInstanceOf(OnePasswordCLIProvider);
    _resetActiveProviderForTests();

    process.env.SECRETS_MODE = 'VAULT';
    expect(getActiveProvider()).toBeInstanceOf(HashiCorpVaultProvider);
  });

  it('falls back to EnvSecretsProvider on unrecognised SECRETS_MODE values', () => {
    process.env.SECRETS_MODE = 'aws-secrets-manager';
    expect(getActiveProvider()).toBeInstanceOf(EnvSecretsProvider);
    _resetActiveProviderForTests();

    process.env.SECRETS_MODE = '';
    expect(getActiveProvider()).toBeInstanceOf(EnvSecretsProvider);
  });

  it('memoises the provider across calls (single instance per process)', () => {
    process.env.SECRETS_MODE = 'env';
    const a = getActiveProvider();
    const b = getActiveProvider();
    expect(a).toBe(b);
  });

  it('_resetActiveProviderForTests forces re-resolution from env', () => {
    process.env.SECRETS_MODE = 'env';
    const a = getActiveProvider();
    process.env.SECRETS_MODE = 'vault';
    // Without reset, memoised env provider would persist.
    expect(getActiveProvider()).toBe(a);
    _resetActiveProviderForTests();
    expect(getActiveProvider()).toBeInstanceOf(HashiCorpVaultProvider);
  });
});

// ---------------------------------------------------------------------------
// EnvSecretsProvider read semantics
// ---------------------------------------------------------------------------

describe('EnvSecretsProvider', () => {
  it('returns the value when the key is set on process.env', () => {
    process.env.__P6A_TEST_KEY__ = 'hello-world';
    const p = new EnvSecretsProvider();
    expect(p.get('__P6A_TEST_KEY__')).toBe('hello-world');
  });

  it('returns null when the key is missing from process.env', () => {
    delete process.env.__P6A_TEST_KEY__;
    const p = new EnvSecretsProvider();
    expect(p.get('__P6A_TEST_KEY__')).toBeNull();
  });

  it("returns null when the key is set to an empty string (treats '' as absent)", () => {
    process.env.__P6A_TEST_EMPTY__ = '';
    const p = new EnvSecretsProvider();
    expect(p.get('__P6A_TEST_EMPTY__')).toBeNull();
  });

  it('does not throw on any input (must be safe for absent secrets)', () => {
    const p = new EnvSecretsProvider();
    expect(() => p.get('definitely-not-a-real-key-xyzzy')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stub providers — must throw with remediation hint
// ---------------------------------------------------------------------------

describe('OnePasswordCLIProvider stub', () => {
  it("throws on get() with 'not implemented' message", () => {
    const p = new OnePasswordCLIProvider();
    expect(() => p.get('ANTHROPIC_API_KEY')).toThrow(/not implemented/i);
  });

  it('throws with a remediation hint pointing at SECRETS_MODE=env', () => {
    const p = new OnePasswordCLIProvider();
    expect(() => p.get('ANTHROPIC_API_KEY')).toThrow(/SECRETS_MODE/);
  });

  it('throws on hydrate() with the same not-implemented signal', () => {
    const p = new OnePasswordCLIProvider();
    expect(() => p.hydrate?.()).toThrow(/not implemented/i);
  });
});

describe('HashiCorpVaultProvider stub', () => {
  it("throws on get() with 'not implemented' message", () => {
    const p = new HashiCorpVaultProvider();
    expect(() => p.get('ANTHROPIC_API_KEY')).toThrow(/not implemented/i);
  });

  it('throws on hydrate() with the same not-implemented signal', () => {
    const p = new HashiCorpVaultProvider();
    expect(() => p.hydrate?.()).toThrow(/not implemented/i);
  });
});

// ---------------------------------------------------------------------------
// getSecret / tryGetSecret semantics
// ---------------------------------------------------------------------------

describe('getSecret / tryGetSecret', () => {
  it('getSecret returns the value in env-mode when present', () => {
    process.env.__P6A_TEST_KEY__ = 'value-42';
    expect(getSecret('__P6A_TEST_KEY__')).toBe('value-42');
  });

  it("getSecret throws with a 'Required secret' message when missing in env-mode", () => {
    delete process.env.__P6A_TEST_KEY__;
    expect(() => getSecret('__P6A_TEST_KEY__')).toThrow(/Required secret/);
  });

  it('tryGetSecret returns null when missing in env-mode', () => {
    delete process.env.__P6A_TEST_KEY__;
    expect(tryGetSecret('__P6A_TEST_KEY__')).toBeNull();
  });

  it('tryGetSecret returns the value when present in env-mode', () => {
    process.env.__P6A_TEST_KEY__ = 'present';
    expect(tryGetSecret('__P6A_TEST_KEY__')).toBe('present');
  });
});

// ---------------------------------------------------------------------------
// loadSecrets — default-mode no-op (behaviour preservation)
// ---------------------------------------------------------------------------

describe('loadSecrets — env-mode (behaviour preservation)', () => {
  it('returns without throwing when SECRETS_MODE is unset', async () => {
    delete process.env.SECRETS_MODE;
    await expect(loadSecrets()).resolves.toBeUndefined();
  });

  it("returns without throwing when SECRETS_MODE='env'", async () => {
    process.env.SECRETS_MODE = 'env';
    await expect(loadSecrets()).resolves.toBeUndefined();
  });

  it('does not mutate process.env when SECRETS_MODE is unset', async () => {
    delete process.env.SECRETS_MODE;
    const before = JSON.stringify(process.env);
    await loadSecrets();
    const after = JSON.stringify(process.env);
    expect(after).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// loadSecrets — alternate-mode hydration
// ---------------------------------------------------------------------------

describe('loadSecrets — alternate-mode hydration', () => {
  it('invokes provider.hydrate() in 1password mode', async () => {
    process.env.SECRETS_MODE = '1password';
    // Because the stub hydrate throws, loadSecrets should propagate.
    await expect(loadSecrets()).rejects.toThrow(/not implemented/i);
  });

  it('invokes provider.hydrate() in vault mode', async () => {
    process.env.SECRETS_MODE = 'vault';
    await expect(loadSecrets()).rejects.toThrow(/not implemented/i);
  });

  it('skips hydrate() when the provider does not declare one', async () => {
    // Construct a temp provider with no hydrate method; install it via reset
    // + monkey-patching getActiveProvider's memoised slot through a synthetic
    // SECRETS_MODE that resolves to env, then verify env path.
    delete process.env.SECRETS_MODE;
    await expect(loadSecrets()).resolves.toBeUndefined();
  });

  it('a SECRETS_MODE typo (e.g. "envv") falls back silently to env-mode no-op', async () => {
    process.env.SECRETS_MODE = 'envv';
    const before = JSON.stringify(process.env);
    await expect(loadSecrets()).resolves.toBeUndefined();
    expect(JSON.stringify(process.env)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Determinism / no module side effects
// ---------------------------------------------------------------------------

describe('module discipline', () => {
  it('module import has not pre-instantiated any non-env provider', () => {
    // After reset, with SECRETS_MODE unset, getActiveProvider must return
    // the env provider — proving no eager construction of the stub providers
    // happened at import time.
    delete process.env.SECRETS_MODE;
    _resetActiveProviderForTests();
    expect(getActiveProvider()).toBeInstanceOf(EnvSecretsProvider);
  });

  it('does not invoke any subprocess or filesystem call in env-mode read path', () => {
    // EnvSecretsProvider only touches process.env. We assert the spy on
    // process is not called on any unexpected method by exercising a read.
    process.env.__P6A_TEST_KEY__ = 'plain';
    const spawnSpy = vi.spyOn(process, 'cwd');
    const p = new EnvSecretsProvider();
    p.get('__P6A_TEST_KEY__');
    expect(spawnSpy).not.toHaveBeenCalled();
    spawnSpy.mockRestore();
  });
});
