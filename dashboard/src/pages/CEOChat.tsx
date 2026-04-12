import React, { useEffect, useRef, useState } from 'react'
import { Send, Crown, Loader2, RotateCcw, User, ArrowDown, Square } from 'lucide-react'
import { useCEOChat } from '../context/CEOChatContext'

const CEOChat: React.FC = () => {
  const { messages, loading, error, send, abort, clear } = useCEOChat()
  const [input, setInput] = useState('')
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isAtBottomRef = useRef(true)
  const prevMessageCountRef = useRef(0)

  // Check if user is near bottom of scroll area
  const checkIfAtBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    const threshold = 100
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  // Track scroll position, don't auto-scroll if user scrolled up to read
  const handleScroll = () => {
    const atBottom = checkIfAtBottom()
    isAtBottomRef.current = atBottom
    setShowJumpToBottom(!atBottom && messages.length > 3)
  }

  // Only auto-scroll when a NEW message arrives AND user is at bottom
  useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current
    prevMessageCountRef.current = messages.length

    if (!messageCountChanged) return

    // If user is at bottom, auto-scroll. Otherwise respect their scroll position.
    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })
    }
  }, [messages.length])

  // Also scroll to bottom when loading indicator appears (new request sent)
  useEffect(() => {
    if (loading && isAtBottomRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })
    }
  }, [loading])

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
    isAtBottomRef.current = true
    setShowJumpToBottom(false)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    // Force scroll to bottom when user sends a new message
    isAtBottomRef.current = true
    await send(text)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    if (!confirm('Sohbet geçmişi silinsin mi?')) return
    await clear()
  }

  const suggestions = [
    'ASELS hakkında ne düşünüyorsun?',
    'Bugünkü KAP bildirimlerini özetle',
    'Son 5 yılda THYAO\'nun finansal performansı nasıl?',
    'Bankacılık sektöründe en güçlü hissesi hangisi?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">CEO Meta-Ajan</h1>
            <p className="text-xs text-slate-500">
              Finance X yönetim kademesinin en üst düzey AI ajanı
              {loading && <span className="ml-2 text-amber-400">· Arkada çalışıyor...</span>}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#0f1117] border border-[#2d3148] px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sohbeti Temizle
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto card p-6 mb-4 space-y-6"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-200 mb-2">CEO ile Konuşmaya Başlayın</h2>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Şirket analizleri, KAP olayları, sektör değerlendirmeleri veya yatırım stratejisi hakkında her şeyi sorabilirsiniz.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput('')
                      isAtBottomRef.current = true
                      send(s)
                    }}
                    className="text-left text-xs text-slate-400 hover:text-slate-200 bg-[#0f1117] hover:bg-[#13162299] border border-[#2d3148] hover:border-amber-500/30 rounded-lg px-3 py-2.5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                m.role === 'user'
                  ? 'bg-blue-500/15 border border-blue-500/30'
                  : 'bg-amber-500/15 border border-amber-500/30'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Crown className="w-4 h-4 text-amber-400" />}
              </div>
              <div className={`flex-1 max-w-3xl ${m.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className={`text-xs font-medium mb-1 ${m.role === 'user' ? 'text-blue-400' : 'text-amber-400'}`}>
                  {m.role === 'user' ? 'Siz' : 'CEO'}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-slate-200'
                    : 'bg-[#0f1117] border border-[#2d3148] text-slate-200'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-1 text-amber-400">CEO</div>
                <div className="bg-[#0f1117] border border-[#2d3148] rounded-2xl px-4 py-3 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                  <span className="text-xs text-slate-500">Düşünüyor, veri çekiyor... (sekme değiştirebilirsiniz, konuşma kaybolmaz)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Jump to bottom button */}
        {showJumpToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full p-2.5 shadow-lg shadow-amber-500/30 transition-all"
            title="En alta in"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3 mb-3">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="card p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            // Auto-expand textarea
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
          }}
          onKeyDown={onKeyDown}
          placeholder="CEO'ya mesajınızı yazın... (Enter göndermek için, Shift+Enter yeni satır)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none max-h-40 px-3 py-2"
          style={{ minHeight: '40px' }}
          disabled={loading}
        />
        {loading ? (
          <button
            onClick={abort}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Square className="w-4 h-4 fill-current" />
            Durdur
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            Gönder
          </button>
        )}
      </div>
    </div>
  )
}

export default CEOChat
