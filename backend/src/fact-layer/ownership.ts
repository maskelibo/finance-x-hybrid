/**
 * Fact Ownership Lookup (Block P — Plan P1D Wave 1).
 *
 * Prefix-based primary owner registry. Wave 1 ships the lookup helper as
 * a pure function — enforcement (rejecting non-owner writes inside
 * upsertFact) is deferred to a later wave so store.ts stays untouched.
 *
 * Strict invariants:
 *   - pure functions; first-prefix-wins on rule matching
 *   - safe defaults: unknown fact_key → action='arbitration_required'
 *     (action 'reject' is reserved for future enforcement waves)
 *   - rules cached on first load; resetOwnershipCache() for tests
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PROJECT_ROOT } from '../config.js';

// =============================================================================
// Types
// =============================================================================

export interface OwnershipRule {
  prefix: string;
  owner: string;
  exception_owners: string[];
}

export interface OwnershipCheck {
  fact_key: string;
  writer_agent: string;
  primary_owner: string;
  is_primary: boolean;
  is_exception: boolean;
  /**
   * Wave 1 emits 'accept' / 'arbitration_required' only. 'reject' is
   * reserved for the future enforcement wave; current callers should
   * treat it as an audit signal, not a blocker.
   */
  action: 'accept' | 'arbitration_required' | 'reject';
}

// =============================================================================
// Yaml load + cache
// =============================================================================

const OWNERSHIP_PATH = path.join(PROJECT_ROOT, 'config', 'fact-ownership.yml');
let cachedRules: OwnershipRule[] | null = null;

export function loadOwnershipRules(): OwnershipRule[] {
  if (cachedRules !== null) return cachedRules.slice();
  const raw = fs.readFileSync(OWNERSHIP_PATH, 'utf-8');
  const parsed = yaml.parse(raw) as { ownership_rules?: OwnershipRule[] };
  const rules = Array.isArray(parsed?.ownership_rules) ? parsed.ownership_rules : [];
  // Validate shape and freeze
  cachedRules = rules
    .filter((r): r is OwnershipRule =>
      r != null && typeof r.prefix === 'string' && typeof r.owner === 'string')
    .map((r) => ({
      prefix: r.prefix,
      owner: r.owner,
      exception_owners: Array.isArray(r.exception_owners) ? r.exception_owners.slice() : [],
    }));
  return cachedRules.slice();
}

export function resetOwnershipCache(): void {
  cachedRules = null;
}

// =============================================================================
// Lookup
// =============================================================================

export function findOwnershipRule(factKey: string): OwnershipRule | null {
  const rules = loadOwnershipRules();
  // Strip period suffix (`_fy2025`, `_q1_2026`, etc.) for prefix matching
  // since the registry is metric-name-based.
  const stripped = factKey.replace(/_(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i, '');
  for (const r of rules) {
    if (stripped === r.prefix || stripped.startsWith(`${r.prefix}_`)) return r;
  }
  return null;
}

export function checkOwnership(factKey: string, writerAgent: string): OwnershipCheck {
  const rule = findOwnershipRule(factKey);
  if (!rule) {
    return {
      fact_key: factKey,
      writer_agent: writerAgent,
      primary_owner: 'unowned',
      is_primary: false,
      is_exception: false,
      action: 'arbitration_required',
    };
  }
  const isPrimary = rule.owner === writerAgent;
  const isException = rule.exception_owners.includes(writerAgent);
  return {
    fact_key: factKey,
    writer_agent: writerAgent,
    primary_owner: rule.owner,
    is_primary: isPrimary,
    is_exception: isException,
    action: isPrimary
      ? 'accept'
      : isException
        ? 'arbitration_required'
        : 'reject',
  };
}
