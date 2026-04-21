#!/usr/bin/env python3
"""
Phase 8A Memory Purge (REFACTOR_BRIEF.md §3.2)

Amaç: her agent'ın memory.md dosyasını inceleyip,
- Kalıcı kuralları (## Kalıcı Kurallar / Zorunlu Kontrol / Operasyonel) koru
- En son 3 tarihli feedback bölümünü koru (son dersler)
- Daha eski tarihli bölümleri memory_archive.md'ye taşı

Idempotent: tekrar çalıştırılabilir, aynı sonucu verir.
Observe-only değil — dosya yazar. Öncesinde tar backup alınması gerekli.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "agents"

PERMANENT_PATTERNS = [
    r"^## Kal[ıi]c[ıi] Kurallar",
    r"^## Zorunlu Kontrol Listesi",
    r"^## Operasyonel Kontrol",
    r"^## Agent Performans",
    r"^## Son 3 Raporun",
    r"^## Reasoning",
    r"^## Role",
    r"^## Authoritative",
    r"^## Execution",
    r"^## Mandatory",
    r"^## Permanent",
    r"^## Core ",
    r"^## Recent Learnings",
    r"^## Pre-Flight",
]
PERMANENT_RE = re.compile("|".join(PERMANENT_PATTERNS), re.IGNORECASE)

DATE_IN_HEADER = re.compile(r"(20\d{2})-(\d{2})-(\d{2})")


@dataclass
class Section:
    header: str
    body_lines: list[str]
    date: datetime | None  # None = not dated (permanent)
    is_permanent: bool

    @property
    def content(self) -> str:
        return self.header + "\n" + "\n".join(self.body_lines)

    @property
    def line_count(self) -> int:
        return 1 + len(self.body_lines)


def parse_sections(text: str) -> tuple[str, list[Section]]:
    """Split memory.md into preamble + sections.
    Preamble = everything before the first '## ' line."""
    lines = text.splitlines()
    preamble_lines: list[str] = []
    idx = 0
    while idx < len(lines) and not lines[idx].startswith("## "):
        preamble_lines.append(lines[idx])
        idx += 1

    sections: list[Section] = []
    current: list[str] | None = None
    header: str | None = None
    for i in range(idx, len(lines)):
        line = lines[i]
        if line.startswith("## "):
            if header is not None:
                sections.append(_build_section(header, current or []))
            header = line
            current = []
        else:
            if current is not None:
                current.append(line)
    if header is not None:
        sections.append(_build_section(header, current or []))

    preamble = "\n".join(preamble_lines).rstrip()
    return preamble, sections


def _build_section(header: str, body_lines: list[str]) -> Section:
    is_permanent = bool(PERMANENT_RE.search(header))
    m = DATE_IN_HEADER.search(header)
    date = None
    if m:
        try:
            date = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            date = None
    body_lines = list(body_lines)
    while body_lines and body_lines[-1].strip() == "":
        body_lines.pop()
    return Section(header=header, body_lines=body_lines, date=date, is_permanent=is_permanent)


def purge(memory_path: Path, keep_recent_dated: int = 3) -> tuple[int, int, int, int]:
    """Return (original_lines, kept_lines, archived_lines, archived_section_count)."""
    if not memory_path.exists():
        return 0, 0, 0, 0
    text = memory_path.read_text(encoding="utf-8")
    original_lines = len(text.splitlines())
    preamble, sections = parse_sections(text)

    permanent = [s for s in sections if s.is_permanent]
    dated = [s for s in sections if (not s.is_permanent) and s.date is not None]
    undated_non_perm = [s for s in sections if (not s.is_permanent) and s.date is None]

    dated.sort(key=lambda s: s.date or datetime.min, reverse=True)
    kept_dated = dated[:keep_recent_dated]
    archived_dated = dated[keep_recent_dated:]

    kept_sections = permanent + undated_non_perm + kept_dated
    kept_sections_in_order = _preserve_order(sections, kept_sections)

    new_parts: list[str] = []
    if preamble.strip():
        new_parts.append(preamble)
        new_parts.append("")
    for s in kept_sections_in_order:
        new_parts.append(s.content)
        new_parts.append("")
    if archived_dated:
        new_parts.append("---")
        new_parts.append("")
        new_parts.append(f"*Eski feedback'ler → `memory_archive.md` (son purge: {datetime.now().date()})*")
        new_parts.append("")

    new_text = "\n".join(new_parts).rstrip() + "\n"
    kept_lines = len(new_text.splitlines())

    archive_path = memory_path.parent / "memory_archive.md"
    archived_chunk_lines = 0
    if archived_dated:
        archive_header = []
        if not archive_path.exists():
            archive_header.append(f"# {memory_path.parent.name} — Memory Archive")
            archive_header.append("")
            archive_header.append("Bu dosya memory.md'den taşınan eski feedback'leri içerir (Phase 8A purge).")
            archive_header.append("")
            archive_header.append("---")
            archive_header.append("")
        purge_block = [
            f"## Purge {datetime.now().strftime('%Y-%m-%d %H:%M')} — {len(archived_dated)} section"
            + (f" (en yeni: {archived_dated[0].date.date() if archived_dated[0].date else '—'})" if archived_dated else ""),
            "",
        ]
        for s in archived_dated:
            purge_block.append(s.content)
            purge_block.append("")
        if archive_path.exists():
            existing = archive_path.read_text(encoding="utf-8").rstrip()
            combined = existing + "\n\n" + "\n".join(purge_block)
        else:
            combined = "\n".join(archive_header + purge_block)
        archive_path.write_text(combined.rstrip() + "\n", encoding="utf-8")
        archived_chunk_lines = sum(s.line_count for s in archived_dated)

    memory_path.write_text(new_text, encoding="utf-8")
    return original_lines, kept_lines, archived_chunk_lines, len(archived_dated)


def _preserve_order(all_sections: list[Section], keep_set: list[Section]) -> list[Section]:
    keep_ids = {id(s) for s in keep_set}
    return [s for s in all_sections if id(s) in keep_ids]


def main() -> int:
    memory_files = sorted(AGENTS_DIR.glob("*/memory.md"))
    if not memory_files:
        print("No agent memory.md files found")
        return 1
    print(f"Found {len(memory_files)} memory files")
    print()
    header = f"{'agent':<32}{'orig':>7}{'kept':>7}{'arch_ln':>9}{'arch_sec':>10}"
    print(header)
    print("-" * len(header))
    total_orig = total_kept = total_arch_ln = total_arch_sec = 0
    for mem in memory_files:
        agent = mem.parent.name
        orig, kept, arch_ln, arch_sec = purge(mem)
        total_orig += orig
        total_kept += kept
        total_arch_ln += arch_ln
        total_arch_sec += arch_sec
        print(f"{agent:<32}{orig:>7}{kept:>7}{arch_ln:>9}{arch_sec:>10}")
    print("-" * len(header))
    print(f"{'TOTAL':<32}{total_orig:>7}{total_kept:>7}{total_arch_ln:>9}{total_arch_sec:>10}")
    reduction = (total_orig - total_kept) / total_orig * 100 if total_orig else 0
    print(f"\nActive memory reduction: {total_orig} -> {total_kept} lines ({reduction:.1f}% smaller)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
