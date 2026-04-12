import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ClipboardList, Play, CheckCircle, XCircle, Clock, ChevronRight, ChevronDown, Loader2, Pause, RefreshCw, Crown, Trash2 } from 'lucide-react'
import { api } from '../api'
import { formatDateTime } from '../lib/dateUtils'

const Gorevler: React.FC = () => {
  const [searchParams] = useSearchParams()
  const sessionIdFromUrl = searchParams.get('session')

  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(sessionIdFromUrl)
  const [sessionDetail, setSessionDetail] = useState<any>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const didAutoSelectRef = useRef(false)

  // Sessions list: poll every 5s, skip re-render if unchanged
  useEffect(() => {
    let cancelled = false
    const loadSessions = async () => {
      try {
        const res = await api.listSessions()
        if (cancelled) return
        setSessions(prev => {
          // Lightweight diff: compare count + last item status
          if (prev.length === res.sessions.length &&
              prev.length > 0 &&
              prev[0].id === res.sessions[0].id &&
              prev[0].status === res.sessions[0].status) return prev
          return res.sessions
        })
        if (!didAutoSelectRef.current && !sessionIdFromUrl && res.sessions.length > 0) {
          didAutoSelectRef.current = true
          setSelectedSession(res.sessions[0].id)
        } else if (sessionIdFromUrl) {
          didAutoSelectRef.current = true
        }
      } catch {}
    }
    loadSessions()
    const interval = setInterval(loadSessions, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [sessionIdFromUrl])

  // Session detail: poll every 3s but stop when session is terminal (completed/failed)
  useEffect(() => {
    if (!selectedSession) return
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const loadDetail = async () => {
      try {
        const res = await api.getSession(selectedSession)
        if (cancelled) return
        setSessionDetail((prev: any) => {
          if (JSON.stringify(prev) === JSON.stringify(res)) return prev
          return res
        })
        // If session is in terminal state, stop polling
        const st = res.session?.status
        if ((st === 'completed' || st === 'failed') && interval) {
          clearInterval(interval)
          interval = null
        }
      } catch {}
    }

    loadDetail()
    interval = setInterval(loadDetail, 3000)
    return () => { cancelled = true; if (interval) clearInterval(interval) }
  }, [selectedSession])

  const [resuming, setResuming] = useState(false)

  const handleResumeAll = async () => {
    setResuming(true)
    try {
      const res = await api.resumeAllPaused()
      if (res.available) {
        alert(`✅ Claude hazır — ${res.resumed} oturum otomatik devam ettirildi`)
      } else {
        alert('⏳ Claude hâlâ rate limit\'te. Watchdog her 5 dakikada bir tekrar deneyecek.')
      }
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
    setResuming(false)
  }

  const handleResumeSession = async (sessionId: string) => {
    try {
      const res = await api.resumeSession(sessionId)
      if (!res.ok) alert('Oturum devam ettirilemedi')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor',
    running: 'Çalışıyor',
    paused_rate_limit: 'Duraklatıldı',
    completed: 'Tamamlandı',
    failed: 'Hata',
  }

  const statusStyle: Record<string, string> = {
    pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paused_rate_limit: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin" />
    if (status === 'paused_rate_limit') return <Pause className="w-3.5 h-3.5" />
    if (status === 'completed') return <CheckCircle className="w-3.5 h-3.5" />
    if (status === 'failed') return <XCircle className="w-3.5 h-3.5" />
    return <Clock className="w-3.5 h-3.5" />
  }

  const pausedCount = sessions.filter(s => s.status === 'paused_rate_limit').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Görevler & Oturumlar</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">Analiz oturumlarını ve ajan görevlerini canlı takip edin</p>
      </div>

      {/* Rate Limit Banner */}
      {pausedCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Pause className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {pausedCount} analiz oturumu rate limit nedeniyle duraklatıldı
              </p>
              <p className="text-xs text-amber-300/70">
                Watchdog her 5 dakikada bir otomatik kontrol ediyor. Limit kalkınca kaldıkları yerden devam edecekler.
              </p>
            </div>
          </div>
          <button
            onClick={handleResumeAll}
            disabled={resuming}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {resuming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Şimdi Kontrol Et
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-4 card">
          <div className="px-4 py-3 border-b border-[#2d3148] flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">Analiz Oturumları</span>
            <span className="text-xs text-slate-500">{sessions.length}</span>
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">Henüz oturum yok</p>
              <Link to="/analiz" className="text-xs text-blue-400 hover:text-blue-300">
                Yeni analiz başlat →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#2d3148] max-h-[calc(100vh-220px)] overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`relative group w-full text-left px-4 py-3 hover:bg-[#0f1117] transition-colors cursor-pointer ${
                    selectedSession === s.id ? 'bg-[#0f1117] border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSession(s.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 text-sm">{s.ticker}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${statusStyle[s.status]}`}>
                        <StatusIcon status={s.status} />
                        {statusLabel[s.status] || s.status}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!confirm(`${s.ticker} oturumunu silmek istediğinize emin misiniz?`)) return
                          try {
                            await api.deleteSession(s.id)
                            setSessions(prev => prev.filter(x => x.id !== s.id))
                            if (selectedSession === s.id) { setSelectedSession(null); setSessionDetail(null) }
                          } catch (err: any) { alert('Hata: ' + err.message) }
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all"
                        title="Oturumu sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-0.5">{s.runtime_mode}</div>
                  {s.current_phase && (
                    <div className="text-[10px] text-blue-400">{s.current_phase}</div>
                  )}
                  <div className="text-[10px] text-slate-600 mt-1">
                    {formatDateTime(s.started_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session Detail */}
        <div className="lg:col-span-8 card">
          {!sessionDetail ? (
            <div className="p-16 text-center">
              <Play className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">Oturum seçin</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-[#2d3148]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-100">{sessionDetail.session.ticker}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1.5 ${statusStyle[sessionDetail.session.status]}`}>
                    <StatusIcon status={sessionDetail.session.status} />
                    {statusLabel[sessionDetail.session.status]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500">Mod</div>
                    <div className="text-slate-300 font-medium">{sessionDetail.session.runtime_mode}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Maliyet</div>
                    <div className="text-slate-300 font-medium">${(sessionDetail.session.total_cost_usd || 0).toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Token</div>
                    <div className="text-slate-300 font-medium">{(sessionDetail.session.total_tokens || 0).toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Faz</div>
                    <div className="text-blue-400 font-medium">{sessionDetail.session.current_phase || '—'}</div>
                  </div>
                </div>

                {/* Feedback Loop Button — only for completed sessions */}
                {sessionDetail.session.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-[#2d3148]">
                    <button
                      onClick={async () => {
                        try {
                          await api.runFeedbackLoop(sessionDetail.session.id)
                          alert('✅ CEO geri bildirim döngüsü başlatıldı. Agent memory\'leri güncellenecek.')
                        } catch (err: any) {
                          alert('Hata: ' + err.message)
                        }
                      }}
                      className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      CEO Geri Bildirim Döngüsü Başlat
                    </button>
                    <p className="text-[10px] text-slate-600 mt-1.5">CEO tüm çıktıları gözden geçirir, eksikleri tespit eder ve agent memory'lerine yazar. Bir sonraki analizde agentlar bu geri bildirimleri kullanır.</p>
                  </div>
                )}
              </div>

              {/* Agent Runs */}
              <div className="divide-y divide-[#2d3148] max-h-[calc(100vh-320px)] overflow-y-auto">
                {sessionDetail.runs.map((run: any) => (
                  <div key={run.id}>
                    <button
                      onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                      className="w-full px-6 py-3 hover:bg-[#0f1117] transition-colors flex items-center gap-3 text-left"
                    >
                      {expandedRunId === run.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${statusStyle[run.status]}`}>
                        <StatusIcon status={run.status} />
                        {statusLabel[run.status]}
                      </span>
                      <span className="text-sm text-slate-200 font-medium flex-1">{run.agent_display_name}</span>
                      <span className="text-xs text-slate-500">
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : ''}
                      </span>
                      <span className="text-xs text-slate-500">
                        {run.cost_usd ? `$${run.cost_usd.toFixed(4)}` : ''}
                      </span>
                    </button>
                    {expandedRunId === run.id && (
                      <div className="px-6 pb-4 bg-[#0f1117]/50">
                        {run.output_text && (
                          <div className="mt-2">
                            <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase">Çıktı</div>
                            <pre className="text-xs text-slate-300 bg-[#0a0c12] border border-[#2d3148] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-96">
                              {run.output_text}
                            </pre>
                          </div>
                        )}
                        {run.error_message && (
                          <div className="mt-2">
                            <div className="text-[11px] font-semibold text-red-400 mb-1 uppercase">Hata</div>
                            <pre className="text-xs text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                              {run.error_message}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Gorevler
