/**
 * Macro consistency guard (P4.beta.3).
 *
 * Detects "Raporlanmadı" / placeholder cells in macro tables and conflicts
 * with specific numeric values claimed by narrative paragraphs. Resolves by
 * replacing the narrative numeric with a disclaimer; never fabricates data.
 *
 * Strict invariants:
 *   - resolution is conservative: replaces only the matched numeric span,
 *     preserving the rest of the narrative sentence
 *   - no canonical fabrication: if the table value is "Raporlanmadı" the
 *     narrative cannot keep a specific value; either disclaim or skip if
 *     ambiguous
 *   - <style>/<script> blocks are masked before any text pass
 *   - operates on visible HTML segments only
 */

// =============================================================================
// Types
// =============================================================================

export type MacroMetricKey =
  | 'tcmb_policy_rate'
  | 'cpi_yoy'
  | 'gdp'
  | 'usd_try'
  | 'eur_try'
  | 'bist100';

export interface MacroConsistencyResult {
  /** # of narrative numerics replaced with disclaimer. */
  contradictions_resolved: number;
  /** # of unresolved contradictions (post-pass detect; for HOLD gate). */
  contradictions_remaining: number;
  /** Per-metric detail. */
  details: Array<{
    metric: MacroMetricKey;
    table_value: string;
    narrative_values: string[];
    resolved: boolean;
  }>;
}

// =============================================================================
// HTML protection
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
    const placeholder = `__MCG_PROTECTED_${i}__`;
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

// =============================================================================
// Table cell detection
// =============================================================================

const ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL_RE = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;

const PLACEHOLDER_VALUES = /^(?:raporlanmad[ıi]|raporlanmamış|n\s*\/\s*a|—|-|bilinmiyor|—\s*$|--|\.\.\.)$/i;

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

const METRIC_LABEL_PATTERNS: Array<{ key: MacroMetricKey; re: RegExp }> = [
  { key: 'tcmb_policy_rate', re: /(?:TCMB\s+politika\s+faizi|politika\s+faizi)/i },
  { key: 'cpi_yoy', re: /(?:T[ÜU]FE|CPI|enflasyon)/i },
  { key: 'gdp', re: /(?:GSYH|GDP)/i },
  { key: 'usd_try', re: /USD\s*\/\s*TRY|USDTRY|Dolar\s*\/\s*TL/i },
  { key: 'eur_try', re: /EUR\s*\/\s*TRY|EURTRY|Euro\s*\/\s*TL/i },
  { key: 'bist100', re: /BIST[\s-]*100/i },
];

function detectMetricInLabel(label: string): MacroMetricKey | null {
  for (const p of METRIC_LABEL_PATTERNS) {
    if (p.re.test(label)) return p.key;
  }
  return null;
}

interface TableMetricObservation {
  metric: MacroMetricKey;
  cellValue: string;
  isPlaceholder: boolean;
}

function scanTableCells(scaffold: string): TableMetricObservation[] {
  const observations: TableMetricObservation[] = [];
  const rows = [...scaffold.matchAll(ROW_RE)];
  for (const r of rows) {
    const rowInner = r[1];
    const cells = [...rowInner.matchAll(CELL_RE)].map((m) => stripTags(m[1]));
    if (cells.length < 2) continue;
    const labelText = cells[0];
    const valueText = cells[cells.length - 1]; // last cell is typically the value
    const metric = detectMetricInLabel(labelText);
    if (!metric) continue;
    const isPlaceholder = PLACEHOLDER_VALUES.test(valueText.trim());
    observations.push({ metric, cellValue: valueText, isPlaceholder });
  }
  return observations;
}

// =============================================================================
// Narrative numeric detection per metric
// =============================================================================

const NARRATIVE_PATTERNS: Record<MacroMetricKey, RegExp> = {
  tcmb_policy_rate: /(?:TCMB|politika)\s+faizi[^<]{0,40}?%(\d+(?:[,.]\d+)?)/gi,
  cpi_yoy: /(?:T[ÜU]FE|CPI|enflasyon)[^<]{0,40}?%(\d+(?:[,.]\d+)?)/gi,
  gdp: /(?:GSYH|GDP)[^<]{0,40}?%(\d+(?:[,.]\d+)?)/gi,
  usd_try: /USD\s*\/\s*TRY[^<]{0,30}?(\d+(?:[,.]\d+)?)/gi,
  eur_try: /EUR\s*\/\s*TRY[^<]{0,30}?(\d+(?:[,.]\d+)?)/gi,
  bist100: /BIST[\s-]*100[^<]{0,30}?(\d{3,5}(?:[.,]\d+)?)/gi,
};

