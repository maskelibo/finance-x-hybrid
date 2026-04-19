/**
 * Theme presets for the report template.
 *
 * The canonical template (`template.html`) ships with the `institutional`
 * theme baked into its `:root { ... }` block. `applyTheme()` swaps that
 * block at render time — so three users can request the same report in
 * three different visual languages without forking the template.
 *
 * Adding a new theme:
 *   1. Add a preset below with the full variable set (copy `institutional`
 *      and adjust).
 *   2. Expose it to the API by adding its name to the `ThemeName` union
 *      — no template changes needed.
 *
 * Brand-identity override: if `context_extraction.brand_identity` is
 * present, its primary/accent colors override the preset's primary/accent
 * — preserving the theme's typography and neutrals but letting the
 * company's own brand come through on the cover + headers.
 */

export type ThemeName = 'institutional' | 'anthropic' | 'minimal';

export const DEFAULT_THEME: ThemeName = 'institutional';


export interface Theme {
  name: ThemeName;
  // Primary palette — used for cover, h1, table headers, brand-mark
  brandPrimary: string;
  brandPrimaryDark: string;
  brandPrimaryLight: string;
  brandAccent: string;
  brandAccentLight: string;
  // Neutrals
  fxDark: string;
  fxGray: string;
  fxLightGray: string;
  fxBorder: string;
  fxBorderDark: string;
  // Signal colors
  fxSuccess: string;
  fxSuccessLight: string;
  fxWarning: string;
  fxWarningLight: string;
  fxDanger: string;
  fxDangerLight: string;
  // Surface
  fxWhite: string;
  // Typography
  fontMain: string;
  fontMono: string;
  // Optional cover-specific gradient (defaults to brand-primary → brand-primary-dark)
  coverGradient?: string;
}


const INSTITUTIONAL: Theme = {
  name: 'institutional',
  brandPrimary: '#1a365d',
  brandPrimaryDark: '#0f2440',
  brandPrimaryLight: '#3182ce',
  brandAccent: '#c6973f',
  brandAccentLight: '#e0b85c',
  fxDark: '#1a202c',
  fxGray: '#718096',
  fxLightGray: '#f7fafc',
  fxBorder: '#e2e8f0',
  fxBorderDark: '#cbd5e0',
  fxSuccess: '#276749',
  fxSuccessLight: '#c6f6d5',
  fxWarning: '#c05621',
  fxWarningLight: '#feebc8',
  fxDanger: '#9b2c2c',
  fxDangerLight: '#fed7d7',
  fxWhite: '#ffffff',
  fontMain: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif",
  fontMono: "'SF Mono', 'Fira Code', ui-monospace, 'Consolas', monospace",
};


const ANTHROPIC: Theme = {
  name: 'anthropic',
  // Warm neutrals + amber accent — inspired by Claude.ai's visual language.
  // The cover uses the near-black (#191918) with an amber eyebrow, matching
  // the Anthropic design demo in the repo root.
  brandPrimary: '#191918',
  brandPrimaryDark: '#1A1A19',
  brandPrimaryLight: '#5D5C56',
  brandAccent: '#D97706',
  brandAccentLight: '#E0B85C',
  fxDark: '#1A1A19',
  fxGray: '#8B8A84',
  fxLightGray: '#F5F4EF',
  fxBorder: '#E0DFD8',
  fxBorderDark: '#ECEAE3',
  fxSuccess: '#059669',
  fxSuccessLight: '#D1FAE5',
  fxWarning: '#D97706',
  fxWarningLight: '#FEF3C7',
  fxDanger: '#DC2626',
  fxDangerLight: '#FEE2E2',
  fxWhite: '#FAFAF8',
  fontMain: "'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
  fontMono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
  coverGradient: 'linear-gradient(155deg, #191918 0%, #1A1A19 60%, #2A2620 100%)',
};


