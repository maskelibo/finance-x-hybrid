# Finance-X Hybrid - Master Prompt for Claude

Repo root'undaki bu notu, asagidaki audit dosyalariyla birlikte tek kaynak kabul et.
Bu prompt'un amaci seni Finance-X Hybrid'i "disli gibi tikir tikir" calisan,
single-source-of-truth, schema-driven, dikkat kaybi yasamayan, kaliteyi koruyan
bir mimariye goturmek icin hizalamaktir.

Bu prompt sana:

- mevcut problemin tam cercevesini
- dogrulanmis Phase 1 bulgularini
- onceliklendirilmis iyilestirme onerilerini
- brief'te yazan yapisal hedefleri
- benim ekledigim yeni mimari inovasyonlari
- uygulanma sirasini ve guvenlik sinirlarini

tek parca halinde verir.

Bu prompt'u okuduktan sonra once belirtilen audit dosyalarini oku, sonra kodu dogrula, sonra asamali uygulamaya gec.

## 1. Cekirdek gorev

Finance-X Hybrid su an calisiyor ama temiz, tek sesli, kanonik ve zorlayici bir mimari degil.
Amac:

1. kaliteyi dusurmeden
2. rapor derinligini azaltmadan
3. sektor-spesifik analizleri zayiflatmadan
4. agent zincirini kaybetmeden
5. kod + schema + canonical config merkezli
6. attention-preserving
7. regression-safe

bir refactor gerceklestirmek.

Senin ilk prensibin su olsun:

- prose degil kod ve schema kazansin
- duplicate kural degil canonical truth kazansin
- silent failure degil hard validation kazansin
- raw dump degil manifest + retrieval kazansin
- "agent bir seyler dedi" degil "agent contract'i sagladi" kazansin

## 2. Bu prompt'tan once okuman zorunlu dosyalar

Asagidaki dosyalari okumadan hicbir uygulama karari verme:

- `README.md`
- `AGENTS.md`
- `workflows/full_integrated_analysis.md`
- `agents/ceo/system_prompt.md`
- `agents/orchestrator/system_prompt.md`
- `agents/report_formatter/system_prompt.md`
- `schemas/shared/agent_output_contract.schema.json`
- `backend/src/orchestrator.ts`
- `backend/src/agent-runner.ts`
- `backend/src/analysis-config.ts`
- `backend/src/agents.ts`
- `backend/src/schema-validator.ts`
- `backend/src/python/report_formatter/compose.ts`
- `scripts/test_28_metrics.py`

Audit ve kanit dosyalari:

- `refactor/inventory/EXECUTIVE_SUMMARY.md`
- `refactor/inventory/file_inventory.md`
- `refactor/inventory/agents/_index.md`
- `refactor/inventory/duplicate_map.md`
- `refactor/inventory/schema_audit.md`
- `refactor/inventory/pipeline_flow.md`
- `refactor/inventory/dead_code.md`
- `refactor/inventory/memory_analysis.md`
- `refactor/inventory/output_quality_audit.md`
- `refactor/reports/phase_1_summary.md`
- `refactor/reports/CLAUDE_PHASE1_HANDOFF.md`

## 3. Dogrulanmis audit gercekleri - bunlari varsayim degil constraint kabul et

### 3.1 Repo yuzeyi beklenenden daha kirli ve artifact-dominant

- Toplam dosya: `1563`
- Toplam boyut: yaklasik `828 MB`
- Bunun `772 MB+` kismi `output-artifact`
- Agent klasorlerinde `memory_archive.md`, `memory.backup.md`, ornek output JSON/MD dosyalari, case_lessons ve reference manual birikimi var
- Root'ta cok sayida rapor artifact'i, markdown dump'i ve standalone JSON bulunuyor

Bu su anlama geliyor:

- authoritative file set bulanik
- repo okunabilirligi dusuk
- agent'lar ve insanlar icin gultulu bir baglam var

### 3.2 Agent sayisi ve roster tek yerde tanimli degil

Audit boyunca gorulen drift:

- filesystem agent klasoru: `26`
- `agents_registry.json`: `21`
- runtime/backend tarafi: dokumanla tam uyusmuyor; duplicate map tarafinda `23` olarak drift goruluyor

