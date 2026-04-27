/**
 * Hygiene sanitizer (P4.beta.1).
 *
 * Post-render text-only pass that:
 *   1. Removes / replaces banned internal phrases in visible text
 *   2. Translates English red flag codes / sentence patterns to TR
 *   3. SCANS (does NOT modify) metric value mismatches → log only
 *   4. SCANS (does NOT modify) weak/empty section heuristics → log only
 *   5. Computes delivery_status = PASS / CONDITIONAL / HOLD
 *
 * Strict rules:
 *   - operates only on text between tags (>...<)
 *   - never touches <style>, <script>, tag attributes, or class names
 *   - if a pattern's safety is uncertain, leaves text alone + logs warning
 *   - does NOT modify HTML structure; section silme YOK
 *   - does NOT correct metric values; auto-fix YOK
 */

import {
  BANNED_PHRASES,
  compileBannedPattern,
  type BannedCategory,
  type BannedPhrase,
} from './banned_phrases.js';
import {
  RED_FLAG_TR,
  SENTENCE_PATTERNS,
} from './translation_dict.js';

// =============================================================================
// Output shape
// =============================================================================

export type DeliveryStatus = 'PASS' | 'CONDITIONAL' | 'HOLD';

export interface BannedHit {
  phrase: string;
  category: BannedCategory;
  count: number;
}

export interface TranslationHit {
  source: string;
  target: string;
  count: number;
}

export interface MetricConflict {
  metric: string;
  values: string[];        // distinct value strings observed
  occurrence_count: number;
}

export interface WeakSection {
  heading: string;
  reason: 'too_short' | 'placeholder_dense' | 'no_content';
  char_count: number;
}

export interface HygieneReport {
  ticker: string | null;
  generated_at: string;
  banned_phrases_filtered: number;       // total replacements made
  banned_phrase_hits: BannedHit[];        // grouped by phrase
  banned_remaining: number;               // matches still present after sanitize
  translations_applied: number;
  translation_hits: TranslationHit[];
  metric_conflicts: number;               // SCAN-ONLY count
  metric_conflict_details: MetricConflict[];
  weak_sections: number;                  // SCAN-ONLY count
  weak_section_details: WeakSection[];
  warnings: string[];
  delivery_status: DeliveryStatus;
  delivery_reasoning: string;
  bytes_in: number;
  bytes_out: number;
}

export const HYGIENE_CONTEXT_KEYS = {
  REPORT: 'hygiene_report',
  REPORT_JSON: 'hygiene_report_json',
} as const;

const WEAK_SECTION_MIN_CHARS = 200;

// =============================================================================
// Top-level entry: sanitize an HTML string
// =============================================================================

export interface SanitizeOptions {
  ticker?: string | null;
}

export function sanitizeBoardroomReport(
  html: string,
  options: SanitizeOptions = {},
): { html: string; report: HygieneReport } {
  const bytesIn = html.length;
  const warnings: string[] = [];

  // 1) Split out style/script blocks; sanitize only the rest
  const { protected: protectedSegments, scaffold } = extractProtectedBlocks(html);

  // 2) Apply banned phrase pass on visible text segments
  const banResult = applyBannedPhrases(scaffold, warnings);

  // 3) Apply translation pass (red flags + sentence patterns)
  const trResult = applyTranslations(banResult.html, warnings);

  // 4) Re-detect remaining banned phrases (post-sanitize)
  const remaining = countRemainingBanned(trResult.html);

  // 5) Restore protected blocks
  const finalHtml = restoreProtectedBlocks(trResult.html, protectedSegments);

  // 6) Scan-only: metric consistency + weak sections
  const metricConflicts = scanMetricConsistency(finalHtml);
  const weakSections = scanWeakSections(finalHtml);

  // 7) Delivery status
  const { status, reasoning } = computeDeliveryStatus({
    bannedRemaining: remaining,
    metricConflicts: metricConflicts.length,
    weakSections: weakSections.length,
    warnings: warnings.length,
  });

  const report: HygieneReport = {
    ticker: options.ticker ?? null,
    generated_at: new Date().toISOString(),
    banned_phrases_filtered: banResult.totalReplacements,
    banned_phrase_hits: banResult.hits,
    banned_remaining: remaining,
    translations_applied: trResult.totalReplacements,
    translation_hits: trResult.hits,
    metric_conflicts: metricConflicts.length,
    metric_conflict_details: metricConflicts,
    weak_sections: weakSections.length,
    weak_section_details: weakSections,
    warnings,
    delivery_status: status,
    delivery_reasoning: reasoning,
    bytes_in: bytesIn,
    bytes_out: finalHtml.length,
  };

  return { html: finalHtml, report };
}

