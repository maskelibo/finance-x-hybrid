/**
 * P1C Wave 1 — methodology registry tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  loadMethodology,
  resetMethodologyCache,
  getMethodologyVersion,
  getMethodologyComponent,
  recordSessionMethodology,
  tryRecordSessionMethodology,
  getSessionMethodology,
  verifyMethodologyConsistency,
} from './methodology.js';
import { diffMethodology } from '../scripts/methodology-diff.js';

const sessions: string[] = [];

function makeSession(): string {
  const id = `t-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, 'TEST', 'standard_institutional', 'pending', ?)`,
  ).run(id, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  while (sessions.length > 0) {
    const id = sessions.pop()!;
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

// =============================================================================
// Yaml load + cache
// =============================================================================

describe('methodology — load + version', () => {
  it('loads the yaml and returns parsed registry', () => {
    resetMethodologyCache();
    const reg = loadMethodology();
    expect(typeof reg.version).toBe('string');
    expect(reg.components).toBeDefined();
    expect(reg.components.confidence_scoring).toBeDefined();
  });

  it('caches across calls (returns deep copies, not the cached object)', () => {
    const a = loadMethodology();
    const b = loadMethodology();
    expect(a).not.toBe(b);            // deep copy
    expect(a).toEqual(b);              // structural equal
  });

  it('mutating the returned object does not pollute the cache', () => {
    const a = loadMethodology();
    (a as unknown as Record<string, unknown>).version = 'mutated';
    const b = loadMethodology();
    expect(b.version).not.toBe('mutated');
  });

  it('getMethodologyVersion returns the top-level version', () => {
    const v = getMethodologyVersion();
    expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('getMethodologyComponent returns the requested component or null', () => {
    expect(getMethodologyComponent('confidence_scoring')).not.toBeNull();
    expect(getMethodologyComponent('mystery_component')).toBeNull();
  });
});

// =============================================================================
// recordSessionMethodology / getSessionMethodology
// =============================================================================

describe('methodology — session snapshot persistence', () => {
  it('persists a snapshot for a session and round-trips it', () => {
    const sid = makeSession();
    recordSessionMethodology(sid);
    const row = getSessionMethodology(sid);
    expect(row).not.toBeNull();
    expect(row!.session_id).toBe(sid);
    expect(row!.methodology_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(row!.methodology_snapshot.components).toBeDefined();
    expect(typeof row!.recorded_at).toBe('string');
  });

  it('idempotent: second call does not overwrite (INSERT OR IGNORE)', () => {
    const sid = makeSession();
    recordSessionMethodology(sid);
    const first = getSessionMethodology(sid)!;
    // small wait equivalent — we just call again and confirm recorded_at unchanged
    recordSessionMethodology(sid);
    const second = getSessionMethodology(sid)!;
    expect(second.recorded_at).toBe(first.recorded_at);
  });

  it('returns null for unknown session', () => {
    expect(getSessionMethodology('no-such-session-id')).toBeNull();
  });

  it('cross-session isolation: snapshot in session A is not visible in B', () => {
    const a = makeSession();
    const b = makeSession();
    recordSessionMethodology(a);
    expect(getSessionMethodology(a)).not.toBeNull();
    expect(getSessionMethodology(b)).toBeNull();
  });
});

// =============================================================================
// tryRecordSessionMethodology (best-effort)
// =============================================================================

describe('methodology — tryRecordSessionMethodology', () => {
  it('does not throw for a valid session', () => {
    const sid = makeSession();
    expect(() => tryRecordSessionMethodology(sid)).not.toThrow();
  });

  it('returns silently when sessionId is undefined', () => {
    expect(() => tryRecordSessionMethodology(undefined)).not.toThrow();
  });

  it('swallows FK errors when session does not exist', () => {
    expect(() => tryRecordSessionMethodology('session-that-does-not-exist')).not.toThrow();
  });
});

// =============================================================================
// verifyMethodologyConsistency
// =============================================================================

describe('methodology — verifyMethodologyConsistency', () => {
  it('reports OK when yaml matches the TS-side expected constants', () => {
    const r = verifyMethodologyConsistency();
    expect(r.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
  });
});

// =============================================================================
// Diff CLI helper
// =============================================================================

describe('methodology — diffMethodology', () => {
  it('two identical snapshots → empty diff', () => {
    const a = loadMethodology();
    const b = loadMethodology();
    expect(diffMethodology(a, b)).toEqual([]);
  });

  it('top-level version mismatch surfaces as a diff line', () => {
    const a = loadMethodology();
    const b = loadMethodology();
    (b as unknown as Record<string, unknown>).version = '99.0.0';
    const diffs = diffMethodology(a, b);
    expect(diffs.some((d) => d.path === 'version')).toBe(true);
  });

  it('per-component value change surfaces under components.<key>', () => {
    const a = loadMethodology();
    const b = loadMethodology();
    (b.components.fact_pack_v2 as unknown as Record<string, unknown>).version = '9.9.9';
    const diffs = diffMethodology(a, b);
    expect(diffs.some((d) => d.path.startsWith('components.fact_pack_v2'))).toBe(true);
  });

  it('null vs registry surfaces as a root diff', () => {
    const a = loadMethodology();
    expect(diffMethodology(null, null)).toEqual([]);
    expect(diffMethodology(a, null).length).toBeGreaterThan(0);
    expect(diffMethodology(null, a).length).toBeGreaterThan(0);
  });
});
