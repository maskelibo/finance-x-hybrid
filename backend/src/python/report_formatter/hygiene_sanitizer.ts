/**
 * Hygiene sanitizer (P4.beta.1 + P4.beta.2 additions).
 *
 * Post-render text-only pass that:
 *   1. Removes / replaces banned internal phrases in visible text  [P4.beta.1]
 *   2. Translates English red flag codes / sentence patterns to TR [P4.beta.1]
 *   3. (P4.beta.2) Fills empty/weak sections with deterministic kapsam notu
 *      built from accumulatedContext-derived structured fields. No fabrication.
 *   4. (P4.beta.2) Adds canonical disclaimer for kritik_bulgu narrative ≠
 *      financial_analysis_output.critical_flag_count. Numbers unchanged.
 *   5. (P4.beta.2) Adds limited-data clarifier near Piotroski X/9 patterns
 *      when prior period FA is not loaded. Score unchanged.
 *   6. SCANS (does NOT modify) metric value mismatches → log only
 *   7. SCANS (does NOT modify) weak/empty section heuristics → log only
 *   8. Computes delivery_status = PASS / CONDITIONAL / HOLD
 *      (P4.beta.2: explained_canonical_conflicts surface as advisory note;
 *       PASS is never forced when conflicts remain.)
 *
 * Strict rules:
 *   - operates only on text between tags (>...<)
 *   - never touches <style>, <script>, tag attributes, or class names
 *   - section_filler/metric_clarifier inject only conservative content;
 *     no fabrication when structured fields are missing
 *   - HTML structure preserved; balanced tag invariant
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
// P4.beta.2 — section completeness + metric clarification (additive passes)
import {
  fillEmptySections,
  type SectionFillerInputs,
  type FilledSection,
} from './section_filler.js';
import {
  clarifyKritikBulgu,
  clarifyPiotroski,
} from './metric_clarifier.js';
// P4.beta.3 — active rewrite + narrative sanitizer + macro consistency guard
import {
  resolveCriticalFinding,
  type RedFlagInput,
} from './critical_finding_resolver.js';
import {
  sanitizeNarrative,
  countPostSanitizeRawAgent,
} from './narrative_sanitizer.js';
import {
  guardMacroConsistency,
} from './macro_consistency_guard.js';

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
  // P4.beta.2 additions
  sections_filled: number;
  section_fill_details: FilledSection[];
  kritik_bulgu_disclaimers_inject: number;
  piotroski_clarifiers_inject: number;
  /** Number of metric_conflicts that received an explanatory disclaimer. */
  explained_canonical_conflicts: number;
  // P4.beta.3 additions — active rewrite + narrative sanitizer + macro guard
  critical_finding_active_rewrites: number;
  critical_finding_skip_reason: string | null;
  raw_agent_phrases_removed: number;
  raw_agent_phrases_remaining: number;
  english_residue_remaining: number;
  english_residue_samples: string[];
  raw_flag_token_remaining: number;
  raw_flag_token_samples: string[];
  internal_token_remaining: number;
  macro_contradictions_resolved: number;
  macro_table_narrative_contradiction: number;
  critical_finding_visible_conflict: number;
  // SCAN-ONLY (P4.beta.1)
  metric_conflicts: number;
  metric_conflict_details: MetricConflict[];
  weak_sections: number;
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
  // P4.beta.2 — structured fields for section_filler + metric_clarifier
  // (all optional; missing fields cause clauses to be omitted, never faked)
  period_label?: string | null;
  sector_canonical?: string | null;
  is_holding?: boolean;
  is_banking?: boolean;
  primary_method?: string | null;
  recommendation?: string | null;
  current_price_try?: number | null;
  current_price_as_of?: string | null;
  fa_canonical?: SectionFillerInputs['fa_canonical'];
  fa_critical_flag_count?: number | null;
  fa_prior_period_loaded?: boolean;
  macro?: SectionFillerInputs['macro'];
  technical?: SectionFillerInputs['technical'];
  // P4.beta.3 — full red_flags array for critical_finding_resolver active rewrite
  fa_red_flags?: RedFlagInput[] | null;
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

  // 4) (P4.beta.2) Fill empty/weak sections with structured kapsam notu
  const fillerInputs: SectionFillerInputs = {
    ticker: options.ticker ?? null,
    period_label: options.period_label ?? null,
    sector_canonical: options.sector_canonical ?? null,
    is_holding: options.is_holding,
    is_banking: options.is_banking,
    primary_method: options.primary_method ?? null,
    recommendation: options.recommendation ?? null,
    current_price_try: options.current_price_try ?? null,
    current_price_as_of: options.current_price_as_of ?? null,
    fa_canonical: options.fa_canonical ?? null,
    macro: options.macro ?? null,
    technical: options.technical ?? null,
  };
  const fillResult = fillEmptySections(trResult.html, fillerInputs);

  // 5) (P4.beta.3) Active rewrite of "M kritik..." narrative → safe canonical
  //    wording when fa_red_flags array is safely derivable. MUST run BEFORE
  //    metric_clarifier so that (mandatory addition #1):
  //      - successful active rewrite paragraphs are tracked via anchors
  //      - metric_clarifier disclaimer pass skips those paragraphs to avoid
  //        producing both "1 kritik bulgu ve 3 izleme uyarısı" AND the old
  //        "(Kanonik finansal analiz sonucu: 1 kritik bulgu...)" disclaimer
  const cfResult = resolveCriticalFinding(fillResult.html, options.fa_red_flags ?? null);
  const cfAnchors = new Set(cfResult.result.rewritten_paragraph_anchors);

  // 6) (P4.beta.2) Inject canonical disclaimer near narrative kritik_bulgu
  //    mismatches — but ONLY where critical_finding_resolver did NOT already
  //    rewrite the paragraph. We pass the anchor set as a skip-list.
  const kritikResult = clarifyKritikBulgu(
    cfResult.html,
    typeof options.fa_critical_flag_count === 'number' ? options.fa_critical_flag_count : null,
    cfAnchors,  // P4.beta.3 — skip paragraphs already actively rewritten
  );

  // 7) (P4.beta.2) Inject Piotroski limited-data clarifier
  const piotroskiResult = clarifyPiotroski(
    kritikResult.html,
    Boolean(options.fa_prior_period_loaded),
  );

  // 8) (P4.beta.3) Narrative sanitizer — raw agent monologue removal +
  //    English residue counting + raw flag token counting
  const narResult = sanitizeNarrative(piotroskiResult.html);
  for (const w of narResult.result.warnings) warnings.push(w);

  // 9) (P4.beta.3) Macro consistency guard — table "Raporlanmadı" vs narrative
  //    specific value contradiction → narrative numeric replaced with disclaimer
  const macroResult = guardMacroConsistency(narResult.html);

  // 10) Re-detect remaining banned phrases (post-all-passes)
  const remaining = countRemainingBanned(macroResult.html);

  // 11) Restore protected blocks
  const finalHtml = restoreProtectedBlocks(macroResult.html, protectedSegments);

  // 12) Scan-only: metric consistency + weak sections (post all transformations)
  const metricConflicts = scanMetricConsistency(finalHtml);
  const weakSections = scanWeakSections(finalHtml);

  // 13) (P4.beta.3) Re-count post-pass narrative metrics for HOLD gate
  const rawAgentRemaining = countPostSanitizeRawAgent(finalHtml);
  const internalTokenRemaining = countInternalTokens(finalHtml);
  const criticalFindingVisibleConflict = countCriticalFindingVisibleConflict(
    finalHtml,
    options.fa_red_flags ?? null,
  );

  // 14) Delivery status — P4.beta.3 HOLD gate evaluates raw agent / internal /
  //     residue / critical / macro / raw flag triggers; PASS never forced
  const { status, reasoning } = computeDeliveryStatus({
    bannedRemaining: remaining,
    metricConflicts: metricConflicts.length,
    weakSections: weakSections.length,
    warnings: warnings.length,
    explainedCanonicalConflicts: kritikResult.result.conflicts_explained,
    rawAgentPhrasesRemaining: rawAgentRemaining,
    englishResidueRemaining: narResult.result.english_residue_remaining,
    rawFlagTokenRemaining: narResult.result.raw_flag_token_remaining,
    internalTokenRemaining,
    criticalFindingVisibleConflict,
    macroTableNarrativeContradiction: macroResult.result.contradictions_remaining,
  });

  const report: HygieneReport = {
    ticker: options.ticker ?? null,
    generated_at: new Date().toISOString(),
    banned_phrases_filtered: banResult.totalReplacements,
    banned_phrase_hits: banResult.hits,
    banned_remaining: remaining,
    translations_applied: trResult.totalReplacements,
    translation_hits: trResult.hits,
    sections_filled: fillResult.result.sections_filled,
    section_fill_details: fillResult.result.details,
    kritik_bulgu_disclaimers_inject: kritikResult.result.disclaimers_injected,
    piotroski_clarifiers_inject: piotroskiResult.result.clarifiers_injected,
    explained_canonical_conflicts: kritikResult.result.conflicts_explained,
    // P4.beta.3
    critical_finding_active_rewrites: cfResult.result.active_rewrites,
    critical_finding_skip_reason: cfResult.result.skip_reason,
    raw_agent_phrases_removed: narResult.result.raw_agent_phrases_removed,
    raw_agent_phrases_remaining: rawAgentRemaining,
    english_residue_remaining: narResult.result.english_residue_remaining,
    english_residue_samples: narResult.result.english_residue_samples,
    raw_flag_token_remaining: narResult.result.raw_flag_token_remaining,
    raw_flag_token_samples: narResult.result.raw_flag_token_samples,
    internal_token_remaining: internalTokenRemaining,
    macro_contradictions_resolved: macroResult.result.contradictions_resolved,
    macro_table_narrative_contradiction: macroResult.result.contradictions_remaining,
    critical_finding_visible_conflict: criticalFindingVisibleConflict,
    // SCAN-ONLY
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
// P4.beta.3 — HOLD-gate helper counters
// =============================================================================
//
// These counters scan the FINAL HTML (post-all-passes) for any trigger that
// indicates a P4.beta.3 sanitizer pass was incomplete. They drive the new
// HOLD branches in computeDeliveryStatus.

const INTERNAL_TOKEN_PATTERNS: RegExp[] = [
  /\bengine_snapshot\b/g,
  /\bsector_override\b/g,
  /\bcase_lesson\b/g,
  /\bcase\s+lesson\b/gi,
  /fetch\s+yapılmadı/gi,
  /\.yaml\b/g,
  /\bagent_runs\b/g,
  /önceki\s+adım\s+context/gi,
  /previous\s+step\s+context/gi,
  /FA\.[a-zA-Z_]+/g,
  /contradiction:cf-[a-f0-9]+/gi,
  /\bsynth_score\b/g,
];

function countInternalTokens(html: string): number {
  let total = 0;
  for (const re of INTERNAL_TOKEN_PATTERNS) {
    const m = html.match(re);
    if (m) total += m.length;
  }
  return total;
}

const VISIBLE_KRITIK_RE = /(\d+)\s*kritik\s*(?:kırmızı\s*bayrak|finansal\s*bulgu|bulgu)/gi;

/** Counts narrative "M kritik..." occurrences whose M differs from canonical
 *  critical count (post-rewrite). 0 = HOLD gate clear. */
function countCriticalFindingVisibleConflict(
  html: string,
  redFlags: RedFlagInput[] | null | undefined,
): number {
  if (!Array.isArray(redFlags) || redFlags.length === 0) return 0;
  const N = redFlags.filter((f) => String(f?.severity ?? '').toLowerCase() === 'critical').length;
  let conflicts = 0;
  VISIBLE_KRITIK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = VISIBLE_KRITIK_RE.exec(html)) !== null) {
    const M = Number(m[1]);
    if (Number.isFinite(M) && M !== N) conflicts++;
  }
  return conflicts;
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
  // Placeholder uses leading/trailing underscores + lowercase so downstream
  // detectors (narrative_sanitizer raw flag token regex; banned_phrases
  // raw flag warn-only) cannot mistake it for a real UPPER_SNAKE_CASE flag.
  let scaffold = html.replace(PROTECTED_TAG_RE, (match) => {
    const placeholder = `__hygiene_protected_${idx}__`;
    segments.push({ placeholder, original: match });
    idx++;
    return placeholder;
  });
  scaffold = scaffold.replace(HTML_COMMENT_RE, (match) => {
    const placeholder = `__hygiene_protected_${idx}__`;
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
// Walks <h1>/<h2> headings and measures the visible character count of each
// section. Flags sections below threshold or with placeholder density.
//
// P4.beta.4 Wave 1 refinements (scanner heuristic only — no content fabrication):
//   - H1 rollup: H1 sections are structural dividers whose real content lives
//     in child H2 sub-sections. Measure H1 content from end-of-H1 to the NEXT
//     H1 (or end-of-html), ignoring intermediate H2 boundaries. H2 sections
//     retain the original "next-heading-of-any-level" boundary.
//   - Table-aware threshold: a leaf H2 whose body is primarily a populated
//     <table> (≥4 rows with ≥2 non-placeholder cells each) is valid boardroom
//     content and is not flagged as too_short / placeholder_dense based on
//     prose length alone.

const HEADING_RE = /<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi;
const PLACEHOLDER_RE = /(?:—|n\/a|N\/A|Belirsiz|Raporlanmadı|Bilinmiyor|—)/g;
const TABLE_ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const TABLE_CELL_RE = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
// A cell is a pure placeholder when its only visible text is a dash/em-dash
// run or one of the standard "Raporlanmadı / Bilinmiyor / N/A / Belirsiz"
// markers. Such cells do NOT count toward the populated-row threshold.
const PLACEHOLDER_ONLY_RE = /^(?:[\s—–\-]+|n\/a|N\/A|Belirsiz|Raporlanmadı|Bilinmiyor)$/i;

function countPopulatedTableRows(slice: string): number {
  let count = 0;
  for (const rowMatch of slice.matchAll(TABLE_ROW_RE)) {
    const rowHtml = rowMatch[1];
    let nonEmptyCells = 0;
    for (const cellMatch of rowHtml.matchAll(TABLE_CELL_RE)) {
      const cellText = stripTags(cellMatch[1]).trim();
      if (cellText.length > 0 && !PLACEHOLDER_ONLY_RE.test(cellText)) {
        nonEmptyCells++;
      }
    }
    // A row is populated when it has at least 2 cells with real content
    // (typical pattern: label cell + value cell, both meaningful).
    if (nonEmptyCells >= 2) count++;
  }
  return count;
}

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
    const sliceStart = h.endIndex;

    // H1 rollup: scan forward for the NEXT H1 (not next heading of any level).
    // For H2, fall back to original behaviour (next heading regardless of level).
    let sliceEnd = html.length;
    if (h.level === 1) {
      for (let j = i + 1; j < headings.length; j++) {
        if (headings[j].level === 1) { sliceEnd = headings[j].index; break; }
      }
    } else {
      const next = headings[i + 1];
      if (next) sliceEnd = next.index;
    }

    const slice = html.slice(sliceStart, sliceEnd);
    const visible = stripTags(slice).trim();
    const charCount = visible.length;
    const placeholderHits = (visible.match(PLACEHOLDER_RE) ?? []).length;
    const placeholderDensity = visible.length > 0 ? placeholderHits / Math.max(1, visible.split(/\s+/).length) : 0;

    // Table-aware: only relevant for leaf H2 sections (an H1's slice may span
    // multiple tables across child H2s but the H1 already gets prose totals
    // from rollup). For an H2 whose body has ≥4 populated rows, accept it.
    const tableDense = h.level === 2 && countPopulatedTableRows(slice) >= 4;

    if (charCount === 0) {
      out.push({ heading: h.title, reason: 'no_content', char_count: 0 });
    } else if (charCount < WEAK_SECTION_MIN_CHARS && !tableDense) {
      out.push({ heading: h.title, reason: 'too_short', char_count: charCount });
    } else if (placeholderDensity > 0.25 && !tableDense) {
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
  /** P4.beta.2 — count of metric_conflicts that already received a canonical disclaimer. */
  explainedCanonicalConflicts: number;
  // P4.beta.3 HOLD-gate triggers
  rawAgentPhrasesRemaining: number;
  englishResidueRemaining: number;
  rawFlagTokenRemaining: number;
  internalTokenRemaining: number;
  criticalFindingVisibleConflict: number;
  macroTableNarrativeContradiction: number;
}

/** P4.beta.3 — HOLD-gate thresholds (exact). */
const HOLD_GATE = {
  raw_agent_phrases_remaining: 0,
  english_residue_remaining: 5,
  internal_token_remaining: 0,
  critical_finding_visible_conflict: 0,
  macro_table_narrative_contradiction: 0,
  raw_flag_token_remaining: 0,
} as const;

function computeDeliveryStatus(s: StatusInputs): { status: DeliveryStatus; reasoning: string } {
  // P4.beta.1 baseline check
  if (s.bannedRemaining > 0) {
    return {
      status: 'HOLD',
      reasoning: `${s.bannedRemaining} yasaklı ifade sanitize sonrası görünür metinde kaldı`,
    };
  }

  // P4.beta.3 HOLD triggers — strict
  if (s.rawAgentPhrasesRemaining > HOLD_GATE.raw_agent_phrases_remaining) {
    return { status: 'HOLD', reasoning: `${s.rawAgentPhrasesRemaining} ham agent monolog cümlesi temizlenemedi` };
  }
  if (s.internalTokenRemaining > HOLD_GATE.internal_token_remaining) {
    return { status: 'HOLD', reasoning: `${s.internalTokenRemaining} iç sistem ifadesi (engine_snapshot, sector_override, vb.) görünür metinde kaldı` };
  }
  if (s.rawFlagTokenRemaining > HOLD_GATE.raw_flag_token_remaining) {
    return { status: 'HOLD', reasoning: `${s.rawFlagTokenRemaining} ham bayrak kodu (UPPER_SNAKE_CASE) Türkçeleştirilemedi` };
  }
  if (s.criticalFindingVisibleConflict > HOLD_GATE.critical_finding_visible_conflict) {
    return { status: 'HOLD', reasoning: `${s.criticalFindingVisibleConflict} kritik bulgu sayısı çelişkisi raporda hâlâ görünür` };
  }
  if (s.macroTableNarrativeContradiction > HOLD_GATE.macro_table_narrative_contradiction) {
    return { status: 'HOLD', reasoning: `${s.macroTableNarrativeContradiction} makro tablo / narrative tutarsızlığı çözülemedi` };
  }
  if (s.englishResidueRemaining > HOLD_GATE.english_residue_remaining) {
    return { status: 'HOLD', reasoning: `${s.englishResidueRemaining} İngilizce kalıntı (eşik ${HOLD_GATE.english_residue_remaining}) aşıldı` };
  }

  // P4.beta.2 baseline (CONDITIONAL)
  if (s.metricConflicts > 0) {
    const explained = Math.min(s.explainedCanonicalConflicts, s.metricConflicts);
    const explainedSuffix = explained > 0 ? `; bunların ${explained} tanesi kanonik disclaimer ile açıklanmıştır` : '';
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.metricConflicts} metric tutarsızlığı tespit edildi (advisory; otomatik düzeltme yok)${explainedSuffix}`,
    };
  }
  if (s.weakSections > 0) {
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.weakSections} bölümde içerik yetersiz veya placeholder yoğun (advisory)`,
    };
  }
  if (s.englishResidueRemaining > 0) {
    return {
      status: 'CONDITIONAL',
      reasoning: `${s.englishResidueRemaining} İngilizce kalıntı eşik içinde (warning)`,
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
      `sections_filled=${report.sections_filled} ` +
      `kritik_disclaimers=${report.kritik_bulgu_disclaimers_inject} ` +
      `piotroski_clarifiers=${report.piotroski_clarifiers_inject} ` +
      `cf_active_rewrites=${report.critical_finding_active_rewrites} ` +
      `raw_agent_removed=${report.raw_agent_phrases_removed} ` +
      `raw_agent_remaining=${report.raw_agent_phrases_remaining} ` +
      `english_residue=${report.english_residue_remaining} ` +
      `raw_flag_remaining=${report.raw_flag_token_remaining} ` +
      `internal_token_remaining=${report.internal_token_remaining} ` +
      `cf_visible_conflict=${report.critical_finding_visible_conflict} ` +
      `macro_resolved=${report.macro_contradictions_resolved} ` +
      `macro_remaining=${report.macro_table_narrative_contradiction} ` +
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
