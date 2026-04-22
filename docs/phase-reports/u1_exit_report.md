# U1 — Skills Infrastructure — Exit Report

- **Faz:** U1 (Block U) — Kategori B
- **Branch:** `finance-x-execution`
- **Commit:** `da84d8a8` — `feat(skills): infrastructure + registry + agent-runner injection`
- **Tarih:** 2026-04-22

---

## STEP 1 — IMPLEMENTATION

### Silme
- `skills/para-memory-files/` (ölü kod, kullanılmıyordu)

### Yeni dizin yapısı
- 20 skill klasörü (sector x8 + accounting x3 + valuation x3 + financial x3 + data x2 + report x2 + technical x1)
- Her biri stub `SKILL.md` içeriyor (frontmatter + 6 standart heading + "TBD Block U2"). Gerçek içerik U2'de.

### Yeni dosyalar
| Path | Ne |
|---|---|
| `skills/_registry.yml` | 20 skill metadata (id, name, triggers, applies_to_agents, category, priority) |
| `skills/<id>/SKILL.md` × 20 | Standart heading stub (Ne Zaman/Prosedür/Kurallar/Örnek/Bilinen Tuzaklar/Referanslar) |
| `backend/src/skills/registry.ts` | `loadSkillsRegistry/getSkillsForAgent/getTriggeredSkills/readSkillExcerpt/readSkillContent` + cache |
| `scripts/u1-mini-benchmark.ts` | 19 assert |

### Entegrasyon
- `backend/src/agent-runner.ts` — fullPrompt içinde skill injection bloğu (excerpt engine preferred, full content fallback). `[skills] <agent>: N triggered — <id list>` log çizgisi.
- `backend/src/config.ts` — 3 yeni flag: `SKILLS_ENABLED` (true), `MAX_SKILLS_PER_AGENT` (3), `SKILL_EXCERPT_ENGINE_ENABLED` (true).

### Excerpt Engine
Heading-bazlı seçim:
- **Always include**: `Ne Zaman Kullanılır`, `Prosedür`, `Kurallar`
- **Conditional**: `Örnek` (context'te `example|örnek|test` varsa), `Bilinen Tuzaklar` (context'te `error|fail|tuzak|bug` varsa)
- **Never include**: `Referanslar` (link-only, content dışı)

Token kazancı: tam 3KB skill → ~1-2KB excerpt. 20 skill × ortalama 1.5KB = 30KB'den 10-15KB'ye iner.

---

## STEP 2 — SMOKE TEST

- Backend `npx tsc --noEmit` → ✅ Exit 0

---

## STEP 3 — MİNİ-BENCHMARK

`scripts/u1-mini-benchmark.ts`:

| Grup | Test | Sonuç |
|---|---|---|
| Registry load | 3 (20 count, id+triggers present, applies_to_agents array) | ✅ 3/3 |
| getSkillsForAgent | 3 (FA skills ≥8, IAS29 match, tech-indicators match) | ✅ 3/3 |
| getTriggeredSkills | 3 (THYAO aviation ctx, IAS 29 keyword, empty ctx) | ✅ 3/3 |
| readSkillExcerpt | 7 (non-null, always sections, exclude Referanslar, Örnek conditional on/off) | ✅ 7/7 |
| Null paths | 2 (non-existent skill) + fallback 1 | ✅ 3/3 |

**Toplam: 19 pass / 0 fail** (ilk çalıştırmada 2 fail — Windows CRLF frontmatter regex bug; `\r?\n` ile düzeltildi).

---

## STEP 4 — DEFECT DETECTION

1. **Windows CRLF in SKILL.md** — Python ile yazılan stub dosyalar CRLF içeriyor; `^---\n` regex'i `\r\n` ile eşleşmedi → excerpt boş/full-fallback dönüyordu. Regex `\r?\n` ile güncellendi, fix sonrası 19/19 green.

**0 açık defect.**

---

## STEP 5 — GO / NO-GO

```
STEP 1: ✅ 20 skill dir + 20 SKILL.md stub + 4 source file + 1 benchmark
STEP 2: ✅ typecheck green
STEP 3: ✅ 19/19 mini-benchmark
STEP 4: ✅ 0 açık defect
```

🟢 **GO — U1 tamamlandı. U2'ye geçiliyor (otonom).**

---

## NOTLAR

- Skill içerikleri (SKILL.md bodies) **U2'de doldurulacak** — mevcut `_shared_knowledge_modules/*.md`, `agents/*/knowledge.md` konsolide edilip yazılacak.
- Excerpt engine stub content üzerinde çalıştığı için U2 öncesi "gerçek" tetikleme deneyimi sınırlı. Prompt boyutu tasarrufu U2 tamamlanınca ölçülebilir.
- `MAX_SKILLS_PER_AGENT=3` cap — agent başına max 3 skill injection (prompt şişmesin). Priority-based seçim yapılmıyor şu an (triggered order); U2 sonrası gerekirse priority sort eklenebilir.
