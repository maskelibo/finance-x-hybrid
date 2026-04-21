# MacBook Handoff — Finance-X Hybrid Refactor
## Her şey bu belgede. Windows'tan devralırken tek bu dosyayı oku.

- **Hazırlandı:** 21 Nisan 2026 (Windows, gece oturumu)
- **Devralacak platform:** MacBook
- **Repo:** https://github.com/maskelibo/finance-x-hybrid
- **Aktif branch:** `refactor/phase-3a-observe-only`
- **Master'a merge edilmedi** — hiçbir refactor master'da değil, hepsi feature branch'lerde.

---

## 0. İlk 5 Dakika — MacBook'ta Ne Yap

```bash
cd ~/projeler/finance-x-hybrid   # veya klonla
git fetch origin
git checkout refactor/phase-3a-observe-only
git pull

# Sağlıklı mı kontrol:
python canonical/_loader/python/loader.py --selftest
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json

# Opsiyonel: phase 3A migration'larını canlı DB'ye uygula
#   (Windows'ta henüz uygulanmadı — her platformda tek bir kez)
# sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql
# sqlite3 backend/finance-x.db < backend/src/migrations/phase3a_gate_events.sql
```

Phase 3A observer'ları migration olmadan sessizce no-op olur (ilk çağrıda stdout'a bir uyarı basar). Migration uygulanınca gerçek veri toplanmaya başlar.

---

## 1. Branch Haritası

| Branch | Son commit | Durum | İçerik |
|---|---|---|---|
| `master` | 496bf56c | Dokunulmadı | Refactor öncesi baseline |
| `refactor-phase-1-inventory` | 738fea1c | Kilitli (read-only envanter) | 8 audit raporu + Executive Summary |
| `refactor/phase-2-canonical` | 3ba03758 | Kilitli | `canonical/` + golden baseline + migration SQL |
| `refactor/phase-3a-observe-only` ⭐ | f6ad9392 | **AKTİF** | Gate observer'lar + pending fixes + TUPRS v2 WIP |

`refactor/phase-3a-observe-only` = son her şey burada. Phase 3B'ye başlamadan yeni bir branch açılır (`refactor/phase-3b-shadow-warn`).

---

## 2. Ne Yapıldı (18-21 Nisan — 8 Commit)

### Faz 1 — Envanter (20 Nisan)
Commit **738fea1c**. 8 Python audit scripti + 8 markdown raporu. Hiçbir kaynak dosya değişmedi. Dosya: `refactor/inventory/EXECUTIVE_SUMMARY.md`.

### Faz 2 — Canonical Truth Source (21 Nisan)
Commit **b66f7993**. `canonical/` klasörü kuruldu:
- `canonical/tickers/sector_mapping.yaml` — 25 ticker hardcoded (THYAO→aviation, TUPRS→energy_refining, …)
- `canonical/rules/` — 28 metrik, null handling, confidence, output integrity, IAS 29 (5 dosya)
- `canonical/sectors/` — 9 sektör playbook (aviation, steel, banking, telecom, defense, retail, holding, energy_refining, industrial_generic)
- `canonical/contracts/pipeline_modes.yaml` — fast=16 / standard=18 / deep=22 agent (runtime gerçeği)
- `canonical/contracts/agent_io_contracts.yaml` — 26 agent IO özeti
- `canonical/glossary/` — terms + abbreviations
- `canonical/_loader/python/loader.py` — Python loader, CLI var, selftest 50+ cross-check
- `canonical/_loader/ts/loader.ts` — subprocess shim TS versiyonu

**Hiçbir agent canonical'a bağlanmadı** — paralel tutuluyor. Faz 3.1'de prompt'lar migrate edilecek.

Ayrıca:
- **Golden regression harness** (`evals/golden/coverage_matrix.py`) — 15 pinli rapor, %55.2 metrik + 0 CoE donduruldu. Her Phase 3+ commit bu çizgiyi aşmak zorunda.
- **Context budget migration** (`backend/src/migrations/phase2_context_budget.sql`) — `agent_runs`'a 13 nullable kolon + 3 index. **UYGULANMADI**, MacBook'ta bir kez uygulanacak.
- **Runtime drift audit** (`refactor/inventory/runtime_drift_audit.md`) — Codex'in 5 iddiası kod okumasıyla doğrulandı.
- **Roster reconciliation** (`refactor/inventory/roster_reconciliation.md`) — 26 filesystem vs 21 registry vs 22 runtime.

