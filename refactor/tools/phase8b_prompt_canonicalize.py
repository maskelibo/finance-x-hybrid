#!/usr/bin/env python3
"""
Phase 8B — Prompt Canonicalization (REFACTOR_BRIEF.md §3.1)

Amaç: her analitik agent'ın system_prompt.md başına bir
"Authoritative Sources" bloğu ekle. Blok canonical/ altındaki
doğruluk kaynağı dosyalara referans verir. Mevcut içerik SİLİNMEZ
— sadece üstüne bir referans bloğu eklenir (additive, düşük riskli).

Brief §3.1:
- Agent'lar artık rule'ları kendi prompt'unda DUPLICATE etmez
- Canonical'ı SINGLE SOURCE OF TRUTH kabul eder
- Recent Learnings → memory.md'den inject edilmeye devam (Phase 8A'dan)

Idempotent: aynı blok varsa atlanır.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "agents"

# Analytical agents — canonical references anlamlı. Utility agent'lara eklemiyoruz.
ANALYTICAL_AGENTS = {
    "ceo", "coo",
    "financial_analysis", "valuation_agent", "reconciliation",
    "context_extraction", "parse_standardization", "data_collection",
    "sector_competition", "macro_analysis", "technical_analysis",
    "sentiment_news_agent", "analyst_consensus_agent", "esg_agent",
    "event_classification", "event_impact_mapper", "event_timeline_alert",
    "kap_watch",
    "qa_review", "strategic_synthesis", "final_summary",
    "report_formatter",
    "agent_performance_review",
}

BLOCK_MARKER = "<!-- PHASE_8B_CANONICAL_REFS -->"

CANONICAL_BLOCK = f"""
{BLOCK_MARKER}
## AUTHORITATIVE SOURCES — canonical/ (DO NOT DUPLICATE RULES BELOW)

Bu agent aşağıdaki canonical dosyaları **SINGLE SOURCE OF TRUTH** kabul eder.
Çelişki olursa canonical kazanır. Yeni bir kural eklemek gerekiyorsa önce
canonical/'ı güncelle, sonra burayı.

- **Ticker → sektör mapping (hardcode):** `canonical/tickers/sector_mapping.yaml`
- **Zorunlu metrikler + formüller + sektör varyantları:** `canonical/rules/mandatory_metrics.yaml`
- **Null handling protokolü:** `canonical/rules/null_handling_protocol.md`
- **Confidence taksonomisi (HIGH/MEDIUM/LOW/BLOCKED):** `canonical/rules/confidence_taxonomy.md`
- **Output integrity (truncation/metrics array):** `canonical/rules/output_integrity.md`
- **IAS 29 protokolü:** `canonical/rules/ias29_protocol.md`
- **Sektör playbook (9 sektör):** `canonical/sectors/<sector>.yaml` (sector = ticker mapping'den gelir)
- **Agent I/O kontratları:** `canonical/contracts/agent_io_contracts.yaml`
- **Pipeline mode tanımları:** `canonical/contracts/pipeline_modes.yaml`
- **Glossary / terimler:** `canonical/glossary/terms.md`, `canonical/glossary/abbreviations.md`

**Kural hiyerarşisi (çelişirse üst kazanır):**
1. Global rules (`canonical/rules/*`)
2. Sector playbook (`canonical/sectors/<sector>.yaml`)
3. Bu system prompt (agent-specific execution detayı)
4. memory.md (son dersler, max 2KB — Phase 8A'dan itibaren)

Aşağıdaki içerikte canonical ile çelişen bir talimat görürsen **canonical'ı kullan**
ve bu dosyanın ilgili bölümünü `refactor/reports/additional_findings.md`'ye bildir.
{BLOCK_MARKER}
"""


def splice_block(text: str) -> tuple[str, bool]:
    """Return (new_text, was_inserted). Idempotent — marker varsa atla."""
    if BLOCK_MARKER in text:
        return text, False

    lines = text.splitlines(keepends=True)
    insert_idx = 0
    in_code = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        if stripped.startswith("#") and insert_idx == 0:
            insert_idx = i + 1
            continue
        if stripped.startswith("##") and insert_idx > 0:
            insert_idx = i
            break

    new_lines = lines[:insert_idx] + [CANONICAL_BLOCK, "\n"] + lines[insert_idx:]
    return "".join(new_lines), True


def main() -> int:
    touched = 0
    skipped = 0
    skipped_non_analytical = 0
    missing = 0
    header = f"{'agent':<32}{'status':<14}{'size_before':>12}{'size_after':>12}"
    print(header)
    print("-" * len(header))
    for agent_dir in sorted(AGENTS_DIR.iterdir()):
        if not agent_dir.is_dir():
            continue
        agent = agent_dir.name
        prompt = agent_dir / "system_prompt.md"
        if not prompt.exists():
            missing += 1
            print(f"{agent:<32}{'NO PROMPT':<14}{'-':>12}{'-':>12}")
            continue
        if agent not in ANALYTICAL_AGENTS:
            skipped_non_analytical += 1
            print(f"{agent:<32}{'SKIP util':<14}{'-':>12}{'-':>12}")
            continue
        text = prompt.read_text(encoding="utf-8")
        before = len(text.splitlines())
        new_text, inserted = splice_block(text)
        after = len(new_text.splitlines())
        if inserted:
            prompt.write_text(new_text, encoding="utf-8")
            touched += 1
            status = "INSERTED"
        else:
            skipped += 1
            status = "already-has"
        print(f"{agent:<32}{status:<14}{before:>12}{after:>12}")
    print("-" * len(header))
    print(f"Touched: {touched}  |  Skipped (idempotent): {skipped}  |  Utility skipped: {skipped_non_analytical}  |  Missing: {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
