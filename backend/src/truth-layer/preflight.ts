/**
 * Financial Truth Layer — pre-flight helpers for orchestrator + agents.
 *
 * P1.beta (2026-04-26): consumer-side integration of the FTL first core.
 * Surfaces truth assertions into accumulatedContext as ADDITIVE fields so
 * downstream agents and shadow runners can read them without changing
 * sub-agent prompts/schemas.
 *
 * Public API:
 *   - populateTruthAssertions(ticker, ctx)       basic — classification + weights
 *   - populateFaFilingHint(ticker, ctx)          adds filing_hint when KAP filings available
 *   - readTruthAssertions(ctx)                   typed getter (returns null if absent)
 *   - logTruthLayerSummary(ctx)                  console pretty-print (debug)
 *   - kapDisclosuresToFilings(disclosures)       adapter — kap_watch inventory → FilingRecord[]
 *
 * All functions are pure (or write-only on the passed-in ctx). No DB writes,
 * no LLM calls, no orchestrator side-effects.
 */

import { getTruthAssertions } from './index.js';
import type {
  FilingRecord,
  TruthAssertions,
  FilingSelection,
  ValuationMethod,
} from './types.js';

// =============================================================================
// Context keys (canonical strings — keep stable across iterations)
// =============================================================================

export const TRUTH_CONTEXT_KEYS = {
  ASSERTIONS: 'truth_assertions',
  ASSERTIONS_JSON: 'truth_assertions_json',
  FA_FILING_HINT: 'fa_filing_hint',
  FA_FILING_HINT_REASONING: 'fa_filing_hint_reasoning',
} as const;

// =============================================================================
// Public API
// =============================================================================

/**
 * Populate accumulatedContext with classification + valuation weights.
 * Called at orchestrator session start (advisory mode — non-binding).
 *
 * Idempotent: skips if already populated (e.g., resumed session).
 */
export function populateTruthAssertions(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): TruthAssertions {
  const existing = accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS] as TruthAssertions | undefined;
  if (existing && existing.ticker === ticker.toUpperCase()) return existing;

  const assertions = getTruthAssertions(ticker);
  accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS] = assertions;
  accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS_JSON] = JSON.stringify(assertions);
  return assertions;
}

/**
 * Populate accumulatedContext with FA filing_id hint, derived from KAP
 * disclosures if available. No-op when no disclosure inventory found.
 *
 * Python adapter behavior is NOT changed — the hint is purely advisory.
 * Future iterations may have the Python engine consume this hint to skip
 * placeholder filings; for now it is captured for traceability.
 */
export function populateFaFilingHint(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): FilingSelection | null {
  const filings = extractKapFilingsFromContext(accumulatedContext);
  if (filings.length === 0) return null;

  // Re-use full assertions if already populated; otherwise compute fresh
  const assertions = getTruthAssertions(ticker, { filings });
  const sel = assertions.filing_selection;

  if (sel?.selected) {
    accumulatedContext[TRUTH_CONTEXT_KEYS.FA_FILING_HINT] = sel.selected.filing_id;
    accumulatedContext[TRUTH_CONTEXT_KEYS.FA_FILING_HINT_REASONING] = sel.reasoning;
  }
  // Keep existing assertions field current (overwrites with filing_selection now populated)
  accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS] = assertions;
  accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS_JSON] = JSON.stringify(assertions);

  return sel ?? null;
}

// =============================================================================
// P2.alpha — methodology mismatch guard (advisory / observation only)
// =============================================================================

export type MethodologyAlignmentSeverity = 'none' | 'low' | 'medium' | 'high';

export interface MethodologyAlignment {
  ticker: string;
  aligned: boolean;
  expected_method: ValuationMethod;
  chosen_method: string | null;
  severity: MethodologyAlignmentSeverity;
  reasoning: string;
  classification_label: string;
}

/**
 * P2.alpha — compare a downstream consumer's chosen valuation methodology
 * to the FTL primary_method recommendation. Pure observation — never mutates
 * accumulatedContext, never overrides agent output.
 *
 * Returns null when truth assertions have not been populated for the session
 * (e.g., legacy run, FTL-disabled path) — caller should treat that as no-op.
 *
 * Severity tiers:
 *   none   — chosen === FTL primary_method
 *   high   — chosen='val_dcf' AND classification is_holding|is_banking (structural)
 *   high   — chosen ∈ inappropriate_methods (weight=0 in FTL template)
 *   medium — chosen has weight ≥ 0.15 in FTL template but is not primary
 *   low    — chosen ∈ secondary_methods (FTL weight ∈ (0, 0.15))
 *   low    — chosen unknown/unparseable (advisory; cannot fully assess)
 */
