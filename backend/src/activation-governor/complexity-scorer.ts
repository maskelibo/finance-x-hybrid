/**
 * P9 Wave 1 — Session complexity scoring.
 *
 * Pure planner. No DB writes. Read-only on shipped tables; the
 * disclosures table is referenced by the master plan but does not
 * exist in the shipped schema, so the disclosure_density dimension
 * falls back to a safe default of 5/20 when the table is absent.
 *
 * Five dimensions, each 0-20, summed to 0-100. Sector base
 * complexity is hard-coded from domain calibration.
 */

import { db } from '../db.js';
import { getSector } from '../sector-registry.js';

export interface ComplexityDimensions {
  sector_complexity: number;
  company_structure_complexity: number;
  disclosure_density: number;
  valuation_complexity: number;
  contradiction_likelihood: number;
}

export interface ComplexityScore {
  ticker: string;
  total: number;
  dimensions: ComplexityDimensions;
  explanation: string[];
}

const SECTOR_COMPLEXITY: Record<string, number> = {
  holding: 20,
  banking: 18,
  aviation: 15,
  refinery: 14,
  steel: 12,
  defense_electronics: 12,
  insurance: 13,
  telecom: 10,
  automotive: 10,
  energy_distribution: 9,
  retail: 8,
  glass_construction: 7,
  food: 6,
};

function safeDisclosureCount(ticker: string): number | null {
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM disclosures
         WHERE ticker = ? AND disclosure_date > date('now', '-90 days')`,
      )
      .get(ticker) as { c?: number } | undefined;
    return typeof row?.c === 'number' ? row.c : 0;
  } catch {
    return null;
  }
}

export function scoreComplexity(ticker: string): ComplexityScore {
  const dimensions: ComplexityDimensions = {
    sector_complexity: 0,
    company_structure_complexity: 0,
    disclosure_density: 0,
    valuation_complexity: 0,
    contradiction_likelihood: 0,
  };
  const explanation: string[] = [];

  const sector = getSector(ticker) ?? 'unknown';
  dimensions.sector_complexity = SECTOR_COMPLEXITY[sector] ?? 10;
  explanation.push(`Sector ${sector}: ${dimensions.sector_complexity}/20`);

  if (sector === 'holding') {
    dimensions.company_structure_complexity = 20;
    explanation.push('Holding structure: +20 (multi-segment)');
  } else if (sector === 'banking' || sector === 'insurance') {
    dimensions.company_structure_complexity = 14;
    explanation.push(`Regulated ${sector}: +14`);
  } else {
    dimensions.company_structure_complexity = 6;
    explanation.push('Single business: +6');
  }

  const disclosureCount = safeDisclosureCount(ticker);
  if (disclosureCount === null) {
    dimensions.disclosure_density = 5;
    explanation.push('disclosures table unavailable: +5 (default)');
  } else if (disclosureCount > 30) {
    dimensions.disclosure_density = 20;
    explanation.push(`${disclosureCount} disclosures in 90d: +20 (high activity)`);
  } else if (disclosureCount > 15) {
    dimensions.disclosure_density = 12;
    explanation.push(`${disclosureCount} disclosures in 90d: +12`);
  } else {
    dimensions.disclosure_density = 5;
    explanation.push(`${disclosureCount} disclosures in 90d: +5 (normal)`);
  }

  if (sector === 'holding') {
    dimensions.valuation_complexity = 20;
    explanation.push('SOTP required: +20');
  } else if (sector === 'banking') {
    dimensions.valuation_complexity = 16;
    explanation.push('Bank multi-methodology: +16');
  } else if (['aviation', 'refinery', 'defense_electronics'].includes(sector)) {
    dimensions.valuation_complexity = 12;
    explanation.push(`Cyclical/special ${sector}: +12`);
  } else {
    dimensions.valuation_complexity = 7;
    explanation.push('Standard DCF + comps: +7');
  }

  let contradiction = 8;
  if (sector === 'holding') {
    contradiction += 10;
    explanation.push('Holding IAS29 multi-segment: +10 contradiction risk');
  }
  if (sector === 'banking' || sector === 'insurance') {
    contradiction += 4;
  }
  dimensions.contradiction_likelihood = Math.min(20, contradiction);
  explanation.push(`Contradiction likelihood: ${dimensions.contradiction_likelihood}/20`);

  const total =
    dimensions.sector_complexity +
    dimensions.company_structure_complexity +
    dimensions.disclosure_density +
    dimensions.valuation_complexity +
    dimensions.contradiction_likelihood;

  return { ticker, total, dimensions, explanation };
}

export const _SECTOR_COMPLEXITY_FOR_TESTS = SECTOR_COMPLEXITY;
