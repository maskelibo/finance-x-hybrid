import { spawn, ChildProcess } from 'node:child_process';
import { nanoid } from 'nanoid';
import { loadAgent } from './agents.js';
import { readCEOMemory } from './memory.js';
import { db } from './db.js';
import { CLAUDE_SPAWN_OPTIONS, CLAUDE_MODEL } from './config.js';
import type { Response } from 'express';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

const sessionStore = new Map<string, { history: ChatMessage[]; claudeSessionId?: string }>();

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
    sessionStore.set(sessionId, { history: [] });
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

/**
 * Send a message to the CEO agent and get a response.
 */
export async function chatWithCEO(sessionId: string, userMessage: string): Promise<{ content: string; durationMs: number }> {
  const session = getOrCreateSession(sessionId);
  const ceo = loadAgent('ceo');
  const startedAt = Date.now();

  session.history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  const isFirstMessage = session.history.length === 1;
  const memory = readCEOMemory();
  const liveContext = buildContextSnapshot();

  const fullPrompt = isFirstMessage
    ? [
        `# Sen Finance X platformunun CEO Meta-Ajanısın.`,
        ``,
        `## System Instructions`,
        ceo.systemPrompt,
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
        `- Sıklıkla DB'ye yazabilmen için: backend API http://localhost:4000`,
        ``,
        `## Kullanıcı Mesajı`,
        userMessage,
      ].join('\n')
    : userMessage;

  return new Promise((resolve, reject) => {
    const args = [
      '-p', fullPrompt,
      '--model', CLAUDE_MODEL,
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
    ];

    if (session.claudeSessionId) {
      args.push('--resume', session.claudeSessionId);
    }

    const child = spawn('claude', args, {
      ...CLAUDE_SPAWN_OPTIONS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Register for cancellation
    activeProcesses.set(sessionId, child);

    let stdoutBuf = '';
    let stderrBuf = '';
    let wasAborted = false;

    child.stdout.on('data', (chunk: Buffer) => { stdoutBuf += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderrBuf += chunk.toString('utf8'); });

    child.on('error', (err) => {
      activeProcesses.delete(sessionId);
      reject(new Error(`Claude process error: ${err.message}`));
    });

    child.on('close', (code, signal) => {
      activeProcesses.delete(sessionId);

      if (signal === 'SIGTERM' || wasAborted) {
        // User cancelled — add a system message and resolve gracefully
        session.history.push({
          role: 'assistant',
          content: '⏹ Sohbet kullanıcı tarafından durduruldu.',
          timestamp: new Date().toISOString(),
        });
        resolve({ content: '⏹ Sohbet kullanıcı tarafından durduruldu.', durationMs: Date.now() - startedAt });
        return;
      }

      if (code !== 0) {
        reject(new Error(stderrBuf || `Claude exited with code ${code}`));
        return;
      }

      let assistantContent = stdoutBuf;
      try {
        const parsed = JSON.parse(stdoutBuf);
        if (parsed.result) assistantContent = parsed.result;
        if (parsed.session_id) session.claudeSessionId = parsed.session_id;
      } catch {}

      session.history.push({
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      });

      const durationMs = Date.now() - startedAt;

      // Log this conversation as a CEO activity
      try {
        db.prepare(`
          INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, output_text, duration_ms, created_at)
          VALUES (?, 'chat', ?, ?, 'chairman', 'completed', ?, ?, ?)
        `).run(
          nanoid(),
          userMessage.slice(0, 100),
          'Chairman sohbeti',
          assistantContent.slice(0, 2000),
          durationMs,
          new Date().toISOString()
        );
      } catch {}

      resolve({ content: assistantContent, durationMs });
    });
  });
}

/**
 * Stream CEO chat via SSE — sends partial text as it arrives from Claude CLI.
 */
export function streamChatWithCEO(sessionId: string, userMessage: string, res: Response): void {
  const session = getOrCreateSession(sessionId);
  const ceo = loadAgent('ceo');
  const startedAt = Date.now();

  session.history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  const isFirstMessage = session.history.length === 1;
  const memory = readCEOMemory();
  const liveContext = buildContextSnapshot();

  const fullPrompt = isFirstMessage
    ? [
        `# Sen Finance X platformunun CEO Meta-Ajanısın.`,
        ``,
        `## System Instructions`,
        ceo.systemPrompt,
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
        `- Sıklıkla DB'ye yazabilmen için: backend API http://localhost:4000`,
        ``,
        `## Kullanıcı Mesajı`,
        userMessage,
      ].join('\n')
    : userMessage;

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const args = [
    '--print',
    '-p', fullPrompt,
    '--model', CLAUDE_MODEL,
    '--permission-mode', 'bypassPermissions',
    '--output-format', 'stream-json',
    '--verbose',
  ];

  if (session.claudeSessionId) {
    args.push('--resume', session.claudeSessionId);
  }

  const child = spawn('claude', args, {
    ...CLAUDE_SPAWN_OPTIONS,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  activeProcesses.set(sessionId, child);

  let fullContent = '';
  let stderrBuf = '';
  let lineBuf = '';

  child.stdout.on('data', (chunk: Buffer) => {
    lineBuf += chunk.toString('utf8');
    const lines = lineBuf.split('\n');
    lineBuf = lines.pop() || ''; // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);

        if (event.type === 'assistant' && event.message?.content) {
          // Claude stream-json: assistant message with content array
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              // Only send new text (Claude re-emits full content each time)
              const newText = block.text.slice(fullContent.length);
              if (newText) {
                fullContent = block.text;
                res.write(`data: ${JSON.stringify({ type: 'text', content: newText })}\n\n`);
              }
            }
          }
          if (event.session_id) session.claudeSessionId = event.session_id;
        } else if (event.type === 'result') {
          // Final result event
          if (event.session_id) session.claudeSessionId = event.session_id;
          if (event.result && !fullContent) {
            fullContent = event.result;
            res.write(`data: ${JSON.stringify({ type: 'text', content: event.result })}\n\n`);
          }
        }
        // Skip system, rate_limit_event, and other non-content events
      } catch {
        // Not valid JSON — skip
      }
    }
  });

  child.stderr.on('data', (chunk: Buffer) => { stderrBuf += chunk.toString('utf8'); });

  // Client disconnect — kill the process
  res.on('close', () => {
    if (activeProcesses.has(sessionId)) {
      child.kill('SIGTERM');
      activeProcesses.delete(sessionId);
    }
  });

  child.on('close', (code, signal) => {
    activeProcesses.delete(sessionId);

    // Process remaining buffer
    if (lineBuf.trim()) {
      try {
        const event = JSON.parse(lineBuf);
        if (event.type === 'result') {
          if (!fullContent) fullContent = event.result || '';
          session.claudeSessionId = event.session_id || session.claudeSessionId;
        }
      } catch {}
    }

    const durationMs = Date.now() - startedAt;

    if (signal === 'SIGTERM') {
      try { res.write(`data: ${JSON.stringify({ type: 'done', aborted: true })}\n\n`); } catch {}
    } else {
      try { res.write(`data: ${JSON.stringify({ type: 'done', durationMs })}\n\n`); } catch {}
    }

    // Save to history
    if (fullContent) {
      session.history.push({
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString(),
      });
    }

    // Log activity
    try {
      db.prepare(`
        INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, output_text, duration_ms, created_at)
        VALUES (?, 'chat', ?, ?, 'chairman', 'completed', ?, ?, ?)
      `).run(
        nanoid(),
        userMessage.slice(0, 100),
        'Chairman sohbeti',
        (fullContent || '').slice(0, 2000),
        durationMs,
        new Date().toISOString()
      );
    } catch {}

    res.end();
  });

  child.on('error', (err) => {
    activeProcesses.delete(sessionId);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  });
}

export function clearSession(sessionId: string) {
  sessionStore.delete(sessionId);
}
