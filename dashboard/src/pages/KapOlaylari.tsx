import React, { useEffect, useState } from 'react'
import { Bell, Search, Filter, TrendingUp, TrendingDown, Minus, HelpCircle, Loader2 } from 'lucide-react'
import { api } from '../api'
import { formatDateTime } from '../lib/dateUtils'

const eventTypes = [
  { value: '', label: 'Tümü' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'capex', label: 'Yatırım' },
  { value: 'debt', label: 'Borçlanma' },
  { value: 'legal', label: 'Yasal' },
  { value: 'management', label: 'Yönetim' },
  { value: 'dividend', label: 'Temettü' },
  { value: 'buyback', label: 'Geri Alım' },
  { value: 'asset_sale', label: 'Varlık Satışı' },
  { value: 'partnership', label: 'Ortaklık' },
  { value: 'regulatory', label: 'Düzenleyici' },
  { value: 'production', label: 'Üretim' },
  { value: 'other', label: 'Diğer' },
]

const eventTypeLabel: Record<string, string> = Object.fromEntries(
  eventTypes.map(t => [t.value, t.label])
)

const KapOlaylari: React.FC = () => {
  const [events, setEvents] = useState<any[]>([])
  const [searchCompany, setSearchCompany] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(true)
  const [debouncedTicker, setDebouncedTicker] = useState('')

  // Debounce ticker input: wait 500ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTicker(searchCompany), 500)
    return () => clearTimeout(t)
  }, [searchCompany])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.kapEvents({
          ticker: debouncedTicker || undefined,
          event_type: selectedType || undefined,
        })
        if (!cancelled) setEvents(res.events)
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    const i = setInterval(load, 10000)
    return () => { cancelled = true; clearInterval(i) }
  }, [debouncedTicker, selectedType])

  const ImpactIcon: React.FC<{ direction?: string }> = ({ direction }) => {
    if (direction === 'positive') return <TrendingUp className="w-3.5 h-3.5" />
    if (direction === 'negative') return <TrendingDown className="w-3.5 h-3.5" />
    if (direction === 'mixed') return <Minus className="w-3.5 h-3.5" />
    return <HelpCircle className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">KAP Olayları</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Kamuyu Aydınlatma Platformu'nda tespit edilen olaylar ve etki değerlendirmeleri
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value.toUpperCase())}
              placeholder="Şirket kodu ara... (örn: ASELS)"
              className="bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            {events.length} olay
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {eventTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                selectedType === t.value
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#0f1117] text-slate-400 border-[#2d3148] hover:border-[#3d4168]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="card p-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#222537] border border-[#2d3148] flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-semibold mb-2">Henüz KAP olayı yok</p>
          <p className="text-slate-600 text-sm text-center max-w-sm leading-relaxed">
            KAP İzleme ajanı yeni bildirimler tespit ettikçe, Olay Sınıflandırma ve Etki Haritalama ajanları bunları analiz eder ve burada listeler.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-[#2d3148]">
          {events.map((e) => (
            <div key={e.id} className="p-4 hover:bg-[#0f1117]/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">{e.ticker}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {eventTypeLabel[e.event_type] || e.event_type}
                    </span>
                    {e.impact_direction && (
                      <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        e.impact_direction === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                        e.impact_direction === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      }`}>
                        <ImpactIcon direction={e.impact_direction} />
                        {e.impact_direction === 'positive' ? 'Olumlu' : e.impact_direction === 'negative' ? 'Olumsuz' : 'Karışık'}
                      </span>
                    )}
                    {e.confidence && (
                      <span className="text-[10px] text-slate-500">Güven: {e.confidence}</span>
                    )}
                  </div>
                  <h3 className="text-sm text-slate-200 font-medium mb-1">{e.title}</h3>
                  {e.content && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{e.content}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span>📅 {formatDateTime(e.published_at)}</span>
                    {e.source_url && (
                      <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        Kaynak →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default KapOlaylari
