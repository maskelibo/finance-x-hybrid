# Finance-X Hybrid — Codex Phase 1 Handoff for Claude

Bu not, repo üzerinde yaptigim derin Phase 1 incelemenin Claude'a dogrudan aktarilabilir ozetidir. Uretim mantigini degistirmedim; sadece audit yaptim ve bulgulari cikardim.

## Kapsam

- Sadece envanter, audit ve mevcut davranisin dogrulanmasi yapildi.
- Uretim koduna refactor uygulanmadi.
- Tespitler dokuman degil, runtime kodu + schema + gercek output ornekleri uzerinden dogrulandi.

## En kritik bulgular

1. Runtime ile dokumantasyon ciddi sekilde drift etmis durumda.
2. `fast_screening` gercekte 5-6 agent degil, 16 agent calistiriyor.
3. `standard_institutional` gercekte 18 agent, `deep_dive` 22 agent.
4. Memory ve prompt'lar sisik ama runtime bunlarin cok kucuk bir kismini kullaniyor.
5. Tek bir canonical truth source yok; ayni kural birden fazla yerde farkli bicimde yasiyor.
6. QA ve CEO gate'leri gercekte hard-stop degil; warning verip pipeline devam edebiliyor.
7. Schema enforcement doktrinde iddia edilenden belirgin sekilde daha zayif.
8. Formatter tarafinda kural tabani celiskili: bir yerde SVG-only, diger yerde hala Chart.js/do-it-yourself formatter mantigi var.
9. Gercek raporlarda zorunlu metrik kapsamasi dusuk; sektor KPI'lari sik sik eksik.
10. THYAO gibi sektor mapping problemi hala gercek HTML output'a siziyor.

## Kod seviyesinde dogruladigim teknik sorunlar

### 1. Runtime mode gercegi ile dokumanlar uyusmuyor

- `backend/src/orchestrator.ts` icinde `PIPELINE_BY_MODE` fiilen ayni.
- Gercek fark `MODE_DEFAULT_LAYERS` ve always-on backbone agent'lar uzerinden geliyor.
- Backbone tarafinda `ceo`, `coo`, `qa_review`, `strategic_synthesis`, `final_summary`, `report_formatter` gibi agent'lar hep devrede.
- Sonuc olarak `fast_screening`, dokumanda anlatilandan cok daha agir bir akisa donusmus.

Gercek agent sayilari:

- `fast_screening`: 16
- `standard_institutional`: 18
- `deep_dive`: 22

Bu nokta kritik cunku hem sure beklentisini hem de "mode differentiation" mantigini bozuyor.

### 2. Memory bloat var, ama runtime bunu kullanmiyor

- `backend/src/agent-runner.ts` icinde `MAX_MEMORY_BYTES = 6 * 1024`.
- Buna ragmen bircok `memory.md` dosyasi 20-44 KB bandinda.
- Ornek buyuk dosyalar:
- `agents/ceo/memory.md`: 44.34 KB
- `agents/context_extraction/memory.md`: 31.56 KB
- `agents/coo/memory.md`: 31.24 KB
- `agents/report_formatter/memory.md`: 31.10 KB
- `agents/financial_analysis/memory.md`: 30.59 KB

Yani memory doktrini ile runtime davranisi birbirinden kopmus. Bugun memory'ye yazilan kuralin buyuk kismi zaten prompt'a girmiyor.

### 3. Canonical truth yok, sektor/rule mapping daginik

- Ticker -> sektor mantigi tek yerde degil.
- Runtime'da keyword/heuristic detection var.
- Bazi formatter ve peer-set dosyalarinda ayri mapping mantigi var.
- Memory dosyalarinda THYAO -> aviation gibi kurallar tekrar tekrar yazilmis.
- Ayni problem IAS29, holding, defense, retail, formatter doctrine gibi alanlarda da var.

Bu durum iki sey uretiyor:

- ayni kuralin defalarca tekrar edilmesi
- bir yerde duzeltilen kuralin baska yerde bozuk kalmasi

### 4. QA gate soft, CEO onayi da soft

