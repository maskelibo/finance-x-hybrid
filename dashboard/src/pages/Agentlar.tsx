import React, { useEffect, useState } from 'react'
import {
  Bot,
  X,
  Clock,
  Zap,
  Cpu,
  ArrowRight,
  Shield,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { Agent } from '../types'
import { agents, agentGroupColors } from '../data/agents'
import AgentCard from '../components/AgentCard'
import StatusBadge from '../components/StatusBadge'
import { api, getApiBaseUrl } from '../api'

const tabs: { label: string; value: string }[] = [
  { label: 'Tümü', value: 'Tümü' },
  { label: 'Yönetim', value: 'Yönetim' },
  { label: 'Uzman', value: 'Uzman' },
  { label: 'KAP Ekibi', value: 'KAP Ekibi' },
]

// Dashboard'daki statik ID'ler (tire ile) backend ID'lerine (alt çizgi ile) normalize edilir.
const idAliases: Record<string, string> = {
  'ceo-meta-agent': 'ceo',
  'cost-optimizer': 'cost_performance_optimizer',
}
const toBackendId = (uiId: string): string => idAliases[uiId] ?? uiId.replace(/-/g, '_')

const AgentDetailModal: React.FC<{ agent: Agent; onClose: () => void }> = ({ agent, onClose }) => {
  const [tab, setTab] = useState<'info' | 'prompt'>('info')
  const [promptText, setPromptText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tab === 'prompt' && !promptText) {
      setLoading(true)
      api.getAgent(toBackendId(agent.id))
        .then((res) => setPromptText(res.systemPrompt || 'Bu agent için henüz system prompt yazılmamış.'))
        .catch((err) => setPromptText(`Yüklenemedi: ${err.message}\n\nBackend çalışıyor mu? (${getApiBaseUrl()})`))
        .finally(() => setLoading(false))
    }
  }, [tab, agent.id])

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#2d3148]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{agent.displayName}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{agent.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={agent.status} size="md" />
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${agentGroupColors[agent.group]}`}>
                  {agent.group}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#222537] text-slate-500 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-[#2d3148]">
          <button
            onClick={() => setTab('info')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              tab === 'info'
                ? 'text-blue-400 border-b-2 border-blue-500 -mb-px'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Bilgi
          </button>
          <button
            onClick={() => setTab('prompt')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
              tab === 'prompt'
                ? 'text-blue-400 border-b-2 border-blue-500 -mb-px'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            System Prompt
          </button>
        </div>

        {tab === 'prompt' ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">
                Bu agentın tam LLM sistem promptu (agents/{agent.id}/system_prompt.md)
              </p>
              <button
                onClick={copyPrompt}
                disabled={!promptText}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#0f1117] border border-[#2d3148] px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Kopyala
                  </>
                )}
              </button>
            </div>
            {loading ? (
              <div className="bg-[#0a0c12] border border-[#2d3148] rounded-lg p-8 text-center text-slate-500 text-sm">
                Yükleniyor...
              </div>
            ) : (
              <pre className="bg-[#0a0c12] border border-[#2d3148] rounded-lg p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-[60vh] font-mono leading-relaxed">
                {promptText}
              </pre>
            )}
          </div>
        ) : (
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Açıklama</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{agent.description}</p>
          </div>

          {/* Model & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</span>
              </div>
              <p className="text-slate-200 font-semibold text-sm">{agent.model}</p>
            </div>
            <div className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Süre</span>
              </div>
              <p className="text-slate-200 font-semibold text-sm">{agent.estimatedDuration}</p>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Yetenekler</h3>
            <div className="grid grid-cols-1 gap-2">
              {agent.capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input/Output */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 rotate-180 text-green-400" />
                Girdi
              </h3>
              <div className="space-y-1.5">
                {agent.inputSchema.map((inp) => (
                  <div key={inp} className="bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-green-400">{inp}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                Çıktı
              </h3>
              <div className="space-y-1.5">
                {agent.outputSchema.map((out) => (
                  <div key={out} className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-blue-400">{out}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Last Run */}
          <div className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">
              Son çalışma: {agent.lastRun ?? 'Henüz çalışmadı'}
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

function formatLastRun(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'az önce'
    if (diffMin < 60) return `${diffMin} dk önce`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} sa önce`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay} gün önce`
    return d.toLocaleDateString('tr-TR')
  } catch {
    return iso
  }
}

const Agentlar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Tümü')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [liveRuns, setLiveRuns] = useState<Record<string, { lastRunAt: string | null; totalRuns: number }>>({})

  useEffect(() => {
    let cancelled = false
    const load = () => {
      api.listAgents()
        .then((res) => {
          if (cancelled) return
          const map: Record<string, { lastRunAt: string | null; totalRuns: number }> = {}
          for (const a of res.agents) {
            map[a.id] = { lastRunAt: a.lastRunAt, totalRuns: a.totalRuns }
          }
          setLiveRuns(map)
        })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const mergedAgents: Agent[] = agents.map((a) => {
    const live = liveRuns[toBackendId(a.id)]
    if (!live) return a
    return { ...a, lastRun: formatLastRun(live.lastRunAt) }
  })

  const filteredAgents = activeTab === 'Tümü'
    ? mergedAgents
    : mergedAgents.filter((a) => a.group === activeTab)

  const groupCounts = {
    Tümü: mergedAgents.length,
    Yönetim: mergedAgents.filter((a) => a.group === 'Yönetim').length,
    Uzman: mergedAgents.filter((a) => a.group === 'Uzman').length,
    'KAP Ekibi': mergedAgents.filter((a) => a.group === 'KAP Ekibi').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Agentlar</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          {agents.length} otonom ajan — analiz sürecinizin her adımını yürütür
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Ajan', value: agents.length, color: 'text-slate-300' },
          {
            label: 'Aktif',
            value: agents.filter((a) => a.status === 'aktif').length,
            color: 'text-green-400',
          },
          {
            label: 'Bekliyor',
            value: agents.filter((a) => a.status === 'bekliyor').length,
            color: 'text-yellow-400',
          },
          { label: 'Hata', value: 0, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-600" />
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`tab-btn flex items-center gap-2 ${
              activeTab === tab.value ? 'tab-btn-active' : 'tab-btn-inactive'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-[#222537] text-slate-500'
              }`}
            >
              {groupCounts[tab.value as keyof typeof groupCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onClick={setSelectedAgent} />
        ))}
      </div>

      {/* Modal */}
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}

export default Agentlar
