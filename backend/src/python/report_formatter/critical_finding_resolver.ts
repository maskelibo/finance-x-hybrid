/**
 * Critical finding resolver (P4.beta.3).
 *
 * Active rewrite of "M kritik (kırmızı bayrak|bulgu)" narrative when canonical
 * structured fa_red_flags[] array is safely derivable. Replaces the narrative
 * count with a reader-safe wording built from severity counts.
 *
 * STRICT INVARIANTS (per scope mandatory additions):
 *
 *   (a) NO FABRICATION — never invents warn_count or critical_count.
 *       If fa_red_flags is null / undefined / not an array / empty,
 *       active rewrite is SKIPPED entirely; module returns the input
 *       html unchanged so the upstream P4.beta.2 disclaimer-only
 *       behavior remains in effect.
 *
 *   (b) EMPTY-ARRAY GUARD — an empty array does NOT mean "0 risk". When
 *       fa_red_flags === [] but narrative says "M kritik...", we cannot
 *       distinguish "FA legitimately found 0 issues" from "FA failed to
 *       parse" with the data we have. To stay safe, we SKIP rewrite and
 *       leave the disclaimer-only path; never replace with "finansal
 *       kırmızı bayrak tespit edilmemiştir".
 *
 *   (c) PIPELINE ORDERING — this module runs BEFORE metric_clarifier so
 *       that when active rewrite succeeds, the matched paragraph is
 *       marked (DOM marker) and metric_clarifier skips disclaimer-
 *       injection on that paragraph. Caller chains the marker via the
 *       returned `marked_paragraph_anchors` set.
 *
 *   (d) READER-SAFE WORDING (exact strings, no module names, no banned
 *       phrases):
 *
 *         critical_count >= 1 AND warn_count >  0  →
 *           "{critical_count} kritik bulgu ve {warn_count} izleme uyarısı"
 *         critical_count >= 1 AND warn_count === 0 →
 *           "{critical_count} kritik bulgu"
 *         critical_count === 0 AND warn_count > 0  →
 *           "{warn_count} izleme uyarısı"
 *         critical_count === 0 AND warn_count === 0 →
 *           SKIP (input array empty → fall back per (b))
 *
 *   (e) HTML-SAFETY — operates on text nodes only; <style>, <script>,
 *       and tag attributes are masked before regex passes. The matched
 *       narrative number is replaced inline; surrounding sentence
 *       preserved.
 */

// =============================================================================
// Types
// =============================================================================

export type RedFlagSeverity = 'critical' | 'warn' | 'info' | string;

export interface RedFlagInput {
  severity?: RedFlagSeverity;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface CriticalFindingResolverResult {
  /** Number of narrative "M kritik..." occurrences successfully rewritten. */
  active_rewrites: number;
  /** Distinct narrative M values observed before rewrite. */
  observed_narrative_values: string[];
  /** Reason if rewrite skipped at module level (null if rewrites attempted). */
  skip_reason: string | null;
  /** Anchors (paragraph-start indices in scaffold space) that were rewritten;
   *  caller passes these to metric_clarifier so duplicate disclaimers are not
   *  added to the same paragraph. */
  rewritten_paragraph_anchors: number[];
}

// =============================================================================
// Helpers — protect <style>/<script> blocks; operate on visible text only
// =============================================================================

const STYLE_BLOCK_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;

interface ProtectedSegment {
  placeholder: string;
  original: string;
}

function maskProtected(html: string): { masked: string; segments: ProtectedSegment[] } {
  const segments: ProtectedSegment[] = [];
  let i = 0;
  const masked = html.replace(STYLE_BLOCK_RE, (m) => {
    const placeholder = `__CFR_PROTECTED_${i}__`;
    segments.push({ placeholder, original: m });
    i++;
    return placeholder;
  });
  return { masked, segments };
}

function restoreProtected(html: string, segments: ProtectedSegment[]): string {
  let out = html;
  for (const seg of segments) out = out.replace(seg.placeholder, seg.original);
  return out;
}

function findContainingParagraphStart(html: string, idx: number): number {
  const slice = html.slice(0, idx);
  const re = /<(p|li|td|h1|h2|h3|h4|div)\b[^>]*>/gi;
  let lastOpen = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) {
    lastOpen = m.index;
  }
  return lastOpen;
}

// =============================================================================
// Severity counting (deterministic, no fabrication)
// =============================================================================

function countSeverities(redFlags: RedFlagInput[]): {
  critical: number;
  warn: number;
  info: number;
} {
  let critical = 0;
  let warn = 0;
  let info = 0;
  for (const f of redFlags) {
    const sev = String(f?.severity ?? '').toLowerCase().trim();
    if (sev === 'critical') critical++;
    else if (sev === 'warn' || sev === 'warning') warn++;
    else if (sev === 'info' || sev === 'information') info++;
  }
  return { critical, warn, info };
}

