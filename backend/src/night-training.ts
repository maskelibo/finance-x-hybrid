import { spawn } from 'node:child_process';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { loadAgent } from './agents.js';
import { readCEOMemory } from './memory.js';
import { CLAUDE_SPAWN_OPTIONS, CLAUDE_MODEL } from './config.js';

let nightTrainingTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let targetHourUTC = 23; // 02:00 Istanbul = 23:00 UTC (Istanbul UTC+3)
let lastRunDate = ''; // YYYY-MM-DD — prevents double-trigger within same day

/**
 * Başlat: Her gece belirtilen saatte (UTC) gece eğitimi protokolünü tetikler
 * @param hourUTC - Saat (0-23, UTC timezone)
 */
export function startNightTraining(hourUTC: number = 23) {
  targetHourUTC = hourUTC;

  // Her saat kontrol et, doğru saatte tetikle
  if (nightTrainingTimer) clearInterval(nightTrainingTimer);

  nightTrainingTimer = setInterval(() => {
    const now = new Date();
    const currentHour = now.getUTCHours();

    const todayStr = now.toISOString().slice(0, 10);
    // Sadece hedef saatte, henüz çalışmıyorsa ve bugün henüz çalışmadıysa tetikle
    if (currentHour === targetHourUTC && !isRunning && lastRunDate !== todayStr) {
      lastRunDate = todayStr;
      void runNightTrainingCycle().catch(err =>
        console.error('Night training error:', err)
      );
    }
  }, 60 * 60 * 1000); // Her saat kontrol et

  console.log(`🌙 Night Training started — will run daily at ${targetHourUTC}:00 UTC (02:00 Istanbul)`);
}

export function stopNightTraining() {
  if (nightTrainingTimer) {
    clearInterval(nightTrainingTimer);
    nightTrainingTimer = null;
  }
}

export async function runNightTrainingCycle(): Promise<void> {
  if (isRunning) {
    console.log('⚠️  Night training already running, skipping');
    return;
  }

  isRunning = true;
  const startedAt = Date.now();
  const activityId = nanoid();
  const now = new Date().toISOString();

  console.log(`🌙 Night Training Protocol initiated — ${new Date().toLocaleString('tr-TR')}`);

  db.prepare(`
    INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
    VALUES (?, 'night_training', 'META CEO — Gece Eğitim Protokolü', ?, 'autonomous', 'running', ?)
  `).run(
    activityId,
    `Gece eğitim döngüsü başlatıldı — ${new Date().toLocaleString('tr-TR')}`,
    now
  );

  try {
    const memory = readCEOMemory();
    const ceo = loadAgent('ceo');

    // ROTASYON SİSTEMİ: Her gece 4-5 agent eğit, 4-5 günde bir tur tamamla
    const ALL_TRAINABLE_AGENTS = [
      'data_collection', 'parse_standardization', 'reconciliation', 'context_extraction',
      'financial_analysis', 'sector_competition', 'macro_analysis', 'technical_analysis',
      'kap_watch', 'event_classification', 'event_impact_mapper', 'event_timeline_alert',
      'qa_review', 'strategic_synthesis', 'final_summary', 'report_formatter',
      'valuation_agent', 'sentiment_news_agent', 'analyst_consensus_agent', 'esg_agent',
    ];
    const BATCH_SIZE = 5;

    // Determine which batch to train tonight (rotate based on day of year)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const batchIndex = dayOfYear % Math.ceil(ALL_TRAINABLE_AGENTS.length / BATCH_SIZE);
    const tonightsAgents = ALL_TRAINABLE_AGENTS.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

    console.log(`  Tonight's batch (${batchIndex + 1}/${Math.ceil(ALL_TRAINABLE_AGENTS.length / BATCH_SIZE)}): ${tonightsAgents.join(', ')}`);

    const prompt = [
      `# META CEO — Gece Egitim Protokolu`,
      ``,
      `Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
      `Rotasyon: Batch ${batchIndex + 1} / ${Math.ceil(ALL_TRAINABLE_AGENTS.length / BATCH_SIZE)}`,
      ``,
      `## GOREV`,
      `Bu gece sadece su ${tonightsAgents.length} ajani egit:`,
      ``,
      tonightsAgents.map(a => `- ${a}`).join('\n'),
      ``,
      `## PROTOKOL (her ajan icin)`,
      `1. agents/{ajan_id}/memory.md dosyasini Read ile oku`,
      `2. Onceki feedback'ler uygulanmis mi kontrol et`,
      `3. WebSearch ile ajanin uzmanlik alaninda guncel bilgi topla`,
      `4. Memory dosyasini Edit ile guncelle (yeni ogrenmeleri ekle)`,
      `5. Ogrenme puani (0-100) belirle`,
      ``,
      `## KURALLAR`,
      `- Sadece yukaridaki ${tonightsAgents.length} ajana odaklan, digerlerine dokunma`,
      `- Her ajan icin max 15 dakika harca`,
      `- Turkce calis`,
      `- Memory dosyalarini 5KB'in altinda tut`,
      ``,
      `## CEO HAFIZA`,
      memory.slice(0, 2000),
    ].join('\n');

    const result = await runClaude(prompt, 2 * 60 * 60 * 1000); // 2 saat timeout (eskiden 4 saat)
    const durationMs = Date.now() - startedAt;

    db.prepare(`
      UPDATE ceo_activities
      SET status = 'completed', output_text = ?, duration_ms = ?
      WHERE id = ?
    `).run(result.slice(0, 10000), durationMs, activityId);

    console.log(`🌙 Night Training completed in ${(durationMs / 1000 / 60).toFixed(1)} minutes`);
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    db.prepare(`
      UPDATE ceo_activities
      SET status = 'failed', output_text = ?, duration_ms = ?
      WHERE id = ?
    `).run(err.message || String(err), durationMs, activityId);
    console.error('🌙 Night Training failed:', err);
  } finally {
    isRunning = false;
  }
}

export function isNightTrainingRunning(): boolean {
  return isRunning;
}

function runClaude(prompt: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--model', CLAUDE_MODEL,
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
    ];

    const child = spawn('claude', args, {
      ...CLAUDE_SPAWN_OPTIONS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    child.stdout.on('data', (c: Buffer) => { stdoutBuf += c.toString('utf8'); });
    child.stderr.on('data', (c: Buffer) => { stderrBuf += c.toString('utf8'); });

    const timeout = setTimeout(() => child.kill('SIGTERM'), timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const combined = (stderrBuf + ' ' + stdoutBuf).toLowerCase();
        const isRateLimit = combined.includes('limit') || combined.includes('quota') || combined.includes('429');
        const errMsg = isRateLimit
          ? 'Rate limit — night training postponed, will retry tomorrow'
          : (stderrBuf || `Exited with ${code}`);
        reject(new Error(errMsg));
        return;
      }
      let result = stdoutBuf;
      try {
        const parsed = JSON.parse(stdoutBuf);
        if (parsed.result) result = parsed.result;
      } catch {}
      resolve(result);
    });
  });
}
