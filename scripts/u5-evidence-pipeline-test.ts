/**
 * U5 acceptance — evidence-driven pipeline canlı test.
 *
 * Amaç: research_brief → knowledge_base (canlı Qdrant) → document_evidence
 * zincirini registry + pipeline wiring üzerinden doğrula.
 *
 * Bu script LLM spawn etmez — deterministic bir research_brief çıktısı ile
 * Node bridge'i çağırır (knowledge_base davranışını simüle eder) ve
 * document_evidence için girdi kalitesini ölçer. U6'da gerçek LLM agent
 * çağrısı devreye alınır.
 *
 * Çalıştır: npx tsx scripts/u5-evidence-pipeline-test.ts
 */
import { queryCompanyKnowledge, formatEvidenceForAgent, type EvidencePack } from '../backend/src/document-intel/bridge.ts';

type Assertion = { name: string; pass: boolean; detail?: string };

// ----- Deterministic research_brief output (simulated) -----
const RESEARCH_BRIEF = {
  agent_id: 'research_brief',
  ticker: 'EREGL',
  research_objective:
    'EREGL 2024-2025 kârlılık daralması, CBAM maliyet riski ve net borç durumu için evidence toplama.',
  sector_context: 'steel_manufacturing',
  priority_topics: [
    { topic: 'profitability_trend', rationale: 'Brüt marj daralması', evidence_need: 'rag', priority: 'high' },
    { topic: 'leverage', rationale: 'Net borç / EBITDA izlemesi', evidence_need: 'rag', priority: 'high' },
    { topic: 'carbon_regulation', rationale: 'CBAM 2026 etkisi', evidence_need: 'rag+external', priority: 'medium' },
  ],
  sub_questions: [
    "EREGL'in 2025 EBITDA marjı ve trendi nedir?",
    'HRC spread ve çelik marjı 2025',
    "Net borç EBITDA oranı 2025",
    'CBAM karbon düzenlemesi etkisi',
    'Demir cevheri maliyet yapısı',
  ],
  external_research_scope: ['CBAM 2026 uygulama timeline'],
  warnings: [],
  confidence_overall: 'HIGH',
} as const;

