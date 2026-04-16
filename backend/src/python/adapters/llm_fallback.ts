/**
 * Shared fallbacks for Python adapters that need to read structured
 * data from upstream outputs. LLM agents emit markdown/prose; Python
 * agents emit JSON. When a flag-set is mixed (e.g. valuation Python
 * on, financial_analysis still LLM), the Python adapter's JSON
 * parse fails and the caller loses critical fields like `sector`.
 *
 * This module provides two escape hatches:
 *
 *   1. guessSectorFromTicker() — BIST ticker → sector heuristic,
 *      used when no upstream structure is parseable. Same set as
 *      runPythonCoo's preflight ticker map so behaviour is
 *      consistent across the pipeline.
 *
 *   2. extractSectorFromMarkdown() — regex scan over LLM output_text
 *      for explicit sector mentions (bank, holding, çelik, rafineri,
 *      vs.). Only used after JSON parse fails.
 *
 * Callers should treat fallbacks as LOW confidence — they emit a
 * warning downstream so the LLM layer knows to verify.
 */

export type DetectedSector =
  | 'industrial' | 'banking' | 'holding' | 'insurance' | 'reit';


const KNOWN_BANKING = new Set([
  'AKBNK', 'ISCTR', 'GARAN', 'YKBNK', 'HALKB', 'VAKBN',
  'TSKB', 'ALBRK', 'KLNMA', 'ICBCT',
]);
const KNOWN_HOLDING = new Set([
  'KCHOL', 'SAHOL', 'DOHOL', 'TKFEN', 'SISE', 'EGYO',
  'GSDHO', 'GOZDE', 'ENKAI', 'YAZIC', 'ECZYT',
]);
const KNOWN_REIT = new Set([
  'EKGYO', 'HLGYO', 'ISGYO', 'TRGYO', 'SNGYO', 'DGGYO',
]);
const KNOWN_INSURANCE = new Set([
  'AKGRT', 'ANSGR', 'RAYSG', 'AVIVA', 'ANHYT',
]);


/** Ticker-based sector fallback. Unknown tickers default to 'industrial'. */
export function guessSectorFromTicker(ticker: string): DetectedSector {
  const t = ticker.toUpperCase();
  if (KNOWN_BANKING.has(t))   return 'banking';
  if (KNOWN_HOLDING.has(t))   return 'holding';
  if (KNOWN_REIT.has(t))      return 'reit';
  if (KNOWN_INSURANCE.has(t)) return 'insurance';
  return 'industrial';
}


/** Scan LLM markdown output for explicit sector cues.
 *  Returns null when no unambiguous cue found; caller should then
 *  fall back to guessSectorFromTicker. */
export function extractSectorFromMarkdown(text: string): DetectedSector | null {
  const t = text.toLowerCase();

  // Banking cues (most specific first — "bankacılık" / "BDDK" /
  // "NIM" / "CET1" are much stronger signals than the generic word
  // "bank" which could be e.g. "bank account receivable").
  if (/\bbddk\b|\bnım\b|\bnim\b|\bcet1\b|\btier\s*1\b/i.test(text)) return 'banking';

  // Holding cues
  if (/\bholding\b|\biştirak/i.test(t) && /\bkonsolide|\bsotp\b|\bnav\b/.test(t)) return 'holding';

  // REIT cues
  if (/\bgyo\b|gayrimenkul yatırım ortaklığı/i.test(t)) return 'reit';

  // Insurance cues
  if (/sigorta|reasürans/i.test(t)) return 'insurance';

  return null;
}


/** Unified sector resolver — tries upstream structured `sector` field
 *  first, then markdown cues, then ticker heuristic. */
export function resolveSector(opts: {
  structuredSector?: string | null;
  markdownSource?: string | null;
  ticker: string;
}): { sector: DetectedSector; source: 'structured' | 'markdown' | 'ticker' } {
  const s = (opts.structuredSector ?? '').toLowerCase();
  if (s === 'industrial' || s === 'banking' || s === 'holding' || s === 'insurance' || s === 'reit') {
    return { sector: s as DetectedSector, source: 'structured' };
  }
  if (opts.markdownSource) {
    const md = extractSectorFromMarkdown(opts.markdownSource);
    if (md) return { sector: md, source: 'markdown' };
  }
  return { sector: guessSectorFromTicker(opts.ticker), source: 'ticker' };
}


/** Grab a numeric value from markdown around a labelled key.
 *  Supports "WACC: 0.14", "WACC %14", "WACC 14%", "WACC: **12.5**". */
export function extractNumberNearLabel(text: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Look for the label, optionally with punctuation/markdown/bold,
  // then a number (possibly decimal, possibly percentage).
  const re = new RegExp(
    `${escaped}[\\s:*]*\\**[^\\d-]{0,10}?(-?\\d+(?:[.,]\\d+)?)\\s*%?`,
    'i',
  );
  const m = text.match(re);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
