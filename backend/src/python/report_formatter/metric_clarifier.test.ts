import { describe, it, expect } from 'vitest';
import {
  clarifyKritikBulgu,
  clarifyPiotroski,
} from './metric_clarifier.js';

// =============================================================================
// clarifyKritikBulgu
// =============================================================================

describe('clarifyKritikBulgu — disclaimer-only correction', () => {
  it('no-op when canonical count is null', () => {
    const html = '<p>Bu raporda 6 kritik bulgu vardır.</p>';
    const { html: out, result } = clarifyKritikBulgu(html, null);
    expect(out).toBe(html);
    expect(result.disclaimers_injected).toBe(0);
  });

  it('no-op when narrative count matches canonical (consistency)', () => {
    const html = '<p>Bu raporda 1 kritik bulgu işaret edilmiştir.</p>';
    const { html: out, result } = clarifyKritikBulgu(html, 1);
    expect(out).toBe(html);
    expect(result.disclaimers_injected).toBe(0);
    expect(result.narrative_values).toEqual(['1']);
  });

  it('injects disclaimer when narrative ≠ canonical (KCHOL: 6 vs 1)', () => {
    const html = '<p>Bu raporda 6 kritik bulgu vardır.</p>';
    const { html: out, result } = clarifyKritikBulgu(html, 1);
    expect(result.disclaimers_injected).toBe(1);
    expect(result.conflicts_explained).toBe(1);
    // Narrative number unchanged
    expect(out).toContain('6 kritik bulgu');
    // Canonical disclaimer appended; uses approved wording
    expect(out).toContain('Kanonik finansal analiz sonucu: 1 kritik bulgu');
    // Constraint #1: word "engine" must NOT appear
    expect(out.toLowerCase()).not.toContain('engine');
  });

  it('disclaimer wording matches mandatory constraint exactly', () => {
    const html = '<p>3 kritik finansal bulgu mevcuttur.</p>';
    const { html: out } = clarifyKritikBulgu(html, 1);
    expect(out).toContain('(Kanonik finansal analiz sonucu: 1 kritik bulgu.');
    expect(out.toLowerCase()).not.toContain('engine');
    expect(out.toLowerCase()).not.toContain('engine kanonik');
  });

  it('paragraph-level dedup: at most one disclaimer per paragraph', () => {
    const html = '<p>İlk cümle 6 kritik bulgu içerir. İkinci cümle yine 6 kritik bulgu vurgular.</p>';
    const { html: out, result } = clarifyKritikBulgu(html, 1);
    expect(result.disclaimers_injected).toBe(1);
    const matches = out.match(/Kanonik finansal analiz sonucu/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('multiple paragraphs each get their own disclaimer', () => {
    const html = `
      <p>İlk paragrafta 6 kritik bulgu.</p>
      <p>İkinci paragrafta 4 kritik bulgu.</p>
      <p>Üçüncü paragrafta 1 kritik bulgu.</p>
    `;
    const { html: out, result } = clarifyKritikBulgu(html, 1);
    // 2 conflicts (6, 4); the 1 paragraph matches and is consistent
    expect(result.disclaimers_injected).toBe(2);
    expect(result.narrative_values.sort()).toEqual(['1', '4', '6']);
    const matches = out.match(/Kanonik finansal analiz sonucu/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it('does not modify <style> block content even when it contains numbers', () => {
    const html = '<style>.n6 { content: "6 kritik bulgu" }</style><p>Aslında 6 kritik bulgu.</p>';
    const { html: out } = clarifyKritikBulgu(html, 1);
    // Style preserved verbatim
    expect(out).toContain('<style>.n6 { content: "6 kritik bulgu" }</style>');
    // Disclaimer added in <p> only
    const disclaimers = out.match(/Kanonik finansal analiz sonucu/g) ?? [];
    expect(disclaimers.length).toBe(1);
  });

  it('does not change the narrative number text', () => {
    const html = '<p>Şirkette 6 kritik bulgu raporlandı.</p>';
    const { html: out } = clarifyKritikBulgu(html, 1);
    // Original "6 kritik bulgu" must still appear in HTML
    expect(out.match(/6 kritik bulgu/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it('handles non-finite canonical count safely (null treatment)', () => {
    const html = '<p>6 kritik bulgu.</p>';
    const { html: out, result } = clarifyKritikBulgu(html, NaN);
    expect(out).toBe(html);
    expect(result.disclaimers_injected).toBe(0);
  });
});

// =============================================================================
// clarifyPiotroski
// =============================================================================

describe('clarifyPiotroski — limited-data clarifier', () => {
  it('no-op when prior_period_loaded is true', () => {
    const html = '<p>Piotroski 2/9 olarak hesaplanmıştır.</p>';
    const { html: out, result } = clarifyPiotroski(html, true);
    expect(out).toBe(html);
    expect(result.clarifiers_injected).toBe(0);
  });

  it('injects clarifier suffix when prior_period_loaded is false', () => {
    const html = '<p>Piotroski 2/9 olarak hesaplanmıştır.</p>';
    const { html: out, result } = clarifyPiotroski(html, false);
    expect(result.clarifiers_injected).toBe(1);
    // Score unchanged
    expect(out).toContain('Piotroski 2/9');
    // Clarifier present + Turkish boardroom wording
    expect(out).toContain('Bu skor yalnızca cari yıl kriterlerine göre');
    expect(out).toContain('önceki dönem finansalları gerekmektedir');
    expect(out).toContain('Altı kriter önceki dönem karşılaştırması');
  });

  it('handles "Piotroski F 2/9" and "Piotroski Skoru 2/9" variants', () => {
    const html1 = '<p>Piotroski F 2/9 zayıf.</p>';
    const html2 = '<p>Piotroski Skoru 4/9 değerlendirildi.</p>';
    const html3 = '<p>Piotroski Score 7/9 güçlü.</p>';
    expect(clarifyPiotroski(html1, false).result.clarifiers_injected).toBe(1);
    expect(clarifyPiotroski(html2, false).result.clarifiers_injected).toBe(1);
    expect(clarifyPiotroski(html3, false).result.clarifiers_injected).toBe(1);
  });

  it('paragraph-level dedup: only one clarifier per paragraph', () => {
    const html = '<p>Piotroski 2/9 ve aşağıda Piotroski 2/9 yine geçer.</p>';
    const { html: out, result } = clarifyPiotroski(html, false);
    expect(result.clarifiers_injected).toBe(1);
    const matches = out.match(/Bu skor yalnızca cari yıl/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('multiple paragraphs each get a clarifier', () => {
    const html = `<p>Piotroski 2/9.</p><p>Diğer bölümde Piotroski 4/9.</p>`;
    const { html: out, result } = clarifyPiotroski(html, false);
    expect(result.clarifiers_injected).toBe(2);
    const matches = out.match(/Bu skor yalnızca cari yıl/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it('Piotroski X/9 score string remains unchanged', () => {
    const html = '<p>Sonuç olarak Piotroski 2/9 zayıf.</p>';
    const { html: out } = clarifyPiotroski(html, false);
    expect(out).toContain('Piotroski 2/9');
    // Sayıyı değiştiren bir replace olmadı
    expect(out.match(/Piotroski 2\/9/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it('does not match unrelated X/Y patterns', () => {
    const html = '<p>Bu rapor 2/3 doluluk oranıyla hazırlandı.</p>';
    const { html: out, result } = clarifyPiotroski(html, false);
    expect(out).toBe(html);
    expect(result.clarifiers_injected).toBe(0);
  });

  it('protects <style> blocks from accidental match', () => {
    const html = '<style>.piotroski-2-9 { font: 9pt; }</style><p>Piotroski 2/9 zayıf.</p>';
    const { html: out } = clarifyPiotroski(html, false);
    expect(out).toContain('<style>.piotroski-2-9 { font: 9pt; }</style>');
    const clarifiers = out.match(/Bu skor yalnızca cari yıl/g) ?? [];
    expect(clarifiers.length).toBe(1);
  });

  it('clarifier text contains no banned internal phrases', () => {
    const html = '<p>Piotroski 2/9.</p>';
    const { html: out } = clarifyPiotroski(html, false);
    const banned = ['DATA_GAP', 'engine', 'fallback', 'P3.alpha', 'P4.beta', 'LLM', 'agent', 'WebSearch'];
    for (const b of banned) {
      expect(out.toLowerCase()).not.toContain(b.toLowerCase());
    }
  });
});

// =============================================================================
// HTML structural integrity
// =============================================================================

describe('metric_clarifier — HTML structural integrity', () => {
  it('preserves DOCTYPE/html/body wrappers', () => {
    const html = '<!DOCTYPE html><html><body><p>6 kritik bulgu</p></body></html>';
    const { html: out } = clarifyKritikBulgu(html, 1);
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<html>');
    expect(out).toContain('</html>');
  });

  it('handles list items as containing block', () => {
    const html = '<ul><li>6 kritik bulgu önemli</li><li>Diğer not</li></ul>';
    const { html: out, result } = clarifyKritikBulgu(html, 1);
    expect(result.disclaimers_injected).toBe(1);
    // Disclaimer should be inside the <li> that matched (before </li>)
    expect(out).toMatch(/6 kritik bulgu[\s\S]*Kanonik finansal analiz[\s\S]*<\/li>/);
  });
});
