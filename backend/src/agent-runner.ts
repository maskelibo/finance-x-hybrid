import fs from 'node:fs';
import path from 'node:path';
import { loadAgent } from './agents.js';
import { getModelForAgent, AGENTS_ROOT, TARGETED_KNOWLEDGE_INJECTION } from './config.js';
import { createDefaultProviderRouter } from './llm/default-router.js';
import { getRecentOpenLessons } from './memory.js';
import { getSector as getSectorFromRegistry } from './sector-registry.js';
import { getTriggeredSkills, readSkillExcerpt, readSkillContent } from './skills/registry.js';
import { SKILLS_ENABLED, MAX_SKILLS_PER_AGENT, SKILL_EXCERPT_ENGINE_ENABLED } from './config.js';
import type { ProviderRunResult } from './llm/types.js';

/**
 * Shared directives — tüm agent'lara inject edilen ortak kurallar.
 * Dosyadan bir kez okunur, her agent çalışmasında yeniden kullanılır.
 */
const SHARED_DIRECTIVES_PATH = path.resolve(AGENTS_ROOT, '../prompts/shared_directives.md');
let _sharedDirectivesCache: string | null = null;
function getSharedDirectives(): string {
  if (_sharedDirectivesCache === null) {
    try {
      _sharedDirectivesCache = fs.readFileSync(SHARED_DIRECTIVES_PATH, 'utf8').trim();
    } catch {
      _sharedDirectivesCache = '';
      console.warn('[agent-runner] shared_directives.md not found, skipping');
    }
  }
  return _sharedDirectivesCache;
}

/**
 * Targeted Knowledge Injection — knowledge.md'den sektör/konu bazlı bölüm çeker.
 * Context'teki sinyallerden (ticker, sector keywords) ilgili bölümü tespit eder.
 * Sinyal güvenilir değilse null döner (inject etmemek > yanlış inject).
 */
function extractTargetedKnowledge(knowledgePath: string, context?: Record<string, unknown>): string | null {
  if (!TARGETED_KNOWLEDGE_INJECTION) return null;
  if (!fs.existsSync(knowledgePath)) return null;

  try {
    const content = fs.readFileSync(knowledgePath, 'utf8');
    if (content.length < 500) return null; // Too small to section

    // Try to detect sector from context_extraction output
    const ctxOutput = String(context?.['context_extraction_output'] || '').toLowerCase();

    // Sector keyword → knowledge.md section heading mapping
    const SECTOR_SIGNALS: Array<{ keywords: string[]; headings: string[] }> = [
      { keywords: ['banka', 'bank', 'finans', 'nim', 'cet1', 'bddk'], headings: ['Bankacılık', 'Banka', 'Banking', 'Finans'] },
      { keywords: ['telekom', 'telecom', 'arpu', 'churn', '5g', 'spectrum'], headings: ['Telekomünikasyon', 'Telekom', 'Telecom'] },
      { keywords: ['rafineri', 'refinery', 'petrol', 'crude', 'crack spread', 'brent'], headings: ['Rafineri', 'Enerji', 'Energy', 'Refinery'] },
      { keywords: ['çelik', 'steel', 'hrc', 'demir', 'erdemir'], headings: ['Çelik', 'Steel', 'Demir'] },
      { keywords: ['holding', 'nav', 'sotp', 'konglomerat'], headings: ['Holding', 'Konglomera'] },
      { keywords: ['havacılık', 'aviation', 'airline', 'thy', 'ebitdar', 'rpk', 'ask'], headings: ['Havacılık', 'Aviation', 'Havacilik'] },
      { keywords: ['perakende', 'retail', 'mağaza', 'sssg', 'bim'], headings: ['Perakende', 'Retail'] },
      { keywords: ['savunma', 'defense', 'defence', 'aselsan', 'ssb'], headings: ['Savunma', 'Defense'] },
    ];

    // Find matching sector
    let matchedHeadings: string[] | null = null;
    for (const { keywords, headings } of SECTOR_SIGNALS) {
      if (keywords.some(kw => ctxOutput.includes(kw))) {
        matchedHeadings = headings;
        break;
      }
    }

    if (!matchedHeadings) return null; // No confident signal → don't inject

    // Extract matching sections from knowledge.md
    const lines = content.split('\n');
    const sections: string[] = [];
    let capturing = false;
    let currentSection: string[] = [];

    for (const line of lines) {
      const isHeading = /^#{1,4}\s/.test(line);
      if (isHeading) {
        if (capturing && currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
          currentSection = [];
        }
        const lineLower = line.toLowerCase();
        capturing = matchedHeadings.some(h => lineLower.includes(h.toLowerCase()));
      }
      if (capturing) {
        currentSection.push(line);
      }
    }
    if (capturing && currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }

    if (sections.length === 0) return null;

    const result = sections.join('\n\n').slice(0, 4000); // Max 4KB injected
    return result.length > 100 ? result : null;
  } catch {
    return null;
  }
}