export function assertMethodologyAlignment(
  accumulatedContext: Record<string, unknown>,
  chosenMethod: string | null | undefined,
): MethodologyAlignment | null {
  const truth = readTruthAssertions(accumulatedContext);
  if (!truth) return null;

  const expected = truth.valuation_methodology.primary_method;
  const ticker = truth.classification.ticker;
  const weights = truth.valuation_methodology.weights as Record<string, number>;
  const inappropriate = truth.valuation_methodology.inappropriate_methods as string[];
  const secondary = truth.valuation_methodology.secondary_methods as string[];
  const isHolding = truth.classification.is_holding;
  const isBanking = truth.classification.is_banking;

  // weighter prepends "[label] " to the justification — extract label for log.
  const labelMatch = truth.valuation_methodology.justification.match(/^\[([^\]]+)\]/);
  const classificationLabel = labelMatch ? labelMatch[1] : 'unknown';

  const chosen =
    typeof chosenMethod === 'string' && chosenMethod.trim() ? chosenMethod.trim() : null;

  if (chosen === expected) {
    return {
      ticker,
      aligned: true,
      expected_method: expected,
      chosen_method: chosen,
      severity: 'none',
      reasoning: `chosen matches FTL primary (${expected})`,
      classification_label: classificationLabel,
    };
  }

  if (!chosen) {
    return {
      ticker,
      aligned: false,
      expected_method: expected,
      chosen_method: null,
      severity: 'low',
      reasoning: 'chosen methodology not detectable in scenario builder output (advisory)',
      classification_label: classificationLabel,
    };
  }

  // Structural mismatch — checked first because val_dcf for holding/banking
  // is wrong regardless of any non-zero weight in the FTL template.
  if (chosen === 'val_dcf' && (isHolding || isBanking)) {
    return {
      ticker,
      aligned: false,
      expected_method: expected,
      chosen_method: chosen,
      severity: 'high',
      reasoning:
        `structural mismatch: val_dcf chosen for ${classificationLabel} ticker — ` +
        `consolidated bank P&L / segment-mismatched holding distorts FCF (FTL primary=${expected})`,
      classification_label: classificationLabel,
    };
  }

  if (inappropriate.includes(chosen)) {
    return {
      ticker,
      aligned: false,
      expected_method: expected,
      chosen_method: chosen,
      severity: 'high',
      reasoning:
        `chosen '${chosen}' is in inappropriate_methods (weight=0) for ${classificationLabel}; ` +
        `FTL primary=${expected}`,
      classification_label: classificationLabel,
    };
  }

  if (secondary.includes(chosen)) {
    return {
      ticker,
      aligned: false,
      expected_method: expected,
      chosen_method: chosen,
      severity: 'low',
      reasoning:
        `chosen '${chosen}' is a secondary (FTL weight<0.15) for ${classificationLabel}; ` +
        `FTL primary=${expected}`,
      classification_label: classificationLabel,
    };
  }

  const w = weights[chosen] ?? 0;
  if (w >= 0.15) {
    return {
      ticker,
      aligned: false,
      expected_method: expected,
      chosen_method: chosen,
      severity: 'medium',
      reasoning:
        `chosen '${chosen}' weight=${w.toFixed(2)} (significant alternative) but FTL primary=${expected}`,
      classification_label: classificationLabel,
    };
  }

  return {
    ticker,
    aligned: false,
    expected_method: expected,
    chosen_method: chosen,
    severity: 'low',
    reasoning:
      `chosen '${chosen}' unrecognised in FTL weights for ${classificationLabel}; FTL primary=${expected}`,
    classification_label: classificationLabel,
  };
}


/** Typed getter — returns null when truth assertions are not populated. */
export function readTruthAssertions(
  accumulatedContext: Record<string, unknown>,
): TruthAssertions | null {
  const v = accumulatedContext[TRUTH_CONTEXT_KEYS.ASSERTIONS];
  if (!v || typeof v !== 'object') return null;
  return v as TruthAssertions;
}

/** Pretty-print FTL state for orchestrator console logs. Side-effect: console.log only. */
export function logTruthLayerSummary(accumulatedContext: Record<string, unknown>): void {
  const a = readTruthAssertions(accumulatedContext);
  if (!a) {
    console.log('[truth-layer] no assertions populated for this session');
    return;
  }
  const c = a.classification;
  const w = a.valuation_methodology;
  const filing = a.filing_selection;
  const subFlags = c.sub_classifications.length > 0 ? ` sub=[${c.sub_classifications.join(',')}]` : '';
  console.log(
    `[truth-layer] ${c.ticker} sector=${c.sector_canonical}${subFlags} ` +
    `holding=${c.is_holding} banking=${c.is_banking} confidence=${c.confidence}`,
  );
  console.log(
    `[truth-layer]   methodology primary=${w.primary_method}, weights=${JSON.stringify(w.weights)}`,
  );
  if (filing?.selected) {
    console.log(
      `[truth-layer]   filing_hint=${filing.selected.filing_id} (type=${filing.selected.document_type}, score=${filing.selected_score})`,
    );
  } else if (filing) {
    console.log(`[truth-layer]   filing_hint: none (${filing.reasoning})`);
  }
}

// =============================================================================
// KAP disclosure adapter
// =============================================================================

