/**
 * Canonical Fact Store — R7 hold item closed.
 *
 * Every upsert passes through unit-normalizer; numeric facts persist in canonical unit
 * (TRY_mn / decimal / days / x). Prevents fake contradictions from unit mismatches.
 *
 * P1A Wave 1 (additive, non-breaking):
 *   - upsertFact accepts an optional `confidence_inputs` parameter. When
 *     supplied, the confidence is computed via fact-layer/confidence.ts and
 *     persisted into a nullable `confidence_json` column.
 *   - When `confidence_inputs` is absent, the old behaviour is preserved
 *     exactly (no confidence computed, no JSON written).
 *   - getFact / listFacts surface the parsed confidence object when present;
 *     legacy rows without confidence_json keep `confidence: null`.
 */
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { normalizeFactValue, type RawUnit } from './unit-normalizer.js';
import {
  computeFactConfidence,
  type FactConfidence,
  type FactConfidenceInputs,
} from './confidence.js';

export type FactSource = {
  type: 'agent' | 'computed' | 'user' | 'document';
  agent_id?: string;
  doc_id?: string;
  extracted_at: string;
  freshness_days: number;
  note?: string;
};

export type FactValue = number | string | null;

export type CanonicalFact = {
  id: string;
  session_id: string;
  fact_key: string;
  value: FactValue;
  unit: string;
  raw_unit?: string | null;
  sources: FactSource[];
  created_at: string;
  updated_at: string;
  /** P1A Wave 1 — present only when caller supplied confidence_inputs. */
  confidence?: FactConfidence | null;
};

export type UpsertFactInput = {
  session_id: string;
  fact_key: string;
  value: FactValue;
  unit: RawUnit | string;
  sources?: FactSource[];
  /**
   * P1A Wave 1 — optional. When provided, confidence is computed
   * deterministically and persisted alongside the fact. Existing call sites
   * that omit this field continue to work exactly as before.
   *
   * The `sources` list inside confidence_inputs is auto-populated from the
   * upsert input (post-merge) when the caller does not supply one — so most
   * callers only need to pass conflict / complexity / agreement signals.
   */
  confidence_inputs?: Omit<FactConfidenceInputs, 'sources'> & {
    sources?: FactConfidenceInputs['sources'];
  };
};