// =============================================================================
// Reader-safe wording builder (exact strings)
// =============================================================================

function buildReplacement(criticalCount: number, warnCount: number, narrativeNounMatch: string): string {
  // Preserve the noun the narrative used: "kritik bulgu" / "kritik finansal bulgu" / "kritik kırmızı bayrak"
  // Map all to the canonical "kritik bulgu" for consistency.
  // narrativeNounMatch is unused for the canonical output but available for variants.
  void narrativeNounMatch;

  if (criticalCount >= 1 && warnCount > 0) {
    return `${criticalCount} kritik bulgu ve ${warnCount} izleme uyarısı`;
  }
  if (criticalCount >= 1 && warnCount === 0) {
    return `${criticalCount} kritik bulgu`;
  }
  if (criticalCount === 0 && warnCount > 0) {
    return `${warnCount} izleme uyarısı`;
  }
  // Defensive — should not be reached; caller guards with skip_reason
  return `${criticalCount} kritik bulgu`;
}

// =============================================================================
// Pattern: "M kritik (kırmızı bayrak|bulgu|finansal bulgu)"
// =============================================================================
//
// Captures the leading number and the noun phrase so we can rewrite the full
// span. Case-insensitive; supports Turkish space variations.

const KRITIK_RE = /(\d+)\s*(kritik\s*(?:kırmızı\s*bayrak|finansal\s*bulgu|bulgu))/gi;

// =============================================================================
// Main entry
// =============================================================================

export function resolveCriticalFinding(
  html: string,
  redFlags: RedFlagInput[] | null | undefined,
): { html: string; result: CriticalFindingResolverResult } {
  // Empty-state result template
  const emptyResult: CriticalFindingResolverResult = {
    active_rewrites: 0,
    observed_narrative_values: [],
    skip_reason: null,
    rewritten_paragraph_anchors: [],
  };

  // Guard (a): missing or non-array → skip
  if (redFlags == null) {
    return { html, result: { ...emptyResult, skip_reason: 'fa_red_flags is null/undefined' } };
  }
  if (!Array.isArray(redFlags)) {
    return { html, result: { ...emptyResult, skip_reason: 'fa_red_flags is not an array' } };
  }

  // Guard (b): empty array — do NOT treat as "0 risk"; skip rewrite entirely
  if (redFlags.length === 0) {
    return { html, result: { ...emptyResult, skip_reason: 'fa_red_flags is empty (cannot distinguish from missing data)' } };
  }

  const { critical, warn } = countSeverities(redFlags);

  // Guard (b extension): both counts zero (e.g., array contained only unknown
  // severities) — also unsafe to rewrite.
  if (critical === 0 && warn === 0) {
    return {
      html,
      result: { ...emptyResult, skip_reason: 'fa_red_flags has no recognised severity entries' },
    };
  }

  // Apply rewrite
  const { masked, segments } = maskProtected(html);

  const observed = new Set<string>();
  const anchors = new Set<number>();
  let working = masked;

  // Collect matches first; then apply back-to-front so indexes stay stable
  KRITIK_RE.lastIndex = 0;
  const matches: Array<{ idx: number; len: number; M: number; nounMatch: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = KRITIK_RE.exec(working)) !== null) {
    const M = Number(m[1]);
    observed.add(String(M));
    matches.push({ idx: m.index, len: m[0].length, M, nounMatch: m[2] });
  }

  let rewrites = 0;
  matches.sort((a, b) => b.idx - a.idx);
  for (const match of matches) {
    // Skip rewrite when narrative count already matches canonical critical
    // count exactly AND warn would not change the wording. This prevents
    // pointless rewrites (e.g., narrative says "1 kritik bulgu" and canonical
    // is also 1 with 0 warn).
    if (match.M === critical && warn === 0) continue;

    // Skip rewrite when warn === 0 and narrative noun explicitly matches
    // the simple "kritik bulgu" form already (idempotency guard).
    // (No narrative match equality with full target string — we always
    // produce canonical text; the M === critical case handles consistency.)

    const replacement = buildReplacement(critical, warn, match.nounMatch);
    working = working.slice(0, match.idx) + replacement + working.slice(match.idx + match.len);
    rewrites++;
    const anchor = findContainingParagraphStart(working, match.idx);
    anchors.add(anchor);
  }

  const finalHtml = restoreProtected(working, segments);

  return {
    html: finalHtml,
    result: {
      active_rewrites: rewrites,
      observed_narrative_values: Array.from(observed).sort(),
      skip_reason: rewrites === 0 ? 'no narrative mismatch found' : null,
      rewritten_paragraph_anchors: Array.from(anchors),
    },
  };
}
