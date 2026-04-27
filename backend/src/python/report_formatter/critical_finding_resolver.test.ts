import { describe, it, expect } from 'vitest';
import { resolveCriticalFinding, type RedFlagInput } from './critical_finding_resolver.js';

// =============================================================================
// Empty-array / missing-array safety (mandatory addition #2)
// =============================================================================

describe('critical_finding_resolver — empty/missing red_flags safety', () => {
  it('null red_flags → no rewrite, skip_reason set, html unchanged', () => {
    const html = '<p>Raporda 6 kritik kırmızı bayrak vardır.</p>';
    const { html: out, result } = resolveCriticalFinding(html, null);
    expect(out).toBe(html);
    expect(result.active_rewrites).toBe(0);
    expect(result.skip_reason).toContain('null/undefined');
  });

  it('undefined red_flags → no rewrite, skip', () => {
    const html = '<p>6 kritik bulgu mevcut.</p>';
    const { html: out, result } = resolveCriticalFinding(html, undefined);
    expect(out).toBe(html);
    expect(result.skip_reason).toContain('null/undefined');
  });

  it('non-array red_flags → no rewrite, skip', () => {
    const html = '<p>6 kritik bulgu mevcut.</p>';
    const { html: out, result } = resolveCriticalFinding(html, 'not an array' as unknown as RedFlagInput[]);
    expect(out).toBe(html);
    expect(result.skip_reason).toContain('not an array');
  });

  it('EMPTY array MUST NOT be rewritten as zero-risk (mandatory rule)', () => {
    const html = '<p>Raporda 6 kritik bulgu var.</p>';
    const { html: out, result } = resolveCriticalFinding(html, []);
    // Critical: empty array does NOT mean "0 risk"; do not rewrite to
    // "finansal kırmızı bayrak tespit edilmemiştir"
    expect(out).toBe(html);
    expect(result.active_rewrites).toBe(0);
    expect(result.skip_reason).toContain('empty');
    expect(out).not.toContain('tespit edilmemiştir');
  });

  it('array with only unknown severities → skip', () => {
    const html = '<p>3 kritik bulgu.</p>';
    const flags: RedFlagInput[] = [{ severity: 'unknown_level' }, { severity: '' }];
    const { html: out, result } = resolveCriticalFinding(html, flags);
    expect(out).toBe(html);
    expect(result.skip_reason).toContain('no recognised severity');
  });
});

// =============================================================================
// Active rewrite — main path
// =============================================================================

describe('critical_finding_resolver — active rewrite (KCHOL canonical)', () => {
  it('rewrites "6 kritik kırmızı bayrak" → "1 kritik bulgu ve 3 izleme uyarısı" (live KCHOL signal)', () => {
    const html = '<p>Raporda 6 kritik kırmızı bayrak yer almaktadır.</p>';
    const flags: RedFlagInput[] = [
      { severity: 'critical', code: 'OVERLEVERAGED' },
      { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
      { severity: 'warn', code: 'INTEREST_COVERAGE_LOW' },
      { severity: 'warn', code: 'PIOTROSKI_WEAK' },
      { severity: 'info', code: 'HOLDING_DUAL_STREAM' },
    ];
    const { html: out, result } = resolveCriticalFinding(html, flags);
    expect(result.active_rewrites).toBe(1);
    expect(out).toContain('1 kritik bulgu ve 3 izleme uyarısı');
    expect(out).not.toContain('6 kritik');
  });

  it('rewrites "6 Kritik Bulgu" headings (case-insensitive)', () => {
    const html = '<h2>6 Kritik Bulgu</h2>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }, { severity: 'warn' }, { severity: 'warn' }];
    const { html: out } = resolveCriticalFinding(html, flags);
    expect(out).toContain('1 kritik bulgu ve 2 izleme uyarısı');
  });

  it('warn_count=0 → "{N} kritik bulgu" only (no fabricated warning)', () => {
    const html = '<p>4 kritik bulgu mevcut.</p>';
    const flags: RedFlagInput[] = [
      { severity: 'critical' }, { severity: 'critical' },
    ];
    const { html: out, result } = resolveCriticalFinding(html, flags);
    expect(out).toContain('2 kritik bulgu');
    expect(out).not.toContain('izleme uyarısı');
    expect(result.active_rewrites).toBe(1);
  });

  it('critical=0 + warn>0 → "{warn} izleme uyarısı"', () => {
    const html = '<p>3 kritik bulgu raporlandı.</p>';
    const flags: RedFlagInput[] = [
      { severity: 'warn' }, { severity: 'warn' },
    ];
    const { html: out } = resolveCriticalFinding(html, flags);
    expect(out).toContain('2 izleme uyarısı');
    expect(out).not.toContain('kritik bulgu');
  });

  it('canonical M === narrative AND warn=0 → no-op (consistency)', () => {
    const html = '<p>1 kritik bulgu mevcut.</p>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }];
    const { html: out, result } = resolveCriticalFinding(html, flags);
    expect(out).toBe(html);
    expect(result.active_rewrites).toBe(0);
  });
});

// =============================================================================
// Multi-paragraph + paragraph anchor tracking (for duplicate-disclaimer guard)
// =============================================================================

describe('critical_finding_resolver — paragraph anchors', () => {
  it('returns anchors for each rewritten paragraph (used by metric_clarifier dedup)', () => {
    const html = '<p>İlk paragraf 6 kritik bulgu içerir.</p><p>Diğer paragraf 4 kritik bulgu vurgular.</p>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }, { severity: 'warn' }];
    const { html: out, result } = resolveCriticalFinding(html, flags);
    expect(result.active_rewrites).toBe(2);
    expect(result.rewritten_paragraph_anchors.length).toBe(2);
    expect(out.match(/1 kritik bulgu ve 1 izleme uyarısı/g)?.length).toBe(2);
  });
});

// =============================================================================
// HTML structural integrity
// =============================================================================

describe('critical_finding_resolver — HTML safety', () => {
  it('does NOT touch <style> block content', () => {
    const html = '<style>.k6 { content: "6 kritik bulgu" }</style><p>6 kritik bulgu</p>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }, { severity: 'warn' }];
    const { html: out } = resolveCriticalFinding(html, flags);
    expect(out).toContain('<style>.k6 { content: "6 kritik bulgu" }</style>');
    expect(out).toContain('1 kritik bulgu ve 1 izleme uyarısı');
  });

  it('does NOT touch <script> block content', () => {
    const html = '<script>const k = "6 kritik bulgu";</script><p>6 kritik bulgu metin</p>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }];
    const { html: out } = resolveCriticalFinding(html, flags);
    expect(out).toContain(`const k = "6 kritik bulgu";`);
    expect(out).toContain('1 kritik bulgu metin');
  });

  it('preserves DOCTYPE and balanced tags', () => {
    const html = '<!DOCTYPE html><html><body><p>6 kritik bulgu</p></body></html>';
    const flags: RedFlagInput[] = [{ severity: 'critical' }, { severity: 'warn' }];
    const { html: out } = resolveCriticalFinding(html, flags);
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(out).toContain('<html>');
    expect(out).toContain('</html>');
  });
});
