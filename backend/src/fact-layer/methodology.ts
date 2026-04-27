/**
 * Versioned Methodology Registry (Block P — Plan P1C Wave 1).
 *
 * Single authoritative source for every methodological constant in force
 * (confidence scoring weights, extraction rule shape, unit normalisation,
 * lineage taxonomy, pack-v2 thresholds). The yaml file IS the metadata
 * source-of-truth; the TS code IS the implementation. Wave 1 is OBSERVE
 * ONLY — yaml does not drive runtime behaviour. verifyMethodologyConsistency
 * surfaces drift between the two.
 *
 * Strict invariants:
 *   - loadMethodology caches the parsed yaml (read once, then in-memory)
 *   - recordSessionMethodology is idempotent (INSERT OR IGNORE)
 *   - getSessionMethodology returns null for unknown sessions
 *   - tryRecordSessionMethodology never throws — best-effort wrapper for
 *     extractor / future orchestrator hooks
 *   - returned snapshots are deep copies (callers may mutate without
 *     polluting the module-level cache)
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { db } from '../db.js';
import { PROJECT_ROOT } from '../config.js';

// =============================================================================
// Types
// =============================================================================

export interface MethodologyComponent {
  version: string;
  source_file?: string;
  /** Free-form per-component fields. */
  [key: string]: unknown;
}

export interface MethodologyRegistry {
  version: string;
  effective_date: string;
  description?: string;
  components: Record<string, MethodologyComponent>;
}

export interface SessionMethodologyRow {
  session_id: string;
  methodology_version: string;
  methodology_snapshot: MethodologyRegistry;
  recorded_at: string;
}

// =============================================================================
// Yaml load + cache
// =============================================================================

const METHODOLOGY_PATH = path.join(PROJECT_ROOT, 'config', 'methodology.yml');
let cached: MethodologyRegistry | null = null;

/** Load + parse + cache the yaml registry. Force re-load via reset(). */
export function loadMethodology(): MethodologyRegistry {
  if (cached !== null) return deepCopy(cached);
  const raw = fs.readFileSync(METHODOLOGY_PATH, 'utf-8');
  const parsed = yaml.parse(raw) as MethodologyRegistry;
  if (!parsed || typeof parsed.version !== 'string' || typeof parsed.components !== 'object') {
    throw new Error(`methodology.yml malformed: missing version or components`);
  }
  cached = parsed;
  return deepCopy(cached);
}

/** Test-only cache reset; safe to call from production but pointless. */
export function resetMethodologyCache(): void {
  cached = null;
}

export function getMethodologyVersion(): string {
  return loadMethodology().version;
}

export function getMethodologyComponent(componentKey: string): MethodologyComponent | null {
  const reg = loadMethodology();
  const c = reg.components[componentKey];
  return c ? deepCopy(c) : null;
}

// =============================================================================
// Per-session snapshot
// =============================================================================

/**
 * Persist the active methodology snapshot for a session. Idempotent: a
 * second call for the same session_id is a no-op (the first snapshot wins).
 * Throws on FK / IO error. For best-effort fire-and-forget paths use
 * tryRecordSessionMethodology.
 */
export function recordSessionMethodology(sessionId: string): void {
  const registry = loadMethodology();
  const recordedAt = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO session_methodology
      (session_id, methodology_version, methodology_snapshot, recorded_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, registry.version, JSON.stringify(registry), recordedAt);
}

/** Best-effort wrapper. Never throws; logs on failure. */
export function tryRecordSessionMethodology(sessionId: string | undefined): void {
  if (!sessionId) return;
  try {
    recordSessionMethodology(sessionId);
  } catch (err) {
    console.warn(`[methodology] record_failed session=${sessionId}: ${(err as Error).message}`);
  }
}

