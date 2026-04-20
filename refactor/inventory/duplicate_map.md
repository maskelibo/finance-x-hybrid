# Duplicate & Conflict Map

- Generated: 2026-04-20T21:15:05.795904+00:00
- Method: heuristic rule-line grouping across repo text files + targeted manual conflict checks for runtime/docs drift.

## Highest-frequency duplicate rule fragments

| rule_sample | files | sample_files |
| --- | --- | --- |
| ## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu | 28 | agents/analyst_consensus_agent/memory.md, agents/context_extraction/case_lessons.md, agents/context_extraction/memory.md, agents/coo/case_lessons.md, agents/coo/memory.md ... |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4) | 17 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/data_collection/memory.md, agents/event_classification/memory.md, agents/event_impact_mapper/memory.md ... |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416) | 17 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/data_collection/memory.md, agents/event_classification/memory.md, agents/event_impact_mapper/memory.md ... |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu | 17 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/data_collection/memory.md, agents/event_classification/memory.md, agents/event_impact_mapper/memory.md ... |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416) | 17 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/data_collection/memory.md, agents/event_classification/memory.md, agents/event_impact_mapper/memory.md ... |
| "review_status": { "type": "string", "enum": ["pending_ceo_review", "approved", "rejected", "revision_requeste... | 13 | agents/context_extraction/output_schema.json, agents/data_collection/output_schema.json, agents/event_classification/output_schema.json, agents/event_timeline_alert/output_schema.json, agents/final_summary/output_schema.json ... |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu | 13 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/event_classification/memory.md, agents/event_impact_mapper/memory.md, agents/event_timeline_alert/memory.md ... |
| ## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417) | 10 | agents/context_extraction/memory.md, agents/coo/memory.md, agents/event_timeline_alert/memory.md, agents/final_summary/memory.md, agents/macro_analysis/memory.md ... |
| { "name": "task_context", "type": "object", "required": true } | 8 | agents/context_extraction/agent_spec.json, agents/data_collection/agent_spec.json, agents/event_timeline_alert/agent_spec.json, agents/final_summary/agent_spec.json, agents/macro_analysis/agent_spec.json ... |
| ## Required Action for Next Analysis | 5 | agents/ceo/reference_manual.md, agents/ceo/system_prompt.md, agents/financial_analysis/FEEDBACK_TEMPLATE.md, agents/macro_analysis/FEEDBACK_2026-04-10_ASELS.md, workflows/post_report_review.md |
| **Company:** [TICKER] — [Company Name] | 5 | agents/agent_performance_review/system_prompt.md, agents/ceo/reference_manual.md, agents/ceo/system_prompt.md, agents/financial_analysis/FEEDBACK_TEMPLATE.md, workflows/post_report_review.md |
| - Claude eğitim bilgisinden rakam kullanma YASAK | 5 | agents/event_classification/system_prompt.md, agents/event_timeline_alert/system_prompt.md, agents/final_summary/system_prompt.md, agents/kap_watch/system_prompt.md, agents/qa_review/system_prompt.md |
| - Platform çıktılarından (önceki raporlar, HTML dosyaları) veri alma YASAK | 5 | agents/event_classification/system_prompt.md, agents/event_timeline_alert/system_prompt.md, agents/final_summary/system_prompt.md, agents/kap_watch/system_prompt.md, agents/qa_review/system_prompt.md |
| expect(legacy.ticker).toBe('KCHOL'); | 5 | backend/src/python/adapters/financial_analysis.test.ts, backend/src/python/adapters/kap_watch.test.ts, backend/src/python/adapters/macro_analysis.test.ts, backend/src/python/adapters/reconciliation.test.ts, backend/src/python/adapters/technical_analysis.test.ts |
| { "name": "context_extraction_output", "type": "object", "required": false } | 5 | agents/event_impact_mapper/agent_spec.json, agents/financial_analysis/agent_spec.json, agents/macro_analysis/agent_spec.json, agents/report_formatter/agent_spec.json, agents/strategic_synthesis/agent_spec.json |
| "company": { "name": "...", "ticker": "..." }, | 4 | agents/analyst_consensus_agent/system_prompt.md, agents/esg_agent/system_prompt.md, agents/event_impact_mapper/system_prompt.md, agents/sentiment_news_agent/system_prompt.md |
| "company": { "name": "...", "ticker": "...", "bist_sector": "..." }, | 4 | agents/financial_analysis/reference_manual.md, agents/financial_analysis/system_prompt.md, agents/valuation_agent/reference_manual.md, agents/valuation_agent/system_prompt.md |
| ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."), | 4 | python-services/src/financex/cli/data.py, python-services/src/financex/cli/kap.py, python-services/src/financex/cli/news.py, python-services/src/financex/cli/technical.py |
| { "name": "financial_analysis_output", "type": "object", "required": true }, | 4 | agents/final_summary/agent_spec.json, agents/report_formatter/agent_spec.json, agents/sector_competition/agent_spec.json, agents/strategic_synthesis/agent_spec.json |
| "enum": ["approved", "rejected", "revision_requested"] | 3 | agents/ceo/audit_log_schema.json, agents/ceo/output_schema.json, schemas/shared/review_decision.schema.json |
| ## CEO Geri Bildirimi — 2026-04-14 — THYAO | 3 | agents/parse_standardization/memory.md, agents/reconciliation/case_lessons.md, agents/reconciliation/memory.md |
| ## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu (Post-Report Loop) | 3 | agents/coo/memory.md, agents/parse_standardization/memory.md, agents/reconciliation/memory.md |
| ### Tarihsel Çarpan Karşılaştırması (Zorunlu) | 3 | agents/valuation_agent/knowledge.md, agents/valuation_agent/reference_manual.md, agents/valuation_agent/system_prompt.md |
| - Farazi/uydurulmuş veri üretme YASAK | 3 | agents/analyst_consensus_agent/system_prompt.md, agents/esg_agent/system_prompt.md, agents/sentiment_news_agent/system_prompt.md |
| - Her tablo sonrasında 3-5 cümle yorum paragrafı ZORUNLU | 3 | agents/ceo/knowledge.md, agents/financial_analysis/memory_archive.md, agents/qa_review/knowledge.md |
| - Kaynaksız iddia ileri sürme YASAK | 3 | agents/analyst_consensus_agent/system_prompt.md, agents/esg_agent/system_prompt.md, agents/sentiment_news_agent/system_prompt.md |
| - Yatırım tavsiyesi (AL/SAT/TUT/BUY/SELL/HOLD) verme YASAK — analiz yap, tavsiye verme | 3 | agents/analyst_consensus_agent/system_prompt.md, agents/esg_agent/system_prompt.md, agents/sentiment_news_agent/system_prompt.md |
| - ✅ Chairman zorunlu elementler mevcut | 3 | agents/final_summary/memory_archive.md, agents/strategic_synthesis/memory_archive.md, agents/valuation_agent/memory_archive.md |
| 1. **Company ticker** and full company name | 3 | agents/analyst_consensus_agent/system_prompt.md, agents/esg_agent/system_prompt.md, agents/sentiment_news_agent/system_prompt.md |
| 2. **Never produce investment recommendations.** | 3 | agents/event_timeline_alert/system_prompt.md, agents/macro_analysis/reference_manual.md, agents/macro_analysis/system_prompt.md |
| <div class="ticker">[TİCKER].IS</div> | 3 | agents/report_formatter/knowledge.md, agents/report_formatter/reference_manual.md, agents/report_formatter/system_prompt.md |
| <span>${ticker} — Yönetim Kurulu Raporu</span> | 3 | backend/src/orchestrator.ts, backend/src/scripts/finalize-report.ts, scripts/html-to-pdf.mjs |
| { "name": "event_impact_mapper_output", "type": "object", "required": false }, | 3 | agents/final_summary/agent_spec.json, agents/report_formatter/agent_spec.json, agents/strategic_synthesis/agent_spec.json |


## Curated conflict map

| topic | file_a | file_b | conflict |
| --- | --- | --- | --- |
| Agent count drift | AGENTS.md / README.md / workflow | agents_registry.json / backend/src/agents.ts / agents/ | Docs say 22 or 20 agents; registry has 21; backend runtime registry has 23; filesystem has 26. |
| Fast mode path drift | README.md / workflows/full_integrated_analysis.md / agents/ceo/system_prompt.md | backend/src/orchestrator.ts + backend/src/analysis-config.ts | Docs describe 5-6 agents; actual fast_screening activates 16: ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, report_formatter. |
| Standard mode path drift | README.md | backend/src/orchestrator.ts + backend/src/analysis-config.ts | README says ~15 agents; actual standard_institutional activates 18: ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, report_formatter. |
| Deep-dive path drift | README.md / workflows/full_integrated_analysis.md / agents/ceo/system_prompt.md | backend/src/orchestrator.ts + backend/src/analysis-config.ts | Docs say all 20/22; actual deep_dive activates 22: ceo, coo, data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent, report_formatter. |
| Formatter rendering doctrine | agents/report_formatter/system_prompt.md | agents/report_formatter/agent_spec.json | System prompt forbids Chart.js and says deterministic compose.ts/template slots only; agent_spec still mandates Chart.js CDN, design/layout decision rights, and new visual structure decisions. |
| QA gate policy | workflows/full_integrated_analysis.md + ceo/orchestrator prompts | backend/src/orchestrator.ts | Workflow says rejected/revision_requested outputs block downstream; runtime continues after max 2 QA rounds with warning and CEO override log. |
| CEO approval policy | backend/src/orchestrator.ts comments + CEO prompt | backend/src/orchestrator.ts implementation | "Rapor onaylanmadan çıkmaz" comment exists, but approval failures only append warning context; delivery still proceeds. |
| Sector mapping source of truth | backend/src/agent-runner.ts + prompts/memory | backend/src/python/report_formatter/compose.ts + peer_sets.ts | Sector detection/mapping is duplicated in keyword heuristics, formatter hardcodes, peer sets, and memory doctrine; no single canonical mapping file exists. |


## Repeating sector / doctrine directives

| directive | file_count | top_files |
| --- | --- | --- |
| IAS29 | 83 | agents/parse_standardization/memory_archive.md, agents/financial_analysis/memory.md, agents/financial_analysis/reference_manual.md, agents/context_extraction/memory_archive.md, agents/parse_standardization/memory.md, agents/ceo/memory_archive.md |
| KCHOL->holding | 42 | agents/sector_competition/memory_archive.md, agents/sector_competition/case_lessons.md, agents/analyst_consensus_agent/memory.md, agents/financial_analysis/memory_archive.md, agents/macro_analysis/case_lessons.md, agents/context_extraction/memory.md |
| THYAO->aviation | 31 | agents/financial_analysis/memory.md, agents/sector_competition/memory.md, agents/coo/memory.md, agents/technical_analysis/memory.md, agents/reconciliation/memory.md, agents/ceo/memory.md |
| ASELS->defense | 29 | agents/ceo/reference_manual.md, agents/ceo/heartbeat_archive.md, agents/macro_analysis/ceo_feedback_20260410.md, agents/macro_analysis/FEEDBACK_2026-04-10_ASELS.md, agents/macro_analysis/memory.md, agents/macro_analysis/CHECKLIST_GEOPOLITICAL.md |
| Chart.js forbidden | 8 | backend/src/orchestrator.ts, AGENTS.md, evals/README.md, scripts/html-to-pdf.mjs, agents/coo/memory.md, agents/coo/memory_archive.md |
| BIMAS->retail | 7 | agents/sector_competition/case_lessons.md, agents/technical_analysis/case_lessons.md, agents/coo/system_prompt.md, agents/kap_watch/memory.md, agents/parse_standardization/memory.md, agents/sentiment_news_agent/case_lessons.md |


### THYAO->aviation

- `agents/ceo/heartbeat_archive.md: - THYAO: 323.25 TL — havacılık jet yakıt baskısı devam edecek`
- `agents/ceo/heartbeat_archive.md: - THYAO, PGSUS (havacılık/taşımacılık): Baskı devam ediyor.`
- `agents/ceo/heartbeat_archive.md: - BIST açılış beklentisi: Enerji (TUPRS, AYEN) ve savunma (ASELS) hisseleri olumlu; havacılık (THYAO, PGSUS), taşımacılık olumsuz etkilenebilir.`
- `agents/ceo/memory.md: 3. **sector_competition "industrial" fallback = P1 BLOKER** — Ticker bilinmiyorsa "unknown" yaz, "industrial" değil. THYAO → aviation; bu tanım ticker'dan triviyal. sector_competit`
- `agents/ceo/memory.md: 3. **EBITDAR eksikliği havacılık analizini geçersiz kılar** — EBITDAR = havacılık analizinin merkezi metriği. 3 rapordur direktif verildi; hâlâ null. Bu THYAO'ya özgü parser kuralı`
- `agents/ceo/memory.md: 7. **EBITDAR null → 3. THYAO** — parse_standardization'a IFRS 16 kira gideri özel havacılık kuralı zorunlu`
- `agents/ceo/memory.md: 2. **[P0] sector_competition aviation hardcoding** — THYAO = aviation; upstream "industrial" gelirse override. Kod seviyesinde fix.`
- `agents/ceo/memory.md: - **[P0] sector_competition aviation hardcoding** — THYAO ticker → "aviation" override. Kod değişikliği.`
- `agents/ceo/memory.md: 1. sector_competition THYAO → aviation hardcoded mapping`
- `agents/ceo/memory.md: Önceki THYAO'larda en azından medium_term fallback girişleri üretiliyordu. Bu turda tamamen boş çıktı üretildi (impact_timeline: []). Bu regresyon, agent'ın upstream bağımlılığını `

### IAS29

- `workflows/post_report_review.md: - [ ] **IAS29 metrics** present if applicable? (Brüt Kar IAS29, Parasal Kayıp Kazanç)`
- `workflows/post_report_review.md: For Turkish companies applying IAS29 hyperinflation accounting, **Monetary Gain/Loss** is a CRITICAL metric. It shows whether the company benefits from inflation (if it holds net d`
- `workflows/post_report_review.md: **Source:** Annual Report FY2025, Note 2.4 (IAS 29 Restatement)`
- `workflows/post_report_review.md: 1. **Brüt Kar IAS29** (if company applies IAS29)`
- `workflows/post_report_review.md: 2. **Brüt Kar Oranı IAS29** (if company applies IAS29)`
- `workflows/post_report_review.md: 3. **Parasal Kayıp Kazanç** (MANDATORY for IAS29 companies)`
- `agents/agent_performance_review/memory.md: - Parasal Kayıp/Kazanç (IAS29 companies)`
- `agents/agent_performance_review/system_prompt.md: - ❌ Parasal Kayıp Kazanç missing for IAS29 company = -20 points`
- `agents/agent_performance_review/system_prompt.md: - Parasal Kayıp Kazanç (for IAS29 companies)`
- `agents/agent_performance_review/system_prompt.md: - **Turkish-Aware:** Understand Turkish business context (IAS29, BIST sectors, geopolitical environment)`

### Chart.js forbidden

- `AGENTS.md: - Chart.js **yasaktır**; grafikler `svg_charts.ts` ile deterministik SVG üretilir`
- `evals/README.md: - Chart.js canvas yasak (svgCount ≥ 1 ve canvasCount = 0)`
- `scripts/html-to-pdf.mjs: // All charts are inline SVG (Chart.js forbidden) — no CDN wait needed.`
- `agents/coo/memory.md: 6. **report_formatter:** SVG grafikleri kullan (Chart.js degil). 15+ sayfa, sifir bos sayfa, metin sandvic kurali. Agent meta-text YASAK.`
- `agents/coo/memory_archive.md: 6. **report_formatter'a:** "SVG grafikleri kullan (Chart.js değil). 15+ sayfa, sıfır boş sayfa, metin sandviç kuralı. Agent meta-text YASAK."`
- `agents/report_formatter/system_prompt.md: - Chart.js kullanma (yasak, SVG only)`
- `backend/src/orchestrator.ts: console.warn(`[orchestrator] HTML contains ${canvasCount} <canvas> element(s) — Chart.js is forbidden in this pipeline; expected inline SVG only.`);`
- `backend/src/orchestrator.ts: // All charts are inline SVG (Chart.js forbidden) — no CDN wait needed.`
- `backend/src/scripts/test-tuprs-report.ts: if (r.canvases > 0) { console.log(`  ✗ ${r.theme}: ${r.canvases} canvas element(s) — Chart.js is forbidden`); failures++; }`

## memory.md duplicate-feedback hotspots

| agent | feedback_dates | repeated_tokens |
| --- | --- | --- |
| kap_watch | 11 | bildirimi:46, bildirim:39, bildirimleri:28, temettü:28, impact:25, forward:25, disclosure:23, material:23 |
| analyst_consensus_agent | 8 | analist:28, varsayımı:21, tablosu:18, sensitivity:13, konsensüs:12, holding:11, revizyon:10, trendi:10 |
| event_classification | 8 | değişimi:28, material:26, classification:25, impact:23, bildirimi:23, classify:20, temettü:20, etkisi:18 |
| technical_analysis | 7 | teknik:63, insider:40, analizi:40, volume:29, fibonacci:29, bollinger:28, standart:26, bildirimi:26 |
| report_formatter | 6 | grafik:31, kırmızı:27, footer:25, kontrol:24, envelope:24, formatter:22, teslim:22, header:19 |
| coo | 5 | blocked:36, delivery:35, formatter:33, kontrol:29, teslim:26, direktif:26, payload:25, kararı:21 |
| event_impact_mapper | 5 | temettü:30, impact:29, template:26, haritalama:25, değişimi:19, etkisi:17, python:17, quantification:15 |
| event_timeline_alert | 5 | immediate:65, medium:56, urgency:37, değişimi:22, timeline:15, sonuçları:15, rotaları:14, senaryo:14 |
| final_summary | 5 | tablosu:44, ebitda:27, kalite:26, summary:23, yönetici:19, formatı:18, unblock:18, koşulu:18 |
| qa_review | 5 | kontrol:36, impact:20, chairman:18, havacılık:17, kontrolü:16, ebitdar:16, sektör:15, downstream:13 |
| strategic_synthesis | 5 | ebitda:27, trigger:25, üretilmedi:24, minimum:24, revenue:19, senaryo:18, formatı:18, yatırım:17 |
| ceo | 4 | heartbeat:47, archive:42, sector:34, competition:34, impact:31, timeline:28, mapper:27, sorunlu:24 |
| context_extraction | 4 | context:27, bildirimi:27, pozisyon:27, pozisyonu:24, tablosu:21, raporu:21, taahhüt:20, profili:18 |
| data_collection | 4 | raporu:30, canonical:23, bildirimi:22, yıllık:21, tablosu:21, downstream:17, kaynak:15, segment:15 |
| financial_analysis | 4 | ebitda:47, ebitdar:33, metrics:27, sektör:20, eksikler:17, chairman:17, revenue:16, bundan:16 |
| parse_standardization | 4 | ebitda:48, ticari:31, income:29, tablosu:25, eskalasyon:19, pending:18, raporu:18, bildirimi:17 |
| reconciliation | 4 | skipped:34, downstream:29, reconciliation:27, finansal:26, yapılmadı:24, eskalasyon:23, ebitda:21, kontrol:20 |
| macro_analysis | 3 | etkisi:40, jeopolitik:32, maliyeti:26, ebitda:24, impact:18, tablosu:18, summary:15, üretilmedi:15 |
| sector_competition | 3 | sektör:46, porter:25, industrial:22, havacılık:19, ebitdar:17, analizi:16, benchmark:14, listesi:14 |
| valuation_agent | 3 | ebitda:20, holding:9, discount:8, tablosu:7, downstream:7, kaynak:5, sensitivity:5, lessons:5 |


## memory.md prose rules likely movable to schema/canonical/code

| agent | memory_kb | schema_migration_candidates | canonicalizable_sections |
| --- | --- | --- | --- |
| parse_standardization | 31.02 | 70 | 19 |
| financial_analysis | 30.59 | 65 | 15 |
| report_formatter | 31.1 | 55 | 19 |
| qa_review | 22.22 | 55 | 10 |
| data_collection | 28.76 | 53 | 15 |
| technical_analysis | 30.6 | 49 | 18 |
| context_extraction | 31.56 | 47 | 17 |
| coo | 31.24 | 47 | 23 |
| event_impact_mapper | 20.66 | 47 | 9 |
| event_classification | 28.47 | 46 | 17 |
| macro_analysis | 20.39 | 46 | 10 |
| ceo | 44.34 | 44 | 29 |
| kap_watch | 29.56 | 43 | 17 |
| reconciliation | 28.13 | 43 | 16 |
| strategic_synthesis | 23.87 | 39 | 10 |
| event_timeline_alert | 20.16 | 36 | 9 |
| final_summary | 22.1 | 32 | 10 |
| sector_competition | 18.78 | 32 | 10 |
| analyst_consensus_agent | 13.23 | 19 | 7 |
| esg_agent | 6.5 | 16 | 2 |
| valuation_agent | 7.61 | 15 | 3 |
| sentiment_news_agent | 6.1 | 14 | 2 |
| agent_performance_review | 3.47 | 3 | 0 |
| agent_factory | 1.36 | 2 | 1 |
| orchestrator | 1.36 | 2 | 1 |
| cost_performance_optimizer | 0.9 | 0 | 0 |


## Notes

- Duplicate grouping is sentence/line based; semantically equivalent rules with different wording will under-count.
- Conflict rows above are not mere text duplicates; they were inferred by cross-reading runtime code and documentation.
