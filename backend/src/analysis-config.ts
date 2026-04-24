export const ANALYSIS_LAYERS = [
  { id: 'fundamental', label: 'Temel Analiz' },
  { id: 'technical', label: 'Teknik Analiz' },
  { id: 'events', label: 'KAP Olay Istihbarati' },
  { id: 'sector', label: 'Sektor ve Rekabet' },
  { id: 'macro', label: 'Makro Analiz' },
  { id: 'valuation', label: 'Degerleme' },
  { id: 'sentiment', label: 'Duygu Analizi' },
  { id: 'consensus', label: 'Analist Konsensusu' },
  { id: 'esg', label: 'ESG Analizi' },
  { id: 'knowledge', label: 'Bilgi Tabani (RAG + External)' },
] as const;

export const ANALYSIS_MODES = [
  { id: 'fast_screening', label: 'Hizli Tarama' },
  { id: 'standard_institutional', label: 'Kurumsal Analiz' },
  { id: 'deep_dive', label: 'Derin Analiz' },
] as const;

export type RuntimeMode = (typeof ANALYSIS_MODES)[number]['id'];
export type AnalysisLayer = (typeof ANALYSIS_LAYERS)[number]['id'];

export const VALID_RUNTIME_MODES = new Set<RuntimeMode>(
  ANALYSIS_MODES.map((mode) => mode.id),
);

export const VALID_ANALYSIS_LAYERS = new Set<AnalysisLayer>(
  ANALYSIS_LAYERS.map((layer) => layer.id),
);

export const MODE_DEFAULT_LAYERS: Record<RuntimeMode, AnalysisLayer[]> = {
  fast_screening: ['fundamental', 'technical', 'events'],
  standard_institutional: ['fundamental', 'technical', 'events', 'sector', 'macro', 'knowledge'],
  deep_dive: ANALYSIS_LAYERS.map((layer) => layer.id),
};
