/**
 * Build the deterministic template context from accumulatedContext.
 *
 * Reads every upstream agent output (Python-adapter or LLM leniently
 * parsed) and maps them onto the 12-section template.html. Narrative
 * blocks auto-extracted from final_summary / strategic_synthesis /
 * valuation / context_extraction via llm_narrative.ts — no extra LLM
 * calls.
 *
 * Section coverage (matches EREGL / KCHOL reference standard):
 *   I.   Yönetici Özeti — skor kartı, kritik bulgular, güçlü/zayıf
 *   II.  Şirket Profili — kurumsal özet, segment
 *   III. Finansal Analiz — bilanço, gelir tablosu, nakit akış, ratios
 *   IV.  Değerleme — DCF, emsal çarpan, senaryolar, analist konsensüs
 *   V.   Sektör & Rekabet — benchmark, SWOT
 *   VI.  Makro — TCMB, FX, politika faizi, transmisyon
 *   VII. Teknik — trend, RSI, S/R
 *   VIII.ESG — CBAM/ETS karbon maliyeti
 *   IX.  Haber & Sentiment — skor, dağılım
 *   X.   KAP Olayları — etki analizi
 *   XI.  Risk — faktörler, ısı haritası
 *   XII. Sonuç — yatırım tezi, katalizörler, metodoloji
 */

import { buildNarrativeBlocks } from './llm_narrative.js';
import { formatPct, formatRatio, formatTRY, type TemplateContext, type TemplateValue } from './template_engine.js';


function parseJson<T = unknown>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}


function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


interface ComposeInputs {
  ticker: string;
  reportId: string;
  accumulatedContext: Record<string, unknown>;
  narrativeBlocks?: Record<string, string>;
}


const SECTOR_LABEL_TR: Record<string, string> = {
  industrial: 'Sanayi',
  banking: 'Bankacılık',
  holding: 'Holding',
  insurance: 'Sigorta',
  reit: 'GYO',
};


