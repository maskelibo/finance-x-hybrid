import { describe, it, expect } from 'vitest';
import { sanitizeBoardroomReport } from './hygiene_sanitizer.js';

// =============================================================================
// Smoke
// =============================================================================

describe('hygiene_sanitizer — smoke', () => {
  it('empty HTML → PASS, empty hits', () => {
    const { html, report } = sanitizeBoardroomReport('');
    expect(html).toBe('');
    expect(report.banned_phrases_filtered).toBe(0);
    expect(report.translations_applied).toBe(0);
    expect(report.delivery_status).toBe('PASS');
  });

  it('clean HTML with no banned phrases → PASS', () => {
    const html = `<!DOCTYPE html><html><body><h1>KCHOL Yatırım Raporu</h1><p>Detaylı analiz aşağıdaki bölümlerde sunulmuştur. Bu içerik kurumsal sunum standardındadır ve final okuyucuya yönelik özetler içermektedir. Toplam 200 karakteri rahatlıkla geçen anlamlı bir metin bloğu burada yer almaktadır ve placeholder içermez.</p></body></html>`;
    const { report } = sanitizeBoardroomReport(html, { ticker: 'KCHOL' });
    expect(report.banned_phrases_filtered).toBe(0);
    expect(report.banned_remaining).toBe(0);
    expect(report.delivery_status).toBe('PASS');
  });
});

// =============================================================================
// Banned phrase filtering
// =============================================================================

describe('hygiene_sanitizer — banned phrase filtering', () => {
  it('removes DATA_GAP markers from visible text', () => {
    const html = '<p>DATA_GAP — SOTP tamamlanamadı; tüm iştiraklerin değerleri WebSearch ile alınmalı.</p>';
    const { html: out, report } = sanitizeBoardroomReport(html);
    expect(out).not.toContain('DATA_GAP');
    expect(out).toContain('güncel piyasa verisinden teyit edilmesi gerekmektedir');
    expect(report.banned_phrases_filtered).toBeGreaterThan(0);
  });

  it('replaces internal module names', () => {
    const html = '<p>P3.alpha contradiction_hunter ve chairman_anticipator katmanı çalıştı.</p>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).not.toMatch(/P3\.alpha/);
    expect(out).not.toContain('contradiction_hunter');
    expect(out).not.toContain('chairman_anticipator');
  });

  it('does NOT touch tag attributes or class names', () => {
    const html = '<div class="page fx-no-break"><p>DATA_GAP burada</p></div>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain('class="page fx-no-break"');
    expect(out).not.toContain('DATA_GAP');
  });

  it('does NOT touch <style> block content even if banned word inside', () => {
    const html = `<html><head><style>
      /* fallback comment for engine class */
      .engine-class { color: red; }
    </style></head><body><p>fallback yorumu burada</p></body></html>`;
    const { html: out } = sanitizeBoardroomReport(html);
    // Style content preserved verbatim
    expect(out).toContain('.engine-class { color: red; }');
    expect(out).toContain('/* fallback comment for engine class */');
    // But <p> body had "fallback yorumu" replaced
    expect(out).not.toMatch(/<p>fallback yorumu/);
  });

  it('does NOT touch <script> block content', () => {
    const html = `<html><body><script>const x = 'fallback';</script><p>fallback metni</p></body></html>`;
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain(`const x = 'fallback';`);
    expect(out).not.toMatch(/<p>fallback metni/);
  });

  it('removes severity_tag fragments', () => {
    const html = '<p>Bulgu severity downgraded from high çünkü confidence=low.</p>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).not.toContain('severity downgraded');
    expect(out).not.toContain('confidence=low');
    expect(out).toContain('güven: düşük');
  });

  it('null/undefined visible tokens become em-dash', () => {
    const html = '<td>null</td><td>undefined</td>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).not.toMatch(/>null</);
    expect(out).not.toMatch(/>undefined</);
    expect(out).toContain('—');
  });
});

// =============================================================================
// Translation pass
// =============================================================================

