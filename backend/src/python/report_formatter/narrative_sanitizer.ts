/**
 * Narrative sanitizer (P4.beta.3).
 *
 * Removes LLM internal monologue ("Excellent — now I have...", "Let me
 * produce..."), counts remaining English residue (whitelist-aware), and
 * tracks raw flag tokens that escaped the translation pass.
 *
 * Strict invariants:
 *   - sentence-level removal uses conservative boundaries (200-char cap +
 *     punctuation/newline anchors); ambiguous matches are SKIPPED with a
 *     warning rather than risking removal of legitimate prose
 *   - English residue counter excludes ACCEPTED_FINANCE_TOKENS
 *     (EBITDA, FAVÖK, FCF, OCF, CAPEX, SOTP, NAV, DCF, WACC, ROE, ROA,
 *     ROIC, Q1-Q4, H1-H2, FY, IFRS, IAS, GAAP, ESG, KPI, ...)
 *   - <style>/<script>/tag attributes are masked before any text pass
 *   - never deletes silently when a humanize alternative exists; the
 *     banned_phrases module already handles rewrites for known patterns
 */

import { ACCEPTED_FINANCE_TOKENS } from './translation_dict.js';

// =============================================================================
// Types
// =============================================================================

export interface NarrativeSanitizerResult {
  /** # of LLM monologue sentences removed. */
  raw_agent_phrases_removed: number;
  /** Surviving English residue matches (whitelist-aware). */
  english_residue_remaining: number;
  /** Raw UPPER_SNAKE_CASE flag tokens still visible after translation pass. */
  raw_flag_token_remaining: number;
  /** Specific samples of remaining residue (capped at 10 for telemetry). */
  english_residue_samples: string[];
  /** Specific samples of remaining raw flag tokens. */
  raw_flag_token_samples: string[];
  /** Sentences flagged as ambiguous (skipped to avoid risk). */
  warnings: string[];
}

// =============================================================================
// HTML protection
// =============================================================================

const STYLE_BLOCK_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_RE = /<[^>]+>/g;

interface ProtectedSegment {
  placeholder: string;
  original: string;
}

