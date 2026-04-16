import { describe, expect, it } from 'vitest';

import { formatPct, formatRatio, formatTRY, renderTemplate } from './template_engine.js';


describe('renderTemplate — primitives', () => {
  it('replaces simple {{key}} placeholders', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'EREGL' })).toBe('Hello EREGL!');
  });

  it('resolves nested paths with dot notation', () => {
    expect(renderTemplate('{{company.ticker}}', { company: { ticker: 'KCHOL' } })).toBe('KCHOL');
  });

  it('HTML-escapes by default', () => {
    expect(renderTemplate('{{x}}', { x: '<script>alert(1)</script>' }))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('skips escape with {{&key}} for pre-rendered HTML', () => {
    expect(renderTemplate('{{&x}}', { x: '<b>bold</b>' })).toBe('<b>bold</b>');
  });

  it('returns empty string for null/undefined', () => {
    expect(renderTemplate('[{{x}}]', {})).toBe('[]');
    expect(renderTemplate('[{{x}}]', { x: null })).toBe('[]');
  });
});


describe('renderTemplate — conditionals', () => {
  it('renders {{#if}} block when truthy', () => {
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: 1 })).toBe('yes');
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: 'v' })).toBe('yes');
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: true })).toBe('yes');
  });

  it('skips {{#if}} block when falsy', () => {
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: false })).toBe('');
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: 0 })).toBe('');
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: '' })).toBe('');
    expect(renderTemplate('{{#if x}}yes{{/if}}', { x: [] })).toBe('');
    expect(renderTemplate('{{#if x}}yes{{/if}}', {})).toBe('');
  });
});


describe('renderTemplate — loops', () => {
  it('{{#each}} renders array elements with {{this}}', () => {
    expect(renderTemplate('{{#each xs}}[{{this}}]{{/each}}', { xs: ['a', 'b', 'c'] }))
      .toBe('[a][b][c]');
  });

  it('{{#each}} supports {{this.field}} object access', () => {
    const out = renderTemplate(
      '{{#each xs}}<li>{{this.name}}={{this.v}}</li>{{/each}}',
      { xs: [{ name: 'a', v: 1 }, { name: 'b', v: 2 }] },
    );
    expect(out).toBe('<li>a=1</li><li>b=2</li>');
  });

  it('empty array produces empty output', () => {
    expect(renderTemplate('a{{#each xs}}x{{/each}}b', { xs: [] })).toBe('ab');
  });
});


describe('formatters', () => {
  it('formatTRY uses tr-TR thousands separator', () => {
    // Turkish locale uses "." as thousands separator
    const result = formatTRY(1_234_567);
    expect(result).toMatch(/1\.234\.567/);
  });

  it('formatTRY returns em-dash for null/undefined/non-numeric', () => {
    expect(formatTRY(null)).toBe('—');
    expect(formatTRY(undefined)).toBe('—');
    expect(formatTRY('n/a')).toBe('—');
    expect(formatTRY('')).toBe('—');
  });

  it('formatPct prefixes with %', () => {
    expect(formatPct(12.5)).toMatch(/^%/);
  });

  it('formatRatio suffixes with x', () => {
    expect(formatRatio(2.1)).toMatch(/x$/);
  });
});