export function getSessionMethodology(sessionId: string): SessionMethodologyRow | null {
  const row = db.prepare(`
    SELECT session_id, methodology_version, methodology_snapshot, recorded_at
    FROM session_methodology WHERE session_id = ?
  `).get(sessionId) as { session_id: string; methodology_version: string; methodology_snapshot: string; recorded_at: string } | undefined;
  if (!row) return null;
  let parsed: MethodologyRegistry;
  try {
    parsed = JSON.parse(row.methodology_snapshot) as MethodologyRegistry;
  } catch {
    return null;
  }
  return {
    session_id: row.session_id,
    methodology_version: row.methodology_version,
    methodology_snapshot: parsed,
    recorded_at: row.recorded_at,
  };
}

// =============================================================================
// Verification — observe-only drift detection
// =============================================================================
//
// Hand-curated manifest of the TS-side hard-coded constants. When a PR
// changes a TS constant without bumping methodology.yml, this manifest goes
// out of sync with the yaml — verifyMethodologyConsistency surfaces the
// mismatch. The function is observe-only in Wave 1 (no test or build fail);
// callers may decide to escalate.

export interface ConsistencyReport {
  ok: boolean;
  /** Human-readable mismatch descriptions, empty when ok=true. */
  mismatches: string[];
}

interface ExpectedConstants {
  confidence_scoring: {
    source_quality_table: Record<string, number>;
    freshness_bands_days: [number, number];
    conflict_penalties: { minor: number; material: number; critical: number };
    complexity_penalty_factor: number;
    agreement_bonus_factor: number;
    agreement_bonus_cap: number;
    source_count_bonus_factor: number;
    source_count_bonus_cap: number;
    tier_thresholds: { CERTAIN: number; HIGH: number; MEDIUM: number; LOW: number };
  };
  extraction_rules: {
    supported_agents: string[];
    rule_count_per_agent: Record<string, number>;
    near_equal_tolerance: { relative: number; absolute: number };
  };
  fact_pack_v2: {
    confidence_thresholds: { low_confidence: number; speculative: number };
  };
}

/** TS-side mirror of the yaml-tracked constants. Hand-maintained. */
const EXPECTED_CONSTANTS: ExpectedConstants = {
  confidence_scoring: {
    source_quality_table: {
      direct_disclosure: 1.0,
      computed: 0.9,
      management_quote: 0.85,
      analyst_estimate: 0.6,
      peer_proxy: 0.5,
      inferred: 0.35,
    },
    freshness_bands_days: [30, 90],
    conflict_penalties: { minor: 0.05, material: 0.20, critical: 0.40 },
    complexity_penalty_factor: 0.05,
    agreement_bonus_factor: 0.03,
    agreement_bonus_cap: 0.10,
    source_count_bonus_factor: 0.05,
    source_count_bonus_cap: 0.15,
    tier_thresholds: { CERTAIN: 0.9, HIGH: 0.75, MEDIUM: 0.55, LOW: 0.30 },
  },
  extraction_rules: {
    supported_agents: ['parse_standardization', 'financial_analysis', 'macro_analysis', 'technical_analysis'],
    rule_count_per_agent: {
      parse_standardization: 9,
      financial_analysis: 14,
      macro_analysis: 8,
      technical_analysis: 2,
    },
    near_equal_tolerance: { relative: 0.01, absolute: 0.000001 },
  },
  fact_pack_v2: {
    confidence_thresholds: { low_confidence: 0.55, speculative: 0.30 },
  },
};

