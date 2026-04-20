"""
Canonical loader — Python side.

Small read-only library that other parts of the stack (agents, scripts,
regression harness, orchestrator hybrids) consult to resolve:

  * ticker → sector
  * metric id → definition
  * sector id → playbook
  * runtime mode → activation list
  * agent id → IO contract

No runtime agent currently imports this module. Phase 3 will replace
prose lookups with loader calls. Phase 2 only proves the lookups work.

Usage:
    from canonical._loader.python.loader import Canonical
    c = Canonical()
    c.get_sector("THYAO")            # → "aviation"
    c.get_sector_playbook("THYAO")   # → full yaml dict for aviation
    c.get_metric("MM-07")            # → mandatory_metrics entry
    c.get_mode_activation("fast_screening")  # → list[str] of agent_ids

CLI:
    python canonical/_loader/python/loader.py --ticker THYAO
    python canonical/_loader/python/loader.py --metric MM-07
    python canonical/_loader/python/loader.py --mode fast_screening
    python canonical/_loader/python/loader.py --selftest
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as e:
    raise SystemExit("canonical loader requires pyyaml: pip install pyyaml") from e

# Resolve canonical root relative to this file.
CANONICAL_ROOT = Path(__file__).resolve().parents[2]    # .../canonical/
TICKER_MAPPING = CANONICAL_ROOT / "tickers" / "sector_mapping.yaml"
MANDATORY_METRICS = CANONICAL_ROOT / "rules" / "mandatory_metrics.yaml"
PIPELINE_MODES = CANONICAL_ROOT / "contracts" / "pipeline_modes.yaml"
AGENT_CONTRACTS = CANONICAL_ROOT / "contracts" / "agent_io_contracts.yaml"
SECTORS_DIR = CANONICAL_ROOT / "sectors"


class Canonical:
    """Read-only accessor over the canonical/ folder."""

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root) if root else CANONICAL_ROOT
        self._ticker = _load_yaml(self.root / "tickers" / "sector_mapping.yaml")
        self._metrics = _load_yaml(self.root / "rules" / "mandatory_metrics.yaml")
        self._modes = _load_yaml(self.root / "contracts" / "pipeline_modes.yaml")
        self._agents = _load_yaml(self.root / "contracts" / "agent_io_contracts.yaml")

    # ── ticker ────────────────────────────────────────────────────────
    def get_sector(self, ticker: str) -> str | None:
        """Return the canonical sector id for `ticker`, or None if unclassified."""
        row = (self._ticker.get("mappings") or {}).get(ticker.upper())
        return row.get("sector") if row else None

    def is_classified(self, ticker: str) -> bool:
        return self.get_sector(ticker) is not None

    def get_ticker_playbook_path(self, ticker: str) -> str | None:
        row = (self._ticker.get("mappings") or {}).get(ticker.upper())
        return row.get("playbook") if row else None

    def get_sector_playbook(self, ticker_or_sector: str) -> dict | None:
        """
        Accepts either a ticker (e.g. "THYAO") or a sector id (e.g. "aviation").
        Returns the parsed YAML of the sector playbook.
        """
        key = ticker_or_sector.upper()
        row = (self._ticker.get("mappings") or {}).get(key)
        playbook_rel: str | None = None
        if row and row.get("playbook"):
            playbook_rel = row["playbook"]
        else:
            # Treat input as sector id.
            candidate = SECTORS_DIR / f"{ticker_or_sector}.yaml"
            if candidate.is_file():
                playbook_rel = candidate.relative_to(CANONICAL_ROOT.parent).as_posix()
        if not playbook_rel:
            return None
        path = CANONICAL_ROOT.parent / playbook_rel
        return _load_yaml(path)

    # ── metrics ───────────────────────────────────────────────────────
    def list_metrics(self) -> list[str]:
        return list((self._metrics.get("metrics") or {}).keys())

    def get_metric(self, metric_id: str) -> dict | None:
        return (self._metrics.get("metrics") or {}).get(metric_id)

    def interpretation_depth(self) -> dict:
        return self._metrics.get("interpretation_depth") or {}

    # ── modes ─────────────────────────────────────────────────────────
    def get_mode_activation(self, mode_id: str) -> list[str]:
        mode = (self._modes.get("modes") or {}).get(mode_id)
        if not mode:
            return []
        return list(mode.get("activated_agents") or [])

    def get_mode_parallel_groups(self, mode_id: str) -> list[list[str]]:
        mode = (self._modes.get("modes") or {}).get(mode_id)
        if not mode:
            return []
        return list(mode.get("parallelizable_groups") or [])

    def get_extended_thinking_agents(self, mode_id: str) -> list[str]:
        mode = (self._modes.get("modes") or {}).get(mode_id)
        if not mode:
            return []
        return list(mode.get("extended_thinking") or [])

    # ── agents ────────────────────────────────────────────────────────
    def get_agent_contract(self, agent_id: str) -> dict | None:
        return (self._agents.get("agents") or {}).get(agent_id)

    def list_agents(self) -> list[str]:
        return list((self._agents.get("agents") or {}).keys())


@lru_cache(maxsize=128)
def _load_yaml(path: Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _selftest() -> int:
    """Run exhaustive cross-checks across canonical/ and return 0/2."""
    c = Canonical()
    failures: list[str] = []

    def check(name: str, got: Any, want: Any) -> None:
        if got == want:
            print(f"OK   {name}: {got!r}")
        else:
            print(f"FAIL {name}: got {got!r}, want {want!r}")
            failures.append(name)

    def soft(name: str, ok: bool, detail: str = "") -> None:
        if ok:
            print(f"OK   {name}")
        else:
            print(f"FAIL {name}: {detail}")
            failures.append(name)

    # ── Basic ticker → sector ────────────────────────────────────────
    check("sector THYAO", c.get_sector("THYAO"), "aviation")
    check("sector TUPRS", c.get_sector("TUPRS"), "energy_refining")
    check("sector KCHOL", c.get_sector("KCHOL"), "holding")
    check("sector EREGL", c.get_sector("EREGL"), "steel")
    check("sector ASELS", c.get_sector("ASELS"), "defense")
    check("sector TCELL", c.get_sector("TCELL"), "telecom")
    check("sector BIMAS", c.get_sector("BIMAS"), "retail")
    check("sector AKBNK", c.get_sector("AKBNK"), "banking")
    check("unclassified UNKNOWN", c.is_classified("UNKNOWN"), False)

    # ── Sector playbook resolution ──────────────────────────────────
    pb = c.get_sector_playbook("THYAO") or {}
    check("THYAO playbook sector_id", pb.get("sector_id"), "aviation")

    # ── Metric catalog ──────────────────────────────────────────────
    check("metric count", len(c.list_metrics()), 28)
    m = c.get_metric("MM-07") or {}
    check("MM-07 name_en", m.get("name_en"), "EBITDA")

    # ── Modes ───────────────────────────────────────────────────────
    fs = c.get_mode_activation("fast_screening")
    check("fast_screening agent count", len(fs), 16)
    deep = c.get_mode_activation("deep_dive")
    check("deep_dive agent count", len(deep), 22)

    contract = c.get_agent_contract("financial_analysis") or {}
    check("financial_analysis group", contract.get("group"), "specialist")

    # ── Cross-check: every ticker in sector_mapping.yaml has a
    # playbook file on disk (or is explicitly pointed at industrial_generic).
    mappings = (c._ticker.get("mappings") or {})
    for ticker, row in mappings.items():
        playbook_rel = row.get("playbook")
        soft(
            f"playbook for {ticker} exists on disk",
            playbook_rel is None or (c.root.parent / playbook_rel).is_file(),
            detail=f"playbook path: {playbook_rel!r}",
        )

    # ── Cross-check: every agent listed in pipeline_modes is present in
    # agent_io_contracts.
    all_canonical_agents = set(c.list_agents())
    for mode_id in (c._modes.get("modes") or {}).keys():
        for aid in c.get_mode_activation(mode_id):
            soft(
                f"mode {mode_id} agent {aid} declared in agent_io_contracts",
                aid in all_canonical_agents,
                detail=f"{aid} not found in canonical/contracts/agent_io_contracts.yaml",
            )

    # ── Cross-check: every metric id declared in interpretation_depth is
    # in the 28 catalog (or is a literal field label).
    depth_fields = c.interpretation_depth()
    expected_fields = {"observation", "reasoning", "counterargument", "implication"}
    soft(
        "interpretation_depth fields present",
        expected_fields.issubset(depth_fields.keys()),
        detail=f"expected {expected_fields}, got {set(depth_fields.keys())}",
    )

    # ── Cross-check: sector_mapping references match registry agents.
    # (sector_mapping has `related_canonical_rules` naming SR-* ids; we
    # don't resolve them here, but we assert the SR- prefix convention.)
    for srid in (c._ticker.get("related_canonical_rules") or []):
        soft(
            f"canonical rule id format {srid}",
            bool(re.match(r"^(SR-|MM-|NH-|CT-|OI-|IAS29-|TM-)", srid)),
            detail=f"{srid} does not match canonical id prefix convention",
        )

    print(f"\nselftest: {'OK' if not failures else f'{len(failures)} failures'}")
    return 0 if not failures else 2


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker", help="Print resolved sector for a ticker.")
    ap.add_argument("--metric", help="Print mandatory metric definition by id.")
    ap.add_argument("--mode", help="Print agent activation for a runtime mode.")
    ap.add_argument("--agent", help="Print IO contract for an agent id.")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        return _selftest()

    c = Canonical()
    if args.ticker:
        print(json.dumps({
            "ticker": args.ticker.upper(),
            "sector": c.get_sector(args.ticker),
            "playbook": c.get_ticker_playbook_path(args.ticker),
        }, indent=2, ensure_ascii=False))
        return 0
    if args.metric:
        print(json.dumps(c.get_metric(args.metric) or {}, indent=2, ensure_ascii=False))
        return 0
    if args.mode:
        print(json.dumps({
            "mode": args.mode,
            "agents": c.get_mode_activation(args.mode),
            "parallel_groups": c.get_mode_parallel_groups(args.mode),
            "extended_thinking": c.get_extended_thinking_agents(args.mode),
        }, indent=2, ensure_ascii=False))
        return 0
    if args.agent:
        print(json.dumps(c.get_agent_contract(args.agent) or {}, indent=2, ensure_ascii=False))
        return 0

    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
