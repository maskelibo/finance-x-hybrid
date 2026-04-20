"""
Schema audit for Finance-X Hybrid refactor Phase 1 - Task 1.4.

Walks every JSON Schema under:
  - schemas/shared/*.schema.json
  - agents/<agent>/output_schema.json
  - backend/generated/schemas/*.schema.json (if present)

For each schema file computes:
  * size, required count (top level and recursive)
  * property count, max nesting depth
  * $ref targets (internal + external)
  * "loose fields": string-typed properties without enum/pattern/minLength/format
  * "missing enum" heuristics: string fields whose name implies enum (confidence,
    status, severity, mode, category, level, action, kind, type, ...)
  * "optional-but-critical" heuristics: properties named like critical fields
    (confidence, evidence_refs, findings, ...) that aren't in the parent's
    required[].
  * list of AJV-enforcement gaps (no minItems on array of obvious "required items")

Emits:
  refactor/inventory/schema_audit.md
  refactor/inventory/schema_audit.json
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "refactor" / "inventory"

SCHEMA_GLOBS = [
    "schemas/**/*.json",
    "agents/**/output_schema.json",
    "backend/generated/schemas/*.schema.json",
]

# Fields whose names strongly imply a fixed enum but where schemas often leave a bare string.
ENUM_HINT_NAMES = {
    "confidence", "confidence_level", "confidence_overall",
    "status", "severity", "mode", "kind", "type",
    "action", "decision", "verdict", "review_status",
    "category", "direction", "trend", "scope",
    "priority", "risk_level", "proxy_used",
}
# Critical field names that should almost always be in required[] when they exist.
CRITICAL_FIELDS = {
    "agent_id", "output_id", "session_id", "task_id", "timestamp",
    "confidence_overall", "confidence", "evidence_refs", "findings",
    "warnings", "missing_inputs", "review_status", "mandatory_metrics_complete",
}


@dataclass
class LooseField:
    path: str
    reason: str  # e.g., "string_no_enum", "string_no_minLength", etc.


@dataclass
class SchemaReport:
    file: str
    size_kb: float
    title: str | None
    id: str | None
    valid_json: bool
    required_top: list[str] = field(default_factory=list)
    total_required: int = 0
    total_properties: int = 0
    max_depth: int = 0
    refs: list[str] = field(default_factory=list)
    internal_defs: list[str] = field(default_factory=list)
    enum_count: int = 0
    minLength_count: int = 0
    minItems_count: int = 0
    pattern_count: int = 0
    format_count: int = 0
    loose_string_fields: list[LooseField] = field(default_factory=list)
    missing_enum_candidates: list[str] = field(default_factory=list)
    critical_fields_not_required: list[str] = field(default_factory=list)
    arrays_without_minItems: list[str] = field(default_factory=list)


def find_schemas() -> list[Path]:
    out: list[Path] = []
    for g in SCHEMA_GLOBS:
        for p in ROOT.glob(g):
            if "node_modules" in p.parts:
                continue
            if p.suffix != ".json":
                continue
            out.append(p)
    return sorted(set(out))


def walk_schema(
    node: Any,
    path: str,
    parent_required: list[str],
    rep: SchemaReport,
    depth: int = 0,
) -> None:
    rep.max_depth = max(rep.max_depth, depth)
    if not isinstance(node, dict):
        return

    if "$ref" in node:
        rep.refs.append(node["$ref"])

    if "enum" in node or "const" in node:
        rep.enum_count += 1
    if "minLength" in node:
        rep.minLength_count += 1
    if "minItems" in node:
        rep.minItems_count += 1
    if "pattern" in node:
        rep.pattern_count += 1
    if "format" in node:
        rep.format_count += 1

    req = node.get("required", [])
    if isinstance(req, list):
        rep.total_required += len(req)

    props = node.get("properties")
    if isinstance(props, dict):
        rep.total_properties += len(props)
        for pname, pnode in props.items():
            child_path = f"{path}.{pname}" if path else pname

            # Inspect typed properties.
            if isinstance(pnode, dict):
                ptype = pnode.get("type")
                is_string = ptype == "string" or (isinstance(ptype, list) and "string" in ptype)
                has_constraint = any(
                    k in pnode for k in ("enum", "const", "pattern", "minLength", "format", "$ref")
                )

                if is_string and not has_constraint:
                    # Loose string: flag reason.
                    rep.loose_string_fields.append(LooseField(
                        path=child_path, reason="string_no_enum_minLength_pattern_format"
                    ))

                if is_string and pname in ENUM_HINT_NAMES and "enum" not in pnode and "const" not in pnode:
                    rep.missing_enum_candidates.append(child_path)

                if pname in CRITICAL_FIELDS and pname not in (req if isinstance(req, list) else []):
                    rep.critical_fields_not_required.append(child_path)

                if pnode.get("type") == "array" and "minItems" not in pnode:
                    rep.arrays_without_minItems.append(child_path)

                walk_schema(pnode, child_path, req if isinstance(req, list) else [], rep, depth + 1)

    items = node.get("items")
    if isinstance(items, dict):
        walk_schema(items, f"{path}[]", [], rep, depth + 1)

    for comb in ("oneOf", "anyOf", "allOf"):
        vals = node.get(comb)
        if isinstance(vals, list):
            for i, v in enumerate(vals):
                walk_schema(v, f"{path}({comb}[{i}])", [], rep, depth + 1)

    for defs_key in ("definitions", "$defs"):
        defs = node.get(defs_key)
        if isinstance(defs, dict):
            for dname, dnode in defs.items():
                rep.internal_defs.append(f"{defs_key}.{dname}")
                walk_schema(dnode, f"{path}.{defs_key}.{dname}", [], rep, depth + 1)


def audit_file(p: Path) -> SchemaReport:
    text = p.read_text(encoding="utf-8", errors="replace")
    rep = SchemaReport(
        file=p.relative_to(ROOT).as_posix(),
        size_kb=round(len(text.encode("utf-8")) / 1024, 2),
        title=None,
        id=None,
        valid_json=False,
    )
    try:
        doc = json.loads(text)
        rep.valid_json = True
    except Exception as e:
        return rep

    if isinstance(doc, dict):
        rep.title = doc.get("title")
        rep.id = doc.get("$id")
        top_req = doc.get("required")
        if isinstance(top_req, list):
            rep.required_top = top_req

    walk_schema(doc, "", rep.required_top, rep, depth=0)
    # Dedup.
    rep.refs = sorted(set(rep.refs))
    rep.missing_enum_candidates = sorted(set(rep.missing_enum_candidates))
    rep.critical_fields_not_required = sorted(set(rep.critical_fields_not_required))
    return rep


def classify_ref(ref: str, owner_file: str) -> str:
    if ref.startswith("#"):
        return "internal"
    return "external"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    schemas = find_schemas()
    reports = [audit_file(p) for p in schemas]

    # Build ref graph: file -> set of external target files
    ref_graph: dict[str, dict[str, list[str]]] = {}
    for r in reports:
        outgoing: dict[str, list[str]] = {"internal": [], "external": []}
        for ref in r.refs:
            outgoing[classify_ref(ref, r.file)].append(ref)
        ref_graph[r.file] = outgoing

    # Summary rows.
    summary_rows = []
    for r in reports:
        summary_rows.append({
            "file": r.file,
            "size_kb": r.size_kb,
            "valid": "✓" if r.valid_json else "✗",
            "req_top": len(r.required_top),
            "req_all": r.total_required,
            "props": r.total_properties,
            "depth": r.max_depth,
            "refs": len(r.refs),
            "enum": r.enum_count,
            "minLength": r.minLength_count,
            "minItems": r.minItems_count,
            "pattern": r.pattern_count,
            "format": r.format_count,
            "loose_strings": len(r.loose_string_fields),
            "missing_enum_candidates": len(r.missing_enum_candidates),
            "critical_optional": len(r.critical_fields_not_required),
            "arrays_no_minItems": len(r.arrays_without_minItems),
        })
    summary_rows.sort(key=lambda r: -r["props"])

    # Hot lists across the portfolio.
    totals = {
        "files": len(reports),
        "valid_files": sum(1 for r in reports if r.valid_json),
        "total_props": sum(r.total_properties for r in reports),
        "total_required": sum(r.total_required for r in reports),
        "total_enum": sum(r.enum_count for r in reports),
        "total_minLength": sum(r.minLength_count for r in reports),
        "total_minItems": sum(r.minItems_count for r in reports),
        "total_pattern": sum(r.pattern_count for r in reports),
        "total_loose_strings": sum(len(r.loose_string_fields) for r in reports),
        "total_missing_enum": sum(len(r.missing_enum_candidates) for r in reports),
        "total_arrays_no_minItems": sum(len(r.arrays_without_minItems) for r in reports),
    }

    def md_table(rows: list[dict], cols: list[str]) -> str:
        out = "| " + " | ".join(cols) + " |\n| " + " | ".join(["---"] * len(cols)) + " |\n"
        for r in rows:
            out += "| " + " | ".join(str(r.get(c, "")) for c in cols) + " |\n"
        return out

    md: list[str] = []
    md.append("# Schema Audit — Finance-X Hybrid")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append(f"- Schema files found: **{totals['files']}** (valid JSON: {totals['valid_files']})")
    md.append(f"- Total properties (recursive sum): **{totals['total_props']}**")
    md.append(f"- Total `required` entries (recursive sum): **{totals['total_required']}**")
    md.append(f"- Total enum/const constraints: **{totals['total_enum']}**")
    md.append(f"- Total `minLength` constraints: **{totals['total_minLength']}**")
    md.append(f"- Total `minItems` constraints: **{totals['total_minItems']}**")
    md.append(f"- Total `pattern` constraints: **{totals['total_pattern']}**")
    md.append(f"- Loose string fields (no enum/pattern/minLength/format): **{totals['total_loose_strings']}**")
    md.append(f"- Missing-enum candidates (string field name ∈ ENUM_HINT_NAMES but no enum): **{totals['total_missing_enum']}**")
    md.append(f"- Arrays without `minItems`: **{totals['total_arrays_no_minItems']}**")
    md.append("")

    md.append("## Per-file summary")
    md.append("")
    md.append(md_table(summary_rows, [
        "file", "size_kb", "valid", "req_top", "req_all", "props", "depth",
        "refs", "enum", "minLength", "minItems", "pattern", "format",
        "loose_strings", "missing_enum_candidates", "critical_optional", "arrays_no_minItems",
    ]))

    md.append("## `$ref` graph")
    md.append("")
    md.append("Internal (`#/...`) references stay within the file; external refs link to other schema files.")
    md.append("")
    md.append("| file | internal_refs | external_refs |")
    md.append("| --- | --- | --- |")
    for file, ref in ref_graph.items():
        md.append(f"| `{file}` | {len(ref['internal'])} | {', '.join(f'`{r}`' for r in ref['external']) or '—'} |")
    md.append("")

    md.append("## Missing-enum candidates (string fields that should be enums)")
    md.append("")
    md.append("These fields bear enum-implying names but are defined as plain strings. Tightening them directly raises enforcement and removes doctrine drift.")
    md.append("")
    md.append("| file | path |")
    md.append("| --- | --- |")
    for r in reports:
        for path in r.missing_enum_candidates:
            md.append(f"| `{r.file}` | `{path}` |")
    md.append("")

    md.append("## Critical fields present but NOT in `required[]`")
    md.append("")
    md.append("Fields named like load-bearing contract fields (`confidence_overall`, `evidence_refs`, `findings`, …) that the parent schema does not require.")
    md.append("")
    md.append("| file | path |")
    md.append("| --- | --- |")
    crit_rows = 0
    for r in reports:
        for path in r.critical_fields_not_required:
            md.append(f"| `{r.file}` | `{path}` |")
            crit_rows += 1
    if crit_rows == 0:
        md.append("| _(none detected)_ | |")
    md.append("")

    md.append("## Loose string fields (top 80)")
    md.append("")
    md.append("String-typed properties with no enum/pattern/minLength/format. Under current schemas, an agent can return `\"\"` or a single word and pass AJV validation.")
    md.append("")
    md.append("| file | path |")
    md.append("| --- | --- |")
    loose_all: list[tuple[str, str]] = []
    for r in reports:
        for lf in r.loose_string_fields:
            loose_all.append((r.file, lf.path))
    for file, p in loose_all[:80]:
        md.append(f"| `{file}` | `{p}` |")
    if len(loose_all) > 80:
        md.append(f"| … | _({len(loose_all) - 80} more entries in schema_audit.json)_ |")
    md.append("")

    md.append("## Arrays without `minItems` (top 80)")
    md.append("")
    md.append("Without `minItems`, a schema accepts `[]` for arrays that should carry required findings / metrics / addressed_findings. These are the clearest targets for Phase 4 schema hardening.")
    md.append("")
    md.append("| file | path |")
    md.append("| --- | --- |")
    arr_all: list[tuple[str, str]] = []
    for r in reports:
        for p in r.arrays_without_minItems:
            arr_all.append((r.file, p))
    for file, p in arr_all[:80]:
        md.append(f"| `{file}` | `{p}` |")
    if len(arr_all) > 80:
        md.append(f"| … | _({len(arr_all) - 80} more entries in schema_audit.json)_ |")
    md.append("")

    (OUT / "schema_audit.md").write_text("\n".join(md), encoding="utf-8")
    (OUT / "schema_audit.json").write_text(
        json.dumps({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "totals": totals,
            "ref_graph": ref_graph,
            "reports": [asdict(r) for r in reports],
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"schema files: {totals['files']}")
    print(f"loose strings: {totals['total_loose_strings']}")
    print(f"missing enum candidates: {totals['total_missing_enum']}")
    print(f"arrays w/o minItems: {totals['total_arrays_no_minItems']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
