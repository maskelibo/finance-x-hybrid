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