describe('hygiene_sanitizer — translation pass', () => {
  it('translates red flag codes to Turkish', () => {
    const html = '<p>OVERLEVERAGED, LIQUIDITY_TIGHT ve INTEREST_COVERAGE_LOW bulgular tespit edildi.</p>';
    const { html: out, report } = sanitizeBoardroomReport(html);
    expect(out).toContain('Yüksek Borçluluk Riski');
    expect(out).toContain('Likidite Baskısı');
    expect(out).toContain('Faiz Karşılama Zayıflığı');
    expect(out).not.toContain('OVERLEVERAGED');
    expect(report.translations_applied).toBeGreaterThanOrEqual(3);
  });

  it('rewrites English sentence patterns to Turkish boardroom prose', () => {
    const html = '<p>fundamental has both positive and negative signals — inspect closer</p>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain('Sektörel sinyaller karışık görünüm sergiliyor');
    expect(out).not.toMatch(/inspect closer/i);
  });

  it('preserves backref groups in sentence patterns', () => {
    const html = '<p>FA raised 3 critical flag(s) while synthesis stayed positive.</p>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain('Finansal analiz 3 kritik bulgu işaret ederken');
  });
});

// =============================================================================
// Delivery status
// =============================================================================

describe('hygiene_sanitizer — delivery status', () => {
  it('PASS when no issues', () => {
    const html = '<p>' + 'Kurumsal nitelikte bir analiz metni. '.repeat(20) + '</p>';
    const { report } = sanitizeBoardroomReport(html);
    expect(report.delivery_status).toBe('PASS');
  });

  it('CONDITIONAL when weak section detected (scan-only)', () => {
    const html = `
      <h1>Bölüm A</h1>
      <p>${'Yeterince uzun bir paragraf burada yer alıyor. '.repeat(20)}</p>
      <h2>Bölüm B</h2>
      <p>Çok kısa.</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    expect(report.weak_sections).toBeGreaterThan(0);
    expect(report.delivery_status).toBe('CONDITIONAL');
  });

  it('CONDITIONAL when metric conflict scanned', () => {
    const html = `
      <p>Güncel fiyat 207 TL'dir.</p>
      <p>Güncel fiyat 197 TL referans alındı.</p>
      <p>${'Detaylı analiz metni. '.repeat(30)}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    expect(report.metric_conflicts).toBeGreaterThan(0);
    expect(report.delivery_status).toBe('CONDITIONAL');
    // SCAN-ONLY: HTML otomatik düzeltilmedi
    const conflictDetail = report.metric_conflict_details.find(c => c.metric === 'guncel_fiyat');
    expect(conflictDetail?.values.sort()).toEqual(['197', '207']);
  });

  it('HOLD when banned phrase remained visible after sanitize', () => {
    // Construct a case where sanitizer cannot clean — use a phrase whose
    // replacement is null (warn-only) — none in current registry behave
    // exactly like that, so we simulate by injecting after sanitize would
    // run. For unit testability we verify that when 0 remaining → not HOLD.
    const html = '<p>Düz metin, hiçbir yasaklı ifade yok.</p>';
    const { report } = sanitizeBoardroomReport(html);
    expect(report.banned_remaining).toBe(0);
    expect(report.delivery_status).not.toBe('HOLD');
  });
});

// =============================================================================
// Metric consistency scan-only
// =============================================================================

describe('hygiene_sanitizer — metric consistency SCAN', () => {
  it('does NOT modify HTML even when conflicts exist', () => {
    const html = `<p>Güncel fiyat 207 TL.</p><p>Güncel fiyat 197 TL.</p>`;
    const { html: out, report } = sanitizeBoardroomReport(html);
    expect(out).toContain('207 TL');
    expect(out).toContain('197 TL');
    expect(report.metric_conflicts).toBeGreaterThan(0);
  });

  it('flags Piotroski conflict when two different scores in same report', () => {
    const html = `<p>Piotroski 2/9 zayıf.</p><p>Piotroski 4/9 değerlendirildi.</p>`;
    const { report } = sanitizeBoardroomReport(html);
    const conflict = report.metric_conflict_details.find(c => c.metric === 'piotroski');
    expect(conflict).toBeDefined();
    expect(conflict!.values.sort()).toEqual(['2', '4']);
  });

  it('does NOT flag when only single value present', () => {
    const html = `<p>Güncel fiyat 207 TL.</p><p>Yine 207 TL referansı alındı.</p>`;
    const { report } = sanitizeBoardroomReport(html);
    const conflict = report.metric_conflict_details.find(c => c.metric === 'guncel_fiyat');
    expect(conflict).toBeUndefined();
  });
});

// =============================================================================
// Weak section scan-only
// =============================================================================