- `backend/src/orchestrator.ts` icinde QA loop'u ve approval mantigi beklenen kadar sert degil.
- Workflow/prose tarafinda "bloklamali" anlatilan bazi kontroller runtime'da warning + continue seklinde ilerliyor.
- Yani `revision_requested` veya dusuk kalite kosullari, pratikte her zaman teslimati durdurmuyor.

Bu, brief'teki checklist enforcement hedefinin bugun mevcut olmadigini net gosteren en kritik runtime gerceklerinden biri.

### 5. Shared contract var ama end-to-end enforcement yok

- `schemas/shared/agent_output_contract.schema.json` var.
- Ama `backend/src/schema-validator.ts` tarafinda dogrulama daha hafif ve yer yer regex/text fallback karakterli.
- Bircok schema alaninda `minLength`, `minItems`, derinlik zorlugu, finding acknowledgement eslesmesi gibi seyler yok.
- `qa_review/output_schema.json` icinde `overall_score` opsiyonel gorunuyor, fakat orchestrator karar mantiginda operasyonel olarak kritik.

Yani schema bugun documentation-grade; runtime-grade degil.

### 6. Formatter doctrine kendi icinde celiskili

- `agents/report_formatter/system_prompt.md` SVG-only, deterministic compose/template mantigini savunuyor.
- Buna karsin `agents/report_formatter/agent_spec.json` halen Chart.js CDN, layout authority ve daha serbest formatter mantigini tasiyor.
- Repo genelinde de "Chart.js forbidden" cizgisi var, ama formatter tanimi tek sesli degil.

Bu kisim temizlenmeden formatter tarafinda istikrar zor.

### 7. Agent roster split-brain durumda

Filesystem, `agents_registry.json` ve backend runtime registry birbiriyle tam uyusmuyor.

Drift ornekleri:

- Klasorde/runtime'da olup `agents_registry.json` ile drift edenler:
- `analyst_consensus_agent`
- `coo`
- `esg_agent`
- `sentiment_news_agent`
- `valuation_agent`

- Registry/folder mantiginda olup runtime registry'de olmayanlar:
- `agent_factory`
- `agent_performance_review`
- `cost_performance_optimizer`

Bu durum hangi agent'in gercekten product surface'in parcasi oldugunu bulaniklastiriyor.

### 8. Legacy/artifact clutter yuksek

- Agent klasorlerinde `memory_archive.md`, `memory.backup.md`, sample output dump'lari, case lesson dosyalari birikmis.
- Bu dosyalar authoritative set'i bulaniklastiriyor.
- Repo yuzeyinin buyuk kismini `output/` artifact'lari kapliyor.
- `templates/report_base.html` gibi belgelerde referans verilen ama workspace'te olmayan legacy hedefler var.

Bu gürültü hem insanlar hem agent'lar icin baglam kirliligi uretiyor.

## Gercek output'lardan cikan kalite problemleri

15 gercek HTML rapor ornegi inceledim. En kritik sonuc: doctrinal hedef ile gercek teslimatlar arasinda anlamli aci var.

### 1. Mandatory metric coverage dusuk

Surekli eksik gelen metrikler:

- `gross_profit_ias29`
- `nwc_to_revenue`
- `interest_burden`
- `gross_margin`
- `roic`
- `capex_to_ebitda`
- `roa`
- `cash_ratio`
- `ocf_to_ebitda`
- `monetary_gain_loss`

Bu da 28 zorunlu metrik iddiasinin finished report katmaninda korunamadigini gosteriyor.

### 2. Sektor KPI coverage zayif

Ornek eksikler:

- THYAO tarafinda `EBITDAR`, `RPK`, `ASK`, `CASK`, `RASK`, `Load Factor`, `IFRS16`
- TCELL tarafinda `Churn`, `SAC/LTV`, `Capex Intensity`

Yani sektor-spesifik doctrine ya upstream'de tam uretilmiyor ya downstream'de kayboluyor.

### 3. IAS29 coverage tutarsiz

- IAS29 ifadesi sadece 15 raporun 7'sinde net goruldu.
- Oysa repo icindeki doctrine, IAS29'yi cok daha merkezi ve zorunlu bir konu olarak ele aliyor.