// =============================================================================
// 1. Protect <style>, <script>, and HTML comments from text-only passes
// =============================================================================

const PROTECTED_TAG_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

interface ProtectedSegment {
  placeholder: string;
  original: string;
}

function extractProtectedBlocks(html: string): {
  protected: ProtectedSegment[];
  scaffold: string;
} {
  const segments: ProtectedSegment[] = [];
  let idx = 0;
  let scaffold = html.replace(PROTECTED_TAG_RE, (match) => {
    const placeholder = `HYGIENE_PROTECTED_${idx}`;
    segments.push({ placeholder, original: match });
    idx++;
    return placeholder;
  });
  scaffold = scaffold.replace(HTML_COMMENT_RE, (match) => {
    const placeholder = `HYGIENE_PROTECTED_${idx}`;
    segments.push({ placeholder, original: match });
    idx++;
    return placeholder;
  });
  return { protected: segments, scaffold };
}

function restoreProtectedBlocks(html: string, segments: ProtectedSegment[]): string {
  let out = html;
  for (const seg of segments) {
    out = out.replace(seg.placeholder, seg.original);
  }
  return out;
}

// =============================================================================
// 2. Operate only on text between tags
// =============================================================================
//
// Strategy: a regex captures text NODES between '>' and '<' (or start/end of
// string). We pass each text node through a transform function. This is safer
// than naive global replace because it avoids matching tag/attribute content.

const TEXT_NODE_RE = /(>)([^<]+)(?=<)|(^)([^<]+)(?=<)/g;

function transformTextNodes(
  html: string,
  fn: (text: string) => string,
): string {
  return html.replace(TEXT_NODE_RE, (_match, p1: string | undefined, p2: string | undefined, p3: string | undefined, p4: string | undefined) => {
    const lead = p1 ?? p3 ?? '';
    const text = p2 ?? p4 ?? '';
    return lead + fn(text);
  });
}

// =============================================================================
// 3. Banned phrase pass
// =============================================================================

function applyBannedPhrases(
  html: string,
  warnings: string[],
): { html: string; totalReplacements: number; hits: BannedHit[] } {
  const hits = new Map<string, BannedHit>();
  let totalReplacements = 0;

  let out = html;
  for (const b of BANNED_PHRASES) {
    if (b.replacement === null) {
      // warn-only; count occurrences in text nodes
      let occ = 0;
      const re = compileBannedPattern(b);
      transformTextNodes(out, (text) => {
        const m = text.match(re);
        if (m) occ += m.length;
        return text;
      });
      if (occ > 0) {
        warnings.push(`banned_warn_only:${b.pattern}:${occ}`);
        bumpHit(hits, b.pattern, b.category, occ);
      }
      continue;
    }
    const re = compileBannedPattern(b);
    let localCount = 0;
    out = transformTextNodes(out, (text) => {
      return text.replace(re, () => {
        localCount++;
        return b.replacement!;
      });
    });
    if (localCount > 0) {
      totalReplacements += localCount;
      bumpHit(hits, b.pattern, b.category, localCount);
    }
  }

  return {
    html: out,
    totalReplacements,
    hits: Array.from(hits.values()).sort((a, b) => b.count - a.count),
  };
}

function bumpHit(map: Map<string, BannedHit>, phrase: string, category: BannedCategory, count: number): void {
  const existing = map.get(phrase);
  if (existing) {
    existing.count += count;
  } else {
    map.set(phrase, { phrase, category, count });
  }
}

// =============================================================================
// 4. Re-detect remaining banned phrases (post-sanitize sanity)
// =============================================================================

