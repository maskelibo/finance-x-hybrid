# Phase 7A Summary — Formatter Doctrine Alignment (Observe-Only)

- Branch: `refactor/phase-7a-formatter-doctrine`
- Başlangıç: `refactor/phase-6a-checklist-observe` HEAD (commit 25c52458)
- Davranış değişimi: **SIFIR**. Aynı HTML üretimi, aynı PDF.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §6.8 (Formatter doctrine'i tek sese dusur). Brief
§3.8 Formatter doctrine çelişkisi:

- `agents/report_formatter/system_prompt.md`: Chart.js yasak, SVG only
- `agents/report_formatter/agent_spec.json`: Chart.js CDN, `<script>` tag'leri ✗
- `AGENTS.md`: Chart.js yasak ✓
- `canonical/rules/output_integrity.md` **OI-007**: SVG only, Chart.js/Canvas/CDN forbidden ✓
- `scripts/html-to-pdf.mjs`: Chart.js forbidden ✓

Outlier **agent_spec.json** — canonical OI-007 ile çelişiyordu. Phase 7A bu
çelişkiyi kapatır ve shadow validator'a OI-007/OI-003/OI-008 kuralı ekler.

## Ne yapıldı

### 1. `agents/report_formatter/agent_spec.json` — OI-007'ye hizalandı

| Alan | Önce | Sonra |
| --- | --- | --- |
| `mission` | "embedded Chart.js visualizations" | "embedded inline SVG visualizations … Chart rendering MUST be inline SVG only per canonical rule OI-007" |
| `canonical_refs` (YENİ) | — | `["OI-001", "OI-003", "OI-007", "OI-008"]` |
| `visual_elements[0]` | "Chart.js bar/line/radar charts" | "Inline SVG bar/line/radar charts … (OI-007)" |
| `visual_elements[3]` | "Risk dashboard with horizontal bar chart" | "Risk dashboard with inline SVG horizontal bar chart" |
| `visual_elements[4]` | "Peer comparison grouped bar chart" | "Peer comparison grouped bar chart as inline SVG" |
| `html_template_requirements.charts` | "Chart.js v4.x loaded from CDN, rendered via inline `<script>` tags" | "Inline `<svg>` only. No CDN-loaded chart libraries, no `<canvas>`, no external `<script src=…>`. See canonical/rules/output_integrity.md OI-007 — the authoritative source; this spec defers to it." |
| `layout_authority` (YENİ) | — | `{ "primary": "deterministic", "note": "…compose.ts owns layout + section ordering. LLM prompt authoritative only when Python engine disabled." }` |

**`runtime_modes.*.charts` değiştirilmedi** — o field "grafikler dahil
edilsin mi?" anlamında (true/false), teknoloji seçimi değil. Shadow
validator HTML üzerinden teknoloji'yi kontrol ediyor.

### 2. `backend/src/schema-shadow-validator.ts` — `validateReportFormatterOutput()` eklendi

Yeni kural seti — `agentId === 'report_formatter'` içerikli çalışır:

| Kural | Ne bakar | Kanıt |
| --- | --- | --- |
| `OI-007_canvas_forbidden` | `<canvas` etiketi | Regex `<canvas\b` |
| `OI-007_chartjs_reference` | Chart.js CDN markerı | Regex `chart\.js|chartjs|chart\.min\.js` |
| `OI-007_external_script` | External `<script src=…>` | Regex `<script\s+src\s*=\s*['"]https?:` |
| `OI-003_section_count_below_minimum` | Top-level section sayısı < 12 | `<section>`, `<h1>`, `<h2 class="section*">`, "Bölüm 1." pattern sayısı |
| `OI-008_emoji_in_institutional_output` | Unicode emoji chars | `[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]` |

Shadow validator zaten Phase 3A + 4A'da observe-only — herhangi bir
violation `agent_run_gate_events` tablosuna yazılır, pipeline devam eder.

### 3. `backend/src/validation-gate.ts` — RULE_TO_CATEGORY haritası güncellendi

Yeni 5 kural hepsi `broken_structure` kategorisine düşer. Session-level
validation summary'de formatter ihlalleri bu kategoride aggregate olur.

### 4. `agents/report_formatter/system_prompt.md` — canonical referans link'leri

İki nokta:

- "GRAFİK OLUŞTURMA — SVG KULLAN" bölümü altına OI-007 pointer (otorite
  çatışma durumunda OI-007 kazanır notu).
- "ZORUNLU BÖLÜMLER (Canonical — 12 Bölüm)" bölümü altına OI-003 + OI-001
  pointer.

Mevcut prose silinmedi (OI-007 zaten fiilen uygulanıyordu); canonical
kayıt çağrısı eklendi, prose Phase 7B memory purge sonrası kısalacak.

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
python canonical/_loader/python/loader.py --selftest       OK (50+ cross-checks)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json
                                                           OK (15/15 no regression)
python refactor/tools/prompt_memory_lint.py                20 hard / 27 soft / 130 info (baseline)
python -c "import json; json.load(open('agents/report_formatter/agent_spec.json'))"
                                                           exit 0 (valid JSON)
```

## Canlı davranış beklenen değişimi

**Hiçbir.** Deterministic Python formatter zaten SVG üretiyor. Shadow
validator yeni kuralları observe-log olarak yazıyor; herhangi bir violation
Phase 3A `agent_run_gate_events` tablosunda görünecek (migration uygulanmışsa).

Migration uygulanmadıysa bile tsc geçiyor ve kurallar sessiz çalışıyor.

## Phase 7A → 7B geçiş kapısı

7B shadow-warn'a geçmek için:

1. Migration uygulandı (Phase 3A gate_events için gerekli).
2. En az 10 seans çalıştırıldı.
3. Analiz:
   ```sql
   SELECT rule, COUNT(*) AS hits
     FROM (
       SELECT json_extract(value, '$.rule') AS rule
         FROM agent_run_gate_events, json_each(json_extract(detail_json, '$.violations'))
        WHERE gate_kind = 'schema_shadow'
     )
    WHERE rule LIKE 'OI-%'
    GROUP BY rule
    ORDER BY hits DESC;
   ```
4. Hangi OI ihlalleri en sık? Formatter çıktısında Chart.js sızıntısı var mı?
5. `<canvas>` veya external script sızarsa — LLM formatter prompt drift?
   fallback path mı tetiklendi? — root cause Phase 7B'de araştırılır.
6. İnsan "Phase 7B: warn mode'a geç" dedi → dashboard kırmızı bayrak.

## Kapsam dışında (sonraki fazlar)

- HTML parsing with proper DOM (heuristic regex yeterli şu an). Phase 7C.
- Inline SVG complexity lint (viewBox ratio, çok uzun paths). Phase 9.
- Template.html gerçek 12-bölüm matcher (regex yerine DOM pass). Phase 7B.
- LLM formatter fallback path'i silinsin mi? Phase 7C kararı.
