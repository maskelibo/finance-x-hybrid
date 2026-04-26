/**
 * Financial Truth Layer — filing selector.
 *
 * Picks the authoritative consolidated financial report from a list of KAP
 * filings. Critically rejects "Özel Durum Açıklaması" (material disclosure
 * placeholder) filings that contain zero financial data — the trap the FA
 * Python engine fell into for KCHOL session `nr6E5CG_TUadpQ7ypfg--`
 * (selected FY-2026 placeholder, missed FY-2025 KAP-1555903 actual report).
 *
 * Scoring factors:
 *   1. Document type priority (consolidated annual > interim > placeholder)
 *   2. Period freshness (newer beats older within same priority)
 *   3. Auditor opinion (audit reports preferred over management-only)
 *   4. Page count threshold (placeholders are typically <5 pages)
 *   5. Payload size threshold (zero-data filings have empty payload)
 *
 * Filter: never select a filing with score=0 (placeholder territory).
 */

import type { FilingRecord, FilingSelection } from './types.js';

/** Higher = more authoritative document type. */
export const FILING_TYPE_PRIORITY: Record<string, number> = {
  // Consolidated annual reports — gold standard
  'konsolide_finansal_rapor': 100,
  'konsolide_yillik_rapor': 100,
  'consolidated_annual_report': 100,
  'audited_annual_financials': 100,

  // Activity / annual narrative reports — strong but typically supplementary
  'faaliyet_raporu': 80,
  'annual_activity_report': 80,

  // Interim financials
  'konsolide_ara_donem_finansal': 60,
  'interim_financials': 60,
  'q1_finansal': 55,
  'q2_finansal': 60,  // mid-year often has more depth
  'q3_finansal': 55,

  // Summary / press release
  'ozet_finansal': 35,
  'press_release': 30,

  // Board decisions
  'yk_karari': 25,
  'board_decision': 25,

  // Material disclosures — placeholder, often zero financial data
  'ozel_durum_aciklamasi': 5,
  'material_disclosure': 5,

  // Unknown / generic
  'other': 10,
};

const PLACEHOLDER_PAGE_COUNT_THRESHOLD = 5;
const PLACEHOLDER_PAYLOAD_BYTES_THRESHOLD = 1024;

function scoreFiling(filing: FilingRecord): { score: number; rejection?: string } {
  const docType = (filing.document_type || '').toLowerCase();
  let baseScore = FILING_TYPE_PRIORITY[docType] ?? FILING_TYPE_PRIORITY['other'];

  // Hard reject: known placeholder type with placeholder body characteristics
  if (docType.includes('ozel_durum') || docType.includes('material_disclosure')) {
    if (
      (filing.page_count != null && filing.page_count <= PLACEHOLDER_PAGE_COUNT_THRESHOLD) ||
      (filing.payload_size_bytes != null && filing.payload_size_bytes <= PLACEHOLDER_PAYLOAD_BYTES_THRESHOLD)
    ) {
      return { score: 0, rejection: `placeholder filing (type=${docType}, pages=${filing.page_count ?? '?'}, bytes=${filing.payload_size_bytes ?? '?'})` };
    }
    // Material disclosure with substantive content — partial credit but still low
    return { score: baseScore };
  }

  // Auditor opinion bonus
  if (filing.has_auditor_opinion) baseScore += 15;

  // Recency bonus — sort within same priority by filing_date
  // (We give a small bonus rather than driving it strictly by date so
  // a 1-day older annual report still beats today's interim.)
  if (filing.filing_date) {
    const ts = new Date(filing.filing_date).getTime();
    if (Number.isFinite(ts)) {
      const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      if (ageDays < 90) baseScore += 5;
      else if (ageDays < 365) baseScore += 2;
      else if (ageDays > 730) baseScore -= 5;
    }
  }

  // Page count sanity — substantive reports are >20 pages typically
  if (filing.page_count != null && filing.page_count < 5 && !docType.includes('press_release')) {
    return { score: 0, rejection: `too short (${filing.page_count} pages — likely placeholder)` };
  }

  return { score: baseScore };
}

export function selectAuthoritativeFiling(
  ticker: string,
  filings: FilingRecord[],
): FilingSelection {
  const t = (ticker || '').toUpperCase().trim();
  const scored = filings.map((f) => {
    const { score, rejection } = scoreFiling(f);
    return { filing: f, score, rejection };
  });

  // Reject candidates with score=0 outright
  const rejected = scored
    .filter((s) => s.score === 0 || s.rejection)
    .map((s) => ({ filing: s.filing, reason: s.rejection || 'score=0', score: s.score }));

  const candidates = scored.filter((s) => s.score > 0 && !s.rejection);

  if (candidates.length === 0) {
    return {
      ticker: t,
      selected: null,
      selected_score: null,
      rejected,
      confidence: 0,
      reasoning: `no authoritative filing — all ${filings.length} candidates rejected (placeholders or too short)`,
    };
  }

  // Pick highest score; tie-break by filing_date desc
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aDate = a.filing.filing_date ? new Date(a.filing.filing_date).getTime() : 0;
    const bDate = b.filing.filing_date ? new Date(b.filing.filing_date).getTime() : 0;
    return bDate - aDate;
  });

  const top = candidates[0];
  const runnerUp = candidates[1];

  // Confidence: large margin = high; close call = medium
  let confidence = 1.0;
  if (runnerUp) {
    const margin = top.score - runnerUp.score;
    if (margin <= 5) confidence = 0.7;
    else if (margin <= 15) confidence = 0.85;
  }

  const reasoning = `Selected ${top.filing.filing_id} (type=${top.filing.document_type}, score=${top.score})` +
    (runnerUp ? ` over ${candidates.length - 1} alternative${candidates.length - 1 === 1 ? '' : 's'} (next score=${runnerUp.score})` : '') +
    (rejected.length > 0 ? `; rejected ${rejected.length} placeholder/insufficient` : '');

  return {
    ticker: t,
    selected: top.filing,
    selected_score: top.score,
    rejected,
    confidence,
    reasoning,
  };
}