export function verifyMethodologyConsistency(): ConsistencyReport {
  const reg = loadMethodology();
  const mismatches: string[] = [];

  // confidence_scoring
  const cs = reg.components.confidence_scoring;
  if (!cs) {
    mismatches.push('components.confidence_scoring missing');
  } else {
    compareTable(cs.source_quality_table, EXPECTED_CONSTANTS.confidence_scoring.source_quality_table, 'confidence_scoring.source_quality_table', mismatches);
    compareArray(cs.freshness_bands_days as number[], EXPECTED_CONSTANTS.confidence_scoring.freshness_bands_days, 'confidence_scoring.freshness_bands_days', mismatches);
    compareTable(cs.conflict_penalties, EXPECTED_CONSTANTS.confidence_scoring.conflict_penalties, 'confidence_scoring.conflict_penalties', mismatches);
    compareScalar(cs.complexity_penalty_factor, EXPECTED_CONSTANTS.confidence_scoring.complexity_penalty_factor, 'confidence_scoring.complexity_penalty_factor', mismatches);
    compareScalar(cs.agreement_bonus_factor, EXPECTED_CONSTANTS.confidence_scoring.agreement_bonus_factor, 'confidence_scoring.agreement_bonus_factor', mismatches);
    compareScalar(cs.agreement_bonus_cap, EXPECTED_CONSTANTS.confidence_scoring.agreement_bonus_cap, 'confidence_scoring.agreement_bonus_cap', mismatches);
    compareScalar(cs.source_count_bonus_factor, EXPECTED_CONSTANTS.confidence_scoring.source_count_bonus_factor, 'confidence_scoring.source_count_bonus_factor', mismatches);
    compareScalar(cs.source_count_bonus_cap, EXPECTED_CONSTANTS.confidence_scoring.source_count_bonus_cap, 'confidence_scoring.source_count_bonus_cap', mismatches);
    compareTable(cs.tier_thresholds, EXPECTED_CONSTANTS.confidence_scoring.tier_thresholds, 'confidence_scoring.tier_thresholds', mismatches);
  }

  // extraction_rules
  const er = reg.components.extraction_rules;
  if (!er) {
    mismatches.push('components.extraction_rules missing');
  } else {
    compareArray(er.supported_agents as string[], EXPECTED_CONSTANTS.extraction_rules.supported_agents, 'extraction_rules.supported_agents', mismatches);
    compareTable(er.rule_count_per_agent, EXPECTED_CONSTANTS.extraction_rules.rule_count_per_agent, 'extraction_rules.rule_count_per_agent', mismatches);
    compareTable(er.near_equal_tolerance, EXPECTED_CONSTANTS.extraction_rules.near_equal_tolerance, 'extraction_rules.near_equal_tolerance', mismatches);
  }

  // fact_pack_v2
  const fp = reg.components.fact_pack_v2;
  if (!fp) {
    mismatches.push('components.fact_pack_v2 missing');
  } else {
    compareTable(fp.confidence_thresholds, EXPECTED_CONSTANTS.fact_pack_v2.confidence_thresholds, 'fact_pack_v2.confidence_thresholds', mismatches);
  }

  return { ok: mismatches.length === 0, mismatches };
}

// =============================================================================
// Internal helpers
// =============================================================================

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function compareScalar(yaml: unknown, ts: number, label: string, out: string[]): void {
  if (typeof yaml !== 'number' || Math.abs(yaml - ts) > 1e-9) {
    out.push(`${label}: yaml=${yaml} ts=${ts}`);
  }
}

function compareArray(yaml: unknown[], ts: ReadonlyArray<unknown>, label: string, out: string[]): void {
  if (!Array.isArray(yaml) || yaml.length !== ts.length) {
    out.push(`${label}: yaml=${JSON.stringify(yaml)} ts=${JSON.stringify(ts)}`);
    return;
  }
  for (let i = 0; i < ts.length; i++) {
    if (yaml[i] !== ts[i]) {
      out.push(`${label}[${i}]: yaml=${yaml[i]} ts=${ts[i]}`);
    }
  }
}

function compareTable(yaml: unknown, ts: Record<string, number>, label: string, out: string[]): void {
  if (!yaml || typeof yaml !== 'object') {
    out.push(`${label}: yaml is not an object`);
    return;
  }
  const yamlObj = yaml as Record<string, unknown>;
  for (const [k, v] of Object.entries(ts)) {
    if (typeof yamlObj[k] !== 'number' || Math.abs((yamlObj[k] as number) - v) > 1e-9) {
      out.push(`${label}.${k}: yaml=${yamlObj[k]} ts=${v}`);
    }
  }
  // Also flag yaml-only keys
  for (const k of Object.keys(yamlObj)) {
    if (!(k in ts)) out.push(`${label}.${k}: yaml-only (no ts mirror)`);
  }
}