### Faz 2.5 — Lint + Readiness (21 Nisan)
Commit **3ba03758**. Mekanik:
- `refactor/tools/prompt_memory_lint.py` — size/duplicate/stale/canonical-candidate taraması. Baseline 20 hard / 27 soft / 130 info (`refactor/inventory/lint_baseline_20260421.txt`).
- Loader selftest genişletildi (ticker→playbook, mode→agent, canonical id format kontrolleri).
- **`refactor/reports/phase_3_readiness.md` YENİDEN YAZILDI** — 4 binary karar yerine **7-aşamalı migration roadmap** (observe → shadow-warn → feature flag → cohort → regression → kademeli → hard). Codex'in önerisiyle uyumlu.

### Faz 3A — Observe-Only Instrumentation (21 Nisan)
Commit **1f130566**. Canlı davranış SIFIR değişti. Eklenenler:

- `backend/src/migrations/phase3a_gate_events.sql` — yeni `agent_run_gate_events` tablosu + `agent_runs`'a 3 ek kolon. **UYGULANMADI**.
- `backend/src/gate-observer.ts` — `recordQaGateObservation` / `recordCeoGateObservation` / `recordSchemaShadowObservation` / `markQaWouldBlockLast`. Migration yoksa sessiz no-op.
- `backend/src/schema-shadow-validator.ts` — canonical depth kurallarını log-only uygulayan ikinci validator.
- `orchestrator.ts`'a 5 observer call eklendi (QA gate pass/revise/max-rounds, CEO gate pass/continued-with-warning, agent completion). `break` / `return` akışı değişmedi.
- `agents_registry.json` → 21 → **26** agent. Eklenenler: `coo`, `valuation_agent`, `esg_agent`, `sentiment_news_agent`, `analyst_consensus_agent`.

### Faz 3A+ — Pending Fixes (21 Nisan)
Commit **b6400c4f**. `memory/finance_x_pending_fixes.md`'deki 3 görevden **#1 ve #3** yapıldı:

- **#1 compose.ts parseJson fallback** — JSON buried in markdown (fenced ```json, STRUCTURED DATA APPENDIX, balanced brace scan) artık rescue. Fallback fail olursa null → mevcut "Raporlanmadı" davranışı. Sıfır regresyon.
- **#3 QA per-agent routing** — `qa_revision_feedback = qaOutput.slice(0,5000)` blind slice, `quality_flags[].agent` parse edilirse per-agent slice ile değiştiriliyor. Parse fail olursa 5K fallback.
- **#2 Delta revision** — önceki karar: "rafa kaldır; token maliyeti gerçek problem olursa düşünürüz". Hâlâ beklemede.

Her ikisi smoke test edildi (Python mirror logic, 5-6 senaryo) ama **canlı pipeline testinden geçmedi**.

### TUPRS v1 Raporu
Commit **5f87fa92**. 12 bölüm institutional rapor. **Kullanıcı reddetti** ("bok gibi olmuş" — 21 Nisan, ~03:00).
Ana hatalar:
- **STAR Rafinerisi İzmit olarak etiketlendi** — faktör hatası. STAR = SOCAR Aliağa rafinerisi, Tüpraş'ın rakibi, ayrı şirket.
- FY2025 verisi yok, sadece FY2024
- 5 yıllık karşılaştırma yok
- SWOT sığ, teknik analiz yüzeysel, değerleme senaryosu kısıtlı
- Çok az görsel (1 SVG)
- Sektör rekabet eksik (SOCAR STAR hiç yok)
- Çoğu rakam "tahmini"

### TUPRS v2 WIP
Commit **f6ad9392**. Bölüm 1-4 tamam, 5 SVG grafik, SOCAR STAR fix. FY2025 audited verileri çekildi (net kâr 29,9 mia TL +%20, kapasite %93,6 rekor, net nakit +90,6 mia TL). Dosya: `output/TUPRS_Derin_Analiz_Raporu_v2_20260421.html`.

**Kalan 8 bölüm yazılmadı** (ayrıntı Bölüm 3).

---

## 3. NE YAPILMADI — Önceliklendirme ile

### Acil (ilk 1-2 saat MacBook)

#### A.1 DB Migration Uygulaması
```bash
cp backend/finance-x.db backups/finance-x_pre_phase2+3a_$(date +%Y%m%d_%H%M%S).db
sqlite3 backend/finance-x.db < backend/src/migrations/phase2_context_budget.sql
sqlite3 backend/finance-x.db < backend/src/migrations/phase3a_gate_events.sql
sqlite3 backend/finance-x.db 'SELECT name FROM sqlite_master WHERE type="table" AND name="agent_run_gate_events";'
```
Migration applied → observer'lar bir sonraki seansta gerçek veri yazmaya başlar.

