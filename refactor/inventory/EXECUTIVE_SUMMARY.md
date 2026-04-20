# Executive Summary

- Generated: 2026-04-20T21:15:06.798619+00:00
- Scope: Phase 1 inventory + audit only. No production logic changed in this deliverable beyond inventory scripts/reports.

## Most critical 10 problems

| problem | impact_x_frequency | evidence |
| --- | --- | --- |
| Runtime/documentation drift on mode activation and agent count | 10 x 9 = 90 | Docs say 20/22 agents and 5-6-agent fast mode; actual runtime activates 16/18/22 agents depending on mode backbone. |
| Prompt/memory bloat exceeds what runtime actually injects | 9 x 9 = 81 | Many memories are 20-44 KB, but agent-runner trims memory injection to 6 KB. |
| No single canonical sector/rule source | 9 x 8 = 72 | THYAO/aviation, IAS29, Chart.js, and sector heuristics appear across memory, prompts, formatter code, peer_sets, and docs. |
| QA / CEO gates are advisory in runtime, not hard blockers | 10 x 7 = 70 | executeSession logs warnings/overrides and continues after failed QA or approval checks. |
| Schema enforcement is weaker than platform doctrine claims | 8 x 8 = 64 | Shared universal contract exists, but runtime validator uses lightweight per-agent/text checks; many schemas lack minLength/minItems depth constraints. |
| Formatter doctrine is internally contradictory | 8 x 7 = 56 | system_prompt bans Chart.js and raw HTML generation; agent_spec still requires Chart.js and layout authority. |
| Output metric completeness is materially below doctrinal target | 9 x 6 = 54 | Sampled reports omit many working-capital / cash-conversion metrics; THYAO still misses aviation identity/KPIs. |
| Agent roster split-brain across filesystem, registry, and runtime code | 7 x 7 = 49 | Some agent folders are not in runtime registry, while some runtime agents drift against `agents_registry.json`. |
| Artifacts/backups/dumps dominate the repo surface | 6 x 8 = 48 | Output artifacts are 772,758 KB and 800+ files; agent folders also contain many backup/sample files. |
| Critical path is still long despite parallel phases | 7 x 6 = 42 | Approx runtime path from baseline: fast 49.9 min, standard 53.1 min, deep 59.5 min. |


## Highest-leverage 5 refactor candidates

| candidate | why |
| --- | --- |
| Create canonical ticker->sector YAML and replace runtime keyword heuristics | High leverage; fixes THYAO/industrial and removes repeated memory directives. |
| Make QA `overall_score` required and block delivery on explicit fail/revision | Runtime behavior aligns with doctrine quickly. |
| Prune/archival policy for `memory.md` + stop loading >6 KB memories silently | Immediate context reduction without quality loss. |
| Unify report formatter doctrine (agent_spec + prompt + compose.ts) | Removes Chart.js/SVG contradiction and stabilizes report expectations. |
| Mark agent roster truth source and reconcile runtime registry vs registry JSON | Stops orchestration/config drift. |


## Structural changes (strategic)

| candidate | why |
| --- | --- |
| Canonical rules/sectors/contracts directory | Single source of truth for metric doctrine, null handling, sector playbooks. |
| Manifest + retrieval pattern for large upstream outputs | Addresses lost-in-the-middle and prompt bloat root cause. |
| Cross-agent finding acknowledgement contract | Fixes QA loop leakage and silent downstream omissions. |
| True AJV validation gate + retry categorization middleware | Turns schema from documentation into runtime enforcement. |
| Golden-scorecard regression harness around final HTML/report quality | Protects depth while refactoring architecture. |


## Risk matrix

| change_area | primary_agents | risk |
| --- | --- | --- |
| Canonical sector mapping | context_extraction, financial_analysis, sector_competition, report_formatter | Medium |
| Shared contract hardening | qa_review, final_summary, strategic_synthesis, report_formatter | High |
| Memory purge / hierarchy | All agent prompts | Medium |
| Manifest retrieval | financial_analysis, qa_review, strategic_synthesis, final_summary, report_formatter | High |
| Pipeline mode rewrite | ceo, orchestrator, coo | Medium |


## Quick wins (<1 day, high leverage)

- **Create canonical ticker->sector YAML and replace runtime keyword heuristics** — High leverage; fixes THYAO/industrial and removes repeated memory directives.
- **Make QA `overall_score` required and block delivery on explicit fail/revision** — Runtime behavior aligns with doctrine quickly.
- **Prune/archival policy for `memory.md` + stop loading >6 KB memories silently** — Immediate context reduction without quality loss.
- **Unify report formatter doctrine (agent_spec + prompt + compose.ts)** — Removes Chart.js/SVG contradiction and stabilizes report expectations.
- **Mark agent roster truth source and reconcile runtime registry vs registry JSON** — Stops orchestration/config drift.

## Structural changes (>1 week, strategic)

- **Canonical rules/sectors/contracts directory** — Single source of truth for metric doctrine, null handling, sector playbooks.
- **Manifest + retrieval pattern for large upstream outputs** — Addresses lost-in-the-middle and prompt bloat root cause.
- **Cross-agent finding acknowledgement contract** — Fixes QA loop leakage and silent downstream omissions.
- **True AJV validation gate + retry categorization middleware** — Turns schema from documentation into runtime enforcement.
- **Golden-scorecard regression harness around final HTML/report quality** — Protects depth while refactoring architecture.

## Supporting observations

- Largest memory files: ceo 44.3 KB, context_extraction 31.6 KB, coo 31.2 KB, report_formatter 31.1 KB, parse_standardization 31.0 KB, technical_analysis 30.6 KB, financial_analysis 30.6 KB, kap_watch 29.6 KB
- Actual mode agent counts: fast=16, standard=18, deep=22
- Report sample showed ongoing sector/identity leakage (e.g. THYAO rendered as industrial) and inconsistent 12-section compliance.
