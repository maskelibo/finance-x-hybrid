/**
 * Metric clarifier (P4.beta.2).
 *
 * Disclaimer-only metric correction. NEVER replaces narrative numbers; only
 * appends clarifier sentences when a deterministic canonical truth exists
 * and the narrative diverges from it.
 *
 * Two functions:
 *   - clarifyKritikBulgu — if FA Python's critical_flag_count is known and
 *     narrative says a different number of "kritik bulgu", add a Turkish
 *     boardroom-style canonical disclaimer. The narrative number is left
 *     unchanged.
 *   - clarifyPiotroski   — if Piotroski X/9 appears in narrative AND prior-
 *     period data is NOT loaded, append a limited-data clarifier sentence.
 *     The X/9 score is left unchanged.
 *
 * Strict invariants (per P4.beta.2 mandatory corrections):
 *   - the disclaimer text must NOT contain the word "engine".
 *     Use: "Kanonik finansal analiz sonucu: {N} kritik bulgu."
 *   - operates on visible HTML text only (between tags); never touches
 *     <style>, <script>, tag attributes, or class names
 *   - dedup per paragraph: at most one disclaimer per matching paragraph
 *   - if canonical source is missing or value matches narrative, no-op
 *   - HTML structure is preserved
 */

// =============================================================================
// Types
// =============================================================================

export interface KritikBulguClarifyResult {
  disclaimers_injected: number;
  /** Number of (M, N) pairs where narrative ≠ canonical. */
  conflicts_explained: number;
  /** Distinct narrative values observed (for telemetry). */
  narrative_values: string[];
}

export interface PiotroskiClarifyResult {
  clarifiers_injected: number;
  /** Distinct skor values observed (for telemetry). */
  scores_observed: string[];
}

// =============================================================================
// HTML protection (style/script masking) and paragraph segmentation
// =============================================================================

const STYLE_BLOCK_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;

function withProtectedBlocks<T>(
  html: string,
  fn: (visibleHtml: string) => { transformed: string; result: T },
): { html: string; result: T } {
  const segments: Array<{ placeholder: string; original: string }> = [];
  let idx = 0;
  const masked = html.replace(STYLE_BLOCK_RE, (match) => {
    const placeholder = `__MCLARIFY_PROTECTED_${idx}__`;
    segments.push({ placeholder, original: match });
    idx++;
    return placeholder;
  });
  const out = fn(masked);
  let restored = out.transformed;
  for (const seg of segments) {
    restored = restored.replace(seg.placeholder, seg.original);
  }
  return { html: restored, result: out.result };
}

// Paragraph close tag (or block-level close) used to anchor disclaimer
// injection at end of a "containing" block. We match the first </p> that
// follows the matched span.
const CLOSE_BLOCK_RE = /<\/p>|<\/li>|<\/td>|<\/div>/i;

function injectAfterMatch(html: string, matchIdx: number, matchLen: number, disclaimer: string): string {
  // Search for the first close-block tag after matchIdx; insert disclaimer just before it.
  const tail = html.slice(matchIdx + matchLen);
  const m = tail.match(CLOSE_BLOCK_RE);
  if (!m) {
    // No close tag — append disclaimer directly after match (rare; defensive)
    return html.slice(0, matchIdx + matchLen) + ' ' + disclaimer + html.slice(matchIdx + matchLen);
  }
  const closeAt = (matchIdx + matchLen) + (m.index ?? 0);
  return html.slice(0, closeAt) + ' ' + disclaimer + html.slice(closeAt);
}

// =============================================================================
// 1. clarifyKritikBulgu — narrative number left unchanged; disclaimer appended
// =============================================================================

const KRITIK_BULGU_RE = /(\d+)\s*kritik\s*(?:finansal\s*)?bulgu/gi;