function maskProtected(html: string): { masked: string; segments: ProtectedSegment[] } {
  const segments: ProtectedSegment[] = [];
  let i = 0;
  const masked = html.replace(STYLE_BLOCK_RE, (m) => {
    const placeholder = `__NARSAN_PROTECTED_${i}__`;
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

function visibleText(html: string): string {
  return html.replace(STYLE_BLOCK_RE, ' ').replace(HTML_TAG_RE, ' ').replace(/\s+/g, ' ');
}

// =============================================================================
// 1. Raw agent monologue removal
// =============================================================================
//
// Conservative sentence-level patterns. Each regex captures from a known
// LLM-monologue opener through the next sentence boundary (period, newline,
// or 200-char cap). Ambiguous matches (no clear boundary) are skipped.

const RAW_AGENT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // "Excellent — now I have the complete picture. Let me produce ..."
  // Lazy {0,200}? so we stop at FIRST sentence terminator, not gobble the whole sentence.
  { name: 'excellent_now_i_have', re: /(?:Excellent|Great|Perfect)\s*[—–-]\s*(?:now\s+I\s+have|I\s+have|let\s+me)[^.!?\n<]{0,200}?[.!?]\s*/gi },
  // "Now I have / Now that I have..."
  { name: 'now_i_have', re: /\b(?:Now\s+(?:that\s+)?I\s+have)[^.!?\n<]{0,200}?[.!?]\s*/gi },
  // "Let me (produce|create|generate|prepare|build) ..."
  { name: 'let_me_produce', re: /\bLet\s+me\s+(?:produce|create|generate|prepare|build|construct)[^.!?\n<]{0,200}?[.!?]\s*/gi },
  // "I (have|now have) (the complete picture|enough|all the data)..."
  { name: 'i_have_complete_picture', re: /\bI\s+(?:now\s+)?have\s+(?:the\s+complete\s+picture|enough|all\s+the\s+data|the\s+structured)[^.!?\n<]{0,200}?[.!?]\s*/gi },
  // "Looking at [the] X, ..." — `the` optional + lazy + stop at first comma OR period
  { name: 'looking_at', re: /\bLooking\s+at(?:\s+the)?[^,.!?\n<]{0,200}?[,.]\s*/gi },
  // "Based on (the above|the provided|the analysis|the findings), ..."
  { name: 'based_on_the_above', re: /\bBased\s+on\s+the\s+(?:above|provided|analysis|findings)[^,.!?\n<]{0,200}?[,.]\s*/gi },
];

function removeRawAgentPhrases(
  scaffold: string,
  warnings: string[],
): { html: string; removed: number } {
  let working = scaffold;
  let removed = 0;
  for (const p of RAW_AGENT_PATTERNS) {
    working = working.replace(p.re, () => {
      removed++;
      return '';
    });
  }
  // Detect any remaining LLM-style sentence boundary failures: an unfinished
  // monologue opener ("Excellent —" without sentence terminator). These are
  // ambiguous; we WARN but do not aggressively delete.
  const ambiguous = working.match(/(?:Excellent|Now\s+I\s+have|Let\s+me\s+produce)[^.!?\n<]{200,}/gi);
  if (ambiguous && ambiguous.length > 0) {
    warnings.push(`raw_agent_ambiguous_sentence_boundary:${ambiguous.length}`);
  }
  return { html: working, removed };
}

function countRemainingRawAgent(scaffold: string): number {
  let total = 0;
  for (const p of RAW_AGENT_PATTERNS) {
    const m = scaffold.match(p.re);
    if (m) total += m.length;
  }
  return total;
}

// =============================================================================
// 2. English residue counter (whitelist-aware)
// =============================================================================
//
// Heuristic: detect sequences of ≥4 consecutive English-looking words that
// are NOT in the ACCEPTED_FINANCE_TOKENS whitelist. The whitelist excludes
// EBITDA, FAVÖK, ROE, etc. so they don't inflate the residue count.
//
// "English-looking word" approximation:
//   - 3+ chars
//   - all lower-case ASCII letters (no Turkish-specific chars: ç ğ ı ö ş ü)
//   - in a small common-English-words set

// Curated patterns for known English finance/risk fragments. Each match
// counts as 1 residue. ACCEPTED_FINANCE_TOKENS abbreviations like EBITDA,
// FAVÖK, ROE are NOT included so they cannot inflate the count.

const ENGLISH_RESIDUE_PATTERNS: RegExp[] = [
  // Specific finance fragments observed leaking through translations
  /\bshort[- ]term\s+obligations\b/i,
  /\bcurrent\s+assets\b/i,
  /\belevated\s+distress(?:\s+risk)?\b/i,
  /\bdistress\s+risk\b/i,
  /\bearnings\s+barely\s+cover\b/i,
  /\bfinancing\s+cost\b/i,
  /\blow\s+quality\s+fundamentals?\b/i,
  /\bdual[- ]stream(?:\s+P&L)?\b/i,
  /\bnon[- ]financial\s+stream\b/i,
  /\bgross[- ]margin\s+chain\b/i,
  /\bquality\s+fundamentals\b/i,
  /\bworking\s+capital\b/i,
  /\bbook\s+value\b/i,
  /\bmarket\s+cap\b/i,
  /\bcash\s+flow\b/i,
  /\bauditor\s+opinion\b/i,
  /\bfree\s+cash\s+flow\b/i,
  /\boperating\s+cash\s+flow\b/i,
  /\bnet\s+income\b/i,
  /\bgross\s+margin\b/i,
  /\bnet\s+margin\b/i,
  /\bearnings\s+barely\b/i,
  /\binterest\s+coverage\b/i,
  /\bcurrent\s+ratio\s+\d/i,
  /\babove\s+the\s+threshold\b/i,
  /\bbelow\s+the\s+threshold\b/i,
  /\bmargins?\s+are\s+(?:improving|deteriorating|stable)\b/i,
  /\bnet\s+debt\s+to\s+ebitda\b/i,
  /\bdebt\s+to\s+equity\b/i,
  /\bpositive\s+(?:and\s+)?negative\s+signals?\b/i,
  /\binspect\s+closer\b/i,
  // Generic English sentence patterns (loose, but indicative)
  /\bthis\s+is\s+the\s+\w+/i,
  /\bbased\s+on\s+the\s+\w+/i,
  /\bready\s+for\s+(?:review|analysis)\b/i,
  /\bfor\s+the\s+(?:analysis|report|review)\b/i,
  /\bthe\s+\w+\s+is\s+ready\b/i,
];

function countEnglishResidue(scaffold: string): { count: number; samples: string[] } {
  const visible = visibleText(scaffold);
  const samples: string[] = [];
  let count = 0;
  for (const re of ENGLISH_RESIDUE_PATTERNS) {
    const m = visible.match(new RegExp(re.source, re.flags + (re.flags.includes('g') ? '' : 'g')));
    if (m) {
      count += m.length;
      for (const sample of m.slice(0, 3)) {
        if (samples.length < 10) samples.push(sample);
      }
    }
  }
  return { count, samples };
}

// =============================================================================
// 3. Raw flag token counter
// =============================================================================
//
// Catches UPPER_SNAKE_CASE tokens that survived the RED_FLAG_TR translation
// pass. Excludes ACCEPTED_FINANCE_TOKENS so abbreviations like EBITDA, ROE
// don't get flagged.

const RAW_FLAG_RE = /\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]*\b/g;

function countRawFlagTokens(scaffold: string): { count: number; samples: string[] } {
  const visible = visibleText(scaffold);
  const matches = visible.match(RAW_FLAG_RE) ?? [];
  const distinct = new Set<string>();
  for (const m of matches) {
    if (ACCEPTED_FINANCE_TOKENS.has(m)) continue;
    distinct.add(m);
  }
  return { count: matches.filter(m => !ACCEPTED_FINANCE_TOKENS.has(m)).length, samples: Array.from(distinct).slice(0, 10) };
}

// =============================================================================
// Main entry
// =============================================================================

export function sanitizeNarrative(
  html: string,
): { html: string; result: NarrativeSanitizerResult } {
  const warnings: string[] = [];
  const { masked, segments } = maskProtected(html);

  // 1. Remove raw agent monologue
  const { html: afterRaw, removed } = removeRawAgentPhrases(masked, warnings);

  // 2. Count remaining (post-removal) — should be 0; HOLD gate uses this
  const remainingRawAgent = countRemainingRawAgent(afterRaw);

  // 3. Count English residue (whitelist-aware)
  const { count: residueCount, samples: residueSamples } = countEnglishResidue(afterRaw);

  // 4. Count raw flag tokens
  const { count: rawFlagCount, samples: rawFlagSamples } = countRawFlagTokens(afterRaw);

  const finalHtml = restoreProtected(afterRaw, segments);

  return {
    html: finalHtml,
    result: {
      raw_agent_phrases_removed: removed,
      english_residue_remaining: residueCount,
      raw_flag_token_remaining: rawFlagCount,
      english_residue_samples: residueSamples,
      raw_flag_token_samples: rawFlagSamples,
      warnings,
    },
  };
}

/** Standalone: count post-sanitize raw agent phrases. Used by HOLD gate. */
export function countPostSanitizeRawAgent(html: string): number {
  const { masked } = maskProtected(html);
  return countRemainingRawAgent(masked);
}
