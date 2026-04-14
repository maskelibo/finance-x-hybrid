import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlayCircle,
  Info,
  Bot,
  Clock,
  BarChart2,
  TrendingUp,
  Globe,
  Building2,
  Activity,
  DollarSign,
  Heart,
  Leaf,
  Users,
  Layers,
} from 'lucide-react'
import { AnalysisMode } from '../types'
import { api } from '../api'

interface LayerConfig {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
}

const modeConfig: Record<
  AnalysisMode,
  { label: string; duration: string; agents: string[]; description: string; color: string }
> = {
  fast_screening: {
    label: 'Hızlı Tarama',
    duration: '10-20 dakika',
    agents: ['CEO Meta-Ajan', 'Orkestratör', 'Veri Toplama', 'Finansal Analiz', 'Son Rapor'],
    description: 'Temel finansal göstergeler ve hızlı değerleme. Ön eleme için idealdir.',
    color: 'border-green-500/50 bg-green-500/5',
  },
  standard_institutional: {
    label: 'Kurumsal Analiz',
    duration: '30-60 dakika',
    agents: [
      'CEO Meta-Ajan',
      'Orkestratör',
      'Veri Toplama',
      'Belge Ayrıştırma',
      'Veri Doğrulama',
      'Finansal Analiz',
      'Sektör & Rekabet',
      'Makro Analiz',
      'Stratejik Sentez',
      'Son Rapor',
      'Kalite Kontrol',
    ],
    description: 'Kapsamlı kurumsal kalite analiz. Yatırım kararları için önerilir.',
    color: 'border-blue-500/50 bg-blue-500/5',
  },
  deep_dive: {
    label: 'Derin Analiz',
    duration: '90-180 dakika',
    agents: [
      'CEO Meta-Ajan',
      'Orkestratör',
      'Tüm 20 Ajan',
      'KAP İzleme & Analiz',
      'Teknik Analiz',
      'Makro Analiz',
      'Strateji Sentezi',
      'Kalite Kontrol',
    ],
    description: 'Tüm boyutlarıyla derinlemesine inceleme. Büyük yatırım pozisyonları için.',
    color: 'border-purple-500/50 bg-purple-500/5',
  },
}

const layerMeta: Record<string, Pick<LayerConfig, 'description' | 'icon'>> = {
  fundamental: {
    description: 'Bilanço, gelir tablosu, nakit akışı ve değerleme',
    icon: BarChart2,
  },
  technical: {
    description: 'Fiyat trendi, hacim, RSI, MACD ve formasyonlar',
    icon: TrendingUp,
  },
  events: {
    description: 'KAP duyuru analizi ve olay etkisi değerlendirme',
    icon: Activity,
  },
  sector: {
    description: 'Sektör karşılaştırması ve rekabetçi konum analizi',
    icon: Building2,
  },
  macro: {
    description: 'Türkiye makroekonomik ortamı ve şirket duyarlılığı',
    icon: Globe,
  },
  valuation: {
    description: 'DCF, P/E, EV/EBITDA ve karşılaştırmalı değerleme modelleri',
    icon: DollarSign,
  },
  sentiment: {
    description: 'Haber, sosyal medya ve piyasa duyarlılığı analizi',
    icon: Heart,
  },
  consensus: {
    description: 'Analist konsensüsü ve hedef fiyat derlemesi',
    icon: Users,
  },
  esg: {
    description: 'Çevresel, sosyal ve yönetişim değerlendirmesi',
    icon: Leaf,
  },
}

