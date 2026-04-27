import { describe, it, expect } from 'vitest';
import { guardMacroConsistency } from './macro_consistency_guard.js';

// =============================================================================
// Detection
// =============================================================================

describe('macro_consistency_guard — detection', () => {
  it('detects "Raporlanmadı" table cell + narrative specific value', () => {
    const html = `
      <table>
        <tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr>
      </table>
      <p>TCMB faizi %37'de sabit kaldığı sürece etki sınırlı kalacaktır.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_resolved).toBeGreaterThanOrEqual(1);
    expect(result.details.some(d => d.metric === 'tcmb_policy_rate' && d.resolved)).toBe(true);
  });

  it('does NOT flag when table has actual value (not placeholder)', () => {
    const html = `
      <table>
        <tr><td>TCMB Politika Faizi</td><td>%37</td></tr>
      </table>
      <p>TCMB faizi %37'de sabit kaldı.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_resolved).toBe(0);
  });

  it('does NOT flag when both table and narrative are placeholder', () => {
    const html = `
      <table>
        <tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr>
      </table>
      <p>TCMB politika faizi bu raporda teyit edilememiştir.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_resolved).toBe(0);
  });

  it('handles n/a, —, Bilinmiyor as placeholder values', () => {
    const cases = [
      `<table><tr><td>TCMB Politika Faizi</td><td>n/a</td></tr></table><p>TCMB faizi %35.</p>`,
      `<table><tr><td>TCMB Politika Faizi</td><td>—</td></tr></table><p>TCMB faizi %35.</p>`,
      `<table><tr><td>TCMB Politika Faizi</td><td>Bilinmiyor</td></tr></table><p>TCMB faizi %35.</p>`,
    ];
    for (const html of cases) {
      const { result } = guardMacroConsistency(html);
      expect(result.contradictions_resolved).toBeGreaterThanOrEqual(1);
    }
  });
});

// =============================================================================
// Resolution
// =============================================================================

describe('macro_consistency_guard — resolution', () => {
  it('replaces narrative numeric with disclaimer (TCMB)', () => {
    const html = `
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>TCMB faizi %37'de sabit kaldığı sürece...</p>
    `;
    const { html: out } = guardMacroConsistency(html);
    expect(out).toContain('kanonik veri kaynağında teyit edilmemiştir');
    expect(out).not.toMatch(/TCMB\s+faizi\s+%37/);
  });

  it('preserves rest of narrative sentence', () => {
    const html = `
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>TCMB faizi %37'de sabit kaldığı sürece etki sınırlı kalacaktır.</p>
    `;
    const { html: out } = guardMacroConsistency(html);
    expect(out).toContain('etki sınırlı kalacaktır');
  });

  it('handles multiple metrics independently', () => {
    const html = `
      <table>
        <tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr>
        <tr><td>TÜFE</td><td>Raporlanmadı</td></tr>
        <tr><td>USD/TRY</td><td>44.93</td></tr>
      </table>
      <p>TCMB faizi %37 düzeyindedir. TÜFE %38.5 olarak gerçekleşti. USD/TRY 44.93.</p>
    `;
    const { result } = guardMacroConsistency(html);
    // TCMB + TÜFE → 2 resolutions; USD/TRY consistent → no resolve
    expect(result.contradictions_resolved).toBeGreaterThanOrEqual(2);
    expect(result.details.find(d => d.metric === 'tcmb_policy_rate')?.resolved).toBe(true);
    expect(result.details.find(d => d.metric === 'cpi_yoy')?.resolved).toBe(true);
  });

  it('contradictions_remaining is 0 after successful resolution', () => {
    const html = `
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>TCMB faizi %37 düzeyindedir.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_remaining).toBe(0);
  });
});

// =============================================================================
// Other metric coverage
// =============================================================================

describe('macro_consistency_guard — metric coverage', () => {
  it('handles CPI placeholder + narrative', () => {
    const html = `
      <table><tr><td>TÜFE Yıllık</td><td>Raporlanmadı</td></tr></table>
      <p>Enflasyon %38.5'te seyrediyor.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.details.find(d => d.metric === 'cpi_yoy')?.resolved).toBe(true);
  });

  it('handles GDP placeholder + narrative', () => {
    const html = `
      <table><tr><td>GSYH Büyüme</td><td>Raporlanmadı</td></tr></table>
      <p>GSYH %3.2 büyüdü.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.details.find(d => d.metric === 'gdp')?.resolved).toBe(true);
  });

  it('handles USD/TRY placeholder + narrative', () => {
    const html = `
      <table><tr><td>USD/TRY</td><td>—</td></tr></table>
      <p>USD/TRY 44.93 seviyesinde.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.details.find(d => d.metric === 'usd_try')?.resolved).toBe(true);
  });
});

// =============================================================================
// HTML safety
// =============================================================================

describe('macro_consistency_guard — HTML safety', () => {
  it('preserves <style> blocks', () => {
    const html = `
      <style>.tcmb { color: red; content: "TCMB faizi %37"; }</style>
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>TCMB faizi %37 olarak alındı.</p>
    `;
    const { html: out } = guardMacroConsistency(html);
    expect(out).toContain('content: "TCMB faizi %37"');
    // narrative resolved, style preserved
    expect(out).toContain('kanonik veri kaynağında teyit edilmemiştir');
  });

  it('preserves DOCTYPE and outer tags', () => {
    const html = `<!DOCTYPE html><html><body>
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>TCMB faizi %37</p>
    </body></html>`;
    const { html: out } = guardMacroConsistency(html);
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<html>');
    expect(out).toContain('</html>');
  });
});

// =============================================================================
// Empty / no-table cases
// =============================================================================

describe('macro_consistency_guard — empty cases', () => {
  it('html without macro table → no-op', () => {
    const html = '<p>Bu rapor sadece finansal analiz içerir.</p>';
    const { html: out, result } = guardMacroConsistency(html);
    expect(out).toBe(html);
    expect(result.contradictions_resolved).toBe(0);
    expect(result.details).toEqual([]);
  });

  it('table with macro metric but no placeholder → no-op', () => {
    const html = `<table><tr><td>TCMB Politika Faizi</td><td>%37</td></tr></table><p>TCMB faizi %37.</p>`;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_resolved).toBe(0);
  });

  it('placeholder cell but narrative does not mention same metric → no resolve', () => {
    const html = `
      <table><tr><td>TCMB Politika Faizi</td><td>Raporlanmadı</td></tr></table>
      <p>USD/TRY 44.93 düzeyindedir.</p>
    `;
    const { result } = guardMacroConsistency(html);
    expect(result.contradictions_resolved).toBe(0);
    expect(result.details.find(d => d.metric === 'tcmb_policy_rate')?.resolved).toBe(false);
  });
});
