# Phase 8D Summary — Upstream Digest + Checklist Enforcement

- Branch: `refactor/phase-8a-memory-audit`
- Başlangıç: commit `54dba4c7` (Phase 8C)
- Davranış değişimi: **AKTIF** — upstream→downstream context geçişinde kör `.slice(0, N)` kaldırıldı, manifest-aware digest aktif. Checklist enforcement `warn` moduna alındı.

## Hedef

Brief §5 (Context Engineering) + §6 (Checklist Enforcement) runtime'a inmiş olmalı:

1. **Lost in the Middle fix:** FA 100 KB üretip formatter/synth 20 KB okuyunca tail'deki kritik bulgular kayboluyordu. `digestUpstream()` ile artık JSON key-priority + head/tail slice yapılıyor.
2. **Checklist addressal fail-safe:** QA bulguları adres edilmemişse (addressal_rate < 0.85) pipeline'da sinyal veriyor; `block` moduna alınırsa CEO gate'inde hard-fail.

## Ne yapıldı

### 1. `backend/src/upstream-digest.ts` (YENİ — 167 satır)

Export: `digestUpstream(raw, targetBytes, opts)` + `digest(raw, targetBytes)` helper.

**Üç strateji, sırayla:**
1. **Raw passthrough:** output ≤ targetBytes ise olduğu gibi döner.
2. **JSON digest:** output parse edilebiliyorsa SIGNAL_FIELDS öncelik sırasıyla (executive_summary, findings, addressed_findings, metrics_array, interpretations, quality_flags, cross_reference_findings, risk_factors, recommendations, claims, confidence, status, ...) bütçe dolana kadar alır. Çıktı kompakt JSON.
3. **Smart slice (head + tail):** Parse edilemiyorsa bütçenin %60'ı baş + %30'u son + `[... digest: middle content summarized ...]` marker. Tail'deki kritik bulguları koruyor.

**Fail-safe:** Her adımda error yakalanır, legacy front-only `.slice(0, N)` fallback'ine döner. Null/undefined girdilere dayanıklı.

**Opts:**
- `mode: 'smart' | 'truncate'` — call-site'ta `truncate` zorlanabilir (archival vs).
- `label` — log/diagnostic için.

### 2. `backend/src/upstream-digest.test.cjs` (YENİ — 7 test)

Kritik senaryolar dahil:

```
OK test_raw_passthrough
OK test_json_digest (kept: executive_summary, findings, metrics_array, ratio=30.1x)
OK test_smart_slice_head_and_tail
OK test_legacy_truncate
OK test_null_safety
OK test_idempotent
OK test_ebitda_scenario — smart mode rescues the tail finding
```

`test_ebitda_scenario` özellikle önemli: legacy truncate'in tail'deki "EBITDA calculation off by 18%" bulgusunu nasıl DÜŞÜRDÜĞÜNÜ, smart mode'un ise nasıl KURTARDIĞINI kanıtlıyor.

### 3. `backend/src/orchestrator.ts` — 11 slice noktası digest'e çevrildi

| Satır | Agent | Eski | Yeni |
|---|---|---|---|
| 548 | financial_analysis hybrid LLM | `pythonOutput.slice(0, 30000)` | `digestUpstream(pythonOutput, 30000)` |
| 488 | technical_analysis hybrid LLM | `.slice(0, 10000)` | `digestUpstream(..., 10000)` |
| 644 | sentiment_news hybrid LLM | `.slice(0, 20000)` | `digestUpstream(..., 20000)` |
| 702-706 | strategic_synthesis (5 upstream) | 5× `.slice(0, N)` | 5× `digestUpstream(...)` |
| 788 | valuation_agent ← FA | `.slice(0, 15000)` | `digestUpstream(..., 15000)` |
| 799 | valuation_agent hybrid LLM | `.slice(0, 20000)` | `digestUpstream(..., 20000)` |
| 851 | analyst_consensus hybrid LLM | `.slice(0, 15000)` | `digestUpstream(..., 15000)` |
| 899 | esg_agent hybrid LLM | `.slice(0, 10000)` | `digestUpstream(..., 10000)` |

