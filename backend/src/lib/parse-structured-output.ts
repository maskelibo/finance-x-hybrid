/**
 * Shared structured-output parser — Phase 8K (pending_fix #1).
 *
 * compose.ts (report formatter), manifest/extract.ts (Phase 5A), and
 * orchestrator.ts (QA routing) all had ad-hoc progressive JSON
 * extractors. Same code, three implementations, drifted over time.
 * This module consolidates the canonical extraction with telemetry.
 *
 * Strategy (matches compose.ts:parseJson pre-refactor — proven in prod):
 *   1. whole-string JSON.parse
 *   2. ```json ... ``` fenced block
 *   3. STRUCTURED DATA APPENDIX section (legacy pattern from FA)
 *   4. balanced-brace scan for first {...} of reasonable size
 *
 * Telemetry: aggregated in PARSE_MODE_COUNTS so a health-check endpoint
 * can report "how often does each agent emit clean JSON" — this is the
 * Phase 8F success metric. Agents that hit the `fallback_*` paths need
 * schema-first prompt tightening.
 */

export type ParseMode =
  | 'pass_object'      // input was already an object
  | 'fast_whole'       // whole string JSON.parse worked
  | 'fallback_fenced'  // ```json ... ``` fence
  | 'fallback_appendix'// STRUCTURED DATA APPENDIX
  | 'fallback_braces'  // balanced-brace scan
  | 'null_input'       // null / undefined / non-string
  | 'no_match';        // nothing worked

export type ParseResult<T> = {
  value: T | null;
  mode: ParseMode;
};

const PARSE_MODE_COUNTS: Record<ParseMode, number> = {
  pass_object: 0,
  fast_whole: 0,
  fallback_fenced: 0,
  fallback_appendix: 0,
  fallback_braces: 0,
  null_input: 0,
  no_match: 0,
};

/** Read-only snapshot of parse-mode counters. */
export function getParseModeCounts(): Readonly<Record<ParseMode, number>> {
  return { ...PARSE_MODE_COUNTS };
}

/** Reset counters. Useful at session boundaries in the orchestrator. */
export function resetParseModeCounts(): void {
  for (const k of Object.keys(PARSE_MODE_COUNTS) as ParseMode[]) {
    PARSE_MODE_COUNTS[k] = 0;
  }
}

function tally(mode: ParseMode): void {
  PARSE_MODE_COUNTS[mode]++;
}

/**
 * Parse a potentially-structured agent output. Tries multiple fallbacks;
 * returns `{ value, mode }` so the caller can log which strategy hit.
 */
export function parseStructuredOutput<T = unknown>(raw: unknown): ParseResult<T> {
  if (raw == null) {
    tally('null_input');
    return { value: null, mode: 'null_input' };
  }
  if (typeof raw === 'object') {
    tally('pass_object');
    return { value: raw as T, mode: 'pass_object' };
  }
  if (typeof raw !== 'string') {
    tally('null_input');
    return { value: null, mode: 'null_input' };
  }
  const text = raw;

  try {
    const v = JSON.parse(text) as T;
    tally('fast_whole');
    return { value: v, mode: 'fast_whole' };
  } catch { /* fall through */ }

  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
              || text.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try {
      const v = JSON.parse(fenced[1].trim()) as T;
      tally('fallback_fenced');
      return { value: v, mode: 'fallback_fenced' };
    } catch { /* fall through */ }
  }

  const appendix = text.match(/STRUCTURED\s+DATA\s+APPENDIX[\s\S]*?(\{[\s\S]*\})\s*$/i);
  if (appendix) {
    try {
      const v = JSON.parse(appendix[1]) as T;
      tally('fallback_appendix');
      return { value: v, mode: 'fallback_appendix' };
    } catch { /* fall through */ }
  }

  const firstBrace = text.indexOf('{');
  if (firstBrace >= 0) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end > firstBrace) {
      const candidate = text.slice(firstBrace, end + 1);
      if (candidate.length >= 20) {
        try {
          const v = JSON.parse(candidate) as T;
          tally('fallback_braces');
          return { value: v, mode: 'fallback_braces' };
        } catch { /* fall through */ }
      }
    }
  }

  tally('no_match');
  return { value: null, mode: 'no_match' };
}

/** Convenience: caller doesn't care about mode, just the value. */
export function parseStructuredOutputValue<T = unknown>(raw: unknown): T | null {
  return parseStructuredOutput<T>(raw).value;
}
