import { nanoid } from 'nanoid';
import { db } from './db.js';
import { loadAgent } from './agents.js';
import { readCEOMemory } from './memory.js';
import { getModelForAgent } from './config.js';
import { createDefaultProviderRouter } from './llm/default-router.js';

let nightTrainingTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let targetHourUTC = 23; // 02:00 Istanbul = 23:00 UTC (Istanbul UTC+3)
let lastRunDate = ''; // YYYY-MM-DD — prevents double-trigger within same day
const providerRouter = createDefaultProviderRouter();

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
      `## 3 KATMANLI HAFIZA SİSTEMİ`,
      ``,
      `Her ajanin 3 hafiza dosyasi var:`,
      `- **memory.md** (max 6KB): Kalici kurallar, kontrol listeleri. HER calismasinda otomatik yuklenir.`,
      `- **knowledge.md** (max 8KB): Domain bilgisi, formuller, benchmark, best practice. Agent ihtiyac duyunca Read ile acar.`,
      `- **memory_archive.md** (sinirsiz): Tum ham egitim kayitlari. Sadece gece egitiminde okunur.`,
      ``,
      `## PROTOKOL (her ajan icin)`,
      ``,
      `### Adim 1: Mevcut durumu oku`,
      `- \`Read\` ile \`agents/{ajan_id}/memory.md\` (kurallar)`,
      `- \`Read\` ile \`agents/{ajan_id}/knowledge.md\` (bilgi bankasi)`,
      `- \`Read\` ile \`agents/{ajan_id}/memory_archive.md\` (gecmis kayitlar)`,
      ``,
      `### Adim 2: Yeni bilgi topla`,
      `- WebSearch ile ajanin uzmanlik alaninda guncel bilgi ara`,
      `- Son raporlardaki feedback'leri kontrol et`,
      ``,
      `### Adim 3: Hafizaya yaz (DOGRU KATMANA!)`,
      `- Yeni kalici kural ogrenmissen → \`Edit\` ile **memory.md**'ye ekle`,
      `- Yeni domain bilgisi/formul/benchmark ogrenmissen → \`Edit\` ile **knowledge.md**'ye ekle`,
      `- Ham arastirma notlarini → \`Edit\` ile **memory_archive.md** sonuna ekle`,
      ``,
      `### Adim 4: Boyut kontrolu`,
      `- memory.md > 6KB mi? → En eski ogrenimi knowledge.md'ye tasi`,
      `- knowledge.md > 8KB mi? → En eski bilgiyi memory_archive.md'ye tasi`,
      `- memory_archive.md sinirsiz buyuyebilir`,
      ``,
      `### Adim 5: Ogrenme puani ver (0-100)`,
      ``,
      `## KURALLAR`,
      `- Sadece yukaridaki ${tonightsAgents.length} ajana odaklan, digerlerine dokunma`,
      `- Her ajan icin max 15 dakika harca`,
      `- Turkce calis`,
      `- **memory.md ASLA 6KB'yi gecemez** — kural tasimazsan reject`,
      `- **knowledge.md ASLA 8KB'yi gecemez** — bilgi tasimazsan reject`,
      `- LLM'in zaten bildigi temel bilgileri yazma (ROE formulu gibi)`,
      `- Sektore ozgu, pratige dayali, somut bilgileri yaz`,
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

async function runClaude(prompt: string, timeoutMs: number): Promise<string> {
  const result = await providerRouter.run({
    prompt,
    model: getModelForAgent('ceo'),
    timeoutMs,
  });

  if (!result.success) {
    if (result.errorType === 'rate_limit') {
      throw new Error('Rate limit — night training postponed, will retry tomorrow');
    }
    throw new Error(result.error || 'Night training provider failed');
  }

  return result.output;
}
