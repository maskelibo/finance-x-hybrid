#!/usr/bin/env python3
"""
Finance X — Golden Test Eval Runner

Bir session'daki agent çıktılarını golden markers'a karşı değerlendirir.

Kullanım:
  python3 evals/run-eval.py <session_id>
  python3 evals/run-eval.py --all          (tüm golden session'ları değerlendir)
  python3 evals/run-eval.py --latest       (son completed session)
"""

from __future__ import annotations

import sqlite3
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# -------------------------------------------------------------------
# Paths
# -------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
DB_PATH = ROOT / "backend" / "data" / "financex.db"
MARKERS_DIR = SCRIPT_DIR / "golden" / "markers"
RESULTS_DIR = SCRIPT_DIR / "results"
BASELINE_PATH = SCRIPT_DIR / "baseline.json"


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def load_markers(agent_id: str) -> dict | None:
    p = MARKERS_DIR / f"{agent_id}.json"
    if not p.exists():
        return None
    with open(p) as f:
        return json.load(f)


def load_baseline() -> dict | None:
    if not BASELINE_PATH.exists():
        return None
    with open(BASELINE_PATH) as f:
        return json.load(f)


def count_case_insensitive(text: str, keyword: str) -> int:
    return text.lower().count(keyword.lower())


def evaluate_agent(agent_id, output_text, tokens_used, cost_usd, duration_ms, status, markers, baseline):
    text = output_text or ""

    # Required metrics
    required_found = [m for m in markers["required_metrics"] if count_case_insensitive(text, m) > 0]
    required_missing = [m for m in markers["required_metrics"] if count_case_insensitive(text, m) == 0]
    total_req = len(markers["required_metrics"])
    quality_ratio = len(required_found) / total_req if total_req > 0 else 1.0

    # Optional
    optional_found = [m for m in markers.get("optional_metrics", []) if count_case_insensitive(text, m) > 0]

    # Sections
    sections_found = [s for s in markers.get("required_sections", []) if count_case_insensitive(text, s) > 0]
    sections_missing = [s for s in markers.get("required_sections", []) if count_case_insensitive(text, s) == 0]

    # Source tags
    source_tag_count = sum(count_case_insensitive(text, tag) for tag in markers.get("source_tags", []))

    # Forbidden
    forbidden_found = [p for p in markers.get("forbidden_patterns", []) if count_case_insensitive(text, p) > 0]
    warning_found = [p for p in markers.get("warning_patterns", []) if count_case_insensitive(text, p) > 0]

    # Length
    min_len = markers.get("min_output_length", 0)
    length_ok = len(text) >= min_len

    # Baseline comparison
    agent_baseline = (baseline or {}).get("agents", {}).get(agent_id, {})
    avg_tokens = agent_baseline.get("avg_tokens")
    avg_cost = agent_baseline.get("avg_cost")
    avg_duration = agent_baseline.get("avg_duration_ms")

    return {
        "agent_id": agent_id,
        "status": status,
        "output_length": len(text),
        "tokens_used": tokens_used or 0,
        "cost_usd": cost_usd or 0,
        "duration_ms": duration_ms or 0,
        "quality_ratio": round(quality_ratio, 3),
        "required_found": required_found,
        "required_missing": required_missing,
        "optional_found": optional_found,
        "sections_found": sections_found,
        "sections_missing": sections_missing,
        "source_tag_count": source_tag_count,
        "forbidden_found": forbidden_found,
        "warning_found": warning_found,
        "length_ok": length_ok,
        "token_vs_baseline": round(tokens_used / avg_tokens, 2) if avg_tokens else None,
        "cost_vs_baseline": round(cost_usd / avg_cost, 2) if avg_cost else None,
        "duration_vs_baseline": round(duration_ms / avg_duration, 2) if avg_duration else None,
    }


