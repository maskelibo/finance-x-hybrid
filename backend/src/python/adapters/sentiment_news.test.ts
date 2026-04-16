import { describe, expect, it } from 'vitest';

import {
  adaptPythonNewsForLegacy,
  type PythonNewsAnalysisOutput,
} from './sentiment_news.js';


describe('adaptPythonNewsForLegacy', () => {
  it('surfaces news_count and raw items', () => {
    const py: PythonNewsAnalysisOutput = {
      items: [
        { title: 'A', link: '/a', published_at: '2026-04-10T00:00:00Z' },
        { title: 'B', link: '/b', published_at: '2026-04-11T00:00:00Z' },
      ],
    };
    const legacy = adaptPythonNewsForLegacy(py, 'KCHOL', 'news-1');
    expect(legacy.news_count).toBe(2);
    expect(legacy.news_items.length).toBe(2);
  });

  it('flags crowded_long when 5+ items and zero negative', () => {
    const items = Array.from({ length: 6 }).map((_, i) => ({
      title: `H${i}`, link: `/${i}`, published_at: '2026-04-10T00:00:00Z',
    }));
    const py: PythonNewsAnalysisOutput = {
      items,
      sentiment_distribution: { positive: 5, neutral: 1, negative: 0 },
    };
    const legacy = adaptPythonNewsForLegacy(py, 'T', 'n1');
    expect(legacy.crowded_long_flag).toBe(true);
    expect(legacy.warnings.some(w => w.includes('Crowded long'))).toBe(true);
  });

  it('no crowded flag with any negative', () => {
    const py: PythonNewsAnalysisOutput = {
      items: Array.from({ length: 6 }).map(() => ({
        title: 'x', link: '/', published_at: '2026-04-10T00:00:00Z',
      })),
      sentiment_distribution: { positive: 4, negative: 2 },
    };
    const legacy = adaptPythonNewsForLegacy(py, 'T', 'n1');
    expect(legacy.crowded_long_flag).toBe(false);
  });

  it('warns on empty news list', () => {
    const legacy = adaptPythonNewsForLegacy({ items: [] }, 'T', 'n1');
    expect(legacy.warnings.some(w => w.includes('No news'))).toBe(true);
  });

  it('passes overall_sentiment_score through', () => {
    const legacy = adaptPythonNewsForLegacy({
      items: [], overall_sentiment_score: '-2.5',
    }, 'T', 'n1');
    expect(legacy.overall_sentiment_score).toBe('-2.5');
  });

  it('carries window dates', () => {
    const legacy = adaptPythonNewsForLegacy({
      items: [], window_start: '2026-04-01', window_end: '2026-04-16',
    }, 'T', 'n1');
    expect(legacy.window.start).toBe('2026-04-01');
    expect(legacy.window.end).toBe('2026-04-16');
  });
});
