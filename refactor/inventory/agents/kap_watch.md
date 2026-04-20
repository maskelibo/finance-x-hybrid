# Agent inventory — kap_watch

- Registered in `agents_registry.json`: **True**
- Registry group: `event`
- Reports to: `orchestrator`
- Upstream (derived): `orchestrator`
- Downstream (derived): —
- Folder total size: **77.55 KB** across 9 entries
- Red flags: `memory_bloat_29.56kb`, `feedback_log_style_11_dates`, `canonicalizable_sections_17`, `schema_no_minLength_enforcement`, `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.77 | 53 | 2026-04-19T12:49:43Z |
| knowledge.md | 6.97 | 190 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.99 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 29.88 | 318 | 2026-04-19T12:49:43Z |
| memory_archive.md | 17.5 | 307 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.53 | 56 | 2026-04-19T12:49:43Z |
| output_SISE_20260410.json | 11.57 | 290 | 2026-04-19T12:49:43Z |
| system_prompt.md | 3.78 | 107 | 2026-04-19T12:49:43Z |
| test_cases.json | 1.56 | 29 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **3.67 KB**, 107 lines
- Headings: H1=1, H2=10, H3+=2
- Bullets: 19 · Code blocks: 2 · Rule-marker lines (ZORUNLU/YASAK/must/never): **10**

## knowledge.md

- Size: **6.78 KB**, 190 lines
- Headings: H1=1, H2=11, H3+=10
- Bullets: 68 · Code blocks: 2 · Rule-marker lines: 4

## memory.md

- Size: **29.56 KB**, 318 lines
- Feedback dates found: 11 → 2025-04-16, 2026-03-16, 2026-03-17, 2026-04-10, 2026-04-11, 2026-04-12, 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **37** · Migration-candidate headings: 17
- Canonical-rule hints present: THYAO×28, TUPRS×14, KCHOL×7, ASELS×2, EREGL×14, TCELL×7, SAHOL×3, BIMAS×4, havacılık×1, banka×2, telekom×1, holding×6, savunma×2, proxy×5
- Top repeated tokens (len≥6, freq≥5): bildirimi×46, bildirim×39, bildirimleri×28, temettü×28, impact×25, forward×25, disclosure×23, material×23, sessizlik×19, trafik×18

- `memory.backup.md` present: **0.99 KB**
- `memory_archive.md` present: **17.5 KB**
## output_schema.json

- Size: **2.47 KB** · max nesting depth: 4
- Required (top level): 10
- Required (recursive sum): 20
- Properties (recursive): 29
- Enum/const usage: 4
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **2.72 KB**
- Inputs: watch_list, monitoring_window, last_seen_disclosure_id
- Outputs: disclosure_inventory
- Tools: kap_api_client, disclosure_deduplicator, kap_rate_limiter, document_registry_writer
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `output_SISE_20260410.json`
