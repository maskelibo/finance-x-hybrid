/**
 * compact_summary_pack — top-N insight extractor (Part 2 / Block S, FAZ S10).
 *
 * Built for final_summary sub-agents (S10). Raw upstream agent outputs are
 * 50-100KB JSON blobs each; handing them to a sub-agent inflates the prompt
 * past the 100KB+ band where Sonnet starts hanging. Even with the dispatcher
 * sanitizer truncating per-key strings, many of the truncated bytes are noise
 * (long markdown narratives, raw KAP listings) — the sub-agent only needs
 * the top decisions/insights from each upstream domain.
 *
 * This helper is a domain-aware compactor: it parses each upstream output as
 * JSON when possible, extracts the high-signal items, and returns a small
 * pack (<15KB total) plus a per-sub-agent subset selector so each S10 sub-agent
 * receives only the slice it needs.
 *
 * Parser shape contract (2026-04-25 KCHOL S10 probe):
 *   The parent Python adapter outputs (financial_analysis, valuation_agent,
 *   sector_competition, macro_analysis, event_impact_mapper,
 *   strategic_synthesis) are what land in accumulatedContext. Sub-agent
 *   compile outputs (e.g. eim_quant_mapper.event_impacts) live in the
 *   sub_agent_runs DB table, NOT in accumulatedContext, so this parser
 *   must speak the parent shape. Sub-agent compile field names are kept
 *   as a backward-compat fallback for the future when those compile
 *   outputs may also flow through accumulatedContext.
 *
 * The compactor is deliberately heuristic — if a JSON parse fails or a field
 * is missing, the helper returns an empty array for that category instead of
 * throwing. The downstream sub-agent's prompt should be robust to empty
 * sections (data_gaps[] in output).
 */

export interface InsightItem {
  source_agent: string;
  category: string;
  text: string;
  magnitude_try_mn?: number | null;
  magnitude_pct?: number | null;
  direction?: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence?: 'low' | 'medium' | 'high';
  ref?: string;
}

export interface CitationFact {
  fact: string;
  source: string;
  date?: string | null;
}

export interface CompactSummaryPack {
  ticker: string;
  sector: string | null;
  is_holding: boolean;
  current_price_try?: number | null;
  market_cap_try_mn?: number | null;
  top_financial_insights: InsightItem[];
  top_valuation_outputs: InsightItem[];
  top_sector_findings: InsightItem[];
  top_macro_impacts: InsightItem[];
  top_event_conclusions: InsightItem[];
  unresolved_contradictions: string[];
  citation_sensitive_facts: CitationFact[];
}

export interface PackBuildOptions {
  topFinancialN?: number;       // default 8
  topValuationN?: number;       // default 5
  topSectorN?: number;          // default 6
  topMacroN?: number;           // default 5
  topEventsN?: number;          // default 8
  topCitationsN?: number;       // default 8
}

// Sector override registry mirror (config/sector_registry.yml subset).
// We keep it hard-coded for the holding-detection path because compact pack
// is hot-path per-session — YAML re-parse adds overhead. New holding tickers
// added to sector_registry.yml should be mirrored here.
const HOLDING_TICKERS = new Set(['KCHOL', 'SAHOL', 'DOHOL', 'ENKAI', 'TKFEN']);
const BANKING_TICKERS = new Set(['AKBNK', 'GARAN', 'ISCTR', 'YKBNK', 'HALKB', 'VAKBN']);