// ----- Simulated knowledge_base: calls bridge for each sub_question -----
async function simulateKnowledgeBase(
  ticker: string,
  subQuestions: readonly string[],
): Promise<{
  evidence_by_question: Array<{ sub_question: string; chunks_retrieved: number; top_relevance: number | null; evidence: EvidencePack['evidence'] }>;
  aggregate_metrics: { total_chunks: number; avg_top_relevance: number; questions_with_zero_evidence: number };
}> {
  const byQ: Array<{ sub_question: string; chunks_retrieved: number; top_relevance: number | null; evidence: EvidencePack['evidence'] }> = [];
  for (const q of subQuestions) {
    try {
      const pack = await queryCompanyKnowledge(ticker, q, 60_000);
      // filter noise + dedupe
      const clean = pack.evidence.filter(e => e.relevance >= 0.5);
      const dedupeKey = (e: EvidencePack['evidence'][number]) => `${e.doc_id}|${e.page}`;
      const seen = new Set<string>();
      const deduped = clean.filter(e => {
        const k = dedupeKey(e);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      byQ.push({
        sub_question: q,
        chunks_retrieved: deduped.length,
        top_relevance: deduped[0]?.relevance ?? null,
        evidence: deduped.slice(0, 5),
      });
    } catch (err) {
      byQ.push({ sub_question: q, chunks_retrieved: 0, top_relevance: null, evidence: [] });
      console.error(`  ! bridge error for "${q}": ${(err as Error).message.slice(0, 200)}`);
    }
  }
  const topVals = byQ.map(x => x.top_relevance).filter((v): v is number => v !== null);
  const total = byQ.reduce((s, x) => s + x.chunks_retrieved, 0);
  const avgTop = topVals.length ? topVals.reduce((s, v) => s + v, 0) / topVals.length : 0;
  const zeros = byQ.filter(x => x.chunks_retrieved === 0).length;
  return {
    evidence_by_question: byQ,
    aggregate_metrics: { total_chunks: total, avg_top_relevance: avgTop, questions_with_zero_evidence: zeros },
  };
}

// ----- Main -----
async function main() {
  const t0 = Date.now();
  const assertions: Assertion[] = [];

  console.log('=== U5 Evidence Pipeline Test — EREGL ===\n');

  // Phase 1 — research_brief structure check
  assertions.push({
    name: 'research_brief: ≥3 sub_questions',
    pass: RESEARCH_BRIEF.sub_questions.length >= 3,
    detail: `got ${RESEARCH_BRIEF.sub_questions.length}`,
  });
  assertions.push({
    name: 'research_brief: priority_topics non-empty',
    pass: RESEARCH_BRIEF.priority_topics.length >= 2,
    detail: `got ${RESEARCH_BRIEF.priority_topics.length}`,
  });

  // Phase 2 — knowledge_base canlı Qdrant retrieval
  console.log('> knowledge_base: simulate retrieval for 5 sub_questions on EREGL\n');
  const kb = await simulateKnowledgeBase(RESEARCH_BRIEF.ticker, RESEARCH_BRIEF.sub_questions);
  for (const q of kb.evidence_by_question) {
    const top = q.top_relevance?.toFixed(3) ?? 'null';
    console.log(`  ${q.chunks_retrieved}/5  top=${top}  "${q.sub_question}"`);
  }
  console.log(
    `\n  aggregate: total=${kb.aggregate_metrics.total_chunks} avg_top=${kb.aggregate_metrics.avg_top_relevance.toFixed(3)} zero=${kb.aggregate_metrics.questions_with_zero_evidence}\n`,
  );

  assertions.push({
    name: 'knowledge_base: no sub_question returns zero evidence',
    pass: kb.aggregate_metrics.questions_with_zero_evidence === 0,
    detail: `zero=${kb.aggregate_metrics.questions_with_zero_evidence}`,
  });
  assertions.push({
    name: 'knowledge_base: avg_top_relevance ≥ 0.80',
    pass: kb.aggregate_metrics.avg_top_relevance >= 0.8,
    detail: `avg=${kb.aggregate_metrics.avg_top_relevance.toFixed(3)}`,
  });
  assertions.push({
    name: 'knowledge_base: ≥15 total chunks across 5 Qs',
    pass: kb.aggregate_metrics.total_chunks >= 15,
    detail: `total=${kb.aggregate_metrics.total_chunks}`,
  });

  // Phase 3 — document_evidence sanity: every priority_topic has ≥1 supporting chunk
  const topicsCovered = RESEARCH_BRIEF.priority_topics.map(pt => {
    const relatedQ = kb.evidence_by_question.filter(q => {
      const ql = q.sub_question.toLowerCase();
      if (pt.topic === 'profitability_trend') return ql.includes('ebitda') || ql.includes('marj');
      if (pt.topic === 'leverage') return ql.includes('borç') || ql.includes('borc');
      if (pt.topic === 'carbon_regulation') return ql.includes('cbam') || ql.includes('karbon');
      return false;
    });
    const chunks = relatedQ.reduce((s, q) => s + q.chunks_retrieved, 0);
    return { topic: pt.topic, priority: pt.priority, chunks };
  });
  for (const c of topicsCovered) {
    console.log(`  topic=${c.topic}  priority=${c.priority}  chunks=${c.chunks}`);
  }
  assertions.push({
    name: 'document_evidence: all high-priority topics ≥1 chunk',
    pass: topicsCovered.filter(c => c.priority === 'high').every(c => c.chunks >= 1),
    detail: JSON.stringify(topicsCovered),
  });

  // Phase 4 — formatEvidenceForAgent produces usable context
  const firstPack: EvidencePack = {
    ticker: 'EREGL',
    query: kb.evidence_by_question[0].sub_question,
    total_retrieved: kb.evidence_by_question[0].chunks_retrieved,
    evidence: kb.evidence_by_question[0].evidence,
  };
  const formatted = formatEvidenceForAgent(firstPack, 4000);
  assertions.push({
    name: 'formatEvidenceForAgent: non-empty output',
    pass: formatted.length > 200,
    detail: `len=${formatted.length}`,
  });
  assertions.push({
    name: 'formatEvidenceForAgent: includes page citation',
    pass: /p\.\d+/.test(formatted),
    detail: formatted.slice(0, 120),
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
