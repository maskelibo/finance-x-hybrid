/**
 * event_impact_mapper adapter — reads event_classification output
 * (classified_events[]) and projects each event onto a deterministic
 * impact template table (ported from
 * python-services/src/financex/calculators/event_impact_mapper.py).
 *
 * Geopolitics / macro cascade narratives stay with the LLM — this
 * layer only emits statement/line_item/direction/timing scaffolding
 * plus quantitative_impact_try when the upstream classifier carried
 * an explicit number.
 */

export interface UpstreamClassifiedEvent {
  disclosure_id: string;
  ticker?: string;
  announced_at?: string;
  title?: string;
  url?: string;
  primary_type?: string;
  secondary_types?: string[];
  classification_confidence?: string;
  is_material?: boolean | null;
  source_url?: string;
  quantitative_impact_try?: number | string | null;
}


export interface LegacyEventImpact {
  event_id: string;
  event_type: string;
  event_summary: string;
  disclosure_reference: string;
  affected_statements: string[];
  affected_line_items: string[];
  impact_direction: 'positive' | 'negative' | 'mixed' | 'uncertain' | 'neutral';
  timing_horizon: 'immediate' | 'near_term' | 'medium_term' | 'long_term';
  confidence: 'high' | 'medium' | 'low' | 'speculative';
  effect_type: 'confirmed' | 'plausible' | 'speculative';
  quantification_possible: boolean;
  quantification_estimate: { total_try: number } | null;
  quantification_notes: string;
  secondary_effects: Array<{ effect: string; direction: string; confidence: string }>;
  risks: string[];
  evidence_refs: string[];
  warnings: string[];
}


export interface LegacyEventImpactOutput {
  agent_id: string;
  output_id: string;
  session_id: string | null;
  task_id: string | null;
  timestamp: string;
  company: { name: string; ticker: string };
  events_processed: number;
  events_requiring_full_mapping: number;
  routine_filings_noted: number;
  event_impacts: LegacyEventImpact[];
  portfolio_impact_summary: string;
  confidence_overall: 'high' | 'medium' | 'low';
  warnings: string[];
  missing_inputs: string[];
  review_status: string;
  source: 'python';
}


interface ImpactTemplate {
  affected_statements: string[];
  direction: LegacyEventImpact['impact_direction'];
  timing: 'immediate' | 'near' | 'medium' | 'long';
  affected_line_items: string[];
}

// Mirrors python-services/src/financex/calculators/event_impact_mapper.py::_IMPACT_TEMPLATES.
// Keep the two tables in sync — if you edit one, edit the other.
const IMPACT_TEMPLATES: Record<string, ImpactTemplate> = {
  dividend: {
    affected_statements: ['CF', 'BS'],
    direction: 'negative',
    timing: 'immediate',
    affected_line_items: ['dividends_paid', 'cash', 'retained_earnings'],
  },
  capital_action: {
    affected_statements: ['BS', 'CF'],
    direction: 'positive',
    timing: 'near',
    affected_line_items: ['paid_in_capital', 'cash', 'share_count'],
  },
  debt_issuance: {
    affected_statements: ['BS', 'CF', 'P&L'],
    direction: 'mixed',
    timing: 'immediate',
    affected_line_items: ['long_term_debt', 'cash', 'financial_expense'],
  },
  capex_decision: {
    affected_statements: ['BS', 'CF', 'P&L'],
    direction: 'mixed',
    timing: 'medium',
    affected_line_items: ['ppe_net', 'capex', 'depreciation_amortization'],
  },
  management_change: {
    affected_statements: ['P&L'],
    direction: 'uncertain',
    timing: 'near',
    affected_line_items: ['opex'],
  },
  governance: {
    affected_statements: ['BS'],
    direction: 'uncertain',
    timing: 'near',
    affected_line_items: ['equity'],
  },
  m_and_a: {
    affected_statements: ['BS', 'P&L', 'CF'],
    direction: 'mixed',
    timing: 'medium',
    affected_line_items: ['goodwill', 'revenue', 'investing_cash_flow'],
  },
  buyback: {
    affected_statements: ['BS', 'CF'],
    direction: 'negative',
    timing: 'immediate',
    affected_line_items: ['treasury_shares', 'cash', 'eps'],
  },
  rating_change: {
    affected_statements: ['P&L'],
    direction: 'mixed',
    timing: 'medium',
    affected_line_items: ['financial_expense'],
  },
  production_halt: {
    affected_statements: ['P&L'],
    direction: 'negative',
    timing: 'immediate',
    affected_line_items: ['revenue', 'gross_profit'],
  },
  new_contract: {
    affected_statements: ['P&L'],
    direction: 'positive',
    timing: 'medium',
    affected_line_items: ['revenue', 'backlog'],
  },
  litigation: {
    affected_statements: ['P&L', 'BS'],
    direction: 'negative',
    timing: 'long',
    affected_line_items: ['provisions', 'other_expense'],
  },
  guidance: {
    affected_statements: ['P&L'],
    direction: 'uncertain',
    timing: 'near',
    affected_line_items: ['revenue', 'ebitda'],
  },
  regulatory: {
    affected_statements: ['P&L'],
    direction: 'uncertain',
    timing: 'near',
    affected_line_items: ['revenue', 'cost_of_sales'],
  },
  macro_event: {
    affected_statements: ['P&L', 'BS'],
    direction: 'uncertain',
    timing: 'medium',
    affected_line_items: ['financial_expense', 'fx_impact'],
  },
  other: {
    affected_statements: ['P&L'],
    direction: 'uncertain',
    timing: 'medium',
    affected_line_items: [],
  },
};


