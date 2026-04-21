# Phase 8C Summary — Reasoning Quality Directives

- Branch: `refactor/phase-8a-memory-audit`
- Başlangıç: commit `31eb4764` (Phase 8B prompt canonicalization)
- Davranış değişimi: **SIFIR runtime change** — analitik agent prompt'larına `REASONING QUALITY DIRECTIVES` bloğu eklendi, mevcut içerik değişmedi.

## Hedef (REFACTOR_BRIEF.md §9.2)

18 interpretation-üreten agent'ın system_prompt.md'sine standart reasoning bloğu:

1. Önce hipotez, sonra veriyle test
2. En az 3 alternatif yorum
3. Sayıları anlamlandır, sadece raporlama
4. "ÇÜNKÜ ..." nedensellik zorunlu
5. Counter-hypothesis zorunlu
6. TRY etkisi sayısal
7. Sektör benchmark olmadan yorum yok — `canonical/sectors/<sector>.yaml` referans

## Ne yapıldı

### `refactor/tools/phase8c_reasoning_directives.py` (YENİ)

Idempotent splice. Phase 8B bloğunun hemen ardına yerleştirir; 8B yoksa title'ın altına. HTML comment marker ile tekrar çalışmada NOOP.

**Kapsam:** 18 analitik agent

```
ceo, coo, agent_performance_review
financial_analysis, valuation_agent, reconciliation
sector_competition, macro_analysis, technical_analysis
sentiment_news_agent, analyst_consensus_agent, esg_agent
event_classification, event_impact_mapper, event_timeline_alert
qa_review, strategic_synthesis, final_summary
```

**Kapsam dışı (bilinçli):**
- data_collection, parse_standardization, context_extraction, kap_watch, report_formatter — data-shuffle/format ajanları, yorum üretmez
- orchestrator, agent_factory — utility

## Tests

```bash
cd backend && npx tsc --noEmit                                                              exit 0
python canonical/_loader/python/loader.py --selftest                                         OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json       OK (15/15)
```

## Runtime davranışı

Reasoning directives prompt'un başında agent tarafından okunur. Schema minLength kontrolleri (Phase 4A) interpretation derinliğini zaten zorluyor; bu blok **nasıl düşüneceğini** açıklıyor. Birlikte çalıştığında interpretation kalitesi tutarlı hale gelir.

Birleşik etki (Phase 8A + 8B + 8C):

| Katman | Etki |
|---|---|
| **8A memory purge** | Prompt token ~%53↓, duplicate rule 23→3 |
| **8B canonical refs** | Canonical'a 23 agent'tan direkt referans, kural hiyerarşisi açık |
| **8C reasoning directives** | 18 agent'ta 7 madde standart reasoning protokolü |

## Kapsam dışında (sonraki fazlar)

- **§7 Map-Reduce (QA → formatter split)** — orchestrator refactor gerekli, observe-only guardrail şart
- **§8.1 Prompt caching** — Anthropic cache_control ekleme, mevcut llm/claude-provider.ts refactor
- **§8.2 Parallel execution** — DAG resolver güncellenmesi (bazı fan-out agent'lar zaten paralel, ek gruplar bulunmalı)
- **§8.3 Extended thinking** — claude-provider'a extended thinking mode, agent-per-agent config
- **§9.3 Few-shot examples** — `agents/<agent>/examples/` klasörü + prompt inject
