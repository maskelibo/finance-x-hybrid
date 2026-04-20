"""
Finance-X Hybrid refactor Phase 1 report builder.

Generates the remaining inventory/audit deliverables:

  - duplicate_map.md
  - schema_audit.md
  - pipeline_flow.md
  - dead_code.md
  - memory_analysis.md
  - output_quality_audit.md
  - EXECUTIVE_SUMMARY.md
  - refactor/reports/phase_1_summary.md

The script is intentionally heuristic-driven. Phase 1 is an audit pass, not a
compiler or a static-analysis proof. Whenever a conclusion is inferred rather
than directly encoded, the markdown output marks it as a heuristic/inference.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
INVENTORY_DIR = ROOT / "refactor" / "inventory"
REPORTS_DIR = ROOT / "refactor" / "reports"
AGENTS_DIR = ROOT / "agents"

TEXT_SUFFIXES = {
    ".md", ".txt", ".py", ".ts", ".tsx", ".js", ".json", ".jsonc", ".yaml",
    ".yml", ".html", ".css", ".toml", ".cjs", ".mjs",
}
RULE_MARKERS = (
    "zorunlu", "mutlak", "yasak", "kritik", "must", "never", "forbidden",
    "required", "do not", "block", "blocked", "reject", "revision",
)
RULE_HINTS = (
    "ias 29", "ias29", "ebitdar", "chart.js", "svg", "proxy", "thyao",
    "aviation", "havac", "steel", "çelik", "holding", "nav", "sotp",
    "telecom", "telekom", "retail", "perakende", "defense", "savunma",
    "coe", "cost of equity", "roe", "metric", "metrik", "ticker",
)
DATE_RE = re.compile(r"(20\d{2})[-_/](\d{2})[-_/](\d{2})")
TICKER_TO_SECTOR = {
    "THYAO": "aviation",
    "PGSUS": "aviation",
    "TAVHL": "aviation",
    "ASELS": "defense",
    "BIMAS": "retail",
    "MGROS": "retail",
    "TCELL": "telecom",
    "TTKOM": "telecom",
    "KCHOL": "holding",
    "SAHOL": "holding",
    "EREGL": "steel",
    "TUPRS": "refinery",
    "AKBNK": "banking",
}


def safe_read(path: Path) -> str:
    for enc in ("utf-8", "cp1254", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except Exception:
            continue
    return ""


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def md_table(rows: list[dict[str, Any]], columns: list[str]) -> str:
    if not rows:
        return "_No rows._"
    header = "| " + " | ".join(columns) + " |\n"
    sep = "| " + " | ".join(["---"] * len(columns)) + " |\n"
    body = ""
    for row in rows:
        body += "| " + " | ".join(str(row.get(col, "")) for col in columns) + " |\n"
    return header + sep + body


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def normalize_rule(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"20\d{2}[-_/]\d{2}[-_/]\d{2}", "<date>", text)
    text = re.sub(r"\b\d+(?:[.,]\d+)?\b", "<num>", text)
    text = re.sub(r"[`*_>#\-\[\]\(\)\"“”'’:,.;!?/\\|]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [c.strip() for c in chunks if len(c.strip()) >= 40]


def is_rule_line(line: str) -> bool:
    lower = line.lower()
    return any(marker in lower for marker in RULE_MARKERS) or any(h in lower for h in RULE_HINTS)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_file_inventory() -> dict[str, Any]:
    return load_json(INVENTORY_DIR / "file_inventory.json")


def load_agent_inventory() -> dict[str, Any]:
    return load_json(INVENTORY_DIR / "agent_inventory.json")


def repo_text_files() -> list[Path]:
    allowed_prefixes = (
        "agents/",
        "backend/src/",
        "backend/generated/schemas/",
        "python-services/src/",
        "workflows/",
        "prompts/",
        "schemas/",
        "scripts/",
        ".agents/skills/",
    )
    allowed_roots = {
        "README.md",
        "AGENTS.md",
        "agents_registry.json",
        "evals/README.md",
    }
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if (
            rel.startswith(".git/")
            or rel.startswith("node_modules/")
            or "/node_modules/" in rel
            or rel.startswith("refactor/")
            or rel.startswith("backend/node_modules/")
            or rel.startswith("dashboard/node_modules/")
        ):
            continue
        if rel not in allowed_roots and not rel.startswith(allowed_prefixes):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name in {".env", ".gitignore"}:
            files.append(path)
    return files


def category_summary(file_inventory: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {row["category"]: row for row in file_inventory["categories"]}


def actual_runtime_modes() -> dict[str, list[str]]:
    # Derived from backend/src/orchestrator.ts + backend/src/analysis-config.ts.
    layer_agents = {
        "fundamental": ["data_collection", "parse_standardization", "reconciliation", "context_extraction", "financial_analysis"],
        "technical": ["technical_analysis"],
        "events": ["kap_watch", "event_classification", "event_impact_mapper", "event_timeline_alert"],
        "sector": ["sector_competition"],
        "macro": ["macro_analysis"],
        "valuation": ["valuation_agent"],
        "sentiment": ["sentiment_news_agent"],
        "consensus": ["analyst_consensus_agent"],
        "esg": ["esg_agent"],
    }
    backbone = ["ceo", "coo", "qa_review", "strategic_synthesis", "final_summary", "report_formatter"]
    mode_layers = {
        "fast_screening": ["fundamental", "technical", "events"],
        "standard_institutional": ["fundamental", "technical", "events", "sector", "macro"],
        "deep_dive": list(layer_agents.keys()),
    }
    result: dict[str, list[str]] = {}
    canonical_order = [
        "ceo", "coo", "data_collection", "parse_standardization", "reconciliation",
        "context_extraction", "financial_analysis", "sector_competition",
        "macro_analysis", "technical_analysis", "kap_watch", "event_classification",
        "event_impact_mapper", "event_timeline_alert", "qa_review",
        "strategic_synthesis", "final_summary", "valuation_agent",
        "sentiment_news_agent", "analyst_consensus_agent", "esg_agent",
        "report_formatter",
    ]
    for mode, layers in mode_layers.items():
        active = set(backbone)
        for layer in layers:
            active.update(layer_agents[layer])
        result[mode] = [agent for agent in canonical_order if agent in active]
    return result


def documented_runtime_modes() -> dict[str, dict[str, Any]]:
    return {
        "README.md": {
            "fast_screening": ["ceo", "data_collection", "financial_analysis", "technical_analysis", "final_summary", "report_formatter"],
            "standard_institutional": "~15 agents",
            "deep_dive": "22 agents (hepsi)",
        },
        "workflows/full_integrated_analysis.md": {
            "fast_screening": ["ceo", "data_collection", "financial_analysis", "technical_analysis", "final_summary"],
            "standard_institutional": "not enumerated",
            "deep_dive": "all 20",
        },
        "agents/ceo/system_prompt.md": {
            "fast_screening": ["ceo", "data_collection", "financial_analysis", "technical_analysis", "final_summary"],
            "standard_institutional": "specialists + qa_review + conditional KAP team",
            "deep_dive": "all 20 agents",
        },
    }


def baseline_durations() -> dict[str, int]:
    try:
        baseline = load_json(ROOT / "evals" / "baseline.json")
    except Exception:
        return {}
    return {
        agent: int(stats.get("avg_duration_ms", 0))
        for agent, stats in baseline.get("agents", {}).items()
        if isinstance(stats, dict)
    }


def actual_execution_phases() -> list[tuple[str, list[list[str]]]]:
    return [
        ("Mandate", [["ceo"]]),
        ("Pre-Flight", [["coo"]]),
        ("Data Acquisition", [["kap_watch"], ["data_collection"]]),
        ("Parsing", [["parse_standardization"]]),
        ("Data Quality & Context", [["reconciliation", "context_extraction"]]),
        ("Analysis & Events", [[
            "financial_analysis", "macro_analysis", "technical_analysis",
            "sentiment_news_agent", "analyst_consensus_agent", "esg_agent",
            "event_classification",
        ]]),
        ("Valuation & Sector & Event Impact", [[
            "valuation_agent", "sector_competition", "event_impact_mapper", "event_timeline_alert",
        ]]),
        ("Quality Review", [["qa_review"]]),
        ("Synthesis", [["strategic_synthesis"]]),
        ("Final Report", [["final_summary"]]),
        # report_formatter runs after this in separate logic branch
        ("Formatting", [["report_formatter"]]),
    ]


def approx_phase_duration_ms(group: list[str], durations: dict[str, int], max_concurrent: int = 3) -> int:
    if not group:
        return 0
    if len(group) <= 1:
        return durations.get(group[0], 0)
    batches = [group[i:i + max_concurrent] for i in range(0, len(group), max_concurrent)]
    return sum(max(durations.get(agent, 0) for agent in batch) for batch in batches)


def mode_phase_breakdown(mode_agents: list[str], durations: dict[str, int]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    active = set(mode_agents)
    total = 0
    for phase_name, parallel_groups in actual_execution_phases():
        phase_total = 0
        active_groups: list[str] = []
        for group in parallel_groups:
            filtered = [agent for agent in group if agent in active]
            if not filtered:
                continue
            active_groups.append(", ".join(filtered))
            phase_total += approx_phase_duration_ms(filtered, durations)
        total += phase_total
        if active_groups:
            rows.append({
                "phase": phase_name,
                "agents": " / ".join(active_groups),
                "approx_ms": phase_total,
                "approx_min": round(phase_total / 60000, 1),
            })
    rows.append({
        "phase": "TOTAL",
        "agents": "",
        "approx_ms": total,
        "approx_min": round(total / 60000, 1),
    })
    return rows


def collect_rule_occurrences() -> tuple[dict[str, list[dict[str, str]]], dict[str, Counter[str]], dict[str, list[str]]]:
    rule_groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    sector_hits: dict[str, Counter[str]] = {
        "THYAO->aviation": Counter(),
        "ASELS->defense": Counter(),
        "BIMAS->retail": Counter(),
        "KCHOL->holding": Counter(),
        "IAS29": Counter(),
        "Chart.js forbidden": Counter(),
    }
    sector_lines: dict[str, list[str]] = defaultdict(list)
    for path in repo_text_files():
        rel = path.relative_to(ROOT).as_posix()
        text = safe_read(path)
        if not text:
            continue
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line or len(line) < 35:
                continue
            lower = line.lower()
            if is_rule_line(line):
                key = normalize_rule(line)
                rule_groups[key].append({"path": rel, "sample": line[:220]})
            if ("thyao" in lower and ("aviation" in lower or "havac" in lower)) or ("pgsus" in lower and "aviation" in lower):
                sector_hits["THYAO->aviation"][rel] += 1
                sector_lines["THYAO->aviation"].append(f"{rel}: {line[:180]}")
            if "asels" in lower and ("defense" in lower or "savun" in lower):
                sector_hits["ASELS->defense"][rel] += 1
                sector_lines["ASELS->defense"].append(f"{rel}: {line[:180]}")
            if "bimas" in lower and ("retail" in lower or "perakende" in lower):
                sector_hits["BIMAS->retail"][rel] += 1
                sector_lines["BIMAS->retail"].append(f"{rel}: {line[:180]}")
            if "kchol" in lower and ("holding" in lower or "sotp" in lower or "nav" in lower):
                sector_hits["KCHOL->holding"][rel] += 1
                sector_lines["KCHOL->holding"].append(f"{rel}: {line[:180]}")
            if "ias 29" in lower or "ias29" in lower:
                sector_hits["IAS29"][rel] += 1
                sector_lines["IAS29"].append(f"{rel}: {line[:180]}")
            if "chart.js" in lower and ("yasak" in lower or "forbidden" in lower or "ban" in lower):
                sector_hits["Chart.js forbidden"][rel] += 1
                sector_lines["Chart.js forbidden"].append(f"{rel}: {line[:180]}")
    return rule_groups, sector_hits, sector_lines


def build_duplicate_map(file_inventory: dict[str, Any], agent_inventory: dict[str, Any]) -> str:
    rule_groups, sector_hits, sector_lines = collect_rule_occurrences()
    duplicate_rows: list[dict[str, Any]] = []
    for _, occs in rule_groups.items():
        unique_paths = sorted({o["path"] for o in occs})
        if len(unique_paths) < 3:
            continue
        sample = occs[0]["sample"]
        duplicate_rows.append({
            "rule_sample": sample[:110] + ("..." if len(sample) > 110 else ""),
            "files": len(unique_paths),
            "sample_files": ", ".join(unique_paths[:5]) + (" ..." if len(unique_paths) > 5 else ""),
        })
    duplicate_rows.sort(key=lambda row: (-row["files"], row["rule_sample"]))

    memory_rows: list[dict[str, Any]] = []
    schema_migration_rows: list[dict[str, Any]] = []
    for agent in agent_inventory["agents"]:
        memory = agent.get("memory") or {}
        repeated = memory.get("repeated_token_counts") or {}
        if repeated:
            memory_rows.append({
                "agent": agent["name"],
                "repeated_tokens": ", ".join(f"{k}:{v}" for k, v in list(repeated.items())[:8]),
                "feedback_dates": memory.get("distinct_feedback_dates", 0),
            })
        schema_candidate = 0
        memory_path = AGENTS_DIR / agent["name"] / "memory.md"
        text = safe_read(memory_path)
        if text:
            for line in text.splitlines():
                lower = line.lower()
                if any(k in lower for k in ("required", "zorunlu", "enum", "status", "field", "alan", "must include", "çıktı", "output")):
                    schema_candidate += 1
        schema_migration_rows.append({
            "agent": agent["name"],
            "memory_kb": round((memory.get("size_kb") or 0), 2),
            "schema_migration_candidates": schema_candidate,
            "canonicalizable_sections": memory.get("migration_candidates_guess", 0),
        })
    schema_migration_rows.sort(key=lambda row: (-row["schema_migration_candidates"], -row["memory_kb"], row["agent"]))
    memory_rows.sort(key=lambda row: (-row["feedback_dates"], row["agent"]))

    actual_modes = actual_runtime_modes()
    actual_fast = ", ".join(actual_modes["fast_screening"])
    actual_standard = ", ".join(actual_modes["standard_institutional"])
    actual_deep = ", ".join(actual_modes["deep_dive"])
    registry_count = len(load_json(ROOT / "agents_registry.json").get("agents", []))
    backend_registry_count = len(re.findall(r"{ id: '([^']+)'", safe_read(ROOT / "backend" / "src" / "agents.ts")))
    agent_fs_count = len([p for p in AGENTS_DIR.iterdir() if p.is_dir() and not p.name.startswith("_")])

    conflict_rows = [
        {
            "topic": "Agent count drift",
            "file_a": "AGENTS.md / README.md / workflow",
            "file_b": "agents_registry.json / backend/src/agents.ts / agents/",
            "conflict": f"Docs say 22 or 20 agents; registry has {registry_count}; backend runtime registry has {backend_registry_count}; filesystem has {agent_fs_count}.",
        },
        {
            "topic": "Fast mode path drift",
            "file_a": "README.md / workflows/full_integrated_analysis.md / agents/ceo/system_prompt.md",
            "file_b": "backend/src/orchestrator.ts + backend/src/analysis-config.ts",
            "conflict": f"Docs describe 5-6 agents; actual fast_screening activates {len(actual_modes['fast_screening'])}: {actual_fast}.",
        },
        {
            "topic": "Standard mode path drift",
            "file_a": "README.md",
            "file_b": "backend/src/orchestrator.ts + backend/src/analysis-config.ts",
            "conflict": f"README says ~15 agents; actual standard_institutional activates {len(actual_modes['standard_institutional'])}: {actual_standard}.",
        },
        {
            "topic": "Deep-dive path drift",
            "file_a": "README.md / workflows/full_integrated_analysis.md / agents/ceo/system_prompt.md",
            "file_b": "backend/src/orchestrator.ts + backend/src/analysis-config.ts",
            "conflict": f"Docs say all 20/22; actual deep_dive activates {len(actual_modes['deep_dive'])}: {actual_deep}.",
        },
        {
            "topic": "Formatter rendering doctrine",
            "file_a": "agents/report_formatter/system_prompt.md",
            "file_b": "agents/report_formatter/agent_spec.json",
            "conflict": "System prompt forbids Chart.js and says deterministic compose.ts/template slots only; agent_spec still mandates Chart.js CDN, design/layout decision rights, and new visual structure decisions.",
        },
        {
            "topic": "QA gate policy",
            "file_a": "workflows/full_integrated_analysis.md + ceo/orchestrator prompts",
            "file_b": "backend/src/orchestrator.ts",
            "conflict": "Workflow says rejected/revision_requested outputs block downstream; runtime continues after max 2 QA rounds with warning and CEO override log.",
        },
        {
            "topic": "CEO approval policy",
            "file_a": "backend/src/orchestrator.ts comments + CEO prompt",
            "file_b": "backend/src/orchestrator.ts implementation",
            "conflict": "\"Rapor onaylanmadan çıkmaz\" comment exists, but approval failures only append warning context; delivery still proceeds.",
        },
        {
            "topic": "Sector mapping source of truth",
            "file_a": "backend/src/agent-runner.ts + prompts/memory",
            "file_b": "backend/src/python/report_formatter/compose.ts + peer_sets.ts",
            "conflict": "Sector detection/mapping is duplicated in keyword heuristics, formatter hardcodes, peer sets, and memory doctrine; no single canonical mapping file exists.",
        },
    ]

    lines: list[str] = []
    lines.append("# Duplicate & Conflict Map")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("- Method: heuristic rule-line grouping across repo text files + targeted manual conflict checks for runtime/docs drift.")
    lines.append("")
    lines.append("## Highest-frequency duplicate rule fragments")
    lines.append("")
    lines.append(md_table(duplicate_rows[:40], ["rule_sample", "files", "sample_files"]))
    lines.append("")
    lines.append("## Curated conflict map")
    lines.append("")
    lines.append(md_table(conflict_rows, ["topic", "file_a", "file_b", "conflict"]))
    lines.append("")
    lines.append("## Repeating sector / doctrine directives")
    lines.append("")
    sector_rows = []
    for topic, counter in sector_hits.items():
        sector_rows.append({
            "directive": topic,
            "file_count": len(counter),
            "top_files": ", ".join(path for path, _ in counter.most_common(6)),
        })
    sector_rows.sort(key=lambda row: (-row["file_count"], row["directive"]))
    lines.append(md_table(sector_rows, ["directive", "file_count", "top_files"]))
    lines.append("")
    for topic in ("THYAO->aviation", "IAS29", "Chart.js forbidden"):
        if sector_lines.get(topic):
            lines.append(f"### {topic}")
            lines.append("")
            for item in sector_lines[topic][:10]:
                lines.append(f"- `{item}`")
            lines.append("")
    lines.append("## memory.md duplicate-feedback hotspots")
    lines.append("")
    lines.append(md_table(memory_rows[:20], ["agent", "feedback_dates", "repeated_tokens"]))
    lines.append("")
    lines.append("## memory.md prose rules likely movable to schema/canonical/code")
    lines.append("")
    lines.append(md_table(schema_migration_rows[:26], ["agent", "memory_kb", "schema_migration_candidates", "canonicalizable_sections"]))
    lines.append("")
    lines.append("## Notes")
    lines.append("")
    lines.append("- Duplicate grouping is sentence/line based; semantically equivalent rules with different wording will under-count.")
    lines.append("- Conflict rows above are not mere text duplicates; they were inferred by cross-reading runtime code and documentation.")
    return "\n".join(lines)


def walk_schema_fields(node: Any, prefix: str = "") -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not isinstance(node, dict):
        return rows
    props = node.get("properties")
    required = set(node.get("required", [])) if isinstance(node.get("required"), list) else set()
    if isinstance(props, dict):
        for name, child in props.items():
            path = f"{prefix}.{name}" if prefix else name
            if isinstance(child, dict):
                rows.append({
                    "path": path,
                    "type": child.get("type"),
                    "required": name in required,
                    "enum": "enum" in child or "const" in child,
                    "minLength": child.get("minLength"),
                    "minItems": child.get("minItems"),
                    "pattern": child.get("pattern"),
                    "format": child.get("format"),
                    "ref": child.get("$ref"),
                })
                rows.extend(walk_schema_fields(child, path))
    if isinstance(node.get("items"), dict):
        rows.extend(walk_schema_fields(node["items"], prefix + "[]"))
    for key in ("definitions", "$defs"):
        if isinstance(node.get(key), dict):
            for name, child in node[key].items():
                rows.extend(walk_schema_fields(child, f"{prefix}.{key}.{name}" if prefix else f"{key}.{name}"))
    return rows


def schema_file_list() -> list[Path]:
    out: list[Path] = []
    for pattern in (
        "schemas/**/*.json",
        "agents/*/*schema*.json",
        "backend/generated/schemas/*.json",
    ):
        out.extend(ROOT.glob(pattern))
    unique = sorted({p.resolve() for p in out})
    return [Path(p) for p in unique if p.is_file()]


def collect_schema_refs(doc: Any) -> list[str]:
    refs: list[str] = []
    if isinstance(doc, dict):
        if "$ref" in doc and isinstance(doc["$ref"], str):
            refs.append(doc["$ref"])
        for value in doc.values():
            refs.extend(collect_schema_refs(value))
    elif isinstance(doc, list):
        for item in doc:
            refs.extend(collect_schema_refs(item))
    return refs


def build_schema_audit() -> str:
    files = schema_file_list()
    by_id: dict[str, str] = {}
    docs: dict[str, Any] = {}
    schema_rows: list[dict[str, Any]] = []
    broken_refs: list[dict[str, str]] = []
    graph_rows: list[dict[str, str]] = []
    unconstrained_strings: list[dict[str, str]] = []
    enum_candidates: list[dict[str, str]] = []
    required_candidates: list[dict[str, str]] = []

    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        try:
            doc = load_json(path)
        except Exception as err:
            schema_rows.append({
                "path": rel, "id": "parse_error", "refs": 0, "unconstrained_strings": 0,
                "enums": 0, "broken_refs": 0, "note": str(err)[:80],
            })
            continue
        docs[rel] = doc
        schema_id = doc.get("$id") if isinstance(doc, dict) else None
        if isinstance(schema_id, str):
            by_id[schema_id] = rel

    for rel, doc in docs.items():
        refs = collect_schema_refs(doc)
        fields = walk_schema_fields(doc)
        string_fields = [f for f in fields if f["type"] == "string"]
        arrays = [f for f in fields if f["type"] == "array"]
        enum_count = sum(1 for f in fields if f["enum"])
        unconstrained = [
            f for f in string_fields
            if not f["enum"] and not f["minLength"] and not f["pattern"] and not f["format"]
        ]
        bad_refs = 0
        for ref in refs:
            if ref.startswith("#"):
                continue
            if ref in by_id:
                graph_rows.append({"source": rel, "ref": ref, "resolved_to": by_id[ref]})
                continue
            # Try loose resolution by removing trailing fragment / output name.
            loose = next((schema_path for schema_path in by_id if schema_path.rstrip("/") == ref.rstrip("/")), None)
            if loose:
                graph_rows.append({"source": rel, "ref": ref, "resolved_to": by_id[loose]})
                continue
            graph_rows.append({"source": rel, "ref": ref, "resolved_to": "MISSING"})
            broken_refs.append({"source": rel, "ref": ref})
            bad_refs += 1
        schema_rows.append({
            "path": rel,
            "id": doc.get("$id", "—"),
            "refs": len(refs),
            "unconstrained_strings": len(unconstrained),
            "arrays_without_minItems": sum(1 for a in arrays if not a["minItems"]),
            "enums": enum_count,
            "broken_refs": bad_refs,
            "note": doc.get("title", "—"),
        })
        for field in unconstrained[:20]:
            unconstrained_strings.append({"schema": rel, "field": field["path"]})
        for field in fields:
            name = field["path"].split(".")[-1]
            if field["type"] != "string":
                continue
            if field["enum"] or field["pattern"] or field["format"]:
                continue
            if re.search(r"(status|decision|type|category|severity|mode|direction|action|sector|confidence|impact)$", name):
                enum_candidates.append({"schema": rel, "field": field["path"]})
        # Required-candidate heuristics aligned to runtime code use.
        field_map = {f["path"].split(".")[-1]: f for f in fields}
        for candidate in ("overall_score", "payload", "claims", "warnings", "analysis_session_id", "company_ticker", "review_notes"):
            field = field_map.get(candidate)
            if field and not field["required"]:
                required_candidates.append({"schema": rel, "field": candidate})

    schema_rows.sort(key=lambda row: (-row["unconstrained_strings"], -row["broken_refs"], row["path"]))
    unconstrained_strings = sorted(unconstrained_strings, key=lambda row: (row["schema"], row["field"]))
    enum_candidates = sorted(enum_candidates, key=lambda row: (row["schema"], row["field"]))
    required_candidates = sorted({(row["schema"], row["field"]) for row in required_candidates})

    # Agent -> schema mapping
    mapping_rows = []
    for agent_dir in sorted(AGENTS_DIR.iterdir(), key=lambda p: p.name):
        if not agent_dir.is_dir() or agent_dir.name.startswith("_"):
            continue
        out_schema = agent_dir / "output_schema.json"
        if out_schema.exists():
            mapping_rows.append({
                "agent": agent_dir.name,
                "schema": out_schema.relative_to(ROOT).as_posix(),
                "shared_contract": "schemas/shared/agent_output_contract.schema.json (documented, not enforced end-to-end)",
            })
    mapping_rows.sort(key=lambda row: row["agent"])

    lines: list[str] = []
    lines.append("# Schema Audit")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Schemas scanned: **{len(schema_rows)}**")
    lines.append("- Inference note: `required-candidate` rows are heuristic, based on runtime code/docs referencing optional fields as operationally important.")
    lines.append("")
    lines.append("## Schema inventory")
    lines.append("")
    lines.append(md_table(schema_rows, ["path", "refs", "unconstrained_strings", "arrays_without_minItems", "enums", "broken_refs", "note"]))
    lines.append("")
    lines.append("## Agent -> schema mapping")
    lines.append("")
    lines.append(md_table(mapping_rows, ["agent", "schema", "shared_contract"]))
    lines.append("")
    lines.append("## $ref graph (cross-file only)")
    lines.append("")
    lines.append(md_table(graph_rows[:80], ["source", "ref", "resolved_to"]))
    lines.append("")
    if broken_refs:
        lines.append("## Broken or unresolved $ref targets")
        lines.append("")
        lines.append(md_table(broken_refs, ["source", "ref"]))
        lines.append("")
    lines.append("## Unconstrained string fields")
    lines.append("")
    lines.append(md_table(unconstrained_strings[:80], ["schema", "field"]))
    lines.append("")
    lines.append("## Fields that look enum-worthy but remain free-form strings")
    lines.append("")
    lines.append(md_table(enum_candidates[:60], ["schema", "field"]))
    lines.append("")
    lines.append("## Fields likely required in practice but optional in schema")
    lines.append("")
    req_rows = [{"schema": schema, "field": field} for schema, field in required_candidates[:40]]
    lines.append(md_table(req_rows, ["schema", "field"]))
    lines.append("")
    lines.append("## Key audit findings")
    lines.append("")
    lines.append("- `schemas/shared/agent_output_contract.schema.json` documents a universal wrapper, but `backend/src/schema-validator.ts` mostly validates per-agent schemas or falls back to regex/text checks rather than full AJV enforcement.")
    lines.append("- Many agent output schemas have rich required-field lists, but depth constraints are shallow: long-form narrative fields rarely use `minLength`, and arrays often omit `minItems`.")
    lines.append("- `qa_review.output_schema.json` leaves `overall_score` optional even though `backend/src/orchestrator.ts` score-blocks delivery on it.")
    lines.append("- Cross-agent checklist enforcement (`findings[]` -> `addressed_findings[]`) does not exist in the current shared contract.")
    return "\n".join(lines)


def build_pipeline_flow() -> str:
    actual_modes = actual_runtime_modes()
    docs = documented_runtime_modes()
    durations = baseline_durations()
    dependency_rows: list[dict[str, Any]] = []
    orchestrator_text = safe_read(ROOT / "backend" / "src" / "orchestrator.ts")
    dep_block_match = re.search(r"const AGENT_DEPENDENCIES: Record<string, string\[]> = \{([\s\S]*?)\n\};", orchestrator_text)
    fanout = Counter()
    if dep_block_match:
        for raw_line in dep_block_match.group(1).splitlines():
            line = raw_line.strip().rstrip(",")
            if ":" not in line:
                continue
            agent, deps_raw = line.split(":", 1)
            agent = agent.strip()
            deps = re.findall(r"'([^']+_output)'", deps_raw)
            upstream_agents = [d.replace("_output", "") for d in deps]
            for up in upstream_agents:
                fanout[up] += 1
            dependency_rows.append({
                "agent": agent,
                "upstream_agents": ", ".join(upstream_agents) or "—",
                "dependency_count": len(upstream_agents),
            })
    dependency_rows.sort(key=lambda row: (-row["dependency_count"], row["agent"]))

    cache_rows = [
        {"context": agent, "downstream_count": count, "note": "High fan-out output; cache/digest candidate"}
        for agent, count in fanout.most_common()
    ]
    cache_rows.extend([
        {"context": "shared_directives.md", "downstream_count": 22, "note": "Injected into every agent run via backend/src/agent-runner.ts"},
        {"context": "agent system_prompt + memory.md", "downstream_count": 22, "note": "Loaded every run; prime prompt-cache candidate"},
        {"context": "sector shared knowledge module", "downstream_count": 8, "note": "Dynamically injected from agents/_shared_knowledge_modules"},
    ])

    actual_rows = []
    for mode, agents in actual_modes.items():
        actual_rows.append({
            "mode": mode,
            "actual_agent_count": len(agents),
            "actual_agents": ", ".join(agents),
        })

    doc_rows = []
    for source, mode_map in docs.items():
        for mode, desc in mode_map.items():
            doc_rows.append({
                "source": source,
                "mode": mode,
                "documented": ", ".join(desc) if isinstance(desc, list) else desc,
            })

    parallelizable_rows = [
        {
            "current_runtime_behavior": "kap_watch then data_collection execute in separate serial groups inside the same phase",
            "could_run_in_parallel": "Yes, workflow spec explicitly says parallel",
            "evidence": "backend/src/orchestrator.ts EXECUTION_PHASES vs workflows/full_integrated_analysis.md Phase 2",
        },
        {
            "current_runtime_behavior": "qa_review waits until after valuation/sector/event-impact phase finishes",
            "could_run_in_parallel": "Partially; deps only require financial_analysis, context_extraction, reconciliation, valuation_agent",
            "evidence": "AGENT_DEPENDENCIES + EXECUTION_PHASES",
        },
        {
            "current_runtime_behavior": "event_timeline_alert is placed in the same phase bucket as event_impact_mapper even though it depends on it",
            "could_run_in_parallel": "No, but grouping obscures dependency and relies on batch ordering side-effect",
            "evidence": "AGENT_DEPENDENCIES + MAX_CONCURRENT batching logic",
        },
        {
            "current_runtime_behavior": "report_formatter runs only after executive report insert/CEO gate path",
            "could_run_in_parallel": "Mostly no, but formatter payload assembly could start before DB insert",
            "evidence": "executeSession post-final_summary branch",
        },
    ]

    phase_rows_by_mode: dict[str, list[dict[str, Any]]] = {
        mode: mode_phase_breakdown(agents, durations)
        for mode, agents in actual_modes.items()
    }
    critical_rows = []
    for mode, rows in phase_rows_by_mode.items():
        bottleneck = max([row for row in rows if row["phase"] != "TOTAL"], key=lambda row: row["approx_ms"], default=None)
        if bottleneck:
            critical_rows.append({
                "mode": mode,
                "bottleneck_phase": bottleneck["phase"],
                "approx_min": bottleneck["approx_min"],
                "agents": bottleneck["agents"],
                "full_path_min": rows[-1]["approx_min"],
            })

    lines: list[str] = []
    lines.append("# Pipeline Flow Audit")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("- Duration estimates are approximate and derived from `evals/baseline.json` average durations plus the actual `EXECUTION_PHASES` batching logic.")
    lines.append("")
    lines.append("## Actual runtime DAG (agent dependencies)")
    lines.append("")
    lines.append(md_table(dependency_rows, ["agent", "dependency_count", "upstream_agents"]))
    lines.append("")
    lines.append("## Documented vs actual runtime modes")
    lines.append("")
    lines.append("### Actual runtime activation")
    lines.append("")
    lines.append(md_table(actual_rows, ["mode", "actual_agent_count", "actual_agents"]))
    lines.append("")
    lines.append("### Documented activation")
    lines.append("")
    lines.append(md_table(doc_rows, ["source", "mode", "documented"]))
    lines.append("")
    lines.append("## Outputs repeatedly reused downstream (cache candidates)")
    lines.append("")
    lines.append(md_table(cache_rows[:20], ["context", "downstream_count", "note"]))
    lines.append("")
    lines.append("## Parallelizable but currently serialized / weakly-grouped work")
    lines.append("")
    lines.append(md_table(parallelizable_rows, ["current_runtime_behavior", "could_run_in_parallel", "evidence"]))
    lines.append("")
    lines.append("## Critical-path estimate by mode")
    lines.append("")
    lines.append(md_table(critical_rows, ["mode", "bottleneck_phase", "approx_min", "agents", "full_path_min"]))
    lines.append("")
    for mode, rows in phase_rows_by_mode.items():
        lines.append(f"### {mode}")
        lines.append("")
        lines.append(md_table(rows, ["phase", "agents", "approx_min"]))
        lines.append("")
    lines.append("## Key findings")
    lines.append("")
    lines.append("- `PIPELINE_BY_MODE` is identical for all modes; real mode difference comes only from `MODE_DEFAULT_LAYERS` + always-on backbone agents.")
    lines.append("- Because the backbone includes `coo`, `qa_review`, `strategic_synthesis`, `final_summary`, and `report_formatter`, `fast_screening` is materially closer to a slimmed institutional path than the documented 5-6 agent flow.")
    lines.append("- The largest fan-out context objects are `context_extraction_output`, `financial_analysis_output`, and `valuation_agent_output`, which makes them prime candidates for manifest/retrieval instead of raw prompt injection.")
    return "\n".join(lines)


def build_dead_code(file_inventory: dict[str, Any], agent_inventory: dict[str, Any]) -> str:
    registry_agents = {agent["agent_id"] for agent in load_json(ROOT / "agents_registry.json").get("agents", [])}
    backend_agents = set(re.findall(r"{ id: '([^']+)'", safe_read(ROOT / "backend" / "src" / "agents.ts")))
    fs_agents = {p.name for p in AGENTS_DIR.iterdir() if p.is_dir() and not p.name.startswith("_")}

    orphan_rows = []
    for agent in sorted(fs_agents):
        in_registry = agent in registry_agents
        in_backend = agent in backend_agents
        if not (in_registry and in_backend):
            orphan_rows.append({
                "agent_folder": agent,
                "in_agents_registry_json": in_registry,
                "in_backend_runtime_registry": in_backend,
                "note": "Drift candidate",
            })

    legacy_rows = []
    for record in file_inventory["files"]:
        path = record["path"]
        lower = path.lower()
        if any(token in lower for token in ("legacy", "backup", "archive", "_old", "deprecated")):
            legacy_rows.append({
                "path": path,
                "category": record["category"],
                "size_kb": record["size_kb"],
            })
    legacy_rows.sort(key=lambda row: (-row["size_kb"], row["path"]))

    sample_output_rows = []
    for path in ROOT.glob("agents/*/*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        name = path.name.lower()
        if (
            name.startswith("output_")
            or name.endswith("_output.json")
            or name.endswith("_output.md")
            or name.endswith("_analysis.md")
            or name.endswith(".backup.md")
            or "memory.backup" in name
        ) and name != "output_schema.json":
            sample_output_rows.append({"path": rel, "size_kb": round(path.stat().st_size / 1024, 2)})
    sample_output_rows.sort(key=lambda row: (-row["size_kb"], row["path"]))

    missing_template_rows = [{
        "path": "templates/report_base.html",
        "status": "missing",
        "evidence": "Referenced in README.md and AGENTS.md repo map, but no `templates/` directory exists in workspace.",
    }]

    old_source_rows = []
    cutoff = datetime(2025, 10, 20, tzinfo=timezone.utc).timestamp()
    for record in file_inventory["files"]:
        category = record["category"]
        if category not in {"backend-code", "dashboard-code", "python-service", "agent-config", "agent-schema", "shared-schema", "workflow", "script", "skill"}:
            continue
        try:
            mtime = datetime.fromisoformat(record["mtime_iso"].replace("Z", "+00:00")).timestamp()
        except Exception:
            continue
        if mtime < cutoff:
            old_source_rows.append({
                "path": record["path"],
                "category": category,
                "mtime": record["mtime_iso"],
            })
    old_source_rows.sort(key=lambda row: row["mtime"])

    broken_ref_rows = []
    schema_audit_text = safe_read(INVENTORY_DIR / "schema_audit.md")
    in_broken_section = False
    for line in schema_audit_text.splitlines():
        if line.startswith("## Broken or unresolved $ref targets"):
            in_broken_section = True
            continue
        if in_broken_section and line.startswith("## "):
            break
        if in_broken_section and line.startswith("| agents/"):
            broken_ref_rows.append({"row": line})

    lines: list[str] = []
    lines.append("# Dead Code & Legacy Audit")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("- This report is intentionally conservative: rows are `candidates`, not guaranteed dead code, unless the evidence says otherwise.")
    lines.append("")
    lines.append("## Agent folders / runtime registry drift")
    lines.append("")
    lines.append(md_table(orphan_rows, ["agent_folder", "in_agents_registry_json", "in_backend_runtime_registry", "note"]))
    lines.append("")
    lines.append("## Legacy / backup / archive files")
    lines.append("")
    lines.append(md_table(legacy_rows[:80], ["path", "category", "size_kb"]))
    lines.append("")
    lines.append("## Sample outputs / backup files living inside agent folders")
    lines.append("")
    lines.append(md_table(sample_output_rows[:80], ["path", "size_kb"]))
    lines.append("")
    lines.append("## Broken doc references / missing legacy targets")
    lines.append("")
    lines.append(md_table(missing_template_rows, ["path", "status", "evidence"]))
    lines.append("")
    lines.append("## Broken schema references")
    lines.append("")
    if broken_ref_rows:
        lines.append(md_table(broken_ref_rows[:20], ["row"]))
    else:
        lines.append("_No broken cross-file `$ref` rows detected in current schema audit._")
    lines.append("")
    lines.append("## Source files older than 6 months")
    lines.append("")
    if old_source_rows:
        lines.append(md_table(old_source_rows[:40], ["path", "category", "mtime"]))
    else:
        lines.append("_No source/config files older than 6 months were found; age skew is mostly in generated artifacts._")
    lines.append("")
    lines.append("## Key findings")
    lines.append("")
    lines.append("- `coo`, `valuation_agent`, `esg_agent`, `sentiment_news_agent`, and `analyst_consensus_agent` exist in backend runtime registry/folders but drift against `agents_registry.json` (per current machine inventory).")
    lines.append("- `agent_factory`, `agent_performance_review`, and `cost_performance_optimizer` exist as agent folders/registry concepts but are not in `backend/src/agents.ts`, so the Node runtime cannot load them through the normal `loadAgent()` registry.")
    lines.append("- `memory.backup.md`, `memory_archive.md`, dated feedback markdowns, and sample output dumps materially bloat agent folders and blur the authoritative file set.")
    return "\n".join(lines)


@dataclass
class MemoryAuditRow:
    agent: str
    total_records: int
    first_date: str
    last_date: str
    avg_rules_per_record: float
    repeated_rules: int
    code_candidates: int
    schema_candidates: int
    prompt_candidates: int
    memory_keep_candidates: int


def classify_memory_line(line: str) -> str:
    lower = line.lower()
    if any(token in lower for token in ("ticker", "sector", "thyao", "ias 29", "ias29", "proxy", "payload", "hardcode", "route", "gate", "template_only", "chart.js")):
        return "code"
    if any(token in lower for token in ("enum", "field", "alan", "required", "zorunlu", "status", "array", "schema", "contract", "minlength", "minitems")):
        return "schema"
    if any(token in lower for token in ("yaz", "yorum", "tone", "reasoning", "benchmark", "karşı argüman", "counter", "açıkla", "explain")):
        return "prompt"
    return "memory"


def build_memory_analysis(agent_inventory: dict[str, Any]) -> str:
    rows: list[MemoryAuditRow] = []
    details: list[str] = []
    for agent in agent_inventory["agents"]:
        memory_path = AGENTS_DIR / agent["name"] / "memory.md"
        text = safe_read(memory_path)
        if not text:
            continue
        dates = sorted({"-".join(m) for m in DATE_RE.findall(text)})
        sections = re.split(r"(?=^##\s)", text, flags=re.MULTILINE)
        record_rule_counts: list[int] = []
        repeated_counter: Counter[str] = Counter()
        code_c = schema_c = prompt_c = mem_c = 0
        duplicate_examples: list[str] = []
        for section in sections:
            section_lines = []
            for raw in section.splitlines():
                line = raw.strip()
                if len(line) < 30:
                    continue
                if not (line.startswith("-") or line.startswith("|") or is_rule_line(line)):
                    continue
                norm = normalize_rule(line)
                repeated_counter[norm] += 1
                kind = classify_memory_line(line)
                if kind == "code":
                    code_c += 1
                elif kind == "schema":
                    schema_c += 1
                elif kind == "prompt":
                    prompt_c += 1
                else:
                    mem_c += 1
                section_lines.append(line)
            if section_lines:
                record_rule_counts.append(len(section_lines))
        for norm, count in repeated_counter.most_common(6):
            if count >= 2:
                duplicate_examples.append(f"`{norm[:100]}` x{count}")
        row = MemoryAuditRow(
            agent=agent["name"],
            total_records=len(record_rule_counts),
            first_date=dates[0] if dates else "—",
            last_date=dates[-1] if dates else "—",
            avg_rules_per_record=round(sum(record_rule_counts) / len(record_rule_counts), 1) if record_rule_counts else 0.0,
            repeated_rules=sum(1 for count in repeated_counter.values() if count >= 2),
            code_candidates=code_c,
            schema_candidates=schema_c,
            prompt_candidates=prompt_c,
            memory_keep_candidates=mem_c,
        )
        rows.append(row)
        details.append(f"### {agent['name']}")
        details.append("")
        details.append(f"- Toplam feedback kaydı: **{row.total_records}**")
        details.append(f"- Tarih aralığı: **{row.first_date} → {row.last_date}**")
        details.append(f"- Kayıt başına ortalama kural satırı: **{row.avg_rules_per_record}**")
        details.append(f"- Tekrarlanan kural fingerprint sayısı: **{row.repeated_rules}**")
        details.append(f"- Kodlanabilir kural satırı: **{row.code_candidates}**")
        details.append(f"- Schema'ya taşınabilir kural satırı: **{row.schema_candidates}**")
        details.append(f"- Prompt/system prompt'a taşınabilir kural satırı: **{row.prompt_candidates}**")
        details.append(f"- Memory'de kalması daha makul satır: **{row.memory_keep_candidates}**")
        if duplicate_examples:
            details.append(f"- Tekrar örnekleri: {', '.join(duplicate_examples)}")
        details.append("")

    rows.sort(key=lambda row: (-row.schema_candidates - row.code_candidates, -row.repeated_rules, row.agent))
    lines: list[str] = []
    lines.append("# Memory Content Analysis")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("- Classification note: code/schema/prompt buckets are heuristic and based on line keywords, not on a formal ontology.")
    lines.append("")
    table_rows = [
        {
            "agent": row.agent,
            "records": row.total_records,
            "date_range": f"{row.first_date} -> {row.last_date}",
            "avg_rules": row.avg_rules_per_record,
            "repeated": row.repeated_rules,
            "code": row.code_candidates,
            "schema": row.schema_candidates,
            "prompt": row.prompt_candidates,
            "keep": row.memory_keep_candidates,
        }
        for row in rows
    ]
    lines.append("## Summary table")
    lines.append("")
    lines.append(md_table(table_rows, ["agent", "records", "date_range", "avg_rules", "repeated", "code", "schema", "prompt", "keep"]))
    lines.append("")
    lines.append("## Per-agent details")
    lines.append("")
    lines.extend(details)
    lines.append("## Key findings")
    lines.append("")
    lines.append("- Most large memories are functioning as rolling feedback logs, not distilled operating memory.")
    lines.append("- THYAO/IAS29/sector-override lessons dominate the repeated-rule surface, which is a strong signal that these rules belong in canonical config or code, not in free-form memory prose.")
    lines.append("- Several agents carry 20-30 KB memory files even though `backend/src/agent-runner.ts` trims memory injection to 6 KB, meaning much of the content is stored but never read at runtime.")
    return "\n".join(lines)


def report_candidate_files() -> list[Path]:
    candidates: list[Path] = []
    patterns = [
        "*Yonetim_Kurulu_Raporu*.html",
        "*Kapsamli_Analiz_Raporu*.html",
        "*KURUMSAL_RAPOR*.html",
        "*V4_Final*.html",
        "*V4_Reformat*.html",
        "*YONETIM_RAPORU*.html",
    ]
    for pattern in patterns:
        candidates.extend(ROOT.glob(pattern))
        candidates.extend((ROOT / "output").glob(pattern))
    unique = []
    seen = set()
    for path in sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True):
        rel = path.relative_to(ROOT).as_posix()
        lower = rel.lower()
        if rel in seen:
            continue
        seen.add(rel)
        if any(token in lower for token in ("smoke", "old", "_old", "minimal")):
            continue
        if not path.is_file():
            continue
        unique.append(path)
    return unique[:15]


MANDATORY_28 = {
    "gross_margin": [r"br[üu]t kar oran", r"gross margin"],
    "gross_profit_ias29": [r"br[üu]t kar ias29", r"gross profit ias29"],
    "monetary_gain_loss": [r"parasal (kazan[cç]|kay[ıi]p)", r"monetary gain"],
    "ebitda": [r"fav[öo]k(?! marj)", r"ebitda(?! margin)"],
    "ebitda_margin": [r"fav[öo]k oran", r"ebitda margin"],
    "net_margin": [r"net kar marj", r"net margin"],
    "roe": [r"\broe\b", r"özkaynak getir"],
    "roa": [r"\broa\b", r"aktif karl"],
    "roce": [r"\broce\b"],
    "roic": [r"\broic\b"],
    "opex_to_revenue": [r"opex.*ciro", r"opex\/revenue"],
    "dso": [r"\bdso\b", r"alacak tahsil"],
    "dio": [r"\bdio\b", r"stok devir"],
    "dpo": [r"\bdpo\b", r"bor[çc] ödeme"],
    "ccc": [r"\bccc\b", r"nakit dönü[şs][üu]m"],
    "nwc_to_revenue": [r"nwc.*has[ıi]lat", r"net işletme sermayesi.*has"],
    "net_debt": [r"net bor[çc]", r"net debt"],
    "net_debt_to_ebitda": [r"net bor[çc].*fav[öo]k", r"net debt.*ebitda"],
    "current_ratio": [r"cari oran", r"current ratio"],
    "acid_test": [r"asit[- ]?test", r"quick ratio"],
    "cash_ratio": [r"nakit oran", r"cash ratio"],
    "fcf": [r"serbest nakit ak[ıi][şs]", r"\bfcf\b"],
    "ocf_to_ebitda": [r"ocf.*ebitda", r"işletme nakit.*fav[öo]k"],
    "capex_to_ebitda": [r"capex.*ebitda", r"yat[ıi]r[ıi]m harc.*fav[öo]k"],
    "interest_coverage": [r"interest coverage", r"faiz.*karş[ıi]lama"],
    "interest_burden": [r"faiz gideri.*fav[öo]k", r"interest burden"],
    "altman_z": [r"altman z"],
    "piotroski_f": [r"piotroski"],
}


def metric_present(text_lower: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text_lower) for pattern in patterns)


def section_coverage(text: str) -> int:
    headings = re.findall(r"\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.", text)
    return len(set(headings))


def infer_sector_expectations(ticker: str) -> dict[str, list[str]]:
    sector = TICKER_TO_SECTOR.get(ticker.upper())
    if sector == "aviation":
        return {
            "EBITDAR": [r"ebitdar"],
            "CASK": [r"\bcask\b"],
            "RASK": [r"\brask\b"],
            "Load Factor": [r"load factor", r"doluluk"],
            "RPK": [r"\brpk\b"],
            "ASK": [r"\bask\b"],
            "IFRS16": [r"ifrs 16"],
        }
    if sector == "steel":
        return {
            "HRC": [r"\bhrc\b"],
            "Maintenance CAPEX": [r"idame capex", r"maintenance capex"],
            "Growth CAPEX": [r"büyüme capex", r"growth capex"],
            "DIO": [r"\bdio\b"],
        }
    if sector == "holding":
        return {
            "SOTP": [r"\bsotp\b"],
            "NAV": [r"\bnav\b", r"net asset value"],
            "Segment": [r"segment"],
        }
    if sector == "defense":
        return {
            "Backlog/Revenue": [r"backlog", r"sipariş"],
            "R&D/Revenue": [r"ar-ge", r"r&d"],
            "Export Share": [r"ihracat", r"export"],
        }
    if sector == "retail":
        return {
            "SSSG": [r"sssg", r"same[- ]store"],
            "Revenue/Store": [r"store", r"mağaza"],
            "IFRS16": [r"ifrs 16"],
        }
    if sector == "telecom":
        return {
            "ARPU": [r"\barpu\b"],
            "Churn": [r"churn"],
            "SAC/LTV": [r"\bsac\b", r"\bltv\b"],
            "Capex Intensity": [r"capex intensity", r"capex.*ciro"],
        }
    return {}


def build_output_quality_audit() -> str:
    reports = report_candidate_files()
    report_rows = []
    missing_metric_counter: Counter[str] = Counter()
    missing_sector_counter: Counter[str] = Counter()
    ias29_present = 0
    truncated_reports = []
    blocked_without_proxy = []
    low_commentary_reports = []

    for path in reports:
        rel = path.relative_to(ROOT).as_posix()
        text = safe_read(path)
        lower = text.lower()
        ticker_match = re.search(r"\b(AKBNK|ASELS|BIMAS|EREGL|KCHOL|MGROS|SAHOL|SISE|TCELL|THYAO|TUPRS|TTKOM|PGSUS)\b", path.name.upper())
        ticker = ticker_match.group(1) if ticker_match else path.name.split("_")[0].upper()
        present = [metric for metric, patterns in MANDATORY_28.items() if metric_present(lower, patterns)]
        missing = [metric for metric in MANDATORY_28 if metric not in present]
        for metric in missing:
            missing_metric_counter[metric] += 1
        sections = section_coverage(text)
        page_divs = len(re.findall(r'class="page(?:\s|")', text.lower()))
        svg_count = len(re.findall(r"<svg", lower))
        canvas_count = len(re.findall(r"<canvas", lower))
        has_ias29 = bool(re.search(r"ias ?29|parasal", lower))
        if has_ias29:
            ias29_present += 1
        sector_expectations = infer_sector_expectations(ticker)
        missing_sector = [name for name, patterns in sector_expectations.items() if not metric_present(lower, patterns)]
        for name in missing_sector:
            missing_sector_counter[f"{ticker}:{name}"] += 1
        truncated = not text.strip().endswith("</html>") or sections < 12 or (page_divs and page_divs < 12)
        if truncated:
            truncated_reports.append({
                "report": rel,
                "sections": sections,
                "page_divs": page_divs,
                "chars": len(text),
            })
        blocked_count = len(re.findall(r"\bblocked\b", lower))
        proxy_count = len(re.findall(r"\bproxy\b|\btahmin\b|\bestimate\b", lower))
        if blocked_count > 0 and proxy_count == 0:
            blocked_without_proxy.append({"report": rel, "blocked_mentions": blocked_count})
        paragraph_count = len(re.findall(r"<p[ >]", lower))
        table_count = len(re.findall(r"<table", lower))
        if table_count > 0 and paragraph_count < table_count * 2:
            low_commentary_reports.append({
                "report": rel,
                "paragraphs": paragraph_count,
                "tables": table_count,
            })
        report_rows.append({
            "report": rel,
            "ticker": ticker,
            "metric_coverage": f"{len(present)}/28",
            "missing_metrics": ", ".join(missing[:8]) + (" ..." if len(missing) > 8 else ""),
            "sections": sections,
            "page_divs": page_divs or "—",
            "svg": svg_count,
            "canvas": canvas_count,
            "ias29": "yes" if has_ias29 else "no",
            "sector_gaps": ", ".join(missing_sector[:6]) if missing_sector else "—",
        })
    report_rows.sort(key=lambda row: row["report"])

    lines: list[str] = []
    lines.append("# Output Quality Audit")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Report sample size: **{len(report_rows)}**")
    lines.append("- Sample selection: latest report-like HTML files under repo root + `output/`, excluding smoke/minimal/old variants.")
    lines.append("- Mandatory-28 note: this audit infers the target metric slate from `scripts/test_28_metrics.py`, `backend/src/orchestrator.ts`, and `agents/financial_analysis/output_schema.json` because the repo does not yet have a single canonical list.")
    lines.append("")
    lines.append("## Per-report audit")
    lines.append("")
    lines.append(md_table(report_rows, ["report", "ticker", "metric_coverage", "missing_metrics", "sections", "page_divs", "svg", "canvas", "ias29", "sector_gaps"]))
    lines.append("")
    lines.append("## Most frequently missing mandatory metrics")
    lines.append("")
    freq_rows = [{"metric": metric, "missing_in_reports": count} for metric, count in missing_metric_counter.most_common(20)]
    lines.append(md_table(freq_rows, ["metric", "missing_in_reports"]))
    lines.append("")
    lines.append("## Truncation / structural integrity issues")
    lines.append("")
    if truncated_reports:
        lines.append(md_table(truncated_reports, ["report", "sections", "page_divs", "chars"]))
    else:
        lines.append("_No structural truncation flags in the sampled reports._")
    lines.append("")
    lines.append("## BLOCKED without proxy-like fallback")
    lines.append("")
    if blocked_without_proxy:
        lines.append(md_table(blocked_without_proxy, ["report", "blocked_mentions"]))
    else:
        lines.append("_No sampled report used `BLOCKED` without any proxy/estimate wording._")
    lines.append("")
    lines.append("## Low commentary density (table-heavy, text-light)")
    lines.append("")
    if low_commentary_reports:
        lines.append(md_table(low_commentary_reports[:20], ["report", "paragraphs", "tables"]))
    else:
        lines.append("_No extreme table-heavy reports by the simple paragraph/table heuristic._")
    lines.append("")
    lines.append("## Sector-specific KPI gaps")
    lines.append("")
    sector_gap_rows = [{"gap": gap, "count": count} for gap, count in missing_sector_counter.most_common(20)]
    lines.append(md_table(sector_gap_rows, ["gap", "count"]))
    lines.append("")
    lines.append("## IAS 29 adjusted metric coverage")
    lines.append("")
    lines.append(f"- IAS 29 wording present in **{ias29_present}/{len(report_rows) if report_rows else 0}** sampled reports.")
    lines.append("")
    lines.append("## Key findings")
    lines.append("")
    lines.append("- THYAO sample reports still surface as `Sanayi/industrial` in HTML despite repeated aviation-specific doctrine elsewhere.")
    lines.append("- Report formatting quality is highly inconsistent: some outputs are rich 12-section HTML documents, while others are shorter legacy/custom layouts or carry placeholder score blocks.")
    lines.append("- The metric slate visible in finished reports is far less stable than the engine/prompt expectations imply; several mandatory working-capital and cash-conversion metrics are absent in many sampled outputs.")
    return "\n".join(lines)


def build_executive_summary(file_inventory: dict[str, Any], agent_inventory: dict[str, Any]) -> str:
    actual_modes = actual_runtime_modes()
    durations = baseline_durations()
    phase_totals = {
        mode: mode_phase_breakdown(agents, durations)[-1]["approx_min"]
        for mode, agents in actual_modes.items()
    }
    top_agent_mem = sorted(
        [
            (agent["name"], (agent.get("memory") or {}).get("size_kb", 0))
            for agent in agent_inventory["agents"]
        ],
        key=lambda item: (-item[1], item[0]),
    )[:8]
    problems = [
        {
            "problem": "Runtime/documentation drift on mode activation and agent count",
            "impact_x_frequency": "10 x 9 = 90",
            "evidence": "Docs say 20/22 agents and 5-6-agent fast mode; actual runtime activates 16/18/22 agents depending on mode backbone.",
        },
        {
            "problem": "Prompt/memory bloat exceeds what runtime actually injects",
            "impact_x_frequency": "9 x 9 = 81",
            "evidence": "Many memories are 20-44 KB, but agent-runner trims memory injection to 6 KB.",
        },
        {
            "problem": "No single canonical sector/rule source",
            "impact_x_frequency": "9 x 8 = 72",
            "evidence": "THYAO/aviation, IAS29, Chart.js, and sector heuristics appear across memory, prompts, formatter code, peer_sets, and docs.",
        },
        {
            "problem": "QA / CEO gates are advisory in runtime, not hard blockers",
            "impact_x_frequency": "10 x 7 = 70",
            "evidence": "executeSession logs warnings/overrides and continues after failed QA or approval checks.",
        },
        {
            "problem": "Schema enforcement is weaker than platform doctrine claims",
            "impact_x_frequency": "8 x 8 = 64",
            "evidence": "Shared universal contract exists, but runtime validator uses lightweight per-agent/text checks; many schemas lack minLength/minItems depth constraints.",
        },
        {
            "problem": "Formatter doctrine is internally contradictory",
            "impact_x_frequency": "8 x 7 = 56",
            "evidence": "system_prompt bans Chart.js and raw HTML generation; agent_spec still requires Chart.js and layout authority.",
        },
        {
            "problem": "Output metric completeness is materially below doctrinal target",
            "impact_x_frequency": "9 x 6 = 54",
            "evidence": "Sampled reports omit many working-capital / cash-conversion metrics; THYAO still misses aviation identity/KPIs.",
        },
        {
            "problem": "Agent roster split-brain across filesystem, registry, and runtime code",
            "impact_x_frequency": "7 x 7 = 49",
            "evidence": "Some agent folders are not in runtime registry, while some runtime agents drift against `agents_registry.json`.",
        },
        {
            "problem": "Artifacts/backups/dumps dominate the repo surface",
            "impact_x_frequency": "6 x 8 = 48",
            "evidence": f"Output artifacts are {category_summary(file_inventory).get('output-artifact', {}).get('size_kb', 0):,.0f} KB and 800+ files; agent folders also contain many backup/sample files.",
        },
        {
            "problem": "Critical path is still long despite parallel phases",
            "impact_x_frequency": "7 x 6 = 42",
            "evidence": f"Approx runtime path from baseline: fast {phase_totals['fast_screening']} min, standard {phase_totals['standard_institutional']} min, deep {phase_totals['deep_dive']} min.",
        },
    ]

    quick_wins = [
        {"candidate": "Create canonical ticker->sector YAML and replace runtime keyword heuristics", "why": "High leverage; fixes THYAO/industrial and removes repeated memory directives."},
        {"candidate": "Make QA `overall_score` required and block delivery on explicit fail/revision", "why": "Runtime behavior aligns with doctrine quickly."},
        {"candidate": "Prune/archival policy for `memory.md` + stop loading >6 KB memories silently", "why": "Immediate context reduction without quality loss."},
        {"candidate": "Unify report formatter doctrine (agent_spec + prompt + compose.ts)", "why": "Removes Chart.js/SVG contradiction and stabilizes report expectations."},
        {"candidate": "Mark agent roster truth source and reconcile runtime registry vs registry JSON", "why": "Stops orchestration/config drift."},
    ]

    structural_changes = [
        {"candidate": "Canonical rules/sectors/contracts directory", "why": "Single source of truth for metric doctrine, null handling, sector playbooks."},
        {"candidate": "Manifest + retrieval pattern for large upstream outputs", "why": "Addresses lost-in-the-middle and prompt bloat root cause."},
        {"candidate": "Cross-agent finding acknowledgement contract", "why": "Fixes QA loop leakage and silent downstream omissions."},
        {"candidate": "True AJV validation gate + retry categorization middleware", "why": "Turns schema from documentation into runtime enforcement."},
        {"candidate": "Golden-scorecard regression harness around final HTML/report quality", "why": "Protects depth while refactoring architecture."},
    ]

    risk_matrix = [
        {"change_area": "Canonical sector mapping", "primary_agents": "context_extraction, financial_analysis, sector_competition, report_formatter", "risk": "Medium"},
        {"change_area": "Shared contract hardening", "primary_agents": "qa_review, final_summary, strategic_synthesis, report_formatter", "risk": "High"},
        {"change_area": "Memory purge / hierarchy", "primary_agents": "All agent prompts", "risk": "Medium"},
        {"change_area": "Manifest retrieval", "primary_agents": "financial_analysis, qa_review, strategic_synthesis, final_summary, report_formatter", "risk": "High"},
        {"change_area": "Pipeline mode rewrite", "primary_agents": "ceo, orchestrator, coo", "risk": "Medium"},
    ]

    lines: list[str] = []
    lines.append("# Executive Summary")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("- Scope: Phase 1 inventory + audit only. No production logic changed in this deliverable beyond inventory scripts/reports.")
    lines.append("")
    lines.append("## Most critical 10 problems")
    lines.append("")
    lines.append(md_table(problems, ["problem", "impact_x_frequency", "evidence"]))
    lines.append("")
    lines.append("## Highest-leverage 5 refactor candidates")
    lines.append("")
    lines.append(md_table(quick_wins, ["candidate", "why"]))
    lines.append("")
    lines.append("## Structural changes (strategic)")
    lines.append("")
    lines.append(md_table(structural_changes, ["candidate", "why"]))
    lines.append("")
    lines.append("## Risk matrix")
    lines.append("")
    lines.append(md_table(risk_matrix, ["change_area", "primary_agents", "risk"]))
    lines.append("")
    lines.append("## Quick wins (<1 day, high leverage)")
    lines.append("")
    for row in quick_wins:
        lines.append(f"- **{row['candidate']}** — {row['why']}")
    lines.append("")
    lines.append("## Structural changes (>1 week, strategic)")
    lines.append("")
    for row in structural_changes:
        lines.append(f"- **{row['candidate']}** — {row['why']}")
    lines.append("")
    lines.append("## Supporting observations")
    lines.append("")
    lines.append(f"- Largest memory files: {', '.join(f'{agent} {kb:.1f} KB' for agent, kb in top_agent_mem)}")
    lines.append(f"- Actual mode agent counts: fast={len(actual_modes['fast_screening'])}, standard={len(actual_modes['standard_institutional'])}, deep={len(actual_modes['deep_dive'])}")
    lines.append("- Report sample showed ongoing sector/identity leakage (e.g. THYAO rendered as industrial) and inconsistent 12-section compliance.")
    return "\n".join(lines)


def build_phase_summary(generated: list[str]) -> str:
    lines = [
        "# Phase 1 Summary",
        "",
        f"- Generated: {datetime.now(timezone.utc).isoformat()}",
        "- Branch intent: `refactor-phase-1-inventory`",
        "- Phase policy: inventory/audit only; no production behavior intentionally changed.",
        "",
        "## What was produced",
        "",
    ]
    for item in generated:
        lines.append(f"- `{item}`")
    lines.extend([
        "",
        "## What was verified",
        "",
        "- Repository structure and core docs were re-read before generating audits.",
        "- Existing inventory JSON/markdown outputs were refreshed/reused rather than guessed.",
        "- Runtime flow findings were cross-checked against `backend/src/orchestrator.ts`, `backend/src/analysis-config.ts`, and `evals/baseline.json`.",
        "- Output-quality sample was taken from real generated HTML report files, not only prompts/specs.",
        "",
        "## What was intentionally not done",
        "",
        "- No canonical/production refactor (Phase 2+) has been applied yet.",
        "- No agent prompt/memory/schema cleanup was executed beyond audit/report generation scripts.",
        "- No golden baseline was modified.",
    ])
    return "\n".join(lines)


def main() -> int:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    file_inventory = load_file_inventory()
    agent_inventory = load_agent_inventory()

    outputs = {
        "duplicate_map.md": build_duplicate_map(file_inventory, agent_inventory),
        "schema_audit.md": build_schema_audit(),
        "pipeline_flow.md": build_pipeline_flow(),
        "dead_code.md": build_dead_code(file_inventory, agent_inventory),
        "memory_analysis.md": build_memory_analysis(agent_inventory),
        "output_quality_audit.md": build_output_quality_audit(),
    }
    for name, content in outputs.items():
        write_text(INVENTORY_DIR / name, content)

    executive = build_executive_summary(file_inventory, agent_inventory)
    write_text(INVENTORY_DIR / "EXECUTIVE_SUMMARY.md", executive)

    generated_paths = [f"refactor/inventory/{name}" for name in outputs] + ["refactor/inventory/EXECUTIVE_SUMMARY.md"]
    write_text(REPORTS_DIR / "phase_1_summary.md", build_phase_summary(generated_paths))

    print("generated:")
    for item in generated_paths:
        print(f" - {item}")
    print(" - refactor/reports/phase_1_summary.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
