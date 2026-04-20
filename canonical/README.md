# canonical/ — Finance-X Hybrid Single Source of Truth

This folder is the authoritative rule base for Finance-X Hybrid. Every agent prompt, every schema, every runtime behaviour that depends on doctrine should resolve to a file under `canonical/`. No rule gets written twice.

## Rule hierarchy (conflicts resolved top-to-bottom)

1. **`canonical/rules/*`** — Global rules that apply to every report.
2. **`canonical/sectors/<sector>.yaml`** — Sector playbook overlay.
3. **`agents/<agent>/system_prompt.md`** — Behaviour directives only. **Never** re-states a rule that is in `canonical/`; references it by id.
4. **`agents/<agent>/memory.md`** — Max ~2 KB. Fresh, narrow, agent-specific nuance from the last 30 days. Not a governance log.

If a prose rule already exists in `canonical/`, the agent prompt **must not** restate it — only reference it by id (e.g. `MM-07`, `NH-003`, `SR-aviation-kpi-001`).

## Layout

```
canonical/
  README.md                    # this file — how the hierarchy works
  rules/
    mandatory_metrics.yaml     # 28 zorunlu metrik — formül + benchmark + sektör varyantı + null proxy
    null_handling_protocol.md  # Null gelirse proxy hierarchy
    confidence_taxonomy.md     # HIGH / MEDIUM / LOW / BLOCKED kriterleri
    output_integrity.md        # Truncation yasağı, metrics array ≡ engine_snapshot
    ias29_protocol.md          # IAS 29 ne zaman, nasıl ayrıştırılır
  sectors/
    aviation.yaml              # EBITDAR, CASK, RASK, LF, RPK, ASK, Yield, IFRS 16
    steel.yaml                 # DIO vurgu, büyüme/idame CAPEX, HRC transmisyon
    banking.yaml               # NIM, CoR, CAR, fee income
    telecom.yaml               # ARPU, churn, SAC/LTV, capex intensity
    defense.yaml               # Backlog/Revenue, AR-GE/Ciro, ihracat oranı
    retail.yaml                # SSSG, Revenue/Store, IFRS 16 normalize
    holding.yaml               # 3-layer parent/konsolide/segment, SOTP, NAV, discount
    energy_refining.yaml       # Refining margin, crack spread, inventory gain/loss
    industrial_generic.yaml    # Fallback for unclassified industrial
  tickers/
    sector_mapping.yaml        # Ticker → sektör hardcode (single source of truth)
  contracts/
    agent_io_contracts.yaml    # Her agent için input/output contract özeti
    pipeline_modes.yaml        # fast / standard / deep mode path tanımları (runtime ile hizalı)
  glossary/
    terms.md                   # EBITDAR, FAVÖK, CCC, IAS 29 kesin tanımlar
    abbreviations.md           # Kısaltma sözlüğü
  _loader/
    python/                    # Python loader (agents/backend/evals/scripts için)
    ts/                        # TypeScript loader (orchestrator + runtime için)
```

## Operating rules for Phase 2

- **Additive only.** Nothing here replaces anything yet. Phase 3 will start rewriting agent prompts to reference these files.
- **No runtime switch-over in Phase 2.** Agents still rely on their existing prose. `canonical/` is kept in parallel and validated against real outputs so that Phase 3 migration can be proven safe.
- **Regression safety.** Any commit that changes a canonical file must run `python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json` and pass.
- **No prose content about rules anywhere else.** Starting Phase 2, new doctrine goes here. If it belongs in more than one agent, it belongs in `canonical/`.

## Id scheme

- `MM-NN` — Mandatory Metric (28 entries: MM-01 … MM-28)
- `NH-NNN` — Null Handling protocol clause
- `CT-NNN` — Confidence Taxonomy clause
- `OI-NNN` — Output Integrity clause
- `IAS29-NNN` — IAS 29 protocol clause
- `SR-<sector>-NNN` — Sector Rule (e.g. `SR-aviation-001` is "EBITDAR is primary, not EBITDA")
- `TM-<TICKER>` — Ticker Mapping override entry

Agent memory / prompt references use the id (`see MM-07`), not the prose.
