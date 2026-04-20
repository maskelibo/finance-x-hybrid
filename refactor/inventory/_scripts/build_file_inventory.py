"""
File inventory builder for Finance-X Hybrid refactor Phase 1 - Task 1.1.

Walks the project tree (excluding git/node_modules/venv/dist artifacts),
records metadata for every file (path, size, lines, mtime, category),
and emits both a machine-readable JSON and a human-readable markdown report
into refactor/inventory/.

Read-only: does not modify any project file.
"""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[3]  # .../finance-x-hybrid
OUT_DIR = ROOT / "refactor" / "inventory"

# Directories and files we never descend into / report.
EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".next",
    "dist",
    "build",
    ".turbo",
    ".cache",
    ".idea",
    ".vscode",
    "coverage",
    ".uv",
}

# Text extensions that we line-count. Anything outside this we skip lines.
TEXT_EXT = {
    ".md", ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".json", ".jsonc", ".yaml", ".yml", ".toml", ".ini", ".cfg",
    ".html", ".css", ".scss", ".txt", ".sh", ".bash", ".zsh",
    ".sql", ".xml", ".vue", ".svelte", ".rs", ".go", ".java",
    ".env.example", ".gitignore", ".dockerignore",
}

# Binary-ish extensions we report size only.
BINARY_EXT = {
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".db", ".sqlite", ".sqlite3",
    ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt",
    ".mp3", ".mp4", ".mov", ".wav", ".ogg",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".ico", ".icns",
    ".bin", ".lock",
}

# Rules for categorization. Applied in order; first match wins.
# Each rule: (category, predicate) where predicate takes a POSIX-relative path string.
CATEGORY_RULES: list[tuple[str, "callable[[str], bool]"]] = [
    ("deprecated-or-legacy",
        lambda p: "_legacy" in p.lower() or "legacy" in p.lower() or "_OLD" in p or "_old" in p or p.endswith("_old.md") or "report_base.html" in p),
    ("output-artifact",
        lambda p: p.startswith("output/") or p.startswith("report/")),
    ("root-report-artifact",
        lambda p: ("/" not in p) and (p.endswith(".pdf") or p.endswith(".html") or re.search(r"^(AKBNK|ASELS|BIMAS|EREGL|KCHOL|SISE|TCELL|THYAO|TUPRS|ATA)_", p) is not None) and not p.endswith(".md")),
    ("root-report-md",
        lambda p: ("/" not in p) and re.search(r"^(AKBNK|ASELS|BIMAS|EREGL|KCHOL|SISE|TCELL|THYAO|TUPRS|CHAIRMAN|EXECUTION|FEEDBACK|AGENT_FEEDBACK)", p) is not None and p.endswith(".md")),
    ("root-standalone-json",
        lambda p: ("/" not in p) and p.endswith(".json") and p not in {"package.json", "package-lock.json", "agents_registry.json", "tsconfig.json"}),
    ("agent-config",
        lambda p: p.startswith("agents/") and (
            p.endswith("/system_prompt.md") or p.endswith("/knowledge.md") or p.endswith("/memory.md")
            or p.endswith("/agent_spec.json") or p.endswith("/examples.md") or p.endswith("/README.md")
        )),
    ("agent-schema",
        lambda p: p.startswith("agents/") and p.endswith("/output_schema.json")),
    ("agent-other",
        lambda p: p.startswith("agents/")),
    ("shared-schema",
        lambda p: p.startswith("schemas/")),
    ("prompt-shared",
        lambda p: p.startswith("prompts/")),
    ("python-service",
        lambda p: p.startswith("python-services/")),
    ("workflow",
        lambda p: p.startswith("workflows/")),
    ("skill",
        lambda p: p.startswith("skills/") or p.startswith(".agents/skills/")),
    ("eval",
        lambda p: p.startswith("evals/")),
    ("script",
        lambda p: p.startswith("scripts/")),
    ("backend-code",
        lambda p: p.startswith("backend/")),
    ("dashboard-code",
        lambda p: p.startswith("dashboard/")),
    ("refactor-meta",
        lambda p: p.startswith("refactor/")),
    ("claude-config",
        lambda p: p.startswith(".claude/")),
    ("documentation-root",
        lambda p: ("/" not in p) and p.endswith(".md")),
    ("build-config",
        lambda p: p in {"package.json", "package-lock.json", "pnpm-workspace.yaml", "tsconfig.json", "agents_registry.json"}),
    ("env-or-dot",
        lambda p: p.startswith(".") or p in {".env", ".env.example", ".gitignore", "LICENSE"}),
]


@dataclass
class FileRecord:
    path: str
    size_bytes: int
    size_kb: float
    lines: int | None
    mtime_iso: str
    ext: str
    category: str


def categorize(rel_path: str) -> str:
    for name, pred in CATEGORY_RULES:
        try:
            if pred(rel_path):
                return name
        except Exception:
            continue
    return "uncategorized"


def count_lines(path: Path) -> int | None:
    try:
        # Quick binary check on first chunk.
        with path.open("rb") as f:
            chunk = f.read(4096)
            if b"\x00" in chunk:
                return None
        # Streamed line count.
        with path.open("rb") as f:
            return sum(1 for _ in f)
    except Exception:
        return None


def walk_files() -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # Prune excluded dirs in-place.
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fn in filenames:
            yield Path(dirpath) / fn


