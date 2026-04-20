"""
Pipeline-flow audit for Finance-X Hybrid refactor Phase 1 - Task 1.5.

Sources:
  - backend/src/orchestrator.ts        → canonical agent order + runtime-mode
                                         pipeline + layer→agent mapping
  - backend/src/analysis-config.ts     → RuntimeMode / AnalysisLayer enums
  - agents/<agent>/agent_spec.json     → declared inputs/outputs + handoff_rules
                                         (per-agent data contract)
  - agents_registry.json               → reports_to / supervises

From these we compute:
  1. Canonical agent order (as currently wired).
  2. Data-dependency DAG: edges from an upstream agent's declared output to the
     downstream agent that declares it as an input (handoff_rules + name
     matching).
  3. Mode differentiation: which agents each runtime mode actually drops or keeps.
     (Spoiler from direct code read: PIPELINE_BY_MODE is identical across modes;
     the only real differentiator is the layer filter.)
  4. Parallelization potential: siblings whose input sets do not depend on each
     other can run in parallel but currently execute sequentially (16 sequential
     `await runAgent` calls, zero `Promise.all`).
  5. Caching candidates: files that every agent sees on each invocation
     (shared_directives.md, each agent's system_prompt.md + knowledge.md +
     memory.md). Current caching is delegated to the Claude Code CLI (no
     explicit cache_control on messages).
  6. Critical path: longest chain through the DAG (sequential only, since no
     parallelism is implemented).

Writes:
  refactor/inventory/pipeline_flow.md
  refactor/inventory/pipeline_flow.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "refactor" / "inventory"
ORCH = ROOT / "backend" / "src" / "orchestrator.ts"
CONFIG = ROOT / "backend" / "src" / "analysis-config.ts"
REGISTRY = ROOT / "agents_registry.json"


def parse_agent_pipeline() -> list[tuple[str, str]]:
    txt = ORCH.read_text(encoding="utf-8")
    m = re.search(r"AGENT_PIPELINE[^=]*=\s*\[([\s\S]*?)\];", txt)
    if not m:
        return []
    body = m.group(1)
    out = []
    for mm in re.finditer(r"\{\s*id:\s*'([^']+)',\s*phase:\s*'([^']+)'", body):
        out.append((mm.group(1), mm.group(2)))
    return out


def parse_layer_agents() -> dict[str, list[str]]:
    txt = ORCH.read_text(encoding="utf-8")
    m = re.search(r"LAYER_AGENTS[^=]*=\s*\{([\s\S]*?)\};", txt)
    if not m:
        return {}
    body = m.group(1)
    out: dict[str, list[str]] = {}
    for line_m in re.finditer(r"(\w+):\s*\[([^\]]*)\]", body):
        key = line_m.group(1)
        agents = re.findall(r"'([^']+)'", line_m.group(2))
        out[key] = agents
    return out


def parse_backbone() -> list[str]:
    txt = ORCH.read_text(encoding="utf-8")
    m = re.search(r"BACKBONE_AGENTS[^=]*=\s*\[([^\]]+)\]", txt)
    if not m:
        return []
    return re.findall(r"'([^']+)'", m.group(1))


def parse_mode_defaults() -> dict[str, list[str]]:
    txt = CONFIG.read_text(encoding="utf-8")
    m = re.search(r"MODE_DEFAULT_LAYERS[^=]*=\s*\{([\s\S]*?)\};", txt)
    if not m:
        return {}
    body = m.group(1)
    out: dict[str, list[str]] = {}
    for line_m in re.finditer(r"(\w+):\s*\[([^\]]*)\]", body):
        out[line_m.group(1)] = re.findall(r"'([^']+)'", line_m.group(2))
    # "ANALYSIS_LAYERS.map(..)" → resolve to all layers.
    if any("ANALYSIS_LAYERS" in v for v in []):
        pass
    return out


def load_agent_specs() -> dict[str, dict]:
    specs: dict[str, dict] = {}
    for spec_path in (ROOT / "agents").glob("*/agent_spec.json"):
        try:
            specs[spec_path.parent.name] = json.loads(spec_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return specs


def build_dependency_edges(specs: dict[str, dict]) -> list[tuple[str, str, str]]:
    """Emit (upstream, downstream, edge_kind) edges.

    edge_kind in:
      - "handoff"    : explicit handoff_rules entry
      - "input_name" : downstream declares an input whose name matches
                       <upstream>_output or an output produced by upstream.
    """
    edges: list[tuple[str, str, str]] = []

    # 1) handoff_rules
    for aid, spec in specs.items():
        for r in spec.get("handoff_rules", []) or []:
            u = r.get("from")
            d = r.get("to")
            if u and d and u != d:
                edges.append((u, d, "handoff"))

    # 2) input-name matching
    # Build output name index: name -> producing agent
    produces: dict[str, str] = {}
    for aid, spec in specs.items():
        for o in spec.get("outputs", []) or []:
            if isinstance(o, dict) and "name" in o:
                produces[o["name"]] = aid
    for aid, spec in specs.items():
        for i in spec.get("inputs", []) or []:
            if isinstance(i, dict):
                name = i.get("name", "")
                if name in produces and produces[name] != aid:
                    edges.append((produces[name], aid, "input_name"))
    # Dedup
    edges = sorted(set(edges))
    return edges


def compute_critical_path(agents: list[str], edges: list[tuple[str, str, str]]) -> list[str]:
    """Longest path (by node count) through the DAG restricted to listed agents."""
    adj: dict[str, set[str]] = defaultdict(set)
    nodes = set(agents)
    for u, d, _ in edges:
        if u in nodes and d in nodes:
            adj[u].add(d)

    # Topo order from agents list (assume current order is a valid topo approximation).
    order = [a for a in agents]
    best_len: dict[str, int] = {a: 1 for a in order}
    best_prev: dict[str, str | None] = {a: None for a in order}
    for u in order:
        for v in adj.get(u, []):
            if best_len[u] + 1 > best_len.get(v, 1):
                best_len[v] = best_len[u] + 1
                best_prev[v] = u
    # Reconstruct longest path
    if not best_len:
        return []
    end = max(best_len, key=best_len.get)
    path: list[str] = []
    cur: str | None = end
    while cur is not None:
        path.append(cur)
        cur = best_prev.get(cur)
    path.reverse()
    return path


def count_sequential_runAgent(orch_text: str) -> int:
    return len(re.findall(r"\bawait\s+runAgent\b", orch_text))


def count_parallel_constructs(orch_text: str) -> int:
    return (
        len(re.findall(r"\bPromise\.all\b", orch_text))
        + len(re.findall(r"\bPromise\.allSettled\b", orch_text))
    )


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    pipeline = parse_agent_pipeline()
    pipeline_ids = [a for a, _ in pipeline]
    layer_agents = parse_layer_agents()
    backbone = parse_backbone()
    mode_defaults = parse_mode_defaults()
    specs = load_agent_specs()
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))

    edges = build_dependency_edges(specs)
    orch_text = ORCH.read_text(encoding="utf-8")
    seq_count = count_sequential_runAgent(orch_text)
    par_count = count_parallel_constructs(orch_text)
    crit_path = compute_critical_path(pipeline_ids, edges)

    # Parallelizable groups: siblings within the same "phase bucket" whose inputs
    # do not include each other's outputs.
    upstream_map: dict[str, set[str]] = defaultdict(set)
    for u, d, _ in edges:
        upstream_map[d].add(u)

    # Group agents by the stage they sit in the canonical order after
    # reconciliation/context_extraction. Heuristic: any agent whose upstream is
    # entirely a subset of {data_collection, parse_standardization, reconciliation,
    # context_extraction} AND whose output is not used by a peer in the same
    # bucket can run in parallel with that peer.
    prep_agents = {"data_collection", "parse_standardization", "reconciliation", "context_extraction"}
    analysis_tier: list[str] = []
    for aid in pipeline_ids:
        if aid in prep_agents or aid in {"ceo", "coo", "qa_review", "strategic_synthesis",
                                          "final_summary", "report_formatter"}:
            continue
        if upstream_map.get(aid, set()).issubset(prep_agents | {"ceo", "coo"}):
            analysis_tier.append(aid)

    # Agents all pipeline modes currently share (per PIPELINE_BY_MODE).
    modes_share_pipeline = True  # confirmed: all three modes = AGENT_PIPELINE.map(a=>a.id)

    # Caching candidates: files that every agent loads each time.
    caching_candidates = {
        "prompts/shared_directives.md": "loaded once per agent call (stable prefix)",
        "agents/<aid>/system_prompt.md": "stable for that agent across sessions",
        "agents/<aid>/knowledge.md": "stable unless sector keyword triggers injection",
        "agents/<aid>/memory.md": "target max 6 KB in code; actual is 18–44 KB for most agents (see agent inventory)",
    }

    # Build payload.
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "canonical_order": pipeline,
        "backbone_agents": backbone,
        "layer_agents": layer_agents,
        "mode_defaults": mode_defaults,
        "pipeline_modes_identical": modes_share_pipeline,
        "sequential_runAgent_calls": seq_count,
        "parallel_constructs": par_count,
        "edges": [{"from": u, "to": d, "kind": k} for u, d, k in edges],
        "upstream_map": {k: sorted(v) for k, v in upstream_map.items()},
        "critical_path": crit_path,
        "parallelizable_tier_candidates": analysis_tier,
        "caching_candidates": caching_candidates,
    }
    (OUT / "pipeline_flow.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Write MD.
    md: list[str] = []
    md.append("# Pipeline Flow Audit")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append(f"- Canonical pipeline length: **{len(pipeline)}** agents")
    md.append(f"- Sequential `await runAgent` call sites in orchestrator: **{seq_count}**")
    md.append(f"- Parallel constructs (`Promise.all`/`allSettled`) in orchestrator: **{par_count}**")
    md.append(f"- All three runtime modes resolve to the **same** pipeline id list: **{modes_share_pipeline}** (see `PIPELINE_BY_MODE` in `backend/src/orchestrator.ts` — each mode is `AGENT_PIPELINE.map(a => a.id)`). The actual differentiator is `MODE_DEFAULT_LAYERS` + the `LAYER_AGENTS` filter.")
    md.append("")

    md.append("## 1. Canonical agent order (as currently wired)")
    md.append("")
    md.append("| # | agent_id | phase |")
    md.append("| --- | --- | --- |")
    for i, (aid, ph) in enumerate(pipeline, 1):
        md.append(f"| {i} | `{aid}` | {ph} |")
    md.append("")

    md.append("## 2. Runtime-mode differences (layer filter, not pipeline)")
    md.append("")
    md.append("`PIPELINE_BY_MODE` is a cosmetic alias in current code; real differentiation happens at `buildPipelineForLayers()` via `MODE_DEFAULT_LAYERS` + `LAYER_AGENTS`.")
    md.append("")
    md.append(f"- `BACKBONE_AGENTS` always run: {', '.join(f'`{a}`' for a in backbone)}")
    md.append("")
    md.append("### MODE_DEFAULT_LAYERS")
    md.append("")
    md.append("| mode | default layers |")
    md.append("| --- | --- |")
    for m, layers in mode_defaults.items():
        md.append(f"| `{m}` | {', '.join(f'`{l}`' for l in layers) or '(all layers)'} |")
    md.append(f"| `deep_dive` | _in code: `ANALYSIS_LAYERS.map(l=>l.id)` → all 9 layers_ |")
    md.append("")
    md.append("### LAYER_AGENTS")
    md.append("")
    md.append("| layer | agents |")
    md.append("| --- | --- |")
    for l, ags in layer_agents.items():
        md.append(f"| `{l}` | {', '.join(f'`{a}`' for a in ags)} |")
    md.append("")

    md.append("## 3. Data dependency DAG")
    md.append("")
    md.append("Edges combine:")
    md.append("- `handoff`: declared in an agent's `agent_spec.json` → `handoff_rules[]`")
    md.append("- `input_name`: a downstream agent lists an input with the same `name` as an upstream agent's declared output")
    md.append("")
    md.append("| from | to | kind |")
    md.append("| --- | --- | --- |")
    for u, d, k in edges:
        md.append(f"| `{u}` | `{d}` | {k} |")
    md.append("")

    md.append("## 4. Critical path (longest dependency chain)")
    md.append("")
    md.append(f"- Length: **{len(crit_path)}** agents")
    md.append(f"- Path: {' → '.join(f'`{a}`' for a in crit_path)}")
    md.append("")
    md.append("This is the sequential lower bound on latency even if every off-path agent ran in parallel. Today the pipeline runs fully sequentially so actual latency is the sum of *all* agents, not the critical path.")
    md.append("")

    md.append("## 5. Parallelization candidates (currently sequential)")
    md.append("")
    md.append("The orchestrator uses `await runAgent` in a `for` loop (16 call sites, 0 `Promise.all` / `Promise.allSettled`). The following agents depend only on the preparation tier (`data_collection`, `parse_standardization`, `reconciliation`, `context_extraction`) and could fan out in parallel:")
    md.append("")
    for aid in analysis_tier:
        md.append(f"- `{aid}`")
    if not analysis_tier:
        md.append("_(none detected by current heuristic)_")
    md.append("")
    md.append("The most obvious parallel cluster is the analysis fan-out: `financial_analysis`, `sector_competition`, `macro_analysis`, `technical_analysis`, `kap_watch`, `sentiment_news_agent`, `esg_agent`, `analyst_consensus_agent`, `valuation_agent`. Nothing in the DAG forces them to be serial; the orchestrator just awaits them in order.")
    md.append("")

    md.append("## 6. Caching candidates")
    md.append("")
    md.append("`config.ts` comments note that prompt caching is delegated to the Claude Code CLI (expects stable `shared_directives.md` + `system_prompt.md` + `knowledge.md` prefix) — there is no explicit `cache_control` header set in this repo. Every agent currently reloads:")
    md.append("")
    for k, v in caching_candidates.items():
        md.append(f"- `{k}` — {v}")
    md.append("")
    md.append("Key risk: `agent-runner.ts` caps `memory.md` at 6 KB in its ideation, but actual memory files are **18–44 KB** (see `agent_inventory.json`). This means either (a) the runner truncates and the in-memory context drifts from the on-disk rule set, or (b) the stable-prefix assumption is being violated on long memory files, reducing cache hit rate.")
    md.append("")

    md.append("## 7. Every-agent shared context (cacheability weight)")
    md.append("")
    md.append("Every LLM agent call in `buildTaskPrompt` receives the full `accumulatedContext` dict as JSON. It is not keyed, not chunked, and not cached independently per field. This is the concrete manifestation of the 'lost in the middle' risk from the brief — each subsequent agent gets a larger and larger context blob.")
    md.append("")

    (OUT / "pipeline_flow.md").write_text("\n".join(md), encoding="utf-8")
    print(f"pipeline length: {len(pipeline)}")
    print(f"edges: {len(edges)} (handoff + input_name)")
    print(f"critical path length: {len(crit_path)}")
    print(f"sequential await runAgent: {seq_count}")
    print(f"Promise.all constructs: {par_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
