/**
 * Finance X — Deterministic Financial Engine
 *
 * Saf, deterministik, test edilebilir finansal hesap fonksiyonları.
 * LLM'in hesaplaması gereken aritmetik işleri kodda yapar.
 * Yorum, varsayım ve bağlamsal değerlendirme LLM'de kalır.
 *
 * Her fonksiyon: geçerli input → sayı, geçersiz input → null + warning.
 * Engine başarısız olursa pipeline eski davranışa döner (graceful degradation).
 */

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export type EngineResult<T> = {
  value: T | null;
  warning?: string;
};

export type RatioResult = EngineResult<number>;

export type PiotroskiInputs = {
  netIncome: number;
  ocf: number;
  roaDelta: number;         // ROA(t) - ROA(t-1)
  leverageDelta: number;    // Debt/Assets(t) - Debt/Assets(t-1), negative = improving
  currentRatioDelta: number; // CR(t) - CR(t-1), positive = improving
  newSharesDelta: number;   // shares(t) - shares(t-1), <= 0 = no dilution
  grossMarginDelta: number; // GM(t) - GM(t-1), positive = improving
  assetTurnoverDelta: number; // Sales/Assets(t) - Sales/Assets(t-1)
};

export type DCFResult = {
  fairValuePerShare: number;
  enterpriseValue: number;
  pvFcf: number[];
  terminalValue: number;
  pvTerminal: number;
};

export type EngineOutput = {
  computed_at: string;
  ratios: Record<string, RatioResult>;
  scores: Record<string, RatioResult>;
  dcf: EngineResult<DCFResult> | null;
  sensitivity: EngineResult<number[][]> | null;
  wacc: RatioResult | null;
  warnings: string[];
};

// -------------------------------------------------------------------
// Safe math helpers
// -------------------------------------------------------------------

