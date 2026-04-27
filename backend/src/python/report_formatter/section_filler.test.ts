import { describe, it, expect } from 'vitest';
import {
  fillEmptySections,
  type SectionFillerInputs,
} from './section_filler.js';

// =============================================================================
// Helper: build empty-section HTML scaffolds
// =============================================================================

function emptySection(heading: string): string {
  return `<h1>${heading}</h1>\n<h1>Sonraki Bölüm</h1>\n<p>${'Lorem ipsum dolor sit amet '.repeat(15)}</p>`;
}

const EMPTY_INPUTS: SectionFillerInputs = {};

// =============================================================================
// Smoke + invariants
// =============================================================================

describe('section_filler — smoke', () => {
  it('empty inputs + empty html → no fills', () => {
    const { html, result } = fillEmptySections('', EMPTY_INPUTS);
    expect(html).toBe('');
    expect(result.sections_filled).toBe(0);
    expect(result.details).toEqual([]);
  });

  it('html without weak sections → no injection', () => {
    const html = '<h1>Bölüm A</h1>' + ('<p>' + 'Yeterince uzun anlamlı paragraf. '.repeat(20) + '</p>');
    const { html: out, result } = fillEmptySections(html, { ticker: 'KCHOL' });
    expect(out).toBe(html);
    expect(result.sections_filled).toBe(0);
  });

  it('weak section without matching template pattern → no injection', () => {
    const html = emptySection('Tamamen Bilinmeyen Başlık');
    const { html: out, result } = fillEmptySections(html, { ticker: 'KCHOL' });
    expect(out).toBe(html);
    expect(result.sections_filled).toBe(0);
  });

  it('matching template + zero structured fields → no fabrication, no injection', () => {
    // Yönetici Özeti template requires at least ticker; with empty inputs + template
    // builder returns null → no inject.
    const html = emptySection('I. Yönetici Özeti');
    const { html: out, result } = fillEmptySections(html, EMPTY_INPUTS);
    expect(out).toBe(html); // unchanged
    expect(result.sections_filled).toBe(0);
  });
});

// =============================================================================
// Yönetici Özeti
// =============================================================================

describe('section_filler — Yönetici Özeti', () => {
  it('renders opening clause when ticker + sector + period available', () => {
    const html = emptySection('I. Yönetici Özeti');
    const inp: SectionFillerInputs = {
      ticker: 'kchol',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      primary_method: 'val_sotp',
    };
    const { html: out, result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(1);
    expect(result.details[0].template).toBe('executive_summary');
    expect(out).toContain('KCHOL (Holding)');
    expect(out).toContain('FY-2025');
    expect(out).toContain('Holding yapısı');
    expect(out).toContain('Parçaların Toplamı');
    expect(out).toContain('class="fx-section-fill"');
  });

  it('omits price clause when as_of date missing (no temporal fabrication)', () => {
    const html = emptySection('I. Yönetici Özeti');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      current_price_try: 207,
      current_price_as_of: null, // explicit null
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).not.toContain('Referans fiyat');
    expect(out).not.toContain('güncel');
    expect(out).not.toContain('şu an');
  });

  it('renders price clause when as_of date present', () => {
    const html = emptySection('I. Yönetici Özeti');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      current_price_try: 207,
      current_price_as_of: '24 Nisan 2026',
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).toContain('207 TL');
    expect(out).toContain('(24 Nisan 2026 itibarıyla)');
  });

  it('banking flag adds bank-segment note when holding+banking both true', () => {
    const html = emptySection('I. Yönetici Özeti');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      is_banking: true,
      primary_method: 'val_sotp',
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).toContain('Bankacılık iştirakinin');
  });
});

// =============================================================================
// Makroekonomik Bağlam (constraint #8: as_of awareness)
// =============================================================================

