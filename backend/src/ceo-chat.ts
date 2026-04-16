import type { ChildProcess } from 'node:child_process';
import { nanoid } from 'nanoid';
import { loadAgent } from './agents.js';
import { readCEOMemory } from './memory.js';
import { db } from './db.js';
import { PORT } from './config.js';
import type { Response } from 'express';
import { ClaudeChatProvider } from './llm/claude-chat-provider.js';
import { ChatProviderError, type ChatMessage, type ChatProviderId, type ChatSessionState } from './llm/chat-types.js';
import type { ChatProvider } from './llm/chat-provider-interface.js';

const sessionStore = new Map<string, ChatSessionState>();
const claudeChatProvider = new ClaudeChatProvider();

// Track in-flight Claude processes per session so we can abort them
const activeProcesses = new Map<string, ChildProcess>();

export function abortCEOChat(sessionId: string): boolean {
  const proc = activeProcesses.get(sessionId);
  if (!proc) return false;
  proc.kill('SIGTERM');
  activeProcesses.delete(sessionId);
  return true;
}

export function getOrCreateSession(sessionId: string) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, { history: [], providerSessions: {} });
  }
  return sessionStore.get(sessionId)!;
}

export function getSessionHistory(sessionId: string): ChatMessage[] {
  return sessionStore.get(sessionId)?.history || [];
}

function buildContextSnapshot(): string {
  // Pull live state from DB so CEO has awareness of company state
  const goals = db.prepare(`SELECT title, status, priority FROM goals WHERE status = 'active' LIMIT 20`).all() as any[];
  const watchlist = db.prepare(`SELECT ticker, company_name FROM watchlist LIMIT 30`).all() as any[];
  const recentSessions = db.prepare(`
    SELECT ticker, status, started_at FROM analysis_sessions ORDER BY started_at DESC LIMIT 5
  `).all() as any[];
  const recentActivities = db.prepare(`
    SELECT activity_type, title, created_at FROM ceo_activities ORDER BY created_at DESC LIMIT 5
  `).all() as any[];

  let context = '## Canlı Şirket Durumu (otomatik enjekte)\n\n';

  context += `**Aktif Hedefler:** ${goals.length}\n`;
  if (goals.length > 0) {
    goals.slice(0, 5).forEach((g: any) => {
      context += `- [${g.priority}] ${g.title}\n`;
    });
  }

  context += `\n**Watchlist:** ${watchlist.length} şirket\n`;
  if (watchlist.length > 0) {
    context += watchlist.map((w: any) => w.ticker).join(', ') + '\n';
  }

  context += `\n**Son Analizler:**\n`;
  if (recentSessions.length === 0) {
    context += '(henüz analiz yok)\n';
  } else {
    recentSessions.forEach((s: any) => {
      context += `- ${s.ticker} (${s.status}) — ${s.started_at}\n`;
    });
  }

  context += `\n**Son Otonom Aktivitelerin:**\n`;
  if (recentActivities.length === 0) {
    context += '(henüz aktivite yok)\n';
  } else {
    recentActivities.forEach((a: any) => {
      context += `- ${a.activity_type}: ${a.title} (${a.created_at})\n`;
    });
  }

  return context;
}

