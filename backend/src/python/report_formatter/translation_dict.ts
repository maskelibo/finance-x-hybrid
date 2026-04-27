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
];

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
