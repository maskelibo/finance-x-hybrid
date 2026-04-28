/**
 * Pre-Core-4 Phase B — peer fixture loader.
 *
 * Production sector_competition runner reads
 * accumulatedContext['sector_competition_peers'] which was never
 * populated in production (only the smoke-test fixture set it). This
 * loader is the deterministic, offline-friendly path to populating
 * that context from committed fixtures.
 *
 * Fixture layout:
 *   config/peer_fixtures/<sector>/<TICKER>.json
 *
 * Each peer JSON carries a minimal FinancialAnalysisOutput shape that
 * sector_competition.compare_with_peers() can consume:
 *   - ticker, sector, period_label
 *   - canonical_numbers with the metrics needed for benchmark
 *   - verification_status: 'operator_verified' | 'auto_curated_pending_operator_review'
 *   - source_attribution: { source_url, as_of_date, source_filing }
 *
 * Gate behaviour:
 *   - When ≥3 peers load successfully → context populated, peer chart
 *     renders with real medians.
 *   - <3 peers → loader returns []; sector_competition reports
 *     peer_count=0; the report's existing Wave 4 banner kicks in.
 *   - When peers carry verification_status != 'operator_verified',
 *     QA gate (Wave 2 PEER_COUNT_SUFFICIENT extended) treats the
 *     dimension as "uncertain" rather than "verified".
 *
 * No paid LLM calls. No network. Pure FS read.
 */

import fs from 'node:fs';
import path from 'node:path';

import { PROJECT_ROOT } from '../config.js';

export interface PeerFixtureSourceAttribution {
  source_url: string;
  as_of_date: string;
  source_filing: string;
  unit_label?: string;
}

export interface PeerFixture {
  ticker: string;
  sector: string;
  period_label: string;
  canonical_numbers: Record<string, string | number | null>;
  verification_status: 'operator_verified' | 'auto_curated_pending_operator_review';
  source_attribution: PeerFixtureSourceAttribution;
  notes?: string;
}

export interface LoadedPeerSet {
  sector: string;
  fixtures: PeerFixture[];
  warnings: string[];
  /** Number of fixtures that pass the verification gate. */
  verified_count: number;
  /** All loaded fixtures (verified + auto_curated). */
  loaded_count: number;
}

const PEER_FIXTURES_DIR = path.join(PROJECT_ROOT, 'config', 'peer_fixtures');

export function loadPeerFixtures(sector: string): LoadedPeerSet {
  const result: LoadedPeerSet = {
    sector,
    fixtures: [],
    warnings: [],
    verified_count: 0,
    loaded_count: 0,
  };
  const sectorDir = path.join(PEER_FIXTURES_DIR, sector);
  if (!fs.existsSync(sectorDir)) {
    result.warnings.push(`peer_fixture_sector_dir_missing: ${sectorDir}`);
    return result;
  }

  let files: string[];
  try {
    files = fs.readdirSync(sectorDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    result.warnings.push(`peer_fixture_dir_unreadable: ${err instanceof Error ? err.message : err}`);
    return result;
  }

  for (const file of files) {
    const fullPath = path.join(sectorDir, file);
    let raw: string;
    try {
      raw = fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      result.warnings.push(`peer_fixture_unreadable[${file}]: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    let parsed: PeerFixture;
    try {
      parsed = JSON.parse(raw) as PeerFixture;
    } catch (err) {
      result.warnings.push(`peer_fixture_bad_json[${file}]: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    if (!validatePeerFixture(parsed, file, result.warnings)) continue;
    result.fixtures.push(parsed);
    result.loaded_count++;
    if (parsed.verification_status === 'operator_verified') result.verified_count++;
  }
  return result;
}

function validatePeerFixture(
  f: Partial<PeerFixture>,
  fileName: string,
  warnings: string[],
): f is PeerFixture {
  if (typeof f.ticker !== 'string' || f.ticker.length === 0) {
    warnings.push(`peer_fixture_missing_ticker[${fileName}]`);
    return false;
  }
  if (typeof f.sector !== 'string' || f.sector.length === 0) {
    warnings.push(`peer_fixture_missing_sector[${fileName}]`);
    return false;
  }
  if (typeof f.period_label !== 'string' || !f.period_label.startsWith('FY-')) {
    warnings.push(`peer_fixture_bad_period[${fileName}]: must be FY-YYYY for trend gate`);
    return false;
  }
  if (typeof f.canonical_numbers !== 'object' || f.canonical_numbers === null) {
    warnings.push(`peer_fixture_missing_canonical[${fileName}]`);
    return false;
  }
  if (
    f.verification_status !== 'operator_verified'
    && f.verification_status !== 'auto_curated_pending_operator_review'
  ) {
    warnings.push(`peer_fixture_bad_verification_status[${fileName}]: ${f.verification_status}`);
    return false;
  }
  if (
    typeof f.source_attribution !== 'object'
    || !f.source_attribution
    || typeof f.source_attribution.source_url !== 'string'
    || typeof f.source_attribution.as_of_date !== 'string'
    || typeof f.source_attribution.source_filing !== 'string'
  ) {
    warnings.push(`peer_fixture_missing_source[${fileName}]`);
    return false;
  }
  return true;
}

/**
 * Convert a LoadedPeerSet into the shape sector_competition Python
 * adapter expects on `accumulatedContext['sector_competition_peers']`:
 * a JSON-stringified array of FinancialAnalysisOutput-shaped objects.
 */
export function peerFixturesToContextValue(set: LoadedPeerSet): string {
  return JSON.stringify(
    set.fixtures.map((f) => ({
      ticker: f.ticker,
      sector: f.sector,
      period_label: f.period_label,
      canonical_numbers: f.canonical_numbers,
      // Pass the verification flag through so QA truth context can read it.
      __peer_verification_status: f.verification_status,
      __peer_source_url: f.source_attribution.source_url,
    })),
  );
}
