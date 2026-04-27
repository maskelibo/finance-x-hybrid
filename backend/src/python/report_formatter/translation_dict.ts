/**
 * Translation dictionary (P4.beta.1).
 *
 * Maps technical codes / English fragments to professional Turkish
 * boardroom phrases. Used by:
 *   - hygiene_sanitizer.ts → applies to visible text in final HTML
 *   - boardroom_intelligence.ts → drives section/category/severity labels
 *
 * All replacements are TEXT-ONLY (no HTML tag attribute touch).
 */

// =============================================================================
// 1. Severity tier labels
// =============================================================================

export const SEVERITY_TR: Record<string, string> = {
  critical: 'kritik',
  high: 'yüksek',
  medium: 'orta',
  low: 'düşük',
  none: 'uyumlu',
  warn: 'uyarı',
  info: 'bilgilendirme',
  authoritative: 'birincil kaynak',
  derived: 'türetilmiş ölçüm',
  inferred: 'dolaylı çıkarım',
};

// =============================================================================
// 2. FA red flag / metric code → Turkish
// =============================================================================

export const RED_FLAG_TR: Record<string, string> = {
  OVERLEVERAGED: 'Yüksek Borçluluk Riski',
  LIQUIDITY_TIGHT: 'Likidite Baskısı',
  INTEREST_COVERAGE_LOW: 'Faiz Karşılama Zayıflığı',
  PIOTROSKI_WEAK: 'Piotroski Skoru Zayıf (Sınırlı Değerlendirme)',
  HOLDING_DUAL_STREAM: 'Holding İki-Akımlı Gelir Yapısı',
  ALTMAN_Z: 'Altman Z-Skoru Distress Sinyali',
  ALTMAN_Z_LOW: 'Altman Z-Skoru Distress Sinyali',
  WORKING_CAPITAL_NEGATIVE: 'Negatif İşletme Sermayesi',
  GROSS_MARGIN_LOW: 'Brüt Marj Zayıflığı',
  NET_MARGIN_NEGATIVE: 'Net Marj Negatif',
  ROE_NEGATIVE: 'Negatif Özsermaye Karlılığı',
  FCF_NEGATIVE: 'Negatif Serbest Nakit Akışı',
  EBITDA_CONFLICT: 'FAVÖK Mutabakat Tutarsızlığı',
  // P4.beta.3 — humanize raw flag tokens
  YKBNK_DISTORTED: 'YKBNK iştiraki konsolidasyonu sinyali',
  YKBNK_ISOLATION: 'YKBNK iştiraki ayrıştırması',
  AKBNK_DISTORTED: 'AKBNK iştiraki konsolidasyonu sinyali',
  AKBNK_ISOLATION: 'AKBNK iştiraki ayrıştırması',
  HOLDING_BANKING_HEAVY: 'Bankacılık ağırlıklı holding yapısı',
  HOLDING_INSURANCE_HEAVY: 'Sigorta ağırlıklı holding yapısı',
  HOLDING_REAL_ESTATE_HEAVY: 'Gayrimenkul ağırlıklı holding yapısı',
  CONSOLIDATED_BANK_DISTORTION: 'Konsolide banka P&L bozulması',
  SEGMENT_MISMATCH: 'Segment uyumsuzluğu sinyali',
  CASH_FLOW_VOLATILE: 'Nakit akışı oynaklığı',
  TAX_EFFECTIVE_HIGH: 'Yüksek efektif vergi oranı',
};

// =============================================================================
// 3. Metric code → Turkish (highlights/canonical_numbers field names)
// =============================================================================

export const METRIC_TR: Record<string, string> = {
  CCC: 'Nakit Dönüş Süresi',
  FCF: 'Serbest Nakit Akışı',
  OCF: 'Faaliyetlerden Nakit Akışı',
  ROE: 'Özsermaye Karlılığı',
  ROA: 'Aktif Karlılığı',
  ROCE: 'Kullanılan Sermaye Karlılığı',
  GROSS_MARGIN: 'Brüt Marj',
  EBITDA_MARGIN: 'FAVÖK Marjı',
  NET_MARGIN: 'Net Kar Marjı',
  NET_DEBT: 'Net Borç',
  NET_DEBT_TO_EBITDA: 'Net Borç / FAVÖK',
  CURRENT_RATIO: 'Cari Oran',
  TOTAL_ASSETS: 'Toplam Varlıklar',
  TOTAL_EQUITY: 'Toplam Özkaynak',
  REVENUE: 'Hasılat',
  EBITDA: 'FAVÖK',
  EBIT: 'Faaliyet Kârı',
  EBT: 'Vergi Öncesi Kâr',
  NET_INCOME: 'Net Kâr',
  PIOTROSKI_F: 'Piotroski Skoru',
  ALTMAN_Z_SCORE: 'Altman Z-Skoru',
  BANK_ROE: 'Banka Özsermaye Karlılığı',
  BANK_ROA: 'Banka Aktif Karlılığı',
  NIM: 'Net Faiz Marjı',
};