/**
 * 3 KATMANLI HAFIZA MİMARİSİ
 * ===========================
 * Katman 1: memory.md (max 6KB) — Her çalışmada yüklenir. Kurallar, kontrol listeleri.
 * Katman 2: knowledge.md (max 8KB) — Agent ihtiyaç duyduğunda Read ile açar. Domain bilgisi.
 * Katman 3: memory_archive.md (sınırsız) — Sadece gece eğitiminde okunur. Ham kayıtlar.
 */
const MAX_MEMORY_BYTES = 6 * 1024; // 6KB — Katman 1

/** @deprecated R4: use loadStructuredMemory instead. Kept for backward-compat references. */
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

// R4: Yapılandırılmış memory loader — ilk 6KB truncation yerine 3 parça.
//   permanent_rules.md (max 4KB) + memory.md "Kurallar" bölümü (max 2KB) + son 10 open lesson
export function loadStructuredMemory(agentId: string, memoryPath: string): string {
  const sections: string[] = [];

  const rulesPath = memoryPath.replace('memory.md', 'permanent_rules.md');
  if (fs.existsSync(rulesPath)) {
    const rules = fs.readFileSync(rulesPath, 'utf8').trim();
    if (rules.length < 4096) {
      sections.push(`### Kalıcı Kurallar (permanent_rules.md)\n${rules}`);
    } else {
      sections.push(`### Kalıcı Kurallar (permanent_rules.md — ilk 4KB)\n${rules.slice(0, 4096)}`);
    }
  }

  if (fs.existsSync(memoryPath)) {
    const content = fs.readFileSync(memoryPath, 'utf8');
    const rulesSectionMatch = content.match(/##\s*Kal[ıi]c[ıi]?\s*Kurallar[\s\S]*?(?=\n##\s|\n---|\Z)/i);
    if (rulesSectionMatch) {
      sections.push(`### Memory Kurallar\n${rulesSectionMatch[0].slice(0, 2048)}`);
    } else {
      sections.push(`### Memory (ilk 2KB)\n${content.slice(0, 2048)}`);
    }
  }

  const lessons = getRecentOpenLessons(agentId, 10);
  if (lessons.length > 0) {
    const lessonsText = lessons
      .map(l => `- **${l.ticker || 'N/A'}** (${l.date}, ${l.severity || 'P?'}, ${l.repeat_count}x): ${l.issue}${l.rule ? `\n  → Kural: ${l.rule}` : ''}`)
      .join('\n');
    sections.push(`### Son Açık Öğrenimler (lessons.jsonl)\n${lessonsText}`);
  }

  return sections.join('\n\n');
}

function getPermanentRulesPath(memoryPath: string): string {
  return memoryPath.replace('memory.md', 'permanent_rules.md');
}

function readPermanentRules(memoryPath: string): string | null {
  const rulesPath = getPermanentRulesPath(memoryPath);
  try {
    if (!fs.existsSync(rulesPath)) return null;
    return fs.readFileSync(rulesPath, 'utf8').trim();
  } catch {
    return null;
  }
}

function readSharedKnowledgeModule(sector: string): string | null {
  const modulePath = path.resolve(AGENTS_ROOT, '_shared_knowledge_modules', `${sector}.md`);
  try {
    if (!fs.existsSync(modulePath)) return null;
    const content = fs.readFileSync(modulePath, 'utf8').trim();
    return content.length > 100 ? content : null;
  } catch {
    return null;
  }
}

function detectSector(context?: Record<string, unknown>): string | null {
  // R6: registry is authoritative — ticker lookup first
  const ticker = String(context?.['ticker'] || '').toUpperCase();
  if (ticker) {
    const fromRegistry = getSectorFromRegistry(ticker);
    if (fromRegistry) {
      console.log(`[sector] ${ticker} → ${fromRegistry} (from registry)`);
      return fromRegistry;
    }
  }

  // Fallback: keyword heuristic on context_extraction_output
  const ctxOutput = String(context?.['context_extraction_output'] || '').toLowerCase();
  const SECTOR_MAP: Array<{ keywords: string[]; sector: string }> = [
    { keywords: ['banka', 'bank', 'finans', 'nim', 'cet1', 'bddk'], sector: 'banking' },
    { keywords: ['telekom', 'telecom', 'arpu', 'churn', '5g'], sector: 'telecom' },
    { keywords: ['rafineri', 'refinery', 'petrol', 'crude', 'crack spread'], sector: 'refinery' },
    { keywords: ['çelik', 'steel', 'hrc', 'demir', 'erdemir'], sector: 'steel' },
    { keywords: ['holding', 'nav', 'sotp', 'konglomerat'], sector: 'holding' },
    { keywords: ['havacılık', 'aviation', 'airline', 'thy', 'ebitdar'], sector: 'aviation' },
    { keywords: ['perakende', 'retail', 'mağaza', 'sssg', 'bim'], sector: 'retail' },
    { keywords: ['savunma', 'defense', 'defence', 'aselsan', 'ssb'], sector: 'defense' },
    { keywords: ['telekom', 'tcell', 'turkcell', 'ttkom'], sector: 'telecom' },
  ];
  for (const { keywords, sector } of SECTOR_MAP) {
    if (keywords.some(kw => ctxOutput.includes(kw))) return sector;
  }
  return null;
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

function getCaseLessonsPath(memoryPath: string): string {
  return memoryPath.replace('memory.md', 'case_lessons.md');
}

function hasCaseLessonsFile(memoryPath: string): boolean {
  return fs.existsSync(getCaseLessonsPath(memoryPath));
}

export type AgentRunResult = Omit<ProviderRunResult, 'rawOutput'>;

export type RunAgentOptions = {
  agentId: string;
  taskPrompt: string;
  context?: Record<string, unknown>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
  /**
   * P1A Wave 2 — optional session id. When supplied AND the run succeeds,
   * fact-layer/extractor.ts attempts a best-effort fact extraction from the
   * agent output into canonical_facts. Existing call sites that omit this
   * field continue to behave exactly as before (no extraction).
   */
  sessionId?: string;
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
    // Permanent rules injection — always loaded, before memory
    ...((() => {
      const permanentRules = readPermanentRules(agent.memoryPath);
      if (permanentRules) {
        return [
          `## Kalıcı Kurallar (her zaman yüklenir)`,
          ``,
          permanentRules,
          ``,
        ];
      }
      return [];
    })()),
    // Shared knowledge module injection — sector-specific
    ...((() => {
      const sector = detectSector(opts.context);
      if (sector) {
        const module = readSharedKnowledgeModule(sector);
        if (module) {
          return [
            `## Sektör Bilgi Modülü (${sector}) — otomatik inject edildi`,
            ``,
            module,
            ``,
          ];
        }
      }
      return [];
    })()),
    `## Hafıza (3 parça: permanent_rules + memory kurallar + son öğrenimler)`,
    ``,
    loadStructuredMemory(opts.agentId, agent.memoryPath),
    ``,
    `## Hafıza Sistemi`,
    ``,
    `Senin 3 katmanlı hafızan var:`,
    `- **Katman 1** (yukarıda yüklendi): \`${agent.memoryPath}\` — Kurallar ve kontrol listeleri. Max 6KB.`,
    hasKnowledgeFile(agent.memoryPath)
      ? `- **Katman 2** (ihtiyaç duyduğunda aç): \`${getKnowledgePath(agent.memoryPath)}\` — Domain bilgisi, formüller, benchmark'lar, best practice. Karmaşık bir konuyla karşılaşırsan \`Read\` ile aç.`
      : `- **Katman 2**: knowledge.md henüz oluşturulmamış.`,
    hasCaseLessonsFile(agent.memoryPath)
      ? `- **Katman 2b** (vaka dersleri): \`${getCaseLessonsPath(agent.memoryPath)}\` — Önceki analizlerden öğrenimler ve CEO geri bildirimleri. Aynı şirket veya sektörü analiz ederken \`Read\` ile aç.`
      : `- **Katman 2b**: case_lessons.md henüz oluşturulmamış.`,
    hasArchiveFile(agent.memoryPath)
      ? `- **Katman 3** (sadece eğitimde): \`${getArchivePath(agent.memoryPath)}\` — Tüm eğitim geçmişi ve ham kayıtlar. Normal görevde AÇMA.`
      : `- **Katman 3**: Arşiv henüz oluşturulmamış.`,
    ``,
    `**Görev sonunda önemli bir şey öğrendiysen:**`,
    `- Kalıcı kural → \`Edit\` ile \`memory.md\`'ye ekle`,
    `- Domain bilgisi → \`Edit\` ile \`knowledge.md\`'ye ekle`,
    `- Vaka bazlı öğrenim (şirket/sektör dersi) → \`Edit\` ile \`case_lessons.md\`'ye ekle`,
    `- memory.md 6KB'yi aşarsa → en eski öğrenmeyi knowledge.md veya case_lessons.md'ye taşı`,
    ``,
    // Targeted knowledge injection — sektör sinyali varsa knowledge.md'den ilgili bölümü inject et
    ...(hasKnowledgeFile(agent.memoryPath) ? (() => {
      const targeted = extractTargetedKnowledge(getKnowledgePath(agent.memoryPath), opts.context);
      if (targeted) {
        return [
          `## Sektör-Spesifik Bilgi (knowledge.md'den otomatik çekildi)`,
          ``,
          targeted,
          ``,
        ];
      }
      return [];
    })() : []),
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
    // U1: Skills — context-triggered skill injection (excerpt engine preferred, full fallback)
    ...((() => {
      if (!SKILLS_ENABLED) return [];
      const triggered = getTriggeredSkills(opts.agentId, opts.context || {}).slice(0, MAX_SKILLS_PER_AGENT);
      if (triggered.length === 0) return [];
      const picks: string[] = [
        `## Tetiklenen Skill'ler (${triggered.length})`,
        `Aşağıdaki skill'ler mevcut göreve uygun — prosedürlerini uygula:`,
        ``,
      ];
      for (const skill of triggered) {
        const body = SKILL_EXCERPT_ENGINE_ENABLED
          ? (readSkillExcerpt(skill.id, opts.context || {}, 2000) || readSkillContent(skill.id, 2500))
          : readSkillContent(skill.id, 2500);
        picks.push(`### ${skill.name} (${skill.id})`);
        picks.push(body || skill.description);
        picks.push(``);
      }
      console.log(`[skills] ${opts.agentId}: ${triggered.length} triggered — ${triggered.map(s => s.id).join(', ')}`);
      return picks;
    })()),
    `## Current Task`,
    opts.taskPrompt,
    ``,
    // Context JSON dump is intentionally SKIPPED here. The taskPrompt
    // already carries budget-capped upstream outputs via
    // orchestrator.buildTaskPrompt(). Pasting accumulatedContext a
    // second time — as the original code did — blew up the prompt
    // to 400K+ chars on final_summary / report_formatter because it
    // dumped every agent's full output unfiltered. If an agent needs
    // a specific context key (e.g. delivery_check_mode), the orchestrator
    // surfaces it through taskPrompt itself.
    opts.context?.qa_revision_instruction
      ? `## QA Revision Context\n${String(opts.context.qa_revision_instruction)}`
      : '',
    ``,
    `## Output Instructions`,
    `Respond with your agent output in plain text or markdown. Stay focused on the task above. Do not ask clarifying questions — make reasonable assumptions and proceed. Keep the output structured and evidence-backed.`,
    ``,
    `## Ortak Kurallar (Tüm Agent'lar İçin Geçerli)`,
    ``,
    getSharedDirectives(),
  ].filter(line => line !== '').join('\n');

  // Prompt size logging — detect oversized prompts before sending
  const promptChars = fullPrompt.length;
  const estimatedTokens = Math.round(promptChars / 4);
  console.log(`[agent-runner] ${opts.agentId}: prompt ${Math.round(promptChars / 1000)}K chars (~${Math.round(estimatedTokens / 1000)}K tokens)`);
  if (promptChars > 100000) {
    console.warn(`[agent-runner] ⚠️ ${opts.agentId}: LARGE PROMPT ${Math.round(promptChars / 1000)}K chars — may cause slow processing`);
  }

  const result = await providerRouter.run({
    prompt: fullPrompt,
    model: getModelForAgent(opts.agentId),
    timeoutMs: opts.timeoutMs,
    onStdout: opts.onStdout,
    onStderr: opts.onStderr,
  });

  // P1A Wave 2 — best-effort fact extraction. Fire-and-forget; never blocks
  // the agent run. The wrapper itself swallows all errors; the surrounding
  // try/catch is defence-in-depth so a future programming error in the
  // dynamic import path can still not break the run.
  if (opts.sessionId && result.success && result.output) {
    try {
      const { tryExtractFactsBestEffort } = await import('./fact-layer/extractor.js');
      tryExtractFactsBestEffort(opts.agentId, opts.sessionId, result.output);
    } catch (err) {
      console.warn(`[agent-runner] fact-extractor unreachable for ${opts.agentId}: ${(err as Error).message}`);
    }
  }

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
