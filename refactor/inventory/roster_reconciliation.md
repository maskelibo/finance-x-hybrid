# Roster Reconciliation

> Three-way diff of the agent roster across filesystem, registry, and runtime. Phase 2 artefact; does not modify any of the three sources. Phase 3 resolves to a single source (proposed: `canonical/contracts/agent_io_contracts.yaml`).

- Generated: 2026-04-21

## Source inventory

| source | count | file |
| --- | --- | --- |
| filesystem folders | 26 | `agents/<id>/` (ignoring `_legacy_memory_archive`, `_shared_knowledge_modules`) |
| registry JSON | 21 | `agents_registry.json` |
| runtime pipeline | 22 | `AGENT_PIPELINE` in `backend/src/orchestrator.ts:204-227` |

## Roster truth matrix

Legend: ✓ present · ✗ missing.

| agent_id | filesystem | registry | runtime | comment |
| --- | :---: | :---: | :---: | --- |
| `ceo` | ✓ | ✓ | ✓ | fully wired |
| `coo` | ✓ | ✗ | ✓ | **registry-missing**; runtime executes it (backbone) |
| `orchestrator` | ✓ | ✓ | ✗ | orchestrator is not a pipeline agent itself |
| `qa_review` | ✓ | ✓ | ✓ | fully wired |
| `agent_factory` | ✓ | ✓ | ✗ | utility agent, called on-demand only |
| `agent_performance_review` | ✓ | ✓ | ✗ | post-run agent, different trigger |
| `cost_performance_optimizer` | ✓ | ✓ | ✗ | utility agent |
| `data_collection` | ✓ | ✓ | ✓ | fully wired |
| `parse_standardization` | ✓ | ✓ | ✓ | fully wired |
| `reconciliation` | ✓ | ✓ | ✓ | fully wired |
| `context_extraction` | ✓ | ✓ | ✓ | fully wired |
| `financial_analysis` | ✓ | ✓ | ✓ | fully wired |
| `sector_competition` | ✓ | ✓ | ✓ | fully wired |
| `macro_analysis` | ✓ | ✓ | ✓ | fully wired |
| `technical_analysis` | ✓ | ✓ | ✓ | fully wired |
| `kap_watch` | ✓ | ✓ | ✓ | fully wired |
| `event_classification` | ✓ | ✓ | ✓ | fully wired |
| `event_impact_mapper` | ✓ | ✓ | ✓ | fully wired |
| `event_timeline_alert` | ✓ | ✓ | ✓ | fully wired |
| `strategic_synthesis` | ✓ | ✓ | ✓ | fully wired |
| `final_summary` | ✓ | ✓ | ✓ | fully wired |
| `report_formatter` | ✓ | ✓ | ✓ | fully wired |
| `valuation_agent` | ✓ | ✗ | ✓ | **registry-missing**; runtime uses it in deep_dive |
| `sentiment_news_agent` | ✓ | ✗ | ✓ | **registry-missing**; deep_dive |
| `analyst_consensus_agent` | ✓ | ✗ | ✓ | **registry-missing**; deep_dive |
| `esg_agent` | ✓ | ✗ | ✓ | **registry-missing**; deep_dive |

## Axes of drift

### Filesystem + runtime, not in registry
Five agents the orchestrator invokes that the registry does not know about:
- `coo`
- `valuation_agent`
- `sentiment_news_agent`
- `analyst_consensus_agent`
- `esg_agent`

Downstream effect: anything that reads `agents_registry.json` (e.g., the monitoring dashboard's agent list, `agent_performance_review`'s `monitors` array, coverage tests) will under-count. These five agents' output quality is not tracked in the feedback pipeline because the monitor target list is derived from the registry.

### Registry, not in runtime pipeline
Four agents the registry lists but `AGENT_PIPELINE` does not:
- `agent_factory`
- `agent_performance_review`
- `cost_performance_optimizer`
- `orchestrator`

This is expected — these are **utility / meta agents**. They are invoked via separate call sites (post-run loops, dashboard buttons, orchestrator internals), not as part of the per-session pipeline. The registry treats them as first-class; the pipeline does not need to. No action.

### Filesystem only (not runtime and not registry)
None. Every filesystem agent is either in runtime or is the orchestrator itself.

## Phase 3 recommendation

**Adopt `canonical/contracts/agent_io_contracts.yaml` as the single source of truth.** It already lists all 26 filesystem agents with `registry_status: filesystem_only` annotation on the five drift agents. Reconciliation steps:

1. Phase 3.1 — Promote the five registry-missing agents into `agents_registry.json` with `status: active` and appropriate `reports_to`/`supervises` (or move them under `agents/_experimental/` if product decides they are not shipped; that is a product call, not a technical one).
2. Phase 3.2 — Add a pre-boot check in `backend/src/orchestrator.ts` that validates `AGENT_PIPELINE ⊆ canonical agents` and `registry ⊆ canonical agents`. Boot fails on mismatch.
3. Phase 3.3 — Update `agent_performance_review.monitors[]` to cover all seven specialist non-event agents (currently covers only seven, missing `valuation_agent`, `esg_agent`, `sentiment_news_agent`, `analyst_consensus_agent`).

## Deferred decisions requiring human input

- Whether `coo`, `valuation_agent`, `sentiment_news_agent`, `analyst_consensus_agent`, `esg_agent` are **shipped** agents or **experimental** agents. Runtime treats them as shipped; registry treats them as absent. Phase 3 cannot proceed on this axis until product decides.
