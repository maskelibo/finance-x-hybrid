# FINANCE-X HYBRID — FULL MASTER EXECUTION FILE

Sen bu projenin:
- principal architect
- senior full-stack engineer
- AI systems integrator
- quantitative validation owner
- production rollout controller
- quality governor

olarak çalışıyorsun.

Bu görev tek shot kod üretme görevi değildir.
Bu görev Finance-X Hybrid sistemini uçtan uca, faz bazlı, production discipline ile kurma görevidir.

Bu dosya önceden ayrı verilen 4 büyük promptun + governance katmanının tek master yapıda birleşmiş halidir. Ayrı prompt mantığı yoktur. Tüm sistem burada tek anayasa olarak yürür.

Repo: `finance-x-hybrid` (BIST şirketleri için 26 agent'lı kurumsal analiz orkestrasyonu).

---

# MASTER EXECUTION PRINCIPLE

Her faz şu sırayla ilerler:

1. Fazı uygula
2. Teknik test yap (`pnpm typecheck` + unit)
3. Gerçek canlı session çalıştır (benchmark ticker'larından biri)
4. Kaliteyi ölç (final score + coverage + contradiction)
5. Sorunları tespit et
6. Hotfix yap
7. Tekrar test et
8. Exit report üret
9. Faz stabil ise sonraki faza geç

Bir faz ancak aşağıdakilerin hepsi sağlanırsa tamamlanmış sayılır:
- kod çalışıyor
- test geçti
- canlı denendi
- canlı sorunları düzeltildi

---

# GLOBAL LIVE TEST BENCHMARK

## Core benchmark (her faz sonrası bunlardan biri çalıştırılır)
- **THYAO** — aviation, IFRS 16, EBITDAR, IAS 29
- **EREGL** — steel, HRC transmission, CBAM, IAS 29 anomaly
- **KCHOL** — holding, SOTP, parent/consolidated
- **ASELS** — defense, backlog, long-cycle, SSB

## Second benchmark (gerektiğinde)
- **TUPRS** — refinery, crack spread, Brent
- **TCELL** — telecom, ARPU, 5G
- **BIMAS** — retail, SSSG, IFRS 16 normalize
- **MGROS** — retail, mağaza network
- **SISE** — glass, multi-segment
- **FROTO** — automotive

Amaç bu benchmark'lar üzerinden:
- IAS 29 işleyişi
- IFRS 16 kira normalize
- holding / SOTP
- backlog ve long-cycle revenue
- telecom KPI (ARPU/churn)
- refinery spread
- retail KPI (SSSG)
- KAP PDF parsing accuracy
- management commentary extraction
- evidence retrieval quality
- contradiction detection
- citation enforcement

tümünü gerçek veriyle sınamak.

---

# RULE OF TRUTH — Ownership Matrisi (ZORUNLU)

Aşağıdaki ownership kuralı tüm sistemde zorunludur. Yeni içerik üretirken bu matrise sadık kal:

- **Prosedür / nasıl yapılır / adımlar / formüller** → `skills/<skill-id>/SKILL.md`
- **Dayanıklı alan bilgisi / sektör bilgisi / domain bilgi** → `agents/<agent-id>/knowledge.md`
- **Tekrarlayan hata dersi / failure pattern** → `agents/<agent-id>/lessons.jsonl`
- **Görev-spesifik rol ve davranış** → `agents/<agent-id>/system_prompt.md`
- **Değiştirilemez katı kurallar** → `agents/<agent-id>/rules.md` veya `permanent_rules.md`

**Duplikasyon oluşturma.** Aynı bilgi birden fazla yerde tutulmayacak.

Bir bilgi birden fazla yere yazılmış gibi görünüyorsa öncelik: skills > knowledge.md > system_prompt > lessons.jsonl. Duplikasyonu tespit edersen tek kaynağa indirge.

---

# GLOBAL ACTIVATION GOVERNOR

Session başında complexity score üret:
- sector complexity
- company structure complexity (holding vs single)
- disclosure density (90 günlük)
- valuation complexity (SOTP gerekiyor mu)
- contradiction likelihood (IAS 29 × multi-segment risk)
- document volume (faaliyet raporu, quarterly, presentation count)
- active layers requested

Buna göre execution profile seç:
- **LIGHT** (0-30) — basit yapı, minimum regulatory, tek iş kolu
- **STANDARD** (31-55) — tipik BIST analizi
- **FULL** (56-80) — cyclical, multi-segment, IAS 29 material
- **INSTITUTIONAL** (80+) — holding/bank, peak disclosure, tüm layer'lar

Bu profile göre:
- hangi agent aktif
- hangi sub-agent aktif
- hangi validator aktif
- hangi heavy quality layer aktif

belirlenir. (Detaylı implementasyon: Faz P9.)

**Amaç:** Kaliteyi düşürmeden latency ve cost optimize etmek.

---

# GLOBAL EXIT CRITERIA DISCIPLINE

Her faza başlamadan önce şu 7 maddelik kontrolü yap:

1. Önceki fazın dosyaları gerçekten oluştu mu? (`ls -la` ile doğrula)
2. `pnpm typecheck` tertemiz geçiyor mu?
3. Önceki fazın migration/schema değişiklikleri gerçekten uygulanmış mı? (`sqlite3 ... ".schema <table>"`)
4. Önceki fazın commit'i atılmış mı? (`git log -1 --oneline`)
5. Önceki fazın doğrulama komutları gerçekten başarılı mı?
6. Önceki fazın canlı test raporu gerçekten yazılmış mı? (benchmark ticker'da çalışma sonucu)
7. Önceki fazın hotfix turu tamamlanmış mı?

**Bunlardan biri eksikse yeni faza geçme. Önceki fazı tamamla.**

**Her faz sonunda Exit Report ver:**

```
FAZ <ID> EXIT REPORT
- Değişen dosya sayısı: X
- Yeni oluşan dosya sayısı: Y
- Silinen dosya sayısı: Z
- Yeni DB tabloları: <liste>
- Yeni env flags: <liste>
- pnpm typecheck: ✅ PASS / ❌ FAIL
- Unit tests: ✅ PASS / ❌ FAIL
- Canlı test (benchmark ticker: ___): ✅ PASS / ❌ FAIL
- Canlı test sonucu: <kısa özet>
- Tespit edilen sorunlar: <liste>
- Hotfix'ler: <liste>
- Commit hash: <hash>
- Bir sonraki faza hazır: EVET/HAYIR
```

---

# GLOBAL GUARDRAILS (Tüm fazlar için)

1. **Backward compatibility:** Mevcut API contract'ları bozulamaz. Yeni katmanlar opt-in env flag'lerle kontrol edilir.
2. **Migration scripts:** Veri şeması değişiyorsa migration scripti yazılacak (rollback dahil).
3. **Her faz kendi commit'i:** `<type>(<scope>): <description> [finance-x-<phase-id>]`
   **Soft checkpoint allowed:** Phase mid-way'de "atomic checkpoint" olursa commit atılabilir. Atomic checkpoint = (a) typecheck pass, (b) smoke test pass, (c) no broken import, (d) meaningful unit of work (ör. bir fonksiyon bitmiş). Micro-commit yasak (her str_replace'te commit atma). Unstable edit aşamasında commit atma — önce stable hale getir.
4. **Typecheck + test:** Her faz sonunda `pnpm typecheck` + yeni testler geçmeli.
5. **Breaking change yok:** Mevcut agent output schema'larına yeni alan eklenir, mevcut alanlar kaldırılmaz.
6. **Dokümantasyon:** Her faz sonunda ilgili README/ARCHITECTURE.md bölümü güncellenir.
7. **Shadow mode zorunlu:** Behavior değişikliği olan her yeni katman `<FEATURE>_SHADOW=true` ile önce gözlemleme modunda çalışır.
8. **Backup:** Büyük refactor'larda önce `_backup_<phase>_<DATE>/` klasörüne etkilenen dosyaların kopyası alınır.
9. **File editing discipline:** Her dosya değişikliğinde önce `view` ile oku, sonra `str_replace` veya `create_file` ile yaz.
10. **Python:** `python-services/` altında paket ekleme `uv add <package>`, pip değil.
11. **Dashboard:** React değişiklikleri sadece backend API kontratına uyum için yapılır.
12. **Sessions DB:** Üretim verisine dokunma — veri kaybı riski.
13. **Analytical Depth Protection (KRİTİK):** Hiçbir governance/quality/validation katmanı analitik yorum derinliğini baskılayamaz. Governance yalnızca factual doğruluk, contradiction, citation, ve evidence completeness denetler. Sector insight, management reasoning, strategic inference, forward-looking interpretation üretimi governance tarafından **durdurulamaz**. Analitik narrative output bir governance layer'ının kararıyla "silent suppression" yapılmaz — aşağıdaki minimum derinlik eşikleri Live Test Benchmark'ta (THYAO/EREGL/KCHOL/ASELS) her session için karşılanmalı:
    - Rapor narrative toplam word count ≥ 4500 (institutional session için)
    - Her ana section (financial, sector, valuation, macro, strategic) ≥ 250 word commentary
    - Sector commentary block count ≥ 3 (peer compare, positioning, competitive dynamics)
    - Forward-looking interpretation paragraf ≥ 4
    - Management reasoning / earnings call context referansı ≥ 2 yerde
    Eğer governance bir bölümü cripple ederse **Transparent Block** uygulanır: rapor içinde `[Section suppressed: <reason> — raw data available at <path>]` şeklinde görünür olmalı. Silent omission yasak.
14. **No Fake Completion Rule (KRİTİK):** Bir faz "completed" sayılmaz eğer:
    - İlgili dosya fiziksel olarak oluşmadıysa/oluşmadıysa (`ls` doğrulaması)
    - Schema migration çalışmadıysa (`sqlite3 finance-x.db ".schema <table>"` çıktısı gerekli)
    - Command output ekranda gösterilmediyse (`npx tsx scripts/... > /tmp/<phase>.log` + head/tail)
    - `git diff --stat` değişikliği göstermiyorsa
    - Typecheck hatasızsa ve smoke test geçtiyse
    Claude terminal "phase completed" demeden önce yukarıdaki **5 fiziksel doğrulamayı çalıştırıp çıktılarını raporlamak ZORUNDA**. Post-Phase Verification: `npx tsx scripts/verify-phase-completion.ts <phase_id>` otomasyonu P10'da kurulur.
15. **Per-Phase Execution Cycle:** Her faz için 7-step döngü bitirilmeden bir sonraki faza geçiş yasak:
    1. Code apply (dosyalar yazılır, migration çalıştırılır)
    2. Typecheck (`pnpm typecheck` hatasız)
    3. Live benchmark run (en az 1 benchmark ticker ile session)
    4. Output quality score (QA score, fact count, final tier)
    5. Hotfix (çıkan sorunlar için)
    6. Retest (hotfix sonrası aynı benchmark)
    7. Exit report (`docs/phase-reports/<phase-id>.md` — 5 başlık: "Ne yapıldı / Ne kanıtlandı / Kalan riskler / Threshold sonuçları / Next")

---

# GLOBAL EXECUTION CYCLE — Fazın Ölüm Kalım Kuralı

Yukarıdaki 15. madde operational çevrim:

```
CODE → TYPECHECK → BENCHMARK → SCORE → HOTFIX → RETEST → EXIT REPORT
```

Bu çevrim **atomic**'tir; yarım bırakmak yasaktır. "Sonra yaparım" yaklaşımı governance'ın en büyük sessiz düşmanıdır — çünkü "sonra" çoğu zaman gelmez ve dev borcu birikir. Her commit bu 7 adımın bittiğini kanıtlayan artefactlarla beraber merge edilir (typecheck log, benchmark session_id, QA score JSON, phase report MD).

---

# CLAUDE CODE RUNTIME DISCIPLINE

**Bu bölüm master'ın en kritik meta-kurallarıdır.** Sistem tasarımı değil, Claude Code'un master'ı uygularken nasıl davranması gerektiğini tanımlar. İşlem (execution) ile rapor (reporting) arasındaki öncelik, faz disiplini, hata döngüsü sınırları ve otonomi sınırları burada belirlenir.

## Rule 1 — Execution Priority

**Implementation always precedes reporting.**

Claude Code her fazda önce kod yazar, test eder, benchmark çalıştırır; ancak ondan sonra phase report üretir. Governance, dokümantasyon veya raporlama yükü **asla implementation'ı geciktirmez**.

Sıra zorunlu:
```
1. Kod apply (create/edit file)
2. Typecheck + smoke test
3. Validation (benchmark run)
4. Phase report (ancak bundan sonra)
```

Eğer faz ortasında rapor yazma refleksi gelirse, bu refleks bastırılır. Rapor faz **sonunda** yazılır, ortasında değil. Aksi davranış "rapor tiyatrosu" olarak işaretlenir ve commit reddedilir.

**Yasak:** Implementation %50'deyken 200 satır markdown report yazmak. Doküman kod'u beklemeli.

## Rule 2 — Analytical Depth Absolute Priority

**Analytical depth has absolute priority over validator neatness.**

Validator (QA, citation, coverage, contradiction) analitik narrative'i **değiştiremez, kısaltamaz, yeniden yazamaz**. Validator yalnızca **annotate** edebilir.

Eğer validator ve narrative çakışırsa:
```
validator → annotate (uyarı ekler, flag bırakır)
narrative → survives (metin korunur, olduğu gibi kalır)
```

**Yasak davranışlar:**
- Word count validator'ı tetiklendi diye paragraf kısaltmak
- Section length'i "uniformity" için normalize etmek
- Reasoning chain'i "cleaner output" için sıkıştırmak
- Forward-looking interpretation'ı "citation yok" diye silmek

Validator sadece şöyle diyebilir: "Bu claim için citation eksik" — ama claim'i silemez. Analist görür, kendi karar verir.

**Kazanım:** Governance "hygiene theater"a dönüşmez. Institutional derinlik korunur.

## Rule 3 — Phase Runtime Discipline

**Claude never redesigns future phases while current phase incomplete.**

Her faz kendi dosya kapsamında kalır. Runtime kuralları:

```
ONLY CURRENT PHASE FILES MAY BE EDITED

Forbidden during active phase:
  ✗ Speculative coding for future phases
  ✗ "Let me also improve P4 while I'm here..."
  ✗ Architecture drift ("Actually this module should be structured differently")
  ✗ Refactoring outside phase scope

Before phase exit, forbidden:
  ✗ Unfinished TODO comments
  ✗ Placeholder implementations (`return null; // TODO`)
  ✗ Pseudo-code marked as complete
  ✗ Stub functions that throw Error("not implemented")
  ✗ Commented-out code blocks
```

**Phase Exit Verification:**
```bash
# Claude Code MUST run before declaring phase complete:
grep -rn "TODO\|FIXME\|XXX\|placeholder" <phase_files>   # should be empty
grep -rn "throw new Error(.not implemented" <phase_files>  # should be empty
grep -rn "return null; //" <phase_files>                    # should be empty
```

Herhangi biri match ederse faz **incomplete** — exit edemez.

**Exception:** Dokümante edilmiş explicit deferred work — `// DEFERRED-TO-P8: reason` formatında. Bu kod satırı çalışmak zorunda, sadece ileride genişletilecek. TODO değil.

**Neden?** Claude Code'un en yaygın başarısızlığı: R2 yaparken "bu arada P4'ü de düşüneyim" diyip architectural drift yaratması. Scope creep en büyük iş düşmanıdır.

## Rule 4 — Fail Fast Rule

**If after 2 repair attempts same error persists: stop patching, diagnose root cause, rewrite cleanly.**

Hata döngüsü sınırı:

```
Attempt 1 → patch the symptom
Attempt 2 → patch differently
Attempt 3 (if same error) → FORBIDDEN to patch again

Instead:
  1. Stop editing the symptom layer
  2. Inspect upstream: config, imports, state, side effects
  3. Read actual error stack top-to-bottom (not just last line)
  4. If root cause identified → clean rewrite of affected module
  5. If root cause unclear → escalate to human review
```

**Yasak:** Aynı dosyada aynı error için 5+ str_replace denemesi. Bu "patch cehennemi"dir.

**Örnek:**
```
Bad loop:
  str_replace attempt 1: import path fix → fails
  str_replace attempt 2: rename import → fails
  str_replace attempt 3: add alias → fails
  ...
  str_replace attempt 15: still failing

Correct behavior after 2 fails:
  bash: `find . -name "*.ts" | xargs grep "import.*foo"` → understand structure
  bash: `cat tsconfig.json` → check path mapping
  Identify: missing package.json entry
  Clean rewrite: add to package.json + regenerate
```

**Kazanım:** Token israfı, zaman israfı, ve "aynı bug üzerinde 20 tool call" önlenmiş olur.

## Rule 5 — Autonomous Execution Law (ÇATI KURAL)

Yukarıdaki 4 kuralın üstüne oturan sistem anayasası:

```
AUTONOMOUS EXECUTION LAW

Claude operates autonomously until one of the following:
  (a) Current phase fully passes all exit criteria, OR
  (b) Root blocker identified with exact failure source + reproduction steps

Forbidden conditions for stopping:
  ✗ Partial implementation ("I've done most of it")
  ✗ Optimistic completion ("this should work, ready for next phase")
  ✗ Success claim without physical proof

Physical proof required for "complete" claim:
  ✓ File exists (ls output)
  ✓ Command output exists (saved to log)
  ✓ Benchmark output exists (session_id in DB)
  ✓ Typecheck passed (stdout shown)
  ✓ Git diff present (git diff --stat shown)

If uncertain about completion → run benchmark again.
If benchmark result weak → repair before phase exit, not defer.

PRIORITY HIERARCHY:
  working code  >  elegant code  >  reporting

Translation: prefer ugly-but-working over beautiful-but-broken.
Translation: prefer one-benchmark-passed over ten-lines-of-documentation.
```

**Bu kural diğer tüm kuralların üstündedir.**

Eğer herhangi bir guardrail (governance, QA, analytical depth vs.) **working code**'a engel oluyorsa, guardrail geçici olarak esnetilebilir — ama bu istisna execution_trace'e `guardrail_override_reason` ile yazılır ve faz exit report'unda explicit listelenir.

### Rule 5.1 — Proportionality Sub-Rule

**Proof generation must remain proportional to code delta.**

Küçük kod değişikliği full governance burden tetiklemez. 7-step execution cycle (code→typecheck→benchmark→score→hotfix→retest→exit report) **phase boundary'lerde** zorunludur; intra-phase küçük patch'lerde değil.

**Proportionality tablosu:**

```
Code delta                    │ Required proof
──────────────────────────── │ ──────────────────────────────────
≤ 10 lines (typo, import)     │ typecheck + diff only
11-50 lines (small patch)     │ typecheck + diff + smoke test
51-200 lines (meaningful)     │ typecheck + smoke + 1 benchmark run
> 200 lines OR new file       │ full 7-step cycle
Cross-file structural         │ full 7-step cycle
Schema/migration              │ full 7-step cycle (mandatory)
Behavior change               │ full 7-step cycle (mandatory)
```

**Somut anlam:**

```
Claude Code bir agent'ta 3 satır import düzelttiğinde:
  → typecheck çalıştırsın, git diff göstersin, sonraki adıma geçsin
  → FULL benchmark session tetiklenmesin

Claude Code yeni bir sub-agent pattern eklediğinde:
  → full 7-step cycle zorunlu
  → shadow mode, benchmark, numeric compare, exit report
```

**Yasak davranışlar:**
- Typo fix sonrası "benchmark çalıştırayım emin olayım" → hayır, typecheck yeter
- Import path düzeltmesi sonrası exit report yazmak → hayır, commit mesajı yeter
- Her `str_replace` sonrası phase verification → hayır, meaningful unit of work sonrası

**Neden?** Full governance cycle'ı her küçük değişiklikte tetiklemek, Claude Code'u "proof üretme makinesi"ne dönüştürür. Kod üretmek yerine kendi işinin reportajını yapar. Proportionality bu refleksi engeller.

**Son söz:** Bu master dosya Claude Code'un "elinden tutma kılavuzu"dur. Ama **kılavuz kod yerine geçmez**. Kod olmadan hiçbir kılavuz değerli değildir. Rapor yazarken, validator çalıştırırken, kurallara uyarken — **önce kod çalışsın**.

## Rule 6 — Validation Non-Recursion

**Validation layers must never recursively expand.**

Master'da aynı kriteri **birden fazla katman test edebilir** (bu normal — defense in depth). Ama Claude Code bu yapıyı gördüğünde "daha çok validator yazayım" moduna kaymamalı. Kural:

```
If one validator already proves a criterion:
  → second validator only logs the result, DOES NOT re-validate
  → third validator references the log, DOES NOT re-run check
```

**Somut örnek:**

```
QA gate (R5) → "qa_score = 0.85, passed"
  └→ Authority Map (decision chain) → REFERENCE the qa_score, don't recompute
      └→ Execution Trace → LOG the decision, don't re-run QA logic
          └→ Phase exit report → SUMMARIZE from trace, don't query QA again
```

**Yasak davranışlar:**
- Phase exit'te "son bir QA daha çalıştırayım emin olmak için" demek
- Gate check scripti içinde authority map logic'ini tekrar implement etmek
- Execution trace'e yazarken QA decision'ı yeniden hesaplamak
- "Validator validation suite" yazmak (validator'ı valide eden validator)

**Tek istisna:** Bir önceki validator'ın output'u **corrupt/missing** ise — o zaman re-run gerekli. Bu da execution_trace'te `recomputation_reason=upstream_corrupt` ile işaretlenir.

**Neden önemli?** Her validator bir maliyet (LLM call, DB query, trace write). Recursive validation = quadratic cost growth. 3 katmanlı validator 3x değil, 9x maliyet demek. Bu scale edemeyen bir yapıdır.

## Rule 7 — Trace Aggregation

**Low-value repetitive trace entries must be aggregated.**

Execution trace her karar için detaylı kayıt tutar. Ama **tekrarlayan homojen event'ler** (retrieval query, fact lookup, confidence compute) her biri ayrı row olarak yazılırsa DB hızla şişer.

**Aggregation kuralı:**

```ts
// backend/src/execution-trace.ts — aggregation logic

const AGGREGATION_THRESHOLDS: Record<string, number> = {
  'retrieval_query':      10,   // >10 aynı event → aggregate
  'fact_lookup':          20,
  'confidence_compute':   20,
  'skill_trigger_check':  15,
  'memory_load':           5,   // düşük — az tekrar beklenir
};

export function recordTraceSmart(sessionId: string, step: TraceStep): void {
  const threshold = AGGREGATION_THRESHOLDS[step.type];

  if (!threshold) {
    // Non-aggregable event → normal write
    return recordTrace(sessionId, step);
  }

  // Check if we have an open aggregation window for this event type
  const openAggregation = db.prepare(`
    SELECT * FROM execution_trace
    WHERE session_id = ? AND step_type = ? AND aggregation_status = 'open'
    ORDER BY step_order DESC LIMIT 1
  `).get(sessionId, step.type) as any;

  if (openAggregation && openAggregation.aggregation_count < threshold) {
    // Increment the open aggregation
    db.prepare(`
      UPDATE execution_trace
      SET aggregation_count = aggregation_count + 1,
          last_sub_timestamp = ?,
          data_snapshot = ?
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      JSON.stringify({ summary: `aggregated ${openAggregation.aggregation_count + 1} events`, last_detail: step.data }),
      openAggregation.id,
    );
    return;
  }

  // Open new aggregation
  recordTrace(sessionId, {
    ...step,
    aggregation_status: 'open',
    aggregation_count: 1,
  });
}
```

**Schema ek:**
```sql
ALTER TABLE execution_trace ADD COLUMN aggregation_status TEXT;  -- 'open' | 'closed' | null
ALTER TABLE execution_trace ADD COLUMN aggregation_count INTEGER DEFAULT 1;
ALTER TABLE execution_trace ADD COLUMN last_sub_timestamp TEXT;
```

**Örnek sonuç:**

```
Before aggregation (DB'de):
  Step 23: retrieval_query — "THYAO EBITDA"
  Step 24: retrieval_query — "THYAO revenue"
  Step 25: retrieval_query — "THYAO net_debt"
  ...
  Step 72: retrieval_query — "THYAO capex"
  (50 ayrı row)

After aggregation:
  Step 23: retrieval_query (aggregated=50) — "50 retrieval queries, last: THYAO capex"
  (1 row, summary ile)
```

**Kazanım:** Trace DB size %70-80 azalır. SQLite query performance korunur. Analyst summary görür, gerekirse detay için başka tabloya (örn. `retrieval_queries`) bakar.

**İstisna:** Critical decision points (QA decision, citation block, arbitration) **ASLA aggregate edilmez**. Her biri ayrı row.

### Rule 7.1 — Trace Verbosity by Profile

**Trace detail level adapts to execution profile.**

Rule 7 aggregation horizontal (çok tekrar → özet) — Rule 7.1 vertical (kaç adım trace ediliyor). Profile'a göre granularity:

```
LIGHT profile:
  Trace only:
    - preflight decision
    - activation plan
    - QA decision (final)
    - citation check
    - final score
    - delivery status
  Skip:
    - per-agent start/complete pairs (aggregated into 1 summary row)
    - sub-agent internals
    - fact-by-fact confidence compute

STANDARD profile:
  Trace above + :
    - per-agent start/complete (individual rows)
    - coverage gap details
    - contradiction detections (material+critical only, soft aggregated)

FULL profile:
  Full trace depth (current default)
  Per-agent + per-sub-agent + per-decision

INSTITUTIONAL profile:
  Full trace + extended metadata:
    - methodology signature snapshots
    - confidence decomposition per fact
    - chairman question evaluation chain
```

**Implementation:**

```ts
// backend/src/execution-trace.ts
const TRACE_LEVELS: Record<ExecutionProfile, string[]> = {
  LIGHT:         ['preflight', 'activation', 'qa_decision', 'citation_check', 'final_score', 'delivery'],
  STANDARD:      ['preflight', 'activation', 'agent_start', 'agent_complete', 'coverage_check',
                  'contradiction' /* material+ only */, 'qa_decision', 'citation_check', 'final_score', 'delivery'],
  FULL:          ['*'],  // all step types
  INSTITUTIONAL: ['*', '+extended_metadata'],
};

export function shouldTrace(stepType: string, profile: ExecutionProfile, severity?: string): boolean {
  const allowed = TRACE_LEVELS[profile];
  if (allowed.includes('*')) return true;

  // Special: soft contradictions skipped in LIGHT/STANDARD
  if (stepType === 'contradiction' && severity === 'soft' && profile !== 'FULL' && profile !== 'INSTITUTIONAL') {
    return false;
  }

  return allowed.includes(stepType);
}
```

**Kazanım:** LIGHT session'da trace row count ~70% azalır. DB yükü profile'a proportional büyür.

**Senkronluk:** Bu kural Rule 7 (Aggregation) ile **birlikte** çalışır. Aggregation tekrarları sıkıştırır, Verbosity seviyeyi ayarlar. İkisi de açıkken trace DB minimum yükle çalışır.

## Rule 8 — Active Phase Scope

**Only current phase context is in active working memory; other phases are reference-only.**

Master dosya büyük (~470 KB). Claude Code Block R'ye başladığında Block U/S/P/G içeriği context'te **passive** yer tutar. Bu "token tax" reasoning kalitesini düşürür.

**Kural:**

```
When Claude Code is executing phase X:
  ACTIVE scope (full detail):
    - Phase X content (code, validation, exit criteria)
    - Global guardrails (15 items)
    - Runtime discipline (8 rules, this section)
    - Operational refinements v2 (8 items)
    - Authority map (for phase X dependencies)

  REFERENCE scope (read-only, header level):
    - Previous phases (already complete — summary only)
    - Future phases (not yet relevant — skip implementation detail)
    - Other blocks' internal architecture

  FORBIDDEN behavior during phase X:
    ✗ Implementing future phase code
    ✗ Refactoring previous phase code
    ✗ Citing future phase as reason for design choice in current
```

**Somut uygulama:**

Claude Code phase header'ında şunu görür:
```
## FAZ R5 — QA Hard Gate + Revision Expansion

[ACTIVE SCOPE for this phase — rest of master is reference-only]
```

Phase sonunda:
```
### Exit Report: R5
Active scope finalized. Scope transition to R6 authorized.
```

**Sadece Global Guardrails + Runtime Discipline + aktif faz içeriği Claude Code'un "üzerinde düşündüğü" kısımdır.** Diğer bölümler "vardır ama şu an konu değildir" olarak ele alınır.

**Token tax azalma tahmini:** Master'ın ~470 KB'ının %70'i reference scope olur → active reasoning load ~140 KB'ye iner. Claude Code daha odaklı çalışır.

**İstisna:** Cross-phase dependency gerektiren durumlar (ör. R7 Canonical Fact Pack → P1D Truth Arbitration'ın temeli). Bu dependency'ler **explicit** yazılır:
```
[Cross-phase dependency: R7 establishes fact schema that P1D extends —
 active scope for R7 includes P1D requirements preview]
```

### Rule 8.1 — Context Overload Emergency

**If active reasoning quality degrades due to context density, emergency compression triggers.**

Rule 8 baseline scope ayırımı yapar. Rule 8.1 bu scope bile yetersiz kaldığında devreye girer — Claude Code kendi reasoning quality'sinin düştüğünü fark ettiğinde:

**Tespit sinyalleri (Claude Code self-diagnostic):**

```
1. Aynı dosyayı 3+ kez tekrar view etmek gerekli (unutma)
2. "Hangi faz?"a net cevap veremiyor
3. Cross-reference yaparken yanlış faz ID veriyor (ör. R5 yerine R6)
4. Tool call'lar uzun "thinking" sonrası küçük edit'ler yapıyor
5. User mesajları ile faz instructions arasında confusion var
```

**Emergency compression protocol:**

```
Retain (full detail):
  ✓ Active phase section (kod + validation + exit criteria)
  ✓ Runtime Discipline (8 rules)
  ✓ Authority Map (decision chain)
  ✓ Active global guardrails (only ones relevant to current phase)

Compress (header + key rules only):
  ✗ Other block's full phase content
  ✗ Operational Refinements v2 (keep only Refinement philosophy 7 prensiplerini)
  ✗ Governance detail (Block G skip during R/U/S/P)
  ✗ Example code blocks (reference-only, skip content)

NEVER compress:
  ✗ Phase exit criteria of current phase (active scope, no compression)
  ✗ Critical facts list (P2D)
  ✗ Fact ownership lock (P1D)
```

**Uygulama:**

Emergency durumunda Claude Code user'a şeffaf söyler:

```
"Master dosyasının büyüklüğü reasoning kalitesini etkiliyor.
 Şu an aktif scope: Block R, Faz R5. Diğer block'ları header düzeyinde
 referans aldım, full content'e gitmedim. Bu fazı bitirip sonraki
 faza geçerken scope yeniden yüklenecek."
```

Bu şeffaflık analyst'e "neden bu davranış?" sorusunu cevaplar ve güven verir.

**Son fallback:** Eğer emergency compression bile yetmezse (context genuinely çok büyük), Claude Code **partial completion + explicit handoff** yapar:

```
"Bu faz 3 alt adıma bölünebilir. İlk 2'yi tamamladım (X, Y).
 3'üncüye geçmeden önce yeni conversation açmanızı öneririm —
 mevcut context temizlensin, yeni conversation aktif scope ile başlasın."
```

Bu "graceful degradation" partial completion'dan farklı — partial complete rapor değil, açık handoff.

**Neden?** 480 KB master + 756 MB repo + audit dosyaları + tool outputs + konuşma geçmişi — bunların toplamı Claude Code context window'ını (200K token) hızla doldurur. Context dolduğunda reasoning kalitesi öngörülemez şekilde düşer. Explicit emergency rule'u olmazsa Claude Code **sessizce kötüye kayar**.

---

# OPERATIONAL REFINEMENTS v2 — Akış Engellerini Kaldıran Ayarlar

Bu bölüm master dosyanın sıkı kurallarını **gerçek kullanım kalibrasyonuna göre yumuşatır**. Ana felsefe: **"Hard block" sadece gerçek tehlikede (bug, runaway, güvenilirlik kaybı) kullanılır. Kalanı soft warning + report annotation'a dönüşür**. Governance analiste yardım etmeli, onu boğmamalı.

## Refinement 1 — Preflight Hard vs Soft Ayrımı

P3A Preflight **iki kategoride** check yapar:

```
HARD BLOCK (session BAŞLAMAZ):
  ✗ invalid_ticker             — şirket BIST'te yok / delisted
  ✗ missing_api_key            — ANTHROPIC_API_KEY eksik
  ✗ db_corrupt / db_unreachable — SQLite erişilemiyor
  ✗ pipeline_config_broken     — orchestrator config parse fail

SOFT WARNING (session DEVAM EDER, ama warning kaydedilir):
  ⚠ data_freshness_low         — son faaliyet raporu 9+ ay eski
  ⚠ corpus_coverage_gaps        — Qdrant'ta 3 yıl veri yok
  ⚠ no_historical_baseline      — replay baseline yok
  ⚠ peer_set_incomplete         — 5 peer yerine 3 tane
  ⚠ macro_data_stale            — CPI/TRY last updated >30 days
  ⚠ kap_disclosure_gap          — son 180 günde 0 disclosure
```

**Kazanım:** Session 100'de ~95'i başlar. Önceki "agresif preflight" ile %40-50 session başlamadan ölüyordu.

## Refinement 2 — LIGHT Mode Default Off

LIGHT mode default devre dışı:

```ts
// config.ts
export const LIGHT_MODE_ENABLED = (process.env.LIGHT_MODE_ENABLED ?? 'false') === 'true';

// activation-governor.ts selectProfile
if (!LIGHT_MODE_ENABLED && profile === 'LIGHT') {
  profile = 'STANDARD';
  why += ' | LIGHT_MODE_ENABLED=false → upgraded to STANDARD';
}
```

**Neden?** BIST kurumsal şirket analizinde LIGHT nadir anlamlı. KOBİ/bağımsız küçük şirket analizi gibi spesifik senaryolarda açılır.

## Refinement 3 — Sub-Agent Shadow Gate v2 (Composite Quality)

Block S12'deki sub-agent promotion gate **parity-only** yerine **composite quality**:

```
# ESKİ (çok sıkı):
✅ Numeric parity ≥ 98%         — aynı değer çıksın
✅ QA pass rate delta ≥ 0
✅ Missing metric reduction ≥ 30%
✅ Median latency delta ≤ +20%
✅ Cost delta ≤ +50%

# YENİ (quality-preserving):
✅ QA score delta ≥ -0.02               — QA %2'den fazla düşmesin
✅ Fact count delta ≥ 0                  — daha az fact üretmesin
✅ Hallucination rate delta ≤ 0          — daha çok halüsinasyon yapmasın
✅ Critical fact accuracy ≥ 95%          — kritik fact'lerde tutarlı
✅ Non-critical fact: farklılık serbest  — daha doğru değer üretebilir
✅ Median latency delta ≤ +30%           — biraz daha toleranslı
✅ Cost delta ≤ +60%
```

**Neden?** Sub-agent'ın amacı **daha iyi** çıktı üretmek — bazen legacy'den farklı (ama daha doğru) değer çıkar. Parity %98 threshold'u sub-agent'ı hiç production'a geçirmez; composite quality ise "değer değişsin, kalite düşmesin" ölçer.

## Refinement 4 — Escalation Severity Budget (ChatGPT A)

Master'da P4A Escalation Manager var ama budget yok → alarm fatigue riski.

```ts
// backend/src/escalation/severity-budget.ts
export const ESCALATION_BUDGET_PER_SESSION: Record<string, number> = {
  critical: 3,    // max 3 critical escalation per session
  material: 5,
  soft:     10,
};

export function canCreateEscalation(sessionId: string, severity: string): boolean {
  const current = db.prepare(`
    SELECT COUNT(*) as n FROM escalations
    WHERE session_id = ? AND severity = ?
  `).get(sessionId, severity) as any;

  const budget = ESCALATION_BUDGET_PER_SESSION[severity] ?? 5;
  if (current.n >= budget) {
    // Budget dolu → aggregate counter artır, yeni escalation oluşturma
    db.prepare(`
      UPDATE escalation_aggregates
      SET suppressed_count = suppressed_count + 1
      WHERE session_id = ? AND severity = ?
    `).run(sessionId, severity);
    return false;
  }
  return true;
}
```

**Kazanım:** Bir session'da 50 küçük şey için 50 alarm oluşturulmaz; 10'dan sonra aggregate counter'a gider. Analyst "alarm blindness" yaşamaz.

## Refinement 5 — Degraded Success Status (ChatGPT B — EN DEĞERLİ)

Session status enum **genişletilir**:

```sql
-- analysis_sessions.status new enum values:
-- 'completed'                 — tam başarı, tüm sections tamam
-- 'completed_with_warning'    — teslim edildi, soft QA warning var
-- 'completed_degraded'        — NEW: teslim edildi, bazı sections eksik
-- 'qa_failed'                 — critical QA fail, rapor blok
-- 'citation_blocked'          — 3+ critical fact citation eksik
-- 'preflight_failed'          — hard preflight fail
-- 'error'                     — teknik hata

ALTER TABLE analysis_sessions
  ADD COLUMN section_status_json TEXT;   -- her section için 'delivered'|'partial'|'missing'
```

```ts
// Section status tracking
export type SectionStatus = {
  section: 'financial' | 'sector' | 'valuation' | 'macro' | 'strategic' | 'events' | 'technical' | 'executive_summary';
  status: 'delivered' | 'partial' | 'missing';
  reason?: string;
  completeness_pct: number;  // 0-100
};

export function determineOverallStatus(sections: SectionStatus[], qaStatus: string, citationStatus: string): string {
  const missing = sections.filter(s => s.status === 'missing').length;
  const partial = sections.filter(s => s.status === 'partial').length;

  // Eğer rapor critical QA veya citation block yemişse, onlar öncelikli
  if (qaStatus === 'critical_fail') return 'qa_failed';
  if (citationStatus === 'blocked') return 'citation_blocked';

  // Yoksa section completeness'a bak
  if (missing === 0 && partial === 0) return 'completed';
  if (missing === 0 && partial <= 2) return 'completed_with_warning';
  if (missing <= 2) return 'completed_degraded';  // bazı section eksik ama rapor değerli
  return 'completed_degraded';  // 3+ section missing ise de teslim, çünkü rapor yine değerli bilgi taşıyor
}
```

**Kazanım:** Gerçek dünya "8 section'un 6'sı mükemmel, 2'si eksik" durumu artık görünür. Rapor teslim edilir, analyst eksikleri bilir, kendi için karar verir.

## Refinement 6 — Positive Session Bundle (ChatGPT C)

P7E Analyst Review Bundle şu an sadece **blocked/failed** session'lar için. Pozitif durumlar için **Session Summary Bundle** eklenir:

```ts
// backend/src/ux/session-summary-bundle.ts
export type SessionSummaryBundle = {
  session_id: string;
  ticker: string;
  status: string;
  why_delivered: string;              // 1-2 cümlelik özet
  what_skipped: Array<{               // hangi optional layer'lar skipped
    layer: string;
    reason: string;
  }>;
  quality_highlights: Array<{         // en güçlü 3 insight
    section: string;
    highlight: string;
  }>;
  generated_at: string;
};

export function generateSessionSummary(sessionId: string): SessionSummaryBundle {
  // her successful/degraded session için çalışır
  // blocked session'lar zaten P7E Analyst Review Bundle alır
}
```

**Trigger:**
- `status` ∈ {completed, completed_with_warning, completed_degraded} → SessionSummaryBundle
- `status` ∈ {qa_failed, citation_blocked, preflight_failed, error} → AnalystReviewBundle (P7E)

**Kazanım:** Her session'ın sonunda analyst 30 saniyede ne olduğunu anlar — trace okumaya gerek yok.

## Refinement 7 — Fact Freshness Decay (ChatGPT D — KRİTİK)

Master'da `FactSource.freshness_days` var ama confidence hesabına **etkisi tanımsız**. Yeni kural:

```ts
// backend/src/fact-layer/freshness-decay.ts
/**
 * Fact confidence = base_confidence × freshness_decay_factor
 * Aynı fact 6 ay eskisiyle aynı confidence olmaz.
 */
export function applyFreshnessDecay(baseConfidence: number, freshnessDays: number): {
  decayed_confidence: number;
  decay_factor: number;
  decay_reason: string;
} {
  let decay: number;
  let reason: string;

  if (freshnessDays <= 30) {
    decay = 1.0;                            // fresh, no decay
    reason = 'fresh (≤30d)';
  } else if (freshnessDays <= 90) {
    // Linear 30→90: 1.0 → 0.90
    decay = 1.0 - (freshnessDays - 30) / 60 * 0.10;
    reason = `recent (${freshnessDays}d) — light decay`;
  } else if (freshnessDays <= 180) {
    // Linear 90→180: 0.90 → 0.75
    decay = 0.90 - (freshnessDays - 90) / 90 * 0.15;
    reason = `stale (${freshnessDays}d) — medium decay`;
  } else if (freshnessDays <= 365) {
    // Linear 180→365: 0.75 → 0.60
    decay = 0.75 - (freshnessDays - 180) / 185 * 0.15;
    reason = `old (${freshnessDays}d) — heavy decay`;
  } else {
    decay = 0.50;                            // capped at 50% for 1+ year old
    reason = `very old (${freshnessDays}d) — capped at 50%`;
  }

  return {
    decayed_confidence: baseConfidence * decay,
    decay_factor: decay,
    decay_reason: reason,
  };
}
```

**Integration:** P1A Fact Confidence Scoring'de final confidence hesabına dahil:

```ts
// ÖNCE:
final_confidence = corroboration_score × source_trust × internal_consistency × specificity;

// SONRA (freshness dahil):
final_confidence = corroboration_score × source_trust × internal_consistency × specificity × freshness_decay;
```

**Örnek etki:**

```
Fact: ebitda_fy2024 = 20,452 mn TL
Source: KAP annual report, ingested 120 days ago
Base confidence: 0.85
Freshness decay (120d): 0.85
Final confidence: 0.85 × 0.85 = 0.72

Aynı fact, 400 days ago:
Final confidence: 0.85 × 0.60 = 0.51 → "low_confidence" flag
```

Truth arbitration iki candidate arasında seçim yaparken freshness-adjusted confidence kullanır → yeni veri otomatik öncelikli olur.

**Kazanım:** Eski veri sessizce "güvenilir" görünmez; sistem otomatik decay uygular, analyst yaşlı veriye dikkat eder.

## Refinement 8 — Küçük Threshold Düzeltmeleri

```ts
// Dead code detector window (G5)
DEAD_CODE_WINDOW_DAYS: 30 → 90           // quarterly skill'ler dead sayılmasın

// Memory hygiene dedup similarity (G7)
MEMORY_DEDUP_SIMILARITY: 0.85 → 0.92     // daha konservatif, benzer-ama-farklı'lar silinmesin

// Replay regression valuation drift (G2)
REPLAY_VALUATION_DRIFT_MAX: 0.10 → 0.15  // BIST volatil, %15 tolerans

// Coverage engine action
COVERAGE_GAPS_BLOCK: true → false         // sadece QA'ya input, kendisi block etmez
                                           // (zaten Authority Map'te böyleydi, config'e yansıtılır)

// Methodology drift alarm threshold (G6)
METHODOLOGY_DRIFT_DELTA: 0.20 → 0.30      // daha toleranslı baseline karşılaştırma
```

## Uygulama Yeri

Tüm refinement'lar mevcut fazların içine **override/extension** olarak girer:

| Refinement | Etkilenen Faz |
|---|---|
| Token Budget v2 | P9 Activation Governor (buildPlan, checkTokenBudget) |
| QA Hard vs Soft | R5 (QA Hard Gate) |
| Critical Facts List | P2D (Citation Enforcement) |
| Contradiction 3-tier | P2A (Contradiction Engine) |
| Preflight Hard/Soft | P3A (Preflight Validators) |
| LIGHT Default Off | P9 (Activation Governor) |
| Sub-Agent Composite Gate | S12 (Production Cutover) |
| Escalation Budget | P4A (Escalation Manager) |
| Degraded Success | P2E (Final Publishable Score) + sessions.status enum |
| Positive Bundle | P7E (expand to success cases) |
| Freshness Decay | P1A (Fact Confidence Scoring) |
| Small Thresholds | G2, G5, G6, G7 + P2C |

## Refinement Philosophy (Prensipler)

1. **Blok sadece gerçek tehlikede** — bug, runaway, güvenilirlik kaybı
2. **Warning her yerde** — analyst görebilmeli, sistem gizlememeli
3. **Partial delivery > Full block** — eksik rapor boş rapordan iyidir
4. **Severity tiers** — soft/material/critical ayrımı her yerde
5. **Freshness matters** — eski veri sessizce güvenilir sayılmaz
6. **Budget to limit noise** — escalation, alarm, contradiction hepsinde budget
7. **Composite > Single metric** — tek sayı kalite ölçemez

---

# PHASE PROMOTION MATRIX — Deterministic Numeric Thresholds

Her block sonunda **keyfi "iyi çalışıyor" kararı yerine sayısal kriterler** ile promote kararı verilir. Aşağıdaki tablolar bağlayıcıdır — threshold karşılanmadan bir sonraki block'a geçilemez.

## Block R Promotion Thresholds

Benchmark: **THYAO canlı session**. Aşağıdaki 5 kriter hepsi geçerse promote:

```
✅ Fatal error sayısı = 0                    (session kırılmadan tamamlandı)
✅ QA hard gate test: FAIL verilen session   (status = 'qa_failed' oldu mu)
✅ Feedback write success rate = 100%         (feedback loop her run'da dosya yazdı mı)
✅ Memory loader 3-katman yükledi             (rules + memory + lessons.jsonl prompt'a girdi)
✅ Python engine aktif session                (log'da "[python-engine] run..." satırı)
```

Doğrulama: `npx tsx scripts/block-r-gate-check.ts THYAO`

## Block U Promotion Thresholds

Benchmark: **EREGL canlı session**. Document intel kritik:

```
✅ Retrieval precision proxy ≥ 0.6             (top-5'te en az 3 relevant chunk)
✅ Empty evidence pack rate ≤ 10%              (sorgulanan sorular cevapsız kalmamalı)
✅ Skill injection log ≥ 2                     (bir session'da en az 2 skill trigger)
✅ Citation accuracy (manual sample N=20) ≥ 80%  (cited snippet'in gerçekten orada olduğu)
✅ Qdrant ingestion success ≥ 10 company       (corpus'ta min 10 şirket var)
```

Doğrulama: `npx tsx scripts/block-u-gate-check.ts EREGL`

## Block S Promotion Thresholds (per sub-agent pattern)

Benchmark: **KCHOL shadow mode** (sub-agent pattern açık iken). Her parent için 5 kriter:

```
✅ Numeric parity ≥ 98%                        (legacy vs sub-agent fact delta ≤ 2%)
✅ QA pass rate delta ≥ 0                      (legacy'den kötü olmamalı)
✅ Missing metric reduction ≥ 30%              (sub-agent ana vaadi)
✅ Median latency delta ≤ +20%                 (paralellik overhead'i sınır)
✅ Cost delta ≤ +50%                           (1.5x'i aşarsa budget patlar)
```

**OVERRIDE NOTICE (Composite Quality Priority) — BAĞLAYICI:**

```
Whenever composite quality gate is active (default after v2 refinements):
  → Numeric parity ≥ 98% is INFORMATIONAL ONLY, not blocking.
  → Composite quality criteria are the SOLE promotion gate.
  → Legacy parity threshold must NOT override composite decision.
```

Claude Code bu override'ı her sub-agent promotion değerlendirmesinde explicit olarak belirtir:

```
Sub-agent promotion decision for <parent>:
  [INFO] Legacy parity: 94.2% (below 98% threshold) — INFORMATIONAL
  [GATE] Composite quality:
    - QA score delta: +0.03 ✓
    - Critical fact accuracy: 96.5% ✓
    - Hallucination rate delta: -0.02 ✓
    - Fact count delta: +12 ✓
  DECISION: PROMOTE (composite gate passed; parity informational)
```

Bu ambiguity tamamen kapanır — Claude Code "legacy %98 geçilmediği için promote etmeyeyim" diyemez; composite gate aktifse o karar verir.

Doğrulama: `npx tsx scripts/shadow-compare.ts <parent_agent> --gate-check --composite`

## Block P Promotion Thresholds

Benchmark: **ULKER (LIGHT) + EREGL (FULL) + KCHOL (INSTITUTIONAL)** üçlüsü.

```
✅ Contradiction false positive rate ≤ 15%      (unit-mismatch vs true conflict ayrımı)
✅ Citation blocker precision ≥ 90%             (block edilen session'lar gerçekten eksikti)
✅ Activation Governor profile accuracy ≥ 80%    (manuel oracle ile karşılaştır)
✅ Replay drift delta ≤ 10%                     (aynı session 2x run, sonuç stabil)
✅ Final score correlation with analyst rating ≥ 0.6  (golden dataset vs)
```

Doğrulama: `npx tsx scripts/block-p-gate-check.ts --full-suite`

## Block G Promotion Thresholds

Block G (Governance) tüm upstream block'lar production'da stabil olduktan sonra. Benchmark: **Core 4 (THYAO/EREGL/KCHOL/ASELS) haftalık session**.

```
✅ governance_summary.json daily update ediliyor (min 10 gün veri)
✅ Replay regression suite son 20 session'da <%10 drift (G2)
✅ Cost + latency moving avg alarm'ları çalışıyor, FP rate <%20 (G3)
✅ Agent health score ≥15 agent için güncel, hiç "red" tier >7 gün kalmıyor (G4)
✅ En az 1 dead layer/skill tespit edilip temizlenmiş (G5)
✅ Methodology drift baseline toplandı + 4 hafta veri (G6)
✅ Memory hygiene scripti duplicate rate <%5 (G7)
✅ Qdrant corpus freshness raporu production'da, refresh plan yürüyor (G8)
✅ Architecture protection PR template aktif, 1+ PR bu template ile (G10)
✅ En az 3 runbook executable + 1 gerçek drift→remediation yaşandı (G11)
```

Doğrulama: `npx tsx scripts/block-g-gate-check.ts` + `npx tsx scripts/governance-self-test.ts`

## Gate Check Script Contract

Her gate-check scripti şu JSON formatında çıktı döndürür:

```json
{
  "block": "R" | "U" | "S" | "P" | "G",
  "benchmark_ticker": "THYAO",
  "session_id": "...",
  "criteria": [
    { "name": "fatal_error_count", "threshold": 0, "actual": 0, "passed": true }
  ],
  "overall_passed": true,
  "next_block_authorized": true
}
```

`overall_passed = false` ise bir sonraki block'a geçiş **YASAK**. Hotfix yap, re-test et.

---

# SINGLE BLOCK AUTHORITY MAP — Kim Hangi Yetkiye Sahip?

Bir session birden fazla yerde block yiyebilir — bu debug cehennemi yaratır. **Her karar tipinin TEK authority'si** vardır. Aşağıdaki matris bağlayıcıdır:

## Authority Matrisi

```
KARAR TİPİ                        │ TEK AUTHORITY          │ SONUÇ
────────────────────────────────  │  ─────────────────── │  ────────────────────
Pipeline flow block               │ QA Hard Gate (R5)      │ status='qa_failed'
Revision request                  │ QA Hard Gate (R5)      │ revisable agent rerun
Coverage gap detection            │ Coverage Engine (P2C)  │ QA'ya input, kendisi block etmez
Publish block (critical citation) │ Citation Enforcement   │ status='citation_blocked'
                                  │ (P2D)                  │
Critical fact conflict resolution │ Truth Arbitration      │ canonical value seçer, block etmez
                                  │ (P1D)                  │
Contradiction flagging            │ Contradiction Engine   │ report üretir, block etmez
                                  │ (P2A)                  │
Final quality tier assignment     │ Final Score (P2E)      │ tier badge verir, BLOCKED tier'ı block
Legal/regulatory violation        │ SPK Compliance (P6F)   │ delivery öncesi block
Preflight failure                 │ Preflight (P3A)        │ status='preflight_failed'
                                  │                        │ (session hiç başlamaz)
Budget exhaustion                 │ Quality Budget (P2E)   │ alert, governor override
Escalation creation               │ Escalation Manager     │ insan/agent sahipli ticket
                                  │ (P4A)                  │ (kendisi block etmez)
```

## Karar Akış Sırası (bir session'da)

```
1. PREFLIGHT (P3A)          → fail ise session başlamaz
     ↓
2. ACTIVATION GOVERNOR (P9)  → profile seçer, katmanları aç/kapat
     ↓
3. PIPELINE EXECUTION        → agent + sub-agent chain
     ↓
4. COVERAGE ENGINE (P2C)     → eksikleri işaretler, QA'ya input
     ↓
5. CONTRADICTION ENGINE (P2A) → çelişki raporu, ARBITRATION'a input
     ↓
6. TRUTH ARBITRATION (P1D)   → canonical value seçer
     ↓
7. QA HARD GATE (R5)         → REVISION veya PASS
     ↓ (pass ise)
8. CITATION ENFORCEMENT (P2D) → critical fact'te citation var mı? BLOCK or pass
     ↓
9. FINAL SCORE (P2E)         → tier assign (BLOCKED / REVISION / INTERNAL / PUBLISH)
     ↓
10. SPK COMPLIANCE (P6F)     → delivery öncesi son kontrol
     ↓
11. DELIVERY
```

**Kural:** Yukarıdaki zincirde aynı sebeple iki kez block olmaz. Örnek: Coverage engine "eksik metrik var" tespit eder ama **kendisi block etmez** — QA'ya bildirir, QA karar verir. Böylece tek authority.

**Uyarı:** Escalation Manager (P4A) bu zincirde yer almaz. Yukarıdaki adımların HERHANGİ birinde sorun çıkarsa escalation creator — ama kendisi gate değil.

## Quality Preservation Rule

Authority block'ların hiçbiri **analytical narrative production**'u durduramaz. Somut kurallar:

```
CITATION block              → publish block ONLY
                              (narrative writing devam eder, sadece raporun son
                               yayınlanması bloklanır)

QA revision                 → targeted agent rerun ONLY
                              (diğer agent'ların analytical output'u korunur,
                               sadece hatalı olan rerun yapılır)

CONTRADICTION flag          → report içinde "disputed" flag + arbitration
                              (silmek veya baskılamak yasak — okuyucu
                               çelişkiyi görebilmeli)

FINAL SCORE tier BLOCKED    → manual review request, rapor "draft" olarak
                              saklanır, içerik silinmez
```

**Silent suppression yasak.** Eğer bir section gerçekten cripple olacaksa, raporda görünür şekilde:

```
[Section suppressed: insufficient citation evidence for 3 critical facts
 — raw analytical narrative available at output/<session>/raw/strategic_synthesis.md]
```

şeklinde markdown placeholder bırakılır. Kullanıcı suppression'ın farkında olmalı ve nedenini görmeli.

**Neden önemli?** Analyst senior bir yatırım profesyoneli; governance layer'ı "güvenli" tarafa düşmek için rapor analizini kısaltırsa, rapor institutional değeri kaybeder. Governance ≠ censorship; governance = verification.

---

# UNIFIED EXECUTION TRACE — Tüm Karar Noktaları Tek Yerde

Bu kadar katmanlı sistemde "neden bu session şu sonucu verdi?" sorusu **tek sorguyla** cevaplanmalı. Dağınık tablolar (`activation_plans` + `truth_decisions` + `contradictions` + `qa_runs` + `citation_reports`) ayrı ayrı durabilir ama **unified view** şart.

## `execution_trace` Tablosu (R8 ile birlikte kurulur)

```sql
CREATE TABLE execution_trace (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,          -- sıralı 1, 2, 3, ...
  step_type TEXT NOT NULL,               -- 'preflight' | 'activation' | 'agent_start' | 'agent_complete' | 'sub_agent' | 'coverage_check' | 'contradiction' | 'arbitration' | 'qa_decision' | 'citation_check' | 'final_score' | 'spk_check' | 'escalation' | 'delivery'
  step_name TEXT NOT NULL,               -- insan okunabilir etiket
  decision TEXT,                         -- 'pass' | 'fail' | 'revise' | 'skip' | 'block'
  reason TEXT,                           -- neden?
  affected_entities TEXT,                -- agent_id / fact_key / rule_id (JSON array)
  data_snapshot TEXT,                    -- relevant data (JSON, küçük)
  failure_origin TEXT,                   -- fail durumunda kök sebep (ör. 'llm_timeout', 'schema_mismatch', 'upstream_missing_fact:ebitda_fy2025')
  upstream_dependency TEXT,              -- bu adımı besleyen önceki step(s) — JSON array of step_order
  timestamp TEXT NOT NULL,
  duration_ms INTEGER,
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
);
CREATE INDEX idx_trace_session ON execution_trace(session_id, step_order);
CREATE INDEX idx_trace_type ON execution_trace(step_type);
```

## Trace Recording Helper

```ts
// backend/src/execution-trace.ts
import { db } from './db.js';
import { nanoid } from 'nanoid';

let _stepOrder: Record<string, number> = {};

export function recordTrace(sessionId: string, step: {
  type: string;
  name: string;
  decision?: string;
  reason?: string;
  affected?: string[];
  data?: any;
  duration_ms?: number;
  failure_origin?: string;           // NEW: root cause if fail/block
  upstream_dependency?: number[];    // NEW: step_order array of feeding steps
}): void {
  _stepOrder[sessionId] = (_stepOrder[sessionId] || 0) + 1;
  db.prepare(`
    INSERT INTO execution_trace
    (id, session_id, step_order, step_type, step_name, decision, reason,
     affected_entities, data_snapshot, failure_origin, upstream_dependency,
     timestamp, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nanoid(), sessionId, _stepOrder[sessionId], step.type, step.name,
    step.decision || null, step.reason || null,
    JSON.stringify(step.affected || []),
    step.data ? JSON.stringify(step.data).slice(0, 5000) : null,
    step.failure_origin || null,
    step.upstream_dependency ? JSON.stringify(step.upstream_dependency) : null,
    new Date().toISOString(),
    step.duration_ms || null,
  );
}

export function getSessionTrace(sessionId: string) {
  return db.prepare(`
    SELECT * FROM execution_trace WHERE session_id = ? ORDER BY step_order ASC
  `).all(sessionId);
}
```

## Her Authority kendi trace'ini yazar

```ts
// Örnek: QA decision
recordTrace(sessionId, {
  type: 'qa_decision',
  name: 'QA Hard Gate',
  decision: qaDecision === 'APPROVED' ? 'pass' : 'revise',
  reason: qaReasons.join('; '),
  affected: qaReport.revision_requests.map(r => r.target_agent),
  data: { qa_score: qaReport.overall_score, round: qaRound },
});

// Örnek: Citation block
recordTrace(sessionId, {
  type: 'citation_check',
  name: 'Critical Fact Citation Enforcement',
  decision: citationReport.publish_blocked ? 'block' : 'pass',
  reason: citationReport.blocking_reason,
  affected: citationReport.violations.map(v => v.fact_key),
});
```

## Replay / Debug CLI

```bash
npx tsx scripts/trace.ts <session_id>
# Output:
# Step 1 [preflight] Preflight Check → pass (7 checks OK)
# Step 2 [activation] Activation Governor → profile=INSTITUTIONAL (complexity 85/100)
# Step 3 [agent_start] data_collection → running
# Step 4 [sub_agent] dc_financials_collector → pass (5Y statements OK)
# ...
# Step 47 [qa_decision] QA Hard Gate → revise (FA missing EBITDAR)
# Step 48 [agent_start] financial_analysis (REVISION 1) → running
# Step 52 [qa_decision] QA Hard Gate → pass (score=0.87)
# Step 53 [citation_check] Citation Enforcement → block (net_debt_fy2025 no source)
# FINAL: status=citation_blocked
```

Bu trace yazılmadan hiçbir block kararı geçerli sayılmaz.

---
---

# PART 2 — SCALE & POLISH (Block S + Block P)

Bu dosya **Finance-X Hybrid master execution file'ının 2. parçasıdır**. Önkoşul: Part 1 (FOUNDATION) tamamlanmış ve Part 1 Exit Verification'ın 5 kriteri green olmuş olmalı. Part 1 bitmeden bu parçayı başlatmak **yasak**.

Bu parça iki büyük bloğu kapsar:

- **Block S — SUBAGENT** (12 faz): 24 sub-agent worker graph, 4 dalgalı production rollout, shadow mode compare, composite quality gate
- **Block P — POLISH** (20 faz): kurumsal research OS — fact-level confidence, truth arbitration, contradiction engine, QA governance, quality budget, reliability patterns, production hardening, UX

Bu parça tamamlanmadan Part 3 (GOVERNANCE) başlatılamaz. Part 2 sonunda sistem şu duruma gelir:
- 24 sub-agent production'da paralel çalışıyor (4 dalga ile rollout edildi)
- Fact layer v2 aktif (confidence + lineage + methodology + arbitration)
- Quality OS kurulu (QA + coverage + citation + final score)
- Activation Governor 4 profile ile çalışıyor (LIGHT/STANDARD/FULL/INSTITUTIONAL)
- Execution intelligence (preflight + planner + incremental + cost governor) aktif
- Production hardening (secrets + audit + CI/CD + SPK + executive checklist) tamamlandı

Part 2 en büyük parça — 32 faz, yoğun iş yükü. Disiplin şart: her faz kendi 3-adım döngüsünü bitirmeden bir sonrakine geçiş yok.

---

# PART 2 — PHASE OVERVIEW

**Block S — SUBAGENT** (12 faz, benchmark: KCHOL shadow + KCHOL/EREGL production)
- S1: Sub-Agent Infrastructure
- S2: data_collection 4 Sub-Agent
- S3: parse_standardization 3 Sub-Agent
- S4: financial_analysis 5 Sub-Agent (EN BÜYÜK ETKİ)
- S5: report_formatter 4 Deterministic Worker
- S6: macro_analysis 3 Sub-Agent
- S7: valuation_agent 4 Sub-Agent
- S8: sector_competition 3 Sub-Agent + Holding Dynamic
- S9: event_impact_mapper 2 Sub-Agent
- S10: final_summary 3 Sub-Agent
- S11: strategic_synthesis 3 Sequential
- S12: E2E Test + Shadow Mode + 4-Wave Production Cutover

**Block P — POLISH** (20 faz, benchmark: ULKER + EREGL + KCHOL üçlüsü)
- P1A: Fact-Level Confidence Scoring (+ freshness decay)
- P1B: Data Lineage Tracking
- P1C: Versioned Methodology Registry
- P1D: Financial Truth Arbitration (+ fact ownership lock)
- P2A: Contradiction Engine (3-tier: soft/material/critical)
- P2B: Structured QA
- P2C: Coverage Engine
- P2D: Hallucination Detection + Citation Enforcement (critical-facts-only)
- P2E: Quality Budget + Final Publishable Score (+ degraded success tier)
- P2F: Chairman Question Anticipation
- P3A: Pre-LLM Validators (hard vs soft preflight)
- P3B: Task Planner
- P3C: Incremental Computation Engine
- P3D: Adaptive Cost Governor
- P4A: Escalation Manager State Machine (+ severity budget)
- P4B: Self-Healing Pipelines
- P4C: Idempotency + Saga Pattern
- P4D: Circuit Breaker
- P5A-C: Quality Data (Golden Dataset + A/B Testing + Synthetic Companies)
- P6A-F: Production Hardening (Secrets, Audit, CI/CD, Health, Injection Defense, SPK)
- P7A-E: UX (SSE, DAG, Replay, Explainability, Analyst Review Bundle)
- P8: Future Roadmap + ARCHITECTURE.md
- P9: Activation Governor Layer (SON KATMAN — LIGHT mode default disabled)

---

# MANDATORY PER-PHASE CYCLE (BU DOSYADAKİ TÜM FAZLAR İÇİN)

Her faz için **5 adımlı zorunlu döngü**. Adım atlanamaz, sıra bozulamaz. Her faz sonunda 5 adımın çıktısı `docs/phase-reports/<phase-id>.md` dosyasında yazılı olmalı.

## STEP 1 — IMPLEMENTATION (yapılan işler)

Faz sonunda **ne yapıldı** somut olarak raporlanır:

```bash
git diff --stat HEAD~1
git status --porcelain | grep '^A'
sqlite3 finance-x.db ".schema <new_table>"
git diff package.json pnpm-lock.yaml
```

Part 2'de özellikle **sub-agent yapısı** ve **quality OS katmanları** değişiklikleri raporlanır:
```
### Yapılan İşler (STEP 1)
- [NEW]  backend/src/sub-agents/fa_ratios_analyzer.ts (320 LOC, 1 of 5 FA sub-agents)
- [NEW]  backend/src/quality-os/truth-arbitration.ts (285 LOC)
- [EDIT] backend/src/orchestrator.ts (+85 -34)
- [MIGRATION] CREATE TABLE sub_agent_runs, canonical_facts, truth_decisions
- [CONFIG] SUBAGENT_FINANCIAL_ANALYSIS_ENABLED=false (default shadow)
```

## STEP 2 — SMOKE TEST (teknik test sonuçları)

```bash
pnpm typecheck
pnpm test -- backend/src/sub-agents backend/src/quality-os
grep -rn "TODO\|FIXME\|placeholder" <changed-files>
grep -rn 'throw new Error("not implemented' .
pnpm build
```

5 kriter + Part 2 özel:
- ✅ Typecheck passed
- ✅ Unit tests passed
- ✅ No TODO/FIXME/placeholder
- ✅ No stub function
- ✅ Build success
- ✅ **Sub-agent parent registry consistent** (Part 2 özel): her new sub-agent parent'ına bağlı

## STEP 3 — LIVE BENCHMARK (canlı test sonuçları)

Block'a göre benchmark:

**Block S fazları:**
- S1-S4 → **KCHOL** (holding complexity + FA sub-agent test)
- S5-S8 → **KCHOL + EREGL** (parallel data/analysis layer)
- S9-S12 → **THYAO + KCHOL** (synthesis + 4-wave cutover)

**Block P fazları:**
- P1*-P2* → **ULKER (LIGHT upgrade→STANDARD)** + **EREGL (FULL)**
- P3*-P4* → **KCHOL (INSTITUTIONAL)** complete session
- P5*-P7* → **Core 4 spot check**
- P8-P9 → **Core 4 full institutional**

```bash
npx tsx scripts/run-analysis.ts <TICKER> --mode=live --profile=<profile>

# Session sonuçları
sqlite3 finance-x.db "
  SELECT id, status, final_quality_score, total_tokens, duration_ms
  FROM analysis_sessions ORDER BY started_at DESC LIMIT 1
"

# Part 2'ye özgü: sub-agent shadow comparison (S fazları için)
npx tsx scripts/shadow-compare.ts <parent_agent> --gate-check --composite
```

5 kriter + faz-spesifik:
- ✅ Session status = 'completed' / 'completed_with_warning' / 'completed_degraded'
- ✅ Final quality score ≥ 0.75
- ✅ Fact count ≥ block minimum (S: 80, P: 100)
- ✅ Contradiction FP rate ≤ 15% (P2A aktifse)
- ✅ **Composite quality gate** (Block S fazları için) — legacy parity %98 informational, composite gate blocking
- ✅ Faz-spesifik criterion

## STEP 4 — DEFECT DETECTION + FIX (bulunan hatalar + yapılan düzeltmeler)

```bash
grep -E "ERROR|WARN|FAIL|CRITICAL" output/logs/<session>.log
npx tsx scripts/trace.ts <session_id>

# Part 2'de KRİTİK: authority decision chain coherent mi?
sqlite3 finance-x.db "
  SELECT step_type, decision, reason, affected_entities
  FROM execution_trace
  WHERE session_id = ? AND decision IN ('block','fail','revise')
  ORDER BY step_order
" <session_id>

# Sub-agent seviyesinde defect
sqlite3 finance-x.db "
  SELECT sub_agent_id, status, error_message
  FROM sub_agent_runs WHERE session_id = ? AND status != 'completed'
" <session_id>

# Contradiction engine false positive check
sqlite3 finance-x.db "
  SELECT severity, COUNT(*) FROM contradictions
  WHERE session_id = ? GROUP BY severity
" <session_id>
```

**Part 2'ye özgü Fail Fast:**
- Sub-agent rollout fail ise → parent'ı shadow mode'a geri al (`SUBAGENT_<X>_ENABLED=false`)
- QA hard gate 3 round fail ise → critical vs soft ayrımı yap, soft ise deliver with warning
- Citation block ise → critical-facts-only kontrol (non-critical için annotation yeter)

Her fix sonrası STEP 2 + STEP 3 tekrar çalışır.

## STEP 5 — GO / NO-GO DECISION (geçiş kararı)

```
🟢 GO (sonraki faza geç) — 4 koşul sağlanırsa:
   ✓ STEP 1 Implementation kanıtı
   ✓ STEP 2 → 5+1/6 smoke green (sub-agent registry consistent dahil)
   ✓ STEP 3 → 5+1 canlı test green + composite gate (S fazları)
   ✓ STEP 4 → 0 open defect

🟡 NO-GO (hotfix döngüsü):
   → STEP 4'e geri dön
   → Fix uygula
   → STEP 2+3 tekrar

🔴 ESCALATE (insan müdahalesi):
   → 3 hotfix sonrası hala NO-GO
   → Sub-agent rollout rollback gerekiyor
   → Quality OS katman çelişiyor (authority map review)
```

Çıktı formatı:
```
### Geçiş Kararı (STEP 5)
STEP 1: ✅ 4 dosya yeni, 1 migration, 3 sub-agent tanımlandı
STEP 2: ✅ 6/6 green
STEP 3: ✅ 5+1 green (KCHOL quality 0.87, composite gate passed)
STEP 4: ✅ 3 defect, 3 düzeltildi, 0 açık

🟢 GO — Faz S4 tamamlandı. S5'e geçiliyor.
Commit: feat(subagent): financial_analysis 5 sub-agents [finance-x-subagent S4]
```

**Part 2'ye özgü ek kural:** Sub-agent rollout fazlarında (S2-S11) her sub-agent için **shadow mode karşılaştırma raporu** zorunlu. Composite quality gate aktif — legacy parity informational, blocking değil.

---

# BLOCK S — SUBAGENT

**Amaç:** Bounded worker graph mimarisi. 10 parent agent'a sub-agent yetkisi — toplam 24 sub-agent.

**Önkoşul:** Block R + Block U tamamlanmış olmalı. Python engine açık olmadan FA sub-agent'ları LLM ile matematik yapar (fayda minimum). Document intel olmadan ps_notes_parser evidence'tan beslenemez.

**Benchmark tickers:** Her faz shadow mode'da çalıştıktan sonra **KCHOL** ile session çalıştır — sector_competition holding için dinamik segment spawn ediyor mu, fa_sector_kpi holding KPI'larını seçiyor mu doğrula.

## Sub-Agent Tasarım İlkeleri (Tüm Block S için)

1. **Bounded Worker Graph:** Her parent için sub-agent listesi `config/pipeline.yml`'de önceden tanımlı. Runtime'da değişmez.
2. **2 Katmandan Derine Yok:** Sub-agent başka sub-agent çağıramaz. Recursive yasak.
3. **Parent Final Owner:** Dışarıya (QA, CEO, downstream) sadece parent görünür. Sub-agent internal.
4. **Sub-Agent Ephemeral:** Sub-agent'ın `memory.md`, `lessons.jsonl`, `knowledge.md` YOK. Sadece `system_prompt.md` + `output_schema.json`. Öğrenme parent'ın lessons.jsonl'ına gider.
5. **Child Output Schema Zorunlu:** Her sub-agent kendi `output_schema.json`'ı ile validate edilir.
6. **Deterministic > LLM:** Aritmetik/validation/completeness → Python kod. Interpretation/narrative → LLM sub-agent.
7. **Retry Child Seviyesinde:** Sub-agent fail → sadece o sub-agent retry, parent rerun YOK.
8. **Canonical Fact Pack:** Tüm sub-agent'lar aynı authoritative rakamdan beslenir.
9. **Paralel Execution Default:** Explicit dependency yoksa `Promise.allSettled` ile paralel.
10. **Max 5 Sub-Agent Per Parent:** Daha fazlası karmaşıklık patlaması.

## Block S Special Rule — Shadow Mode Numeric Gate (ZORUNLU)

Shadow mode'dan production'a geçiş **keyfi karar değildir**. Her sub-agent için aşağıdaki 5 sayısal kriter karşılanmadan `SUBAGENT_<X>_ENABLED=true` yapılamaz:

```
✅ Numeric parity ≥ %98
   (aynı fact için legacy ve sub-agent değerleri %2'den az farklı)
✅ QA pass rate ≥ legacy baseline
✅ Missing metric count azalması ≥ %30
✅ Median latency artışı ≤ %20
✅ Cost delta ≤ %50
```

`scripts/shadow-compare.ts` çıktısında otomatik hesaplanıp **GATE_PASSED / GATE_FAILED** olarak raporlanmalı.

## FAZ S1 — Sub-Agent Infrastructure

**Amaç:** Sub-agent dispatcher, registry ve type sistem kurulumu. Hiçbir sub-agent henüz çalışmıyor, sadece altyapı.

### Görevler

**1. `backend/src/sub-agents/types.ts` oluştur:**

```ts
/**
 * Sub-agent type definitions.
 * Bounded worker graph pattern — parent owns sub-agents, no recursion allowed.
 */

export type SubAgentTier = 'llm' | 'deterministic' | 'hybrid';

export type SubAgentDef = {
  id: string;
  parent_agent_id: string;
  display_name: string;
  description: string;
  tier: SubAgentTier;                    // llm | deterministic | hybrid
  model?: 'sonnet' | 'haiku';            // Sadece tier=llm/hybrid için
  python_module?: string;                 // tier=deterministic için Python entry point
  timeout_ms: number;
  isolated_context: boolean;              // false: parent context'in tamamı; true: minimal context
  output_schema_path: string;             // schemas/sub-agents/<id>.json
  parallelizable: boolean;                // true: diğer sub-agent'larla paralel; false: sequential
  retry_max: number;
};

export type SubAgentTask = {
  sub_agent_id: string;
  parent_session_id: string;
  parent_run_id: string;
  parent_agent_id: string;
  task_description: string;
  task_inputs: Record<string, unknown>;
};

export type SubAgentResult = {
  sub_agent_id: string;
  status: 'completed' | 'failed' | 'timeout' | 'schema_invalid';
  output: string;
  output_parsed: unknown;
  duration_ms: number;
  tokens_used: number;
  cost_usd: number;
  error?: string;
  schema_validation_errors?: string[];
};

export type SubAgentExecutionPlan = {
  parent_agent_id: string;
  sub_agents: SubAgentDef[];
  execution_strategy: 'parallel' | 'sequential' | 'hybrid';
  fallback_to_legacy: boolean;            // Sub-agent fail ederse eski agent çalıştır
};
```

**2. `backend/src/sub-agents/registry.ts` oluştur:**

```ts
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PROJECT_ROOT } from '../config.js';
import type { SubAgentDef } from './types.js';

let _cache: SubAgentDef[] | null = null;

export function loadSubAgentRegistry(): SubAgentDef[] {
  if (_cache) return _cache;
  const yamlPath = path.join(PROJECT_ROOT, 'config', 'sub_agents.yml');
  if (!fs.existsSync(yamlPath)) {
    console.warn('[sub-agents] sub_agents.yml not found');
    _cache = [];
    return _cache;
  }
  const content = fs.readFileSync(yamlPath, 'utf8');
  const parsed = yaml.parse(content);
  _cache = parsed.sub_agents || [];
  return _cache!;
}

export function getSubAgentsForParent(parentAgentId: string): SubAgentDef[] {
  return loadSubAgentRegistry().filter(s => s.parent_agent_id === parentAgentId);
}

export function getSubAgentDef(subAgentId: string): SubAgentDef | null {
  return loadSubAgentRegistry().find(s => s.id === subAgentId) || null;
}

export function loadSubAgentSystemPrompt(subAgentId: string): string {
  const def = getSubAgentDef(subAgentId);
  if (!def) throw new Error(`Sub-agent not found: ${subAgentId}`);
  const promptPath = path.join(
    PROJECT_ROOT, 'agents', def.parent_agent_id, 'sub_agents', `${subAgentId}.md`,
  );
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Sub-agent prompt missing: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf8');
}
```

**3. `backend/src/sub-agents/dispatcher.ts` oluştur:**

```ts
import { spawn } from 'node:child_process';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { createDefaultProviderRouter } from '../llm/default-router.js';
import { validateAgentOutput } from '../schema-validator.js';
import { PROJECT_ROOT } from '../config.js';
import type { SubAgentDef, SubAgentTask, SubAgentResult } from './types.js';
import { getSubAgentDef, loadSubAgentSystemPrompt } from './registry.js';

const providerRouter = createDefaultProviderRouter();

/**
 * Dispatch sub-agents — paralel veya sequential.
 * Promise.allSettled ile fault-tolerant; bir sub-agent fail olursa
 * diğerleri etkilenmez.
 */
export async function dispatchSubAgents(
  tasks: SubAgentTask[],
  strategy: 'parallel' | 'sequential' | 'hybrid' = 'parallel',
  parentContext: Record<string, unknown> = {},
): Promise<SubAgentResult[]> {
  if (strategy === 'sequential') {
    const results: SubAgentResult[] = [];
    for (const task of tasks) {
      results.push(await runSubAgent(task, parentContext));
    }
    return results;
  }

  // Parallel (default) or hybrid
  const settled = await Promise.allSettled(
    tasks.map(t => runSubAgent(t, parentContext))
  );

  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      sub_agent_id: tasks[i].sub_agent_id,
      status: 'failed',
      output: '',
      output_parsed: null,
      duration_ms: 0,
      tokens_used: 0,
      cost_usd: 0,
      error: r.reason?.message || String(r.reason),
    };
  });
}

async function runSubAgent(
  task: SubAgentTask,
  parentContext: Record<string, unknown>,
): Promise<SubAgentResult> {
  const def = getSubAgentDef(task.sub_agent_id);
  if (!def) {
    return {
      sub_agent_id: task.sub_agent_id,
      status: 'failed',
      output: '',
      output_parsed: null,
      duration_ms: 0,
      tokens_used: 0,
      cost_usd: 0,
      error: `Sub-agent definition not found: ${task.sub_agent_id}`,
    };
  }

  const startTime = Date.now();
  const runId = nanoid();

  // Persist sub-agent run start
  try {
    db.prepare(`
      INSERT INTO sub_agent_runs (id, parent_run_id, sub_agent_id, parent_agent_id, status, started_at)
      VALUES (?, ?, ?, ?, 'running', ?)
    `).run(runId, task.parent_run_id, def.id, def.parent_agent_id, new Date().toISOString());
  } catch {}

  let result: SubAgentResult;

  try {
    // Branch by tier
    if (def.tier === 'deterministic') {
      result = await runDeterministicSubAgent(def, task, runId);
    } else {
      result = await runLlmSubAgent(def, task, parentContext, runId);
    }

    // Schema validation
    if (result.status === 'completed' && def.output_schema_path) {
      const schemaPath = path.join(PROJECT_ROOT, def.output_schema_path);
      const validation = validateAgentOutput(def.id, result.output_parsed, schemaPath);
      if (!validation.valid) {
        result.status = 'schema_invalid';
        result.schema_validation_errors = validation.errors;
      }
    }

    result.duration_ms = Date.now() - startTime;
  } catch (err: any) {
    result = {
      sub_agent_id: def.id,
      status: 'failed',
      output: '',
      output_parsed: null,
      duration_ms: Date.now() - startTime,
      tokens_used: 0,
      cost_usd: 0,
      error: err.message,
    };
  }

  // Persist sub-agent run end
  try {
    db.prepare(`
      UPDATE sub_agent_runs
      SET status = ?, output_text = ?, error_message = ?, duration_ms = ?,
          tokens_used = ?, cost_usd = ?, completed_at = ?
      WHERE id = ?
    `).run(
      result.status,
      result.output.slice(0, 50000),
      result.error || null,
      result.duration_ms,
      result.tokens_used,
      result.cost_usd,
      new Date().toISOString(),
      runId,
    );
  } catch {}

  return result;
}

async function runLlmSubAgent(
  def: SubAgentDef,
  task: SubAgentTask,
  parentContext: Record<string, unknown>,
  runId: string,
): Promise<SubAgentResult> {
  const systemPrompt = loadSubAgentSystemPrompt(def.id);

  // Context filtering: izole mi, paylaşımlı mı?
  const context = def.isolated_context
    ? { ticker: parentContext.ticker, fact_pack: parentContext.fact_pack }
    : parentContext;

  const fullPrompt = [
    `# Sub-Agent: ${def.display_name} (${def.id})`,
    `## Parent: ${def.parent_agent_id}`,
    ``,
    `## System Instructions`,
    systemPrompt,
    ``,
    `## Task`,
    task.task_description,
    ``,
    `## Inputs`,
    JSON.stringify(task.task_inputs, null, 2),
    ``,
    `## Parent Context (read-only)`,
    JSON.stringify(context, (k, v) => typeof v === 'string' && v.length > 5000 ? v.slice(0, 5000) + '...' : v, 2).slice(0, 20000),
    ``,
    `## Output`,
    `Respond with JSON matching your output_schema.json. NO markdown code blocks unless schema requires.`,
  ].join('\n');

  const result = await providerRouter.run({
    prompt: fullPrompt,
    model: def.model === 'haiku' ? 'claude-haiku-4-5' : 'claude-sonnet-4-6',
    timeoutMs: def.timeout_ms,
  });

  if (!result.success) {
    return {
      sub_agent_id: def.id,
      status: 'failed',
      output: '',
      output_parsed: null,
      duration_ms: 0,
      tokens_used: result.tokensUsed || 0,
      cost_usd: result.costUsd || 0,
      error: result.error,
    };
  }

  // Parse JSON output
  let parsed: unknown = null;
  try {
    const jsonMatch = result.output.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1] : result.output;
    parsed = JSON.parse(jsonText.trim());
  } catch (err: any) {
    return {
      sub_agent_id: def.id,
      status: 'failed',
      output: result.output,
      output_parsed: null,
      duration_ms: 0,
      tokens_used: result.tokensUsed || 0,
      cost_usd: result.costUsd || 0,
      error: `JSON parse failed: ${err.message}`,
    };
  }

  return {
    sub_agent_id: def.id,
    status: 'completed',
    output: result.output,
    output_parsed: parsed,
    duration_ms: 0,
    tokens_used: result.tokensUsed || 0,
    cost_usd: result.costUsd || 0,
  };
}

async function runDeterministicSubAgent(
  def: SubAgentDef,
  task: SubAgentTask,
  runId: string,
): Promise<SubAgentResult> {
  if (!def.python_module) {
    throw new Error(`Deterministic sub-agent ${def.id} has no python_module`);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('uv', [
      'run', 'python', '-m', def.python_module!,
      JSON.stringify(task.task_inputs),
    ], {
      cwd: path.join(PROJECT_ROOT, 'python-services'),
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Deterministic sub-agent timeout: ${def.id}`));
    }, def.timeout_ms);

    proc.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) {
        return resolve({
          sub_agent_id: def.id,
          status: 'failed',
          output: stdout,
          output_parsed: null,
          duration_ms: 0,
          tokens_used: 0,
          cost_usd: 0,
          error: stderr,
        });
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          sub_agent_id: def.id,
          status: 'completed',
          output: stdout,
          output_parsed: parsed,
          duration_ms: 0,
          tokens_used: 0,
          cost_usd: 0,
        });
      } catch (err: any) {
        resolve({
          sub_agent_id: def.id,
          status: 'failed',
          output: stdout,
          output_parsed: null,
          duration_ms: 0,
          tokens_used: 0,
          cost_usd: 0,
          error: `JSON parse failed: ${err.message}`,
        });
      }
    });
  });
}
```

**4. `backend/src/sub-agents/parent-orchestrator.ts` oluştur:**

```ts
import type { SubAgentTask, SubAgentResult, SubAgentExecutionPlan } from './types.js';
import { getSubAgentsForParent } from './registry.js';
import { dispatchSubAgents } from './dispatcher.js';
import { db } from '../db.js';

/**
 * Parent agent için sub-agent execution flow.
 * 1. Plan: hangi sub-agent'lar çalışacak
 * 2. Dispatch: paralel/sequential
 * 3. Compile: parent synthesis (her parent kendi compile logic'ini kullanır)
 */
export async function executeWithSubAgents(
  parentAgentId: string,
  parentRunId: string,
  parentSessionId: string,
  taskInputs: Record<string, unknown>,
  parentContext: Record<string, unknown>,
  compileFunction: (subResults: SubAgentResult[], parentCtx: Record<string, unknown>) => Promise<string>,
): Promise<{
  output: string;
  sub_agent_results: SubAgentResult[];
  failed_sub_agents: string[];
}> {
  const subAgents = getSubAgentsForParent(parentAgentId);
  if (subAgents.length === 0) {
    throw new Error(`No sub-agents defined for parent: ${parentAgentId}`);
  }

  // Build tasks — her sub-agent için aynı task inputs
  const tasks: SubAgentTask[] = subAgents.map(sa => ({
    sub_agent_id: sa.id,
    parent_session_id: parentSessionId,
    parent_run_id: parentRunId,
    parent_agent_id: parentAgentId,
    task_description: `Sub-agent task for ${parentAgentId}`,
    task_inputs: taskInputs,
  }));

  // Strategy detection
  const allParallel = subAgents.every(sa => sa.parallelizable);
  const strategy: 'parallel' | 'sequential' | 'hybrid' = allParallel ? 'parallel' : 'sequential';

  console.log(`[sub-agent] ${parentAgentId} dispatching ${tasks.length} sub-agents (${strategy})`);

  const results = await dispatchSubAgents(tasks, strategy, parentContext);

  const failed = results.filter(r => r.status !== 'completed').map(r => r.sub_agent_id);
  if (failed.length > 0) {
    console.warn(`[sub-agent] ${parentAgentId} — failed sub-agents: ${failed.join(', ')}`);
  }

  // Parent compile — her parent kendi synthesis logic'ini sağlar
  const compiledOutput = await compileFunction(results, parentContext);

  return {
    output: compiledOutput,
    sub_agent_results: results,
    failed_sub_agents: failed,
  };
}
```

**5. `backend/src/db.ts`'e tablo ekle:**

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS sub_agent_runs (
    id TEXT PRIMARY KEY,
    parent_run_id TEXT NOT NULL,
    sub_agent_id TEXT NOT NULL,
    parent_agent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    output_text TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd REAL,
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (parent_run_id) REFERENCES agent_runs(id)
  );
  CREATE INDEX IF NOT EXISTS idx_subagent_parent ON sub_agent_runs(parent_run_id);
  CREATE INDEX IF NOT EXISTS idx_subagent_status ON sub_agent_runs(status);
`);
```

**6. `config/sub_agents.yml` iskeleti oluştur** (boş, fazlarla doldurulacak):

```yaml
version: 1.0.0
last_updated: "2026-04-22"

sub_agents:
  # Faz 1B: data_collection sub-agents (4)
  # Faz 1C: parse_standardization sub-agents (3)
  # Faz 1D: financial_analysis sub-agents (5)
  # Faz 1E: report_formatter sub-agents (4 deterministic)
  # Faz 2A: macro_analysis (3)
  # Faz 2B: valuation_agent (4)
  # Faz 2C: sector_competition (3)
  # Faz 3A: event_impact_mapper (2)
  # Faz 3B: final_summary (3)
  # Faz 3C: strategic_synthesis (3)
```

**7. `config.ts`'e env flag'ler ekle:**

```ts
// Sub-agent feature flags — default OFF for shadow mode
export const SUBAGENT_DATA_COLLECTION_ENABLED = (process.env.SUBAGENT_DATA_COLLECTION_ENABLED ?? 'false') === 'true';
export const SUBAGENT_PARSE_STD_ENABLED = (process.env.SUBAGENT_PARSE_STD_ENABLED ?? 'false') === 'true';
export const SUBAGENT_FINANCIAL_ANALYSIS_ENABLED = (process.env.SUBAGENT_FINANCIAL_ANALYSIS_ENABLED ?? 'false') === 'true';
export const SUBAGENT_REPORT_FORMATTER_ENABLED = (process.env.SUBAGENT_REPORT_FORMATTER_ENABLED ?? 'false') === 'true';
export const SUBAGENT_MACRO_ANALYSIS_ENABLED = (process.env.SUBAGENT_MACRO_ANALYSIS_ENABLED ?? 'false') === 'true';
export const SUBAGENT_VALUATION_ENABLED = (process.env.SUBAGENT_VALUATION_ENABLED ?? 'false') === 'true';
export const SUBAGENT_SECTOR_COMPETITION_ENABLED = (process.env.SUBAGENT_SECTOR_COMPETITION_ENABLED ?? 'false') === 'true';
export const SUBAGENT_EVENT_IMPACT_ENABLED = (process.env.SUBAGENT_EVENT_IMPACT_ENABLED ?? 'false') === 'true';
export const SUBAGENT_FINAL_SUMMARY_ENABLED = (process.env.SUBAGENT_FINAL_SUMMARY_ENABLED ?? 'false') === 'true';
export const SUBAGENT_STRATEGIC_SYNTHESIS_ENABLED = (process.env.SUBAGENT_STRATEGIC_SYNTHESIS_ENABLED ?? 'false') === 'true';

// Shadow mode logging
export const SUBAGENT_SHADOW_MODE = (process.env.SUBAGENT_SHADOW_MODE ?? 'false') === 'true';
```

`.env.example`'a ekle:
```
# Sub-Agent Feature Flags (shadow mode default OFF)
SUBAGENT_DATA_COLLECTION_ENABLED=false
SUBAGENT_PARSE_STD_ENABLED=false
SUBAGENT_FINANCIAL_ANALYSIS_ENABLED=false
SUBAGENT_REPORT_FORMATTER_ENABLED=false
SUBAGENT_MACRO_ANALYSIS_ENABLED=false
SUBAGENT_VALUATION_ENABLED=false
SUBAGENT_SECTOR_COMPETITION_ENABLED=false
SUBAGENT_EVENT_IMPACT_ENABLED=false
SUBAGENT_FINAL_SUMMARY_ENABLED=false
SUBAGENT_STRATEGIC_SYNTHESIS_ENABLED=false
SUBAGENT_SHADOW_MODE=false
```

**8. `schemas/sub-agents/` klasörü oluştur** — sonraki fazlarda doldurulacak.

### Doğrulama

```bash
pnpm typecheck                                       # geçmeli
ls config/sub_agents.yml                             # var
ls backend/src/sub-agents/                           # types/registry/dispatcher/parent-orchestrator
sqlite3 backend/finance_x.db "PRAGMA table_info(sub_agent_runs);" | head  # tablo var
```

### Commit
`feat(subagent): infrastructure (types, registry, dispatcher, parent-orchestrator) [finance-x-subagent S]`

---

## FAZ S2 — data_collection Sub-Agents (4)

**Amaç:** data_collection'ı 4 paralel sub-agent'a böl. Beklenen kazanım: 15 dk → 5 dk.

### Görevler

**1. `config/sub_agents.yml`'e 4 entry ekle:**

```yaml
sub_agents:
  - id: dc_financials_collector
    parent_agent_id: data_collection
    display_name: "Financial Statements Collector"
    description: "5 yıllık IS/BS/CF/SE tablolarını KAP ve faaliyet raporundan toplar."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.dc_financials
    timeout_ms: 300000
    isolated_context: false
    output_schema_path: schemas/sub-agents/dc_financials_collector.json
    parallelizable: true
    retry_max: 2

  - id: dc_disclosure_collector
    parent_agent_id: data_collection
    display_name: "KAP Disclosure Collector"
    description: "Son 5 yıl KAP bildirimlerini toplar, material flag'ler."
    tier: hybrid
    model: haiku
    python_module: financex.subagents.dc_disclosures
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/dc_disclosure_collector.json
    parallelizable: true
    retry_max: 2

  - id: dc_market_profile_collector
    parent_agent_id: data_collection
    display_name: "Market Profile Collector"
    description: "OHLCV, market cap, shares outstanding, free float, dividend history."
    tier: deterministic
    python_module: financex.subagents.dc_market_profile
    timeout_ms: 120000
    isolated_context: true
    output_schema_path: schemas/sub-agents/dc_market_profile_collector.json
    parallelizable: true
    retry_max: 3

  - id: dc_reference_docs_collector
    parent_agent_id: data_collection
    display_name: "Reference Documents Collector"
    description: "Annual report, IR presentation, sustainability report, ESG docs."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.dc_reference_docs
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/dc_reference_docs_collector.json
    parallelizable: true
    retry_max: 2
```

**2. `agents/data_collection/sub_agents/` klasörü oluştur ve 4 system_prompt yaz:**

`agents/data_collection/sub_agents/dc_financials_collector.md`:
```markdown
# DC Financials Collector — System Prompt

## Rol
Sen data_collection parent agent'ının altında çalışan bir sub-agent'sın. Görevin: bir BIST şirketinin **son 5 yıllık IS/BS/CF/SE finansal tablolarını** toplamak.

## Kaynaklar (Öncelik sırası)
1. KAP API: `https://www.kap.org.tr/tr/api/disclosure` — financial_statement filter
2. Şirket Yatırımcı İlişkileri sayfası
3. Faaliyet raporu PDF (KAP'tan)

## Output (ZORUNLU JSON)
```json
{
  "ticker": "EREGL",
  "statements": {
    "income_statement": [
      { "fiscal_period": "FY2025", "doc_id": "...", "source_url": "...", "raw_path": "/cache/..." },
      { "fiscal_period": "FY2024", "doc_id": "...", "source_url": "...", "raw_path": "/cache/..." },
      { "fiscal_period": "FY2023", "doc_id": "...", "source_url": "...", "raw_path": "/cache/..." },
      { "fiscal_period": "FY2022", "doc_id": "...", "source_url": "...", "raw_path": "/cache/..." },
      { "fiscal_period": "FY2021", "doc_id": "...", "source_url": "...", "raw_path": "/cache/..." }
    ],
    "balance_sheet": [...],
    "cash_flow": [...],
    "shareholders_equity": [...]
  },
  "missing_periods": ["FY2020"],
  "data_quality_flags": ["FY2021 SE statement only summary table available"]
}
```

## Kurallar
- 5 yıllık seri zorunlu hedef. Eksik dönemleri `missing_periods`'ta listele.
- Her dosya için `raw_path` (yerel cache) + `doc_id` (KAP) + `source_url` üç alan zorunlu.
- IAS 29 uygulanmış konsolide tabloyu birincil al, VUK solo'yu ayrıca işaretle.
- Veri yoksa "veri yok" deme — alternatif kaynak dene, sonra `missing_periods`'ta belgele.
```

`agents/data_collection/sub_agents/dc_disclosure_collector.md`:
```markdown
# DC Disclosure Collector — System Prompt

## Rol
Son 5 yıl KAP disclosures + material event flag.

## Tools
- `bist-kap-fetching` skill (UPGRADE prompt'tan)

## Output (JSON)
```json
{
  "ticker": "THYAO",
  "disclosures": [
    {
      "id": "1543822",
      "date": "2026-04-15",
      "title": "...",
      "type": "material_event | financial_statement | board_decision | other",
      "is_material": true,
      "summary_extract": "Max 200 char özet"
    }
  ],
  "total_count": 119,
  "material_count": 12,
  "rate_limit_hits": 0
}
```

## Kurallar
- `is_material` null bırakılamaz (boolean). KAP'ın `materialEvent` flag'ini kullan veya kontekst tahmin.
- Type enum'a uy.
- 5 yıldan eski disclosure varsa `archive_path` ile işaretle.
```

`agents/data_collection/sub_agents/dc_market_profile_collector.md`:
```markdown
# DC Market Profile Collector — Deterministic Sub-Agent

Bu sub-agent **Python modülü** olarak çalışır. LLM yok.

## Python Module
`financex.subagents.dc_market_profile`

## Input
```json
{ "ticker": "EREGL", "date_range": { "from": "2021-01-01", "to": "2026-04-22" } }
```

## Output
```json
{
  "ticker": "EREGL",
  "ohlcv_5y": [
    { "date": "2026-04-22", "open": 32.10, "high": 32.50, "low": 31.80, "close": 32.04, "volume": 12500000 }
  ],
  "market_cap_try_mn": 112340,
  "shares_outstanding_mn": 3506,
  "free_float_pct": 0.479,
  "dividend_history": [
    { "ex_date": "2026-04-17", "amount_per_share": 0.85, "type": "cash" }
  ],
  "borsa_istanbul_index_membership": ["BIST30", "BIST100"]
}
```

## Data Sources
- TradingView API (yfinance fallback)
- Borsa İstanbul website
- KAP (dividend history)
```

`agents/data_collection/sub_agents/dc_reference_docs_collector.md`:
```markdown
# DC Reference Documents Collector — System Prompt

## Rol
Annual report, IR presentation, sustainability report, ESG docs gibi narrative dökümanları toplar. Bunlar context_extraction, esg_agent ve report_formatter brand identity için zorunludur.

## Output (JSON)
```json
{
  "ticker": "EREGL",
  "documents": [
    {
      "type": "annual_report | ir_presentation | sustainability_report | governance_report",
      "fiscal_year": "2025",
      "language": "tr | en",
      "source_url": "https://...",
      "local_path": "/cache/sources/...",
      "page_count": 234,
      "document_intel_indexed": true
    }
  ],
  "missing_doc_types": ["sustainability_report"]
}
```

## Kurallar
- `document_intel_indexed: true` set et eğer Document Intelligence'a yüklendiyse (bridge çağrısı yap).
- Sustainability report yoksa esg_agent'ın bu yokluğu bilmesi gerekir → `missing_doc_types`.
- Annual report 2 yıl yoksa pre-flight FAIL.
```

**3. Python tarafı: `python-services/src/financex/subagents/` klasörü ve modüller:**

`python-services/src/financex/subagents/__init__.py` (boş)

`python-services/src/financex/subagents/dc_market_profile.py`:
```python
"""Deterministic sub-agent: market profile collection (no LLM)."""
import sys
import json
from pathlib import Path
import yfinance as yf
from datetime import datetime
from financex.crawlers import tradingview, kap


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)

    inputs = json.loads(sys.argv[1])
    ticker = inputs["ticker"]
    bist_ticker = f"{ticker}.IS"

    # OHLCV 5Y
    yf_ticker = yf.Ticker(bist_ticker)
    hist = yf_ticker.history(period="5y")
    ohlcv = [
        {
            "date": idx.strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": int(row["Volume"]),
        }
        for idx, row in hist.iterrows()
    ]

    info = yf_ticker.info
    market_cap = info.get("marketCap", 0) / 1_000_000  # mn TL

    # KAP'tan dividend history
    dividends = kap.get_dividend_history(ticker)  # mevcut crawler

    output = {
        "ticker": ticker,
        "ohlcv_5y": ohlcv,
        "market_cap_try_mn": market_cap,
        "shares_outstanding_mn": info.get("sharesOutstanding", 0) / 1_000_000,
        "free_float_pct": info.get("floatShares", 0) / max(info.get("sharesOutstanding", 1), 1),
        "dividend_history": dividends,
        "borsa_istanbul_index_membership": _get_index_membership(ticker),
    }

    print(json.dumps(output, ensure_ascii=False))


def _get_index_membership(ticker: str) -> list:
    # BIST30/100/Tüm endeksleri için lookup table
    bist30 = {"AKBNK", "GARAN", "ISCTR", "THYAO", "TUPRS", "EREGL", "KCHOL", "ASELS",
              "BIMAS", "TCELL", "SAHOL", "SISE", "FROTO", "TOASO", "MGROS",
              # ... tam liste
              }
    membership = []
    if ticker in bist30:
        membership.append("BIST30")
    return membership


if __name__ == "__main__":
    main()
```

Diğer 3 sub-agent için de Python wrapper'ları yaz (LLM tier ise minimal — sadece input/output JSON serialization).

**4. Output schema'lar — `schemas/sub-agents/`:**

`schemas/sub-agents/dc_financials_collector.json`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["ticker", "statements", "missing_periods", "data_quality_flags"],
  "properties": {
    "ticker": { "type": "string", "pattern": "^[A-Z]{3,6}$" },
    "statements": {
      "type": "object",
      "required": ["income_statement", "balance_sheet", "cash_flow", "shareholders_equity"],
      "properties": {
        "income_statement": { "type": "array", "items": { "$ref": "#/definitions/StatementEntry" } },
        "balance_sheet": { "type": "array", "items": { "$ref": "#/definitions/StatementEntry" } },
        "cash_flow": { "type": "array", "items": { "$ref": "#/definitions/StatementEntry" } },
        "shareholders_equity": { "type": "array", "items": { "$ref": "#/definitions/StatementEntry" } }
      }
    },
    "missing_periods": { "type": "array", "items": { "type": "string" } },
    "data_quality_flags": { "type": "array", "items": { "type": "string" } }
  },
  "definitions": {
    "StatementEntry": {
      "type": "object",
      "required": ["fiscal_period", "doc_id", "source_url"],
      "properties": {
        "fiscal_period": { "type": "string", "pattern": "^(FY|Q[1-4]_)?[0-9]{4}$" },
        "doc_id": { "type": "string" },
        "source_url": { "type": "string", "format": "uri" },
        "raw_path": { "type": "string" }
      }
    }
  }
}
```

Diğer 3 schema'yı benzer detayla yaz.

**5. Parent orchestration — `backend/src/python/agent_runners/data_collection_with_subagents.ts`:**

```ts
import { executeWithSubAgents } from '../../sub-agents/parent-orchestrator.js';
import { SUBAGENT_DATA_COLLECTION_ENABLED, SUBAGENT_SHADOW_MODE } from '../../config.js';
import { runPythonDataCollection } from './data_collection.js';
import type { SubAgentResult } from '../../sub-agents/types.js';

/**
 * Sub-agent enabled data_collection runner.
 * Falls back to legacy if SUBAGENT_DATA_COLLECTION_ENABLED=false.
 */
export async function runDataCollectionWithSubAgents(
  sessionId: string,
  ticker: string,
  parentRunId: string,
  parentContext: Record<string, unknown>,
): Promise<string> {
  if (!SUBAGENT_DATA_COLLECTION_ENABLED && !SUBAGENT_SHADOW_MODE) {
    return runPythonDataCollection({ sessionId, ticker, ...parentContext });
  }

  const startTime = Date.now();

  const result = await executeWithSubAgents(
    'data_collection',
    parentRunId,
    sessionId,
    { ticker, fact_pack: parentContext.fact_pack },
    parentContext,
    compileDataCollectionOutput,
  );

  const duration = Date.now() - startTime;
  console.log(`[data_collection] sub-agent execution: ${duration}ms, ${result.failed_sub_agents.length} failed`);

  if (SUBAGENT_SHADOW_MODE) {
    // Shadow mode: legacy'i de çalıştır, ikisini DB'ye kaydet
    const legacyOutput = await runPythonDataCollection({ sessionId, ticker, ...parentContext });
    persistShadowComparison(sessionId, 'data_collection', legacyOutput, result.output);
    return legacyOutput;  // Production'a legacy gider
  }

  return result.output;
}

async function compileDataCollectionOutput(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const findings: any = { ticker: parentCtx.ticker };

  for (const r of subResults) {
    if (r.status !== 'completed' || !r.output_parsed) {
      findings[`${r.sub_agent_id}_status`] = r.status;
      findings[`${r.sub_agent_id}_error`] = r.error;
      continue;
    }
    findings[r.sub_agent_id] = r.output_parsed;
  }

  // Data quality summary
  const totalDocs = (findings.dc_financials_collector?.statements?.income_statement?.length || 0)
    + (findings.dc_disclosure_collector?.disclosures?.length || 0)
    + (findings.dc_reference_docs_collector?.documents?.length || 0);

  findings.data_collection_summary = {
    total_documents_collected: totalDocs,
    sub_agents_succeeded: subResults.filter(r => r.status === 'completed').length,
    sub_agents_failed: subResults.filter(r => r.status !== 'completed').length,
    composite_data_quality_score: computeDataQualityScore(subResults),
  };

  return JSON.stringify(findings, null, 2);
}

function computeDataQualityScore(results: SubAgentResult[]): number {
  const completedRatio = results.filter(r => r.status === 'completed').length / results.length;
  return Math.round(completedRatio * 100) / 100;
}

function persistShadowComparison(sessionId: string, agentId: string, legacyOutput: string, subAgentOutput: string) {
  // DB'ye karşılaştırma kaydet — analytics için
  console.log(`[shadow] ${agentId}: legacy=${legacyOutput.length}b, subagent=${subAgentOutput.length}b`);
}
```

**6. Orchestrator entegrasyon — `backend/src/orchestrator.ts` içinde `runSingleAgent` veya ilgili dispatch noktasında:**

```ts
import { runDataCollectionWithSubAgents } from './python/agent_runners/data_collection_with_subagents.js';

// dispatch logic'inde
if (agentId === 'data_collection' && (SUBAGENT_DATA_COLLECTION_ENABLED || SUBAGENT_SHADOW_MODE)) {
  return runDataCollectionWithSubAgents(sessionId, ticker, runId, accumulatedContext);
}
```

### Doğrulama

```bash
# Unit test
pnpm tsx scripts/test-subagent-data-collection.ts EREGL
# Beklenen: 4 sub-agent paralel çalışır, ~5dk içinde compile output döner

# Schema validation
ajv validate -s schemas/sub-agents/dc_financials_collector.json -d test/fixtures/dc_financials_sample.json
```

### Commit
`feat(subagent): data_collection 4 sub-agents (financials, disclosures, market, refs) [finance-x-subagent S]`

---

## FAZ S3 — parse_standardization Sub-Agents (3, hybrid)

**Amaç:** Statement extraction Python (deterministic) + Notes/Section parsing LLM. Beklenen kazanım: D&A null sorunlarının %80 azalması.

### Görevler

**1. `config/sub_agents.yml`'e ekle:**

```yaml
  - id: ps_statement_extractor
    parent_agent_id: parse_standardization
    display_name: "Statement Extractor (Deterministic)"
    description: "PyMuPDF + pandas ile IS/BS/CF/SE tablolarını çıkarır. LLM yok."
    tier: deterministic
    python_module: financex.subagents.ps_statement_extractor
    timeout_ms: 180000
    isolated_context: true
    output_schema_path: schemas/sub-agents/ps_statement_extractor.json
    parallelizable: true
    retry_max: 2

  - id: ps_notes_parser
    parent_agent_id: parse_standardization
    display_name: "Notes Parser (LLM)"
    description: "Dipnotları parse eder: D&A, IFRS 16 lease, IAS 29, debt notes, segment notes."
    tier: llm
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ps_notes_parser.json
    parallelizable: true
    retry_max: 2

  - id: ps_report_section_parser
    parent_agent_id: parse_standardization
    display_name: "Report Section Parser (LLM)"
    description: "CEO message, strategy, capex plan, ESG narrative, segment commentary parsing."
    tier: llm
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ps_report_section_parser.json
    parallelizable: true
    retry_max: 2
```

**2. Python `ps_statement_extractor.py`:**

```python
"""Deterministic IS/BS/CF/SE table extraction from PDF."""
import sys
import json
from pathlib import Path
from financex.parsers.financial_statements import extract_statements_from_pdf


def main():
    inputs = json.loads(sys.argv[1])
    ticker = inputs["ticker"]
    pdf_paths = inputs.get("pdf_paths", [])  # data_collection'dan gelir

    all_statements = {
        "income_statement": [],
        "balance_sheet": [],
        "cash_flow": [],
        "shareholders_equity": [],
    }

    parse_errors = []
    for pdf_path in pdf_paths:
        try:
            statements = extract_statements_from_pdf(Path(pdf_path), ticker=ticker)
            for stmt_type, lines in statements.items():
                all_statements[stmt_type].append({
                    "doc_id": Path(pdf_path).stem,
                    "fiscal_period": _detect_fiscal_period(pdf_path),
                    "lines": lines,
                    "extraction_method": "pdf_table_extraction",
                    "confidence": _compute_confidence(lines),
                })
        except Exception as e:
            parse_errors.append({"pdf": pdf_path, "error": str(e)})

    output = {
        "ticker": ticker,
        "statements": all_statements,
        "parse_errors": parse_errors,
        "extracted_count": sum(len(v) for v in all_statements.values()),
    }

    print(json.dumps(output, ensure_ascii=False, default=str))


def _detect_fiscal_period(pdf_path: str) -> str:
    """Filename + content heuristic to detect FY2025 / Q3_2025 etc."""
    name = Path(pdf_path).stem
    # Heuristic patterns
    import re
    m = re.search(r"(\d{4})", name)
    if m:
        year = m.group(1)
        return f"FY{year}"
    return "UNKNOWN"


def _compute_confidence(lines: list) -> float:
    """Simple heuristic: more lines = higher confidence."""
    if len(lines) >= 30:
        return 0.95
    if len(lines) >= 15:
        return 0.80
    return 0.50


if __name__ == "__main__":
    main()
```

**3. LLM sub-agent prompts:**

`agents/parse_standardization/sub_agents/ps_notes_parser.md`:
```markdown
# PS Notes Parser — LLM Sub-Agent

## Rol
PDF dipnotlarından **finansal not detaylarını** çıkarırsın. Birincil hedeflerin:
- **D&A (Amortisman + İtfa giderleri)** — Cash Flow notes
- **IFRS 16 Lease giderleri** — havacılık için EBITDAR hesabı
- **IAS 29 Net Monetary Position** — parasal kazanç/kayıp ayrıştırma
- **Debt notes** — vade dağılımı, faiz oranları
- **Segment notes** — IFRS 8 segment dökümleri (holding için)

## Input
- `pdf_text_chunks`: data_collection'dan veya ps_statement_extractor'dan gelen relevant section text'leri
- `document_intel_evidence`: knowledge_base_agent'tan gelen cited excerpts (varsa)
- `ticker`, `sector`

## Output (ZORUNLU JSON)
```json
{
  "ticker": "THYAO",
  "fiscal_period": "FY2025",
  "notes": {
    "depreciation_amortization": {
      "value_try_mn": 37294,
      "source": "Cash Flow Statement Note 12",
      "confidence": "HIGH"
    },
    "ifrs16_lease_expenses": {
      "value_try_mn": 8200,
      "source": "Note 18 - IFRS 16 disclosures",
      "confidence": "HIGH",
      "rou_asset_amortization_try_mn": 6500,
      "lease_interest_expense_try_mn": 1700
    },
    "ias29_net_monetary_position": {
      "value_try_mn": -45000,
      "monetary_gain_loss_try_mn": 12500,
      "source": "Note 3 - IAS 29 disclosures",
      "confidence": "HIGH"
    },
    "debt_maturity_schedule": [
      { "year": 2026, "amount_try_mn": 15000, "currency": "USD" },
      { "year": 2027, "amount_try_mn": 22000, "currency": "TRY" }
    ],
    "segment_notes": [
      {
        "segment_name": "Yolcu Taşıma",
        "revenue_try_mn": 280000,
        "ebitda_try_mn": 45000
      }
    ]
  },
  "extraction_gaps": ["FY2024 IFRS 16 not bulunamadı"]
}
```

## Kurallar
- D&A null bırakılamaz. Eğer cash flow not'da yoksa → income statement detaylarına bak → yine yoksa "[VERİ YOK, escalate to data_collection]" işaretle.
- Confidence enum: HIGH | MEDIUM | LOW (kaynak doğrulanmış mı?)
- Her değerin yanında source notation zorunlu.
```

`agents/parse_standardization/sub_agents/ps_report_section_parser.md`:
```markdown
# PS Report Section Parser — LLM Sub-Agent

## Rol
Faaliyet raporu / annual report'un **narrative bölümlerini** yapılandırılmış formata dönüştürürsün:
- CEO mektubu (Chairman's letter / management commentary)
- Strategy section
- Capex plan ve guidance
- ESG narrative
- Segment commentary
- Risk faktörleri

## Output (JSON)
```json
{
  "ticker": "THYAO",
  "fiscal_period": "FY2025",
  "sections": {
    "ceo_letter": {
      "key_themes": ["İran-ABD jeopolitiği", "yeni filo planı", "IFRS 16 etkisi"],
      "performance_summary": "FY2025 EBITDAR marjı %23.2 ile rekor seviyede gerçekleşti...",
      "outlook_summary": "2026 yılı için yolcu büyümesi %12 hedefleniyor...",
      "confidence": "HIGH"
    },
    "strategy": {
      "stated_priorities": ["Filo gençleştirme", "Karbon azaltma", "Asya rotalarının genişletilmesi"],
      "investment_areas": [...]
    },
    "capex_guidance": {
      "fy2026_capex_estimate_try_mn": 18000,
      "fy2027_capex_estimate_try_mn": 22000,
      "breakdown": { "fleet": 12000, "maintenance": 4000, "digital": 2000 }
    },
    "esg_narrative": {...},
    "segment_commentary": {...},
    "risk_factors": [...]
  },
  "extraction_gaps": ["Capex breakdown sadece toplam verilmiş, detay yok"]
}
```

## Kurallar
- Narrative summary 2-4 cümle, max 500 karakter.
- Sayısal guidance varsa muhakkak çıkar.
- Boş bölümleri null değil `extraction_gaps`'e ekle.
```

**4. Parent compile — `parse_standardization_with_subagents.ts`:**

```ts
async function compileParseOutput(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  const compiled: any = {
    ticker: parentCtx.ticker,
    parsed_statements: null,
    parsed_notes: null,
    parsed_sections: null,
    composite_quality: {},
  };

  for (const r of subResults) {
    if (r.status !== 'completed') continue;

    if (r.sub_agent_id === 'ps_statement_extractor') {
      compiled.parsed_statements = r.output_parsed;
    } else if (r.sub_agent_id === 'ps_notes_parser') {
      compiled.parsed_notes = r.output_parsed;
    } else if (r.sub_agent_id === 'ps_report_section_parser') {
      compiled.parsed_sections = r.output_parsed;
    }
  }

  // Cross-validation: Notes'taki D&A statement'taki D&A ile uyumlu mu?
  if (compiled.parsed_statements?.statements?.cash_flow && compiled.parsed_notes?.notes?.depreciation_amortization) {
    // ... reconciliation check
    compiled.composite_quality.dap_cross_validated = true;
  }

  return JSON.stringify(compiled, null, 2);
}
```

### Commit
`feat(subagent): parse_standardization 3 sub-agents (extractor + notes + sections) [finance-x-subagent S]`

---

## FAZ S4 — financial_analysis Sub-Agents (5, EN BÜYÜK ETKİ)

**Amaç:** 28 zorunlu metriği 5 paralel sub-agent'a dağıt. Beklenen kazanım: 40 dk → 10-12 dk, metric completeness 28/28.

### Görevler

**1. Registry (5 sub-agent):**

```yaml
  - id: fa_profitability
    parent_agent_id: financial_analysis
    display_name: "Profitability Analyst"
    description: "Revenue, gross margin, EBITDA, EBITDAR, net income, IAS 29 adjusted metrics."
    tier: hybrid
    model: sonnet
    timeout_ms: 480000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fa_profitability.json
    parallelizable: true
    retry_max: 2

  - id: fa_working_capital
    parent_agent_id: financial_analysis
    display_name: "Working Capital Analyst"
    description: "DSO, DIO, DPO, CCC, NWC/Revenue."
    tier: hybrid
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fa_working_capital.json
    parallelizable: true
    retry_max: 2

  - id: fa_leverage_liquidity
    parent_agent_id: financial_analysis
    display_name: "Leverage & Liquidity Analyst"
    description: "Net debt, leverage ratios, current ratio, acid test, interest coverage."
    tier: hybrid
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fa_leverage_liquidity.json
    parallelizable: true
    retry_max: 2

  - id: fa_cash_flow
    parent_agent_id: financial_analysis
    display_name: "Cash Flow Analyst"
    description: "OCF, FCF, CAPEX/EBITDA, cash conversion, 7-bullet CF analysis, red flags."
    tier: hybrid
    model: sonnet
    timeout_ms: 480000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fa_cash_flow.json
    parallelizable: true
    retry_max: 2

  - id: fa_sector_kpi
    parent_agent_id: financial_analysis
    display_name: "Sector-Specific KPI Analyst"
    description: "Sektör spesifik metrikler: aviation EBITDAR/CASK/RASK, banking NIM/CET1, vb."
    tier: llm
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fa_sector_kpi.json
    parallelizable: true
    retry_max: 2
```

**2. Sub-agent prompts (5 dosya):**

`agents/financial_analysis/sub_agents/fa_profitability.md`:
```markdown
# FA Profitability — Sub-Agent

## Rol
Şirketin **karlılık metriklerini** hesapla ve yorumla. Sorumluluğun:
- Net Satışlar (5Y)
- Brüt Kar / Brüt Karlılık (5Y)
- FAVÖK / FAVÖK Marjı (5Y)
- EBITDAR / EBITDAR Marjı (havacılık için zorunlu)
- VOK / Net Dönem Karı / Net Kar Marjı
- IAS 29 adjusted EBITDA & Net Income (Türk şirketleri için zorunlu)
- OPEX / Hasılat
- Parasal Kazanç/Kayıp ayrıştırması

## Input
- `parse_standardization_output` (parent context'ten)
- `reconciliation_output` (deterministik hesaplamalar)
- `fact_pack` (canonical numbers)
- `sector` (havacılık ise EBITDAR zorunlu)

## Skills
Bu sub-agent şu skill'leri kullanmalı:
- `ias29-inflation-accounting`
- `ifrs16-lease-adjustment` (havacılık)
- `financial-ratios-calculation`

## Output (JSON)
```json
{
  "metrics": {
    "revenue_5y": [802669, 750000, ...],
    "gross_margin_5y_pct": [25.4, 24.8, ...],
    "ebitda_5y_try_mn": [20452, 18900, ...],
    "ebitda_margin_5y_pct": [22.6, 21.5, ...],
    "ebitdar_5y_try_mn": [25500, ...],   // Sektör havacılık ise zorunlu
    "ebitdar_margin_5y_pct": [28.2, ...],
    "net_income_5y_try_mn": [12847, ...],
    "ias29_adjusted_ebitda_5y_try_mn": [...],
    "ias29_adjusted_ni_5y_try_mn": [...],
    "monetary_gain_loss_5y_try_mn": [...]
  },
  "interpretation": {
    "trend_narrative": "FY2025 EBITDA marjı %22.6 ile rekor seviyede; bunun %15'i parasal kazanç katkısı, operasyonel iyileşme %85.",
    "anomaly_flags": [],
    "ias29_materiality": "Parasal kazanç/EBITDA oranı %15 — anlamlı katkı, ayrı raporlama zorunlu"
  },
  "data_gaps": ["FY2021 EBITDA tahmini, dipnot çelişkili"]
}
```

## Kurallar
- 5Y serisi hedef. Eksik dönem `data_gaps`.
- EBITDAR sadece havacılık için zorunlu, diğer sektörlerde opsiyonel.
- Her metric için 4-soru yorum (skill'den): Ne kadar? Nasıl değişti? Neden? TRY etkisi?
- Anomali flag'leri: EBITDA marj >%50 veya <0%, parasal kazanç/EBITDA >%30, vb.
```

`agents/financial_analysis/sub_agents/fa_working_capital.md`:
```markdown
# FA Working Capital — Sub-Agent

## Rol
İşletme sermayesi metriklerini hesapla:
- DSO (Days Sales Outstanding)
- DIO (Days Inventory Outstanding)
- DPO (Days Payable Outstanding)
- CCC (Cash Conversion Cycle = DSO + DIO − DPO)
- NWC / Hasılat
- NWC Gün Sayısı

## Skills
- `financial-ratios-calculation`

## Output (JSON)
```json
{
  "metrics": {
    "dso_5y": [17.25, 18.5, ...],
    "dio_5y": [18.66, 22.1, ...],
    "dpo_5y": [35.39, 38.2, ...],
    "ccc_5y": [0.52, 2.4, ...],
    "nwc_revenue_pct_5y": [-2.1, -1.5, ...],
    "nwc_days_5y": [-7.6, -5.5, ...]
  },
  "interpretation": {
    "trend_narrative": "...",
    "ccc_quality": "Negative CCC → tedarikçi finansmanı + hızlı tahsilat (perakende patternine benzer)"
  },
  "data_gaps": []
}
```

## Kurallar
- CF tablosu yoksa BS'den proxy hesapla, `confidence: MEDIUM` flag.
- Sektör-spesifik benchmark'ları skill'den çek.
- CCC negatif ise olağandışı değil, yorumla (perakende/havacılık yaygın).
```

`agents/financial_analysis/sub_agents/fa_leverage_liquidity.md`:
```markdown
# FA Leverage & Liquidity — Sub-Agent

## Sorumluluklar
- Net Borç (Finansal Borç − Nakit − KV Finansal Yatırımlar)
- Net Borç / FAVÖK
- Cari Oran (Cari Varlıklar / Cari Borçlar)
- Asit-Test (Cari Varlıklar − Stok / Cari Borçlar)
- Faiz Karşılama (EBIT/Faiz Gideri veya FAVÖK/Faiz Ödemesi)
- IFRS 16 öncesi Net Borç (operating lease liabilities hariç)

## Skills
- `financial-ratios-calculation`

## Output (JSON)
```json
{
  "metrics": {
    "net_debt_5y_try_mn": [42864, 38500, ...],
    "net_debt_ebitda_5y": [2.1, 2.04, ...],
    "current_ratio_5y": [1.8, 1.9, ...],
    "acid_test_5y": [1.2, 1.3, ...],
    "interest_coverage_5y": [4.5, 5.2, ...],
    "net_debt_ex_ifrs16_5y_try_mn": [35000, ...]
  },
  "interpretation": {
    "leverage_assessment": "Net Borç/FAVÖK 2.1x — investment grade aralığında",
    "liquidity_assessment": "Cari oran 1.8x sağlıklı; acid-test 1.2x havacılığa göre güçlü"
  },
  "data_gaps": []
}
```
```

`agents/financial_analysis/sub_agents/fa_cash_flow.md`:
```markdown
# FA Cash Flow — Sub-Agent

## Sorumluluklar (7 alt bölüm)
A. Nakit Akışı Tablosu Özeti 5Y
B. OCF Detaylı (operations)
C. FCF Detaylı (= OCF − CAPEX)
D. Cash FAVÖK vs Reported (OCF/EBITDA bridge)
E. WC Changes Breakdown (CF tablosundan)
F. Nakit Bazlı Borç Servis (Faiz Ödemesi + Anapara Geri Ödemesi)
G. Cash Flow Red Flags (7 madde checklist)

## Skills
- `financial-ratios-calculation`

## Output (JSON)
```json
{
  "metrics": {
    "ocf_5y_try_mn": [65056, 58000, ...],
    "fcf_5y_try_mn": [49717, 42000, ...],
    "capex_5y_try_mn": [15338, 16000, ...],
    "capex_ebitda_5y_pct": [75.0, 84.7, ...],
    "ocf_ebitda_5y": [3.18, 3.07, ...],
    "fcf_interest_coverage_5y": [11.0, 8.8, ...]
  },
  "cash_ebitda_bridge": {
    "fy2025": {
      "reported_ebitda": 20452,
      "wc_changes": 28000,
      "tax_paid": -3500,
      "interest_paid": -4500,
      "monetary_gain_loss": 12500,
      "ocf_reconciled": 65056,
      "variance": 0
    }
  },
  "red_flags": [
    { "flag": "OCF >> EBITDA çelişkisi", "value": "OCF 3.18x EBITDA — büyük WC etkisi var", "severity": "MEDIUM" }
  ],
  "data_gaps": []
}
```

## Kurallar
- 7 alt bölüm hepsini doldur. Eksik = REJECT.
- Cash EBITDA bridge zorunlu (CEO direktifi).
- Red flags 7 madde checklist (uzun vadeli OCF<NI, sürekli negatif FCF, vb.)
```

`agents/financial_analysis/sub_agents/fa_sector_kpi.md`:
```markdown
# FA Sector-Specific KPI — Sub-Agent

## Rol
Sektöre özel KPI'ları hesapla ve yorumla. Sektör hardcoded mapping (`config/sector_registry.yml`'dan):
- Havacılık: EBITDAR, CASK, RASK, LF, RPK, ASK, Yield
- Banka: NIM, CET1, Cost of Risk, NPL ratio, distributable cash
- Çelik: HRC pricing transmission, hammadde maliyet hassasiyeti, AB Safeguard etkisi
- Holding: Segment ROIC, NAV, holding discount
- Telekom: ARPU trend, churn, SAC/LTV, 5G ARPU premium
- Rafineri: crack spread, EPDK marj tavanı, Brent korelasyonu
- Perakende: SSSG, revenue per store, IFRS 16 normalize EBITDA

## Skills (sektöre göre dinamik)
- `sector-aviation` | `sector-banking` | `sector-steel` | ...

## Input
- `sector` — fact_pack'ten authoritative (registry'den geldi)
- `parsed_statements`, `parsed_notes`, `parsed_sections`

## Output (JSON, sektöre göre değişken)
```json
{
  "sector": "aviation",
  "kpis": {
    "ebitdar_margin_pct": 23.2,
    "cask_us_cents": 8.55,
    "rask_us_cents": 7.21,
    "load_factor_pct": 83.6,
    "rpk_billions": 195.8,
    "ask_billions": 234.1,
    "yield_us_cents": 8.62
  },
  "peer_comparison": {
    "ebitdar_margin": { "thy": 23.2, "lufthansa": 18.1, "iag": 20.4, "wizz": 22.5 },
    "load_factor": { "thy": 83.6, "global_avg": 82.0 }
  },
  "interpretation": {
    "narrative": "EBITDAR marjı %23.2 ile global peer ortalamasının ~5pp üzerinde..."
  },
  "data_gaps": []
}
```

## Kurallar
- Sektör hardcoded — `industrial` fallback YASAK.
- Sektör skill'inden formülleri ve benchmark aralıklarını çek.
- KPI null bırakılamaz; data_gaps'e ekle.
```

**3. Parent compile — financial_analysis_with_subagents.ts:**

```ts
async function compileFinancialAnalysisOutput(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  // Composite metrics array — Chairman'ın istediği format
  const composite: any = {
    ticker: parentCtx.ticker,
    sector: parentCtx.sector,
    metrics: {},
    interpretation_narrative: '',
    composite_quality_score: 0,
    sub_agent_breakdown: {},
  };

  for (const r of subResults) {
    composite.sub_agent_breakdown[r.sub_agent_id] = {
      status: r.status,
      duration_ms: r.duration_ms,
    };

    if (r.status === 'completed' && r.output_parsed) {
      const parsed: any = r.output_parsed;
      // Merge metrics into composite.metrics
      if (parsed.metrics) Object.assign(composite.metrics, parsed.metrics);
      if (parsed.kpis) Object.assign(composite.metrics, parsed.kpis);
    }
  }

  // Quality scoring
  const completed = subResults.filter(r => r.status === 'completed').length;
  composite.composite_quality_score = completed / subResults.length;

  // 28 zorunlu metric completeness check
  const required28 = [
    'revenue_5y', 'gross_margin_5y_pct', 'ebitda_5y_try_mn', 'ebitda_margin_5y_pct',
    'net_income_5y_try_mn', 'ias29_adjusted_ebitda_5y_try_mn',
    'dso_5y', 'dio_5y', 'dpo_5y', 'ccc_5y', 'nwc_revenue_pct_5y',
    'net_debt_5y_try_mn', 'net_debt_ebitda_5y', 'current_ratio_5y', 'acid_test_5y', 'interest_coverage_5y',
    'ocf_5y_try_mn', 'fcf_5y_try_mn', 'capex_5y_try_mn', 'capex_ebitda_5y_pct', 'ocf_ebitda_5y',
    // ... 28'e tamamla
  ];
  const present = required28.filter(m => composite.metrics[m] !== undefined);
  composite.mandatory_metrics_complete = present.length === required28.length;
  composite.mandatory_metrics_present = present.length;
  composite.mandatory_metrics_missing = required28.filter(m => !composite.metrics[m]);

  // LLM compile narrative — kısa synthesis (1 LLM çağrısı)
  composite.interpretation_narrative = await synthesizeNarrativeFromSubagents(subResults, parentCtx);

  return JSON.stringify(composite, null, 2);
}

async function synthesizeNarrativeFromSubagents(
  subResults: SubAgentResult[],
  parentCtx: Record<string, unknown>,
): Promise<string> {
  // Kısa synthesis prompt — sadece narrative birleştirme
  // ... 1 LLM çağrısı, max 5000 token
}
```

### Commit
`feat(subagent): financial_analysis 5 sub-agents (profitability/wc/leverage/cf/sector_kpi) [finance-x-subagent S]`

---

## FAZ S5 — report_formatter Deterministic Workers (4)

**Amaç:** report_formatter exit 143 ve HTML envelope hatalarını **kod ile çöz**, LLM ile değil. 4 deterministic Python worker.

### Görevler

**1. Registry (4, hepsi `tier: deterministic`):**

```yaml
  - id: rf_layout_planner
    parent_agent_id: report_formatter
    display_name: "Report Layout Planner"
    description: "12 bölüm + cover + TOC layout planı, Goldman yapısı."
    tier: deterministic
    python_module: financex.subagents.rf_layout_planner
    timeout_ms: 30000
    isolated_context: true
    output_schema_path: schemas/sub-agents/rf_layout_planner.json
    parallelizable: false   # Sequential — diğerleri buna bağlı
    retry_max: 1

  - id: rf_section_renderer
    parent_agent_id: report_formatter
    display_name: "Section HTML Renderer"
    description: "Jinja template ile her bölümün HTML'ini render eder."
    tier: deterministic
    python_module: financex.subagents.rf_section_renderer
    timeout_ms: 60000
    isolated_context: false
    output_schema_path: schemas/sub-agents/rf_section_renderer.json
    parallelizable: true
    retry_max: 1

  - id: rf_svg_chart_renderer
    parent_agent_id: report_formatter
    display_name: "SVG Chart Renderer"
    description: "Deterministik SVG chart üretimi (Chart.js yasak)."
    tier: deterministic
    python_module: financex.subagents.rf_svg_chart_renderer
    timeout_ms: 30000
    isolated_context: true
    output_schema_path: schemas/sub-agents/rf_svg_chart_renderer.json
    parallelizable: true
    retry_max: 1

  - id: rf_html_validator
    parent_agent_id: report_formatter
    display_name: "HTML Validator & Polisher"
    description: "Final HTML kontrolü: 12 bölüm var mı, SPK disclaimer, min 50KB, valid HTML."
    tier: deterministic
    python_module: financex.subagents.rf_html_validator
    timeout_ms: 15000
    isolated_context: false
    output_schema_path: schemas/sub-agents/rf_html_validator.json
    parallelizable: false   # Final step
    retry_max: 1
```

**2. Python `rf_html_validator.py` — örnek:**

```python
"""Final HTML validation — 12 sections, SPK disclaimer, min size, valid markup."""
import sys
import json
import re
from bs4 import BeautifulSoup

REQUIRED_SECTIONS = [
    "Yönetici Özeti", "Şirket Tanıtımı", "Finansal Performans",
    "Sektör ve Rekabet", "Makro Görünüm", "Olay Analizi",
    "Skor Kartı", "Hedef Fiyat", "Riskler", "Ekler",
    "Bildirimler", "SPK Disclaimer",
]
MIN_HTML_SIZE = 50_000


def main():
    inputs = json.loads(sys.argv[1])
    html = inputs.get("html", "")

    issues = []

    # Size check
    if len(html) < MIN_HTML_SIZE:
        issues.append({
            "severity": "P0",
            "issue": f"HTML size {len(html)}b < required {MIN_HTML_SIZE}b",
        })

    # Parse
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as e:
        print(json.dumps({"valid": False, "issues": [{"severity": "P0", "issue": f"Parse error: {e}"}]}))
        return

    # Required sections check
    text_lower = soup.get_text().lower()
    missing = [s for s in REQUIRED_SECTIONS if s.lower() not in text_lower]
    if missing:
        issues.append({
            "severity": "P0",
            "issue": f"Missing sections: {', '.join(missing)}",
        })

    # SPK disclaimer check
    if "spk" not in text_lower or "uyarı" not in text_lower:
        issues.append({
            "severity": "P0",
            "issue": "SPK disclaimer missing",
        })

    # Page divs check
    pages = soup.find_all("div", class_="page")
    if len(pages) < 14:  # cover + TOC + 12 sections
        issues.append({
            "severity": "P1",
            "issue": f"Only {len(pages)} page divs (expected 14)",
        })

    # SVG chart count
    svgs = soup.find_all("svg")
    if len(svgs) < 4:
        issues.append({
            "severity": "P1",
            "issue": f"Only {len(svgs)} SVG charts (expected min 4)",
        })

    output = {
        "valid": len([i for i in issues if i["severity"] == "P0"]) == 0,
        "issues": issues,
        "html_size_bytes": len(html),
        "section_count": len(pages),
        "svg_count": len(svgs),
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
```

Diğer 3 deterministic worker'ı da yaz (`rf_layout_planner`, `rf_section_renderer`, `rf_svg_chart_renderer`).

### Commit
`feat(subagent): report_formatter 4 deterministic workers (layout/section/svg/validator) [finance-x-subagent S]`

---

## FAZ S6 — macro_analysis Sub-Agents (3)

```yaml
  - id: ma_turkey_macro_snapshot
    parent_agent_id: macro_analysis
    display_name: "Turkey Macro Snapshot"
    description: "TCMB, TÜFE, FX, GDP, BIST100, faiz koridoru."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.ma_turkey_macro
    timeout_ms: 240000
    isolated_context: true
    output_schema_path: schemas/sub-agents/ma_turkey_macro.json
    parallelizable: true
    retry_max: 2

  - id: ma_geopolitical_risk
    parent_agent_id: macro_analysis
    display_name: "Geopolitical Risk Analyst"
    description: "İran-ABD, Rusya-Ukrayna, Suriye, ticaret savaşları, AB ilişkileri."
    tier: llm
    model: sonnet
    timeout_ms: 300000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ma_geopolitical_risk.json
    parallelizable: true
    retry_max: 2

  - id: ma_company_transmission
    parent_agent_id: macro_analysis
    display_name: "Company Transmission Mechanism"
    description: "Macro→şirket geçiş mekanizması (FX exposure, fuel sensitivity, vs.)."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ma_company_transmission.json
    parallelizable: false   # Diğer ikisinin çıktısına bağlı
    retry_max: 2
```

**Önemli:** ma_company_transmission `parallelizable: false` — diğer ikisinin output'unu bekliyor. Hybrid execution strategy.

System prompt'ları yaz, parent compile yaz, schema'ları yaz (Faz 1 pattern'i ile aynı).

### Commit
`feat(subagent): macro_analysis 3 sub-agents (turkey + geopolitical + transmission) [finance-x-subagent S]`

---

## FAZ S7 — valuation_agent Sub-Agents (4)

```yaml
  - id: val_trading_comps
    parent_agent_id: valuation_agent
    display_name: "Trading Comparables"
    description: "P/E, EV/EBITDA, P/B peer multiples + applied ranges."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.val_trading_comps
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/val_trading_comps.json
    parallelizable: true
    retry_max: 2

  - id: val_dcf
    parent_agent_id: valuation_agent
    display_name: "DCF Valuation"
    description: "WACC, FCF projection 5-10Y, terminal value, sensitivity table."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.val_dcf
    timeout_ms: 480000
    isolated_context: false
    output_schema_path: schemas/sub-agents/val_dcf.json
    parallelizable: true
    retry_max: 2

  - id: val_sotp
    parent_agent_id: valuation_agent
    display_name: "Sum-of-the-Parts"
    description: "Holding için segment-based NAV, holding discount."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.val_sotp
    timeout_ms: 480000
    isolated_context: false
    output_schema_path: schemas/sub-agents/val_sotp.json
    parallelizable: true
    retry_max: 2
    conditional_trigger: "sector == 'holding'"   # Sadece holding için

  - id: val_scenario_builder
    parent_agent_id: valuation_agent
    display_name: "Scenario Builder"
    description: "Bear/Base/Bull + sensitivity matrix."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/val_scenario_builder.json
    parallelizable: false   # Diğer 3'ün çıktısını bekler
    retry_max: 2
```

**Conditional trigger:** dispatcher `val_sotp`'u sadece sector=holding ise çalıştırır.

### Commit
`feat(subagent): valuation_agent 4 sub-agents (comps/dcf/sotp/scenario) [finance-x-subagent S]`

---

## FAZ S8 — sector_competition Sub-Agents (3 + dynamic)

```yaml
  - id: sc_peer_mapper
    parent_agent_id: sector_competition
    display_name: "Peer Set Mapper"
    description: "Doğru sektör ve peer seti tespiti (sector_registry kullanır)."
    tier: hybrid
    model: haiku
    python_module: financex.subagents.sc_peer_mapper
    timeout_ms: 60000
    isolated_context: true
    output_schema_path: schemas/sub-agents/sc_peer_mapper.json
    parallelizable: false   # İlk çalışır
    retry_max: 1

  - id: sc_benchmark_builder
    parent_agent_id: sector_competition
    display_name: "Benchmark Quartile Builder"
    description: "Margin/ROE/EV-EBITDA quartile tables."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.sc_benchmark_builder
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/sc_benchmark_builder.json
    parallelizable: true
    retry_max: 2

  - id: sc_structure_analyst
    parent_agent_id: sector_competition
    display_name: "Industry Structure Analyst"
    description: "Porter 5 forces, SWOT, market positioning."
    tier: llm
    model: sonnet
    timeout_ms: 300000
    isolated_context: false
    output_schema_path: schemas/sub-agents/sc_structure_analyst.json
    parallelizable: true
    retry_max: 2
```

**Holding için dinamik segment analizi:** Parent compile sırasında, sector=holding ise her segment için ayrı `sc_benchmark_builder` instance'ı spawn et:

```ts
// sector_competition_with_subagents.ts
async function executeSectorCompetition(parentCtx: Record<string, unknown>) {
  const sector = parentCtx.fact_pack.sector_canonical;

  let tasks: SubAgentTask[] = [
    { sub_agent_id: 'sc_peer_mapper', ... },
  ];

  // Sequential first step
  const peerMapResult = await dispatchSubAgents([tasks[0]], 'sequential', parentCtx);
  const peerSet = peerMapResult[0].output_parsed;

  // Now spawn parallel benchmarks + structure
  if (sector === 'holding') {
    // Dinamik per-segment benchmark
    const segments = parentCtx.fact_pack.segments || [];
    for (const seg of segments) {
      tasks.push({
        sub_agent_id: 'sc_benchmark_builder',
        task_inputs: { segment: seg, peer_set: peerSet },
        ...
      });
    }
  } else {
    tasks.push({
      sub_agent_id: 'sc_benchmark_builder',
      task_inputs: { peer_set: peerSet },
      ...
    });
  }
  tasks.push({ sub_agent_id: 'sc_structure_analyst', ... });

  // Parallel run
  const remaining = await dispatchSubAgents(tasks.slice(1), 'parallel', parentCtx);
  return compileFinalOutput([peerMapResult[0], ...remaining], parentCtx);
}
```

### Commit
`feat(subagent): sector_competition 3 sub-agents + holding dynamic spawn [finance-x-subagent S]`

---

## FAZ S9 — event_impact_mapper Sub-Agents (2)

```yaml
  - id: eim_quant_mapper
    parent_agent_id: event_impact_mapper
    display_name: "Quantitative Impact Mapper"
    description: "Her event için sayısal etki (mn TL, %)."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/eim_quant_mapper.json
    parallelizable: true
    retry_max: 2

  - id: eim_accounting_mapper
    parent_agent_id: event_impact_mapper
    display_name: "Accounting Impact Mapper"
    description: "Her event için IS/BS/CF kalem etkisi."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/eim_accounting_mapper.json
    parallelizable: true
    retry_max: 2
```

### Commit
`feat(subagent): event_impact_mapper 2 sub-agents (quant + accounting) [finance-x-subagent S]`

---

## FAZ S10 — final_summary Sub-Agents (3)

```yaml
  - id: fs_executive_summary_writer
    parent_agent_id: final_summary
    display_name: "Executive Summary Writer"
    description: "Tek sayfa karar destek özeti."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fs_executive_summary.json
    parallelizable: true
    retry_max: 2

  - id: fs_scorecard_builder
    parent_agent_id: final_summary
    display_name: "Score Card Builder"
    description: "6-boyut skor kartı (1-10) + Bear/Base/Bull hedef fiyat."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.fs_scorecard
    timeout_ms: 180000
    isolated_context: false
    output_schema_path: schemas/sub-agents/fs_scorecard.json
    parallelizable: true
    retry_max: 2

  - id: fs_disclosure_guard
    parent_agent_id: final_summary
    display_name: "Disclosure Guard"
    description: "Zorunlu SPK bildirimleri, yasal disclaimer'lar, etik notlar."
    tier: deterministic
    python_module: financex.subagents.fs_disclosure_guard
    timeout_ms: 30000
    isolated_context: true
    output_schema_path: schemas/sub-agents/fs_disclosure_guard.json
    parallelizable: true
    retry_max: 1
```

### Commit
`feat(subagent): final_summary 3 sub-agents (exec_summary + scorecard + disclosure) [finance-x-subagent S]`

---

## FAZ S11 — strategic_synthesis Sub-Agents (3, sequential)

```yaml
  - id: ss_signal_merger
    parent_agent_id: strategic_synthesis
    display_name: "Signal Merger"
    description: "Tüm agent bulgularını canonical signal map'e dönüştürür."
    tier: hybrid
    model: sonnet
    python_module: financex.subagents.ss_signal_merger
    timeout_ms: 180000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ss_signal_merger.json
    parallelizable: false   # İlk çalışır
    retry_max: 1

  - id: ss_contradiction_flag
    parent_agent_id: strategic_synthesis
    display_name: "Contradiction Flagger"
    description: "Cross-agent çelişkileri tespit eder, authoritative resolution önerir."
    tier: llm
    model: sonnet
    timeout_ms: 240000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ss_contradiction_flag.json
    parallelizable: false   # signal_merger sonrası
    retry_max: 2

  - id: ss_thesis_writer
    parent_agent_id: strategic_synthesis
    display_name: "Investment Thesis Writer"
    description: "BUY/SELL/HOLD recommendation + Bull/Base/Bear quantification + SWOT."
    tier: llm
    model: sonnet
    timeout_ms: 360000
    isolated_context: false
    output_schema_path: schemas/sub-agents/ss_thesis_writer.json
    parallelizable: false   # Son adım
    retry_max: 2
```

**execution_strategy: sequential** — paralel değil. signal → contradiction → thesis sırası zorunlu.

### Commit
`feat(subagent): strategic_synthesis 3 sequential sub-agents (signal/contradiction/thesis) [finance-x-subagent S]`

---

## FAZ S12 — E2E Test + Shadow Mode + Production Cutover

**Amaç:** 24 sub-agent'ın tamamı eklendi, şimdi shadow mode ile validate ve production'a aşamalı geçiş.

### Görevler

**1. Shadow comparison aracı — `scripts/shadow-compare.ts`:**

```ts
/**
 * Shadow mode: SUBAGENT_SHADOW_MODE=true iken hem legacy hem sub-agent çalışır.
 * Bu script son 20 session'ın karşılaştırma raporunu çıkarır.
 */
import { db } from '../backend/src/db.js';

interface Comparison {
  session_id: string;
  agent_id: string;
  legacy_duration_ms: number;
  subagent_duration_ms: number;
  legacy_quality_score: number;
  subagent_quality_score: number;
  metric_completeness_legacy: number;
  metric_completeness_subagent: number;
}

const recent = db.prepare(`
  SELECT * FROM shadow_comparisons
  WHERE created_at > datetime('now', '-7 days')
  ORDER BY created_at DESC
  LIMIT 100
`).all();

// Per-agent aggregated stats
const byAgent: Record<string, any> = {};
for (const r of recent as any[]) {
  byAgent[r.agent_id] = byAgent[r.agent_id] || {
    sessions: 0,
    avg_speed_improvement_pct: 0,
    avg_completeness_delta: 0,
    quality_regression_count: 0,
  };
  // ... aggregate
}

console.table(byAgent);

// Recommendation: hangi sub-agent production'a geçmeye hazır?
for (const [agent, stats] of Object.entries(byAgent)) {
  const ready = (stats as any).avg_speed_improvement_pct > 0
              && (stats as any).avg_completeness_delta >= 0
              && (stats as any).quality_regression_count === 0;
  console.log(`${agent}: ${ready ? '✅ READY for production' : '⚠️ Needs more shadow runs'}`);
}
```

**2. Shadow comparison DB tablosu:**

```sql
CREATE TABLE shadow_comparisons (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  legacy_output_size INTEGER,
  subagent_output_size INTEGER,
  legacy_duration_ms INTEGER,
  subagent_duration_ms INTEGER,
  legacy_metrics_complete INTEGER,
  subagent_metrics_complete INTEGER,
  output_diff_summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**3. Test harness — `backend/src/sub-agents/sub-agents.test.ts`:**

```ts
import { describe, it, expect } from 'vitest';
import { loadSubAgentRegistry, getSubAgentsForParent } from './registry';
import { dispatchSubAgents } from './dispatcher';

describe('Sub-Agent Registry', () => {
  it('loads 24 sub-agents from yml', () => {
    const all = loadSubAgentRegistry();
    expect(all.length).toBe(24);
  });

  it('financial_analysis has 5 sub-agents', () => {
    const fa = getSubAgentsForParent('financial_analysis');
    expect(fa.length).toBe(5);
    expect(fa.map(s => s.id)).toContain('fa_profitability');
    expect(fa.map(s => s.id)).toContain('fa_sector_kpi');
  });

  it('report_formatter sub-agents are all deterministic', () => {
    const rf = getSubAgentsForParent('report_formatter');
    for (const sa of rf) {
      expect(sa.tier).toBe('deterministic');
    }
  });
});

describe('Sub-Agent Dispatcher', () => {
  it('handles parallel execution with one failed sub-agent', async () => {
    // Mock setup
    const tasks = [/* mock tasks */];
    const results = await dispatchSubAgents(tasks, 'parallel', {});
    expect(results.length).toBe(tasks.length);
  });

  it('isolated context only passes ticker + fact_pack', async () => {
    // ... assertion
  });
});
```

**4. Aşamalı production cutover plan — 4 DALGA:**

Tek sıralı rollout yerine **4 dalga** ile gruplandırma. Her dalga kendi içinde paralel shadow test'e girer, hepsi gate'i geçerse topluca production'a alınır. Dalgalar arası ay sınırı = gerçek dünya sinyal toplama süresi.

```
Step 1: Tüm sub-agent'lar SUBAGENT_SHADOW_MODE=true (production'a etki yok)
Step 2: Her DALGA için ayrı shadow comparison
Step 3: Dalga gate'i geçtiyse topluca SUBAGENT_<parents>_ENABLED=true
Step 4: Production monitoring → bir sonraki dalgaya geç

=== DALGA 1: En yüksek etki + iki ekstreme ===
- financial_analysis  (EN KRİTİK, 40dk→12dk hedef, 5 LLM sub-agent)
- report_formatter    (EN DÜŞÜK RİSK, 4 deterministic worker, exit 143 fix)

Mantık: financial_analysis sisteminin en büyük bottleneck'i; eğer parity sağlayamazsa
hiçbir sub-agent'ın anlamı yok. report_formatter tamamen deterministic — FA'dan kaynaklı
risk varsa ona odaklanılabilir. İkisi bir arada dalga 1'de olmalı ki FA riski tespit
edilirse rollback hızlı olsun.

Benchmark: THYAO + EREGL (iki farklı sector complexity)
Shadow süresi: min 20 session
Production gate: 5 numeric kriter hepsi PASS olmalı (aşağıda)

=== DALGA 2: Veri Katmanı ===
- data_collection       (4 paralel API, bariz iyileşme)
- parse_standardization (1 deterministic + 2 LLM hybrid)

Mantık: FA sub-agent'ları dalga 1'de stabilleştikten sonra, upstream data kalitesini
iyileştir. Bu sıra kritik — parse sub-agent'ları yanlışsa FA sub-agent'ları yanlış
veriyle çalışır.

Benchmark: KCHOL (multi-segment) + BIMAS (retail IFRS 16)
Shadow süresi: min 15 session

=== DALGA 3: Analiz Katmanı ===
- macro_analysis
- valuation_agent
- sector_competition

Mantık: Veri katmanı stabilken analytics sub-agent'ları açılır. Paralel test edilebilir
çünkü birbirine dependency yok.

Benchmark: TCELL (telekom) + KCHOL (holding, SOTP)
Shadow süresi: min 15 session

=== DALGA 4: Sentez Katmanı (EN SON, EN SEQUENTIAL) ===
- event_impact_mapper
- final_summary
- strategic_synthesis (3 sequential, en riskli)

Mantık: Tüm upstream stabil olduktan sonra synthesis. strategic_synthesis en son çünkü
3 sequential sub-agent'ı var (signal → contradiction → thesis) — herhangi birinde
kırılma sentezi tamamen bozar.

Benchmark: FROTO + ASELS (farklı synthesis kompleksitesi)
Shadow süresi: min 20 session (sequential chain dikkatli monitoring)
```

**Dalga gate kriteri:** Bir dalga içindeki TÜM parent'lar 5 numeric kriteri geçmelidir. Bir parent fail olursa dalga bekler, o parent tek başına debug edilir.

**4.1. Production Gate — NUMERIC CRITERIA (ZORUNLU):**

Shadow mode'dan production'a geçiş **keyfi karar değildir**. Her sub-agent için aşağıdaki 5 sayısal kriter karşılanmadan `SUBAGENT_<X>_ENABLED=true` yapılamaz:

```
✅ Numeric parity ≥ %98
   (aynı fact için legacy ve sub-agent değerleri %2'den az farklı olmalı)

✅ QA pass rate ≥ legacy baseline
   (sub-agent pattern QA skorunu düşürmemeli)

✅ Missing metric count en az %30 azalmalı
   (sub-agent patterni'nin ana vaadi: daha az null)

✅ Median latency artışı ≤ %20
   (paralellik overhead'i toplam süreyi fazla uzatmamalı)

✅ Cost delta ≤ %50 (maliyet artışı makul sınırda)
   (sub-agent ekstra LLM çağrısı getirir; 1.5x'i aşarsa budget patlar)
```

Bu kriterler `scripts/shadow-compare.ts` çıktısında otomatik hesaplanıp **GATE_PASSED / GATE_FAILED** olarak raporlanmalı. Kriterlerden biri bile fail ise shadow devam eder, production'a geçilmez.

`shadow_comparisons` tablosuna şu kolonlar eklenmeli:
```sql
ALTER TABLE shadow_comparisons ADD COLUMN numeric_parity_pct REAL;
ALTER TABLE shadow_comparisons ADD COLUMN qa_score_delta REAL;
ALTER TABLE shadow_comparisons ADD COLUMN missing_metrics_delta_pct REAL;
ALTER TABLE shadow_comparisons ADD COLUMN latency_delta_pct REAL;
ALTER TABLE shadow_comparisons ADD COLUMN cost_delta_pct REAL;
ALTER TABLE shadow_comparisons ADD COLUMN gate_passed INTEGER;
```

`scripts/shadow-compare.ts` çıktısına örnek:
```
=== Shadow Report: financial_analysis (n=12 sessions) ===
Numeric parity:      98.4%  ✅ PASS
QA pass rate delta:  +0.03  ✅ PASS
Missing metric Δ:    -35.2% ✅ PASS (target -30%)
Median latency Δ:    +12.1% ✅ PASS (limit +20%)
Cost delta:          +38.5% ✅ PASS (limit +50%)

GATE: ✅ PASSED — financial_analysis can be enabled in production.
```

**4.2. Mevcut schema-validator uyumluluğu (NOT):**

Mevcut `validateAgentOutput()` fonksiyonu muhtemelen agent metin (string) output'u için yazılmış. Sub-agent'lar JSON parsed output döndürdüğü için **ayrı bir helper gerekebilir**. Kontrol et:

```bash
grep -n "validateAgentOutput" backend/src/schema-validator.ts
```

Eğer mevcut fonksiyon string bekliyorsa, sub-agent dispatcher için:

```ts
// backend/src/sub-agents/schema-validator-helper.ts
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

export function validateJsonAgainstSchema(
  parsedJson: unknown,
  schemaPath: string,
): { valid: boolean; errors: string[] } {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);
  const valid = validate(parsedJson);
  return {
    valid: !!valid,
    errors: validate.errors?.map(e => `${e.instancePath}: ${e.message}`) || [],
  };
}
```

Dispatcher'da `validateAgentOutput` yerine `validateJsonAgainstSchema` kullan.

**5. Dashboard'a Sub-Agent monitoring sayfası — `dashboard/src/pages/SubAgents.tsx`:**

Sub-agent run history, paralellik görselleştirme (Gantt chart), failure rate per sub-agent, shadow comparison sonuçları.

**6. README + AGENTS.md update:**

- Sub-agent mimarisi açıklaması
- 24 sub-agent listesi
- Shadow mode kullanımı
- Aşamalı cutover prosedürü

### Final Commit
`feat(subagent): e2e test harness + shadow comparison + production cutover plan [finance-x-subagent S]`

---

## NİHAİ DOĞRULAMA CHECKLIST

- [ ] `config/sub_agents.yml`'de 24 sub-agent tanımlı
- [ ] `agents/<parent>/sub_agents/` klasörlerinde toplam 24 system_prompt.md
- [ ] `schemas/sub-agents/` altında 24 output_schema.json
- [ ] `python-services/src/financex/subagents/` altında 8+ Python deterministic modül
- [ ] `backend/src/sub-agents/` altında 4 core dosya (types/registry/dispatcher/parent-orchestrator)
- [ ] DB'de `sub_agent_runs` ve `shadow_comparisons` tabloları mevcut
- [ ] `.env.example`'da 11 sub-agent env flag'i (10 agent + shadow mode)
- [ ] `pnpm typecheck` kırık yok
- [ ] `pnpm test:run` geçiyor (sub-agent unit testleri dahil)
- [ ] Shadow mode'da en az 5 session çalıştı
- [ ] Dashboard'da SubAgents.tsx render oluyor
- [ ] README + AGENTS.md güncel

---

## UYARILAR

1. **Shadow mode olmadan production'a geçme.** Her sub-agent için minimum 10 session karşılaştırma yapılmalı.

2. **Cost monitoring kritik.** Sub-agent ekledikçe LLM çağrı sayısı artıyor. `cost_performance_optimizer` agent'ı sub-agent dağılımını da takip etmeli.

3. **DB write contention** — paralel çalışan 5 sub-agent aynı anda `sub_agent_runs`'a yazıyor. SQLite WAL mode aç:
   ```sql
   PRAGMA journal_mode=WAL;
   ```

4. **Schema validation strict** — sub-agent output schema'sına uymazsa retry. 2 başarısız retry sonrası parent compile boş output ile devam etmeli (failure tolerance).

5. **Conditional triggers** (örn: val_sotp sadece holding için) dispatcher'da explicit kontrol edilmeli.

6. **Sub-agent'ların kendi memory'si YOK** — bu kuralı asla bozma. Eğer bir sub-agent öğrenme önerirse, parent'ın `lessons.jsonl`'ına yazılmalı.

7. **Sequential sub-agent zinciri uyumlu olmalı** — strategic_synthesis sub-agent'ları sequential, ama her birinin output_schema'sı bir sonrakinin input contract'ına uymalı.

8. **report_formatter migration** — bu en kritik. Mevcut LLM-based formatter'dan deterministic worker'lara geçişte cover/TOC/section sıralaması bozulabilir. Golden test sample raporlarla A/B karşılaştır.

---


---

# BLOCK P — POLISH (Kurumsal Research OS)

**Amaç:** Fact layer depth + Quality OS + Execution intelligence + Reliability + Production hardening + UX + Activation governor.

**Önkoşul:** Block R + Block U + Block S tamamlanmış olmalı. Bu blok mevcut katmanların ÜSTÜNE inşa ediyor.

**Benchmark tickers:** 
- P1D sonrası **EREGL** — truth arbitration conflicting EBITDA'larda doğru seçim yapıyor mu
- P2F sonrası **KCHOL** — chairman questions 8 pattern'den en az 3'ünü trigger ediyor mu (holding için margin/segment/IAS29 riskleri)
- P6F sonrası **THYAO** — executive checklist thesis/valuation/risk/catalyst/why_now'u rapor içinde buluyor mu
- P9 sonrası **ULKER** (LIGHT profile) + **KCHOL** (INSTITUTIONAL profile) — activation governor doğru seçim yapıyor mu

**Block P önemli not:** Bu blok son eklenen ciddi katmandır. Bundan sonra yeni büyük feature eklenmeyecek. Sadece mevcut katmanların kontrollü optimizasyonu (Activation Governor, P9) yapılacak.

# FAZ P1 — Fact Layer Depth

**Amaç:** REFACTOR'daki basit fact_pack'i kurumsal-grade hale getir. Her rakam için confidence, lineage, methodology version.

## FAZ P1A — Fact-Level Confidence Scoring

### Görevler

**1. `backend/src/fact-layer/confidence.ts` oluştur:**

```ts
/**
 * Fact-level confidence scoring.
 * Agent confidence ("high/medium/low") yerine claim-level deterministic scoring.
 */

export type FactSource = {
  type: 'direct_disclosure' | 'computed' | 'management_quote' | 'analyst_estimate' | 'peer_proxy' | 'inferred';
  doc_id?: string;
  page?: number;
  extracted_at: string;
  freshness_days: number;
};

export type FactConfidenceInputs = {
  sources: FactSource[];
  has_conflict: boolean;
  conflict_severity?: 'minor' | 'material' | 'critical';
  computation_complexity: 0 | 1 | 2 | 3;  // 0 = verbatim, 3 = multi-step inference
  cross_agent_agreement_count: number;    // Kaç agent aynı değere ulaştı
};

export type FactConfidence = {
  score: number;          // 0-1
  tier: 'CERTAIN' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SPECULATIVE';
  components: {
    source_quality: number;
    source_count_bonus: number;
    freshness_penalty: number;
    conflict_penalty: number;
    complexity_penalty: number;
    agreement_bonus: number;
  };
  explanation: string;
};

const SOURCE_QUALITY: Record<FactSource['type'], number> = {
  direct_disclosure: 1.0,
  computed: 0.9,
  management_quote: 0.85,
  analyst_estimate: 0.6,
  peer_proxy: 0.5,
  inferred: 0.35,
};

export function computeFactConfidence(inputs: FactConfidenceInputs): FactConfidence {
  // Source quality — en iyi source type
  const bestSourceQuality = Math.max(...inputs.sources.map(s => SOURCE_QUALITY[s.type]));

  // Multiple sources bonus
  const sourceCountBonus = Math.min(0.15, (inputs.sources.length - 1) * 0.05);

  // Freshness penalty
  const avgFreshness = inputs.sources.reduce((a, s) => a + s.freshness_days, 0) / inputs.sources.length;
  let freshnessPenalty = 0;
  if (avgFreshness > 90) freshnessPenalty = 0.10;
  else if (avgFreshness > 30) freshnessPenalty = 0.05;

  // Conflict penalty
  let conflictPenalty = 0;
  if (inputs.has_conflict) {
    conflictPenalty = inputs.conflict_severity === 'critical' ? 0.4
      : inputs.conflict_severity === 'material' ? 0.2 : 0.05;
  }

  // Complexity penalty — daha karmaşık hesap = daha az güven
  const complexityPenalty = inputs.computation_complexity * 0.05;

  // Cross-agent agreement bonus
  const agreementBonus = Math.min(0.10, (inputs.cross_agent_agreement_count - 1) * 0.03);

  // Composite
  let score = bestSourceQuality + sourceCountBonus - freshnessPenalty - conflictPenalty - complexityPenalty + agreementBonus;
  score = Math.max(0, Math.min(1, score));

  const tier = score >= 0.9 ? 'CERTAIN'
    : score >= 0.75 ? 'HIGH'
    : score >= 0.55 ? 'MEDIUM'
    : score >= 0.3 ? 'LOW'
    : 'SPECULATIVE';

  return {
    score: Math.round(score * 1000) / 1000,
    tier,
    components: {
      source_quality: bestSourceQuality,
      source_count_bonus: sourceCountBonus,
      freshness_penalty: freshnessPenalty,
      conflict_penalty: conflictPenalty,
      complexity_penalty: complexityPenalty,
      agreement_bonus: agreementBonus,
    },
    explanation: buildExplanation(inputs, score, tier),
  };
}

function buildExplanation(inputs: FactConfidenceInputs, score: number, tier: string): string {
  const parts: string[] = [];
  parts.push(`${tier} (${(score * 100).toFixed(1)}%)`);
  parts.push(`${inputs.sources.length} source${inputs.sources.length > 1 ? 's' : ''}`);
  if (inputs.has_conflict) parts.push(`conflict: ${inputs.conflict_severity}`);
  if (inputs.computation_complexity > 0) parts.push(`complexity: ${inputs.computation_complexity}/3`);
  if (inputs.cross_agent_agreement_count > 1) parts.push(`${inputs.cross_agent_agreement_count} agents agree`);
  return parts.join(' | ');
}
```

**2. Fact schema genişletme — `backend/src/fact-layer/types.ts`:**

```ts
import type { FactConfidence, FactSource } from './confidence.js';

export type CanonicalFact = {
  fact_key: string;              // "net_debt_fy2025"
  value: number | string | boolean;
  unit?: string;                 // "TRY_mn" | "USD_cents" | "%" | null
  period?: string;               // "FY2025" | "Q3_2025"
  sources: FactSource[];
  confidence: FactConfidence;
  computed_by: string;           // agent_id veya sub_agent_id
  formula?: string;              // "financial_debt - (cash + kv_financial_investments)"
  inputs_used?: string[];        // ["financial_debt_fy2025", "cash_fy2025"]
  status: 'active' | 'superseded' | 'disputed';
  superseded_by?: string;
  created_at: string;
  updated_at: string;
  methodology_version: string;   // P1C ile eklenecek
};

export type CanonicalFactPackV2 = {
  session_id: string;
  ticker: string;
  sector_canonical: string;
  facts: Record<string, CanonicalFact>;
  disputed_facts: string[];
  low_confidence_facts: string[];
  fact_count: number;
  avg_confidence: number;
  created_at: string;
  updated_at: string;
  methodology_version: string;
};
```

**3. `backend/src/fact-layer/store.ts` — fact operations:**

```ts
import { db } from '../db.js';
import { computeFactConfidence } from './confidence.js';
import type { CanonicalFact, CanonicalFactPackV2 } from './types.js';

export function upsertFact(
  sessionId: string,
  fact: Omit<CanonicalFact, 'confidence' | 'created_at' | 'updated_at'>,
  confidenceInputs: Parameters<typeof computeFactConfidence>[0],
): CanonicalFact {
  const confidence = computeFactConfidence(confidenceInputs);
  const now = new Date().toISOString();

  const existing = getFact(sessionId, fact.fact_key);
  const enrichedFact: CanonicalFact = {
    ...fact,
    confidence,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  db.prepare(`
    INSERT OR REPLACE INTO canonical_facts
    (session_id, fact_key, fact_json, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, fact.fact_key, JSON.stringify(enrichedFact), now);

  return enrichedFact;
}

export function getFact(sessionId: string, factKey: string): CanonicalFact | null {
  const row = db.prepare(`
    SELECT fact_json FROM canonical_facts WHERE session_id = ? AND fact_key = ?
  `).get(sessionId, factKey) as any;
  return row ? JSON.parse(row.fact_json) : null;
}

export function getFactPack(sessionId: string): CanonicalFactPackV2 | null {
  const rows = db.prepare(`
    SELECT fact_json FROM canonical_facts WHERE session_id = ?
  `).all(sessionId) as any[];

  if (rows.length === 0) return null;

  const facts: Record<string, CanonicalFact> = {};
  for (const r of rows) {
    const f: CanonicalFact = JSON.parse(r.fact_json);
    facts[f.fact_key] = f;
  }

  const confidences = Object.values(facts).map(f => f.confidence.score);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const disputed = Object.values(facts).filter(f => f.status === 'disputed').map(f => f.fact_key);
  const lowConfidence = Object.values(facts).filter(f => f.confidence.score < 0.55).map(f => f.fact_key);

  // Session metadata
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;

  return {
    session_id: sessionId,
    ticker: session?.ticker || 'UNKNOWN',
    sector_canonical: session?.sector || 'UNKNOWN',
    facts,
    disputed_facts: disputed,
    low_confidence_facts: lowConfidence,
    fact_count: Object.keys(facts).length,
    avg_confidence: Math.round(avgConfidence * 1000) / 1000,
    created_at: session?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    methodology_version: 'v1.0.0',
  };
}

export function listLowConfidenceFacts(sessionId: string, threshold = 0.55): CanonicalFact[] {
  const pack = getFactPack(sessionId);
  if (!pack) return [];
  return Object.values(pack.facts).filter(f => f.confidence.score < threshold);
}
```

**4. DB tablosu:**

```sql
CREATE TABLE IF NOT EXISTS canonical_facts (
  session_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  fact_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, fact_key),
  FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
);
CREATE INDEX idx_facts_session ON canonical_facts(session_id);
CREATE INDEX idx_facts_key ON canonical_facts(fact_key);
```

**5. Agent integration — `backend/src/agent-runner.ts`'e fact extraction:**

Agent output parsing sırasında numeric claim'leri fact-pack'e yaz:

```ts
import { upsertFact } from './fact-layer/store.js';

function extractAndPersistFacts(
  agentId: string,
  sessionId: string,
  agentOutput: any,
  context: Record<string, unknown>,
) {
  // Agent output_schema'sına göre numeric field'ları tara
  // Her numeric field için fact oluştur
  // Örnek: financial_analysis → metrics.ebitda_5y_try_mn → 5 ayrı fact
  // ...
}
```

### Commit
`feat(fact-layer): claim-level confidence scoring + v2 fact schema [finance-x-polish P1A]`

---

## FAZ P1B — Data Lineage Tracking

### Görevler

**1. `backend/src/fact-layer/lineage.ts`:**

```ts
/**
 * Data lineage — her rakam için "nereden geldi, nasıl hesaplandı" izi.
 */

export type LineageNode = {
  fact_key: string;
  node_id: string;              // unique
  node_type: 'raw_extracted' | 'computed' | 'aggregated' | 'transformed';
  formula?: string;             // "A - (B + C)"
  input_node_ids: string[];
  computed_by: string;          // agent or sub-agent id
  computed_at: string;
  source_reference?: {
    doc_id: string;
    page?: number;
    line?: number;
    snippet?: string;
  };
};

export type LineageTrail = {
  fact_key: string;
  nodes: LineageNode[];
  root_sources: Array<{ doc_id: string; page?: number }>;
  computation_depth: number;    // max depth from root to leaf
  is_fully_traced: boolean;
};

export function buildLineageTrail(sessionId: string, factKey: string): LineageTrail | null {
  // DB'den tüm ilgili lineage node'ları al
  const rows = db.prepare(`
    WITH RECURSIVE trail(node_id, depth) AS (
      SELECT node_id, 0 FROM lineage_nodes WHERE session_id = ? AND fact_key = ?
      UNION ALL
      SELECT ln.node_id, t.depth + 1
      FROM lineage_nodes ln
      JOIN lineage_edges le ON le.input_node_id = ln.node_id
      JOIN trail t ON t.node_id = le.output_node_id
      WHERE ln.session_id = ?
    )
    SELECT DISTINCT * FROM trail
  `).all(sessionId, factKey, sessionId) as any[];

  if (rows.length === 0) return null;

  // ... construct trail
  return null; // placeholder
}

export function recordLineageNode(
  sessionId: string,
  node: LineageNode,
): void {
  db.prepare(`
    INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, formula,
      computed_by, computed_at, source_doc_id, source_page, source_snippet)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId, node.fact_key, node.node_id, node.node_type,
    node.formula || null, node.computed_by, node.computed_at,
    node.source_reference?.doc_id || null,
    node.source_reference?.page || null,
    node.source_reference?.snippet || null,
  );

  for (const inputId of node.input_node_ids) {
    db.prepare(`
      INSERT OR IGNORE INTO lineage_edges (session_id, input_node_id, output_node_id)
      VALUES (?, ?, ?)
    `).run(sessionId, inputId, node.node_id);
  }
}
```

**2. DB schema:**

```sql
CREATE TABLE lineage_nodes (
  session_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  node_id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  formula TEXT,
  computed_by TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  source_doc_id TEXT,
  source_page INTEGER,
  source_snippet TEXT
);

CREATE TABLE lineage_edges (
  session_id TEXT NOT NULL,
  input_node_id TEXT NOT NULL,
  output_node_id TEXT NOT NULL,
  PRIMARY KEY (session_id, input_node_id, output_node_id)
);

CREATE INDEX idx_lineage_session ON lineage_nodes(session_id);
CREATE INDEX idx_lineage_fact ON lineage_nodes(fact_key);
```

**3. Integration: Python engine + reconciliation agent lineage node yazacak:**

```ts
// backend/src/python/agent_runners/reconciliation.ts
import { recordLineageNode } from '../../fact-layer/lineage.js';
import { nanoid } from 'nanoid';

// Net debt hesaplandığında
recordLineageNode(sessionId, {
  fact_key: 'net_debt_fy2025',
  node_id: nanoid(),
  node_type: 'computed',
  formula: 'financial_debt - (cash + kv_financial_investments)',
  input_node_ids: [financialDebtNodeId, cashNodeId, investmentsNodeId],
  computed_by: 'reconciliation',
  computed_at: new Date().toISOString(),
});
```

**4. API endpoint — `backend/src/server.ts`:**

```ts
app.get('/api/lineage/:sessionId/:factKey', (req, res) => {
  const trail = buildLineageTrail(req.params.sessionId, req.params.factKey);
  if (!trail) return res.status(404).json({ error: 'Lineage not found' });
  res.json(trail);
});
```

### Commit
`feat(fact-layer): data lineage tracking (nodes + edges + API) [finance-x-polish P1B]`

---

## FAZ P1C — Versioned Methodology Registry

### Görevler

**1. `config/methodology.yml`:**

```yaml
version: "1.0.0"
effective_date: "2026-04-22"

methodologies:
  financial_ratios:
    version: "1.0.0"
    formulas:
      net_debt: "financial_debt - (cash + kv_financial_investments)"
      ebitdar: "ebitda + operating_lease_expense"
      ccc: "dso + dio - dpo"
      ias29_adjusted_ebitda: "reported_ebitda - monetary_gain_loss"
    benchmarks:
      aviation:
        ebitdar_margin_pct: { min: 15, median: 21, max: 28 }
        load_factor_pct: { min: 75, median: 82, max: 88 }

  valuation:
    version: "1.0.0"
    wacc:
      risk_free_source: "10Y TR government bond yield"
      equity_risk_premium_try: 0.065
      country_risk_premium_try: 0.025
    dcf:
      projection_years: 10
      terminal_growth_cap: 0.025
      sensitivity_matrix: "3x3 (WACC ±1%, growth ±0.5%)"

  peer_mapping:
    version: "1.0.0"
    aviation:
      global: ["LHA.DE", "IAG.L", "WIZZ.L", "DAL", "UAL"]
      emerging: ["BA.L", "TK.IS"]

  quality_gates:
    version: "1.0.0"
    min_confidence_for_publication: 0.55
    max_disputed_facts_pct: 0.10
    min_evidence_coverage_pct: 0.70
```

**2. `backend/src/fact-layer/methodology.ts`:**

```ts
import fs from 'node:fs';
import yaml from 'yaml';
import path from 'node:path';
import { PROJECT_ROOT } from '../config.js';

let _cache: any = null;

export function loadMethodology(version?: string) {
  if (_cache && !version) return _cache;
  const methodologyPath = path.join(PROJECT_ROOT, 'config', 'methodology.yml');
  const content = fs.readFileSync(methodologyPath, 'utf8');
  _cache = yaml.parse(content);
  return _cache;
}

export function getMethodologyVersion(): string {
  return loadMethodology().version;
}

export function recordSessionMethodology(sessionId: string): void {
  const methodology = loadMethodology();
  db.prepare(`
    INSERT OR REPLACE INTO session_methodology (session_id, methodology_snapshot, recorded_at)
    VALUES (?, ?, ?)
  `).run(sessionId, JSON.stringify(methodology), new Date().toISOString());
}

export function getSessionMethodology(sessionId: string): any {
  const row = db.prepare(`
    SELECT methodology_snapshot FROM session_methodology WHERE session_id = ?
  `).get(sessionId) as any;
  return row ? JSON.parse(row.methodology_snapshot) : null;
}
```

**3. DB:**

```sql
CREATE TABLE session_methodology (
  session_id TEXT PRIMARY KEY,
  methodology_snapshot TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);
```

**4. Session başlangıcında snapshot:**

Orchestrator `executeSession` başında `recordSessionMethodology(sessionId)` çağrısı. Her fact'in `methodology_version` alanına mevcut versiyon yazılır.

**5. Methodology diff aracı — `scripts/methodology-diff.ts`:**

```ts
// Usage: npx tsx scripts/methodology-diff.ts <session_id_1> <session_id_2>
// İki session'ın methodology versiyonunu karşılaştırır, farkları raporlar.
```

### Commit
`feat(fact-layer): versioned methodology registry + session snapshot [finance-x-polish P1C]`

---

## FAZ P1D — Financial Truth Arbitration Layer

**Amaç:** Confidence + lineage + contradiction katmanları tespit ediyor ama **tek canonical truth'u deterministic seçmiyor**. Bu katman her kritik fact için authoritative value'yu kod ile seçer.

### Sorun

Şu an aynı fact_key için 3 farklı agent farklı değer yazabiliyor:
- `financial_analysis` EBITDA=20452
- `reconciliation` EBITDA=21248
- `parse_standardization` EBITDA=20450

Contradiction engine bunu "critical conflict" olarak işaretliyor ama **downstream hangi değeri kullanacak?** Şu an implicit — son yazılan ya da ilk bulunan. Bu kurumsal seviyede kabul edilemez.

### Fact Ownership Lock (ZORUNLU Ön Katman)

Truth Arbitration çalışmadan önce her fact için **primary owner** tanımlı olmalı. Owner sistemi prefix-based:

```yaml
# backend/src/fact-layer/fact-ownership.yaml
ownership_rules:
  # Ham finansal tablo kalemleri — sadece data_collection yazar
  - prefix: "financial_statement_"
    owner: "data_collection"
    exception_owners: []  # no one else can write

  # Türetilmiş ratio/margin — sadece financial_analysis yazar
  - prefix: "normalized_ratio_"
    owner: "financial_analysis"
    exception_owners: ["reconciliation"]  # reconciliation düzeltme yapabilir

  - prefix: "margin_"
    owner: "financial_analysis"
    exception_owners: []

  # Peer metrics — sadece sector_competition
  - prefix: "peer_metric_"
    owner: "sector_competition"
    exception_owners: []

  # Valuation outputs — sadece valuation_agent
  - prefix: "valuation_"
    owner: "valuation_agent"
    exception_owners: ["reconciliation"]  # sanity check override

  # Macro context — sadece macro_analysis
  - prefix: "macro_"
    owner: "macro_analysis"
    exception_owners: []

  # Strategic synthesis — strategic_synthesis tek yazar
  - prefix: "thesis_"
    owner: "strategic_synthesis"
    exception_owners: []
```

**Kurallar:**

1. **Primary owner yazdığında** → fact doğrudan kabul, arbitration atlanır.
2. **Exception owner yazdığında** → fact kabul ama `arbitration_required=true` flag ile (sanity audit).
3. **Ownership dışı agent yazarsa** → arbitration'a gider (reject olabilir veya confidence düşürülür).

```ts
// backend/src/fact-layer/ownership-check.ts
export type OwnershipCheck = {
  fact_key: string;
  writer_agent: string;
  primary_owner: string;
  is_primary: boolean;
  is_exception: boolean;
  action: 'accept' | 'arbitration_required' | 'reject';
};

export function checkOwnership(factKey: string, writerAgent: string): OwnershipCheck {
  const rule = findOwnershipRule(factKey);
  if (!rule) {
    // No rule → arbitration governor decides
    return {
      fact_key: factKey,
      writer_agent: writerAgent,
      primary_owner: 'unowned',
      is_primary: false,
      is_exception: false,
      action: 'arbitration_required',
    };
  }

  const isPrimary = rule.owner === writerAgent;
  const isException = rule.exception_owners.includes(writerAgent);

  return {
    fact_key: factKey,
    writer_agent: writerAgent,
    primary_owner: rule.owner,
    is_primary: isPrimary,
    is_exception: isException,
    action: isPrimary ? 'accept' : isException ? 'arbitration_required' : 'reject',
  };
}
```

Integration: `upsertFact()` içinde, normalize'dan sonra ilk kontrol `checkOwnership()`. Reject durumunda fact kaydedilmez, execution_trace'e `failure_origin='ownership_violation'` ile işaretlenir.

**Neden bu gerekli?** Truth Arbitration her zaman "en iyi" değeri seçemez — bazen basit cevap "bu fact'i yazma yetkin yoktu, git kendi işine bak" olur. Ownership önce, arbitration sonra.

### Görevler

**1. `backend/src/fact-layer/truth-arbitration.ts`:**

```ts
/**
 * Deterministic truth arbitration.
 * Birden fazla candidate arasından tek canonical value'yu kuralla seçer.
 */
import type { CanonicalFact, FactSource } from './types.js';

export type TruthCandidate = {
  fact_key: string;
  value: number | string | boolean;
  confidence_score: number;
  source_type: FactSource['type'];
  freshness_days: number;
  methodology_version: string;
  computed_by: string;
  has_conflict?: boolean;
};

export type TruthDecision = {
  fact_key: string;
  canonical_value: number | string | boolean;
  canonical_source: string;
  arbitration_score: number;
  rejected_candidates: Array<{
    computed_by: string;
    value: any;
    arbitration_score: number;
    rejection_reason: string;
  }>;
  decision_reason: string;
  arbitration_timestamp: string;
};

// Source priority — deterministic, authoritative'den inference'a
const SOURCE_PRIORITY: Record<FactSource['type'], number> = {
  direct_disclosure: 100,
  computed: 90,
  management_quote: 75,
  analyst_estimate: 50,
  peer_proxy: 40,
  inferred: 20,
};

export function arbitrateTruth(candidates: TruthCandidate[]): TruthDecision {
  if (candidates.length === 0) {
    throw new Error('No candidates provided to arbitration');
  }

  if (candidates.length === 1) {
    return {
      fact_key: candidates[0].fact_key,
      canonical_value: candidates[0].value,
      canonical_source: candidates[0].computed_by,
      arbitration_score: computeArbitrationScore(candidates[0]),
      rejected_candidates: [],
      decision_reason: 'Single candidate, no arbitration needed',
      arbitration_timestamp: new Date().toISOString(),
    };
  }

  // Score each candidate
  const scored = candidates.map(c => ({
    ...c,
    arbitration_score: computeArbitrationScore(c),
  }));

  // Sort descending
  scored.sort((a, b) => b.arbitration_score - a.arbitration_score);

  const winner = scored[0];
  const losers = scored.slice(1);

  return {
    fact_key: winner.fact_key,
    canonical_value: winner.value,
    canonical_source: winner.computed_by,
    arbitration_score: winner.arbitration_score,
    rejected_candidates: losers.map(l => ({
      computed_by: l.computed_by,
      value: l.value,
      arbitration_score: l.arbitration_score,
      rejection_reason: explainRejection(winner, l),
    })),
    decision_reason: `Highest arbitration score (${winner.arbitration_score.toFixed(1)}) — source=${winner.source_type}, confidence=${winner.confidence_score}`,
    arbitration_timestamp: new Date().toISOString(),
  };
}

function computeArbitrationScore(c: TruthCandidate): number {
  const sourcePriority = SOURCE_PRIORITY[c.source_type] || 0;
  const confidenceBoost = c.confidence_score * 100;
  const freshnessPenalty = Math.min(20, c.freshness_days / 10);  // max -20
  const conflictPenalty = c.has_conflict ? 10 : 0;

  return sourcePriority + confidenceBoost - freshnessPenalty - conflictPenalty;
}

function explainRejection(winner: TruthCandidate & { arbitration_score: number }, loser: TruthCandidate & { arbitration_score: number }): string {
  const reasons: string[] = [];
  if (SOURCE_PRIORITY[winner.source_type] > SOURCE_PRIORITY[loser.source_type]) {
    reasons.push(`Winner has stronger source (${winner.source_type} vs ${loser.source_type})`);
  }
  if (winner.confidence_score > loser.confidence_score + 0.1) {
    reasons.push(`Winner has higher confidence (${winner.confidence_score} vs ${loser.confidence_score})`);
  }
  if (loser.freshness_days > winner.freshness_days + 30) {
    reasons.push(`Loser data is stale (${loser.freshness_days}d vs ${winner.freshness_days}d)`);
  }
  return reasons.join('; ') || `Score diff: ${(winner.arbitration_score - loser.arbitration_score).toFixed(1)}`;
}
```

**2. Canonical Overwrite Protection — `backend/src/fact-layer/store.ts`'e ekle:**

```ts
/**
 * Var olan yüksek confidence'lı fact'i düşük confidence'lı overwrite edemesin.
 * Arbitration'a gitmeden önce kabul/red kararı.
 */
export function upsertFactWithProtection(
  sessionId: string,
  incoming: Omit<CanonicalFact, 'confidence' | 'created_at' | 'updated_at'>,
  confidenceInputs: Parameters<typeof computeFactConfidence>[0],
): { accepted: boolean; fact?: CanonicalFact; reason?: string } {
  const existing = getFact(sessionId, incoming.fact_key);
  const incomingConfidence = computeFactConfidence(confidenceInputs);

  if (existing && existing.confidence.score > incomingConfidence.score + 0.15) {
    // Existing is materially stronger — reject overwrite
    return {
      accepted: false,
      reason: `Existing confidence ${existing.confidence.score} > incoming ${incomingConfidence.score}. Overwrite rejected.`,
    };
  }

  // Accept — normal upsert
  const fact = upsertFact(sessionId, incoming, confidenceInputs);
  return { accepted: true, fact };
}
```

**3. Arbitration entegrasyonu — strategic_synthesis öncesi:**

```ts
// backend/src/orchestrator.ts, execution_phases içinde P2A'dan hemen sonra
{
  name: 'truth_arbitration',
  handler: async (ctx) => {
    // Tüm conflicting fact_key'leri topla
    const conflicts = await detectContradictions(ctx.sessionId);
    const numericConflicts = conflicts.contradictions.filter(c => c.type === 'direct_numeric_conflict');

    for (const conflict of numericConflicts) {
      const factKey = conflict.involved_facts[0];
      const candidates = buildCandidatesFromConflict(ctx.sessionId, factKey, conflict);
      const decision = arbitrateTruth(candidates);
      persistTruthDecision(ctx.sessionId, decision);

      // Canonical fact'i arbitration sonucuyla güncelle
      upsertFact(ctx.sessionId, {
        fact_key: factKey,
        value: decision.canonical_value,
        computed_by: 'truth_arbitration',
        status: 'active',
        sources: [...],
      }, { /* confidence inputs */ });
    }
  }
}
```

**4. DB:**

```sql
CREATE TABLE truth_decisions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  canonical_value TEXT NOT NULL,
  canonical_source TEXT NOT NULL,
  arbitration_score REAL,
  rejected_candidates TEXT,
  decision_reason TEXT,
  arbitration_timestamp TEXT NOT NULL
);
CREATE INDEX idx_truth_session ON truth_decisions(session_id);
```

**5. Dashboard'da "Arbitration History" paneli — bir fact için hangi candidate'lar yarıştı, kim kazandı.**

### Doğrulama
- `npx tsx scripts/test-arbitration.ts` — örnek 3 candidate → doğru winner seçilmeli
- Shadow mode: mevcut production'daki 10 session'ın conflicting fact'leri üzerinde arbitration çalıştır, insan review ile "doğru seçim yapıldı mı?" kontrol et
- Truth decisions tablosu session sonrası dolmuş olmalı

### Commit
`feat(fact-layer): deterministic truth arbitration + overwrite protection [finance-x-polish P1D]`

---

# FAZ P2 — Quality OS

**Amaç:** Kaliteyi prompt'tan çıkarıp **deterministic sistem katmanına** al.

## FAZ P2A — Contradiction Engine

### Threshold Normalization (ZORUNLU Ön Kural) — 3-Tier

Fake contradiction'ları engellemek için **numeric delta threshold'ları** bağlayıcıdır:

```
< 3% delta       → SOFT       (annotate only, NO arbitration, NO pipeline delay)
3% - 10% delta   → MATERIAL   (arbitration OPTIONAL, pipeline continue)
> 10% delta      → CRITICAL   (arbitration MANDATORY, QA notification)
```

**3-tier yaklaşımın faydası:**
- Soft contradictions pipeline'ı hiç yavaşlatmaz — sadece rapor içinde inline annotation.
- Material contradictions arbitration'a GİRER ama pipeline beklemez (async).
- Critical contradictions tam arbitration + QA alert + halt-if-unresolved.

**Neden 3 tier?** Önceki "soft vs rest" modeli her material delta'yı arbitration yükü yaratıyordu. 3-tier ile arbitration engine yükü ~%60 azalır; sadece gerçekten karar gerektiren (>10%) durumlara odaklanır.

**Exception:** Currency ve share count için threshold daha sıkı — %1 ve %0.1 sırasıyla:

```ts
const CUSTOM_THRESHOLDS: Record<string, { soft: number; material: number; critical: number }> = {
  'exchange_rate_':      { soft: 0.005, material: 0.01,  critical: 0.02 },
  'shares_outstanding_': { soft: 0.001, material: 0.005, critical: 0.01 },
  'eps_':                { soft: 0.01,  material: 0.03,  critical: 0.08 },
  // default: soft=0.03, material=0.10, critical=0.25
};
```

### Tiered Handling Flow

```ts
if (severity === 'soft') {
  // Annotate only — arbitration yok, pipeline delay yok
  addInlineAnnotation(factKey, `minor_variance: ${candidateA} vs ${candidateB} (<3%)`);
  return;
}

if (severity === 'material') {
  // Arbitration optional — async dispatch, pipeline wait ETMEZ
  asyncArbitrate(factKey, candidates);
  addReportAnnotation(factKey, 'material_variance: arbitration in progress');
  return;
}

if (severity === 'critical') {
  // MANDATORY — arbitration + QA notify, pipeline SENKRON bekler
  await arbitrate(factKey, candidates);
  notifyQA(factKey, 'critical_contradiction');
  if (!arbitrationResolved) {
    raiseContradictionAlert(factKey);
  }
  return;
}
```

### Görevler

**1. `backend/src/quality-os/contradiction-engine.ts`:**

```ts
/**
 * Deterministic contradiction detection across agent outputs.
 * LLM'in "dikkat et çelişki olmasın" demesi yerine kod ile tespit.
 *
 * 3-tier severity: soft (annotate), material (async arbitrate), critical (sync+QA)
 */

export type ContradictionSeverityNew = 'soft' | 'material' | 'critical';

export function classifyNumericDelta(factKey: string, valueA: number, valueB: number): ContradictionSeverityNew | 'no_conflict' {
  const delta = Math.abs(valueA - valueB);
  const base = Math.max(Math.abs(valueA), Math.abs(valueB));
  if (base === 0) return 'no_conflict';
  const pct = delta / base;

  const thresholds = getThresholdsForFact(factKey);
  if (pct < thresholds.soft) return 'no_conflict';
  if (pct < thresholds.material) return 'soft';
  if (pct < thresholds.critical) return 'material';
  return 'critical';
}

function getThresholdsForFact(factKey: string): { soft: number; medium: number; hard: number } {
  for (const [prefix, thresholds] of Object.entries(CUSTOM_THRESHOLDS)) {
    if (factKey.startsWith(prefix)) return thresholds;
  }
  return { soft: 0.03, medium: 0.10, hard: 1 };  // default: 3% / 10% / anything
}

export type ContradictionType =
  | 'direct_numeric_conflict'        // EBITDA agent A: 20452, agent B: 21248
  | 'fact_vs_inference_conflict'     // fact: "net borç 42bn", inference: "borçsuz şirket"
  | 'narrative_vs_numeric_conflict'  // narrative: "kar arttı", numeric: net kar düştü
  | 'summary_vs_detail_conflict'     // exec summary: hedef 380, detail: hedef 420
  | 'valuation_vs_thesis_conflict'   // thesis: BUY, valuation: implied SELL
  | 'temporal_inconsistency'         // aynı metric iki rapor arası %10 fark
  | 'unit_mismatch'                  // mn TL vs bn TL
  | 'period_mismatch';               // FY2025 vs Q3_2025 karıştırılmış

export type Contradiction = {
  id: string;
  type: ContradictionType;
  severity: 'critical' | 'material' | 'minor';
  description: string;
  involved_facts: string[];         // fact_keys
  involved_agents: string[];
  values?: Array<{ agent: string; value: any; source?: string }>;
  suggested_resolution?: string;
  detected_at: string;
};

export type ContradictionReport = {
  session_id: string;
  total_contradictions: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  contradictions: Contradiction[];
  overall_consistency_score: number;  // 0-1
};

export async function detectContradictions(sessionId: string): Promise<ContradictionReport> {
  const contradictions: Contradiction[] = [];

  // Check 1: Direct numeric conflicts
  contradictions.push(...await checkDirectNumericConflicts(sessionId));

  // Check 2: Fact vs inference
  contradictions.push(...await checkFactVsInference(sessionId));

  // Check 3: Narrative vs numeric (LLM assist, deterministic trigger)
  contradictions.push(...await checkNarrativeVsNumeric(sessionId));

  // Check 4: Summary vs detail
  contradictions.push(...await checkSummaryVsDetail(sessionId));

  // Check 5: Valuation vs thesis
  contradictions.push(...await checkValuationVsThesis(sessionId));

  // Check 6: Temporal consistency
  contradictions.push(...await checkTemporalConsistency(sessionId));

  // Check 7: Unit/period mismatches
  contradictions.push(...await checkUnitPeriodMismatch(sessionId));

  // Persist
  for (const c of contradictions) {
    persistContradiction(sessionId, c);
  }

  return {
    session_id: sessionId,
    total_contradictions: contradictions.length,
    by_severity: groupBy(contradictions, c => c.severity),
    by_type: groupBy(contradictions, c => c.type),
    contradictions,
    overall_consistency_score: computeConsistencyScore(contradictions),
  };
}

async function checkDirectNumericConflicts(sessionId: string): Promise<Contradiction[]> {
  // DB'den tüm fact'leri al, aynı fact_key için farklı agent'ların yazdığı değerleri karşılaştır
  const rows = db.prepare(`
    SELECT fact_key, fact_json FROM canonical_facts WHERE session_id = ?
  `).all(sessionId) as any[];

  const byKey: Record<string, Array<{ fact: CanonicalFact; agent: string }>> = {};
  for (const row of rows) {
    const fact: CanonicalFact = JSON.parse(row.fact_json);
    byKey[fact.fact_key] = byKey[fact.fact_key] || [];
    byKey[fact.fact_key].push({ fact, agent: fact.computed_by });
  }

  const conflicts: Contradiction[] = [];
  for (const [factKey, entries] of Object.entries(byKey)) {
    if (entries.length < 2) continue;

    // Numeric değerlerde tolerance check
    const numericValues = entries.filter(e => typeof e.fact.value === 'number');
    if (numericValues.length < 2) continue;

    const values = numericValues.map(e => e.fact.value as number);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const relDiff = max === 0 ? 0 : (max - min) / Math.abs(max);

    if (relDiff > 0.01) {  // %1'den fazla fark
      const severity: Contradiction['severity'] = relDiff > 0.10 ? 'critical' : relDiff > 0.03 ? 'material' : 'minor';
      conflicts.push({
        id: `ct-${Date.now()}-${factKey}`,
        type: 'direct_numeric_conflict',
        severity,
        description: `${factKey}: ${numericValues.length} agents reported different values (rel diff ${(relDiff * 100).toFixed(2)}%)`,
        involved_facts: [factKey],
        involved_agents: numericValues.map(e => e.agent),
        values: numericValues.map(e => ({
          agent: e.agent,
          value: e.fact.value,
          source: e.fact.sources[0]?.doc_id,
        })),
        suggested_resolution: 'Use value with highest confidence score as canonical',
        detected_at: new Date().toISOString(),
      });
    }
  }
  return conflicts;
}

async function checkNarrativeVsNumeric(sessionId: string): Promise<Contradiction[]> {
  // Agent output'larındaki narrative bölümlerini parse et
  // "kar arttı", "büyüme yavaşladı" gibi yönlendirici ifadeleri bul
  // Sayısal fact'lerle karşılaştır
  // LLM assist: narrative parsing için Haiku kullan
  return []; // implementation
}

// ... diğer check fonksiyonları

function persistContradiction(sessionId: string, c: Contradiction): void {
  db.prepare(`
    INSERT INTO contradictions (id, session_id, type, severity, description,
      involved_facts, involved_agents, values_json, suggested_resolution, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    c.id, sessionId, c.type, c.severity, c.description,
    JSON.stringify(c.involved_facts), JSON.stringify(c.involved_agents),
    JSON.stringify(c.values || []), c.suggested_resolution, c.detected_at,
  );
}

function computeConsistencyScore(contradictions: Contradiction[]): number {
  if (contradictions.length === 0) return 1.0;
  let penalty = 0;
  for (const c of contradictions) {
    penalty += c.severity === 'critical' ? 0.15 : c.severity === 'material' ? 0.05 : 0.01;
  }
  return Math.max(0, 1 - penalty);
}
```

**2. DB:**

```sql
CREATE TABLE contradictions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  involved_facts TEXT NOT NULL,
  involved_agents TEXT NOT NULL,
  values_json TEXT,
  suggested_resolution TEXT,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_method TEXT
);
CREATE INDEX idx_contradictions_session ON contradictions(session_id);
CREATE INDEX idx_contradictions_severity ON contradictions(severity);
```

**3. Orchestrator integration — strategic_synthesis öncesi contradiction check:**

```ts
// orchestrator.ts, execution_phases içinde
// strategic_synthesis'ten ÖNCE
{
  name: 'contradiction_check',
  handler: async (ctx) => {
    const report = await detectContradictions(ctx.sessionId);

    if (report.contradictions.filter(c => c.severity === 'critical').length > 0) {
      // Critical contradiction → strategic_synthesis'e input olarak ver
      ctx.contradictionReport = report;
    }
  }
}
```

**4. `strategic_synthesis` agent'ına contradiction report inject:**

```ts
// agent-runner.ts
if (agentId === 'strategic_synthesis') {
  const report = getContradictionReport(sessionId);
  prompt += `\n\n## Contradiction Report\n${JSON.stringify(report, null, 2)}`;
  prompt += `\n\nYou MUST address these contradictions explicitly in your synthesis.`;
}
```

### Commit
`feat(quality-os): deterministic contradiction engine (7 check types) [finance-x-polish P2A]`

---

## FAZ P2B — Structured QA (Free Text → JSON Schema)

### Görevler

**1. `schemas/qa_output_v2.schema.json`:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["decision", "overall_score", "blocking_issues", "revision_requests", "coverage_map"],
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["APPROVED", "REJECTED", "REVISION_REQUESTED", "CONDITIONAL_PASS"]
    },
    "overall_score": { "type": "number", "minimum": 0, "maximum": 1 },
    "scores_by_dimension": {
      "type": "object",
      "properties": {
        "numeric_accuracy": { "type": "number" },
        "narrative_quality": { "type": "number" },
        "coverage": { "type": "number" },
        "consistency": { "type": "number" },
        "source_attribution": { "type": "number" }
      }
    },
    "blocking_issues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["agent_id", "severity", "issue"],
        "properties": {
          "agent_id": { "type": "string" },
          "severity": { "enum": ["P0", "P1", "P2"] },
          "issue": { "type": "string" },
          "required_fix": { "type": "string" }
        }
      }
    },
    "revision_requests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target_agent": { "type": "string" },
          "reason": { "type": "string" },
          "specific_changes": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "coverage_map": {
      "type": "object",
      "properties": {
        "mandatory_metrics_covered": { "type": "integer" },
        "mandatory_metrics_total": { "type": "integer" },
        "missing_metrics": { "type": "array", "items": { "type": "string" } },
        "sector_kpis_covered": { "type": "boolean" },
        "disclosure_coverage_pct": { "type": "number" }
      }
    },
    "contradiction_summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "critical": { "type": "integer" }
      }
    }
  }
}
```

**2. `agents/qa_review/system_prompt.md` güncelle:**

Mevcut QA prompt'unu **JSON output** formatına geçir. Serbest metin yorum yerine structured decision.

**3. `backend/src/quality-os/qa-parser.ts`:**

```ts
import { validateAgentOutput } from '../schema-validator.js';

export function parseStructuredQa(qaOutput: string): {
  valid: boolean;
  parsed?: any;
  errors?: string[];
} {
  // LLM output'unu JSON'a parse et
  const jsonMatch = qaOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = jsonMatch ? jsonMatch[1] : qaOutput;

  try {
    const parsed = JSON.parse(jsonText.trim());
    const validation = validateAgentOutput('qa_review_v2', parsed,
      'schemas/qa_output_v2.schema.json');
    if (!validation.valid) return { valid: false, errors: validation.errors };
    return { valid: true, parsed };
  } catch (err: any) {
    return { valid: false, errors: [err.message] };
  }
}
```

**4. Orchestrator'daki QA regex parsing'i structured parser'la değiştir.**

### Commit
`feat(quality-os): structured QA with JSON schema + decision state [finance-x-polish P2B]`

---

## FAZ P2C — Coverage Engine

### Görevler

**1. `backend/src/quality-os/coverage-engine.ts`:**

```ts
/**
 * Deterministic mandatory metric coverage check.
 * LLM'in "28 metriği kontrol et" demesi yerine kod ile validate.
 */

export type CoverageRule = {
  category: string;
  required_facts: string[];
  conditional?: { if_sector?: string; if_mode?: string };
  min_completeness_pct: number;
};

export const COVERAGE_RULES: CoverageRule[] = [
  {
    category: 'profitability_core',
    required_facts: [
      'revenue_fy2025', 'revenue_fy2024', 'revenue_fy2023',
      'ebitda_fy2025', 'ebitda_margin_fy2025',
      'net_income_fy2025', 'net_margin_fy2025',
      'gross_margin_fy2025',
    ],
    min_completeness_pct: 1.0,
  },
  {
    category: 'working_capital',
    required_facts: ['dso_fy2025', 'dio_fy2025', 'dpo_fy2025', 'ccc_fy2025', 'nwc_revenue_pct_fy2025'],
    min_completeness_pct: 1.0,
  },
  {
    category: 'leverage',
    required_facts: [
      'net_debt_fy2025', 'net_debt_ebitda_fy2025',
      'current_ratio_fy2025', 'acid_test_fy2025', 'interest_coverage_fy2025',
    ],
    min_completeness_pct: 1.0,
  },
  {
    category: 'cash_flow',
    required_facts: ['ocf_fy2025', 'fcf_fy2025', 'capex_fy2025', 'capex_ebitda_pct_fy2025'],
    min_completeness_pct: 1.0,
  },
  {
    category: 'aviation_specific',
    required_facts: ['ebitdar_fy2025', 'cask_fy2025', 'rask_fy2025', 'load_factor_fy2025'],
    conditional: { if_sector: 'aviation' },
    min_completeness_pct: 1.0,
  },
  {
    category: 'banking_specific',
    required_facts: ['nim_fy2025', 'cet1_fy2025', 'cost_of_risk_fy2025', 'npl_ratio_fy2025'],
    conditional: { if_sector: 'banking' },
    min_completeness_pct: 1.0,
  },
  // ... 28 toplam metrik için diğer kategoriler
];

export type CoverageReport = {
  session_id: string;
  ticker: string;
  sector: string;
  mode: string;
  overall_completeness_pct: number;
  by_category: Record<string, {
    required: number;
    covered: number;
    missing: string[];
    pct: number;
    passes_threshold: boolean;
  }>;
  applicable_rules: string[];
  blocking_gaps: string[];
};

export function checkCoverage(
  sessionId: string,
  sector: string,
  mode: string,
): CoverageReport {
  const factPack = getFactPack(sessionId);
  const ticker = factPack?.ticker || 'UNKNOWN';

  const applicableRules = COVERAGE_RULES.filter(rule => {
    if (rule.conditional?.if_sector && rule.conditional.if_sector !== sector) return false;
    if (rule.conditional?.if_mode && rule.conditional.if_mode !== mode) return false;
    return true;
  });

  const byCategory: CoverageReport['by_category'] = {};
  let totalRequired = 0, totalCovered = 0;
  const blockingGaps: string[] = [];

  for (const rule of applicableRules) {
    const missing = rule.required_facts.filter(f => !factPack?.facts[f]);
    const covered = rule.required_facts.length - missing.length;
    const pct = covered / rule.required_facts.length;

    byCategory[rule.category] = {
      required: rule.required_facts.length,
      covered,
      missing,
      pct,
      passes_threshold: pct >= rule.min_completeness_pct,
    };

    totalRequired += rule.required_facts.length;
    totalCovered += covered;

    if (pct < rule.min_completeness_pct) {
      blockingGaps.push(...missing);
    }
  }

  return {
    session_id: sessionId,
    ticker,
    sector,
    mode,
    overall_completeness_pct: totalCovered / totalRequired,
    by_category: byCategory,
    applicable_rules: applicableRules.map(r => r.category),
    blocking_gaps: blockingGaps,
  };
}
```

**2. QA agent'a coverage report inject:**

```ts
// qa_review öncesi coverage check
const coverage = checkCoverage(sessionId, sector, mode);
prompt += `\n\n## Coverage Report (deterministic)\n${JSON.stringify(coverage, null, 2)}`;
if (coverage.blocking_gaps.length > 0) {
  prompt += `\n\n🚨 BLOCKING GAPS: ${coverage.blocking_gaps.join(', ')}`;
}
```

**3. QA hard gate'e coverage eşiği ekle:**

```ts
// orchestrator.ts QA evaluation
if (coverage.overall_completeness_pct < 0.85) {
  // Direct block — QA kararını beklemeden
  markSessionFailed(sessionId, `Coverage below 85%: ${coverage.blocking_gaps.length} missing facts`);
  return;
}
```

### Commit
`feat(quality-os): deterministic coverage engine with sector-aware rules [finance-x-polish P2C]`

---

## FAZ P2D — Hallucination Detection

### Citation Enforcement Policy v2 (Critical-Facts-Only Block)

**Ana kural:** Her fact'in citation eksikliği publish block üretmez. **Sadece critical fact listesindeki item'ların citation'ı eksikse block tetiklenir** — o da "3+ critical missing" koşuluyla.

```yaml
# config/critical-facts.yaml
#
# Bu listedeki fact'ler raporun omurgası. Citation zorunluluğu.
# Liste kısa ve sabittir — genişletmek için PR + review gerekli.

critical_facts_requiring_citation:
  # Karar değişkenleri
  - investment_recommendation      # BUY/HOLD/SELL
  - target_price                    # hedef fiyat
  - fair_value                      # DCF/Peer implied value

  # Para birimi critical metrikler
  - revenue_fy_current
  - revenue_fy_next
  - ebitda_fy_current
  - net_income_fy_current
  - net_debt_latest
  - fcf_fy_current
  - capex_fy_current
  - capex_guidance_fy_next

  # Major disclosures
  - major_disclosed_risks          # şirketin KAP'ta beyan ettiği ana riskler
  - major_guidance                  # management guidance

# Yukarıdaki ~13 item dışındaki tüm fact'ler "non-critical":
# - soft_ratios (margins, returns)
# - peer_comparison_metrics
# - macro_context_values
# - sector_benchmarks
# - secondary_valuations
# Bunların citation eksikse → sadece report annotation, publish block YOK.
```

### Tiered Enforcement Logic

```ts
// P2D citation check, new logic
import { CRITICAL_FACTS } from '../config/critical-facts.js';

export function enforceCitations(report: QAReport, facts: CanonicalFact[]): CitationDecision {
  const violations = findCitationViolations(facts);

  // Critical vs non-critical ayır
  const criticalMissing = violations.filter(v => CRITICAL_FACTS.includes(v.fact_key));
  const nonCriticalMissing = violations.filter(v => !CRITICAL_FACTS.includes(v.fact_key));

  // Non-critical'da citation eksikse → sadece annotation
  for (const v of nonCriticalMissing) {
    addReportAnnotation(v.fact_key, `[citation-missing] ${v.fact_value}`);
  }

  // Critical'da 3+ eksikse publish block
  if (criticalMissing.length >= 3) {
    return {
      decision: 'block',
      status: 'citation_blocked',
      reason: `${criticalMissing.length} critical facts without citation: ${criticalMissing.map(v => v.fact_key).join(', ')}`,
      violations: criticalMissing,
    };
  }

  // Critical'da 1-2 eksikse pass with warning
  if (criticalMissing.length > 0) {
    return {
      decision: 'pass_with_warning',
      status: 'completed_with_warning',
      reason: `${criticalMissing.length} critical fact(s) without citation — analyst review recommended`,
      violations: criticalMissing,
    };
  }

  return { decision: 'pass', status: 'ok' };
}
```

**Kazanım:** 50 fact'in 3'ü citation'sız diye rapor block'lanmaz. Sadece recommendation, target_price veya EBITDA gibi core fact'ler citation'sızsa block tetiklenir.

### Görevler

**1. `backend/src/quality-os/hallucination-detector.ts`:**

```ts
/**
 * Post-processing check: numeric claim'ler kaynak gösterdi mi?
 * LLM'in "kaynaksız rakam yasak" kuralını runtime'da zorla.
 */

export type UnsourcedClaim = {
  agent_id: string;
  location: string;       // "metrics.ebitda_fy2025" veya paragraph hash
  claim_text: string;
  number: number;
  unit?: string;
  context_before: string;
  context_after: string;
  severity: 'P0' | 'P1' | 'P2';
};

const CITATION_MARKERS = [
  /\[KAYNAK:\s*[^\]]+\]/i,
  /\[SOURCE:\s*[^\]]+\]/i,
  /\[VERİ\s*YOK\]/i,
  /\[NO\s*DATA\]/i,
  /\[EVIDENCE:\s*[^\]]+\]/i,
  /\(kaynak:[^)]+\)/i,
];

const WHITELIST_PATTERNS = [
  /^\d{4}$/,              // Years
  /^%\d+\.?\d*$/,         // Percentages in ratio context
  /^Q[1-4]$/,             // Quarters
  /^FY\d{4}$/,            // Fiscal years
];

export function detectHallucinations(
  agentId: string,
  agentOutput: string,
  minNumberMagnitude = 1,   // 1'den küçük sayıları check etme (orta ratio etc.)
): UnsourcedClaim[] {
  const unsourced: UnsourcedClaim[] = [];

  // Tüm sayıları bul (mn TL, bn USD, %, etc.)
  const numberRegex = /(?<![a-zA-Z])(\d{1,3}(?:[,.]?\d{3})*(?:[,.]\d+)?)\s*(mn|bn|tn|milyon|milyar|trilyon|%|€|\$|TL|TRY|USD)?/g;

  let match;
  while ((match = numberRegex.exec(agentOutput)) !== null) {
    const number = parseFloat(match[1].replace(/,/g, '.'));
    if (number < minNumberMagnitude) continue;

    // Whitelist check
    const claimText = match[0];
    if (WHITELIST_PATTERNS.some(p => p.test(claimText))) continue;

    // Context window: 100 char before + after
    const pos = match.index;
    const before = agentOutput.slice(Math.max(0, pos - 200), pos);
    const after = agentOutput.slice(pos + claimText.length, pos + claimText.length + 200);
    const context = before + claimText + after;

    // Citation marker check
    const hasCitation = CITATION_MARKERS.some(m => m.test(context));
    if (hasCitation) continue;

    // Unsourced!
    unsourced.push({
      agent_id: agentId,
      location: `char_${pos}`,
      claim_text: claimText,
      number,
      unit: match[2],
      context_before: before.slice(-80),
      context_after: after.slice(0, 80),
      severity: number > 1000 ? 'P0' : number > 100 ? 'P1' : 'P2',
    });
  }

  return unsourced;
}

export function shouldBlockOutput(unsourced: UnsourcedClaim[]): boolean {
  const p0Count = unsourced.filter(u => u.severity === 'P0').length;
  return p0Count > 0;  // P0 unsourced (>1000 magnitude) → block
}
```

**2. Agent-runner integration:**

```ts
// agent-runner.ts, agent output sonrası
import { detectHallucinations, shouldBlockOutput } from './quality-os/hallucination-detector.js';

const unsourced = detectHallucinations(agentId, output);
if (unsourced.length > 0) {
  console.warn(`[hallucination] ${agentId}: ${unsourced.length} unsourced claims`);
  // Persist
  for (const u of unsourced) persistUnsourced(sessionId, u);
}

if (shouldBlockOutput(unsourced)) {
  // Revision request: "Aşağıdaki rakamlara kaynak ekle:"
  return { ...result, status: 'revision_needed', revisionReason: buildRevisionPrompt(unsourced) };
}
```

**3. DB:**

```sql
CREATE TABLE unsourced_claims (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  location TEXT,
  claim_text TEXT,
  number REAL,
  unit TEXT,
  context_before TEXT,
  context_after TEXT,
  severity TEXT,
  detected_at TEXT
);
```

**4. `config.ts`:**

```ts
export const HALLUCINATION_DETECTION_ENABLED = (process.env.HALLUCINATION_DETECTION_ENABLED ?? 'true') === 'true';
export const HALLUCINATION_BLOCK_ON_P0 = (process.env.HALLUCINATION_BLOCK_ON_P0 ?? 'true') === 'true';
export const CITATION_ENFORCEMENT_ENABLED = (process.env.CITATION_ENFORCEMENT_ENABLED ?? 'true') === 'true';
```

**5. Citation Enforcement Layer — Publish Blocker for Critical Facts:**

Hallucination detection genel sayıları tarıyor, ama kurumsal rapor için **belirli fact'ler kaynak ZORUNLU** olmalı. Bu fact'ler rapor omurgası — kaynaksız yayınlanamaz.

`backend/src/quality-os/citation-enforcement.ts`:

```ts
/**
 * Deterministic citation enforcement.
 * Critical fact'ler için kaynak olmadan rapor publish edilemez.
 */
import { getFact, getFactPack } from '../fact-layer/store.js';

// Bu fact'ler kurumsal rapor omurgasıdır — kaynaksız yayın YASAK
const PUBLISH_BLOCKER_FACTS = [
  'revenue_fy2025', 'revenue_fy2024', 'revenue_fy2023',
  'ebitda_fy2025', 'ebitda_fy2024',
  'net_income_fy2025', 'net_income_fy2024',
  'net_debt_fy2025',
  'fcf_fy2025',
  'capex_fy2025',
  'ocf_fy2025',
];

export type CitationViolation = {
  fact_key: string;
  fact_value: any;
  violation_type: 'no_source' | 'source_incomplete' | 'source_unverifiable';
  details: string;
};

export type CitationEnforcementReport = {
  session_id: string;
  total_critical_facts: number;
  facts_with_citation: number;
  violations: CitationViolation[];
  publish_blocked: boolean;
  blocking_reason?: string;
};

export function enforceCitations(sessionId: string): CitationEnforcementReport {
  const pack = getFactPack(sessionId);
  if (!pack) throw new Error('No fact pack found for session');

  const violations: CitationViolation[] = [];
  let withCitation = 0;

  for (const factKey of PUBLISH_BLOCKER_FACTS) {
    const fact = pack.facts[factKey];
    if (!fact) {
      // Fact yok — coverage engine'in görevi (P2C), citation değil
      continue;
    }

    // Source check
    if (!fact.sources || fact.sources.length === 0) {
      violations.push({
        fact_key: factKey,
        fact_value: fact.value,
        violation_type: 'no_source',
        details: 'Critical fact has no source references',
      });
      continue;
    }

    // Source completeness (direct_disclosure veya computed olmalı, inferred ise fail)
    const bestSource = fact.sources[0];
    if (bestSource.type === 'inferred' || bestSource.type === 'peer_proxy') {
      violations.push({
        fact_key: factKey,
        fact_value: fact.value,
        violation_type: 'source_incomplete',
        details: `Critical fact source type is ${bestSource.type} — not acceptable for publication`,
      });
      continue;
    }

    if (bestSource.type === 'direct_disclosure' && !bestSource.doc_id) {
      violations.push({
        fact_key: factKey,
        fact_value: fact.value,
        violation_type: 'source_unverifiable',
        details: 'Direct disclosure source missing doc_id',
      });
      continue;
    }

    withCitation++;
  }

  const publishBlocked = violations.length > 0;
  return {
    session_id: sessionId,
    total_critical_facts: PUBLISH_BLOCKER_FACTS.length,
    facts_with_citation: withCitation,
    violations,
    publish_blocked: publishBlocked,
    blocking_reason: publishBlocked
      ? `${violations.length} critical facts missing proper citation: ${violations.map(v => v.fact_key).join(', ')}`
      : undefined,
  };
}
```

**6. COO delivery check öncesi entegrasyon:**

```ts
// orchestrator.ts, COO delivery check içinde
import { enforceCitations } from './quality-os/citation-enforcement.js';
import { CITATION_ENFORCEMENT_ENABLED } from './config.js';

if (CITATION_ENFORCEMENT_ENABLED) {
  const citationReport = enforceCitations(sessionId);
  persistCitationReport(sessionId, citationReport);

  if (citationReport.publish_blocked) {
    // Session cannot be delivered — hard block
    await createEscalation(sessionId, 'quality_gate_block', 'P0',
      citationReport.blocking_reason!,
      ['final_summary', 'report_formatter']);

    updateSessionStatus(sessionId, 'citation_blocked',
      citationReport.blocking_reason);
    return;
  }
}
```

**7. DB:**

```sql
CREATE TABLE citation_reports (
  session_id TEXT PRIMARY KEY,
  total_critical_facts INTEGER,
  facts_with_citation INTEGER,
  violations_json TEXT,
  publish_blocked INTEGER,
  created_at TEXT NOT NULL
);
```

### Commit
`feat(quality-os): hallucination detection + critical fact citation enforcement [finance-x-polish P2D]`

---

## FAZ P2E — Quality Budget System + Final Publishable Score

### Görevler

**1. `config/quality_budgets.yml`:**

```yaml
budgets:
  fast_screening:
    max_latency_seconds: 600
    max_cost_usd: 0.50
    min_coverage_pct: 0.40
    min_evidence_coverage: 0.30
    min_narrative_depth_words: 500
    min_delivery_completeness_pct: 0.70

  standard_institutional:
    max_latency_seconds: 2400
    max_cost_usd: 2.00
    min_coverage_pct: 0.85
    min_evidence_coverage: 0.70
    min_narrative_depth_words: 3000
    min_delivery_completeness_pct: 0.95

  deep_dive:
    max_latency_seconds: 5400
    max_cost_usd: 5.00
    min_coverage_pct: 1.00
    min_evidence_coverage: 0.85
    min_narrative_depth_words: 8000
    min_delivery_completeness_pct: 1.00

  event_flash:
    max_latency_seconds: 180
    max_cost_usd: 0.20
    min_coverage_pct: 0.20
    min_evidence_coverage: 0.50
    min_narrative_depth_words: 200
    min_delivery_completeness_pct: 0.60
```

**2. `backend/src/quality-os/quality-budget.ts`:**

```ts
export type QualityBudget = {
  max_latency_seconds: number;
  max_cost_usd: number;
  min_coverage_pct: number;
  min_evidence_coverage: number;
  min_narrative_depth_words: number;
  min_delivery_completeness_pct: number;
};

export function loadBudget(mode: string): QualityBudget { /* YAML load */ }

export type BudgetStatus = {
  mode: string;
  budget: QualityBudget;
  actual: {
    elapsed_seconds: number;
    spent_usd: number;
    coverage_pct: number;
    evidence_coverage: number;
    narrative_words: number;
    delivery_pct: number;
  };
  violations: Array<{ dimension: string; budget: number; actual: number; severity: string }>;
  overall_status: 'ON_TRACK' | 'AT_RISK' | 'VIOLATED';
};

export function evaluateBudget(sessionId: string, mode: string): BudgetStatus {
  const budget = loadBudget(mode);
  const actual = computeActualSpend(sessionId);
  const violations: BudgetStatus['violations'] = [];

  if (actual.elapsed_seconds > budget.max_latency_seconds)
    violations.push({ dimension: 'latency', budget: budget.max_latency_seconds, actual: actual.elapsed_seconds, severity: 'critical' });
  if (actual.spent_usd > budget.max_cost_usd)
    violations.push({ dimension: 'cost', budget: budget.max_cost_usd, actual: actual.spent_usd, severity: 'critical' });
  if (actual.coverage_pct < budget.min_coverage_pct)
    violations.push({ dimension: 'coverage', budget: budget.min_coverage_pct, actual: actual.coverage_pct, severity: 'material' });
  // ... diğerleri

  return {
    mode,
    budget,
    actual,
    violations,
    overall_status: violations.some(v => v.severity === 'critical') ? 'VIOLATED'
      : violations.length > 0 ? 'AT_RISK' : 'ON_TRACK',
  };
}

// Session boyunca periyodik check
export function startBudgetMonitor(sessionId: string, mode: string, intervalMs = 30000): () => void {
  const interval = setInterval(() => {
    const status = evaluateBudget(sessionId, mode);
    if (status.overall_status === 'VIOLATED') {
      // Alert + possible session abort
      console.error(`[budget] Session ${sessionId} VIOLATED: ${JSON.stringify(status.violations)}`);
      // Optional: kill running agents
    }
  }, intervalMs);
  return () => clearInterval(interval);
}
```

**3. Orchestrator integration:**

```ts
// executeSession başlangıcında
const stopMonitor = startBudgetMonitor(sessionId, runtimeMode);
try {
  // ... pipeline execution
} finally {
  stopMonitor();
}
```

**4. Final Publishable Score Engine — Budget'un içinde composite score:**

Quality budget "in-flight" durumu izliyor (violation var mı). Ama session bittiğinde **tek final score** lazım — "bu rapor publish edilebilir mi?" kararı için. Bu score budget evaluasyonu + coverage + consistency + confidence + citation + contradiction'ı birleştirir.

`backend/src/quality-os/final-score.ts`:

```ts
/**
 * Session-end final publishable score.
 * 0-100 skalada kompozit skor + tier interpretation.
 */
import { checkCoverage } from './coverage-engine.js';
import { detectContradictions } from './contradiction-engine.js';
import { enforceCitations } from './citation-enforcement.js';
import { getFactPack } from '../fact-layer/store.js';
import { evaluateBudget } from './quality-budget.js';

export type FinalScoreInputs = {
  coverage_pct: number;             // 0-1
  consistency_score: number;         // 0-1 (1 - contradiction penalty)
  avg_confidence: number;            // 0-1
  citation_density: number;          // 0-1 (critical facts with valid citation)
  contradiction_penalty: number;     // 0-1 (0 = no conflicts, 1 = many critical)
  budget_status: 'ON_TRACK' | 'AT_RISK' | 'VIOLATED';
};

export type FinalScore = {
  session_id: string;
  score: number;                     // 0-100
  tier: 'PUBLISH_READY' | 'INTERNAL_ONLY' | 'REVISION_ADVISED' | 'BLOCKED';
  components: {
    coverage: number;
    consistency: number;
    confidence: number;
    citation: number;
    contradiction_deduction: number;
    budget_deduction: number;
  };
  interpretation: string;
  recommended_action: string;
};

// Weights sum to 85, contradiction up to -15
const WEIGHTS = {
  coverage: 25,
  consistency: 20,
  confidence: 20,
  citation: 20,
  // Remaining 15 points sensitive to budget status
};

export async function computeFinalPublishableScore(
  sessionId: string,
  mode: string,
): Promise<FinalScore> {
  // Gather inputs from all Quality OS components
  const factPack = getFactPack(sessionId);
  const coverage = checkCoverage(sessionId, factPack?.sector_canonical || 'unknown', mode);
  const contradictions = await detectContradictions(sessionId);
  const citations = enforceCitations(sessionId);
  const budget = evaluateBudget(sessionId, mode);

  const inputs: FinalScoreInputs = {
    coverage_pct: coverage.overall_completeness_pct,
    consistency_score: contradictions.overall_consistency_score,
    avg_confidence: factPack?.avg_confidence || 0,
    citation_density: citations.total_critical_facts === 0
      ? 1
      : citations.facts_with_citation / citations.total_critical_facts,
    contradiction_penalty: 1 - contradictions.overall_consistency_score,
    budget_status: budget.overall_status,
  };

  // Compute components
  const coverageScore = inputs.coverage_pct * WEIGHTS.coverage;
  const consistencyScore = inputs.consistency_score * WEIGHTS.consistency;
  const confidenceScore = inputs.avg_confidence * WEIGHTS.confidence;
  const citationScore = inputs.citation_density * WEIGHTS.citation;

  // Contradiction deduction — based on severity
  const criticalConflicts = contradictions.contradictions.filter(c => c.severity === 'critical').length;
  const materialConflicts = contradictions.contradictions.filter(c => c.severity === 'material').length;
  const contradictionDeduction = Math.min(15, criticalConflicts * 5 + materialConflicts * 2);

  // Budget deduction
  const budgetDeduction = inputs.budget_status === 'VIOLATED' ? 10
    : inputs.budget_status === 'AT_RISK' ? 3
    : 0;

  const total = coverageScore + consistencyScore + confidenceScore + citationScore
    - contradictionDeduction - budgetDeduction;

  const score = Math.max(0, Math.min(100, total));

  // Tier mapping
  let tier: FinalScore['tier'];
  let interpretation: string;
  let recommendedAction: string;

  if (citations.publish_blocked) {
    tier = 'BLOCKED';
    interpretation = `Blocked: critical facts missing citation (${citations.violations.length} violations).`;
    recommendedAction = 'Fix citations before publish — see citation_reports table.';
  } else if (score >= 90) {
    tier = 'PUBLISH_READY';
    interpretation = `Publish-ready (${score.toFixed(1)}/100). High coverage, low conflicts, strong citations.`;
    recommendedAction = 'Ready for external delivery.';
  } else if (score >= 80) {
    tier = 'INTERNAL_ONLY';
    interpretation = `Internal institutional quality (${score.toFixed(1)}/100). Minor gaps or conflicts.`;
    recommendedAction = 'Suitable for internal use; external delivery requires revision.';
  } else if (score >= 70) {
    tier = 'REVISION_ADVISED';
    interpretation = `Revision advised (${score.toFixed(1)}/100). Coverage or consistency issues.`;
    recommendedAction = 'Re-run affected agents before delivery.';
  } else {
    tier = 'BLOCKED';
    interpretation = `Blocked (${score.toFixed(1)}/100). Material quality issues.`;
    recommendedAction = 'Escalate to CEO; session cannot be delivered.';
  }

  const finalScore: FinalScore = {
    session_id: sessionId,
    score: Math.round(score * 10) / 10,
    tier,
    components: {
      coverage: Math.round(coverageScore * 10) / 10,
      consistency: Math.round(consistencyScore * 10) / 10,
      confidence: Math.round(confidenceScore * 10) / 10,
      citation: Math.round(citationScore * 10) / 10,
      contradiction_deduction: contradictionDeduction,
      budget_deduction: budgetDeduction,
    },
    interpretation,
    recommended_action: recommendedAction,
  };

  persistFinalScore(finalScore);
  return finalScore;
}

function persistFinalScore(score: FinalScore): void {
  db.prepare(`
    INSERT OR REPLACE INTO final_scores
    (session_id, score, tier, components_json, interpretation, recommended_action, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    score.session_id, score.score, score.tier,
    JSON.stringify(score.components),
    score.interpretation, score.recommended_action,
    new Date().toISOString(),
  );
}
```

**5. DB:**

```sql
CREATE TABLE final_scores (
  session_id TEXT PRIMARY KEY,
  score REAL NOT NULL,
  tier TEXT NOT NULL,
  components_json TEXT,
  interpretation TEXT,
  recommended_action TEXT,
  computed_at TEXT NOT NULL
);
```

**6. Pipeline entegrasyonu — session completion öncesi son adım:**

```ts
// orchestrator.ts, session sonunda
import { computeFinalPublishableScore } from './quality-os/final-score.js';

// Tüm agent'lar bittikten + COO delivery check öncesi
const finalScore = await computeFinalPublishableScore(sessionId, runtimeMode);

if (finalScore.tier === 'BLOCKED') {
  updateSessionStatus(sessionId, 'quality_blocked', finalScore.interpretation);
  await createEscalation(sessionId, 'quality_gate_block', 'P0',
    finalScore.interpretation,
    ['final_summary']);
  return;
}

// Session record'a final score yaz
db.prepare(`UPDATE analysis_sessions SET final_quality_score = ?, quality_tier = ? WHERE id = ?`)
  .run(finalScore.score, finalScore.tier, sessionId);

// Dashboard ve reports için görünür olsun
bus.emitEvent({
  type: 'final_score_computed',
  session_id: sessionId,
  score: finalScore.score,
  tier: finalScore.tier,
});
```

**7. Dashboard'da gösterim:**

Her session kartında final score + tier badge (yeşil/sarı/turuncu/kırmızı). Tıklandığında component breakdown görünür.

### Commit
`feat(quality-os): quality budget + final publishable score engine [finance-x-polish P2E]`

---

## FAZ P2F — Chairman Question Anticipation Engine

**Amaç:** Chairman/CFO/Board seviyesinde sorulabilecek sivri sorular raporu OKUMADAN ÖNCE tespit edilsin ve `strategic_synthesis` bu soruları açıkça cevaplasın. Bu katman raporun "sorulmadan cevaplanmış" olmasını sağlar — kurumsal research seviyesinin en belirgin göstergesi.

### Problem

Şu an rapor yayımlanıyor, sonra chairman "şuna cevap yok" diyor. Örnek:
- "Revenue artarken EBITDA marjı neden düştü?"
- "Net borç azaldı ama finansman gideri arttı, niye?"
- "Net kar düştü ama nakit yükseldi, kaynak ne?"
- "IAS 29 adjusted sayılarla yönetimin açıklaması tutarsız."

Bu sorular **fact'lerden deterministic türetilebilir** — LLM yaratıcılığına gerek yok.

### Görevler

**1. `backend/src/quality-os/chairman-questions.ts`:**

```ts
/**
 * Chairman Question Anticipation Engine.
 * Canonical fact'lerden deterministic pattern-matching ile sivri sorular türet.
 * Bu sorular strategic_synthesis'in input'u olur — rapor bu sorulara cevap vermek ZORUNDA.
 */
import type { CanonicalFact, CanonicalFactPackV2 } from '../fact-layer/types.js';
import { getFactPack } from '../fact-layer/store.js';

export type ChairmanQuestion = {
  id: string;
  category: 'margin' | 'leverage' | 'cash_flow' | 'growth' | 'valuation' | 'ias29' | 'governance' | 'working_capital';
  severity: 'P0' | 'P1' | 'P2';    // P0 = cevap yoksa rapor eksik
  question: string;
  trigger_reason: string;           // Hangi fact pattern soruyu doğurdu
  involved_facts: string[];
  expected_answer_location: string; // Hangi agent/section cevaplamalı
};

export type ChairmanQuestionReport = {
  session_id: string;
  ticker: string;
  questions: ChairmanQuestion[];
  p0_count: number;
  p1_count: number;
  generated_at: string;
};

export function anticipateChairmanQuestions(sessionId: string): ChairmanQuestionReport {
  const pack = getFactPack(sessionId);
  if (!pack) throw new Error('No fact pack found');

  const questions: ChairmanQuestion[] = [];

  // 1. Revenue ↑ / Margin ↓ pattern
  if (hasRevenueGrowth(pack) && hasMarginDrop(pack)) {
    questions.push({
      id: `cq-${sessionId}-margin-${Date.now()}`,
      category: 'margin',
      severity: 'P0',
      question: 'Revenue artarken EBITDA marjı neden düştü? Operasyonel sorun mu, input cost baskısı mı, mix etkisi mi?',
      trigger_reason: `Revenue YoY +${getRevenueGrowthPct(pack).toFixed(1)}%, EBITDA margin ${getMarginChangeBps(pack).toFixed(0)}bps`,
      involved_facts: ['revenue_fy2025', 'revenue_fy2024', 'ebitda_margin_fy2025', 'ebitda_margin_fy2024'],
      expected_answer_location: 'financial_analysis > fa_profitability interpretation',
    });
  }

  // 2. Debt ↓ / Finance cost ↑
  if (hasDebtReduction(pack) && hasFinanceCostIncrease(pack)) {
    questions.push({
      id: `cq-${sessionId}-leverage-${Date.now()}`,
      category: 'leverage',
      severity: 'P0',
      question: 'Borç azalırken finansman gideri neden arttı? FX etkisi mi, faiz oranı resetleri mi, enflasyon muhasebesi mi?',
      trigger_reason: 'Net debt down YoY, finance expense up YoY — counterintuitive',
      involved_facts: ['net_debt_fy2025', 'net_debt_fy2024', 'interest_expense_fy2025', 'interest_expense_fy2024'],
      expected_answer_location: 'financial_analysis > fa_leverage_liquidity + notes parser',
    });
  }

  // 3. Profit ↓ / Cash ↑
  if (hasProfitDrop(pack) && hasCashIncrease(pack)) {
    questions.push({
      id: `cq-${sessionId}-cashflow-${Date.now()}`,
      category: 'cash_flow',
      severity: 'P0',
      question: 'Net kâr düşerken nakit nasıl arttı? Working capital iyileşmesi mi, CAPEX kesintisi mi, one-off gain mi?',
      trigger_reason: 'Net income down YoY, cash position up YoY',
      involved_facts: ['net_income_fy2025', 'net_income_fy2024', 'cash_fy2025', 'cash_fy2024', 'ocf_fy2025'],
      expected_answer_location: 'financial_analysis > fa_cash_flow',
    });
  }

  // 4. IAS 29 katkı oranı yüksekse
  if (isIas29MaterialContributor(pack)) {
    questions.push({
      id: `cq-${sessionId}-ias29-${Date.now()}`,
      category: 'ias29',
      severity: 'P0',
      question: 'IAS 29 parasal kazanç/kayıp operasyonel kârın ne kadarını oluşturuyor? Adjusted metrics ile raporlanan arasındaki fark yönetici yorumuna yansıtıldı mı?',
      trigger_reason: 'Monetary gain / Net income ratio > 30% — material distortion risk',
      involved_facts: ['monetary_gain_loss_fy2025', 'net_income_fy2025', 'ias29_adjusted_ni_fy2025'],
      expected_answer_location: 'financial_analysis > fa_profitability + strategic_synthesis',
    });
  }

  // 5. CCC ani değişim
  if (hasCccAnomaly(pack)) {
    questions.push({
      id: `cq-${sessionId}-wc-${Date.now()}`,
      category: 'working_capital',
      severity: 'P1',
      question: `CCC ${getCccChangeDays(pack).toFixed(0)} gün değişti — yapısal bir değişim mi, tek seferlik mi? Tedarikçi/müşteri ilişkilerinde bir gelişme var mı?`,
      trigger_reason: `CCC YoY change > 15 days`,
      involved_facts: ['ccc_fy2025', 'ccc_fy2024', 'dso_fy2025', 'dio_fy2025', 'dpo_fy2025'],
      expected_answer_location: 'financial_analysis > fa_working_capital',
    });
  }

  // 6. FCF negative streak
  if (hasFcfNegativeStreak(pack, 2)) {
    questions.push({
      id: `cq-${sessionId}-fcf-${Date.now()}`,
      category: 'cash_flow',
      severity: 'P0',
      question: 'Arka arkaya negatif FCF var — büyüme CAPEX\'i mi, bakım CAPEX\'i mi? Ne zaman pozitife döner?',
      trigger_reason: '2+ consecutive years of negative FCF',
      involved_facts: ['fcf_fy2025', 'fcf_fy2024', 'capex_fy2025'],
      expected_answer_location: 'financial_analysis > fa_cash_flow + valuation_agent projections',
    });
  }

  // 7. Valuation vs peer dramatic divergence
  if (hasValuationAnomaly(pack)) {
    questions.push({
      id: `cq-${sessionId}-val-${Date.now()}`,
      category: 'valuation',
      severity: 'P1',
      question: 'EV/EBITDA peer ortalamasından materially sapıyor — premium/discount hangi fundamental farka dayalı? Sürdürülebilir mi?',
      trigger_reason: 'EV/EBITDA deviation from peer median > 30%',
      involved_facts: ['ev_ebitda_fy2025'],
      expected_answer_location: 'valuation_agent > val_trading_comps + strategic_synthesis',
    });
  }

  // 8. Growth quality — revenue growth vs volume/price split
  if (hasGrowthWithoutVolume(pack)) {
    questions.push({
      id: `cq-${sessionId}-growth-${Date.now()}`,
      category: 'growth',
      severity: 'P1',
      question: 'Revenue büyümesi fiyat mı volume mü? Enflasyon normalize edilince organik büyüme kaç?',
      trigger_reason: 'Revenue growth above CPI but volume stagnant/declining',
      involved_facts: ['revenue_fy2025', 'volume_indicator_fy2025'],
      expected_answer_location: 'context_extraction + financial_analysis',
    });
  }

  const p0 = questions.filter(q => q.severity === 'P0').length;
  const p1 = questions.filter(q => q.severity === 'P1').length;

  const report: ChairmanQuestionReport = {
    session_id: sessionId,
    ticker: pack.ticker,
    questions,
    p0_count: p0,
    p1_count: p1,
    generated_at: new Date().toISOString(),
  };

  persistChairmanQuestions(report);
  return report;
}

// ─────────────────────────────────────────────────────────────
// Helper predicates — pattern detection on canonical facts
// ─────────────────────────────────────────────────────────────

function getNum(pack: CanonicalFactPackV2, key: string): number | null {
  const f = pack.facts[key];
  return f && typeof f.value === 'number' ? f.value : null;
}

function hasRevenueGrowth(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'revenue_fy2025');
  const prev = getNum(pack, 'revenue_fy2024');
  return cur !== null && prev !== null && cur > prev * 1.05;
}

function getRevenueGrowthPct(pack: CanonicalFactPackV2): number {
  const cur = getNum(pack, 'revenue_fy2025') || 0;
  const prev = getNum(pack, 'revenue_fy2024') || 1;
  return ((cur - prev) / prev) * 100;
}

function hasMarginDrop(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'ebitda_margin_fy2025');
  const prev = getNum(pack, 'ebitda_margin_fy2024');
  return cur !== null && prev !== null && cur < prev - 1.0;  // >100bps drop
}

function getMarginChangeBps(pack: CanonicalFactPackV2): number {
  const cur = getNum(pack, 'ebitda_margin_fy2025') || 0;
  const prev = getNum(pack, 'ebitda_margin_fy2024') || 0;
  return (cur - prev) * 100;  // percentage to bps
}

function hasDebtReduction(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'net_debt_fy2025');
  const prev = getNum(pack, 'net_debt_fy2024');
  return cur !== null && prev !== null && cur < prev * 0.95;
}

function hasFinanceCostIncrease(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'interest_expense_fy2025');
  const prev = getNum(pack, 'interest_expense_fy2024');
  return cur !== null && prev !== null && cur > prev * 1.1;
}

function hasProfitDrop(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'net_income_fy2025');
  const prev = getNum(pack, 'net_income_fy2024');
  return cur !== null && prev !== null && cur < prev * 0.9;
}

function hasCashIncrease(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'cash_fy2025');
  const prev = getNum(pack, 'cash_fy2024');
  return cur !== null && prev !== null && cur > prev * 1.1;
}

function isIas29MaterialContributor(pack: CanonicalFactPackV2): boolean {
  const gain = getNum(pack, 'monetary_gain_loss_fy2025');
  const ni = getNum(pack, 'net_income_fy2025');
  return gain !== null && ni !== null && ni > 0 && Math.abs(gain) / ni > 0.30;
}

function hasCccAnomaly(pack: CanonicalFactPackV2): boolean {
  const cur = getNum(pack, 'ccc_fy2025');
  const prev = getNum(pack, 'ccc_fy2024');
  return cur !== null && prev !== null && Math.abs(cur - prev) > 15;
}

function getCccChangeDays(pack: CanonicalFactPackV2): number {
  return (getNum(pack, 'ccc_fy2025') || 0) - (getNum(pack, 'ccc_fy2024') || 0);
}

function hasFcfNegativeStreak(pack: CanonicalFactPackV2, years: number): boolean {
  const fcfs = ['fcf_fy2025', 'fcf_fy2024', 'fcf_fy2023'].map(k => getNum(pack, k));
  let streak = 0;
  for (const f of fcfs) {
    if (f !== null && f < 0) streak++;
    else break;
  }
  return streak >= years;
}

function hasValuationAnomaly(pack: CanonicalFactPackV2): boolean {
  // Peer median comparison — requires peer_median_ev_ebitda fact
  const own = getNum(pack, 'ev_ebitda_fy2025');
  const peer = getNum(pack, 'peer_median_ev_ebitda');
  if (own === null || peer === null || peer === 0) return false;
  return Math.abs((own - peer) / peer) > 0.30;
}

function hasGrowthWithoutVolume(pack: CanonicalFactPackV2): boolean {
  const revGrowth = getRevenueGrowthPct(pack);
  const volumeCur = getNum(pack, 'volume_indicator_fy2025');
  const volumePrev = getNum(pack, 'volume_indicator_fy2024');
  if (volumeCur === null || volumePrev === null) return false;
  const volumeGrowth = ((volumeCur - volumePrev) / volumePrev) * 100;
  return revGrowth > 15 && volumeGrowth < 3;
}

function persistChairmanQuestions(report: ChairmanQuestionReport): void {
  db.prepare(`
    INSERT OR REPLACE INTO chairman_questions
    (session_id, ticker, questions_json, p0_count, p1_count, generated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    report.session_id, report.ticker, JSON.stringify(report.questions),
    report.p0_count, report.p1_count, report.generated_at,
  );
}
```

**2. DB:**

```sql
CREATE TABLE chairman_questions (
  session_id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  p0_count INTEGER,
  p1_count INTEGER,
  generated_at TEXT NOT NULL
);
```

**3. `strategic_synthesis` entegrasyonu — MUST answer:**

Chairman questions strategic_synthesis'ten ÖNCE üretilir ve agent prompt'una inject edilir. Strategic synthesis bu soruları **açıkça cevaplamak zorundadır**.

`backend/src/orchestrator.ts`, strategic_synthesis dispatch noktasında:

```ts
import { anticipateChairmanQuestions } from './quality-os/chairman-questions.js';

// strategic_synthesis öncesi
if (agentId === 'strategic_synthesis') {
  const chairmanReport = anticipateChairmanQuestions(sessionId);

  if (chairmanReport.p0_count > 0) {
    const questionsBlock = [
      `## 🎯 Chairman Anticipated Questions (MUST ANSWER)`,
      ``,
      `Aşağıdaki ${chairmanReport.questions.length} soru fact pattern analizi ile tespit edildi.`,
      `Yönetim kurulu / CFO seviyesi sorulardır — raporunda AÇIKÇA cevaplanmalı.`,
      ``,
      ...chairmanReport.questions.map((q, i) =>
        `### Q${i + 1} [${q.severity}] — ${q.category}\n` +
        `**Soru:** ${q.question}\n` +
        `**Trigger:** ${q.trigger_reason}\n` +
        `**İlgili facts:** ${q.involved_facts.join(', ')}\n`
      ),
      ``,
      `**KURAL:** Her P0 soru için investment thesis'inde açık bir cevap paragrafı bulunmalı. Eksik cevap → QA reject.`,
    ].join('\n');

    prompt += '\n\n' + questionsBlock;
  }
}
```

**4. QA entegrasyonu — cevap kontrolü:**

Structured QA (P2B) chairman questions'ı kontrol etsin:

```ts
// qa_review prompt'una chairman questions ekle
// QA JSON output'una yeni field:
{
  "chairman_questions_addressed": {
    "total_questions": 5,
    "addressed": 4,
    "unaddressed": [
      { "question_id": "cq-...-ias29-...", "missing_reason": "Strategic synthesis didn't discuss IAS 29 contribution" }
    ]
  }
}
```

Eğer P0 question unaddressed ise QA decision = REVISION_REQUESTED.

**5. Dashboard'da gösterim:**

Her session'da "Chairman Anticipated Questions" paneli. Her sorunun yanında:
- ✅ Addressed (rapor içinde cevaplandı)
- ⚠️ Partially addressed
- ❌ Unaddressed

**6. `config.ts`:**

```ts
export const CHAIRMAN_QUESTIONS_ENABLED = (process.env.CHAIRMAN_QUESTIONS_ENABLED ?? 'true') === 'true';
export const CHAIRMAN_QUESTIONS_BLOCK_ON_P0_UNADDRESSED = (process.env.CHAIRMAN_QUESTIONS_BLOCK_ON_P0_UNADDRESSED ?? 'false') === 'true';
```

### Doğrulama
- `npx tsx scripts/test-chairman-questions.ts <session_id>` — 8 pattern'i test et, sentetik fact'lerle trigger'ları doğrula
- 10 gerçek session'da "kaç soru üretildi, kaçı gerçekten raporda cevaplanmıştı" analiz et

### Commit
`feat(quality-os): chairman question anticipation engine (8 deterministic patterns) [finance-x-polish P2F]`

---

# FAZ P3 — Execution Intelligence

## FAZ P3A — Pre-LLM Validators (Analysis Preflight)

### Görevler

**1. `backend/src/execution/preflight.ts`:**

```ts
/**
 * Agent çağrılarından ÖNCE deterministik validation.
 * Başarısız ise agent hiç çalıştırılmaz, boşa token yakılmaz.
 */

export type PreflightCheck = {
  name: string;
  severity: 'blocker' | 'warning' | 'info';
  check: (ctx: PreflightContext) => Promise<PreflightResult>;
};

export type PreflightContext = {
  session_id: string;
  ticker: string;
  mode: string;
  requested_layers: string[];
};

export type PreflightResult = {
  passed: boolean;
  details: string;
  suggested_fix?: string;
};

export const PREFLIGHT_CHECKS: PreflightCheck[] = [
  {
    name: 'ticker_known',
    severity: 'blocker',
    check: async (ctx) => {
      const sector = getSector(ctx.ticker);
      return sector
        ? { passed: true, details: `Sector: ${sector}` }
        : {
            passed: false,
            details: `Ticker ${ctx.ticker} not in sector registry`,
            suggested_fix: 'Add to config/sector_registry.yml',
          };
    },
  },
  {
    name: 'latest_reporting_period_available',
    severity: 'blocker',
    check: async (ctx) => {
      const hasRecent = await checkKapLatestDisclosure(ctx.ticker, 180);
      return hasRecent
        ? { passed: true, details: 'Recent disclosure found (<180d)' }
        : { passed: false, details: 'No disclosure in last 180 days' };
    },
  },
  {
    name: 'minimum_fact_coverage',
    severity: 'warning',
    check: async (ctx) => {
      const cachedFacts = await checkCachedFacts(ctx.ticker);
      const coverage = cachedFacts.length / 20; // min 20 cached facts beklenir
      return {
        passed: coverage > 0.3,
        details: `${cachedFacts.length} cached facts (${(coverage * 100).toFixed(0)}%)`,
      };
    },
  },
  {
    name: 'required_docs_present',
    severity: 'warning',
    check: async (ctx) => {
      const hasAnnual = await checkDocumentExists(ctx.ticker, 'annual_report');
      return {
        passed: hasAnnual,
        details: hasAnnual ? 'Annual report present' : 'Annual report missing',
        suggested_fix: 'data_collection will fetch',
      };
    },
  },
  {
    name: 'price_snapshot_available',
    severity: 'warning',
    check: async (ctx) => {
      const price = await getLatestPrice(ctx.ticker);
      return {
        passed: price !== null,
        details: price ? `Last price: ${price}` : 'No price data',
      };
    },
  },
  {
    name: 'market_cap_computable',
    severity: 'info',
    check: async (ctx) => {
      const shares = await getSharesOutstanding(ctx.ticker);
      const price = await getLatestPrice(ctx.ticker);
      return {
        passed: shares !== null && price !== null,
        details: shares && price ? `MC: ${(shares * price / 1e6).toFixed(0)} mn TL` : 'Cannot compute MC',
      };
    },
  },
  {
    name: 'qdrant_available_for_rag',
    severity: 'info',
    check: async (ctx) => {
      if (!DOCUMENT_INTEL_ENABLED) return { passed: true, details: 'Document intel disabled' };
      const available = await pingQdrant();
      return {
        passed: available,
        details: available ? 'Qdrant reachable' : 'Qdrant down, RAG will fallback',
      };
    },
  },
];

export type PreflightReport = {
  session_id: string;
  ticker: string;
  mode: string;
  passed: boolean;
  blockers: Array<{ check: string; details: string; suggested_fix?: string }>;
  warnings: Array<{ check: string; details: string }>;
  info: Array<{ check: string; details: string }>;
};

export async function runPreflight(ctx: PreflightContext): Promise<PreflightReport> {
  const blockers: PreflightReport['blockers'] = [];
  const warnings: PreflightReport['warnings'] = [];
  const info: PreflightReport['info'] = [];

  for (const check of PREFLIGHT_CHECKS) {
    try {
      const result = await check.check(ctx);
      if (!result.passed) {
        if (check.severity === 'blocker') {
          blockers.push({ check: check.name, details: result.details, suggested_fix: result.suggested_fix });
        } else if (check.severity === 'warning') {
          warnings.push({ check: check.name, details: result.details });
        } else {
          info.push({ check: check.name, details: result.details });
        }
      }
    } catch (err: any) {
      warnings.push({ check: check.name, details: `Check failed: ${err.message}` });
    }
  }

  return {
    session_id: ctx.session_id,
    ticker: ctx.ticker,
    mode: ctx.mode,
    passed: blockers.length === 0,
    blockers,
    warnings,
    info,
  };
}
```

**2. Orchestrator'a entegre:**

```ts
// executeSession'da pipeline başlamadan önce
const preflight = await runPreflight({
  session_id: sessionId,
  ticker,
  mode: runtimeMode,
  requested_layers: layers,
});

persistPreflight(sessionId, preflight);

if (!preflight.passed) {
  // Session başlatma — blocker var
  updateSessionStatus(sessionId, 'preflight_failed', preflight.blockers.map(b => b.details).join('; '));
  return;
}
```

### Commit
`feat(execution): pre-LLM validators (analysis preflight) [finance-x-polish P3A]`

---

## FAZ P3B — Task Planner

### Görevler

**1. `backend/src/execution/task-planner.ts`:**

```ts
/**
 * User request → yapılandırılmış iş planı.
 * "Full rerun" yerine, sadece gerekli job'ları seçer.
 */

export type AnalysisType =
  | 'fresh_run'           // Yeni şirket veya ilk kez
  | 'delta_update'        // Yeni disclosure/event
  | 'earnings_preview'    // Kazanç öncesi
  | 'event_flash'         // Material event
  | 'valuation_refresh'   // Fiyat değişti
  | 'risk_alert';

export type JobDecomposition = {
  session_id: string;
  analysis_type: AnalysisType;
  triggered_by: string;
  required_jobs: string[];
  skipped_jobs: string[];
  skip_reasons: Record<string, string>;
  estimated_cost_usd: number;
  estimated_latency_seconds: number;
};

const JOB_DEPENDENCIES: Record<string, string[]> = {
  disclosure_diff: ['kap_watch'],
  financial_period_check: ['data_collection'],
  valuation_refresh: ['financial_analysis', 'fact_layer_update'],
  event_impact_analysis: ['event_classification', 'event_impact_mapper'],
  full_sector_rebuild: ['sector_competition'],
  full_esg_rebuild: ['esg_agent'],
  macro_refresh: ['macro_analysis'],
  synthesis_delta: ['strategic_synthesis', 'final_summary'],
};

export async function planTasks(
  sessionId: string,
  ticker: string,
  triggerReason: string,
  lastSessionId?: string,
): Promise<JobDecomposition> {
  const changeDetection = await detectChanges(ticker, lastSessionId);

  let analysisType: AnalysisType;
  const requiredJobs: string[] = [];
  const skippedJobs: string[] = [];
  const skipReasons: Record<string, string> = {};

  if (!lastSessionId) {
    analysisType = 'fresh_run';
    requiredJobs.push(...Object.keys(JOB_DEPENDENCIES));
  } else if (changeDetection.hasNewDisclosure) {
    analysisType = 'delta_update';
    requiredJobs.push('disclosure_diff', 'event_impact_analysis', 'synthesis_delta');

    if (!changeDetection.priceChanged) {
      skippedJobs.push('valuation_refresh');
      skipReasons.valuation_refresh = 'Price unchanged (<2% move)';
    } else {
      requiredJobs.push('valuation_refresh');
    }

    if (!changeDetection.hasNewFinancialPeriod) {
      skippedJobs.push('full_sector_rebuild', 'full_esg_rebuild');
      skipReasons.full_sector_rebuild = 'No new financial period';
      skipReasons.full_esg_rebuild = 'No new ESG disclosure';
    }
  } else if (changeDetection.priceChangePct > 5) {
    analysisType = 'valuation_refresh';
    requiredJobs.push('valuation_refresh', 'synthesis_delta');
  } else if (changeDetection.daysSinceLastSession > 30) {
    analysisType = 'fresh_run';
    requiredJobs.push(...Object.keys(JOB_DEPENDENCIES));
  } else {
    analysisType = 'delta_update';
    // ... minimal update
  }

  return {
    session_id: sessionId,
    analysis_type: analysisType,
    triggered_by: triggerReason,
    required_jobs: requiredJobs,
    skipped_jobs: skippedJobs,
    skip_reasons: skipReasons,
    estimated_cost_usd: estimateCost(requiredJobs),
    estimated_latency_seconds: estimateLatency(requiredJobs),
  };
}

async function detectChanges(ticker: string, lastSessionId?: string) {
  // Last session since vs current state
  const lastSession = lastSessionId ? getSession(lastSessionId) : null;

  return {
    hasNewDisclosure: await hasNewDisclosureSince(ticker, lastSession?.created_at),
    hasNewFinancialPeriod: await hasNewFinancialPeriod(ticker, lastSession?.created_at),
    priceChanged: await hasPriceChange(ticker, lastSession?.created_at, 0.02),
    priceChangePct: await getPriceChangePct(ticker, lastSession?.created_at),
    daysSinceLastSession: lastSession ? Math.floor((Date.now() - new Date(lastSession.created_at).getTime()) / 86400000) : 999,
  };
}

function estimateCost(jobs: string[]): number {
  const costMap: Record<string, number> = {
    disclosure_diff: 0.05,
    financial_period_check: 0.10,
    valuation_refresh: 0.30,
    event_impact_analysis: 0.40,
    full_sector_rebuild: 0.50,
    full_esg_rebuild: 0.30,
    macro_refresh: 0.20,
    synthesis_delta: 0.50,
  };
  return jobs.reduce((sum, j) => sum + (costMap[j] || 0.10), 0);
}
```

**2. Orchestrator'a wire:**

```ts
// executeSession
const plan = await planTasks(sessionId, ticker, triggerReason, lastSessionId);
persistPlan(sessionId, plan);

// Pipeline sadece required_jobs'ları çalıştırır
for (const phase of executionPhases) {
  if (plan.skipped_jobs.includes(phase.name)) {
    console.log(`[planner] Skipping ${phase.name}: ${plan.skip_reasons[phase.name]}`);
    continue;
  }
  // ... run phase
}
```

### Commit
`feat(execution): task planner (change detection + job decomposition) [finance-x-polish P3B]`

---

## FAZ P3C — Incremental Computation Engine

### Görevler

**1. `backend/src/execution/state-graph.ts`:**

```ts
/**
 * Stateful analysis graph — input hash match ise output cache kullan.
 * Full rerun yerine incremental.
 */

export type GraphNode = {
  node_id: string;
  node_type: 'agent' | 'sub_agent' | 'deterministic';
  agent_id: string;
  session_id: string;
  input_hash: string;           // sha256 of serialized inputs
  dependency_hashes: string[];  // upstream node hashes
  output_hash: string;
  output_payload: string;       // JSON blob
  cached_at: string;
  cache_valid_until?: string;
};

import crypto from 'node:crypto';

export function computeInputHash(inputs: Record<string, unknown>): string {
  // Deterministic serialize: keys sorted
  const sorted = Object.keys(inputs).sort().reduce((acc, k) => {
    (acc as any)[k] = inputs[k];
    return acc;
  }, {} as Record<string, unknown>);
  const serialized = JSON.stringify(sorted);
  return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
}

export async function lookupCachedOutput(
  agentId: string,
  inputHash: string,
  dependencyHashes: string[],
  ticker: string,
): Promise<GraphNode | null> {
  const depHashSerialized = dependencyHashes.sort().join(',');

  const row = db.prepare(`
    SELECT * FROM graph_nodes
    WHERE agent_id = ? AND input_hash = ? AND dependency_hashes = ? AND ticker = ?
      AND (cache_valid_until IS NULL OR cache_valid_until > ?)
    ORDER BY cached_at DESC
    LIMIT 1
  `).get(agentId, inputHash, depHashSerialized, ticker, new Date().toISOString()) as any;

  return row ? row as GraphNode : null;
}

export function persistGraphNode(node: GraphNode, ticker: string, validityHours = 24): void {
  const validUntil = new Date(Date.now() + validityHours * 3600000).toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO graph_nodes
    (node_id, node_type, agent_id, session_id, ticker, input_hash, dependency_hashes,
     output_hash, output_payload, cached_at, cache_valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    node.node_id, node.node_type, node.agent_id, node.session_id, ticker,
    node.input_hash, node.dependency_hashes.sort().join(','),
    node.output_hash, node.output_payload, node.cached_at, validUntil,
  );
}

export async function runWithCache(
  agentId: string,
  sessionId: string,
  ticker: string,
  inputs: Record<string, unknown>,
  dependencyHashes: string[],
  executor: () => Promise<string>,
): Promise<{ output: string; cache_hit: boolean }> {
  const inputHash = computeInputHash(inputs);
  const cached = await lookupCachedOutput(agentId, inputHash, dependencyHashes, ticker);

  if (cached) {
    console.log(`[cache] HIT ${agentId} ticker=${ticker} hash=${inputHash}`);
    return { output: cached.output_payload, cache_hit: true };
  }

  const output = await executor();
  const outputHash = crypto.createHash('sha256').update(output).digest('hex').slice(0, 16);

  persistGraphNode({
    node_id: nanoid(),
    node_type: 'agent',
    agent_id: agentId,
    session_id: sessionId,
    input_hash: inputHash,
    dependency_hashes: dependencyHashes,
    output_hash: outputHash,
    output_payload: output,
    cached_at: new Date().toISOString(),
  }, ticker);

  return { output, cache_hit: false };
}
```

**2. DB:**

```sql
CREATE TABLE graph_nodes (
  node_id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  dependency_hashes TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  output_payload TEXT NOT NULL,
  cached_at TEXT NOT NULL,
  cache_valid_until TEXT
);
CREATE INDEX idx_graph_lookup ON graph_nodes(agent_id, ticker, input_hash, dependency_hashes);
CREATE INDEX idx_graph_validity ON graph_nodes(cache_valid_until);
```

**3. Agent-runner wire:**

```ts
import { runWithCache, computeInputHash } from './execution/state-graph.js';

// runSingleAgent içinde
const { output, cache_hit } = await runWithCache(
  agentId,
  sessionId,
  ticker,
  context,
  upstreamHashes,
  async () => {
    // Orijinal agent execution
    return executeAgent(...);
  },
);
```

**4. Cache invalidation triggers:**

```ts
// Yeni KAP disclosure geldiğinde ilgili ticker cache'ini invalidate
export function invalidateTickerCache(ticker: string) {
  db.prepare(`DELETE FROM graph_nodes WHERE ticker = ?`).run(ticker);
}

// Event bus integration (REFACTOR'da eklenen)
bus.on('kap_new_disclosure', (ev) => {
  if (ev.material) invalidateTickerCache(ev.ticker);
});
```

### Commit
`feat(execution): incremental computation engine with graph state + cache [finance-x-polish P3C]`

---

## FAZ P3D — Adaptive Cost Governor

### Görevler

**1. `backend/src/execution/cost-governor.ts`:**

```ts
/**
 * Cost-aware execution routing.
 * Per-session budget monitor + agent-level skip/partial/full decisions.
 */

export type ExecutionDecision = {
  agent_id: string;
  decision: 'run_full' | 'run_haiku' | 'run_cached' | 'skip_with_defaults';
  reason: string;
  expected_cost_usd: number;
};

export function decideExecution(
  agentId: string,
  sessionSpentUsd: number,
  sessionBudgetUsd: number,
  taskPlan: JobDecomposition,
  factPackCompleteness: number,
): ExecutionDecision {
  const remaining = sessionBudgetUsd - sessionSpentUsd;
  const remainingPct = remaining / sessionBudgetUsd;

  // Tier 1: plenty of budget
  if (remainingPct > 0.4) {
    return { agent_id: agentId, decision: 'run_full', reason: 'Budget healthy', expected_cost_usd: estimateAgentCost(agentId, 'sonnet') };
  }

  // Tier 2: getting tight
  if (remainingPct > 0.15) {
    // Can this agent use Haiku?
    const haikuCapable = ['context_extraction', 'event_classification', 'technical_analysis', 'sentiment_news_agent'].includes(agentId);
    if (haikuCapable) {
      return { agent_id: agentId, decision: 'run_haiku', reason: 'Budget moderate, use cheaper model', expected_cost_usd: estimateAgentCost(agentId, 'haiku') };
    }
  }

  // Tier 3: critical
  if (remainingPct > 0.05) {
    // Check if cached output is recent enough
    const cacheAvailable = checkRecentCache(agentId);
    if (cacheAvailable) {
      return { agent_id: agentId, decision: 'run_cached', reason: 'Budget critical, use cached', expected_cost_usd: 0 };
    }
  }

  // Tier 4: exhausted, skip with defaults
  const optionalAgents = ['esg_agent', 'sentiment_news_agent', 'analyst_consensus_agent'];
  if (optionalAgents.includes(agentId)) {
    return { agent_id: agentId, decision: 'skip_with_defaults', reason: 'Budget exhausted, skip optional', expected_cost_usd: 0 };
  }

  // Must run even with low budget
  return { agent_id: agentId, decision: 'run_haiku', reason: 'Critical agent, using cheapest', expected_cost_usd: 0.05 };
}

function estimateAgentCost(agentId: string, model: 'sonnet' | 'haiku'): number {
  const baseCost = { sonnet: 0.15, haiku: 0.02 };
  const multiplier: Record<string, number> = {
    financial_analysis: 3,
    valuation_agent: 2.5,
    strategic_synthesis: 2,
    final_summary: 1.5,
    context_extraction: 1,
  };
  return baseCost[model] * (multiplier[agentId] || 1);
}
```

**2. Agent-runner integration:**

```ts
// Each agent dispatch
const decision = decideExecution(agentId, sessionSpent, budget, plan, factCompleteness);
if (decision.decision === 'skip_with_defaults') {
  return getDefaultOutput(agentId);
}
if (decision.decision === 'run_cached') {
  return getCachedOutput(agentId, ticker);
}
if (decision.decision === 'run_haiku') {
  // Override model for this call
}
```

### Commit
`feat(execution): adaptive cost governor (skip/partial/full decisions) [finance-x-polish P3D]`

---

# FAZ P4 — Reliability & Self-Healing

## FAZ P4A — Escalation Manager State Machine

### Görevler

**1. `backend/src/reliability/escalation.ts`:**

```ts
/**
 * Escalation state machine — missing inputs, source conflicts, parse failures.
 */

export type EscalationType =
  | 'missing_input'
  | 'source_conflict'
  | 'parse_failure'
  | 'macro_data_unavailable'
  | 'formatter_invalid'
  | 'quality_gate_block'
  | 'sub_agent_timeout'
  | 'rate_limit_exhausted';

export type EscalationState =
  | 'open'
  | 'acknowledged'
  | 'retrying'
  | 'fallback_attempted'
  | 'resolved'
  | 'manual_review_required'
  | 'abandoned';

export type Escalation = {
  id: string;
  session_id: string;
  type: EscalationType;
  severity: 'P0' | 'P1' | 'P2';
  state: EscalationState;
  owner: string;                    // 'ceo' | 'coo' | agent_id | 'human'
  deadline_at: string;
  retry_strategy: {
    max_attempts: number;
    current_attempt: number;
    backoff_seconds: number;
  };
  blocking_impact: string[];         // list of downstream agents blocked
  description: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
};

const TRANSITIONS: Record<EscalationState, EscalationState[]> = {
  open: ['acknowledged', 'retrying'],
  acknowledged: ['retrying', 'fallback_attempted', 'manual_review_required'],
  retrying: ['resolved', 'fallback_attempted', 'abandoned'],
  fallback_attempted: ['resolved', 'manual_review_required', 'abandoned'],
  resolved: [],
  manual_review_required: ['resolved', 'abandoned'],
  abandoned: [],
};

export function createEscalation(
  sessionId: string,
  type: EscalationType,
  severity: Escalation['severity'],
  description: string,
  blockingImpact: string[],
  retryMax = 3,
): Escalation {
  const escalation: Escalation = {
    id: nanoid(),
    session_id: sessionId,
    type,
    severity,
    state: 'open',
    owner: decideOwner(type),
    deadline_at: new Date(Date.now() + deadlineMinutes(severity) * 60000).toISOString(),
    retry_strategy: { max_attempts: retryMax, current_attempt: 0, backoff_seconds: 10 },
    blocking_impact: blockingImpact,
    description,
    created_at: new Date().toISOString(),
  };

  persistEscalation(escalation);
  notifyOwner(escalation);
  return escalation;
}

export function transitionEscalation(
  id: string,
  newState: EscalationState,
  notes?: string,
  resolvedBy?: string,
): Escalation {
  const current = getEscalation(id);
  if (!current) throw new Error('Escalation not found');

  if (!TRANSITIONS[current.state].includes(newState)) {
    throw new Error(`Invalid transition: ${current.state} → ${newState}`);
  }

  const updated = {
    ...current,
    state: newState,
    resolution_notes: notes || current.resolution_notes,
    resolved_at: ['resolved', 'abandoned'].includes(newState) ? new Date().toISOString() : current.resolved_at,
    resolved_by: resolvedBy || current.resolved_by,
  };

  persistEscalation(updated);
  return updated;
}

function decideOwner(type: EscalationType): string {
  switch (type) {
    case 'source_conflict': return 'ceo';
    case 'quality_gate_block': return 'coo';
    case 'macro_data_unavailable': return 'macro_analysis';
    case 'formatter_invalid': return 'report_formatter';
    case 'parse_failure': return 'parse_standardization';
    default: return 'coo';
  }
}

function deadlineMinutes(severity: Escalation['severity']): number {
  return severity === 'P0' ? 5 : severity === 'P1' ? 30 : 120;
}
```

**2. DB + integrate with QA + self-healing.**

### Commit
`feat(reliability): escalation manager state machine [finance-x-polish P4A]`

---

## FAZ P4B — Self-Healing Pipelines

### Görevler

**1. `backend/src/reliability/self-healing.ts`:**

```ts
/**
 * Fallback paths for known failure modes.
 */

export type FallbackStrategy = {
  failure_type: string;
  primary_action: string;
  fallback_chain: Array<{
    action: string;
    description: string;
    executor: (ctx: any) => Promise<any>;
  }>;
};

export const FALLBACK_STRATEGIES: FallbackStrategy[] = [
  {
    failure_type: 'kap_fetch_failed',
    primary_action: 'KAP API disclosure fetch',
    fallback_chain: [
      {
        action: 'retry_with_backoff',
        description: 'Retry 3x with exponential backoff',
        executor: async (ctx) => retryWithBackoff(ctx.originalFn, 3),
      },
      {
        action: 'use_fintables_mirror',
        description: 'Use fintables.com as alternate source',
        executor: async (ctx) => fetchFromFintables(ctx.ticker),
      },
      {
        action: 'use_cached_stale',
        description: 'Use cached disclosure even if stale (>7d)',
        executor: async (ctx) => getCachedDisclosure(ctx.ticker, /* allowStale */ true),
      },
      {
        action: 'escalate_to_human',
        description: 'Create human review escalation',
        executor: async (ctx) => createEscalation(ctx.sessionId, 'parse_failure', 'P1', 'KAP fetch all fallbacks exhausted', []),
      },
    ],
  },
  {
    failure_type: 'da_parse_failed',
    primary_action: 'D&A extraction from CF statement',
    fallback_chain: [
      { action: 'rerun_notes_parser', description: 'Re-run ps_notes_parser specifically for D&A', executor: async (ctx) => rerunNotesParser(ctx.sessionId, ['depreciation_amortization']) },
      { action: 'use_is_proxy', description: 'Use IS proxy (Op expense - Cash op expense)', executor: async (ctx) => computeDAFromIS(ctx.sessionId) },
      { action: 'use_peer_proxy', description: 'Use peer D&A/revenue ratio × ticker revenue', executor: async (ctx) => computePeerProxyDA(ctx.sessionId) },
      { action: 'flag_unavailable', description: 'Mark as [VERİ YOK] and continue', executor: async (ctx) => flagUnavailable(ctx.sessionId, 'depreciation_amortization') },
    ],
  },
  {
    failure_type: 'formatter_invalid',
    primary_action: 'report_formatter HTML generation',
    fallback_chain: [
      { action: 'rerun_with_cleanup', description: 'Clean inputs, rerun formatter', executor: async (ctx) => rerunFormatter(ctx.sessionId, { sanitize: true }) },
      { action: 'use_deterministic_template', description: 'Use Jinja template fallback (no LLM)', executor: async (ctx) => renderDeterministicTemplate(ctx.sessionId) },
      { action: 'minimal_report', description: 'Generate minimal HTML with key findings only', executor: async (ctx) => generateMinimalReport(ctx.sessionId) },
    ],
  },
  {
    failure_type: 'macro_data_missing',
    primary_action: 'macro_analysis data fetch',
    fallback_chain: [
      { action: 'use_cached_macro', description: 'Use yesterday cached macro data', executor: async (ctx) => getCachedMacro() },
      { action: 'use_tradingeconomics', description: 'Fallback to tradingeconomics API', executor: async (ctx) => fetchFromTE() },
      { action: 'use_manual_snapshot', description: 'Use last known manual snapshot', executor: async (ctx) => getManualMacroSnapshot() },
    ],
  },
];

export async function executeWithFallback<T>(
  failureType: string,
  ctx: any,
): Promise<{ success: boolean; result?: T; strategy_used?: string }> {
  const strategy = FALLBACK_STRATEGIES.find(s => s.failure_type === failureType);
  if (!strategy) return { success: false };

  for (const step of strategy.fallback_chain) {
    try {
      console.log(`[self-heal] Trying: ${step.action} (${step.description})`);
      const result = await step.executor(ctx);
      console.log(`[self-heal] SUCCESS with ${step.action}`);
      return { success: true, result, strategy_used: step.action };
    } catch (err: any) {
      console.warn(`[self-heal] ${step.action} FAILED: ${err.message}`);
    }
  }

  return { success: false };
}
```

### Commit
`feat(reliability): self-healing pipelines (fallback strategies) [finance-x-polish P4B]`

---

## FAZ P4C — Idempotency + Saga Pattern

### Görevler

**1. Idempotency keys:**

```ts
// backend/src/reliability/idempotency.ts
import crypto from 'node:crypto';

export function generateIdempotencyKey(
  ticker: string,
  mode: string,
  userId: string,
  date: string,
): string {
  return crypto.createHash('sha256')
    .update(`${ticker}|${mode}|${userId}|${date}`)
    .digest('hex').slice(0, 16);
}

export async function checkIdempotency(key: string, ttlHours = 24): Promise<string | null> {
  const row = db.prepare(`
    SELECT session_id FROM idempotency_keys
    WHERE key = ? AND created_at > ?
  `).get(key, new Date(Date.now() - ttlHours * 3600000).toISOString()) as any;
  return row?.session_id || null;
}

export function recordIdempotencyKey(key: string, sessionId: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO idempotency_keys (key, session_id, created_at)
    VALUES (?, ?, ?)
  `).run(key, sessionId, new Date().toISOString());
}
```

**2. Saga pattern for multi-step:**

```ts
// backend/src/reliability/saga.ts

export type SagaStep = {
  name: string;
  forward: (ctx: any) => Promise<any>;
  compensate: (ctx: any, forwardResult?: any) => Promise<void>;
};

export class Saga {
  constructor(private steps: SagaStep[]) {}

  async execute(ctx: any): Promise<{ success: boolean; completedSteps: string[]; compensated: string[] }> {
    const completed: Array<{ step: SagaStep; result: any }> = [];

    for (const step of this.steps) {
      try {
        const result = await step.forward(ctx);
        completed.push({ step, result });
      } catch (err) {
        // Rollback in reverse order
        console.error(`[saga] Step ${step.name} failed, compensating...`);
        for (const c of completed.reverse()) {
          try {
            await c.step.compensate(ctx, c.result);
          } catch (compErr) {
            console.error(`[saga] Compensation failed for ${c.step.name}:`, compErr);
          }
        }
        return {
          success: false,
          completedSteps: completed.map(c => c.step.name),
          compensated: completed.map(c => c.step.name).reverse(),
        };
      }
    }

    return { success: true, completedSteps: completed.map(c => c.step.name), compensated: [] };
  }
}
```

**3. Session execution → Saga:**

```ts
// Example: session as saga
const sessionSaga = new Saga([
  {
    name: 'data_collection',
    forward: async (ctx) => runDataCollection(ctx),
    compensate: async (ctx, result) => cleanupDataCollectionCache(result?.cacheKeys),
  },
  {
    name: 'parse_standardization',
    forward: async (ctx) => runParseStandardization(ctx),
    compensate: async (ctx, result) => deleteParsedArtifacts(result?.artifactIds),
  },
  // ... more
]);
```

### Commit
`feat(reliability): idempotency keys + saga pattern [finance-x-polish P4C]`

---

## FAZ P4D — Circuit Breaker Formal

### Görevler

**1. `backend/src/reliability/circuit-breaker.ts`:**

```ts
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailTime = 0;

  constructor(
    private name: string,
    private failureThreshold = 5,
    private resetTimeoutMs = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`[circuit] ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  getStatus() {
    return { name: this.name, state: this.state, failureCount: this.failureCount };
  }
}

// Global registry
export const breakers = {
  kap: new CircuitBreaker('kap_api', 5, 60000),
  tradingview: new CircuitBreaker('tradingview', 3, 30000),
  qdrant: new CircuitBreaker('qdrant', 3, 30000),
  openai: new CircuitBreaker('openai_embed', 5, 60000),
  anthropic: new CircuitBreaker('anthropic_llm', 10, 120000),
};
```

**2. Wrap external calls:**

```ts
import { breakers } from './reliability/circuit-breaker.js';

// In KAP fetcher
await breakers.kap.execute(async () => {
  return fetchKapDisclosure(ticker, disclosureId);
});
```

### Commit
`feat(reliability): circuit breaker for external calls [finance-x-polish P4D]`

---

# FAZ P5 — Quality Data Foundation

## FAZ P5A — Golden Dataset Framework

### Görevler

**1. `evals/golden_v2/` klasör yapısı:**

```
evals/golden_v2/
├── schema/
│   └── golden_report.schema.json
├── metadata.yml
├── reports/
│   ├── THYAO/
│   │   ├── 2026-Q1_analyst_report.md
│   │   ├── 2026-Q1_gold_facts.json
│   │   └── 2026-Q1_expected_narratives.md
│   ├── EREGL/
│   └── ...
└── scoring/
    ├── numeric_accuracy.ts
    ├── coverage_score.ts
    └── narrative_quality.ts
```

**2. `evals/golden_v2/schema/golden_report.schema.json`:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["ticker", "period", "expected_facts", "expected_narratives", "expected_conclusions"],
  "properties": {
    "ticker": { "type": "string" },
    "period": { "type": "string" },
    "analyst_name": { "type": "string" },
    "analyst_firm": { "type": "string" },
    "report_date": { "type": "string", "format": "date" },
    "expected_facts": {
      "type": "object",
      "patternProperties": {
        "^[a-z_0-9]+$": {
          "type": "object",
          "properties": {
            "value": {},
            "unit": { "type": "string" },
            "tolerance_pct": { "type": "number" }
          }
        }
      }
    },
    "expected_narratives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "topic": { "type": "string" },
          "key_points": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "expected_conclusions": {
      "type": "object",
      "properties": {
        "recommendation": { "enum": ["BUY", "HOLD", "SELL", "NOT_RATED"] },
        "target_price_try": { "type": "number" },
        "target_price_range": { "type": "array", "items": { "type": "number" }, "minItems": 2, "maxItems": 2 }
      }
    }
  }
}
```

**3. `evals/golden_v2/scoring/numeric_accuracy.ts`:**

```ts
export type ScoringResult = {
  score: number;                  // 0-1
  matches: number;
  total: number;
  mismatches: Array<{
    fact_key: string;
    expected: any;
    actual: any;
    delta_pct?: number;
    within_tolerance: boolean;
  }>;
};

export function scoreNumericAccuracy(
  goldenFacts: any,
  actualFactPack: any,
  defaultTolerancePct = 0.02,
): ScoringResult {
  const matches: number[] = [];
  const mismatches: ScoringResult['mismatches'] = [];
  let total = 0;

  for (const [factKey, expected] of Object.entries(goldenFacts)) {
    total++;
    const actualFact = actualFactPack.facts?.[factKey];
    if (!actualFact) {
      mismatches.push({
        fact_key: factKey,
        expected: (expected as any).value,
        actual: null,
        within_tolerance: false,
      });
      continue;
    }

    const tolerance = (expected as any).tolerance_pct || defaultTolerancePct;
    const actual = actualFact.value;
    const exp = (expected as any).value;

    if (typeof exp === 'number' && typeof actual === 'number') {
      const deltaPct = exp === 0 ? 0 : Math.abs(actual - exp) / Math.abs(exp);
      const within = deltaPct <= tolerance;
      if (within) {
        matches.push(1);
      } else {
        mismatches.push({
          fact_key: factKey,
          expected: exp,
          actual,
          delta_pct: deltaPct,
          within_tolerance: false,
        });
      }
    } else if (String(exp) === String(actual)) {
      matches.push(1);
    } else {
      mismatches.push({ fact_key: factKey, expected: exp, actual, within_tolerance: false });
    }
  }

  return {
    score: total === 0 ? 1 : matches.length / total,
    matches: matches.length,
    total,
    mismatches,
  };
}
```

**4. CLI runner — `scripts/golden-eval.ts`:**

```ts
// Usage: npx tsx scripts/golden-eval.ts <session_id> <ticker>
// Loads golden report for ticker, compares to session output, produces scorecard.
```

### Commit
`feat(quality-data): golden dataset framework with numeric scoring [finance-x-polish P5A]`

---

## FAZ P5B — A/B Testing Runner

### Görevler

**1. `backend/src/quality-data/ab-runner.ts`:**

```ts
export type ABConfig = {
  name: string;
  baseline: { agent_id: string; version: string; config_override?: any };
  candidate: { agent_id: string; version: string; config_override?: any };
  ticker_set: string[];
  runs_per_ticker: number;
};

export async function runABTest(config: ABConfig): Promise<ABReport> {
  const results: Array<{ ticker: string; baseline: any; candidate: any }> = [];

  for (const ticker of config.ticker_set) {
    for (let i = 0; i < config.runs_per_ticker; i++) {
      // Run baseline
      const baselineSession = await startAnalysisSession(ticker, 'standard_institutional', [], {
        override: config.baseline.config_override,
      });
      // Run candidate
      const candidateSession = await startAnalysisSession(ticker, 'standard_institutional', [], {
        override: config.candidate.config_override,
      });

      results.push({
        ticker,
        baseline: getSessionSummary(baselineSession),
        candidate: getSessionSummary(candidateSession),
      });
    }
  }

  return buildABReport(config, results);
}

type ABReport = {
  config: ABConfig;
  sample_size: number;
  metrics: {
    avg_duration_delta_pct: number;
    avg_cost_delta_pct: number;
    avg_coverage_delta: number;
    quality_win_rate: number;     // candidate > baseline
  };
  statistical_significance: {
    p_value: number;
    confident: boolean;
  };
  recommendation: 'promote_candidate' | 'keep_baseline' | 'needs_more_data';
};
```

### Commit
`feat(quality-data): A/B testing runner for agent/prompt changes [finance-x-polish P5B]`

---

## FAZ P5C — Synthetic Company Generator

### Görevler

**1. `scripts/synth_generator.py`:**

```python
"""
Synthetic company generator — edge case torture tests.
Gerçekçi görünen ama belirli edge case içeren sahte şirket verisi üretir.
"""
import json
import random
from dataclasses import dataclass

EDGE_CASES = {
    'holding_with_segment_conflict': {
        'sector': 'holding',
        'induced_issues': ['parent_consolidated_mismatch', 'segment_total_mismatch'],
    },
    'airline_missing_da': {
        'sector': 'aviation',
        'induced_issues': ['depreciation_null_in_cf', 'ebitda_lower_than_ebit'],
    },
    'steel_ias29_anomaly': {
        'sector': 'steel',
        'induced_issues': ['monetary_gain_50pct_of_ni', 'operating_margin_anomaly'],
    },
    'bank_nim_jump': {
        'sector': 'banking',
        'induced_issues': ['nim_yoy_doubled', 'unexplained_trading_gain'],
    },
    'exporter_fx_shock': {
        'sector': 'industrial',
        'induced_issues': ['fx_translation_gain_40pct', 'export_revenue_down_despite_try_weakness'],
    },
    'conflicting_disclosures': {
        'sector': 'any',
        'induced_issues': ['disclosure_1_says_X', 'disclosure_2_says_Y_on_same_metric'],
    },
}


def generate_company(case_id: str) -> dict:
    spec = EDGE_CASES[case_id]
    # Generate realistic-looking financial statements with induced issues
    # ...
    return {
        'synthetic_id': f'SYNTH_{case_id.upper()}',
        'sector': spec['sector'],
        'induced_issues': spec['induced_issues'],
        'financial_statements': _generate_statements(spec),
        'disclosures': _generate_disclosures(spec),
        'expected_agent_behavior': _expected_behavior(spec),
    }


def _generate_statements(spec): ...
def _generate_disclosures(spec): ...
def _expected_behavior(spec): ...


if __name__ == '__main__':
    for case in EDGE_CASES:
        output = generate_company(case)
        path = f'evals/synthetic/{case}.json'
        with open(path, 'w') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f'Generated: {path}')
```

**2. Test runner:**

```ts
// evals/synthetic/run_torture_tests.ts
// Her sentetik şirket için full pipeline çalıştır, agent'ların induced issue'ları doğru tespit ettiğini validate et
```

### Commit
`feat(quality-data): synthetic company generator (torture tests) [finance-x-polish P5C]`

---

# FAZ P6 — Production Hardening

## FAZ P6A — Secrets Management

### Görevler

**1. `backend/src/security/secrets.ts`:**

```ts
/**
 * Secrets vault integration.
 * Production'da env değil vault kullanılır.
 */

export interface SecretsProvider {
  get(key: string): Promise<string | null>;
}

export class EnvSecretsProvider implements SecretsProvider {
  async get(key: string): Promise<string | null> {
    return process.env[key] || null;
  }
}

export class OnePasswordCLIProvider implements SecretsProvider {
  async get(key: string): Promise<string | null> {
    const { execSync } = await import('node:child_process');
    try {
      const result = execSync(`op item get "${key}" --fields password`, { encoding: 'utf8' });
      return result.trim();
    } catch { return null; }
  }
}

export class HashiCorpVaultProvider implements SecretsProvider {
  constructor(private vaultUrl: string, private token: string) {}

  async get(key: string): Promise<string | null> {
    const res = await fetch(`${this.vaultUrl}/v1/secret/data/${key}`, {
      headers: { 'X-Vault-Token': this.token },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data?.data?.data?.value || null;
  }
}

let _provider: SecretsProvider | null = null;

export function getSecretsProvider(): SecretsProvider {
  if (_provider) return _provider;

  const mode = process.env.SECRETS_MODE || 'env';
  switch (mode) {
    case '1password': _provider = new OnePasswordCLIProvider(); break;
    case 'vault': _provider = new HashiCorpVaultProvider(process.env.VAULT_URL!, process.env.VAULT_TOKEN!); break;
    default: _provider = new EnvSecretsProvider();
  }
  return _provider;
}

export async function getSecret(key: string): Promise<string> {
  const value = await getSecretsProvider().get(key);
  if (!value) throw new Error(`Secret not found: ${key}`);
  return value;
}
```

**2. Boot-time secret loading:**

```ts
// backend/src/server.ts
import { getSecret } from './security/secrets.js';

async function loadSecrets() {
  process.env.ANTHROPIC_API_KEY = await getSecret('ANTHROPIC_API_KEY');
  process.env.OPENAI_API_KEY = await getSecret('OPENAI_API_KEY');
  // ...
}

await loadSecrets();  // Before server starts
```

### Commit
`feat(security): pluggable secrets provider (env/1password/vault) [finance-x-polish P6A]`

---

## FAZ P6B — Immutable Audit Log

### Görevler

**1. `backend/src/security/audit-log.ts`:**

```ts
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const AUDIT_LOG_DIR = './logs/audit';

export type AuditEvent = {
  id: string;
  timestamp: string;
  event_type: 'session_started' | 'session_completed' | 'qa_rejected' | 'human_override' | 'config_change' | 'secret_access' | 'session_failed';
  actor: string;
  target?: string;
  details: Record<string, unknown>;
  previous_hash: string;
  current_hash: string;
};

let _lastHash = '0000000000000000';

async function initAuditLog() {
  await fs.mkdir(AUDIT_LOG_DIR, { recursive: true });
  const todayFile = getTodayFile();
  try {
    const content = await fs.readFile(todayFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]);
      _lastHash = last.current_hash;
    }
  } catch { /* fresh file */ }
}

export async function recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'previous_hash' | 'current_hash'>): Promise<void> {
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  const content = JSON.stringify({ id, timestamp, ...event, previous_hash: _lastHash });
  const currentHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

  const fullEvent: AuditEvent = {
    id, timestamp, ...event,
    previous_hash: _lastHash,
    current_hash: currentHash,
  };

  const line = JSON.stringify(fullEvent) + '\n';
  await fs.appendFile(getTodayFile(), line, 'utf8');

  _lastHash = currentHash;
}

export async function verifyAuditChain(filePath: string): Promise<{ valid: boolean; firstInvalidLine?: number }> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);

  let expectedPrevHash = '0000000000000000';
  for (let i = 0; i < lines.length; i++) {
    const ev: AuditEvent = JSON.parse(lines[i]);
    if (ev.previous_hash !== expectedPrevHash) return { valid: false, firstInvalidLine: i };

    // Recompute current_hash and verify
    const recomputeContent = JSON.stringify({
      id: ev.id, timestamp: ev.timestamp, event_type: ev.event_type, actor: ev.actor,
      target: ev.target, details: ev.details, previous_hash: ev.previous_hash,
    });
    const recomputed = crypto.createHash('sha256').update(recomputeContent).digest('hex').slice(0, 16);
    if (recomputed !== ev.current_hash) return { valid: false, firstInvalidLine: i };

    expectedPrevHash = ev.current_hash;
  }

  return { valid: true };
}

function getTodayFile(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(AUDIT_LOG_DIR, `audit_${date}.jsonl`);
}

await initAuditLog();
```

**2. Wire to session lifecycle:**

```ts
await recordAuditEvent({
  event_type: 'session_started',
  actor: userId,
  target: ticker,
  details: { mode, session_id: sessionId },
});
```

### Commit
`feat(security): immutable hash-chained audit log [finance-x-polish P6B]`

---

## FAZ P6C — CI/CD Pipeline

### Görevler

**1. `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm test:run
        env:
          NODE_ENV: test

  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm install -g ajv-cli
      - run: |
          for schema in schemas/**/*.schema.json; do
            echo "Validating $schema"
            ajv compile -s "$schema"
          done

  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: |
          cd python-services
          uv sync
          uv run pytest

  regression-eval:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Run regression eval (5 golden samples)
        run: npx tsx scripts/regression-eval.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**2. `.github/workflows/release.yml`:**

Production deployment workflow, Docker build, push to registry.

### Commit
`feat(ops): CI/CD pipeline (GitHub Actions) [finance-x-polish P6C]`

---

## FAZ P6D — Health Checks + Metrics

### Görevler

**1. `backend/src/server.ts`'e ekle:**

```ts
import { breakers } from './reliability/circuit-breaker.js';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime_seconds: process.uptime() });
});

app.get('/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    qdrant: DOCUMENT_INTEL_ENABLED ? await checkQdrant() : 'disabled',
    anthropic: await checkAnthropic(),
    kap: breakers.kap.getStatus().state !== 'OPEN',
  };
  const allReady = Object.values(checks).every(v => v === true || v === 'disabled');
  res.status(allReady ? 200 : 503).json({ ready: allReady, checks });
});

app.get('/metrics', (req, res) => {
  // Prometheus format
  const activeSessions = db.prepare(`SELECT COUNT(*) as c FROM analysis_sessions WHERE status = 'running'`).get() as any;
  const failedToday = db.prepare(`SELECT COUNT(*) as c FROM analysis_sessions WHERE status LIKE '%failed%' AND created_at > date('now')`).get() as any;

  const metrics = [
    `# HELP finance_x_active_sessions Currently running analysis sessions`,
    `# TYPE finance_x_active_sessions gauge`,
    `finance_x_active_sessions ${activeSessions.c}`,
    ``,
    `# HELP finance_x_failed_sessions_today Sessions failed today`,
    `# TYPE finance_x_failed_sessions_today counter`,
    `finance_x_failed_sessions_today ${failedToday.c}`,
    ``,
    ...Object.values(breakers).flatMap(b => {
      const s = b.getStatus();
      return [
        `# HELP finance_x_circuit_breaker_open Circuit breaker state (0=closed, 1=open, 0.5=half_open)`,
        `# TYPE finance_x_circuit_breaker_open gauge`,
        `finance_x_circuit_breaker_open{name="${s.name}"} ${s.state === 'OPEN' ? 1 : s.state === 'HALF_OPEN' ? 0.5 : 0}`,
      ];
    }),
  ].join('\n');

  res.type('text/plain').send(metrics);
});
```

### Commit
`feat(ops): health checks + Prometheus metrics endpoint [finance-x-polish P6D]`

---

## FAZ P6E — Prompt Injection Defense

### Görevler

**1. `backend/src/security/prompt-injection.ts`:**

```ts
/**
 * Basic prompt injection detection.
 * Not 100% — deep defense gerekli ama bu first layer.
 */

const INJECTION_PATTERNS = [
  /ignore (previous|all|above) (instructions|prompts|rules)/i,
  /disregard .{0,30}(instructions|prompts|rules)/i,
  /you are now .{0,30}(different|new|unrestricted)/i,
  /system:\s/i,
  /<\|im_start\|>/i,
  /\[SYSTEM\]/i,
  /print (your|the) (system prompt|instructions)/i,
  /reveal .{0,20}(prompt|instructions|rules)/i,
  /forget everything/i,
  /new instructions:/i,
  /act as .{0,30}(admin|root|superuser)/i,
];

export function detectPromptInjection(userInput: string): {
  suspicious: boolean;
  patterns_matched: string[];
  sanitized: string;
} {
  const patternsMatched: string[] = [];
  let sanitized = userInput;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(userInput)) {
      patternsMatched.push(pattern.source);
      sanitized = sanitized.replace(pattern, '[REDACTED_INJECTION_ATTEMPT]');
    }
  }

  return {
    suspicious: patternsMatched.length > 0,
    patterns_matched: patternsMatched,
    sanitized,
  };
}

export function validateUserInput(input: {
  ticker: string;
  mode: string;
  layers?: string[];
  user_note?: string;
}): { valid: boolean; errors: string[]; sanitized: typeof input } {
  const errors: string[] = [];

  // Ticker: whitelist format
  if (!/^[A-Z]{3,6}$/.test(input.ticker)) errors.push('Invalid ticker format');

  // Mode: enum
  if (!['fast_screening', 'standard_institutional', 'deep_dive', 'event_flash'].includes(input.mode)) errors.push('Invalid mode');

  // User note: injection check
  let sanitizedNote = input.user_note || '';
  if (input.user_note) {
    const injection = detectPromptInjection(input.user_note);
    if (injection.suspicious) {
      errors.push(`Suspicious content in user_note: ${injection.patterns_matched.join(', ')}`);
      sanitizedNote = injection.sanitized;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: { ...input, user_note: sanitizedNote },
  };
}
```

**2. API endpoint'lerde kullan:**

```ts
app.post('/api/sessions', async (req, res) => {
  const validation = validateUserInput(req.body);
  if (!validation.valid) {
    await recordAuditEvent({
      event_type: 'session_failed',
      actor: req.user?.id || 'anonymous',
      details: { reason: 'validation_failed', errors: validation.errors },
    });
    return res.status(400).json({ errors: validation.errors });
  }
  // Use validation.sanitized
});
```

### Commit
`feat(security): prompt injection defense + input sanitization [finance-x-polish P6E]`

---

## FAZ P6F — SPK Compliance Reporter

### Görevler

**1. `backend/src/compliance/spk-compliance.ts`:**

```ts
/**
 * SPK (Türkiye Sermaye Piyasası Kurulu) compliance checks.
 * Rapor yayımlanmadan önce otomatik kontrol.
 */

export type SPKCheckResult = {
  passed: boolean;
  rule_id: string;
  rule_description: string;
  evidence?: string;
  suggested_fix?: string;
};

const SPK_RULES: Array<{ id: string; description: string; check: (html: string) => SPKCheckResult }> = [
  {
    id: 'SPK-001',
    description: 'Yatırım tavsiyesi dili kullanmamak (mutlaka yapın/almalısınız vb.)',
    check: (html) => {
      const prohibited = [
        /mutlaka (alın|satın|yatırım yapın)/i,
        /kesinlikle (alınmalı|satılmalı)/i,
        /garantili (kazan|kar)/i,
      ];
      const violations = prohibited.filter(p => p.test(html));
      return {
        passed: violations.length === 0,
        rule_id: 'SPK-001',
        rule_description: 'No direct investment advice language',
        evidence: violations.length > 0 ? `Matches: ${violations.map(v => v.source).join(', ')}` : undefined,
        suggested_fix: violations.length > 0 ? 'Replace with conditional language (örn: "pozitif sinyaller vardır")' : undefined,
      };
    },
  },
  {
    id: 'SPK-002',
    description: 'Geleceğe yönelik beyan uyarısı bulunmalı',
    check: (html) => {
      const hasForwardLookingDisclaimer = /geleceğe yönelik beyan/i.test(html) || /forward.?looking statements?/i.test(html);
      return {
        passed: hasForwardLookingDisclaimer,
        rule_id: 'SPK-002',
        rule_description: 'Forward-looking statements disclaimer required',
        suggested_fix: !hasForwardLookingDisclaimer ? 'Add section: "Geleceğe Yönelik Beyan Uyarısı"' : undefined,
      };
    },
  },
  {
    id: 'SPK-003',
    description: 'Finansal rakamlar kaynak göstermelidir',
    check: (html) => {
      // En az 10 tane [KAYNAK: ...] referansı bekliyoruz
      const sourceRefs = (html.match(/\[KAYNAK:[^\]]+\]/gi) || []).length;
      return {
        passed: sourceRefs >= 10,
        rule_id: 'SPK-003',
        rule_description: 'Financial figures must be sourced',
        evidence: `Found ${sourceRefs} source references`,
        suggested_fix: sourceRefs < 10 ? 'Add more source citations' : undefined,
      };
    },
  },
  {
    id: 'SPK-004',
    description: 'Etik disclaimer bölümü bulunmalı',
    check: (html) => {
      const hasEthics = /spk.{0,10}(uyarı|disclaimer)|etik disclaimer/i.test(html);
      return {
        passed: hasEthics,
        rule_id: 'SPK-004',
        rule_description: 'SPK ethics disclaimer section required',
      };
    },
  },
  {
    id: 'SPK-005',
    description: 'Analiz tarihi + versiyon açıkça belirtilmeli',
    check: (html) => {
      const hasDate = /\b(analiz\s*tarihi|rapor\s*tarihi)[\s:]*\d{4}-\d{2}-\d{2}/i.test(html);
      return {
        passed: hasDate,
        rule_id: 'SPK-005',
        rule_description: 'Report date must be explicit',
      };
    },
  },
  {
    id: 'SPK-006',
    description: 'Risk uyarısı bölümü (min 500 kelime)',
    check: (html) => {
      const riskSection = html.match(/<[^>]*>.*?riskler.*?<\/[^>]*>[\s\S]+?(?=<h|$)/i);
      const wordCount = riskSection ? riskSection[0].split(/\s+/).length : 0;
      return {
        passed: wordCount >= 500,
        rule_id: 'SPK-006',
        rule_description: 'Risk section minimum 500 words',
        evidence: `Risk section has ${wordCount} words`,
      };
    },
  },

  // ─────────────────────────────────────────────────────────────
  // EXECUTIVE CHECKLIST — Chairman/CFO/Board seviyesi sanity
  // ─────────────────────────────────────────────────────────────
  // Rapor publish edilmeden önce executive için kritik 5 soru:
  // thesis / valuation / risk / catalyst / why_now — hepsi EXPLICIT olmalı
  {
    id: 'SPK-EXEC-01',
    description: 'Investment thesis AÇIK ve executive seviyede belirtilmeli',
    check: (html) => {
      // Thesis section varlığı + yapısal işaretler
      const hasThesisSection = /(<h[1-4][^>]*>[^<]*(yatırım\s*tezi|investment\s*thesis|yatırım\s*görüşü)[^<]*<\/h[1-4]>)/i.test(html);
      const hasConclusionLanguage = /(tez[imiz]*|görüş[ümüz]*|(?:al|sat|tut)\s*(?:önerilir|tavsiye))/i.test(html);
      const passed = hasThesisSection && hasConclusionLanguage;
      return {
        passed,
        rule_id: 'SPK-EXEC-01',
        rule_description: 'Explicit investment thesis required',
        evidence: passed ? 'Thesis section + conclusion language found' : `section=${hasThesisSection}, language=${hasConclusionLanguage}`,
        suggested_fix: !passed ? 'Add dedicated "Yatırım Tezi" section with clear stance' : undefined,
      };
    },
  },
  {
    id: 'SPK-EXEC-02',
    description: 'Valuation sonucu (hedef fiyat + aralık) AÇIK belirtilmeli',
    check: (html) => {
      // Hedef fiyat rakamı + methodology referansı
      const hasTargetPrice = /(hedef\s*fiyat|target\s*price)[\s\S]{0,200}(?:\d{1,4}[,.]?\d*)\s*(?:TL|TRY|₺)/i.test(html);
      const hasRange = /(bear|baz|bull|boğa|ayı|base)[\s\S]{0,200}(?:\d{1,4}[,.]?\d*)/i.test(html);
      const hasMethodology = /(dcf|dfc|sotp|trading\s*comps|ev\/(?:ebitda|favök)|p\/e|f\/k)/i.test(html);
      const passed = hasTargetPrice && hasMethodology;
      return {
        passed,
        rule_id: 'SPK-EXEC-02',
        rule_description: 'Valuation result explicit (target price + methodology)',
        evidence: `target=${hasTargetPrice}, range=${hasRange}, method=${hasMethodology}`,
        suggested_fix: !passed ? 'Add explicit target price in TL + methodology (DCF/SOTP/Trading Comps)' : undefined,
      };
    },
  },
  {
    id: 'SPK-EXEC-03',
    description: 'Kritik riskler AÇIK listelenmeli (min 5 risk)',
    check: (html) => {
      // Risk bölümünde bullet/numbered list var mı?
      const riskSection = html.match(/<[^>]*>[^<]*risk[^<]*<\/[^>]*>[\s\S]+?(?=<h[1-4]|$)/i);
      if (!riskSection) return { passed: false, rule_id: 'SPK-EXEC-03', rule_description: 'Risk section missing' };

      const bullets = (riskSection[0].match(/<li[^>]*>|^\s*[-*•]\s/gm) || []).length;
      const passed = bullets >= 5;
      return {
        passed,
        rule_id: 'SPK-EXEC-03',
        rule_description: 'Critical risks explicit (minimum 5)',
        evidence: `Found ${bullets} risk items`,
        suggested_fix: !passed ? `Add more specific risks — ${5 - bullets} more needed` : undefined,
      };
    },
  },
  {
    id: 'SPK-EXEC-04',
    description: 'Katalizörler (catalyst) AÇIK ve zaman çizelgeli belirtilmeli',
    check: (html) => {
      const hasCatalystSection = /(<h[1-4][^>]*>[^<]*(katalizör|catalyst|tetikleyici|takip\s*edilecek)[^<]*<\/h[1-4]>)/i.test(html);
      const hasTimeline = /(202[5-9]|q[1-4]\s*202[5-9]|kısa\s*vade|orta\s*vade|uzun\s*vade|önümüzdeki)/i.test(html);
      const passed = hasCatalystSection && hasTimeline;
      return {
        passed,
        rule_id: 'SPK-EXEC-04',
        rule_description: 'Catalysts explicit with timeline',
        evidence: `section=${hasCatalystSection}, timeline=${hasTimeline}`,
        suggested_fix: !passed ? 'Add "Katalizörler / Takip Edilecekler" section with dated events' : undefined,
      };
    },
  },
  {
    id: 'SPK-EXEC-05',
    description: '"Why now" gerekçesi AÇIK belirtilmeli — neden şimdi bu analiz/tez?',
    check: (html) => {
      // "Why now" için işaretler: zamanlama açıklaması, yeni gelişme referansı, mevcut anın vurgulanması
      const patterns = [
        /neden\s*şimdi|why\s*now/i,
        /bu\s*(?:aşamada|noktada|dönemde)|mevcut\s*(?:görünüm|durum)/i,
        /son\s*(?:dönemde|gelişmeler|çeyrek)|(?:mevcut|güncel)\s*(?:fiyat|değerleme|çarpan)/i,
      ];
      const matchCount = patterns.filter(p => p.test(html)).length;
      const passed = matchCount >= 2;
      return {
        passed,
        rule_id: 'SPK-EXEC-05',
        rule_description: 'Timing rationale ("why now") explicit',
        evidence: `${matchCount}/3 timing signals found`,
        suggested_fix: !passed ? 'Add explicit timing rationale — why this analysis/thesis matters NOW' : undefined,
      };
    },
  },
];

export type SPKComplianceReport = {
  session_id: string;
  overall_passed: boolean;
  pass_count: number;
  fail_count: number;
  results: SPKCheckResult[];
  blocking_violations: SPKCheckResult[];
};

export function runSPKCompliance(sessionId: string, reportHtml: string): SPKComplianceReport {
  const results = SPK_RULES.map(rule => rule.check(reportHtml));
  const failed = results.filter(r => !r.passed);

  // Blocking: SPK core (yatırım tavsiyesi/disclaimer/kaynak/etik) + Executive checklist (thesis/valuation/risk/catalyst/why_now)
  const BLOCKING_RULES = [
    'SPK-001', 'SPK-002', 'SPK-003', 'SPK-004',           // Core SPK mandates
    'SPK-EXEC-01', 'SPK-EXEC-02', 'SPK-EXEC-03',          // Executive: thesis, valuation, risks
    'SPK-EXEC-04', 'SPK-EXEC-05',                          // Executive: catalyst, why_now
  ];
  const blocking = failed.filter(r => BLOCKING_RULES.includes(r.rule_id));

  return {
    session_id: sessionId,
    overall_passed: blocking.length === 0,
    pass_count: results.filter(r => r.passed).length,
    fail_count: failed.length,
    results,
    blocking_violations: blocking,
  };
}
```

**2. Delivery öncesi check:**

```ts
// COO delivery check öncesi
const spk = runSPKCompliance(sessionId, finalHtml);
persistSPKReport(sessionId, spk);

if (!spk.overall_passed) {
  // Revision needed
  await createEscalation(sessionId, 'quality_gate_block', 'P0',
    `SPK compliance failures: ${spk.blocking_violations.map(v => v.rule_id).join(', ')}`,
    ['final_summary', 'report_formatter']);
}
```

### Commit
`feat(compliance): SPK compliance reporter + executive checklist (thesis/valuation/risk/catalyst/why_now) [finance-x-polish P6F]`

---

# FAZ P7 — UX & Delivery

## FAZ P7A — Real-time Streaming (SSE)

### Görevler

**1. `backend/src/streaming/sse.ts`:**

```ts
/**
 * Server-Sent Events for real-time session progress.
 */
import type { Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { bus } from '../event-bus.js';  // REFACTOR'da eklenen

const sessionStreams: Map<string, Set<Response>> = new Map();

export function handleSessionSSE(req: Request, res: Response) {
  const { sessionId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sessionStreams.has(sessionId)) sessionStreams.set(sessionId, new Set());
  sessionStreams.get(sessionId)!.add(res);

  sendSSE(res, 'connected', { session_id: sessionId });

  req.on('close', () => {
    sessionStreams.get(sessionId)?.delete(res);
  });
}

function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Bus subscribers
bus.on('agent_started', (ev: any) => broadcastToSession(ev.session_id, 'agent_started', ev));
bus.on('agent_completed', (ev: any) => broadcastToSession(ev.session_id, 'agent_completed', ev));
bus.on('sub_agent_started', (ev: any) => broadcastToSession(ev.session_id, 'sub_agent_started', ev));
bus.on('qa_decision', (ev: any) => broadcastToSession(ev.session_id, 'qa_decision', ev));
bus.on('session_completed', (ev: any) => broadcastToSession(ev.session_id, 'session_completed', ev));

function broadcastToSession(sessionId: string, event: string, data: any) {
  const streams = sessionStreams.get(sessionId);
  if (!streams) return;
  for (const res of streams) sendSSE(res, event, data);
}
```

**2. Route:**

```ts
app.get('/api/sessions/:sessionId/stream', handleSessionSSE);
```

**3. Agent-runner event emission:**

```ts
bus.emitEvent({ type: 'agent_started', session_id: sessionId, agent_id: agentId, ticker });
// ...
bus.emitEvent({ type: 'agent_completed', session_id: sessionId, agent_id: agentId, duration_ms: elapsed });
```

**4. Dashboard React hook:**

```tsx
// dashboard/src/hooks/useSessionStream.ts
export function useSessionStream(sessionId: string) {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    const es = new EventSource(`/api/sessions/${sessionId}/stream`);
    ['agent_started', 'agent_completed', 'sub_agent_started', 'qa_decision', 'session_completed'].forEach(eventName => {
      es.addEventListener(eventName, (e: any) => {
        setEvents(prev => [...prev, { type: eventName, data: JSON.parse(e.data), timestamp: Date.now() }]);
      });
    });
    return () => es.close();
  }, [sessionId]);
  return events;
}
```

### Commit
`feat(ux): real-time SSE streaming for session progress [finance-x-polish P7A]`

---

## FAZ P7B — Observable DAG Visualizer

### Görevler

**1. `dashboard/src/components/SessionDAG.tsx`:**

React component — session'ın agent + sub-agent DAG'ını real-time render eder. Canlı gantt chart.

```tsx
// Pseudocode — her agent node, renkle status (pending/running/completed/failed)
// Sub-agent'lar parent'ın altında expansion'da
// Animated state transitions
```

**2. API endpoint — `GET /api/sessions/:id/dag`:**

Session execution DAG'ını JSON olarak döner.

### Commit
`feat(ux): observable DAG visualizer + live status [finance-x-polish P7B]`

---

## FAZ P7C — Replay/Debug Tool

### Görevler

**1. `backend/src/dev-tools/replay.ts`:**

```ts
/**
 * Session replay — given session, step-by-step walkthrough.
 */

export async function replaySession(sessionId: string): Promise<ReplayReport> {
  const agentRuns = db.prepare(`
    SELECT * FROM agent_runs WHERE session_id = ? ORDER BY started_at ASC
  `).all(sessionId) as any[];

  const subAgentRuns = db.prepare(`
    SELECT * FROM sub_agent_runs WHERE parent_run_id IN (
      SELECT id FROM agent_runs WHERE session_id = ?
    ) ORDER BY started_at ASC
  `).all(sessionId) as any[];

  const escalations = db.prepare(`SELECT * FROM escalations WHERE session_id = ?`).all(sessionId);
  const contradictions = db.prepare(`SELECT * FROM contradictions WHERE session_id = ?`).all(sessionId);

  return {
    session_id: sessionId,
    timeline: mergeTimeline(agentRuns, subAgentRuns),
    escalations,
    contradictions,
    fact_pack_snapshots: getFactPackSnapshots(sessionId),
    bottleneck: findBottleneck(agentRuns),
  };
}
```

**2. CLI:**

```bash
npx tsx scripts/replay.ts <session_id>  # Terminal-friendly report
npx tsx scripts/replay.ts <session_id> --export replay.html  # HTML export
```

### Commit
`feat(dev-tools): session replay + bottleneck analysis [finance-x-polish P7C]`

---

## FAZ P7D — Explainability Panel

### Görevler

**1. Dashboard component — her metric/conclusion için "Why?" butonu:**

```tsx
// dashboard/src/components/ExplainabilityPanel.tsx
export function ExplainabilityPanel({ sessionId, factKey }: Props) {
  const [lineage, setLineage] = useState<LineageTrail | null>(null);

  useEffect(() => {
    fetch(`/api/lineage/${sessionId}/${factKey}`).then(r => r.json()).then(setLineage);
  }, [sessionId, factKey]);

  if (!lineage) return null;

  return (
    <div className="explainability-panel">
      <h3>Why: {factKey}</h3>
      <div>Computed by: {lineage.computed_by}</div>
      <div>Formula: {lineage.formula}</div>
      <div>Sources:</div>
      <ul>
        {lineage.root_sources.map(s => (
          <li key={s.doc_id}>{s.doc_id} p.{s.page}</li>
        ))}
      </ul>
      <div>Confidence: {lineage.confidence.tier}</div>
    </div>
  );
}
```

### Commit
`feat(ux): explainability panel (why each number) [finance-x-polish P7D]`

---

## FAZ P7E — Analyst Review Bundle

**Amaç:** Block olan veya kalitesiz session'lar için otomatik debug paketi. Analyst "neden block oldu?" sorusunu dağınık tablolar arasında aramak yerine tek bundle ile görür.

### Görevler

**1. `backend/src/ux/analyst-review-bundle.ts`:**

```ts
/**
 * Analyst Review Bundle — auto-generated debug package for problem sessions.
 * Triggered when: session BLOCKED / REVISION_REQUESTED / final_score < 70.
 */
import { getFactPack } from '../fact-layer/store.js';
import { getSessionTrace } from '../execution-trace.js';
import { listLowConfidenceFacts } from '../fact-layer/store.js';

export type AnalystReviewBundle = {
  session_id: string;
  ticker: string;
  status: string;
  why_flagged: string;
  summary_5_lines: string[];         // Max 5 satır özet

  blockers: Array<{
    authority: string;               // hangi authority block etti
    reason: string;
    affected_facts: string[];
    suggested_action: string;
  }>;

  disputed_facts: Array<{
    fact_key: string;
    candidate_values: Array<{ agent: string; value: any; confidence: number }>;
    canonical_chosen?: any;
    arbitration_reason?: string;
  }>;

  missing_citations: Array<{
    fact_key: string;
    fact_value: any;
    suggested_doc: string;           // Document intel'den öneri
  }>;

  most_problematic_agent: {
    agent_id: string;
    failure_count: number;
    retry_count: number;
    example_errors: string[];
  };

  suggested_next_actions: string[];  // prioritized list

  critical_documents: Array<{
    doc_id: string;
    page: number;
    relevance: number;
    snippet: string;
  }>;

  generated_at: string;
};

export async function generateAnalystReviewBundle(sessionId: string): Promise<AnalystReviewBundle> {
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
  const trace = getSessionTrace(sessionId);
  const factPack = getFactPack(sessionId);

  // Block'ları trace'ten çıkar
  const blockSteps = (trace as any[]).filter(s => s.decision === 'block');
  const blockers = blockSteps.map(s => ({
    authority: s.step_type,
    reason: s.reason,
    affected_facts: JSON.parse(s.affected_entities || '[]'),
    suggested_action: mapActionForAuthority(s.step_type, s.reason),
  }));

  // Disputed facts — truth_decisions tablosundan
  const truthDecisions = db.prepare(`
    SELECT * FROM truth_decisions WHERE session_id = ?
  `).all(sessionId) as any[];

  const disputed = truthDecisions.map(td => ({
    fact_key: td.fact_key,
    candidate_values: JSON.parse(td.rejected_candidates || '[]'),
    canonical_chosen: td.canonical_value,
    arbitration_reason: td.decision_reason,
  }));

  // Missing citations
  const citationReport = db.prepare(`SELECT violations_json FROM citation_reports WHERE session_id = ?`).get(sessionId) as any;
  const violations = citationReport ? JSON.parse(citationReport.violations_json) : [];
  const missing = violations.map((v: any) => ({
    fact_key: v.fact_key,
    fact_value: v.fact_value,
    suggested_doc: 'Run knowledge_base_agent query for this fact',
  }));

  // Most problematic agent
  const agentRuns = db.prepare(`
    SELECT agent_id, COUNT(*) as runs, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as fails
    FROM agent_runs WHERE session_id = ? GROUP BY agent_id ORDER BY fails DESC LIMIT 1
  `).get(sessionId) as any;

  // 5-line summary (LLM assisted, optional)
  const summary = build5LineSummary(session, blockers, disputed, missing);

  // Critical docs from evidence
  const evidenceRows = db.prepare(`
    SELECT DISTINCT doc_id, page, relevance, snippet FROM evidence_chunks
    WHERE session_id = ? ORDER BY relevance DESC LIMIT 5
  `).all(sessionId) as any[];

  // Suggested next actions — priority ordered
  const nextActions: string[] = [];
  if (missing.length > 0) {
    nextActions.push(`Rerun knowledge_base_agent for ${missing.length} uncited critical facts`);
  }
  if (disputed.length > 3) {
    nextActions.push(`Manual review of ${disputed.length} disputed facts — truth_decisions may be wrong`);
  }
  if (agentRuns?.fails > 2) {
    nextActions.push(`Investigate ${agentRuns.agent_id} — ${agentRuns.fails} failures`);
  }
  if (blockers.length === 0 && session.final_quality_score < 70) {
    nextActions.push(`No hard blocks but quality low — check coverage_map in QA report`);
  }

  const bundle: AnalystReviewBundle = {
    session_id: sessionId,
    ticker: session.ticker,
    status: session.status,
    why_flagged: session.error_message || `final_score=${session.final_quality_score}`,
    summary_5_lines: summary,
    blockers,
    disputed_facts: disputed,
    missing_citations: missing,
    most_problematic_agent: agentRuns ? {
      agent_id: agentRuns.agent_id,
      failure_count: agentRuns.fails,
      retry_count: agentRuns.runs - 1,
      example_errors: [],  // Agent-specific error extraction
    } : { agent_id: 'none', failure_count: 0, retry_count: 0, example_errors: [] },
    suggested_next_actions: nextActions,
    critical_documents: evidenceRows.map(e => ({
      doc_id: e.doc_id, page: e.page, relevance: e.relevance, snippet: e.snippet,
    })),
    generated_at: new Date().toISOString(),
  };

  persistBundle(bundle);
  return bundle;
}

function mapActionForAuthority(authority: string, reason: string): string {
  switch (authority) {
    case 'citation_check': return 'Add source references for missing critical facts';
    case 'qa_decision': return 'Run revision round with updated inputs';
    case 'coverage_check': return 'Rerun affected agent with expanded input';
    case 'spk_check': return 'Manual compliance review';
    default: return 'Escalate to manual review';
  }
}

function build5LineSummary(session: any, blockers: any[], disputed: any[], missing: any[]): string[] {
  return [
    `Session ${session.id.slice(0, 8)} for ${session.ticker} ended with status: ${session.status}.`,
    `Final quality score: ${session.final_quality_score ?? 'N/A'}/100.`,
    `Blocked by: ${blockers.map(b => b.authority).join(', ') || 'none'}.`,
    `${disputed.length} disputed facts, ${missing.length} missing citations.`,
    `Recommended action: ${blockers[0]?.suggested_action || 'manual review'}.`,
  ];
}

function persistBundle(bundle: AnalystReviewBundle): void {
  db.prepare(`
    INSERT OR REPLACE INTO analyst_review_bundles (session_id, bundle_json, generated_at)
    VALUES (?, ?, ?)
  `).run(bundle.session_id, JSON.stringify(bundle), bundle.generated_at);
}
```

**2. DB:**

```sql
CREATE TABLE analyst_review_bundles (
  session_id TEXT PRIMARY KEY,
  bundle_json TEXT NOT NULL,
  generated_at TEXT NOT NULL
);
```

**3. Auto-trigger — session end:**

```ts
// orchestrator.ts, session completion
const needsBundle =
  session.status === 'citation_blocked' ||
  session.status === 'qa_failed' ||
  session.status === 'quality_blocked' ||
  (session.final_quality_score && session.final_quality_score < 70);

if (needsBundle) {
  const bundle = await generateAnalystReviewBundle(sessionId);
  bus.emitEvent({ type: 'analyst_review_bundle_ready', session_id: sessionId, bundle_preview: bundle.summary_5_lines });
}
```

**4. Dashboard — `/sessions/:id/review-bundle` endpoint + UI panel.**

**5. CLI:**

```bash
npx tsx scripts/analyst-bundle.ts <session_id>
# Terminal-friendly output for quick triage
```

### Commit
`feat(ux): analyst review bundle for blocked/low-quality sessions [finance-x-polish P7E]`

---

# FAZ P8 — Future Roadmap + Final Documentation

## Görevler

**1. `docs/ROADMAP.md` oluştur:**

```markdown
# Finance-X Roadmap

## ✅ Completed (Current State)
- REFACTOR: memory, feedback, QA gate
- UPGRADE: skills, document intel, research agents
- SUBAGENT: 24 sub-agent worker graph
- POLISH: fact layer, quality OS, reliability, production hardening

## 🔮 Tier 2 — Feature Expansion (Next 6 months)

### Portfolio Mode
- Multi-ticker aggregated analysis
- Cross-correlation risk metrics
- Portfolio-level reports

### Backtesting Engine
- Historical session → current state comparison
- Prediction accuracy metrics
- Auto lesson extraction

### Alerting System
- Rule-based alerts (KAP material, price deviation, earnings surprise)
- Slack/email integration
- Alert fatigue management

### Natural Language Query Interface
- Dashboard chat
- CEO agent for natural queries
- Streaming responses

### Analyst Collaboration
- Real-time collaboration
- Comment threads on report sections
- Approval workflow

## 🌟 Tier 3 — Strategic (6-12 months)

### Fine-tuning
- Domain-specific Turkish financial LLM
- From historical gold-standard reports

### Ensemble Decision Making
- Critical decisions (BUY/SELL, target price) use 3 models
- Confidence-weighted voting

### Self-Improving Loop
- Nightly pattern detection
- Auto rule generation with A/B validation

### Multi-Modal Support
- Chart → data extraction (vision model)
- Logo/brand extraction

## 🔒 Compliance Roadmap

### KVKK / GDPR
- Data retention policy
- Right to erasure
- Consent management

### Multi-Tenancy
- Tenant isolation
- Per-tenant memory + feedback loop
- Chinese Wall

## Governance
- ADR (Architecture Decision Records) in docs/adr/
- Quarterly architecture review
```

**2. `docs/ARCHITECTURE.md` güncelle:**

Tüm katmanları gösteren genel architecture diagramı. Module responsibility matrix.

**3. `README.md` final update:**

Yeni bölümler: Quality OS, Fact Layer, Reliability, Production Hardening. Quick-start guide for new contributors.

### Final Commit
`docs(roadmap): add Tier 2/3 roadmap + update ARCHITECTURE.md [finance-x-polish P8]`

---

# FAZ P9 — Activation Governor Layer (SON KATMAN)

**Amaç:** Her session'da tüm agent + sub-agent + validator + quality layer **aynı anda** çalışmasın. Session kompleksitesine göre katmanları akıllı seç → kaliteyi düşürmeden latency + cost optimize et.

**Bu SON ek katmandır.** Bu noktadan sonra over-engineering BAŞLAMAYACAK — yeni büyük feature yok, mevcut katmanlar kontrollü biçimde aktifleştiriliyor. Kod sade kalsın, mevcut fazlar ağırlaştırılmasın.

**Default:** `ACTIVATION_GOVERNOR_ENABLED=false` — mevcut davranış korunur, opt-in.

## Görevler

**1. `backend/src/activation-governor/complexity-scorer.ts`:**

```ts
/**
 * Session complexity scoring.
 * Ticker + context'ten 5 boyutta complexity skorla, toplam 0-100.
 */
import { getSector } from '../sector-registry.js';
import { db } from '../db.js';

export type ComplexityDimensions = {
  sector_complexity: number;           // 0-20
  company_structure_complexity: number; // 0-20 (holding vs single)
  disclosure_density: number;          // 0-20
  valuation_complexity: number;        // 0-20
  contradiction_likelihood: number;    // 0-20
};

export type ComplexityScore = {
  ticker: string;
  total: number;                       // 0-100
  dimensions: ComplexityDimensions;
  explanation: string[];
};

// Sector base complexity — domain knowledge'dan kalibre
const SECTOR_COMPLEXITY: Record<string, number> = {
  holding: 20,                  // En karmaşık: multiple segments
  banking: 18,                  // NIM, CET1, regulatory
  aviation: 15,                 // EBITDAR, IFRS 16, fuel hedging
  refinery: 14,                 // Crack spread, commodity exposure
  steel: 12,                    // HRC transmission, CBAM
  defense_electronics: 12,      // Backlog, long-cycle
  telecom: 10,                  // ARPU, 5G capex
  insurance: 13,
  retail: 8,
  automotive: 10,
  food: 6,
  glass_construction: 7,
  energy_distribution: 9,
};

export async function scoreComplexity(ticker: string): Promise<ComplexityScore> {
  const dimensions: ComplexityDimensions = {
    sector_complexity: 0,
    company_structure_complexity: 0,
    disclosure_density: 0,
    valuation_complexity: 0,
    contradiction_likelihood: 0,
  };
  const explanation: string[] = [];

  // 1. Sector complexity
  const sector = getSector(ticker) || 'unknown';
  dimensions.sector_complexity = SECTOR_COMPLEXITY[sector] ?? 10;
  explanation.push(`Sector ${sector}: ${dimensions.sector_complexity}/20`);

  // 2. Company structure — holding/multi-segment = high
  if (sector === 'holding') {
    dimensions.company_structure_complexity = 20;
    explanation.push('Holding structure: +20 (multi-segment)');
  } else if (sector === 'banking' || sector === 'insurance') {
    dimensions.company_structure_complexity = 14;
    explanation.push(`Regulated ${sector}: +14`);
  } else {
    dimensions.company_structure_complexity = 6;
    explanation.push('Single business: +6');
  }

  // 3. Disclosure density — son 90 gün KAP bildirimi sayısı
  const recent = db.prepare(`
    SELECT COUNT(*) as c FROM disclosures
    WHERE ticker = ? AND disclosure_date > date('now', '-90 days')
  `).get(ticker) as any;
  const disclosureCount = recent?.c || 0;
  if (disclosureCount > 30) {
    dimensions.disclosure_density = 20;
    explanation.push(`${disclosureCount} disclosures in 90d: +20 (high activity)`);
  } else if (disclosureCount > 15) {
    dimensions.disclosure_density = 12;
    explanation.push(`${disclosureCount} disclosures in 90d: +12`);
  } else {
    dimensions.disclosure_density = 5;
    explanation.push(`${disclosureCount} disclosures in 90d: +5 (normal)`);
  }

  // 4. Valuation complexity — SOTP gereken yapılar yüksek
  if (sector === 'holding') {
    dimensions.valuation_complexity = 20;
    explanation.push('SOTP required: +20');
  } else if (sector === 'banking') {
    dimensions.valuation_complexity = 16;
    explanation.push('Bank multi-methodology: +16');
  } else if (['aviation', 'refinery', 'defense_electronics'].includes(sector)) {
    dimensions.valuation_complexity = 12;
    explanation.push(`Cyclical/special ${sector}: +12`);
  } else {
    dimensions.valuation_complexity = 7;
    explanation.push('Standard DCF + comps: +7');
  }

  // 5. Contradiction likelihood — IAS 29 yüksek inflation + multi-segment
  // Türkiye için baseline +8 (IAS 29 aktif)
  let contraction = 8;
  if (sector === 'holding') { contraction += 10; explanation.push('Holding IAS29×segments: +10 contradiction risk'); }
  if (['banking', 'insurance'].includes(sector)) { contraction += 4; }
  dimensions.contradiction_likelihood = Math.min(20, contraction);
  explanation.push(`Contradiction likelihood: ${dimensions.contradiction_likelihood}/20`);

  const total = Object.values(dimensions).reduce((a, b) => a + b, 0);

  return { ticker, total, dimensions, explanation };
}
```

**2. `backend/src/activation-governor/profile-selector.ts`:**

```ts
/**
 * Complexity score → execution profile selection.
 * LIGHT / STANDARD / FULL / INSTITUTIONAL
 */
import type { ComplexityScore } from './complexity-scorer.js';

export type ExecutionProfile = 'LIGHT' | 'STANDARD' | 'FULL' | 'INSTITUTIONAL';

export type ActivationPlan = {
  profile: ExecutionProfile;
  complexity_score: number;
  why_selected: string;

  // Agent aktivasyonları
  required_agents: string[];
  optional_agents: string[];
  skipped_agents: string[];

  // Sub-agent aktivasyonları
  required_sub_agents: string[];
  skipped_sub_agents: string[];

  // Quality layer aktivasyonları
  enable_truth_arbitration: boolean;
  enable_citation_enforcement: boolean;
  enable_contradiction_full_scan: boolean;        // basic check her zaman, full scan optional
  enable_chairman_questions: boolean;
  enable_full_quality_governor: boolean;
  enable_deep_shadow_compare: boolean;

  skipped_layers: string[];
  token_budget: number;                   // NEW: cumulative session token cap
  estimated_cost_usd: number;
  estimated_latency_seconds: number;
};

/**
 * SESSION CLASSIFIER — Kullanıcı isteğini sınıflandırır.
 * Activation Governor'a input olarak girer → gereksiz ağır koşuları önler.
 */
export type SessionClass = {
  type: 'full_institutional' | 'delta_update' | 'event_flash' | 'earnings_preview' | 'valuation_refresh' | 'unspecified';
  confidence: number;       // 0-1
  signals: string[];        // Hangi keyword/pattern classification'a yol açtı
};

export function classifySession(userRequest: string | undefined, ticker: string): SessionClass {
  // Eğer user request yoksa (API-only call) → default full_institutional
  if (!userRequest || userRequest.trim().length === 0) {
    return {
      type: 'unspecified',
      confidence: 0,
      signals: ['no user request provided'],
    };
  }

  const text = userRequest.toLowerCase();
  const signals: string[] = [];

  // Event Flash patterns — "acil", "yeni bildirim", "yeni haber"
  if (/\b(yeni|acil|flash|breaking|just|şimdi)\s+(disclosure|bildirim|haber|event|olay|announcement|kap)/i.test(text) ||
      /\b(material\s+event|önemli\s+gelişme|material\s+disclosure)/i.test(text)) {
    signals.push('event_flash keywords');
    return { type: 'event_flash', confidence: 0.9, signals };
  }

  // Earnings Preview — "kazanç öncesi", "sonuç beklentisi", "önce"
  if (/\b(kazanç|earnings|finansal\s+sonuç|quarterly\s+result|çeyrek\s+sonuç)\s+(önce|preview|before|expectation|beklenti)/i.test(text) ||
      /\b(Q[1-4]\s+önce|earnings\s+call\s+önce)/i.test(text)) {
    signals.push('earnings_preview keywords');
    return { type: 'earnings_preview', confidence: 0.85, signals };
  }

  // Valuation Refresh — "hedef fiyat güncel", "değerleme", "fiyat değişti"
  if (/\b(hedef\s+fiyat|target\s+price|valuation)\s+(güncel|refresh|update|yenile)/i.test(text) ||
      /\b(fiyat\s+değişti|price\s+changed|valuation\s+only)/i.test(text) ||
      /\b(sadece\s+değerleme|only\s+valuation)/i.test(text)) {
    signals.push('valuation_refresh keywords');
    return { type: 'valuation_refresh', confidence: 0.85, signals };
  }

  // Delta Update — "delta", "kısa güncelleme", "update", "sadece yenilikler"
  if (/\b(delta|kısa\s+güncelleme|short\s+update|quick\s+update|incremental)/i.test(text) ||
      /\b(sadece\s+yeni|only\s+new|just\s+updates|son\s+değişiklik)/i.test(text)) {
    signals.push('delta_update keywords');
    return { type: 'delta_update', confidence: 0.85, signals };
  }

  // Full Institutional — "tam analiz", "kurumsal rapor", "deep dive", "12 bölüm"
  if (/\b(tam\s+analiz|full\s+analysis|deep\s+dive|kurumsal\s+rapor|institutional\s+report|12\s+bölüm)/i.test(text) ||
      /\b(comprehensive|detaylı\s+analiz|full\s+report)/i.test(text)) {
    signals.push('full_institutional keywords');
    return { type: 'full_institutional', confidence: 0.95, signals };
  }

  // Default — user request var ama net pattern yok
  signals.push('no clear pattern, defaulting to full_institutional');
  return { type: 'full_institutional', confidence: 0.3, signals };
}

export function selectProfile(complexity: ComplexityScore, mode: string, sessionClass?: SessionClass): ActivationPlan {
  const total = complexity.total;
  let profile: ExecutionProfile;
  let why: string;

  // Profile selection
  if (total <= 30) {
    profile = 'LIGHT';
    why = `Low complexity (${total}/100) — simple structure, minimal regulatory, single business.`;
  } else if (total <= 55) {
    profile = 'STANDARD';
    why = `Medium complexity (${total}/100) — typical BIST analysis.`;
  } else if (total <= 80) {
    profile = 'FULL';
    why = `High complexity (${total}/100) — multi-segment or cyclical sector, material IAS 29 impact likely.`;
  } else {
    profile = 'INSTITUTIONAL';
    why = `Very high complexity (${total}/100) — holding/banking with peak disclosure activity, all quality layers required.`;
  }

  // Mode override — deep_dive her zaman minimum STANDARD
  if (mode === 'deep_dive' && profile === 'LIGHT') {
    profile = 'STANDARD';
    why += ' | Mode=deep_dive upgraded LIGHT→STANDARD.';
  }

  // Mode override — fast_screening her zaman maximum STANDARD (kullanıcı hızlı istedi)
  if (mode === 'fast_screening' && (profile === 'FULL' || profile === 'INSTITUTIONAL')) {
    profile = 'STANDARD';
    why += ' | Mode=fast_screening downgraded → STANDARD.';
  }

  return buildPlan(profile, complexity, why);
}

/**
 * CORE PROTECTED AGENTS — Hiçbir profile ve hiçbir mode altında disable edilemez.
 * LIGHT mode bile bunlar çalışmalı — yoksa rapor "boş" döner, analytical value yok.
 */
const CORE_PROTECTED_AGENTS = [
  'data_collection',
  'parse_standardization',
  'reconciliation',
  'financial_analysis',          // numeric core — asla kapatılamaz
  'sector_competition',           // peer context — LIGHT'ta bile basic version
  'valuation_agent',              // target price — her session'ın kalbi
  'macro_analysis',               // macro context — inflation/rate sensitivity
  'final_summary',
  'report_formatter',
] as const;

/**
 * TOKEN BUDGET ENFORCEMENT — v2 (kalibre edilmiş, non-blocking default)
 *
 * Ana felsefe: hard_stop SADECE runaway/bug durumunda tetiklenir.
 * Normal analytical workload (910k+ token olabilir) kesinlikle bloklanmaz.
 *
 * Limits cumulative session tokens (tüm agent + sub-agent LLM çağrılarının toplamı).
 * Tek LLM call context limit değil — session boyunca birikim.
 *
 * v1→v2 değişiklik: limits 3x yükseldi, 4 tier action.
 * Gerçek kullanım verisi: FULL session ~910k-1.5M normal aralık.
 */
const TOKEN_BUDGETS: Record<ExecutionProfile, number> = {
  LIGHT:          500_000,    // ~10-15 LLM call, minimal scope
  STANDARD:       1_500_000,  // ~20-30 LLM call, typical BIST
  FULL:           3_000_000,  // ~40-60 LLM call, multi-sub-agent, full governance
  INSTITUTIONAL:  5_000_000,  // ~70-100 LLM call, chairman + deep research
};

export function getTokenBudget(profile: ExecutionProfile): number {
  return TOKEN_BUDGETS[profile];
}

/**
 * 4-tier action logic. Hard stop SADECE 2x budget aşımında (bug indicator).
 * Normal workload için action = 'continue' veya 'alarm_only'.
 *
 * Calibration note: Bu sayılar ilk tahmin. Block G (G3 drift monitor) aktifleştikten
 * sonra 20-30 session'ın gerçek total_tokens verisine göre düzeltilir:
 *   new_budget = max(avg_observed × 1.5, current_budget)
 * Kalibrasyon sonucu budget küçülmez — yalnızca yükselir.
 */
export function checkTokenBudget(sessionId: string, used: number, profile: ExecutionProfile): {
  budget: number;
  used_pct: number;
  action: 'continue' | 'alarm_only' | 'reduce_optional' | 'hard_stop';
  disabled_layers?: string[];
  reason?: string;
} {
  const budget = getTokenBudget(profile);
  const pct = used / budget;

  // < 100%: normal
  if (pct < 1.0) return { budget, used_pct: pct, action: 'continue' };

  // 100-150%: soft alarm, devam et
  if (pct < 1.5) {
    return {
      budget, used_pct: pct, action: 'alarm_only',
      reason: `Budget %${Math.round(pct * 100)} — log only, analytical workload devam ediyor`,
    };
  }

  // 150-200%: opsiyonelleri kapat (ama CORE_PROTECTED_AGENTS asla)
  if (pct < 2.0) {
    return {
      budget, used_pct: pct, action: 'reduce_optional',
      disabled_layers: [
        'chairman_questions',
        'esg_agent',
        'sentiment_news_agent',
        'external_research_agent',
        'synthetic_company_generator',
        'deep_shadow_compare',
      ],
      reason: `Budget %${Math.round(pct * 100)} — opsiyonel katmanlar kapatıldı`,
    };
  }

  // ≥ 200%: hard stop — bu artık runaway/bug göstergesi
  return {
    budget, used_pct: pct, action: 'hard_stop',
    reason: `Budget %${Math.round(pct * 100)} — runaway detection, session terminated`,
  };
}

function buildPlan(profile: ExecutionProfile, complexity: ComplexityScore, why: string): ActivationPlan {
  // Base: her profilde çalışan core agent'lar
  // NOTE: CORE_PROTECTED_AGENTS her profilde dahil; aşağıdaki coreAgents bu liste ile uyumlu.
  const coreAgents = [
    'ceo', 'coo', 'data_collection', 'parse_standardization',
    'reconciliation', 'context_extraction', 'financial_analysis',
    'sector_competition', 'valuation_agent', 'macro_analysis',   // NEW: moved to core
    'qa_review', 'final_summary', 'report_formatter',
  ];

  switch (profile) {
    case 'LIGHT':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: coreAgents,  // NOW INCLUDES valuation + sector + macro
        optional_agents: [],
        skipped_agents: [
          // NOT: valuation_agent, sector_competition, macro_analysis ARTIK skip edilmez
          // (Light Mode Core Protection — ChatGPT #7)
          'esg_agent', 'sentiment_news_agent', 'analyst_consensus_agent',
          'technical_analysis', 'event_impact_mapper', 'strategic_synthesis',
          'external_research_agent',
        ],
        required_sub_agents: [],  // Sub-agent pattern LIGHT'ta kapalı
        skipped_sub_agents: ['*'],
        enable_truth_arbitration: false,
        enable_citation_enforcement: false,
        enable_contradiction_full_scan: false,
        enable_chairman_questions: false,
        enable_full_quality_governor: false,
        enable_deep_shadow_compare: false,
        skipped_layers: [
          'truth_arbitration', 'citation_enforcement', 'contradiction_full_scan',
          'chairman_questions', 'full_quality_governor', 'shadow_compare',
          // NOT: valuation_agent, sector_competition, macro_analysis ARTIK skipped_layers'da DEĞİL
        ],
        token_budget: getTokenBudget(profile),  // NEW
        estimated_cost_usd: 0.55,   // slightly higher — core agents dahil
        estimated_latency_seconds: 520,
      };

    case 'STANDARD':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [
          ...coreAgents,
          'macro_analysis', 'sector_competition', 'valuation_agent',
          'technical_analysis', 'strategic_synthesis',
        ],
        optional_agents: ['event_impact_mapper', 'sentiment_news_agent'],
        skipped_agents: ['esg_agent', 'analyst_consensus_agent', 'external_research_agent'],
        required_sub_agents: [
          'fa_profitability', 'fa_working_capital', 'fa_leverage_liquidity',
          'fa_cash_flow',  // fa_sector_kpi sadece FULL+
        ],
        skipped_sub_agents: [
          'fa_sector_kpi', 'val_sotp', 'val_scenario_builder',
          'ma_geopolitical_risk', 'sc_structure_analyst',
        ],
        enable_truth_arbitration: false,  // Sadece contradiction varsa trigger
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: false,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: false,
        skipped_layers: [
          'truth_arbitration', 'chairman_questions', 'deep_shadow_compare',
        ],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 1.20,
        estimated_latency_seconds: 1500,
      };

    case 'FULL':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [
          ...coreAgents,
          'macro_analysis', 'sector_competition', 'valuation_agent',
          'technical_analysis', 'strategic_synthesis',
          'event_impact_mapper', 'esg_agent', 'sentiment_news_agent',
          'analyst_consensus_agent',
          // Document intel agents
          'knowledge_base_agent', 'document_evidence_agent',
        ],
        optional_agents: ['external_research_agent'],
        skipped_agents: [],
        required_sub_agents: ['*'],  // Tüm Faz 1+2 sub-agent'ları
        skipped_sub_agents: [
          // Faz 3 sub-agent'ları opsiyonel
          'ss_signal_merger', 'ss_contradiction_flag', 'ss_thesis_writer',
        ],
        enable_truth_arbitration: true,
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: true,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: false,
        skipped_layers: ['deep_shadow_compare'],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 2.80,
        estimated_latency_seconds: 2400,
      };

    case 'INSTITUTIONAL':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [
          ...coreAgents,
          'macro_analysis', 'sector_competition', 'valuation_agent',
          'technical_analysis', 'strategic_synthesis',
          'event_impact_mapper', 'esg_agent', 'sentiment_news_agent',
          'analyst_consensus_agent',
          'research_brief_agent', 'knowledge_base_agent',
          'document_evidence_agent', 'external_research_agent',
        ],
        optional_agents: [],
        skipped_agents: [],
        required_sub_agents: ['*'],  // Tüm 24 sub-agent
        skipped_sub_agents: [],
        enable_truth_arbitration: true,
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: true,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: true,
        skipped_layers: [],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 4.50,
        estimated_latency_seconds: 4800,
      };
  }
}
```

**3. `backend/src/activation-governor/index.ts` — tek giriş noktası:**

```ts
import { scoreComplexity } from './complexity-scorer.js';
import { selectProfile } from './profile-selector.js';
import { db } from '../db.js';
import { ACTIVATION_GOVERNOR_ENABLED } from '../config.js';

export async function planActivation(
  sessionId: string,
  ticker: string,
  mode: string,
  userRequest?: string,       // NEW: natural language user request
): Promise<ActivationPlan | null> {
  if (!ACTIVATION_GOVERNOR_ENABLED) return null;  // Feature off → mevcut davranış

  // Step 1: Classify session intent (NEW)
  const sessionClass = classifySession(userRequest, ticker);

  // Step 2: Score complexity
  const complexity = await scoreComplexity(ticker);

  // Step 3: Profile selection — complexity + mode + session_class üçlüsü
  const plan = selectProfile(complexity, mode, sessionClass);

  persistActivationPlan(sessionId, plan, complexity, sessionClass);

  console.log(`[activation-governor] ${ticker} → ${plan.profile} (complexity=${complexity.total}/100, class=${sessionClass.type})`);
  console.log(`[activation-governor] Skipped: ${plan.skipped_layers.join(', ') || 'none'}`);

  return plan;
}

function persistActivationPlan(sessionId: string, plan: ActivationPlan, complexity: ComplexityScore, sessionClass: SessionClass): void {
  db.prepare(`
    INSERT OR REPLACE INTO activation_plans
    (session_id, profile, complexity_score, complexity_dimensions,
     why_selected, plan_json, session_class_type, session_class_signals, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId, plan.profile, plan.complexity_score,
    JSON.stringify(complexity.dimensions),
    plan.why_selected, JSON.stringify(plan),
    sessionClass.type, JSON.stringify(sessionClass.signals),
    new Date().toISOString(),
  );
}

export function getActivationPlan(sessionId: string): ActivationPlan | null {
  const row = db.prepare(`SELECT plan_json FROM activation_plans WHERE session_id = ?`).get(sessionId) as any;
  return row ? JSON.parse(row.plan_json) : null;
}

export function shouldActivate(sessionId: string, feature: string): boolean {
  const plan = getActivationPlan(sessionId);
  if (!plan) return true;  // No plan = default behavior (all on)

  switch (feature) {
    case 'truth_arbitration': return plan.enable_truth_arbitration;
    case 'citation_enforcement': return plan.enable_citation_enforcement;
    case 'contradiction_full_scan': return plan.enable_contradiction_full_scan;
    case 'chairman_questions': return plan.enable_chairman_questions;
    case 'full_quality_governor': return plan.enable_full_quality_governor;
    case 'deep_shadow_compare': return plan.enable_deep_shadow_compare;
    default: return true;
  }
}

export function shouldRunAgent(sessionId: string, agentId: string): boolean {
  const plan = getActivationPlan(sessionId);
  if (!plan) return true;
  return !plan.skipped_agents.includes(agentId);
}

export function shouldRunSubAgent(sessionId: string, subAgentId: string): boolean {
  const plan = getActivationPlan(sessionId);
  if (!plan) return true;
  if (plan.skipped_sub_agents.includes('*')) return false;
  return !plan.skipped_sub_agents.includes(subAgentId);
}
```

**4. DB:**

```sql
CREATE TABLE activation_plans (
  session_id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  complexity_score REAL NOT NULL,
  complexity_dimensions TEXT,
  why_selected TEXT,
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_activation_profile ON activation_plans(profile);
```

**5. Entegrasyon — minimal invaziv:**

Orchestrator `executeSession` en başında (preflight'tan hemen sonra):

```ts
import { planActivation, shouldRunAgent, shouldRunSubAgent, shouldActivate } from './activation-governor/index.js';

// executeSession içinde
const activationPlan = await planActivation(sessionId, ticker, runtimeMode);

// Pipeline dispatch'te agent skip kontrolü
for (const agent of executionPhase.agents) {
  if (!shouldRunAgent(sessionId, agent)) {
    console.log(`[activation] Skipping ${agent} (profile: ${activationPlan?.profile})`);
    continue;
  }
  await runSingleAgent(agent, /* ... */);
}

// Sub-agent dispatcher'da
// backend/src/sub-agents/dispatcher.ts içindeki dispatchSubAgents'e ekle:
const filtered = tasks.filter(t => shouldRunSubAgent(sessionId, t.sub_agent_id));

// Quality layer check'lerinde
if (shouldActivate(sessionId, 'truth_arbitration')) {
  await runTruthArbitration(sessionId);
}
if (shouldActivate(sessionId, 'chairman_questions')) {
  anticipateChairmanQuestions(sessionId);
}
// vb.
```

**6. Execution trace'e profile bilgisi yaz:**

Her session completion'da analysis_sessions'a yeni alanlar:

```sql
ALTER TABLE analysis_sessions ADD COLUMN execution_profile TEXT;
ALTER TABLE analysis_sessions ADD COLUMN complexity_score REAL;
ALTER TABLE analysis_sessions ADD COLUMN skipped_layers_count INTEGER;
```

Session completion'da:

```ts
if (activationPlan) {
  db.prepare(`
    UPDATE analysis_sessions
    SET execution_profile = ?, complexity_score = ?, skipped_layers_count = ?
    WHERE id = ?
  `).run(
    activationPlan.profile,
    activationPlan.complexity_score,
    activationPlan.skipped_layers.length,
    sessionId,
  );
}
```

**7. `config.ts`:**

```ts
export const ACTIVATION_GOVERNOR_ENABLED = (process.env.ACTIVATION_GOVERNOR_ENABLED ?? 'false') === 'true';
export const ACTIVATION_GOVERNOR_SHADOW = (process.env.ACTIVATION_GOVERNOR_SHADOW ?? 'false') === 'true';
```

`.env.example`:
```
# Activation Governor — smart layer selection based on session complexity
# Default OFF to preserve existing behavior
ACTIVATION_GOVERNOR_ENABLED=false
ACTIVATION_GOVERNOR_SHADOW=false
```

**8. Dashboard'da profile badge:**

Her session kartında execution profile badge gösterilir (LIGHT/STANDARD/FULL/INSTITUTIONAL) + tooltip'te complexity dimensions ve skipped layers.

## Shadow Mode ve Production Gate

Shadow mode'da (`ACTIVATION_GOVERNOR_SHADOW=true`): profile belirlenir ve DB'ye yazılır ama pipeline davranışı değişmez. Legacy (her şey açık) çalışır. Bu sayede "governor ne seçerdi?" tarihsel olarak toplanır.

10+ session shadow run sonrası production'a geçiş kriterleri:
- LIGHT profile seçilen session'larda final_score ≥ legacy baseline (kalite düşmemeli)
- STANDARD için aynı
- FULL ve INSTITUTIONAL için tam latency parity bekleme (zaten full stack çalışıyor)

Eğer LIGHT/STANDARD'da quality regression olursa → profil threshold'larını (30 ve 55) yükselt (daha az agresif skip).

## Doğrulama

- `npx tsx scripts/test-activation.ts ULKER` → LIGHT profile dönmeli (food, single segment, low disclosure)
- `npx tsx scripts/test-activation.ts KCHOL` → INSTITUTIONAL dönmeli (holding, SOTP, high complexity)
- `npx tsx scripts/test-activation.ts EREGL` → STANDARD veya FULL (steel, IAS 29 impact)
- DB kontrol: `SELECT profile, COUNT(*) FROM activation_plans GROUP BY profile` ile dağılım

## UYARI — Over-Engineering Sınırı

Bu katman son eklenen. Bundan sonra:
- Yeni complexity dimension EKLEME (5 boyut yeterli)
- Yeni profile türü EKLEME (4 profile yeterli)
- Profile-bazlı özel agent chain YAZMA (mevcut skip/run kararları yeterli)
- ML-based profile selection KURMA (heuristic yeterli)

Hedef: **Kaliteyi koruyarak latency %30-50 ve cost %40-60 düşüş** (LIGHT/STANDARD session'larda). Daha fazla optimizasyon arayışı over-engineering'dir.

### Commit
`feat(activation-governor): complexity-based profile selection for selective layer activation [finance-x-polish P9]`

---

# NİHAİ DOĞRULAMA CHECKLIST

- [ ] FAZ P1: `canonical_facts`, `lineage_nodes`, `session_methodology` DB tabloları var
- [ ] FAZ P1: `config/methodology.yml` tam içerikli
- [ ] FAZ P1D: `truth_decisions` DB tablosu, `arbitrateTruth()` unit test geçiyor
- [ ] FAZ P1D: `upsertFactWithProtection()` düşük confidence overwrite'ı reddediyor
- [ ] FAZ P2: `contradictions` DB tablosu, `contradiction_engine` test edildi
- [ ] FAZ P2: `qa_output_v2.schema.json` geçerli, QA structured output dönüyor
- [ ] FAZ P2: Coverage engine P0 blocker veriyor
- [ ] FAZ P2: `unsourced_claims` detection çalışıyor
- [ ] FAZ P2D: `citation_reports` tablosu, critical fact citation enforcement publish'i blokluyor
- [ ] FAZ P2E: `config/quality_budgets.yml` yüklenebiliyor
- [ ] FAZ P2E: `final_scores` tablosu, her session sonunda 0-100 score + tier üretiliyor
- [ ] FAZ P2F: `chairman_questions` tablosu, 8 pattern deterministic trigger ediyor
- [ ] FAZ P2F: strategic_synthesis prompt'una chairman questions inject ediliyor
- [ ] FAZ P3: Preflight checks session başlangıcında çalışıyor
- [ ] FAZ P3: Task planner skipped_jobs doğru döndürüyor
- [ ] FAZ P3: `graph_nodes` cache hit/miss log ediyor
- [ ] FAZ P3: Cost governor decision log ediyor
- [ ] FAZ P4: `escalations` tablosu + state machine çalışıyor
- [ ] FAZ P4: Self-healing en az 3 fallback strategy için çalışıyor
- [ ] FAZ P4: Idempotency keys + saga pattern test edildi
- [ ] FAZ P4: Circuit breakers external call'larda çalışıyor
- [ ] FAZ P5: `evals/golden_v2/` 5+ şirket için gold report
- [ ] FAZ P5: A/B runner CLI çalışıyor
- [ ] FAZ P5: Synthetic company generator 6+ edge case üretiyor
- [ ] FAZ P6: Secrets provider env dışı (1password veya vault) test edildi
- [ ] FAZ P6: Audit log hash chain verification script çalışıyor
- [ ] FAZ P6: GitHub Actions CI tüm adımlarıyla geçiyor
- [ ] FAZ P6: `/health`, `/ready`, `/metrics` endpoint'leri cevap veriyor
- [ ] FAZ P6: Prompt injection detection en az 5 attack pattern yakalıyor
- [ ] FAZ P6F: SPK compliance 6 core rule + 5 executive checklist (thesis/valuation/risk/catalyst/why_now) ile çalışıyor
- [ ] FAZ P6F: Executive checklist violation'ları publish-blocking
- [ ] FAZ P7: SSE streaming dashboard'da canlı event gösteriyor
- [ ] FAZ P7: DAG visualizer real-time update
- [ ] FAZ P7: Replay CLI çalışıyor
- [ ] FAZ P7: Explainability panel lineage gösteriyor
- [ ] FAZ P8: `docs/ROADMAP.md` + `docs/ARCHITECTURE.md` + `README.md` güncel
- [ ] FAZ P9: `activation_plans` DB tablosu mevcut
- [ ] FAZ P9: `ACTIVATION_GOVERNOR_ENABLED` flag default false, .env.example'da var
- [ ] FAZ P9: Test — ULKER → LIGHT, KCHOL → INSTITUTIONAL, EREGL → STANDARD/FULL
- [ ] FAZ P9: `shouldRunAgent`, `shouldRunSubAgent`, `shouldActivate` orchestrator'a wire edildi
- [ ] FAZ P9: `analysis_sessions.execution_profile` kolonu session sonunda doluyor
- [ ] FAZ P9: Shadow mode 10+ session boyunca profile seçimlerini loglayabildi
- [ ] Tüm `pnpm typecheck` geçiyor
- [ ] Tüm unit testler geçiyor
- [ ] GitHub Actions yeşil

---

# KRİTİK UYARILAR

1. **Shadow mode zorunlu** — hallucination detection, contradiction engine, cost governor gibi behavior-changing katmanları `<FEATURE>_SHADOW=true` ile önce gözlem modunda çalıştır. 10+ session shadow sonrası production'a geç.

2. **Migration atomic olmalı** — DB schema değişiklikleri tek transaction, rollback scripti zorunlu.

3. **Cost governor ile quality budget çakışmasın** — Cost governor "sub-agent skip et" derken quality budget "min coverage zorunlu" diyebilir. Precedence: quality budget > cost governor. Yani quality'yi bozacak skip yapılmaz.

4. **Escalation manager recursion** — escalation resolver başka escalation yaratabilir. Max depth 3.

5. **Golden dataset privacy** — gerçek analist raporları kullanılıyorsa telif/gizlilik. Sentetik veya public raporlar öncelikli.

6. **Audit log performance** — her event için hash hesabı IO içerir. High-traffic endpoint'lerde batch flush.

7. **Self-healing loop riski** — fallback chain içinde bir fallback tekrar primary'ye dönerse sonsuz döngü. Her fallback step unique marker bırakmalı, tekrar çağrılırsa atla.

8. **Prompt injection defense yetersiz** — basic layer. Agent'ların LLM input'unda `<user_content>` tag'leme, system prompt isolation gibi derin defense ileride eklenmeli.

9. **SPK rules sık değişir** — yıllık review + kurul tebliğlerini takip et. `config/spk_rules.yml` ayrı dosya olarak yönet.

10. **Tier 2/3 prematüre implementasyon yok** — Portfolio mode, backtesting gibi alanlar iş kararı. Kod yazma, placeholder bırak.

---


---

# MASTER NİHAİ DOĞRULAMA CHECKLIST

Tüm 5 block tamamlandığında aşağıdaki maddelerin hepsi ✓ olmalı.

## Block R Doğrulamaları
- [ ] Repo git history'sinde output/ ve PDF'ler yok (`du -sh .git` < 50 MB)
- [ ] `.env.example` 60+ satır, tüm `PYTHON_*_ENABLED` default `true`
- [ ] `feedback-loop.ts` `appendAgentMemory()` çağırıyor
- [ ] Bir session sonunda `agents/*/lessons.jsonl` dosyalarında yeni kayıt var
- [ ] `repeat_count >= 3` olan lesson otomatik `permanent_rules.md`'ye taşınıyor
- [ ] QA FAIL olan session `status = 'qa_failed'` alıyor
- [ ] `REVISABLE_AGENTS` listesi 17 agent içeriyor
- [ ] Schema enum 26 output_type içeriyor
- [ ] `config/sector_registry.yml` 30+ ticker eşlemesi içeriyor
- [ ] `fact_packs` tablosu DB'de mevcut (v1 basic)
- [ ] Memory migration scripti çalıştı
- [ ] OpenTelemetry opsiyonel (`OTEL_EXPORTER_URL` yoksa no-op)
- [ ] PII filter varsayılan açık
- [ ] Event bus kap_new_disclosure için auto-trigger wire edildi
- [ ] **Canlı test:** THYAO session — feedback loop çalışıyor, IAS 29 adjusted EBITDA raporda var

## Block U Doğrulamaları
- [ ] `skills/` altında 20 skill klasörü + `_registry.yml` mevcut
- [ ] `SKILLS_ENABLED=true` iken agent-runner skill'leri prompt'a inject ediyor
- [ ] Qdrant container ayakta
- [ ] `scripts/ingest_existing_pdfs.py` başarılı, en az 10 şirket için collection oluşmuş
- [ ] `./scripts/query-docs.sh THYAO "EBITDAR"` evidence pack döndürüyor
- [ ] 4 yeni agent klasörü `agents/` altında
- [ ] `config/pipeline.yml`'de yeni agent'lar + execution_phases güncel
- [ ] Evidence-aware agent'lar prompt güncellendi
- [ ] Deep research scope-execute-synthesize çalışıyor
- [ ] Dashboard'da Araştırma sayfası render oluyor
- [ ] **Canlı test:** EREGL session — document_evidence D&A'yı cited extract ediyor

## Block S Doğrulamaları
- [ ] `config/sub_agents.yml`'de 24 sub-agent tanımlı
- [ ] `agents/<parent>/sub_agents/` klasörlerinde toplam 24 system_prompt.md
- [ ] `schemas/sub-agents/` altında 24 output_schema.json
- [ ] `backend/src/sub-agents/` altında 4 core dosya
- [ ] DB'de `sub_agent_runs` ve `shadow_comparisons` tabloları
- [ ] 11 sub-agent env flag + shadow mode
- [ ] **Canlı test (shadow):** KCHOL session — her sub-agent için numeric parity ≥ %98
- [ ] Production gate kriterleri karşılanan sub-agent'lar `ENABLED=true`

## Block P Doğrulamaları
- [ ] FAZ P1: `canonical_facts`, `lineage_nodes`, `session_methodology` DB tabloları
- [ ] FAZ P1D: `truth_decisions` tablosu, arbitration unit test geçiyor
- [ ] FAZ P2: `contradictions`, `qa_output_v2`, `unsourced_claims`, `citation_reports` OK
- [ ] FAZ P2E: `final_scores` tablosu, her session için 0-100 score üretiliyor
- [ ] FAZ P2F: `chairman_questions` tablosu, 8 pattern trigger ediyor
- [ ] FAZ P3: Preflight, task planner, graph_nodes cache
- [ ] FAZ P4: Escalations, self-healing, idempotency, circuit breaker
- [ ] FAZ P5: Golden dataset 5+ şirket, A/B runner, synthetic generator
- [ ] FAZ P6: Secrets, audit log hash chain, CI/CD, health checks, SPK + executive checklist
- [ ] FAZ P7: SSE streaming, DAG viz, replay, explainability
- [ ] FAZ P8: ROADMAP.md + ARCHITECTURE.md + README güncel
- [ ] FAZ P9: `activation_plans` tablosu, governor flag default false, 4 profile test edildi
- [ ] **Canlı test:** ULKER (LIGHT), EREGL (FULL), KCHOL (INSTITUTIONAL) — profile selection doğru

## Global Final
- [ ] Tüm `pnpm typecheck` geçiyor
- [ ] Tüm unit testler geçiyor
- [ ] GitHub Actions yeşil
- [ ] Her block'un sonunda benchmark ticker canlı test raporu yazılmış

---

# ROLLOUT SIRASI (Önerilen)

Tüm blok'ları sırayla uygulamak zorundasın. Atlama yapma. Ama **her block'un sonundaki canlı test** kritiktir — kodun gerçek canlı veriyle çalıştığını doğrulamadan bir sonraki block'a başlama.

## Aşamalı İşletme Önerisi

1. **Block R** — Yap, kırıkları gör, hotfix yap. THYAO session çalıştır, feedback loop gerçekten yazıyor mu gör.
2. **Block U** — Yap, skill registry çalışıyor mu doğrula. EREGL session'da document_evidence cited snippet dönüyor mu gör.
3. **Block U sonrası DUR** — Gerçek verilerle 5-10 session çalıştır. Pain point'leri lessons.jsonl'a toplat. 1-2 hafta kullan.
4. **Block S** — Shadow mode'da başla. report_formatter (en risksiz) ile başla, sırayla ilerle. Her sub-agent için production gate kriterlerini karşıla.
5. **Block P** — En son. O noktada gerçek pain point'ler netleşmiş olacak. P1-P4 önce, P5-P9 sonra.

Claude Code'un tek seferde 38 fazı hatasız bitirme ihtimali düşüktür. Blok sınırlarında dur, gerçek dünya test et, sonra devam et.

---

# KRİTİK UYARILAR

1. **Memory ve fact schema geriye uyumlu olmalı** — R7'deki basic fact_packs, P1D'deki truth arbitration tarafından genişletilir; mevcut veriyi kırma.

2. **Shadow mode ile production arasında net ayrım** — behavior değiştiren her katman shadow'da önce. Numeric parity ölçülmeden cutover yapma.

3. **Skills dosya ama kullanılan değil olmasın** — U1-U2'de registry kur, agent-runner inject et, log'da tetiklenen skill'leri gör. Skill klasörleri dolu ama çağrılmıyorsa ölü kod.

4. **Document intelligence maliyeti izlenmeli** — 1500 PDF embedding bir kerelik ~$2 ama her session'da Qdrant sorgusu ekler. Küçük subset ile test et.

5. **Sub-agent ephemeral kuralı kırma** — Her sub-agent'a memory.md yazmaya çalışırsan memory sorunu 4 katlanır. Öğrenme parent'ta.

6. **Contradiction engine sub-agent'lardan sonra çalışsın** — birden fazla agent aynı fact için farklı değer yazdığında tespit edilir. Sub-agent output'ları canonical_facts'e yazılmadan contradiction çalışırsa false negative olur.

7. **Activation Governor default KAPALI** — `ACTIVATION_GOVERNOR_ENABLED=false`. Shadow'da topla, sonra açmaya karar ver.

8. **Block P9 son katman** — Bu noktadan sonra yeni büyük feature eklenmeyecek. Over-engineering sınırı burada.

9. **Claude Code büyük iş** — Bu master dosya ~400 KB. Tek seferde biten bir görev değil. Block sınırlarında kendi kendini frenle.

10. **İnsan review noktaları** — Shadow mode sonuçları, golden dataset eşleştirme, chairman questions eşleştirme — bu noktalarda insan müdahalesi gerekli. Claude Code tek başına "tamam" diyemez.

11. **Block G (Governance) Block R-P'den SONRA başlatılır** — Block G sistemin uzun vadeli stabilitesi içindir. R-P tamamlanmadan G açılmaz. Block G kendisi 12 faz.

---


---

# PART 2 EXIT VERIFICATION — Block S + P tamamlandı mı?

Part 2 Part 3'e geçmeden önce aşağıdaki 7 kriter **deterministik olarak** doğrulanır:

```
✅ Block S gate check pass (4 dalga rollout tamamlandı)
   npx tsx scripts/shadow-compare.ts --all-parents --gate-check --composite
   → En az 9/11 parent composite quality gate'ini geçti
   → QA score delta ≥ -0.02 her parent için
   → Critical fact accuracy ≥ 95%
   → Hallucination rate delta ≤ 0

✅ Block P gate check pass
   npx tsx scripts/block-p-gate-check.ts --full-suite
   → Contradiction FP rate ≤ 15%
   → Citation blocker precision ≥ 90%
   → Activation Governor profile accuracy ≥ 80%
   → Replay drift delta ≤ 10%
   → Final score correlation ≥ 0.6

✅ Full institutional session (KCHOL) 
   → status = 'completed' (hard block yok)
   → Analytical depth: narrative word count ≥ 4500
   → 5 ana section delivered (financial/sector/valuation/macro/strategic)
   → Forward-looking interpretation paragraf ≥ 4
   → Management reasoning reference ≥ 2 yerde

✅ Activation Governor live test
   → ULKER → LIGHT (upgraded STANDARD çünkü LIGHT_MODE_ENABLED=false)
   → EREGL → FULL profile
   → KCHOL → INSTITUTIONAL profile
   → Each session token usage within budget (no hard_stop triggered)

✅ Truth arbitration canonical selection
   → En az 10 disputed fact için arbitration çalışmış
   → Fact ownership lock: prefix-based ownership kuralları uygulanıyor
   → No "ownership_violation" silent write

✅ No regression
   → Part 1 baselines hâlâ pass (replay suite green)
   → Part 1'de çalışan 20 session Part 2 sonrası da çalışıyor

✅ Exit report yazıldı: docs/part-reports/part2_exit_report.md
   → Block S rollout dalgaları / Block P katmanları / Kalan defect'ler / Part 3 hazırlığı
```

Bu 7 kriter karşılanmadan **Part 3 başlatılamaz**. Part 2 çok büyük bir parça — Part 3'e acele etme, Part 2 gerçekten stabil olsun.

---

# PART 2 SON SÖZ

Part 2 (Block S + Block P) tamamlandığında Finance-X Hybrid:
- **24 sub-agent production'da** paralel çalışıyor
- **Kurumsal quality OS** aktif (fact layer, truth, contradiction, QA, citation, coverage, final score)
- **Execution intelligence** çalışıyor (preflight, planner, incremental, cost governor)
- **Reliability patterns** kurulu (escalation, self-healing, saga, circuit breaker)
- **Production hardening** tamamlandı (secrets, audit, CI/CD, SPK compliance)
- **UX katmanı** live (SSE streaming, DAG visualizer, replay, explainability, analyst review bundle)
- **Activation Governor** 4 profile ile karar veriyor

Bu noktada sistem **production-grade research operating system**. Ama henüz:
- Long-term drift protection yok (Part 3 Block G)
- Prompt canary deployment yok
- Methodology drift detection yok
- Dead code detector yok
- Memory hygiene otomasyonu yok
- Corpus freshness monitoring yok

Part 3'e geçiş şartı: 7 Exit Verification kriterinin hepsi green + 2-3 hafta production'da stabil çalışma.

**Başla:** Block S — Faz S1 (Sub-Agent Infrastructure).
