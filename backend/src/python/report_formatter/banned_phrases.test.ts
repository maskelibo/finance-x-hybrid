import { describe, it, expect } from 'vitest';
import {
  BANNED_PHRASES,
  compileBannedPattern,
  escapeRegex,
} from './banned_phrases.js';

describe('banned_phrases registry', () => {
  it('has entries in all 5 categories', () => {
    const cats = new Set(BANNED_PHRASES.map(b => b.category));
    expect(cats.has('pipeline_marker')).toBe(true);
    expect(cats.has('module_name')).toBe(true);
    expect(cats.has('ml_internal')).toBe(true);
    expect(cats.has('pipeline_state')).toBe(true);
    expect(cats.has('severity_tag')).toBe(true);
  });

  it('compiles every entry to a valid global RegExp', () => {
    for (const b of BANNED_PHRASES) {
      const re = compileBannedPattern(b);
      expect(re).toBeInstanceOf(RegExp);
      expect(re.flags.includes('g')).toBe(true);
    }
  });

  it('matches required strict-ban tokens exactly', () => {
    const tokens = [
      'DATA_GAP', 'fallback', 'türetilmiş', 'src: hesaplama', 'plug', 'residual',
      'P3.alpha', 'contradiction_hunter', 'chairman_anticipator', 'boardroom_intelligence',
      'WebSearch ile alınmalı', 'agent_runs', 'session_id',
    ];
    for (const tok of tokens) {
      const matched = BANNED_PHRASES.some(b => {
        const re = compileBannedPattern(b);
        return re.test(tok);
      });
      expect({ tok, matched }).toEqual({ tok, matched: true });
    }
  });

  it('does NOT match benign business words', () => {
    // "agent" alone is in the list but as a strict word — verify it does not
    // accidentally hit in our intended whitelist contexts.
    // (Our v1 filter intentionally replaces "agent" → "modül" so we DO expect
    // a hit; this test instead verifies that a false-positive trigger like
    // "Engineering" does not match the \\bengine\\b pattern.)
    const enginePat = BANNED_PHRASES.find(b => b.pattern === '\\bengine\\b');
    expect(enginePat).toBeDefined();
    const re = compileBannedPattern(enginePat!);
    expect('Engineering'.match(re)).toBeNull(); // word boundary respected
    expect('reverse-engineering'.match(re)).toBeNull();
    expect('engine'.match(re)).not.toBeNull();
  });

  it('escapeRegex escapes regex metacharacters', () => {
    expect(escapeRegex('1.0+x')).toBe('1\\.0\\+x');
    expect(escapeRegex('a*b?c')).toBe('a\\*b\\?c');
    expect(escapeRegex('[brackets]')).toBe('\\[brackets\\]');
  });

  it('module name regex catches all P-block aliases', () => {
    const moduleRe = compileBannedPattern(BANNED_PHRASES.find(b => b.pattern.includes('alpha|beta'))!);
    expect('P1.alpha'.match(moduleRe)).not.toBeNull();
    expect('P2.beta'.match(moduleRe)).not.toBeNull();
    expect('P3.gamma'.match(moduleRe)).not.toBeNull();
    expect('P4.beta.1'.match(moduleRe)).not.toBeNull();
    expect('P10.delta'.match(moduleRe)).not.toBeNull();
  });
});
