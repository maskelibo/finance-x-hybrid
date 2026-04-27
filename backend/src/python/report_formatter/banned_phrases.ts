/**
 * Banned phrases registry (P4.beta.1).
 *
 * Internal pipeline / debug / architectural identifiers that must NEVER
 * appear in the visible text of a boardroom report. Each entry has:
 *   - regex   — a pattern (case-flexible, word-boundary aware)
 *   - category— used in hygiene_report grouping
 *   - replacement — '' (remove) or a safe fallback phrase; if null, we
 *                    only log a warning (sanitizer leaves text untouched).
 *
 * Strictly TEXT-ONLY. The sanitizer wraps these patterns to operate
 * exclusively on visible text segments (between tags), never on tag
 * names, attributes, class names, style blocks, or scripts.
 */

export type BannedCategory =
  | 'pipeline_marker'
  | 'module_name'
  | 'ml_internal'
  | 'pipeline_state'
  | 'severity_tag'
  // P4.beta.3 additions
  | 'configuration_leak'
  | 'agent_meta_ref'
  | 'internal_field_ref'
  | 'raw_flag_token';

export interface BannedPhrase {
  /** Source pattern (literal phrase, regex-escaped automatically). */
  pattern: string;
  /** Treat as regex (no auto-escape) when true. */
  isRegex?: boolean;
  /** When true, match is case-insensitive. */
  caseInsensitive?: boolean;
  category: BannedCategory;
  /** Replacement text. '' removes the phrase. null = warn-only (no replace). */
  replacement: string | null;
  /** Optional comment for maintainers. */
  note?: string;
}

// Helper: escape regex special characters in a literal string
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// Category 1 — Pipeline / debug markers (strict ban)
// =============================================================================

