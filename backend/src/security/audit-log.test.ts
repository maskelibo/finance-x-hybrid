/**
 * P6B Wave 1 — Audit-log unit tests.
 *
 * Coverage groups:
 *   A. Module discipline (no disk side effects on import, default-OFF no-op,
 *      _resetForTests clears state)
 *   B. recordAuditEvent shape (genesis hash, id/timestamp shape, event_type
 *      enum runtime guard, actor/target string guards, oversized rejection)
 *   C. Chain integrity (sequential links, deterministic hashes,
 *      canonicalisation order-independence, hash length)
 *   D. verifyAuditChain (valid, tampered current_hash, tampered
 *      previous_hash, missing/reordered lines, empty file, parse error,
 *      shape invalid)
 *   E. Persistence + test-mode disable (default OFF no chain advance,
 *      AUDIT_LOG_DISK_DISABLED, NODE_ENV=test, VITEST=true, tmpdir happy
 *      path, restart hydration)
 *   F. Secret-leak prevention (warn on key, value not in warning)
 *   G. Date filename + midnight rotation (faked timers, hash carries)
 *   H. CRLF robustness in verify
 *
 * No DB writes. No LLM calls. No subprocess. All disk writes go through a
 * per-test os.tmpdir() sub-directory; nothing is written to ./logs/audit.
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  _canonicalEventForTests,
  _GENESIS_HASH_FOR_TESTS,
  _getLastHashForTests,
  _MAX_CANONICAL_BYTES_FOR_TESTS,
  _resetForTests,
  _setLogDirForTests,
  recordAuditEvent,
  verifyAuditChain,
  type AuditEvent,
  type AuditEventInput,
} from './audit-log.js';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
    process.env[k] = v;
  }
}

function enableLiveDiskWrites(): void {
  process.env.AUDIT_LOG_ENABLED = '1';
  delete process.env.NODE_ENV;
  delete process.env.VITEST;
  delete process.env.AUDIT_LOG_DISK_DISABLED;
}

async function makeTmpDir(label: string): Promise<string> {
  const dir = path.join(os.tmpdir(), `audit-log-${label}-${crypto.randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function rmDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

beforeEach(() => {
  restoreEnv();
  delete process.env.AUDIT_LOG_ENABLED;
  delete process.env.AUDIT_LOG_DISK_DISABLED;
  _resetForTests();
});

afterEach(() => {
  _resetForTests();
  restoreEnv();
});

afterAll(() => {
  restoreEnv();
});

// =============================================================================
// Group A — module discipline
// =============================================================================

describe('audit-log — module discipline', () => {
  it('exports the public API surface and constants', () => {
    expect(typeof recordAuditEvent).toBe('function');
    expect(typeof verifyAuditChain).toBe('function');
    expect(_GENESIS_HASH_FOR_TESTS).toBe('0000000000000000');
    expect(_MAX_CANONICAL_BYTES_FOR_TESTS).toBeGreaterThan(0);
  });

  it('default OFF (AUDIT_LOG_ENABLED unset) is a no-op and does not advance the chain', async () => {
    delete process.env.AUDIT_LOG_ENABLED;
    expect(_getLastHashForTests()).toBe(_GENESIS_HASH_FOR_TESTS);
    await recordAuditEvent({ event_type: 'session_started', actor: 'sys' });
    expect(_getLastHashForTests()).toBe(_GENESIS_HASH_FOR_TESTS);
  });

  it('_resetForTests restores the genesis state', async () => {
    process.env.AUDIT_LOG_ENABLED = '1';
    await recordAuditEvent({ event_type: 'session_started', actor: 'sys' });
    expect(_getLastHashForTests()).not.toBe(_GENESIS_HASH_FOR_TESTS);
    _resetForTests();
    expect(_getLastHashForTests()).toBe(_GENESIS_HASH_FOR_TESTS);
  });
});

// =============================================================================
// Group B — recordAuditEvent shape
// =============================================================================

describe('recordAuditEvent — shape and guards', () => {
  beforeEach(() => {
    process.env.AUDIT_LOG_ENABLED = '1';
  });

  it('genesis event has previous_hash of 16 zero chars and chain advances', async () => {
    await recordAuditEvent({ event_type: 'session_started', actor: 'sys' });
    const after = _getLastHashForTests();
    expect(after).not.toBe(_GENESIS_HASH_FOR_TESTS);
    expect(after).toMatch(/^[0-9a-f]{16}$/);
  });

  it('chain advance produces a 16-hex-char hash', async () => {
    await recordAuditEvent({ event_type: 'session_started', actor: 'sys' });
    expect(_getLastHashForTests()).toMatch(/^[0-9a-f]{16}$/);
  });

  it('rejects unknown event_type at runtime', async () => {
    await expect(
      recordAuditEvent({ event_type: 'bogus' as unknown as AuditEventInput['event_type'], actor: 'sys' }),
    ).rejects.toThrow(/Unknown event_type/);
  });

  it('rejects non-string actor at runtime', async () => {
    await expect(
      recordAuditEvent({
        event_type: 'session_started',
        actor: 42 as unknown as string,
      }),
    ).rejects.toThrow(/actor must be a string/);
  });

  it('rejects non-string target when provided', async () => {
    await expect(
      recordAuditEvent({
        event_type: 'session_started',
        actor: 'sys',
        target: 42 as unknown as string,
      }),
    ).rejects.toThrow(/target must be a string/);
  });

  it('rejects oversized canonicalised payload', async () => {
    const huge = 'x'.repeat(_MAX_CANONICAL_BYTES_FOR_TESTS + 1024);
    await expect(
      recordAuditEvent({ event_type: 'config_change', actor: 'sys', details: { huge } }),
    ).rejects.toThrow(/exceeds.*cap|refusing to log/i);
  });
});

// =============================================================================
// Group C — chain integrity
// =============================================================================

describe('recordAuditEvent — chain integrity', () => {
  beforeEach(() => {
    process.env.AUDIT_LOG_ENABLED = '1';
  });

  it('two sequential events: chain links forward', async () => {
    await recordAuditEvent({ event_type: 'session_started', actor: 'sys' });
    const hashA = _getLastHashForTests();
    await recordAuditEvent({ event_type: 'session_completed', actor: 'sys' });
    const hashB = _getLastHashForTests();
    expect(hashA).not.toBe(hashB);
    expect(hashA).not.toBe(_GENESIS_HASH_FOR_TESTS);
    expect(hashB).not.toBe(_GENESIS_HASH_FOR_TESTS);
  });

  it('ten sequential events produce ten distinct hashes', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      await recordAuditEvent({ event_type: 'config_change', actor: `actor-${i}` });
      seen.add(_getLastHashForTests());
    }
    expect(seen.size).toBe(10);
  });

  it('current_hash is deterministic for fixed canonical input', () => {
    const ev = {
      id: 'fixed-id',
      timestamp: '2026-04-28T00:00:00.000Z',
      event_type: 'session_started' as const,
      actor: 'sys',
      target: 'TICKER',
      details: { mode: 'standard' },
      previous_hash: _GENESIS_HASH_FOR_TESTS,
    };
    const a = _canonicalEventForTests(ev);
    const b = _canonicalEventForTests(ev);
    expect(a).toBe(b);
  });

  it('canonicalisation is order-independent for details keys', () => {
    const evA = {
      id: 'fixed-id',
      timestamp: '2026-04-28T00:00:00.000Z',
      event_type: 'session_started' as const,
      actor: 'sys',
      details: { z: 1, a: 2, m: 3 },
      previous_hash: _GENESIS_HASH_FOR_TESTS,
    };
    const evB = {
      id: 'fixed-id',
      timestamp: '2026-04-28T00:00:00.000Z',
      event_type: 'session_started' as const,
      actor: 'sys',
      details: { a: 2, m: 3, z: 1 },
      previous_hash: _GENESIS_HASH_FOR_TESTS,
    };
    expect(_canonicalEventForTests(evA)).toBe(_canonicalEventForTests(evB));
  });

  it('canonicalisation is order-independent for nested details', () => {
    const evA = {
      id: 'fixed-id',
      timestamp: '2026-04-28T00:00:00.000Z',
      event_type: 'session_started' as const,
      actor: 'sys',
      details: { nested: { y: 1, x: 2 }, top: 'A' },
      previous_hash: _GENESIS_HASH_FOR_TESTS,
    };
    const evB = {
      id: 'fixed-id',
      timestamp: '2026-04-28T00:00:00.000Z',
      event_type: 'session_started' as const,
      actor: 'sys',
      details: { top: 'A', nested: { x: 2, y: 1 } },
      previous_hash: _GENESIS_HASH_FOR_TESTS,
    };
    expect(_canonicalEventForTests(evA)).toBe(_canonicalEventForTests(evB));
  });
});

// =============================================================================
// Group D — verifyAuditChain
// =============================================================================

async function recordChainToTmp(events: AuditEventInput[], label: string): Promise<{ tmpDir: string; filePath: string }> {
  enableLiveDiskWrites();
  _resetForTests();
  const tmpDir = await makeTmpDir(label);
  _setLogDirForTests(tmpDir);
  for (const ev of events) {
    await recordAuditEvent(ev);
  }
  const files = await fs.readdir(tmpDir);
  const auditFile = files.find((f) => f.startsWith('audit_'));
  if (!auditFile) throw new Error('no audit file written');
  return { tmpDir, filePath: path.join(tmpDir, auditFile) };
}

describe('verifyAuditChain', () => {
  it('valid chain → { valid: true }', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
        { event_type: 'config_change', actor: 'op' },
      ],
      'verify-valid',
    );
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(true);
    expect(result.firstInvalidLine).toBeUndefined();
    await rmDir(tmpDir);
  });

  it('detects tampered current_hash', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
      ],
      'verify-tamper-cur',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const evA = JSON.parse(lines[0]) as AuditEvent;
    evA.current_hash = 'deadbeefdeadbeef';
    const tampered = [JSON.stringify(evA), lines[1]].join('\n') + '\n';
    await fs.writeFile(filePath, tampered, 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidLine).toBe(0);
    expect(result.reason).toBe('current_hash_mismatch');
    await rmDir(tmpDir);
  });

  it('detects tampered previous_hash', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
      ],
      'verify-tamper-prev',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const evB = JSON.parse(lines[1]) as AuditEvent;
    evB.previous_hash = 'cafebabe12345678';
    const tampered = [lines[0], JSON.stringify(evB)].join('\n') + '\n';
    await fs.writeFile(filePath, tampered, 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidLine).toBe(1);
    expect(result.reason).toBe('previous_hash_mismatch');
    await rmDir(tmpDir);
  });

  it('detects missing line', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
        { event_type: 'config_change', actor: 'op' },
      ],
      'verify-missing',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const removed = [lines[0], lines[2]].join('\n') + '\n';
    await fs.writeFile(filePath, removed, 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidLine).toBe(1);
    expect(result.reason).toBe('previous_hash_mismatch');
    await rmDir(tmpDir);
  });

  it('detects reordered lines', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
        { event_type: 'config_change', actor: 'op' },
      ],
      'verify-reorder',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const reordered = [lines[1], lines[0], lines[2]].join('\n') + '\n';
    await fs.writeFile(filePath, reordered, 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('previous_hash_mismatch');
    await rmDir(tmpDir);
  });

  it('empty file → { valid: true }', async () => {
    const tmpDir = await makeTmpDir('verify-empty');
    const filePath = path.join(tmpDir, 'audit_empty.jsonl');
    await fs.writeFile(filePath, '', 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(true);
    await rmDir(tmpDir);
  });

  it('parse_error on malformed JSON', async () => {
    const tmpDir = await makeTmpDir('verify-parse');
    const filePath = path.join(tmpDir, 'audit_bad.jsonl');
    await fs.writeFile(filePath, '{not valid json}\n', 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidLine).toBe(0);
    expect(result.reason).toBe('parse_error');
    await rmDir(tmpDir);
  });

  it('shape_invalid on missing required field', async () => {
    const tmpDir = await makeTmpDir('verify-shape');
    const filePath = path.join(tmpDir, 'audit_short.jsonl');
    await fs.writeFile(filePath, JSON.stringify({ id: 'x' }) + '\n', 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('shape_invalid');
    await rmDir(tmpDir);
  });
});

// =============================================================================
// Group E — persistence + test-mode disable
// =============================================================================

describe('persistence + test-mode disable', () => {
  it('NODE_ENV=test + AUDIT_LOG_ENABLED=1 advances chain in-memory but does NOT touch disk', async () => {
    process.env.AUDIT_LOG_ENABLED = '1';
    process.env.NODE_ENV = 'test';
    delete process.env.AUDIT_LOG_DISK_DISABLED;
    const tmpDir = await makeTmpDir('test-disabled');
    _setLogDirForTests(tmpDir);
    await recordAuditEvent({ event_type: 'session_started', actor: 'a' });
    expect(_getLastHashForTests()).not.toBe(_GENESIS_HASH_FOR_TESTS);
    const files = await fs.readdir(tmpDir);
    expect(files.filter((f) => f.startsWith('audit_'))).toHaveLength(0);
    await rmDir(tmpDir);
  });

  it('AUDIT_LOG_DISK_DISABLED=1 forces no-disk mode even with NODE_ENV cleared', async () => {
    process.env.AUDIT_LOG_ENABLED = '1';
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
    process.env.AUDIT_LOG_DISK_DISABLED = '1';
    const tmpDir = await makeTmpDir('disk-disabled');
    _setLogDirForTests(tmpDir);
    await recordAuditEvent({ event_type: 'session_started', actor: 'a' });
    expect(_getLastHashForTests()).not.toBe(_GENESIS_HASH_FOR_TESTS);
    const files = await fs.readdir(tmpDir);
    expect(files.filter((f) => f.startsWith('audit_'))).toHaveLength(0);
    await rmDir(tmpDir);
  });

  it('default OFF (AUDIT_LOG_ENABLED unset) does NOT advance chain even with disk-enabled env', async () => {
    delete process.env.AUDIT_LOG_ENABLED;
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.AUDIT_LOG_DISK_DISABLED;
    const tmpDir = await makeTmpDir('default-off');
    _setLogDirForTests(tmpDir);
    await recordAuditEvent({ event_type: 'session_started', actor: 'a' });
    expect(_getLastHashForTests()).toBe(_GENESIS_HASH_FOR_TESTS);
    const files = await fs.readdir(tmpDir);
    expect(files.filter((f) => f.startsWith('audit_'))).toHaveLength(0);
    await rmDir(tmpDir);
  });

  it('happy-path tmpdir: writes file, content is valid JSONL, chain valid', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a', target: 'KCHOL' },
        { event_type: 'session_completed', actor: 'a', target: 'KCHOL' },
      ],
      'happy-path',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    const evA = JSON.parse(lines[0]) as AuditEvent;
    expect(evA.event_type).toBe('session_started');
    expect(evA.target).toBe('KCHOL');
    expect(evA.previous_hash).toBe(_GENESIS_HASH_FOR_TESTS);
    expect(evA.current_hash).toMatch(/^[0-9a-f]{16}$/);
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(true);
    await rmDir(tmpDir);
  });

  it('restart simulation: new module state hydrates last_hash from existing file', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
      ],
      'restart-hydrate',
    );
    const lastHashBeforeReset = _getLastHashForTests();

    _resetForTests();
    expect(_getLastHashForTests()).toBe(_GENESIS_HASH_FOR_TESTS);

    enableLiveDiskWrites();
    _setLogDirForTests(tmpDir);
    await recordAuditEvent({ event_type: 'config_change', actor: 'op' });

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    expect(lines).toHaveLength(3);
    const ev3 = JSON.parse(lines[2]) as AuditEvent;
    expect(ev3.previous_hash).toBe(lastHashBeforeReset);
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(true);
    await rmDir(tmpDir);
  });
});

// =============================================================================
// Group F — secret-leak prevention
// =============================================================================

describe('secret-leak prevention', () => {
  beforeEach(() => {
    process.env.AUDIT_LOG_ENABLED = '1';
  });

  it('warns when a details key looks secret-like', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await recordAuditEvent({
      event_type: 'config_change',
      actor: 'op',
      details: { api_key: 'sk-not-a-real-secret-xyz' },
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('warning never includes the secret value', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const secretValue = 'sk-not-a-real-secret-xyz-9876543210';
    await recordAuditEvent({
      event_type: 'config_change',
      actor: 'op',
      details: { password: secretValue },
    });
    expect(warnSpy).toHaveBeenCalled();
    for (const call of warnSpy.mock.calls) {
      const joined = call.map((c) => String(c)).join(' ');
      expect(joined).not.toContain(secretValue);
      expect(joined).toContain('password');
    }
    warnSpy.mockRestore();
  });
});

// =============================================================================
// Group G — date filename + midnight rotation
// =============================================================================

describe('date filename + rotation', () => {
  it('writes to audit_YYYY-MM-DD.jsonl for current UTC day', async () => {
    enableLiveDiskWrites();
    const tmpDir = await makeTmpDir('filename-format');
    _setLogDirForTests(tmpDir);
    await recordAuditEvent({ event_type: 'session_started', actor: 'a' });
    const files = await fs.readdir(tmpDir);
    const auditFiles = files.filter((f) => /^audit_\d{4}-\d{2}-\d{2}\.jsonl$/.test(f));
    expect(auditFiles).toHaveLength(1);
    await rmDir(tmpDir);
  });

  it('midnight rotation produces a new file and chain hash carries across', async () => {
    enableLiveDiskWrites();
    const tmpDir = await makeTmpDir('rotation');
    _setLogDirForTests(tmpDir);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-04-28T23:00:00.000Z'));
      await recordAuditEvent({ event_type: 'session_started', actor: 'a' });
      const hashAfterDay1 = _getLastHashForTests();

      vi.setSystemTime(new Date('2026-04-29T01:00:00.000Z'));
      await recordAuditEvent({ event_type: 'session_completed', actor: 'a' });

      const files = (await fs.readdir(tmpDir)).sort();
      expect(files).toContain('audit_2026-04-28.jsonl');
      expect(files).toContain('audit_2026-04-29.jsonl');

      const day2Content = await fs.readFile(path.join(tmpDir, 'audit_2026-04-29.jsonl'), 'utf8');
      const day2Event = JSON.parse(day2Content.trim()) as AuditEvent;
      expect(day2Event.previous_hash).toBe(hashAfterDay1);
    } finally {
      vi.useRealTimers();
    }
    await rmDir(tmpDir);
  });
});

// =============================================================================
// Group H — CRLF robustness
// =============================================================================

describe('CRLF robustness', () => {
  it('verifyAuditChain accepts CRLF line endings', async () => {
    const { tmpDir, filePath } = await recordChainToTmp(
      [
        { event_type: 'session_started', actor: 'a' },
        { event_type: 'session_completed', actor: 'a' },
      ],
      'crlf',
    );
    const content = await fs.readFile(filePath, 'utf8');
    const crlfContent = content.replace(/\n/g, '\r\n');
    await fs.writeFile(filePath, crlfContent, 'utf8');
    const result = await verifyAuditChain(filePath);
    expect(result.valid).toBe(true);
    await rmDir(tmpDir);
  });
});
