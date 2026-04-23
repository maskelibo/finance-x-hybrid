/**
 * Deep research shared types — used across scope / execute / synthesize
 * and by backend/src/python/adapters when bridging to external_research
 * agent output.
 */

export interface WebSource {
  url: string;
  title: string;
  publisher?: string;
  publication_date?: string; // ISO-ish
  snippet?: string;
}

export interface WebSearchResult {
  query: string;
  sources: WebSource[];
  fetched_at: string;
  provider: string; // "web-fetch" | "web-search" | "mock" | etc.
}

export type WebSearchFn = (query: string) => Promise<WebSearchResult>;

export interface ScopedQuery {
  query: string;
  rationale: string;
  publisher_hints: string[]; // preferred publishers to prioritize
  priority: 'high' | 'medium' | 'low';
}

export interface ScopedResearchPlan {
  ticker: string;
  sector_context?: string;
  queries: ScopedQuery[];
}

export type Credibility = 'high' | 'medium' | 'low';

export interface RankedSource extends WebSource {
  credibility: Credibility;
  credibility_reason: string;
}

export interface SynthesizedFinding {
  query: string;
  scoped_rationale: string;
  sources: RankedSource[];
  synthesized_answer: string;
  confidence: Credibility;
}

export interface DeepResearchResult {
  ticker: string;
  scope_queries: string[];
  findings: SynthesizedFinding[];
  aggregate_metrics: {
    queries_total: number;
    sources_total: number;
    sources_high_credibility: number;
    sources_unique_publishers: number;
  };
  status: 'active' | 'partial' | 'failed';
  warnings: string[];
  confidence_overall: Credibility;
}
