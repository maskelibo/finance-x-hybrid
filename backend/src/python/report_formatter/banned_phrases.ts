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
  | 'severity_tag';

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
// Master list (export for sanitizer)
// =============================================================================

export const BANNED_PHRASES: BannedPhrase[] = [
  ...PIPELINE_MARKERS,
  ...MODULE_NAMES,
  ...ML_INTERNAL,
  ...PIPELINE_STATE,
  ...SEVERITY_TAGS,
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