export function buildCompactSummaryPack(
  ctx: Record<string, unknown>,
  opts: PackBuildOptions = {},
): CompactSummaryPack {
  const ticker = String(ctx['ticker'] ?? '').toUpperCase();

  const fa = parseUpstream(ctx['financial_analysis_output']);
  const val = parseUpstream(ctx['valuation_agent_output']);
  const sc = parseUpstream(ctx['sector_competition_output']);
  const ma = parseUpstream(ctx['macro_analysis_output']);
  const eim = parseUpstream(ctx['event_impact_mapper_output']);
  const ss = parseUpstream(ctx['strategic_synthesis_output']);
  const qa = parseUpstream(ctx['qa_review_output']);

  // Sector resolution — registry override wins over parent Python adapter
  // default ("industrial"). Falls through to sector_competition / fa output.
  const sector = resolveSector(ticker, ctx, sc, fa, val);
  const isHolding = sector === 'holding';

  return {
    ticker,
    sector,
    is_holding: isHolding,
    current_price_try: numericField(ctx['current_price'] ?? ctx['current_price_try']),
    market_cap_try_mn: numericField(ctx['market_cap_try_mn']),
    top_financial_insights: extractFinancialInsights(fa, opts.topFinancialN ?? 8),
    top_valuation_outputs:  extractValuationInsights(val, opts.topValuationN ?? 5),
    top_sector_findings:    extractSectorInsights(sc, opts.topSectorN ?? 6),
    top_macro_impacts:      extractMacroInsights(ma, opts.topMacroN ?? 5),
    top_event_conclusions:  extractEventInsights(eim, opts.topEventsN ?? 8),
    unresolved_contradictions: extractContradictions(ss, qa),
    citation_sensitive_facts:  extractCitationFacts(fa, val, eim, opts.topCitationsN ?? 8),
  };
}

/**
 * Per-sub-agent subset of the compact pack. Each S10 sub-agent only needs the
 * slice of insights relevant to its job — keeps prompts tight.
 */
export function packForSubAgent(
  subAgentId: string,
  pack: CompactSummaryPack,
): Partial<CompactSummaryPack> {
  const base: Partial<CompactSummaryPack> = {
    ticker: pack.ticker,
    sector: pack.sector,
    is_holding: pack.is_holding,
    current_price_try: pack.current_price_try,
    market_cap_try_mn: pack.market_cap_try_mn,
  };

  switch (subAgentId) {
    case 'fs_executive_summary_writer':
      return {
        ...base,
        top_financial_insights:  pack.top_financial_insights,
        top_valuation_outputs:   pack.top_valuation_outputs,
        top_sector_findings:     pack.top_sector_findings,
        top_macro_impacts:       pack.top_macro_impacts,
        top_event_conclusions:   pack.top_event_conclusions,
        unresolved_contradictions: pack.unresolved_contradictions,
        citation_sensitive_facts:  pack.citation_sensitive_facts,
      };
    case 'fs_scorecard_builder':
      return {
        ...base,
        top_financial_insights: pack.top_financial_insights,
        top_valuation_outputs:  pack.top_valuation_outputs,
        top_sector_findings:    pack.top_sector_findings,
        top_event_conclusions:  pack.top_event_conclusions,
      };
    case 'fs_disclosure_guard':
      return {
        ...base,
        top_event_conclusions:    pack.top_event_conclusions,
        citation_sensitive_facts: pack.citation_sensitive_facts,
      };
    default:
      return pack;
  }
}

// =============================================================================
// Internals
// =============================================================================

type ParsedJson = Record<string, unknown> | unknown[] | null;

function parseUpstream(raw: unknown): ParsedJson {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as ParsedJson;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Try direct JSON parse FIRST — parent Python adapter outputs are pure JSON
  // (often 50KB+). Several adapter outputs (financial_analysis, valuation_agent,
  // macro_analysis, strategic_synthesis) carry an `llm_narrative` field whose
  // string value contains its own ```json``` markdown block; matching the
  // outer fence regex first picks up that INNER fence and fails to parse the
  // escaped content. Direct parse handles the common case in microseconds.
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through to fence fallback */ }
  // Fallback: fenced JSON (sub-agent LLM outputs often wrap in ```json)
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch { /* swallow */ }
  }
  return null;
}