#### A.2 Canlı Pipeline Testi (Phase 3A Kapısı)
Bir ticker için `standard_institutional` modda çalıştır (TUPRS veya yeni). Hedef:
- Phase 3A observer'ların gerçek veri ürettiğini doğrula: `SELECT gate_kind, decision_taken, COUNT(*) FROM agent_run_gate_events GROUP BY 1,2;`
- compose.ts fallback'in LLM markdown çıktısını rescue ettiğini doğrula (rapor "Raporlanmadı" yerine sayı gösteriyor mu)
- QA per-agent routing log'unu gör: `grep "[QA ROUTING]" logs/` veya stdout'ta
- Şema shadow validator ihlallerini incele: `SELECT agent_id, schema_shadow_violation_count FROM agent_runs WHERE schema_shadow_violation_count > 0;`

### Kısa vade (1-2 gün)

#### B.1 TUPRS v2 Bölüm 5-12 Tamamla
`output/TUPRS_Derin_Analiz_Raporu_v2_20260421.html` yarım. Eksik bölümler:
- **Bölüm 5 Finansal Analiz** — 28 metrik her biri için ayrı block (`<div class="metric-block">`) + observation/reasoning/counterargument/implication yorumu. ROE vs CoE bar chart, net cash waterfall, CCC decomposition, CAPEX split grafikleri eklenecek.
- **Bölüm 6 Değerleme** — DCF 3 senaryo + sensitivity tornado grafiği (horizontal bar for crack spread / WACC / terminal g etkisi). SOTP segment bazında + peer multiples.
- **Bölüm 7 Makro** — Türkiye makro zemini, transmisyon parametreleri, CBAM/ETS zaman çizelgesi.
- **Bölüm 8 KAP Olaylar** — Son 18 ay + izleme listesi.
- **Bölüm 9 Teknik Analiz** — 20/50/100/200 MA, MACD, RSI, Fibonacci seviyeleri, Bollinger bands, destek/direnç.
- **Bölüm 10 Risk Haritası** — Heat matrix grafiği (probability × impact bubble chart) + 2026-2027 stress test.
- **Bölüm 11 Yatırım Tezi** — Long/short arg, sentez, izleme tetikleyicileri.
- **Bölüm 12 Bildirimler** — Kaynaklar, disclaimers, canonical uyumluluk tablosu.

Veri kaynakları (hepsi elimizde):
- `output/bist30/TUPRS/TUPRS_faaliyet_2025.txt` (41.668 satır, 2025 entegre rapor) — SAF hedefi 300 bin t/y, propilen 180 bin t/y, kapasite KPI'ları detaylı
- `output/bist30/TUPRS/TUPRS_finansal_2025.txt` (3.710 satır, EY denetli 2025 finansal tablolar) — IS/BS/CF/SE dahil
- `output/bist30/TUPRS/TUPRS_fact_pack.md` (canonical fact pack, Data Collection 2026-04-19)
- `context_extraction_tuprs_output.json` — FY2025 pretax rafinaj 43,2 mia TL, Entek 517,8 mn TL

#### B.2 STAR Rafinerisi Fact Pack Düzeltmesi
`output/bist30/TUPRS/TUPRS_fact_pack.md` içinde İzmit rafinerisi "(STAR)" olarak geçiyor — bu yanlış. Gerçekte Tüpraş'ın İzmit rafinerisi STAR değil, STAR Rafinerisi SOCAR Aliağa'nın ayrı bir tesisi. Fact pack'i düzelt ve v2 raporu final etmek için başka yerde de kontrol et.

Tüpraş'ın 4 rafinerisi: **İzmit**, **İzmir (Aliağa)**, **Kırıkkale**, **Batman**.
SOCAR STAR Rafinerisi (Aliağa, 10 mt/y, 2018 açıldı) **ayrı şirket** — Tüpraş'ın iç pazar rakibi.

### Orta vade (1-2 hafta)

#### C.1 Phase 3B — Shadow Warn (observe verisi biriktikten sonra)
10+ seans veri birikince insan veriye bakar, sonra:
- QA gate: warning + dashboard kırmızı bayrak (hâlâ bloklamaz)
- CEO gate: aynı
- Schema shadow: violation count eşiğin üstünde ise CEO activity log'a

