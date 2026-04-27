/**
 * Section filler (P4.beta.2).
 *
 * Detects empty/weak h1/h2 sections in a rendered report HTML and injects
 * professional Turkish "kapsam notu" content built from structured fields
 * supplied by the caller (read-only extraction from accumulatedContext).
 *
 * Strict invariants:
 *   - operates on visible HTML only; never touches <style>, <script>, tag
 *     attributes, or class names
 *   - no fabrication: every template clause is conditionally rendered;
 *     missing structured field → clause omitted, not faked
 *   - no live data fetch; no LLM call
 *   - existing section content > 200 chars is left alone
 *   - HTML structure preserved; injection is a single <p> after the heading
 */

// =============================================================================
// Types
// =============================================================================

export interface SectionFillerInputs {
  ticker?: string | null;
  period_label?: string | null;
  sector_canonical?: string | null;
  is_holding?: boolean;
  is_banking?: boolean;
  primary_method?: string | null;
  recommendation?: string | null;
  current_price_try?: number | null;
  /** ISO date or null. If null, no "current/güncel/şu an" wording is used. */
  current_price_as_of?: string | null;
  fa_canonical?: {
    net_debt?: number | string | null;
    net_debt_to_ebitda?: number | string | null;
    current_ratio?: number | string | null;
  } | null;
  macro?: {
    tcmb_policy_rate?: number | string | null;
    cpi_yoy?: number | string | null;
    usd_try?: number | string | null;
    eur_try?: number | string | null;
    /** ISO date if known; null = avoid temporal wording */
    as_of?: string | null;
  } | null;
  technical?: {
    trend?: string | null;
    rsi?: number | string | null;
    volume_data_available?: boolean;
    as_of?: string | null;
  } | null;
}

export interface FilledSection {
  heading: string;
  template: string;       // template id (e.g., 'executive_summary')
  chars_added: number;
}

export interface SectionFillerResult {
  sections_filled: number;
  details: FilledSection[];
}

// =============================================================================
// Helpers
// =============================================================================

const HEADING_RE = /<h([12])[^>]*>([\s\S]*?)<\/h\1>/gi;
const STYLE_BLOCK_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;
const PLACEHOLDER_PREFIX = '__SECFILL_PROTECTED_';
const WEAK_SECTION_THRESHOLD = 200;

interface HeadingMatch {
  level: number;
  rawTitle: string;
  textTitle: string;
  startIdx: number;
  endIdx: number;
}

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function fmtNumber(n: unknown): string | null {
  if (n == null) return null;
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return null;
  // tr-TR comma decimal, dot thousand
  const abs = Math.abs(num);
  if (abs >= 1000) return num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  return num.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
}

function nonEmpty(s: string | null | undefined): s is string {
  return typeof s === 'string' && s.trim().length > 0;
}

// =============================================================================
// Sector / classification labelling (no module names; no fabrication)
// =============================================================================

const SECTOR_LABEL_TR: Record<string, string> = {
  holding: 'Holding',
  banking: 'Bankacılık',
  industrial: 'Sanayi',
  insurance: 'Sigorta',
  reit: 'GYO',
  real_estate: 'Gayrimenkul',
  aviation: 'Havacılık',
  telecom: 'Telekomünikasyon',
  energy: 'Enerji',
  steel: 'Demir-Çelik',
  refinery: 'Rafineri',
  retail: 'Perakende',
  defense: 'Savunma',
  defense_electronics: 'Savunma Elektroniği',
};

const METHOD_LABEL_TR: Record<string, string> = {
  val_sotp: 'Parçaların Toplamı (SOTP / NAD)',
  val_dcf: 'İndirgenmiş Nakit Akışları (DCF)',
  val_trading_comps: 'Emsal Çarpanları',
  val_p_b: 'Piyasa Değeri / Defter Değeri (P/B)',
  val_ddm: 'Temettü İndirgeme (DDM)',
  val_nav: 'Net Aktif Değer (NAV)',
};

