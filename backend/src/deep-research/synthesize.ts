/**
 * Synthesize phase — deduplicate sources, rank credibility, aggregate
 * the executed web results into a final DeepResearchResult.
 *
 * Credibility ladder (highest → lowest):
 *   high   — official regulators/standard-setters + major intergovernmental
 *   medium — industry bodies, established research houses, major financial press
 *   low    — everything else (personal blogs, aggregators, unknown domains)
 *
 * No LLM here — the rules are deterministic so downstream agents
 * (strategic_synthesis, valuation_agent, esg_agent) consume stable signals.
 */
import type {
  Credibility,
  DeepResearchResult,
  RankedSource,
  ScopedQuery,
  SynthesizedFinding,
  WebSearchResult,
  WebSource,
} from './types.js';

// Keep strings casefold-lowercase for matching; hit on full token OR substring.
const HIGH_CREDIBILITY_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\beurope(an)?.?commission\b/i, reason: 'EU Commission — primary regulator' },
  { pattern: /\beu\b.{0,10}\b(regulat|directive|commission)\b/i, reason: 'EU regulatory body' },
  { pattern: /\b(ecb|european central bank)\b/i, reason: 'ECB — monetary authority' },
  { pattern: /\bbis\b|\bbank for international settlements\b/i, reason: 'BIS — central-bank standard-setter' },
  { pattern: /\b(tcmb|cbrt|central bank of (the )?republic of turkey)\b/i, reason: 'TCMB — Turkish central bank' },
  { pattern: /\b(bddk|bank regulation and supervision agency)\b/i, reason: 'BDDK — Turkish banking regulator' },
  { pattern: /\b(spk|capital markets board)\b/i, reason: 'SPK — Turkish capital markets regulator' },
  { pattern: /\bepdk\b|\benergy market regulat/i, reason: 'EPDK — Turkish energy regulator' },
  { pattern: /\bbtk\b|\binformation.technologies.authority\b/i, reason: 'BTK — Turkish telecom regulator' },
  { pattern: /\btuik\b|\bturkstat\b/i, reason: 'TUIK — national statistics office' },
  { pattern: /\b(ifrs|iasb|international accounting standards board)\b/i, reason: 'IASB — accounting standard-setter' },
  { pattern: /\b(kgk|public oversight.*auditing)\b/i, reason: 'KGK — Turkish audit oversight' },
  { pattern: /\bimf\b|\binternational monetary fund\b/i, reason: 'IMF' },
  { pattern: /\biea\b|\binternational energy agency\b/i, reason: 'IEA' },
  { pattern: /\bopec\b/i, reason: 'OPEC' },
  { pattern: /\bkap\b|\bpublic disclosure platform\b/i, reason: 'KAP — Turkish mandatory disclosure platform' },
  { pattern: /\bworldsteel\b/i, reason: 'worldsteel — global industry body' },
  { pattern: /\biata\b|\bicao\b/i, reason: 'IATA/ICAO — aviation authorities' },
];