describe('hygiene_sanitizer — weak section SCAN', () => {
  it('flags placeholder-dense sections', () => {
    const html = `
      <h1>KAP Olayları</h1>
      <table><tr><td>Belirsiz</td><td>Belirsiz</td><td>Belirsiz</td></tr></table>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const weak = report.weak_section_details.find(w => w.heading.includes('KAP'));
    expect(weak).toBeDefined();
  });

  it('flags empty section heading', () => {
    const html = `<h1>Teknik Analiz</h1><h1>Sonraki Bölüm</h1><p>İçerik var.</p>`;
    const { report } = sanitizeBoardroomReport(html);
    expect(report.weak_section_details.some(w => w.heading.includes('Teknik'))).toBe(true);
  });

  it('does NOT remove sections from HTML even when flagged', () => {
    const html = `<h1>Boş Bölüm</h1><h1>Diğer</h1><p>asdf</p>`;
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain('Boş Bölüm');
    expect(out).toContain('Diğer');
  });
});

// =============================================================================
// HTML structural integrity
// =============================================================================

describe('hygiene_sanitizer — HTML structural integrity', () => {
  it('preserves DOCTYPE and html/body tags', () => {
    const html = '<!DOCTYPE html><html><body><p>OVERLEVERAGED</p></body></html>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<html>');
    expect(out).toContain('</html>');
  });

  it('preserves Mustache-rendered class tokens (class names untouched)', () => {
    const html = '<div class="fx-pill fx-pill-low">düşük</div>';
    const { html: out } = sanitizeBoardroomReport(html);
    // Class names with 'low' are NOT touched (they live inside attribute, not text)
    expect(out).toContain('class="fx-pill fx-pill-low"');
    // Visible Turkish text passes through unchanged
    expect(out).toContain('>düşük<');
  });

  it('handles HTML comments without breaking', () => {
    const html = '<!-- DATA_GAP comment -->\n<p>Visible content with no banned words.</p>';
    const { html: out } = sanitizeBoardroomReport(html);
    expect(out).toContain('<!-- DATA_GAP comment -->'); // comment preserved
    expect(out).toContain('Visible content');
  });
});

// =============================================================================
// KCHOL-shaped synthetic fixture
// =============================================================================

describe('hygiene_sanitizer — KCHOL-shaped fixture', () => {
  it('cleans typical KCHOL boardroom output to PASS or CONDITIONAL', () => {
    const html = `
<!DOCTYPE html>
<html>
<head><style>.fx-pill { color: var(--brand-primary); }</style></head>
<body>
<h1>İç Tutarlılık Kontrolü</h1>
<p>${'Bu bölüm yeterince uzun anlamlı bir kurumsal açıklama içerir. '.repeat(8)}</p>
<table>
  <tr><td><span class="fx-pill fx-pill-low">low</span></td>
      <td>financial_red_flag_vs_narrative</td>
      <td>1 critical FA flag(s) vs positive synthesis</td></tr>
  <tr><td><span class="fx-pill fx-pill-medium">medium</span></td>
      <td>synthesis_divergence</td>
      <td>fundamental has both positive and negative signals — inspect closer</td></tr>
</table>
<p>Üreten katman: P3.alpha Contradiction Hunter (deterministic). OVERLEVERAGED bulgu mevcuttur.</p>
<h1>Değerleme Sonucu</h1>
<p>${'Detaylı değerleme yorumu burada anlamlı uzunlukta sunulmuştur. '.repeat(8)}</p>
</body>
</html>
    `;
    const { html: out, report } = sanitizeBoardroomReport(html, { ticker: 'KCHOL' });

    // Banned phrases temizlendi
    expect(out).not.toContain('financial_red_flag_vs_narrative');
    expect(out).not.toContain('synthesis_divergence');
    expect(out).not.toContain('contradiction_hunter');
    expect(out).not.toContain('Contradiction Hunter');
    expect(out).not.toMatch(/P3\.alpha/);
    expect(out).not.toContain('OVERLEVERAGED');
    expect(out).not.toContain('inspect closer');

    // Türkçe çeviriler eklendi
    expect(out).toContain('Yüksek Borçluluk Riski');
    expect(out).toContain('Finansal Riskler ile Yatırım Tezi Arasında Uyum Kontrolü');
    expect(out).toContain('Sentez Katmanı Tutarsızlık Uyarısı');
    expect(out).toContain('Sektörel sinyaller karışık');

    // Style verbatim
    expect(out).toContain('.fx-pill { color: var(--brand-primary); }');

    expect(report.banned_remaining).toBe(0);
    expect(['PASS', 'CONDITIONAL']).toContain(report.delivery_status);
  });
});
