/**
 * Small deterministic template engine — no dependencies.
 *
 * Replaces `{{key}}` placeholders with string values from a context
 * map. Supports simple nested lookup (`{{company.ticker}}`) and a
 * tiny conditional block syntax:
 *
 *   {{#if dcf}}...{{/if}}
 *   {{#each benchmarks}}...{{this.metric}}...{{/each}}
 *
 * That's it — Handlebars/Mustache are overkill for our use case and
 * the HTML rapor template has only ~25 placeholders + 4 conditional
 * blocks + 2 loops. We keep the engine small enough to audit.
 */

export type TemplateValue = string | number | boolean | null | undefined | TemplateContext | TemplateValue[];
export type TemplateContext = { [key: string]: TemplateValue };


function resolvePath(ctx: TemplateContext, path: string): TemplateValue {
  const parts = path.split('.');
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as TemplateValue;
}


function truthy(v: TemplateValue): boolean {
  if (v == null || v === false || v === '' || v === 0) return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}


function stringify(v: TemplateValue): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  // Objects/arrays get JSON'd so callers see the raw shape in the
  // output instead of "[object Object]" — helpful for debugging.
  return JSON.stringify(v);
}


/**
 * Render a template string against a context map.
 *
 * Supported syntax:
 *   {{key}}                  value lookup (HTML-escapes by default)
 *   {{&key}}                 raw value (skip escape) — for pre-rendered HTML
 *   {{#if key}}...{{/if}}    render block when key is truthy
 *   {{#each key}}...{{/each}} render block per array entry; inside
 *                             the block, `{{this}}` or `{{this.x}}`
 *                             refers to the current item
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return renderBlock(template, ctx);
}


function renderBlock(template: string, ctx: TemplateContext): string {
  // 1. Resolve {{#each key}}...{{/each}} loops first (outermost left-to-right).
  let out = template.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, path, body) => {
    const arr = resolvePath(ctx, path);
    if (!Array.isArray(arr)) return '';
    return arr.map(item => {
      const subCtx: TemplateContext = { ...ctx, this: item };
      return renderBlock(body, subCtx);
    }).join('');
  });

  // 2. Conditional blocks.
  out = out.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, path, body) => {
    return truthy(resolvePath(ctx, path)) ? renderBlock(body, ctx) : '';
  });

  // 3. Raw (unescaped) placeholders: {{&key}}
  out = out.replace(/\{\{&\s*([\w.]+)\s*\}\}/g, (_, path) => stringify(resolvePath(ctx, path)));

  // 4. Escaped placeholders: {{key}}
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    return escapeHtml(stringify(resolvePath(ctx, path)));
  });

  return out;
}


const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}


// ---------- Common formatters ----------

/** Turkish thousands separator with optional decimals. */
export function formatTRY(n: number | string | null | undefined, decimals = 0): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Percentage with 1 dp, or em-dash if null. */
export function formatPct(n: number | string | null | undefined, decimals = 1): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return '—';
  return `%${num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Ratio with fixed decimals (e.g. 2.1x for leverage). */
export function formatRatio(n: number | string | null | undefined, decimals = 1): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return '—';
  return `${num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}x`;
}
