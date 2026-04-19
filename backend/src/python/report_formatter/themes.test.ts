import { describe, it, expect } from 'vitest';
import { applyTheme, getTheme, mergeBrandOverride, DEFAULT_THEME } from './themes.js';


const SAMPLE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  :root {
    --brand-primary: #1a365d;
    --brand-primary-dark: #0f2440;
    --brand-accent: #c6973f;
    --fx-dark: #1a202c;
    --font-main: 'Segoe UI';
  }
  .cover-page { display: flex; background: linear-gradient(155deg, #0f2440 0%, #1a365d 100%); color: #fff; }
  h1 { color: var(--brand-primary); }
</style>
</head>
<body></body>
</html>
`;


describe('themes', () => {
  it('getTheme returns institutional by default', () => {
    const theme = getTheme(undefined);
    expect(theme.name).toBe('institutional');
    expect(theme.brandPrimary).toBe('#1a365d');
  });

  it('getTheme resolves anthropic preset', () => {
    const theme = getTheme('anthropic');
    expect(theme.name).toBe('anthropic');
    expect(theme.brandAccent).toBe('#D97706');
    expect(theme.coverGradient).toBeDefined();
  });

  it('getTheme resolves minimal preset', () => {
    const theme = getTheme('minimal');
    expect(theme.name).toBe('minimal');
    expect(theme.brandPrimary).toBe('#111827');
  });

  it('getTheme falls back to default for unknown names', () => {
    const theme = getTheme('nonsense');
    expect(theme.name).toBe(DEFAULT_THEME);
  });

  it('applyTheme swaps :root block for anthropic theme', () => {
    const theme = getTheme('anthropic');
    const out = applyTheme(SAMPLE_TEMPLATE, theme);

    // Anthropic primary color should be present
    expect(out).toContain('--brand-primary: #191918');
    // Old institutional primary should be gone
    expect(out).not.toContain('--brand-primary: #1a365d');
    // Cover gradient should be swapped
    expect(out).toContain('#191918');
    expect(out).not.toContain('linear-gradient(155deg, #0f2440');
  });

  it('applyTheme is idempotent', () => {
    const theme = getTheme('minimal');
    const once = applyTheme(SAMPLE_TEMPLATE, theme);
    const twice = applyTheme(once, theme);
    expect(once).toBe(twice);
  });

  it('applyTheme preserves non-:root CSS', () => {
    const theme = getTheme('anthropic');
    const out = applyTheme(SAMPLE_TEMPLATE, theme);
    expect(out).toContain('h1 { color: var(--brand-primary); }');
  });

  it('mergeBrandOverride replaces brand colors only, keeps typography', () => {
    const base = getTheme('anthropic');
    const merged = mergeBrandOverride(base, { primary: '#CC0000', accent: '#00AA00' });
    expect(merged.brandPrimary).toBe('#CC0000');
    expect(merged.brandAccent).toBe('#00AA00');
    // Fonts and neutrals should be preserved from anthropic
    expect(merged.fontMain).toBe(base.fontMain);
    expect(merged.fxGray).toBe(base.fxGray);
  });

  it('mergeBrandOverride is a noop for undefined override', () => {
    const base = getTheme('institutional');
    const merged = mergeBrandOverride(base, undefined);
    expect(merged).toEqual(base);
  });
});