### 4. THYAO sektor kimligi hala siziyor

- En net bulgu: THYAO HTML ciktilarinda hala `Sanayi/industrial` izi var.
- Bu, memory'lerde THYAO -> aviation direktifi defalarca yazilmis olsa bile canonical code-level fix yapilmadigi icin sorunun cozulmedigini gosteriyor.

### 5. Rapor yapisi istikrarsiz

- Bazi raporlar 12 bolumlu guclu HTML ciktilar.
- Bazilari legacy/custom yapida.
- Bazilarinda section sayisi/structural integrity dusuk.
- Bazilarinda yorum yogunlugu zayif, tablo yogunlugu yuksek.

Bu, formatter pipeline'inin deterministik tek standarda henuz oturmadigini gosteriyor.

## Duplicate/conflict tarafinda en onemli yorumlarim

### 1. Memory dosyalari kronolojik feedback log'una donmus

- Ozellikle THYAO etrafinda ayni CEO feedback'leri birden fazla agent memory'sine kopyalanmis.
- Bu tekrarlar doctrinal guc getirmiyor; aksine dikkat dagitiyor.
- Memory bir "son dersler" katmani olmaktan cikmis, daginik governance history deposuna donusmus.

### 2. Prose ile kod birbirini gecersiz kiliyor

- Prose tarafinda "bloklayici" veya "zorunlu" denen seyler kodda advisory kalmis.
- Prose tarafinda "Chart.js yasak" denirken agent spec bunu tersliyor.
- Prose tarafinda fast mode kisa akismis gibi anlatilirken runtime cok daha agir calisiyor.

### 3. Ayni kural birden fazla yerde yasiyor

Ozellikle cok tekrarlanan alanlar:

- IAS29
- THYAO -> aviation
- KCHOL -> holding
- ASELS -> defense
- Chart.js forbidden

Bu alanlar memory/prose ile degil, canonical file + code/schema ile cozulmeli.

## Bence en yuksek leverage'li aksiyonlar

Claude Phase 2+'ye gececekse en yuksek etkili baslangic sirasini boyle oneriyorum:

1. Ticker -> sektor mapping icin tek canonical YAML olustur ve heuristic detection'i bunun arkasina cek.
2. QA gate'i gercek blocker yap; `overall_score` ve `revision_requested` davranisini schema + runtime ile sertlestir.
3. Memory purge politikasini uygula; memory'yi max kucuk "recent learnings" katmanina indir.
4. Formatter doctrine'i tek sese dusur: `agent_spec`, prompt ve compose pipeline ayni seyi soylesin.
5. Shared contract'i checklist enforcement ile guclendir: `findings[]` -> `addressed_findings[]`.
6. Buyuk upstream output'lar icin manifest + retrieval modeline gec.
7. Agent roster icin tek truth source belirle.

## Claude icin net sonuc cumlesi

Bu repo'daki ana problem "agent sayisi fazla" degil; ana problem tek dogruluk kaynagi olmamasi, prose'in koddan daha fazla hukum surmeye calismasi ve runtime enforcement'in doctrine kadar sert olmamasi.

Kisaca:

- single source of truth yok
- schema runtime'i yonetmiyor
- memory canonical kural deposuna donusmus
- downstream attention kaybi var
- QA/CEO gates soft
- final report kalite seviyesi doctrine ile tutarli degil

Eger Claude bunu duzeltecekse, memory/prompt temizligiyle baslamamali; once canonical truth + runtime enforcement + contract hardening kurmali.

## Kanit dosyalari

Detayli dayanak icin su dosyalara bak:

- `refactor/inventory/EXECUTIVE_SUMMARY.md`
- `refactor/inventory/pipeline_flow.md`
- `refactor/inventory/schema_audit.md`
- `refactor/inventory/duplicate_map.md`
- `refactor/inventory/dead_code.md`
- `refactor/inventory/memory_analysis.md`
- `refactor/inventory/output_quality_audit.md`
- `refactor/inventory/agents/_index.md`
- `refactor/reports/phase_1_summary.md`