function numericField(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asObj(v: ParsedJson): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function resolveSector(
  ticker: string,
  ctx: Record<string, unknown>,
  sc: ParsedJson,
  fa: ParsedJson,
  val: ParsedJson,
): string | null {
  // 1) Registry override (hard-coded mirror) wins everything.
  if (HOLDING_TICKERS.has(ticker)) return 'holding';
  if (BANKING_TICKERS.has(ticker)) return 'banking';

  // 2) Explicit ctx field set by orchestrator
  const ctxSector = (ctx['sector_override'] as string) ?? (ctx['sector'] as string);
  if (ctxSector && typeof ctxSector === 'string') return ctxSector;

  // 3) Parent adapter sector field (last resort — often "industrial" default)
  for (const src of [sc, fa, val]) {
    const obj = asObj(src);
    if (obj && typeof obj['sector'] === 'string') return obj['sector'] as string;
  }

  return null;
}

// -- Financial ----------------------------------------------------------------

function extractFinancialInsights(fa: ParsedJson, topN: number): InsightItem[] {
  const obj = asObj(fa);
  if (!obj) return [];
  const out: InsightItem[] = [];

  // Parent adapter shape: canonical_numbers is the authoritative metric block.
  const cn = asObj(obj['canonical_numbers'] as ParsedJson);
  if (cn) {
    for (const [key, label] of [
      ['revenue', 'Revenue'],
      ['ebitda_margin', 'EBITDA Margin'],
      ['net_margin', 'Net Margin'],
      ['gross_margin', 'Gross Margin'],
      ['roe', 'ROE'],
      ['net_income', 'Net Income'],
      ['total_equity', 'Total Equity'],
      ['total_assets', 'Total Assets'],
    ] as const) {
      const v = cn[key];
      if (v == null || v === '') continue;
      out.push({
        source_agent: 'financial_analysis',
        category: 'canonical_metric',
        text: `${label}: ${formatMetric(v)}`,
        ref: `canonical_numbers.${key}`,
      });
    }
  }

  // engine_snapshot has computed ratios + scores (Piotroski, Altman, dcf summary).
  const es = asObj(obj['engine_snapshot'] as ParsedJson);
  if (es) {
    const ratios = asObj(es['ratios'] as ParsedJson);
    if (ratios) {
      for (const [key, label] of [
        ['net_debt_to_ebitda', 'Net Debt / EBITDA'],
        ['interest_coverage',  'Interest Coverage'],
        ['current_ratio',      'Current Ratio'],
      ] as const) {
        const v = ratios[key];
        if (v == null) continue;
        out.push({
          source_agent: 'financial_analysis',
          category: 'computed_ratio',
          text: `${label}: ${formatMetric(v)}`,
          ref: `engine_snapshot.ratios.${key}`,
        });
      }
    }
    const scores = asObj(es['scores'] as ParsedJson);
    if (scores) {
      for (const [key, label] of [
        ['piotroski', 'Piotroski Score'],
        ['altman_z',  'Altman Z'],
      ] as const) {
        const v = scores[key];
        if (v == null) continue;
        out.push({
          source_agent: 'financial_analysis',
          category: 'composite_score',
          text: `${label}: ${formatMetric(v)}`,
          ref: `engine_snapshot.scores.${key}`,
        });
      }
    }
  }

  // Red flags (highest signal — every entry top of mind for executive summary)
  const rf = obj['red_flags'];
  if (Array.isArray(rf)) {
    for (const f of rf.slice(0, 3)) {
      out.push({
        source_agent: 'financial_analysis',
        category: 'red_flag',
        text: typeof f === 'string' ? f : (f as { description?: string })?.description ?? JSON.stringify(f).slice(0, 200),
        direction: 'negative',
        confidence: 'high',
      });
    }
  }

  // Backward-compat: legacy/sub-agent compile shape with `metrics` object
  if (out.length === 0) {
    const metrics = asObj(obj['metrics'] as ParsedJson);
    if (metrics) {
      for (const k of ['ebitda_5y_try_mn', 'net_income_5y_try_mn', 'fcf_5y_try_mn']) {
        const v = metrics[k];
        if (v == null) continue;
        out.push({ source_agent: 'financial_analysis', category: 'metric', text: `${k}: ${formatMetric(v)}`, ref: k });
      }
    }
  }

  return out.slice(0, topN);
}

// -- Valuation ----------------------------------------------------------------

function extractValuationInsights(val: ParsedJson, topN: number): InsightItem[] {
  const obj = asObj(val);
  if (!obj) return [];
  const out: InsightItem[] = [];

  // Parent adapter shape: dcf / peer_ev_ebitda / peer_pe (each may be null).
  const dcf = asObj(obj['dcf'] as ParsedJson);
  if (dcf) {
    const target = numericField(dcf['target_price_try'] ?? dcf['fair_value_per_share']);
    if (target != null) {
      out.push({
        source_agent: 'valuation_agent',
        category: 'dcf_target',
        text: `DCF target price: ${target.toFixed(2)} TRY`,
        magnitude_try_mn: target,
        ref: 'dcf.target_price_try',
      });
    }
    const wacc = numericField(dcf['wacc']);
    if (wacc != null) {
      out.push({
        source_agent: 'valuation_agent',
        category: 'dcf_wacc',
        text: `WACC: ${(wacc * 100).toFixed(1)}%`,
        magnitude_pct: wacc * 100,
        ref: 'dcf.wacc',
      });
    }
  }

  // Peer multiples
  for (const [key, label] of [
    ['peer_ev_ebitda', 'Peer EV/EBITDA'],
    ['peer_pe',        'Peer P/E'],
  ] as const) {
    const v = obj[key];
    if (v == null) continue;
    if (typeof v === 'object') {
      const target = numericField((v as Record<string, unknown>)['target_price_try']);
      const median = numericField((v as Record<string, unknown>)['median']);
      if (target != null) {
        out.push({
          source_agent: 'valuation_agent',
          category: key,
          text: `${label} → target ${target.toFixed(2)} TRY${median != null ? ` (median ${median.toFixed(2)})` : ''}`,
          magnitude_try_mn: target,
          ref: key,
        });
      } else if (median != null) {
        out.push({
          source_agent: 'valuation_agent',
          category: key,
          text: `${label} median: ${median.toFixed(2)}`,
          ref: key,
        });
      }
    } else if (typeof v === 'number') {
      out.push({ source_agent: 'valuation_agent', category: key, text: `${label}: ${v.toFixed(2)}`, ref: key });
    }
  }

  // Warnings — TRY WACC + banking + holding SOTP missing
  if (obj['try_wacc_warning'] === true) {
    out.push({ source_agent: 'valuation_agent', category: 'warning', text: 'TRY WACC risk flag set — DCF assumptions sensitive to TL volatility.', direction: 'negative', confidence: 'high', ref: 'try_wacc_warning' });
  }
  if (obj['holding_sotp_required'] === true) {
    out.push({ source_agent: 'valuation_agent', category: 'warning', text: 'Holding SOTP missing — DCF/multiples alone undervalue NAV breakdown.', direction: 'neutral', confidence: 'high', ref: 'holding_sotp_required' });
  }
  if (obj['banking_sector_warning'] === true) {
    out.push({ source_agent: 'valuation_agent', category: 'warning', text: 'Banking sector — P/B + ROE preferred over EV/EBITDA.', direction: 'neutral', confidence: 'high', ref: 'banking_sector_warning' });
  }

  // Backward-compat sub-agent compile: composite_target_price_try
  if (out.length === 0) {
    const composite = numericField(obj['composite_target_price_try']);
    if (composite != null) {
      out.push({ source_agent: 'valuation_agent', category: 'composite_target', text: `Composite target: ${composite.toFixed(2)} TRY`, magnitude_try_mn: composite, ref: 'composite_target_price_try' });
    }
  }

  return out.slice(0, topN);
}

// -- Sector -------------------------------------------------------------------

function extractSectorInsights(sc: ParsedJson, topN: number): InsightItem[] {
  const obj = asObj(sc);
  if (!obj) return [];
  const out: InsightItem[] = [];

  // Parent adapter shape: benchmarks[] is the rich field.
  const benchmarks = obj['benchmarks'];
  if (Array.isArray(benchmarks)) {
    // Score-rank benchmarks: prefer ones with company_value present + clear
    // delta vs sector median; surface the 3-4 most decisive.
    const ranked = benchmarks
      .filter((b: any) => b && b.company_value != null && b.label)
      .map((b: any) => {
        const median = numericField(b.median_value ?? b.sector_median);
        const cv = numericField(b.company_value);
        const delta = (median != null && cv != null) ? Math.abs(cv - median) / Math.max(1, Math.abs(median)) : 0;
        return { b, delta };
      })
      .sort((a, b) => b.delta - a.delta);
    for (const { b } of ranked.slice(0, Math.min(4, topN - out.length))) {
      const cv = numericField(b.company_value);
      const median = numericField(b.median_value ?? b.sector_median);
      const higher = b.higher_is_better === true;
      const direction: 'positive' | 'negative' | 'neutral' =
        cv != null && median != null
          ? (higher === (cv > median) ? 'positive' : 'negative')
          : 'neutral';
      out.push({
        source_agent: 'sector_competition',
        category: 'benchmark',
        text: `${b.label} ${b.unit ?? ''}: company ${formatMetric(cv)} vs sector median ${formatMetric(median)}`,
        direction,
        ref: b.metric_code,
      });
    }
  }

  // Strengths / weaknesses (legacy adapter format, often empty)
  for (const [field, dir] of [['strengths', 'positive'], ['weaknesses', 'negative']] as const) {
    const arr = obj[field];
    if (Array.isArray(arr)) {
      for (const item of arr.slice(0, 2)) {
        out.push({
          source_agent: 'sector_competition',
          category: field,
          text: typeof item === 'string' ? item : JSON.stringify(item).slice(0, 200),
          direction: dir as 'positive' | 'negative',
        });
      }
    }
  }

  // Peer count signal
  const peerGroup = obj['peer_group'];
  if (Array.isArray(peerGroup) && peerGroup.length > 0) {
    out.push({
      source_agent: 'sector_competition',
      category: 'peer_set',
      text: `Peer set (${peerGroup.length}): ${peerGroup.slice(0, 6).map((p: any) => typeof p === 'string' ? p : p?.ticker ?? '?').join(', ')}`,
      ref: 'peer_group',
    });
  }

  return out.slice(0, topN);
}

// -- Macro --------------------------------------------------------------------

function extractMacroInsights(ma: ParsedJson, topN: number): InsightItem[] {
  const obj = asObj(ma);
  if (!obj) return [];
  const out: InsightItem[] = [];

  // Parent adapter shape: rates / inflation / fx / growth / equity (each tiny obj).
  const rates = asObj(obj['rates'] as ParsedJson);
  if (rates) {
    const policy = numericField(rates['policy_rate']);
    if (policy != null) {
      out.push({ source_agent: 'macro_analysis', category: 'policy_rate', text: `TCMB policy rate: ${policy.toFixed(2)}%`, magnitude_pct: policy, ref: 'rates.policy_rate' });
    }
  }
  const inflation = asObj(obj['inflation'] as ParsedJson);
  if (inflation) {
    const cpi = numericField(inflation['cpi_yoy']);
    if (cpi != null) {
      out.push({ source_agent: 'macro_analysis', category: 'inflation', text: `CPI YoY: ${cpi.toFixed(2)}%`, magnitude_pct: cpi, direction: cpi > 30 ? 'negative' : 'neutral', ref: 'inflation.cpi_yoy' });
    }
  }
  const fx = asObj(obj['fx'] as ParsedJson);
  if (fx) {
    const usd = numericField(fx['usd_try']);
    if (usd != null) {
      out.push({ source_agent: 'macro_analysis', category: 'fx', text: `USD/TRY: ${usd.toFixed(2)}`, magnitude_try_mn: usd, ref: 'fx.usd_try' });
    }
  }
  const growth = asObj(obj['growth'] as ParsedJson);
  if (growth) {
    const gdp = numericField(growth['gdp_yoy']);
    if (gdp != null) {
      out.push({ source_agent: 'macro_analysis', category: 'growth', text: `GDP YoY: ${gdp.toFixed(2)}%`, magnitude_pct: gdp, direction: gdp > 0 ? 'positive' : 'negative', ref: 'growth.gdp_yoy' });
    }
  }
  const equity = asObj(obj['equity'] as ParsedJson);
  if (equity) {
    const ytd = numericField(equity['bist100_ytd_return']);
    if (ytd != null) {
      out.push({ source_agent: 'macro_analysis', category: 'equity', text: `BIST100 YTD: ${ytd.toFixed(2)}%`, magnitude_pct: ytd, direction: ytd > 0 ? 'positive' : 'negative', ref: 'equity.bist100_ytd_return' });
    }
  }

  // Backward-compat sub-agent compile: ma_company_transmission
  if (out.length === 0) {
    const ct = asObj(obj['ma_company_transmission'] as ParsedJson);
    const transmission = asObj(ct?.['transmission'] as ParsedJson);
    if (transmission) {
      for (const axis of ['fx_exposure', 'commodity_sensitivity', 'interest_rate_impact', 'demand_elasticity']) {
        const node = asObj(transmission[axis] as ParsedJson);
        if (!node) continue;
        const score = numericField(node['score']);
        const rationale = String(node['rationale'] ?? '');
        if (rationale) {
          out.push({ source_agent: 'macro_analysis', category: axis, text: `${axis}: ${rationale.slice(0, 200)}`, magnitude_pct: score });
        }
      }
    }
  }

  return out.slice(0, topN);
}

// -- Events -------------------------------------------------------------------

function extractEventInsights(eim: ParsedJson, topN: number): InsightItem[] {
  const obj = asObj(eim);
  if (!obj) return [];
  const out: InsightItem[] = [];

  // Parent adapter shape: event_impacts[] is a flat array of {event_id,
  // event_type, event_summary, disclosure_reference, affected_statements,
  // affected_line_items, ...}. Material flag heuristics: events with
  // affected_statements non-empty + non-routine event_type rank highest.
  const events = obj['event_impacts'];
  if (Array.isArray(events) && events.length > 0) {
    const ranked = events
      .map((e: any) => {
        const stmts = Array.isArray(e?.affected_statements) ? e.affected_statements.length : 0;
        const lineItems = Array.isArray(e?.affected_line_items) ? e.affected_line_items.length : 0;
        const isRoutine = /(genel kurul|yıllık|faaliyet raporu|olağan)/i.test(String(e?.event_type ?? '') + String(e?.event_summary ?? ''));
        // Materiality score: line item count + statement breadth, with routine penalty.
        const score = lineItems * 2 + stmts - (isRoutine ? 10 : 0);
        return { e, score, isRoutine };
      })
      .filter((x) => !x.isRoutine || x.score > -5)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
    for (const { e } of ranked) {
      out.push({
        source_agent: 'event_impact_mapper',
        category: e?.event_type ?? 'event',
        text: e?.event_summary ?? '',
        ref: e?.event_id,
      });
    }
  }

  // Backward-compat sub-agent compile: eim_quant_mapper.event_impacts
  if (out.length === 0) {
    const quant = asObj(obj['eim_quant_mapper'] as ParsedJson);
    const impacts = quant?.['event_impacts'];
    if (Array.isArray(impacts)) {
      const scored = impacts
        .map((e: any) => ({ e, magnitude: Math.abs(numericField(e?.estimated_impact?.magnitude_try_mn) ?? 0) }))
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, topN);
      for (const { e } of scored) {
        out.push({
          source_agent: 'event_impact_mapper',
          category: 'event',
          text: e.event_summary ?? 'event',
          magnitude_try_mn: numericField(e?.estimated_impact?.magnitude_try_mn),
          direction: e?.estimated_impact?.direction,
          confidence: e?.estimated_impact?.confidence,
          ref: e.event_id,
        });
      }
    }
  }
  return out;
}

