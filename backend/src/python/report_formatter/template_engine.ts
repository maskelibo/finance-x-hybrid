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


/** Find the matching close tag for a block opener at position `openEnd`.
 *  Handles nesting: {{#each xs}} {{#if a}} ... {{/if}} {{/each}} resolves
 *  the outer /each against the correct position, not the first close.
 *  Returns [contentStart, contentEnd, fullCloseEnd]. */
function findMatchingClose(
  template: string,
  searchFrom: number,
  closeTag: string,
  openPattern: RegExp,
): [number, number, number] | null {
  let depth = 1;
  let pos = searchFrom;
  const closeRe = new RegExp(`\\{\\{\\/${closeTag}\\}\\}`, 'g');
  while (depth > 0 && pos < template.length) {
    openPattern.lastIndex = pos;
    closeRe.lastIndex = pos;
    const nextOpen = openPattern.exec(template);
    const nextClose = closeRe.exec(template);
    if (!nextClose) return null;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      pos = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      if (depth === 0) {
        return [searchFrom, nextClose.index, nextClose.index + nextClose[0].length];
      }
      pos = nextClose.index + nextClose[0].length;
    }
  }
  return null;
}


function renderBlock(template: string, ctx: TemplateContext): string {
  // Single-pass scanner that handles nested {{#each}}/{{#if}} blocks
  // via depth tracking. Leaves simple {{placeholder}} for a final
  // regex pass after blocks are resolved.
  let result = '';
  let i = 0;
  const openRe = /\{\{#(each|if)\s+([\w.]+)\}\}/g;

  while (i < template.length) {
    openRe.lastIndex = i;
    const m = openRe.exec(template);
    if (!m) {
      result += template.slice(i);
      break;
    }

    // Append anything before the opener untouched.
    result += template.slice(i, m.index);

    const tag = m[1];
    const path = m[2];
    const contentStart = m.index + m[0].length;

    // Find matching close with the same tag type.
    const sameTypeOpen = new RegExp(`\\{\\{#${tag}\\s+[\\w.]+\\}\\}`, 'g');
    const match = findMatchingClose(template, contentStart, tag, sameTypeOpen);
    if (!match) {
      // Malformed template — emit the opener verbatim and move on.
      result += m[0];
      i = contentStart;
      continue;
    }
    const [, bodyEnd, blockEnd] = match;
    const body = template.slice(contentStart, bodyEnd);

    if (tag === 'each') {
      const arr = resolvePath(ctx, path);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          result += renderBlock(body, { ...ctx, this: item });
        }
      }
    } else {
      // if
      if (truthy(resolvePath(ctx, path))) {
        result += renderBlock(body, ctx);
      }
    }

    i = blockEnd;
  }

  // Now resolve simple placeholders (no more blocks at this level).
  // Raw (unescaped) first — {{&key}}.
  result = result.replace(/\{\{&\s*([\w.]+)\s*\}\}/g, (_, path) => stringify(resolvePath(ctx, path)));
  // Escaped — {{key}}.
  result = result.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => escapeHtml(stringify(resolvePath(ctx, path))));

  return result;
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

/** Single-source placeholder for missing numeric data.
 *  Instead of "—" (which user flagged as "veri yok"), we show a
 *  more descriptive label — "Raporlanmadı" — which signals the data
 *  wasn't in the filing but doesn't look like an error. */
const MISSING_NUMERIC = 'Raporlanmadı';

/** Turkish thousands separator with optional decimals. */
export function formatTRY(n: number | string | null | undefined, decimals = 0): string {
  if (n == null || n === '') return MISSING_NUMERIC;
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return MISSING_NUMERIC;
  return num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Percentage with 1 dp, or "Raporlanmadı" if null. */
export function formatPct(n: number | string | null | undefined, decimals = 1): string {
  if (n == null || n === '') return MISSING_NUMERIC;
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return MISSING_NUMERIC;
  return `%${num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Ratio with fixed decimals (e.g. 2.1x for leverage). */
export function formatRatio(n: number | string | null | undefined, decimals = 1): string {
  if (n == null || n === '') return MISSING_NUMERIC;
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''));
  if (!Number.isFinite(num)) return MISSING_NUMERIC;
  return `${num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}x`;
}