const MEDIUM_CREDIBILITY_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(reuters|bloomberg|financial times|ft\.com)\b/i, reason: 'major financial press' },
  { pattern: /\b(wall street journal|wsj)\b/i, reason: 'major financial press' },
  { pattern: /\b(dunya|anadolu agency|aa\.com\.tr|bloomberg\s*ht)\b/i, reason: 'major Turkish news' },
  { pattern: /\b(mckinsey|pwc|deloitte|kpmg|ey\.com|ernst.*young|pricewaterhouse)\b/i, reason: 'major research/advisory' },
  { pattern: /\b(s&p global|moody'?s|fitch(ratings)?)\b/i, reason: 'major credit rating' },
  { pattern: /\b(gartner|idc|forrester)\b/i, reason: 'major research house' },
  { pattern: /\btsrs\b|\bturkish sustainability reporting/i, reason: 'TSRS — Turkish sustainability standards' },
  { pattern: /\b(gsma|itu)\b/i, reason: 'telecom industry body' },
  { pattern: /\b(ssb|sipri)\b/i, reason: 'defense industry body' },
  { pattern: /\btobb\b|\bturkiye odalar/i, reason: 'TOBB — chambers of commerce' },
];

function rankSourceCredibility(src: WebSource): { credibility: Credibility; reason: string } {
  const blob = `${src.publisher ?? ''} ${src.url} ${src.title}`.trim();
  for (const { pattern, reason } of HIGH_CREDIBILITY_PATTERNS) {
    if (pattern.test(blob)) return { credibility: 'high', reason };
  }
  for (const { pattern, reason } of MEDIUM_CREDIBILITY_PATTERNS) {
    if (pattern.test(blob)) return { credibility: 'medium', reason };
  }
  return { credibility: 'low', reason: 'unmatched publisher — verify manually before citing' };
}

function dedupeByUrl(sources: WebSource[]): WebSource[] {
  const seen = new Set<string>();
  const out: WebSource[] = [];
  for (const s of sources) {
    // Normalize: strip trailing slash + hash + most query
    const key = (s.url || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function synthesizeAnswer(sources: RankedSource[], query: string): string {
  const high = sources.filter(s => s.credibility === 'high');
  const med = sources.filter(s => s.credibility === 'medium');
  const leadSnippets = [...high, ...med]
    .slice(0, 3)
    .map(s => s.snippet)
    .filter((x): x is string => Boolean(x && x.trim()));

  if (leadSnippets.length === 0) {
    return `No high-confidence snippets returned for "${query}"; raw sources collected for manual review.`;
  }
  // Deterministic bullet summary; strategic_synthesis / esg_agent will rephrase.
  return leadSnippets.map((s, i) => `(${i + 1}) ${s.trim().slice(0, 280)}`).join(' ');
}

function findingConfidence(sources: RankedSource[]): Credibility {
  if (sources.some(s => s.credibility === 'high')) return 'high';
  if (sources.some(s => s.credibility === 'medium')) return 'medium';
  return 'low';
}

export interface SynthesizeInput {
  ticker: string;
  executed: Array<{
    query: ScopedQuery;
    result: WebSearchResult | null;
    error?: string;
  }>;
}

export function synthesize(input: SynthesizeInput): DeepResearchResult {
  const warnings: string[] = [];
  const findings: SynthesizedFinding[] = [];

  let sourcesTotal = 0;
  let sourcesHigh = 0;
  const publishers = new Set<string>();

  for (const { query, result, error } of input.executed) {
    if (error || !result) {
      warnings.push(`query failed: "${query.query}" — ${error ?? 'no result'}`);
      findings.push({
        query: query.query,
        scoped_rationale: query.rationale,
        sources: [],
        synthesized_answer: `Query failed — ${error ?? 'no result'}.`,
        confidence: 'low',
      });
      continue;
    }

    const deduped = dedupeByUrl(result.sources);
    const ranked: RankedSource[] = deduped.map(s => {
      const { credibility, reason } = rankSourceCredibility(s);
      return { ...s, credibility, credibility_reason: reason };
    });

    // Prefer publisher-hint alignment — reorder so hint-matching high-credibility first.
    ranked.sort((a, b) => {
      const aHinted = query.publisher_hints.some(h =>
        (a.publisher ?? '').toLowerCase().includes(h.toLowerCase()) ||
        a.url.toLowerCase().includes(h.toLowerCase().replace(/\s+/g, '')),
      );
      const bHinted = query.publisher_hints.some(h =>
        (b.publisher ?? '').toLowerCase().includes(h.toLowerCase()) ||
        b.url.toLowerCase().includes(h.toLowerCase().replace(/\s+/g, '')),
      );
      if (aHinted !== bHinted) return aHinted ? -1 : 1;
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.credibility] - rank[b.credibility];
    });

    sourcesTotal += ranked.length;
    sourcesHigh += ranked.filter(s => s.credibility === 'high').length;
    ranked.forEach(s => s.publisher && publishers.add(s.publisher));

    findings.push({
      query: query.query,
      scoped_rationale: query.rationale,
      sources: ranked.slice(0, 6),
      synthesized_answer: synthesizeAnswer(ranked, query.query),
      confidence: findingConfidence(ranked),
    });
  }

  const confidenceCounts = findings.reduce(
    (acc, f) => {
      acc[f.confidence]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );

  let confidenceOverall: Credibility = 'low';
  if (confidenceCounts.high >= findings.length / 2) confidenceOverall = 'high';
  else if (confidenceCounts.high + confidenceCounts.medium >= findings.length / 2) {
    confidenceOverall = 'medium';
  }

  const status: DeepResearchResult['status'] =
    findings.every(f => f.sources.length === 0)
      ? 'failed'
      : findings.some(f => f.sources.length === 0)
      ? 'partial'
      : 'active';

  return {
    ticker: input.ticker,
    scope_queries: input.executed.map(x => x.query.query),
    findings,
    aggregate_metrics: {
      queries_total: input.executed.length,
      sources_total: sourcesTotal,
      sources_high_credibility: sourcesHigh,
      sources_unique_publishers: publishers.size,
    },
    status,
    warnings,
    confidence_overall: confidenceOverall,
  };
}
