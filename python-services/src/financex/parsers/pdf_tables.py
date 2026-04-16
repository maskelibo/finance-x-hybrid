"""PDF table extraction layer — wraps pdfplumber, ships clean rows.

Responsibilities:
  - Open a PDF, walk pages, collect every table on every page.
  - Remove empty rows, strip whitespace, normalise None → ''.
  - Leave interpretation of the contents to callers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber


@dataclass
class ExtractedTable:
    page: int
    rows: list[list[str]]
    meta: dict[str, str] = field(default_factory=dict)


def _clean_cell(v: str | None) -> str:
    return (v or "").replace("\n", " ").strip()


def _is_meaningful_row(row: list[str]) -> bool:
    return any(cell for cell in row)


def extract_tables(pdf_path: Path | str) -> list[ExtractedTable]:
    """Pull every table from every page; return a flat list in reading order."""
    tables: list[ExtractedTable] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_idx, page in enumerate(pdf.pages, start=1):
            for raw in page.extract_tables() or []:
                rows = [[_clean_cell(c) for c in r] for r in raw]
                rows = [r for r in rows if _is_meaningful_row(r)]
                if not rows:
                    continue
                tables.append(ExtractedTable(page=page_idx, rows=rows))
    return tables


def extract_page_text(pdf_path: Path | str, page: int) -> str:
    """Return plain text for a 1-indexed page — useful for diagnostics."""
    with pdfplumber.open(str(pdf_path)) as pdf:
        if page < 1 or page > len(pdf.pages):
            return ""
        return pdf.pages[page - 1].extract_text() or ""
