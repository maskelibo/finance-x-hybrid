/**
 * Section filler (P4.beta.2 + P4.beta.4 Wave 2).
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
 *   - raw filing IDs (e.g. KCHOL_YK_20260414, KCHOL_Yonetim_Kurulu_Raporu_*)
 *     are humanised before reaching the visible report (Wave 2 constraint #1)
 *   - raw red-flag codes (OVERLEVERAGED, LIQUIDITY_TIGHT, …) are mapped via
 *     RED_FLAG_TR; fall-back wording is used when a mapping is missing —
 *     the raw code is NEVER emitted (Wave 2 constraint #2)
 *   - the catalysts filler counts already-rendered <li> items; it never
 *     invents new catalyst entries (Wave 2 constraint #3)
 */

import { lookupRedFlagTr } from './translation_dict.js';

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
  // ---------------------------------------------------------------------------
  // P4.beta.4 Wave 2 — additional structured inputs for ownership / risk-matrix
  // / catalysts fillers. All optional; missing fields collapse to either
  // omitted clauses or the explicit conservative-disclosure fallback.
  // ---------------------------------------------------------------------------
  shareholder_structure?: Array<{
    shareholder?: string | null;
    stake_pct?: number | string | null;
    source?: string | null;
  }> | null;
  controlling_shareholder?: {
    name?: string | null;
    pct?: number | string | null;
    source?: string | null;
  } | null;
  free_float_pct?: number | string | null;
  foreign_investor_ratio_pct?: number | string | null;
  /** Full red_flags array — allows the risk-matrix filler to summarise
   *  severity counts and humanise the top critical code without reaching
   *  back to raw upstream output. */
  fa_red_flags?: Array<{
    severity?: string | null;
    code?: string | null;
    message?: string | null;
  }> | null;
}

/** Per-section context computed by the main walker before calling build().
 *  Lets templates that depend on already-rendered HTML (e.g. catalyst <li>
 *  count) operate without re-deriving from upstream sources. */
