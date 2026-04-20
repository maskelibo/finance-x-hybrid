"""
Prompt / memory lint — Finance-X Hybrid refactor tool.

Mechanical-only checks. No editorial judgement. No CI hook. Runs on demand
and prints a report; exits non-zero if any hard rule fails.

Checks:

  size_limits
    - system_prompt.md  <=  20 KB  (soft cap)
    - system_prompt.md  <=  30 KB  (hard cap — fail)
    - knowledge.md      <=  15 KB  (soft cap)
    - knowledge.md      <=  25 KB  (hard cap — fail)
    - memory.md         <=   6 KB  (soft cap — matches agent-runner MAX_MEMORY_BYTES)
    - memory.md         <=  10 KB  (hard cap — fail)

  duplicate_fingerprints
    - rule-bearing lines (ZORUNLU/YASAK/must/never/required/forbidden/reject/block)
      whose normalized fingerprint appears ≥2 times in the same file.

  stale_dates
    - memory.md sections whose last dated heading is older than 60 days are
      flagged (candidate for archival).

  canonical_references
    - detects bare prose rules that have a canonical id equivalent
      (e.g. "THYAO = aviation" should say "see TM-THYAO" or
      "see canonical/tickers/sector_mapping.yaml").

Usage:
  python refactor/tools/prompt_memory_lint.py            # scan all agents
  python refactor/tools/prompt_memory_lint.py --agent financial_analysis
  python refactor/tools/prompt_memory_lint.py --fail-on-soft

Exit codes:
  0 — no hard-cap failures.
  2 — at least one hard-cap failure.
  3 — at least one soft-cap failure AND --fail-on-soft was set.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "agents"

EXCLUDE_AGENTS = {"_legacy_memory_archive", "_shared_knowledge_modules"}

# KB limits.
SIZE_LIMITS = {
    "system_prompt.md": {"soft_kb": 20, "hard_kb": 30},
    "knowledge.md":     {"soft_kb": 15, "hard_kb": 25},
    "memory.md":        {"soft_kb": 6,  "hard_kb": 10},
}

RULE_MARKER_RE = re.compile(
    r"\b(ZORUNLU|YASAK|asla|mutlaka|must\s+not|must|never|required|forbidden|reject|block|yalnızca|sadece|always)\b",
    re.IGNORECASE,
)
DATE_RE = re.compile(r"(20\d{2}[-_]\d{2}[-_]\d{2})")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)

STALE_WINDOW_DAYS = 60

# Canonical-candidate prose markers we should flag if seen in agent prompts/memories.
# Phase 3 will rewrite these references to canonical ids.
CANONICAL_CANDIDATE_PROSE = [
    # ticker → sector overrides
    (r"\bTHYAO\b.*(aviation|havacıl|havacil)", "TM-THYAO (canonical/tickers/sector_mapping.yaml)"),
    (r"\bTUPRS\b.*(refinery|rafineri)", "TM-TUPRS (canonical/tickers/sector_mapping.yaml)"),
    (r"\bKCHOL\b.*holding", "TM-KCHOL (canonical/tickers/sector_mapping.yaml)"),
    (r"\bEREGL\b.*(steel|çelik|celik)", "TM-EREGL (canonical/tickers/sector_mapping.yaml)"),
    (r"\bASELS\b.*(defense|savunma)", "TM-ASELS (canonical/tickers/sector_mapping.yaml)"),
    (r"\bTCELL\b.*(telecom|telekom)", "TM-TCELL (canonical/tickers/sector_mapping.yaml)"),
    (r"\bBIMAS\b.*(retail|perakende)", "TM-BIMAS (canonical/tickers/sector_mapping.yaml)"),
    # doctrine
    (r"IAS\s*29", "IAS29-001..006 (canonical/rules/ias29_protocol.md)"),
    (r"\bEBITDAR\b", "SR-aviation-001 (canonical/sectors/aviation.yaml)"),
    (r"28\s+zorunlu\s+metrik|28\s+mandatory\s+metric", "MM-01..28 (canonical/rules/mandatory_metrics.yaml)"),
    (r"b[üu]y[üu]me\s+vs\.?\s+idame|growth\s+vs\s+maintenance\s+CAPEX", "SR-steel-001 (canonical/sectors/steel.yaml)"),
    (r"[üu][çc]\s+katmanl[ıi]\s+an|three[-\s]?layer\s+analysis", "SR-holding-001 (canonical/sectors/holding.yaml)"),
    (r"Chart\.js", "OI-007 (canonical/rules/output_integrity.md)"),
    (r"truncation\s+(YASAK|forbidden)", "OI-001 (canonical/rules/output_integrity.md)"),
    (r"confidence\s*(level|seviyesi)\s*[:=]", "CT-001..006 (canonical/rules/confidence_taxonomy.md)"),
    (r"null\s+proxy|proxy\s+hier", "NH-003 (canonical/rules/null_handling_protocol.md)"),
]


@dataclass
class Finding:
    agent: str
    file: str
    severity: str     # "hard" | "soft" | "info"
    category: str
    message: str


def normalize_for_fingerprint(line: str) -> str:
    s = line.strip().lower()
    s = re.sub(r"[\"'“”‘’*_`]", "", s)
    s = re.sub(r"[^a-zçğıöşü0-9\s]+", " ", s)
    toks = [t for t in s.split() if len(t) >= 3]
    return " ".join(toks[:10])


def scan_file(agent: str, path: Path, findings: list[Finding]) -> None:
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8", errors="replace")
    size_kb = round(len(text.encode("utf-8")) / 1024, 2)
    cfg = SIZE_LIMITS.get(path.name)

    # 1) Size limits
    if cfg:
        if size_kb > cfg["hard_kb"]:
            findings.append(Finding(
                agent=agent, file=path.name, severity="hard",
                category="size_hard",
                message=f"{size_kb} KB exceeds hard cap {cfg['hard_kb']} KB",
            ))
        elif size_kb > cfg["soft_kb"]:
            findings.append(Finding(
                agent=agent, file=path.name, severity="soft",
                category="size_soft",
                message=f"{size_kb} KB exceeds soft cap {cfg['soft_kb']} KB",
            ))

    # 2) Duplicate rule-line fingerprints within a single file.
    fp_counts: Counter[str] = Counter()
    fp_lines: dict[str, list[int]] = {}
    for i, line in enumerate(text.splitlines(), 1):
        if not RULE_MARKER_RE.search(line):
            continue
        if len(line.strip()) < 15:
            continue
        fp = normalize_for_fingerprint(line)
        if len(fp.split()) < 4:
            continue
        fp_counts[fp] += 1
        fp_lines.setdefault(fp, []).append(i)
    for fp, count in fp_counts.items():
        if count >= 2:
            findings.append(Finding(
                agent=agent, file=path.name, severity="soft",
                category="duplicate_rule",
                message=f"duplicated rule-line x{count} @ lines {fp_lines[fp][:6]} — fingerprint: '{fp[:80]}'",
            ))

    # 3) Stale dates (memory.md only).
    if path.name == "memory.md":
        dates: list[datetime] = []
        for d in DATE_RE.findall(text):
            try:
                dates.append(datetime.strptime(d.replace("_", "-"), "%Y-%m-%d").replace(tzinfo=timezone.utc))
            except Exception:
                continue
        if dates:
            latest = max(dates)
            stale_cutoff = datetime.now(timezone.utc) - timedelta(days=STALE_WINDOW_DAYS)
            if latest < stale_cutoff:
                findings.append(Finding(
                    agent=agent, file=path.name, severity="soft",
                    category="stale_memory",
                    message=f"latest dated feedback is {latest.date()} (older than {STALE_WINDOW_DAYS} days) — archival candidate",
                ))

    # 4) Canonical candidate prose.
    for pattern, canonical_id in CANONICAL_CANDIDATE_PROSE:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            line_no = text[: m.start()].count("\n") + 1
            findings.append(Finding(
                agent=agent, file=path.name, severity="info",
                category="canonical_candidate",
                message=f"prose rule @ line {line_no} has canonical equivalent — reference {canonical_id} instead",
            ))


def list_agents() -> list[str]:
    out: list[str] = []
    for p in sorted(AGENTS_DIR.iterdir()):
        if p.is_dir() and p.name not in EXCLUDE_AGENTS:
            out.append(p.name)
    return out


def scan(agent_names: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    for agent in agent_names:
        folder = AGENTS_DIR / agent
        for fname in ("system_prompt.md", "knowledge.md", "memory.md"):
            scan_file(agent, folder / fname, findings)
    return findings


def report(findings: list[Finding]) -> None:
    if not findings:
        print("CLEAN: no findings.")
        return

    # Summary counts.
    by_sev = Counter(f.severity for f in findings)
    by_cat = Counter(f.category for f in findings)
    by_agent = Counter(f.agent for f in findings)
    print(f"findings: {len(findings)}")
    print(f"  by severity: {dict(by_sev)}")
    print(f"  by category: {dict(by_cat)}")
    print()

    # Detail by agent.
    current_agent = None
    for f in sorted(findings, key=lambda x: (x.agent, x.file, x.category)):
        if f.agent != current_agent:
            print(f"\n-- {f.agent} --")
            current_agent = f.agent
        print(f"  [{f.severity:4}] {f.file:<17} {f.category:<22} {f.message}")

    print()
    print(f"top 10 flagged agents: {by_agent.most_common(10)}")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--agent", help="Limit scan to one agent id.")
    ap.add_argument("--fail-on-soft", action="store_true", help="Exit non-zero if any soft-cap violation found.")
    args = ap.parse_args(argv)

    agents = [args.agent] if args.agent else list_agents()
    findings = scan(agents)
    report(findings)

    hard_count = sum(1 for f in findings if f.severity == "hard")
    soft_count = sum(1 for f in findings if f.severity == "soft")
    if hard_count:
        return 2
    if args.fail_on_soft and soft_count:
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