function buildCEOChatPrompt(userMessage: string, isFirstMessage: boolean, systemPrompt: string, memory: string, liveContext: string): string {
  if (!isFirstMessage) {
    return userMessage;
  }

  return [
    `# Sen Finance X platformunun CEO Meta-Ajanısın.`,
    ``,
    `## System Instructions`,
    systemPrompt,
    ``,
    `## Kalıcı Hafızan (agents/ceo/memory.md)`,
    memory,
    ``,
    liveContext,
    ``,
    `## Önemli Talimatlar`,
    `- Türkçe konuş`,
    `- Sen yatırımcı sahibi (Chairman/CEO İbrahim Peyman) ile konuşuyorsun`,
    `- Sen pasif bir asistan değilsin — şirketin yönetim ajanısın, kararlar alırsın`,
    `- Canlı veri için WebFetch ve WebSearch kullan (KAP.gov.tr, isyatirim.com.tr)`,
    `- Hafızanı güncellemen gerektiğinde Edit tool ile agents/ceo/memory.md dosyasını düzenle`,
    `- System prompt'unu güncellemen gerektiğinde agents/ceo/system_prompt.md dosyasını düzenle`,
    `- Yeni hedef tanımlanırsa goals tablosuna ekle (önce goals tablosu için backend API'yi öğren)`,
    `- Watchlist'e şirket eklemek için watchlist API'sini kullan`,
    `- Diğer agentlara görev atayabilirsin (orchestrator, financial_analysis, kap_watch, vb.)`,
    `- Cevaplarını net, profesyonel, evidence-backed tut`,
    `- Sıklıkla DB'ye yazabilmen için: backend API http://localhost:${PORT}`,
    ``,
    `## Kullanıcı Mesajı`,
    userMessage,
  ].join('\n');
}

function buildTranscriptReplay(history: ChatMessage[]): string {
  const transcript = history
    .slice(-12)
    .map((message) => `${message.role === 'user' ? 'Chairman' : 'CEO'} [${message.timestamp}]:\n${message.content}`)
    .join('\n\n');

  return transcript || '(önceki mesaj yok)';
}

function buildProviderPrompt(
  providerId: ChatProviderId,
  userMessage: string,
  session: ChatSessionState,
  systemPrompt: string,
  memory: string,
  liveContext: string,
): string {
  if (providerId === 'claude' && session.providerSessions.claude) {
    return userMessage;
  }

  const transcript = buildTranscriptReplay(session.history);
  return [
    `# Sen Finance X platformunun CEO Meta-Ajanısın.`,
    ``,
    `## System Instructions`,
    systemPrompt,
    ``,
    `## Kalıcı Hafızan (agents/ceo/memory.md)`,
    memory,
    ``,
    liveContext,
    ``,
    `## Sohbet Geçmişi`,
    transcript,
    ``,
    `## Son Talimat`,
    `Sohbeti yukarıdaki bağlamı koruyarak devam ettir. Son kullanıcı mesajını doğrudan yanıtla.`,
  ].join('\n');
}

function rememberProviderSession(session: ChatSessionState, providerId: ChatProviderId, providerSessionId?: string) {
  session.lastProvider = providerId;
  if (!providerSessionId) return;
  session.providerSessions[providerId] = providerSessionId;
}

function logChatActivity(userMessage: string, assistantContent: string, durationMs: number, provider: ChatProviderId) {
  try {
    db.prepare(`
      INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, output_text, duration_ms, created_at)
      VALUES (?, 'chat', ?, ?, 'chairman', 'completed', ?, ?, ?)
    `).run(
      nanoid(),
      userMessage.slice(0, 100),
      `Chairman sohbeti [provider: ${provider}]`,
      assistantContent.slice(0, 2000),
      durationMs,
      new Date().toISOString()
    );
  } catch {}
}

function getProvider(_providerId: ChatProviderId): ChatProvider {
  return claudeChatProvider;
}

function getProviderOrder(): ChatProviderId[] {
  return ['claude'];
}

function shouldRetryWithFallback(error: unknown, _providerId: ChatProviderId): boolean {
  if (!(error instanceof ChatProviderError)) return false;
  // Retry with fallback on rate limit, auth, or unknown errors — works both directions
  return error.errorType === 'rate_limit' || error.errorType === 'auth' || error.errorType === 'unknown';
}

/**
 * Send a message to the CEO agent and get a response.
 */