/**
 * Map kap_watch's disclosure_inventory items to FilingRecord shape suitable
 * for selectAuthoritativeFiling. Uses category/subcategory + title heuristic
 * for document_type — KAP titles are extremely terse ("Finansal Rapor"),
 * but the cat/subcat pair is the most reliable signal:
 *
 *   cat=FR,  subcat=FR    → konsolide_finansal_rapor   (consolidated financials)
 *   cat=ODA, subcat=FR    → faaliyet_raporu / sorumluluk beyanı (supplementary)
 *   cat=ODA, subcat=ODA   → ozel_durum_aciklamasi (placeholder material disclosure)
 *   cat=ODA, subcat=DG    → schedule / housekeeping (other)
 */
export function kapDisclosuresToFilings(disclosures: unknown[]): FilingRecord[] {
  if (!Array.isArray(disclosures)) return [];
  const out: FilingRecord[] = [];
  for (const raw of disclosures) {
    if (!raw || typeof raw !== 'object') continue;
    const d = raw as Record<string, unknown>;
    const filing_id = String(d['disclosure_id'] ?? '');
    if (!filing_id) continue;
    const title = String(d['title'] ?? '');
    const summary = String(d['summary'] ?? '');
    const category = String(d['category'] ?? '').toUpperCase();
    const subcategory = String(d['subcategory'] ?? '').toUpperCase();
    const filing_date =
      typeof d['published_at'] === 'string' ? (d['published_at'] as string) : null;

    const document_type = inferDocumentType(title, summary, category, subcategory);

    out.push({
      filing_id,
      document_type,
      filing_date,
      period: null,            // KAP inventory doesn't expose period directly
      page_count: null,        // unavailable from inventory
      has_auditor_opinion: /denetim raporu|bağımsız denetim/i.test(title + ' ' + summary)
        || (category === 'FR' && subcategory === 'FR'),  // FR/FR filings carry audit reports
      title,
      payload_size_bytes: null,
    });
  }
  return out;
}

function inferDocumentType(title: string, summary: string, category: string = '', subcategory: string = ''): string {
  const t = (title + ' ' + summary).toLowerCase();

  // 1) KAP cat/subcat is the most reliable signal
  if (category === 'FR' && subcategory === 'FR') return 'konsolide_finansal_rapor';
  if (category === 'ODA' && subcategory === 'FR') {
    // ODA/FR = Faaliyet Raporu or Sorumluluk Beyanı — supplementary reports
    if (/faaliyet/i.test(t)) return 'faaliyet_raporu';
    if (/sorumluluk beyanı/i.test(t)) return 'other';  // sub-report, not standalone
    return 'faaliyet_raporu';
  }
  if (category === 'ODA' && subcategory === 'ODA') return 'ozel_durum_aciklamasi';
  if (category === 'ODA' && subcategory === 'DG') return 'other'; // takvim/duyuru

  // 2) Title heuristic (when cat/subcat absent)
  if (/konsolide.*finansal.*rapor|konsolide.*finansal.*tablo|konsolide.*yıllık.*rapor/i.test(t)) return 'konsolide_finansal_rapor';
  if (/^finansal rapor$/i.test(title.trim())) return 'konsolide_finansal_rapor';  // KAP shorthand
  if (/bağımsız denetim raporu/i.test(t) && /yıllık|fy|annual/i.test(t)) return 'audited_annual_financials';
  if (/faaliyet raporu/i.test(t)) return 'faaliyet_raporu';
  if (/ara dönem.*finansal|interim.*financ/i.test(t)) return 'konsolide_ara_donem_finansal';
  if (/q3|3\.\s*çeyrek|üçüncü çeyrek/i.test(t)) return 'q3_finansal';
  if (/q2|2\.\s*çeyrek|ikinci çeyrek/i.test(t)) return 'q2_finansal';
  if (/q1|1\.\s*çeyrek|birinci çeyrek/i.test(t)) return 'q1_finansal';
  if (/özet finansal/i.test(t)) return 'ozet_finansal';
  if (/yönetim kurulu kararı/i.test(t)) return 'yk_karari';
  if (/özel durum açıklaması/i.test(t)) return 'ozel_durum_aciklamasi';
  return 'other';
}

// =============================================================================
// Internal: extract KAP filings from accumulatedContext
// =============================================================================

function extractKapFilingsFromContext(
  accumulatedContext: Record<string, unknown>,
): FilingRecord[] {
  // Try kap_watch_output first (canonical disclosure inventory)
  const kapRaw = accumulatedContext['kap_watch_output'];
  const parsed = parseUpstreamLoose(kapRaw);
  const inventory =
    (parsed as Record<string, unknown> | null)?.disclosure_inventory;
  if (Array.isArray(inventory)) {
    return kapDisclosuresToFilings(inventory);
  }
  // Future fallback: data_collection_output may also carry filings
  return [];
}

function parseUpstreamLoose(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) {
    try { return JSON.parse(m[1]); } catch { /* swallow */ }
  }
  return null;
}