function safeDiv(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function ratio(numerator: number | undefined | null, denominator: number | undefined | null, label: string, multiplier = 100): RatioResult {
  if (numerator == null || denominator == null || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return { value: null, warning: `${label}: input eksik veya geçersiz` };
  }
  const result = safeDiv(numerator, denominator);
  if (result === null) {
    return { value: null, warning: `${label}: sıfıra bölme` };
  }
  return { value: Math.round(result * multiplier * 100) / 100 };
}

// -------------------------------------------------------------------
// Profitability Ratios
// -------------------------------------------------------------------

export function grossMargin(grossProfit: number, revenue: number): RatioResult {
  return ratio(grossProfit, revenue, 'Brüt Kar Marjı');
}

export function ebitdaMargin(ebitda: number, revenue: number): RatioResult {
  return ratio(ebitda, revenue, 'FAVÖK Marjı');
}

export function netMargin(netIncome: number, revenue: number): RatioResult {
  return ratio(netIncome, revenue, 'Net Kar Marjı');
}

export function roe(netIncome: number, equity: number): RatioResult {
  return ratio(netIncome, equity, 'ROE');
}

export function roce(ebit: number, totalAssets: number, currentLiabilities: number): RatioResult {
  const capitalEmployed = totalAssets - currentLiabilities;
  return ratio(ebit, capitalEmployed, 'ROCE');
}

export function roic(nopat: number, investedCapital: number): RatioResult {
  return ratio(nopat, investedCapital, 'ROIC');
}

export function roa(netIncome: number, totalAssets: number): RatioResult {
  return ratio(netIncome, totalAssets, 'ROA');
}

export function opexToRevenue(opex: number, revenue: number): RatioResult {
  return ratio(opex, revenue, 'OPEX/Ciro');
}

// -------------------------------------------------------------------
// Working Capital Ratios
// -------------------------------------------------------------------

export function dso(tradeReceivables: number, revenue: number): RatioResult {
  return ratio(tradeReceivables, revenue, 'DSO', 360);
}

export function dio(inventories: number, cogs: number): RatioResult {
  return ratio(inventories, cogs, 'DIO', 360);
}

export function dpo(tradePayables: number, cogs: number): RatioResult {
  return ratio(tradePayables, cogs, 'DPO', 360);
}

export function ccc(dsoVal: number | null, dioVal: number | null, dpoVal: number | null): RatioResult {
  if (dsoVal == null || dioVal == null || dpoVal == null) {
    return { value: null, warning: 'CCC: DSO/DIO/DPO eksik' };
  }
  return { value: Math.round((dsoVal + dioVal - dpoVal) * 100) / 100 };
}

export function nwcToRevenue(currentAssets: number, currentLiabilities: number, revenue: number): RatioResult {
  const nwc = currentAssets - currentLiabilities;
  return ratio(nwc, revenue, 'NWC/Hasılat');
}

// -------------------------------------------------------------------
// Leverage & Liquidity
// -------------------------------------------------------------------

export function netDebt(financialDebt: number, cashAndEquivalents: number): RatioResult {
  if (!Number.isFinite(financialDebt) || !Number.isFinite(cashAndEquivalents)) {
    return { value: null, warning: 'Net Borç: input eksik' };
  }
  return { value: Math.round((financialDebt - cashAndEquivalents) * 100) / 100 };
}

export function netDebtToEbitda(netDebtVal: number, ebitda: number): RatioResult {
  return ratio(netDebtVal, ebitda, 'Net Borç/FAVÖK', 1);
}

export function interestCoverage(ebitda: number, interestExpense: number): RatioResult {
  return ratio(ebitda, interestExpense, 'Faiz Karşılama', 1);
}

export function currentRatio(currentAssets: number, currentLiabilities: number): RatioResult {
  return ratio(currentAssets, currentLiabilities, 'Cari Oran', 1);
}

export function acidTest(currentAssets: number, inventories: number, currentLiabilities: number): RatioResult {
  const numerator = currentAssets - inventories;
  return ratio(numerator, currentLiabilities, 'Asit-Test', 1);
}

// -------------------------------------------------------------------
// Cash Flow Quality
// -------------------------------------------------------------------

export function fcf(ocf: number, capex: number): RatioResult {
  if (!Number.isFinite(ocf) || !Number.isFinite(capex)) {
    return { value: null, warning: 'FCF: input eksik' };
  }
  return { value: Math.round((ocf - Math.abs(capex)) * 100) / 100 };
}

export function ocfToEbitda(ocf: number, ebitda: number): RatioResult {
  return ratio(ocf, ebitda, 'OCF/FAVÖK');
}

export function capexToEbitda(capex: number, ebitda: number): RatioResult {
  return ratio(Math.abs(capex), ebitda, 'CAPEX/FAVÖK');
}

export function interestBurden(interestExpense: number, ebitda: number): RatioResult {
  return ratio(interestExpense, ebitda, 'Faiz Yükü');
}

// -------------------------------------------------------------------
// Scoring Metrics
// -------------------------------------------------------------------

export function altmanZ(
  nwc: number, retainedEarnings: number, ebit: number,
  marketCap: number, totalLiabilities: number, sales: number, totalAssets: number,
): RatioResult {
  if ([nwc, retainedEarnings, ebit, marketCap, totalLiabilities, sales, totalAssets].some(v => !Number.isFinite(v))) {
    return { value: null, warning: 'Altman Z: input eksik' };
  }
  if (totalAssets === 0 || totalLiabilities === 0) {
    return { value: null, warning: 'Altman Z: sıfıra bölme (TA veya TL)' };
  }
  const z = 1.2 * (nwc / totalAssets)
    + 1.4 * (retainedEarnings / totalAssets)
    + 3.3 * (ebit / totalAssets)
    + 0.6 * (marketCap / totalLiabilities)
    + 1.0 * (sales / totalAssets);
  return { value: Math.round(z * 100) / 100 };
}

export function piotroskiF(inputs: PiotroskiInputs): RatioResult {
  const checks = [
    inputs.netIncome > 0,
    inputs.ocf > 0,
    inputs.roaDelta > 0,
    inputs.ocf > inputs.netIncome,
    inputs.leverageDelta < 0,
    inputs.currentRatioDelta > 0,
    inputs.newSharesDelta <= 0,
    inputs.grossMarginDelta > 0,
    inputs.assetTurnoverDelta > 0,
  ];
  return { value: checks.filter(Boolean).length };
}

// -------------------------------------------------------------------
// Valuation — WACC
// -------------------------------------------------------------------

export function wacc(
  ke: number, kd: number, taxRate: number,
  equityWeight: number, debtWeight: number,
): RatioResult {
  if ([ke, kd, taxRate, equityWeight, debtWeight].some(v => !Number.isFinite(v))) {
    return { value: null, warning: 'WACC: input eksik' };
  }
  if (Math.abs(equityWeight + debtWeight - 1) > 0.05) {
    return { value: null, warning: `WACC: ağırlıklar toplamı 1.0 değil (${equityWeight + debtWeight})` };
  }
  const result = ke * equityWeight + kd * (1 - taxRate) * debtWeight;
  return { value: Math.round(result * 10000) / 10000 }; // 4 decimal for WACC
}

// -------------------------------------------------------------------
// Valuation — DCF
// -------------------------------------------------------------------

export function dcfFairValue(
  fcfProjections: number[],
  waccRate: number,
  terminalGrowth: number,
  sharesOutstanding: number,
  netDebtVal?: number,
): EngineResult<DCFResult> {
  if (!fcfProjections.length || fcfProjections.some(v => !Number.isFinite(v))) {
    return { value: null, warning: 'DCF: FCF projeksiyonları eksik veya geçersiz' };
  }
  if (!Number.isFinite(waccRate) || waccRate <= 0) {
    return { value: null, warning: 'DCF: WACC geçersiz' };
  }
  if (!Number.isFinite(terminalGrowth) || terminalGrowth >= waccRate) {
    return { value: null, warning: `DCF: terminal growth (${terminalGrowth}) >= WACC (${waccRate})` };
  }
  if (!Number.isFinite(sharesOutstanding) || sharesOutstanding <= 0) {
    return { value: null, warning: 'DCF: hisse sayısı eksik veya geçersiz' };
  }

  const pvFcf = fcfProjections.map((fcfVal, i) =>
    Math.round(fcfVal / Math.pow(1 + waccRate, i + 1))
  );

  const lastFcf = fcfProjections[fcfProjections.length - 1];
  const terminalValue = (lastFcf * (1 + terminalGrowth)) / (waccRate - terminalGrowth);
  const pvTerminal = Math.round(terminalValue / Math.pow(1 + waccRate, fcfProjections.length));

  const enterpriseValue = pvFcf.reduce((a, b) => a + b, 0) + pvTerminal;
  const equityValue = enterpriseValue - (netDebtVal ?? 0);
  const fairValuePerShare = Math.round((equityValue / sharesOutstanding) * 100) / 100;

  return {
    value: {
      fairValuePerShare,
      enterpriseValue: Math.round(enterpriseValue),
      pvFcf,
      terminalValue: Math.round(terminalValue),
      pvTerminal,
    },
  };
}

// -------------------------------------------------------------------
// Valuation — Sensitivity Matrix
// -------------------------------------------------------------------

export function sensitivityMatrix(
  fcfProjections: number[],
  sharesOutstanding: number,
  waccRange: number[],
  terminalGRange: number[],
  netDebtVal?: number,
): EngineResult<number[][]> {
  if (!fcfProjections.length || !waccRange.length || !terminalGRange.length) {
    return { value: null, warning: 'Sensitivity: input eksik' };
  }

  const matrix = waccRange.map(w =>
    terminalGRange.map(tg => {
      const result = dcfFairValue(fcfProjections, w, tg, sharesOutstanding, netDebtVal);
      return result.value?.fairValuePerShare ?? 0;
    })
  );

  return { value: matrix };
}

// -------------------------------------------------------------------
// Bulk computation — tüm metrikleri tek seferde hesapla
// -------------------------------------------------------------------

export type FinancialInputs = {
  // Income Statement
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  ebit?: number;
  ebitda?: number;
  netIncome?: number;
  interestExpense?: number;
  opex?: number;
  // Balance Sheet
  totalAssets?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  inventories?: number;
  tradeReceivables?: number;
  tradePayables?: number;
  financialDebt?: number;
  cashAndEquivalents?: number;
  equity?: number;
  retainedEarnings?: number;
  totalLiabilities?: number;
  // Cash Flow
  ocf?: number;
  capex?: number;
  // Market
  marketCap?: number;
  sharesOutstanding?: number;
  // Deltas (for Piotroski)
  roaDelta?: number;
  leverageDelta?: number;
  currentRatioDelta?: number;
  newSharesDelta?: number;
  grossMarginDelta?: number;
  assetTurnoverDelta?: number;
  // Valuation inputs (from LLM assumptions)
  ke?: number;
  kd?: number;
  taxRate?: number;
  equityWeight?: number;
  debtWeight?: number;
  fcfProjections?: number[];
  terminalGrowth?: number;
  waccOverride?: number; // LLM can provide WACC directly
};

export function computeAll(inputs: FinancialInputs): EngineOutput {
  const warnings: string[] = [];
  const ratios: Record<string, RatioResult> = {};
  const scores: Record<string, RatioResult> = {};

  // Helper to collect warnings
  function add(name: string, result: RatioResult, target: Record<string, RatioResult> = ratios): void {
    target[name] = result;
    if (result.warning) warnings.push(result.warning);
  }

  // Profitability
  if (inputs.grossProfit != null && inputs.revenue != null)
    add('gross_margin', grossMargin(inputs.grossProfit, inputs.revenue));
  if (inputs.ebitda != null && inputs.revenue != null)
    add('ebitda_margin', ebitdaMargin(inputs.ebitda, inputs.revenue));
  if (inputs.netIncome != null && inputs.revenue != null)
    add('net_margin', netMargin(inputs.netIncome, inputs.revenue));
  if (inputs.netIncome != null && inputs.equity != null)
    add('roe', roe(inputs.netIncome, inputs.equity));
  if (inputs.ebit != null && inputs.totalAssets != null && inputs.currentLiabilities != null)
    add('roce', roce(inputs.ebit, inputs.totalAssets, inputs.currentLiabilities));
  if (inputs.netIncome != null && inputs.totalAssets != null)
    add('roa', roa(inputs.netIncome, inputs.totalAssets));
  if (inputs.opex != null && inputs.revenue != null)
    add('opex_to_revenue', opexToRevenue(inputs.opex, inputs.revenue));

  // Working Capital
  const dsoR = (inputs.tradeReceivables != null && inputs.revenue != null) ? dso(inputs.tradeReceivables, inputs.revenue) : null;
  const dioR = (inputs.inventories != null && inputs.cogs != null) ? dio(inputs.inventories, inputs.cogs) : null;
  const dpoR = (inputs.tradePayables != null && inputs.cogs != null) ? dpo(inputs.tradePayables, inputs.cogs) : null;
  if (dsoR) add('dso', dsoR);
  if (dioR) add('dio', dioR);
  if (dpoR) add('dpo', dpoR);
  add('ccc', ccc(dsoR?.value ?? null, dioR?.value ?? null, dpoR?.value ?? null));
  if (inputs.currentAssets != null && inputs.currentLiabilities != null && inputs.revenue != null)
    add('nwc_to_revenue', nwcToRevenue(inputs.currentAssets, inputs.currentLiabilities, inputs.revenue));

  // Leverage & Liquidity
  const nd = (inputs.financialDebt != null && inputs.cashAndEquivalents != null)
    ? netDebt(inputs.financialDebt, inputs.cashAndEquivalents) : null;
  if (nd) add('net_debt', nd);
  if (nd?.value != null && inputs.ebitda != null)
    add('net_debt_to_ebitda', netDebtToEbitda(nd.value, inputs.ebitda));
  if (inputs.ebitda != null && inputs.interestExpense != null)
    add('interest_coverage', interestCoverage(inputs.ebitda, inputs.interestExpense));
  if (inputs.currentAssets != null && inputs.currentLiabilities != null)
    add('current_ratio', currentRatio(inputs.currentAssets, inputs.currentLiabilities));
  if (inputs.currentAssets != null && inputs.inventories != null && inputs.currentLiabilities != null)
    add('acid_test', acidTest(inputs.currentAssets, inputs.inventories, inputs.currentLiabilities));

  // Cash Flow
  if (inputs.ocf != null && inputs.capex != null)
    add('fcf', fcf(inputs.ocf, inputs.capex));
  if (inputs.ocf != null && inputs.ebitda != null)
    add('ocf_to_ebitda', ocfToEbitda(inputs.ocf, inputs.ebitda));
  if (inputs.capex != null && inputs.ebitda != null)
    add('capex_to_ebitda', capexToEbitda(inputs.capex, inputs.ebitda));
  if (inputs.interestExpense != null && inputs.ebitda != null)
    add('interest_burden', interestBurden(inputs.interestExpense, inputs.ebitda));

  // Scores
  if (inputs.totalAssets != null && inputs.totalLiabilities != null && inputs.marketCap != null
    && inputs.ebit != null && inputs.revenue != null) {
    const nwcVal = (inputs.currentAssets ?? 0) - (inputs.currentLiabilities ?? 0);
    add('altman_z', altmanZ(
      nwcVal, inputs.retainedEarnings ?? 0, inputs.ebit,
      inputs.marketCap, inputs.totalLiabilities, inputs.revenue, inputs.totalAssets,
    ), scores);
  }

  if (inputs.netIncome != null && inputs.ocf != null) {
    add('piotroski_f', piotroskiF({
      netIncome: inputs.netIncome,
      ocf: inputs.ocf,
      roaDelta: inputs.roaDelta ?? 0,
      leverageDelta: inputs.leverageDelta ?? 0,
      currentRatioDelta: inputs.currentRatioDelta ?? 0,
      newSharesDelta: inputs.newSharesDelta ?? 0,
      grossMarginDelta: inputs.grossMarginDelta ?? 0,
      assetTurnoverDelta: inputs.assetTurnoverDelta ?? 0,
    }), scores);
  }

  // WACC
  let waccResult: RatioResult | null = null;
  if (inputs.waccOverride != null) {
    waccResult = { value: inputs.waccOverride };
  } else if (inputs.ke != null && inputs.kd != null && inputs.taxRate != null
    && inputs.equityWeight != null && inputs.debtWeight != null) {
    waccResult = wacc(inputs.ke, inputs.kd, inputs.taxRate, inputs.equityWeight, inputs.debtWeight);
    if (waccResult.warning) warnings.push(waccResult.warning);
  }

  // DCF
  let dcfResult: EngineResult<DCFResult> | null = null;
  if (inputs.fcfProjections?.length && waccResult?.value != null
    && inputs.terminalGrowth != null && inputs.sharesOutstanding != null) {
    dcfResult = dcfFairValue(
      inputs.fcfProjections, waccResult.value, inputs.terminalGrowth,
      inputs.sharesOutstanding, nd?.value ?? undefined,
    );
    if (dcfResult.warning) warnings.push(dcfResult.warning);
  }

  // Sensitivity Matrix (if DCF inputs available)
  let sensResult: EngineResult<number[][]> | null = null;
  if (inputs.fcfProjections?.length && waccResult?.value != null && inputs.sharesOutstanding != null) {
    const waccBase = waccResult.value;
    const tgBase = inputs.terminalGrowth ?? 0.03;
    const waccRange = [waccBase - 0.02, waccBase - 0.01, waccBase, waccBase + 0.01, waccBase + 0.02];
    const tgRange = [tgBase - 0.01, tgBase, tgBase + 0.01, tgBase + 0.02];
    sensResult = sensitivityMatrix(inputs.fcfProjections, inputs.sharesOutstanding, waccRange, tgRange, nd?.value ?? undefined);
    if (sensResult.warning) warnings.push(sensResult.warning);
  }

  return {
    computed_at: new Date().toISOString(),
    ratios,
    scores,
    dcf: dcfResult,
    sensitivity: sensResult,
    wacc: waccResult,
    warnings,
  };
}
