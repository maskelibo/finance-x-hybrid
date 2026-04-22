/**
 * Canonical Fact Store — R7 hold item closed.
 *
 * Every upsert passes through unit-normalizer; numeric facts persist in canonical unit
 * (TRY_mn / decimal / days / x). Prevents fake contradictions from unit mismatches.
 */
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { normalizeFactValue, type RawUnit } from './unit-normalizer.js';

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
};

export type UpsertFactInput = {
  session_id: string;
  fact_key: string;
  value: FactValue;
  unit: RawUnit | string;
  sources?: FactSource[];
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
    db.prepare(`
      UPDATE canonical_facts
      SET value_json = ?, unit = ?, raw_unit = ?, sources_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(canonicalValue),
      canonicalUnit,
      input.unit,
      JSON.stringify(mergedSources),
      now,
      existing.id,
    );
    return { ...existing, value: canonicalValue, unit: canonicalUnit, raw_unit: input.unit, sources: mergedSources, updated_at: now };
  }

  const id = `fact-${nanoid(10)}`;
  db.prepare(`
    INSERT INTO canonical_facts (id, session_id, fact_key, value_json, unit, raw_unit, sources_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.session_id,
    input.fact_key,
    JSON.stringify(canonicalValue),
    canonicalUnit,
    input.unit,
    JSON.stringify(sources),
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
    created_at: now,
    updated_at: now,
  };
}

export function getFact(sessionId: string, factKey: string): CanonicalFact | null {
  const row = db.prepare(`
    SELECT id, session_id, fact_key, value_json, unit, raw_unit, sources_json, created_at, updated_at
    FROM canonical_facts WHERE session_id = ? AND fact_key = ?
  `).get(sessionId, factKey) as {
    id: string; session_id: string; fact_key: string; value_json: string; unit: string;
    raw_unit: string | null; sources_json: string; created_at: string; updated_at: string;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    session_id: row.session_id,
    fact_key: row.fact_key,
    value: JSON.parse(row.value_json),
    unit: row.unit,
    raw_unit: row.raw_unit,
    sources: JSON.parse(row.sources_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listFacts(sessionId: string): CanonicalFact[] {
  const rows = db.prepare(`
    SELECT id, session_id, fact_key, value_json, unit, raw_unit, sources_json, created_at, updated_at
    FROM canonical_facts WHERE session_id = ? ORDER BY fact_key ASC
  `).all(sessionId) as Array<{
    id: string; session_id: string; fact_key: string; value_json: string; unit: string;
    raw_unit: string | null; sources_json: string; created_at: string; updated_at: string;
  }>;
  return rows.map(row => ({
    id: row.id,
    session_id: row.session_id,
    fact_key: row.fact_key,
    value: JSON.parse(row.value_json),
    unit: row.unit,
    raw_unit: row.raw_unit,
    sources: JSON.parse(row.sources_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
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