export function composeReportContext(inputs: ComposeInputs): TemplateContext {
  const { ticker, reportId, accumulatedContext, narrativeBlocks: explicitBlocks } = inputs;
  const ctx = accumulatedContext;

  // ----- Extract upstream outputs -----

  const fa = parseJson<Record<string, unknown>>(ctx['financial_analysis_output']);
  const rec = parseJson<Record<string, unknown>>(ctx['reconciliation_output']);
  const qa = parseJson<Record<string, unknown>>(ctx['qa_review_output']);
  const ss = parseJson<Record<string, unknown>>(ctx['strategic_synthesis_output']);
  const val = parseJson<Record<string, unknown>>(ctx['valuation_agent_output']);
  const sc = parseJson<Record<string, unknown>>(ctx['sector_competition_output']);
  const ev = parseJson<Record<string, unknown>>(ctx['event_impact_mapper_output']);
  const tech = parseJson<Record<string, unknown>>(ctx['technical_analysis_output']);
  const macro = parseJson<Record<string, unknown>>(ctx['macro_analysis_output']);
  const esgOut = parseJson<Record<string, unknown>>(ctx['esg_agent_output']);
  const news = parseJson<Record<string, unknown>>(ctx['sentiment_news_agent_output']);
  const ac = parseJson<Record<string, unknown>>(ctx['analyst_consensus_agent_output']);
  const parsed = parseJson<Record<string, unknown>>(ctx['parse_standardization_output']);

  // ----- Auto-extract narrative blocks via llm_narrative.ts -----

  const extracted = buildNarrativeBlocks({
    final_summary: ctx['final_summary_output'],
    strategic_synthesis: ctx['strategic_synthesis_output'],
    valuation_agent: ctx['valuation_agent_output'],
    context_extraction: ctx['context_extraction_output'],
    ceo: ctx['ceo_output'],
  });
  const narrativeBlocks = { ...extracted, ...(explicitBlocks ?? {}) };

  // ----- I. Yönetici Özeti -----

  const highlights = arrayFrom(fa?.highlights ?? fa?.metrics ?? []).slice(0, 10).map(h => ({
    label: String(h.label ?? h.code ?? ''),
    value_formatted: formatValueByCode(String(h.code ?? ''), h.value),
    narrative_hint: String(h.narrative_hint ?? ''),
  }));

  const recChecks = arrayFrom(rec?.checks ?? rec?.check_results ?? []);
  const recTotal = Number(rec?.check_count ?? recChecks.length);
  const recPassed = Number(rec?.passed_count ?? recChecks.filter((c: Record<string, unknown>) => c.passed).length);
  const recPassRate = recTotal > 0 ? recPassed / recTotal : 0;

  const criticalFindings: string[] = [
    ...arrayFrom(fa?.red_flags ?? [])
      .filter((f: Record<string, unknown>) => String(f.severity ?? '').toLowerCase() === 'critical')
      .map((f: Record<string, unknown>) => String(f.message ?? f.code ?? '')),
    ...arrayFrom(ss?.divergences ?? []).map(String),
    ...arrayFrom(qa?.quality_flags ?? []).slice(0, 3).map(String),
  ].filter(Boolean).slice(0, 6);

  const signalBuckets = (ss?.signals ?? {}) as { positive?: unknown[]; negative?: unknown[]; neutral?: unknown[] };
  const strengths: string[] = arrayFrom(signalBuckets.positive)
    .slice(0, 5)
    .map((s: Record<string, unknown>) => String(s.label ?? ''));
  const weaknesses: string[] = arrayFrom(signalBuckets.negative)
    .slice(0, 5)
    .map((s: Record<string, unknown>) => String(s.label ?? ''));

  // ----- II. Şirket Profili -----

  const companyHighlights: Array<{ label: string; value: string }> = [];
  if (fa?.ticker) companyHighlights.push({ label: 'Ticker', value: String(fa.ticker).toUpperCase() });
  if (fa?.period_label) companyHighlights.push({ label: 'Dönem', value: String(fa.period_label) });
  if (fa?.sector) companyHighlights.push({ label: 'Sektör', value: SECTOR_LABEL_TR[String(fa.sector).toLowerCase()] ?? String(fa.sector) });
  const canonicalNumbers = (fa?.canonical_numbers ?? {}) as Record<string, unknown>;
  if (canonicalNumbers.revenue != null) companyHighlights.push({ label: 'Toplam Gelir (mn TL)', value: formatTRY(canonicalNumbers.revenue as number | string, 0) });
  if (canonicalNumbers.total_equity != null) companyHighlights.push({ label: 'Toplam Özsermaye (mn TL)', value: formatTRY(canonicalNumbers.total_equity as number | string, 0) });
  if (canonicalNumbers.total_debt != null) companyHighlights.push({ label: 'Toplam Borç (mn TL)', value: formatTRY(canonicalNumbers.total_debt as number | string, 0) });

  // ----- III. Finansal Tablolar -----

  const canonicalBalanceSheet = buildCanonicalTable(canonicalNumbers, [
    ['total_assets', 'Toplam Varlıklar'],
    ['cash', 'Nakit ve Benzerleri'],
    ['receivables', 'Ticari Alacaklar'],
    ['inventory', 'Stoklar'],
    ['ppe_net', 'Maddi Duran Varlıklar (Net)'],
    ['goodwill', 'Şerefiye'],
    ['total_liabilities', 'Toplam Yükümlülükler'],
    ['short_term_debt', 'Kısa Vadeli Finansal Borç'],
    ['long_term_debt', 'Uzun Vadeli Finansal Borç'],
    ['total_equity', 'Toplam Özsermaye'],
    ['paid_in_capital', 'Ödenmiş Sermaye'],
    ['retained_earnings', 'Dağıtılmamış Karlar'],
  ]);

  const canonicalIncomeStatement = buildCanonicalTable(canonicalNumbers, [
    ['revenue', 'Hasılat'],
    ['cost_of_sales', 'Satışların Maliyeti'],
    ['gross_profit', 'Brüt Kar'],
    ['operating_expenses', 'Faaliyet Giderleri'],
    ['ebit', 'Faaliyet Karı (EBIT)'],
    ['depreciation_amortization', 'Amortisman & İtfa'],
    ['ebitda', 'FAVÖK (EBITDA)'],
    ['financial_income', 'Finansal Gelir'],
    ['financial_expense', 'Finansal Gider'],
    ['tax_expense', 'Vergi Gideri'],
    ['net_income', 'Net Dönem Karı'],
  ]);

  const canonicalCashFlow = buildCanonicalTable(canonicalNumbers, [
    ['operating_cash_flow', 'Operasyonel Nakit Akışı (OCF)'],
    ['capex', 'Yatırım Harcaması (CAPEX)'],
    ['free_cash_flow', 'Serbest Nakit Akışı (FCF)'],
    ['investing_cash_flow', 'Yatırım Faaliyetlerinden Nakit'],
    ['financing_cash_flow', 'Finansman Faaliyetlerinden Nakit'],
    ['dividends_paid', 'Ödenen Temettü'],
    ['net_change_in_cash', 'Nakit Değişimi (Net)'],
  ]);

  // ----- IV. Değerleme -----

  const dcfFromEngine = ((val?.engine_snapshot as Record<string, unknown> | null)?.dcf) as Record<string, unknown> | null | undefined;
  const dcfFromTop = val?.dcf as Record<string, unknown> | null | undefined;
  const dcf: Record<string, unknown> | null = (dcfFromEngine ?? dcfFromTop) ?? null;
  const dcfPresent = !!dcf && dcf.per_share_value != null;

  const valuationWarnings: string[] = [
    ...(val?.try_wacc_warning ? ['TRY WACC tuzağı: USD bazlı WACC kullanılmalı'] : []),
    ...(val?.holding_sotp_required ? ['Holding — SOTP analizi zorunlu, konsolide DCF üst sınır olarak kabul edilmeli'] : []),
    ...(val?.banking_sector_warning ? ['Banka filer — FCF-DCF uygulanabilir değil, DDM veya excess return modeli tercih edin'] : []),
    ...arrayFrom(val?.notes ?? []).map(String),
  ];

  const peerEvEbitda = buildPeerStats(sc, 'EBITDA_MARGIN');
  const peerPe = buildPeerStats(sc, 'NET_MARGIN');

  // ----- IV (cont). Analist Konsensüs -----

  const analystConsensus = ac ? {
    count: Number(ac.count ?? 0),
    target_price_mean_formatted: ac.target_price_mean != null ? formatTRY(ac.target_price_mean as number, 2) + ' TL' : '—',
    distribution: `${Number(ac.distribution_buy ?? 0)} / ${Number(ac.distribution_hold ?? 0)} / ${Number(ac.distribution_sell ?? 0)}`,
    revision_trend: String(ac.revision_trend ?? '—').replace('rising', 'Yükseliş').replace('falling', 'Düşüş').replace('stable', 'Sabit'),
  } : null;
  const analystConsensusHas = (analystConsensus?.count ?? 0) > 0;

  // ----- V. Sektör Karşılaştırması + SWOT -----

  const benchmarks = arrayFrom(sc?.benchmarks ?? [])
    .filter((b: Record<string, unknown>) => b.company_value != null)
    .map((b: Record<string, unknown>) => ({
      label: String(b.label ?? b.metric_code ?? ''),
      company_formatted: formatValueByCode(String(b.metric_code ?? ''), b.company_value),
      median_formatted: formatValueByCode(String(b.metric_code ?? ''), b.median),
      range_formatted: b.min_value != null && b.max_value != null
        ? `${formatValueByCode(String(b.metric_code ?? ''), b.min_value)} – ${formatValueByCode(String(b.metric_code ?? ''), b.max_value)}`
        : '—',
      quartile_badge: b.quartile != null ? `Q${b.quartile}` : '—',
    }));

  // SWOT — adapted from strategic_synthesis buckets + context_extraction.
  const swot = {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    opportunities: arrayFrom(signalBuckets.neutral).slice(0, 3)
      .map((s: Record<string, unknown>) => String(s.label ?? ''))
      .filter(Boolean),
    threats: arrayFrom(fa?.red_flags ?? [])
      .filter((f: Record<string, unknown>) => ['warning', 'critical'].includes(String(f.severity ?? '').toLowerCase()))
      .slice(0, 4)
      .map((f: Record<string, unknown>) => String(f.message ?? f.code ?? '')),
  };
  const swotHas = swot.strengths.length + swot.weaknesses.length + swot.opportunities.length + swot.threats.length > 0;

  // ----- VI. Makro -----

  const macroContext = {
    usd_try: formatNumber(macro?.usd_try, 4, ' TL'),
    eur_try: formatNumber(macro?.eur_try, 4, ' TL'),
    policy_rate: formatPctFromMacro(macro?.tcmb_policy_rate),
    tcmb_10y: formatPctFromMacro(macro?.tcmb_10y_bond_yield),
    cpi_yoy: formatPctFromMacro(macro?.cpi_yoy),
    gdp_yoy: formatPctFromMacro(macro?.gdp_yoy),
    bist100_ytd_return: formatPctFromMacro(macro?.bist100_ytd_return),
  };

  // ----- VII. Teknik -----

  const trend = String(tech?.trend ?? tech?.overall_trend ?? '').toLowerCase();
  const rsi = numOrNull(tech?.rsi_14 ?? tech?.rsi);
  const technical = tech ? {
    trend_label: trend === 'bullish' ? 'Yükseliş' : trend === 'bearish' ? 'Düşüş' : trend === 'neutral' ? 'Nötr' : '—',
    rsi: rsi != null ? rsi.toFixed(1) : '—',
    rsi_zone: rsi != null
      ? (rsi >= 70 ? 'Aşırı alım' : rsi <= 30 ? 'Aşırı satım' : rsi >= 55 ? 'Yüksek momentum' : rsi <= 45 ? 'Zayıf momentum' : 'Nötr')
      : '—',
    last_close: tech.last_close != null ? formatTRY(tech.last_close as number, 2) + ' TL' : '—',
    volume_avg: tech.volume_avg != null ? formatTRY(tech.volume_avg as number, 0) : '—',
  } : null;
  const technicalHas = !!technical;

  // ----- VIII. ESG -----

  const esgCbam = esgOut?.cbam as Record<string, unknown> | null | undefined;
  const esg = esgCbam ? {
    scope1_formatted: esgCbam.scope1_tco2 != null ? formatTRY(esgCbam.scope1_tco2 as number, 0) + ' tCO₂' : '—',
    ets_eur: esgCbam.ets_annual_cost_eur != null ? '€ ' + formatTRY(esgCbam.ets_annual_cost_eur as number, 0) : '—',
    ets_try: esgCbam.ets_annual_cost_try != null ? formatTRY(esgCbam.ets_annual_cost_try as number, 0) + ' TL' : '—',
    cbam_eur: esgCbam.cbam_annual_cost_eur != null ? '€ ' + formatTRY(esgCbam.cbam_annual_cost_eur as number, 0) : '—',
    cbam_try: esgCbam.cbam_annual_cost_try != null ? formatTRY(esgCbam.cbam_annual_cost_try as number, 0) + ' TL' : '—',
    total_eur: esgCbam.total_annual_cost_eur != null ? '€ ' + formatTRY(esgCbam.total_annual_cost_eur as number, 0) : '—',
    total_try: esgCbam.total_annual_cost_try != null ? formatTRY(esgCbam.total_annual_cost_try as number, 0) + ' TL' : '—',
  } : null;
  const esgHas = !!esg;

  // ----- IX. Sentiment -----

  const sentimentDist = (news?.sentiment_distribution ?? {}) as Record<string, number>;
  const sentiment = news ? {
    news_count: Number(news.news_count ?? (news.news_items as unknown[] | undefined)?.length ?? 0),
    overall_label: String(news.overall_sentiment_score ?? '—').toUpperCase(),
    overall_score: String(news.overall_sentiment_score ?? '—'),
    distribution: `+${Number(sentimentDist.positive ?? 0)} / ${Number(sentimentDist.neutral ?? 0)} / -${Number(sentimentDist.negative ?? 0)}`,
  } : null;
  const sentimentHas = !!sentiment && sentiment.news_count > 0;

  // ----- X. KAP Olayları -----

  const eventImpacts = arrayFrom(ev?.event_impacts ?? []).slice(0, 12).map((e: Record<string, unknown>) => ({
    summary: String(e.event_summary ?? ''),
    type: String(e.event_type ?? ''),
    direction: translateDirection(e.impact_direction),
    timing: translateTiming(e.timing_horizon),
    statements: arrayFrom(e.affected_statements ?? []).join(', '),
  }));

  // ----- XI. Risk -----

  const risks: string[] = [
    ...arrayFrom(fa?.red_flags ?? [])
      .filter((f: Record<string, unknown>) => ['warning', 'critical'].includes(String(f.severity ?? '').toLowerCase()))
      .map((f: Record<string, unknown>) => String(f.message ?? f.code ?? '')),
    ...arrayFrom(ss?.divergences ?? []).map(String),
    ...valuationWarnings.slice(0, 2),
  ].filter(Boolean).slice(0, 8);

  // ----- XII. Catalysts -----

  const catalysts: string[] = [
    ...arrayFrom(signalBuckets.positive).slice(0, 3).map((s: Record<string, unknown>) => String(s.label ?? '')),
    ...arrayFrom(ev?.event_impacts ?? [])
      .filter((e: Record<string, unknown>) => String(e.impact_direction ?? '').toLowerCase() === 'positive' && String(e.timing_horizon ?? '').toLowerCase() !== 'long_term')
      .slice(0, 3)
      .map((e: Record<string, unknown>) => String(e.event_summary ?? '')),
  ].filter(Boolean).slice(0, 6);

  // ----- Assemble everything -----

  const sectorRaw = String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const sectorSourceLabel = String(val?.sector_source ?? 'structured');

  return {
    // Metadata
    ticker: ticker.toUpperCase(),
    company_name: String(fa?.ticker ?? ticker).toUpperCase(),
    sector_label: sectorRaw,
    sector_label_tr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw,
    sector_source_label: sectorSourceLabel === 'structured' ? 'doğrulanmış' : sectorSourceLabel === 'markdown' ? 'metin-türetme' : 'ticker-türetme',
    period_label: String(fa?.period_label ?? '—'),
    report_date: new Date().toISOString().slice(0, 10),
    report_id: reportId,
    engine_source: 'financial_engine + adapters',

    // Scorecards
    qa_score: qa?.overall_score != null ? Number(qa.overall_score).toFixed(2) : '—',
    qa_decision_label: translateDecision(qa?.qa_decision),
    convergence_score: ss?.convergence_score != null ? (Number(ss.convergence_score) > 0 ? '+' : '') + Number(ss.convergence_score).toFixed(2) : '—',
    signal_confidence: translateConfidence(ss?.confidence),
    reconciliation_pass_rate: recTotal > 0 ? `%${Math.round(recPassRate * 100)}` : '—',
    reconciliation_passed: recPassed,
    reconciliation_total: recTotal,

    // Section I
    critical_findings: criticalFindings,
    strengths,
    weaknesses,

    // Section II
    company_highlights: companyHighlights,

    // Section III
    highlights,
    highlights_has: highlights.length > 0,
    canonical_balance_sheet: canonicalBalanceSheet,
    canonical_income_statement: canonicalIncomeStatement,
    canonical_cash_flow: canonicalCashFlow,

    // Section IV
    valuation_warnings: valuationWarnings,
    dcf_present: dcfPresent,
    dcf_ev_formatted: getDcfField(dcf, 'enterprise_value') != null ? formatTRY(getDcfField(dcf, 'enterprise_value') as number, 0) + ' mn TL' : '—',
    dcf_equity_formatted: getDcfField(dcf, 'equity_value') != null ? formatTRY(getDcfField(dcf, 'equity_value') as number, 0) + ' mn TL' : '—',
    dcf_per_share_formatted: getDcfField(dcf, 'per_share_value') != null ? formatTRY(getDcfField(dcf, 'per_share_value') as number, 2) + ' TL' : '—',
    dcf_wacc_formatted: getDcfField(dcf, 'wacc_used') != null ? formatPct(Number(getDcfField(dcf, 'wacc_used')) * 100, 1) : '—',
    dcf_terminal_g_formatted: getDcfField(dcf, 'terminal_growth') != null ? formatPct(Number(getDcfField(dcf, 'terminal_growth')) * 100, 1) : '—',
    peer_ev_ebitda: peerEvEbitda,
    peer_pe: peerPe,
    analyst_consensus: analystConsensus,
    analyst_consensus_has: analystConsensusHas,

    // Section V
    benchmarks,
    swot,
    swot_has: swotHas,

    // Section VI
    macro: macroContext,

    // Section VII
    technical,
    technical_has: technicalHas,

    // Section VIII
    esg,
    esg_has: esgHas,

    // Section IX
    sentiment,
    sentiment_has: sentimentHas,

    // Section X
    event_impacts: eventImpacts,

    // Section XI
    risks,

    // Section XII
    catalysts,

    // Narrative slots (auto-extracted from LLM outputs)
    narrative_executive_summary: narrativeBlocks.card_summary ?? '',
    narrative_company_profile: narrativeBlocks.company_profile ?? narrativeBlocks.card_summary ?? '',
    narrative_segments: narrativeBlocks.segments ?? '',
    narrative_financial_intro: narrativeBlocks.financial_intro ?? '',
    narrative_profitability: narrativeBlocks.profitability ?? '',
    narrative_leverage: narrativeBlocks.leverage ?? '',
    narrative_cashflow: narrativeBlocks.cashflow ?? '',
    narrative_valuation: narrativeBlocks.valuation ?? '',
    narrative_sector: narrativeBlocks.sector ?? '',
    narrative_macro: narrativeBlocks.macro ?? '',
    narrative_technical: narrativeBlocks.technical ?? '',
    narrative_esg: narrativeBlocks.esg ?? '',
    narrative_sentiment: narrativeBlocks.sentiment ?? '',
    narrative_risks: narrativeBlocks.risks ?? '',
    narrative_closing: narrativeBlocks.closing ?? '',
    narrative_investment_thesis: narrativeBlocks.investment_thesis ?? narrativeBlocks.closing ?? '',
  };
}


