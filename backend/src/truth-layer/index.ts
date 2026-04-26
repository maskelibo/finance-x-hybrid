/**
 * Financial Truth Layer — barrel export + composite getTruthAssertions.
 *
 * Public API for the FTL first core (P1.alpha 2026-04-26):
 *   - classifyCompany           (ticker → CompanyClassification)
 *   - recommendValuationWeights (CompanyClassification → ValuationMethodologyWeights)
 *   - selectAuthoritativeFiling (ticker, FilingRecord[] → FilingSelection)
 *   - getTruthAssertions        (composite — bundles all 3)
 *
 * All exports are pure read-only functions. No DB writes. No LLM calls.
 * Sub-agent contracts are NOT modified; integration is additive.
 */

export type {
  CompanyClassification,
  ValuationMethodologyWeights,
  ValuationMethod,
  FilingRecord,
  FilingSelection,
  TruthAssertions,
} from './types.js';

export {
  classifyCompany,
  isHoldingTicker,
  isBankingTicker,
} from './classifier.js';
export type { ClassifierContext } from './classifier.js';

export {
  recommendValuationWeights,
  methodWeight,
} from './weighter.js';

export {
  selectAuthoritativeFiling,
  FILING_TYPE_PRIORITY,
} from './filing-selector.js';

import { classifyCompany, type ClassifierContext } from './classifier.js';
import { recommendValuationWeights } from './weighter.js';
import { selectAuthoritativeFiling } from './filing-selector.js';
import type { FilingRecord, TruthAssertions } from './types.js';

const METHODOLOGY_VERSION = 'v1.0.0-p1.alpha';

/**
 * Composite — bundle classification + valuation weights + (optional)
 * filing selection into a single TruthAssertions object.
 *
 * Filings parameter is optional; when omitted, filing_selection is null.
 */
export function getTruthAssertions(
  ticker: string,
  options: {
    classifierContext?: ClassifierContext;
    filings?: FilingRecord[];
  } = {},
): TruthAssertions {
  const classification = classifyCompany(ticker, options.classifierContext);
  const valuation_methodology = recommendValuationWeights(classification);
  const filing_selection = options.filings && options.filings.length > 0
    ? selectAuthoritativeFiling(ticker, options.filings)
    : null;

  return {
    ticker: classification.ticker,
    classification,
    valuation_methodology,
    filing_selection,
    methodology_version: METHODOLOGY_VERSION,
    generated_at: new Date().toISOString(),
  };
}
