import { spawn } from 'node:child_process';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { loadAgent } from './agents.js';
import { readAgentMemory } from './memory.js';
import { CLAUDE_SPAWN_OPTIONS, CLAUDE_MODEL } from './config.js';

/**
 * CEO Feedback Loop — Post-Report Agent Review
 *
 * After a report is completed, the CEO reviews all agent outputs,
 * identifies gaps, and writes feedback directly into each agent's memory.
 * This creates a learning cycle: each agent improves over time.
 */

export async function runFeedbackLoop(sessionId: string): Promise<string> {
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
  if (!session) throw new Error('Session not found');

  const runs = db.prepare(`
    SELECT agent_id, agent_display_name, output_text, status
    FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC
  `).all(sessionId) as Array<{
    agent_id: string;
    agent_display_name: string;
    output_text: string | null;
    status: string;
  }>;

  // Build a summary of all agent outputs for CEO review
  const agentSummaries = runs
    .filter(r => r.output_text && r.status === 'completed')
    .map(r => `### ${r.agent_display_name} (${r.agent_id})\n${r.output_text!.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  const ceo = loadAgent('ceo');
  const ceoMemory = readAgentMemory('ceo');

  const prompt = [
    `# CEO Post-Report Feedback Loop`,
    ``,
    `Sen Finance X CEO Meta-Ajanısın. Az önce ${session.ticker} için bir analiz tamamlandı.`,
    ``,
    `## Görevin`,
    `Her agent'ın çıktısını gözden geçir ve EKSİKLİKLERİ tespit et.`,
    ``,
    `## Hafızan`,
    ceoMemory.slice(0, 2000),
    ``,
    `## Chairman'ın Beklentileri`,
    `Chairman şu metriklerin MUTLAKA olmasını istiyor:`,
    `- Net Satışlar, Brüt Kar, FAVÖK, Cash FAVÖK`,
    `- DSO, DIO, DPO, CCC (Nakit Dönüşüm Süresi)`,
    `- Net İşletme Sermayesi / Hasılat, NWC Gün Sayısı`,
    `- Net Borç / FAVÖK, Faiz Karşılama Oranı`,
    `- Cari Oran, Asit-Test Oranı`,
    `- ROE, ROCE, ROIC`,
    `- Serbest Nakit Akışı, CAPEX / FAVÖK`,
    `- İşletme Nakit / FAVÖK oranı`,
    `- Jeopolitik bağlam (İran-ABD, Rusya-Ukrayna etkisi)`,
    `- Sektör-spesifik makro geçiş mekanizması`,
    `- Her ratio'nun yorumu (sadece rakam yazmak YASAK)`,
    ``,
    `## Agent Çıktıları`,
    agentSummaries,
    ``,
    `## Ne Yapman Gerekiyor`,
    ``,
    `Her agent için:`,
    `1. Çıktısını oku`,
    `2. Eksikleri listele`,
    `3. O agent'ın memory dosyasını güncelle — Edit tool ile agents/{agent_id}/memory.md dosyasına şunu ekle:`,
    ``,
    `\`\`\``,
    `## CEO Geri Bildirimi — ${new Date().toISOString().split('T')[0]} — ${session.ticker} Raporu`,
    `### Eksikler:`,
    `- [eksik 1]`,
    `- [eksik 2]`,
    `### Bundan Sonra:`,
    `- [kural 1 — bundan sonra HER raporda şunu yap]`,
    `- [kural 2]`,
    `\`\`\``,
    ``,
    `Agent memory dosya yolları:`,
    runs.filter(r => r.status === 'completed').map(r => `- agents/${r.agent_id}/memory.md`).join('\n'),
    ``,
    `## ÖNEMLİ`,
    `- Sadece metrikleri değil, YORUMLARI da kontrol et`,
    `- Makro analiz jeopolitik bağlam içeriyor mu kontrol et`,
    `- Financial analysis TÜM metrikleri kapsıyor mu kontrol et (DSO, DIO, DPO, CCC, NWC, vb.)`,
    `- Her eksik bulduğun agent'ın memory.md'sine Edit ile yaz`,
    `- Son olarak kendi memory'ne (agents/ceo/memory.md) bu review'un özetini ekle`,
    `- Türkçe yaz`,
  ].join('\n');

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

    const timeout = setTimeout(() => child.kill('SIGTERM'), 15 * 60 * 1000); // 15 min

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);

      let result = stdoutBuf;
      try {
        const parsed = JSON.parse(stdoutBuf);
        if (parsed.result) result = parsed.result;
      } catch {}

      if (code !== 0) {
        reject(new Error(stderrBuf || `Feedback loop exited with ${code}`));
        return;
      }

      // Log this as CEO activity
      try {
        db.prepare(`
          INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, output_text, created_at)
          VALUES (?, 'feedback_loop', ?, ?, 'autonomous', 'completed', ?, ?)
        `).run(
          nanoid(),
          `${session.ticker} rapor geri bildirim döngüsü`,
          `CEO tüm agent çıktılarını gözden geçirdi ve eksikleri agent memory'lerine yazdı.`,
          result.slice(0, 5000),
          new Date().toISOString()
        );
      } catch {}

      resolve(result);
    });
  });
}