const TIMING_TO_HORIZON: Record<ImpactTemplate['timing'], LegacyEventImpact['timing_horizon']> = {
  immediate: 'immediate',
  near: 'near_term',
  medium: 'medium_term',
  long: 'long_term',
};


function normalizeConfidence(raw: unknown): LegacyEventImpact['confidence'] {
  const s = String(raw ?? '').toLowerCase();
  if (s === 'high' || s === 'medium' || s === 'low' || s === 'speculative') return s;
  return 'low';
}


function normalizeQuant(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


export function extractClassifiedEventsFromUpstream(upstream: unknown): UpstreamClassifiedEvent[] {
  let parsed: unknown = upstream;
  if (typeof upstream === 'string') {
    try { parsed = JSON.parse(upstream); } catch { return []; }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.classified_events)) return obj.classified_events as UpstreamClassifiedEvent[];
  // Legacy/alternate shapes: event_classification LLM output variants
  if (Array.isArray(obj.events)) return obj.events as UpstreamClassifiedEvent[];
  if (Array.isArray(obj.classified)) return obj.classified as UpstreamClassifiedEvent[];
  return [];
}


export function adaptClassifiedToImpacts(
  classified: UpstreamClassifiedEvent[],
  ticker: string,
  outputId: string,
  sessionId: string | null = null,
  taskId: string | null = null,
): LegacyEventImpactOutput {
  const impacts: LegacyEventImpact[] = [];
  let quantifiable = 0;
  let routine = 0;

  for (const ev of classified) {
    const primary = (ev.primary_type ?? 'other').toLowerCase();
    const tmpl = IMPACT_TEMPLATES[primary] ?? IMPACT_TEMPLATES.other;
    const confidence = normalizeConfidence(ev.classification_confidence);
    const quant = normalizeQuant(ev.quantitative_impact_try);

    const isRoutine = primary === 'other' || tmpl.affected_statements.length === 0;
    if (isRoutine) routine += 1;
    if (quant != null) quantifiable += 1;

    impacts.push({
      event_id: `eim-${ev.disclosure_id}`,
      event_type: primary,
      event_summary: ev.title ?? '',
      disclosure_reference: ev.disclosure_id,
      affected_statements: tmpl.affected_statements,
      affected_line_items: tmpl.affected_line_items,
      impact_direction: tmpl.direction,
      timing_horizon: TIMING_TO_HORIZON[tmpl.timing],
      confidence,
      effect_type: confidence === 'high' ? 'confirmed' : confidence === 'medium' ? 'plausible' : 'speculative',
      quantification_possible: quant != null,
      quantification_estimate: quant != null ? { total_try: quant } : null,
      quantification_notes: quant != null
        ? `Upstream disclosure carried explicit TRY figure: ${quant.toLocaleString('en-US')} TRY`
        : 'Python template routing only — LLM layer may refine magnitude from parsed financials',
      secondary_effects: [],
      risks: [],
      evidence_refs: ev.url ? [ev.url] : [],
      warnings: [],
    });
  }

  const warnings: string[] = [];
  if (classified.length === 0) warnings.push('No classified events reached event_impact_mapper');
  if (classified.length > 0 && quantifiable === 0) {
    warnings.push('No disclosures carried quantitative_impact_try — LLM layer should attempt magnitude sizing');
  }

  const directMapped = impacts.length - routine;
  const confidenceOverall: LegacyEventImpactOutput['confidence_overall'] =
    impacts.length === 0 ? 'low' : directMapped / impacts.length >= 0.6 ? 'medium' : 'low';

  return {
    agent_id: 'event_impact_mapper',
    output_id: outputId,
    session_id: sessionId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    company: { name: ticker.toUpperCase(), ticker: ticker.toUpperCase() },
    events_processed: impacts.length,
    events_requiring_full_mapping: directMapped,
    routine_filings_noted: routine,
    event_impacts: impacts,
    portfolio_impact_summary: impacts.length === 0
      ? 'No events in window.'
      : `${directMapped}/${impacts.length} events mapped to statement-level impacts via Python templates; ${routine} routine filings.`,
    confidence_overall: confidenceOverall,
    warnings,
    missing_inputs: [],
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
