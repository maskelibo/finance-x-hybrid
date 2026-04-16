export interface PythonNewsItem {
  title: string;
  link: string;
  published_at: string;
  source?: string | null;
  summary?: string | null;
  theme?: string | null;
  sentiment_hint?: string | null;
  abnormal_return_1d?: string | null;
  abnormal_return_3d?: string | null;
  abnormal_return_5d?: string | null;
}

export interface PythonNewsAnalysisOutput {
  ticker?: string;
  window_start?: string;
  window_end?: string;
  items?: PythonNewsItem[];
  theme_distribution?: Record<string, number>;
  sentiment_distribution?: Record<string, number>;
  overall_sentiment_score?: string | null;
}

export interface LegacySentimentNewsOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  window: { start: string | null; end: string | null };
  news_items: PythonNewsItem[];
  news_count: number;
  theme_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  overall_sentiment_score: string | null;
  crowded_long_flag: boolean;
  warnings: string[];
  review_status: string;
}

export function adaptPythonNewsForLegacy(
  py: PythonNewsAnalysisOutput,
  ticker: string,
  outputId: string,
): LegacySentimentNewsOutput {
  const items = py.items ?? [];
  const sentiment = py.sentiment_distribution ?? {};
  const negCount = sentiment['negative'] ?? 0;
  const posCount = sentiment['positive'] ?? 0;
  const crowdedLong = items.length >= 5 && negCount === 0 && posCount >= 3;

  const warnings: string[] = [];
  if (items.length === 0) warnings.push('No news items returned — Google News RSS may be empty for this ticker');
  if (crowdedLong) warnings.push('Crowded long — zero negative headlines in a 5+ item sample');

  return {
    agent_id: 'sentiment_news_agent',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    window: { start: py.window_start ?? null, end: py.window_end ?? null },
    news_items: items,
    news_count: items.length,
    theme_distribution: py.theme_distribution ?? {},
    sentiment_distribution: sentiment,
    overall_sentiment_score: py.overall_sentiment_score ?? null,
    crowded_long_flag: crowdedLong,
    warnings,
    review_status: 'pending_ceo_review',
  };
}
