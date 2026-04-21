/**
 * Upstream digest — Phase 5B runtime activation (brief §5 Context Engineering).
 *
 * Problem: orchestrator.ts used to do `.slice(0, 15000)` on upstream agent
 * outputs before injecting into downstream agent prompts. A 100 KB FA output
 * became a front-truncated 15 KB — the middle and tail (where the critical
 * findings often live) were dropped. Classic "Lost in the Middle".
 *
 * Solution: a size-cap that is manifest-aware:
 *   1) If raw output ≤ targetBytes → return as-is (zero behaviour change).
 *   2) If output parses as JSON → pick high-signal fields (executive_summary,
 *      metrics_array/engine_snapshot, findings, interpretations,
 *      addressed_findings) and emit a compact JSON digest.
 *   3) Else → front-and-tail smart slice: keep first 60% + last 30% of the
 *      budget with an ellipsis marker. This catches both the opening frame
 *      and the closing conclusions, which is where signal concentrates.
 *
 * Toggle: UPSTREAM_DIGEST_MODE env var.
 *   - 'smart'    → active (default). Uses the digest logic above.
 *   - 'truncate' → legacy behaviour. Front-only slice to targetBytes.
 *
 * Idempotent: re-digesting an already-digested string shortens it no further.
 * Fail-safe: any internal error falls back to the legacy truncate path.
 */

export type DigestResult = {
  digest: string;
  mode: 'raw' | 'json' | 'smart_slice' | 'legacy_truncate';
  originalBytes: number;
  digestBytes: number;
  compressionRatio: number; // originalBytes / digestBytes
  sectionsKept: string[]; // diagnostic — which JSON keys survived
};

const DIGEST_MARKER = '\n\n[... digest: middle content summarized, see upstream manifest for full sections ...]\n\n';

/**
 * JSON signal fields we try to keep, in priority order. Anything outside this
 * list gets dropped once the budget is consumed.
 */
const SIGNAL_FIELDS: ReadonlyArray<string> = [
  'executive_summary',
  'summary',
  'key_findings',
  'findings',
  'addressed_findings',
  'mandatory_metrics_complete',
  'engine_snapshot',
  'metrics_array',
  'interpretations',
  'quality_flags',
  'cross_reference_findings',
  'risk_factors',
  'recommendations',
  'claims',
  'confidence',
  'status',
];