// =============================================================================
// 4. Contradiction type → Turkish boardroom label
// =============================================================================

export const CONTRADICTION_TYPE_TR: Record<string, string> = {
  valuation_method_mismatch: 'Değerleme Metodolojisi Uyumsuzluğu',
  target_spread: 'Hedef Fiyat Yöntemleri Arası Sapma',
  thesis_vs_valuation: 'Yatırım Tezi ve Hedef Fiyat Tutarsızlığı',
  confidence_vs_conviction: 'Veri Güveni ile Sonuç Kararlılığı Çelişkisi',
  financial_red_flag_vs_narrative: 'Finansal Riskler ile Yatırım Tezi Arasında Uyum Kontrolü',
  synthesis_divergence: 'Sentez Katmanı Tutarsızlık Uyarısı',
};

// =============================================================================
// 5. Chairman question category → Turkish (already partially in boardroom_intel)
// =============================================================================

export const QUESTION_CATEGORY_TR: Record<string, string> = {
  valuation_challenge: 'Değerleme Sorgulaması',
  financial_risk_challenge: 'Finansal Risk Sorgulaması',
  methodology_challenge: 'Metodoloji Sorgulaması',
  management_strategy: 'Yönetim ve Strateji Soruları',
  downside_scenario: 'Aşağı Yönlü Senaryo',
};

// =============================================================================
// 6. Citation source type → Turkish (extends boardroom_intelligence map)
// =============================================================================

export const CITATION_SOURCE_TR: Record<string, string> = {
  kap_disclosure: 'KAP Bildirimleri',
  fa_red_flag: 'Finansal Risk Bayrakları',
  fa_metric: 'Finansal Metrikler',
  fa_confidence: 'Finansal Analiz Güven Düzeyi',
  truth_assertion: 'Şirket Yapı ve Metodoloji Tespitleri',
  synthesis_divergence: 'Çapraz Sentez Sinyalleri',
  synthesis_score: 'Sentez Hassasiyet Skoru',
  methodology_decision: 'Değerleme Metodoloji Kararı',
  contradiction_finding: 'İç Tutarlılık Bulguları',
};

// =============================================================================
// 7. Sentence-level rewrite patterns
// =============================================================================

export interface SentencePattern {
  /** Regex source (no flags). */
  pattern: string;
  /** Optional flags. Default: 'gi'. */
  flags?: string;
  replacement: string;
}