describe('section_filler — Makroekonomik Bağlam', () => {
  it('uses date prefix when macro.as_of is present', () => {
    const html = emptySection('VI. Makroekonomik Bağlam');
    const inp: SectionFillerInputs = {
      macro: {
        tcmb_policy_rate: 50,
        cpi_yoy: 38.5,
        usd_try: 44.93,
        eur_try: 52.55,
        as_of: '27 Nisan 2026',
      },
    };
    const { html: out, result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(1);
    expect(out).toContain('27 Nisan 2026 itibarıyla');
    expect(out).toContain('TCMB politika faizi');
    expect(out).toContain('USD/TRY');
    expect(out).toContain('EUR/TRY');
  });

  it('uses date-agnostic "Bu dönemde" when as_of missing (no güncel/şu an wording)', () => {
    const html = emptySection('VI. Makroekonomik Bağlam');
    const inp: SectionFillerInputs = {
      macro: {
        tcmb_policy_rate: 50,
        cpi_yoy: 38.5,
        usd_try: 44.93,
        eur_try: 52.55,
      },
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).toContain('Bu dönemde');
    expect(out).not.toContain('güncel');
    expect(out).not.toContain('şu an');
    expect(out).not.toContain('current');
  });

  it('skips template entirely when macro structured data is null', () => {
    const html = emptySection('VI. Makroekonomik Bağlam');
    const { html: out, result } = fillEmptySections(html, EMPTY_INPUTS);
    expect(out).toBe(html);
    expect(result.sections_filled).toBe(0);
  });

  it('omits FX clause when only TCMB rate present', () => {
    const html = emptySection('VI. Makroekonomik Bağlam');
    const inp: SectionFillerInputs = {
      macro: { tcmb_policy_rate: 50 },
    };
    const { html: out, result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(1);
    expect(out).toContain('TCMB politika faizi');
    expect(out).not.toContain('USD/TRY');
    expect(out).not.toContain('EUR/TRY');
  });
});

// =============================================================================
// Teknik Analiz
// =============================================================================

describe('section_filler — Teknik Analiz', () => {
  it('renders trend + RSI + volume disclaimer when available', () => {
    const html = emptySection('VII. Teknik Analiz');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      technical: {
        trend: 'bullish',
        rsi: 57.4,
        volume_data_available: false,
      },
    };
    const { html: out, result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(1);
    expect(out).toContain('KCHOL');
    expect(out).toContain('pozitif yönde');
    expect(out).toContain('RSI(14)');
    expect(out).toContain('57,4');
    expect(out).toContain('Hacim verisi teyit edilmediği için');
  });

  it('omits volume disclaimer when volume_data_available is true', () => {
    const html = emptySection('VII. Teknik Analiz');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      technical: { trend: 'bullish', rsi: 57.4, volume_data_available: true },
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).not.toContain('Hacim verisi teyit edilmediği için');
  });

  it('skips when technical structured data is null', () => {
    const html = emptySection('VII. Teknik Analiz');
    const { html: out, result } = fillEmptySections(html, { ticker: 'KCHOL' });
    expect(out).toBe(html);
    expect(result.sections_filled).toBe(0);
  });
});

// =============================================================================
// Hızlı Göstergeler / Emsal Çarpanları
// =============================================================================

describe('section_filler — Quick indicators + Peer pending', () => {
  it('renders quick indicators when fa_canonical fields present', () => {
    const html = emptySection('Hızlı Göstergeler');
    const inp: SectionFillerInputs = {
      fa_canonical: {
        net_debt: 996438000000,
        net_debt_to_ebitda: 5.1898,
        current_ratio: 0.8719,
      },
    };
    const { html: out, result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(1);
    expect(out).toContain('Net Borç');
    expect(out).toContain('Net Borç / FAVÖK');
    expect(out).toContain('Cari oran');
  });

  it('PEER_DATA_PENDING template always rendered when invoked', () => {
    const html = emptySection('Emsal Çarpanları');
    const { html: out, result } = fillEmptySections(html, EMPTY_INPUTS);
    expect(result.sections_filled).toBe(1);
    expect(out).toContain('Sektörel emsal medyanları');
    expect(out).toContain('teyit edilmemiştir');
    expect(out).toContain('yayımlanmamıştır');
  });
});

// =============================================================================
// Multiple sections in same html
// =============================================================================

describe('section_filler — multi-section', () => {
  it('fills multiple matching empty sections in a single pass', () => {
    const html = `
      <h1>I. Yönetici Özeti</h1>
      <h1>VI. Makroekonomik Bağlam</h1>
      <h1>VII. Teknik Analiz</h1>
      <h1>Sonu Bölüm</h1>
      <p>${'Yeterince uzun içerik. '.repeat(20)}</p>
    `;
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      primary_method: 'val_sotp',
      macro: { tcmb_policy_rate: 50, cpi_yoy: 38, usd_try: 44.93, eur_try: 52.55 },
      technical: { trend: 'bullish', rsi: 57.4, volume_data_available: false },
    };
    const { result } = fillEmptySections(html, inp);
    expect(result.sections_filled).toBe(3);
    const ids = result.details.map((d) => d.template).sort();
    expect(ids).toEqual(['executive_summary', 'macro_context', 'technical_scope']);
  });
});

// =============================================================================
// Banned phrases not introduced by templates
// =============================================================================

describe('section_filler — template hygiene', () => {
  it('emitted templates contain no banned pipeline/module phrases', () => {
    const html = emptySection('I. Yönetici Özeti');
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL',
      sector_canonical: 'holding',
      period_label: 'FY-2025',
      is_holding: true,
      is_banking: true,
      primary_method: 'val_sotp',
      current_price_try: 207,
      current_price_as_of: '24 Nisan 2026',
    };
    const { html: out } = fillEmptySections(html, inp);
    const banned = ['DATA_GAP', 'engine', 'fallback', 'türetilmiş', 'P3.alpha', 'P4.beta', 'LLM', 'agent_runs', 'WebSearch', 'src: hesaplama'];
    for (const b of banned) {
      expect(out.toLowerCase()).not.toContain(b.toLowerCase());
    }
  });

  it('Macro template (no as_of) does not contain "güncel", "şu an", or "current"', () => {
    const html = emptySection('VI. Makroekonomik Bağlam');
    const inp: SectionFillerInputs = {
      macro: { tcmb_policy_rate: 50, cpi_yoy: 38, usd_try: 44.93, eur_try: 52.55 },
    };
    const { html: out } = fillEmptySections(html, inp);
    for (const t of ['güncel', 'şu an', 'current']) {
      expect(out.toLowerCase()).not.toContain(t.toLowerCase());
    }
  });
});

