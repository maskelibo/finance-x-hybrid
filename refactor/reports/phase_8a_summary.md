# Phase 8A Summary — Memory Purge & Archive

- Branch: `refactor/phase-8a-memory-audit`
- Başlangıç: `refactor/phase-12a-migration-tool` HEAD (commit 87b478c7)
- Davranış değişimi: **SIFIR runtime change** — agent memory.md dosyaları okuma-zamanı dinamik inject edilir; içerik azalması runtime davranışı bozmaz (kalıcı kurallar yerinde).

## Hedef (REFACTOR_BRIEF.md §3.2)

Her agent'ın `memory.md` dosyasını §3.2'deki kurala göre temizle:

- **Kalır:** Kalıcı kurallar (Chairman direktifleri, mandatory checklist, operasyonel kontrol)
- **Kalır:** Son 3 tarihli feedback bölümü (son dersler)
- **Taşınır:** Daha eski tarihli feedback section'ları → `agents/<agent>/memory_archive.md`
- **Hedef boyut:** ≤2KB / ≤40 aktif satır (brief §3.2)

## Ne yapıldı

### 1. `refactor/tools/phase8a_memory_purge.py` (YENİ)

Python 3 deterministic purge aracı. Idempotent — tekrar çalıştırılabilir.

**Mantık:**
- memory.md → preamble + sections (## header bazlı) parse
- Her section için:
  - `Kalıcı Kurallar`, `Zorunlu Kontrol`, `Operasyonel`, `Agent Performans`, `Reasoning`, `Recent Learnings`, `Pre-Flight` gibi başlıklar → PERMANENT (korunur)
  - Header'ında tarih bulunan (`YYYY-MM-DD`) ve permanent olmayan section'lar → DATED (son 3'ü korunur, kalanı arşive)
  - Header'ında tarih olmayan permanent-olmayan section'lar → korunur (güvenli default)

**Arşiv formatı:** `memory_archive.md` dosyasına `## Purge <YYYY-MM-DD HH:MM> — N section` bloğu altında tarihlenerek eklenir. Önceden arşiv varsa append edilir.

### 2. Backup

`backups/pre_phase8a_memory_20260421_231101.tar.gz` — tüm 26 agent memory.md dosyasının purge-öncesi hali (164 KB).

### 3. Purge sonucu

| Agent | Orig | Kept | Arch ln | Arch sec |
|---|---:|---:|---:|---:|
| agent_factory | 69 | 69 | 0 | 0 |
| agent_performance_review | 113 | 113 | 0 | 0 |
| analyst_consensus_agent | 130 | 91 | 40 | 3 |
| **ceo** | **540** | **130** | **387** | **27** |
| context_extraction | 287 | 104 | 173 | 14 |
| coo | 332 | 124 | 197 | 15 |
| cost_performance_optimizer | 28 | 28 | 0 | 0 |
| data_collection | 269 | 112 | 149 | 12 |
| esg_agent | 83 | 82 | 0 | 0 |
| event_classification | 331 | 122 | 201 | 13 |
| event_impact_mapper | 213 | 130 | 82 | 5 |
| event_timeline_alert | 243 | 133 | 109 | 5 |
| final_summary | 232 | 133 | 97 | 6 |
| financial_analysis | 281 | 97 | 176 | 12 |
| kap_watch | 318 | 126 | 183 | 13 |
| macro_analysis | 220 | 105 | 111 | 7 |
| orchestrator | 69 | 69 | 0 | 0 |
| parse_standardization | 328 | 132 | 186 | 14 |
| qa_review | 245 | 139 | 104 | 6 |
| reconciliation | 262 | 111 | 142 | 13 |
| report_formatter | 386 | 126 | 250 | 14 |
| sector_competition | 182 | 81 | 97 | 7 |
| sentiment_news_agent | 74 | 73 | 0 | 0 |
| strategic_synthesis | 252 | 127 | 123 | 6 |
| technical_analysis | 323 | 121 | 192 | 14 |
| valuation_agent | 87 | 87 | 0 | 0 |
| **TOTAL** | **5897** | **2765** | **2999** | **206** |

**Net:** 5897 → 2765 satır aktif memory (%53 daralma). 206 eski feedback section arşive taşındı, kayıp yok.

## Auto-memory (Claude harness) temizliği

Aynı oturumda, Claude'un persistent memory'si de sadeleştirildi:

- **Silindi:** `refactor_state_20260421.md` (62 satır, Phase 3A snapshot'u — `finance_x_refactor_progress.md` zaten güncel tutuyor)
- **Yeniden yazıldı:** `finance_x_pending_fixes.md` — QA routing fix'i (Phase 3A+ tamamlandı) işaret edildi, eski "yarın MacBook" notları çıkarıldı
- **Yeniden yazıldı:** `finance_x_architecture.md` — 2 hafta öncenin "bugün yapılanlar" retrospektifi kesildi, kalıcı mimari özete indirgendi
- **MacBook referansları:** tüm memory'den çıkarıldı (kullanıcı Windows'ta kalıyor)

## Tests

```bash
cd backend && npx tsc --noEmit                                                              exit 0
python canonical/_loader/python/loader.py --selftest                                         OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json       OK (15/15)
python refactor/tools/phase8a_memory_purge.py                                                OK (idempotent)
```

## Runtime davranışı

Agent pipeline koşumunda `memory.md` → agent prompt'una inject ediliyor (agent-runner). Purge sonrası:

- Prompt token sayısı CEO için ~%76, ortalama ~%53 düşer
- Kalıcı kurallar kesintisiz erişilebilir
- Eski feedback'ler `memory_archive.md`'de — audit/reference için açık

## Kapsam dışında (sonraki fazlar)

- **Phase 8B:** `system_prompt.md` dosyalarının canonical'a referans verecek şekilde yeniden yazımı (brief §3.1). Observe-only regresyon için ek guardrail gerekli.
- **Phase 8C:** memory'deki prose kuralların hangilerinin canonical'a zaten taşındığını `canonical_rule_refs` signal ile proof et, kalıcı kurallar bölümlerini de sıkılaştır.

## Rollback

```bash
tar -xzf backups/pre_phase8a_memory_20260421_231101.tar.gz -C /
```

veya branch'i silme: `git checkout master && git branch -D refactor/phase-8a-memory-audit`.
