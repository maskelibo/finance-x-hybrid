/**
 * Pre-Core-4 Phase D — SOTP/NAV loader for holding companies.
 *
 * Reads `config/sotp/<TICKER>.yaml` and produces a deterministic
 * SOTP table the report formatter can render. The hard gate:
 *
 *   sector === 'holding'  AND
 *   no SOTP YAML loaded   →  no target_price publishable
 *
 * Replaces the previous behaviour where holding companies could
 * publish target_price + upside/downside derived from a consolidated
 * DCF that's mathematically inappropriate for holding structures.
 *
 * Schema:
 *   ticker (string)
 *   verification_status: 'operator_verified' | 'auto_curated_pending_operator_review'
 *   source: { url, as_of_date, source_filing }
 *   shares_outstanding_mn (number)
 *   holding_net_debt_try (number)
 *   holding_discount_pct (number)
 *   listed_subsidiaries: array of {subsidiary, ticker, stake_pct,
 *     market_cap_try, koc_effective_share_try, nav_method, notes?}
 *   private_subsidiaries: array of {subsidiary, stake_pct,
 *     nav_contribution_try, nav_method, notes?}
 *
 * Computes:
 *   gross_nav_try = sum(listed.koc_effective_share_try) + sum(private.nav_contribution_try)
 *   net_nav_try = gross_nav_try - holding_net_debt_try
 *   adjusted_nav_try = net_nav_try * (1 - holding_discount_pct/100)
 *   per_share_nav_try = adjusted_nav_try / (shares_outstanding_mn * 1_000_000)
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

import { PROJECT_ROOT } from '../config.js';

export interface SotpListedSub {
  subsidiary: string;
  ticker: string;
  stake_pct: number;
  market_cap_try: number;
  koc_effective_share_try: number;
  nav_method: string;
  notes?: string;
}

export interface SotpPrivateSub {
  subsidiary: string;
  stake_pct: number;
  nav_contribution_try: number;
  nav_method: string;
  notes?: string;
}

export interface SotpComputedSummary {
  gross_nav_try: number;
  net_nav_try: number;
  adjusted_nav_try: number;
  per_share_nav_try: number;
  holding_discount_pct: number;
  holding_net_debt_try: number;
  shares_outstanding_mn: number;
  listed_count: number;
  private_count: number;
  total_subsidiary_count: number;
}

export interface SotpData {
  ticker: string;
  verification_status: 'operator_verified' | 'auto_curated_pending_operator_review';
  source: { url: string; as_of_date: string; source_filing: string };
  shares_outstanding_mn: number;
  holding_net_debt_try: number;
  holding_discount_pct: number;
  listed_subsidiaries: SotpListedSub[];
  private_subsidiaries: SotpPrivateSub[];
  computed: SotpComputedSummary;
  age_days: number;
}

const SOTP_DIR = path.join(PROJECT_ROOT, 'config', 'sotp');

export function loadSotp(ticker: string): SotpData | null {
  const tk = ticker.toUpperCase();
  const filePath = path.join(SOTP_DIR, `${tk}.yaml`);
  if (!fs.existsSync(filePath)) return null;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  let parsed: Partial<SotpData>;
  try {
    parsed = yaml.parse(raw) as Partial<SotpData>;
  } catch {
    return null;
  }
  if (
    !parsed
    || typeof parsed.ticker !== 'string'
    || typeof parsed.shares_outstanding_mn !== 'number'
    || typeof parsed.holding_net_debt_try !== 'number'
    || typeof parsed.holding_discount_pct !== 'number'
    || !Array.isArray(parsed.listed_subsidiaries)
    || !parsed.source
  ) {
    return null;
  }
  // Compute NAV summary
  const listed = (parsed.listed_subsidiaries as SotpListedSub[]).filter(
    (s) => typeof s.koc_effective_share_try === 'number',
  );
  const priv = Array.isArray(parsed.private_subsidiaries)
    ? (parsed.private_subsidiaries as SotpPrivateSub[]).filter(
      (s) => typeof s.nav_contribution_try === 'number',
    )
    : [];
  const grossNav = listed.reduce((s, x) => s + x.koc_effective_share_try, 0)
    + priv.reduce((s, x) => s + x.nav_contribution_try, 0);
  const netNav = grossNav - parsed.holding_net_debt_try;
  const adjustedNav = netNav * (1 - parsed.holding_discount_pct / 100);
  const sharesAbs = parsed.shares_outstanding_mn * 1_000_000;
  const perShareNav = sharesAbs > 0 ? adjustedNav / sharesAbs : 0;

  let ageDays = 9999;
  try {
    const asOf = new Date(parsed.source.as_of_date);
    if (!Number.isNaN(asOf.getTime())) {
      ageDays = Math.floor((Date.now() - asOf.getTime()) / 86_400_000);
    }
  } catch { /* fallthrough */ }

  return {
    ticker: parsed.ticker.toUpperCase(),
    verification_status: parsed.verification_status === 'operator_verified'
      ? 'operator_verified'
      : 'auto_curated_pending_operator_review',
    source: parsed.source,
    shares_outstanding_mn: parsed.shares_outstanding_mn,
    holding_net_debt_try: parsed.holding_net_debt_try,
    holding_discount_pct: parsed.holding_discount_pct,
    listed_subsidiaries: listed,
    private_subsidiaries: priv,
    computed: {
      gross_nav_try: grossNav,
      net_nav_try: netNav,
      adjusted_nav_try: adjustedNav,
      per_share_nav_try: perShareNav,
      holding_discount_pct: parsed.holding_discount_pct,
      holding_net_debt_try: parsed.holding_net_debt_try,
      shares_outstanding_mn: parsed.shares_outstanding_mn,
      listed_count: listed.length,
      private_count: priv.length,
      total_subsidiary_count: listed.length + priv.length,
    },
    age_days: ageDays,
  };
}

/**
 * Phase D hard gate: holding-sector tickers without a SOTP YAML
 * (or with too few subsidiaries) cannot publish target_price.
 */
export function holdingSotpGatePass(ticker: string, sector: string): {
  pass: boolean;
  reason: string;
  data: SotpData | null;
} {
  if (sector.toLowerCase() !== 'holding') {
    return { pass: true, reason: 'not a holding company — gate not applicable', data: null };
  }
  const data = loadSotp(ticker);
  if (!data) {
    return {
      pass: false,
      reason: `holding company '${ticker}' has no SOTP YAML at config/sotp/${ticker}.yaml — target_price publish blocked`,
      data: null,
    };
  }
  if (data.computed.total_subsidiary_count < 3) {
    return {
      pass: false,
      reason: `SOTP YAML has only ${data.computed.total_subsidiary_count} subsidiary(s); need ≥3 for board-grade NAV`,
      data,
    };
  }
  return { pass: true, reason: 'SOTP gate satisfied', data };
}
