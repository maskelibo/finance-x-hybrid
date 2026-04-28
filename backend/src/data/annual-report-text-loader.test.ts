/**
 * Pre-Core-4 Phase G — annual-report text loader unit tests.
 * Slicing logic only — PDF parsing is exercised by integration runs.
 */

import { describe, expect, it } from 'vitest';

import { _sliceForTests, loadAnnualReportExtracts } from './annual-report-text-loader.js';

describe('annual-report slicing', () => {
  const SAMPLE = `
KOÇ HOLDİNG A.Ş.
2024 FAALİYET RAPORU

YÖNETİM KURULU BAŞKANININ MESAJI

Değerli paydaşlarımız, 2024 yılı şirketimiz için zorlu ama
büyüme dolu bir yıl olmuştur. Konsolide gelirimiz %18 artarken
faaliyet kârımız %22 büyüdü. Önümüzdeki dönemde dijital
dönüşüm yatırımlarına odaklanacağız.

GENEL MÜDÜRÜN MESAJI

2024'te 12 milyar TL CAPEX harcadık ve ana iştirakimiz Tüpraş'ın
kapasite genişlemesi planını başlattık.

FAALİYET ALANLARI

Holding 5 ana sektörde faaliyet gösterir: enerji, otomotiv,
dayanıklı tüketim, finans ve gıda. 2024 itibariyle Tüpraş
toplam gelirin %38'ini, Ford Otosan %22'sini oluşturmaktadır.

RİSK YÖNETİMİ

Şirketimiz beş ana risk kategorisinde aktif izleme yapar:
finansal, operasyonel, yasal/uyum, stratejik ve sürdürülebilirlik.
2024'te döviz volatilitesi en kritik risk faktörü olmuştur.

2025 BEKLENTİLERİ

2025 yılında konsolide gelirin %15-20 büyümesini, EBITDA
marjının ise %12-14 bandında konsolide olmasını bekliyoruz.

SÜRDÜRÜLEBİLİRLİK

CBAM kapsamında 2026'dan itibaren karbon maliyetlerimiz
artacaktır. Tüpraş için tahmini yıllık etki 850M EUR.
`;

  it('slices chairman letter', () => {
    const out = _sliceForTests(SAMPLE, 'chairman_letter');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/Değerli paydaşlarımız/);
    expect(out!).toMatch(/dijital\s+dönüşüm/);
  });

  it('slices CEO message', () => {
    const out = _sliceForTests(SAMPLE, 'ceo_message');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/12 milyar TL CAPEX/);
  });

  it('slices segments overview', () => {
    const out = _sliceForTests(SAMPLE, 'segments_overview');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/Tüpraş[\s\S]*%38/);
  });

  it('slices risks', () => {
    const out = _sliceForTests(SAMPLE, 'risks_section');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/döviz volatilitesi/);
  });

  it('slices outlook', () => {
    const out = _sliceForTests(SAMPLE, 'outlook_section');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/%15-20/);
  });

  it('slices sustainability', () => {
    const out = _sliceForTests(SAMPLE, 'sustainability_section');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/CBAM/);
  });

  it('returns null when no anchor matches', () => {
    expect(_sliceForTests('No anchors here.', 'risks_section')).toBeNull();
  });

  it('case-insensitive matching works', () => {
    const text = 'genel müdürün mesajı: this is the message body content here.';
    expect(_sliceForTests(text, 'ceo_message')).not.toBeNull();
  });
});

describe('loadAnnualReportExtracts — file-not-found', () => {
  it('returns null when path does not exist', async () => {
    const out = await loadAnnualReportExtracts('TEST', '/non/existent/path.pdf');
    expect(out).toBeNull();
  });
});