// ---------- Helpers ----------

function arrayFrom(v: unknown): Array<Record<string, unknown>> {
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}


function getDcfField(dcf: Record<string, unknown> | null, key: string): unknown {
  if (!dcf) return undefined;
  return (dcf as Record<string, unknown>)[key];
}


function buildCanonicalTable(
  numbers: Record<string, unknown>,
  mapping: Array<[string, string]>,
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  for (const [key, label] of mapping) {
    const v = numbers[key];
    if (v != null && v !== '') {
      out.push({ label, value: formatTRY(v as number | string, 0) });
    }
  }
  return out;
}


function buildPeerStats(
  sc: Record<string, unknown> | null,
  metric: string,
): TemplateValue {
  if (!sc?.benchmarks) return null;
  const bm = (arrayFrom(sc.benchmarks)).find(b => b.metric_code === metric);
  if (!bm || bm.company_value == null) return null;
  return {
    company_formatted: formatValueByCode(metric, bm.company_value),
    median_formatted: formatValueByCode(metric, bm.median),
    q1_q3: bm.q1 != null && bm.q3 != null
      ? `${formatValueByCode(metric, bm.q1)} / ${formatValueByCode(metric, bm.q3)}`
      : '—',
  };
}


function formatValueByCode(code: string, value: unknown): string {
  const lower = code.toLowerCase();
  if (lower.includes('margin') || lower.includes('roe') || lower.includes('roa') ||
      lower.includes('roce') || lower === 'nim' || lower.includes('cost_to_income') ||
      lower.includes('nii_burden')) {
    return formatPct(value as number | string, 1);
  }
  if (lower.includes('debt_to_ebitda') || lower.includes('altman') || lower.includes('piotroski')) {
    return formatRatio(value as number | string, 2);
  }
  if (lower === 'ccc' || lower === 'dso' || lower === 'dio' || lower === 'dpo') {
    const n = numOrNull(value);
    return n != null ? `${n.toFixed(0)} gün` : '—';
  }
  return formatTRY(value as number | string, 0);
}