Drift adaylari:

- klasorde/runtime'da olup registry ile drift edenler:
  - `analyst_consensus_agent`
  - `coo`
  - `esg_agent`
  - `sentiment_news_agent`
  - `valuation_agent`

- registry/folder mantiginda olup backend runtime registry'de olmayanlar:
  - `agent_factory`
  - `agent_performance_review`
  - `cost_performance_optimizer`

Sonuc:

- hangi agent'in urunun aktif parcasi oldugu net degil
- prompt, registry, runtime ve docs ayni sistemi anlatmiyor

### 3.3 Runtime mode davranisi dokumanlardan farkli

Dokumanlarda:

- `fast_screening` 5-6 agent gibi anlatiliyor
- `standard_institutional` ~15 agent gibi anlatiliyor
- `deep_dive` 20 veya 22 agent olarak anlatiliyor

Gercek runtime aktivasyonu:

- `fast_screening`: `16` agent
- `standard_institutional`: `18` agent
- `deep_dive`: `22` agent

Kritik tespit:

- `backend/src/orchestrator.ts` icinde `PIPELINE_BY_MODE` fiilen ayni
- gercek fark `MODE_DEFAULT_LAYERS` + always-on backbone agent'lar
- `ceo`, `coo`, `qa_review`, `strategic_synthesis`, `final_summary`, `report_formatter` gibi agent'lar backbone sebebiyle modlar arasi beklenenden daha az fark yaratyor

Bu yuzden `fast_screening`, beklenen "hafif" mod degil; slimmed institutional path gibi calisiyor.

### 3.4 Memory bloat var, runtime memory kullanimi yok denecek kadar kisitli

Kritik runtime gercegi:

- `backend/src/agent-runner.ts` icinde `MAX_MEMORY_BYTES = 6 * 1024`

Ama buyuk memory dosyalari:

- `agents/ceo/memory.md`: `44.34 KB`
- `agents/context_extraction/memory.md`: `31.56 KB`
- `agents/coo/memory.md`: `31.24 KB`
- `agents/report_formatter/memory.md`: `31.10 KB`
- `agents/parse_standardization/memory.md`: `31.02 KB`
- `agents/technical_analysis/memory.md`: `30.60 KB`
- `agents/financial_analysis/memory.md`: `30.59 KB`
- `agents/kap_watch/memory.md`: `29.56 KB`

Memory analysis ana bulgulari:

- memory dosyalari distilled memory degil, rolling feedback log'una donusmus
- THYAO, IAS29, sektor override, formatter self-check gibi tekrar eden dersler prose halinde birikmis
- bircok kural schema'ya, canonical config'e veya runtime code'a tasinabilir durumda

Ozellikle sorunlu memory profilleri:

- `ceo`: 34 kayit, 12 tekrar, 115 kodlanabilir kural satiri
- `qa_review`: 14 kayit, 11 tekrar
- `strategic_synthesis`: 14 kayit, 11 tekrar
- `event_timeline_alert`: 13 kayit, 13 tekrar
- `report_formatter`: 22 kayit, 5 tekrar

### 3.5 Canonical truth source yok

Tek bir dogruluk kaynagi olmayan kritik alanlar:

- ticker -> sector mapping
- IAS29 handling
- null/proxy handling
- formatter doctrine
- sector-specific KPI zorunluluklari
- mode definitions
- agent roster

Tekrarlanan kural hotspot'lari:

- `IAS29`: 83 dosyada iz
- `KCHOL -> holding`: 42 dosya
- `THYAO -> aviation`: 31 dosya
- `ASELS -> defense`: 29 dosya
- `Chart.js forbidden`: 8 dosya

Bu tablo net olarak sunu soyluyor:

- ayni bilgi prose, memory, formatter, workflow, docs ve bazi runtime parcalarina dagilmis
- duplicate bilgi kalite getirmemis, tutarsizlik getirmis

### 3.6 QA ve CEO gate'leri beklenen kadar sert degil

Workflow/doctrine tarafinda:

- kalite yetersizse pipeline bloklanmali
- `revision_requested` durumunda zorlayici duzeltme olmasi bekleniyor
- CEO onayi yoksa final rapor cikmamali

Ama runtime tarafinda audit sonucu:

- QA loop'u fail olduktan sonra warning ile devam edebiliyor
- CEO approval mantigi de tam hard-block degil; warning context ile akis ilerleyebiliyor

Bu nokta kritik cunku sistemin doctrine'i ile gercek teslim davranisi arasindaki en tehlikeli drift bu.

### 3.7 Schema enforcement zayif ve eksik

Schema audit bulgulari:

- taranan schema sayisi: `30`
- shared universal contract var ama end-to-end enforcement yok
- `backend/src/schema-validator.ts` tam AJV-style gate olmaktan uzak; hafif validator/text fallback karakteri tasiyor
- bircok string alaninda `minLength` yok
- bircok array alaninda `minItems` yok
- derinlik zorlayici narrative schema yok
- cross-agent checklist enforcement yok

Kirik veya cozulmeyen `$ref`:

- `agents/event_impact_mapper/output_schema.json -> https://financex.io/schemas/shared/evidence`
- `agents/financial_analysis/output_schema.json -> https://financex.io/schemas/shared/evidence`

Operasyonel ama optional kalmis alanlara ornek:

- `agents/qa_review/output_schema.json -> overall_score`
- `schemas/shared/agent_output_contract.schema.json` icinde wrapper alanlarinin bir kismi

Bu su anlama geliyor:

- schema dokumantasyon gibi var
- ama runtime'i yoneten sert kontrat olarak davranmiyor

### 3.8 Formatter doctrine kendi icinde celiskili

Celiski:

- `agents/report_formatter/system_prompt.md`: Chart.js yasak, deterministic compose/template mantigi
- `agents/report_formatter/agent_spec.json`: Chart.js CDN, layout authority, formatter'in serbest karar alma rolu

Repo genelinde de:

- `AGENTS.md`: Chart.js yasak, SVG only
- `scripts/html-to-pdf.mjs`: Chart.js forbidden
- orchestrator tarafinda canvas check uyarisi var

Sonuc:

- formatter tarafinda tek sesli doctrine yok
- son cikti kalitesi bu yuzden dalgali

### 3.9 Output kalitesi hedefin altinda

Audit edilen gercek rapor sayisi: `15`

Surekli eksik gelen zorunlu metrikler:

- `gross_profit_ias29` - 15 raporda eksik
- `nwc_to_revenue` - 15 raporda eksik
- `interest_burden` - 15 raporda eksik
- `gross_margin` - 14 raporda eksik
- `roic` - 14 raporda eksik
- `capex_to_ebitda` - 14 raporda eksik
- `roa` - 13 raporda eksik
- `cash_ratio` - 13 raporda eksik
- `ocf_to_ebitda` - 13 raporda eksik
- `monetary_gain_loss` - 12 raporda eksik

Sektor KPI bosluklari:

- THYAO:
  - `EBITDAR`
  - `RPK`
  - `ASK`
  - `CASK`
  - `RASK`
  - `Load Factor`
  - `IFRS16`

- TCELL:
  - `Churn`
  - `SAC/LTV`
  - `Capex Intensity`

IAS29 coverage:

- IAS29 ifadesi sadece `7/15` raporda net goruluyor

Yapisal kalite sorunlari:

- bazi raporlar 12 bolumlu degil
- bazi raporlar truncation/structural integrity sorunu tasiyor
- bazi raporlarda yorum yogunlugu dusuk, tablo yogunlugu yuksek
- `BLOCKED` gecilen ama proxy fallback'i olmayan bolumler var

En somut regresyonlardan biri:

- THYAO hala kimi HTML ciktilarda `Sanayi/industrial` olarak siziyor

### 3.10 Pipeline performansi ve context fan-out kontrolsuz

Pipeline flow bulgulari:

- en yuksek fan-out context nesneleri:
  - `context_extraction`
  - `financial_analysis`
  - `data_collection`
  - `macro_analysis`
  - `valuation_agent`

Bunlar manifest/retrieval adayi.

Yaklasik kritik yol:

- `fast_screening`: `49.9 dk`
- `standard_institutional`: `53.1 dk`
- `deep_dive`: `59.5 dk`

Buyuk sorun:

- uzun ve fan-out yuksek output'lar downstream'e ham sekilde akiyor
- attention dilution ve lost-in-the-middle riski cok yuksek

## 4. Koku neden sentezi

Bu projenin ana problemi "22 agent fazla" degil.
Ana problem su:

1. tek dogruluk kaynagi yok
2. prose, schema ve kodun yerine gecmeye calisiyor
3. runtime enforcement doctrine kadar sert degil
4. memory canonical olmayan governance tarihcesine donusmus
5. downstream agent'lar upstream bulgulari tam acknowledge etmek zorunda degil
6. formatter ve final-report katmani upstream derinligi koruyamiyor
7. mode farklari, agent roster ve kurallar daginik tanimlandigi icin sistem kendi kendine drift ediyor

## 5. Uygulaman gereken refactor ilkeleri

1. Canonical Truth Source
2. Schema-Driven Enforcement
3. Rule Hierarchy: Global > Sector > Agent Prompt > Memory
4. Attention Preservation
5. Checklist Enforcement
6. Regression Safety
7. Depth Before Speed
8. Code Over Prose

## 6. Mutlaka yapman gereken iyilestirmeler

### 6.1 Canonical katmani kur

Asagidaki yapinin olusturulmasi hedef:

`canonical/`

- `rules/mandatory_metrics.yaml`
- `rules/null_handling_protocol.md`
- `rules/confidence_taxonomy.md`
- `rules/output_integrity.md`
- `rules/ias29_protocol.md`
- `sectors/aviation.yaml`
- `sectors/steel.yaml`
- `sectors/banking.yaml`
- `sectors/telecom.yaml`
- `sectors/defense.yaml`
- `sectors/retail.yaml`
- `sectors/holding.yaml`
- `sectors/industrial_generic.yaml`
- `tickers/sector_mapping.yaml`
- `contracts/agent_io_contracts.yaml`
- `contracts/pipeline_modes.yaml`
- `glossary/terms.md`
- `glossary/abbreviations.md`

Ilk zorunlu canonical truth alanlari:

1. ticker -> sector mapping
2. 28 mandatory metric listesi
3. null/proxy hiyerarsisi
4. IAS29 kurallari
5. mode path tanimlari
6. sector KPI setleri

### 6.2 Sector mapping'i code-level canonical yap

En acil fixlerden biri:

- THYAO -> aviation
- KCHOL/SAHOL -> holding
- ASELS -> defense
- BIMAS/MGROS -> retail
- TCELL/TTKOM -> telecom
- AKBNK/GARAN/ISCTR/YKBNK -> banking

Sektor belirleme:

- heuristic inference fallback olabilir
- ama hardcoded canonical mapping varsa onu override etmemeli

### 6.3 Memory purge ve hierarchy uygula

Hedef:

- `memory.md` dosyalari max kucuk "recent learnings" katmani olsun
- eski kronolojik feedback'ler archive'e tasinsin
- tekrar eden sektor ve metric kurallari canonical'a tasinsin
- schema'ya uygun olanlar schema'ya tasinsin
- kodla cozulmesi gerekenler kodla cozulsun

Memory icin net ilke:

- memory asla ana governance source olmasin
- memory son 30 gun, dar kapsam, gercekten agent-spesifik nuance tasimali

### 6.4 Shared contract'i sertlestir

Gerekenler:

- `findings[]` zorunlu review/revision contract
- `addressed_findings[]` zorunlu downstream acknowledgement contract
- `addressed_findings.length === findings.length` kontrolu
- `finding_id set equality` validator
- `mandatory_metrics_complete`
- `metrics_array`
- `engine_snapshot`
- `interpretations`
- `counterargument`
- `implication`

Ozellikle:

- `qa_review.output_schema.json` icinde `overall_score` artik required olmali
- output derinligi schema ile zorlanmali

### 6.5 Validation gate ekle

Yeni runtime katmani onerisi:

- `backend/src/validation_gate.ts`

Davranis:

1. her agent output'u schema gate'den gecer
2. fail olursa kategoriye ayrilir:
   - missing metric
   - missing finding acknowledgement
   - shallow interpretation
   - broken structure
   - invalid enum/ref
3. eksik listesi prompt'a inject edilir
4. max 2 retry
5. sonra CEO escalation
6. validation raporu run artifact'i olarak yazilir

### 6.6 Manifest + retrieval pattern'e gec

Ozellikle su fan-out agent'lar icin:

- `financial_analysis`
- `context_extraction`
- `valuation_agent`
- `macro_analysis`
- `final_summary`
- `report_formatter`

Buyuk output stratejisi:

- full raw output disk artifact'i olarak saklanir
- upstream agent sadece manifest dondurur
- downstream section bazli cekme yapar
- raw 100 KB dump downstream prompt'a sokulmaz

### 6.7 QA loop'u gercekten kapat

Checklist enforcement olmadan sistem kaliteli hale gelmez.

Mutlaka:

- downstream agent, upstream QA finding'lerinin her birini adreslemek zorunda olsun
- `fixed | acknowledged | rejected` action seti kullan
- aciklama zorunlu olsun
- eksik finding varsa retry
- ikinci retry sonrasi CEO escalation

### 6.8 Formatter doctrine'i tek sese dusur

Yapman gereken:

- `agents/report_formatter/system_prompt.md`
- `agents/report_formatter/agent_spec.json`
- `backend/src/python/report_formatter/compose.ts`
- template/doctrine dosyalari

tek bir formatter truth'a insin.

Karar:

- Chart.js yasaksa her yerde yasak olsun
- SVG-only ise spec de oyle olsun
- formatter layout authority'si deterministic engine'de mi, prompt'ta mi netlessin
- 12-bolum sema zorunluysa runtime ve template bunu enforce etsin

### 6.9 Agent roster truth source belirle

Net karar ver:

- authoritative source `agents_registry.json` mi
- runtime `backend/src/agents.ts` mi
- canonical contract mi

Ama tek olsun.

Bir agent eklenince/çıkarilinca su katmanlar otomatik veya deterministic senkronlansin:

- filesystem folder
- registry
- runtime loader
- pipeline mode contract
- eval coverage

### 6.10 Dead code ve clutter cleanup yap

Ama guvenli sekilde:

- once backup/tarball
- sonra archive policy
- sonra stale artifact ve backup dosyalarini canonical olmayan katmandan temizle

Hedef:

- agent klasorlerinde sadece authoritative dosyalar kalsin
- legacy sample output'lar ayri archive/samples alani alsin

## 7. Benim ekledigim yeni inovasyon onerileri

Asagidakiler brief'te birebir gecmeyebilir, ama projeyi "kusursuz" seviyeye cikarmak icin cok yuksek kaldiracli.

### 7.1 Rule compiler

`canonical/` icindeki YAML/MD kurallarindan su katmanlara deterministic output ureten bir "rule compiler" kur:

- prompt include fragments
- schema constants
- runtime validation tables
- sector KPI allow/require listeleri

Boylece ayni kural 4 yerde elle yazilmaz.

### 7.2 Provenance ledger / evidence registry

Her kritik metrik ve bulgu icin:

- source document id
- extraction stage
- transform stage
- final report section

izlenebilir olsun.

Bu sayede:

- "bu rakam nereden geldi?" sorusu yanitlanir
- cross-agent consistency otomatik kontrol edilir

### 7.3 Context budget report

Her agent run sonunda yaz:

- prompt token budget
- injected memory size
- upstream payload size
- truncation olup olmadigi
- retrieved section count

Bu olmadan lost-in-the-middle problemi olcumlenemez.

### 7.4 Failure taxonomy + retry routing

Tum retry'lar ayni degil.

Bir taxonomy kur:

- data-missing
- parse-failure
- schema-failure
- reasoning-shallow
- qa-unaddressed
- sector-playbook-missing

Ve retry routing'i buna gore yap.

Ornek:

- parse hatasi -> parse_standardization veya data_collection
- shallow interpretation -> financial_analysis prompt retry
- unaddressed QA finding -> receiving agent retry