function sectorLabel(s: string | null | undefined): string | null {
  if (!s) return null;
  return SECTOR_LABEL_TR[s.toLowerCase()] ?? null;
}

function methodLabel(s: string | null | undefined): string | null {
  if (!s) return null;
  return METHOD_LABEL_TR[s.toLowerCase()] ?? null;
}

// =============================================================================
// Templates — every clause is conditional; no fabrication
// =============================================================================

interface TemplateMatch {
  /** Heading title regex test (case-insensitive). */
  pattern: RegExp;
  templateId: string;
  /** Builder returns null if no clauses can be rendered (skip injection). */
  build: (inp: SectionFillerInputs) => string | null;
}

function buildExecutiveSummary(inp: SectionFillerInputs): string | null {
  const parts: string[] = [];
  const tickerSeg = nonEmpty(inp.ticker) ? escapeHtml(inp.ticker!.toUpperCase()) : null;
  const sectorSeg = sectorLabel(inp.sector_canonical);
  const periodSeg = nonEmpty(inp.period_label) ? escapeHtml(inp.period_label!) : null;
  const methodSeg = methodLabel(inp.primary_method);

  // 1. opening clause
  if (tickerSeg && sectorSeg && periodSeg) {
    parts.push(
      `${tickerSeg} (${sectorSeg}), ${periodSeg} dönemi finansalları çerçevesinde değerlendirilmiştir.`,
    );
  } else if (tickerSeg && periodSeg) {
    parts.push(`${tickerSeg}, ${periodSeg} dönemi finansalları çerçevesinde değerlendirilmiştir.`);
  } else if (tickerSeg) {
    parts.push(`${tickerSeg}, raporda ele alınan dönem finansalları çerçevesinde değerlendirilmiştir.`);
  }

  // 2. classification + methodology clause
  if (inp.is_holding && methodSeg) {
    const bankNote = inp.is_banking ? ' Bankacılık iştirakinin konsolide bilançodaki etkisi göz önünde bulundurulmuştur.' : '';
    parts.push(`Holding yapısı dikkate alındığında ana değerleme yaklaşımı ${methodSeg}'dir.${bankNote}`);
  } else if (inp.is_banking && methodSeg) {
    parts.push(`Bankacılık özellikleri çerçevesinde ana değerleme yaklaşımı ${methodSeg}'dir.`);
  } else if (methodSeg) {
    parts.push(`Bu rapor için ana değerleme yaklaşımı ${methodSeg} olarak belirlenmiştir.`);
  }

  // 3. price clause — only if as_of is known (constraint #8)
  if (inp.current_price_try != null && nonEmpty(inp.current_price_as_of)) {
    const priceFmt = fmtNumber(inp.current_price_try);
    if (priceFmt) {
      parts.push(
        `Referans fiyat ${priceFmt} TL (${escapeHtml(inp.current_price_as_of!)} itibarıyla) olarak alınmıştır.`,
      );
    }
  }

  // 4. closing clause — only when at least one substantive clause exists
  if (parts.length === 0) return null;
  parts.push('Detaylı finansal analiz, değerleme ve risk değerlendirmesi izleyen bölümlerde sunulmuştur.');
  return parts.join(' ');
}

function buildMacroContext(inp: SectionFillerInputs): string | null {
  const m = inp.macro;
  if (!m) return null;

  const parts: string[] = [];
  const tcmb = fmtNumber(m.tcmb_policy_rate);
  const cpi = fmtNumber(m.cpi_yoy);
  const usd = fmtNumber(m.usd_try);
  const eur = fmtNumber(m.eur_try);

  // constraint #8 — date-aware vs date-agnostic wording
  const dateClause = nonEmpty(m.as_of) ? `${escapeHtml(m.as_of!)} itibarıyla ` : '';
  // when no date, use neutral "Bu dönemde" (NOT "güncel/şu an/current")
  const openingPrefix = nonEmpty(m.as_of) ? dateClause : 'Bu dönemde ';

  if (tcmb || cpi) {
    const tcmbClause = tcmb ? `TCMB politika faizi %${tcmb}` : '';
    const cpiClause = cpi ? `TÜFE yıllık değişim %${cpi}` : '';
    const monetary = [tcmbClause, cpiClause].filter(Boolean).join(', ');
    parts.push(`${openingPrefix}${monetary} düzeyindedir.`);
  }

  if (usd || eur) {
    const fxParts: string[] = [];
    if (usd) fxParts.push(`USD/TRY ${usd}`);
    if (eur) fxParts.push(`EUR/TRY ${eur}`);
    parts.push(`Döviz kurları ${fxParts.join(', ')} seviyesindedir.`);
  }

  if (parts.length === 0) return null;
  parts.push('Şirketin operasyonel karlılığı ve borç servisi maliyetleri bu makroekonomik koşullar çerçevesinde değerlendirilmelidir.');
  return parts.join(' ');
}