function formatNumber(v: unknown, decimals: number, suffix = ''): string {
  const n = numOrNull(v);
  return n != null ? n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix : '—';
}


function formatPctFromMacro(v: unknown): string {
  if (v == null || v === '') return '—';
  const n = numOrNull(v);
  if (n == null) return String(v);
  // Macro values sometimes come as 0.055 (decimal), sometimes 5.5 (percent).
  const adj = n < 1 ? n * 100 : n;
  return formatPct(adj, 2);
}


function translateDecision(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (s === 'pass') return 'Geçer';
  if (s === 'fail') return 'Kaldı';
  if (s === 'conditional_pass') return 'Koşullu';
  return s || '—';
}


function translateConfidence(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (s === 'high') return 'yüksek';
  if (s === 'medium') return 'orta';
  if (s === 'low') return 'düşük';
  return s || '—';
}


function translateDirection(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (s === 'positive') return 'Pozitif';
  if (s === 'negative') return 'Negatif';
  if (s === 'mixed') return 'Karma';
  if (s === 'uncertain') return 'Belirsiz';
  if (s === 'neutral') return 'Nötr';
  return s || '—';
}


function translateTiming(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (s === 'immediate') return 'Anında';
  if (s === 'near_term') return 'Yakın';
  if (s === 'medium_term') return 'Orta';
  if (s === 'long_term') return 'Uzun';
  return s || '—';
}
