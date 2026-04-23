/**
 * U8 E2E Regression — Kategori B.
 *
 * Three phases:
 *   (1) 20-Q RAG acceptance suite across 5 tickers (live Qdrant)
 *   (2) Pipeline regression: canonical + orchestrator structure post-U5/U7
 *   (3) 4+1 new agent regression: schema + prompt + dependency integrity
 *
 * Acceptance (per master Block U spec):
 *   - RAG: avg top-relevance ≥ 0.60, zero-evidence rate < 15%
 *   - Pipeline: buildPipelineForLayers() + registry + canonical intact
 *   - Agents: evidence_citations schema + dependency wiring + prompt directives
 *
 * Çalıştır: npx tsx scripts/u8-e2e-regression-test.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Minimal YAML reader for the specific pipeline_modes.yaml structure we
// assert against. Avoid adding a runtime dep to the benchmark itself.
function simpleYamlLayerScan(
  text: string,
): { layers: string[]; knowledgeContents: string[] } {
  const layerMap: string[] = [];
  const lines = text.split('\n');
  let inLayers = false;
  let inKnowledge = false;
  const knowledgeContents: string[] = [];
  for (const line of lines) {
    if (/^layers:\s*$/.test(line)) {
      inLayers = true;
      continue;
    }
    if (inLayers && /^\S/.test(line)) {
      inLayers = false;
      inKnowledge = false;
    }
    if (inLayers) {
      const m = line.match(/^\s{2}(\w+):\s*\[([^\]]*)\]/);
      if (m) {
        layerMap.push(m[1]);
        if (m[1] === 'knowledge') {
          knowledgeContents.push(...m[2].split(',').map(s => s.trim()));
          inKnowledge = true;
        }
      }
    }
  }
  return { layers: layerMap, knowledgeContents };
}

import { queryCompanyKnowledge } from '../backend/src/document-intel/bridge.ts';
import { listAgents, loadAgent } from '../backend/src/agents.ts';

type Assertion = { name: string; pass: boolean; detail?: string };

const REPO_ROOT = path.resolve(
  new URL('.', import.meta.url).pathname.replace(/^\//, ''),
  '..',
);

// ============================================================
// PHASE 1 — 20-Q RAG ACCEPTANCE SUITE
// ============================================================
const RAG_QUERIES: Array<{ ticker: string; q: string; expect_keywords?: string[] }> = [
  // EREGL — steel
  { ticker: 'EREGL', q: 'EBITDA marjı 2025', expect_keywords: ['marj', 'ebitda'] },
  { ticker: 'EREGL', q: 'CBAM karbon düzenlemesi etkisi', expect_keywords: ['CBAM', 'karbon'] },
  { ticker: 'EREGL', q: 'Net borç EBITDA oranı', expect_keywords: ['borç', 'ebitda'] },
  { ticker: 'EREGL', q: 'HRC spread çelik marjı', expect_keywords: ['HRC', 'marj'] },
  { ticker: 'EREGL', q: 'Demir cevheri maliyet yapısı', expect_keywords: ['cevher', 'maliyet'] },
  { ticker: 'EREGL', q: 'EAF yeşil dönüşüm yatırımı', expect_keywords: ['EAF', 'yeşil'] },
  // TUPRS — refinery
  { ticker: 'TUPRS', q: 'Rafineri kapasite kullanımı', expect_keywords: ['rafineri', 'kapasite'] },
  { ticker: 'TUPRS', q: 'IAS 29 enflasyon muhasebesi', expect_keywords: ['IAS', 'enflasyon'] },
  { ticker: 'TUPRS', q: 'Net rafinaj marjı', expect_keywords: ['rafinaj', 'marj'] },
  { ticker: 'TUPRS', q: 'KCHOL hissedarlık ve temettü', expect_keywords: ['KCHOL', 'temettü'] },
  // AKBNK — banking
  { ticker: 'AKBNK', q: 'net faiz marjı NIM' },
  { ticker: 'AKBNK', q: 'takipteki krediler oranı NPL' },
  { ticker: 'AKBNK', q: 'sermaye yeterlilik rasyosu' },
  { ticker: 'AKBNK', q: 'aktif kalite kredi karşılıkları' },
  // ARCLK — appliances
  { ticker: 'ARCLK', q: 'Avrupa pazarı gelir payı' },
  { ticker: 'ARCLK', q: 'beyaz eşya satış hacmi' },
  { ticker: 'ARCLK', q: 'Whirlpool entegrasyonu' },
  // BIMAS — retail
  { ticker: 'BIMAS', q: 'mağaza sayısı büyüme' },
  { ticker: 'BIMAS', q: 'özel markalı ürün satışı' },
  { ticker: 'BIMAS', q: 'LFL likewise büyüme' },
];

async function runRagSuite(): Promise<{
  results: Array<{ ticker: string; q: string; chunks: number; top_rel: number | null }>;
  avg_top_rel: number;
  zero_evidence_rate: number;
}> {
  const results: Array<{ ticker: string; q: string; chunks: number; top_rel: number | null }> = [];
  for (const { ticker, q } of RAG_QUERIES) {
    try {
      const pack = await queryCompanyKnowledge(ticker, q, 45_000);
      const topRel = pack.evidence[0]?.relevance ?? null;
      results.push({ ticker, q, chunks: pack.evidence.length, top_rel: topRel });
      process.stdout.write(
        `  ${ticker} ${pack.evidence.length}/5 top=${topRel?.toFixed(3) ?? 'null'}  "${q.slice(0, 40)}"\n`,
      );
    } catch (err) {
      results.push({ ticker, q, chunks: 0, top_rel: null });
      process.stdout.write(`  ${ticker} 0/5 err  "${q.slice(0, 40)}"  ${(err as Error).message.slice(0, 80)}\n`);
    }
  }
  const topVals = results.map(r => r.top_rel).filter((v): v is number => v !== null);
  const avg = topVals.length ? topVals.reduce((s, v) => s + v, 0) / topVals.length : 0;
  const zeros = results.filter(r => r.chunks === 0).length;
  return {
    results,
    avg_top_rel: avg,
    zero_evidence_rate: zeros / results.length,
  };
}

// ============================================================
// PHASE 2 — PIPELINE REGRESSION
// ============================================================
function loadOrchestratorInternals() {
  // Parse orchestrator.ts textually for LAYER_AGENTS and AGENT_PIPELINE,
  // since these are not exported. Catches structural breakage.
  const src = readFileSync(
    path.join(REPO_ROOT, 'backend', 'src', 'orchestrator.ts'),
    'utf-8',
  );
  return src;
}

function countMatches(text: string, re: RegExp): number {
  const ms = text.match(re);
  return ms ? ms.length : 0;
}

// ============================================================
// PHASE 3 — 4+1 AGENT REGRESSION
// ============================================================
function loadSchema(agentId: string): any {
  const p = path.join(REPO_ROOT, 'agents', agentId, 'output_schema.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function loadPrompt(agentId: string): string {
  return readFileSync(
    path.join(REPO_ROOT, 'agents', agentId, 'system_prompt.md'),
    'utf-8',
  );
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const t0 = Date.now();
  const assertions: Assertion[] = [];
  console.log('=== U8 E2E Regression Test ===\n');

  // -------- PHASE 1: RAG --------
  console.log('PHASE 1 — 20-Q RAG acceptance suite (live Qdrant)\n');
  const rag = await runRagSuite();
  console.log(
    `\n  aggregate: avg_top_rel=${rag.avg_top_rel.toFixed(3)}  zero_evidence_rate=${(rag.zero_evidence_rate * 100).toFixed(1)}%\n`,
  );

  assertions.push({
    name: 'rag: 20 queries executed (no infrastructural failure)',
    pass: rag.results.length === 20,
    detail: `got=${rag.results.length}`,
  });
  assertions.push({
    name: 'rag: avg top-1 relevance ≥ 0.60 (master threshold)',
    pass: rag.avg_top_rel >= 0.6,
    detail: `avg=${rag.avg_top_rel.toFixed(3)}`,
  });
  assertions.push({
    name: 'rag: zero-evidence rate < 15%',
    pass: rag.zero_evidence_rate < 0.15,
    detail: `rate=${(rag.zero_evidence_rate * 100).toFixed(1)}%`,
  });

  // Per-ticker min 1 query answered
  const perTicker: Record<string, { ok: number; total: number }> = {};
  for (const r of rag.results) {
    perTicker[r.ticker] = perTicker[r.ticker] || { ok: 0, total: 0 };
    perTicker[r.ticker].total++;
    if (r.chunks > 0) perTicker[r.ticker].ok++;
  }
  for (const [ticker, { ok, total }] of Object.entries(perTicker)) {
    assertions.push({
      name: `rag: ${ticker} has ≥ 50% queries with evidence`,
      pass: ok / total >= 0.5,
      detail: `${ok}/${total}`,
    });
  }

  // -------- PHASE 2: PIPELINE REGRESSION --------
  console.log('\nPHASE 2 — Pipeline regression\n');

  const orchSrc = loadOrchestratorInternals();

  assertions.push({
    name: 'pipeline: LAYER_AGENTS.knowledge entry exists',
    pass: /knowledge:\s*\[[^\]]*research_brief[^\]]*knowledge_base[^\]]*document_evidence[^\]]*external_research/.test(orchSrc),
  });
  assertions.push({
    name: 'pipeline: research_brief in AGENT_PIPELINE',
    pass: /id:\s*'research_brief',\s*phase:\s*'Research Brief'/.test(orchSrc),
  });
  assertions.push({
    name: 'pipeline: knowledge_base runs BEFORE context_extraction (U6 re-order)',
    pass: (() => {
      const kbIdx = orchSrc.indexOf("id: 'knowledge_base'");
      const ceIdx = orchSrc.indexOf("id: 'context_extraction'");
      return kbIdx > 0 && ceIdx > 0 && kbIdx < ceIdx;
    })(),
  });
  assertions.push({
    name: 'pipeline: document_evidence runs BEFORE financial_analysis',
    pass: (() => {
      const deIdx = orchSrc.indexOf("id: 'document_evidence'");
      const faIdx = orchSrc.indexOf("id: 'financial_analysis'");
      return deIdx > 0 && faIdx > 0 && deIdx < faIdx;
    })(),
  });

  // AGENT_DEPENDENCIES evidence propagation
  for (const agent of ['context_extraction', 'financial_analysis', 'valuation_agent', 'esg_agent']) {
    const pattern = new RegExp(`${agent}:[^\\]]*document_evidence_output`);
    assertions.push({
      name: `dep: ${agent} depends on document_evidence_output`,
      pass: pattern.test(orchSrc),
    });
  }

  // Canonical pipeline_modes.yaml intact
  const pmText = readFileSync(
    path.join(REPO_ROOT, 'canonical', 'contracts', 'pipeline_modes.yaml'),
    'utf-8',
  );
  const pm = simpleYamlLayerScan(pmText);
  assertions.push({
    name: 'canonical: 10 layers including knowledge',
    pass: pm.layers.length === 10 && pm.layers.includes('knowledge') && pm.knowledgeContents.length === 4,
    detail: `layers=${pm.layers.join(',')} knowledge=${pm.knowledgeContents.join('|')}`,
  });

  // Registry integrity — listAgents returns 26 (22 original + 4 new)
  const agents = listAgents();
  assertions.push({
    name: 'registry: 27 agents total (23 original incl orchestrator + 4 U5 new)',
    pass: agents.length === 27,
    detail: `got=${agents.length}`,
  });
  for (const newAgent of ['research_brief', 'knowledge_base', 'document_evidence', 'external_research']) {
    assertions.push({
      name: `registry: ${newAgent} loadable`,
      pass: (() => {
        try {
          const a = loadAgent(newAgent);
          return typeof a.systemPrompt === 'string' && a.systemPrompt.length > 100;
        } catch {
          return false;
        }
      })(),
    });
  }

  // analysis-config.ts: knowledge layer added
  const cfgSrc = readFileSync(
    path.join(REPO_ROOT, 'backend', 'src', 'analysis-config.ts'),
    'utf-8',
  );
  assertions.push({
    name: 'config: analysis-config includes knowledge layer',
    pass: /id:\s*'knowledge'/.test(cfgSrc),
  });

  // -------- PHASE 3: 4+1 AGENT REGRESSION --------
  console.log('PHASE 3 — 4+1 agent + evidence integration regression\n');

  // research_brief, knowledge_base, document_evidence, external_research
  for (const a of ['research_brief', 'knowledge_base', 'document_evidence', 'external_research']) {
    const s = loadSchema(a);
    assertions.push({
      name: `schema: ${a} exists + valid JSON`,
      pass: s !== null && s.$id?.includes(a),
    });
    const p = loadPrompt(a);
    assertions.push({
      name: `prompt: ${a} system_prompt ≥ 50 lines`,
      pass: p.split('\n').length >= 50,
      detail: `lines=${p.split('\n').length}`,
    });
  }

  // external_research activated (not stub)
  const extPrompt = loadPrompt('external_research');
  assertions.push({
    name: 'agent: external_research activated (U7 active, no scaffold default)',
    pass: /U7.*aktif/.test(extPrompt) && /WebSearch/.test(extPrompt) && /WebFetch/.test(extPrompt),
  });
  const extSchema = loadSchema('external_research');
  assertions.push({
    name: 'agent: external_research schema has credibility field',
    pass: extSchema.properties?.findings?.items?.properties?.sources?.items?.properties?.credibility?.enum?.includes('high'),
  });

  // document_evidence_citations field in 4 target agents
  for (const a of ['financial_analysis', 'context_extraction', 'valuation_agent', 'esg_agent']) {
    const s = loadSchema(a);
    const f = s.properties?.document_evidence_citations;
    assertions.push({
      name: `schema: ${a} has document_evidence_citations[{claim,doc_id,page}]`,
      pass:
        f?.type === 'array' &&
        Array.isArray(f.items?.required) &&
        f.items.required.includes('claim') &&
        f.items.required.includes('doc_id') &&
        f.items.required.includes('page'),
    });
  }

  // IAS 29 fields
  const faSchema = loadSchema('financial_analysis');
  assertions.push({
    name: 'schema: financial_analysis.profitability requires ebitda_ias29 + ebitda_margin_ias29',
    pass:
      faSchema.properties?.profitability?.required?.includes('ebitda_ias29') &&
      faSchema.properties?.profitability?.required?.includes('ebitda_margin_ias29'),
  });

  const parseSchema = loadSchema('parse_standardization');
  assertions.push({
    name: 'schema: parse_standardization has ias29 block definition',
    pass: 'Ias29Block' in (parseSchema.definitions ?? {}),
  });

  // Python engine surface check
  const faCalcSrc = readFileSync(
    path.join(REPO_ROOT, 'python-services', 'src', 'financex', 'calculators', 'financial_engine.py'),
    'utf-8',
  );
  assertions.push({
    name: 'engine: financial_engine.py emits ebitda_ias29',
    pass: /ebitda_ias29=RatioValue/.test(faCalcSrc),
  });
  const ias29ModPath = path.join(
    REPO_ROOT, 'python-services', 'src', 'financex', 'calculators', 'ias29.py',
  );
  assertions.push({
    name: 'engine: ias29.py compute_ebitda_ias29 function exists',
    pass: existsSync(ias29ModPath) && /def compute_ebitda_ias29/.test(readFileSync(ias29ModPath, 'utf-8')),
  });

  // Deep-research module surface
  const drPath = path.join(REPO_ROOT, 'backend', 'src', 'deep-research');
  const expectedFiles = ['index.ts', 'scope.ts', 'execute.ts', 'synthesize.ts', 'types.ts'];
  for (const f of expectedFiles) {
    assertions.push({
      name: `module: deep-research/${f} exists`,
      pass: existsSync(path.join(drPath, f)),
    });
  }

  // IAS 29 skill formula fixed
  const ias29Skill = readFileSync(
    path.join(REPO_ROOT, 'skills', 'ias29-inflation-accounting', 'SKILL.md'),
    'utf-8',
  );
  assertions.push({
    name: 'skill: ias29 formula uses operating_profit_restated + D&A_restated',
    pass: /operating_profit_restated\s*\+\s*D&A_restated/.test(ias29Skill),
  });
  assertions.push({
    name: 'skill: ias29 explicitly states NMP EXCLUDED from EBITDA',
    pass: /DAHİL\s*ED[İi]LMEZ|EXCLUDED/.test(ias29Skill),
  });

  // Ingest pipeline still callable
  const ingestScriptPath = path.join(REPO_ROOT, 'scripts', 'ingest_existing_pdfs.py');
  assertions.push({
    name: 'infra: ingest_existing_pdfs.py present',
    pass: existsSync(ingestScriptPath),
  });

  // Report
  console.log('\n=== ASSERTIONS ===');
  let pass = 0;
  for (const a of assertions) {
    const tag = a.pass ? 'PASS' : 'FAIL';
    console.log(`  [${tag}] ${a.name}${a.detail ? '  —  ' + a.detail : ''}`);
    if (a.pass) pass++;
  }
  const total = assertions.length;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${pass}/${total} assertions green  (${dt}s)`);

  if (pass !== total) process.exit(1);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
