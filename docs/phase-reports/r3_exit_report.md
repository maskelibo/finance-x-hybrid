# R3 — Feedback Loop Deterministic Dosya Yazımı — Exit Report

- **Faz:** R3 (Block R)
- **Kategori:** B (mini-benchmark)
- **Branch:** `finance-x-execution`
- **Commit:** `80aa7d6c` — `fix(feedback): replace prompt-only feedback with deterministic JSON-based memory write + auto-promotion [finance-x-audit R]`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

**Kritik bug (master spec):** `backend/src/feedback-loop.ts` LLM'e prompt gönderiyordu ama `appendAgentMemory()` **hiç çağrılmıyordu** — feedback hiçbir dosyaya yazılmıyor, memory loop kapalıydı.

### Değişen dosyalar

| Dosya | Δ | Ne değişti |
|---|---|---|
| `backend/src/feedback-loop.ts` | tam rewrite | +251 / -121 satır — structured JSON output, `applyFeedbackDeterministic()` ile lessons.jsonl + case_lessons.md + permanent_rules.md'ye deterministik yazım |
| `backend/src/memory.ts` | +17 | `readLessonsJsonl(agentId)` ve `getRecentOpenLessons(agentId, limit)` export |
| `scripts/r3-mini-benchmark.ts` | yeni | LLM-siz deterministik doğrulama (4 test case, 9 assertion) |

### Yeni davranış

1. **Structured JSON kontraktı** — LLM `{ session_summary, items: FeedbackItem[] }` dönüyor. Parser markdown code block'u içerdiği JSON'u toleranslı çıkarıyor; parse fail'de empty fallback.
2. **Per-agent artifact yazımı**:
   - `agents/<id>/lessons.jsonl` — her eksik için yapılandırılmış satır (id, ticker, issue_type, severity, rule, case_lesson, status, repeat_count, last_seen, last_ticker)
   - `agents/<id>/case_lessons.md` — ticker bazlı append
   - `agents/<id>/permanent_rules.md` — auto-promoted rules
3. **Dedup** — agent+issue_type + 3+ keyword overlap ⇒ repeat_count artır, yeni satır yazma.
4. **Auto-promotion** — `repeat_count >= 3` olan rule `permanent_rules.md`'ye taşınır, `status=promoted_to_permanent` yapılır.
5. **DB log** — `ceo_activities` tablosuna structured output + write counts.

---

## STEP 2 — SMOKE TEST

| Kriter | Sonuç |
|---|---|
| `npx tsc --noEmit` (backend) | ✅ Exit 0 |
| No TODO/FIXME/stub | ✅ temiz |
| Dependencies sağlam | ✅ `db.js`, `memory.js`, `config.js`, `llm/default-router.js` intakt |

---

## STEP 3 — MİNİ-BENCHMARK

`scripts/r3-mini-benchmark.ts` — LLM'siz izole test, `applyFeedbackDeterministic()` davranışını doğrudan sınar. **Tüm lessons/case/rules dosyaları çalışma öncesi yedeklenir, sonra geri yüklenir.**

| # | Senaryo | Beklenen | Sonuç |
|---|---|---|---|
| 1 | Yeni lesson yazımı | `memoryWrites=1`, lessons.jsonl +1 satır, case_lessons.md oluşur | ✅ 3/3 |
| 2 | Aynı issue re-yazım → dedup | `duplicatesSkipped=1`, `memoryWrites=0`, satır sayısı aynı | ✅ 3/3 |
| 3 | 3. kez aynı issue → auto-promote | `permanent_rules.md` oluşur | ✅ 2/2 |
| 4 | Bogus agent_id → skip | `memoryWrites=0`, uyarı log | ✅ 1/1 |

**Toplam: 9 pass / 0 fail** (Exit 0).

Mini-benchmark süresi: ~3 sn (LLM yok). Faz-spesifik criterion — deterministik yazım + dedup + auto-promotion — üçü de kanıtlandı.

---

## STEP 4 — DEFECT DETECTION

**Bulunan:** Master spec'te `readLessonsJsonl` fonksiyonu hem `feedback-loop.ts` hem `memory.ts`'de tanımlanıyordu → name collision riski.
**Düzeltme:** feedback-loop.ts'deki özel kopya `readLessonsJsonlFile` olarak yeniden adlandırıldı; export edilenler sadece `memory.ts`'de.

**`applyFeedbackDeterministic` export edildi** — mini-benchmark testi için gerekli. Master spec'te internal function olarak yazılmıştı; export'un davranışa zararı yok, test coverage artırır.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 3 dosya (2 edit + 1 new), +307 -56 satır
STEP 2: ✅ typecheck green
STEP 3: ✅ 9/9 mini-benchmark green (4 senaryo)
STEP 4: ✅ 0 açık defect
```

🟢 **GO — R3 tamamlandı. R4'e geçiliyor (otonom).**

---

## NOTLAR

- **LLM call yolu doğrulanmadı**: Mini-benchmark yazım path'ini test ediyor, ama gerçek CEO LLM'in structured JSON döndürüp döndürmediğini henüz doğrulamadık. Bu **Block R sonu THYAO full session** ile kanıtlanacak (Kategori D).
- **Permanent rule threshold** `>= 3` master spec — büyüyen lessons.jsonl'da tekrar gören rule'ları hızlı promote eder.
- **Dedup benzerlik eşiği**: 3+ kelime overlap. Gürültülü kelime (4 karakterden kısa) dışarı alınmış. Aggressive değil; aynı issue farklı wording'le yazılırsa yine yeni satır olarak eklenebilir. Fine-tuning sonraki fazlarda gerekebilir.
