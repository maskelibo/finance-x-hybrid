import { nanoid } from 'nanoid';
import { db } from './db.js';
import { loadAgent } from './agents.js';
import { readCEOMemory } from './memory.js';
import { getModelForAgent } from './config.js';
import { createDefaultProviderRouter, resolveFallbackProviderId } from './llm/default-router.js';

let heartbeatTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let intervalMs = 30 * 60 * 1000; // 30 minutes default
const providerRouter = createDefaultProviderRouter();

export function startHeartbeat(intervalMinutes: number = 30) {
  intervalMs = intervalMinutes * 60 * 1000;
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (!isRunning) {
      void runHeartbeatCycle().catch(err => console.error('Heartbeat error:', err));
    }
  }, intervalMs);
  console.log(`💓 Heartbeat started — every ${intervalMinutes} minutes`);
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export async function runHeartbeatCycle(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const startedAt = Date.now();
  const activityId = nanoid();
  const now = new Date().toISOString();

  // Pre-log this activity as running
  db.prepare(`
    INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
    VALUES (?, 'heartbeat', 'Otonom uyanma döngüsü', ?, 'autonomous', 'running', ?)
  `).run(activityId, `Saatlik kontrol — ${new Date().toLocaleString('tr-TR')}`, now);

  try {
    // Gather context
    const watchlist = db.prepare(`SELECT ticker, company_name FROM watchlist`).all() as any[];
    const goals = db.prepare(`SELECT title, status FROM goals WHERE status = 'active'`).all() as any[];
    const memory = readCEOMemory();
    const ceo = loadAgent('ceo');

    const prompt = [
      `# Otonom Heartbeat Çağrısı`,
      ``,
      `Sen Finance X platformunun CEO Meta-Ajanısın. Şu an Chairman seninle konuşmuyor — otonom döngün çalıştı.`,
      ``,
      `## Sorumlulukların`,
      `1. KAP (kap.org.tr) üzerinden son 1 saatte yayınlanan önemli bildirimleri kontrol et`,
      `2. Watchlist'teki şirketlerde olağandışı durum var mı bak`,
      `3. Aktif hedeflerin durumunu değerlendir`,
      `4. Bir şey acil mi? Chairman'a alert oluşturulması gerekiyor mu?`,
      `5. Bulgularını agents/ceo/memory.md dosyasına kısa bir not olarak ekle`,
      ``,
      `## Kalıcı Hafızan`,
      memory,
      ``,
      `## Watchlist`,
      watchlist.length > 0 ? watchlist.map(w => `- ${w.ticker}`).join('\n') : '(boş)',
      ``,
      `## Aktif Hedefler`,
      goals.length > 0 ? goals.map(g => `- ${g.title}`).join('\n') : '(yok)',
      ``,
      `## System Prompt`,
      ceo.systemPrompt.slice(0, 2000) + '...',
      ``,
      `## Talimat`,
      `Görevini yerine getir. Sonunda kısa bir özet üret (max 500 kelime). Türkçe.`,
      `İhtiyacın olursa WebFetch ile veri çek, Edit ile memory.md'yi güncelle.`,
      `Eğer hiçbir önemli şey yoksa "Sakin döngü, önemli olay yok" yaz.`,
    ].join('\n');

    const result = await runHeartbeatLLM(prompt, 5 * 60 * 1000);
    const durationMs = Date.now() - startedAt;

    db.prepare(`
      UPDATE ceo_activities
      SET status = 'completed', output_text = ?, duration_ms = ?
      WHERE id = ?
    `).run(result.slice(0, 5000), durationMs, activityId);

    console.log(`💓 Heartbeat completed in ${(durationMs / 1000).toFixed(1)}s`);
  } catch (err: any) {
    db.prepare(`
      UPDATE ceo_activities
      SET status = 'failed', output_text = ?, duration_ms = ?
      WHERE id = ?
    `).run(err.message || String(err), Date.now() - startedAt, activityId);
    console.error('Heartbeat failed:', err);
  } finally {
    isRunning = false;
  }
}

export function isHeartbeatRunning(): boolean {
  return isRunning;
}

function runClaude(prompt: string, timeoutMs: number): Promise<string> {
  return runHeartbeatLLM(prompt, timeoutMs);
}

async function runHeartbeatLLM(prompt: string, timeoutMs: number): Promise<string> {
  const primaryProvider = providerRouter.getPrimaryProvider().id;
  const result = await providerRouter.run({
    prompt,
    model: getModelForAgent('ceo', primaryProvider),
    fallbackModel: resolveFallbackProviderId()
      ? getModelForAgent('ceo', resolveFallbackProviderId()!)
      : undefined,
    timeoutMs,
  });

  if (!result.success) {
    if (result.errorType === 'rate_limit') {
      throw new Error('Rate limit — heartbeat atlandı, bir sonraki döngüde tekrar denenecek');
    }
    throw new Error(result.error || 'Heartbeat provider failed');
  }

  return result.output;
}