const PIPELINE_MARKERS: BannedPhrase[] = [
  { pattern: 'DATA_GAP', category: 'pipeline_marker', replacement: '' },
  { pattern: 'MISSING', category: 'pipeline_marker', replacement: 'eksik veri', caseInsensitive: false },
  { pattern: 'UNVERIFIED', category: 'pipeline_marker', replacement: 'teyit edilmemiş', caseInsensitive: false },
  { pattern: 'fallback', category: 'pipeline_marker', replacement: 'yedek hesaplama' },
  { pattern: '\\bengine\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: true, replacement: '', note: 'kelime sınırı; "araştırma motoru" gibi kompozit ifadeleri etkilemez' },
  { pattern: 'upstream', category: 'pipeline_marker', replacement: 'önceki adım', caseInsensitive: true },
  { pattern: 'parser', category: 'pipeline_marker', replacement: 'ayrıştırıcı', caseInsensitive: true },
  { pattern: 'provider', category: 'pipeline_marker', replacement: 'sağlayıcı', caseInsensitive: true },
  { pattern: 'canonical_numbers', category: 'pipeline_marker', replacement: 'standart sayılar' },
  { pattern: 'canonical', category: 'pipeline_marker', replacement: 'standart', caseInsensitive: true },
  { pattern: 'source=hint', category: 'pipeline_marker', replacement: '' },
  { pattern: 'source=fallback', category: 'pipeline_marker', replacement: '' },
  { pattern: 'src:\\s*hesaplama', category: 'pipeline_marker', isRegex: true, caseInsensitive: true, replacement: '(yardımcı hesaplama)' },
  { pattern: 'src:\\s*engine', category: 'pipeline_marker', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'türetilmiş', category: 'pipeline_marker', replacement: '', caseInsensitive: true },
  { pattern: '\\bplug\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: true, replacement: 'mutabakat kalemi' },
  { pattern: '\\bresidual\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: true, replacement: 'mutabakat kalemi' },
  { pattern: '\\bnull\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: false, replacement: '—' },
  { pattern: '\\bundefined\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: false, replacement: '—' },
  { pattern: '\\bNaN\\b', category: 'pipeline_marker', isRegex: true, caseInsensitive: false, replacement: '—' },
  { pattern: '\\[HYBRID\\]', category: 'pipeline_marker', isRegex: true, replacement: '' },
];

// =============================================================================
// Category 2 — Internal module names (strict ban)
// =============================================================================

const MODULE_NAMES: BannedPhrase[] = [
  { pattern: 'P[0-9]+\\.(?:alpha|beta|gamma|delta)(?:\\.[0-9]+)?', category: 'module_name', isRegex: true, replacement: '' },
  { pattern: 'contradiction[_\\s]hunter', category: 'module_name', isRegex: true, caseInsensitive: true, replacement: 'iç tutarlılık kontrolü' },
  { pattern: 'chairman[_\\s]anticipator', category: 'module_name', isRegex: true, caseInsensitive: true, replacement: 'yönetim kurulu soru anticipasyonu' },
  { pattern: 'citation[_\\s]backfill', category: 'module_name', isRegex: true, caseInsensitive: true, replacement: 'kanıt indeksi' },
  { pattern: 'boardroom[_\\s]intelligence', category: 'module_name', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'truth-layer', category: 'module_name', replacement: '', caseInsensitive: true },
  { pattern: 'truth_layer', category: 'module_name', replacement: '', caseInsensitive: true },
  { pattern: '\\bFTL\\b', category: 'module_name', isRegex: true, replacement: '' },
  { pattern: 'methodology_guard', category: 'module_name', replacement: 'Metodoloji Uyum Kontrolü' },
  { pattern: 'methodology_decision', category: 'module_name', replacement: 'Metodoloji Kararı' },
  { pattern: 'valuation_method_mismatch', category: 'module_name', replacement: 'Değerleme Metodolojisi Uyumsuzluğu' },
  { pattern: 'financial_red_flag_vs_narrative', category: 'module_name', replacement: 'Finansal Riskler ile Yatırım Tezi Arasında Uyum Kontrolü' },
  { pattern: 'synthesis_divergence', category: 'module_name', replacement: 'Sentez Katmanı Tutarsızlık Uyarısı' },
  { pattern: 'confidence_vs_conviction', category: 'module_name', replacement: 'Veri Güveni ile Sonuç Kararlılığı Çelişkisi' },
  { pattern: 'thesis_vs_valuation', category: 'module_name', replacement: 'Yatırım Tezi ve Hedef Fiyat Tutarsızlığı' },
  { pattern: 'target_spread', category: 'module_name', replacement: 'Hedef Fiyat Yöntemleri Arası Sapma' },
];

// =============================================================================
// Category 3 — ML / pipeline architecture vocabulary (strict ban)
// =============================================================================

const ML_INTERNAL: BannedPhrase[] = [
  { pattern: '\\bLLM\\b', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'Python deterministic', category: 'ml_internal', replacement: '' },
  { pattern: '\\bsub-?agent\\b', category: 'ml_internal', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'agent runner', category: 'ml_internal', replacement: '', caseInsensitive: true },
  { pattern: 'agent_runner', category: 'ml_internal', replacement: '', caseInsensitive: true },
  { pattern: '\\bagent\\b', category: 'ml_internal', isRegex: true, caseInsensitive: true, replacement: 'modül', note: 'serbest "agent" kelimesi → modül' },
  { pattern: 'WebSearch ile alınmalı', category: 'ml_internal', replacement: 'güncel piyasa verisinden teyit edilmesi gerekmektedir' },
  { pattern: '\\bWebSearch\\b', category: 'ml_internal', isRegex: true, replacement: 'web araştırması' },
  { pattern: '\\bWebFetch\\b', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'KAP API', category: 'ml_internal', replacement: 'KAP veri kaynağı' },
  { pattern: 'claude\\.ai', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'claude-sonnet[\\w.-]*', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'claude-opus[\\w.-]*', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'claude-haiku[\\w.-]*', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: '\\bSonnet\\b', category: 'ml_internal', isRegex: true, replacement: '' },
  { pattern: 'max_tokens', category: 'ml_internal', replacement: '' },
  { pattern: 'output_tokens', category: 'ml_internal', replacement: '' },
  { pattern: 'input_tokens', category: 'ml_internal', replacement: '' },
  { pattern: 'LLM enrichment', category: 'ml_internal', replacement: 'narrative zenginleştirme' },
  { pattern: 'LLM call', category: 'ml_internal', replacement: '' },
  { pattern: 'LLM merge', category: 'ml_internal', replacement: '' },
  { pattern: 'agent_runs', category: 'ml_internal', replacement: '' },
  { pattern: 'accumulatedContext', category: 'ml_internal', replacement: '' },
  { pattern: 'session_id', category: 'ml_internal', replacement: '' },
  { pattern: 'run_id', category: 'ml_internal', replacement: '' },
];

// =============================================================================
// Category 4 — Mid-pipeline state phrases (strict ban)
// =============================================================================

const PIPELINE_STATE: BannedPhrase[] = [
  { pattern: 'tamamlanamadı', category: 'pipeline_state', replacement: 'henüz teyit edilmemiştir', caseInsensitive: true },
  { pattern: 'rendered\\s+\\d+\\s+bytes', category: 'pipeline_state', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: '\\[QA GATE\\]', category: 'pipeline_state', isRegex: true, replacement: '' },
  { pattern: '\\[CEO APPROVAL GATE\\]', category: 'pipeline_state', isRegex: true, replacement: '' },
  { pattern: 'processing complete', category: 'pipeline_state', replacement: '', caseInsensitive: true },
  { pattern: '\\bprocessing\\b', category: 'pipeline_state', isRegex: true, caseInsensitive: true, replacement: '' },
];

// =============================================================================
// Category 5 — Severity / state tags (translatable)
// =============================================================================

const SEVERITY_TAGS: BannedPhrase[] = [
  { pattern: 'severity downgraded from (high|medium|low)', category: 'severity_tag', isRegex: true, caseInsensitive: true, replacement: 'şiddet seviyesi düşürüldü' },
  { pattern: 'severity downgraded', category: 'severity_tag', replacement: 'şiddet seviyesi düşürüldü', caseInsensitive: true },
  { pattern: 'aligned=true', category: 'severity_tag', replacement: 'uyumlu' },
  { pattern: 'aligned=false', category: 'severity_tag', replacement: 'uyumsuz' },
  { pattern: 'confidence=low', category: 'severity_tag', replacement: 'güven: düşük' },
  { pattern: 'confidence=medium', category: 'severity_tag', replacement: 'güven: orta' },
  { pattern: 'confidence=high', category: 'severity_tag', replacement: 'güven: yüksek' },
  { pattern: 'convergence_score', category: 'severity_tag', replacement: 'sentez hassasiyet skoru' },
  { pattern: 'holding_banking_heavy', category: 'severity_tag', replacement: 'bankacılık iştiraki ağırlıklı holding' },
  { pattern: 'regular_industrial', category: 'severity_tag', replacement: 'standart sanayi şirketi' },
];

// =============================================================================
// Category 6 — Configuration / state leaks (P4.beta.3, strict ban)
// =============================================================================

const CONFIGURATION_LEAKS: BannedPhrase[] = [
  { pattern: "sector_override\\s*=\\s*'[^']+'", category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: 'sector_override\\s*=\\s*"[^"]+"', category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: '\\bsector_override\\b', category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: '\\bengine_snapshot\\b', category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: '\\bcase_lesson\\b', category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: '\\bcase\\s+lesson\\b', category: 'configuration_leak', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'fetch\\s+yapılmadı', category: 'configuration_leak', isRegex: true, caseInsensitive: true, replacement: 'veri henüz teyit edilmemiştir' },
  { pattern: '\\.yaml\\b', category: 'configuration_leak', isRegex: true, replacement: '' },
  { pattern: 'yaml\\s+(dosyası|path)', category: 'configuration_leak', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: '\\bagent_runs\\b', category: 'configuration_leak', isRegex: true, replacement: '' },
];

// =============================================================================
// Category 7 — Agent meta-references (P4.beta.3, strict ban / rewrite)
// =============================================================================

const AGENT_META_REFS: BannedPhrase[] = [
  { pattern: '\\d+\\s+(?:özel\\s+)?ajan(?!\\w)', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'kademeli analiz hattı' },
  { pattern: 'narrative\\s+blok(?:lar(?:ı(?:nın)?)?)?', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'metin blokları' },
  { pattern: 'önceki\\s+adım\\s+context', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'önceki\\s+adım(?!\\w)', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'yukarıdaki bölüm' },
  { pattern: 'previous\\s+step\\s+context', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: 'previous\\s+step(?!\\w)', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'önceki bölüm' },
  { pattern: '\\bagent\\s+output\\b', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'modül çıktısı' },
  { pattern: '\\bpipeline\\s+output\\b', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'analiz çıktısı' },
  { pattern: '\\bpipeline\\s+(state|context)\\b', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: '' },
  { pattern: '\\bupstream\\s+(agent|context|input)\\b', category: 'agent_meta_ref', isRegex: true, caseInsensitive: true, replacement: 'yukarıdaki analiz' },
];

// =============================================================================
// Category 8 — Internal field references (P4.beta.3, rewrite)
// =============================================================================

const INTERNAL_FIELD_REFS: BannedPhrase[] = [
  { pattern: 'FA\\.critical_flag_count', category: 'internal_field_ref', isRegex: true, replacement: 'kritik bulgu sayısı' },
  { pattern: 'FA\\.confidence', category: 'internal_field_ref', isRegex: true, replacement: 'finansal analiz güven düzeyi' },
  { pattern: 'FA\\.red_flags', category: 'internal_field_ref', isRegex: true, replacement: 'finansal risk bayrakları' },
  { pattern: 'FA\\.metrics', category: 'internal_field_ref', isRegex: true, replacement: 'finansal metrikler' },
  // Catch-all: any FA.field_name → generic Turkish; specific maps above take precedence
  { pattern: 'FA\\.[a-zA-Z_]+', category: 'internal_field_ref', isRegex: true, replacement: 'finansal analiz alanı' },
  { pattern: 'fa_red_flag:[A-Z][A-Z0-9_]*', category: 'internal_field_ref', isRegex: true, replacement: 'finansal risk bayrağı' },
  { pattern: 'ftl:[a-z_]+(?::[a-z_]+)?', category: 'internal_field_ref', isRegex: true, replacement: 'metodoloji tespiti' },
  { pattern: 'contradiction:cf-[a-f0-9]+', category: 'internal_field_ref', isRegex: true, replacement: 'iç tutarlılık bulgusu' },
  { pattern: 'synth_div:\\d+', category: 'internal_field_ref', isRegex: true, replacement: 'sentez tutarsızlığı' },
  { pattern: '\\bsynth_score\\b', category: 'internal_field_ref', isRegex: true, replacement: 'sentez hassasiyet skoru' },
];

// =============================================================================
// Category 9 — Raw flag tokens (P4.beta.3, humanize via RED_FLAG_TR)
// =============================================================================
//
// Catch-all pattern that matches uppercase tokens like YKBNK_DISTORTED,
// HOLDING_BANKING_HEAVY, etc. The translation pass in hygiene_sanitizer
// maps these via RED_FLAG_TR; this banned_phrases entry exists so any
// LEFTOVER raw flag token (mapping yoksa) is removed and counted in
// raw_flag_token_remaining for the HOLD gate.
//
// Note: replacement is null = warn-only; the actual humanization happens
// in the translation pass (red flag → TR). This banned_phrases entry is
// the SAFETY NET that catches anything missed.

const RAW_FLAG_TOKENS: BannedPhrase[] = [
  // Catch-all for raw flag-style identifiers; only fires if translation pass
  // didn't map the token. Strict UPPER_SNAKE_CASE with at least one underscore.
  {
    pattern: '\\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]*\\b',
    category: 'raw_flag_token',
    isRegex: true,
    caseInsensitive: false,
    replacement: null,  // warn-only; counted in raw_flag_token_remaining
    note: 'catch-all for unhandled raw flag tokens; humanization is via RED_FLAG_TR',
  },
];

// =============================================================================
// Master list (export for sanitizer)
// =============================================================================

export const BANNED_PHRASES: BannedPhrase[] = [
  ...PIPELINE_MARKERS,
  ...MODULE_NAMES,
  ...ML_INTERNAL,
  ...PIPELINE_STATE,
  ...SEVERITY_TAGS,
  // P4.beta.3 additions
  ...CONFIGURATION_LEAKS,
  ...AGENT_META_REFS,
  ...INTERNAL_FIELD_REFS,
  ...RAW_FLAG_TOKENS,
];

/**
 * Compile a banned phrase entry to an active RegExp.
 * Adds the global flag so we can replaceAll; case sensitivity follows the entry.
 */
export function compileBannedPattern(b: BannedPhrase): RegExp {
  const body = b.isRegex ? b.pattern : escapeRegex(b.pattern);
  const flags = 'g' + (b.caseInsensitive !== false ? 'i' : '');
  return new RegExp(body, flags);
}
