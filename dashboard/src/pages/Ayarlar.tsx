import React, { useEffect, useState } from 'react'
import { Key, Bell, Sliders, Save, Eye, EyeOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { api } from '../api'

const Ayarlar: React.FC = () => {
  const [claudeKey, setClaudeKey] = useState('')
  const [kapToken, setKapToken] = useState('')
  const [showClaude, setShowClaude] = useState(false)
  const [showKap, setShowKap] = useState(false)
  const [defaultMode, setDefaultMode] = useState('standard_institutional')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState({
    analizTamamlandi: true,
    kapOlayi: true,
    ajanHatasi: true,
    maliyetUyarisi: false,
  })

  // Track which sensitive fields are masked (user hasn't changed them)
  const [claudeKeyMasked, setClaudeKeyMasked] = useState(false)
  const [kapTokenMasked, setKapTokenMasked] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const s = await api.getSettings()
        if (s.claude_api_key) {
          setClaudeKey(s.claude_api_key)
          setClaudeKeyMasked(String(s.claude_api_key).startsWith('••'))
        }
        if (s.kap_api_token) {
          setKapToken(s.kap_api_token)
          setKapTokenMasked(String(s.kap_api_token).startsWith('••'))
        }
        if (s.default_runtime_mode) setDefaultMode(s.default_runtime_mode)
        setNotifications({
          analizTamamlandi: s.notify_analysis_complete !== false,
          kapOlayi: s.notify_kap_event !== false,
          ajanHatasi: s.notify_agent_error !== false,
          maliyetUyarisi: s.notify_budget_warning === true,
        })
      } catch (err: any) {
        setError('Ayarlar yüklenemedi: ' + err.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, any> = {
        default_runtime_mode: defaultMode,
        notify_analysis_complete: notifications.analizTamamlandi,
        notify_kap_event: notifications.kapOlayi,
        notify_agent_error: notifications.ajanHatasi,
        notify_budget_warning: notifications.maliyetUyarisi,
      }
      // Only send sensitive keys if user actually changed them (not masked)
      if (!claudeKeyMasked && claudeKey) payload.claude_api_key = claudeKey
      if (!kapTokenMasked && kapToken) payload.kap_api_token = kapToken

      await api.updateSettings(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Reload to get fresh masked values
      const s = await api.getSettings()
      if (s.claude_api_key) {
        setClaudeKey(s.claude_api_key)
        setClaudeKeyMasked(String(s.claude_api_key).startsWith('••'))
      }
      if (s.kap_api_token) {
        setKapToken(s.kap_api_token)
        setKapTokenMasked(String(s.kap_api_token).startsWith('••'))
      }
    } catch (err: any) {
      setError('Kaydedilemedi: ' + err.message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Ayarlar</h1>
        <p className="text-slate-500 mt-1 text-sm">Platform konfigürasyonu ve entegrasyon ayarları</p>
      </div>

      {/* API Keys */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2d3148] p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Key className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">API Anahtarları</h2>
            <p className="text-xs text-slate-500">AI model ve veri kaynağı bağlantıları</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Claude API Anahtarı
              <span className="ml-2 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Vision için</span>
            </label>
            <div className="relative">
              <input
                type={showClaude ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => { setClaudeKey(e.target.value); setClaudeKeyMasked(false) }}
                onFocus={() => { if (claudeKeyMasked) { setClaudeKey(''); setClaudeKeyMasked(false) } }}
                placeholder={claudeKeyMasked ? "Mevcut anahtar korundu, değiştirmek için yaz" : "sk-ant-..."}
                className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 pr-10"
              />
              <button
                onClick={() => setShowClaude(!showClaude)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showClaude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Max plan zaten bağlı — bu sadece Vision API için (tweet grafik analizi)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              KAP API Token
              <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Opsiyonel</span>
            </label>
            <div className="relative">
              <input
                type={showKap ? 'text' : 'password'}
                value={kapToken}
                onChange={(e) => { setKapToken(e.target.value); setKapTokenMasked(false) }}
                onFocus={() => { if (kapTokenMasked) { setKapToken(''); setKapTokenMasked(false) } }}
                placeholder={kapTokenMasked ? "Mevcut token korundu" : "Token giriniz..."}
                className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 pr-10"
              />
              <button
                onClick={() => setShowKap(!showKap)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Yoksa KAP web scraping kullanılır</p>
          </div>
        </div>
      </div>

      {/* Default Analysis Mode */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2d3148] p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Varsayılan Analiz Modu</h2>
            <p className="text-xs text-slate-500">Yeni analizler için varsayılan mod</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'fast_screening', label: 'Hızlı Tarama', desc: '10-20 dk' },
            { value: 'standard_institutional', label: 'Kurumsal', desc: '30-60 dk' },
            { value: 'deep_dive', label: 'Derin Analiz', desc: '90-180 dk' },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setDefaultMode(mode.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                defaultMode === mode.value
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-[#2d3148] bg-[#0f1117] hover:border-[#3d4168]'
              }`}
            >
              <div className={`text-sm font-medium ${defaultMode === mode.value ? 'text-blue-300' : 'text-slate-300'}`}>
                {mode.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{mode.desc}</div>
              {defaultMode === mode.value && (
                <div className="text-[10px] text-blue-400 mt-1 font-medium">✓ Seçili</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2d3148] p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Bildirimler</h2>
            <p className="text-xs text-slate-500">Hangi olaylar için uyarı alacaksınız</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'analizTamamlandi', label: 'Analiz tamamlandığında', desc: 'Rapor hazır olunca bildirim' },
            { key: 'kapOlayi', label: 'Yeni KAP olayı', desc: 'Takipteki şirketlerde yeni bildirim' },
            { key: 'ajanHatasi', label: 'Agent hatası', desc: 'Bir agent başarısız olursa' },
            { key: 'maliyetUyarisi', label: 'Maliyet uyarısı', desc: 'Aylık bütçe %80 aşılırsa' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-[#2d3148]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Kaydedildi
          </div>
        )}
      </div>
    </div>
  )
}

export default Ayarlar