export async function chatWithCEO(sessionId: string, userMessage: string): Promise<{ content: string; durationMs: number }> {
  const session = getOrCreateSession(sessionId);
  const ceo = loadAgent('ceo');

  session.history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  const isFirstMessage = session.history.length === 1;
  const memory = readCEOMemory();
  const liveContext = buildContextSnapshot();

  const providerOrder = getProviderOrder();
  console.log(`[CEO CHAT] Provider order: ${providerOrder.join(' → ')}`);

  let lastError: unknown;
  for (const providerId of providerOrder) {
    const provider = getProvider(providerId);
    try {
      const prompt = isFirstMessage
        ? buildCEOChatPrompt(userMessage, isFirstMessage, ceo.systemPrompt, memory, liveContext)
        : buildProviderPrompt(providerId, userMessage, session, ceo.systemPrompt, memory, liveContext);
      const run = await provider.chat({
        prompt,
        session,
        onProcess: (process) => {
          activeProcesses.set(sessionId, process);
        },
      });
      activeProcesses.delete(sessionId);

      rememberProviderSession(session, providerId, run.providerSessionId);

      session.history.push({
        role: 'assistant',
        content: run.content,
        timestamp: new Date().toISOString(),
      });

      logChatActivity(userMessage, run.content, run.durationMs, providerId);
      return { content: run.content, durationMs: run.durationMs };
    } catch (error) {
      activeProcesses.delete(sessionId);
      lastError = error;
      if (!shouldRetryWithFallback(error, providerId) || providerId === getProviderOrder().at(-1)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('CEO chat failed');
}

/**
 * Stream CEO chat via SSE — sends partial text as it arrives from Claude CLI.
 */
export function streamChatWithCEO(sessionId: string, userMessage: string, res: Response): void {
  const session = getOrCreateSession(sessionId);
  const ceo = loadAgent('ceo');

  session.history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  const isFirstMessage = session.history.length === 1;
  const memory = readCEOMemory();
  const liveContext = buildContextSnapshot();

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const providerOrder = getProviderOrder();
  let currentAttempt = 0;
  let emittedText = false;
  let currentAbort: (() => void) | null = null;

  const startAttempt = () => {
    const providerId = providerOrder[currentAttempt];
    const provider = getProvider(providerId);
    const prompt = isFirstMessage
      ? buildCEOChatPrompt(userMessage, isFirstMessage, ceo.systemPrompt, memory, liveContext)
      : buildProviderPrompt(providerId, userMessage, session, ceo.systemPrompt, memory, liveContext);

    const stream = provider.streamChat(
      {
        prompt,
        session,
        onProcess: (process) => {
          activeProcesses.set(sessionId, process);
        },
      },
      {
        onText: (text) => {
          emittedText = emittedText || text.length > 0;
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
        },
        onDone: ({ aborted, durationMs, providerSessionId }) => {
          activeProcesses.delete(sessionId);
          rememberProviderSession(session, providerId, providerSessionId);
          if (aborted) {
            try { res.write(`data: ${JSON.stringify({ type: 'done', aborted: true })}\n\n`); } catch {}
          } else {
            try { res.write(`data: ${JSON.stringify({ type: 'done', durationMs })}\n\n`); } catch {}
          }
          res.end();
        },
        onError: ({ message, errorType }) => {
          activeProcesses.delete(sessionId);
          const hasFallback = currentAttempt < providerOrder.length - 1;
          if (hasFallback && !emittedText && (errorType === 'rate_limit' || errorType === 'auth' || errorType === 'unknown')) {
            currentAttempt += 1;
            startAttempt();
            return;
          }
          res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
          res.end();
        },
        onComplete: (result) => {
          rememberProviderSession(session, providerId, result.providerSessionId);
          if (result.content) {
            session.history.push({
              role: 'assistant',
              content: result.content,
              timestamp: new Date().toISOString(),
            });
          }
          logChatActivity(userMessage, result.content || '', result.durationMs, providerId);
        },
      },
    );

    activeProcesses.set(sessionId, stream.process);
    currentAbort = stream.abort;
  };

  startAttempt();

  // Client disconnect — kill the process
  res.on('close', () => {
    if (activeProcesses.has(sessionId)) {
      currentAbort?.();
      activeProcesses.delete(sessionId);
    }
  });
}

export function clearSession(sessionId: string) {
  sessionStore.delete(sessionId);
}
