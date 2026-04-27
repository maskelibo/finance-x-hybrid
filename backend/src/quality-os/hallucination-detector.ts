/**
 * Hallucination Detector (Block P — Plan P2D Wave 1).
 *
 * Scans free-text narrative for numeric claims and flags those that are
 * NOT backed by any persisted canonical_fact in the session (within a
 * configurable tolerance). Wave 1 is detection-only: returns a list of
 * unbacked claims so downstream consumers (P2E quality budget, future
 * report annotator) can decide what to do.
 *
 * Strict invariants:
 *   - non-destructive: never modifies the input text or persisted facts
 *   - deterministic: same inputs → same output
 *   - conservative: only large-magnitude numeric claims are checked. Small
 *     decimals (rates, ratios) get a tighter tolerance band.
 *   - Wave 1 does NOT attempt LLM-side semantic claim extraction. Pure
 *     regex-based numeric scan with currency / percent / multiplier
 *     awareness.
 */

import { listFacts } from '../fact-layer/store.js';

// =============================================================================
// Types
// =============================================================================

export type ClaimUnit = 'currency' | 'percent' | 'multiplier' | 'unitless';

export interface NumericClaim {
  value: number;
  unit: ClaimUnit;
  /** Index of the match in the source text. */
  start_index: number;
  /** Approximate context window (≤120 chars) around the claim. */
  context: string;
}

export interface UnbackedClaim extends NumericClaim {
  closest_fact_key?: string;
  closest_fact_value?: number;
  closest_fact_relative_delta?: number;
}

export interface HallucinationReport {
  session_id: string;
  total_claims_scanned: number;
  backed_claims: number;
  unbacked_claims: number;
  details: UnbackedClaim[];
}

// =============================================================================
// Numeric extraction
// =============================================================================
//
// Recognised numeric forms (Turkish + English boardroom prose):
//   - "%41,1"            → percent, 41.1
//   - "%50.7"            → percent, 50.7
//   - "5,1898x" / "5.19x"→ multiplier, 5.19
//   - "2.757.295 TL"     → currency, 2757295 (TR thousand separators)
//   - "44,93 TL"         → currency, 44.93
//   - "1.000 TRY"        → currency, 1000
//   - "996438"           → unitless integer
//
// Numbers under MIN_CLAIM_MAGNITUDE are skipped (too noisy: years, page
// numbers, list indices). Default 100.

const MIN_CLAIM_MAGNITUDE = 100;
const CONTEXT_RADIUS = 60;

interface NumericMatch {
  raw: string;
  value: number;
  unit: ClaimUnit;
  start_index: number;
}

const PERCENT_RE = /[%]\s*(-?\d{1,3}(?:[.,]\d+)?)/g;
const MULTIPLIER_RE = /(-?\d{1,4}(?:[.,]\d+)?)\s*x\b/gi;
const CURRENCY_RE = /(-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)\s*(?:TL|TRY|EUR|USD|₺|\$|€)/g;
const PLAIN_RE = /\b(-?\d{4,}(?:[.,]\d+)?)\b/g;

function parseTrNumber(s: string): number {
  const trimmed = s.replace(/\s+/g, '');
  if (!trimmed) return NaN;
  const hasDot = trimmed.includes('.');
  const hasComma = trimmed.includes(',');

  if (hasDot && hasComma) {
    // Both separators present — last one wins as decimal (TR & EN conventions).
    const lastDot = trimmed.lastIndexOf('.');
    const lastComma = trimmed.lastIndexOf(',');
    const decIdx = Math.max(lastDot, lastComma);
    const intPart = trimmed.slice(0, decIdx).replace(/[.,]/g, '');
    const decPart = trimmed.slice(decIdx + 1);
    const v = Number(`${intPart}.${decPart}`);
    return Number.isFinite(v) ? v : NaN;
  }
  if (hasComma) {
    // Comma is decimal (TR convention)
    const v = Number(trimmed.replace(',', '.'));
    return Number.isFinite(v) ? v : NaN;
  }
  if (hasDot) {
    // Ambiguous — could be thousand separator or international decimal.
    // Treat as thousand separator only when EVERY non-leading group is
    // exactly 3 digits (e.g., "2.757.295"). Otherwise treat as decimal.
    const parts = trimmed.split('.');
    if (parts.length >= 2 && parts.slice(1).every((p) => p.length === 3)) {
      const v = Number(parts.join(''));
      return Number.isFinite(v) ? v : NaN;
    }
    const v = Number(trimmed);
    return Number.isFinite(v) ? v : NaN;
  }
  const v = Number(trimmed);
  return Number.isFinite(v) ? v : NaN;
}

