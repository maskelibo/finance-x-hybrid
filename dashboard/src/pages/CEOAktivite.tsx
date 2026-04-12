import React, { useEffect, useState } from 'react'
import { Activity, Crown, Brain, Target, Eye, Plus, Trash2, Play, RotateCw, MessageSquare, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '../api'
import { formatDateTime, formatDate } from '../lib/dateUtils'

const CEOAktivite: React.FC = () => {
  const [tab, setTab] = useState<'activities' | 'goals' | 'watchlist' | 'memory'>('activities')
  const [activities, setActivities] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [memory, setMemory] = useState('')
  const [memoryMtime, setMemoryMtime] = useState<number>(0)
  const [memoryEdit, setMemoryEdit] = useState(false)
  const [memoryConflict, setMemoryConflict] = useState(false)
  const [heartbeatRunning, setHeartbeatRunning] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [newGoalPriority, setNewGoalPriority] = useState('normal')
  const [newTicker, setNewTicker] = useState('')
  const newGoalInputRef = React.useRef<HTMLInputElement>(null)
  const newTickerInputRef = React.useRef<HTMLInputElement>(null)

  const loadAll = async () => {
    try {
      const [a, g, w, hb] = await Promise.all([
        api.ceoActivities(),
        api.goals(),
        api.watchlist(),
        api.ceoHeartbeatStatus(),
      ])
      setActivities(prev => JSON.stringify(prev) === JSON.stringify(a.activities) ? prev : a.activities)
      setGoals(prev => JSON.stringify(prev) === JSON.stringify(g.goals) ? prev : g.goals)
      setWatchlist(prev => JSON.stringify(prev) === JSON.stringify(w.watchlist) ? prev : w.watchlist)
      setHeartbeatRunning(hb.running)
    } catch {}
  }

  const loadMemory = async () => {
    try {
      const m = await api.ceoMemory()
      // If user is currently editing, don't blindly overwrite — flag conflict
      if (memoryEdit && memoryMtime > 0 && m.mtime !== memoryMtime) {
        setMemoryConflict(true)
        return
      }
      setMemory(m.content)
      setMemoryMtime(m.mtime)
      setMemoryConflict(false)
    } catch {}
  }

  // Use ref so interval closure always reads fresh value
  const memoryEditRef = React.useRef(memoryEdit)
  memoryEditRef.current = memoryEdit

  useEffect(() => {
    loadAll()
    loadMemory()
    const i = setInterval(() => {
      loadAll()
      if (!memoryEditRef.current) loadMemory()
    }, 5000)
    return () => clearInterval(i)
  }, []) // no dependency — interval created once, reads ref for fresh state

  const triggerHeartbeat = async () => {
    setHeartbeatRunning(true) // optimistic
    try {
      await api.ceoHeartbeatRun()
      // Poll status more aggressively for first 10 seconds
      const fastPoll = setInterval(async () => {
        const s = await api.ceoHeartbeatStatus()
        setHeartbeatRunning(s.running)
        if (!s.running) clearInterval(fastPoll)
      }, 1000)
      setTimeout(() => clearInterval(fastPoll), 30000)
      loadAll()
    } catch (err: any) {
      setHeartbeatRunning(false)
      alert(err.message)
    }
  }

  const addGoal = async () => {
    if (!newGoal.trim()) return
    await api.createGoal(newGoal.trim(), undefined, newGoalPriority)
    setNewGoal('')
    loadAll()
    newGoalInputRef.current?.focus()
  }

  const completeGoal = async (id: string) => {
    await api.updateGoal(id, { status: 'completed' })
    loadAll()
  }

  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id)
    loadAll()
  }

  const addTicker = async () => {
    if (!newTicker.trim()) return
    try {
      await api.addToWatchlist(newTicker.trim().toUpperCase())
      setNewTicker('')
      loadAll()
      newTickerInputRef.current?.focus()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const removeTicker = async (id: string) => {
    await api.removeFromWatchlist(id)
    loadAll()
  }

  const saveMemory = async () => {
    try {
      const res = await api.ceoMemoryUpdate(memory, memoryMtime)
      setMemoryMtime(res.mtime)
      setMemoryEdit(false)
      setMemoryConflict(false)
    } catch (err: any) {
      if (err.message && err.message.includes('409')) {
        setMemoryConflict(true)
        alert('Hafıza arka planda (heartbeat veya başka bir agent tarafından) güncellendi. Değişikliklerinizi kaybetmeden önce yenileyip tekrar deneyin.')
      } else {
        alert('Kaydedilemedi: ' + err.message)
      }
    }
  }

  const reloadMemoryFromConflict = async () => {
    const m = await api.ceoMemory()
    setMemory(m.content)
    setMemoryMtime(m.mtime)
    setMemoryConflict(false)
  }

  const tabs = [
    { id: 'activities', label: 'Aktiviteler', icon: Activity, count: activities.length },
    { id: 'goals', label: 'Hedefler', icon: Target, count: goals.filter(g => g.status === 'active').length },
    { id: 'watchlist', label: 'İzleme Listesi', icon: Eye, count: watchlist.length },
    { id: 'memory', label: 'Hafıza', icon: Brain, count: 0 },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">CEO Otonom Yönetim</h1>
            <p className="text-xs text-slate-500">Hafıza, hedefler, watchlist ve otonom döngü</p>
          </div>
        </div>
        <button
          onClick={triggerHeartbeat}
          disabled={heartbeatRunning}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          {heartbeatRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              CEO Çalışıyor...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              CEO'yu Şimdi Uyandır
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2d3148]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.id
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="card divide-y divide-[#2d3148]">
          {activities.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p>Henüz CEO aktivitesi yok</p>
              <p className="text-xs mt-1">CEO her 30 dakikada bir otonom çalışır</p>
            </div>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="p-4 hover:bg-[#0f1117]/50">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.activity_type === 'heartbeat' ? 'bg-amber-500/15 border border-amber-500/30' :
                    a.activity_type === 'chat' ? 'bg-blue-500/15 border border-blue-500/30' :
                    'bg-slate-500/15 border border-slate-500/30'
                  }`}>
                    {a.activity_type === 'heartbeat' ? <RotateCw className="w-4 h-4 text-amber-400" /> :
                     a.activity_type === 'chat' ? <MessageSquare className="w-4 h-4 text-blue-400" /> :
                     <Activity className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-200">{a.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        a.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        a.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {a.status === 'completed' ? 'Tamamlandı' : a.status === 'running' ? 'Çalışıyor' : 'Hata'}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {a.triggered_by === 'autonomous' ? 'OTONOM' : 'CHAIRMAN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{a.description}</p>
                    {a.output_text && (
                      <pre className="text-xs text-slate-400 bg-[#0a0c12] border border-[#2d3148] rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {a.output_text}
                      </pre>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                      <span>{formatDateTime(a.created_at)}</span>
                      {a.duration_ms && <span>{(a.duration_ms / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Goals Tab */}
      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <input
                ref={newGoalInputRef}
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Yeni hedef tanımla... (örn: ASELS'i 7/24 takip et)"
                className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
              <select
                value={newGoalPriority}
                onChange={(e) => setNewGoalPriority(e.target.value)}
                className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-sm text-slate-300"
              >
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
              <button onClick={addGoal} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" />
                Ekle
              </button>
            </div>
          </div>
          <div className="card divide-y divide-[#2d3148]">
            {goals.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p>Henüz hedef yok</p>
              </div>
            ) : (
              goals.map((g) => (
                <div key={g.id} className="p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    g.status === 'completed' ? 'bg-green-500/15 border border-green-500/30' :
                    'bg-amber-500/15 border border-amber-500/30'
                  }`}>
                    {g.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                     <Target className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${g.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {g.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        g.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        g.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        g.priority === 'normal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {g.priority}
                      </span>
                      <span className="text-[10px] text-slate-600">{formatDate(g.created_at)}</span>
                    </div>
                  </div>
                  {g.status !== 'completed' && (
                    <button onClick={() => completeGoal(g.id)} className="text-xs text-green-400 hover:text-green-300 px-2 py-1">
                      Tamamla
                    </button>
                  )}
                  <button onClick={() => deleteGoal(g.id)} className="text-xs text-red-400 hover:text-red-300 p-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Watchlist Tab */}
      {tab === 'watchlist' && (
        <div className="space-y-4">
          <div className="card p-4 flex gap-3">
            <input
              ref={newTickerInputRef}
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addTicker()}
              placeholder="Ticker ekle... (örn: ASELS, EREGL, THYAO)"
              className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono uppercase"
              maxLength={10}
            />
            <button onClick={addTicker} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {watchlist.length === 0 ? (
              <div className="col-span-full card p-12 text-center text-slate-500">
                <Eye className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p>Watchlist boş</p>
                <p className="text-xs mt-1">CEO bu listedeki şirketleri sürekli takip eder</p>
              </div>
            ) : (
              watchlist.map((w) => (
                <div key={w.id} className="card p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xl font-bold text-slate-100">{w.ticker}</div>
                    <button onClick={() => removeTicker(w.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {w.company_name && <p className="text-xs text-slate-500 mb-2">{w.company_name}</p>}
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Eye className="w-3 h-3" />
                    Eklendi {formatDate(w.added_at)}
                  </div>
                  {w.alert_active === 1 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      Aktif uyarı
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Memory Tab */}
      {tab === 'memory' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">CEO Kalıcı Hafıza</h2>
              <p className="text-xs text-slate-500">agents/ceo/memory.md — her konuşmada otomatik yüklenir</p>
            </div>
            {memoryEdit ? (
              <div className="flex items-center gap-2">
                <button onClick={() => { loadMemory(); setMemoryEdit(false); setMemoryConflict(false) }} className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5">İptal</button>
                <button onClick={saveMemory} className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-3 py-1.5 rounded-lg">Kaydet</button>
              </div>
            ) : (
              <button onClick={() => { setMemoryEdit(true); loadMemory() }} className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">Düzenle</button>
            )}
          </div>

          {memoryConflict && (
            <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-xs px-3 py-2 flex items-center justify-between">
              <span>⚠ Hafıza arka planda güncellendi (heartbeat veya başka bir agent tarafından).</span>
              <button onClick={reloadMemoryFromConflict} className="text-yellow-300 hover:text-yellow-100 font-semibold underline">
                Yenile
              </button>
            </div>
          )}
          {memoryEdit ? (
            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              className="w-full h-96 bg-[#0a0c12] border border-[#2d3148] rounded-lg p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500/50"
            />
          ) : (
            <pre className="bg-[#0a0c12] border border-[#2d3148] rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto">
              {memory}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default CEOAktivite