**Dokunulmayan slice'lar (bilinçli):**
- DB storage kapakları (`slice(0, 1000000)`) — veritabanına yazımda tam raw tutuluyor.
- Hata mesajı slice'ları (200 char) — log amaçlı.
- Helper fonksiyon slice'ları (1985/2020/2052) — prompt'a inject etmeyen, çıktı kuyruğu trimmer'ları.
- `qa_revision_feedback_{agentId}` routing (Phase 3A+) — zaten agent-spesifik, kısa.

### 4. `backend/src/orchestrator.ts` — Phase 6A → 6B checklist enforcement

Phase 6A sadece log atıyordu. Şimdi:

- **`CHECKLIST_ENFORCEMENT_MODE=observe`** → eski Phase 6A davranışı
- **`CHECKLIST_ENFORCEMENT_MODE=warn`** (default) → log + threshold altındaysa CEO gate'in `approvalFailures` listesine eklenir (informational)
- **`CHECKLIST_ENFORCEMENT_MODE=block`** → addressal_rate < `CHECKLIST_MIN_ADDRESSAL_RATE` (default 0.85) ise CEO gate hard-fail

Threshold env'den ayarlanabilir: `CHECKLIST_MIN_ADDRESSAL_RATE=0.85`.

### 5. `backend/src/config.ts` — yeni flag'ler

```typescript
export const UPSTREAM_DIGEST_MODE = (process.env.UPSTREAM_DIGEST_MODE || 'smart') as 'smart' | 'truncate';
export const CHECKLIST_ENFORCEMENT_MODE = (process.env.CHECKLIST_ENFORCEMENT_MODE || 'warn') as 'observe' | 'warn' | 'block';
export const CHECKLIST_MIN_ADDRESSAL_RATE = parseFloat(process.env.CHECKLIST_MIN_ADDRESSAL_RATE || '0.85');
```

## Tests

```bash
cd backend && npx tsc --noEmit                                                              exit 0
node backend/src/upstream-digest.test.cjs                                                    7/7 OK (test_ebitda_scenario dahil)
python canonical/_loader/python/loader.py --selftest                                         OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json       OK (15/15)
python evals/golden/canonical_structure_test.py                                              OK
```

## Runtime davranışı değişimi

**ÖNCESİ:** financial_analysis 100 KB çıktı üretir, strategic_synthesis sadece ilk 15 KB'ı görür, son 85 KB (bulgular/öneriler dahil) düşer. QA bulgusu "EBITDA 18% yanlış" tail'deyse agent görmez, düzeltemez.

**SONRASI:**
- JSON parse edilebiliyorsa SIGNAL_FIELDS önceliği ile 30:1 compression (test ratio'su).
- Parse edilemiyorsa %60 head + %30 tail — tail'deki findings korunur.
- Checklist enforcement `warn` moduna alındı: addressal yetersizse CEO gate'e `approvalFailures` listesine düşer, Chairman loguna yansır.

## Feature flag rollback

Sorun çıkarsa:

```bash
# Legacy davranışa dön (slice(0, N)):
export UPSTREAM_DIGEST_MODE=truncate
# Checklist enforcement'ı kapat (Phase 6A gözlem-modu):
export CHECKLIST_ENFORCEMENT_MODE=observe
```

Restart gerek, yeniden compile gerek değil.

## Kapsam dışında (bilinçli)

- **§5 tool-based section retrieval:** `fetch_report_section` tool call mekaniği Claude Code CLI'ı için kolayca eklenemez (SDK mode gerekiyor). Smart digest bu iş için yeterli bir proxy.
- **§8.1 prompt caching:** Claude Code CLI'ın otomatik cache'i zaten devrede; SDK-seviye cache_control ek refactor gerektirir.
- **`block` modu default değil:** Canlı testten önce `warn`'de bırakıyoruz; ilk run'dan sonra addressal tipik değerlerini görüp 0.85 threshold'unu kalibre ederiz.