function countRemainingBanned(html: string): number {
  // Re-protect style/script first to be safe
  const { scaffold } = extractProtectedBlocks(html);
  let remaining = 0;
  for (const b of BANNED_PHRASES) {
    if (b.replacement === null) continue; // warn-only items don't count as "remaining"
    const re = compileBannedPattern(b);
    transformTextNodes(scaffold, (text) => {
      const m = text.match(re);
      if (m) remaining += m.length;
      return text;
    });
  }
  return remaining;
}

// =============================================================================
// 5. Translation pass
// =============================================================================

function applyTranslations(
  html: string,
  warnings: string[],
): { html: string; totalReplacements: number; hits: TranslationHit[] } {
  const hits = new Map<string, TranslationHit>();
  let total = 0;
  let out = html;

  // 5a. Red flag code → Turkish
  for (const [code, target] of Object.entries(RED_FLAG_TR)) {
    const re = new RegExp(`\\b${code}\\b`, 'g'); // case-sensitive; codes are ALL_CAPS
    let count = 0;
    out = transformTextNodes(out, (text) =>
      text.replace(re, () => {
        count++;
        return target;
      }),
    );
    if (count > 0) {
      total += count;
      bumpTranslationHit(hits, code, target, count);
    }
  }

  // 5b. Sentence pattern rewrites
  for (const sp of SENTENCE_PATTERNS) {
    const re = new RegExp(sp.pattern, sp.flags ?? 'gi');
    let count = 0;
    out = transformTextNodes(out, (text) =>
      text.replace(re, (...args) => {
        count++;
        // Support $1, $2 backrefs in replacement
        return sp.replacement.replace(/\$(\d+)/g, (_m, idx) => {
          const n = Number(idx);
          return typeof args[n] === 'string' ? (args[n] as string) : '';
        });
      }),
    );
    if (count > 0) {
      total += count;
      bumpTranslationHit(hits, sp.pattern.slice(0, 60), sp.replacement.slice(0, 60), count);
    }
  }

  return {
    html: out,
    totalReplacements: total,
    hits: Array.from(hits.values()).sort((a, b) => b.count - a.count),
  };
}

function bumpTranslationHit(map: Map<string, TranslationHit>, source: string, target: string, count: number): void {
  const key = `${source}→${target}`;
  const existing = map.get(key);
  if (existing) existing.count += count;
  else map.set(key, { source, target, count });
}

// =============================================================================
// 6. Metric consistency SCAN (no modification)
// =============================================================================
//
// Detects when the SAME metric appears with DIFFERENT values inside the same
// report. Conservative: only flags when the metric label is unambiguous
// AND multiple distinct numeric strings are observed nearby.

interface MetricMention {
  metric: string;
  value: string;
}

const METRIC_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: 'guncel_fiyat', re: /(?:güncel\s*fiyat|kapanış|referans\s*fiyat)[^<\d]*?(\d{1,4}(?:[.,]\d+)?)\s*(?:TL|₺)/gi },
  { key: 'hedef_fiyat', re: /(?:hedef\s*fiyat|baz\s*senaryo|fair\s*value)[^<\d]*?(\d{1,4}(?:[.,]\d+)?)\s*(?:TL|₺)/gi },
  { key: 'piotroski', re: /Piotroski[^<\d]*?(\d)\/(?:9)/gi },
  { key: 'kritik_bulgu', re: /(\d)\s*(?:kritik\s*bulgu|critical\s*flag)/gi },
];

function scanMetricConsistency(html: string): MetricConflict[] {
  // Only inspect visible text — re-use protected extraction
  const { scaffold } = extractProtectedBlocks(html);
  const visibleText = collectVisibleText(scaffold);

  const conflicts: MetricConflict[] = [];
  for (const { key, re } of METRIC_PATTERNS) {
    const values = new Set<string>();
    let count = 0;
    for (const m of visibleText.matchAll(re)) {
      values.add(m[1]);
      count++;
    }
    if (values.size >= 2) {
      conflicts.push({
        metric: key,
        values: Array.from(values),
        occurrence_count: count,
      });
    }
  }
  return conflicts;
}

function collectVisibleText(html: string): string {
  let collected = '';
  transformTextNodes(html, (text) => {
    collected += text + ' ';
    return text;
  });
  return collected;
}

// =============================================================================
// 7. Weak section SCAN (no modification)
// =============================================================================
//
// Walks <h1>/<h2> headings and measures the visible character count until the
// next heading. Flags sections below threshold or with placeholder density.

