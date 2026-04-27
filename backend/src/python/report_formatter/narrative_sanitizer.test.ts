import { describe, it, expect } from 'vitest';
import { sanitizeNarrative, countPostSanitizeRawAgent } from './narrative_sanitizer.js';

// =============================================================================
// Raw agent monologue removal
// =============================================================================

describe('narrative_sanitizer — raw agent monologue removal', () => {
  it('removes "Excellent — now I have the complete picture..." sentence', () => {
    const html = '<p>Excellent — now I have the complete picture. Let me produce the structured technical analysis output. KCHOL teknik göstergeleri pozitif görünüm sergilemektedir.</p>';
    const { html: out, result } = sanitizeNarrative(html);
    expect(out).not.toContain('Excellent');
    expect(out).not.toContain('Let me produce');
    expect(out).toContain('KCHOL teknik göstergeleri pozitif görünüm sergilemektedir.');
    expect(result.raw_agent_phrases_removed).toBeGreaterThanOrEqual(2);
  });

  it('removes "Now I have..." opener', () => {
    const html = '<p>Now I have all the data I need. Şirket analizine devam edilebilir.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).not.toContain('Now I have');
    expect(out).toContain('Şirket analizine');
  });

  it('removes "Let me create/generate/build..." patterns', () => {
    const html1 = '<p>Let me create the analysis. Sonuçlar:</p>';
    const html2 = '<p>Let me generate a summary. Özet:</p>';
    expect(sanitizeNarrative(html1).html).not.toContain('Let me create');
    expect(sanitizeNarrative(html2).html).not.toContain('Let me generate');
  });

  it('removes "Looking at the X, ..." opener', () => {
    const html = '<p>Looking at the data, finansal analiz net görünüyor.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).not.toContain('Looking at the');
    expect(out).toContain('finansal analiz net görünüyor');
  });

  it('removes "Based on the above/provided..." transition', () => {
    const html = '<p>Based on the above analysis, sonuç olarak şu gözlemler yapılabilir.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).not.toContain('Based on the above');
    expect(out).toContain('sonuç olarak');
  });

  it('does NOT remove legitimate Turkish content', () => {
    const html = '<p>KCHOL holding yapısı dikkate alındığında SOTP değerlemesi ana yöntemdir. Detaylı analiz aşağıdadır.</p>';
    const { html: out, result } = sanitizeNarrative(html);
    expect(out).toContain('KCHOL holding yapısı');
    expect(out).toContain('SOTP değerlemesi');
    expect(out).toContain('Detaylı analiz aşağıdadır');
    expect(result.raw_agent_phrases_removed).toBe(0);
  });

  it('flags ambiguous sentence-boundary cases as warning (does not aggressively delete)', () => {
    // 200+ char without sentence terminator — ambiguous; skip
    const longWithoutPeriod = 'Excellent — now I have ' + 'a very long stretch of text '.repeat(10) + 'that goes on';
    const html = `<p>${longWithoutPeriod}</p>`;
    const { result } = sanitizeNarrative(html);
    expect(result.warnings.some(w => w.startsWith('raw_agent_ambiguous'))).toBe(true);
  });

  it('countPostSanitizeRawAgent returns 0 after sanitization', () => {
    const html = '<p>Excellent — now I have the data. Continue analysis.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(countPostSanitizeRawAgent(out)).toBe(0);
  });

  it('preserves <style> block content even if it contains "Excellent"', () => {
    const html = '<style>.excellent { color: red; }</style><p>Excellent — now I have the data. Devamı.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).toContain('<style>.excellent { color: red; }</style>');
    expect(out).not.toMatch(/<p>Excellent — now I have/);
  });
});

// =============================================================================
// English residue counting (whitelist-aware)
// =============================================================================