// =============================================================================
// Style/script protection
// =============================================================================

describe('section_filler — protected blocks', () => {
  it('does not consider headings inside <style> blocks', () => {
    const html = `<style>h1 { color: red; }</style>\n<h1>I. Yönetici Özeti</h1>\n<h1>Son</h1>\n<p>${'X '.repeat(120)}</p>`;
    const inp: SectionFillerInputs = {
      ticker: 'KCHOL', sector_canonical: 'holding', period_label: 'FY-2025',
      is_holding: true, primary_method: 'val_sotp',
    };
    const { html: out } = fillEmptySections(html, inp);
    expect(out).toContain('<style>h1 { color: red; }</style>');
  });
});

// =============================================================================
// P4.beta.4 Wave 2 — Ortaklık Yapısı filler
// =============================================================================

describe('section_filler — Ortaklık Yapısı (Wave 2)', () => {
  function ownershipSection(): string {
    // H2 followed immediately by another H2 with thin content — mirrors
    // the live KCHOL shape where the chart-only Ortaklık Yapısı section
    // falls under the 200-char prose threshold.
    return `<h1>II. Şirket Profili</h1>\n<h2>Ortaklık Yapısı</h2>\n<svg width="100"></svg>\n<h2>Sonraki Alt Başlık</h2>\n<p>X</p>\n<h1>III. Diğer</h1>\n<p>${'Y '.repeat(120)}</p>`;
  }

  it('builds boardroom paragraph from valid shareholder data', () => {
    const inp: SectionFillerInputs = {
      shareholder_structure: [
        { shareholder: 'Koç Ailesi / Temel Ticaret A.Ş.', stake_pct: 41.1, source: 'KCHOL_Yonetim_Kurulu_Raporu_20260414.html — ortaklık pasta grafiği' },
        { shareholder: 'Koç Holding Emekli ve Yardım Sandığı', stake_pct: 8.2 },
        { shareholder: 'Halka Açık (Free Float)', stake_pct: 50.7 },
      ],
      free_float_pct: 50.7,
      foreign_investor_ratio_pct: 38.4,
    };
    const { html: out, result } = fillEmptySections(ownershipSection(), inp);
    expect(result.sections_filled).toBeGreaterThanOrEqual(1);
    const filled = result.details.find(d => d.heading === 'Ortaklık Yapısı');
    expect(filled).toBeDefined();
    expect(filled?.template).toBe('ownership_structure');
    expect(out).toContain('Halka Açık (Free Float)'); // top stake by pct
    expect(out).toContain('%50,7');
    expect(out).toContain('halka açıklık');
    expect(out).toContain('yabancı yatırımcı');
  });

  it('humanises raw filing-source IDs (KCHOL_Yonetim_Kurulu_Raporu_*)', () => {
    const inp: SectionFillerInputs = {
      shareholder_structure: [
        { shareholder: 'Koç Ailesi', stake_pct: 41.1, source: 'KCHOL_Yonetim_Kurulu_Raporu_20260414.html' },
      ],
    };
    const { html: out } = fillEmptySections(ownershipSection(), inp);
    expect(out).not.toContain('KCHOL_Yonetim_Kurulu_Raporu_20260414');
    expect(out).not.toContain('KCHOL_Yonetim_Kurulu_Raporu_20260414.html');
    expect(out).toContain('KCHOL Yönetim Kurulu raporu (2026-04-14)');
  });

  it('humanises *_YK_YYYYMMDD raw filing IDs', () => {
    const inp: SectionFillerInputs = {
      shareholder_structure: [
        { shareholder: 'Test Holding', stake_pct: 30, source: 'TEST_YK_20260101' },
      ],
    };
    const { html: out } = fillEmptySections(ownershipSection(), inp);
    expect(out).not.toContain('TEST_YK_20260101');
    expect(out).toContain('TEST Yönetim Kurulu raporu (2026-01-01)');
  });

  it('emits conservative disclosure when shareholder_structure is missing', () => {
    const { html: out, result } = fillEmptySections(ownershipSection(), {});
    expect(out).toContain('Ortaklık yapısı bu raporda yapılandırılmış kanonik veri kaynağında teyit edilmemiştir');
    expect(result.details.find(d => d.heading === 'Ortaklık Yapısı')).toBeDefined();
  });

  it('emits conservative disclosure when shareholder_structure is empty array', () => {
    const inp: SectionFillerInputs = { shareholder_structure: [] };
    const { html: out } = fillEmptySections(ownershipSection(), inp);
    expect(out).toContain('Ortaklık yapısı bu raporda yapılandırılmış kanonik veri kaynağında teyit edilmemiştir');
  });

  it('does NOT invent stake percentages when an entry lacks stake_pct', () => {
    const inp: SectionFillerInputs = {
      shareholder_structure: [
        { shareholder: 'Eksik Pay', stake_pct: null },
        { shareholder: 'Geçerli Pay', stake_pct: 60 },
      ],
    };
    const { html: out } = fillEmptySections(ownershipSection(), inp);
    expect(out).toContain('Geçerli Pay');
    expect(out).not.toContain('Eksik Pay'); // dropped because stake_pct is missing
  });
});

