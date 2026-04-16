/**
 * TickerPackage TypeScript surface — mirrors the Pydantic schemas in
 * python-services/src/financex/schemas/.
 *
 * These types are intentionally minimal: they cover the top-level shape
 * plus the handful of fields LLM agents and the report payload actually
 * read by name. Deep-nested numeric fields (balance sheet line items,
 * cash flow breakdowns, etc.) are left as `Record<string, unknown>` —
 * the runtime validator (Ajv) is the authoritative gatekeeper; these
 * types are just for downstream ergonomics.
 *
 * To tighten these in the future, wire up `json-schema-to-typescript`
 * against backend/generated/schemas/ and replace this file with the
 * generated output.
 */

// ----- Primitives -------------------------------------------------------

export type CurrencyCode = 'TRY' | 'USD' | 'EUR';
export type ReportingPeriodCode = 'FY' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type Severity = 'info' | 'warn' | 'block';

export interface SourceRef {
  source_id: string;
  url?: string | null;
  fetched_at: string; // ISO-8601
  detail?: string | null;
}

// ----- Meta / Company --------------------------------------------------

export interface MetaInfo {
  ticker: string;
  package_date: string; // ISO date
  schema_version: string;
  producer: string;
  built_at?: string | null;
  producer_version?: string | null;
  sources?: SourceRef[];
  notes?: string | null;
}

export interface Subsidiary {
  name: string;
  ticker?: string | null;
  ownership_pct: string; // Decimal-as-string
  segment?: string | null;
  market_value_try?: string | null;
}

export interface CompanyInfo {
  name: string;
  sector: string;
  industry_detail?: string | null;
  is_holding?: boolean;
  founded_year?: number | null;
  employees?: number | null;
  subsidiaries?: Subsidiary[];
  description?: string | null;
}

// ----- Financials (top-level shape only, inner fields left loose) -----

export interface PeriodFinancials {
  period: ReportingPeriodCode;
  year: number;
  currency?: CurrencyCode;
  ias29_restated?: boolean;
  sources?: SourceRef[];
  balance_sheet: Record<string, unknown>;
  income_statement: Record<string, unknown>;
  cash_flow?: Record<string, unknown> | null;
  equity_change?: Record<string, unknown> | null;
}

export interface Financials {
  periods: PeriodFinancials[];
}

// ----- Market data -----------------------------------------------------

export interface MarketSnapshot {
  last_price: string;
  currency?: CurrencyCode;
  shares_outstanding: number;
  market_cap: string;
  [key: string]: unknown;
}

export interface MarketData {
  snapshot: MarketSnapshot;
  history?: Array<Record<string, unknown>>;
}

// ----- Quality ---------------------------------------------------------

export interface QualityFlag {
  code: string;
  severity: Severity;
  message: string;
  affected_path?: string | null;
}

export interface QualityControl {
  missing_fields: string[];
  flags: QualityFlag[];
  overall_score?: number | null;
  degraded: boolean;
}

// ----- Top-level package ----------------------------------------------

export interface TickerPackage {
  meta: MetaInfo;
  company: CompanyInfo;
  financials: Financials;
  market: MarketData;

  technical?: Record<string, unknown> | null;
  macro?: Record<string, unknown> | null;
  transmission?: Record<string, unknown> | null;
  kap_events?: Record<string, unknown> | null;
  analyst?: Record<string, unknown> | null;
  esg?: Record<string, unknown> | null;
  brand?: Record<string, unknown> | null;
  engine_results?: Record<string, unknown> | null;

  quality: QualityControl;
}
