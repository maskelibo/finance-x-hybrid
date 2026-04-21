# Phase 3 Readiness — Migration Roadmap

> Bu belge, önceki "4 binary karar" versiyonunun **yerine geçer**. Codex'in 7-aşamalı rollout kuralını kabul eden güncel plan budur.
>
> Kural: Canlı davranışı değiştiren hiçbir değişiklik atomik olarak uygulanmaz. Her biri **observe → shadow → flag → cohort → regression → kademeli → hard** aşamalarından geçer.

- Generated: 2026-04-21
- Önceki versiyon: git `b66f7993:refactor/reports/phase_3_readiness.md` (binary karar tablosu).

---

## 7-aşamalı rollout kuralı (her riskli değişiklik için zorunlu)

| # | aşama | ne yapılır | geçiş kriteri |
| --- | --- | --- | --- |
| 1 | **observe-only** | Yeni kural/karar mevcut davranışın yanına log olarak yazılır. Canlı davranış değişmez. | Log sistemi bir haftalık canlı veri topladı |
| 2 | **shadow-warn** | Aynı log + konsol/dashboard uyarısı. Hâlâ bloklamaz. | İlk aşamada toplanan veriye bakıp "bloklanan durumların X% gerçekten bloklanmalıydı" dedik |
| 3 | **feature flag** | `FINANCEX_QA_HARD_BLOCK=1` gibi env flag. Flag kapalıyken status quo, açıkken sert. Default kapalı. | Flag 1 ticker × 1 mod'da 5+ seans çalıştı, regresyon yok |
| 4 | **cohort rollout** | Flag bir ticker kohortu (ör. {TUPRS}), bir mod (ör. fast_screening) için açılır. | Kohortta kalite golden baseline'ı aşıyor |
| 5 | **regression check** | Her genişletmeden önce `evals/golden/coverage_matrix.py --baseline` yeşil olmak zorunda | — |
| 6 | **kademeli yayılım** | Cohort büyütülür: 1 ticker → 3 → 10 → tüm BIST30. Her adımda #5 tekrar. | — |
| 7 | **hard enforcement** | Flag default-on, observe log'u tarihe karışır. | — |

Tüm riskli işler bu pattern'i takip eder. Atlama yok.

---

## Per-migration durum tablosu

| migration | hedef sertlik | bugün | ≤ 1 hafta | ≤ 1 ay |
| --- | --- | --- | --- | --- |
| QA gate hardening | soft → hard block | observe-only (Phase 3A) | shadow-warn | cohort rollout |
| CEO approval gate hardening | soft → hard block | observe-only (Phase 3A) | shadow-warn | cohort rollout |
| Schema `minLength`/`minItems` enforcement | soft string → depth-enforced | shadow validator (Phase 3A) | shared contract opsiyonel alanlar + 4-kategori classifier (Phase 4A) | per-agent opt-in flag (Phase 4B) |
| Validation retry gate | yok → 4-kategori retry | scaffold + observe only (Phase 4A) | shadow-warn (Phase 4B) | flag + cohort (Phase 4C) |
| Manifest/retrieval contract | yok → dual-write | manifest extractor + observe-only (Phase 5A) | dual-write (Phase 5B) | dual-read pilot (Phase 5C) |
| QA checklist enforcement | yok → findings/addressed tam kapsama + retry/escalation | session addressal aggregator observe-only (Phase 6A) | dashboard kırmızı bayrak (Phase 6B) | retry route + CEO escalation (Phase 6C) |
| Formatter Chart.js vs SVG | çelişkili | agent_spec.json OI-007'ye hizalı + OI-007/003/008 shadow rules (Phase 7A) | shadow-warn (Phase 7B) | agent_spec otorite tek sese indi |
| Memory purge | prose → ≤2 KB | — (canonical henüz kanıtlanmadı) | — | canonical proof sonrası |
| Dead code deletion | statik → silinmiş | — (her zaman en son) | reference proof | archive + silme |
| Regression harness | 15 rapor × 12 metrik | extended goldens (canonical_rule_refs + evidence_citations + section_count) + canonical structure test (Phase 10A) | quality scorecard (Phase 10B) | historical trend dashboard (Phase 11) |
| Observability dashboard | yok → canlı | 6 API endpoint + static UI (Phase 11A) | trend grafikleri (Phase 11B) | alerting + CSV export (Phase 11C/D) |