def evaluate_session(conn, session_id, baseline):
    cur = conn.execute("SELECT * FROM analysis_sessions WHERE id = ?", (session_id,))
    cols = [d[0] for d in cur.description]
    row = cur.fetchone()
    if not row:
        raise ValueError(f"Session not found: {session_id}")
    session = dict(zip(cols, row))

    runs = conn.execute(
        "SELECT agent_id, status, output_text, tokens_used, cost_usd, duration_ms "
        "FROM agent_runs WHERE session_id = ? ORDER BY rowid",
        (session_id,),
    ).fetchall()

    agent_results = []
    total_quality = 0.0
    quality_count = 0

    for r in runs:
        agent_id, status, output_text, tokens_used, cost_usd, duration_ms = r
        markers = load_markers(agent_id)
        if not markers:
            continue

        result = evaluate_agent(agent_id, output_text, tokens_used, cost_usd, duration_ms, status, markers, baseline)
        agent_results.append(result)
        total_quality += result["quality_ratio"]
        quality_count += 1

    overall_quality = total_quality / quality_count if quality_count > 0 else 0

    regression_detected = any(a["quality_ratio"] < 0.75 for a in agent_results)

    sess_baseline = (baseline or {}).get("session_totals", {})
    avg_cost = sess_baseline.get("avg_cost_per_session")
    avg_tokens = sess_baseline.get("avg_tokens_per_session")

    total_cost = session.get("total_cost_usd") or 0
    total_tokens = session.get("total_tokens") or 0

    return {
        "session_id": session_id,
        "ticker": session["ticker"],
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
        "total_cost": total_cost,
        "total_tokens": total_tokens,
        "cost_vs_baseline": round(total_cost / avg_cost, 2) if avg_cost else None,
        "tokens_vs_baseline": round(total_tokens / avg_tokens, 2) if avg_tokens else None,
        "agents": agent_results,
        "summary": {
            "agents_evaluated": len(agent_results),
            "agents_passed": sum(1 for a in agent_results if a["quality_ratio"] >= 0.90 and not a["forbidden_found"] and a["length_ok"]),
            "agents_warned": sum(1 for a in agent_results if (0.75 <= a["quality_ratio"] < 0.90) or a["warning_found"]),
            "agents_failed": sum(1 for a in agent_results if a["quality_ratio"] < 0.75 or a["forbidden_found"] or not a["length_ok"]),
            "overall_quality_ratio": round(overall_quality, 3),
            "total_forbidden_found": sum(len(a["forbidden_found"]) for a in agent_results),
            "regression_detected": regression_detected,
        },
    }


def print_report(result):
    s = result["summary"]
    print(f"\n{'='*70}")
    print(f"EVAL REPORT — {result['ticker']} ({result['session_id'][:12]}...)")
    print(f"{'='*70}")
    print(f"Cost: ${result['total_cost']:.2f} (vs baseline: {result['cost_vs_baseline'] or '?'}x)")
    print(f"Tokens: {result['total_tokens']:,} (vs baseline: {result['tokens_vs_baseline'] or '?'}x)")
    print(f"Overall quality: {s['overall_quality_ratio']*100:.1f}%")
    print(f"Agents: {s['agents_passed']} PASS / {s['agents_warned']} WARN / {s['agents_failed']} FAIL (of {s['agents_evaluated']})")
    if s["total_forbidden_found"] > 0:
        print(f"  Forbidden patterns found: {s['total_forbidden_found']}")
    if s["regression_detected"]:
        print(f"  REGRESSION DETECTED")

    print(f"\n{'─'*70}")
    print(f"{'Agent':<24} {'Quality':<9} {'Len':<8} {'Tokens':<8} {'Cost':<8} Status")
    print(f"{'─'*70}")

    for a in result["agents"]:
        q = f"{a['quality_ratio']*100:.0f}%"
        ln = f"{a['output_length']/1000:.0f}K" + ("" if a["length_ok"] else " X")
        tok = f"{a['tokens_used']/1000:.0f}K"
        cost = f"${a['cost_usd']:.2f}"

        icon = "PASS"
        if a["quality_ratio"] < 0.75 or a["forbidden_found"] or not a["length_ok"]:
            icon = "FAIL"
        elif a["quality_ratio"] < 0.90 or a["warning_found"]:
            icon = "WARN"

        extra = ""
        if a["required_missing"]:
            extra += f" [eksik: {', '.join(a['required_missing'])}]"
        if a["forbidden_found"]:
            extra += f" [YASAK: {', '.join(a['forbidden_found'])}]"

        print(f"{a['agent_id']:<24} {q:<9} {ln:<8} {tok:<8} {cost:<8} {icon}{extra}")

    print(f"{'─'*70}\n")


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: python3 evals/run-eval.py <session_id | --all | --latest>")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    baseline = load_baseline()

    session_ids = []

    if args[0] == "--all":
        golden = baseline.get("golden_sessions", []) if baseline else []
        session_ids = [s.split(":")[1] for s in golden]
    elif args[0] == "--latest":
        row = conn.execute(
            "SELECT id FROM analysis_sessions WHERE status = 'completed' ORDER BY started_at DESC LIMIT 1"
        ).fetchone()
        if row:
            session_ids = [row[0]]
    else:
        session_ids = [args[0]]

    if not session_ids:
        print("No sessions to evaluate")
        sys.exit(1)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    for sid in session_ids:
        try:
            result = evaluate_session(conn, sid, baseline)
            print_report(result)

            out_path = RESULTS_DIR / f"{result['ticker']}_{sid[:12]}.json"
            with open(out_path, "w") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"Result saved: {out_path}")
        except Exception as e:
            print(f"Error evaluating {sid}: {e}")

    conn.close()


if __name__ == "__main__":
    main()
