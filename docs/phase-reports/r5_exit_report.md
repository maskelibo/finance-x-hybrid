# R5 — QA Hard Gate + Revision Expansion — Exit Report

- **Faz:** R5 — Kategori B
- **Branch:** `finance-x-execution`
- **Commit:** R5 main + docs
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

**Governance-theatre düzeltmesi:** Önceki kod QA fail'de "uyarıyla devam" ediyordu — session `completed` kaydediliyor, rapor eksik/yanlış çıkıyordu. Artık critical fail'de HARD BLOCK.

### Değişen dosyalar (6 dosya, +227 / -30)

| Dosya | Ne |
|---|---|
| `backend/src/config.ts` | `getMaxQaRounds(profile)` — profile-aware (fast_screening→2, standard_institutional→3, deep_dive→5; LIGHT/STANDARD/FULL/INSTITUTIONAL master alias'ları) |
| `backend/src/db.ts` | `analysis_sessions` → yeni 2 kolon (`quality_warning` INT, `quality_warning_reason` TEXT) + status union genişledi (`completed_with_warning`, `qa_failed`) |
| `backend/src/qa/score-parser.ts` | yeni — `parseQaScore()`, `parseQaDecision()`, `classifyQaFailure()` (critical/soft/unknown) |
| `backend/src/orchestrator.ts` | QA gate: critical fail → `qa_failed`, return (HARD STOP); soft/unknown → `completed_with_warning`, pipeline devam. MAX_QA_ROUNDS artık dinamik (runtimeMode). `REVISABLE_AGENTS` 5→17 genişletildi. `qa_review` upstream dependencies 4→12'ye çıktı. Inline score regex'leri `parseQaScore()`'a indirgendi. |
| `backend/src/gate-observer.ts` | `decisionTaken` union'a `'blocked'` eklendi |
| `scripts/r5-mini-benchmark.ts` | yeni — 27 assertion |

### Critical vs Soft markers (score-parser.ts)

**Critical** (rapor güvenilir değil → qa_failed):
- `factual_error`, `critical_fact_missing`, `recommendation_inconsistent`, `valuation_math_error`, `structural_breakdown`
- TR: `rakam hatası`, `hesaplama hatası`, `çelişkili tavsiye`

**Soft** (rapor doğru, ama pürüzlü → completed_with_warning):
- `narrative_weak`, `section_short`, `elegance`, `coverage_gap`, `citation_weak`
- TR: `yüzeysel`, `eksik yorum`, `zayıf anlatım`

---

## STEP 2 — SMOKE TEST

| Kriter | Sonuç |
|---|---|
| Backend `npx tsc --noEmit` | ✅ Exit 0 |
| 1 hata bulundu + düzeltildi | `gate-observer.ts decisionTaken` union → `'blocked'` eklendi |

---

## STEP 3 — MİNİ-BENCHMARK

`scripts/r5-mini-benchmark.ts` — QA parser & max-rounds governor doğrulama.

| Grup | Assertion | Sonuç |
|---|---|---|
| `parseQaScore` | 6 (direct, 0-10 normalize, comma decimal, Turkish, JSON code block, null) | ✅ 6/6 |
| `parseQaDecision` | 7 (approved/rejected/revision/conditional EN+TR, unknown) | ✅ 7/7 |
| `classifyQaFailure` | 7 (critical EN+TR, soft EN+TR, unknown fallback) | ✅ 7/7 |
| `getMaxQaRounds` | 7 (3 canonical mode, 2 master alias, env fallback, unknown → env) | ✅ 7/7 |

**Toplam: 27 pass / 0 fail** (ilk çalıştırmada 1 fail → floating-point `0.83 === 0.8300000000000001` precision; epsilon tolerance ile düzeltildi). Süre ~2 sn.

---

## STEP 4 — DEFECT DETECTION

1. **Typecheck hatası** — `decisionTaken: 'blocked'` union'da yoktu → gate-observer.ts genişletildi.
2. **Floating point precision** — test assertion strict `=== 0.83` kullandı; gerçek değer `0.8300000000000001` → epsilon 1e-9 ile değiştirildi.
3. **Master spec'teki code snippet bozuktu** — task 1 kod bloğunda duplicate/orphan `error_message = ?, completed_at = ?` satırları vardı (lines 2112-2121). Intent'i takip ederek temiz versiyonla yazıldı: critical → hard stop, soft → banner + continue.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 6 dosya (+227 -30), 1 yeni modül, 2 schema kolonu
STEP 2: ✅ typecheck green (1 hata bulundu + düzeltildi)
STEP 3: ✅ 27/27 mini-benchmark green
STEP 4: ✅ 0 açık defect
```

🟢 **GO — R5 tamamlandı. R6'ya geçiliyor (otonom).**

---

## NOTLAR

- **CriticalQaFailures detection** master spec'te `qaReport.revision_requests` (yapılandırılmış) üzerinden yapılıyordu; mevcut kod `qaOutputRaw` (free text) kullanıyor. Keyword bazlı `classifyQaFailure()` pragmatic geçici çözüm. QA ajanının yapılandırılmış JSON'a geçişi R6 veya sonraki fazın konusu (şimdilik yeterli).
- **Profile mapping**: Canonical RuntimeMode values (`fast_screening`, `standard_institutional`, `deep_dive`) + master alias'lar aynı fonksiyonda destekleniyor. `standard_institutional` (mevcut default) → 3 round (eski hard-coded 2'den fazla; biraz maliyet artışı ama master spec istiyor).
- **REVISABLE_AGENTS** 5→17 artışı revision cost'u artırabilir. Regex ile sadece P0/P1/BLOCKER etiketli agent'lar revize edilmeye devam ediyor + hard cap `slice(0,3)` korunuyor.
- **qa_review upstream** genişlemesi → prompt boyutu artabilir. Mevcut `chars: 5000` cap'i var (L.2163), koruyor.
