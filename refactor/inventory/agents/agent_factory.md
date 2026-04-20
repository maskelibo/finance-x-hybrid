# Agent inventory — agent_factory

- Registered in `agents_registry.json`: **True**
- Registry group: `management`
- Reports to: `ceo`
- Upstream (derived): `ceo`
- Downstream (derived): —
- Folder total size: **8.36 KB** across 5 entries
- Red flags: `has_memory_backup_file`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 2.15 | 33 | 2026-04-19T12:49:43Z |
| memory.backup.md | 0.86 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 1.43 | 69 | 2026-04-19T12:49:43Z |
| output_schema.json | 1.14 | 27 | 2026-04-19T12:49:43Z |
| system_prompt.md | 2.78 | 75 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **2.7 KB**, 75 lines
- Headings: H1=1, H2=8, H3+=0
- Bullets: 0 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **11**

## memory.md

- Size: **1.36 KB**, 69 lines
- Feedback dates found: 1 → 2026-04-09
- Rule-marker lines: **0** · Migration-candidate headings: 1
- Canonical-rule hints present: banka×1
- Top repeated tokens (len≥6, freq≥5): başlangıç×5, seviyesi×5

- `memory.backup.md` present: **0.86 KB**
## output_schema.json

- Size: **1.11 KB** · max nesting depth: 2
- Required (top level): 6
- Required (recursive sum): 10
- Properties (recursive): 12
- Enum/const usage: 2
- minLength fields: **1** · minItems fields: 1
- $ref usages: 0

## agent_spec.json

- Size: **2.12 KB**
- Inputs: hiring_request, agents_registry, capability_matrix
- Outputs: agent_design_package
- Tools: template_generator, schema_validator, capability_gap_analyzer
- Handoff rules: 2 · Runtime modes: all
- Failure modes: 1 · KPIs: 2