### 7.5 Coverage matrix tests

Ticker x sector x metric kapsama matrisini otomatik test et.

Ornek:

- THYAO -> EBITDAR zorunlu
- TCELL -> churn / SAC-LTV / capex intensity zorunlu
- KCHOL -> holding-specific 3-layer ve SOTP/NAV kontrolu

Bu matrix golden test set'in bir parcasi olsun.

### 7.6 Prompt lint / memory lint

Bir lint katmani kur:

- max prompt size
- forbidden duplicate blocks
- deprecated prose patterns
- duplicate sector instructions
- stale memory age
- required canonical references missing mi

Bu sayede prompt drift daha merge olmadan yakalanir.

### 7.7 Report section manifest

Final report icin de manifest tut:

- section ids
- source agents
- source findings addressed
- mandatory metrics represented
- charts used
- missing data declarations

Bu final output integrity icin cok degerli olur.

## 8. Uygulama sirasi

Asagidaki sirayi koru:

1. Phase 1 audit dosyalarini yeniden dogrula
2. backup al
3. canonical layer kur
4. roster/mode/source-of-truth temizligini yap
5. schema hardening yap
6. validation gate ekle
7. manifest + retrieval katmanina gec
8. QA checklist enforcement kur
9. formatter doctrine'i birlestir
10. memory purge + archive
11. regression harness ve quality scorecard kur
12. observability/dashboard gelistirmelerini yap

## 9. Basarinin olculecegi kalite hedefleri

Sistem ancak su hedeflere yaklasirsa basarili say:

- mandatory metric completeness: `%95+`
- sector KPI coverage: `%95+`
- checklist acknowledgement: `%100`
- THYAO/aviation ve benzeri sektor classification leak: `0`
- QA fail sonrasi silent continue: `0`
- schema validation bypass: `0`
- memory injection wastage: dramatik dusus
- mode definitions docs/runtime drift: `0`
- formatter doctrine conflict: `0`
- final report structure drift: minimum

## 10. Non-negotiable guvenlik ve calisma kurallari

1. Main branch'e direkt yazma.
2. Her ana asama icin ayri branch kullan.
3. Refactor oncesi backup al.
4. Golden baseline kurmadan kaliteyi degistirme.
5. Legacy cleanup'i backup/archival olmadan yapma.
6. Uretim davranisini degistiren her adimda regression check yap.
7. Prompt/memory temizligini canonical ve schema kurulmadan baslatma.
8. "Daha temiz gorunuyor" diye kaliteyi veya derinligi azaltma.

## 11. Claude'dan beklenen teslim sekli

Asagidaki formatta ilerle:

1. Once audit dogrulama ozeti ver.
2. Sonra en riskli 10 teknik problemi kendi sozcuklerinle yeniden listele.
3. Sonra uygulama planini asamalara bol.
4. Her asamada:
   - neyi degistirecegini
   - hangi dosyalari etkileyecegini
   - hangi riskleri tasidigini
   - nasil test edecegini
   yaz.
5. Her asama sonunda kisa rapor birak.
6. Eger brief'te olmayan ama kritik bir bulgu daha gorursen:
   - uygulama icine gizlice serpme
   - once not et
   - sonra gerekliyse acikca gerekcelendir

## 12. Son net mesaj

Bu repo'da sorunun ozeti su:

- single source of truth yok
- schema runtime'i yonetmiyor
- memory canonical olmayan bir governance log'una donusmus
- mode ve roster tanimlari drift etmis
- QA/CEO gates soft
- final report katmani upstream derinligi koruyamiyor
- sektor doctrine prose'de yasiyor ama kodda zorlanmiyor

Senin gorevin sadece "temizlemek" degil.
Senin gorevin:

- kurallari tek yerde toplamak
- runtime'i o kurallara baglamak
- agent ciktilarini zorlayici kontratlara oturtmak
- downstream dikkat kaybini mimari olarak engellemek
- kaliteyi dusurmeyen, olculebilir, testli bir sistem kurmak

Kisaca:

once canonical truth
sonra schema enforcement
sonra retrieval/checklist
sonra cleanup/performance

Bu sirayi bozma.
