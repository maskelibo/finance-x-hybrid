import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { loadAgent } from './agents.js';
import { CLAUDE_SPAWN_OPTIONS, getModelForAgent } from './config.js';

/**
 * Extracts the summary card (Kimlik Kartı + Yetenek Haritası) from a memory.md file.
 * This is the top section before the second "---" separator.
 * Returns only ~300 tokens instead of the full memory (which can be 5-50K tokens).
 */
function extractMemorySummary(memoryPath: string): string {
  try {
    const content = fs.readFileSync(memoryPath, 'utf8');
    // Split by "---" separator — sections are: [header, kimlik+yetenek, rest...]
    const sections = content.split(/^---$/m);
    // First section = title + kimlik kartı, Second section = yetenek haritası
    // Take everything before the second "---"
    if (sections.length >= 2) {
      return (sections[0] + '---\n' + sections[1]).trim();
    }
    // Fallback: first 500 chars
    return content.slice(0, 500).trim();
  } catch {
    return '(hafıza dosyası henüz oluşturulmamış)';
  }
}

export type AgentRunResult = {
  success: boolean;
  output: string;
  error?: string;
  errorType?: 'rate_limit' | 'auth' | 'timeout' | 'unknown';
  durationMs: number;
  tokensUsed: number;
  costUsd: number;
};

function detectErrorType(stderr: string, stdout: string): 'rate_limit' | 'auth' | 'timeout' | 'unknown' {
  const combined = (stderr + ' ' + stdout).toLowerCase();
  if (
    combined.includes('usage limit') ||
    combined.includes('rate limit') ||
    combined.includes('5-hour limit') ||
    combined.includes('weekly limit') ||
    combined.includes('quota') ||
    combined.includes('too many requests') ||
    combined.includes('429') ||
    combined.includes('hit your limit') ||
    combined.includes("you've hit your limit") ||
    combined.includes('resets 2am') ||
    combined.includes('resets at')
  ) {
    return 'rate_limit';
  }
  if (combined.includes('not logged in') || combined.includes('authentication') || combined.includes('401')) {
    return 'auth';
  }
  if (combined.includes('timeout')) return 'timeout';
  return 'unknown';
}

export type RunAgentOptions = {
  agentId: string;
  taskPrompt: string;
  context?: Record<string, unknown>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
};

/**
 * Runs a single agent by spawning the Claude Code CLI in headless mode.
 * Uses `claude login` auth (Max plan) — no API key required.
 */