function buildTechnicalScope(inp: SectionFillerInputs): string | null {
  const t = inp.technical;
  if (!t) return null;

  const parts: string[] = [];
  const ticker = nonEmpty(inp.ticker) ? escapeHtml(inp.ticker!.toUpperCase()) : 'Hisse';

  const trendTr = trendLabelTr(t.trend);
  if (trendTr) {
    parts.push(`${ticker}, kapanış itibarıyla ${trendTr} bir teknik görünüm sergilemektedir.`);
  }

  const rsi = fmtNumber(t.rsi);
  if (rsi) {
    const rsiNum = Number(String(t.rsi));
    const interpretation = rsiInterpretation(rsiNum);
    parts.push(`RSI(14) ${rsi} seviyesinde olup ${interpretation}.`);
  }

  // volume disclaimer — explicit when not available
  if (t.volume_data_available === false) {
    parts.push('Hacim verisi teyit edilmediği için hacim bazlı sinyal üretilmemiştir.');
  }

  if (parts.length === 0) return null;
  parts.push('Teknik analiz tek başına yatırım kararı dayanağı oluşturmaz.');
  return parts.join(' ');
}

function trendLabelTr(t: string | null | undefined): string | null {
  if (!nonEmpty(t)) return null;
  const k = t!.toLowerCase();
  if (k.includes('bullish') || k.includes('pozitif') || k.includes('yukarı')) return 'pozitif yönde';
  if (k.includes('bearish') || k.includes('negatif') || k.includes('aşağı')) return 'negatif yönde';
  if (k.includes('neutral') || k.includes('yatay')) return 'yatay seyirde';
  return null;
}

function rsiInterpretation(rsi: number): string {
  if (!Number.isFinite(rsi)) return 'momentum sinyali değerlendirilmiştir';
  if (rsi >= 70) return 'aşırı alım bölgesinde işlem görmektedir';
  if (rsi >= 55) return 'pozitif momentum sürdüğüne işaret etmektedir';
  if (rsi >= 45) return 'nötr momentum bandında bulunmaktadır';
  if (rsi >= 30) return 'momentumun zayıfladığını göstermektedir';
  return 'aşırı satım bölgesine yakın işlem görmektedir';
}

function buildQuickIndicators(inp: SectionFillerInputs): string | null {
  const c = inp.fa_canonical;
  if (!c) return null;
  const parts: string[] = [];

  const netDebtFmt = fmtNumber(c.net_debt);
  const leverage = fmtNumber(c.net_debt_to_ebitda);
  const cr = fmtNumber(c.current_ratio);

  if (netDebtFmt) parts.push(`Net Borç ${netDebtFmt} TL düzeyindedir.`);
  if (leverage) parts.push(`Net Borç / FAVÖK çarpanı ${leverage}x olarak hesaplanmıştır.`);
  if (cr) parts.push(`Cari oran ${cr}x seviyesindedir.`);

  if (parts.length === 0) return null;
  return parts.join(' ');
}

function buildPeerPending(_inp: SectionFillerInputs): string | null {
  // Always rendered when invoked — peer data fetch is P5.alpha
  return 'Sektörel emsal medyanları için doğrulanmış piyasa değeri, net borç, FAVÖK ve net kâr verileri henüz teyit edilmemiştir. Emsal karşılaştırması bu raporda yayımlanmamıştır.';
}

