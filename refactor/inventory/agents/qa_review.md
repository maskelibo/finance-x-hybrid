# Agent inventory — qa_review

- Registered in `agents_registry.json`: **True**
- Registry group: `management`
- Reports to: `ceo`
- Upstream (derived): `ceo`
- Downstream (derived): —
- Folder total size: **85.48 KB** across 12 entries
- Red flags: `memory_bloat_22.22kb`, `canonicalizable_sections_10`, `schema_no_minLength_enforcement`, `has_memory_backup_file`, `extra_doc_clutter_4_files`

## Files

| name | size_kb | lines | mtime |
| --- | --- | --- | --- |
| agent_spec.json | 3.21 | 60 | 2026-04-19T12:49:43Z |
| case_lessons.md | 8.37 | 79 | 2026-04-19T12:49:43Z |
| fallback_policy.md | 1.21 | 27 | 2026-04-19T12:49:43Z |
| knowledge.md | 6.07 | 180 | 2026-04-19T12:49:43Z |
| memory.backup.md | 1.0 | 28 | 2026-04-19T12:49:43Z |
| memory.md | 22.46 | 245 | 2026-04-19T12:49:43Z |
| memory_archive.md | 27.09 | 525 | 2026-04-19T12:49:43Z |
| output_schema.json | 2.49 | 59 | 2026-04-19T12:49:43Z |
| permanent_rules.md | 3.24 | 56 | 2026-04-19T12:49:43Z |
| review_rubric.md | 1.45 | 27 | 2026-04-19T12:49:43Z |
| system_prompt.md | 6.57 | 158 | 2026-04-19T12:49:43Z |
| test_cases.json | 2.32 | 52 | 2026-04-19T12:49:43Z |

## system_prompt.md

- Size: **6.42 KB**, 158 lines
- Headings: H1=1, H2=11, H3+=5
- Bullets: 36 · Code blocks: 1 · Rule-marker lines (ZORUNLU/YASAK/must/never): **10**

## knowledge.md

- Size: **5.89 KB**, 180 lines
- Headings: H1=1, H2=11, H3+=10
- Bullets: 23 · Code blocks: 3 · Rule-marker lines: 14

## memory.md

- Size: **22.22 KB**, 245 lines
- Feedback dates found: 5 → 2026-04-13, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17
- Rule-marker lines: **52** · Migration-candidate headings: 10
- Canonical-rule hints present: THYAO×26, KCHOL×3, ASELS×3, EREGL×1, TCELL×2, SAHOL×1, IAS 29×3, IAS29×3, EBITDAR×16, aviation×5, havacılık×17, banka×1, holding×5, defense×1, savunma×5
- Top repeated tokens (len≥6, freq≥5): kontrol×36, impact×20, chairman×18, havacılık×17, kontrolü×16, ebitdar×16, sektör×15, downstream×13, cascade×13, context×13

- `memory.backup.md` present: **1.0 KB**
- `memory_archive.md` present: **27.09 KB**
## output_schema.json

- Size: **2.43 KB** · max nesting depth: 3
- Required (top level): 10
- Required (recursive sum): 20
- Properties (recursive): 25
- Enum/const usage: 4
- minLength fields: **0** · minItems fields: 0
- $ref usages: 0

## agent_spec.json

- Size: **3.15 KB**
- Inputs: agent_output_for_review, output_schema_ref, review_rubric_ref, session_context
- Outputs: qa_assessment_report
- Tools: schema_validator, evidence_checker, confidence_calibration_checker, cross_reference_analyzer
- Handoff rules: 2 · Runtime modes: fast_screening, standard_institutional, deep_dive
- Failure modes: 2 · KPIs: 3

## Extra / non-canonical doc files in this agent folder

- `case_lessons.md`
- `fallback_policy.md`
- `permanent_rules.md`
- `review_rubric.md`
