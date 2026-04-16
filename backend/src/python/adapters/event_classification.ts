/**
 * event_classification adapter — reads kap_watch output (which already
 * carries rule-based event_type hints from the Python kap_disclosure
 * classifier) and reshapes into the legacy event_classification agent
 * output shape. No Python CLI call here; the classification is already
 * done upstream.
 */

export interface LegacyClassifiedEvent {
  disclosure_id: string;
  ticker: string;
  announced_at: string;
  title: string;
  url: string;
  primary_type: string;
  secondary_types: string[];
  classification_confidence: string;
  is_material: boolean | null;
  source_url: string;
  // Carried through from kap_watch when the rule-based classifier
  // extracted an explicit TRY figure (dividend amount, contract value,
  // capex size, etc.). event_impact_mapper turns this into
  // quantification_possible=true.
  quantitative_impact_try: number | string | null;
}

export interface LegacyEventClassificationOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  classified_events: LegacyClassifiedEvent[];
  unclassified_list: string[];
  ambiguous_list: string[];
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  warnings: string[];
  review_status: string;
}


/** Accept either the legacy kap_watch output or the Python-adapted one. */
export interface UpstreamDisclosure {
  disclosure_id: string;
  ticker?: string;
  published_at?: string;
  announced_at?: string;
  title: string;
  url: string;
  event_type_hint?: string | null;
  confidence_hint?: string;
  is_material?: boolean | null;
  quantitative_impact_try?: number | string | null;
}


export function adaptDisclosuresToClassification(
  disclosures: UpstreamDisclosure[],
  ticker: string,
  outputId: string,
): LegacyEventClassificationOutput {
  const classified: LegacyClassifiedEvent[] = [];
  const unclassified: string[] = [];
  const ambiguous: string[] = [];
  let high = 0, medium = 0, low = 0;

  for (const d of disclosures) {
    const primary = d.event_type_hint ?? 'other';
    const confidence = (d.confidence_hint ?? 'unknown').toLowerCase();

    if (primary === 'other' || confidence === 'low') unclassified.push(d.disclosure_id);
    if (confidence === 'medium') ambiguous.push(d.disclosure_id);

    if (confidence === 'high') high += 1;
    else if (confidence === 'medium') medium += 1;
    else low += 1;

    classified.push({
      disclosure_id: d.disclosure_id,
      ticker: (d.ticker || ticker).toUpperCase(),
      announced_at: d.announced_at || d.published_at || 'unknown',
      title: d.title,
      url: d.url,
      primary_type: primary,
      secondary_types: [],
      classification_confidence: confidence,
      is_material: d.is_material ?? null,
      source_url: d.url,
      quantitative_impact_try: d.quantitative_impact_try ?? null,
    });
  }

  const warnings: string[] = [];
  if (low > classified.length * 0.6) {
    warnings.push(`${low}/${classified.length} disclosures landed at LOW confidence — LLM refinement recommended.`);
  }

  return {
    agent_id: 'event_classification',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    classified_events: classified,
    unclassified_list: unclassified,
    ambiguous_list: ambiguous,
    high_confidence_count: high,
    medium_confidence_count: medium,
    low_confidence_count: low,
    warnings,
    review_status: 'pending_ceo_review',
  };
}


export function extractDisclosuresFromUpstream(upstream: unknown): UpstreamDisclosure[] {
  let parsed: unknown = upstream;
  if (typeof upstream === 'string') {
    try { parsed = JSON.parse(upstream); } catch { return []; }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const obj = parsed as Record<string, unknown>;
  // Python-adapted shape: disclosure_inventory: [...]
  if (Array.isArray(obj.disclosure_inventory)) {
    return obj.disclosure_inventory as UpstreamDisclosure[];
  }
  // Legacy LLM shape sometimes uses `events` or `disclosures`
  if (Array.isArray(obj.events)) return obj.events as UpstreamDisclosure[];
  if (Array.isArray(obj.disclosures)) return obj.disclosures as UpstreamDisclosure[];
  return [];
}
