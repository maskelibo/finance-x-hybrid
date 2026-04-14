import React, { useEffect, useState } from 'react'
import { FileText, Search, Download, X, Copy, Check, Calendar, Building2, Trash2 } from 'lucide-react'
import { api, getApiBaseUrl, getApiHeaders } from '../api'
import { formatDate, formatDateTime } from '../lib/dateUtils'

const Raporlar: React.FC = () => {
  const [reports, setReports] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [searchCompany, setSearchCompany] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const deleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleting) return
    setDeleting(id)
    try {
      await api.deleteReport(id)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Silme hatası:', err)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listReports()
        setReports(prev => JSON.stringify(prev) === JSON.stringify(res.reports) ? prev : res.reports)
      } catch {}
      setLoading(false)
    }
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [])

  const filtered = searchCompany
    ? reports.filter(r => r.ticker?.toUpperCase().includes(searchCompany.toUpperCase()))
    : reports

  const copyReport = async () => {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const downloadMarkdown = () => {
    if (!selected) return
    const blob = new Blob([selected.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.ticker}_${selected.report_type}_${new Date(selected.created_at).toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    if (!selected) return
    const ticker = selected.ticker || selected.title?.split(' ')[0] || 'RAPOR'
    try {
      // Try to download the pre-generated PDF from the server
      const response = await fetch(`${getApiBaseUrl()}/reports/${ticker}/pdf`, {
        headers: getApiHeaders(),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${ticker}_Yonetim_Kurulu_Raporu.pdf`
        a.click()
        URL.revokeObjectURL(url)
        return
      }
    } catch {}
    // Fallback: open print dialog for markdown content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${ticker}</title><style>body{font-family:'Segoe UI',sans-serif;font-size:13px;color:#1e293b;line-height:1.6;max-width:210mm;margin:0 auto;padding:2cm;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>${selected.content}</pre></body></html>`)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const reportTypeLabel: Record<string, string> = {
    fundamental: 'Temel Analiz',
    technical: 'Teknik Analiz',
    executive: 'Yönetici Özeti',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Raporlar</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Tamamlanan analiz raporlarını okuyun ve indirin
        </p>
      </div>

      {/* Search */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
            placeholder="Şirket kodu ara..."
            className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <span className="text-xs text-slate-500">{filtered.length} rapor</span>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="card p-16 text-center text-slate-500">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#222537] border border-[#2d3148] flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-semibold mb-2">Henüz rapor oluşturulmadı</p>
          <p className="text-slate-600 text-sm text-center max-w-sm leading-relaxed">
            Bir analiz tamamlandığında, rapor burada görünür. Son agent (Son Rapor / final_summary) çıktısı rapor olarak kaydedilir.
          </p>
          <a href="/analiz" className="btn-primary text-sm mt-4">Analiz Başlat</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="card p-5 text-left hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    {reportTypeLabel[r.report_type] || r.report_type}
                  </span>
                  <button
                    onClick={(e) => deleteReport(r.id, e)}
                    disabled={deleting === r.id}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all"
                    title="Raporu sil"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${deleting === r.id ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-100 text-lg mb-1">{r.ticker}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{r.title}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-3 border-t border-[#2d3148]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(r.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {r.runtime_mode}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#2d3148]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{selected.title || selected.ticker}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {reportTypeLabel[selected.report_type] || selected.report_type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(selected.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyReport}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#0f1117] border border-[#2d3148] px-3 py-2 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Kopyala
                    </>
                  )}
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF İndir
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#0f1117] border border-[#2d3148] px-3 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  MD
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg hover:bg-[#222537] text-slate-500 hover:text-slate-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-transparent border-0 p-0">
                  {selected.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Raporlar
