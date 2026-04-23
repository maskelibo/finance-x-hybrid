import fs from 'node:fs';
import path from 'node:path';
import { AGENTS_ROOT } from './config.js';

export type AgentDef = {
  id: string;
  displayName: string;
  group: 'management' | 'specialist' | 'event';
  systemPrompt: string;
  memoryPath: string;
};

const AGENT_REGISTRY: Array<Pick<AgentDef, 'id' | 'displayName' | 'group'>> = [
  { id: 'ceo', displayName: 'CEO Meta-Ajan', group: 'management' },
  { id: 'coo', displayName: 'COO Operasyonel Kontrol', group: 'management' },
  { id: 'orchestrator', displayName: 'Orkestratör', group: 'management' },
  { id: 'qa_review', displayName: 'Kalite Kontrol', group: 'management' },
  { id: 'data_collection', displayName: 'Veri Toplama', group: 'specialist' },
  { id: 'parse_standardization', displayName: 'Belge Ayrıştırma', group: 'specialist' },
  { id: 'reconciliation', displayName: 'Veri Doğrulama', group: 'specialist' },
  { id: 'context_extraction', displayName: 'Bağlam Çıkarma', group: 'specialist' },
  { id: 'financial_analysis', displayName: 'Finansal Analiz', group: 'specialist' },
  { id: 'sector_competition', displayName: 'Sektör & Rekabet', group: 'specialist' },
  { id: 'macro_analysis', displayName: 'Makro Analiz', group: 'specialist' },
  { id: 'technical_analysis', displayName: 'Teknik Analiz', group: 'specialist' },
  { id: 'strategic_synthesis', displayName: 'Stratejik Sentez', group: 'specialist' },
  { id: 'final_summary', displayName: 'Son Rapor', group: 'specialist' },
  { id: 'kap_watch', displayName: 'KAP İzleme', group: 'event' },
  { id: 'event_classification', displayName: 'Olay Sınıflandırma', group: 'event' },
  { id: 'event_impact_mapper', displayName: 'Etki Haritalama', group: 'event' },
  { id: 'event_timeline_alert', displayName: 'Olay Zaman Çizelgesi', group: 'event' },
  { id: 'report_formatter', displayName: 'Rapor Formatlama', group: 'specialist' },
  { id: 'valuation_agent', displayName: 'Değerleme Analizi', group: 'specialist' },
  { id: 'sentiment_news_agent', displayName: 'Haber & Sentiment', group: 'specialist' },
  { id: 'analyst_consensus_agent', displayName: 'Analist Konsensüs', group: 'specialist' },
  { id: 'esg_agent', displayName: 'ESG Analizi', group: 'specialist' },
  { id: 'research_brief', displayName: 'Araştırma Planı', group: 'specialist' },
  { id: 'knowledge_base', displayName: 'Bilgi Tabanı (RAG)', group: 'specialist' },
  { id: 'document_evidence', displayName: 'Doküman Kanıtı', group: 'specialist' },
  { id: 'external_research', displayName: 'Dış Kaynak Araştırma', group: 'specialist' },
];

export function loadAgent(agentId: string): AgentDef {
  const meta = AGENT_REGISTRY.find(a => a.id === agentId);
  if (!meta) throw new Error(`Unknown agent: ${agentId}`);

  const promptPath = path.join(AGENTS_ROOT, agentId, 'system_prompt.md');
  let systemPrompt = '';
  try {
    systemPrompt = fs.readFileSync(promptPath, 'utf8');
  } catch {
    systemPrompt = `You are the ${meta.displayName} agent in the Finance X autonomous financial analysis platform.`;
  }

  const memoryPath = path.join(AGENTS_ROOT, agentId, 'memory.md');

  return { ...meta, systemPrompt, memoryPath };
}

export function listAgents(): AgentDef[] {
  return AGENT_REGISTRY.map(meta => loadAgent(meta.id));
}

export function getAgentMeta(agentId: string) {
  return AGENT_REGISTRY.find(a => a.id === agentId);
}
