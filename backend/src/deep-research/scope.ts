/**
 * Scope phase — convert research_brief external_research_scope entries
 * into web queries with publisher hints and priority.
 *
 * Deterministic, no LLM. research_brief already did the topic selection;
 * this function adds retrieval-friendly augmentation.
 */
import type { ScopedQuery, ScopedResearchPlan } from './types.js';

export interface ResearchBriefLike {
  ticker: string;
  sector_context?: string;
  external_research_scope?: string[];
  priority_topics?: Array<{
    topic: string;
    rationale?: string;
    evidence_need?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

// Sector → preferred publisher hints (credibility ranking uses same list).
const SECTOR_PUBLISHERS: Record<string, string[]> = {
  steel_manufacturing: ['European Commission', 'IEA', 'worldsteel', 'SPK', 'IEA', 'IMF'],
  refinery: ['IEA', 'OPEC', 'EPDK', 'BOTAS', 'European Commission'],
  banking: ['BDDK', 'TCMB', 'BIS', 'European Banking Authority'],
  telecom: ['BTK', 'ITU', 'GSMA'],
  aviation: ['IATA', 'ICAO', 'SHGM', 'European Commission'],
  holding: ['SPK', 'TOBB', 'KAP'],
  retail: ['TUIK', 'Retail Council', 'BKM'],
  defense: ['SSB', 'SIPRI', 'European Commission'],
};

const GENERIC_PUBLISHERS = ['KAP', 'SPK', 'TCMB', 'TUIK', 'BDDK', 'Reuters', 'Bloomberg'];

function inferHintsForQuery(query: string, sector?: string): string[] {
  const lower = query.toLowerCase();
  const hints = new Set<string>();

  // Topic-specific hints
  if (/cbam|carbon border|karbon/.test(lower)) hints.add('European Commission');
  if (/ifrs|ias\s?29|tms\s?29|inflation accounting/.test(lower)) {
    hints.add('IASB');
    hints.add('KGK');
    hints.add('SPK');
  }
  if (/sustainab|esg|sfdr/.test(lower)) hints.add('TSRS');
  if (/tl\/usd|kur|foreign exchange|monetary polic/.test(lower)) hints.add('TCMB');
  if (/energy|enerji|petrol|brent|crude/.test(lower)) hints.add('IEA');
  if (/interest rate|policy rate|faiz/.test(lower)) hints.add('TCMB');
  if (/electricity|elektrik|tariff|tarife|industrial users/.test(lower)) hints.add('EPDK');
  if (/gas|doğal gaz|natural gas|botas/.test(lower)) hints.add('BOTAS');
  if (/steel|çelik|hrc|iron ore/.test(lower)) hints.add('worldsteel');

  if (sector && SECTOR_PUBLISHERS[sector]) {
    SECTOR_PUBLISHERS[sector].forEach(p => hints.add(p));
  }

  // Fallback generics
  GENERIC_PUBLISHERS.forEach(p => hints.add(p));

  return Array.from(hints).slice(0, 8);
}

// Small glossary so underscore-separated topic codes map to likely query words.
// Keep deterministic — no LLM lookup. Add entries as new sectors surface.
const TOPIC_KEYWORDS: Record<string, string[]> = {
  profitability: ['margin', 'ebitda', 'net income', 'kar', 'marj', 'profit'],
  profitability_trend: ['margin', 'ebitda', 'net income', 'kar', 'marj'],
  leverage: ['debt', 'borç', 'leverage', 'net debt'],
  carbon: ['cbam', 'carbon', 'karbon', 'emission', 'emisyon', 'co2'],
  carbon_regulation: ['cbam', 'carbon', 'karbon', 'emission', 'ets'],
  energy_cost: ['electricity', 'elektrik', 'energy', 'enerji', 'tariff', 'tarife', 'gas'],
  capex: ['capex', 'capital expenditure', 'yatırım', 'investment'],
  sector_dynamics: ['sector', 'industry', 'market share'],
  fx_risk: ['fx', 'tl/usd', 'eurtry', 'exchange rate', 'kur'],
  regulation: ['regulation', 'regulat', 'yönetmelik', 'mevzuat'],
};

function topicMatchesQuery(topic: string, queryLower: string): boolean {
  const normalized = topic.toLowerCase();
  // Direct overlap check on any keyword in topic name
  const tokens = normalized.split(/[_\s]+/).filter(t => t.length >= 3);
  for (const tok of tokens) {
    if (queryLower.includes(tok)) return true;
  }
  // Glossary expansion — full topic code, then individual tokens
  const expansions = TOPIC_KEYWORDS[normalized] ?? [];
  for (const kw of expansions) {
    if (queryLower.includes(kw.toLowerCase())) return true;
  }
  for (const tok of tokens) {
    const tokenExpansions = TOPIC_KEYWORDS[tok] ?? [];
    for (const kw of tokenExpansions) {
      if (queryLower.includes(kw.toLowerCase())) return true;
    }
  }
  return false;
}

function inferPriority(
  query: string,
  priorityTopics: ResearchBriefLike['priority_topics'] = [],
): 'high' | 'medium' | 'low' {
  const lower = query.toLowerCase();
  for (const pt of priorityTopics || []) {
    if (!pt.topic) continue;
    if (topicMatchesQuery(pt.topic, lower)) {
      return pt.priority ?? 'medium';
    }
  }
  return 'medium';
}

export function buildScope(rb: ResearchBriefLike): ScopedResearchPlan {
  const rawQueries = rb.external_research_scope ?? [];
  const queries: ScopedQuery[] = rawQueries.map(raw => {
    const trimmed = raw.trim();
    const priority = inferPriority(trimmed, rb.priority_topics);
    const publisherHints = inferHintsForQuery(trimmed, rb.sector_context);
    // Rationale: find matching priority topic for context
    const queryLower = trimmed.toLowerCase();
    const matchedTopic = (rb.priority_topics || []).find(pt =>
      pt.topic ? topicMatchesQuery(pt.topic, queryLower) : false,
    );
    const rationale =
      matchedTopic?.rationale ??
      `External evidence needed for ticker ${rb.ticker} (no explicit topic match).`;

    return {
      query: trimmed,
      rationale,
      publisher_hints: publisherHints,
      priority,
    };
  });

  // Sort: high → medium → low (stable within priority)
  const rank = { high: 0, medium: 1, low: 2 } as const;
  queries.sort((a, b) => rank[a.priority] - rank[b.priority]);

  return {
    ticker: rb.ticker,
    sector_context: rb.sector_context,
    queries,
  };
}