export function clarifyKritikBulgu(
  html: string,
  canonicalCount: number | null,
): { html: string; result: KritikBulguClarifyResult } {
  if (canonicalCount == null || !Number.isFinite(canonicalCount)) {
    return { html, result: { disclaimers_injected: 0, conflicts_explained: 0, narrative_values: [] } };
  }

  const N = Math.trunc(canonicalCount);

  return withProtectedBlocks(html, (visible) => {
    const narrativeValues = new Set<string>();
    const injectedAtPara = new Set<number>();
    let injected = 0;

    // Re-execute regex carefully to capture indices
    let working = visible;
    const matches: Array<{ idx: number; len: number; M: number }> = [];
    KRITIK_BULGU_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = KRITIK_BULGU_RE.exec(working)) !== null) {
      const M = Number(m[1]);
      narrativeValues.add(String(M));
      if (Number.isFinite(M) && M !== N) {
        matches.push({ idx: m.index, len: m[0].length, M });
      }
    }

    // Inject back-to-front so earlier indexes stay valid
    matches.sort((a, b) => b.idx - a.idx);
    for (const match of matches) {
      // Dedup per-paragraph: find the start of containing <p> / block to dedup
      const paraStart = findContainingBlockStart(working, match.idx);
      if (injectedAtPara.has(paraStart)) continue;
      injectedAtPara.add(paraStart);

      const disclaimer = `<em class="fx-canonical-disclaimer" style="font-size: 8.5pt; color: var(--fx-gray);">(Kanonik finansal analiz sonucu: ${N} kritik bulgu. Diğer rakamlar narrative kapsam genişliğinden kaynaklanabilir.)</em>`;
      working = injectAfterMatch(working, match.idx, match.len, disclaimer);
      injected++;
    }

    return {
      transformed: working,
      result: {
        disclaimers_injected: injected,
        conflicts_explained: injected,
        narrative_values: Array.from(narrativeValues).sort(),
      },
    };
  });
}

function findContainingBlockStart(html: string, idx: number): number {
  // Walk back to nearest <p / <li / <td / <div opening; if none, return 0
  const slice = html.slice(0, idx);
  const re = /<(p|li|td|div)\b[^>]*>/gi;
  let lastOpen = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) {
    lastOpen = m.index;
  }
  return lastOpen;
}

// =============================================================================
// 2. clarifyPiotroski — score left unchanged; limited-data suffix appended
// =============================================================================

const PIOTROSKI_RE = /Piotroski\s+(?:F\s+|Skoru\s+|Score\s+)?(\d+)\s*\/\s*9/gi;

export function clarifyPiotroski(
  html: string,
  priorPeriodLoaded: boolean,
): { html: string; result: PiotroskiClarifyResult } {
  if (priorPeriodLoaded === true) {
    return { html, result: { clarifiers_injected: 0, scores_observed: [] } };
  }

  return withProtectedBlocks(html, (visible) => {
    const scoresObserved = new Set<string>();
    const injectedAtPara = new Set<number>();
    let injected = 0;

    let working = visible;
    const matches: Array<{ idx: number; len: number; score: string }> = [];
    PIOTROSKI_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PIOTROSKI_RE.exec(working)) !== null) {
      scoresObserved.add(m[1]);
      matches.push({ idx: m.index, len: m[0].length, score: m[1] });
    }

    // Back-to-front injection
    matches.sort((a, b) => b.idx - a.idx);
    for (const match of matches) {
      const paraStart = findContainingBlockStart(working, match.idx);
      if (injectedAtPara.has(paraStart)) continue;
      injectedAtPara.add(paraStart);

      const suffix = `<em class="fx-piotroski-clarifier" style="font-size: 8.5pt; color: var(--fx-gray);">(Bu skor yalnızca cari yıl kriterlerine göre hesaplanmıştır; tam dokuz kriterli Piotroski değerlendirmesi için önceki dönem finansalları gerekmektedir. Altı kriter önceki dönem karşılaştırması olmadan değerlendirilemediği için sıfır olarak sayılmıştır.)</em>`;
      working = injectAfterMatch(working, match.idx, match.len, suffix);
      injected++;
    }

    return {
      transformed: working,
      result: {
        clarifiers_injected: injected,
        scores_observed: Array.from(scoresObserved).sort(),
      },
    };
  });
}
