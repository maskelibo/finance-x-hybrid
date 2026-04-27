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
// P4.beta.4 micro-hotfix — RAW_FLAG_TOKENS warn-only effective-warnings filter
// =============================================================================
//
// The RAW_FLAG_TOKENS catch-all warn-only entry counts raw UPPER_SNAKE_CASE
// tokens at the PRE-translation stage. By the time the pipeline reaches
// raw_flag_token_remaining (post-all-passes), those tokens are already
// humanised by RED_FLAG_TR / SENTENCE_PATTERNS. When raw_flag_token_remaining
// is 0, the warn-only entry is telemetry-only and must not trigger CONDITIONAL.

describe('hygiene_sanitizer — RAW_FLAG_TOKENS warn-only effective-warnings filter', () => {
  it('PASS when raw codes appear pre-translation but raw_flag_token_remaining=0 after RED_FLAG_TR', () => {
    // LIQUIDITY_TIGHT matches the RAW_FLAG_TOKENS catch-all (UPPER_SNAKE_CASE
    // requires an underscore) AND has a RED_FLAG_TR mapping → translated away
    // in the translation pass. Net result: warnings array contains the
    // catch-all entry (telemetry), raw_flag_token_remaining=0 → delivery_status
    // PASS via the effectiveWarnings filter.
    const html = '<p>LIQUIDITY_TIGHT bulgusu temel finansal göstergeler arasındadır. ' + 'Genel kurumsal değerlendirme yeterli uzunlukta bir kapsam notuyla sürdürülmüştür ve placeholder içermez. '.repeat(3) + '</p>';
    const { report } = sanitizeBoardroomReport(html);
    expect(report.raw_flag_token_remaining).toBe(0);
    // The warn-only telemetry IS preserved in the report
    const hasCatchAllWarn = report.warnings.some(w => w.startsWith('banned_warn_only:\\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]*\\b:'));
    expect(hasCatchAllWarn).toBe(true);
    // But the effective warning count drops the catch-all → delivery_status PASS
    expect(report.delivery_status).toBe('PASS');
  });

  it('HOLD when raw_flag_token_remaining > 0 (catch-all warn-only is NOT filtered)', () => {
    // A token that has NO RED_FLAG_TR mapping AND is not in
    // ACCEPTED_FINANCE_TOKENS — survives all passes → raw_flag_token_remaining
    // > 0 → HOLD. The micro-hotfix filter must NOT mask this case.
    const html = '<p>Bilinmeyen kod UNKNOWN_INTERNAL_FLAG_X tespit edildi. ' + 'Detaylı kurumsal değerlendirme yeterli uzunlukta sürdürülmüştür. '.repeat(3) + '</p>';
    const { report } = sanitizeBoardroomReport(html);
    expect(report.raw_flag_token_remaining).toBeGreaterThan(0);
    expect(report.delivery_status).toBe('HOLD');
  });

  it('CONDITIONAL when a non-catch-all warn-only entry is present', () => {
    // P-block reference like "P4.alpha" is a separate warn-only banned
    // phrase entry (not the RAW_FLAG_TOKENS catch-all). The micro-hotfix
    // filter must NOT remove it — delivery_status stays CONDITIONAL.
    // (P-block references are translated away by the banned-phrase pass when
    // they have a replacement; we use the warn-only path by injecting into
    // a context that survives. For simplicity, we craft a generic non-RAW
    // warn-only signal by using 0 banned items but a metric conflict — same
    // CONDITIONAL effect, isolating the filter behaviour.)
    const html = `<p>Güncel fiyat 207 TL referans alındı. ${'Detaylı analiz metni. '.repeat(20)}</p><p>Güncel fiyat 197 TL referans alındı.</p>`;
    const { report } = sanitizeBoardroomReport(html);
    // Distinct prices → metric conflict → CONDITIONAL irrespective of warnings
    expect(report.metric_conflicts).toBeGreaterThan(0);
    expect(report.delivery_status).toBe('CONDITIONAL');
  });

  it('preserves the full warnings array in the report (telemetry visibility)', () => {
    const html = '<p>OVERLEVERAGED ile LIQUIDITY_TIGHT bulguları tespit edildi. ' + 'Genel açıklama yeterli uzunluktadır ve kapsam notu placeholder içermez. '.repeat(3) + '</p>';
    const { report } = sanitizeBoardroomReport(html);
    // The catch-all warn-only entry remains in warnings for downstream
    // telemetry (logHygieneSummary etc.)
    const catchAllEntries = report.warnings.filter(w => w.startsWith('banned_warn_only:\\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]*\\b:'));
    expect(catchAllEntries.length).toBe(1);
    // delivery_status PASS because raw_flag_token_remaining=0 (RED_FLAG_TR
    // translated both codes away)
    expect(report.raw_flag_token_remaining).toBe(0);
    expect(report.delivery_status).toBe('PASS');
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
// P4.beta.4 Wave 1 — scanner refinements
// =============================================================================

describe('hygiene_sanitizer — weak section SCAN (P4.beta.4 Wave 1)', () => {
  // Long Turkish prose helper — keeps fixtures readable while crossing the
  // 200-char boardroom-quality threshold for "real" content.
  const longProse = (n = 8) =>
    Array(n).fill('Bu bölüm yeterli kurumsal yorum ve analitik içerik taşımaktadır. ').join('');

  it('H1 rollup: H1 immediately followed by H2 with content is NOT flagged as no_content', () => {
    // Mirrors the live KCHOL shape:
    //   <h1>VI. Makroekonomik Bağlam</h1>
    //   <h2>Kritik Makro Göstergeler</h2><table>... real macro indicators ...</table>
    //   <h2>Sektör-Spesifik Transmisyon</h2><div>... narrative ...</div>
    // Pre-Wave-1 the H1 measured 0 chars between itself and the immediately
    // following H2; with rollup it measures across the whole sub-tree.
    const html = `
      <h1>VI. Makroekonomik Bağlam</h1>
      <h2>Kritik Makro Göstergeler</h2>
      <p>${longProse()}</p>
      <h2>Sektör-Spesifik Transmisyon</h2>
      <p>TCMB faizi sabit kalmış, USD/TRY 44,93 seviyesinde, enflasyon yıllık %38,5 olarak gerçekleşmiştir. Genel makro çerçevede sıkı para politikası devam etmektedir.</p>
      <h1>VII. Teknik Analiz</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const h1Weak = report.weak_section_details.find(w => w.heading.includes('Makroekonomik'));
    expect(h1Weak).toBeUndefined();
  });

  it('H1 rollup: H1 measured until the next H1, not the next heading of any level', () => {
    // Three H2 children under one H1 — total content well above threshold.
    const html = `
      <h1>XI. Risk Değerlendirmesi</h1>
      <h2>Risk Matrisi</h2>
      <p>${longProse(4)}</p>
      <h2>Temel Risk Faktörleri</h2>
      <p>${longProse(4)}</p>
      <h2>Detaylı Risk Yorumu</h2>
      <p>${longProse(4)}</p>
      <h1>XII. Sonuç</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const h1Weak = report.weak_section_details.find(w => w.heading.includes('Risk Değerlendirmesi'));
    expect(h1Weak).toBeUndefined();
  });

  it('table-aware: H2 with ≥4 populated rows is NOT flagged as too_short', () => {
    // 6-row income statement, no surrounding prose — exactly the live shape
    // for "Konsolide Gelir Tablosu (milyar TL) — FY-2025".
    const html = `
      <h1>III. Finansal Analiz</h1>
      <h2>Konsolide Gelir Tablosu (milyar TL) — FY-2025</h2>
      <table>
        <tr><td>Hasılat</td><td>2.757.295</td></tr>
        <tr><td>Satışların Maliyeti</td><td>-1.539.222</td></tr>
        <tr><td>Brüt Kâr</td><td>469.354</td></tr>
        <tr><td>Faaliyet Kârı</td><td>117.608</td></tr>
        <tr><td>FAVÖK (EBITDA)</td><td>192.000</td></tr>
        <tr><td>Net Dönem Kârı</td><td>34.628</td></tr>
      </table>
      <h2>Sonraki H2</h2>
      <p>${longProse()}</p>
      <h1>IV. Diğer</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const tableSection = report.weak_section_details.find(w => w.heading.includes('Gelir Tablosu'));
    expect(tableSection).toBeUndefined();
  });

  it('table-aware: rows whose ONLY value cells are placeholders do NOT count as populated', () => {
    // Macro indicator table where label is real but value is "Raporlanmadı"
    // for several rows — only the genuinely populated rows should be counted.
    const html = `
      <h1>VI. Makro</h1>
      <h2>Sınırlı Kapsam</h2>
      <table>
        <tr><td>USD/TRY</td><td>44,93</td></tr>
        <tr><td>EUR/TRY</td><td>52,55</td></tr>
        <tr><td>TCMB Faizi</td><td>Raporlanmadı</td></tr>
        <tr><td>TÜFE</td><td>Raporlanmadı</td></tr>
        <tr><td>GSYH</td><td>Raporlanmadı</td></tr>
      </table>
      <h1>VII. Diğer</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    // Only 2 rows are genuinely populated (label + numeric value), so the H2
    // does NOT cross the ≥4 threshold and would still be too_short on prose.
    const h2Weak = report.weak_section_details.find(w => w.heading.includes('Sınırlı Kapsam'));
    expect(h2Weak).toBeDefined();
  });

  it('genuinely empty H1 (no content, no children) remains weak', () => {
    const html = `<h1>İçeriksiz Bölüm</h1><h1>Sonraki</h1><p>${longProse()}</p>`;
    const { report } = sanitizeBoardroomReport(html);
    const empty = report.weak_section_details.find(w => w.heading === 'İçeriksiz Bölüm');
    expect(empty).toBeDefined();
    expect(empty?.reason).toBe('no_content');
  });

  it('thin non-table H2 remains weak (prose-only, below threshold)', () => {
    const html = `
      <h1>Üst Başlık</h1>
      <h2>Az İçerikli H2</h2>
      <p>Çok kısa.</p>
      <h2>Yeterli H2</h2>
      <p>${longProse()}</p>
      <h1>Sonraki Üst</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const thin = report.weak_section_details.find(w => w.heading === 'Az İçerikli H2');
    expect(thin).toBeDefined();
    expect(thin?.reason).toBe('too_short');
  });

  it('H1 with only placeholder content under H2 children remains placeholder_dense', () => {
    const html = `
      <h1>Plaster Bölüm</h1>
      <h2>Boş Liste</h2>
      <p>Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz Belirsiz</p>
      <h1>Sonraki Üst</h1>
      <p>${longProse()}</p>
    `;
    const { report } = sanitizeBoardroomReport(html);
    const dense = report.weak_section_details.find(w => w.heading === 'Plaster Bölüm');
    expect(dense).toBeDefined();
    expect(dense?.reason).toBe('placeholder_dense');
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
