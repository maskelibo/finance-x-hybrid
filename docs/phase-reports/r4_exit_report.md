# R4 — Memory Loader Refactor — Exit Report

- **Faz:** R4 (Block R) — Kategori B (mini-benchmark)
- **Branch:** `finance-x-execution`
- **Commit:** `43ed6845` — `fix(memory): replace first-6KB truncation with structured loader (rules + lessons.jsonl) [finance-x-audit R]`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

**Kritik bug:** `extractMemorySummary()` memory.md'nin ilk 6KB'sini kör kesiyordu — en güncel feedback (dosya sonunda) hiç prompt'a girmiyordu.

### Değişiklikler

| Dosya | Δ | Ne |
|---|---|---|
| `backend/src/agent-runner.ts` | +46 / -2 | `loadStructuredMemory(agentId, memoryPath)` eklendi (export). `extractMemorySummary` @deprecated olarak işaretlendi (body intakt, geriye dönük uyum). Call-site ve prompt header güncellendi. |
| `scripts/r4-mini-benchmark.ts` | yeni 67 satır | 4 senaryo, 10 assertion |

### Yeni davranış

`loadStructuredMemory` üç bölüm üretiyor (dosyalar mevcut oldukça):

1. **Kalıcı Kurallar** — `permanent_rules.md` (max 4KB, taşarsa "ilk 4KB" uyarısıyla)
2. **Memory Kurallar** — `memory.md` içinde `## Kalıcı Kurallar` başlıklı bölüm bulursa onu (max 2KB); yoksa memory.md'nin ilk 2KB'si
3. **Son Açık Öğrenimler** — `lessons.jsonl`'dan son 10 `status=open` lesson (yapılandırılmış, last_seen desc)

Prompt header güncellendi: `## Hafıza (3 parça: permanent_rules + memory kurallar + son öğrenimler)`

---

## STEP 2 — SMOKE TEST

| Kriter | Sonuç |
|---|---|
| Backend typecheck | ✅ Exit 0 |
| Import chain sağlam (`getRecentOpenLessons` memory.js → agent-runner) | ✅ |
| `extractMemorySummary` hala var (deprecated, 2. çağrı yok) | ✅ |

---

## STEP 3 — MİNİ-BENCHMARK

`scripts/r4-mini-benchmark.ts` — `financial_analysis` agent üzerinde izole test. Rules/lessons backup-restore ile ortam sterilize.

| # | Senaryo | Assertion | Sonuç |
|---|---|---|---|
| 1 | Sadece memory.md | 3 kontrol (memory var, rules yok, lessons yok) | ✅ 3/3 |
| 2 | rules + memory | 3 kontrol (rules section, rules içerik, memory section hala orada) | ✅ 3/3 |
| 3 | rules + memory + lessons | 3 kontrol (lessons section, içerik, rule görünümü) | ✅ 3/3 |
| 4 | Büyük rules (>4KB) | 1 kontrol ("ilk 4KB" clipping uyarısı) | ✅ 1/1 |

**Toplam: 10 pass / 0 fail.** Süre ~3 sn.

---

## STEP 4 — DEFECT DETECTION

**Export kararı:** `loadStructuredMemory` test coverage için export edildi (master spec internal func olarak yazmıştı). Etkisi: yok; call-site aynı.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 2 dosya değişti (+113 -2)
STEP 2: ✅ typecheck green
STEP 3: ✅ 10/10 mini-benchmark (4 senaryo)
STEP 4: ✅ 0 açık defect
```

🟢 **GO — R4 tamamlandı. R5'e geçiliyor (otonom).**

---

## NOTLAR

- **Eski `extractMemorySummary` silinmedi** — master spec deprecated bırakmayı istedi (migration güvenliği). Başka bir yerden çağrılıyorsa kırılmasın. Gerçek çağrı sayısı 0 (grep ile doğrulandı).
- **Regex Türkçe normalize**: `Kal[ıi]c[ıi]?\s*Kurallar` — "Kalıcı Kurallar" / "Kalici Kurallar" / "Kalıc Kurallar" / "Kalıcı Kural" varyantlarını yakalar. Başlık bulunamazsa ilk 2KB fallback.
- **Gerçek prompt boyutu etkisi**: Önce 6KB sabit kırpma; artık max ~8KB (4KB rules + 2KB memory + lessons). Lessons genelde kısa (~1KB için 10 entry). Net artış: feedback'in güncel bölümleri artık kaybolmuyor.
