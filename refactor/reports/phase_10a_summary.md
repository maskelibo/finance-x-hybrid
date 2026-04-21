# Phase 10A Summary — Regression Harness Extension

- Branch: `refactor/phase-10a-regression-extension`
- Başlangıç: `refactor/phase-7a-formatter-doctrine` HEAD (commit 9be9e7ff)
- Davranış değişimi: **SIFIR**. Sadece test-side eklentiler.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §8 adım 11 (Regression harness ve quality
scorecard kur). Brief Faz 10 (Regression Testing & Quality Gates).

Phase 10A canlı koda dokunmaz; golden harness'ı önceki fazlar için kurulan
tüm observasyon noktalarını yakalayacak şekilde genişletir ve canonical
layer'ın yapısal sağlamlığını deterministic test altına alır.

## Ne yapıldı

### 1. `evals/golden/coverage_matrix.py` — 3 yeni sinyal

| Sinyal | Ne ölçer | Neden önemli |
| --- | --- | --- |
| `canonical_rule_refs` | Raporda MM-XX / NH-XXX / OI-XXX / CT-XXX / IAS29-XXX / SR-* / TM-* token sayısı | Phase 8 memory purge için "canonical kanıtlandı" gate'inin sayısal kanıtı |
| `evidence_citations` | Not X / Footnote / sayfa / KAP disclosure / document_id markerları | Phase 6 checklist enforcement evidence floor ölçümü |
| `section_count` | Top-level `<h1>` + `<h2>` + `#/##` markdown header sayısı | OI-003 12-section floor'un tahmini ölçümü |

Her üçü de `GUARDED_UP_SIGNALS` kümesine eklendi — rapor regresyonlarında
yakalanıyor.

**Geriye dönük uyumluluk:** `diff_vs_baseline` eski baseline'da olmayan
alanları atlar (`if field_name not in b: continue`). Bu sayede
`baseline_20260421.json` halen geçerli — eski regression çalıştırmaları
kırılmıyor.

Terminal özeti kolonları güncellendi: `canon`, `evid`, `secs` eklendi.

### 2. `evals/golden/canonical_structure_test.py` (YENİ)

Canonical layer'ın yapısal audit'i. Deterministic, salt-okuyucu.

Kontroller:
- **MM-01..MM-28** hepsi `canonical/rules/mandatory_metrics.yaml` içinde
- **NH-001..NH-006** `null_handling_protocol.md` içinde
- **CT-001..CT-006** `confidence_taxonomy.md` içinde
- **IAS29-001..IAS29-006** `ias29_protocol.md` içinde
- **OI-001..OI-008** `output_integrity.md` içinde
- Her `canonical/sectors/*.yaml` için: `sector_id`, `tickers`,
  `primary_metrics` alanları var, `sector_id` dosya ismine uyuyor,
  `tickers` BIST pattern'ına uyuyor (`industrial_generic` fallback hariç)
- `canonical/contracts/pipeline_modes.yaml` içinde 3 mode tanımlı
- `canonical/contracts/agent_io_contracts.yaml` backbone 11 agent içeriyor

İlk çalıştırmada 3 gerçek yapısal sorun tespit etti, sonra ayarlandı:
- mandatory_metrics YAML mapping (list değil) — test her iki şekli kabul ediyor
- industrial_generic tickers:[] intentional fallback — istisna eklendi
- agent_io_contracts agents: nested mapping — her 3 yapı destekleniyor

Bugünkü state: **canonical structure: OK**.

### 3. `evals/golden/baseline_20260421_phase10a.json` (YENİ)

Extended baseline — 3 yeni sinyal dahil donduruldu.

- Eski `baseline_20260421.json` dokunulmadı, halen geçerli
- CI / manuel regression run'larında iki baseline birden çalıştırılabilir
- Phase 10B'den itibaren yeni baseline `baseline_20260421_phase10a.json`
  kullanılır; Phase 11 dashboard'u ondan okur

Baseline istatistikleri:
- reports: 15
- metric presence: 232/420 = 55.2% (değişmedi)
- canonical_rule_refs: 0 — beklenen. Canonical layer Phase 2'de landed,
  prompt'lar henüz referans vermiyor. Phase 3.1+ refactor'ı ilerledikçe bu
  sayı artmalı.
- CoE covered: 0/15 (değişmedi)

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
python canonical/_loader/python/loader.py --selftest       OK (50+ cross-checks)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json
                                                           OK (15/15 no regression, pre-phase10a base)
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421_phase10a.json
                                                           OK (15/15 new signals baselined)
python evals/golden/canonical_structure_test.py            canonical structure: OK
python refactor/tools/prompt_memory_lint.py                20 hard / 27 soft / 130 info (baseline)
```

## Canlı davranış beklenen değişimi

**Hiçbir.** Yalnızca test/eval katmanı.

## Phase 10A → 10B geçiş kapısı

10B Quality Scorecard'a geçmek için:

1. Phase 4A/5A/6A migration'ları uygulandı, en az 10 seans koştu.
2. `canonical_rule_refs` sinyali fiilen artmaya başladı (prompt'lar
   canonical id'ye referans veriyor olmalı). Hedef: en az 5 rapor ≥ 10 ref.
3. `section_count` sinyali HTML rapor başına ≥ 12. Bugün bazı raporlar 0;
   Phase 7B'nin shadow-warn çalışmasıyla bu oranlar kayıt altına alınır.
4. İnsan "quality scorecard dashboard'u başlatabiliriz" dedi → Phase 11'e
   geçiş.

## Kapsam dışında (sonraki fazlar)

- Canonical ref dağılımı ticker × mode matrisi (Phase 10B).
- Section coverage: 12-section matcher (şu an sadece count). Phase 10B.
- Evidence quality skoru (audited vs estimate vs proxy). Phase 10C.
- Historical trend dashboard (Phase 11).