---

## Phase 3A — şimdi yapılacak observe-only işler

Hiçbir canlı davranış değişmez. Yalnızca veri toplanır.

### 3A.1 — QA gate observe-only logger

**Ne:** `orchestrator.ts` içindeki QA revision loop'una (line 1244 civarı), her tur sonrası şu alanları DB'ye yazan kod eklenir:

- `qa_round`
- `qa_keyword_block_triggered` (bool)
- `qa_score_block_triggered` (bool)
- `qa_score_value` (numeric)
- `qa_would_have_blocked` (bool) — keywordBlock OR scoreBlock
- `qa_decision_taken` (string) — `'continued'` / `'revised'` / `'delivered_with_warning'`

Hedef tablo: yeni `agent_run_gate_events` tablosu (şema Phase 3A migration ile gelir).

**Canlı davranış değişimi:** **YOK.** Mevcut break/revise/continue mantığı aynı.

### 3A.2 — CEO approval gate observe-only logger

**Ne:** `orchestrator.ts:1515-1536` CEO approval gate'ine, `approvalFailures` boş olmadığında şu alanlar yazılır:

- `ceo_approval_failure_count`
- `ceo_approval_failure_reasons` (JSON array)
- `ceo_would_have_blocked` (bool)
- `ceo_decision_taken` — şu an `'continued_with_warning'`

**Canlı davranış değişimi:** **YOK.**

### 3A.3 — Schema shadow validator

**Ne:** İkinci bir AJV örneği, her agent çıktısını `canonical/rules/mandatory_metrics.yaml` + `interpretation_depth` kurallarına karşı doğrular. Fail ederse **rejection yok**, sadece `agent_runs.schema_shadow_violations` JSON kolonuna yazılır.

Mevcut hafif validator (`backend/src/schema-validator.ts`) otorite olarak kalır.

**Canlı davranış değişimi:** **YOK.**

### 3A.4 — 5 agent registry güncellemesi

**Ne:** `agents_registry.json`'a `coo`, `valuation_agent`, `esg_agent`, `sentiment_news_agent`, `analyst_consensus_agent` eklenir. `reports_to`/`supervises` alanları mevcut runtime bağımlılık grafığından çıkarılır.

**Canlı davranış değişimi:** **YOK** — runtime zaten bu agent'ları çalıştırıyor. Registry şimdi runtime ile hizalanıyor.

**Risk:** Düşük — dashboard gibi registry okuyan tüketiciler şimdi tam listeyi görür. Daha az değil.

### 3A.5 — Context budget migration'ı uygula

**Ne:** `backend/src/migrations/phase2_context_budget.sql`'i canlı DB'ye uygula. 13 yeni nullable kolon, 3 index.

**Canlı davranış değişimi:** **YOK** — kolonlar NULL olarak doğar, Phase 3B'de `agent-runner.ts` doldurmaya başlar.

**Risk:** Çok düşük — salt-additive ALTER TABLE, pre-tarball var.

---

## Phase 3A geçiş kriteri

Phase 3A → 3B geçişi için:

1. `agent_run_gate_events` tablosunda ≥ 10 seans verisi birikti.
2. `qa_would_have_blocked` ve `ceo_would_have_blocked` dağılımları incelenip, "gerçek bloklama adayı" oranı insan gözüyle değerlendirildi.
3. `schema_shadow_violations` örnekleri tarandı, hangi kuralın hangi ticker'da hata verdiği somut.
4. Regression yeşil: `python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json` → exit 0.

