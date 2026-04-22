/**
 * Canonical Fact Pack — single authoritative source of truth per session.
 * All agents read/write the same numbers; contradictions resolved centrally.
 */
import { db } from './db.js';

export type FactPackEvidence = {
  source: string;
  doc_id?: string;
  confidence?: number;
};

export type FactPackDispute = {
  metric: string;
  values: unknown[];
  resolution: string;
};

export type FactPack = {
  session_id: string;
  ticker: string;
  sector_canonical: string | null;
  fiscal_periods: string[];
  key_metrics: Record<string, number | null>;
  evidence: Record<string, FactPackEvidence>;
  data_quality_flags: string[];
  disputed_values: FactPackDispute[];
  created_at: string;
  updated_at: string;
};

export function initFactPack(sessionId: string, ticker: string, sector: string | null): FactPack {
  const pack: FactPack = {
    session_id: sessionId,
    ticker: ticker.toUpperCase(),
    sector_canonical: sector,
    fiscal_periods: [],
    key_metrics: {},
    evidence: {},
    data_quality_flags: [],
    disputed_values: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  persistFactPack(pack);
  return pack;
}

export function updateFactPack(sessionId: string, updates: Partial<FactPack>): FactPack {
  const current = getFactPack(sessionId);
  if (!current) throw new Error(`FactPack not found for session ${sessionId}`);

  const updated: FactPack = {
    ...current,
    ...updates,
    key_metrics: { ...current.key_metrics, ...(updates.key_metrics || {}) },
    evidence: { ...current.evidence, ...(updates.evidence || {}) },
    updated_at: new Date().toISOString(),
  };
  persistFactPack(updated);
  return updated;
}

export function getFactPack(sessionId: string): FactPack | null {
  const row = db.prepare(`SELECT pack_json FROM fact_packs WHERE session_id = ?`).get(sessionId) as { pack_json: string } | undefined;
  return row ? (JSON.parse(row.pack_json) as FactPack) : null;
}

function persistFactPack(pack: FactPack): void {
  db.prepare(`
    INSERT OR REPLACE INTO fact_packs (session_id, pack_json, updated_at)
    VALUES (?, ?, ?)
  `).run(pack.session_id, JSON.stringify(pack), pack.updated_at);
}