// -- Contradictions -----------------------------------------------------------

function extractContradictions(ss: ParsedJson, qa: ParsedJson): string[] {
  const out: string[] = [];

  // Parent adapter shape: strategic_synthesis.divergences[] + signals contrast
  const ssObj = asObj(ss);
  if (ssObj) {
    const divs = ssObj['divergences'];
    if (Array.isArray(divs)) {
      for (const d of divs.slice(0, 5)) {
        out.push(typeof d === 'string' ? d : JSON.stringify(d).slice(0, 250));
      }
    }
    // Signal cross-check: positive vs negative count contrast can flag
    // unresolved tension when both are non-trivial.
    const signals = asObj(ssObj['signals'] as ParsedJson);
    if (signals && out.length === 0) {
      const pos = Array.isArray(signals['positive']) ? signals['positive'].length : 0;
      const neg = Array.isArray(signals['negative']) ? signals['negative'].length : 0;
      if (pos > 0 && neg > 0 && Math.min(pos, neg) >= 2) {
        out.push(`Signal tension: ${pos} positive vs ${neg} negative — verify thesis convergence.`);
      }
    }
    // Backward-compat: ss_contradiction_flag.contradictions
    if (out.length === 0) {
      const cf = asObj(ssObj['ss_contradiction_flag'] as ParsedJson);
      const c = cf?.['contradictions'];
      if (Array.isArray(c)) {
        for (const item of c.slice(0, 5)) {
          out.push(typeof item === 'string' ? item : JSON.stringify(item).slice(0, 250));
        }
      }
    }
  }

  // QA review flags (cross-cutting concerns)
  const qaObj = asObj(qa);
  if (qaObj) {
    const flags = qaObj['flags'];
    if (Array.isArray(flags)) {
      for (const f of flags.slice(0, 3)) {
        const text = typeof f === 'string' ? f : (f as { description?: string })?.description ?? JSON.stringify(f).slice(0, 200);
        if (text && !out.includes(text)) out.push(`QA flag: ${text}`);
      }
    }
  }

  return out;
}