export function upsertFact(input: UpsertFactInput): CanonicalFact {
  const existing = getFact(input.session_id, input.fact_key);

  // Normalize numeric facts BEFORE persisting
  let canonicalValue: FactValue = input.value;
  let canonicalUnit: string = input.unit;
  let conversionNote: string | undefined;
  if (typeof input.value === 'number' && input.unit) {
    try {
      const normalized = normalizeFactValue(input.fact_key, input.value, input.unit as RawUnit);
      canonicalValue = normalized.value;
      canonicalUnit = normalized.unit;
      conversionNote = normalized.conversion;
    } catch (err) {
      console.warn(`[fact-layer] Normalize failed for ${input.fact_key} (${input.unit}): ${err instanceof Error ? err.message : err}`);
    }
  }

  const baseSources: FactSource[] = input.sources ?? [];
  const sources: FactSource[] = conversionNote
    ? [...baseSources, { type: 'computed', extracted_at: new Date().toISOString(), freshness_days: 0, note: `unit_converted: ${conversionNote}` }]
    : baseSources;

  const now = new Date().toISOString();

  if (existing) {
    const mergedSources = mergeSources(existing.sources, sources);
    // P1A Wave 1 — confidence is recomputed against the merged source list
    // when callers opt in. Otherwise the existing confidence (if any) is
    // preserved verbatim — no silent recomputation on legacy upserts.
    const confidence = maybeComputeConfidence(input.confidence_inputs, mergedSources)
      ?? existing.confidence
      ?? null;
    const confidenceJson = confidence ? JSON.stringify(confidence) : null;
    db.prepare(`
      UPDATE canonical_facts
      SET value_json = ?, unit = ?, raw_unit = ?, sources_json = ?, confidence_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(canonicalValue),
      canonicalUnit,
      input.unit,
      JSON.stringify(mergedSources),
      confidenceJson,
      now,
      existing.id,
    );
    return {
      ...existing,
      value: canonicalValue,
      unit: canonicalUnit,
      raw_unit: input.unit,
      sources: mergedSources,
      confidence,
      updated_at: now,
    };
  }

  const id = `fact-${nanoid(10)}`;
  // P1A Wave 1 — only compute confidence on insert when caller opts in.
  const confidence = maybeComputeConfidence(input.confidence_inputs, sources) ?? null;
  const confidenceJson = confidence ? JSON.stringify(confidence) : null;
  db.prepare(`
    INSERT INTO canonical_facts (id, session_id, fact_key, value_json, unit, raw_unit, sources_json, confidence_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.session_id,
    input.fact_key,
    JSON.stringify(canonicalValue),
    canonicalUnit,
    input.unit,
    JSON.stringify(sources),
    confidenceJson,
    now,
    now,
  );
  return {
    id,
    session_id: input.session_id,
    fact_key: input.fact_key,
    value: canonicalValue,
    unit: canonicalUnit,
    raw_unit: input.unit,
    sources,
    confidence,
    created_at: now,
    updated_at: now,
  };
}

/**
 * P1A Wave 1 — compute confidence iff caller supplied confidence_inputs.
 * The `sources` field inside confidence_inputs falls back to the persisted
 * source list so the caller does not have to re-pass it.
 */
function maybeComputeConfidence(
  inputs: UpsertFactInput['confidence_inputs'],
  persistedSources: FactSource[],
): FactConfidence | null {
  if (!inputs) return null;
  const sources = inputs.sources ?? persistedSources;
  return computeFactConfidence({
    sources,
    has_conflict: inputs.has_conflict,
    conflict_severity: inputs.conflict_severity,
    computation_complexity: inputs.computation_complexity,
    cross_agent_agreement_count: inputs.cross_agent_agreement_count,
  });
}

export function getFact(sessionId: string, factKey: string): CanonicalFact | null {
  const row = db.prepare(`
    SELECT id, session_id, fact_key, value_json, unit, raw_unit, sources_json, confidence_json, created_at, updated_at
    FROM canonical_facts WHERE session_id = ? AND fact_key = ?
  `).get(sessionId, factKey) as {
    id: string; session_id: string; fact_key: string; value_json: string; unit: string;
    raw_unit: string | null; sources_json: string; confidence_json: string | null;
    created_at: string; updated_at: string;
  } | undefined;
  if (!row) return null;
  return rowToFact(row);
}

export function listFacts(sessionId: string): CanonicalFact[] {
  const rows = db.prepare(`
    SELECT id, session_id, fact_key, value_json, unit, raw_unit, sources_json, confidence_json, created_at, updated_at
    FROM canonical_facts WHERE session_id = ? ORDER BY fact_key ASC
  `).all(sessionId) as Array<{
    id: string; session_id: string; fact_key: string; value_json: string; unit: string;
    raw_unit: string | null; sources_json: string; confidence_json: string | null;
    created_at: string; updated_at: string;
  }>;
  return rows.map(rowToFact);
}

function rowToFact(row: {
  id: string; session_id: string; fact_key: string; value_json: string; unit: string;
  raw_unit: string | null; sources_json: string; confidence_json: string | null;
  created_at: string; updated_at: string;
}): CanonicalFact {
  // confidence_json is nullable: legacy rows or callers that did not opt in
  // produce `confidence: null`. Malformed JSON is treated as null so a single
  // bad row never breaks listing.
  let confidence: FactConfidence | null = null;
  if (row.confidence_json) {
    try { confidence = JSON.parse(row.confidence_json) as FactConfidence; }
    catch { confidence = null; }
  }
  return {
    id: row.id,
    session_id: row.session_id,
    fact_key: row.fact_key,
    value: JSON.parse(row.value_json),
    unit: row.unit,
    raw_unit: row.raw_unit,
    sources: JSON.parse(row.sources_json),
    confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mergeSources(existing: FactSource[], incoming: FactSource[]): FactSource[] {
  // Dedup by (type + agent_id/doc_id) — keep latest extraction
  const seen = new Map<string, FactSource>();
  for (const s of existing) {
    seen.set(`${s.type}|${s.agent_id || ''}|${s.doc_id || ''}|${s.note || ''}`, s);
  }
  for (const s of incoming) {
    seen.set(`${s.type}|${s.agent_id || ''}|${s.doc_id || ''}|${s.note || ''}`, s);
  }
  return [...seen.values()].sort((a, b) => b.extracted_at.localeCompare(a.extracted_at));
}