export async function runAgent(opts: RunAgentOptions): Promise<AgentRunResult> {
  const agent = loadAgent(opts.agentId);
  const startedAt = Date.now();

  // Define agent categories for conditional directives
  const DATA_AGENTS = ['data_collection', 'kap_watch', 'kap_search', 'kap_categorization'];
  const ANALYSIS_AGENTS = ['financial_analysis', 'technical_analysis', 'macro_analysis', 'sector_competition', 'event_impact_assessment', 'context_extraction'];
  const SYNTHESIS_AGENTS = ['strategic_synthesis', 'final_summary', 'ceo', 'qa_review', 'reconciliation', 'parse_standardization'];

  const requiresWebResearch = DATA_AGENTS.includes(opts.agentId) || ANALYSIS_AGENTS.includes(opts.agentId);

  const fullPrompt = [
    `# Agent: ${agent.displayName} (${agent.id})`,
    ``,
    `## System Instructions`,
    agent.systemPrompt,
    ``,
    `## Kalıcı Hafıza (Özet)`,
    ``,
    extractMemorySummary(agent.memoryPath),
    ``,
    `**Detaylı bilgi defterin:** \`${agent.memoryPath}\``,
    `Bu dosyayı \`Read\` tool'u ile aç — öğrenme geçmişin, bilgi bankan, uygulama örneklerin orada. Analiz yaparken bu birikimi kullan.`,
    `Görev sonunda önemli bir şey öğrendiysen \`Write\` veya \`Edit\` tool'u ile aynı dosyayı güncelle.`,
    ``,
    requiresWebResearch ? `## ZORUNLU: Web Araştırma Politikası (Chairman Direktifi — 2026-04-09)` : '',
    requiresWebResearch ? `` : '',
    requiresWebResearch ? `**ÇOK ÖNEMLİ:** Senin eğitim verin Ağustos 2025'te kesildi. Bugün **${new Date().toLocaleDateString('tr-TR')}**. Aradan geçen süre boyunca piyasalarda, jeopolitikte ve şirketlerde çok şey değişmiş olabilir. **Hafızandan konuşma — git bak.**` : '',
    requiresWebResearch ? `` : '',
    requiresWebResearch ? `### Kurallar` : '',
    requiresWebResearch ? `` : '',
    requiresWebResearch ? `1. **Her iddiadan önce doğrula.** Bir rakam, tarih, olay veya isim söyleyeceksen önce \`WebSearch\` veya \`WebFetch\` ile kaynağını bul.` : '',
    requiresWebResearch ? `2. **Kaynak göster.** Her önemli iddianın sonuna kaynak linkini yaz: *[kaynak: kap.org.tr/...]*, *[kaynak: https://...]* gibi.` : '',
    requiresWebResearch ? `3. **Bilmiyorsan uydurma, "bilmiyorum" de.** Aradın bulamadıysan "kaynak bulunamadı, doğrulanamadı" yaz. Tahmin etmek **yasak**.` : '',
    requiresWebResearch ? `4. **Güncel olayları ara.** Türkiye ve dünyadaki son jeopolitik/makro gelişmeler (savaşlar, faiz kararları, emtia fiyatları, kur hareketleri) analizini doğrudan etkiler — bunları araman **zorunlu**.` : '',
    requiresWebResearch ? `5. **KAP kaynağı öncelikli.** BIST şirketleri için birincil kaynak \`kap.org.tr\`. Buradan şirketin son bildirimlerini, finansal tablolarını, faaliyet raporlarını çek.` : '',
    requiresWebResearch ? `6. **Belirsizliği işaretle.** Bir bilgi için birden fazla çelişen kaynak varsa, her ikisini de belirt ve tercih ettiğin nedenini açıkla.` : '',
    requiresWebResearch ? `` : '',
    requiresWebResearch ? `### Kullanabileceğin Araçlar` : '',
    requiresWebResearch ? `- **WebSearch**: Google tarzı arama ("TUPRS 2026 Q1 net kar")` : '',
    requiresWebResearch ? `- **WebFetch**: Belirli URL'yi oku (kap.org.tr bildirim sayfası, şirket PDF'i, haber sitesi)` : '',
    requiresWebResearch ? `- **Read**: Yerel dosyaları oku (memory.md, önceki çıktılar)` : '',
    requiresWebResearch ? `- **Write/Edit**: memory.md güncelle` : '',
    requiresWebResearch ? `` : '',
    requiresWebResearch ? `Bu direktif CEO Meta-Ajan tarafından onaylandı. Uygulamazsan raporun reddedilir.` : '',
    ``,
    `## Current Task`,
    opts.taskPrompt,
    ``,
    opts.context
      ? `## Context\n\`\`\`json\n${JSON.stringify(opts.context, null, 2)}\n\`\`\``
      : '',
    ``,
    `## Output Instructions`,
    `Respond with your agent output in plain text or markdown. Stay focused on the task above. Do not ask clarifying questions — make reasonable assumptions and proceed. Keep the output structured and evidence-backed.`,
  ].filter(line => line !== '').join('\n');

  return new Promise((resolve) => {
    const args = [
      '-p', fullPrompt,
      '--model', getModelForAgent(opts.agentId),
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
    ];

    const child = spawn('claude', args, {
      ...CLAUDE_SPAWN_OPTIONS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    const MAX_OUTPUT_BYTES = 10 * 1024 * 1024; // 10MB — agent çıktısı için güvenli sınır
    const MAX_STDERR_BYTES = 512 * 1024; // 512KB

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      if (stdoutBuf.length < MAX_OUTPUT_BYTES) {
        stdoutBuf += text.slice(0, MAX_OUTPUT_BYTES - stdoutBuf.length);
      }
      opts.onStdout?.(text);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      if (stderrBuf.length < MAX_STDERR_BYTES) {
        stderrBuf += text.slice(0, MAX_STDERR_BYTES - stderrBuf.length);
      }
      opts.onStderr?.(text);
    });

    let timedOut = false;
    const timeoutHandle = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
        }, opts.timeoutMs)
      : null;

    child.on('error', (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      resolve({
        success: false,
        output: '',
        error: `Process error: ${err.message}`,
        durationMs: Date.now() - startedAt,
        tokensUsed: 0,
        costUsd: 0,
      });
    });

    child.on('close', (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startedAt;

      if (code !== 0) {
        // Exit code 143 = SIGTERM (128 + 15). If we sent it, it's our timeout.
        const errorType = (timedOut || code === 143)
          ? 'timeout'
          : detectErrorType(stderrBuf, stdoutBuf);
        const timeoutSecs = opts.timeoutMs ? Math.round(opts.timeoutMs / 1000) : 0;
        const errorMsg = timedOut
          ? `Agent timeout after ${timeoutSecs}s (exit code 143) — increase timeout or optimize agent`
          : (stderrBuf || stdoutBuf || `Claude exited with code ${code}`);
        resolve({
          success: false,
          output: stdoutBuf,
          error: errorMsg,
          errorType,
          durationMs,
          tokensUsed: 0,
          costUsd: 0,
        });
        return;
      }

      // Parse Claude's JSON output
      let parsedOutput = stdoutBuf;
      let tokensUsed = 0;
      let costUsd = 0;

      try {
        const parsed = JSON.parse(stdoutBuf);
        if (parsed.result) parsedOutput = parsed.result;
        if (parsed.total_cost_usd) costUsd = parsed.total_cost_usd;
        if (parsed.usage) {
          tokensUsed = (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0);
        }
      } catch {
        // Not JSON, use raw output
      }

      resolve({
        success: true,
        output: parsedOutput,
        durationMs,
        tokensUsed,
        costUsd,
      });
    });
  });
}
