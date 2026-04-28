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
  translateRiskCode,
} from './auto_commentary.js';
import { buildNarrativeBlocks, cleanupMarkdownForFallback } from './llm_narrative.js';
import { resolvePeerBundle } from './peer_sets.js';
import { resolveSwot } from './swot_analysis.js';
import { barChart, columnChart, gaugeChart, horizontalBarChart, lineChart, pieChart, priceBandChart, radarChart, stackedAreaChart, timelineChart, waterfallChart } from './svg_charts.js';
import { formatPct, formatRatio, formatTRY, type TemplateContext, type TemplateValue } from './template_engine.js';


// Phase 8K: parseJson delegates to shared parseStructuredOutput (lib/).
// Implementation identical to pre-refactor; consolidated so manifest/extract.ts
// and orchestrator.ts can share telemetry counters (getParseModeCounts).
import { parseStructuredOutputValue } from '../../lib/parse-structured-output.js';

function parseJson<T = unknown>(raw: unknown): T | null {
  return parseStructuredOutputValue<T>(raw);
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
  aviation: 'Havacılık',
  telecom: 'Telekomünikasyon',
  energy: 'Enerji',
  steel: 'Demir-Çelik',
  refinery: 'Rafineri',
  retail: 'Perakende',
  defense: 'Savunma',
};

const TICKER_SECTOR_OVERRIDE: Record<string, string> = {
  'THYAO': 'aviation',
  'PGSUS': 'aviation',
  'TAVHL': 'aviation',
  'CLEBI': 'aviation',
  'ASELS': 'defense',
  'TCELL': 'telecom',
  'TUPRS': 'refinery',
  'BIMAS': 'retail',
  'EREGL': 'steel',
};