export const SENTENCE_PATTERNS: SentencePattern[] = [
  {
    pattern: 'fundamental has both positive and negative signals[\\s—–-]+inspect closer',
    replacement: 'Sektörel sinyaller karışık görünüm sergiliyor; daha detaylı inceleme önerilmiştir.',
  },
  {
    pattern: 'FA raised (\\d+) critical (?:red )?flag\\(?s?\\)? while synthesis stayed positive',
    replacement: 'Finansal analiz $1 kritik bulgu işaret ederken sentez katmanı pozitif yönü korumaktadır.',
  },
  {
    pattern: 'FA raised (\\d+) critical (?:red )?flag\\(?s?\\)?',
    replacement: 'Finansal analiz $1 kritik bulgu işaret etmektedir',
  },
  {
    pattern: 'Boardroom will ask whether',
    replacement: 'Yönetim kurulu, ',
  },
  {
    pattern: 'Boardroom expects',
    replacement: 'Yönetim kurulu',
  },
  {
    pattern: 'chosen method mismatch',
    replacement: 'seçilen değerleme yöntemi tavsiye edilenle uyumsuzdur',
  },
  {
    pattern: 'inspect closer',
    replacement: 'daha detaylı inceleme önerilmiştir',
  },
  {
    pattern: 'structural mismatch:\\s*val_dcf chosen for [a-z_]+',
    replacement: 'Yapısal uyumsuzluk: bankacılık iştiraki ağırlıklı holdingler için konsolide DCF uygun değildir',
  },
  {
    pattern: 'consolidated bank P&L \\/ segment-mismatched holding distorts FCF',
    replacement: 'konsolide bankacılık P&L\'i ve segment-arası uyumsuzluk serbest nakit akışını bozar',
  },
  {
    pattern: 'Holding filer\\s*[—–-]\\s*consolidated DCF is an upper bound only',
    replacement: 'Holding yapısındaki şirketlerde konsolide DCF analizi yalnızca üst sınır kontrolü olarak değerlendirilmelidir.',
  },
  {
    pattern: 'no authoritative filing[\\s—–-]+all (\\d+) candidates rejected',
    replacement: 'Birincil bildirim teyit edilmemiştir; aday $1 belge yetersiz kapsamda değerlendirilmiştir',
  },
  {
    pattern: '1 critical FA flag\\(?s?\\)? vs positive synthesis',
    replacement: '1 kritik finansal bulgu mevcut iken sentez katmanı pozitif yönü korumaktadır',
  },
  {
    pattern: 'Surface the flag in the thesis section',
    replacement: 'Söz konusu bulgu yatırım tezi bölümünde açıklanmalıdır',
  },
  {
    pattern: 'Surface each critical FA flag in the thesis section',
    replacement: 'Her kritik finansal bulgu yatırım tezinde açıklanmalıdır',
  },
  {
    pattern: 'Reconcile valuation narrative to either honor FTL primary',
    replacement: 'Değerleme yorumu ya tavsiye edilen birincil yöntemle uyumlu hale getirilmelidir',
  },
  {
    pattern: 'Add a "method reconciliation" paragraph',
    replacement: 'Yöntem mutabakatı için ayrı bir açıklama paragrafı eklenmelidir',
  },
  {
    pattern: 'Either downgrade synthesis confidence to medium',
    replacement: 'Sentez güven düzeyi orta seviyeye çekilmelidir',
  },
  {
    pattern: 'Document the non-financial drivers of the negative thesis',
    replacement: 'Negatif tezin finansal olmayan sürücüleri açıkça belgelenmelidir',
  },
  {
    pattern: 'Either soften recommendation to HOLD',
    replacement: 'Tavsiye TUT seviyesine yumuşatılmalıdır',
  },
  {
    pattern: 'reconcile by lowering target',
    replacement: 'hedef fiyat aşağı revize edilerek mutabakat sağlanmalıdır',
  },
  {
    pattern: 'methodology not detectable in scenario builder output',
    replacement: 'değerleme metodolojisi senaryo çıktısında ayırt edilememiştir',
  },
  // =========================================================================
  // P4.beta.3 — English residue from FA Python red_flag.message strings
  // (these come straight from the Python engine's English-text messages and
  // were leaking into Turkish boardroom narrative)
  // =========================================================================
  // Note: HTML-encoded `&lt;` and literal `<` both supported via (?:<|&lt;).
  {
    pattern: 'Current ratio (\\d+(?:\\.\\d+)?) (?:<|&lt;) 1\\s*[—–-]\\s*short-term obligations exceed current assets',
    replacement: 'Cari oran $1, 1,0x altında — kısa vadeli yükümlülükler dönen varlıkları aşmaktadır',
  },
  {
    pattern: 'Net Debt\\/EBITDA (\\d+(?:\\.\\d+)?) (?:>|&gt;) 5x\\s*[—–-]\\s*elevated distress risk',
    replacement: 'Net Borç / FAVÖK çarpanı $1, 5,0x sınırını aşıyor — yüksek finansal sıkıntı sinyali',
  },
  {
    pattern: 'Net Debt\\/EBITDA (\\d+(?:\\.\\d+)?) (?:>|&gt;) 3x\\s*[—–-]\\s*elevated leverage',
    replacement: 'Net Borç / FAVÖK çarpanı $1, 3,0x sınırını aşıyor — yüksek kaldıraç sinyali',
  },
  {
    pattern: 'Interest coverage (\\d+(?:\\.\\d+)?) (?:<|&lt;) 2x\\s*[—–-]\\s*earnings barely cover financing cost',
    replacement: 'Faiz karşılama oranı $1, 2,0x altında — kazançlar finansman maliyetini güçlükle karşılamaktadır',
  },
  {
    pattern: 'Piotroski F (\\d+)\\/9\\s*[—–-]\\s*low quality fundamentals',
    replacement: 'Piotroski F skoru $1/9 — temel finansal kalite zayıf',
  },
  {
    pattern: 'Holding dual-stream P&L present\\s*\\(finans segment\\)\\.?',
    replacement: 'Holding iki-akımlı gelir tablosu mevcut (finansman segmenti).',
  },
  {
    pattern: 'Industrial gross-margin chain checked on non-financial stream only\\.?',
    replacement: 'Sanayi brüt marj zinciri yalnızca finansman dışı segment üzerinden kontrol edilmiştir.',
  },
  {
    pattern: 'Z=(\\d+(?:\\.\\d+)?) distress zone',
    replacement: 'Altman Z = $1 distress bölgesinde',
  },
  // Common English finance fragments → Turkish
  { pattern: '\\bcurrent assets\\b', replacement: 'dönen varlıklar' },
  { pattern: '\\bshort-term obligations\\b', replacement: 'kısa vadeli yükümlülükler' },
  { pattern: '\\blong-term obligations\\b', replacement: 'uzun vadeli yükümlülükler' },
  { pattern: '\\bdistress risk\\b', replacement: 'finansal sıkıntı riski' },
  { pattern: '\\bquality fundamentals\\b', replacement: 'temel finansal kalite' },
  { pattern: '\\bfinancing cost\\b', replacement: 'finansman maliyeti' },
  { pattern: '\\bworking capital\\b', replacement: 'işletme sermayesi' },
  { pattern: '\\bbook value\\b', replacement: 'defter değeri' },
  { pattern: '\\bmarket cap\\b', replacement: 'piyasa değeri' },
  { pattern: '\\bcash conversion cycle\\b', replacement: 'nakit dönüş süresi' },
  { pattern: '\\bauditor opinion\\b', replacement: 'denetçi görüşü' },
  { pattern: '\\bfree cash flow\\b', replacement: 'serbest nakit akışı' },
  { pattern: '\\boperating cash flow\\b', replacement: 'faaliyetlerden nakit akışı' },
  { pattern: '\\bnet income\\b', replacement: 'net kâr' },
  { pattern: '\\bgross margin\\b', replacement: 'brüt marj' },
  { pattern: '\\bnet margin\\b', replacement: 'net marj' },
  // P4.beta.3 cleanup — additional English residue → Turkish.
  // Order: longest / most-specific first so partial overlaps don't strand the
  // remainder in English. (Standalone "cash flow" runs AFTER "free cash flow"
  // and "operating cash flow" above, so the longer matches translate first.)
  { pattern: '\\bnet\\s+debt\\s+to\\s+ebitda\\b', replacement: 'Net Borç / FAVÖK' },
  { pattern: '\\bdebt\\s+to\\s+equity\\b', replacement: 'borç / özkaynak' },
  { pattern: '\\babove\\s+the\\s+threshold\\b', replacement: 'eşik üzerinde' },
  { pattern: '\\bbelow\\s+the\\s+threshold\\b', replacement: 'eşik altında' },
  { pattern: '\\bmargins\\s+are\\s+improving\\b', replacement: 'marjlar iyileşmektedir' },
  { pattern: '\\bmargins\\s+are\\s+deteriorating\\b', replacement: 'marjlar zayıflamaktadır' },
  { pattern: '\\bmargins\\s+are\\s+stable\\b', replacement: 'marjlar yatay seyretmektedir' },
  { pattern: '\\bmargin\\s+is\\s+improving\\b', replacement: 'marj iyileşmektedir' },
  { pattern: '\\bnon[- ]financial\\s+stream\\b', replacement: 'finansman dışı segment' },
  { pattern: '\\bgross[- ]margin\\s+chain\\b', replacement: 'brüt marj zinciri' },
  { pattern: '\\bquality\\s+fundamentals?\\b', replacement: 'temel finansal kalite' },
  { pattern: '\\blow\\s+quality\\s+fundamentals?\\b', replacement: 'zayıf temel finansal kalite' },
  { pattern: '\\belevated\\s+distress\\s+risk\\b', replacement: 'yüksek finansal sıkıntı sinyali' },
  { pattern: '\\belevated\\s+leverage\\b', replacement: 'yüksek kaldıraç sinyali' },
  { pattern: '\\bearnings\\s+barely\\s+cover(?:\\s+financing\\s+cost)?\\b', replacement: 'kazançlar finansman maliyetini güçlükle karşılamaktadır' },
  { pattern: '\\bearnings\\s+barely\\b', replacement: 'kazançlar yetersiz' },
  { pattern: '\\bdual[- ]stream(?:\\s+P&L)?\\b', replacement: 'iki-akımlı' },
  { pattern: '\\bcash\\s+flow\\b', replacement: 'nakit akışı' },
  { pattern: '\\bpositive\\s+(?:and\\s+)?negative\\s+signals?\\b', replacement: 'pozitif ve negatif sinyaller' },
  { pattern: '\\bcheck(?:ed)?\\s+on\\s+non-financial\\s+stream\\s+only\\b', replacement: 'yalnızca finansman dışı segment üzerinden kontrol edilmiştir' },
  // Calculation breakdown labels (in formula display rows)
  { pattern: '\\bInterest\\s+Coverage\\s*:', replacement: 'Faiz Karşılama:' },
  { pattern: '\\binterest\\s+coverage\\b', replacement: 'faiz karşılama' },
  { pattern: '\\bCurrent\\s+ratio\\b', replacement: 'Cari oran' },
  // Citation references with date-suffixed filing IDs:
  // [TICKER]_YK_YYYYMMDD → "[TICKER] Yönetim Kurulu raporu (YYYY-MM-DD)"
  {
    pattern: '\\b([A-Z]{4,6})_YK_(\\d{4})(\\d{2})(\\d{2})\\b',
    replacement: '$1 Yönetim Kurulu raporu ($2-$3-$4)',
  },
];