const MINIMAL: Theme = {
  name: 'minimal',
  // Clean black/gray. Accent is a muted blue — deliberately understated
  // for clients who want Finance X content without Finance X's navy/gold
  // signature.
  brandPrimary: '#111827',
  brandPrimaryDark: '#000000',
  brandPrimaryLight: '#4B5563',
  brandAccent: '#2563EB',
  brandAccentLight: '#93C5FD',
  fxDark: '#111827',
  fxGray: '#6B7280',
  fxLightGray: '#F9FAFB',
  fxBorder: '#E5E7EB',
  fxBorderDark: '#D1D5DB',
  fxSuccess: '#047857',
  fxSuccessLight: '#D1FAE5',
  fxWarning: '#B45309',
  fxWarningLight: '#FEF3C7',
  fxDanger: '#B91C1C',
  fxDangerLight: '#FEE2E2',
  fxWhite: '#FFFFFF',
  fontMain: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif",
  fontMono: "ui-monospace, 'SF Mono', 'Consolas', monospace",
};


const THEMES: Record<ThemeName, Theme> = {
  institutional: INSTITUTIONAL,
  anthropic: ANTHROPIC,
  minimal: MINIMAL,
};


export function getTheme(name?: string): Theme {
  if (!name) return THEMES[DEFAULT_THEME];
  const key = name.toLowerCase() as ThemeName;
  return THEMES[key] ?? THEMES[DEFAULT_THEME];
}


export interface BrandOverride {
  primary?: string;
  primaryDark?: string;
  primaryLight?: string;
  accent?: string;
  accentLight?: string;
}


/** Merge a context_extraction brand_identity override onto a theme.
 *  The brand colors replace brandPrimary/Accent only — typography, neutrals,
 *  and signal colors stay consistent with the chosen theme. */
export function mergeBrandOverride(theme: Theme, brand?: BrandOverride): Theme {
  if (!brand) return theme;
  return {
    ...theme,
    brandPrimary: brand.primary ?? theme.brandPrimary,
    brandPrimaryDark: brand.primaryDark ?? theme.brandPrimaryDark,
    brandPrimaryLight: brand.primaryLight ?? theme.brandPrimaryLight,
    brandAccent: brand.accent ?? theme.brandAccent,
    brandAccentLight: brand.accentLight ?? theme.brandAccentLight,
  };
}


/** Render a theme as the `:root { ... }` CSS block. */
function themeToRootBlock(theme: Theme): string {
  return `:root {
      /* Theme: ${theme.name} — applied by applyTheme() at render time */
      --brand-primary: ${theme.brandPrimary};
      --brand-primary-dark: ${theme.brandPrimaryDark};
      --brand-primary-light: ${theme.brandPrimaryLight};
      --brand-accent: ${theme.brandAccent};
      --brand-accent-light: ${theme.brandAccentLight};
      --fx-dark: ${theme.fxDark};
      --fx-gray: ${theme.fxGray};
      --fx-light-gray: ${theme.fxLightGray};
      --fx-border: ${theme.fxBorder};
      --fx-border-dark: ${theme.fxBorderDark};
      --fx-success: ${theme.fxSuccess};
      --fx-success-light: ${theme.fxSuccessLight};
      --fx-warning: ${theme.fxWarning};
      --fx-warning-light: ${theme.fxWarningLight};
      --fx-danger: ${theme.fxDanger};
      --fx-danger-light: ${theme.fxDangerLight};
      --fx-white: ${theme.fxWhite};
      --font-main: ${theme.fontMain};
      --font-mono: ${theme.fontMono};
    }`;
}


/** Replace the `:root { ... }` block in the template with the theme's block.
 *  Also swaps the cover gradient if the theme overrides it.
 *
 *  Returns the modified template. Idempotent — safe to call more than once. */
export function applyTheme(template: string, theme: Theme): string {
  // Match the first `:root { ... }` block. The template only has one at the
  // top of its <style>, so a non-greedy match is safe.
  const rootRe = /:root\s*\{[\s\S]*?\}/;
  let out = template.replace(rootRe, themeToRootBlock(theme));

  if (theme.coverGradient) {
    // Swap the hard-coded cover gradient. The template puts it in a single
    // `background:` declaration on `.cover-page` — we target that specifically.
    const coverGradientRe = /(\.cover-page\s*\{[^}]*background:\s*)linear-gradient\([^)]+\)/;
    out = out.replace(coverGradientRe, `$1${theme.coverGradient}`);
  }

  return out;
}