// -- Citations ----------------------------------------------------------------

function extractCitationFacts(fa: ParsedJson, val: ParsedJson, eim: ParsedJson, topN: number): CitationFact[] {
  const out: CitationFact[] = [];

  // FA canonical_numbers — the numbers that need a source in the report.
  const faObj = asObj(fa);
  const cn = asObj(faObj?.['canonical_numbers'] as ParsedJson);
  if (cn) {
    for (const k of ['revenue', 'net_income', 'total_equity', 'total_assets']) {
      const v = cn[k];
      if (v == null) continue;
      out.push({
        fact: `${k} = ${formatMetric(v).slice(0, 100)}`,
        source: 'financial_analysis (canonical_numbers, FY consolidated)',
      });
    }
  }

  // Valuation DCF target / WACC assumption snapshot
  const valObj = asObj(val);
  if (valObj) {
    const dcf = asObj(valObj['dcf'] as ParsedJson);
    if (dcf) {
      const target = numericField(dcf['target_price_try'] ?? dcf['fair_value_per_share']);
      if (target != null) {
        out.push({ fact: `DCF target = ${target.toFixed(2)} TRY`, source: 'valuation_agent.dcf' });
      }
    }
    const composite = numericField(valObj['composite_target_price_try']);
    if (composite != null) {
      out.push({ fact: `composite target = ${composite.toFixed(2)} TRY`, source: 'valuation_agent (Bear/Base/Bull blended)' });
    }
  }

  // Material event citations — surface top N by line item breadth
  const eimObj = asObj(eim);
  const events = eimObj?.['event_impacts'];
  if (Array.isArray(events)) {
    const material = events
      .filter((e: any) => Array.isArray(e?.affected_line_items) && e.affected_line_items.length > 0)
      .slice(0, 3);
    for (const e of material as any[]) {
      out.push({
        fact: e.event_summary ?? '(unnamed event)',
        source: e.disclosure_reference
          ? `KAP / ${e.disclosure_reference}`
          : `event_impact_mapper (${e.event_id ?? '?'})`,
        date: e.event_date ?? null,
      });
    }
  }

  return out.slice(0, topN);
}

function formatMetric(v: unknown): string {
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(2) + 'K';
    return v.toFixed(2);
  }
  if (Array.isArray(v)) return v.slice(-1).map((x) => (typeof x === 'number' ? x.toFixed(2) : String(x))).join('') || '[]';
  if (typeof v === 'object' && v !== null) {
    const obj = v as Record<string, unknown>;
    const last = obj['ttm'] ?? obj['latest'] ?? obj['2025'] ?? obj['2024'];
    if (last != null) return typeof last === 'number' ? last.toFixed(2) : String(last);
    return JSON.stringify(v).slice(0, 100);
  }
  return String(v);
}
