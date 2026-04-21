"""
Canonical structure test — Phase 10A regression harness extension.

Deterministic structural audit of the canonical/ layer. Ensures every file
we rely on as a single source of truth carries the keys / anchors the rest
of the refactor (Phases 3A, 4A, 5A, 6A, 7A) takes as given.

Checks:
  1. canonical/rules/mandatory_metrics.yaml has 28 metrics MM-01..MM-28
  2. canonical/rules/output_integrity.md has anchors OI-001..OI-008
  3. canonical/rules/null_handling_protocol.md has NH-001..NH-006
  4. canonical/rules/confidence_taxonomy.md has CT-001..CT-006
  5. canonical/rules/ias29_protocol.md has IAS29-001..IAS29-006
  6. Every canonical/sectors/*.yaml has: sector_id, tickers, primary_metrics
  7. canonical/contracts/pipeline_modes.yaml has fast_screening /
     standard_institutional / deep_dive modes
  8. canonical/contracts/agent_io_contracts.yaml lists all runtime agents

Exits 0 if every invariant holds, 2 otherwise. Safe to rerun — pure read.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    print("ERROR: PyYAML not installed. pip install pyyaml")
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[2]
CANONICAL = ROOT / "canonical"


def check_mandatory_metrics() -> list[str]:
    path = CANONICAL / "rules" / "mandatory_metrics.yaml"
    issues: list[str] = []
    if not path.is_file():
        return [f"missing: {path.relative_to(ROOT)}"]
    doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(doc, dict) or "metrics" not in doc:
        return [f"{path.relative_to(ROOT)}: top-level 'metrics:' block missing"]
    metrics = doc["metrics"]
    # Accept either list-of-objects (each with id) or mapping keyed by id.
    ids: set[str] = set()
    if isinstance(metrics, dict):
        ids = {k for k in metrics.keys() if isinstance(k, str)}
    elif isinstance(metrics, list):
        ids = {m.get("id") for m in metrics if isinstance(m, dict) and m.get("id")}
    else:
        return [f"{path.relative_to(ROOT)}: 'metrics' must be mapping or list"]
    expected = {f"MM-{i:02d}" for i in range(1, 29)}
    missing = sorted(expected - ids)
    if missing:
        issues.append(f"mandatory_metrics: missing ids {missing}")
    extra = sorted(ids - expected)
    if extra:
        issues.append(f"mandatory_metrics: unexpected ids {extra}")
    return issues


def check_rule_anchors(path_rel: str, anchor_prefix: str, count: int) -> list[str]:
    path = ROOT / path_rel
    issues: list[str] = []
    if not path.is_file():
        return [f"missing: {path_rel}"]
    text = path.read_text(encoding="utf-8")
    expected = [f"{anchor_prefix}-{i:03d}" for i in range(1, count + 1)]
    for anchor in expected:
        if anchor not in text:
            issues.append(f"{path_rel}: anchor {anchor} not found")
    return issues


def check_output_integrity() -> list[str]:
    path_rel = "canonical/rules/output_integrity.md"
    path = ROOT / path_rel
    issues: list[str] = []
    if not path.is_file():
        return [f"missing: {path_rel}"]
    text = path.read_text(encoding="utf-8")
    for anchor in [f"OI-{i:03d}" for i in range(1, 9)]:
        if anchor not in text:
            issues.append(f"{path_rel}: anchor {anchor} not found")
    return issues


def check_sector_playbooks() -> list[str]:
    issues: list[str] = []
    sectors_dir = CANONICAL / "sectors"
    if not sectors_dir.is_dir():
        return [f"missing: canonical/sectors/"]
    for yaml_path in sorted(sectors_dir.glob("*.yaml")):
        try:
            doc = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        except yaml.YAMLError as e:
            issues.append(f"{yaml_path.relative_to(ROOT)}: YAML parse error: {e}")
            continue
        if not isinstance(doc, dict):
            issues.append(f"{yaml_path.relative_to(ROOT)}: top-level must be a mapping")
            continue
        rel = yaml_path.relative_to(ROOT)
        for required_key in ("sector_id", "tickers", "primary_metrics"):
            if required_key not in doc:
                issues.append(f"{rel}: missing required key '{required_key}'")
        # tickers must be a list of BIST symbols. industrial_generic is a
        # documented fallback playbook that keeps tickers: [] intentionally.
        tickers = doc.get("tickers")
        sector_id_str = doc.get("sector_id")
        is_fallback = sector_id_str == "industrial_generic"
        if not isinstance(tickers, list):
            issues.append(f"{rel}: 'tickers' must be a list")
        elif not tickers and not is_fallback:
            issues.append(f"{rel}: 'tickers' is empty (only industrial_generic may be empty)")
        elif tickers and not all(isinstance(t, str) and re.match(r"^[A-Z]{3,6}$", t) for t in tickers):
            issues.append(f"{rel}: 'tickers' entries must match ^[A-Z]{{3,6}}$")
        # sector_id must match file stem (modulo underscores/dashes)
        sector_id = doc.get("sector_id")
        if isinstance(sector_id, str):
            expected_stem = yaml_path.stem
            if sector_id != expected_stem:
                issues.append(f"{rel}: sector_id={sector_id!r} does not match file stem {expected_stem!r}")
    return issues


def check_pipeline_modes() -> list[str]:
    path_rel = "canonical/contracts/pipeline_modes.yaml"
    path = ROOT / path_rel
    if not path.is_file():
        return [f"missing: {path_rel}"]
    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        return [f"{path_rel}: YAML parse error: {e}"]
    issues: list[str] = []
    if not isinstance(doc, dict):
        return [f"{path_rel}: top-level must be a mapping"]
    modes = doc.get("modes") if "modes" in doc else doc
    required_modes = {"fast_screening", "standard_institutional", "deep_dive"}
    found = set(modes.keys()) if isinstance(modes, dict) else set()
    missing = required_modes - found
    if missing:
        issues.append(f"{path_rel}: missing modes {sorted(missing)}")
    return issues


def check_agent_io_contracts() -> list[str]:
    path_rel = "canonical/contracts/agent_io_contracts.yaml"
    path = ROOT / path_rel
    if not path.is_file():
        return [f"missing: {path_rel}"]
    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        return [f"{path_rel}: YAML parse error: {e}"]
    issues: list[str] = []
    # Expect one of: dict with 'agents:' mapping (canonical convention),
    # dict with 'agents:' list-of-{agent_id}, or flat dict keyed by agent_id.
    agent_ids: set[str] = set()
    if isinstance(doc, dict):
        if "agents" in doc and isinstance(doc["agents"], dict):
            agent_ids = {str(k) for k in doc["agents"].keys() if isinstance(k, str)}
        elif "agents" in doc and isinstance(doc["agents"], list):
            for entry in doc["agents"]:
                if isinstance(entry, dict) and "agent_id" in entry:
                    agent_ids.add(str(entry["agent_id"]))
        else:
            # Flat mapping; exclude top-level metadata keys.
            skip = {"schema_version", "registry_source_of_truth", "legacy_registries", "generated", "catalog_size"}
            agent_ids = {k for k in doc.keys() if isinstance(k, str) and k not in skip}
    # Minimum core backbone agents we expect.
    required = {"ceo", "coo", "data_collection", "parse_standardization",
                "reconciliation", "context_extraction", "financial_analysis",
                "qa_review", "strategic_synthesis", "final_summary",
                "report_formatter"}
    missing = required - agent_ids
    if missing:
        issues.append(f"{path_rel}: missing core agents {sorted(missing)}")
    return issues


def main() -> int:
    all_issues: list[str] = []
    all_issues += check_mandatory_metrics()
    all_issues += check_rule_anchors("canonical/rules/null_handling_protocol.md", "NH", 6)
    all_issues += check_rule_anchors("canonical/rules/confidence_taxonomy.md", "CT", 6)
    all_issues += check_rule_anchors("canonical/rules/ias29_protocol.md", "IAS29", 6)
    all_issues += check_output_integrity()
    all_issues += check_sector_playbooks()
    all_issues += check_pipeline_modes()
    all_issues += check_agent_io_contracts()

    if not all_issues:
        print("canonical structure: OK")
        return 0

    print(f"canonical structure: {len(all_issues)} issue(s):")
    for issue in all_issues:
        print(f"  - {issue}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
