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

import {
  commentaryCashflow,
  commentaryClosing,
  commentaryCompanyProfile,
  commentaryEsg,
  commentaryExecSummary,
  commentaryFinancialIntro,
  commentaryLeverage,
  commentaryMacro,
  commentaryProfitability,
  commentaryRisk,
  commentarySector,
  commentaryTechnical,
  commentaryValuation,
} from './auto_commentary.js';
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

  // Full LLM narrative — appended to report as "Detaylı Analiz" section
  // so nothing from the 30KB final_summary is lost even if our slice
  // extractors couldn't anchor specific sub-sections.
  const fullNarrativeRaw = typeof ctx['final_summary_output'] === 'string'
    ? ctx['final_summary_output'] as string
    : '';
  const fullNarrativeHtml = mdToHtml(fullNarrativeRaw);

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

  const metrics = arrayFrom(fa?.highlights ?? fa?.metrics ?? []);
  const highlights = metrics.slice(0, 10).map(h => ({
    label: String(h.label ?? h.code ?? ''),
    value_formatted: formatValueByCode(String(h.code ?? ''), h.value),
    narrative_hint: String(h.narrative_hint ?? ''),
  }));

  // Extract scoring metrics for dedicated score cards
  const findMetric = (code: string) => metrics.find(m => m.code === code);
  const piotroski = findMetric('PIOTROSKI_F');
  const altman = findMetric('ALTMAN_Z');
  const scoreMetrics = {
    piotroski_f: piotroski?.value != null ? String(piotroski.value) : '—',
    piotroski_label: piotroski?.value != null
      ? (Number(piotroski.value) >= 7 ? 'Güçlü' : Number(piotroski.value) >= 4 ? 'Orta' : 'Zayıf')
      : '—',
    altman_z: altman?.value != null ? Number(altman.value).toFixed(2) : '—',
    altman_label: altman?.value != null
      ? (Number(altman.value) >= 3 ? 'Güvenli' : Number(altman.value) >= 1.8 ? 'Gri Bölge' : 'Distress')
      : '—',
  };

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

  // ----- III-B. 5 Yıllık Trend Tablosu (parse_standardization) -----

  const standardizedStatements = arrayFrom(parsed?.standardized_statements ?? []);
  const multiYear = buildMultiYearTrend(standardizedStatements);

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
  // CBAM 2026-2034 phase-in projection (standard EU schedule)
  const cbamPhaseIn: Array<{ year: string; coverage: string; total_eur: string; total_try: string }> = [];
  if (esgCbam?.scope1_tco2 != null) {
    const scope1 = Number(esgCbam.scope1_tco2);
    const price = Number(esgCbam.carbon_price_eur_per_t ?? 85);
    const eurTry = numOrNull(macro?.eur_try);
    const phaseSchedule: Array<[number, number]> = [
      [2026, 0.485], [2027, 0.60], [2028, 0.70], [2029, 0.80],
      [2030, 0.86], [2031, 0.90], [2032, 0.94], [2033, 0.97], [2034, 1.00],
    ];
    for (const [year, coverage] of phaseSchedule) {
      const costEur = Math.round(scope1 * coverage * price);
      const costTry = eurTry ? Math.round(costEur * eurTry) : null;
      cbamPhaseIn.push({
        year: String(year),
        coverage: `%${(coverage * 100).toFixed(1)}`,
        total_eur: '€ ' + formatTRY(costEur, 0),
        total_try: costTry ? formatTRY(costTry, 0) + ' TL' : '—',
      });
    }
  }

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
  const newsItems = arrayFrom(news?.news_items ?? []).slice(0, 10).map((n: Record<string, unknown>) => ({
    date: String(n.published_at ?? '').slice(0, 10),
    source: String(n.source ?? '—'),
    title: String(n.title ?? '').slice(0, 120),
    sentiment_label: translateSentiment(n.sentiment_hint),
    theme: String(n.theme ?? '—'),
  }));

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

  // ----- Scenarios (Bull/Base/Bear) -----
  // If valuation agent provided DCF, derive scenarios from its
  // per_share_value ± sensitivity. Otherwise leave empty.

  const dcfPerShare = numOrNull(dcf?.per_share_value);
  const lastClose = numOrNull(tech?.last_close);
  const scenarios = dcfPerShare != null ? {
    bear_price: formatTRY(dcfPerShare * 0.75, 2) + ' TL',
    bear_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare * 0.75 / lastClose - 1) * 100), 1)}` : '−25% DCF',
    bear_triggers: [
      'WACC +200bps artış',
      'Terminal g -150bps düşüş',
      'Jeopolitik risk materyalizasyonu',
    ],
    base_price: formatTRY(dcfPerShare, 2) + ' TL',
    base_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare / lastClose - 1) * 100), 1)}` : 'DCF Orta',
    base_triggers: [
      'Mevcut WACC + terminal varsayımı',
      'Yönetim guidance tutması',
      'Makro ortamda büyük değişim yok',
    ],
    bull_price: formatTRY(dcfPerShare * 1.25, 2) + ' TL',
    bull_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare * 1.25 / lastClose - 1) * 100), 1)}` : '+25% DCF',
    bull_triggers: [
      'WACC -100bps düşüş',
      'Güçlü kapasite genişleme',
      'Pozitif sektör katalizörleri',
    ],
  } : null;
  const scenariosHas = !!scenarios;

  // ----- Porter 5 Forces (derived heuristically from sector) -----

  const porterPresets: Record<string, Record<string, unknown>> = {
    banking: {
      rivalry: 'Yüksek', rivalry_class: 'high', rivalry_note: 'Kamu + özel + yabancı banka 30+ oyuncu, fiyat ve hizmet rekabeti.',
      entrants: 'Düşük', entrants_class: 'low', entrants_note: 'BDDK lisansı, yüksek sermaye yeterliliği bariyeri.',
      substitutes: 'Orta', substitutes_class: 'medium', substitutes_note: 'Fintech, kripto, yatırım fonları gelişiyor.',
      suppliers: 'Düşük', suppliers_class: 'low', suppliers_note: 'Mevduat sahibi çok sayıda, pazarlık gücü dağılmış.',
      buyers: 'Orta', buyers_class: 'medium', buyers_note: 'Kurumsal müşteri fiyat hassas, bireysel daha az.',
    },
    holding: {
      rivalry: 'Orta', rivalry_class: 'medium', rivalry_note: 'İştiraklerin kendi sektörlerinde rekabet; holding seviyesinde konglomerat discount etkisi.',
      entrants: 'Düşük', entrants_class: 'low', entrants_note: 'Ölçek ve sermaye bariyeri yüksek; yeni holding kurmak zor.',
      substitutes: 'Düşük', substitutes_class: 'low', substitutes_note: 'Holding yapısı doğrudan ikame edilemez; segment bazlı ikame mümkün.',
      suppliers: 'Düşük', suppliers_class: 'low', suppliers_note: 'Holding toplam satın alma gücü ile bireysel şirketlerden üstün.',
      buyers: 'Orta', buyers_class: 'medium', buyers_note: 'Yatırımcılar holding discount’a karşı hassas.',
    },
    industrial: {
      rivalry: 'Orta', rivalry_class: 'medium', rivalry_note: 'Sektör olgun, yerel ve küresel rakipler aktif.',
      entrants: 'Düşük', entrants_class: 'low', entrants_note: 'Sermaye yoğunluğu + marka bariyeri.',
      substitutes: 'Orta', substitutes_class: 'medium', substitutes_note: 'Teknoloji değişimi ve alternatif malzemeler tehdit.',
      suppliers: 'Orta', suppliers_class: 'medium', suppliers_note: 'Hammadde fiyat hareketleri maliyet yapısını etkiliyor.',
      buyers: 'Orta', buyers_class: 'medium', buyers_note: 'B2B müşteriler fiyat hassas; B2C marka gücüne bağlı.',
    },
    insurance: {
      rivalry: 'Yüksek', rivalry_class: 'high', rivalry_note: 'Çok sayıda şirket, prim fiyatlama rekabeti.',
      entrants: 'Düşük', entrants_class: 'low', entrants_note: 'SEDDK lisansı ve sermaye yeterliliği bariyeri.',
      substitutes: 'Düşük', substitutes_class: 'low', substitutes_note: 'Zorunlu ürünlerde alternatif yok; ihtiyari ürünlerde tasarruf tercihleri.',
      suppliers: 'Düşük', suppliers_class: 'low', suppliers_note: 'Reasürör sayısı sınırlı ama büyük şirketler çok reasürörle çalışabilir.',
      buyers: 'Orta', buyers_class: 'medium', buyers_note: 'Kurumsal müşteri pazarlık gücü yüksek; bireysel dağılmış.',
    },
    reit: {
      rivalry: 'Orta', rivalry_class: 'medium', rivalry_note: 'GYO piyasası dar, yatırımcı tercihine göre rekabet.',
      entrants: 'Düşük', entrants_class: 'low', entrants_note: 'SPK GYO lisansı ve portföy gereksinimleri.',
      substitutes: 'Yüksek', substitutes_class: 'high', substitutes_note: 'Konut/ofis yatırımı fon/hisse ikamesi yaygın.',
      suppliers: 'Düşük', suppliers_class: 'low', suppliers_note: 'İnşaat şirketleri çok sayıda, pazarlık gücü dağılmış.',
      buyers: 'Orta', buyers_class: 'medium', buyers_note: 'Kiracı/alıcı pazarlık gücü lokasyona göre değişir.',
    },
  };
  const porterSector = String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const porter = porterPresets[porterSector] ?? porterPresets.industrial;
  const porterHas = true;

  // ----- Risk Matrix (populated from red_flags + divergences) -----

  const riskMatrix = buildRiskMatrix(fa, ss);

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

    // Section I — scoring badges
    piotroski_f: scoreMetrics.piotroski_f,
    piotroski_label: scoreMetrics.piotroski_label,
    altman_z: scoreMetrics.altman_z,
    altman_label: scoreMetrics.altman_label,

    // Section III
    highlights,
    highlights_has: highlights.length > 0,
    canonical_balance_sheet: canonicalBalanceSheet,
    canonical_income_statement: canonicalIncomeStatement,
    canonical_cash_flow: canonicalCashFlow,
    multi_year_years: multiYear.years,
    multi_year_revenue: multiYear.revenue_row as unknown as TemplateValue,
    multi_year_balance: multiYear.balance_row as unknown as TemplateValue,
    multi_year_cashflow: multiYear.cashflow_row as unknown as TemplateValue,
    multi_year_ratios: multiYear.ratio_row as unknown as TemplateValue,
    multi_year_dividends: multiYear.dividend_row as unknown as TemplateValue,
    multi_year_ratios_has: multiYear.ratio_row.length > 0,
    multi_year_dividends_has: multiYear.dividend_row.length > 0,
    multi_year_has_data: multiYear.has_data,
    multi_year_count: multiYear.years.length,

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
    cbam_phase_in: cbamPhaseIn as unknown as TemplateValue,
    cbam_phase_in_has: cbamPhaseIn.length > 0,

    // Section IX
    sentiment,
    sentiment_has: sentimentHas,
    news_items: newsItems,
    news_items_has: newsItems.length > 0,

    // Section X
    event_impacts: eventImpacts,

    // Section V (cont.) — Porter
    porter: porter as TemplateValue,
    porter_has: porterHas,

    // Section IV (cont.) — Scenarios
    scenarios: scenarios as TemplateValue,
    scenarios_has: scenariosHas,

    // Section XI
    risks,
    risk_matrix: riskMatrix as TemplateValue,

    // Section XII
    catalysts,

    // Narrative slots — LLM first, auto-commentary as fallback
    narrative_executive_summary: fallbackNarrative(
      narrativeBlocks.card_summary,
      commentaryExecSummary({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw,
        qaScore: qa?.overall_score as number | null | undefined,
        convergenceScore: ss?.convergence_score as number | null | undefined,
        recPassRate,
        revenue: canonicalNumbers.revenue as number | null | undefined,
        netIncome: canonicalNumbers.net_income as number | null | undefined,
        roe: canonicalNumbers.roe as number | null | undefined,
        piotroskiF: Number(scoreMetrics.piotroski_f) || null,
        altmanZ: Number(scoreMetrics.altman_z) || null,
        criticalFlagCount: criticalFindings.length,
      }),
    ),
    narrative_company_profile: fallbackNarrative(
      narrativeBlocks.company_profile,
      commentaryCompanyProfile({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw, sector: sectorRaw,
        periodLabel: fa?.period_label as string | undefined,
        totalAssets: canonicalNumbers.total_assets as number | null | undefined,
        totalEquity: canonicalNumbers.total_equity as number | null | undefined,
        revenue: canonicalNumbers.revenue as number | null | undefined,
        netIncome: canonicalNumbers.net_income as number | null | undefined,
      }),
    ),
    narrative_segments: narrativeBlocks.segments ?? '',
    narrative_financial_intro: fallbackNarrative(
      narrativeBlocks.financial_intro,
      commentaryFinancialIntro({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw,
        revenue: canonicalNumbers.revenue as number | null | undefined,
        netIncome: canonicalNumbers.net_income as number | null | undefined,
        totalAssets: canonicalNumbers.total_assets as number | null | undefined,
        totalEquity: canonicalNumbers.total_equity as number | null | undefined,
        netDebt: canonicalNumbers.net_debt as number | null | undefined,
        periodLabel: fa?.period_label as string | undefined,
      }),
    ),
    narrative_profitability: fallbackNarrative(
      narrativeBlocks.profitability,
      commentaryProfitability({
        grossMargin: canonicalNumbers.gross_margin as number | null | undefined,
        ebitdaMargin: canonicalNumbers.ebitda_margin as number | null | undefined,
        netMargin: canonicalNumbers.net_margin as number | null | undefined,
        roe: canonicalNumbers.roe as number | null | undefined,
        roa: canonicalNumbers.roa as number | null | undefined,
        sector: sectorRaw,
      }),
    ),
    narrative_leverage: fallbackNarrative(
      narrativeBlocks.leverage,
      commentaryLeverage({
        netDebt: canonicalNumbers.net_debt as number | null | undefined,
        ebitda: canonicalNumbers.ebitda as number | null | undefined,
        totalEquity: canonicalNumbers.total_equity as number | null | undefined,
        currentRatio: canonicalNumbers.current_ratio as number | null | undefined,
        sector: sectorRaw,
      }),
    ),
    narrative_cashflow: fallbackNarrative(
      narrativeBlocks.cashflow,
      commentaryCashflow({
        ocf: canonicalNumbers.operating_cash_flow as number | null | undefined,
        capex: canonicalNumbers.capex as number | null | undefined,
        fcf: canonicalNumbers.fcf as number | null | undefined,
        netIncome: canonicalNumbers.net_income as number | null | undefined,
        dividendsPaid: canonicalNumbers.dividends_paid as number | null | undefined,
        sector: sectorRaw,
      }),
    ),
    narrative_valuation: fallbackNarrative(
      narrativeBlocks.valuation,
      commentaryValuation({
        ticker, sector: sectorRaw,
        dcfPerShare: dcf ? (dcf as Record<string, unknown>).per_share_value as number | null : null,
        lastClose: tech?.last_close as number | null | undefined,
        wacc: dcf ? (dcf as Record<string, unknown>).wacc_used as number | null : null,
        terminalG: dcf ? (dcf as Record<string, unknown>).terminal_growth as number | null : null,
        tryWaccWarning: Boolean(val?.try_wacc_warning),
        holdingSotp: Boolean(val?.holding_sotp_required),
        bankingWarn: Boolean(val?.banking_sector_warning),
      }),
    ),
    narrative_sector: fallbackNarrative(
      narrativeBlocks.sector,
      commentarySector({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw, sector: sectorRaw,
        benchmarksCount: benchmarks.length,
        peersCount: arrayFrom(sc?.peer_group ?? []).length,
        strengthsCount: arrayFrom(sc?.strengths ?? []).length,
        weaknessesCount: arrayFrom(sc?.weaknesses ?? []).length,
      }),
    ),
    narrative_macro: fallbackNarrative(
      narrativeBlocks.macro,
      commentaryMacro({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw,
        usdTry: macroContext.usd_try,
        policyRate: macroContext.policy_rate,
        cpiYoy: macroContext.cpi_yoy,
        gdpYoy: macroContext.gdp_yoy,
      }),
    ),
    narrative_technical: fallbackNarrative(
      narrativeBlocks.technical,
      commentaryTechnical({
        trend: trend,
        rsi: rsi,
        lastClose: tech?.last_close as number | null | undefined,
        volumeAvg: tech?.volume_avg as number | null | undefined,
      }),
    ),
    narrative_esg: fallbackNarrative(
      narrativeBlocks.esg,
      commentaryEsg({
        sector: sectorRaw,
        cbamTotalEur: esgCbam?.total_annual_cost_eur as number | null | undefined,
        scope1: esgCbam?.scope1_tco2 as number | null | undefined,
      }),
    ),
    narrative_sentiment: narrativeBlocks.sentiment ?? '',
    narrative_risks: fallbackNarrative(
      narrativeBlocks.risks,
      commentaryRisk({
        criticalFlags: arrayFrom(fa?.red_flags ?? []).filter(f => String(f.severity ?? '').toLowerCase() === 'critical').map(f => ({ code: String(f.code ?? ''), message: f.message as string | undefined })),
        warningFlags: arrayFrom(fa?.red_flags ?? []).filter(f => ['warn', 'warning'].includes(String(f.severity ?? '').toLowerCase())).map(f => ({ code: String(f.code ?? ''), message: f.message as string | undefined })),
        divergences: arrayFrom(ss?.divergences ?? []).map(String),
        tryWaccWarning: Boolean(val?.try_wacc_warning),
        holdingSotp: Boolean(val?.holding_sotp_required),
        sector: sectorRaw,
      }),
    ),
    narrative_closing: fallbackNarrative(narrativeBlocks.closing,
      commentaryClosing({
        ticker, sectorTr: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw,
        convergenceScore: ss?.convergence_score as number | null | undefined,
        qaScore: qa?.overall_score as number | null | undefined,
        dcfPerShare: dcf ? (dcf as Record<string, unknown>).per_share_value as number | null : null,
        lastClose: tech?.last_close as number | null | undefined,
        criticalFlagCount: criticalFindings.length,
        catalystsCount: catalysts.length,
      }),
    ),
    narrative_investment_thesis: fallbackNarrative(
      narrativeBlocks.investment_thesis ?? narrativeBlocks.closing,
      '',
    ),
    narrative_investments: narrativeBlocks.investments ?? '',
    narrative_dividend: narrativeBlocks.dividend ?? '',
    full_narrative_html: fullNarrativeHtml,
    full_narrative_has: fullNarrativeHtml.length > 500,
  };
}


/** Use LLM-extracted narrative when non-empty, otherwise fall back to
 *  rule-based auto commentary. Keeps the report populated even when
 *  final_summary fails or doesn't emit anchor headings. */
function fallbackNarrative(llm: string | undefined, autoText: string): string {
  if (llm && llm.trim().length > 200) return llm;
  return autoText;
}


/** Light-touch Markdown → HTML converter for the full LLM narrative
 *  dump. Headings, tables, lists, paragraphs, bold/italic. Preserves
 *  ordering and structure; the result is wrapped in a <section> for
 *  CSS styling. */
function mdToHtml(md: string): string {
  if (!md || md.trim().length < 200) return '';

  // Strip Claude wrapper fence if present.
  let text = md.replace(/^\s*---\s*\n/, '').trim();

  // Convert markdown tables to HTML tables.
  text = text.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+\|[\s|:-]+\|(?:\n\|[^\n]+\|)+)/g, (_, block) => {
    const rows = block.trim().split('\n').map((r: string) => r.trim());
    if (rows.length < 2) return block;
    const sep = rows[1];
    if (!/^\|[\s|:-]+\|$/.test(sep)) return block;
    const headerCells = rows[0].slice(1, -1).split('|').map((c: string) => c.trim());
    const bodyRows = rows.slice(2).map((r: string) => r.slice(1, -1).split('|').map((c: string) => c.trim()));
    const thead = `<thead><tr>${headerCells.map((c: string) => `<th>${escapeHtmlLight(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${bodyRows.map((cells: string[]) => `<tr>${cells.map(c => `<td>${escapeHtmlLight(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `\n<table>${thead}${tbody}</table>\n`;
  });

  // Convert H1-H4 headings.
  text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Blockquotes.
  text = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

  // Bold + italic.
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?=[^*]|$)/g, '$1<em>$2</em>');

  // Bullet lists.
  text = text.replace(/((?:^[-*]\s+[^\n]+\n?)+)/gm, (_, block) => {
    const items = block.trim().split('\n').map((l: string) => l.replace(/^[-*]\s+/, '').trim());
    return `<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>\n`;
  });

  // Remaining line groups → paragraphs (only if not already inside a tag).
  text = text.split(/\n\n+/).map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    // Already HTML block?
    if (/^<(h[1-6]|p|ul|ol|table|blockquote|div|hr)/i.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return text;
}


function escapeHtmlLight(s: string): string {
  return s
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/<(?!\/?(?:strong|em|b|i|code|br)\b)/g, '&lt;');
}


// ---------- Helpers ----------

function arrayFrom(v: unknown): Array<Record<string, unknown>> {
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}


interface MultiYearRow {
  label: string;
  values: string[];           // aligned with years[]
  trend_hint?: string;
}

interface MultiYearTrend {
  years: string[];            // ['2021','2022','2023','2024','2025']
  revenue_row: MultiYearRow[];
  balance_row: MultiYearRow[];
  cashflow_row: MultiYearRow[];
  has_data: boolean;
}


interface MultiYearTrendFull extends MultiYearTrend {
  ratio_row: MultiYearRow[];
  dividend_row: MultiYearRow[];
}


/** Build a 5-year pivot from parse_standardization.standardized_statements.
 *  Annual rows pivoted by metric so the template can render
 *  Metric | 2021 | 2022 | 2023 | 2024 | 2025 tables. */
function buildMultiYearTrend(statements: Array<Record<string, unknown>>): MultiYearTrendFull {
  // Pick annual periods only (FY-YYYY) and sort ascending.
  const annual = statements
    .filter(s => {
      const lbl = String(s.period_label ?? '');
      return /^FY-\d{4}$/.test(lbl);
    })
    .sort((a, b) => Number(a.year ?? 0) - Number(b.year ?? 0));

  if (annual.length === 0) return { years: [], revenue_row: [], balance_row: [], cashflow_row: [], ratio_row: [], dividend_row: [], has_data: false };

  // Take last 5 years.
  const recent = annual.slice(-5);
  const years = recent.map(s => String(s.year ?? s.period_label ?? ''));

  function pivotRow(
    section: 'balance_sheet' | 'income_statement' | 'cash_flow',
    key: string,
    label: string,
  ): MultiYearRow {
    const values = recent.map(s => {
      const block = (s[section] as Record<string, unknown> | null | undefined) ?? {};
      const v = block[key];
      return v != null ? formatTRY(v as number | string, 0) : '—';
    });
    return { label, values };
  }

  const revenueRow: MultiYearRow[] = [
    pivotRow('income_statement', 'revenue', 'Hasılat'),
    pivotRow('income_statement', 'gross_profit', 'Brüt Kar'),
    pivotRow('income_statement', 'operating_income', 'Faaliyet Karı'),
    pivotRow('income_statement', 'ebitda', 'FAVÖK'),
    pivotRow('income_statement', 'net_income', 'Net Kar'),
  ].filter(r => r.values.some(v => v !== '—'));

  const balanceRow: MultiYearRow[] = [
    pivotRow('balance_sheet', 'total_assets', 'Toplam Varlıklar'),
    pivotRow('balance_sheet', 'cash_and_equivalents', 'Nakit ve Benzerleri'),
    pivotRow('balance_sheet', 'inventories', 'Stoklar'),
    pivotRow('balance_sheet', 'ppe_net', 'Maddi Duran Varlıklar'),
    pivotRow('balance_sheet', 'short_term_debt', 'KV Finansal Borç'),
    pivotRow('balance_sheet', 'long_term_debt', 'UV Finansal Borç'),
    pivotRow('balance_sheet', 'total_equity', 'Toplam Özsermaye'),
  ].filter(r => r.values.some(v => v !== '—'));

  const cashflowRow: MultiYearRow[] = [
    pivotRow('cash_flow', 'operating_cash_flow', 'Operasyonel Nakit'),
    pivotRow('cash_flow', 'capex', 'CAPEX'),
    pivotRow('cash_flow', 'free_cash_flow', 'Serbest Nakit'),
    pivotRow('cash_flow', 'dividends_paid', 'Temettü Ödemesi'),
  ].filter(r => r.values.some(v => v !== '—'));

  // ---------- Ratio pivot ----------
  const ratioRow: MultiYearRow[] = [];
  function addRatio(label: string, compute: (s: Record<string, unknown>) => number | null, pct: boolean): void {
    const values = recent.map(s => {
      const v = compute(s);
      if (v == null || !Number.isFinite(v)) return '—';
      return pct ? formatPct(v, 1) : v.toFixed(2);
    });
    if (values.some(v => v !== '—')) ratioRow.push({ label, values });
  }

  const is = (s: Record<string, unknown>) => (s.income_statement as Record<string, unknown> | null) ?? {};
  const bs = (s: Record<string, unknown>) => (s.balance_sheet as Record<string, unknown> | null) ?? {};
  const cf = (s: Record<string, unknown>) => (s.cash_flow as Record<string, unknown> | null) ?? {};
  const numFrom = (block: Record<string, unknown>, key: string): number | null => {
    const v = block[key];
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  addRatio('Brüt Marj', s => {
    const r = numFrom(is(s), 'revenue');
    const g = numFrom(is(s), 'gross_profit');
    return r && g ? (g / r) * 100 : null;
  }, true);
  addRatio('FAVÖK Marjı', s => {
    const r = numFrom(is(s), 'revenue');
    const e = numFrom(is(s), 'ebitda');
    return r && e ? (e / r) * 100 : null;
  }, true);
  addRatio('Net Marj', s => {
    const r = numFrom(is(s), 'revenue');
    const n = numFrom(is(s), 'net_income');
    return r && n ? (n / r) * 100 : null;
  }, true);
  addRatio('ROE', s => {
    const n = numFrom(is(s), 'net_income');
    const e = numFrom(bs(s), 'total_equity');
    return n && e ? (n / e) * 100 : null;
  }, true);
  addRatio('ROA', s => {
    const n = numFrom(is(s), 'net_income');
    const a = numFrom(bs(s), 'total_assets');
    return n && a ? (n / a) * 100 : null;
  }, true);
  addRatio('Net Borç/FAVÖK', s => {
    const std = numFrom(bs(s), 'short_term_debt') ?? 0;
    const ltd = numFrom(bs(s), 'long_term_debt') ?? 0;
    const cash = numFrom(bs(s), 'cash_and_equivalents') ?? 0;
    const ebitda = numFrom(is(s), 'ebitda');
    const netDebt = std + ltd - cash;
    return ebitda ? netDebt / ebitda : null;
  }, false);
  addRatio('Cari Oran', s => {
    const ca = numFrom(bs(s), 'current_assets');
    const cl = numFrom(bs(s), 'current_liabilities');
    return ca && cl ? ca / cl : null;
  }, false);

  // ---------- Dividend history ----------
  const dividendRow: MultiYearRow[] = [];
  const divVals = recent.map(s => numFrom(cf(s), 'dividends_paid'));
  const revVals = recent.map(s => numFrom(is(s), 'revenue'));
  const niVals = recent.map(s => numFrom(is(s), 'net_income'));
  if (divVals.some(v => v != null)) {
    dividendRow.push({
      label: 'Temettü Ödemesi (mn TL)',
      values: divVals.map(v => v != null ? formatTRY(Math.abs(v), 0) : '—'),
    });
    dividendRow.push({
      label: 'Ciro Yüzdesi',
      values: divVals.map((v, i) => v != null && revVals[i] ? formatPct((Math.abs(v) / revVals[i]!) * 100, 2) : '—'),
    });
    dividendRow.push({
      label: 'Payout Ratio (Net Kar Yüzdesi)',
      values: divVals.map((v, i) => v != null && niVals[i] ? formatPct((Math.abs(v) / niVals[i]!) * 100, 1) : '—'),
    });
  }

  return {
    years,
    revenue_row: revenueRow,
    balance_row: balanceRow,
    cashflow_row: cashflowRow,
    ratio_row: ratioRow,
    dividend_row: dividendRow,
    has_data: revenueRow.length + balanceRow.length + cashflowRow.length + ratioRow.length > 0,
  };
}


function getDcfField(dcf: Record<string, unknown> | null, key: string): unknown {
  if (!dcf) return undefined;
  return (dcf as Record<string, unknown>)[key];
}


/** Place red_flags and divergences on the 3×3 impact × likelihood grid.
 *  Heuristic: severity=critical → high impact, warning → medium, info → low.
 *  Likelihood inferred by keyword matching (kesin/beklenen = high,
 *  olası = medium, potansiyel/spekülatif = low). */
function buildRiskMatrix(
  fa: Record<string, unknown> | null,
  ss: Record<string, unknown> | null,
): Record<string, string> {
  const cells: Record<string, string[]> = {
    high_low: [], high_med: [], high_high: [],
    med_low: [], med_med: [], med_high: [],
    low_low: [], low_med: [], low_high: [],
  };

  const classify = (label: string, severity: string): [string, string] => {
    const impactLevel = severity === 'critical' ? 'high' : severity === 'warning' ? 'med' : 'low';
    const l = label.toLowerCase();
    let likelihood: string;
    if (/kesin|beklenen|certain|expected|already/.test(l)) likelihood = 'high';
    else if (/olası|olasi|likely|probable/.test(l)) likelihood = 'med';
    else likelihood = 'low';
    return [impactLevel, likelihood];
  };

  for (const f of arrayFrom(fa?.red_flags ?? [])) {
    const label = String(f.code ?? f.message ?? '').slice(0, 30);
    const [imp, lik] = classify(label, String(f.severity ?? '').toLowerCase());
    const key = `${imp}_${lik}`;
    if (cells[key]) cells[key].push(label);
  }
  for (const d of arrayFrom(ss?.divergences ?? [])) {
    const s = String(d).slice(0, 30);
    cells.med_med.push(s);   // divergences default to center cell
  }

  const out: Record<string, string> = {};
  for (const [k, list] of Object.entries(cells)) {
    out[k] = list.length === 0 ? '—' : list.slice(0, 2).join(' / ');
  }
  return out;
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


function translateSentiment(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (s === 'positive') return 'Pozitif';
  if (s === 'negative') return 'Negatif';
  if (s === 'neutral') return 'Nötr';
  return s || '—';
}