// =============================================================================
// Template registry — heading patterns → template builders
// =============================================================================

const TEMPLATES: TemplateMatch[] = [
  {
    pattern: /^(?:[ivx]+\.\s*)?yönetici\s+özet/i,
    templateId: 'executive_summary',
    build: buildExecutiveSummary,
  },
  {
    pattern: /^(?:[ivx]+\.\s*)?makroekonomik\s+bağlam/i,
    templateId: 'macro_context',
    build: buildMacroContext,
  },
  {
    pattern: /^kritik\s+makro\s+göstergeler/i,
    templateId: 'macro_context',
    build: buildMacroContext,
  },
  {
    pattern: /^(?:[ivx]+\.\s*)?teknik\s+analiz/i,
    templateId: 'technical_scope',
    build: buildTechnicalScope,
  },
  {
    pattern: /^hızlı\s+göstergeler/i,
    templateId: 'quick_indicators',
    build: buildQuickIndicators,
  },
  {
    pattern: /^emsal\s+çarpanları/i,
    templateId: 'peer_pending',
    build: buildPeerPending,
  },
  {
    pattern: /^şirket\s+vs\s+sektör\s+medyanı/i,
    templateId: 'peer_pending',
    build: buildPeerPending,
  },
];

// =============================================================================
// Walking + injection
// =============================================================================

function walkHeadings(html: string): HeadingMatch[] {
  // Mask <style>/<script> blocks so headings inside them (unlikely) are skipped
  const masked = html.replace(STYLE_BLOCK_RE, (m) => ' '.repeat(m.length));
  const out: HeadingMatch[] = [];
  for (const m of masked.matchAll(HEADING_RE)) {
    const level = Number(m[1]);
    const text = stripTags(m[2]);
    if (!text) continue;
    out.push({
      level,
      rawTitle: m[2],
      textTitle: text,
      startIdx: m.index ?? 0,
      endIdx: (m.index ?? 0) + m[0].length,
    });
  }
  return out;
}

function sectionVisibleCharCount(html: string, h: HeadingMatch, next: HeadingMatch | null): number {
  const slice = html.slice(h.endIdx, next ? next.startIdx : html.length);
  // mask style/script too
  const masked = slice.replace(STYLE_BLOCK_RE, '');
  return stripTags(masked).length;
}

// =============================================================================
// Main entry
// =============================================================================

export function fillEmptySections(
  html: string,
  inputs: SectionFillerInputs,
): { html: string; result: SectionFillerResult } {
  const headings = walkHeadings(html);
  const details: FilledSection[] = [];

  // Build replacement instructions sorted by descending startIdx so that
  // splice-style injection does not invalidate later indexes.
  const inserts: Array<{ atIndex: number; html: string; detail: FilledSection }> = [];

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const next = headings[i + 1] ?? null;
    const charCount = sectionVisibleCharCount(html, h, next);
    if (charCount >= WEAK_SECTION_THRESHOLD) continue;

    // Find first matching template
    const tpl = TEMPLATES.find((t) => t.pattern.test(h.textTitle));
    if (!tpl) continue;

    const content = tpl.build(inputs);
    if (!content) continue; // no fabrication

    const injection = `\n<p class="fx-section-fill" style="margin-top: 8px;">${content}</p>\n`;
    inserts.push({
      atIndex: h.endIdx,
      html: injection,
      detail: {
        heading: h.textTitle,
        template: tpl.templateId,
        chars_added: content.length,
      },
    });
  }

  // Apply inserts back-to-front
  inserts.sort((a, b) => b.atIndex - a.atIndex);
  let out = html;
  for (const ins of inserts) {
    out = out.slice(0, ins.atIndex) + ins.html + out.slice(ins.atIndex);
    details.unshift(ins.detail); // preserve forward order in details
  }

  return {
    html: out,
    result: { sections_filled: details.length, details },
  };
}
