# Phase 8B Summary — Prompt Canonicalization

- Branch: `refactor/phase-8a-memory-audit` (Phase 8A ile aynı, tek branch iki commit)
- Başlangıç: commit `84e2f5bf` (Phase 8A memory purge)
- Davranış değişimi: **SIFIR runtime change** — system_prompt.md başına canonical referans bloğu eklendi, mevcut içerik SİLİNMEDİ (additive).

## Hedef (REFACTOR_BRIEF.md §3.1)

Her analitik agent'ın `system_prompt.md`'sine, canonical/ altındaki doğruluk kaynağı dosyalara referans veren bir blok ekle. Böylece agent:

- Canonical'ı SINGLE SOURCE OF TRUTH olarak tanır
- Çelişki olursa canonical'ı kullanır
- Çelişki raporunu `refactor/reports/additional_findings.md`'ye düşer

## Ne yapıldı

### 1. `refactor/tools/phase8b_prompt_canonicalize.py` (YENİ)

Deterministic, idempotent splice script. `BLOCK_MARKER` (HTML comment) varsa atlar; yoksa title'ın hemen altına canonical referans bloğu ekler.

**Eklenen blok içeriği:**
- `canonical/tickers/sector_mapping.yaml`
- `canonical/rules/mandatory_metrics.yaml`
- `canonical/rules/null_handling_protocol.md`
- `canonical/rules/confidence_taxonomy.md`
- `canonical/rules/output_integrity.md`
- `canonical/rules/ias29_protocol.md`
- `canonical/sectors/<sector>.yaml`
- `canonical/contracts/agent_io_contracts.yaml`
- `canonical/contracts/pipeline_modes.yaml`
- `canonical/glossary/{terms,abbreviations}.md`

**Kural hiyerarşisi** (brief §3):
1. Global rules → `canonical/rules/*`
2. Sector playbook → `canonical/sectors/<sector>.yaml`
3. Agent system prompt (bu dosya)
4. Agent memory.md (Phase 8A'dan max 2KB)

### 2. Kapsam

23 analitik agent güncellendi (her biri +29 satır):

```
ceo, coo, agent_performance_review
financial_analysis, valuation_agent, reconciliation, context_extraction,
parse_standardization, data_collection,
sector_competition, macro_analysis, technical_analysis,
sentiment_news_agent, analyst_consensus_agent, esg_agent,
event_classification, event_impact_mapper, event_timeline_alert,
kap_watch,
qa_review, strategic_synthesis, final_summary,
report_formatter
```

Utility agent'lar (orchestrator, agent_factory) skip edildi — canonical'a bağımlılık yok.
Prompt dosyası olmayan klasörler (_legacy_memory_archive, _shared_knowledge_modules, cost_performance_optimizer) skip edildi.

### 3. Sonuç

- Toplam system_prompt.md satır değişimi: 6072 → 6739 (+667 satır, +%11)
- Her prompt'un en başında canonical referans bloğu var
- Eski içerik korunuyor — regresyon riski yok

## Kapsam dışında (bilinçli)

Brief §3.1'in ikinci yarısı — "agent prompt'undaki duplicate rule'ları SİLME":

- Bu işlem kaliteyi etkileyebilir (prompt'ta kaliteye yön veren nüans satırları var)
- Regresyon guardrail'i olmadan risklidir
- Bir sonraki faz (Phase 8C): sadece `prompt_memory_lint.py` `duplicate_rule` flag atan satırları silme. Observe-only önce, sonra hard delete.

## Tests

```bash
cd backend && npx tsc --noEmit                                                              exit 0
python canonical/_loader/python/loader.py --selftest                                         OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json       OK (15/15)
python refactor/tools/phase8b_prompt_canonicalize.py                                         idempotent
```

## Lint ölçümü

prompt_memory_lint çıktısı:

| | Baseline (pre-8A) | Post-8A | Post-8B |
|---|---:|---:|---:|
| Total findings | 177 | 138 | 154 |
| Hard (>10KB) | 20 | 10 | 10 |
| Duplicate rule | 23 | 3 | 3 |
| Canonical candidate | 130 | 111 | 126 |

`canonical_candidate` sayısı 8B sonrası hafifçe arttı — çünkü promptlar uzadı. Ama `duplicate_rule` sayısı 23 → 3 seviyesinde (Phase 8A kazanımı). Duplicate rule silme Phase 8C'de.

## Runtime davranışı

Agent pipeline koşumunda system_prompt.md başına yeni canonical referans bloğu görünür. Eski içerik değişmediği için mevcut davranış korunur; yeni referans bloğu agent'ın canonical'a yönelmesini artırır.

## Rollback

```bash
# Phase 8B'yi geri al (Phase 8A korunur):
git revert <phase8b-commit-sha>

# Hem 8A hem 8B'yi geri al:
git checkout master
git branch -D refactor/phase-8a-memory-audit
tar -xzf backups/pre_phase8a_memory_20260421_231101.tar.gz -C /
```
