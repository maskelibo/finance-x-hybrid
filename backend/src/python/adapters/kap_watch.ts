/**
 * kap_watch adapter — Python KapEvents → legacy disclosure_inventory.
 *
 * No input adapter needed; Python runner goes to KAP directly.
 * Downstream agent (event_classification) expects a flat disclosure
 * list — this adapter flattens while preserving Python's rule-based
 * pre-classification so the LLM classifier only has to refine.
 */

export interface PythonKapEvent {
  disclosure_id: string;
  ticker: string;
  announced_at: string;
  title: string;
  url: string;
  category?: string | null;
  subcategory?: string | null;
  summary?: string | null;
  full_text?: string | null;
  event_type?: string | null;
  classification_confidence?: string;
  is_material?: boolean | null;
  quantitative_impact_try?: string | null;
  impact_pct_revenue?: string | null;
  impact_pct_equity?: string | null;
}

export interface PythonKapEvents {
  events?: PythonKapEvent[];
  window_start?: string | null;
  window_end?: string | null;
}

export interface LegacyDisclosureEntry {
  disclosure_id: string;
  ticker: string;
  published_at: string;
  title: string;
  url: string;
  category: string | null;
  subcategory: string | null;
  summary: string | null;
  event_type_hint: string | null;
  confidence_hint: string;
  is_material: boolean | null;
  quantitative_impact_try: string | null;
}

export interface LegacyKapWatchOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  monitoring_window: {
    start: string | null;
    end: string | null;
  };
  disclosure_inventory: LegacyDisclosureEntry[];
  disclosure_count: number;
  material_count: number;
  review_status: string;
  warnings: string[];
}


export function adaptPythonKapForLegacy(
  py: PythonKapEvents,
  ticker: string,
  outputId: string,
): LegacyKapWatchOutput {
  const events = py.events ?? [];

  const disclosure_inventory: LegacyDisclosureEntry[] = events.map(e => ({
    disclosure_id: e.disclosure_id,
    ticker: (e.ticker || ticker).toUpperCase(),
    published_at: e.announced_at,
    title: e.title,
    url: e.url,
    category: e.category ?? null,
    subcategory: e.subcategory ?? null,
    summary: e.summary ?? null,
    event_type_hint: e.event_type ?? null,
    confidence_hint: (e.classification_confidence ?? 'unknown').toLowerCase(),
    is_material: e.is_material ?? null,
    quantitative_impact_try: e.quantitative_impact_try ?? null,
  }));

  const material_count = disclosure_inventory.filter(d => d.is_material === true).length;

  return {
    agent_id: 'kap_watch',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    monitoring_window: {
      start: py.window_start ?? null,
      end: py.window_end ?? null,
    },
    disclosure_inventory,
    disclosure_count: disclosure_inventory.length,
    material_count,
    review_status: 'pending_ceo_review',
    warnings: disclosure_inventory.length === 0
      ? ['No disclosures returned in the window — check KAP connectivity or widen --since.']
      : [],
  };
}
