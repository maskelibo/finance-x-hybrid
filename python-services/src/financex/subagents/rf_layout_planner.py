"""rf_layout_planner — deterministic report layout (12 sections + cover + TOC).

Pure in-memory: returns the canonical section list so downstream renderers
can fan out in parallel. No template / data access at this stage.
"""

from __future__ import annotations

import json
import sys

SECTIONS = [
    ("cover",                 "Kapak"),
    ("toc",                   "İçindekiler"),
    ("executive_summary",     "Yönetici Özeti"),
    ("company_profile",       "Şirket Tanıtımı"),
    ("financial_performance", "Finansal Performans"),
    ("sector_competition",    "Sektör ve Rekabet"),
    ("macro_outlook",         "Makro Görünüm"),
    ("event_analysis",        "Olay Analizi"),
    ("scorecard",             "Skor Kartı"),
    ("target_price",          "Hedef Fiyat"),
    ("risks",                 "Riskler"),
    ("appendices",            "Ekler"),
    ("disclosures",           "Bildirimler"),
    ("spk_disclaimer",        "SPK Disclaimer"),
]


def run(ticker: str) -> dict:
    return {
        "ticker": ticker,
        "sections": [
            {"id": sid, "title": title, "order": i}
            for i, (sid, title) in enumerate(SECTIONS)
        ],
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    ticker = inputs.get("ticker", "UNKNOWN")
    print(json.dumps(run(str(ticker).upper()), ensure_ascii=False))


if __name__ == "__main__":
    main()
