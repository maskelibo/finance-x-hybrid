import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { api } from '../api'

export type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type CEOChatContextValue = {
  sessionId: string
  messages: Message[]
  loading: boolean
  error: string | null
  send: (text: string) => Promise<void>
  abort: () => Promise<void>
  clear: () => Promise<void>
  reloadHistory: () => Promise<void>
}

const CEOChatContext = createContext<CEOChatContextValue | null>(null)

const SESSION_KEY = 'finance-x-ceo-chat-session'

function getOrCreateSessionId(): string {
  const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null
  if (existing) return existing
  const newId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, newId)
  return newId
}

export const CEOChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId())
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedOnceRef = useRef(false)

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  const reloadHistory = async () => {
    try {
      const res = await api.ceoChatHistory(sessionIdRef.current)
      setMessages(res.history)
    } catch {}
  }

  // Reload history on mount AND when sessionId changes (after clear)
  useEffect(() => {
    reloadHistory()
  }, [sessionId])

  // Polling removed: `send()` already awaits the backend response and updates messages.
  // Multi-tab sync was the only reason for polling, and it was causing duplicate messages
  // and unwanted scroll jumps. If needed later, implement with message IDs + merge logic.

  const send = async (text: string) => {
    if (!text.trim() || inFlightRef.current) return
    setError(null)

    // Optimistic user message
    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Add placeholder assistant message for streaming
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMsg])

    const promise = new Promise<void>((resolve) => {
      const controller = api.ceoChatStream(
        sessionId,
        text,
        // onChunk — append text to the last (assistant) message
        (chunk: string) => {
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + chunk }
            }
            return updated
          })
        },
        // onDone
        () => {
          setLoading(false)
          inFlightRef.current = null
          abortControllerRef.current = null
          resolve()
        },
        // onError
        (errMsg: string) => {
          setError(errMsg || 'CEO yanıt veremedi. Backend çalışıyor mu?')
          // Remove empty assistant message on error
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant' && !last.content) {
              return prev.slice(0, -1)
            }
            return prev
          })
          setLoading(false)
          inFlightRef.current = null
          abortControllerRef.current = null
          resolve()
        }
      )
      abortControllerRef.current = controller
    })

    inFlightRef.current = promise
    await promise
  }

  const abort = async () => {
    // Abort the SSE stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    // Also tell backend to kill the Claude process
    try {
      await api.ceoChatAbort(sessionId)
    } catch {}
    setLoading(false)
    inFlightRef.current = null
  }

  const clear = async () => {
    try {
      await api.ceoChatClear(sessionId)
    } catch {}
    localStorage.removeItem(SESSION_KEY)
    const newId = getOrCreateSessionId()
    setSessionId(newId)
    setMessages([])
    setError(null)
    setLoading(false)
    inFlightRef.current = null
  }

  return (
    <CEOChatContext.Provider
      value={{
        sessionId,
        messages,
        loading,
        error,
        send,
        abort,
        clear,
        reloadHistory,
      }}
    >
      {children}
    </CEOChatContext.Provider>
  )
}

export function useCEOChat(): CEOChatContextValue {
  const ctx = useContext(CEOChatContext)
  if (!ctx) throw new Error('useCEOChat must be used inside CEOChatProvider')
  return ctx
}
