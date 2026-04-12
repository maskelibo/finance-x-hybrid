import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingDown, BarChart2, Info, Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { api } from '../api'

type AgentCost = {
  agent_id: string
  agent_display_name: string
  runs: number
  total_cost: number
  total_tokens: number
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; payload: AgentCost }>; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[#1a1d27] border border-[#2d3148] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-blue-400">${d.total_cost.toFixed(4)}</p>
        <p className="text-[10px] text-slate-500">{d.total_tokens.toLocaleString('tr-TR')} token • {d.runs} çalışma</p>
      </div>
    )
  }
  return null
}

const Maliyetler: React.FC = () => {
  const [byAgent, setByAgent] = useState<AgentCost[]>([])
  const [stats, setStats] = useState({ totalAnalyses: 0, totalCostUsd: 0, totalTokens: 0 })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [c, o] = await Promise.all([
        api.statsCosts(),
        api.statsOverview(),
      ])
      setByAgent(c.byAgent)
      setStats({
        totalAnalyses: o.totalAnalyses,
        totalCostUsd: o.totalCostUsd,
        totalTokens: o.totalTokens,
      })
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 10000)
    return () => clearInterval(i)
  }, [])

  const avgCost = stats.totalAnalyses > 0 ? stats.totalCostUsd / stats.totalAnalyses : 0
  const chartData = byAgent.slice(0, 10).map(a => ({
    ...a,
    name: a.agent_display_name.split(' ').slice(0, 2).join(' '),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Maliyetler</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Ajan token kullanımı ve API maliyet takibi
        </p>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam Maliyet', value: `$${stats.totalCostUsd.toFixed(4)}`, sub: `${stats.totalAnalyses} analiz`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Toplam Token', value: stats.totalTokens.toLocaleString('tr-TR'), sub: 'Giriş + Çıkış', icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Ort. Analiz Maliyeti', value: `$${avgCost.toFixed(4)}`, sub: 'Analiz başına', icon: TrendingDown, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-2">{c.label}</p>
                <p className="text-3xl font-bold text-slate-100">{c.value}</p>
                <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
              </div>
              <div className={`p-3 rounded-xl border ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-slate-200">Ajan Bazında Maliyet Dağılımı</h2>
          </div>
          <span className="text-xs text-slate-500">USD cinsinden</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-600">
            <BarChart2 className="w-10 h-10 mb-3" />
            <p className="text-sm">Henüz maliyet verisi yok</p>
            <p className="text-xs mt-1">Analiz çalıştırıldıkça veri birikecek</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_cost" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" opacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Model Dagılımı — Haiku vs Sonnet */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-slate-200">Model Bazında Maliyet Dağılımı</h2>
          </div>
          <span className="text-xs text-slate-500">Haiku vs Sonnet vs Opus</span>
        </div>
        <div className="p-6">
          {byAgent.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Henüz veri yok</p>
          ) : (
            (() => {
              // Agent model eslesmesi (agents.ts'deki bilgilere gore)
              const haikuAgents = ['agent-factory', 'cost-optimizer', 'data-collection', 'technical-analysis', 'kap-watch', 'event-classification', 'event-timeline-alert']
              const haikuIds = new Set(haikuAgents.map(id => id.replace(/-/g, '_')))

              const haikuCost = byAgent.filter(a => haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.total_cost, 0)
              const haikuTokens = byAgent.filter(a => haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.total_tokens, 0)
              const haikuRuns = byAgent.filter(a => haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.runs, 0)

              const sonnetCost = byAgent.filter(a => !haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.total_cost, 0)
              const sonnetTokens = byAgent.filter(a => !haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.total_tokens, 0)
              const sonnetRuns = byAgent.filter(a => !haikuIds.has(a.agent_id)).reduce((sum, a) => sum + a.runs, 0)

              const totalCost = haikuCost + sonnetCost || 1
              const haikuPct = ((haikuCost / totalCost) * 100).toFixed(1)
              const sonnetPct = ((sonnetCost / totalCost) * 100).toFixed(1)

              return (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="h-4 rounded-full overflow-hidden flex bg-[#0f1117] border border-[#2d3148]">
                    <div
                      className="bg-cyan-500 transition-all duration-500"
                      style={{ width: `${haikuPct}%` }}
                      title={`Haiku: ${haikuPct}%`}
                    />
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${sonnetPct}%` }}
                      title={`Sonnet: ${sonnetPct}%`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-500" />
                        <span className="text-sm font-semibold text-cyan-400">Haiku</span>
                        <span className="text-xs text-slate-500 ml-auto">{haikuPct}%</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between"><span>Maliyet</span><span className="text-slate-200 font-mono">${haikuCost.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span>Token</span><span className="text-slate-200">{haikuTokens.toLocaleString('tr-TR')}</span></div>
                        <div className="flex justify-between"><span>Calisma</span><span className="text-slate-200">{haikuRuns}</span></div>
                      </div>
                    </div>
                    <div className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-semibold text-blue-400">Sonnet</span>
                        <span className="text-xs text-slate-500 ml-auto">{sonnetPct}%</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between"><span>Maliyet</span><span className="text-slate-200 font-mono">${sonnetCost.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span>Token</span><span className="text-slate-200">{sonnetTokens.toLocaleString('tr-TR')}</span></div>
                        <div className="flex justify-between"><span>Calisma</span><span className="text-slate-200">{sonnetRuns}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      </div>

      {/* Usage Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-slate-200">Maliyet Detayı</h2>
          </div>
          <span className="text-xs text-slate-500">Ajan bazında</span>
        </div>

        <div className="grid grid-cols-5 border-b border-[#2d3148] bg-[#13162299]">
          <div className="table-header">Ajan</div>
          <div className="table-header">Model</div>
          <div className="table-header">Çalışma</div>
          <div className="table-header">Token</div>
          <div className="table-header">USD</div>
        </div>

        {byAgent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6">
            <div className="w-12 h-12 rounded-xl bg-[#222537] border border-[#2d3148] flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">Henüz maliyet verisi yok</p>
            <p className="text-slate-600 text-sm">İlk analizinizi başlattığınızda detaylar burada görünür</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2d3148]">
            {byAgent.map((a) => {
              const haikuIds = new Set(['agent_factory', 'cost_performance_optimizer', 'data_collection', 'technical_analysis', 'kap_watch', 'event_classification', 'event_timeline_alert'])
              const modelName = haikuIds.has(a.agent_id) ? 'Haiku' : 'Sonnet'
              const modelColor = haikuIds.has(a.agent_id) ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
              return (
                <div key={a.agent_id} className="grid grid-cols-5 px-6 py-3 items-center hover:bg-[#0f1117]/50 transition-colors text-sm">
                  <span className="font-medium text-slate-200">{a.agent_display_name}</span>
                  <span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${modelColor}`}>
                      {modelName}
                    </span>
                  </span>
                  <span className="text-slate-400">{a.runs}</span>
                  <span className="text-slate-400">{a.total_tokens.toLocaleString('tr-TR')}</span>
                  <span className="font-mono text-blue-400">${a.total_cost.toFixed(4)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Model Pricing Info */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-slate-200 text-sm">Model Fiyatlandırması</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { model: 'claude-sonnet-4-5', input: '$3.00', output: '$15.00', desc: 'Tüm agentlar (Max plan ile ücretsiz)' },
            { model: 'claude-haiku-4-5', input: '$1.00', output: '$5.00', desc: 'Hızlı/basit görevler için opsiyonel' },
            { model: 'claude-opus-4-6', input: '$15.00', output: '$75.00', desc: 'Max plan ile ücretsiz, daha yavaş' },
          ].map((m) => (
            <div key={m.model} className="bg-[#0f1117] border border-[#2d3148] rounded-xl p-4">
              <p className="font-mono text-xs text-blue-400 font-semibold mb-2">{m.model}</p>
              <div className="space-y-1 text-xs text-slate-500 mb-2">
                <div className="flex justify-between">
                  <span>Giriş / 1M token</span>
                  <span className="text-slate-300 font-medium">{m.input}</span>
                </div>
                <div className="flex justify-between">
                  <span>Çıkış / 1M token</span>
                  <span className="text-slate-300 font-medium">{m.output}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-tight">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Maliyetler
