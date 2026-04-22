# Phase 8F Summary — Schema-First Agent Output

- Branch: `refactor/phase-8a-memory-audit`
- Başlangıç: commit `c083f088` (Phase 8E stall patch)
- Davranış değişimi: agent prompt'larına yeni OUTPUT FORMAT bloğu eklendi; agent'lar bu direktifi uygularsa schema SOFT_BLOCK uyarıları azalır. Mevcut içerik SİLİNMEDİ (additive).

## Tetikleyici kanıt (2026-04-21/22 canlı TUPRS run)

Session `K8UkF3dWIaESoMGB6fIWr` — her agent'ta SCHEMA uyarıları:

- `data_collection: required field eksik: company, data_manifest, coverage_assessment, warnings, confidence_overall, review_status`
- `parse_standardization: company: beklenen tip object, gelen string`
- `reconciliation → SOFT_BLOCK DEGRADED`
- `context_extraction: required field eksik: company, company_profile, ...`
- `financial_analysis → SOFT_BLOCK DEGRADED`
- `sector_competition → SOFT_BLOCK DEGRADED`
- `macro_analysis: required field eksik: company`

Sonuç: agent'lar markdown narrative yazıyor, schema JSON bekliyor → `soft_block` modunda pipeline devam ediyor ama DEGRADED işaretli agent'lar downstream'e yarım veri gönderiyor. `strategic_synthesis` çıktısı **880 byte** oldu (tipik ~30 KB) — bu Lost-in-the-Middle'ın kanıtı.

## Hedef

Her analitik agent'ın system_prompt.md'sine agent-specific bir OUTPUT FORMAT bloğu ekle. Blok:

1. `output_schema.json`'dan okunan `required` field listesini prompt'a inject eder
2. Ajana ilk satırda parseable JSON emit etmesini söyler
3. Narrative markdown'ın JSON'dan SONRA gelmesini şart koşar
4. Konkret JSON skeleton örneği verir (schema'nın minimal halinden üretilir)

## Ne yapıldı

### 1. `refactor/tools/phase8f_schema_first_output.py` (YENİ)

Schema-aware splice tool. Her agent için:

- `output_schema.json` okunur, `required[]` + `properties{}` çıkarılır
- Primitive default ile minimal JSON skeleton üretilir (enum var → ilk değer, const var → const, type'a göre default)
- Agent-specific OUTPUT FORMAT bloğu oluşturulur
- HTML marker ile Phase 8C bloğunun ardına splice edilir
- Idempotent (marker varsa NOOP)

### 2. Kapsam

| Kategori | Sayı | Agent'lar |
|---|---|---|
| **Splice edildi (schema var)** | 16 | ceo, context_extraction, data_collection, event_classification, event_impact_mapper, event_timeline_alert, final_summary, financial_analysis, kap_watch, macro_analysis, parse_standardization, qa_review, reconciliation, sector_competition, strategic_synthesis, technical_analysis |
| **Schema yok** | 6 | analyst_consensus_agent, coo, esg_agent, report_formatter, sentiment_news_agent, valuation_agent |
| **Out-of-scope** | 6 | orchestrator, agent_factory, cost_performance_optimizer, 3 inventory/utility klasörü |

**NOT — 6 agent schema'sız:** Bunlar için output_schema.json eksik. Phase 8G planı:
1. Her eksik agent için schema yaz (reference existing patterns)
2. Sonra 8F splice script tekrar çalıştır — idempotent, sadece eksikleri ekler

### 3. Required field dağılımı

Her agent için schema'dan okunan required field sayısı:
- strategic_synthesis 13, data_collection/financial_analysis/technical_analysis/final_summary 12
- context_extraction/event_impact/event_timeline/macro/qa_review/kap_watch 10-11
- event_classification 9
- ceo 0 (schema'da required liste boş — sadece property önerileri)

## Tests

```bash
cd backend && npx tsc --noEmit                                                              exit 0
python canonical/_loader/python/loader.py --selftest                                         OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json       OK (15/15)
python evals/golden/canonical_structure_test.py                                              OK
python refactor/tools/phase8f_schema_first_output.py                                         16 INSERTED
```

## Beklenen runtime etkisi (sonraki canlı run'da)

- `SCHEMA_VALIDATION_MODE=soft_block` uyarıları **azalır** (agent'lar required field'ları doldurursa)
- `SCHEMA:SOFT_BLOCK DEGRADED` işaretleri **azalır**
- `digestUpstream()` JSON path'i daha sık aktive olur (struct data zaten alanlara ayrılmış)
- strategic_synthesis çıktısı normalleşir (upstream JSON okuyabildiği için dolu gelir)

Bu değişim **prompt-only** — agent'ların uyma oranını doğrulamak için yeni bir canlı run yapılmalı. Şu an baseline: her 22 agent'ta schema-first direktif yok; sonraki run'da 16 agent'ta direktif aktif olacak.

## Kapsam dışı (planlanan)

- **Phase 8G — stream-json migration:** claude-provider.ts'i `--output-format=stream-json` ile event-driven yap. Stall false-positive'leri kökten sıfırlar. FA revision için çok önemli.
- **Phase 8H — map-reduce:** QA per-finding split + formatter section-level parallelism (brief §7).
- **6 schema-less agent için schema tanımı:** Yukarıda listelenenler.

## Rollback

```bash
# Phase 8F'yi geri al (8A-E korunur):
git revert <phase8f-commit-sha>
```
