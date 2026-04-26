/**
 * Financial Truth Layer — company classifier.
 *
 * Authoritative classification of a ticker into holding / banking / regular
 * (and sub-flags) using the canonical sector registry as the ground truth,
 * with optional enrichment from upstream agent narratives.
 *
 * Returns a CompanyClassification with confidence + reasoning. Pure function
 * (no DB writes, no LLM calls). Safe to call from any layer.
 */

import { getSector } from '../sector-registry.js';
import type { CompanyClassification } from './types.js';

/**
 * Sectors that map directly to is_holding=true.
 * sector_registry.yml uses 'holding' for the conglomerate type.
 */
const HOLDING_SECTORS = new Set(['holding', 'holding_conglomerate', 'conglomerate']);
const BANKING_SECTORS = new Set(['banking', 'bank', 'mortgage_finance']);
const REAL_ESTATE_SECTORS = new Set(['real_estate', 'reit', 'real_estate_investment']);
const INSURANCE_SECTORS = new Set(['insurance', 'reinsurance']);

/**
 * Holding tickers in the BIST that consolidate banking subsidiaries.
 * KCHOL=YKBNK, SAHOL=AKBNK, ISCTR-related holdings.
 * Important for valuation methodology (banking subsidiary distorts margins).
 */
const HOLDINGS_WITH_BANKING_HEAVY = new Set(['KCHOL', 'SAHOL']);

/** Tickers known as primarily real estate plays (NAV-based). */
const HOLDINGS_WITH_REAL_ESTATE = new Set<string>(); // none yet — extensible

export interface ClassifierContext {
  /** Optional FA agent llm_narrative — searched for explicit declarations like "holding_conglomerate". */
  fa_llm_narrative?: string | null;
  /** Optional sector_competition output — contains peer_group / sector_canonical hints. */
  sector_competition_narrative?: string | null;
}

export function classifyCompany(
  ticker: string,
  ctx: ClassifierContext = {},
): CompanyClassification {
  const t = (ticker || '').toUpperCase().trim();
  const sourcesUsed: string[] = [];
  const reasoningParts: string[] = [];

  // 1) Authoritative source: sector_registry.yml
  let sectorCanonical = getSector(t);
  if (sectorCanonical) {
    sourcesUsed.push('sector_registry');
    reasoningParts.push(`registry override: ${t} → ${sectorCanonical}`);
  }

  // 2) Optional enrichment: FA llm_narrative
  let narrativeHint: string | null = null;
  if (ctx.fa_llm_narrative && typeof ctx.fa_llm_narrative === 'string') {
    const lower = ctx.fa_llm_narrative.toLowerCase();
    if (lower.includes('holding_conglomerate') || lower.includes('"holding"') || /bist_sector["'\s:]+holding/i.test(ctx.fa_llm_narrative)) {
      narrativeHint = 'holding';
    } else if (lower.includes('"banking"') || lower.includes('bist_sector') && lower.includes('banking')) {
      narrativeHint = 'banking';
    }
    if (narrativeHint) {
      sourcesUsed.push('fa_llm_narrative');
      if (sectorCanonical && narrativeHint !== sectorCanonical && !HOLDING_SECTORS.has(sectorCanonical) === !HOLDING_SECTORS.has(narrativeHint)) {
        reasoningParts.push(`FA narrative confirms registry classification`);
      } else if (!sectorCanonical) {
        reasoningParts.push(`FA narrative declares: ${narrativeHint}`);
        sectorCanonical = narrativeHint;
      }
    }
  }

  // 3) Optional enrichment: sector_competition narrative
  if (ctx.sector_competition_narrative && typeof ctx.sector_competition_narrative === 'string' && !sectorCanonical) {
    const lower = ctx.sector_competition_narrative.toLowerCase();
    if (lower.includes('holding') || lower.includes('konglomera') || lower.includes('diversified portfolio')) {
      sectorCanonical = 'holding';
      sourcesUsed.push('sector_competition');
      reasoningParts.push(`sector_competition narrative declares holding/conglomerate`);
    }
  }

  // 4) Default fallback
  if (!sectorCanonical) {
    sectorCanonical = 'industrial';
    sourcesUsed.push('default_industrial');
    reasoningParts.push(`no registry/narrative match — fallback default 'industrial'`);
  }

  const sectorLower = sectorCanonical.toLowerCase();
  const isHolding = HOLDING_SECTORS.has(sectorLower);
  const isBanking = BANKING_SECTORS.has(sectorLower);
  const isRealEstate = REAL_ESTATE_SECTORS.has(sectorLower);
  const isInsurance = INSURANCE_SECTORS.has(sectorLower);

  // Sub-classifications: holding'ler banka/REIT ağırlıklı olabilir
  const subClassifications: string[] = [];
  if (isHolding) {
    if (HOLDINGS_WITH_BANKING_HEAVY.has(t)) {
      subClassifications.push('banking_heavy');
      reasoningParts.push(`holding consolidates banking subsidiary (banking_heavy flag)`);
    }
    if (HOLDINGS_WITH_REAL_ESTATE.has(t)) {
      subClassifications.push('real_estate_heavy');
    }
  }

  // Confidence — registry hit is most reliable
  let confidence = 0.5;
  if (sourcesUsed.includes('sector_registry')) confidence = Math.max(confidence, 1.0);
  if (sourcesUsed.includes('fa_llm_narrative')) confidence = Math.max(confidence, 0.8);
  if (sourcesUsed.includes('sector_competition')) confidence = Math.max(confidence, 0.7);
  if (sourcesUsed.length === 1 && sourcesUsed[0] === 'default_industrial') confidence = 0.3;

  return {
    ticker: t,
    sector_canonical: sectorCanonical,
    is_holding: isHolding,
    is_banking: isBanking,
    is_real_estate: isRealEstate,
    is_insurance: isInsurance,
    sub_classifications: subClassifications,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: reasoningParts.join('; '),
    sources: sourcesUsed,
  };
}

/** Convenience: is this ticker a holding (per registry)? */
export function isHoldingTicker(ticker: string): boolean {
  return classifyCompany(ticker).is_holding;
}

/** Convenience: is this ticker a bank (per registry)? */
export function isBankingTicker(ticker: string): boolean {
  return classifyCompany(ticker).is_banking;
}