const HEADING_RE = /<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi;
const PLACEHOLDER_RE = /(?:—|n\/a|N\/A|Belirsiz|Raporlanmadı|Bilinmiyor|—)/g;

function scanWeakSections(html: string): WeakSection[] {
  const out: WeakSection[] = [];
  const headings: Array<{ level: number; title: string; index: number; endIndex: number }> = [];
  for (const m of html.matchAll(HEADING_RE)) {
    const level = Number(m[1]);
    const titleHtml = m[2];
    const title = stripTags(titleHtml).trim();
    if (!title) continue;
    headings.push({
      level,
      title,
      index: m.index ?? 0,
      endIndex: (m.index ?? 0) + m[0].length,
    });
  }
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const next = headings[i + 1];
    const sliceStart = h.endIndex;
    const sliceEnd = next ? next.index : html.length;
    const slice = html.slice(sliceStart, sliceEnd);
    const visible = stripTags(slice).trim();
    const charCount = visible.length;
    const placeholderHits = (visible.match(PLACEHOLDER_RE) ?? []).length;
    const placeholderDensity = visible.length > 0 ? placeholderHits / Math.max(1, visible.split(/\s+/).length) : 0;

    if (charCount === 0) {
      out.push({ heading: h.title, reason: 'no_content', char_count: 0 });
    } else if (charCount < WEAK_SECTION_MIN_CHARS) {
      out.push({ heading: h.title, reason: 'too_short', char_count: charCount });
    } else if (placeholderDensity > 0.25) {
      out.push({ heading: h.title, reason: 'placeholder_dense', char_count: charCount });
    }
  }
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
}

// =============================================================================
// 8. Delivery status
// =============================================================================

interface StatusInputs {
  bannedRemaining: number;
  metricConflicts: number;
  weakSections: number;
  warnings: number;
}

function computeDeliveryStatus(s: StatusInputs): { status: DeliveryStatus; reasoning: string } {
  if (s.bannedRemaining > 0) {
    return {
      status: 'HOLD',
      reasoning: `${s.bannedRemaining} yasaklı ifade sanitize sonrası görünür metinde kaldı`,
    };
  }
  // metric conflicts → CONDITIONAL (HOLD'a çıkmıyor çünkü auto-fix yapmadık)
  if (s.metricConflicts > 0) {
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.metricConflicts} metric tutarsızlığı tespit edildi (advisory; otomatik düzeltme yok)`,
    };
  }
  if (s.weakSections > 0) {
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.weakSections} bölümde içerik yetersiz veya placeholder yoğun (advisory)`,
    };
  }
  if (s.warnings > 0) {
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.warnings} hygiene uyarısı (warn-only)`,
    };
  }
  return { status: 'PASS', reasoning: 'tüm hygiene kontrolleri temiz' };
}

// =============================================================================
// 9. Log helper for orchestrator
// =============================================================================

export function logHygieneSummary(report: HygieneReport): void {
  console.log(
    `[hygiene-sanitizer] ticker=${report.ticker ?? '?'} ` +
      `banned_filtered=${report.banned_phrases_filtered} ` +
      `banned_remaining=${report.banned_remaining} ` +
      `translations=${report.translations_applied} ` +
      `metric_conflicts=${report.metric_conflicts} ` +
      `weak_sections=${report.weak_sections} ` +
      `warnings=${report.warnings.length} ` +
      `bytes=${report.bytes_in}→${report.bytes_out} ` +
      `delivery=${report.delivery_status}`,
  );
  if (report.delivery_status !== 'PASS') {
    console.log(`[hygiene-sanitizer]   reason: ${report.delivery_reasoning}`);
  }
  if (report.metric_conflict_details.length > 0) {
    for (const c of report.metric_conflict_details) {
      console.log(`[hygiene-sanitizer]   metric_conflict: ${c.metric} values=[${c.values.join(', ')}] (${c.occurrence_count} mentions)`);
    }
  }
  if (report.weak_section_details.length > 0) {
    for (const w of report.weak_section_details) {
      console.log(`[hygiene-sanitizer]   weak_section: "${w.heading}" reason=${w.reason} chars=${w.char_count}`);
    }
  }
}
