"""rf_html_validator — final HTML quality gate.

Checks:
- total HTML size ≥ 50 KB
- required 12 section titles all present in text
- SPK disclaimer detectable
- expected number of <div class="page"> containers
- minimum SVG chart count

Returns valid=false when any P0 issue fires. Consumer (report_formatter
compile step) is expected to treat valid=false as a blocker.
"""

from __future__ import annotations

import json
import sys

try:
    from bs4 import BeautifulSoup  # type: ignore[import-not-found]
except Exception:  # noqa: BLE001
    BeautifulSoup = None

REQUIRED_SECTIONS = [
    "Yönetici Özeti", "Şirket Tanıtımı", "Finansal Performans",
    "Sektör ve Rekabet", "Makro Görünüm", "Olay Analizi",
    "Skor Kartı", "Hedef Fiyat", "Riskler", "Ekler",
    "Bildirimler", "SPK Disclaimer",
]
MIN_HTML_SIZE = 50_000
MIN_SVG_COUNT = 4
EXPECTED_PAGE_DIVS = 14


def run(html_text: str) -> dict:
    issues: list[dict] = []
    size = len(html_text or "")
    if size < MIN_HTML_SIZE:
        issues.append({"severity": "P0", "issue": f"HTML size {size}b < required {MIN_HTML_SIZE}b"})

    text_lower = (html_text or "").lower()
    missing = [s for s in REQUIRED_SECTIONS if s.lower() not in text_lower]
    if missing:
        issues.append({"severity": "P0", "issue": f"Missing sections: {', '.join(missing)}"})

    if "spk" not in text_lower or "uyarı" not in text_lower:
        issues.append({"severity": "P0", "issue": "SPK disclaimer missing"})

    section_count = 0
    svg_count = 0
    if BeautifulSoup is not None and html_text:
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            section_count = len(soup.find_all("div", class_="page"))
            svg_count = len(soup.find_all("svg"))
            if section_count < EXPECTED_PAGE_DIVS:
                issues.append({"severity": "P1", "issue": f"Only {section_count} page divs (expected {EXPECTED_PAGE_DIVS})"})
            if svg_count < MIN_SVG_COUNT:
                issues.append({"severity": "P1", "issue": f"Only {svg_count} SVG charts (expected min {MIN_SVG_COUNT})"})
        except Exception as err:  # noqa: BLE001
            issues.append({"severity": "P0", "issue": f"Parse error: {err}"})
    else:
        # Cheap fallback when bs4 is unavailable
        section_count = text_lower.count('class="page"')
        svg_count = text_lower.count("<svg")

    p0 = [i for i in issues if i["severity"] == "P0"]
    return {
        "valid": len(p0) == 0,
        "issues": issues,
        "html_size_bytes": size,
        "section_count": section_count,
        "svg_count": svg_count,
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    html_text = inputs.get("html", "")
    print(json.dumps(run(html_text), ensure_ascii=False))


if __name__ == "__main__":
    main()
