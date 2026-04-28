/**
 * P6B Wave 1 — Immutable hash-chained audit log (standalone module).
 *
 * Design (per finance-x-polish P6B Wave 1 scope):
 *   - Append-only JSONL stream of session-lifecycle and governance events.
 *   - Each event is hash-chained: current_hash = SHA-256(canonical(event sans
 *     current_hash)) truncated to 16 hex chars; previous_hash is the prior
 *     event's current_hash. Genesis previous_hash = '0' * 16.
 *   - A single canonicalisation helper (deep-sorted keys, current_hash
 *     omitted) is used by both the writer and the verifier — eliminating
 *     the keylist-drift risk in the master-plan source spec.
 *   - Default OFF: AUDIT_LOG_ENABLED !== '1' makes recordAuditEvent a no-op
 *     that does NOT advance the in-memory chain and does NOT touch disk.
 *   - Test-mode disk disable: when NODE_ENV='test' OR VITEST='true' OR
 *     AUDIT_LOG_DISK_DISABLED='1', the writer accepts the call, advances
 *     the chain in-memory, but skips mkdir + appendFile.
 *   - Lazy init: the audit dir + last-hash hydration runs inside the first
 *     disk-write call, never at module load. Module import is side-effect
 *     free.
 *
 * Wave 1 ships ZERO callers. No orchestrator wiring, no boot hook, no
 * server.ts touch. Wave 2 (separate operator approval) will wire session
 * lifecycle points into orchestrator.ts under the P4.5 template.
 *
 * Caller contract: details MUST be pre-redacted. The module enforces a hard
 * 4 KB cap on canonicalised payload (report bodies / full prompts / full
 * LLM outputs cannot fit) and emits a best-effort console.warn if a key
 * matches /api[_-]?key|password|token|secret|authorization|bearer/i — the
 * warning never includes the value, only the key name.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type AuditEventType =
  | 'session_started'
  | 'session_completed'
  | 'session_failed'
  | 'qa_rejected'
  | 'human_override'
  | 'config_change'
  | 'secret_access';

const EVENT_TYPES: ReadonlySet<AuditEventType> = new Set<AuditEventType>([
  'session_started',
  'session_completed',
  'session_failed',
  'qa_rejected',
  'human_override',
  'config_change',
  'secret_access',
]);

export interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: AuditEventType;
  actor: string;
  target?: string;
  details: Record<string, unknown>;
  previous_hash: string;
  current_hash: string;
}

export interface AuditEventInput {
  event_type: AuditEventType;
  actor: string;
  target?: string;
  details?: Record<string, unknown>;
}

export type VerifyReason =
  | 'previous_hash_mismatch'
  | 'current_hash_mismatch'
  | 'parse_error'
  | 'shape_invalid';

export interface VerifyResult {
  valid: boolean;
  firstInvalidLine?: number;
  reason?: VerifyReason;
}

const GENESIS_HASH = '0'.repeat(16);
const HASH_LENGTH = 16;
const DEFAULT_LOG_DIR = './logs/audit';
const MAX_CANONICAL_BYTES = 4096;
const SECRET_KEY_REGEX = /(api[_-]?key|password|token|secret|authorization|bearer)/i;

let _logDir = DEFAULT_LOG_DIR;
let _lastHash = GENESIS_HASH;
let _initOnce: Promise<void> | null = null;

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

function isWriterEnabled(): boolean {
  return process.env.AUDIT_LOG_ENABLED === '1';
}

function isTestModeDiskDisabled(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.AUDIT_LOG_DISK_DISABLED === '1'
  );
}

function shouldWriteToDisk(): boolean {
  return isWriterEnabled() && !isTestModeDiskDisabled();
}

// ---------------------------------------------------------------------------
// Canonicalisation — deep sorted keys, used by writer and verifier
// ---------------------------------------------------------------------------

function deepSortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepSortKeys);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = deepSortKeys(obj[key]);
  }
  return sorted;
}

function canonicalEvent(ev: Omit<AuditEvent, 'current_hash'>): string {
  const base: Record<string, unknown> = {
    actor: ev.actor,
    details: deepSortKeys(ev.details ?? {}),
    event_type: ev.event_type,
    id: ev.id,
    previous_hash: ev.previous_hash,
    timestamp: ev.timestamp,
  };
  if (ev.target !== undefined) base.target = ev.target;
  return JSON.stringify(base);
}

function hashCanonical(canonical: string): string {
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, HASH_LENGTH);
}

// ---------------------------------------------------------------------------
// Filesystem
// ---------------------------------------------------------------------------

function todayFilePath(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(_logDir, `audit_${date}.jsonl`);
}

async function hydrateFromDisk(): Promise<void> {
  try {
    const filePath = todayFilePath();
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]) as AuditEvent;
      if (typeof last.current_hash === 'string' && last.current_hash.length === HASH_LENGTH) {
        _lastHash = last.current_hash;
      }
    }
  } catch {
    // Genesis OR unreadable file — keep current _lastHash.
  }
}

async function ensureInitForDiskPath(): Promise<void> {
  if (_initOnce !== null) {
    await _initOnce;
    return;
  }
  _initOnce = (async () => {
    await fs.mkdir(_logDir, { recursive: true });
    await hydrateFromDisk();
  })();
  await _initOnce;
}

// ---------------------------------------------------------------------------
// Public API — recordAuditEvent
// ---------------------------------------------------------------------------

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  if (!isWriterEnabled()) return;

  if (!EVENT_TYPES.has(input.event_type)) {
    throw new Error(`[audit-log] Unknown event_type '${String(input.event_type)}'.`);
  }
  if (typeof input.actor !== 'string') {
    throw new Error('[audit-log] actor must be a string.');
  }
  if (input.target !== undefined && typeof input.target !== 'string') {
    throw new Error('[audit-log] target must be a string when provided.');
  }
  const details: Record<string, unknown> = input.details ?? {};

  for (const key of Object.keys(details)) {
    if (SECRET_KEY_REGEX.test(key)) {
      console.warn(
        `[audit-log] Detail key '${key}' looks secret-like; verify caller pre-redacted before recording. Value not logged.`,
      );
      break;
    }
  }

  // Hydrate BEFORE reading _lastHash so the very first call after a process
  // restart links its event to the on-disk chain tail rather than genesis.
  if (shouldWriteToDisk()) {
    await ensureInitForDiskPath();
  }

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const previous_hash = _lastHash;
  const canonical = canonicalEvent({
    id,
    timestamp,
    event_type: input.event_type,
    actor: input.actor,
    target: input.target,
    details,
    previous_hash,
  });

  if (Buffer.byteLength(canonical, 'utf8') > MAX_CANONICAL_BYTES) {
    throw new Error(
      `[audit-log] Canonicalised event exceeds ${MAX_CANONICAL_BYTES}-byte cap; refusing to log. Trim 'details' before retrying.`,
    );
  }

  const current_hash = hashCanonical(canonical);

  const fullEvent: AuditEvent = {
    id,
    timestamp,
    event_type: input.event_type,
    actor: input.actor,
    ...(input.target !== undefined ? { target: input.target } : {}),
    details,
    previous_hash,
    current_hash,
  };

  if (shouldWriteToDisk()) {
    const line = JSON.stringify(fullEvent) + '\n';
    await fs.appendFile(todayFilePath(), line, 'utf8');
  }

  _lastHash = current_hash;
}

// ---------------------------------------------------------------------------
// Public API — verifyAuditChain
// ---------------------------------------------------------------------------

export async function verifyAuditChain(filePath: string): Promise<VerifyResult> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(
      `[audit-log] Cannot read audit file '${filePath}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { valid: true };

  let expectedPrev = GENESIS_HASH;
  for (let i = 0; i < lines.length; i++) {
    let ev: AuditEvent;
    try {
      ev = JSON.parse(lines[i]) as AuditEvent;
    } catch {
      return { valid: false, firstInvalidLine: i, reason: 'parse_error' };
    }
    if (
      typeof ev.id !== 'string' ||
      typeof ev.timestamp !== 'string' ||
      typeof ev.event_type !== 'string' ||
      typeof ev.actor !== 'string' ||
      typeof ev.previous_hash !== 'string' ||
      typeof ev.current_hash !== 'string'
    ) {
      return { valid: false, firstInvalidLine: i, reason: 'shape_invalid' };
    }
    if (ev.previous_hash !== expectedPrev) {
      return { valid: false, firstInvalidLine: i, reason: 'previous_hash_mismatch' };
    }
    const canonical = canonicalEvent({
      id: ev.id,
      timestamp: ev.timestamp,
      event_type: ev.event_type,
      actor: ev.actor,
      target: ev.target,
      details: ev.details ?? {},
      previous_hash: ev.previous_hash,
    });
    if (hashCanonical(canonical) !== ev.current_hash) {
      return { valid: false, firstInvalidLine: i, reason: 'current_hash_mismatch' };
    }
    expectedPrev = ev.current_hash;
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Test-only helpers (not for production consumers)
// ---------------------------------------------------------------------------

export function _resetForTests(): void {
  _lastHash = GENESIS_HASH;
  _initOnce = null;
  _logDir = DEFAULT_LOG_DIR;
}

export function _setLogDirForTests(dir: string): void {
  _logDir = dir;
}

export function _getLastHashForTests(): string {
  return _lastHash;
}

export function _canonicalEventForTests(ev: Omit<AuditEvent, 'current_hash'>): string {
  return canonicalEvent(ev);
}

export const _GENESIS_HASH_FOR_TESTS = GENESIS_HASH;
export const _MAX_CANONICAL_BYTES_FOR_TESTS = MAX_CANONICAL_BYTES;
