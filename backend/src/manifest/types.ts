/**
 * AgentOutputManifest — canonical shape for the Phase 5 manifest/retrieval
 * contract (CLAUDE_MASTER_PROMPT.md §6.6 + §7.7).
 *
 * Phase 5A observe-only: every agent run produces one of these but downstream
 * consumers still read the raw output. The manifest is persisted to
 * agent_runs so we can measure "what COULD we save if downstream read this
 * manifest instead of 100 KB of raw prose?" before committing to the
 * retrieval layer.
 *
 * Schema version is stable from day one — Phase 5B dual-write relies on it.
 */

export const MANIFEST_SCHEMA_VERSION = '1.0.0' as const;

/** Downstream truncation threshold — matches the existing CONTEXT_CHAR_LIMIT
 * heuristic. Anything above this gets flagged as truncation_risk=true. */
export const TRUNCATION_RISK_BYTES = 100_000;

/**
 * A content section the retrieval layer can fetch independently. Phase 5A
 * only populates `id`, `title`, `offset`, `length`. Phase 5B will add
 * `content_hash` for dedup and `retrievable_by` routing hints.
 */
export type ManifestSection = {
  id: string;
  title?: string;
  /** Byte offset in the raw output where this section starts. */
  offset: number;
  /** Byte length of this section's slice in the raw output. */
  length: number;
  /** Optional metric_ids covered by this section, for retrieval routing. */
  metric_ids?: string[];
};

/**
 * The single canonical manifest shape. All agents produce one regardless of
 * their payload shape; the extractor inspects the output and populates the
 * flags that apply. Absent data is represented with empty arrays / false
 * flags so consumers can use `manifest.has_X` without defined checks.
 */
export type AgentOutputManifest = {
  schema_version: typeof MANIFEST_SCHEMA_VERSION;
  agent_id: string;
  ticker: string | null;
  runtime_mode: string | null;

  // ─── Size accounting ──────────────────────────────────────────────
  raw_output_bytes: number;
  manifest_bytes: number;
  /** raw_output_bytes / manifest_bytes — >1 means manifest is smaller. */
  compression_ratio: number;
  /** true when raw_output_bytes > TRUNCATION_RISK_BYTES. */
  truncation_risk: boolean;

  // ─── Content catalog ──────────────────────────────────────────────
  sections: ManifestSection[];
  metric_ids: string[];
  finding_ids: string[];
  addressed_finding_ids: string[];
  evidence_ref_count: number;
  evidence_source_types: string[];
  missing_data_codes: string[];
  canonical_refs: string[];

  // ─── Shape flags for retrieval planning ───────────────────────────
  has_interpretations: boolean;
  has_engine_snapshot: boolean;
  has_metrics_array: boolean;
  has_claims: boolean;
  has_findings: boolean;
  has_addressed_findings: boolean;

  // ─── Extraction provenance ────────────────────────────────────────
  /** How the manifest was extracted: 'json' (parsed structured fields) or
   * 'heuristic' (regex scan on prose) or 'mixed'. */
  extraction_mode: 'json' | 'heuristic' | 'mixed';
  /** Wall-clock ms the extractor spent. Useful when judging if the
   * retrieval layer's overhead is acceptable. */
  extraction_duration_ms: number;
  generated_at: string;
};
