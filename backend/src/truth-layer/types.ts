/**
 * Financial Truth Layer (FTL) — first core types.
 *
 * 2026-04-26 P1.alpha: introduces a small advisory layer that establishes
 * factual ground BEFORE downstream computation. Three first-core concerns:
 *
 *   1. Company classification (holding / banking / regular / sub-types)
 *   2. Valuation methodology weighting (which DCF/SOTP/comps mix is appropriate)
 *   3. Filing selection (which KAP filing is the authoritative source)
 *
 * Design rules (per user spec 2026-04-26):
 * - S-block architecture untouched (sub-agents oblivious by default)
 * - sub-agent contracts preserved (additive integration only)
 * - existing deterministic layers unchanged
 * - truth-first: every assertion includes reasoning + confidence + sources
 */

/** Authoritative company classification. */
export type CompanyClassification = {
  ticker: string;
  /** Primary canonical sector from registry. */
  sector_canonical: string | null;
  /** True if the entity is a holding/conglomerate (drives val_sotp primacy). */
  is_holding: boolean;
  /** True if the entity is a deposit-taking bank (drives P/B + DDM primacy). */
  is_banking: boolean;
  /** True if the entity is heavy real estate (NAV-based). */
  is_real_estate: boolean;
  /** True if the entity is heavy insurance (different valuation lens). */
  is_insurance: boolean;
  /**
   * Secondary sector flags — e.g., a holding that is also banking-heavy
   * because YKBNK / AKBNK is on the consolidated balance sheet.
   */
  sub_classifications: string[];
  /** Confidence 0..1 — registry hit = 1.0; FA-narrative-derived = lower. */
  confidence: number;
  /** Human-readable explanation of how classification was reached. */
  reasoning: string;
  /** Which sources contributed: 'sector_registry' | 'fa_llm_narrative' | 'sector_competition' | 'default_industrial'. */
  sources: string[];
};

/** Recommended valuation methodology mix. */
export type ValuationMethodologyWeights = {
  ticker: string;
  classification: CompanyClassification;
  /** Primary method id — informs val_scenario_builder which to weight highest. */
  primary_method: ValuationMethod;
  /** Per-method weight 0..1 (sum to 1.0 across active methods). */
  weights: Record<ValuationMethod, number>;
  /** Methods to deprioritize even when present. */
  secondary_methods: ValuationMethod[];
  /** Methods that should be skipped/ignored for this company type. */
  inappropriate_methods: ValuationMethod[];
  /** Justification narrative — why this mix. */
  justification: string;
};

export type ValuationMethod =
  | 'val_dcf'
  | 'val_sotp'
  | 'val_trading_comps'
  | 'val_p_b'
  | 'val_ddm'
  | 'val_nav';

/** Filing record from KAP / source system. */
export type FilingRecord = {
  filing_id: string;
  /** Document type — see FILING_TYPE_PRIORITY in filing-selector.ts. */
  document_type: string;
  /** ISO date or null if unknown. */
  filing_date: string | null;
  /** Period covered (e.g., FY2025, Q3-2025). */
  period?: string | null;
  /** Approximate page count — placeholders are tiny. */
  page_count?: number | null;
  /** Auditor opinion present? (audit reports only — irrelevant for placeholders.) */
  has_auditor_opinion?: boolean;
  /** Free-text title. */
  title?: string;
  /** Optional structured payload — used to detect zero-data placeholders. */
  payload_size_bytes?: number | null;
};

/** Filing selector verdict. */
export type FilingSelection = {
  ticker: string;
  /** Selected filing — null if no candidate is authoritative. */
  selected: FilingRecord | null;
  /** Selected filing's score (higher = better). */
  selected_score: number | null;
  /** Filings rejected with reasoning. */
  rejected: Array<{ filing: FilingRecord; reason: string; score: number }>;
  /** Confidence 0..1 in the selection. */
  confidence: number;
  /** Human-readable reasoning. */
  reasoning: string;
};

/** Composite truth assertions bundle (P1.alpha core). */
export type TruthAssertions = {
  ticker: string;
  classification: CompanyClassification;
  valuation_methodology: ValuationMethodologyWeights;
  /** Filing selection — only emitted when filings list is provided. */
  filing_selection: FilingSelection | null;
  /** Methodology version (will be enriched in P1C). */
  methodology_version: string;
  generated_at: string;
};