// =============================================================================
// 8. Acceptable finance abbreviations (English residue whitelist)
// =============================================================================
//
// These tokens may legitimately appear in a Turkish boardroom report and
// must be EXCLUDED when counting english_residue_remaining.

export const ACCEPTED_FINANCE_TOKENS: ReadonlySet<string> = new Set([
  // Core financial metrics
  'EBITDA', 'FAVÖK', 'EBIT', 'EBT', 'FCF', 'OCF', 'CAPEX', 'OPEX',
  // Valuation methodologies
  'SOTP', 'NAV', 'NAD', 'DCF', 'WACC', 'NPV', 'IRR',
  // Profitability / efficiency ratios
  'ROE', 'ROA', 'ROIC', 'ROCE', 'NIM',
  // Time periods
  'Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'FY', 'YTD', 'YoY', 'QoQ',
  // Accounting standards
  'IFRS', 'IAS', 'GAAP', 'TFRS', 'TMS',
  // Corporate roles
  'KPI', 'CFO', 'CEO', 'COO', 'CIO', 'CTO',
  // Capital markets
  'IPO', 'M&A', 'LBO', 'SPAC',
  // Compliance / governance / regulators
  'ESG', 'AML', 'KYC', 'SPK', 'KAP', 'BDDK', 'SEC',
  // Common ratio prefixes
  'P/E', 'P/B', 'EV', 'P&L',
  // P4.beta.3 cleanup — canonical UPPER_SNAKE_CASE metric column labels.
  // These are deterministic METRIC_TR keys (Brüt Marj, FAVÖK Marjı, vb.).
  // They are NOT raw LLM monologue artefacts and must not be flagged as raw
  // flag tokens. Translation pass already maps them to Turkish in narrative
  // contexts; this whitelist only suppresses the diagnostic counter when
  // they survive (e.g., as table column headers).
  'GROSS_MARGIN', 'EBITDA_MARGIN', 'NET_MARGIN',
  'NET_DEBT', 'NET_DEBT_TO_EBITDA',
  'CURRENT_RATIO', 'INTEREST_COVERAGE',
  'PIOTROSKI_F', 'ALTMAN_Z_SCORE',
  'TOTAL_ASSETS', 'TOTAL_EQUITY',
  'NET_INCOME', 'BANK_ROE', 'BANK_ROA',
]);


// =============================================================================
// Lookup helpers
// =============================================================================

/** Lookup with case-insensitive fallback. */
export function lookupSeverityTr(s: string): string | null {
  return SEVERITY_TR[s.toLowerCase()] ?? null;
}

export function lookupRedFlagTr(code: string): string | null {
  return RED_FLAG_TR[code.toUpperCase()] ?? null;
}

export function lookupMetricTr(code: string): string | null {
  return METRIC_TR[code.toUpperCase()] ?? null;
}

export function lookupContradictionTypeTr(t: string): string | null {
  return CONTRADICTION_TYPE_TR[t] ?? null;
}

export function lookupQuestionCategoryTr(c: string): string | null {
  return QUESTION_CATEGORY_TR[c] ?? null;
}

export function lookupCitationSourceTr(t: string): string | null {
  return CITATION_SOURCE_TR[t] ?? null;
}