const TICKER_COMPANY_NAME: Record<string, string> = {
  'THYAO': 'Türk Hava Yolları A.O.',
  'PGSUS': 'Pegasus Hava Taşımacılığı A.Ş.',
  'EREGL': 'Ereğli Demir ve Çelik Fabrikaları T.A.Ş.',
  'KCHOL': 'Koç Holding A.Ş.',
  'SAHOL': 'Sabancı Holding A.Ş.',
  'GARAN': 'Türkiye Garanti Bankası A.Ş.',
  'AKBNK': 'Akbank T.A.Ş.',
  'ISCTR': 'Türkiye İş Bankası A.Ş.',
  'TUPRS': 'Türkiye Petrol Rafinerileri A.Ş.',
  'SISE': 'Türkiye Şişe ve Cam Fabrikaları A.Ş.',
  'ASELS': 'Aselsan Elektronik Sanayi ve Ticaret A.Ş.',
  'BIMAS': 'BİM Birleşik Mağazalar A.Ş.',
  'TOASO': 'Tofaş Türk Otomobil Fabrikası A.Ş.',
  'FROTO': 'Ford Otomotiv Sanayi A.Ş.',
  'TCELL': 'Turkcell İletişim Hizmetleri A.Ş.',
  'ASTOR': 'Astor Enerji A.Ş.',
  'KOZAL': 'Koza Altın İşletmeleri A.Ş.',
  'EKGYO': 'Emlak Konut GYO A.Ş.',
  'HEKTS': 'Hektaş Ticaret T.A.Ş.',
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

  // Extract hybrid LLM narratives (from Python+LLM enrichment)
  const hybridFA = typeof fa?.llm_narrative === 'string' ? fa.llm_narrative as string : undefined;
  const hybridMacro = (() => {
    const m = parseJson<Record<string, unknown>>(ctx['macro_analysis_output']);
    return typeof m?.llm_narrative === 'string' ? m.llm_narrative as string : undefined;
  })();
  const hybridTech = typeof tech?.llm_narrative === 'string' ? tech.llm_narrative as string : undefined;
  const hybridSS = typeof ss?.llm_narrative === 'string' ? ss.llm_narrative as string : undefined;
  const macro = parseJson<Record<string, unknown>>(ctx['macro_analysis_output']);
  const esgOut = parseJson<Record<string, unknown>>(ctx['esg_agent_output']);
  const news = parseJson<Record<string, unknown>>(ctx['sentiment_news_agent_output']);
  const ac = parseJson<Record<string, unknown>>(ctx['analyst_consensus_agent_output']);
  const parsedRaw = parseJson<Record<string, unknown>>(ctx['parse_standardization_output']);
  const parsed = normalizeParseStandardization(parsedRaw);

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
    label: translateMetricLabel(String(h.label ?? h.code ?? '')),
    value_formatted: formatValueByCode(String(h.code ?? ''), h.value),
    narrative_hint: translateMetricHint(String(h.code ?? ''), String(h.narrative_hint ?? '')),
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

  const translateFinding = (s: string): string => {
    return s
      .replace(/\bNO_FINANCIAL_ANALYSIS\b/g, 'Finansal analiz çalıştırılamadı')
      .replace(/\bcannot score\b/gi, 'skorlama yapılamadı')
      .replace(/\bno data\b/gi, 'veri yok')
      .replace(/\bmissing\b/gi, 'eksik')
      .replace(/\bfailed\b/gi, 'başarısız');
  };
  // Critical findings — prefer FA red_flags (real business risks) over QA warnings (pipeline issues)
  const faRedFlags = arrayFrom(fa?.red_flags ?? [])
    .map((f: Record<string, unknown>) => translateFinding(String(f.message ?? translateRiskCode(String(f.code ?? '')))));
  const ssDivergences = arrayFrom(ss?.divergences ?? []).map(s => translateFinding(String(s)));
  const criticalFindings: string[] = [
    ...faRedFlags,
    ...ssDivergences,
  ].filter(Boolean).slice(0, 6);

  // Strengths / Weaknesses — enrich from FA metrics if signal buckets are sparse
  const signalBuckets = (ss?.signals ?? {}) as { positive?: unknown[]; negative?: unknown[]; neutral?: unknown[] };
  const translateSignal = (s: string): string => {
    return s
      .replace(/^Event net: negative.*$/i, 'Olay etkisi: negatif')
      .replace(/^Event net: positive.*$/i, 'Olay etkisi: pozitif')
      .replace(/^Event net: neutral.*$/i, 'Olay etkisi: nötr');
  };
  const rawStrengths: string[] = arrayFrom(signalBuckets.positive)
    .slice(0, 5)
    .map((s: Record<string, unknown>) => translateSignal(translateMetricLabel(String(s.label ?? ''))));
  const rawWeaknesses: string[] = arrayFrom(signalBuckets.negative)
    .slice(0, 5)
    .map((s: Record<string, unknown>) => translateSignal(translateMetricLabel(String(s.label ?? ''))));

  // Auto-enrich if < 3 signals — derive from FA canonical numbers
  const cn = (fa?.canonical_numbers ?? {}) as Record<string, unknown>;
  if (rawStrengths.length < 3) {
    const roe = numOrNull(cn.roe);
    const gm = numOrNull(cn.gross_margin);
    const cr = numOrNull(cn.current_ratio);
    const ni = numOrNull(cn.net_income);
    if (ni != null && ni > 0 && !rawStrengths.some(s => s.includes('kâr'))) rawStrengths.push(`Net kâr pozitif: ${(ni / 1e9).toFixed(1)} milyar TL`);
    if (roe != null && roe > 10 && !rawStrengths.some(s => s.includes('ROE'))) rawStrengths.push(`ROE %${roe.toFixed(1)} — sektör ortalamasının üzerinde`);
    if (gm != null && gm > 15 && !rawStrengths.some(s => s.includes('marj'))) rawStrengths.push(`Brüt marj %${gm.toFixed(1)}`);
    // OCF from parse — latestAnnual not yet defined here, use parsed directly
    // Fix #21 — find() picked FIRST FY (FY-2020). Sort by year DESC, but skip
    // empty placeholder rows (parse_standardization emits FY-2026 stubs with
    // revenue=0 and null CF fields; BIMAS had 46 such placeholders that
    // hijacked latestFY → canonical CF table rendered empty).
    const _hasRealData = (s: Record<string, unknown>) => {
      const rev = (s.income_statement as Record<string, unknown> | null)?.revenue;
      return rev != null && Number(rev) > 0;
    };
    const latestFY = arrayFrom(parsed?.standardized_statements ?? [])
      .filter((s: Record<string, unknown>) => String(s.period_label ?? '').startsWith('FY-') && _hasRealData(s))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const ya = parseInt(String(a.period_label ?? '').replace('FY-', ''), 10) || 0;
        const yb = parseInt(String(b.period_label ?? '').replace('FY-', ''), 10) || 0;
        return yb - ya;
      })[0];
    const cfBlock = (latestFY?.cash_flow as Record<string, unknown> | null) ?? {};
    const ocf = numOrNull(cfBlock.operating_cash_flow);
    if (ocf != null && ocf > 0) rawStrengths.push(`Güçlü operasyonel nakit akışı: ${(ocf / 1e9).toFixed(1)} milyar TL`);
  }
  if (rawWeaknesses.length < 3) {
    const cr = numOrNull(cn.current_ratio);
    const ndEbitda = numOrNull(cn.net_debt_to_ebitda);
    if (cr != null && cr < 1) rawWeaknesses.push(`Cari oran ${cr.toFixed(2)}x — kısa vadeli likidite baskısı`);
    if (ndEbitda != null && ndEbitda > 3) rawWeaknesses.push(`Net Borç/FAVÖK ${ndEbitda.toFixed(1)}x — yüksek kaldıraç`);
    if (!cn.ebitda_margin) rawWeaknesses.push('FAVÖK marjı hesaplanamadı — amortisman verisi eksik');
    if (!cn.fcf) rawWeaknesses.push('Serbest nakit akışı hesaplanamadı — CAPEX verisi eksik');
  }
  const strengths = rawStrengths.filter(Boolean).slice(0, 5);
  const weaknesses = rawWeaknesses.filter(Boolean).slice(0, 5);

  // ----- II. Şirket Profili -----

  const companyHighlights: Array<{ label: string; value: string }> = [];
  if (fa?.ticker) companyHighlights.push({ label: 'Ticker', value: String(fa.ticker).toUpperCase() });
  if (fa?.period_label) companyHighlights.push({ label: 'Dönem', value: String(fa.period_label) });
  {
    const sectorForHighlight = TICKER_SECTOR_OVERRIDE[ticker.toUpperCase()] ?? String(fa?.sector ?? 'industrial').toLowerCase();
    companyHighlights.push({ label: 'Sektör', value: SECTOR_LABEL_TR[sectorForHighlight] ?? sectorForHighlight });
  }
  // Merge FA canonical_numbers with parse_standardization balance_sheet/income_statement
  // Parse has detailed line items (cash_and_equivalents, trade_receivables, inventories...)
  // FA has ratios (roe, gross_margin, net_margin...)
  const faCn = (fa?.canonical_numbers ?? {}) as Record<string, unknown>;
  const parsedStatements = arrayFrom(parsed?.standardized_statements ?? []);
  // Fix #21 — same bug as line 244 + same FY-2026 placeholder filter.
  const _hasRealAnnualData = (s: Record<string, unknown>) => {
    const rev = (s.income_statement as Record<string, unknown> | null)?.revenue;
    return rev != null && Number(rev) > 0;
  };
  const latestAnnual = parsedStatements
    .filter((s: Record<string, unknown>) => String(s.period_label ?? '').startsWith('FY-') && _hasRealAnnualData(s))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const ya = parseInt(String(a.period_label ?? '').replace('FY-', ''), 10) || 0;
      const yb = parseInt(String(b.period_label ?? '').replace('FY-', ''), 10) || 0;
      return yb - ya;
    })[0];
  const parseBS = (latestAnnual?.balance_sheet as Record<string, unknown> | null) ?? {};
  const parseIS = (latestAnnual?.income_statement as Record<string, unknown> | null) ?? {};
  const parseCF = (latestAnnual?.cash_flow as Record<string, unknown> | null) ?? {};

  // Build unified canonical numbers — parse line items + FA ratios
  const canonicalNumbers: Record<string, unknown> = {
    ...faCn,
    // Override with parse line items (more granular)
    total_assets: parseBS.total_assets ?? faCn.total_assets,
    total_liabilities: parseBS.total_liabilities ?? faCn.total_liabilities,
    total_equity: parseBS.total_equity ?? faCn.total_equity,
    current_assets: parseBS.current_assets,
    cash_and_equivalents: parseBS.cash_and_equivalents,
    cash: parseBS.cash_and_equivalents, // alias
    trade_receivables: parseBS.trade_receivables,
    receivables: parseBS.trade_receivables, // alias
    inventories: parseBS.inventories,
    inventory: parseBS.inventories, // alias
    ppe_net: parseBS.ppe_net,
    goodwill: parseBS.goodwill,
    intangibles: parseBS.intangibles,
    current_liabilities: parseBS.current_liabilities,
    short_term_debt: parseBS.short_term_debt,
    long_term_debt: parseBS.long_term_debt,
    trade_payables: parseBS.trade_payables,
    non_current_assets: parseBS.non_current_assets,
    // Income statement
    revenue: parseIS.revenue ?? faCn.revenue,
    cost_of_sales: parseIS.cost_of_sales,
    gross_profit: parseIS.gross_profit,
    operating_income: parseIS.operating_income,
    net_income: parseIS.net_income ?? faCn.net_income,
    // Cash flow
    operating_cash_flow: parseCF.operating_cash_flow,
    capex: parseCF.capex,
    financing_cash_flow: parseCF.financing_cash_flow,
    dividends_paid: parseCF.dividends_paid,
    depreciation_amortization: parseCF.depreciation_amortization ?? parseIS.depreciation_amortization,
    // Fix #6 — ΔWC + Normalize FCF + period-annualized projections (CEO mandate quartet)
    change_in_working_capital: parseCF.change_in_working_capital ?? faCn.change_in_working_capital,
    wc_release: faCn.wc_release,
    normalized_fcf: faCn.normalized_fcf,
    fcf_annualized: faCn.fcf_annualized,
    normalized_fcf_annualized: faCn.normalized_fcf_annualized,
  };

  // Compute derived metrics if missing
  const opInc = numOrNull(canonicalNumbers.operating_income);
  const da = numOrNull(canonicalNumbers.depreciation_amortization);
  const ocfVal = numOrNull(canonicalNumbers.operating_cash_flow);
  const capexVal = numOrNull(canonicalNumbers.capex);

  // EBITDA = Operating Income + D&A (if both available)
  if (!canonicalNumbers.ebitda && opInc != null && da != null) {
    canonicalNumbers.ebitda = opInc + Math.abs(da);
    const rev = numOrNull(canonicalNumbers.revenue);
    if (rev && rev > 0) canonicalNumbers.ebitda_margin = ((opInc + Math.abs(da)) / rev) * 100;
  }
  // EBITDA approximate from OCF if D&A missing but OCF available (rough proxy)
  if (!canonicalNumbers.ebitda && opInc != null && ocfVal != null && ocfVal > opInc) {
    // D&A ≈ OCF - Operating Income (very rough, includes WC changes)
    // Don't use this — too inaccurate
  }

  // FCF = OCF - |CAPEX| (if FA didn't compute it)
  if (!canonicalNumbers.fcf && ocfVal != null && capexVal != null) {
    canonicalNumbers.fcf = ocfVal - Math.abs(capexVal);
  }

  // Fix #6 — fallback compute Normalize FCF + annualization if FA agent omitted them
  const fcfVal = numOrNull(canonicalNumbers.fcf);
  const wcChangeVal = numOrNull(canonicalNumbers.change_in_working_capital);
  if (canonicalNumbers.wc_release == null && wcChangeVal != null) {
    canonicalNumbers.wc_release = -wcChangeVal;
  }
  if (canonicalNumbers.normalized_fcf == null && fcfVal != null && wcChangeVal != null) {
    canonicalNumbers.normalized_fcf = fcfVal - wcChangeVal;
  }
  // Period-aware multiplier mirrors python engine _annualize_multiplier
  const periodLabelRaw = String(fa?.period_label ?? '');
  const annualMultiplier =
    periodLabelRaw.startsWith('Q1-') ? 4 :
    periodLabelRaw.startsWith('H1-') ? 2 :
    periodLabelRaw.startsWith('Q3-') ? 4 / 3 :
    1;
  if (canonicalNumbers.fcf_annualized == null && fcfVal != null) {
    canonicalNumbers.fcf_annualized = fcfVal * annualMultiplier;
  }
  if (canonicalNumbers.normalized_fcf_annualized == null && canonicalNumbers.normalized_fcf != null) {
    canonicalNumbers.normalized_fcf_annualized = (canonicalNumbers.normalized_fcf as number) * annualMultiplier;
  }

  // Net Debt / EBITDA
  const ebitdaVal = numOrNull(canonicalNumbers.ebitda);
  const ndVal = numOrNull(canonicalNumbers.net_debt);
  if (!canonicalNumbers.net_debt_to_ebitda && ebitdaVal != null && ebitdaVal > 0 && ndVal != null) {
    canonicalNumbers.net_debt_to_ebitda = ndVal / ebitdaVal;
  }

  // Helper: format large TRY values as "milyar TL"
  const formatBnTRY = (v: unknown): string => {
    const n = numOrNull(v);
    if (n == null) return 'Raporlanmadı';
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mn`;
    return formatTRY(n, 0);
  };

  if (canonicalNumbers.revenue != null) companyHighlights.push({ label: 'Toplam Gelir (TL)', value: formatBnTRY(canonicalNumbers.revenue) });
  if (canonicalNumbers.total_equity != null) companyHighlights.push({ label: 'Toplam Özsermaye (TL)', value: formatBnTRY(canonicalNumbers.total_equity) });
  if (canonicalNumbers.net_debt != null) companyHighlights.push({ label: 'Net Borç (TL)', value: formatBnTRY(canonicalNumbers.net_debt) });
  if (canonicalNumbers.net_income != null) companyHighlights.push({ label: 'Net Kâr (TL)', value: formatBnTRY(canonicalNumbers.net_income) });

  // ----- III. Finansal Tablolar -----

  const canonicalBalanceSheet = buildCanonicalTable(canonicalNumbers, [
    ['total_assets', 'Toplam Varlıklar'],
    ['cash_and_equivalents', 'Nakit ve Benzerleri'],
    ['trade_receivables', 'Ticari Alacaklar'],
    ['inventories', 'Stoklar'],
    ['current_assets', 'Toplam Dönen Varlıklar'],
    ['ppe_net', 'Maddi Duran Varlıklar (Net)'],
    ['intangibles', 'Maddi Olmayan Varlıklar'],
    ['goodwill', 'Şerefiye'],
    ['non_current_assets', 'Toplam Duran Varlıklar'],
    ['total_liabilities', 'Toplam Yükümlülükler'],
    ['current_liabilities', 'Kısa Vadeli Yükümlülükler'],
    ['short_term_debt', 'KV Finansal Borç'],
    ['trade_payables', 'Ticari Borçlar'],
    ['long_term_debt', 'UV Finansal Borç'],
    ['total_equity', 'Toplam Özsermaye'],
  ]);

  const canonicalIncomeStatement = buildCanonicalTable(canonicalNumbers, [
    ['revenue', 'Hasılat'],
    ['cost_of_sales', 'Satışların Maliyeti'],
    ['gross_profit', 'Brüt Kâr'],
    ['operating_income', 'Faaliyet Kârı'],
    ['ebitda', 'FAVÖK (EBITDA)'],
    ['net_income', 'Net Dönem Kârı'],
  ]);

  // ----- İşletme Sermayesi Metrikleri (her zaman hesaplansın) -----

  const workingCapitalTable = buildWorkingCapitalTable(canonicalNumbers, standardizedStatementsForWC(parsed));

  const isNonFy = /^(Q[1-4]|H1)-/.test(periodLabelRaw);
  const annualSuffix = isNonFy ? ` (yıllıklandırılmış — ${periodLabelRaw} bazından projeksiyon)` : '';
  const canonicalCashFlow = buildCanonicalTable(canonicalNumbers, [
    ['operating_cash_flow', 'Operasyonel Nakit Akışı (OCF)'],
    ['capex', 'Yatırım Harcaması (CAPEX)'],
    ['free_cash_flow', 'Serbest Nakit Akışı (FCF)'],
    // Fix #6 — CEO mandate quartet (WC release + Normalize FCF + annualized projeksiyonlar)
    ['change_in_working_capital', 'İşletme Sermayesi Değişimi (ΔWC)'],
    ['wc_release', 'Nakit Serbest Bırakımı (−ΔWC)'],
    ['normalized_fcf', 'Normalize Edilmiş FCF (FCF − ΔWC)'],
    ...(isNonFy ? [
      ['fcf_annualized', `FCF Yıllıklandırılmış${annualSuffix}`],
      ['normalized_fcf_annualized', `Normalize FCF Yıllıklandırılmış${annualSuffix}`],
    ] as Array<[string, string]> : []),
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

  // ----- V. Sektör Karşılaştırması — Hardcoded peer bundle + real fa -----

  const peerBundle = resolvePeerBundle(ticker);
  const peerBenchmarkRows = peerBundle ? buildPeerBenchmarkRows(
    fa, peerBundle, canonicalNumbers,
  ) : [];
  const peerListHas = peerBundle != null && peerBundle.peers.length > 0;
  const peerMultiplesRows = peerBundle ? buildMultiplesRows(peerBundle, canonicalNumbers) : [];

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

  // Wave 4 (2026-04-28) — peer absence detection + honest disclaim.
  // When sector_competition.peer_count is 0 (no live peer chain run),
  // benchmarks devolve into self-median artifacts (min=Q1=median=Q3=
  // max=company_value). Surface this honestly to the board reader
  // instead of rendering deceptive "Sektör Medyanı = company value"
  // bars without context.
  const peerCountFromSc = (() => {
    const peers = sc?.peer_group;
    return Array.isArray(peers) ? peers.length : 0;
  })();
  const peerSelfMedianDetected = benchmarks.length > 0 && peerCountFromSc === 0;
  const peerAbsenceBanner = peerSelfMedianDetected
    ? `<div style="margin:12px 0;padding:10px 14px;background:#fde8e8;border-left:4px solid #c53030;border-radius:4px;font-size:12px;color:#5a1a1a"><strong>⚠ Peer verisi yetersiz (peer_count=0):</strong> Sektör karşılaştırma istatistikleri gerçek emsal verisinden değil, şirketin kendi değerinden türetilmiştir (min=medyan=max=şirket). Aşağıdaki tablolar yalnızca <em>placeholder</em>'dır; SAHOL/DOHOL/AGHOL/SISE gibi gerçek peer chain'leri Wave-future'da paralel çalıştırılacaktır. Yönetim kurulu kararlarında bu rakamları emsal medyanı olarak okumayın.</div>`
    : '';

  // SWOT — sektör ve ticker-özel, gerçek iş analizi (swot_analysis.ts'ten).
  // Signal buckets'tan dökülen "Top quartile: ROE" gibi otomatik
  // etiketler yerine hand-curated Turkish cümleler.
  const swotSector = String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const swot = resolveSwot(ticker, swotSector);
  const swotHas = swot.strengths.length + swot.weaknesses.length + swot.opportunities.length + swot.threats.length > 0;

  // ----- VI. Makro -----

  // macro_analysis JSON is nested (rates.policy_rate, fx.usd_try vs.).
  // Previous flat-key lookup (macro?.usd_try) returned undefined and the
  // table rendered em-dashes across the board.
  const macroFx = (macro?.fx as Record<string, unknown> | null) ?? {};
  const macroRates = (macro?.rates as Record<string, unknown> | null) ?? {};
  const macroInflation = (macro?.inflation as Record<string, unknown> | null) ?? {};
  const macroGrowth = (macro?.growth as Record<string, unknown> | null) ?? {};
  const macroEquity = (macro?.equity as Record<string, unknown> | null) ?? {};

  // Cosmetic 2 — Python engine emits None for policy_rate/cpi/gdp/bist when
  // TCMB API is unreachable. The LLM's narrative JSON envelope still has
  // these (from WebSearch). Parse the envelope and use as fallback.
  let macroEnv: Record<string, Record<string, unknown>> = {};
  try {
    const narr = String(macro?.llm_narrative ?? '');
    const m = narr.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (m) {
      const parsed = JSON.parse(m[1]);
      if (parsed && typeof parsed === 'object' && parsed.macro_environment) {
        macroEnv = parsed.macro_environment as Record<string, Record<string, unknown>>;
      }
    }
  } catch { /* narrative not JSON-parseable, fallback to engine values only */ }

  const fromEnv = (group: string, key: string): unknown => {
    const g = macroEnv[group] as Record<string, unknown> | undefined;
    return g?.[key];
  };

  const macroContext = {
    usd_try: formatNumber(macroFx.usd_try ?? macro?.usd_try ?? fromEnv('currency', 'usd_try'), 4, ' TL'),
    eur_try: formatNumber(macroFx.eur_try ?? macro?.eur_try ?? fromEnv('currency', 'eur_try'), 4, ' TL'),
    policy_rate: formatPctFromMacro(macroRates.policy_rate ?? macro?.tcmb_policy_rate ?? fromEnv('monetary_policy', 'policy_rate')),
    tcmb_10y: formatPctFromMacro(macroRates.tcmb_10y ?? macro?.tcmb_10y_bond_yield),
    cpi_yoy: formatPctFromMacro(macroInflation.cpi_yoy ?? macro?.cpi_yoy ?? fromEnv('inflation', 'cpi_yoy')),
    // Fix #27 — macro_analysis narrative uses `gdp_fy2025_yoy` (year-first)
    // not `gdp_yoy_fy2025`. Check both shapes.
    gdp_yoy: formatPctFromMacro(
      macroGrowth.gdp_yoy
        ?? macro?.gdp_yoy
        ?? fromEnv('growth', 'gdp_fy2025_yoy')
        ?? fromEnv('growth', 'gdp_yoy_fy2025')
        ?? fromEnv('growth', 'gdp_yoy'),
    ),
    bist100_ytd_return: formatPctFromMacro(macroEquity.bist100_ytd_return ?? macro?.bist100_ytd_return ?? fromEnv('equity', 'bist100_ytd_return')),
    bist100_level: formatNumber(macroEquity.bist100_level ?? fromEnv('equity', 'bist100_level'), 0),
    // Fix #27 — hide rows when data is genuinely missing instead of
    // showing "Raporlanmadı". macro_analysis does not currently collect
    // 10Y bond yield; BIST-100 YTD is only sometimes populated.
    tcmb_10y_has: (macroRates.tcmb_10y ?? macro?.tcmb_10y_bond_yield) != null,
    bist100_has: (macroEquity.bist100_level ?? fromEnv('equity', 'bist100_level')) != null,
    bist100_ytd_has: (macroEquity.bist100_ytd_return ?? macro?.bist100_ytd_return ?? fromEnv('equity', 'bist100_ytd_return')) != null,
  };

  // ----- VII. Teknik -----
  // tech_analysis output has nested structure: momentum.rsi_14, price_data.last_close etc.
  const techMomentum = (tech?.momentum as Record<string, unknown> | null) ?? {};
  const techPriceData = (tech?.price_data as Record<string, unknown> | null) ?? {};
  const techMA = (tech?.moving_averages as Record<string, unknown> | null) ?? {};

  const trend = String(tech?.trend ?? tech?.overall_trend ?? '').toLowerCase();
  const rsi = numOrNull(techMomentum.rsi_14 ?? tech?.rsi_14 ?? tech?.rsi);
  const techVolatility = (tech?.volatility as Record<string, unknown> | null) ?? {};
  // last_close may not be in tech output — fallback to orchestrator pre-fetch or Bollinger middle (≈MA20)
  // Fix #28 — stop using MA20/bollinger_middle as last_close fallback. They
  // are NOT the close — in BIMAS 20260424 report "Son Kapanış" was 720.58 TL
  // which was actually MA20 (last close was ~763 TL). If real last_close is
  // missing, leave null so the UI can show "—" rather than lying.
  const lastClose = numOrNull(techPriceData.last_close ?? tech?.last_close ?? ctx['last_close_price']);
  const volumeAvg = numOrNull(techPriceData.volume_avg ?? tech?.volume_avg ?? tech?.average_volume);
  const maTable: Array<{ period: string; value: string; vs_close: string }> = [];
  const maEntries: Array<[string, unknown]> = [
    ['MA 20', techMA.ma_20 ?? techMA.ma20 ?? tech?.ma20],
    ['MA 50', techMA.ma_50 ?? techMA.ma50 ?? tech?.ma50],
    ['MA 100', techMA.ma_100 ?? techMA.ma100 ?? tech?.ma100],
    ['MA 200', techMA.ma_200 ?? techMA.ma200 ?? tech?.ma200],
  ];
  for (const [label, raw] of maEntries) {
    const v = numOrNull(raw);
    if (v != null) {
      const diff = lastClose != null ? ((lastClose / v - 1) * 100) : null;
      maTable.push({
        period: label,
        value: formatTRY(v, 2) + ' TL',
        vs_close: diff != null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` : '—',
      });
    }
  }

  const technical = tech ? {
    trend_label: trend === 'bullish' ? 'Yükseliş' : trend === 'bearish' ? 'Düşüş' : trend === 'neutral' ? 'Nötr' : '—',
    rsi: rsi != null ? rsi.toFixed(1) : '—',
    rsi_zone: rsi != null
      ? (rsi >= 70 ? 'Aşırı alım' : rsi <= 30 ? 'Aşırı satım' : rsi >= 55 ? 'Yüksek momentum' : rsi <= 45 ? 'Zayıf momentum' : 'Nötr')
      : '—',
    last_close: lastClose != null ? formatTRY(lastClose, 2) + ' TL' : '—',
    volume_avg: volumeAvg != null ? formatTRY(volumeAvg, 0) : '—',
    // Fix #28 — surface the data snapshot date so "Son Kapanış" can't be
    // misread as real-time. BIMAS 20260424 showed 720 TL from the 2026-04-22
    // daily bar; user correctly spotted that market price was ~763 TL.
    as_of_date: typeof tech?.as_of_date === 'string' ? String(tech.as_of_date) : null,
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
    statements: arrayFrom(e.affected_statements ?? []).map(s => {
      const v = String(s);
      return v.replace(/\bP&?L\b/g, 'G/Z').replace(/\bBS\b/g, 'Bilanço').replace(/\bCF\b/g, 'Nakit Akışı');
    }).join(', '),
  }));

  // ----- XI. Risk -----

  const risks: string[] = [
    ...arrayFrom(fa?.red_flags ?? [])
      .filter((f: Record<string, unknown>) => ['warning', 'critical'].includes(String(f.severity ?? '').toLowerCase()))
      .map((f: Record<string, unknown>) => translateFinding(String(f.message ?? translateRiskCode(String(f.code ?? ''))))),
    ...arrayFrom(ss?.divergences ?? []).map(s => translateFinding(String(s))),
    ...valuationWarnings.slice(0, 2),
  ].filter(Boolean).slice(0, 8);

  // ----- Sektör-spesifik Chairman uyarı banner'ı -----
  const sectorRawForBanner = String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const chairmanBanner = buildChairmanBanner(sectorRawForBanner, {
    ticker,
    criticalFlagCount: arrayFrom(fa?.red_flags ?? []).filter(f => String(f.severity ?? '').toLowerCase() === 'critical').length,
    tryWaccWarning: Boolean(val?.try_wacc_warning),
    holdingSotp: Boolean(val?.holding_sotp_required),
    bankingWarn: Boolean(val?.banking_sector_warning),
    subSector: peerBundle?.subSector ?? sectorRawForBanner,
  });

  // ----- Scenarios (Bull/Base/Bear) -----
  // If valuation agent provided DCF, derive scenarios from its
  // per_share_value ± sensitivity. Otherwise leave empty.
  //
  // Fix #8 (2026-04-24): previously the table showed target prices with
  // no visibility into WACC, terminal-g, or multiplier assumption; readers
  // couldn't audit the bear/base/bull math. The derivation pack now
  // surfaces the exact WACC, terminal growth and ±multiplier used.

  const dcfPerShare = numOrNull(dcf?.per_share_value);
  const dcfWacc = numOrNull(dcf?.wacc);
  const dcfTg = numOrNull(dcf?.terminal_growth);
  const lastCloseForDcf = lastClose ?? numOrNull(tech?.last_close);
  const bearMultiplier = 0.75;
  const bullMultiplier = 1.25;
  const fmtWacc = (v: number | null) => v != null ? `%${(v * 100).toFixed(1)}` : 'belirsiz';
  const fmtTg = (v: number | null) => v != null ? `%${(v * 100).toFixed(1)}` : 'belirsiz';
  const baseDerivation = dcfWacc != null && dcfTg != null
    ? `WACC ${fmtWacc(dcfWacc)}, Terminal g ${fmtTg(dcfTg)}`
    : 'DCF değerleme (WACC/Terminal g detayı eksik)';
  const scenarios = dcfPerShare != null ? {
    bear_price: formatTRY(dcfPerShare * bearMultiplier, 2) + ' TL',
    bear_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare * bearMultiplier / lastClose - 1) * 100), 1)}` : '−25% DCF',
    bear_derivation: `DCF fair value × ${bearMultiplier.toFixed(2)} = ${formatTRY(dcfPerShare * bearMultiplier, 2)} TL (bear kötümser senaryo, stres varsayımları altında)`,
    bear_triggers: [
      `WACC +200bps artış (${fmtWacc((dcfWacc ?? 0) + 0.02)})`,
      `Terminal g -150bps düşüş (${fmtTg((dcfTg ?? 0) - 0.015)})`,
      'Jeopolitik risk materyalizasyonu',
    ],
    base_price: formatTRY(dcfPerShare, 2) + ' TL',
    base_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare / lastClose - 1) * 100), 1)}` : 'DCF Orta',
    base_derivation: `DCF fair value — ${baseDerivation}`,
    base_triggers: [
      `Mevcut WACC ${fmtWacc(dcfWacc)} + terminal g ${fmtTg(dcfTg)} varsayımı`,
      'Yönetim guidance tutması',
      'Makro ortamda büyük değişim yok',
    ],
    bull_price: formatTRY(dcfPerShare * bullMultiplier, 2) + ' TL',
    bull_upside: lastClose != null ? `Fiyata ${formatPct(((dcfPerShare * bullMultiplier / lastClose - 1) * 100), 1)}` : '+25% DCF',
    bull_derivation: `DCF fair value × ${bullMultiplier.toFixed(2)} = ${formatTRY(dcfPerShare * bullMultiplier, 2)} TL (bull iyimser senaryo, re-rating varsayımı)`,
    bull_triggers: [
      `WACC -100bps düşüş (${fmtWacc((dcfWacc ?? 0) - 0.01)})`,
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
    aviation: {
      rivalry: 'Orta-Yüksek', rivalry_class: 'medium', rivalry_note: 'Bölgesel hub rekabeti yoğun (Emirates/Qatar/Etihad); LCC baskısı iç hatta güçlü.',
      entrants: 'Çok Düşük', entrants_class: 'low', entrants_note: 'Uçak finansmanı, slot sınırları, havalimanı kapasitesi ve düzenleyici engeller çok yüksek.',
      substitutes: 'Düşük', substitutes_class: 'low', substitutes_note: 'Kısa mesafe: yüksek hızlı tren; uzun mesafe: alternatif yok. Video konferans iş seyahati talebini kısmen azaltıyor.',
      suppliers: 'Yüksek', suppliers_class: 'high', suppliers_note: 'Boeing/Airbus düopolü, motor tedarik oligopolü (Rolls-Royce, CFM) ve yakıt karteli.',
      buyers: 'Düşük-Orta', buyers_class: 'low', buyers_note: 'Bireysel yolcu dağılmış; kurumsal kontratlar sınırlı fiyat baskısı.',
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

  const riskSector = TICKER_SECTOR_OVERRIDE[ticker.toUpperCase()]
    ?? String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const riskMatrix = buildRiskMatrix(fa, ss, qa, riskSector);

  // ----- XII. Catalysts -----

  const catalysts: string[] = [
    ...arrayFrom(signalBuckets.positive).slice(0, 3).map((s: Record<string, unknown>) => translateMetricLabel(String(s.label ?? ''))),
    ...arrayFrom(ev?.event_impacts ?? [])
      .filter((e: Record<string, unknown>) => String(e.impact_direction ?? '').toLowerCase() === 'positive' && String(e.timing_horizon ?? '').toLowerCase() !== 'long_term')
      .slice(0, 3)
      .map((e: Record<string, unknown>) => String(e.event_summary ?? '')),
  ].filter(Boolean).slice(0, 6);

  // ----- Assemble everything -----

  const sectorRaw = TICKER_SECTOR_OVERRIDE[ticker.toUpperCase()]
    ?? String(fa?.sector ?? val?.sector ?? 'industrial').toLowerCase();
  const sectorSourceLabel = String(val?.sector_source ?? 'structured');

  // ----- SVG Charts -----

  // Financial trend line chart (5-year revenue/EBITDA/net_income)
  const trendChartYears = multiYear.years;
  const trendSeries: Array<{ name: string; color?: string; values: Array<number | null> }> = [];
  for (const row of multiYear.revenue_row) {
    if (['Hasılat', 'FAVÖK', 'Net Kar'].includes(row.label)) {
      trendSeries.push({
        name: row.label,
        values: row.values.map(v => {
          if (v === '—') return null;
          const n = Number(String(v).replace(/[.,]/g, ''));
          return Number.isFinite(n) ? n : null;
        }),
      });
    }
  }
  const financialTrendSvg = trendChartYears.length > 1 && trendSeries.length > 0
    ? lineChart(trendChartYears, trendSeries, 'Gelir / FAVÖK / Net Kar Trendi (mn TL)')
    : '';

  // Sector benchmark bar chart
  const benchmarkGroups = benchmarks.slice(0, 6).map(b => ({
    label: b.label,
    companyValue: numOrNull(b.company_formatted?.replace(/[%.,a-zA-Z ]/g, '')),
    medianValue: numOrNull(b.median_formatted?.replace(/[%.,a-zA-Z ]/g, '')),
  }));
  const benchmarkChartSvg = benchmarkGroups.length > 0
    ? barChart(benchmarkGroups, 'Emsal Benchmark (Şirket vs Medyan)')
    : '';

  // KAP event timeline
  const timelineEvents = arrayFrom(ev?.event_impacts ?? []).slice(0, 15).map(e => {
    const disclosureRef = String(e.disclosure_reference ?? '');
    // pull announced_at from event_classification upstream if possible
    const events = parseJson<{ classified_events?: Array<Record<string, unknown>> }>(ctx['event_classification_output']);
    const match = events?.classified_events?.find(c => c.disclosure_id === disclosureRef);
    // Fix #15 (2026-04-24): increase label limit from 40 → 100 chars so
    // KAP event titles are readable instead of ellipsized to "Kurumsal
    // Yönetim Bilgi F…" which leaves the reader unable to identify the
    // event. Raw label may still be longer than any single SVG glyph row
    // can fit — timelineChart handles responsive truncation downstream.
    const rawLabel = String(e.event_summary ?? '').trim();
    const label = rawLabel.length > 100 ? rawLabel.slice(0, 97) + '…' : rawLabel;
    return {
      date: String(match?.announced_at ?? '').slice(0, 10),
      label,
      direction: String(e.impact_direction ?? 'neutral') as 'positive' | 'negative' | 'neutral' | 'mixed' | 'uncertain',
    };
  }).filter(e => e.date);
  const timelineChartSvg = timelineEvents.length > 1
    ? timelineChart(timelineEvents, 'Son 12 Ay KAP Olay Zaman Çizelgesi')
    : '';

  // Sentiment distribution pie (institutional palette)
  const sentimentPieSvg = sentimentHas && sentiment ? pieChart([
    { label: 'Pozitif', value: Number(sentimentDist.positive ?? 0), color: '#276749' },
    { label: 'Nötr', value: Number(sentimentDist.neutral ?? 0), color: '#718096' },
    { label: 'Negatif', value: Number(sentimentDist.negative ?? 0), color: '#9b2c2c' },
  ], 'Haber Sentiment Dağılımı') : '';

  // Sector-typical ownership pie (placeholder when context_extraction
  // doesn't surface structured ownership data)
  // Wave 4 (2026-04-28) — when the data comes from the static lookup
  // (buildOwnershipPie returns hardcoded ticker breakdown), wrap the
  // chart with an honest "static reference" rozet so the board reader
  // knows this isn't from a live KAP filing parse.
  const ownershipPie = buildOwnershipPie(ticker, sectorRaw);
  const ownershipPieSvg = ownershipPie
    ? `${pieChart(ownershipPie, 'Ortaklık Yapısı (Statik Referans)')}<div style="margin-top:8px;padding:6px 10px;background:#fff3cd;border-left:3px solid #c6973f;font-size:11px;color:#5a4400;border-radius:3px"><strong>ⓘ Statik referans verisi:</strong> Ortaklık yapısı hardcoded lookup'tan gelmektedir. Güncel KAP "Sermaye ve Pay Sahipleri" filing'inden parse edilmemiştir; küçük pay devirleri yansımayabilir. Wave-future: KAP-fed extractor.</div>`
    : '';

  // ESG Radar (E/S/G 3-axis) — sector-specific baseline profiles
  // Scores 0-100; adjusted by CBAM data availability and QA score
  const esgSectorProfile: Record<string, { E: number; S: number; G: number }> = {
    banking:    { E: 72, S: 70, G: 75 },  // Low direct emissions, strong governance
    holding:    { E: 60, S: 65, G: 68 },  // Weighted avg of subsidiaries
    aviation:   { E: 35, S: 62, G: 65 },  // High CO2 intensity
    steel:      { E: 30, S: 55, G: 60 },  // Heavy industry, CBAM exposure
    telecom:    { E: 68, S: 65, G: 70 },  // Low emissions, digital inclusion
    defense:    { E: 50, S: 58, G: 62 },  // Moderate, export controls
    refinery:   { E: 28, S: 55, G: 58 },  // High emissions, hazardous ops
    retail:     { E: 60, S: 62, G: 65 },  // Supply chain, labor
    energy:     { E: 40, S: 58, G: 62 },  // Generation mix dependent
    insurance:  { E: 70, S: 68, G: 72 },  // Low direct impact
    reit:       { E: 55, S: 65, G: 68 },  // Building efficiency
    industrial: { E: 50, S: 60, G: 65 },  // Default
  };
  const esgBase = esgSectorProfile[sectorRaw] ?? esgSectorProfile.industrial;
  const esgScores = {
    // E: Adjust down if CBAM cost exists (= high carbon), up if no CBAM exposure
    E: esgCbam?.total_annual_cost_eur != null
      ? Math.max(15, esgBase.E - 10)  // CBAM cost exists → worse E score
      : esgBase.E,
    S: esgBase.S,
    // G: Boost from high QA score (= good disclosure quality ≈ governance proxy)
    G: qa?.overall_score != null
      ? Math.min(95, esgBase.G + Math.round((Number(qa.overall_score) - 0.7) * 30))
      : esgBase.G,
  };
  const esgRadarSvg = radarChart([
    { label: 'Çevresel (E)', value: esgScores.E },
    { label: 'Sosyal (S)', value: esgScores.S },
    { label: 'Yönetişim (G)', value: esgScores.G },
  ], 'ESG Skor Profili (0-100)');

  // Price band chart — derive S/R from moving averages when available
  const lc = numOrNull(tech?.last_close);
  const dcfPerShareNum = dcf ? numOrNull((dcf as Record<string, unknown>).per_share_value) : null;
  const pbMa20 = numOrNull(techMA.ma_20 ?? techMA.ma20 ?? tech?.ma20);
  const pbMa50 = numOrNull(techMA.ma_50 ?? techMA.ma50 ?? tech?.ma50);
  const pbMa200 = numOrNull(techMA.ma_200 ?? techMA.ma200 ?? tech?.ma200);
  // Use MAs as support/resistance anchors: MA200 = strong S/R, MA50 = near S/R
  const pbSupport1 = pbMa50 != null && lc != null && pbMa50 < lc ? pbMa50 : lc != null ? lc * 0.95 : undefined;
  const pbSupport2 = pbMa200 != null && lc != null && pbMa200 < lc ? pbMa200 : lc != null ? lc * 0.88 : undefined;
  const pbResist1 = pbMa50 != null && lc != null && pbMa50 > lc ? pbMa50 : lc != null ? lc * 1.05 : undefined;
  const pbResist2 = pbMa200 != null && lc != null && pbMa200 > lc ? pbMa200 : lc != null ? lc * 1.12 : undefined;
  const priceBandSvg = lc != null ? priceBandChart({
    lastClose: lc,
    support1: pbSupport1,
    support2: pbSupport2,
    resistance1: pbResist1,
    resistance2: pbResist2,
    bearTarget: dcfPerShareNum ? dcfPerShareNum * 0.75 : lc * 0.8,
    baseTarget: dcfPerShareNum ?? lc * 1.1,
    bullTarget: dcfPerShareNum ? dcfPerShareNum * 1.25 : lc * 1.35,
  }, 'Destek/Direnç + Hedef Fiyat Bandı (TL)') : '';

  // QA Score gauge meter
  const qaGaugeSvg = qa?.overall_score != null
    ? gaugeChart(Number(qa.overall_score), 1, 'QA Skoru (0-1)', 'Kalite Göstergesi')
    : '';

  // Reconciliation pass rate gauge
  const recGaugeSvg = recTotal > 0
    ? gaugeChart(recPassRate, 1, `Uzlaştırma (${recPassed}/${recTotal})`, 'Veri Doğrulama')
    : '';

  // 5-year net income column chart (YoY comparison)
  const netIncomeColumns: Array<{ label: string; value: number }> = [];
  for (const row of multiYear.revenue_row) {
    if (row.label === 'Net Kar') {
      multiYear.years.forEach((yr, i) => {
        const raw = row.values[i];
        if (raw !== '—') {
          const n = Number(String(raw).replace(/[.,]/g, ''));
          if (Number.isFinite(n)) netIncomeColumns.push({ label: yr, value: Math.round(n / 1_000_000) });
        }
      });
    }
  }
  const netIncomeColumnSvg = netIncomeColumns.length > 1
    ? columnChart(netIncomeColumns, 'Yıllık Net Kar Trendi (mn TL)', '')
    : '';

  // Stacked area: revenue composition over years
  const revenueAreaSeries: Array<{ name: string; values: Array<number | null> }> = [];
  for (const row of multiYear.revenue_row) {
    if (['Hasılat', 'Brüt Kar', 'Net Kar'].includes(row.label)) {
      revenueAreaSeries.push({
        name: row.label,
        values: row.values.map(v => {
          if (v === '—') return null;
          const n = Number(String(v).replace(/[.,]/g, ''));
          return Number.isFinite(n) ? n : null;
        }),
      });
    }
  }
  const revenueAreaSvg = multiYear.years.length > 1 && revenueAreaSeries.length > 0
    ? stackedAreaChart(multiYear.years, revenueAreaSeries, 'Gelir-Brüt Kar-Net Kar Dağılımı')
    : '';

  // Financial health scorecards horizontal bar (institutional palette)
  const financialHealthSvg = horizontalBarChart([
    { label: 'QA Skoru', value: qa?.overall_score ? Number(qa.overall_score) * 100 : 0, suffix: '/100', color: '#1a365d' },
    { label: 'Sinyal Konverjansı', value: ss?.convergence_score ? Math.abs(Number(ss.convergence_score)) * 100 : 0, suffix: '/100', color: '#c6973f' },
    { label: 'Piotroski F', value: scoreMetrics.piotroski_f !== '—' ? Number(scoreMetrics.piotroski_f) * 11.1 : 0, suffix: '/100 (norm)', color: '#276749' },
    { label: 'Uzlaştırma', value: recPassRate * 100, suffix: '%', color: '#3182ce' },
  ], 'Kalite Skorları Karşılaştırma');

  // P&L waterfall chart — revenue → gross → EBITDA → net income breakdown
  const waterfallItems: Array<{ label: string; value: number; isTotal?: boolean }> = [];
  const revNum = numOrNull(cn.revenue);
  const cogsNum = numOrNull(cn.cogs);
  const grossNum = numOrNull(cn.gross_profit);
  const opexNum = grossNum != null && numOrNull(cn.operating_income) != null
    ? grossNum - Number(cn.operating_income) : null;
  const opIncNum = numOrNull(cn.operating_income);
  const finExpNum = opIncNum != null && numOrNull(cn.net_income) != null
    ? opIncNum - Number(cn.net_income) : null;
  const niNum = numOrNull(cn.net_income);

  if (revNum != null) {
    waterfallItems.push({ label: 'Hasılat', value: revNum / 1_000_000, isTotal: true });
    if (cogsNum != null) waterfallItems.push({ label: 'SMM', value: -Math.abs(cogsNum) / 1_000_000 });
    if (grossNum != null) waterfallItems.push({ label: 'Brüt Kar', value: grossNum / 1_000_000, isTotal: true });
    if (opexNum != null && opexNum > 0) waterfallItems.push({ label: 'OpEx', value: -opexNum / 1_000_000 });
    if (opIncNum != null) waterfallItems.push({ label: 'Faaliyet Karı', value: opIncNum / 1_000_000, isTotal: true });
    if (finExpNum != null && finExpNum !== 0) waterfallItems.push({ label: 'Fin. + Vergi', value: -finExpNum / 1_000_000 });
    if (niNum != null) waterfallItems.push({ label: 'Net Kar', value: niNum / 1_000_000, isTotal: true });
  }
  const waterfallSvg = waterfallItems.length >= 3
    ? waterfallChart(waterfallItems, 'Gelir Tablosu Şelale Analizi (mn TL)')
    : '';

  return {
    // Metadata
    ticker: ticker.toUpperCase(),
    company_name: TICKER_COMPANY_NAME[ticker.toUpperCase()]
      ?? String(fa?.company_name ?? fa?.sirket_adi ?? ctx['company_name'] ?? ticker).toUpperCase(),
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
    convergence_score: ss?.convergence_score != null && Number(ss.convergence_score) !== 0
      ? (Number(ss.convergence_score) > 0 ? '+' : '') + Number(ss.convergence_score).toFixed(2) : '—',
    signal_confidence: translateConfidence(ss?.confidence),
    reconciliation_pass_rate: recTotal > 0 ? `%${Math.round(recPassRate * 100)}` : '—',
    reconciliation_passed: recPassed,
    reconciliation_total: recTotal,

    // Section I — Temel Parametreler (EREGL tarzı)
    key_params: (() => {
      const params: Array<{ label: string; value: string }> = [];
      if (lastClose != null) params.push({ label: 'Güncel Fiyat', value: `${lastClose.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY` });
      const rev = numOrNull(canonicalNumbers.revenue);
      if (rev) params.push({ label: 'Hasılat', value: `${(rev / 1e9).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TRY` });
      const ni = numOrNull(canonicalNumbers.net_income);
      if (ni) params.push({ label: 'Net Kâr', value: `${(ni / 1e9).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TRY` });
      const nd = numOrNull(canonicalNumbers.net_debt);
      if (nd) params.push({ label: 'Net Borç', value: `${(nd / 1e9).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TRY` });
      const roe = numOrNull(canonicalNumbers.roe);
      if (roe) params.push({ label: 'ROE', value: formatPct(roe, 1) });
      const gm = numOrNull(canonicalNumbers.gross_margin);
      if (gm) params.push({ label: 'Brüt Marj', value: formatPct(gm, 1) });
      const pf = numOrNull(piotroski?.value);
      if (pf) params.push({ label: 'Piotroski F-Skoru', value: `${Math.round(pf)}/9` });
      params.push({ label: 'Sektör', value: SECTOR_LABEL_TR[sectorRaw] ?? sectorRaw });
      const periodLabel = String(fa?.period_label ?? '—');
      // Fix #16 (2026-04-24): if period is non-FY (Q1/H1/Q3), mark it
      // explicitly so the reader doesn't mistake a cumulative YTD figure
      // for a full-year number. ARCLK pre-fix showed "Dönem Q1-2026" as
      // a tiny cell while "Hasılat 40.9 milyar" was centered as if annual.
      const isNonFy = /^(Q[1-4]|H1)-/.test(periodLabel);
      params.push({
        label: 'Dönem',
        value: isNonFy ? `${periodLabel} (ara dönem — yıllıklandırılmadı)` : periodLabel,
      });
      return params;
    })(),
    key_params_has: true,

    // Detaylı Skor Kartı (EREGL tarzı — ağırlıklı)
    scorecard_rows: (() => {
      const rows: Array<{ dimension: string; score: string; weight: string; note: string }> = [];
      const roe = numOrNull(canonicalNumbers.roe);
      const gm = numOrNull(canonicalNumbers.gross_margin);
      const cr = numOrNull(canonicalNumbers.current_ratio);
      const pf = numOrNull(piotroski?.value);
      const rsiVal = rsi;

      // Finansal Sağlık
      let fsScore = 5;
      const fsNotes: string[] = [];
      if (pf != null) { fsScore = pf >= 7 ? 8 : pf >= 4 ? 6 : 4; fsNotes.push(`Piotroski ${Math.round(pf)}/9`); }
      if (cr != null) { fsNotes.push(`Cari oran ${cr.toFixed(2)}x`); if (cr < 1) fsScore = Math.max(fsScore - 1, 3); }
      if (roe != null) { fsNotes.push(`ROE %${roe.toFixed(1)}`); }
      rows.push({ dimension: 'Finansal Sağlık', score: `${fsScore}/10`, weight: '%30', note: fsNotes.join('; ') || '—' });

      // Büyüme Potansiyeli — revenue YoY / capex intensity fallback
      // Fix #10 (2026-04-24): pre-fix this row was a HARDCODED THY copy
      // ("Filo genişleme + IST hub küresel #1") that appeared on every
      // ticker report including ARCLK (white goods). Now ticker-aware.
      {
        const rev = numOrNull(canonicalNumbers.revenue_trymn);
        const prev = numOrNull(canonicalNumbers.prev_revenue_trymn);
        let growthScore = 5;
        const growthNotes: string[] = [];
        if (rev != null && prev != null && prev > 0) {
          const g = ((rev - prev) / prev) * 100;
          growthNotes.push(`Gelir YoY %${g.toFixed(1)}`);
          growthScore = g > 20 ? 8 : g > 10 ? 7 : g > 0 ? 5 : g > -10 ? 4 : 3;
        } else {
          growthNotes.push('Gelir YoY değerlendirmesi için karşılaştırılabilir dönem verisi eksik');
        }
        rows.push({
          dimension: 'Büyüme Potansiyeli',
          score: `${growthScore}/10`,
          weight: '%20',
          note: growthNotes.join('; '),
        });
      }

      // Sektör Pozisyonu — derived from sector registry + GM benchmark
      {
        const sectorLabel = sectorRawForBanner || 'genel';
        const sectorNotes: string[] = [`Sektör: ${sectorLabel}`];
        if (gm != null) {
          sectorNotes.push(`Brüt Marj %${gm.toFixed(1)}`);
        }
        const sectorScore = gm != null ? (gm > 30 ? 7 : gm > 20 ? 6 : gm > 10 ? 5 : 4) : 5;
        rows.push({
          dimension: 'Sektör Pozisyonu',
          score: `${sectorScore}/10`,
          weight: '%15',
          note: sectorNotes.join('; '),
        });
      }

      // Makro Uyumluluk — derived from currency exposure / leverage context
      {
        const macroNotes: string[] = [];
        const ndebt = numOrNull(canonicalNumbers.net_debt_to_ebitda);
        if (ndebt != null) {
          macroNotes.push(
            ndebt > 5 ? 'Yüksek kaldıraç — faiz şokuna duyarlı'
            : ndebt > 3 ? 'Orta kaldıraç — makro hareketlere ölçülü duyarlı'
            : 'Düşük kaldıraç — makro şoklara dayanıklı',
          );
        } else {
          macroNotes.push('Makro duyarlılık için kaldıraç verisi eksik');
        }
        const macroScore = ndebt != null ? (ndebt > 5 ? 4 : ndebt > 3 ? 5 : 7) : 5;
        rows.push({
          dimension: 'Makro Uyumluluk',
          score: `${macroScore}/10`,
          weight: '%15',
          note: macroNotes.join('; '),
        });
      }

      // Teknik Görünüm
      let techScore = 5;
      const techNotes: string[] = [];
      if (rsiVal != null) { techScore = rsiVal > 60 ? 7 : rsiVal > 40 ? 5 : 3; techNotes.push(`RSI ${rsiVal.toFixed(0)}`); }
      if (trend === 'bullish') { techScore = Math.min(techScore + 1, 8); techNotes.push('Yükseliş trendi'); }
      rows.push({ dimension: 'Teknik Görünüm', score: `${techScore}/10`, weight: '%10', note: techNotes.join('; ') || '—' });

      // Yönetim Kalitesi
      // Yönetim Kalitesi — sector-agnostic default (hardcoded THY placeholder
      // removed in Fix #10). LLM-filled from context_extraction if available.
      rows.push({
        dimension: 'Yönetim Kalitesi',
        score: '5/10',
        weight: '%10',
        note: 'Yönetim değişikliği veya son KAP duyurularına göre değerlendirilir',
      });

      return rows;
    })(),
    scorecard_rows_has: true,
    overall_score_display: (() => {
      const weights = [0.30, 0.20, 0.15, 0.15, 0.10, 0.10];
      const pf = numOrNull(piotroski?.value);
      const cr = numOrNull(canonicalNumbers.current_ratio);
      let fsScore = 5;
      if (pf != null) fsScore = pf >= 7 ? 8 : pf >= 4 ? 6 : 4;
      if (cr != null && cr < 1) fsScore = Math.max(fsScore - 1, 3);
      let techScore = 5;
      if (rsi != null) techScore = rsi > 60 ? 7 : rsi > 40 ? 5 : 3;
      if (trend === 'bullish') techScore = Math.min(techScore + 1, 8);
      const scores = [fsScore, 6, 8, 5, techScore, 5];
      const weighted = scores.reduce((s, v, i) => s + v * weights[i], 0);
      return `${weighted.toFixed(1)}/10`;
    })(),
    overall_score_note: 'Ağırlıklı skor — detaylar yukarıda',

    // Temel Finansal Metrikler (EREGL tarzı)
    key_financials: (() => {
      const rows: Array<{ label: string; value: string }> = [];
      const add = (label: string, key: string, unit?: string) => {
        const v = numOrNull(canonicalNumbers[key]);
        if (v == null) return;
        if (unit === 'milyar') rows.push({ label, value: `${(v / 1e9).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TRY` });
        else if (unit === '%') rows.push({ label, value: formatPct(v, 1) });
        else if (unit === 'x') rows.push({ label, value: formatRatio(v, 2) });
        else rows.push({ label, value: formatTRY(v, 0) });
      };
      add('Hasılat', 'revenue', 'milyar');
      add('Brüt Kâr', 'gross_profit', 'milyar');
      add('Faaliyet Kârı', 'operating_income', 'milyar');
      add('Net Kâr', 'net_income', 'milyar');
      const ocfV = numOrNull(canonicalNumbers.operating_cash_flow);
      if (ocfV) rows.push({ label: 'Operasyonel Nakit Akışı (OCF)', value: `${(ocfV / 1e9).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TRY` });
      add('Net Borç', 'net_debt', 'milyar');
      add('Brüt Marj', 'gross_margin', '%');
      add('Net Marj', 'net_margin', '%');
      add('ROE', 'roe', '%');
      add('ROA', 'roa', '%');
      add('Cari Oran', 'current_ratio', 'x');
      const pf = numOrNull(piotroski?.value);
      if (pf) rows.push({ label: 'Piotroski F-Skoru', value: `${Math.round(pf)}/9` });
      return rows;
    })(),
    key_financials_has: numOrNull(canonicalNumbers.revenue) != null,

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
    net_debt_equity_ratio: (() => {
      const nd = numOrNull(canonicalNumbers.net_debt);
      const eq = numOrNull(canonicalNumbers.total_equity);
      if (nd != null && eq != null && eq !== 0) return formatRatio(nd / eq, 2);
      return '—';
    })(),
    net_debt_equity_label: (() => {
      const nd = numOrNull(canonicalNumbers.net_debt);
      const eq = numOrNull(canonicalNumbers.total_equity);
      if (nd == null || eq == null || eq === 0) return 'Veri yetersiz';
      const ratio = nd / eq;
      return ratio < 0.5 ? 'Düşük kaldıraç' : ratio < 1.0 ? 'Orta kaldıraç' : ratio < 2.0 ? 'Yüksek kaldıraç' : 'Çok yüksek kaldıraç';
    })(),

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

    // İşletme Sermayesi
    working_capital_rows: workingCapitalTable.rows as unknown as TemplateValue,
    working_capital_has: workingCapitalTable.has,

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
    swot: swot as unknown as TemplateValue,
    swot_has: swotHas,

    // Section VI
    macro: macroContext,

    // Section VII
    technical,
    technical_has: technicalHas,
    ma_table: maTable as unknown as TemplateValue,
    ma_table_has: maTable.length > 0,

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

    // Chairman sektör uyarı banner
    chairman_banner_html: chairmanBanner,
    chairman_banner_has: chairmanBanner.length > 0,

    // Wave 4 — Peer absence honest banner (replaces self-median deception)
    peer_absence_banner_html: peerAbsenceBanner,
    peer_absence_banner_has: peerAbsenceBanner.length > 0,

    // Section V — Peer bundle (hardcoded sector medians for now)
    peer_list: (peerBundle?.peers ?? []) as unknown as TemplateValue,
    peer_list_has: peerListHas,
    peer_sub_sector: peerBundle?.subSector ?? '',
    peer_notes: peerBundle?.notes ?? '',
    peer_benchmark_rows: peerBenchmarkRows as unknown as TemplateValue,
    peer_benchmark_rows_has: peerBenchmarkRows.length > 0,
    peer_multiples_rows: peerMultiplesRows as unknown as TemplateValue,
    peer_multiples_rows_has: peerMultiplesRows.length > 0,

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
      hybridFA,
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
      hybridFA,
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
      hybridFA,
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
      hybridFA,
    ),
    narrative_valuation: fallbackNarrative(
      narrativeBlocks.valuation,
      commentaryValuation({
        ticker, sector: sectorRaw,
        dcfPerShare: dcf ? (dcf as Record<string, unknown>).per_share_value as number | null : null,
        lastClose: lastClose,
        wacc: dcf ? (dcf as Record<string, unknown>).wacc_used as number | null : null,
        terminalG: dcf ? (dcf as Record<string, unknown>).terminal_growth as number | null : null,
        tryWaccWarning: Boolean(val?.try_wacc_warning),
        holdingSotp: Boolean(val?.holding_sotp_required),
        bankingWarn: Boolean(val?.banking_sector_warning),
      }),
      hybridSS,
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
      hybridMacro,
    ),
    narrative_technical: (() => {
      let nt = fallbackNarrative(
        narrativeBlocks.technical,
        commentaryTechnical({
          trend: trend,
          rsi: rsi,
          lastClose: lastClose,
          volumeAvg: volumeAvg,
        }),
        hybridTech,
      );
      // Auto-fix MA contradiction: if price is above all MAs but narrative says "altında", correct it
      const lcForMa = lastClose;
      const ma20 = numOrNull(techMA.ma_20 ?? techMA.ma20 ?? tech?.ma20);
      const ma50 = numOrNull(techMA.ma_50 ?? techMA.ma50 ?? tech?.ma50);
      const ma200 = numOrNull(techMA.ma_200 ?? techMA.ma200 ?? tech?.ma200);
      if (lcForMa != null && ma20 != null && ma50 != null && ma200 != null) {
        const aboveAll = lcForMa > ma20 && lcForMa > ma50 && lcForMa > ma200;
        const belowAll = lcForMa < ma20 && lcForMa < ma50 && lcForMa < ma200;
        if (aboveAll) {
          nt = nt.replace(/[Tt]üm hareketli ortalamalar?\s*altınd/g, 'Tüm hareketli ortalamaların üzerind');
        } else if (belowAll) {
          nt = nt.replace(/[Tt]üm hareketli ortalamalar?\s*üzerind/g, 'Tüm hareketli ortalamaların altınd');
        }
      }
      return nt;
    })(),
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
        lastClose: lastClose,
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
    // "Detaylı Analiz" full-narrative block was a safety net for when
    // slot extractors failed. In practice it duplicates the entire
    // 12-section structured view — the user caught this as "iki tane SWOT
    // analizi" (one in section V, one in the dump). Now disabled by default:
    // every section already renders its own KPIs, tables, SVG charts, and
    // narrative paragraphs from the extracted slots. If a future use case
    // genuinely needs the raw dump, set FORMATTER_INCLUDE_FULL_NARRATIVE=1.
    full_narrative_html: fullNarrativeHtml,
    full_narrative_has: process.env.FORMATTER_INCLUDE_FULL_NARRATIVE === '1'
      && fullNarrativeHtml.length > 500,

    // SVG charts
    chart_financial_trend: financialTrendSvg,
    chart_financial_trend_has: financialTrendSvg.length > 0,
    chart_benchmark: benchmarkChartSvg,
    chart_benchmark_has: benchmarkChartSvg.length > 0,
    chart_event_timeline: timelineChartSvg,
    chart_event_timeline_has: timelineChartSvg.length > 0,
    chart_sentiment_pie: sentimentPieSvg,
    chart_sentiment_pie_has: sentimentPieSvg.length > 0,
    chart_esg_radar: esgRadarSvg,
    chart_esg_radar_has: esgRadarSvg.length > 0,
    chart_price_band: priceBandSvg,
    chart_price_band_has: priceBandSvg.length > 0,
    chart_financial_health: financialHealthSvg,
    chart_financial_health_has: financialHealthSvg.length > 0,
    chart_ownership_pie: ownershipPieSvg,
    chart_ownership_pie_has: ownershipPieSvg.length > 0,
    chart_qa_gauge: qaGaugeSvg,
    chart_qa_gauge_has: qaGaugeSvg.length > 0,
    chart_rec_gauge: recGaugeSvg,
    chart_rec_gauge_has: recGaugeSvg.length > 0,
    chart_net_income_column: netIncomeColumnSvg,
    chart_net_income_column_has: netIncomeColumnSvg.length > 0,
    chart_revenue_area: revenueAreaSvg,
    chart_revenue_area_has: revenueAreaSvg.length > 0,
    chart_waterfall: waterfallSvg,
    chart_waterfall_has: waterfallSvg.length > 0,
  };
}


/** Use LLM-extracted narrative when non-empty, otherwise fall back to
 *  rule-based auto commentary. Keeps the report populated even when
 *  final_summary fails or doesn't emit anchor headings. */
function fallbackNarrative(llm: string | undefined, autoText: string, hybridNarrative?: string | undefined): string {
  if (llm && llm.trim().length > 200) return llm;
  // Fix #20 — sanitize hybridSS before use; bypassed sliceSection's cleanup so
  // raw ```json {agent_id...} envelopes leaked into narrative_valuation.
  if (hybridNarrative) {
    const cleaned = cleanupMarkdownForFallback(hybridNarrative);
    if (cleaned && cleaned.trim().length > 200) return cleaned;
  }
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

  // Fix escaped pipes that break markdown tables
  text = text.replace(/\\\|/g, '—');

  // Strip duplicate sections that template already renders (İçindekiler, Zorunlu Bildirimler, disclaimers)
  text = text.replace(/##?\s*İÇİNDEKİLER[\s\S]*?(?=\n##?\s[A-ZÇŞÜÖİĞa-zçşüöığ])/gi, '');
  text = text.replace(/##?\s*(?:TABLE OF CONTENTS|İçindekiler)[\s\S]*?(?=\n##?\s)/gi, '');
  text = text.replace(/##?\s*ZORUNLU BİLDİRİMLER[\s\S]*$/gi, '');
  text = text.replace(/##?\s*(?:UYARI|Disclaimer|Yasal Uyarı)[\s\S]*$/gi, '');
  // Strip "Bu rapor Finance X platformu tarafından..." closing boilerplate from LLM narrative
  text = text.replace(/\n{2,}Bu rapor Finance X platformu[\s\S]*$/gi, '');

  // Clean up LLM's ugly "[VERI YOK — ...]" / "[VERİ YOK — ...]"
  // placeholders — transform into muted <em> with Turkish label.
  text = text.replace(/\[VER[İI]\s*YOK\s*[—\-]?\s*([^\]]*)\]/gi, (_, reason) => {
    const cleanReason = reason.trim();
    return cleanReason
      ? `<em style="color:#94a3b8; font-weight:500;">(Raporlanmadı — ${cleanReason})</em>`
      : `<em style="color:#94a3b8; font-weight:500;">(Raporlanmadı)</em>`;
  });

  // Clean up plain "VERİ YOK" / "VERI YOK" phrases inside table cells.
  text = text.replace(/\bVER[İI]\s*YOK\b/gi, '<em style="color:#94a3b8;">Raporlanmadı</em>');

  // Clean up [Hesaplanamadi — ...] / [Hesaplanamadı — ...] placeholders.
  text = text.replace(/\[Hesaplanamad[ıi][^\]]*\]/gi, (m) => {
    const reason = m.replace(/^\[Hesaplanamad[ıi]\s*[—\-]?\s*/i, '').replace(/\]$/, '').trim();
    return reason
      ? `<em style="color:#94a3b8; font-weight:500;">(Hesaplanamadı — ${reason})</em>`
      : `<em style="color:#94a3b8; font-weight:500;">(Hesaplanamadı)</em>`;
  });

  // Replace bracketed chart placeholders [CHART:LINE], [CHART:PIE] etc.
  // (LLM uses these as graphic placeholder markers).
  text = text.replace(/\[CHART:(LINE|PIE|BAR|TIMELINE|RADAR|AREA|DONUT)\]\s*([^\n]*)/gi, (_, kind, label) => {
    return `<div style="background:#fffbeb; border-left:3px solid #f59e0b; padding:6px 12px; margin:8px 0; font-size:9pt; color:#78350f;"><strong>📊 Grafik:</strong> ${label.trim()} <em style="color:#94a3b8;">(${kind.toLowerCase()})</em></div>`;
  });

  // LLM bazen "[src: ...]" gibi kaynak markerları bırakır — iyileştir.
  text = text.replace(/\[src:\s*([^\]]+)\]/gi, '<sup style="color:#94a3b8; font-size:0.85em;">[kaynak: $1]</sup>');

  // Common Turkish character issues — Claude bazen ASCII fallback
  // kullanıyor ("guclu" yerine "güçlü" olmalı). Düzeltmek zor ama
  // bilinen kalıpları normalize et.
  const turkishFixes: Array<[RegExp, string]> = [
    [/\bguclu\b/g, 'güçlü'],
    [/\bGuclu\b/g, 'Güçlü'],
    [/\bzayif\b/g, 'zayıf'],
    [/\bZayif\b/g, 'Zayıf'],
    [/\bekonomi\s+sikinti\b/gi, 'ekonomi sıkıntı'],
    [/\bOzet\b/g, 'Özet'],
    [/\bOzsermaye\b/g, 'Özsermaye'],
    [/\bYonetici\s+Ozeti\b/g, 'Yönetici Özeti'],
    [/\bSirket\b/g, 'Şirket'],
    [/\bFinancsal\b/gi, 'Finansal'],
    [/\bAgirlikli\b/g, 'Ağırlıklı'],
    [/\bBuyume\b/g, 'Büyüme'],
    [/\bdegerleme\b/g, 'değerleme'],
    [/\bDegerleme\b/g, 'Değerleme'],
    [/\bKarliik\b/g, 'Kârlılık'],
    [/\bKarlilik\b/g, 'Kârlılık'],
    [/\bSurdurulebilir\b/g, 'Sürdürülebilir'],
    // LLM hallucination typos
    [/\bBüsük\b/g, 'Büyük'],
    [/\bbüsük\b/g, 'büyük'],
    [/\beesasl/gi, 'esasl'],
    [/\brotalarininin\b/gi, 'rotalarının'],
    [/\bstruktur/gi, 'yapıs'],
    [/\bANLAT1SI\b/g, 'ANLATISI'],
    [/\bAnlatiisi\b/g, 'Anlatısı'],
    [/\bAg Irlikli\b/g, 'Ağırlıklı'],
    [/\bkalmistr\b/g, 'kalmıştır'],
    [/\babsorbsiyon/gi, 'absorpsiyon'],
    [/\bçellikte\b/gi, 'çelikte'],
    [/\bbounca\b/gi, 'toparlanma'],
    [/\bHeadwindle\b/gi, 'Ters rüzgâr'],
  ];
  for (const [re, replacement] of turkishFixes) {
    text = text.replace(re, replacement);
  }

  // Strip AGENT SELF-ASSESSMENT section entirely
  text = text.replace(/##?\s*AGENT SELF-ASSESSMENT[\s\S]*?(?=\n##?\s|\n---|\Z)/gi, '');
  // Strip agent file hashes and internal system terms
  text = text.replace(/\b[a-z]{2,4}-(?:out|in|rpt)-[A-Za-z0-9_-]{10,}\b/g, '');
  text = text.replace(/\bmanagement_guidance\b/gi, 'yönetim rehberliği');
  text = text.replace(/\bvaluation_agent\b/gi, 'değerleme modeli');
  text = text.replace(/\bdata_collection\b/gi, 'veri toplama');
  text = text.replace(/\bsector_competition_output\b/gi, 'sektör analizi');
  text = text.replace(/\bfinancial_analysis_output\b/gi, 'finansal analiz');
  text = text.replace(/\bstrategic_synthesis_output\b/gi, 'stratejik sentez');
  text = text.replace(/\bcontext_extraction\b/gi, 'bağlam çıkarma');
  text = text.replace(/\bsnippet'ları\b/gi, 'verileri');

  // Cosmetic 1 — Convert markdown blockquote (`> text`) to <blockquote> styled
  // box. BIMAS report had `<p>> <strong>Sektör Notu:</strong> ...</p>` because
  // the `>` lived inside a paragraph. Run before paragraph wrapping.
  {
    const lines = text.split('\n');
    const out: string[] = [];
    let i = 0;
    while (i < lines.length) {
      if (/^\s{0,3}>\s+/.test(lines[i])) {
        const block: string[] = [];
        while (i < lines.length && /^\s{0,3}>\s+/.test(lines[i])) {
          block.push(lines[i].replace(/^\s{0,3}>\s+/, ''));
          i++;
        }
        out.push(
          `<blockquote style="border-left:3px solid #3b82f6; background:#eff6ff; padding:8px 14px; margin:10px 0; color:#1e3a8a; font-style:normal;">${block.join('<br>')}</blockquote>`,
        );
      } else {
        out.push(lines[i]);
        i++;
      }
    }
    text = out.join('\n');
  }

  // Convert markdown tables to HTML tables — tolerant parser that
  // handles both line-broken tables and Claude's inline squished
  // tables (| cell | cell | cell |\n| --- | --- | --- |\n | ... |).
  // Split into lines and collect consecutive lines that start with |.
  {
    const lines = text.split('\n');
    const out: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        // Start of potential table: scan ahead
        const block: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          block.push(lines[i].trim());
          i++;
        }
        // Need at least header + separator + 1 body row
        if (block.length >= 3 && /^\|[\s|:\-]+\|$/.test(block[1])) {
          const headerCells = block[0].slice(1, -1).split('|').map(c => c.trim());
          const bodyRows = block.slice(2).map(r => r.slice(1, -1).split('|').map(c => c.trim()));
          const thead = `<thead><tr>${headerCells.map(c => `<th>${escapeHtmlLight(c)}</th>`).join('')}</tr></thead>`;
          const tbody = `<tbody>${bodyRows.map(cells => `<tr>${cells.map(c => `<td>${escapeHtmlLight(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
          out.push(`<table>${thead}${tbody}</table>`);
        } else {
          // Fallback: emit verbatim (preserves original content)
          out.push(...block);
        }
      } else {
        out.push(line);
        i++;
      }
    }
    text = out.join('\n');
  }

  // Some Claude outputs squeeze the whole table onto one paragraph
  // with \n\n instead of \n between rows. Split and retry: look for
  // "| ... | ... |" patterns inside a single paragraph.
  text = text.replace(/(\|[^|\n]+\|(?:\s*\|[^|\n]+\|)+)\s*(\|[\s|:\-]+\|)\s*(\|[^|\n]+\|(?:\s*\|[^|\n]+\|)*)/g, (_, header, sep, body) => {
    void sep;
    // header may itself contain multiple |...| cells separated by inline spaces.
    // Split the body into row groups: each sequence of "| ... |" becomes a row.
    const allRows = [header, body].join(' ');
    const rows = allRows.match(/\|[^|\n]+\|(?:\s*\|[^|\n]+\|)+/g) ?? [];
    if (rows.length < 2) return _;
    const splitRow = (r: string): string[] => {
      // Split where a column boundary happens: "|cell1|cell2|"
      const cells = r.split('|').map(c => c.trim()).filter(c => c.length > 0);
      return cells;
    };
    const headerCells = splitRow(rows[0] ?? '');
    const bodyRowCells = rows.slice(1).map(r => splitRow(r ?? ''));
    if (headerCells.length === 0 || !bodyRowCells.every(r => r.length === headerCells.length)) return _;
    const thead = `<thead><tr>${headerCells.map(c => `<th>${escapeHtmlLight(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${bodyRowCells.map(cells => `<tr>${cells.map(c => `<td>${escapeHtmlLight(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  });

  // Convert markdown horizontal rules to <hr>.
  text = text.replace(/^---+$/gm, '<hr>');
  text = text.replace(/^\*\*\*+$/gm, '<hr>');
  text = text.replace(/^___+$/gm, '<hr>');

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
    // Horizontal rule that survived earlier regex (single paragraph)
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed) || /^___+$/.test(trimmed)) return '<hr>';
    // Already HTML block?
    if (/^<(h[1-6]|p|ul|ol|table|blockquote|div|hr)/i.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return text;
}


function escapeHtmlLight(s: string): string {
  return s
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/<(?!\/?(?:strong|em|b|i|code|br|table|thead|tbody|tr|th|td|ul|ol|li|p|h[1-6]|div|hr|blockquote|sup)\b)/g, '&lt;');
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
  // Pick annual periods only (FY-YYYY), sort ascending, then dedupe
  // by year — some parse_standardization runs emit multiple PDFs for
  // the same year (interim + activity + financial report). Keep the
  // one with the most populated balance_sheet, giving priority to
  // entries with non-null total_assets.
  // Include FY (annual), H1 (semi-annual), Q1/Q3 (quarterly) — prefer FY, fallback to interim
  const annualAll = statements
    .filter(s => /^(FY|H1|Q[1-4])-\d{4}$/.test(String(s.period_label ?? '')))
    .sort((a, b) => {
      const yearDiff = Number(a.year ?? 0) - Number(b.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      // Within same year, prefer FY > H1 > Q3 > Q1
      const periodOrder: Record<string, number> = { 'FY': 4, 'H1': 2, 'Q3': 3, 'Q1': 1 };
      const pa = String(a.period_label ?? '').split('-')[0];
      const pb = String(b.period_label ?? '').split('-')[0];
      return (periodOrder[pa] ?? 0) - (periodOrder[pb] ?? 0);
    });

  // Deduplicate by period_label (not year) — keeps Q1, H1, Q3, FY as separate entries
  const byPeriod = new Map<string, Record<string, unknown>>();
  for (const s of annualAll) {
    const pl = String(s.period_label ?? '');
    if (!pl) continue;
    const existing = byPeriod.get(pl);
    if (!existing) {
      byPeriod.set(pl, s);
    } else {
      const score = (stmt: Record<string, unknown>) => {
        const bs = (stmt.balance_sheet as Record<string, unknown> | null) ?? {};
        const is = (stmt.income_statement as Record<string, unknown> | null) ?? {};
        return Object.values(bs).filter(v => v != null && v !== '').length
             + Object.values(is).filter(v => v != null && v !== '').length;
      };
      if (score(s) > score(existing)) byPeriod.set(pl, s);
    }
  }
  const annual = [...byPeriod.values()].sort((a, b) => {
    const ya = Number(a.year ?? 0), yb = Number(b.year ?? 0);
    if (ya !== yb) return ya - yb;
    const po: Record<string, number> = { 'Q1': 1, 'H1': 2, 'Q3': 3, 'FY': 4 };
    return (po[String(a.period_label ?? '').split('-')[0]] ?? 0) - (po[String(b.period_label ?? '').split('-')[0]] ?? 0);
  });

  if (annual.length === 0) return { years: [], revenue_row: [], balance_row: [], cashflow_row: [], ratio_row: [], dividend_row: [], has_data: false };

  // Fix #26 — prefer yearly (FY) entries for the trend table. Previously
  // slice(-5) picked Q1-2025/H1-2025/Q3-2025/FY-2025/FY-2026-placeholder,
  // hiding FY-2020..FY-2024 real data. New logic: if ≥3 FY entries with
  // non-zero revenue exist, use last 5 FY-only; otherwise fall back to
  // the mixed-period recency behavior (e.g. newly listed companies).
  const isReal = (s: Record<string, unknown>) => {
    const rev = (s.income_statement as Record<string, unknown> | null)?.revenue;
    const n = rev == null ? 0 : Number(rev);
    return Number.isFinite(n) && n > 0;
  };
  const fyReal = annual.filter(s => String(s.period_label ?? '').startsWith('FY-') && isReal(s));
  const recent = (fyReal.length >= 3 ? fyReal : annual).slice(-5);
  const years = recent.map(s => String(s.period_label ?? s.year ?? ''));

  const currentYear = new Date().getFullYear();

  function pivotRow(
    section: 'balance_sheet' | 'income_statement' | 'cash_flow',
    key: string,
    label: string,
  ): MultiYearRow {
    const values = recent.map(s => {
      const year = Number(s.year ?? 0);
      const block = (s[section] as Record<string, unknown> | null | undefined) ?? {};
      const v = block[key];
      if (v == null) return '—';
      const n = Number(v);
      // Current or future year with zero value → treat as missing data
      if (year >= currentYear && Number.isFinite(n) && n === 0) return '—';
      // Large values → divide by 1M for mn TL display
      return Math.abs(n) >= 1_000_000 ? formatTRY(n / 1_000_000, 0) : formatTRY(n, 0);
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
      const year = Number(s.year ?? 0);
      const v = compute(s);
      if (v == null || !Number.isFinite(v)) return '—';
      if (year >= currentYear && v === 0) return '—';
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


function standardizedStatementsForWC(parsed: Record<string, unknown> | null): Array<Record<string, unknown>> {
  const list = arrayFrom(parsed?.standardized_statements ?? []);
  if (list.length === 0) return [];
  // Prefer FY-YYYY annual, else latest available
  const annual = list.filter(s => /^FY-\d{4}$/.test(String(s.period_label ?? '')));
  return annual.length > 0 ? annual : list;
}


interface WCRow {
  metric: string;
  value: string;
  formula: string;
  interpretation: string;
}


function buildWorkingCapitalTable(
  canonicalNumbers: Record<string, unknown>,
  annual: Array<Record<string, unknown>>,
): { rows: WCRow[]; has: boolean } {
  if (annual.length === 0) return { rows: [], has: false };
  const latest = annual[annual.length - 1];
  const bs = (latest.balance_sheet as Record<string, unknown> | null) ?? {};
  const is = (latest.income_statement as Record<string, unknown> | null) ?? {};

  const numFrom = (block: Record<string, unknown>, key: string): number | null => {
    const v = block[key];
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const currentAssets = numFrom(bs, 'current_assets');
  const currentLiab = numFrom(bs, 'current_liabilities');
  const cash = numFrom(bs, 'cash_and_equivalents');
  const receivables = numFrom(bs, 'trade_receivables');
  const inventory = numFrom(bs, 'inventories');
  const payables = numFrom(bs, 'trade_payables');
  const revenue = numFrom(is, 'revenue');
  const cogs = Math.abs(numFrom(is, 'cost_of_sales') ?? 0);

  const fmtB = (v: number): string => `${(v / 1_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TL`;
  const fmtD = (v: number): string => `${Math.round(v).toLocaleString('tr-TR')} gün`;

  const rows: WCRow[] = [];

  // NWC (Net Working Capital)
  if (currentAssets != null && currentLiab != null) {
    const nwc = currentAssets - currentLiab;
    const interp = nwc > 0
      ? `Dönen varlıklar kısa vadeli yükümlülükleri ${fmtB(nwc)} fazlayla karşılıyor — sağlıklı likidite tamponu.`
      : `Dönen varlıklar kısa vadeli yükümlülüklerin ${fmtB(Math.abs(nwc))} altında — kısa vadeli likidite baskısı mevcut.`;
    rows.push({
      metric: 'Net İşletme Sermayesi (NWC)',
      value: fmtB(nwc),
      formula: 'Dönen Varlık − KV Yükümlülük',
      interpretation: interp,
    });
  }

  // Cari oran
  if (currentAssets != null && currentLiab != null && currentLiab > 0) {
    const cr = currentAssets / currentLiab;
    const interp = cr >= 1.5 ? 'Güçlü likidite' : cr >= 1 ? 'Sınırda likidite' : 'Likidite baskısı — KV yükümlülüklerin karşılanması kritik';
    rows.push({
      metric: 'Cari Oran (Current Ratio)',
      value: `${cr.toFixed(2)}x`,
      formula: 'Dönen Varlık / KV Yükümlülük',
      interpretation: interp,
    });
  }

  // Asit-test oranı (Quick Ratio) — stoklar hariç
  if (currentAssets != null && inventory != null && currentLiab != null && currentLiab > 0) {
    const quick = (currentAssets - inventory) / currentLiab;
    const interp = quick >= 1 ? 'Stok hariç KV yükümlülük karşılanabilir' : 'Stoksuz likidite yetersiz — stok döngüsüne bağımlı';
    rows.push({
      metric: 'Asit-Test Oranı (Quick Ratio)',
      value: `${quick.toFixed(2)}x`,
      formula: '(Dönen Varlık − Stoklar) / KV Yükümlülük',
      interpretation: interp,
    });
  }

  // Nakit oranı
  if (cash != null && currentLiab != null && currentLiab > 0) {
    const cashR = cash / currentLiab;
    const interp = cashR >= 0.2 ? 'Sağlıklı nakit tampon' : 'Düşük nakit karşılama — kısa vadeli borçlanma esnekliği kısıtlı';
    rows.push({
      metric: 'Nakit Oranı (Cash Ratio)',
      value: `${cashR.toFixed(2)}x`,
      formula: 'Nakit / KV Yükümlülük',
      interpretation: interp,
    });
  }

  // DSO — Days Sales Outstanding
  if (receivables != null && revenue != null && revenue > 0) {
    const dso = (receivables / revenue) * 360;
    const interp = dso < 30 ? 'Hızlı tahsilat — nakit dönüşüm güçlü' : dso < 60 ? 'Normal tahsilat süresi' : dso < 90 ? 'Yavaş tahsilat — işletme sermayesi baskısı' : 'Kritik — müşteri ödeme gecikmeleri yaygın';
    rows.push({
      metric: 'DSO (Ticari Alacak Tahsil Süresi)',
      value: fmtD(dso),
      formula: '(Ticari Alacaklar / Hasılat) × 360',
      interpretation: interp,
    });
  }

  // DIO — Days Inventory Outstanding
  if (inventory != null && cogs > 0) {
    const dio = (inventory / cogs) * 360;
    const interp = dio < 30 ? 'Hızlı stok devri — operasyonel verimlilik' : dio < 60 ? 'Ortalama stok devri' : dio < 90 ? 'Yavaş stok devri — sermaye bağlanması' : 'Kritik stok birikimi';
    rows.push({
      metric: 'DIO (Stok Devir Süresi)',
      value: fmtD(dio),
      formula: '(Stoklar / SMM) × 360',
      interpretation: interp,
    });
  }

  // DPO — Days Payable Outstanding
  if (payables != null && cogs > 0) {
    const dpo = (payables / cogs) * 360;
    const interp = dpo > 60 ? 'Uzun ödeme süresi — tedarikçilere yük bindiriliyor' : dpo > 30 ? 'Normal ödeme süresi' : 'Hızlı ödeme — tedarikçi memnuniyeti yüksek, nakit sıkıntısı yok';
    rows.push({
      metric: 'DPO (Ticari Borç Ödeme Süresi)',
      value: fmtD(dpo),
      formula: '(Ticari Borçlar / SMM) × 360',
      interpretation: interp,
    });
  }

  // CCC — Cash Conversion Cycle
  if (receivables != null && inventory != null && payables != null && revenue != null && cogs > 0) {
    const dso = (receivables / revenue) * 360;
    const dio = (inventory / cogs) * 360;
    const dpo = (payables / cogs) * 360;
    const ccc = dso + dio - dpo;
    const interp = ccc < 0 ? 'Negatif CCC — tedarikçi-finansmanlı büyüme, istisnai güçlü pozisyon' : ccc < 30 ? 'Kısa CCC — nakit akışı hızlı' : ccc < 60 ? 'Normal CCC' : ccc < 90 ? 'Uzun CCC — işletme sermayesi büyüme ile birlikte büyüyor' : 'Kritik uzun CCC';
    rows.push({
      metric: 'CCC (Nakit Dönüşüm Süresi)',
      value: fmtD(ccc),
      formula: 'DSO + DIO − DPO',
      interpretation: interp,
    });
  }

  // NWC / Hasılat
  if (currentAssets != null && currentLiab != null && revenue != null && revenue > 0) {
    const nwcRev = ((currentAssets - currentLiab) / revenue) * 100;
    rows.push({
      metric: 'NWC / Hasılat',
      value: `%${nwcRev.toFixed(1)}`,
      formula: 'NWC / Hasılat',
      interpretation: nwcRev > 20 ? 'Yüksek sermaye bağlanması — büyüme yeni NWC ihtiyacı yaratır' : nwcRev > 10 ? 'Normal bağlanma oranı' : nwcRev > 0 ? 'Düşük bağlanma — operasyonel sermaye verimliliği' : 'Negatif NWC — tedarikçi bağımlı yapı',
    });
  }

  // Sadece hesaplananları göster, boş satır yok
  void canonicalNumbers;
  return { rows, has: rows.length > 0 };
}


function buildPeerBenchmarkRows(
  fa: Record<string, unknown> | null,
  bundle: ReturnType<typeof resolvePeerBundle>,
  canonicalNumbers: Record<string, unknown>,
): Array<{ metric: string; company: string; peer_median: string; gap: string }> {
  if (!bundle) return [];
  const multiples = bundle.multiples;
  const companyGm = numOrNull(canonicalNumbers.gross_margin);
  const companyEm = numOrNull(canonicalNumbers.ebitda_margin);
  const companyNm = numOrNull(canonicalNumbers.net_margin);
  const companyRoe = numOrNull(canonicalNumbers.roe);
  const gapFmt = (co: number | null, med: number | null): string => {
    if (co == null || med == null) return '—';
    const diff = co - med;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pp`;
  };
  const rows: Array<{ metric: string; company: string; peer_median: string; gap: string }> = [];
  if (companyGm != null || multiples.gross_margin_pct != null) {
    rows.push({
      metric: 'Brüt Marj',
      company: companyGm != null ? `%${companyGm.toFixed(1)}` : '—',
      peer_median: multiples.gross_margin_pct != null ? `%${multiples.gross_margin_pct.toFixed(1)}` : '—',
      gap: gapFmt(companyGm, multiples.gross_margin_pct),
    });
  }
  if (companyEm != null || multiples.ebitda_margin_pct != null) {
    rows.push({
      metric: 'FAVÖK Marjı',
      company: companyEm != null ? `%${companyEm.toFixed(1)}` : '—',
      peer_median: multiples.ebitda_margin_pct != null ? `%${multiples.ebitda_margin_pct.toFixed(1)}` : '—',
      gap: gapFmt(companyEm, multiples.ebitda_margin_pct),
    });
  }
  if (companyNm != null || multiples.net_margin_pct != null) {
    rows.push({
      metric: 'Net Marj',
      company: companyNm != null ? `%${companyNm.toFixed(1)}` : '—',
      peer_median: multiples.net_margin_pct != null ? `%${multiples.net_margin_pct.toFixed(1)}` : '—',
      gap: gapFmt(companyNm, multiples.net_margin_pct),
    });
  }
  if (companyRoe != null || multiples.roe_pct != null) {
    rows.push({
      metric: 'ROE',
      company: companyRoe != null ? `%${companyRoe.toFixed(1)}` : '—',
      peer_median: multiples.roe_pct != null ? `%${multiples.roe_pct.toFixed(1)}` : '—',
      gap: gapFmt(companyRoe, multiples.roe_pct),
    });
  }
  return rows;
}


/** Ticker-specific ownership breakdown (directional). When we don't
 *  know the exact holder split, we emit a 2-slice "İnsider + Halka
 *  Açık" approximation that at least indicates floating share
 *  composition at the BIST average. */
function buildOwnershipPie(ticker: string, sectorRaw: string): Array<{ label: string; value: number }> | null {
  const t = ticker.toUpperCase();

  // Known tickers with stable ownership structures
  const known: Record<string, Array<{ label: string; value: number }>> = {
    THYAO: [
      { label: 'Türkiye Varlık Fonu', value: 49.12 },
      { label: 'Halka Açık', value: 50.88 },
    ],
    // Wave 4 (2026-04-28) — KCHOL ownership corrected per koc.com.tr/IR.
    // Previous 3-bucket consolidation (41.1 / 8.2 / 50.7) hid the true
    // family breakdown. Real disclosure: Temel Ticaret 43.7%, Aile
    // Üyeleri 18.3% (total Koç family + related cos 63.4%), Vehbi Koç
    // Vakfı 7.3%, Pension Fund 2.3%, Free Float 26.9%. Treasury ~0.04%.
    KCHOL: [
      { label: 'Temel Ticaret ve Yatırım A.Ş.', value: 43.7 },
      { label: 'Koç Aile Üyeleri ve İlişkili Şirketler', value: 19.7 },
      { label: 'Vehbi Koç Vakfı', value: 7.3 },
      { label: 'Koç Holding Emekli ve Yardım Sandığı', value: 2.3 },
      { label: 'Halka Açık', value: 26.9 },
      { label: 'Treasury Hisseleri', value: 0.1 },
    ],
    SAHOL: [
      { label: 'Sabancı Aile Şirketleri', value: 59.72 },
      { label: 'Halka Açık', value: 40.28 },
    ],
    EREGL: [
      { label: 'ATAER Holding', value: 49.29 },
      { label: 'Halka Açık', value: 50.71 },
    ],
    TUPRS: [
      { label: 'Enerji Yatırımları A.Ş. (Koç)', value: 51.00 },
      { label: 'Halka Açık', value: 49.00 },
    ],
    AKBNK: [
      { label: 'Hacı Ömer Sabancı Holding', value: 40.75 },
      { label: 'Halka Açık', value: 51.09 },
      { label: 'Sabancı Ailesi Üyeleri', value: 8.16 },
    ],
    ISCTR: [
      { label: 'T. İş Bankası A.Ş. Mensupları Munzam Sosyal Güvenlik', value: 40.25 },
      { label: 'Atatürk Hisseleri (CHP)', value: 28.09 },
      { label: 'Halka Açık', value: 31.66 },
    ],
    GARAN: [
      { label: 'BBVA', value: 85.97 },
      { label: 'Halka Açık', value: 14.03 },
    ],
    TCELL: [
      { label: 'Turkcell Holding A.Ş.', value: 51.00 },
      { label: 'Halka Açık', value: 49.00 },
    ],
    ASELS: [
      { label: 'Türk Silahlı Kuvvetlerini Güçlendirme Vakfı', value: 74.20 },
      { label: 'Halka Açık', value: 25.80 },
    ],
    // Kaynak: BIMAS 31.12.2025 Finansal Raporu, Not 19-a (Sermaye ve Sermaye Yedekleri)
    BIMAS: [
      { label: 'Merkez Bereket Gıda San. ve Tic. A.Ş.', value: 15.41 },
      { label: 'Naspak Gıda San. ve Tic. A.Ş.', value: 11.67 },
      { label: 'Diğer', value: 1.54 },
      { label: 'Halka Açık', value: 71.39 },
    ],
    PGSUS: [
      { label: 'ESAS Holding', value: 54.16 },
      { label: 'Halka Açık', value: 45.84 },
    ],
  };

  if (known[t]) return known[t];

  // Sector average fallback
  const sectorAvg: Record<string, Array<{ label: string; value: number }>> = {
    banking: [
      { label: 'Ana Ortak', value: 55 },
      { label: 'Halka Açık', value: 30 },
      { label: 'Diğer', value: 15 },
    ],
    holding: [
      { label: 'Ailesi / Ana Ortak', value: 50 },
      { label: 'Halka Açık', value: 45 },
      { label: 'Diğer', value: 5 },
    ],
    industrial: [
      { label: 'Ana Ortak', value: 45 },
      { label: 'Halka Açık', value: 45 },
      { label: 'Diğer', value: 10 },
    ],
    insurance: [
      { label: 'Ana Ortak', value: 60 },
      { label: 'Halka Açık', value: 35 },
      { label: 'Diğer', value: 5 },
    ],
    reit: [
      { label: 'Ana Ortak', value: 50 },
      { label: 'Halka Açık', value: 40 },
      { label: 'Diğer', value: 10 },
    ],
  };
  return sectorAvg[sectorRaw] ?? sectorAvg.industrial;
}


interface BannerInputs {
  ticker: string;
  criticalFlagCount: number;
  tryWaccWarning: boolean;
  holdingSotp: boolean;
  bankingWarn: boolean;
  subSector: string;
}


function buildChairmanBanner(sectorRaw: string, inputs: BannerInputs): string {
  const items: string[] = [];

  if (inputs.bankingWarn) {
    items.push('🏦 <strong>Bankacılık</strong>: FCF-DCF uygun değil; DDM / excess return metodolojisi ile tekrar değerlendirin.');
  }
  if (inputs.holdingSotp) {
    items.push('🏢 <strong>Holding</strong>: SOTP analizi ZORUNLU. Konsolide DCF üst sınır; her iştirak ayrı değerlenmelidir.');
  }
  if (inputs.tryWaccWarning) {
    items.push('⚠️ <strong>TRY WACC Tuzağı</strong>: Kullanılan WACC TRY bazlı görünüyor; USD WACC ile tekrar hesaplayın.');
  }
  if (inputs.criticalFlagCount > 0) {
    items.push(`🚩 <strong>${inputs.criticalFlagCount} Kritik Bulgu</strong>: Aşağıdaki Yönetici Özeti'nde detaylar mevcut.`);
  }

  // Sektör-spesifik sabit uyarılar
  const sectorAlerts: Record<string, string[]> = {
    aviation: [
      '✈️ <strong>Havacılık</strong>: Yakıt korunma (hedge), yolcu trafiği, doluluk oranı izlenmeli.',
      '🌍 Jeopolitik riskler (Orta Doğu/Rusya hava sahası) kısa vadeli kâr üzerinde doğrudan etkili.',
    ],
    refinery: [
      '⛽ <strong>Rafineri</strong>: Crack spread (3-2-1), brent-urals diff, sürdürülebilirlik yakıt mevzuatı izlenmeli.',
    ],
    steel: [
      '🏗️ <strong>Çelik</strong>: EPDK enerji tarifesi, demir cevheri fiyatı, AB Safeguard + CBAM kritik.',
    ],
    banking: [
      '💰 <strong>Bankacılık</strong>: TCMB sıkılaşma, BDDK NPL + CET1, kredi/mevduat oranı yakın izlenmeli.',
    ],
    holding: [
      '📊 <strong>Holding</strong>: İştirak portföy performansı, konglomerat indirimi, sermaye dağıtım politikası.',
    ],
    telecom: [
      '📱 <strong>Telekom</strong>: ARPU trend, 5G CAPEX programı, spektrum lisansı yenilenme takvimi.',
    ],
    defense: [
      '🛡️ <strong>Savunma</strong>: Bakanlık sipariş akışı, ihracat onayları, teknoloji transferi kısıtları.',
    ],
    retail: [
      '🛒 <strong>Perakende</strong>: SSS (same-store sales), mağaza sayısı büyümesi, online pay, envanter devir.',
    ],
  };

  const key = Object.keys(sectorAlerts).find(k =>
    inputs.subSector === k ||
    (k === 'aviation' && sectorRaw === 'industrial' && inputs.ticker === 'THYAO') ||
    (k === 'aviation' && sectorRaw === 'industrial' && inputs.ticker === 'PGSUS')
  );
  if (key) items.push(...sectorAlerts[key]);

  if (items.length === 0) return '';
  return items.map(i => `<div style="margin:4px 0;">${i}</div>`).join('');
}


function buildMultiplesRows(
  bundle: ReturnType<typeof resolvePeerBundle>,
  canonicalNumbers: Record<string, unknown>,
): Array<{ multiple: string; sector_median: string; note: string }> {
  if (!bundle) return [];
  const m = bundle.multiples;
  const rows: Array<{ multiple: string; sector_median: string; note: string }> = [];
  if (m.ev_ebitda != null) rows.push({ multiple: 'EV/EBITDA', sector_median: `${m.ev_ebitda.toFixed(1)}x`, note: 'Sektör medyanı (yaklaşık 2025-2026)' });
  if (m.pe != null) rows.push({ multiple: 'F/K (P/E)', sector_median: `${m.pe.toFixed(1)}x`, note: 'Sektör medyanı' });
  if (m.pb != null) rows.push({ multiple: 'PD/DD (P/BV)', sector_median: `${m.pb.toFixed(2)}x`, note: 'Sektör medyanı' });
  if (m.dividend_yield_pct != null) rows.push({ multiple: 'Temettü Verimi', sector_median: `%${m.dividend_yield_pct.toFixed(1)}`, note: 'Sektör ortalaması' });
  if (m.net_debt_to_ebitda != null) rows.push({ multiple: 'Net Borç/FAVÖK', sector_median: `${m.net_debt_to_ebitda.toFixed(1)}x`, note: 'Sektör medyanı' });
  void canonicalNumbers;
  return rows;
}


/** Place red_flags and divergences on the 3×3 impact × likelihood grid.
 *  Heuristic: severity=critical → high impact, warning → medium, info → low.
 *  Likelihood inferred by keyword matching (kesin/beklenen = high,
 *  olası = medium, potansiyel/spekülatif = low). */
function buildRiskMatrix(
  fa: Record<string, unknown> | null,
  ss: Record<string, unknown> | null,
  qa: Record<string, unknown> | null,
  sector: string,
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
    if (/kesin|beklenen|certain|expected|already|mevcut|gerçekleş/.test(l)) likelihood = 'high';
    else if (/olası|olasi|likely|probable|muhtemel|risk/.test(l)) likelihood = 'med';
    else likelihood = 'low';
    return [impactLevel, likelihood];
  };

  // 1) FA red_flags (if available)
  for (const f of arrayFrom(fa?.red_flags ?? [])) {
    const label = String(f.code ?? f.message ?? '').slice(0, 40);
    if (!label || label === 'undefined') continue;
    const [imp, lik] = classify(label, String(f.severity ?? '').toLowerCase());
    const key = `${imp}_${lik}`;
    if (cells[key]) cells[key].push(label);
  }

  // 2) SS divergences
  for (const d of arrayFrom(ss?.divergences ?? [])) {
    const s = String(d).slice(0, 40);
    if (s && s !== 'undefined') cells.med_med.push(s);
  }

  // 3) QA-derived risk indicators (always available)
  const qaScore = qa?.overall_score != null ? Number(qa.overall_score) : null;
  if (qaScore != null && qaScore < 0.6) {
    cells.high_med.push('Düşük QA skoru — veri güvenilirliği sınırlı');
  }

  // 4) Sector-default risks (if matrix is still too empty)
  const totalEntries = Object.values(cells).reduce((s, l) => s + l.length, 0);
  if (totalEntries < 3) {
    const sectorDefaults: Record<string, Array<[string, string, string]>> = {
      // [label, impact, likelihood]
      aviation: [
        ['Yakıt maliyeti volatilitesi', 'high', 'high'],
        ['Jeopolitik hava sahası riski', 'high', 'med'],
        ['Döviz kuru baskısı (USD borç)', 'med', 'high'],
        ['Mevsimsel talep dalgalanması', 'low', 'high'],
      ],
      steel: [
        ['CBAM karbon maliyeti (2026+)', 'high', 'high'],
        ['Çin dumping baskısı', 'high', 'med'],
        ['Enerji tarifesi artışı', 'med', 'high'],
        ['Hammadde tedarik kesintisi', 'med', 'med'],
      ],
      defense: [
        ['Kamu bütçe kesintisi / proje ertelemesi', 'high', 'med'],
        ['İthal komponent yaptırım riski', 'high', 'low'],
        ['İhracat lisans engelleri', 'med', 'med'],
        ['Ar-Ge geri dönüş gecikmesi', 'med', 'high'],
        ['Döviz kuru — ithal komponent maliyeti', 'low', 'high'],
      ],
      banking: [
        ['NIM sıkışması (faiz politikası)', 'high', 'high'],
        ['NPL artışı ve karşılık yükü', 'high', 'med'],
        ['BDDK düzenleme sürprizi', 'med', 'med'],
        ['Döviz pozisyonu açığı', 'med', 'low'],
      ],
      telecom: [
        ['BTK tarife düzenlemesi', 'high', 'med'],
        ['5G CAPEX yükü', 'med', 'high'],
        ['ARPU büyüme yavaşlaması', 'med', 'med'],
        ['Rekabet baskısı (churn)', 'low', 'high'],
      ],
      refinery: [
        ['Crack spread daralması', 'high', 'med'],
        ['Brent fiyat volatilitesi', 'high', 'high'],
        ['Çevre düzenleme sıkılaşması', 'med', 'med'],
        ['TL zayıflaması — iç talep baskısı', 'low', 'high'],
      ],
      holding: [
        ['İştirak operasyonel riski', 'high', 'med'],
        ['Konglomerat indirimi genişlemesi', 'med', 'high'],
        ['Sektörel konsantrasyon', 'med', 'med'],
        ['Sermaye dağıtım verimsizliği', 'low', 'med'],
      ],
      retail: [
        ['Tüketici güven düşüşü', 'high', 'high'],
        ['Gıda enflasyonu baskısı', 'med', 'high'],
        ['Online rekabet erozyonu', 'med', 'med'],
        ['Minimum ücret maliyet artışı', 'low', 'high'],
      ],
      industrial: [
        ['Hammadde fiyat volatilitesi', 'high', 'med'],
        ['Döviz kuru riski', 'med', 'high'],
        ['Enerji maliyet artışı', 'med', 'med'],
        ['Talep yavaşlaması', 'low', 'med'],
      ],
    };
    const defaults = sectorDefaults[sector] ?? sectorDefaults.industrial;
    for (const [label, imp, lik] of defaults) {
      const key = `${imp}_${lik}`;
      if (cells[key] && cells[key].length < 2) cells[key].push(label);
    }
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
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
      if (!Number.isFinite(n)) continue;
      // Large absolute values (>1M) are balance sheet / income items → format as mn TL
      const formatted = Math.abs(n) >= 1_000_000
        ? formatTRY(n / 1_000_000, 0)
        : formatTRY(n, 0);
      out.push({ label, value: formatted });
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

  // Fix #7 (2026-04-24): detect fake peer table. When sector_competition
  // returns peers=0 but still fills median/q1/q3 with the company value
  // (or leaves them null), we must NOT render a misleading "Emsal Medyan"
  // row where every column is identical. Instead, signal that peer data
  // is unavailable so the template can hide the row or show a disclaimer.
  const epsilon = 0.001;
  const medianSameAsCompany =
    bm.median != null &&
    typeof bm.median === 'number' &&
    typeof bm.company_value === 'number' &&
    Math.abs(Number(bm.median) - Number(bm.company_value)) < epsilon;
  const hasRealPeers = bm.median != null && !medianSameAsCompany;

  if (!hasRealPeers) {
    // Return the company value only + a null median placeholder so template
    // shows "Emsal verisi yok" instead of a misleading identical column.
    return {
      company_formatted: formatValueByCode(metric, bm.company_value),
      median_formatted: 'Emsal grubu oluşturulamadı',
      q1_q3: '—',
    };
  }
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
  if (lower.includes('debt_to_ebitda')) {
    return formatRatio(value as number | string, 2);
  }
  if (lower.includes('altman')) {
    const n = numOrNull(value);
    return n != null ? n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  }
  if (lower.includes('piotroski')) {
    const n = numOrNull(value);
    return n != null ? `${Math.round(n)}/9` : '—';
  }
  if (lower === 'ccc' || lower === 'dso' || lower === 'dio' || lower === 'dpo') {
    const n = numOrNull(value);
    return n != null ? `${n.toFixed(0)} gün` : '—';
  }
  // Large absolute values → format as milyar TL
  const n = numOrNull(value);
  if (n != null && Math.abs(n) >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milyar TL`;
  }
  return formatTRY(value as number | string, 0);
}


function formatNumber(v: unknown, decimals: number, suffix = ''): string {
  const n = numOrNull(v);
  return n != null ? n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix : 'Raporlanmadı';
}


function formatPctFromMacro(v: unknown): string {
  if (v == null || v === '') return 'Raporlanmadı';
  const n = numOrNull(v);
  if (n == null) return 'Raporlanmadı';
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


const METRIC_LABEL_TR: Record<string, string> = {
  'Gross margin': 'Brüt Marj',
  'EBITDA margin': 'FAVÖK Marjı',
  'Net margin': 'Net Marj',
  'Return on equity': 'Özsermaye Kârlılığı (ROE)',
  'Return on assets': 'Aktif Kârlılığı (ROA)',
  'Return on capital employed': 'Kullanılan Sermaye Kârlılığı (ROCE)',
  'Net debt': 'Net Borç',
  'Net debt / EBITDA': 'Net Borç / FAVÖK',
  'Cash conversion cycle': 'Nakit Dönüşüm Süresi',
  'Current ratio': 'Cari Oran',
  'Altman Z-score': 'Altman Z Skoru',
  'Piotroski F-score': 'Piotroski F Skoru',
  'Net Interest Margin': 'Net Faiz Marjı (NIM)',
  'Banking ROE': 'Bankacılık ROE',
  'Banking ROA': 'Bankacılık ROA',
  'Cost/Income': 'Maliyet / Gelir',
  'Loan-loss provisions / NII': 'Kredi Kaybı Karşılıkları / NII',
  // Signal bucket labels (strategic_synthesis)
  'LIQUIDITY_TIGHT': 'Likidite Sıkışıklığı',
  'DEBT_RISK': 'Borçluluk Riski',
  'HIGH_LEVERAGE': 'Yüksek Kaldıraç',
  'MARGIN_EROSION': 'Marj Erozyonu',
  'NEGATIVE_FCF': 'Negatif Serbest Nakit Akışı',
  'LOW_COVERAGE': 'Düşük Faiz Karşılama',
  'Trend: bullish': 'Trend: Yükseliş',
  'Trend: bearish': 'Trend: Düşüş',
  'Trend: neutral': 'Trend: Nötr',
  'fundamental has both positive and negative signals — inspect closer.': 'Temel göstergeler karma sinyal veriyor',
  'Event net: negative': 'Olay etkisi: Negatif',
  'Event net: positive': 'Olay etkisi: Pozitif',
  'Event net: neutral': 'Olay etkisi: Nötr',
  'Free cash flow': 'Serbest Nakit Akışı',
  'Operating cash flow': 'Operasyonel Nakit Akışı',
  'Revenue growth': 'Gelir Büyümesi',
  'Dividend yield': 'Temettü Verimi',
  'Interest coverage': 'Faiz Karşılama Oranı',
  'Debt/Equity': 'Borç / Özsermaye',
  'Price/Book': 'Fiyat / Defter Değeri',
  'Price/Earnings': 'Fiyat / Kazanç',
  'EV/EBITDA': 'FD / FAVÖK',
};


function translateMetricLabel(label: string): string {
  return METRIC_LABEL_TR[label] ?? label;
}


/** Convert engine-generated English narrative hint into Turkish.
 *  The engine seeds highlights with a generic interpretation line;
 *  we provide a metric-specific Turkish replacement. */
function translateMetricHint(code: string, originalHint: string): string {
  const tr: Record<string, string> = {
    GROSS_MARGIN: 'Sektör eşiği: sanayi için %20 altı düşük, %30 üstü güçlü. Ürün karması ve maliyet yönetiminin birleşik göstergesi.',
    EBITDA_MARGIN: 'Operasyonel verimliliğin temel göstergesi. Sanayi için %12-15 makul, %20 üstü güçlü.',
    NET_MARGIN: 'Finansman giderleri ve vergi etkisini de içeren nihai kârlılık. Negatif işaret gelir tablosu sıkıntısı.',
    ROE: 'Türk lirası bazında sermaye maliyeti ~%30; üzeri değer yaratımı, altı değer erozyonu işareti.',
    ROA: 'Aktiflerin nakit üretme verimliliği. %5 üzeri iyi, %2 altı verimsiz aktif kullanımına işaret.',
    ROCE: 'Kullanılan toplam sermayenin getirisi; WACC karşılaştırması için en doğru metrik.',
    CCC: 'Pozitif CCC operasyonel sermaye bağlanması, negatif CCC tedarikçi-finanslı büyüme (nadir ve güçlü).',
    CURRENT_RATIO: '1.5x üzeri sağlıklı likidite tamponu, 1.0 altı kısa vadeli baskı.',
    NET_DEBT: 'Finansal borç − nakit; özsermayeye göre oran yatırımcı için ek okuma sağlar.',
    NET_DEBT_TO_EBITDA: '<2x sağlıklı, 2-3.5x orta, 3.5-5x yakın izleme, >5x distress eşiği.',
    ALTMAN_Z: '>3 güvenli, 1.8-3 gri bölge, <1.8 iflas riski eşiği (sanayi için).',
    PIOTROSKI_F: '7-9 güçlü finansal sağlık, 4-6 orta, 0-3 zayıf (0-9 skalası).',
    NIM: 'Bankacılıkta net faiz geliri / faiz getirili aktifler. TCMB sıkılaşması genelde yükseltir.',
    BANK_ROE: 'Bankacılıkta %15+ güçlü, %20+ liderlik seviyesi (Türk bankaları yüksek enflasyon ortamında %25+).',
    BANK_ROA: '%1.5+ güçlü bankacılık verimliliği, %1 altı zayıf aktif kullanımı.',
    COST_TO_INCOME: '<%40 verimli, %40-50 normal, >%50 maliyet baskısı altında bir banka.',
  };
  const codeUpper = code.toUpperCase();
  if (tr[codeUpper]) return tr[codeUpper];
  // If the original hint is English and we have no translation, suppress it.
  if (/^[A-Za-z\s.\-()<>%0-9,/]+$/.test(originalHint.trim())) return '';
  return originalHint;
}


// ─── Parse-standardization normalizer ──────────────────────────────────
//
// Compose expects `parse_standardization_output.standardized_statements[]`:
//   [{ period_label: "FY-2024", year: 2024,
//      income_statement: { revenue, ebitda, ... },
//      balance_sheet:    { total_assets, total_equity, ... },
//      cash_flow:        { cfo, capex, fcf } }, ...]
//
// Older/LLM-produced parse outputs use a pivoted shape instead:
//   { parsed_statements: {
//       income_statement: { data: [{ line_item, 2021, 2022, ... }, ...] },
//       balance_sheet:    { data: [...] },
//       cash_flow_statement: { data: [...] } } }
//
// This function detects the pivoted shape and unpivots it into the canonical
// `standardized_statements[]` that the rest of compose.ts / svg_charts.ts
// depends on. When the input already matches the canonical shape, it is
// returned as-is (no mutation).
//
// Consequence: the top 12-section view (KPI cards, 5-year trend tables,
// revenue/EBITDA bar charts) gets populated from the real audited numbers
// that are present in the pivoted JSON. Without this, those blocks stayed
// empty and the user saw "tahmini" values only in the tail narrative.
const LINE_ITEM_MAP: Record<'income_statement' | 'balance_sheet' | 'cash_flow', Record<string, string>> = {
  income_statement: {
    // revenue
    'net sales (revenue)': 'revenue', 'net sales': 'revenue', 'revenue': 'revenue', 'hasılat': 'revenue', 'satış gelirleri': 'revenue',
    // gross profit
    'gross profit': 'gross_profit', 'brüt kar': 'gross_profit', 'brüt kâr': 'gross_profit',
    // operating income
    'operating income': 'operating_income', 'ebit': 'operating_income', 'faaliyet karı': 'operating_income', 'faaliyet kârı': 'operating_income',
    // ebitda
    'ebitda (favök)': 'ebitda', 'ebitda': 'ebitda', 'favök': 'ebitda',
    // net income
    'net income': 'net_income', 'net profit': 'net_income', 'net kar': 'net_income', 'net kâr': 'net_income', 'dönem karı': 'net_income',
    // opex (not in template trend but useful)
    'operating expenses (opex)': 'operating_expenses', 'opex': 'operating_expenses',
    'cost of goods sold (cogs)': 'cogs', 'cogs': 'cogs',
  },
  balance_sheet: {
    'total assets': 'total_assets', 'toplam varlık': 'total_assets', 'toplam varlıklar': 'total_assets',
    'total liabilities': 'total_liabilities', 'toplam yükümlülük': 'total_liabilities', 'toplam borç': 'total_liabilities',
    'total equity': 'total_equity', 'shareholders equity': 'total_equity', 'özkaynak': 'total_equity', 'özkaynaklar': 'total_equity',
    'cash and equivalents': 'cash', 'cash': 'cash', 'nakit': 'cash', 'nakit ve benzerleri': 'cash',
    'short-term debt': 'st_debt', 'kısa vadeli borç': 'st_debt',
    'long-term debt': 'lt_debt', 'uzun vadeli borç': 'lt_debt',
    'total financial debt': 'total_debt', 'toplam finansal borç': 'total_debt',
    'working capital': 'working_capital', 'çalışma sermayesi': 'working_capital',
    'inventory': 'inventory', 'stoklar': 'inventory',
    'trade receivables': 'trade_receivables', 'ticari alacaklar': 'trade_receivables',
  },
  cash_flow: {
    'operating cash flow': 'cfo', 'cash from operations': 'cfo', 'işletme faaliyetlerinden nakit akışı': 'cfo',
    'capital expenditures': 'capex', 'capex': 'capex', 'yatırım harcamaları': 'capex',
    'free cash flow': 'fcf', 'serbest nakit akışı': 'fcf',
    'dividends paid': 'dividends', 'temettü ödemeleri': 'dividends',
  },
};


function normalizeParseStandardization(raw: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!raw) return raw;
  // Already in canonical shape — nothing to do.
  if (Array.isArray(raw.standardized_statements)) return raw;

  // Look for pivoted shape at `parsed_statements`.
  const ps = raw.parsed_statements as Record<string, unknown> | undefined;
  if (!ps) return raw;

  // Cash flow is sometimes nested as `cash_flow_statement`.
  const pivoted: Record<'income_statement' | 'balance_sheet' | 'cash_flow', unknown> = {
    income_statement: ps.income_statement,
    balance_sheet:    ps.balance_sheet,
    cash_flow:        ps.cash_flow ?? ps.cash_flow_statement,
  };

  // Discover which years the pivoted rows cover.
  const years = new Set<number>();
  for (const section of Object.values(pivoted)) {
    const data = (section as Record<string, unknown> | undefined)?.data;
    if (!Array.isArray(data)) continue;
    for (const row of data) {
      for (const k of Object.keys(row as Record<string, unknown>)) {
        const yr = Number(k);
        if (Number.isFinite(yr) && yr >= 1990 && yr <= 2100) years.add(yr);
      }
    }
  }
  if (years.size === 0) return raw;

  const sortedYears = [...years].sort((a, b) => a - b);
  const standardized_statements = sortedYears.map(year => {
    const stmt: Record<string, unknown> = {
      period_label: `FY-${year}`,
      year,
      income_statement: {},
      balance_sheet: {},
      cash_flow: {},
    };
    for (const [sectionKey, sectionData] of Object.entries(pivoted) as Array<[keyof typeof LINE_ITEM_MAP, Record<string, unknown> | undefined]>) {
      const rows = Array.isArray(sectionData?.data) ? sectionData!.data as Array<Record<string, unknown>> : [];
      const block = stmt[sectionKey] as Record<string, unknown>;
      const map = LINE_ITEM_MAP[sectionKey];
      for (const row of rows) {
        const label = String(row.line_item ?? '').toLowerCase().trim();
        const canonical = map[label];
        if (!canonical) continue;
        const raw = row[String(year)];
        if (raw == null || raw === '') continue;
        const n = Number(raw);
        if (!Number.isFinite(n)) continue;
        block[canonical] = n;
      }
    }
    return stmt;
  });

  // Return a merged object so anything else on `raw` (agent_id, company, parser_notes)
  // survives for downstream consumers.
  return { ...raw, standardized_statements };
}
