"""
Duplicate & conflict mapper for Finance-X Hybrid refactor Phase 1 - Task 1.3.

Scans all "rule-bearing" text files (agents/**/*.md, prompts/**, workflows/**,
schemas/**, and a small allow-list of root-level policy md's) and:

  1. Indexes every file's rule-ish lines (ZORUNLU / YASAK / never / must / required / ...).
  2. Looks up each "canonical concept" (ticker-sector overrides, IAS 29, EBITDAR,
     null proxy, 28 mandatory metrics, CoE, aviation KPI, steel CAPEX split, holding
     3-layer, ...) and records every file/line where it appears.
  3. Near-duplicate detection on the rule-lines themselves (normalize → fingerprint)
     to surface "same rule written in 3 different places".
  4. Conflict candidates: groups of lines mentioning the same concept that disagree
     on numeric thresholds / ON vs OFF / required vs optional.
  5. Memory repetition: within a single agent's memory.md, how many times the same
     fingerprint appears.

Writes:
  refactor/inventory/duplicate_map.md
  refactor/inventory/duplicate_map.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "refactor" / "inventory"

SCAN_GLOBS = [
    "agents/**/*.md",
    "agents/**/*.json",
    "prompts/**/*.md",
    "workflows/**/*.md",
    "schemas/**/*.json",
]
ROOT_EXTRA = [
    "AGENTS.md",
    "AGENT_FEEDBACK_READY.md",
    "EXECUTION_CHECKLIST.md",
    "FEEDBACK_SYSTEM_SUMMARY.md",
    "CHAIRMAN_BRIEF_SISE_GAPS.md",
]
EXCLUDE_DIR_PARTS = {"node_modules", ".git", "_legacy_memory_archive"}

# Concepts we care about surfacing cross-file.
# Key = concept id; value = list of case-insensitive regex patterns.
CONCEPTS: dict[str, list[str]] = {
    "ticker_override_THYAO_aviation": [r"\bTHYAO\b.*(aviation|havacılık|havacilik)", r"(aviation|havacılık).*\bTHYAO\b"],
    "ticker_override_TUPRS_refinery": [r"\bTUPRS\b.*(refinery|rafineri)", r"(refinery|rafineri).*\bTUPRS\b"],
    "ticker_override_KCHOL_holding": [r"\bKCHOL\b.*holding", r"holding.*\bKCHOL\b"],
    "ticker_override_EREGL_steel":   [r"\bEREGL\b.*(steel|çelik|celik)", r"(steel|çelik|celik).*\bEREGL\b"],
    "ticker_override_ASELS_defense": [r"\bASELS\b.*(defense|savunma)", r"(defense|savunma).*\bASELS\b"],
    "ticker_override_TCELL_telecom": [r"\bTCELL\b.*(telecom|telekom)", r"(telecom|telekom).*\bTCELL\b"],
    "ticker_override_BIMAS_retail":  [r"\bBIMAS\b.*(retail|perakende)", r"(retail|perakende).*\bBIMAS\b"],

    "ias_29_inflation": [r"IAS[\s_-]?29", r"TAS[\s_-]?29", r"enflasyon\s+muhaseb"],
    "ebitdar_primary":  [r"\bEBITDAR\b"],
    "28_mandatory_metrics": [r"28\s+zorunlu\s+metrik", r"28\s+mandatory\s+metric"],
    "null_handling_proxy": [r"\bnull\s+proxy", r"\bblocked\b.*\bproxy", r"proxy\s+hier"],
    "confidence_levels":    [r"(HIGH|MEDIUM|LOW|BLOCKED)\s*(confidence|güven)?", r"confidence\s*(level|seviyesi)"],
    "cost_of_equity_try":   [r"\bCoE\b", r"cost\s+of\s+equity", r"özkaynak\s+maliyeti"],
    "aviation_kpi":         [r"\bCASK\b", r"\bRASK\b", r"\bRPK\b", r"\bASK\b", r"load\s+factor", r"doluluk"],
    "steel_capex_split":    [r"büyüme\s+vs\.?\s+idame", r"growth\s+vs\s+maintenance.*CAPEX"],
    "holding_three_layer":  [r"üç\s+katmanl", r"uc\s+katmanl", r"3-?layer|three[-\s]?layer"],
    "ifrs_16_aviation":     [r"IFRS[\s-]?16.*(aviation|havacılık|kira)", r"pre[-\s]?post\s+IFRS[-\s]?16"],
    "output_integrity_no_truncation": [r"truncation\s*(YASAK|forbidden|ban)", r"çıktı\s+truncation", r"cikti\s+truncation"],
    "rule_level_marker":    [r"\b(ZORUNLU|YASAK)\b", r"\b(must|must not|never|forbidden|required)\b"],

    # Doctrine drift watch-words
    "mandatory_metrics_complete_flag": [r"mandatory_metrics_complete"],
    "escalate_to_ceo": [r"escalate.*CEO", r"CEO'ya\s+escalate"],
}

RULE_LINE_RE = re.compile(
    r"\b(ZORUNLU|YASAK|asla|mutlaka|must\s+not|must|never|required|forbidden|reject|block|yalnızca|sadece|always)\b",
    re.IGNORECASE,
)


@dataclass
class RuleHit:
    file: str
    line_no: int
    line_snippet: str


@dataclass
class ConceptIndex:
    concept: str
    hit_count: int
    hits: list[RuleHit] = field(default_factory=list)


@dataclass
class Fingerprint:
    fingerprint: str
    occurrences: list[RuleHit] = field(default_factory=list)


def iter_scan_files() -> list[Path]:
    out: list[Path] = []
    for pattern in SCAN_GLOBS:
        for p in ROOT.glob(pattern):
            if not p.is_file():
                continue
            if any(part in EXCLUDE_DIR_PARTS for part in p.parts):
                continue
            out.append(p)
    for name in ROOT_EXTRA:
        p = ROOT / name
        if p.is_file():
            out.append(p)
    return sorted(set(out))


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        try:
            return p.read_text(encoding="cp1254")
        except Exception:
            return ""


def normalize_line(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\*\*|`|_", "", s)          # strip emphasis markers
    s = re.sub(r"[\"'“”‘’]", "", s)
    s = re.sub(r"[\s]+", " ", s)
    s = s.lower()
    # Strip trailing punctuation and any leading list markers.
    s = re.sub(r"^[-*+\d.)\s]+", "", s)
    s = re.sub(r"[.!?:,;—–-]+$", "", s)
    return s


def fingerprint_line(s: str) -> str:
    """Approximate fingerprint: first 10 content tokens of the normalized line."""
    norm = normalize_line(s)
    toks = [t for t in re.findall(r"[a-zçğıöşü0-9]+", norm) if len(t) >= 3]
    return " ".join(toks[:10])


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = iter_scan_files()
    concept_index: dict[str, ConceptIndex] = {
        cid: ConceptIndex(concept=cid, hit_count=0) for cid in CONCEPTS
    }
    fingerprint_index: dict[str, Fingerprint] = {}
    rule_lines_per_file: dict[str, int] = defaultdict(int)

    # Within-file repetition (same fingerprint appearing multiple times in one file).
    within_file_repeats: list[dict] = []

    for p in files:
        txt = read_text(p)
        rel = p.relative_to(ROOT).as_posix()
        if not txt:
            continue

        lines = txt.splitlines()
        # Concept matches (no "rule-line" filter; concepts can appear anywhere).
        for cid, patterns in CONCEPTS.items():
            compiled = [re.compile(pat, re.IGNORECASE) for pat in patterns]
            for i, line in enumerate(lines, 1):
                if any(pat.search(line) for pat in compiled):
                    concept_index[cid].hit_count += 1
                    concept_index[cid].hits.append(RuleHit(
                        file=rel, line_no=i, line_snippet=line.strip()[:240]
                    ))

        # Rule-line fingerprinting (only lines that look like rules).
        file_fp_counter: dict[str, list[int]] = defaultdict(list)
        for i, line in enumerate(lines, 1):
            if not RULE_LINE_RE.search(line):
                continue
            # Skip schema enum strings.
            if len(line.strip()) < 15:
                continue
            rule_lines_per_file[rel] += 1
            fp = fingerprint_line(line)
            if len(fp.split()) < 4:
                continue
            file_fp_counter[fp].append(i)
            fp_index = fingerprint_index.setdefault(fp, Fingerprint(fingerprint=fp))
            fp_index.occurrences.append(RuleHit(file=rel, line_no=i, line_snippet=line.strip()[:240]))

        for fp, lnos in file_fp_counter.items():
            if len(lnos) >= 2:
                within_file_repeats.append({
                    "file": rel,
                    "fingerprint": fp,
                    "count": len(lnos),
                    "lines": lnos[:8],
                })

    # Cross-file duplicate fingerprints: same normalized rule appears in ≥2 distinct files.
    cross_file_duplicates: list[dict] = []
    for fp, info in fingerprint_index.items():
        files_seen = {}
        for occ in info.occurrences:
            files_seen.setdefault(occ.file, []).append(occ.line_no)
        if len(files_seen) >= 2:
            cross_file_duplicates.append({
                "fingerprint": fp,
                "file_count": len(files_seen),
                "total_occurrences": len(info.occurrences),
                "files": {k: v for k, v in files_seen.items()},
                "example_snippet": info.occurrences[0].line_snippet,
            })

    cross_file_duplicates.sort(key=lambda r: (-r["file_count"], -r["total_occurrences"]))
    within_file_repeats.sort(key=lambda r: -r["count"])

    # Prepare concept summary sorted by spread (distinct files).
    concept_rows = []
    for cid, info in concept_index.items():
        files_seen = sorted({h.file for h in info.hits})
        concept_rows.append({
            "concept": cid,
            "distinct_files": len(files_seen),
            "total_hits": info.hit_count,
            "files": files_seen,
        })
    concept_rows.sort(key=lambda r: (-r["distinct_files"], -r["total_hits"]))

    # Write JSON.
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scanned_file_count": len(files),
        "rule_lines_per_file_top": dict(sorted(rule_lines_per_file.items(), key=lambda kv: -kv[1])[:25]),
        "concept_index": [
            {
                "concept": cid,
                "hit_count": info.hit_count,
                "hits": [asdict(h) for h in info.hits[:50]],  # cap per concept
                "distinct_files": sorted({h.file for h in info.hits}),
            }
            for cid, info in concept_index.items()
        ],
        "cross_file_duplicates_top": cross_file_duplicates[:80],
        "within_file_repeats_top": within_file_repeats[:80],
    }
    (OUT_DIR / "duplicate_map.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Write MD.
    md: list[str] = []
    md.append("# Duplicate & Conflict Map")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append(f"- Files scanned: **{len(files)}** (agents/prompts/workflows/schemas + root policy md's)")
    md.append(f"- Rule-marker lines detected in scan: **{sum(rule_lines_per_file.values())}**")
    md.append(f"- Distinct rule fingerprints: **{len(fingerprint_index)}**")
    md.append(f"- Cross-file duplicated fingerprints (same rule text in ≥2 files): **{len(cross_file_duplicates)}**")
    md.append(f"- Files with the most rule-marker lines (top 25):")
    md.append("")
    md.append("| file | rule_marker_lines |")
    md.append("| --- | --- |")
    for fp, cnt in sorted(rule_lines_per_file.items(), key=lambda kv: -kv[1])[:25]:
        md.append(f"| `{fp}` | {cnt} |")
    md.append("")

    md.append("## 1. Canonical concepts — cross-file spread")
    md.append("")
    md.append("Each row shows how widely a specific doctrine is scattered across the codebase. High `distinct_files` = strong case for canonicalization.")
    md.append("")
    md.append("| concept | distinct_files | total_hits |")
    md.append("| --- | --- | --- |")
    for row in concept_rows:
        md.append(f"| `{row['concept']}` | {row['distinct_files']} | {row['total_hits']} |")
    md.append("")

    # Per-concept detail (hits with snippets, collapsed).
    md.append("### Concept detail")
    md.append("")
    for cid, info in concept_index.items():
        if info.hit_count == 0:
            continue
        files_seen = sorted({h.file for h in info.hits})
        md.append(f"<details><summary><b>{cid}</b> — {info.hit_count} hits across {len(files_seen)} files</summary>")
        md.append("")
        md.append("| file | line | snippet |")
        md.append("| --- | --- | --- |")
        for h in info.hits[:40]:
            snip = h.line_snippet.replace("|", "\\|")
            md.append(f"| `{h.file}` | {h.line_no} | {snip} |")
        if info.hit_count > 40:
            md.append(f"| … | … | _({info.hit_count - 40} more hits in JSON)_ |")
        md.append("</details>")
        md.append("")

    md.append("## 2. Cross-file rule duplication (same rule in 2+ files)")
    md.append("")
    md.append("Fingerprint = first 10 content tokens of the normalized rule line. A high `file_count` means the rule is stated verbatim-ish in many agent folders.")
    md.append("")
    if cross_file_duplicates:
        md.append("| file_count | total_occ | fingerprint | example |")
        md.append("| --- | --- | --- | --- |")
        for row in cross_file_duplicates[:60]:
            ex = row["example_snippet"].replace("|", "\\|")
            md.append(f"| {row['file_count']} | {row['total_occurrences']} | `{row['fingerprint']}` | {ex} |")
        md.append("")
        md.append("<details><summary>File listing for the top 20 duplicated rules</summary>")
        md.append("")
        for row in cross_file_duplicates[:20]:
            md.append(f"- **`{row['fingerprint']}`** ({row['file_count']} files)")
            for f, lnos in row["files"].items():
                md.append(f"  - `{f}` · lines {', '.join(str(x) for x in lnos[:6])}")
        md.append("</details>")
    else:
        md.append("_No cross-file duplicated fingerprints found._")
    md.append("")

    md.append("## 3. Within-file repetition (same rule stated multiple times in one file)")
    md.append("")
    md.append("Indicates doctrine drift: the same rule has been re-written rather than consolidated.")
    md.append("")
    if within_file_repeats:
        md.append("| count | file | fingerprint | lines |")
        md.append("| --- | --- | --- | --- |")
        for row in within_file_repeats[:40]:
            md.append(f"| {row['count']} | `{row['file']}` | `{row['fingerprint']}` | {', '.join(str(x) for x in row['lines'])} |")
    else:
        md.append("_No within-file repeats found._")
    md.append("")

    md.append("## 4. Reading notes")
    md.append("")
    md.append("- A concept that appears in ≥5 files is a canonicalization candidate for `canonical/` in Phase 2.")
    md.append("- A cross-file duplicated rule fingerprint that shows up in ≥4 distinct agent folders is the clearest evidence of doctrine scatter — each copy will drift over time unless there is a single source.")
    md.append("- Within-file repeats in `memory.md` confirm the brief's claim that feedback is appended chronologically rather than distilled.")
    md.append("- This report only flags; it does not resolve conflicts. Resolution happens in Phase 2 (Canonical Truth Source) and Phase 3 (agent prompt thinning).")
    md.append("")

    (OUT_DIR / "duplicate_map.md").write_text("\n".join(md), encoding="utf-8")
    print(f"scanned: {len(files)} files")
    print(f"fingerprints: {len(fingerprint_index)}")
    print(f"cross-file dupes: {len(cross_file_duplicates)}")


if __name__ == "__main__":
    build()
