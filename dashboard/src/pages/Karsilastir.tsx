import React, { useEffect, useState } from 'react'
import { GitCompare, Search, BarChart2, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { api } from '../api'
import { formatDate } from '../lib/dateUtils'

const Karsilastir: React.FC = () => {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listReports()
        setReports(res.reports)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const selectedReports = reports.filter(r => selected.includes(r.id))

  // Basit skor cikarma fonksiyonu - rapor iceriginden skor bilgisi arar
  const extractScore = (content: string): string => {
    const match = content?.match(/(?:skor|score|puan|rating)[:\s]*(\d{1,3})/i)
    return match ? match[1] : '—'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <GitCompare className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Karsilastir</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Tamamlanan analizleri yan yana karsilastirin (en fazla 5)
        </p>
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#222537] border border-[#2d3148] flex items-center justify-center mb-4">
            <GitCompare className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-semibold mb-2">Karsilastirma icin rapor yok</p>
          <p className="text-slate-600 text-sm text-center max-w-sm">
            Oncelikle analiz tamamlanmasi gerekiyor. "Analiz Baslat" sayfasindan coklu analiz baslatabilirsiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Rapor secimi */}
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-3">Karsilastirmak istediginiz raporlari secin ({selected.length}/5)</p>
            <div className="flex flex-wrap gap-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleSelect(r.id)}
                  className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    selected.includes(r.id)
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-[#0f1117] text-slate-400 border-[#2d3148] hover:border-[#3b4263]'
                  }`}
                >
                  {r.ticker}
                  <span className="text-[10px] text-slate-500 ml-1.5">{formatDate(r.created_at)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Karsilastirma tablosu */}
          {selectedReports.length >= 2 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2d3148] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <h2 className="font-semibold text-slate-200">Karsilastirma Ozeti</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2d3148]">
                      <th className="text-left px-6 py-3 text-xs text-slate-500 font-semibold">Kriter</th>
                      {selectedReports.map((r) => (
                        <th key={r.id} className="text-center px-4 py-3 text-xs text-slate-300 font-bold">
                          {r.ticker}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3148]">
                    <tr className="hover:bg-[#0f1117]/50">
                      <td className="px-6 py-3 text-slate-400">Rapor Tipi</td>
                      {selectedReports.map((r) => (
                        <td key={r.id} className="text-center px-4 py-3 text-slate-300">{r.report_type || '—'}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#0f1117]/50">
                      <td className="px-6 py-3 text-slate-400">Analiz Modu</td>
                      {selectedReports.map((r) => (
                        <td key={r.id} className="text-center px-4 py-3 text-slate-300">{r.runtime_mode || '—'}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#0f1117]/50">
                      <td className="px-6 py-3 text-slate-400">Skor</td>
                      {selectedReports.map((r) => (
                        <td key={r.id} className="text-center px-4 py-3 font-bold text-blue-400">
                          {extractScore(r.content)}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#0f1117]/50">
                      <td className="px-6 py-3 text-slate-400">Tarih</td>
                      {selectedReports.map((r) => (
                        <td key={r.id} className="text-center px-4 py-3 text-slate-300 text-xs">{formatDate(r.created_at)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Secili raporlarin icerikleri yan yana */}
          {selectedReports.length >= 2 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedReports.length}, 1fr)` }}>
              {selectedReports.map((r) => (
                <div key={r.id} className="card p-4 max-h-[60vh] overflow-y-auto">
                  <h3 className="text-sm font-bold text-slate-100 mb-1">{r.ticker}</h3>
                  <p className="text-[10px] text-slate-500 mb-3">{r.title}</p>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {r.content?.slice(0, 3000)}{r.content?.length > 3000 ? '\n\n... (devami rapor sayfasinda)' : ''}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Karsilastir
