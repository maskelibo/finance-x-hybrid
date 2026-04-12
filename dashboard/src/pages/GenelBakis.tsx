import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  BarChart2,
  ClipboardList,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Cpu,
  Database,
  Wifi,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { api } from '../api'
import { formatDateTime } from '../lib/dateUtils'

type LiveAgent = { id: string; displayName: string; group: string; status: string; lastRunAt: string | null; totalRuns: number }

const GenelBakis: React.FC = () => {
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([])
  const [lastScore, setLastScore] = useState<{ ticker: string; score: number | null } | null>(null)

  const [stats, setStats] = useState({
    totalAnalyses: 0,
    completedAnalyses: 0,
    runningAnalyses: 0,
    activeAgents: 0,
    totalCostUsd: 0,
  })
  const [sessions, setSessions] = useState<any[]>([])
  const [backendOk, setBackendOk] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, ss, ag] = await Promise.all([
          api.statsOverview(),
          api.listSessions(),
          api.listAgents(),
        ])
        setStats(s)
        setSessions(ss.sessions.slice(0, 10))
        setLiveAgents(ag.agents)
        setBackendOk(true)
        // Son tamamlanan analizin skorunu bul
        const completed = ss.sessions.find((ses: any) => ses.status === 'completed')
        if (completed) {
          setLastScore({ ticker: completed.ticker, score: completed.overall_score ?? null })
        }
      } catch {
        setBackendOk(false)
      }
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Finance X</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">Otonom Finansal Analiz Platformu</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Aktif Agentlar"
          value={backendOk ? liveAgents.length || 21 : '—'}
          icon={Bot}
          color="blue"
          subtitle={backendOk ? `${liveAgents.filter(a => a.status === 'idle').length} boşta · 21 toplam` : 'Backend offline'}
        />
        <StatCard
          title="Tamamlanan Analizler"
          value={stats.completedAnalyses}
          icon={BarChart2}
          color="green"
          subtitle={stats.totalAnalyses > 0 ? `${stats.totalAnalyses} toplam` : 'Henüz analiz yok'}
        />
        <StatCard
          title="Çalışan Analizler"
          value={stats.runningAnalyses}
          icon={ClipboardList}
          color="yellow"
          subtitle={stats.runningAnalyses > 0 ? 'Şu an çalışıyor' : 'Kuyruk boş'}
        />
        <StatCard
          title="Son Analiz Skoru"
          value={lastScore?.score != null ? `${lastScore.score}/100` : '—'}
          icon={TrendingUp}
          color="blue"
          subtitle={lastScore?.ticker ? `${lastScore.ticker} analizi` : 'Henüz skor yok'}
        />
        <StatCard
          title="Toplam Maliyet"
          value={`$${stats.totalCostUsd.toFixed(2)}`}
          icon={DollarSign}
          color="purple"
          subtitle="Tüm oturumlar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 card">
          <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-slate-200">Son Analizler</h2>
            </div>
            <span className="text-xs text-slate-500">Son 30 gün</span>
          </div>

          {/* Table Header */}
          {sessions.length > 0 && (
            <div className="px-6 py-3 border-b border-[#2d3148] hidden md:grid grid-cols-5 gap-4">
              <span className="table-header">Şirket</span>
              <span className="table-header">Mod</span>
              <span className="table-header">Durum</span>
              <span className="table-header">Maliyet</span>
              <span className="table-header">Tarih</span>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#222537] border border-[#2d3148] flex items-center justify-center mb-4">
                <BarChart2 className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">Henüz analiz yapılmadı</p>
              <p className="text-slate-600 text-sm text-center max-w-xs">
                İlk analizinizi başlatmak için "Analiz Başlat" sayfasını kullanın
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2d3148]">
              {sessions.map((s) => (
                <div key={s.id} className="px-6 py-3 grid grid-cols-5 gap-4 items-center text-sm hover:bg-[#0f1117]/50 transition-colors">
                  <span className="font-medium text-slate-200">{s.ticker}</span>
                  <span className="text-slate-400 text-xs">{s.runtime_mode}</span>
                  <span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      s.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      s.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {s.status === 'completed' ? 'Tamamlandı' : s.status === 'running' ? 'Çalışıyor' : s.status === 'failed' ? 'Hata' : 'Bekliyor'}
                    </span>
                  </span>
                  <span className="text-slate-400 text-xs">${(s.total_cost_usd || 0).toFixed(3)}</span>
                  <span className="text-slate-500 text-xs">{formatDateTime(s.started_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#2d3148] flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-slate-200">Sistem Durumu</h2>
          </div>

          <div className="p-5 space-y-3">
            {[
              { label: 'Backend Bağlantısı', icon: Wifi, status: backendOk ? 'Çevrimiçi' : 'Kapalı', ok: backendOk },
              { label: 'Ajan Motoru', icon: Cpu, status: backendOk ? 'Hazır' : 'Bekliyor', ok: backendOk },
              { label: 'Veri Tabanı', icon: Database, status: backendOk ? 'Bağlı' : 'Kapalı', ok: backendOk },
              { label: 'Claude Code CLI', icon: Activity, status: backendOk ? 'Aktif' : 'Bilinmiyor', ok: backendOk },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0f1117] border border-[#2d3148]"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${item.ok ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-xs font-medium ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Status Overview */}
      <div className="card">
        <div className="px-6 py-4 border-b border-[#2d3148] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-slate-200">Ajan Durum Özeti</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              {liveAgents.filter(a => a.status === 'completed').length} Tamamlandı
            </span>
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <Clock className="w-3.5 h-3.5" />
              {liveAgents.filter(a => a.status === 'running').length} Çalışıyor
            </span>
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {liveAgents.filter(a => a.status === 'failed').length} Hata
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(liveAgents.length > 0 ? liveAgents : []).map((agent) => {
            const statusMap: Record<string, string> = {
              completed: 'tamamlandi',
              running: 'calisiyor',
              failed: 'hata',
              pending: 'bekliyor',
              idle: 'aktif',
            }
            return (
              <div
                key={agent.id}
                className="bg-[#0f1117] border border-[#2d3148] rounded-lg p-3 hover:border-[#3b4263] transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <StatusBadge status={statusMap[agent.status] || agent.status} />
                </div>
                <p className="text-xs font-medium text-slate-300 group-hover:text-slate-100 transition-colors line-clamp-2 leading-tight">
                  {agent.displayName}
                </p>
              </div>
            )
          })}
          {liveAgents.length === 0 && backendOk && (
            <div className="col-span-full text-center py-8 text-slate-500 text-xs">Agent listesi yükleniyor...</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Hızlı Analiz',
            desc: 'BIST hissesi için hızlı tarama başlatın',
            icon: TrendingUp,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            href: '/analiz',
          },
          {
            title: 'KAP Olayları',
            desc: 'Son KAP duyurularını görüntüleyin',
            icon: Activity,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            href: '/kap-olaylari',
          },
          {
            title: 'Tüm Agentlar',
            desc: '21 ajan ve yeteneklerini inceleyin',
            icon: Bot,
            color: 'text-green-400',
            bg: 'bg-green-500/10 border-green-500/20',
            href: '/agentlar',
          },
        ].map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className="card p-5 hover:border-[#3b4263] hover:shadow-lg transition-all duration-300 group flex items-start gap-4"
          >
            <div className={`p-3 rounded-xl border ${item.bg} flex-shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">{item.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default GenelBakis