Hiçbir şey otomatik olarak sert enforcement'a geçmez. Faz 3B'ye geçmeden kullanıcı onayı zorunlu.

---

## Phase 3B — shadow-warn (sonraki adım, yetki beklenir)

Veriler eline geldikten sonra:

- QA gate: block etmez ama **dashboard'a kırmızı bayrak bas** + kullanıcıya e-posta / Slack bildirimi.
- CEO gate: aynı.
- Schema shadow: violations count'u belirli eşiğin üstüne çıkarsa CEO activity log'a yazılır.

Hâlâ blocking değil. Ama insan görmüyorsa çözüm olmayacağı için görünürlük eklenir.

---

## Phase 3C — feature flag + cohort

Bir flag varsayılanı kapalı:

- `FINANCEX_QA_HARD_BLOCK_TICKERS=TUPRS,ASELS` → sadece bu ticker'larda sert, diğerlerinde eskisi gibi.
- `FINANCEX_SCHEMA_DEPTH_ENFORCE_AGENTS=financial_analysis` → sadece bu agent için sert schema.

Her flag açılışı öncesi:

1. Baseline rerun (goldens)
2. 3 gün observe verisi
3. Kullanıcı onayı
4. Aç

Sorun çıkarsa: flag kapat, rollback 1 env değişkeni.

---

## Phase 3D — kademeli yayılım

Cohort 1 ticker × 1 mod → 3 ticker × 2 mod → 10 ticker × 3 mod → BIST30 × 3 mod.

Her genişletmede goldens yeşil olmak zorunda. Regresyon = rollback.

---

## Phase 3E — hard enforcement

Flag default-on. Observe kolonları tutulmaya devam eder (post-hoc analiz için) ama karar onlardan gelir.

---

## Güvenli Kozmetik İşler (Phase 3A içinde, decision beklemeden)

Bu üçü migration değil, hiçbir davranış değiştirmiyor:

- **Docs alignment** — `AGENTS.md` + `workflows/full_integrated_analysis.md`'deki agent sayıları canonical ile hizalı hale getirilir (fast=16, standard=18, deep=22). Statik dokümantasyon.
- **Registry 5-agent ekleme** (yukarıda 3A.4).
- **Canonical reference ekleme** — prompt/memory lint'in flagged ettiği noktalara canonical id referansları eklenir. Prose silinmez, yanına "see MM-07" notu eklenir. Phase 3B prose'u kaldırır.

---

## Kullanıcıdan BEKLENMEYEN kararlar (artık)

Önceki versiyonda 4 binary karar istemiştim. Artık yok:

- ~~"QA hard block?" evet/hayır~~ → Observe-only ile başlar, veri sonrası insan bakar.
- ~~"CEO hard block?" evet/hayır~~ → Aynı.
- ~~"Chart.js mi SVG mi?"~~ → Ölçüm sonrası karar.
- ~~"5 agent shipped mi experimental mi?"~~ → Runtime şimdiden shipped gibi davranıyor; registry hizalanır. Phase 3D'de "experimental" geri adımı mümkün.

---

## Kullanıcıdan BEKLENEN tek şey

Bu belgeyi okuduğunu ve **observe-only aşamasıyla devam etmemi onayladığını** söylemen. Zaten söyledin ("A onaylıyorum"), işler 3A başladı.

Phase 3A sonunda:

- `agent_run_gate_events` tablosunda gerçek veri birikmiş olacak.
- `schema_shadow_violations` kolonlarında hangi metrik/yorumun derinlik kuralını ihlal ettiği görülecek.
- Bu veriye **insan** bakacak, Phase 3B'ye geçilip geçilmeyeceğine onun gözetiminde karar verilecek.

Gece otomatik olarak 3B'ye geçmem. Her aşamanın gate'i insan.
