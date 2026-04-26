"""ss_macro_signal_extractor — strategic_synthesis Phase 1 deterministic.

Reads compact_summary_pack.top_macro_impacts and produces a partition of
canonical signals (sig_mac_*) for the downstream ss_signal_compiler.

Macro signals taşıdığı ekonomik anlam çoğunlukla magnitude'la şekilleniyor
(yüksek enflasyon = negative; pozitif GDP büyümesi = positive). Compact pack'te
zaten direction set edilmiş olabilir — onu önce kullan, yoksa kategori-bazlı
heuristic.
"""

from __future__ import annotations

import json
import sys


_CATEGORY_WEIGHT = {
    "policy_rate": 7,
    "inflation":   7,
    "fx":          7,
    "growth":      6,
    "equity":      5,
    "fx_exposure": 6,
    "commodity_sensitivity": 6,
    "interest_rate_impact":  6,
    "demand_elasticity":     5,
}


def _polarity_for(insight: dict) -> str:
    direction = (insight.get("direction") or "").lower()
    if direction in ("positive", "negative", "neutral", "mixed"):
        return direction
    cat = (insight.get("category") or "").lower()
    mag_pct = insight.get("magnitude_pct")
    # Heuristic per macro axis
    if cat == "inflation" and isinstance(mag_pct, (int, float)):
        return "negative" if mag_pct > 30 else "neutral"
    if cat == "growth" and isinstance(mag_pct, (int, float)):
        return "positive" if mag_pct > 0 else "negative"
    if cat == "equity" and isinstance(mag_pct, (int, float)):
        return "positive" if mag_pct > 0 else "negative"
    return "neutral"


def _weight_for(insight: dict) -> int:
    cat = (insight.get("category") or "").lower()
    return _CATEGORY_WEIGHT.get(cat, 5)


def _confidence_for(insight: dict) -> str:
    conf = (insight.get("confidence") or "").lower()
    if conf in ("low", "medium", "high"):
        return conf
    cat = (insight.get("category") or "").lower()
    # TCMB/TÜİK official prints → high; transmission scores (heuristic) → medium
    if cat in ("policy_rate", "inflation", "fx", "growth", "equity"):
        return "high"
    return "medium"


def run(inputs: dict) -> dict:
    ticker = inputs.get("ticker", "")
    impacts = inputs.get("top_macro_impacts") or []

    signals = []
    for idx, m in enumerate(impacts, start=1):
        if not isinstance(m, dict):
            continue
        text = m.get("text") or ""
        if not text:
            continue
        signals.append({
            "id": f"sig_mac_{idx:03d}",
            "source_agent": m.get("source_agent") or "macro_analysis",
            "category": "macro",
            "signal_text": text[:240],
            "polarity": _polarity_for(m),
            "magnitude_try_mn": m.get("magnitude_try_mn"),
            "magnitude_pct": m.get("magnitude_pct"),
            "confidence": _confidence_for(m),
            "weight": _weight_for(m),
            "reference": m.get("ref"),
        })

    return {
        "ticker": ticker,
        "signals": signals,
        "data_quality": {
            "source_count": len(impacts),
            "pack_section_empty": len(impacts) == 0,
            "annotations": (
                ["macro_pack_empty — extractor emitted 0 signals; compiler will mark macro_data_gap"]
                if len(impacts) == 0
                else []
            ),
        },
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    print(json.dumps(run(inputs), ensure_ascii=False))


if __name__ == "__main__":
    main()
