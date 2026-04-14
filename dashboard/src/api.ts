const RAW_BASE_URL = (import.meta.env.VITE_FINANCE_X_API_URL as string | undefined)?.trim();
const BASE_URL = RAW_BASE_URL
  ? RAW_BASE_URL.replace(/\/$/, '')
  : '/api';
const API_KEY = (import.meta.env.VITE_FINANCE_X_API_KEY as string | undefined)?.trim();

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function buildHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const headers = new Headers(extraHeaders);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (API_KEY && !headers.has('x-api-key')) {
    headers.set('x-api-key', API_KEY);
  }
  return headers;
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export function getApiHeaders(extraHeaders?: HeadersInit): HeadersInit {
  return buildHeaders(extraHeaders);
}

function isRetryable(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 0;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  let lastError: Error | null = null;
  const requestTimeout = init?.timeoutMs ?? DEFAULT_TIMEOUT;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      // 0 = no timeout (for long-running requests like CEO chat)
      const timeout = requestTimeout > 0
        ? setTimeout(() => controller.abort(), requestTimeout)
        : null;

      const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: buildHeaders(init?.headers),
      });

      if (timeout) clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (isRetryable(res.status) && attempt < MAX_RETRIES) {
          lastError = new Error(`API ${res.status}: ${text}`);
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw new Error(`API ${res.status}: ${text}`);
      }
      return res.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastError = new Error('İstek zaman aşımına uğradı (30s)');
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network error (backend down)
        lastError = new Error('Backend bağlantısı kurulamadı');
      } else {
        lastError = err;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError || new Error('Bilinmeyen hata');
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),

  listAgents: () =>
    request<{ agents: Array<{ id: string; displayName: string; group: string; systemPromptLength: number; status: string; lastRunAt: string | null; totalRuns: number }> }>('/agents'),

  getAgent: (id: string) =>
    request<{ id: string; displayName: string; group: string; systemPrompt: string }>(`/agents/${id}`),

  startAnalysis: (ticker: string, runtimeMode: string, layers?: string[]) =>
    request<{ sessionId: string; ticker: string; runtimeMode: string; status: string }>('/analysis/start', {
      method: 'POST',
      body: JSON.stringify({ ticker, runtimeMode, layers }),
    }),

  listSessions: () =>
    request<{ sessions: Array<any> }>('/analysis/sessions'),

  getSession: (id: string) =>
    request<{ session: any; runs: Array<any>; reports: Array<any> }>(`/analysis/sessions/${id}`),

  deleteSession: (id: string) =>
    request<{ ok: boolean }>(`/analysis/sessions/${id}`, { method: 'DELETE' }),

  compareCompanies: (tickers: string[]) =>
    request<{ comparisons: Array<any>; missing: string[] }>(`/analysis/compare?tickers=${tickers.join(',')}`),

  getSessionRuns: (id: string) =>
    request<{ runs: Array<any> }>(`/analysis/sessions/${id}/runs`),

  listReports: () =>
    request<{ reports: Array<any> }>('/reports'),

  getReport: (id: string) =>
    request<any>(`/reports/${id}`),

  deleteReport: (id: string) =>
    request<{ ok: boolean }>(`/reports/${id}`, { method: 'DELETE' }),

  statsOverview: () =>
    request<{
      totalAnalyses: number;
      completedAnalyses: number;
      runningAnalyses: number;
      activeAgents: number;
      totalCostUsd: number;
      totalTokens: number;
    }>('/stats/overview'),

  statsCosts: () =>
    request<{ byAgent: Array<{ agent_id: string; agent_display_name: string; runs: number; total_cost: number; total_tokens: number }> }>('/stats/costs'),

  analysisConfig: () =>
    request<{
      modes: Array<{ id: string; label: string }>;
      layers: Array<{ id: string; label: string }>;
    }>('/analysis/config'),

  ceoChat: (sessionId: string, message: string) =>
    request<{ content: string; durationMs: number }>('/ceo/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
      timeoutMs: 0, // No timeout — CEO can take minutes for web research
    }),

  ceoChatStream: (sessionId: string, message: string, onChunk: (text: string) => void, onDone: () => void, onError: (err: string) => void): AbortController => {
    const controller = new AbortController();
    fetch(`${BASE_URL}/ceo/chat/stream`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ sessionId, message }),
        signal: controller.signal,
      })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let message = text;
          try {
            const parsed = JSON.parse(text);
            if (typeof parsed?.error === 'string' && parsed.error.trim()) {
              message = parsed.error.trim();
            }
          } catch {}
          onError(`API ${res.status}: ${message || 'Backend hata döndü ama mesaj boş geldi'}`);
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) { onError('No response body'); return; }
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'text') onChunk(event.content);
              else if (event.type === 'done') onDone();
              else if (event.type === 'error') onError(event.message);
            } catch {}
          }
        }
        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') onError(err.message || 'Bağlantı hatası');
      });
    return controller;
  },

  ceoChatHistory: (sessionId: string) =>
    request<{ history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> }>(`/ceo/chat/${sessionId}`),

  ceoChatClear: (sessionId: string) =>
    request<{ ok: boolean }>(`/ceo/chat/${sessionId}`, { method: 'DELETE' }),

  ceoChatAbort: (sessionId: string) =>
    request<{ ok: boolean }>(`/ceo/chat/${sessionId}/abort`, { method: 'POST' }),

  ceoMemory: () => request<{ content: string; mtime: number }>('/ceo/memory'),
  ceoMemoryUpdate: (content: string, mtime?: number) =>
    request<{ ok: boolean; mtime: number }>('/ceo/memory', {
      method: 'PUT',
      body: JSON.stringify({ content, mtime }),
    }),

  ceoActivities: () =>
    request<{ activities: Array<any> }>('/ceo/activities'),

  ceoHeartbeatRun: () =>
    request<{ ok: boolean; started: boolean }>('/ceo/heartbeat/run', { method: 'POST', timeoutMs: 0 }),

  ceoHeartbeatStatus: () =>
    request<{ running: boolean }>('/ceo/heartbeat/status'),

  goals: () => request<{ goals: Array<any> }>('/goals'),
  createGoal: (title: string, description?: string, priority?: string) =>
    request<{ id: string }>('/goals', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority }),
    }),
  updateGoal: (id: string, data: { status?: string; progress_notes?: string }) =>
    request<{ ok: boolean }>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGoal: (id: string) =>
    request<{ ok: boolean }>(`/goals/${id}`, { method: 'DELETE' }),

  watchlist: () => request<{ watchlist: Array<any> }>('/watchlist'),
  addToWatchlist: (ticker: string, company_name?: string, notes?: string) =>
    request<{ id: string }>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ ticker, company_name, notes }),
    }),
  removeFromWatchlist: (id: string) =>
    request<{ ok: boolean }>(`/watchlist/${id}`, { method: 'DELETE' }),

  resumeAllPaused: () =>
    request<{ available: boolean; resumed: number }>('/analysis/resume-all', { method: 'POST' }),

  resumeSession: (id: string) =>
    request<{ ok: boolean }>(`/analysis/sessions/${id}/resume`, { method: 'POST' }),

  runFeedbackLoop: (id: string) =>
    request<{ ok: boolean; started: boolean }>(`/analysis/sessions/${id}/feedback`, { method: 'POST', timeoutMs: 0 }),

  getSettings: () => request<Record<string, any>>('/settings'),
  updateSettings: (settings: Record<string, any>) =>
    request<{ ok: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  kapEvents: (filters?: { ticker?: string; event_type?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (filters?.ticker) qs.set('ticker', filters.ticker)
    if (filters?.event_type) qs.set('event_type', filters.event_type)
    if (filters?.limit) qs.set('limit', String(filters.limit))
    return request<{ events: Array<any> }>(`/kap/events${qs.toString() ? '?' + qs : ''}`)
  },
};