def build_records() -> list[FileRecord]:
    records: list[FileRecord] = []
    for p in walk_files():
        try:
            st = p.stat()
        except OSError:
            continue
        rel = p.relative_to(ROOT).as_posix()
        ext = p.suffix.lower()
        lines: int | None = None
        if ext in TEXT_EXT or (p.name.startswith(".") and p.name not in {".env"}):
            lines = count_lines(p)
        records.append(FileRecord(
            path=rel,
            size_bytes=st.st_size,
            size_kb=round(st.st_size / 1024, 2),
            lines=lines,
            mtime_iso=datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            ext=ext,
            category=categorize(rel),
        ))
    records.sort(key=lambda r: r.path)
    return records


def bucket_summary(records: list[FileRecord]) -> list[dict]:
    by_cat: dict[str, dict] = {}
    for r in records:
        b = by_cat.setdefault(r.category, {"count": 0, "size_kb": 0.0, "lines": 0})
        b["count"] += 1
        b["size_kb"] += r.size_kb
        b["lines"] += r.lines or 0
    rows = [{"category": k, **v} for k, v in by_cat.items()]
    rows.sort(key=lambda x: (-x["size_kb"], x["category"]))
    for r in rows:
        r["size_kb"] = round(r["size_kb"], 2)
    return rows


def ext_summary(records: list[FileRecord]) -> list[dict]:
    by_ext: dict[str, dict] = {}
    for r in records:
        b = by_ext.setdefault(r.ext or "(none)", {"count": 0, "size_kb": 0.0})
        b["count"] += 1
        b["size_kb"] += r.size_kb
    rows = [{"ext": k, **v} for k, v in by_ext.items()]
    rows.sort(key=lambda x: -x["count"])
    for r in rows:
        r["size_kb"] = round(r["size_kb"], 2)
    return rows


def write_json(records: list[FileRecord], path: Path) -> None:
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(ROOT),
        "file_count": len(records),
        "total_size_kb": round(sum(r.size_kb for r in records), 2),
        "categories": bucket_summary(records),
        "extensions": ext_summary(records),
        "files": [asdict(r) for r in records],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def md_table(rows: list[dict], columns: list[str]) -> str:
    header = "| " + " | ".join(columns) + " |\n"
    sep = "| " + " | ".join(["---"] * len(columns)) + " |\n"
    body = ""
    for r in rows:
        body += "| " + " | ".join(str(r.get(c, "")) for c in columns) + " |\n"
    return header + sep + body


def write_md(records: list[FileRecord], path: Path) -> None:
    total_kb = round(sum(r.size_kb for r in records), 2)
    cats = bucket_summary(records)
    exts = ext_summary(records)[:20]
    largest = sorted(records, key=lambda r: -r.size_kb)[:30]
    wide_text = sorted(
        [r for r in records if r.lines is not None],
        key=lambda r: -(r.lines or 0),
    )[:30]

    lines: list[str] = []
    lines.append("# File Inventory — Finance-X Hybrid")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Root: `{ROOT.as_posix()}`")
    lines.append(f"- Files: **{len(records)}**")
    lines.append(f"- Total size: **{total_kb:,.2f} KB**")
    lines.append("")
    lines.append("Excluded during walk: `.git`, `node_modules`, `.venv`, `dist`, `build`, `__pycache__`, other common caches.")
    lines.append("")

    lines.append("## Category summary")
    lines.append("")
    lines.append(md_table(cats, ["category", "count", "size_kb", "lines"]))

    lines.append("## Top 20 extensions by file count")
    lines.append("")
    lines.append(md_table(exts, ["ext", "count", "size_kb"]))

    lines.append("## Top 30 largest files")
    lines.append("")
    lines.append(md_table(
        [{"path": r.path, "size_kb": r.size_kb, "category": r.category} for r in largest],
        ["path", "size_kb", "category"],
    ))

    lines.append("## Top 30 widest text files (by line count)")
    lines.append("")
    lines.append(md_table(
        [{"path": r.path, "lines": r.lines, "size_kb": r.size_kb, "category": r.category} for r in wide_text],
        ["path", "lines", "size_kb", "category"],
    ))

    # Full per-category listing (collapsed for human readers).
    lines.append("## Per-category file listing")
    lines.append("")
    by_cat: dict[str, list[FileRecord]] = {}
    for r in records:
        by_cat.setdefault(r.category, []).append(r)
    for cat in sorted(by_cat.keys()):
        rows = by_cat[cat]
        subtotal_kb = round(sum(r.size_kb for r in rows), 2)
        lines.append(f"<details><summary><b>{cat}</b> — {len(rows)} files, {subtotal_kb:,.2f} KB</summary>")
        lines.append("")
        table_rows = [
            {"path": r.path, "size_kb": r.size_kb, "lines": r.lines if r.lines is not None else "-", "mtime": r.mtime_iso}
            for r in sorted(rows, key=lambda x: -x.size_kb)
        ]
        lines.append(md_table(table_rows, ["path", "size_kb", "lines", "mtime"]))
        lines.append("</details>")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    records = build_records()
    write_json(records, OUT_DIR / "file_inventory.json")
    write_md(records, OUT_DIR / "file_inventory.md")
    print(f"records: {len(records)}")
    print(f"json: {OUT_DIR / 'file_inventory.json'}")
    print(f"md:   {OUT_DIR / 'file_inventory.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