describe('narrative_sanitizer — English residue counter', () => {
  it('counts a long English sentence fragment as residue', () => {
    const html = '<p>This is the report and the analysis is ready for review.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.english_residue_remaining).toBeGreaterThanOrEqual(1);
  });

  it('does NOT count finance abbreviations from whitelist (EBITDA, ROE, FCF, ...)', () => {
    const html = '<p>FAVÖK ve EBITDA marjları korundu; ROE ve ROA seviyeleri Q3 itibarıyla iyileşti. CAPEX FY-2025 sınırında.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.english_residue_remaining).toBe(0);
  });

  it('Turkish content + finance abbreviations → 0 residue', () => {
    const html = '<p>KCHOL holding yapısı dikkate alındığında SOTP değerlemesi ana yöntemdir. EBITDA marjı %15 seviyesinde.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.english_residue_remaining).toBe(0);
  });

  it('counts "short-term obligations exceed current assets" as residue', () => {
    const html = '<p>Current ratio low — short-term obligations exceed current assets. Detaylar aşağıdadır.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.english_residue_remaining).toBeGreaterThanOrEqual(1);
    expect(result.english_residue_samples.length).toBeGreaterThan(0);
  });

  it('mixed paragraph: counts residue without false positives on Turkish', () => {
    const html = '<p>Şirket güçlü konumda; net debt to ebitda above the threshold but margins are improving. Yatırım tezi pozitiftir.</p>';
    const { result } = sanitizeNarrative(html);
    // The English fragment should be counted; Turkish parts should not
    expect(result.english_residue_remaining).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Raw flag token counting
// =============================================================================

describe('narrative_sanitizer — raw flag token counter', () => {
  it('counts UPPER_SNAKE_CASE flag tokens as raw flags', () => {
    const html = '<p>Bayraklar arasında YKBNK_DISTORTED ve HOLDING_BANKING_HEAVY mevcut.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.raw_flag_token_remaining).toBeGreaterThanOrEqual(2);
    expect(result.raw_flag_token_samples).toContain('YKBNK_DISTORTED');
    expect(result.raw_flag_token_samples).toContain('HOLDING_BANKING_HEAVY');
  });

  it('does NOT count whitelisted finance abbreviations even with underscores (none expected, but defensive)', () => {
    const html = '<p>EBITDA, FAVÖK ve SOTP yöntemleri kullanıldı.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.raw_flag_token_remaining).toBe(0);
  });

  it('returns 0 when no raw flag tokens', () => {
    const html = '<p>Şirket güçlü performans sergiliyor; FAVÖK marjı %15 seviyesinde.</p>';
    const { result } = sanitizeNarrative(html);
    expect(result.raw_flag_token_remaining).toBe(0);
  });
});

// =============================================================================
// HTML safety
// =============================================================================

describe('narrative_sanitizer — HTML safety', () => {
  it('preserves DOCTYPE and balanced tags', () => {
    const html = '<!DOCTYPE html><html><body><p>Excellent — now I have data. Türkçe metin.</p></body></html>';
    const { html: out } = sanitizeNarrative(html);
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<html>');
    expect(out).toContain('</html>');
  });

  it('preserves <style> block content verbatim', () => {
    const html = '<style>p { color: black; }</style><p>Türkçe paragraf metni burada.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).toContain('<style>p { color: black; }</style>');
  });

  it('preserves <script> block content verbatim', () => {
    const html = '<script>const x = "Let me produce something";</script><p>Türkçe paragraf.</p>';
    const { html: out } = sanitizeNarrative(html);
    expect(out).toContain('<script>const x = "Let me produce something";</script>');
  });
});

// =============================================================================
// Combined real-world scenario
// =============================================================================

describe('narrative_sanitizer — combined KCHOL-like scenario', () => {
  it('multi-issue paragraph: removes raw agent + counts English residue + counts raw flags', () => {
    // Realistic LLM-output shape: monologue openers come FIRST, then the
    // analysis content (with raw flags + English fragments) comes AFTER.
    // The raw_agent removal pass clears the openers but leaves the body.
    const html = `<p>Excellent — now I have the complete picture. Let me produce the analysis. Looking at the data, devamı görülmektedir. Bayraklar arasında YKBNK_DISTORTED ve HOLDING_BANKING_HEAVY mevcuttur; current ratio low and short-term obligations exceed current assets. Türkçe yorumlar aşağıdadır.</p>`;
    const { html: out, result } = sanitizeNarrative(html);

    // Raw agent removed
    expect(out).not.toContain('Excellent —');
    expect(out).not.toContain('Let me produce');
    expect(out).not.toContain('Looking at');
    expect(result.raw_agent_phrases_removed).toBeGreaterThanOrEqual(3);

    // Raw flag tokens still counted (translation pass would handle these
    // separately; this module's job is to COUNT remaining tokens)
    expect(result.raw_flag_token_remaining).toBeGreaterThanOrEqual(2);
    expect(result.raw_flag_token_samples).toContain('YKBNK_DISTORTED');
    expect(result.raw_flag_token_samples).toContain('HOLDING_BANKING_HEAVY');

    // English residue still counted
    expect(result.english_residue_remaining).toBeGreaterThanOrEqual(1);

    // Turkish preserved
    expect(out).toContain('Türkçe yorumlar aşağıdadır');
  });
});
