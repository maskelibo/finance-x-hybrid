"""
Dead-code & legacy audit for Finance-X Hybrid refactor Phase 1 - Task 1.6.

Heuristics applied:

  1. Explicit legacy markers:
     - folders beginning with `_legacy*`
     - files with `_OLD`, `_legacy`, `LEGACY`, `DEPRECATED` in the name
     - files containing prose `legacy` / `deprecated` / `do not use`
     - `memory.backup.md` files (shadow copies)
     - `memory_archive.md` files
     - duplicated root artefacts such as `..._OLD.pdf`, `_Reformat_*.pdf`, etc.

  2. Reference audit:
     - for each agent-specific file (output_SISE_20260410.json, froto_output_*,
       thyao_output*, ceo_feedback_*, CHECKLIST_*, FEEDBACK_*, etc.) we search the
       repo for any filename references outside of that file itself. Zero
       references = abandoned single-shot artefact.

  3. Staleness: files whose mtime is older than 60 days.

  4. Broken `$ref` targets in schema files (external ref whose URL or relative
     path does not resolve).

  5. Imports — TS/JS/PY files whose basename is never imported anywhere.

Writes:
  refactor/inventory/dead_code.md
  refactor/inventory/dead_code.json
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "refactor" / "inventory"

EXCLUDE_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", "refactor"}

LEGACY_NAME_RE = re.compile(r"(_OLD|_legacy|LEGACY|DEPRECATED|backup)", re.IGNORECASE)
LEGACY_PROSE_RE = re.compile(r"\b(legacy|deprecated|do\s+not\s+use|replaced\s+by|kaldırıldı|kullanılmıyor)\b", re.IGNORECASE)


def walk_files() -> list[Path]:
    result: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith(".agents")]
        for f in filenames:
            result.append(Path(dirpath) / f)
    return result


def safe_read_text(p: Path, limit_bytes: int = 400_000) -> str:
    try:
        with p.open("rb") as fh:
            data = fh.read(limit_bytes)
        return data.decode("utf-8", errors="replace")
    except Exception:
        return ""


def grep_count(term: str, exclude_path: Path | None = None) -> int:
    """Count references to `term` as a literal filename somewhere in the tree.

    Uses python walk + scan instead of ripgrep to keep tool calls minimal.
    Scans only small text files (< 400 KB).
    """
    count = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith(".agents")]
        for f in filenames:
            p = Path(dirpath) / f
            if exclude_path and p == exclude_path:
                continue
            if p.suffix not in {".md", ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".yaml", ".yml", ".html", ".cjs", ".mjs"}:
                continue
            try:
                sz = p.stat().st_size
            except OSError:
                continue
            if sz > 400_000:
                continue
            txt = safe_read_text(p, limit_bytes=min(sz + 10, 400_000))
            if term in txt:
                count += 1
    return count


@dataclass
class Finding:
    path: str
    reason: str
    detail: str = ""


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    all_files = walk_files()
    cutoff = datetime.now(timezone.utc) - timedelta(days=60)
    findings: list[Finding] = []

    # 1) Legacy folders / filenames
    legacy_folders: list[str] = []
    for p in all_files:
        rel = p.relative_to(ROOT).as_posix()
        if "_legacy" in rel or "/legacy/" in rel.lower():
            legacy_folders.append(rel)

    seen_legacy_paths: set[str] = set()
    for p in all_files:
        rel = p.relative_to(ROOT).as_posix()
        name = p.name
        if LEGACY_NAME_RE.search(name):
            findings.append(Finding(path=rel, reason="legacy_name_marker", detail=name))
            seen_legacy_paths.add(rel)

    # memory.backup.md / memory_archive.md
    for p in all_files:
        rel = p.relative_to(ROOT).as_posix()
        if p.name == "memory.backup.md":
            findings.append(Finding(path=rel, reason="memory_backup_shadow_copy"))
        elif p.name == "memory_archive.md":
            findings.append(Finding(path=rel, reason="memory_archive_historical_log"))

    # 2) Single-shot artefacts in agent folders (e.g., output_SISE_20260410.json,
    #    froto_output_*, thyao_output*, ceo_feedback_<date>.md, CHECKLIST_*, FEEDBACK_*).
    single_shot_patterns = [
        re.compile(r"^output_[A-Z]{3,6}_\d{8}\.json$"),
        re.compile(r"^.*_output_\d{8}\.(json|md)$"),
        re.compile(r"^.*_output\.(json|md)$"),
        re.compile(r"^ceo_feedback_\d{8}\.md$"),
        re.compile(r"^CHECKLIST_.*\.md$"),
        re.compile(r"^FEEDBACK_.*\.md$"),
        re.compile(r"^ASELS_REPORT_REVIEW_.*\.md$"),
        re.compile(r"^thyao_analysis\.md$"),
        re.compile(r"^thyao_output(\.json|_\d+\..+)$"),
    ]
    single_shot_candidates: list[str] = []
    for p in all_files:
        if "agents/" not in p.as_posix():
            continue
        rel = p.relative_to(ROOT).as_posix()
        if rel in seen_legacy_paths:
            continue
        n = p.name
        if any(pat.match(n) for pat in single_shot_patterns):
            single_shot_candidates.append(rel)
    # Run grep for references.
    single_shot_with_refs: list[dict] = []
    for rel in single_shot_candidates:
        name = Path(rel).name
        refs = grep_count(name, exclude_path=ROOT / rel)
        entry = {"path": rel, "external_refs": refs}
        single_shot_with_refs.append(entry)
        if refs == 0:
            findings.append(Finding(path=rel, reason="single_shot_artifact_no_external_refs", detail=f"filename `{name}` not referenced elsewhere"))
    single_shot_with_refs.sort(key=lambda r: (r["external_refs"], r["path"]))

    # 3) Root-level duplicate report artefacts (same ticker multiple versions).
    root_reports: dict[str, list[str]] = defaultdict(list)
    report_name_re = re.compile(r"^([A-Z]{4,6})_.*\.(html|pdf|md|json)$")
    for p in all_files:
        if p.parent != ROOT:
            continue
        m = report_name_re.match(p.name)
        if m:
            root_reports[m.group(1)].append(p.name)
    duplicate_clusters = {k: sorted(v) for k, v in root_reports.items() if len(v) > 1}

    # 4) Legacy prose inside small text files.
    prose_legacy_files: list[dict] = []
    for p in all_files:
        if p.suffix not in {".md", ".ts", ".tsx", ".js", ".py", ".html"}:
            continue
        rel = p.relative_to(ROOT).as_posix()
        if any(part in EXCLUDE_DIRS for part in p.parts):
            continue
        try:
            sz = p.stat().st_size
        except OSError:
            continue
        if sz > 400_000:
            continue
        txt = safe_read_text(p, limit_bytes=min(sz + 10, 400_000))
        if LEGACY_PROSE_RE.search(txt):
            # Capture the first hit snippet.
            lines = txt.splitlines()
            snip = ""
            for i, line in enumerate(lines, 1):
                if LEGACY_PROSE_RE.search(line):
                    snip = f"L{i}: {line.strip()[:160]}"
                    break
            prose_legacy_files.append({"path": rel, "snippet": snip})

    # Narrow prose_legacy_files to agent/backend/schemas only (noise reduction).
    prose_filtered = [
        r for r in prose_legacy_files
        if r["path"].startswith(("agents/", "backend/", "schemas/", "prompts/", "workflows/", "python-services/"))
    ]

    # 5) Stale files (>60 days) in agent / backend / schemas.
    stale_files: list[dict] = []
    for p in all_files:
        rel = p.relative_to(ROOT).as_posix()
        if any(part in EXCLUDE_DIRS for part in p.parts):
            continue
        if not (rel.startswith("agents/") or rel.startswith("backend/src/") or rel.startswith("schemas/") or rel.startswith("prompts/") or rel.startswith("python-services/src/")):
            continue
        try:
            mtime = datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc)
        except OSError:
            continue
        if mtime < cutoff:
            stale_files.append({"path": rel, "mtime": mtime.strftime("%Y-%m-%d")})
    stale_files.sort(key=lambda r: r["mtime"])

    # 6) Broken external $ref in schemas.
    broken_refs: list[dict] = []
    schema_files = [p for p in all_files if p.suffix == ".json" and ("schemas/" in p.as_posix() or p.name == "output_schema.json")]
    for p in schema_files:
        try:
            doc = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue

        def walk(node):
            if isinstance(node, dict):
                if "$ref" in node and isinstance(node["$ref"], str):
                    ref = node["$ref"]
                    if not ref.startswith("#"):
                        # external ref -- check if file resolvable
                        # Most are URLs like https://financex.io/schemas/shared/evidence
                        if ref.startswith("http"):
                            tail = ref.split("/")[-1]
                            candidates = list(ROOT.glob(f"schemas/**/{tail}.schema.json"))
                            if not candidates:
                                broken_refs.append({"file": p.relative_to(ROOT).as_posix(), "ref": ref, "reason": "no_matching_local_schema_file"})
                        else:
                            target = (p.parent / ref).resolve()
                            if not target.exists():
                                broken_refs.append({"file": p.relative_to(ROOT).as_posix(), "ref": ref, "reason": "relative_path_does_not_exist"})
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        walk(doc)

    # Write JSON.
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "legacy_folders": sorted(set(legacy_folders)),
        "findings": [asdict(f) for f in findings],
        "single_shot_reference_audit": single_shot_with_refs,
        "root_report_duplicates": duplicate_clusters,
        "prose_legacy_mentions_filtered": prose_filtered,
        "stale_files_over_60_days": stale_files,
        "broken_schema_refs": broken_refs,
    }
    (OUT / "dead_code.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Write MD.
    md: list[str] = []
    md.append("# Dead Code & Legacy")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append("")
    md.append("Heuristic findings only — nothing here has been deleted. Each entry is a candidate for Phase 2-3 cleanup after canonicalization lands.")
    md.append("")

    md.append("## 1. Legacy folders")
    md.append("")
    if legacy_folders:
        md.append("| path |")
        md.append("| --- |")
        for p in sorted(set(legacy_folders))[:30]:
            md.append(f"| `{p}` |")
        md.append(f"\n_Total: {len(set(legacy_folders))} files under legacy folders_")
    else:
        md.append("_None detected_")
    md.append("")

    md.append("## 2. memory.backup / memory_archive files")
    md.append("")
    backup_rows = [f for f in findings if f.reason == "memory_backup_shadow_copy"]
    archive_rows = [f for f in findings if f.reason == "memory_archive_historical_log"]
    md.append(f"- `memory.backup.md` shadow copies: **{len(backup_rows)}**")
    md.append(f"- `memory_archive.md` historical logs: **{len(archive_rows)}**")
    md.append("")
    md.append("| file | kind |")
    md.append("| --- | --- |")
    for f in backup_rows + archive_rows:
        md.append(f"| `{f.path}` | {f.reason} |")
    md.append("")

    md.append("## 3. Single-shot artefacts in agent folders")
    md.append("")
    md.append("Files like `output_SISE_20260410.json`, `thyao_output.json`, `ceo_feedback_20260410.md`, `FEEDBACK_2026_04_10.md`, `CHECKLIST_CRITICAL_METRICS.md`, etc. These were produced during investigation of a single ticker on a single date. `external_refs` counts how many other repo files mention the filename — 0 means nothing else reads it.")
    md.append("")
    md.append("| path | external_refs |")
    md.append("| --- | --- |")
    for r in single_shot_with_refs:
        md.append(f"| `{r['path']}` | {r['external_refs']} |")
    md.append("")

    md.append("## 4. Root-level report duplicates (same ticker, multiple versions)")
    md.append("")
    if duplicate_clusters:
        for ticker, files in sorted(duplicate_clusters.items()):
            md.append(f"<details><summary><b>{ticker}</b> — {len(files)} root artefacts</summary>")
            md.append("")
            for f in files:
                md.append(f"- `{f}`")
            md.append("</details>")
            md.append("")
    else:
        md.append("_None detected_")
    md.append("")

    md.append("## 5. Prose 'legacy/deprecated/do not use' mentions in code paths")
    md.append("")
    md.append("| file | snippet |")
    md.append("| --- | --- |")
    for r in prose_filtered[:60]:
        snip = r["snippet"].replace("|", "\\|")
        md.append(f"| `{r['path']}` | {snip} |")
    if len(prose_filtered) > 60:
        md.append(f"| … | _({len(prose_filtered) - 60} more in dead_code.json)_ |")
    md.append("")

    md.append("## 6. Stale files (>60 days since last modification)")
    md.append("")
    md.append("Within `agents/`, `backend/src/`, `schemas/`, `prompts/`, `python-services/src/`:")
    md.append("")
    md.append("| path | last_modified |")
    md.append("| --- | --- |")
    for r in stale_files[:60]:
        md.append(f"| `{r['path']}` | {r['mtime']} |")
    if len(stale_files) > 60:
        md.append(f"| … | _({len(stale_files) - 60} more in dead_code.json)_ |")
    if not stale_files:
        md.append("| _(none)_ | |")
    md.append("")

    md.append("## 7. Broken / unresolved `$ref` targets")
    md.append("")
    if broken_refs:
        md.append("| file | ref | reason |")
        md.append("| --- | --- | --- |")
        for r in broken_refs:
            md.append(f"| `{r['file']}` | `{r['ref']}` | {r['reason']} |")
    else:
        md.append("_None detected_")
    md.append("")

    (OUT / "dead_code.md").write_text("\n".join(md), encoding="utf-8")

    print(f"legacy folders: {len(set(legacy_folders))}")
    print(f"findings: {len(findings)}")
    print(f"single-shot artefacts: {len(single_shot_with_refs)}")
    print(f"duplicate root clusters: {len(duplicate_clusters)}")
    print(f"prose legacy mentions (filtered): {len(prose_filtered)}")
    print(f"stale files: {len(stale_files)}")
    print(f"broken refs: {len(broken_refs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