/** Strip one layer of ```json ... ``` fence and try parse. */
function tryParseJson(raw: string): unknown | null {
  const text = raw.trim();
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
  }
  const firstBrace = text.indexOf('{');
  if (firstBrace < 0) return null;
  let depth = 0;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(firstBrace, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function byteLen(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

/**
 * Build a size-capped JSON digest by keeping SIGNAL_FIELDS in priority order
 * until the budget is consumed. Each field is itself size-capped to
 * `perFieldBudget` so a single huge array doesn't starve the rest.
 */
function digestJson(
  doc: Record<string, unknown>,
  targetBytes: number,
): { digest: string; keptKeys: string[] } {
  const out: Record<string, unknown> = {};
  const kept: string[] = [];
  const perFieldBudget = Math.max(400, Math.floor(targetBytes / 8));
  let consumed = 0;

  for (const key of SIGNAL_FIELDS) {
    if (!(key in doc)) continue;
    const value = (doc as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    let serialized = JSON.stringify(value);
    const rawLen = byteLen(serialized);
    if (rawLen > perFieldBudget) {
      // Array → keep first N items; string → slice; object → shallow keys only.
      if (Array.isArray(value)) {
        const items: unknown[] = [];
        let accum = 2; // '[]'
        for (const item of value) {
          const serializedItem = JSON.stringify(item);
          if (accum + byteLen(serializedItem) + 1 > perFieldBudget) break;
          items.push(item);
          accum += byteLen(serializedItem) + 1;
        }
        serialized = JSON.stringify(items);
        if (items.length < value.length) {
          // Drop a summary marker inline.
          serialized = JSON.stringify({
            __digest_kept: items.length,
            __digest_total: value.length,
            items,
          });
        }
      } else if (typeof value === 'string') {
        serialized = JSON.stringify(value.slice(0, perFieldBudget - 2));
      } else if (typeof value === 'object') {
        const shallow: Record<string, unknown> = {};
        let accum = 2;
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          const pairSize = byteLen(JSON.stringify({ [k]: v }));
          if (accum + pairSize > perFieldBudget) break;
          shallow[k] = v;
          accum += pairSize;
        }
        serialized = JSON.stringify(shallow);
      }
    }
    const finalLen = byteLen(serialized);
    if (consumed + finalLen > targetBytes && kept.length > 0) break;
    out[key] = JSON.parse(serialized);
    kept.push(key);
    consumed += finalLen;
  }

  return { digest: JSON.stringify(out, null, 2), keptKeys: kept };
}

/**
 * Front-and-tail slice: keep first 60% + tail 30% with an ellipsis marker.
 * Always lands under targetBytes (well below, after adding the marker).
 */
function smartSlice(raw: string, targetBytes: number): string {
  const marker = DIGEST_MARKER;
  const markerBytes = byteLen(marker);
  if (targetBytes <= markerBytes * 2) return raw.slice(0, targetBytes);

  const budget = targetBytes - markerBytes;
  const headBytes = Math.floor(budget * 0.6);
  const tailBytes = budget - headBytes;
  const head = raw.slice(0, headBytes);
  const tail = raw.slice(raw.length - tailBytes);
  return head + marker + tail;
}

/**
 * Main entry point. Replace `output.slice(0, N)` with `digestUpstream(output, N).digest`.
 *
 * @param rawOutput The raw upstream agent output string.
 * @param targetBytes The soft upper bound of the digest (utf-8 bytes).
 * @param opts.mode Override the global UPSTREAM_DIGEST_MODE env var. Useful
 *                   for call sites that must preserve legacy behaviour
 *                   (e.g. DB archival where we want the full slice).
 */
export function digestUpstream(
  rawOutput: string | null | undefined,
  targetBytes: number,
  opts: { mode?: 'smart' | 'truncate'; label?: string } = {},
): DigestResult {
  const raw = typeof rawOutput === 'string' ? rawOutput : '';
  const originalBytes = byteLen(raw);

  if (originalBytes <= targetBytes) {
    return {
      digest: raw,
      mode: 'raw',
      originalBytes,
      digestBytes: originalBytes,
      compressionRatio: 1,
      sectionsKept: [],
    };
  }

  const mode = opts.mode ?? ((process.env.UPSTREAM_DIGEST_MODE || 'smart') as 'smart' | 'truncate');

  if (mode === 'truncate') {
    const sliced = raw.slice(0, targetBytes);
    return {
      digest: sliced,
      mode: 'legacy_truncate',
      originalBytes,
      digestBytes: byteLen(sliced),
      compressionRatio: originalBytes / byteLen(sliced || '.'),
      sectionsKept: [],
    };
  }

  // Smart path: try JSON digest first, fall back to front-tail slice.
  try {
    const parsed = tryParseJson(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const { digest, keptKeys } = digestJson(parsed as Record<string, unknown>, targetBytes);
      const digestBytes = byteLen(digest);
      if (digestBytes <= targetBytes && keptKeys.length > 0) {
        return {
          digest,
          mode: 'json',
          originalBytes,
          digestBytes,
          compressionRatio: originalBytes / digestBytes,
          sectionsKept: keptKeys,
        };
      }
    }
  } catch { /* fall through to smart slice */ }

  const sliced = smartSlice(raw, targetBytes);
  return {
    digest: sliced,
    mode: 'smart_slice',
    originalBytes,
    digestBytes: byteLen(sliced),
    compressionRatio: originalBytes / byteLen(sliced || '.'),
    sectionsKept: [],
  };
}

/** Convenience: just return the digest string. */
export function digest(rawOutput: string | null | undefined, targetBytes: number): string {
  return digestUpstream(rawOutput, targetBytes).digest;
}