const AnalizBaslat: React.FC = () => {
  const navigate = useNavigate()
  const [ticker, setTicker] = useState('')
  const [mode, setMode] = useState<AnalysisMode>('standard_institutional')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [multiMode, setMultiMode] = useState(false)
  const [multiTickers, setMultiTickers] = useState('')
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'fundamental', label: 'Temel Analiz', ...layerMeta.fundamental, checked: true },
    { id: 'technical', label: 'Teknik Analiz', ...layerMeta.technical, checked: true },
    { id: 'events', label: 'KAP Olay İstihbaratı', ...layerMeta.events, checked: true },
    { id: 'sector', label: 'Sektör & Rekabet', ...layerMeta.sector, checked: true },
    { id: 'macro', label: 'Makro Analiz', ...layerMeta.macro, checked: true },
    { id: 'valuation', label: 'Değerleme', ...layerMeta.valuation, checked: false },
    { id: 'sentiment', label: 'Duygu Analizi', ...layerMeta.sentiment, checked: false },
    { id: 'consensus', label: 'Konsensüs', ...layerMeta.consensus, checked: false },
    { id: 'esg', label: 'ESG Analizi', ...layerMeta.esg, checked: false },
  ])

  useEffect(() => {
    let cancelled = false
    api.analysisConfig()
      .then((config) => {
        if (cancelled) return
        setLayers((prev) => {
          const checkedMap = new Map(prev.map((layer) => [layer.id, layer.checked]))
          return config.layers.map((layer) => ({
            id: layer.id,
            label: layer.label,
            description: layerMeta[layer.id]?.description || layer.label,
            icon: layerMeta[layer.id]?.icon || Layers,
            checked: checkedMap.get(layer.id) ?? ['fundamental', 'technical', 'events', 'sector', 'macro'].includes(layer.id),
          }))
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l))
    )
  }

  const selectedMode = modeConfig[mode]
  const checkedCount = layers.filter((l) => l.checked).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedLayers = layers.filter(l => l.checked).map(l => l.id)
    if (selectedLayers.length === 0) {
      setError('En az bir analiz katmanı seçmelisiniz')
      return
    }

    // Coklu analiz modu
    if (multiMode) {
      const tickers = multiTickers
        .split(/[,;\s]+/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0)
      if (tickers.length < 2) {
        setError('Çoklu analiz için en az 2 ticker girin (virgülle ayırın)')
        return
      }
      const invalid = tickers.find(t => !/^[A-Z]{3,6}$/.test(t))
      if (invalid) {
        setError(`Geçersiz ticker: ${invalid}. 3-6 harfli BIST sembolü girin.`)
        return
      }
      setSubmitting(true)
      setError(null)
      try {
        // Her ticker icin ayri analiz baslat
        let lastSessionId = ''
        for (const t of tickers) {
          const res = await api.startAnalysis(t, mode, selectedLayers)
          lastSessionId = res.sessionId
        }
        navigate(`/gorevler?session=${lastSessionId}`)
      } catch (err: any) {
        setError(err.message || 'Analiz başlatılamadı. Backend çalışıyor mu?')
        setSubmitting(false)
      }
      return
    }

    // Tekli analiz modu
    const cleanTicker = ticker.trim().toUpperCase()
    if (!cleanTicker) return
    if (!/^[A-Z]{3,6}$/.test(cleanTicker)) {
      setError('Geçersiz ticker. 3-6 harfli BIST sembolü girin (örn: ASELS, THYAO)')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.startAnalysis(cleanTicker, mode, selectedLayers)
      navigate(`/gorevler?session=${res.sessionId}`)
    } catch (err: any) {
      setError(err.message || 'Analiz başlatılamadı. Backend çalışıyor mu?')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <PlayCircle className="w-4 h-4 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Yeni Analiz Başlat</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          BIST'te işlem gören bir şirket için otonom analiz başlatın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Analiz Tipi Secimi */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setMultiMode(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !multiMode
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 border border-[#2d3148] hover:border-[#3b4263]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Tekli Analiz
            </button>
            <button
              type="button"
              onClick={() => setMultiMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                multiMode
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 border border-[#2d3148] hover:border-[#3b4263]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Çoklu Analiz
            </button>
          </div>

          {!multiMode ? (
            <>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Şirket Kodu (Ticker)
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Örn: ASELS, EREGL, THYAO, SISE, AKBNK"
                className="input-field text-lg font-semibold tracking-wider"
                maxLength={10}
              />
              <p className="text-xs text-slate-500 mt-2">
                Borsa Istanbul'da işlem gören hisse senedi sembolünü girin
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Karşılaştırmalı Analiz — Birden Fazla Ticker
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={multiTickers}
                onChange={(e) => setMultiTickers(e.target.value.toUpperCase())}
                placeholder="Örn: ASELS, THYAO, EREGL, SISE"
                className="input-field text-lg font-semibold tracking-wider"
              />
              <p className="text-xs text-slate-500 mt-2">
                Virgülle ayırarak birden fazla şirket kodu girin. Her biri için ayrı analiz başlatılacak ve sonuçlar karşılaştırılabilir olacak.
              </p>
              {multiTickers && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {multiTickers.split(/[,;\s]+/).filter(t => t.trim()).map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Analysis Mode */}
        <div className="card p-6">
          <label className="block text-sm font-semibold text-slate-300 mb-4">
            Analiz Modu
          </label>
          <div className="space-y-3">
            {(Object.keys(modeConfig) as AnalysisMode[]).map((m) => {
              const cfg = modeConfig[m]
              const isSelected = mode === m
              return (
                <label
                  key={m}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? cfg.color + ' shadow-lg'
                      : 'border-[#2d3148] bg-[#0f1117] hover:border-[#3b4263]'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={isSelected}
                    onChange={() => setMode(m)}
                    className="mt-1 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {cfg.duration}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{cfg.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Analysis Layers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-slate-300">
              Analiz Katmanları
            </label>
            <span className="text-xs text-slate-500">
              {checkedCount}/{layers.length} seçili
            </span>
          </div>
          <div className="space-y-2.5">
            {layers.map((layer) => (
              <label
                key={layer.id}
                className={`flex items-center gap-4 p-3.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                  layer.checked
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-[#2d3148] bg-[#0f1117] hover:border-[#3b4263]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={layer.checked}
                  onChange={() => toggleLayer(layer.id)}
                  className="w-4 h-4 accent-blue-500 flex-shrink-0"
                />
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      layer.checked ? 'bg-blue-500/15 border border-blue-500/25' : 'bg-[#222537] border border-[#2d3148]'
                    }`}
                  >
                    <layer.icon
                      className={`w-3.5 h-3.5 ${layer.checked ? 'text-blue-400' : 'text-slate-500'}`}
                    />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${layer.checked ? 'text-slate-200' : 'text-slate-400'}`}>
                      {layer.label}
                    </p>
                    <p className="text-xs text-slate-500">{layer.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Agent Info Box */}
        <div className={`rounded-xl border-2 p-5 ${selectedMode.color}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#1a1d27] border border-[#2d3148] flex-shrink-0">
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200 mb-2">
                {selectedMode.label} — Aktive Edilecek Agentlar
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMode.agents.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 text-xs bg-[#0f1117] border border-[#2d3148] text-slate-400 px-2 py-1 rounded-lg"
                  >
                    <Bot className="w-3 h-3 text-blue-400" />
                    {a}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Tahmini süre: {selectedMode.duration}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={(!multiMode && !ticker.trim()) || (multiMode && !multiTickers.trim()) || submitting}
            className={`btn-success text-base px-8 py-3.5 ${
              ((!multiMode && !ticker.trim()) || (multiMode && !multiTickers.trim()) || submitting) ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-green-500/20'
            }`}
          >
            <PlayCircle className="w-5 h-5" />
            {submitting ? 'Başlatılıyor...' : multiMode ? 'Çoklu Analiz Başlat' : 'Analizi Başlat'}
          </button>
          <span className="text-sm text-slate-500">
            {multiMode ? (
              multiTickers.trim() ? (
                <span className="text-slate-300">
                  <strong className="text-purple-400">{multiTickers.split(/[,;\s]+/).filter(t => t.trim()).length} şirket</strong> için{' '}
                  <strong>{selectedMode.label}</strong> başlatılacak
                </span>
              ) : 'Şirket kodlarını virgülle girin'
            ) : ticker ? (
              <span className="text-slate-300">
                <strong className="text-blue-400">{ticker}</strong> için{' '}
                <strong>{selectedMode.label}</strong> başlatılacak
              </span>
            ) : (
              'Lütfen şirket kodu girin'
            )}
          </span>
        </div>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3">
            {error}
          </div>
        )}
      </form>
    </div>
  )
}

export default AnalizBaslat
