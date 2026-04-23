/**
 * U6 Kategori C acceptance — EREGL FY2024 evidence-driven integration.
 *
 * (a) Python engine compute_ebitda_ias29 canlı çağrı (EREGL FY2024 P&L mock
 *     restated figures — EREGL_financial_report_20250212_1392292 Not 35
 *     kaynak NMP değeri).
 * (b) Reconciliation — reported_ebitda NMP ekleyerek gelmiş gibi davranıp
 *     divergence ≈ NMP check'i.
 * (c) 4 agent output_schema.json'larının document_evidence_citations alanını
 *     gerektirdiğini doğrula (JSON schema parse + required path check).
 * (d) Backend TS typecheck smoke (ayrı adım).
 *
 * Çalıştır: npx tsx scripts/u6-evidence-integration-test.ts
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { buildIas29Block, formatIas29ForAgent, type StatementsForIas29 } from '../backend/src/python/adapters/ias29.ts';

type Assertion = { name: string; pass: boolean; detail?: string };

const REPO_ROOT = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\//, ''), '..');

function runPython(args: string[]): { code: number; stdout: string; stderr: string } {
  const binLocal = path.join(REPO_ROOT, 'python-services', '.venv', 'Scripts', 'python.exe');
  const r = spawnSync(binLocal, args, {
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONPATH: path.join(REPO_ROOT, 'python-services', 'src'),
    },
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// EREGL FY2024 — Not 35 NMP = -529.928 bin TL (KAYIP, source: KAP 1392292).
// Other values are illustrative restated figures for the benchmark.
const EREGL_FY2024_RESTATED = {
  ticker: 'EREGL',
  fiscal_period: 'FY-2024',
  operating_income: 12_000_000,
  depreciation_amortization: 8_000_000,
  monetary_gain_loss: -529_928, // Net Parasal Pozisyon Kaybı, Not 35
  revenue: 165_000_000,
  net_income: 500_000,
  gross_profit: 15_000_000,
  ias29_applied: true,
};

async function main() {
  const assertions: Assertion[] = [];

  console.log('=== U6 Evidence Integration Test — EREGL FY2024 ===\n');

  // (a) Python engine call: compute_ebitda_ias29 + engine ratios
  const pyCode = `
import sys, json
sys.path.insert(0, '.')
from decimal import Decimal
from financex.calculators.financial_engine import compute_for_period
from financex.calculators.ias29 import compute_ebitda_ias29
from financex.schemas.financials import PeriodFinancials, IncomeStatement, BalanceSheet, CashFlowStatement, ReportingPeriod

data = json.loads(${JSON.stringify(JSON.stringify(EREGL_FY2024_RESTATED))})
is_ = IncomeStatement(
    revenue=Decimal(str(data['revenue'])),
    net_income=Decimal(str(data['net_income'])),
    gross_profit=Decimal(str(data['gross_profit'])),
    operating_income=Decimal(str(data['operating_income'])),
    ebitda=None,
    depreciation_amortization=Decimal(str(data['depreciation_amortization'])),
    monetary_gain_loss=Decimal(str(data['monetary_gain_loss'])),
)
bs = BalanceSheet(
    total_assets=Decimal('200000000'),
    total_liabilities=Decimal('100000000'),
    total_equity=Decimal('100000000'),
    cash_and_equivalents=Decimal('10000000'),
    short_term_debt=Decimal('20000000'),
    long_term_debt=Decimal('30000000'),
    current_liabilities=Decimal('40000000'),
)
cf = CashFlowStatement(
    operating_cash_flow=Decimal('15000000'),
    depreciation_amortization=Decimal(str(data['depreciation_amortization'])),
    capex=Decimal('-5000000'),
)
pf = PeriodFinancials(period=ReportingPeriod.FY, year=2024, income_statement=is_, balance_sheet=bs, cash_flow=cf, ias29_restated=True)

engine_out = compute_for_period(pf)
ias29 = compute_ebitda_ias29(pf, ticker=data['ticker'], fiscal_period=data['fiscal_period'])

payload = {
  "engine_ratios": {
    "ebitda": float(engine_out.ratios.ebitda.value) if engine_out.ratios.ebitda and engine_out.ratios.ebitda.value is not None else None,
    "ebitda_ias29": float(engine_out.ratios.ebitda_ias29.value) if engine_out.ratios.ebitda_ias29 and engine_out.ratios.ebitda_ias29.value is not None else None,
    "ebitda_margin_ias29": float(engine_out.ratios.ebitda_margin_ias29.value) if engine_out.ratios.ebitda_margin_ias29 and engine_out.ratios.ebitda_margin_ias29.value is not None else None,
  },
  "ias29_module_result": ias29.to_dict(),
}
print(json.dumps(payload, ensure_ascii=False, indent=2))
`;
  const pyResult = runPython(['-c', pyCode]);
  if (pyResult.code !== 0) {
    console.error('Python call failed:', pyResult.stderr.slice(0, 2000));
    process.exit(2);
  }
  let py: any;
  try {
    py = JSON.parse(pyResult.stdout);
  } catch (e) {
    console.error('Could not parse python stdout:', pyResult.stdout.slice(0, 1000));
    process.exit(2);
  }

  console.log('Python engine response:');
  console.log(JSON.stringify(py, null, 2));
  console.log();

  // Canonical numbers check
  const eb = py.engine_ratios.ebitda_ias29;
  const ebMargin = py.engine_ratios.ebitda_margin_ias29;
  const modEb = py.ias29_module_result.ebitda_ias29;
  const excludedNmp = py.ias29_module_result.excluded_items.net_monetary_position_gain_loss;

  assertions.push({
    name: 'engine: ebitda_ias29 = operating_profit + D&A (20M)',
    pass: Math.abs(eb - 20_000_000) < 1,
    detail: `got=${eb}`,
  });
  assertions.push({
    name: 'engine: ebitda_margin_ias29 ≈ 12.12%',
    pass: Math.abs(ebMargin - 12.1212) < 0.01,
    detail: `got=${ebMargin}`,
  });
  assertions.push({
    name: 'engine vs module: same ebitda_ias29',
    pass: Math.abs(eb - modEb) < 1,
    detail: `engine=${eb} module=${modEb}`,
  });
  assertions.push({
    name: 'module: NMP in excluded_items (not in EBITDA)',
    pass: excludedNmp === -529928,
    detail: `nmp=${excludedNmp}`,
  });

  // (b) Reconciliation path via Node adapter
  const stmts: StatementsForIas29 = {
    operating_profit_restated: EREGL_FY2024_RESTATED.operating_income,
    depreciation_restated: EREGL_FY2024_RESTATED.depreciation_amortization,
    amortization_restated: null,
    net_monetary_position_gain_loss: EREGL_FY2024_RESTATED.monetary_gain_loss,
    reported_ebitda: 20_000_000 + EREGL_FY2024_RESTATED.monetary_gain_loss, // management INCLUDED NMP
    ias29_applied: true,
  };
  const block = buildIas29Block(
    EREGL_FY2024_RESTATED.ticker,
    EREGL_FY2024_RESTATED.fiscal_period,
    { ratios: {
        ebitda_ias29: { value: eb },
        ebitda_margin_ias29: { value: ebMargin },
      },
    },
    stmts,
  );
  console.log('Node adapter ias29 block (with contaminated reported_ebitda):');
  console.log(JSON.stringify(block, null, 2));
  console.log();

  assertions.push({
    name: 'node adapter: reconciliation detects NMP contamination',
    pass:
      block.reconciliation !== null &&
      /net_monetary_position_gain_loss/.test(block.reconciliation.likely_cause),
    detail: block.reconciliation?.likely_cause ?? 'null',
  });
  assertions.push({
    name: 'node adapter: divergence ≈ NMP',
    pass:
      block.reconciliation !== null &&
      block.reconciliation.divergence !== null &&
      Math.abs(block.reconciliation.divergence - stmts.net_monetary_position_gain_loss!) < 1,
    detail: `divergence=${block.reconciliation?.divergence}, NMP=${stmts.net_monetary_position_gain_loss}`,
  });

  // (c) Prompt formatter produces usable block
  const formatted = formatIas29ForAgent(block);
  assertions.push({
    name: 'prompt formatter: includes EBITDA_ias29 line',
    pass: /EBITDA_ias29 \(operating-only\)/.test(formatted),
    detail: `len=${formatted.length}`,
  });
  assertions.push({
    name: 'prompt formatter: asserts NMP excluded',
    pass: /NMP.*dahil EDİLMEZ/.test(formatted),
  });

  // (d) 4 agent schema validation — document_evidence_citations field present
  for (const agent of ['financial_analysis', 'context_extraction', 'valuation_agent', 'esg_agent']) {
    const schemaPath = path.join(REPO_ROOT, 'agents', agent, 'output_schema.json');
    const raw = readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(raw);
    const hasField =
      schema.properties?.document_evidence_citations?.type === 'array' &&
      Array.isArray(schema.properties.document_evidence_citations.items?.required) &&
      schema.properties.document_evidence_citations.items.required.includes('claim') &&
      schema.properties.document_evidence_citations.items.required.includes('doc_id') &&
      schema.properties.document_evidence_citations.items.required.includes('page');
    assertions.push({
      name: `schema: ${agent} has document_evidence_citations[{claim,doc_id,page}]`,
      pass: hasField,
    });
  }

  // (e) financial_analysis has ebitda_ias29 + ebitda_margin_ias29 in profitability required
  {
    const fa = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'agents', 'financial_analysis', 'output_schema.json'), 'utf-8'),
    );
    const profRequired = fa.properties?.profitability?.required || [];
    assertions.push({
      name: 'schema: financial_analysis.profitability requires ebitda_ias29',
      pass: profRequired.includes('ebitda_ias29'),
    });
    assertions.push({
      name: 'schema: financial_analysis.profitability requires ebitda_margin_ias29',
      pass: profRequired.includes('ebitda_margin_ias29'),
    });
  }

  // Report
  console.log('=== ASSERTIONS ===');
  let pass = 0;
  for (const a of assertions) {
    const tag = a.pass ? 'PASS' : 'FAIL';
    console.log(`  [${tag}] ${a.name}${a.detail ? '  —  ' + a.detail : ''}`);
    if (a.pass) pass++;
  }
  const total = assertions.length;
  console.log(`\n${pass}/${total} assertions green`);
  if (pass !== total) process.exit(1);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(2);
});
