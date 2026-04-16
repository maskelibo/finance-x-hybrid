/**
 * data_collection adapter — Python DataCollectionManifest → legacy
 * data_manifest the downstream parse_standardization / LLM agents
 * expect.
 */

export interface PythonCollectedDocument {
  kind: string;                     // 'financial_report' | 'activity_report' | ...
  disclosure_index: string;
  title: string;
  published_at: string;
  source_url: string;
  local_path: string;
  content_sha256: string;
  size_bytes: number;
  category?: string | null;
  subcategory?: string | null;
  summary?: string | null;
  period_label?: string | null;
  year?: number | null;
}

export interface PythonDataCollectionManifest {
  ticker: string;
  collected_at: string;
  since: string;
  until: string;
  documents?: PythonCollectedDocument[];
  sources_consulted?: Array<{ source_id?: string; url?: string; fetched_at?: string; detail?: string }>;
  errors?: string[];
  warnings?: string[];
}

export interface LegacyManifestDocument {
  kind: string;
  disclosure_id: string;
  title: string;
  period_label: string | null;
  year: number | null;
  published_at: string;
  source_url: string;
  local_path: string;
  size_bytes: number;
  content_sha256: string;
}

export interface LegacyDataCollectionOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  window: { since: string; until: string };
  data_manifest: {
    financial_reports: LegacyManifestDocument[];
    activity_reports: LegacyManifestDocument[];
    other: LegacyManifestDocument[];
  };
  document_count: number;
  sources_consulted: Array<{ source_id?: string; url?: string; detail?: string }>;
  errors: string[];
  warnings: string[];
  quality: {
    has_financials: boolean;
    has_activity: boolean;
    five_year_coverage: boolean;
  };
  review_status: string;
}


export function adaptPythonDataCollectionForLegacy(
  py: PythonDataCollectionManifest,
  outputId: string,
): LegacyDataCollectionOutput {
  const docs = py.documents ?? [];
  const mapDoc = (d: PythonCollectedDocument): LegacyManifestDocument => ({
    kind: d.kind,
    disclosure_id: d.disclosure_index,
    title: d.title,
    period_label: d.period_label ?? null,
    year: d.year ?? null,
    published_at: d.published_at,
    source_url: d.source_url,
    local_path: d.local_path,
    size_bytes: d.size_bytes,
    content_sha256: d.content_sha256,
  });

  const financial_reports = docs.filter(d => d.kind === 'financial_report').map(mapDoc);
  const activity_reports = docs.filter(d => d.kind === 'activity_report').map(mapDoc);
  const other = docs.filter(d => d.kind !== 'financial_report' && d.kind !== 'activity_report').map(mapDoc);

  const years = new Set(docs.map(d => d.year).filter((y): y is number => y !== null && y !== undefined));
  const fiveYearCoverage = years.size >= 5;

  return {
    agent_id: 'data_collection',
    output_id: outputId,
    ticker: py.ticker,
    window: { since: py.since, until: py.until },
    data_manifest: { financial_reports, activity_reports, other },
    document_count: docs.length,
    sources_consulted: py.sources_consulted ?? [],
    errors: py.errors ?? [],
    warnings: py.warnings ?? [],
    quality: {
      has_financials: financial_reports.length > 0,
      has_activity: activity_reports.length > 0,
      five_year_coverage: fiveYearCoverage,
    },
    review_status: 'pending_ceo_review',
  };
}