// =============================================================================
// P4.beta.4 Wave 2 — Risk Matrisi summary filler
// =============================================================================

describe('section_filler — Risk Matrisi (Wave 2)', () => {
  function riskSection(): string {
    return `<h1>XI. Risk</h1>\n<h2>Risk Matrisi (Etki × Olasılık)</h2>\n<div class="risk-matrix"></div>\n<h2>Sonraki</h2>\n<p>X</p>\n<h1>XII. Diğer</h1>\n<p>${'Y '.repeat(120)}</p>`;
  }

  it('builds severity-count summary from KCHOL-shape red_flags', () => {
    const inp: SectionFillerInputs = {
      fa_red_flags: [
        { severity: 'critical', code: 'OVERLEVERAGED' },
        { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
        { severity: 'warn', code: 'INTEREST_COVERAGE_LOW' },
        { severity: 'warn', code: 'PIOTROSKI_WEAK' },
        { severity: 'info', code: 'HOLDING_DUAL_STREAM' },
      ],
    };
    const { html: out, result } = fillEmptySections(riskSection(), inp);
    const filled = result.details.find(d => d.heading.startsWith('Risk Matrisi'));
    expect(filled).toBeDefined();
    expect(filled?.template).toBe('risk_matrix_summary');
    expect(out).toContain('1 kritik bulgu');
    expect(out).toContain('3 izleme uyarısı');
    expect(out).toContain('1 bilgilendirme sinyali');
  });

  it('humanises top critical via RED_FLAG_TR (no raw code leakage)', () => {
    const inp: SectionFillerInputs = {
      fa_red_flags: [
        { severity: 'critical', code: 'OVERLEVERAGED' },
        { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
      ],
    };
    const { html: out } = fillEmptySections(riskSection(), inp);
    // Expected mapping: OVERLEVERAGED → "Yüksek Borçluluk Riski"
    expect(out).toContain('Yüksek Borçluluk Riski');
    // Raw codes must NOT appear in the visible report
    expect(out).not.toContain('OVERLEVERAGED');
    expect(out).not.toContain('LIQUIDITY_TIGHT');
  });

  it('uses safe fallback wording for unknown codes (never leaks raw)', () => {
    const inp: SectionFillerInputs = {
      fa_red_flags: [
        { severity: 'critical', code: 'UNKNOWN_CUSTOM_CODE_XYZ' },
      ],
    };
    const { html: out } = fillEmptySections(riskSection(), inp);
    expect(out).not.toContain('UNKNOWN_CUSTOM_CODE_XYZ');
    expect(out).toContain('tanımlanmamış risk bulgusu');
  });

  it('emits conservative disclosure when fa_red_flags is null', () => {
    const { html: out } = fillEmptySections(riskSection(), {});
    expect(out).toContain('Risk matrisi bu raporda yapılandırılmış risk bayraklarıyla doldurulmamıştır');
  });

  it('emits conservative disclosure when fa_red_flags is empty array', () => {
    const inp: SectionFillerInputs = { fa_red_flags: [] };
    const { html: out } = fillEmptySections(riskSection(), inp);
    expect(out).toContain('Risk matrisi bu raporda yapılandırılmış risk bayraklarıyla doldurulmamıştır');
  });

  it('handles "warning" severity (alternate spelling) the same as "warn"', () => {
    const inp: SectionFillerInputs = {
      fa_red_flags: [
        { severity: 'warning', code: 'LIQUIDITY_TIGHT' },
        { severity: 'warning', code: 'INTEREST_COVERAGE_LOW' },
      ],
    };
    const { html: out } = fillEmptySections(riskSection(), inp);
    expect(out).toContain('2 izleme uyarısı');
  });
});

// =============================================================================
// P4.beta.4 Wave 2 — Ana Katalizörler summary filler
// =============================================================================

describe('section_filler — Ana Katalizörler (Wave 2)', () => {
  function catalystSection(liItems: string[]): string {
    const ul = liItems.length > 0
      ? `<ul class="bullet-list">${liItems.map(t => `<li>${t}</li>`).join('')}</ul>`
      : '';
    return `<h1>XII. Sonuç</h1>\n<h2>Ana Katalizörler</h2>\n${ul}\n<h2>Diğer</h2>\n<p>X</p>\n<h1>XIII. Diğer</h1>\n<p>${'Y '.repeat(120)}</p>`;
  }

  it('summarises catalyst count when <li> items are already rendered', () => {
    const html = catalystSection(['Tupras', 'FROTO', 'Temettu', 'Portföy']);
    const { html: out, result } = fillEmptySections(html, {});
    const filled = result.details.find(d => d.heading === 'Ana Katalizörler');
    expect(filled).toBeDefined();
    expect(filled?.template).toBe('catalysts_summary');
    expect(out).toContain('Bu raporda 4 pozitif katalizör tespit edilmiştir');
    expect(out).toContain('sentez katmanının önem skoruna');
  });

  it('emits zero-catalyst conservative disclosure when no <li> exists', () => {
    const html = catalystSection([]);
    const { html: out } = fillEmptySections(html, {});
    expect(out).toContain('Yakın vadede yapılandırılmış kanonik kaynaklarda pozitif katalizör tespit edilmemiştir');
  });

  it('does NOT invent new catalyst items (preserves original <li> set)', () => {
    const html = catalystSection(['Sadece Bir Madde']);
    const { html: out } = fillEmptySections(html, {});
    // Original <li> preserved
    expect(out).toContain('<li>Sadece Bir Madde</li>');
    // No new <li> injected (count of <li> in output equals input)
    const liCount = (out.match(/<li[\s>]/g) ?? []).length;
    expect(liCount).toBe(1);
  });
});
