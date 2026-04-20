"""
Agent inventory builder for Finance-X Hybrid refactor Phase 1 - Task 1.2.

For every folder under agents/ (excluding infra-like _shared_knowledge_modules
and _legacy_memory_archive), collects:

  * File listing with size + line count
  * system_prompt.md metrics (headings, bullets, code blocks)
  * knowledge.md metrics (headings, bullets, doctrine density heuristic)
  * memory.md metrics (feedback dates, repeated-rule fingerprint,
    canonical/schema migration candidates)
  * output_schema.json metrics (required/optional counts, max $ref depth,
    number of enum/const fields, presence of minLength/minItems)
  * agent_spec.json contract summary (inputs, outputs, tools, handoff rules)
  * Upstream / downstream derived from agents_registry.json

Writes:
  refactor/inventory/agents/<agent_name>.md   (human-readable per agent)
  refactor/inventory/agents/_index.md         (summary + red flags table)
  refactor/inventory/agent_inventory.json     (full machine-readable dump)

Read-only: does not modify any project file outside refactor/inventory/.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
AGENTS_DIR = ROOT / "agents"
OUT_DIR = ROOT / "refactor" / "inventory"
PER_AGENT_DIR = OUT_DIR / "agents"

# Folders under agents/ that are not "agents" themselves.
NON_AGENT_FOLDERS = {"_legacy_memory_archive", "_shared_knowledge_modules"}

# Heuristics for content-type classification on knowledge.md / system_prompt.md.
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
BULLET_RE = re.compile(r"^\s*[-*+]\s+", re.MULTILINE)
CODE_BLOCK_RE = re.compile(r"```")
# Feedback date heuristics inside memory.md (Turkish + ISO).
FEEDBACK_DATE_RE = re.compile(r"(20\d{2}[-_]\d{2}[-_]\d{2})")
# Heuristic "rule-bearing" lines (direktif cümle işaretleri).
RULE_MARKER_RE = re.compile(
    r"\b(ZORUNLU|YASAK|asla|mutlaka|must|do not|never|required|forbidden|REJECT|BLOCK)\b",
    re.IGNORECASE,
)

# Tokens that often indicate canonicalizable rules (ticker → sector, IAS 29, null proxy, etc.).
CANONICALIZABLE_HINTS = [
    "THYAO", "TUPRS", "KCHOL", "ASELS", "EREGL", "TCELL", "SAHOL", "BIMAS",
    "IAS 29", "IAS29", "EBITDAR", "aviation", "havacılık", "çelik", "steel",
    "banking", "banka", "telecom", "telekom", "holding", "retail", "defense", "savunma",
    "null proxy", "proxy", "sektör override", "ticker override",
]


def safe_read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        try:
            return path.read_text(encoding="cp1254")
        except Exception:
            return None


def count_lines(text: str) -> int:
    return text.count("\n") + (0 if text.endswith("\n") or not text else 1)


@dataclass
class FileRecord:
    name: str
    size_kb: float
    lines: int | None
    mtime_iso: str


@dataclass
class MarkdownMetrics:
    size_kb: float
    lines: int
    headings_h1: int
    headings_h2: int
    headings_h3_plus: int
    bullets: int
    code_blocks: int
    rule_marker_lines: int


@dataclass
class MemoryMetrics(MarkdownMetrics):
    feedback_dates: list[str] = field(default_factory=list)
    distinct_feedback_dates: int = 0
    repeated_token_counts: dict[str, int] = field(default_factory=dict)
    canonicalizable_hits: dict[str, int] = field(default_factory=dict)
    migration_candidates_guess: int = 0  # headings mentioning canonicalizable hints


@dataclass
class SchemaMetrics:
    size_kb: float
    required_top_level: int
    total_required_fields_recursive: int
    total_properties_recursive: int
    enum_or_const_count: int
    minLength_count: int
    minItems_count: int
    ref_count: int
    max_depth: int


@dataclass
class SpecMetrics:
    size_kb: float
    inputs: list[str]
    outputs: list[str]
    tools: list[str]
    handoff_count: int
    runtime_modes: list[str]
    failure_modes: int
    kpis: int


@dataclass
class AgentRecord:
    name: str
    registered: bool
    registry_group: str | None
    reports_to: str | None
    supervises: list[str] = field(default_factory=list)
    upstream: list[str] = field(default_factory=list)
    downstream: list[str] = field(default_factory=list)
    files: list[FileRecord] = field(default_factory=list)
    total_size_kb: float = 0.0
    system_prompt: MarkdownMetrics | None = None
    knowledge: MarkdownMetrics | None = None
    memory: MemoryMetrics | None = None
    memory_backup_size_kb: float | None = None
    memory_archive_size_kb: float | None = None
    output_schema: SchemaMetrics | None = None
    agent_spec: SpecMetrics | None = None
    extra_doc_files: list[str] = field(default_factory=list)  # case_lessons, permanent_rules, etc.
    red_flags: list[str] = field(default_factory=list)


def md_metrics(text: str) -> MarkdownMetrics:
    headings = HEADING_RE.findall(text)
    h1 = sum(1 for h, _ in headings if len(h) == 1)
    h2 = sum(1 for h, _ in headings if len(h) == 2)
    h3_plus = sum(1 for h, _ in headings if len(h) >= 3)
    bullets = len(BULLET_RE.findall(text))
    code_blocks = len(CODE_BLOCK_RE.findall(text)) // 2
    rule_marker_lines = sum(1 for ln in text.splitlines() if RULE_MARKER_RE.search(ln))
    size_kb = round(len(text.encode("utf-8")) / 1024, 2)
    return MarkdownMetrics(
        size_kb=size_kb,
        lines=count_lines(text),
        headings_h1=h1,
        headings_h2=h2,
        headings_h3_plus=h3_plus,
        bullets=bullets,
        code_blocks=code_blocks,
        rule_marker_lines=rule_marker_lines,
    )


def memory_metrics(text: str) -> MemoryMetrics:
    base = md_metrics(text)
    feedback_dates = FEEDBACK_DATE_RE.findall(text)
    tokens = [t.lower() for t in re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]{4,}", text)]
    token_counts = Counter(tokens)
    # Only report tokens with freq >= 5 AND length >= 6 (heuristic for repeated concepts).
    repeated = {t: c for t, c in token_counts.items() if c >= 5 and len(t) >= 6}
    # Trim noise (common Turkish/English stop-ish tokens).
    stop = {
        "olarak", "olan", "olmasi", "olması", "icin", "için", "gibi", "daha", "veya",
        "value", "metric", "metrik", "rapor", "report", "analiz", "analysis",
        "financial", "agent", "output", "ciddi", "zorunlu", "kural", "kurallar",
        "verisi", "veriler", "ancak", "bolum", "bölüm", "alti", "altı", "uzeri", "üzeri",
    }
    repeated_filtered = {t: c for t, c in repeated.items() if t not in stop}
    # Canonicalizable token hits (case-insensitive substring).
    lower = text.lower()
    hits = {h: lower.count(h.lower()) for h in CANONICALIZABLE_HINTS if h.lower() in lower}
    # Migration candidate guess: count of headings whose title includes a canonicalizable hint.
    hint_lower = [h.lower() for h in CANONICALIZABLE_HINTS]
    migrations = sum(
        1
        for _, title in HEADING_RE.findall(text)
        if any(h in title.lower() for h in hint_lower)
    )
    return MemoryMetrics(
        size_kb=base.size_kb,
        lines=base.lines,
        headings_h1=base.headings_h1,
        headings_h2=base.headings_h2,
        headings_h3_plus=base.headings_h3_plus,
        bullets=base.bullets,
        code_blocks=base.code_blocks,
        rule_marker_lines=base.rule_marker_lines,
        feedback_dates=sorted(set(feedback_dates)),
        distinct_feedback_dates=len(set(feedback_dates)),
        repeated_token_counts=dict(sorted(repeated_filtered.items(), key=lambda kv: -kv[1])[:20]),
        canonicalizable_hits=hits,
        migration_candidates_guess=migrations,
    )


def _schema_walk(
    node: Any,
    depth: int,
    required_in_path: bool,
    counters: dict[str, int],
    max_depth_ref: list[int],
) -> None:
    max_depth_ref[0] = max(max_depth_ref[0], depth)
    if isinstance(node, dict):
        if "$ref" in node:
            counters["ref_count"] += 1
        if "enum" in node or "const" in node:
            counters["enum_or_const_count"] += 1
        if "minLength" in node:
            counters["minLength_count"] += 1
        if "minItems" in node:
            counters["minItems_count"] += 1
        req_here = node.get("required", [])
        if isinstance(req_here, list):
            counters["total_required_fields_recursive"] += len(req_here)
        props = node.get("properties")
        if isinstance(props, dict):
            counters["total_properties_recursive"] += len(props)
            for pname, pnode in props.items():
                _schema_walk(pnode, depth + 1, pname in req_here, counters, max_depth_ref)
        # Walk nested definitions / items / oneOf / anyOf / allOf.
        for key in ("definitions", "$defs"):
            if isinstance(node.get(key), dict):
                for v in node[key].values():
                    _schema_walk(v, depth + 1, False, counters, max_depth_ref)
        items = node.get("items")
        if isinstance(items, dict):
            _schema_walk(items, depth + 1, False, counters, max_depth_ref)
        for comb in ("oneOf", "anyOf", "allOf"):
            if isinstance(node.get(comb), list):
                for v in node[comb]:
                    _schema_walk(v, depth + 1, False, counters, max_depth_ref)


def schema_metrics(path: Path) -> SchemaMetrics | None:
    text = safe_read(path)
    if text is None:
        return None
    try:
        doc = json.loads(text)
    except Exception:
        return SchemaMetrics(
            size_kb=round(len(text.encode("utf-8")) / 1024, 2),
            required_top_level=0,
            total_required_fields_recursive=0,
            total_properties_recursive=0,
            enum_or_const_count=0,
            minLength_count=0,
            minItems_count=0,
            ref_count=0,
            max_depth=0,
        )
    counters = {
        "total_required_fields_recursive": 0,
        "total_properties_recursive": 0,
        "enum_or_const_count": 0,
        "minLength_count": 0,
        "minItems_count": 0,
        "ref_count": 0,
    }
    max_depth_ref = [0]
    _schema_walk(doc, 0, False, counters, max_depth_ref)
    top_required = doc.get("required", []) if isinstance(doc, dict) else []
    return SchemaMetrics(
        size_kb=round(len(text.encode("utf-8")) / 1024, 2),
        required_top_level=len(top_required) if isinstance(top_required, list) else 0,
        total_required_fields_recursive=counters["total_required_fields_recursive"],
        total_properties_recursive=counters["total_properties_recursive"],
        enum_or_const_count=counters["enum_or_const_count"],
        minLength_count=counters["minLength_count"],
        minItems_count=counters["minItems_count"],
        ref_count=counters["ref_count"],
        max_depth=max_depth_ref[0],
    )


def spec_metrics(path: Path) -> SpecMetrics | None:
    text = safe_read(path)
    if text is None:
        return None
    try:
        doc = json.loads(text)
    except Exception:
        return None
    inputs = [i.get("name", "?") for i in doc.get("inputs", []) if isinstance(i, dict)]
    outputs = [o.get("name", "?") for o in doc.get("outputs", []) if isinstance(o, dict)]
    tools = list(doc.get("tools", []))
    handoff = doc.get("handoff_rules", [])
    modes = list((doc.get("runtime_modes") or {}).keys())
    failure_modes = doc.get("failure_modes", [])
    kpis = doc.get("kpis", [])
    return SpecMetrics(
        size_kb=round(len(text.encode("utf-8")) / 1024, 2),
        inputs=inputs,
        outputs=outputs,
        tools=tools,
        handoff_count=len(handoff) if isinstance(handoff, list) else 0,
        runtime_modes=modes,
        failure_modes=len(failure_modes) if isinstance(failure_modes, list) else 0,
        kpis=len(kpis) if isinstance(kpis, list) else 0,
    )


def load_registry() -> dict[str, dict]:
    reg_path = ROOT / "agents_registry.json"
    data = json.loads(reg_path.read_text(encoding="utf-8"))
    reg = {a["agent_id"]: a for a in data.get("agents", [])}
    return reg


def derive_upstream_downstream(registry: dict[str, dict]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    """
    Upstream = agents whose supervises list or handoff targets include this agent.
    Downstream = agents listed under supervises, or agents whose reports_to == this agent.
    """
    upstream: dict[str, list[str]] = {k: [] for k in registry}
    downstream: dict[str, list[str]] = {k: [] for k in registry}
    for aid, spec in registry.items():
        for sup in spec.get("supervises") or []:
            downstream[aid].append(sup)
            upstream.setdefault(sup, []).append(aid)
        reports = spec.get("reports_to")
        if reports:
            upstream.setdefault(aid, []).append(reports)
            downstream.setdefault(reports, []).append(aid)
        for mon in spec.get("monitors") or []:
            downstream[aid].append(mon)
            upstream.setdefault(mon, []).append(aid)
    # Dedup.
    for d in (upstream, downstream):
        for k, v in d.items():
            d[k] = sorted(set(v))
    return upstream, downstream


def build_agent_record(
    name: str,
    folder: Path,
    registry: dict[str, dict],
    upstream_map: dict[str, list[str]],
    downstream_map: dict[str, list[str]],
) -> AgentRecord:
    reg_entry = registry.get(name)
    rec = AgentRecord(
        name=name,
        registered=reg_entry is not None,
        registry_group=(reg_entry or {}).get("group"),
        reports_to=(reg_entry or {}).get("reports_to"),
        supervises=list((reg_entry or {}).get("supervises") or []),
        upstream=upstream_map.get(name, []),
        downstream=downstream_map.get(name, []),
    )

    # Walk folder top-level only (no recursion into agent sub-dirs except for size roll-up).
    for entry in sorted(folder.iterdir()):
        if entry.is_file():
            st = entry.stat()
            text = safe_read(entry) if entry.suffix in {".md", ".json", ".txt", ".yaml", ".yml"} else None
            rec.files.append(FileRecord(
                name=entry.name,
                size_kb=round(st.st_size / 1024, 2),
                lines=count_lines(text) if text is not None else None,
                mtime_iso=datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            ))
        elif entry.is_dir():
            # Roll up directory size but don't descend in detail.
            total = 0
            for p in entry.rglob("*"):
                if p.is_file():
                    try:
                        total += p.stat().st_size
                    except OSError:
                        pass
            rec.files.append(FileRecord(
                name=f"{entry.name}/  (dir)",
                size_kb=round(total / 1024, 2),
                lines=None,
                mtime_iso=datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            ))
    rec.total_size_kb = round(sum(f.size_kb for f in rec.files), 2)

    # Pull metrics for the canonical files.
    sp = folder / "system_prompt.md"
    if sp.is_file():
        rec.system_prompt = md_metrics(safe_read(sp) or "")
    kn = folder / "knowledge.md"
    if kn.is_file():
        rec.knowledge = md_metrics(safe_read(kn) or "")
    mem = folder / "memory.md"
    if mem.is_file():
        rec.memory = memory_metrics(safe_read(mem) or "")

    mbak = folder / "memory.backup.md"
    if mbak.is_file():
        rec.memory_backup_size_kb = round(mbak.stat().st_size / 1024, 2)
    march = folder / "memory_archive.md"
    if march.is_file():
        rec.memory_archive_size_kb = round(march.stat().st_size / 1024, 2)

    sch = folder / "output_schema.json"
    if sch.is_file():
        rec.output_schema = schema_metrics(sch)
    spec = folder / "agent_spec.json"
    if spec.is_file():
        rec.agent_spec = spec_metrics(spec)

    # Extra doc files to flag (non-canonical clutter).
    known = {
        "system_prompt.md", "knowledge.md", "memory.md", "memory.backup.md",
        "memory_archive.md", "output_schema.json", "agent_spec.json", "test_cases.json",
    }
    for f in rec.files:
        base = f.name.split("/")[0]
        if base not in known and not base.endswith("/  (dir)"):
            rec.extra_doc_files.append(base)

    # Red flag heuristics.
    rf: list[str] = []
    if not rec.registered:
        rf.append("not_in_agents_registry_json")
    if rec.memory and rec.memory.size_kb > 15:
        rf.append(f"memory_bloat_{rec.memory.size_kb}kb")
    if rec.memory and rec.memory.distinct_feedback_dates > 5:
        rf.append(f"feedback_log_style_{rec.memory.distinct_feedback_dates}_dates")
    if rec.memory and rec.memory.migration_candidates_guess >= 3:
        rf.append(f"canonicalizable_sections_{rec.memory.migration_candidates_guess}")
    if rec.system_prompt and rec.system_prompt.size_kb > 25:
        rf.append(f"system_prompt_heavy_{rec.system_prompt.size_kb}kb")
    if rec.output_schema and rec.output_schema.minLength_count == 0 and rec.output_schema.total_properties_recursive > 20:
        rf.append("schema_no_minLength_enforcement")
    if rec.output_schema and rec.output_schema.enum_or_const_count == 0 and rec.output_schema.total_properties_recursive > 20:
        rf.append("schema_no_enum_enforcement")
    if rec.memory_backup_size_kb is not None:
        rf.append("has_memory_backup_file")
    if len(rec.extra_doc_files) >= 3:
        rf.append(f"extra_doc_clutter_{len(rec.extra_doc_files)}_files")
    rec.red_flags = rf
    return rec


def md_table(rows: list[dict], cols: list[str]) -> str:
    out = "| " + " | ".join(cols) + " |\n| " + " | ".join(["---"] * len(cols)) + " |\n"
    for r in rows:
        cells = []
        for c in cols:
            v = r.get(c, "")
            if isinstance(v, list):
                v = ", ".join(str(x) for x in v)
            cells.append(str(v))
        out += "| " + " | ".join(cells) + " |\n"
    return out


def write_per_agent_md(rec: AgentRecord, path: Path) -> None:
    lines: list[str] = []
    lines.append(f"# Agent inventory — {rec.name}")
    lines.append("")
    lines.append(f"- Registered in `agents_registry.json`: **{rec.registered}**")
    if rec.registry_group:
        lines.append(f"- Registry group: `{rec.registry_group}`")
    if rec.reports_to:
        lines.append(f"- Reports to: `{rec.reports_to}`")
    if rec.supervises:
        lines.append(f"- Supervises: {', '.join(f'`{s}`' for s in rec.supervises)}")
    lines.append(f"- Upstream (derived): {', '.join(f'`{s}`' for s in rec.upstream) or '—'}")
    lines.append(f"- Downstream (derived): {', '.join(f'`{s}`' for s in rec.downstream) or '—'}")
    lines.append(f"- Folder total size: **{rec.total_size_kb:,.2f} KB** across {len(rec.files)} entries")
    if rec.red_flags:
        lines.append(f"- Red flags: {', '.join(f'`{r}`' for r in rec.red_flags)}")
    lines.append("")

    # Files
    lines.append("## Files")
    lines.append("")
    lines.append(md_table(
        [{"name": f.name, "size_kb": f.size_kb, "lines": f.lines if f.lines is not None else "-", "mtime": f.mtime_iso} for f in rec.files],
        ["name", "size_kb", "lines", "mtime"],
    ))

    # system_prompt
    if rec.system_prompt:
        sp = rec.system_prompt
        lines.append("## system_prompt.md")
        lines.append("")
        lines.append(f"- Size: **{sp.size_kb} KB**, {sp.lines} lines")
        lines.append(f"- Headings: H1={sp.headings_h1}, H2={sp.headings_h2}, H3+={sp.headings_h3_plus}")
        lines.append(f"- Bullets: {sp.bullets} · Code blocks: {sp.code_blocks} · Rule-marker lines (ZORUNLU/YASAK/must/never): **{sp.rule_marker_lines}**")
        lines.append("")

    # knowledge
    if rec.knowledge:
        k = rec.knowledge
        lines.append("## knowledge.md")
        lines.append("")
        lines.append(f"- Size: **{k.size_kb} KB**, {k.lines} lines")
        lines.append(f"- Headings: H1={k.headings_h1}, H2={k.headings_h2}, H3+={k.headings_h3_plus}")
        lines.append(f"- Bullets: {k.bullets} · Code blocks: {k.code_blocks} · Rule-marker lines: {k.rule_marker_lines}")
        lines.append("")

    # memory
    if rec.memory:
        m = rec.memory
        lines.append("## memory.md")
        lines.append("")
        lines.append(f"- Size: **{m.size_kb} KB**, {m.lines} lines")
        lines.append(f"- Feedback dates found: {m.distinct_feedback_dates} → {', '.join(m.feedback_dates) or '—'}")
        lines.append(f"- Rule-marker lines: **{m.rule_marker_lines}** · Migration-candidate headings: {m.migration_candidates_guess}")
        if m.canonicalizable_hits:
            lines.append(f"- Canonical-rule hints present: {', '.join(f'{k}×{v}' for k, v in m.canonicalizable_hits.items())}")
        if m.repeated_token_counts:
            top = list(m.repeated_token_counts.items())[:10]
            lines.append(f"- Top repeated tokens (len≥6, freq≥5): {', '.join(f'{k}×{v}' for k, v in top)}")
        lines.append("")

    if rec.memory_backup_size_kb is not None:
        lines.append(f"- `memory.backup.md` present: **{rec.memory_backup_size_kb} KB**")
    if rec.memory_archive_size_kb is not None:
        lines.append(f"- `memory_archive.md` present: **{rec.memory_archive_size_kb} KB**")

    # schema
    if rec.output_schema:
        s = rec.output_schema
        lines.append("## output_schema.json")
        lines.append("")
        lines.append(f"- Size: **{s.size_kb} KB** · max nesting depth: {s.max_depth}")
        lines.append(f"- Required (top level): {s.required_top_level}")
        lines.append(f"- Required (recursive sum): {s.total_required_fields_recursive}")
        lines.append(f"- Properties (recursive): {s.total_properties_recursive}")
        lines.append(f"- Enum/const usage: {s.enum_or_const_count}")
        lines.append(f"- minLength fields: **{s.minLength_count}** · minItems fields: {s.minItems_count}")
        lines.append(f"- $ref usages: {s.ref_count}")
        lines.append("")

    # agent_spec
    if rec.agent_spec:
        sp = rec.agent_spec
        lines.append("## agent_spec.json")
        lines.append("")
        lines.append(f"- Size: **{sp.size_kb} KB**")
        lines.append(f"- Inputs: {', '.join(sp.inputs) or '—'}")
        lines.append(f"- Outputs: {', '.join(sp.outputs) or '—'}")
        lines.append(f"- Tools: {', '.join(sp.tools) or '—'}")
        lines.append(f"- Handoff rules: {sp.handoff_count} · Runtime modes: {', '.join(sp.runtime_modes) or '—'}")
        lines.append(f"- Failure modes: {sp.failure_modes} · KPIs: {sp.kpis}")
        lines.append("")

    if rec.extra_doc_files:
        lines.append("## Extra / non-canonical doc files in this agent folder")
        lines.append("")
        for f in sorted(set(rec.extra_doc_files)):
            lines.append(f"- `{f}`")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def write_index_md(records: list[AgentRecord], path: Path) -> None:
    rows = []
    for r in records:
        rows.append({
            "agent": r.name,
            "reg": "✓" if r.registered else "✗",
            "group": r.registry_group or "—",
            "size_kb": r.total_size_kb,
            "sys_kb": r.system_prompt.size_kb if r.system_prompt else "—",
            "know_kb": r.knowledge.size_kb if r.knowledge else "—",
            "mem_kb": r.memory.size_kb if r.memory else "—",
            "mem_feedback_dates": r.memory.distinct_feedback_dates if r.memory else "—",
            "schema_req": r.output_schema.required_top_level if r.output_schema else "—",
            "schema_minLen": r.output_schema.minLength_count if r.output_schema else "—",
            "extra_docs": len(r.extra_doc_files),
            "flags": len(r.red_flags),
        })
    rows.sort(key=lambda x: -x["size_kb"])

    flagged_rows = []
    for r in records:
        if r.red_flags:
            flagged_rows.append({"agent": r.name, "flags": ", ".join(r.red_flags)})

    lines: list[str] = []
    lines.append("# Agent inventory index")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Agents scanned: **{len(records)}** (registry lists {sum(1 for r in records if r.registered)}, filesystem-only: {sum(1 for r in records if not r.registered)})")
    lines.append("")
    lines.append("## Per-agent summary")
    lines.append("")
    lines.append(md_table(rows, [
        "agent", "reg", "group", "size_kb", "sys_kb", "know_kb", "mem_kb",
        "mem_feedback_dates", "schema_req", "schema_minLen", "extra_docs", "flags",
    ]))
    lines.append("")
    lines.append("## Red-flag map")
    lines.append("")
    if flagged_rows:
        lines.append(md_table(flagged_rows, ["agent", "flags"]))
    else:
        lines.append("_No red flags detected._")
    lines.append("")
    lines.append("## Red-flag legend")
    lines.append("")
    lines.append("- `not_in_agents_registry_json` — folder exists under `agents/` but agent is not listed in `agents_registry.json`.")
    lines.append("- `memory_bloat_<kb>` — `memory.md` exceeds 15 KB.")
    lines.append("- `feedback_log_style_<N>_dates` — memory contains 5+ dated feedback entries (log-style, not distilled).")
    lines.append("- `canonicalizable_sections_<N>` — memory headings mention hard-codable concepts (ticker, sector, IAS 29, etc.).")
    lines.append("- `system_prompt_heavy_<kb>` — system prompt over 25 KB.")
    lines.append("- `schema_no_minLength_enforcement` / `schema_no_enum_enforcement` — schema has >20 properties but no depth/enumeration constraints.")
    lines.append("- `has_memory_backup_file` — `memory.backup.md` is present; clean-up candidate.")
    lines.append("- `extra_doc_clutter_<N>_files` — 3+ non-canonical doc files in agent folder.")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    PER_AGENT_DIR.mkdir(parents=True, exist_ok=True)
    registry = load_registry()
    upstream, downstream = derive_upstream_downstream(registry)

    records: list[AgentRecord] = []
    for folder in sorted(AGENTS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        if folder.name in NON_AGENT_FOLDERS:
            continue
        rec = build_agent_record(folder.name, folder, registry, upstream, downstream)
        records.append(rec)
        write_per_agent_md(rec, PER_AGENT_DIR / f"{folder.name}.md")

    # Consolidated index + json dump.
    write_index_md(records, PER_AGENT_DIR / "_index.md")
    (OUT_DIR / "agent_inventory.json").write_text(
        json.dumps({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "agent_count": len(records),
            "agents": [asdict(r) for r in records],
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"agents: {len(records)}")
    print(f"per-agent dir: {PER_AGENT_DIR}")
    print(f"index: {PER_AGENT_DIR / '_index.md'}")
    print(f"json:  {OUT_DIR / 'agent_inventory.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
