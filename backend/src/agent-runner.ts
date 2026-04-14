import fs from 'node:fs';
import { loadAgent } from './agents.js';
import { getModelForAgent } from './config.js';
import { createDefaultProviderRouter, resolveFallbackProviderId } from './llm/default-router.js';
import type { ProviderRunResult } from './llm/types.js';

/**
 * 3 KATMANLI HAFIZA MİMARİSİ
 * ===========================
 * Katman 1: memory.md (max 6KB) — Her çalışmada yüklenir. Kurallar, kontrol listeleri.
 * Katman 2: knowledge.md (max 8KB) — Agent ihtiyaç duyduğunda Read ile açar. Domain bilgisi.
 * Katman 3: memory_archive.md (sınırsız) — Sadece gece eğitiminde okunur. Ham kayıtlar.
 */
const MAX_MEMORY_BYTES = 6 * 1024; // 6KB — Katman 1

function extractMemorySummary(memoryPath: string): string {
  try {
    const content = fs.readFileSync(memoryPath, 'utf8');
    if (content.length <= MAX_MEMORY_BYTES) {
      return content.trim();
    }
    return content.slice(0, MAX_MEMORY_BYTES).trim() + '\n\n[...hafıza kırpıldı — tam versiyon dosyada]';
  } catch {
    return '(hafıza dosyası henüz oluşturulmamış)';
  }
}

function getKnowledgePath(memoryPath: string): string {
  return memoryPath.replace('memory.md', 'knowledge.md');
}

function getArchivePath(memoryPath: string): string {
  return memoryPath.replace('memory.md', 'memory_archive.md');
}

function hasKnowledgeFile(memoryPath: string): boolean {
  return fs.existsSync(getKnowledgePath(memoryPath));
}

function hasArchiveFile(memoryPath: string): boolean {
  return fs.existsSync(getArchivePath(memoryPath));
}

export type AgentRunResult = Omit<ProviderRunResult, 'rawOutput'>;

export type RunAgentOptions = {
  agentId: string;
  taskPrompt: string;
  context?: Record<string, unknown>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
};

const providerRouter = createDefaultProviderRouter();

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
    `## Hafıza — Katman 1: Kurallar (otomatik yüklendi)`,
    ``,
    extractMemorySummary(agent.memoryPath),
    ``,
    `## Hafıza Sistemi`,
    ``,
    `Senin 3 katmanlı hafızan var:`,
    `- **Katman 1** (yukarıda yüklendi): \`${agent.memoryPath}\` — Kurallar ve kontrol listeleri. Max 6KB.`,
    hasKnowledgeFile(agent.memoryPath)
      ? `- **Katman 2** (ihtiyaç duyduğunda aç): \`${getKnowledgePath(agent.memoryPath)}\` — Domain bilgisi, formüller, benchmark'lar, best practice. Karmaşık bir konuyla karşılaşırsan \`Read\` ile aç.`
      : `- **Katman 2**: knowledge.md henüz oluşturulmamış.`,
    hasArchiveFile(agent.memoryPath)
      ? `- **Katman 3** (sadece eğitimde): \`${getArchivePath(agent.memoryPath)}\` — Tüm eğitim geçmişi ve ham kayıtlar. Normal görevde AÇMA.`
      : `- **Katman 3**: Arşiv henüz oluşturulmamış.`,
    ``,
    `**Görev sonunda önemli bir şey öğrendiysen:**`,
    `- Kalıcı kural → \`Edit\` ile \`memory.md\`'ye ekle`,
    `- Domain bilgisi → \`Edit\` ile \`knowledge.md\`'ye ekle`,
    `- memory.md 6KB'yi aşarsa → en eski öğrenmeyi knowledge.md'ye taşı`,
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
    requiresWebResearch ? `- **WebFetch**: Belirli URL'yi oku (kap.org.tr bildirim sayfası, haber sitesi)` : '',
    requiresWebResearch ? `- **PDF İndirme (KAP faaliyet/finansal raporları)**: Bash tool ile \`node scripts/fetch-pdf.js "<pdf-url>" "output/<TICKER>_<rapor_adi>.txt"\` komutu çalıştır. Bu komut PDF'i indirir, text'e çevirir ve dosyaya kaydeder. Sonra \`Read\` ile oku.` : '',
    requiresWebResearch ? `  - KAP PDF URL formatı: \`https://www.kap.org.tr/tr/api/BildirimPdf/<bildirim-id>\`` : '',
    requiresWebResearch ? `  - Örnek: \`node scripts/fetch-pdf.js "https://www.kap.org.tr/tr/api/BildirimPdf/1543822" "output/SISE_faaliyet_2025.txt"\`` : '',
    requiresWebResearch ? `  - Şirket IR sayfasındaki PDF'ler için de kullanılabilir: \`node scripts/fetch-pdf.js "https://sirket.com/rapor.pdf" "output/TICKER_rapor.txt"\`` : '',
    requiresWebResearch ? `- **Read**: Yerel dosyaları oku (memory.md, önceki çıktılar, fetch-pdf çıktıları)` : '',
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
    ``,
    `## TRUNCATION ÖNLEME (KRİTİK)`,
    `Çıktın kesilme riski var. Bu yüzden:`,
    `1. **Önce en kritik bulguları yaz** — skor, hedef fiyat, ana metrikler İLK paragrafta`,
    `2. **Sonra detayları ekle** — yorum, benchmark, trend analizi`,
    `3. **Verbose olma** — aynı şeyi farklı kelimelerle tekrarlama`,
    `4. **Tablo tercih et** — 5 satır tablo = 15 satır metin, daha kompakt`,
    opts.context?.qa_revision_instruction ? `\n## QA REVİZYON TALİMATI\n${opts.context.qa_revision_instruction}` : '',
  ].filter(line => line !== '').join('\n');

  const result = await providerRouter.run({
    prompt: fullPrompt,
    model: getModelForAgent(
      opts.agentId,
      providerRouter.getPrimaryProvider().id,
    ),
    fallbackModel: resolveFallbackProviderId()
      ? getModelForAgent(opts.agentId, resolveFallbackProviderId()!)
      : undefined,
    timeoutMs: opts.timeoutMs,
    onStdout: opts.onStdout,
    onStderr: opts.onStderr,
  });

  return {
    success: result.success,
    output: result.output,
    error: result.error,
    errorType: result.errorType,
    durationMs: result.durationMs || (Date.now() - startedAt),
    tokensUsed: result.tokensUsed,
    costUsd: result.costUsd,
    provider: result.provider,
  };
}
