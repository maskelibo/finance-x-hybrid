export type AgentStatus = 'aktif' | 'bekliyor' | 'calisiyor' | 'hata'

export type AgentGroup = 'Yönetim' | 'Uzman' | 'KAP Ekibi'

export interface Agent {
  id: string
  name: string
  displayName: string
  group: AgentGroup
  status: AgentStatus
  lastRun: string | null
  capabilities: string[]
  description: string
  inputSchema: string[]
  outputSchema: string[]
  estimatedDuration: string
  model: string
}

export type AnalysisMode = 'fast_screening' | 'standard_institutional' | 'deep_dive'

export interface AnalysisLayer {
  id: string
  label: string
  checked: boolean
}

export interface Task {
  id: string
  agentId: string
  agentName: string
  type: string
  company: string
  status: 'aktif' | 'tamamlandi' | 'basarisiz' | 'bekliyor'
  duration: string | null
  createdAt: string
}

export interface KapEvent {
  id: string
  date: string
  company: string
  eventType: string
  title: string
  impact: 'pozitif' | 'negatif' | 'nötr'
  confidence: number
}

export interface Report {
  id: string
  date: string
  company: string
  reportType: string
  mode: string
  confidence: number
  status: 'tamamlandi' | 'isleniyor' | 'basarisiz'
}

export interface CostEntry {
  id: string
  agentName: string
  tokens: number
  usd: number
  date: string
}

export interface StatCardData {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  change?: string
}