export interface SectionContext {
  /** Number of <li> items inside the section's slice (for catalyst summary). */
  li_count: number;
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
  /** Builder returns null if no clauses can be rendered (skip injection).
   *  ctx is provided when the template needs section-local information that
   *  cannot be derived from inputs alone (e.g. count of <li> items already
   *  rendered into the section slice). */
  build: (inp: SectionFillerInputs, ctx?: SectionContext) => string | null;
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
// P4.beta.4 Wave 2 — humanisers and helpers (raw-ID / raw-code suppression)
// =============================================================================

/**
 * Humanise a filing-source identifier so it never reaches the visible report
 * as a raw ID. Recognised shapes:
 *   - {TICKER}_YK_YYYYMMDD                              → "{TICKER} Yönetim Kurulu raporu (YYYY-MM-DD)"
 *   - {TICKER}_Yonetim_Kurulu_Raporu_YYYYMMDD(.html)?   → "{TICKER} Yönetim Kurulu raporu (YYYY-MM-DD)"
 * Trailing free-text after the ID is preserved; leading non-ID prose passes
 * through unchanged. Returns null when the input is empty.
 */
export function humanizeFilingSource(raw: string | null | undefined): string | null {
  if (!nonEmpty(raw)) return null;
  let out = raw!;
  out = out.replace(
    /\b([A-Z]{3,6})_YK_(\d{4})(\d{2})(\d{2})\b/g,
    '$1 Yönetim Kurulu raporu ($2-$3-$4)',
  );
  out = out.replace(
    /\b([A-Z]{3,6})_Yonetim_Kurulu_Raporu_(\d{4})(\d{2})(\d{2})(?:\.html?)?/g,
    '$1 Yönetim Kurulu raporu ($2-$3-$4)',
  );
  return out;
}

/** Humanise a single red-flag code. Returns the Turkish boardroom label from
 *  RED_FLAG_TR, or the safe fallback "tanımlanmamış risk bulgusu" when no
 *  mapping exists. The raw code is NEVER returned — Wave 2 constraint #2. */
function humanizeRedFlagCode(code: string | null | undefined): string {
  if (!nonEmpty(code)) return 'tanımlanmamış risk bulgusu';
  const tr = lookupRedFlagTr(code!);
  return nonEmpty(tr) ? tr : 'tanımlanmamış risk bulgusu';
}

function pctFmt(n: unknown): string | null {
  const f = fmtNumber(n);
  if (!f) return null;
  // strip a stray trailing ',00' to keep boardroom prose tight
  return f.replace(/,00$/, '');
}

// =============================================================================
// P4.beta.4 Wave 2 — Ortaklık Yapısı filler
// =============================================================================
//
// Reads shareholder_structure / controlling_shareholder / free_float_pct from
// inputs (extracted upstream by runner.buildSanitizeOptions from
// context_extraction_output.company_profile). Emits one boardroom paragraph
// listing top 3 shareholders + free-float disclosure + humanised source. If
// no structured ownership data is available, emits an explicit conservative
// disclosure clause — never invents stake percentages.

function buildOwnershipStructure(inp: SectionFillerInputs): string | null {
  const structure = Array.isArray(inp.shareholder_structure) ? inp.shareholder_structure : [];

  // Filter to entries with both a name and a finite percentage so partial
  // upstream rows don't slip through as "%-undefined" text.
  const validEntries = structure
    .map((e) => ({
      name: nonEmpty(e?.shareholder) ? e.shareholder!.trim() : null,
      pct: e?.stake_pct,
      source: nonEmpty(e?.source) ? e.source! : null,
    }))
    .filter((e) => e.name && pctFmt(e.pct) != null) as Array<{ name: string; pct: unknown; source: string | null }>;

  if (validEntries.length === 0) {
    // Conservative disclosure — explicitly NO invented percentages.
    return 'Ortaklık yapısı bu raporda yapılandırılmış kanonik veri kaynağında teyit edilmemiştir; bağımsız doğrulama önerilir.';
  }

  // Sort by stake_pct desc so the largest holder leads.
  validEntries.sort((a, b) => Number(pctFmt(b.pct)?.replace(',', '.') ?? 0) - Number(pctFmt(a.pct)?.replace(',', '.') ?? 0));
  const top = validEntries.slice(0, 3);
  const items = top
    .map((e) => `${escapeHtml(e.name)} (%${pctFmt(e.pct)})`)
    .join(', ');

  const parts: string[] = [];
  parts.push(
    `Ortaklık yapısında öne çıkan ${top.length === 1 ? 'pay sahibi' : 'pay sahipleri'}: ${items}.`,
  );

  // Free-float / yabancı yatırımcı clauses — only when the field is finite.
  const freeFloat = pctFmt(inp.free_float_pct);
  const foreign = pctFmt(inp.foreign_investor_ratio_pct);
  if (freeFloat || foreign) {
    const ffClause = freeFloat ? `halka açıklık oranı %${freeFloat}` : '';
    const foreignClause = foreign ? `yabancı yatırımcı oranı %${foreign}` : '';
    const merged = [ffClause, foreignClause].filter(Boolean).join('; ');
    parts.push(`Kanonik veriye göre ${merged} olarak kayıtlıdır.`);
  }

  // Humanised source citation — first entry's source, with raw-ID suppression.
  const rawSource = top[0].source ?? (nonEmpty(inp.controlling_shareholder?.source) ? inp.controlling_shareholder!.source! : null);
  const safeSource = humanizeFilingSource(rawSource);
  if (safeSource) {
    // Trim the longest sensible prefix — keep just the humanised filing label
    // up to the first ' — ' or ' / ' separator so we don't leak verbose tails.
    const trimmed = safeSource.split(/\s[—\-/]\s/, 1)[0].trim();
    parts.push(`Kaynak: ${escapeHtml(trimmed)}.`);
  }

  return parts.join(' ');
}

// =============================================================================
// P4.beta.4 Wave 2 — Risk Matrisi summary filler
// =============================================================================
//
// Reads fa_red_flags from inputs. Emits a one-paragraph summary of severity
// counts and the humanised label of the top critical (or highest-severity)
// flag. NEVER emits raw codes — uses lookupRedFlagTr or the safe fallback.
// If fa_red_flags is null/empty, emits an explicit conservative disclosure.

function buildRiskMatrixSummary(inp: SectionFillerInputs): string | null {
  const flags = Array.isArray(inp.fa_red_flags) ? inp.fa_red_flags : null;
  if (!flags || flags.length === 0) {
    return 'Risk matrisi bu raporda yapılandırılmış risk bayraklarıyla doldurulmamıştır; matris hücrelerindeki sektör-varsayılan girdiler tek başına değerlendirilmemelidir.';
  }

  // Severity buckets — only critical/warn/info are used in summary text;
  // unknown severities are counted under "diğer" so totals stay honest.
  let critical = 0, warn = 0, info = 0, other = 0;
  let topCritical: { code?: string | null } | null = null;
  let topWarn: { code?: string | null } | null = null;
  for (const f of flags) {
    const sev = String(f?.severity ?? '').toLowerCase();
    if (sev === 'critical') {
      critical++;
      if (!topCritical) topCritical = f;
    } else if (sev === 'warn' || sev === 'warning') {
      warn++;
      if (!topWarn) topWarn = f;
    } else if (sev === 'info' || sev === 'information') {
      info++;
    } else {
      other++;
    }
  }

  const parts: string[] = [];

  // Severity-count clause — only mentions categories with N>0.
  const counts: string[] = [];
  if (critical > 0) counts.push(`${critical} kritik bulgu`);
  if (warn > 0) counts.push(`${warn} izleme uyarısı`);
  if (info > 0) counts.push(`${info} bilgilendirme sinyali`);
  if (other > 0) counts.push(`${other} sınıflandırılmamış bulgu`);
  if (counts.length > 0) {
    parts.push(`Risk matrisinde ${counts.join(', ')} yer almaktadır.`);
  }

  // Top-impact clause — humanised, never raw code.
  const top = topCritical ?? topWarn;
  if (top) {
    const safe = humanizeRedFlagCode(top.code);
    parts.push(`En yüksek etki kategorisinde "${escapeHtml(safe)}" öne çıkmaktadır.`);
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
}

// =============================================================================
// P4.beta.4 Wave 2 — Ana Katalizörler summary filler
// =============================================================================
//
// Reads ctx.li_count (computed from the section's already-rendered <li>
// elements). NEVER invents catalyst items — only summarises the count and
// notes that ordering follows synthesis priority. Wave 2 constraint #3.

function buildCatalystsSummary(_inp: SectionFillerInputs, ctx?: SectionContext): string | null {
  const n = ctx?.li_count ?? 0;
  if (n <= 0) {
    return 'Yakın vadede yapılandırılmış kanonik kaynaklarda pozitif katalizör tespit edilmemiştir; bu durum negatif değildir, yalnızca kanonik veri henüz tetiklenmemiştir.';
  }
  return `Bu raporda ${n} pozitif katalizör tespit edilmiştir; sıralama sentez katmanının önem skoruna göre yapılmıştır. Ayrıntılar yukarıdaki maddelerde özetlenmiştir.`;
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
  // P4.beta.4 Wave 2 — three remaining weak sections
  {
    pattern: /^ortaklık\s+yapısı/i,
    templateId: 'ownership_structure',
    build: buildOwnershipStructure,
  },
  {
    pattern: /^risk\s+matrisi/i,
    templateId: 'risk_matrix_summary',
    build: buildRiskMatrixSummary,
  },
  {
    pattern: /^ana\s+katalizörler/i,
    templateId: 'catalysts_summary',
    build: buildCatalystsSummary,
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

// Upstream protected-block placeholders inserted by hygiene_sanitizer
// (e.g. __hygiene_protected_42__) are NOT visible report content; they get
// restored to the original <style>/<script>/<!--comment--> after sanitisation.
// They must NOT inflate section char counts during weak-section detection.
const PROTECTED_PLACEHOLDER_RE = /__[a-z]+_protected_\d+__/gi;

function sectionVisibleCharCount(html: string, h: HeadingMatch, next: HeadingMatch | null): number {
  const slice = html.slice(h.endIdx, next ? next.startIdx : html.length);
  // mask style/script and upstream sanitizer placeholders before measuring
  const masked = slice
    .replace(STYLE_BLOCK_RE, '')
    .replace(PROTECTED_PLACEHOLDER_RE, '');
  return stripTags(masked).length;
}

/** Count <li> elements inside a section slice. Used by buildCatalystsSummary
 *  to summarise rendered catalyst count without re-deriving items from
 *  upstream sources (Wave 2 constraint #3). Strips upstream placeholders so
 *  the count is taken from real boardroom content only. */
function countSectionListItems(html: string, h: HeadingMatch, next: HeadingMatch | null): number {
  const raw = html.slice(h.endIdx, next ? next.startIdx : html.length);
  const slice = raw
    .replace(STYLE_BLOCK_RE, '')
    .replace(PROTECTED_PLACEHOLDER_RE, '');
  const matches = slice.match(/<li\b[^>]*>/gi);
  return matches ? matches.length : 0;
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

    // Compute per-section context for templates that depend on already-
    // rendered HTML (e.g. catalyst <li> count for buildCatalystsSummary).
    const sectionCtx: SectionContext = {
      li_count: countSectionListItems(html, h, next),
    };

    const content = tpl.build(inputs, sectionCtx);
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