Branch önerisi: `refactor/phase-3b-shadow-warn` (3A'dan fork).

#### C.2 Phase 3C — Feature Flag + Cohort
`FINANCEX_QA_HARD_BLOCK_TICKERS=TUPRS,ASELS` gibi env flag. Default kapalı. Cohort açıp regression check.

### Uzun vade (1+ ay — brief'in kalan fazları)

- **Phase 4** — Schema `minLength`/`minItems`/`enum` hardening (AJV soft mode önce, sonra hard)
- **Phase 5** — **Manifest + retrieval contract** (lost in the middle çözümü — biggest structural change)
- **Phase 6** — Checklist enforcement (QA findings ↔ addressed_findings set eşitlik)
- **Phase 7** — Map-reduce QA → formatter
- **Phase 8** — Paralel DAG executor (bugün 0 Promise.all, 10 seri await runAgent)
- **Phase 9** — Reasoning depth directives prompt'lara
- **Phase 10** — Regression harness extension (Coverage matrix test per Codex 7.5)
- **Phase 11** — Observability dashboard

---

## 4. Codex'in 7 İnovasyonu — Durum

| # | İnovasyon | Durum | Not |
|---|---|---|---|
| 7.1 | Rule compiler (canonical → prompt/schema/validation türetici) | **Yapılmadı** | Canonical 1 günlük; önce 2-3 hafta stabil olmalı. Phase 2.5. |
| 7.2 | Provenance ledger (evidence registry) | **Yapılmadı** | Mevcut `evidence_refs` şemasını genişletme önerildi. Phase 4'e dahil. |
| 7.3 | Context budget logging | **Hazır, uygulanmadı** | `phase2_context_budget.sql` yazıldı, DB'ye uygulanacak. |
| 7.4 | Failure taxonomy + retry routing | **Yapılmadı** | Phase 6'da. 4 kategoriyle başla (missing_metric / shallow / unaddressed / parse_failure). |
| 7.5 | Coverage matrix tests (ticker × sektör × metrik) | **Kısmen** | `evals/golden/coverage_matrix.py` var; sektör matrix'i eksik. |
| 7.6 | Prompt/memory lint (mekanik) | **Yapıldı** | `refactor/tools/prompt_memory_lint.py`. CI hook eksik. |
| 7.7 | Report section manifest | **Yapılmadı** | Phase 5 manifest pattern ile birleşecek. |

---

## 5. Codex'in 7-Aşama Rollout Kuralı (BENİMSENDİ)

Brief'teki "4 binary karar" yaklaşımı iptal edildi. Artık riskli her değişiklik:

1. **observe-only** — log + mevcut davranış
2. **shadow-warn** — log + dashboard uyarısı
3. **feature flag** — default off env flag
4. **cohort** — tek ticker × tek mod
5. **regression check** — goldens yeşil
6. **kademeli** — 1 → 3 → 10 → BIST30
7. **hard** — flag default on

Phase 3A aşama 1'de. Phase 3B aşama 2. Hiçbir atlamalı geçiş yok.

---

## 6. Kullanıcıdan Bekleyen Kararlar (Tartışmalı Konular)

Bu 4 soru Phase 3C'den itibaren cevap ister; Phase 3A/3B bekliyor olsun yeterli:

1. **QA gate sertleştirilsin mi?** A (hard block) / B (warn-only) / C (mode-dependent). Phase 3B verisi olmadan karar verme.
2. **CEO approval gate sertleştirilsin mi?** Aynı + Chairman override düğmesi var mı (B seçeneği).
3. **Chart.js vs SVG?** Şu an `OI-007` SVG-only diyor; `report_formatter/agent_spec.json` hâlâ Chart.js. Ölçüm (render her iki modda + PDF karşılaştır) sonrası karar.
4. **5 registry-added agent (coo, valuation_agent, esg_agent, sentiment_news_agent, analyst_consensus_agent) shipped mi experimental mi?** Product decision. Runtime şu an shipped gibi davranıyor.

---

## 7. Pipeline Migration Sırası (Brief Bölüm 11 + Codex rollout kuralı)

Phase → alt-aşama → zaman:

```
Phase 2 ✓ ────┐
              ├──→ Phase 2.5 (lint + readiness) ✓
              │
              ├──→ Phase 3A observe-only ✓────┐
              │                                 ├──→ Phase 3B shadow-warn (veri sonrası)
              │                                 │
              │                                 ├──→ Phase 3C feature flag
              │                                 │
              │                                 └──→ Phase 3D cohort rollout
              │                                                    │
              │                                                    └──→ Phase 3E hard
              │
              └──→ Phase 4 schema hardening (observe→hard kendi 7-aşaması)
                   └──→ Phase 5 manifest/retrieval (dual-write→dual-read→cutover)
                        └──→ Phase 6 checklist enforcement
                             └──→ Phase 7 map-reduce
                                  └──→ Phase 8 parallel DAG
                                       └──→ Phase 9 reasoning depth prompts
                                            └──→ Phase 10 regression extension
                                                 └──→ Phase 11 dashboard
```

---

## 8. Kritik Dosyalar (MacBook'ta İlk Bakacak Yerler)

**Refactor raporları:**
- `refactor/inventory/EXECUTIVE_SUMMARY.md` — Faz 1 + Faz 2 özet
- `refactor/reports/phase_3_readiness.md` — 7-aşamalı roadmap
- `refactor/reports/phase_3a_summary.md` — Phase 3A tam rapor
- `refactor/reports/MACBOOK_HANDOFF.md` — bu dosya

**Canonical:**
- `canonical/README.md` — hiyerarşi + id scheme
- `canonical/tickers/sector_mapping.yaml` — ticker → sektör
- `canonical/rules/mandatory_metrics.yaml` — 28 metrik

**Kod değişiklikleri:**
- `backend/src/gate-observer.ts` — Phase 3A observer'lar
- `backend/src/schema-shadow-validator.ts` — Phase 3A shadow
- `backend/src/orchestrator.ts` — 5 observer call site eklendi (line ~1300-1530)
- `backend/src/python/report_formatter/compose.ts` — parseJson fallback (line 48-102)
- `backend/src/migrations/*.sql` — uygulanmayan migration'lar

**Rapor artefaktları:**
- `output/TUPRS_Derin_Analiz_Raporu_v2_20260421.html` — v2 WIP (4/12 bölüm)
- `output/TUPRS_Derin_Analiz_Raporu_20260421.md` — v1 (reddedildi ama kapsamlı)
- `output/TUPRS_Derin_Analiz_Raporu_20260421.html` — v1 HTML

**Data:**
- `output/bist30/TUPRS/TUPRS_fact_pack.md` — canonical fact pack (STAR hatası var, düzelt)
- `output/bist30/TUPRS/TUPRS_finansal_2025.txt` — EY FY2025 audited
- `output/bist30/TUPRS/TUPRS_faaliyet_2025.txt` — 2025 entegre faaliyet raporu

---

## 9. Kısa Hatırlatmalar

- **macOS'ta `tsc` Windows'taki LF→CRLF warning'lerini görmez** — düzgün çalışır.
- **Prompt caching** Claude Code CLI tarafında otomatik (config.ts:33-37 yorumu) — ancak memory.md 6 KB'yi aştığı için cache miss yüksek. Phase 3B'de memory purge başlarsa cache hit oranı artacak.
- **Backup** — `backups/pre_phase2_code_20260421_003120.tar.gz` (1.5 MB, code surface only) mevcut. MacBook'tan önce yeni backup almak istersen aynı tarball mantığıyla: `tar --exclude=node_modules --exclude=.git --exclude=output -czf backups/pre_session_$(date +%Y%m%d_%H%M%S).tar.gz agents backend/src schemas prompts workflows scripts evals python-services/src skills canonical refactor agents_registry.json`.
- **Git identity** — kullanıcı.email ve kullanıcı.name Windows'ta **set edilmedi** (brief kuralı). Her commit `-c user.email=ibrahimpeyman@gmail.com -c user.name=Koray` ile override edildi. MacBook'ta aynı pattern kullanmak sağlıklı (veya bir kere `git config user.email ibrahimpeyman@gmail.com` + `git config user.name Koray` yeterli — lokal config).
- **Worktree** kullanmıyoruz; tek çalışma dizini.

---

## 10. Tek Cümle Özet

Phase 1 (envanter) + Phase 2 (canonical) + Phase 2.5 (lint) + Phase 3A (observe-only gate'ler + shadow validator + pending fix #1 ve #3 + 5 agent registry güncellemesi) tamamlandı; canlı davranış hiç değişmedi; TUPRS v2 raporu yarıda bırakıldı (4/12 bölüm); sıradaki iş MacBook'ta DB migration uygulanması + bir canlı pipeline seansı + v2 rapor bitirilmesi.