export function extractNumericClaims(text: string): NumericClaim[] {
  if (typeof text !== 'string' || !text) return [];
  const out: NumericMatch[] = [];

  PERCENT_RE.lastIndex = 0;
  for (let m: RegExpExecArray | null; (m = PERCENT_RE.exec(text)) !== null;) {
    const v = parseTrNumber(m[1]);
    if (Number.isFinite(v)) out.push({ raw: m[0], value: v, unit: 'percent', start_index: m.index });
  }

  MULTIPLIER_RE.lastIndex = 0;
  for (let m: RegExpExecArray | null; (m = MULTIPLIER_RE.exec(text)) !== null;) {
    const v = parseTrNumber(m[1]);
    if (Number.isFinite(v)) out.push({ raw: m[0], value: v, unit: 'multiplier', start_index: m.index });
  }

  CURRENCY_RE.lastIndex = 0;
  for (let m: RegExpExecArray | null; (m = CURRENCY_RE.exec(text)) !== null;) {
    const v = parseTrNumber(m[1]);
    if (Number.isFinite(v) && Math.abs(v) >= MIN_CLAIM_MAGNITUDE) {
      out.push({ raw: m[0], value: v, unit: 'currency', start_index: m.index });
    }
  }

  // Plain integers ≥ 4 digits — but skip if the same span already matched
  // a richer regex (currency / percent) above.
  const claimedSpans = new Set<number>();
  for (const c of out) {
    for (let i = c.start_index; i < c.start_index + c.raw.length; i++) claimedSpans.add(i);
  }
  PLAIN_RE.lastIndex = 0;
  for (let m: RegExpExecArray | null; (m = PLAIN_RE.exec(text)) !== null;) {
    if (claimedSpans.has(m.index)) continue;
    const v = parseTrNumber(m[1]);
    if (Number.isFinite(v) && Math.abs(v) >= MIN_CLAIM_MAGNITUDE) {
      out.push({ raw: m[1], value: v, unit: 'unitless', start_index: m.index });
    }
  }

  // Sort by position
  out.sort((a, b) => a.start_index - b.start_index);

  return out.map<NumericClaim>((m) => ({
    value: m.value,
    unit: m.unit,
    start_index: m.start_index,
    context: contextSnippet(text, m.start_index, m.raw.length),
  }));
}

function contextSnippet(text: string, idx: number, len: number): string {
  const lo = Math.max(0, idx - CONTEXT_RADIUS);
  const hi = Math.min(text.length, idx + len + CONTEXT_RADIUS);
  return text.slice(lo, hi).replace(/\s+/g, ' ').trim();
}

// =============================================================================
// Backing check
// =============================================================================

interface FactSnapshot { fact_key: string; numeric_value: number; }

function loadNumericFacts(sessionId: string): FactSnapshot[] {
  const out: FactSnapshot[] = [];
  for (const f of listFacts(sessionId)) {
    if (typeof f.value === 'number' && Number.isFinite(f.value)) {
      out.push({ fact_key: f.fact_key, numeric_value: f.value });
    } else if (typeof f.value === 'string') {
      const v = Number(f.value.replace(/[, ]/g, ''));
      if (Number.isFinite(v)) out.push({ fact_key: f.fact_key, numeric_value: v });
    }
  }
  return out;
}

const TOLERANCE_BY_UNIT: Record<ClaimUnit, number> = {
  currency: 0.05,    // 5% — boardroom prose often rounds to nearest mn
  percent: 0.10,     // 10% — narratives may round percentages
  multiplier: 0.05,
  unitless: 0.05,
};

function relDelta(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b));
  return denom === 0 ? 0 : Math.abs(a - b) / denom;
}

/**
 * For a numeric claim, find the closest persisted fact value (within
 * tolerance). Currency claims are also compared to the fact value scaled
 * by 1e6 (because store persists TRY_mn but narrative often quotes raw TL).
 */
function findClosestBacking(
  claim: NumericClaim,
  facts: ReadonlyArray<FactSnapshot>,
): { fact_key: string; fact_value: number; relative_delta: number } | null {
  const tol = TOLERANCE_BY_UNIT[claim.unit];
  let best: { fact_key: string; fact_value: number; relative_delta: number } | null = null;

  for (const f of facts) {
    const candidates: number[] = [f.numeric_value];
    if (claim.unit === 'currency') {
      // Try the persisted value × 1e6 (TRY_mn → TRY raw)
      candidates.push(f.numeric_value * 1_000_000);
    }
    if (claim.unit === 'percent') {
      // Try the persisted decimal × 100 (decimal → percent)
      candidates.push(f.numeric_value * 100);
    }
    for (const cv of candidates) {
      const d = relDelta(claim.value, cv);
      if (d <= tol && (!best || d < best.relative_delta)) {
        best = { fact_key: f.fact_key, fact_value: cv, relative_delta: d };
      }
    }
  }
  return best;
}

export function detectHallucinations(
  sessionId: string,
  text: string,
): HallucinationReport {
  const claims = extractNumericClaims(text);
  const facts = loadNumericFacts(sessionId);
  const unbacked: UnbackedClaim[] = [];
  let backed = 0;

  for (const c of claims) {
    const match = findClosestBacking(c, facts);
    if (match) {
      backed++;
      continue;
    }
    unbacked.push({ ...c });
  }

  return {
    session_id: sessionId,
    total_claims_scanned: claims.length,
    backed_claims: backed,
    unbacked_claims: unbacked.length,
    details: unbacked,
  };
}
