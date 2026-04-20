"""
Memory content analysis for Finance-X Hybrid refactor Phase 1 - Task 1.7.

For every agents/<aid>/memory.md, classifies each section into one of:

  - schema_candidate    : rule can be enforced by tightening output_schema.json
                          (minLength, enum, required[], minItems, pattern).
  - canonical_candidate : doctrine that should live in `canonical/` (ticker
                          override, sector playbook, null-handling protocol,
                          IAS 29 protocol, 28 mandatory metrics, etc.).
  - code_candidate      : rule that is better solved in orchestrator code
                          (sector auto-resolve, proxy hierarchy, conditional_pass
                          gate, routing).
  - prompt_candidate    : behavioural rule that should live in system_prompt.md
                          (reasoning directives, tone, output format).
  - genuine_memory      : fresh, narrow, last-30-days learning that legitimately
                          belongs in memory.md.
  - log_noise           : dated feedback entry that repeats an already-saved
                          rule OR a transient debug note.

Also computes within-file rule-duplication fingerprints (same rule written
twice in the same memory.md) and suggests a target memory.md size after
migration.

Emits:
  refactor/inventory/memory_analysis.md
  refactor/inventory/memory_analysis.json
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AGENTS_DIR = ROOT / "agents"
OUT = ROOT / "refactor" / "inventory"

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
DATE_RE = re.compile(r"(20\d{2}[-_]\d{2}[-_]\d{2})")
RULE_MARKER_RE = re.compile(r"\b(ZORUNLU|YASAK|must|never|required|forbidden|REJECT|BLOCK|asla|mutlaka)\b", re.IGNORECASE)

# Keyword catalogs for classification. Order matters: first match wins.
CLASSIFIERS: list[tuple[str, list[str]]] = [
    ("canonical_candidate", [
        "28 zorunlu", "28 mandatory", "IAS 29", "IAS29", "TAS 29",
        "EBITDAR", "null proxy", "proxy hier",
        "THYAO", "TUPRS", "KCHOL", "EREGL", "ASELS", "TCELL", "BIMAS", "SAHOL",
        "aviation", "havacıl", "havacil",
        "steel", "çelik", "celik",
        "banking", "banka", "NIM", "CAR",
        "telecom", "telekom", "ARPU", "churn",
        "holding",
        "retail", "perakende",
        "defense", "savunma",
        "sector override", "sektör override",
        "CoE", "cost of equity", "özkaynak maliyet",
        "doctrine", "canonical",
    ]),
    ("code_candidate", [
        "sector auto", "auto-detect", "pipeline durdur", "CONDITIONAL PASS", "conditional_pass",
        "downstream block", "CEO gate", "QA gate", "routing", "orchestrator",
        "prompt caching", "cache",
        "extended thinking",
    ]),
    ("schema_candidate", [
        "mandatory_metrics_complete", "confidence_overall", "confidence level",
        "evidence_refs", "findings[]", "addressed_findings",
        "truncation YASAK", "çıktı truncation", "output truncation",
        "minLength", "minItems", "enum",
        "schema", "required", "optional",
        "engine_snapshot",
    ]),
    ("prompt_candidate", [
        "yorum paragraf", "interpretation", "counterargument", "karşı argüman",
        "TRY etkisi", "FX etki", "sensitivity",
        "reasoning", "3-5 cümle", "her tablo sonras",
        "hipotez", "senaryo",
        "tone", "format",
    ]),
]

FRESH_WINDOW_DAYS = 30


def classify_section(title: str, body: str) -> str:
    text = (title + "\n" + body).lower()
    # Try classifier groups in order.
    for label, kws in CLASSIFIERS:
        for kw in kws:
            if kw.lower() in text:
                return label
    # Dated feedback that doesn't match a canonical/schema/code/prompt keyword
    # is treated as log noise unless its date is fresh.
    dates = DATE_RE.findall(title + " " + body)
    if dates:
        try:
            latest = max(datetime.strptime(d.replace("_", "-"), "%Y-%m-%d").replace(tzinfo=timezone.utc) for d in dates)
            if latest >= datetime.now(timezone.utc) - timedelta(days=FRESH_WINDOW_DAYS):
                return "genuine_memory"
        except Exception:
            pass
        return "log_noise"
    # Short sections with rule markers and no date are likely genuine rules.
    if RULE_MARKER_RE.search(body):
        return "genuine_memory"
    return "log_noise"


@dataclass
class Section:
    agent: str
    level: int
    title: str
    body_lines: int
    body_chars: int
    dates: list[str]
    classification: str
    first_line_snippet: str


def split_sections(text: str) -> list[tuple[int, str, str]]:
    """Return list of (level, title, body) sections keyed on H1/H2/H3 headings."""
    lines = text.splitlines(keepends=True)
    sections: list[tuple[int, str, str]] = []
    cur_level = 0
    cur_title = "(preamble)"
    cur_body: list[str] = []
    for line in lines:
        m = HEADING_RE.match(line)
        if m:
            if cur_body or cur_title != "(preamble)":
                sections.append((cur_level, cur_title, "".join(cur_body)))
            cur_level = len(m.group(1))
            cur_title = m.group(2).strip()
            cur_body = []
        else:
            cur_body.append(line)
    if cur_body or cur_title != "(preamble)":
        sections.append((cur_level, cur_title, "".join(cur_body)))
    return sections


def fingerprint_line(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[\"'“”‘’*_`]", "", s)
    s = re.sub(r"[^a-zçğıöşü0-9\s]+", " ", s)
    toks = [t for t in s.split() if len(t) >= 3]
    return " ".join(toks[:10])


def analyze_agent(name: str, folder: Path) -> dict:
    mem_path = folder / "memory.md"
    if not mem_path.is_file():
        return {"agent": name, "memory_present": False}

    text = mem_path.read_text(encoding="utf-8", errors="replace")
    sections_raw = split_sections(text)
    sections: list[Section] = []
    for level, title, body in sections_raw:
        body_lines = body.count("\n")
        body_chars = len(body)
        dates = sorted(set(DATE_RE.findall(body)))
        classification = classify_section(title, body)
        first_non_blank = next((ln for ln in body.splitlines() if ln.strip()), "")
        sections.append(Section(
            agent=name,
            level=level,
            title=title,
            body_lines=body_lines,
            body_chars=body_chars,
            dates=dates,
            classification=classification,
            first_line_snippet=first_non_blank.strip()[:200],
        ))

    # Within-file fingerprint repeats on rule-marker lines.
    fp_counter: dict[str, list[int]] = {}
    for i, line in enumerate(text.splitlines(), 1):
        if not RULE_MARKER_RE.search(line):
            continue
        if len(line.strip()) < 15:
            continue
        fp = fingerprint_line(line)
        if len(fp.split()) < 4:
            continue
        fp_counter.setdefault(fp, []).append(i)
    repeats = [{"fingerprint": k, "count": len(v), "lines": v} for k, v in fp_counter.items() if len(v) >= 2]
    repeats.sort(key=lambda r: -r["count"])

    # Aggregate counts by classification.
    by_class: dict[str, dict] = {}
    for s in sections:
        b = by_class.setdefault(s.classification, {"sections": 0, "chars": 0})
        b["sections"] += 1
        b["chars"] += s.body_chars

    # Target memory after migration: retain only genuine_memory (+ small preamble).
    retained_chars = by_class.get("genuine_memory", {}).get("chars", 0)
    return {
        "agent": name,
        "memory_present": True,
        "memory_size_kb": round(len(text.encode("utf-8")) / 1024, 2),
        "memory_lines": text.count("\n") + 1,
        "section_count": len(sections),
        "by_class": by_class,
        "retained_chars_if_purged": retained_chars,
        "retained_pct": round(retained_chars / max(1, len(text.encode("utf-8"))) * 100, 1),
        "within_file_duplicates": repeats[:15],
        "sections": [asdict(s) for s in sections],
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    for folder in sorted(AGENTS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        if folder.name in {"_legacy_memory_archive", "_shared_knowledge_modules"}:
            continue
        results.append(analyze_agent(folder.name, folder))

    summary_rows = []
    class_totals = {"schema_candidate": 0, "canonical_candidate": 0, "code_candidate": 0,
                    "prompt_candidate": 0, "genuine_memory": 0, "log_noise": 0}
    for r in results:
        if not r.get("memory_present"):
            continue
        by_class = r["by_class"]
        for k in class_totals:
            class_totals[k] += by_class.get(k, {}).get("chars", 0)
        summary_rows.append({
            "agent": r["agent"],
            "size_kb": r["memory_size_kb"],
            "sections": r["section_count"],
            "within_dupes": sum(d["count"] for d in r["within_file_duplicates"]),
            "schema": by_class.get("schema_candidate", {}).get("chars", 0),
            "canonical": by_class.get("canonical_candidate", {}).get("chars", 0),
            "code": by_class.get("code_candidate", {}).get("chars", 0),
            "prompt": by_class.get("prompt_candidate", {}).get("chars", 0),
            "genuine": by_class.get("genuine_memory", {}).get("chars", 0),
            "log_noise": by_class.get("log_noise", {}).get("chars", 0),
            "retained_pct": r["retained_pct"],
        })
    summary_rows.sort(key=lambda r: -r["size_kb"])

    total_chars = sum(v for v in class_totals.values())
    totals_pct = {k: round(v / max(1, total_chars) * 100, 1) for k, v in class_totals.items()}

    md: list[str] = []
    md.append("# Memory Content Analysis")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append(f"- Agents with `memory.md`: **{sum(1 for r in results if r.get('memory_present'))}**")
    md.append(f"- Fresh-memory window: last **{FRESH_WINDOW_DAYS} days** (anything older with a date header is treated as log_noise unless it carries a canonical/schema/code/prompt keyword)")
    md.append("")

    md.append("## Portfolio-wide distribution of memory content")
    md.append("")
    md.append("| classification | chars | % of all memory text |")
    md.append("| --- | --- | --- |")
    for k in ("schema_candidate", "canonical_candidate", "code_candidate", "prompt_candidate", "genuine_memory", "log_noise"):
        md.append(f"| `{k}` | {class_totals[k]:,} | {totals_pct[k]}% |")
    md.append("")

    md.append("## Per-agent breakdown (chars per classification)")
    md.append("")
    md.append("| agent | size_kb | sections | within_dupes | schema | canonical | code | prompt | genuine | log_noise | retained_% |")
    md.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for r in summary_rows:
        md.append(
            f"| `{r['agent']}` | {r['size_kb']} | {r['sections']} | {r['within_dupes']} | "
            f"{r['schema']} | {r['canonical']} | {r['code']} | {r['prompt']} | "
            f"{r['genuine']} | {r['log_noise']} | {r['retained_pct']}% |"
        )
    md.append("")
    md.append("`retained_%` = share of file that would survive a strict purge keeping only fresh `genuine_memory`. Everything else is eligible to move into canonical/ schema/ code/ system_prompt.")
    md.append("")

    md.append("## Within-file duplicate rules (memory appends same rule multiple times)")
    md.append("")
    md.append("| agent | fingerprint | count | lines |")
    md.append("| --- | --- | --- | --- |")
    for r in results:
        if not r.get("memory_present"):
            continue
        for d in r["within_file_duplicates"]:
            md.append(f"| `{r['agent']}` | `{d['fingerprint']}` | {d['count']} | {', '.join(str(x) for x in d['lines'][:8])} |")
    md.append("")

    md.append("## Per-agent section classification")
    md.append("")
    for r in results:
        if not r.get("memory_present"):
            continue
        md.append(f"<details><summary><b>{r['agent']}</b> · {r['memory_size_kb']} KB · {r['section_count']} sections</summary>")
        md.append("")
        md.append("| level | title | chars | dates | class |")
        md.append("| --- | --- | --- | --- | --- |")
        for s in r["sections"]:
            title = s["title"].replace("|", "\\|")[:90]
            md.append(f"| H{s['level']} | {title} | {s['body_chars']} | {', '.join(s['dates'][:2])} | `{s['classification']}` |")
        md.append("</details>")
        md.append("")

    (OUT / "memory_analysis.md").write_text("\n".join(md), encoding="utf-8")
    (OUT / "memory_analysis.json").write_text(
        json.dumps({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "totals_chars": class_totals,
            "totals_pct": totals_pct,
            "per_agent": results,
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"agents with memory: {sum(1 for r in results if r.get('memory_present'))}")
    print("class char totals:", class_totals)
    print("class pct:", totals_pct)
    return 0


if __name__ == "__main__":
    sys.exit(main())