interface NarrativeMatch {
  metric: MacroMetricKey;
  idx: number;
  matchLen: number;
  numeric: string;
  rawMatch: string;
}

function scanNarrativeForMetric(html: string, metric: MacroMetricKey): NarrativeMatch[] {
  const re = new RegExp(NARRATIVE_PATTERNS[metric].source, 'gi');
  const matches: NarrativeMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push({
      metric,
      idx: m.index,
      matchLen: m[0].length,
      numeric: m[1],
      rawMatch: m[0],
    });
  }
  return matches;
}

// =============================================================================
// Resolution: replace narrative match with disclaimer-style text
// =============================================================================

function disclaimerForMetric(metric: MacroMetricKey, originalSpan: string): string {
  // Preserve the metric label prefix (everything before the numeric) and
  // append a disclaimer. We do not invent any new value.
  const labelPart = originalSpan.replace(/%?\d+(?:[,.]\d+)?$/, '').trim();
  const friendly: Record<MacroMetricKey, string> = {
    tcmb_policy_rate: 'TCMB politika faizi',
    cpi_yoy: 'TÜFE',
    gdp: 'GSYH büyüme',
    usd_try: 'USD/TRY paritesi',
    eur_try: 'EUR/TRY paritesi',
    bist100: 'BIST-100',
  };
  const fallbackLabel = friendly[metric];
  // If labelPart is empty/strange, use fallback
  const usedLabel = labelPart.length >= 3 ? labelPart : fallbackLabel;
  return `${usedLabel} (bu raporda kanonik veri kaynağında teyit edilmemiştir)`;
}

// =============================================================================
// Main entry
// =============================================================================

export function guardMacroConsistency(
  html: string,
): { html: string; result: MacroConsistencyResult } {
  const { masked, segments } = maskProtected(html);

  // 1. Find macro metrics whose TABLE cell is "Raporlanmadı" (or similar)
  const tableObs = scanTableCells(masked);
  const placeholderMetrics = new Set<MacroMetricKey>();
  const tableValueByMetric = new Map<MacroMetricKey, string>();
  for (const obs of tableObs) {
    if (obs.isPlaceholder) {
      placeholderMetrics.add(obs.metric);
      tableValueByMetric.set(obs.metric, obs.cellValue);
    }
  }

  // 2. For each placeholder metric, scan narrative for specific values
  const details: MacroConsistencyResult['details'] = [];
  let working = masked;

  for (const metric of placeholderMetrics) {
    const narrativeMatches = scanNarrativeForMetric(working, metric);
    if (narrativeMatches.length === 0) {
      details.push({
        metric,
        table_value: tableValueByMetric.get(metric) ?? '',
        narrative_values: [],
        resolved: false,
      });
      continue;
    }

    const narrativeValues = Array.from(new Set(narrativeMatches.map((m) => m.numeric))).sort();

    // Resolve back-to-front so indexes stay stable
    narrativeMatches.sort((a, b) => b.idx - a.idx);
    let resolvedThisMetric = 0;
    for (const m of narrativeMatches) {
      const replacement = disclaimerForMetric(metric, m.rawMatch);
      working = working.slice(0, m.idx) + replacement + working.slice(m.idx + m.matchLen);
      resolvedThisMetric++;
    }
    details.push({
      metric,
      table_value: tableValueByMetric.get(metric) ?? '',
      narrative_values: narrativeValues,
      resolved: resolvedThisMetric > 0,
    });
  }

  // 3. Re-scan to compute remaining contradictions (HOLD gate input)
  let remaining = 0;
  for (const metric of placeholderMetrics) {
    const stillPresent = scanNarrativeForMetric(working, metric);
    remaining += stillPresent.length;
  }

  const finalHtml = restoreProtected(working, segments);

  return {
    html: finalHtml,
    result: {
      contradictions_resolved: details.reduce((acc, d) => acc + (d.resolved ? d.narrative_values.length : 0), 0),
      contradictions_remaining: remaining,
      details,
    },
  };
}
