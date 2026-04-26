"""ss_event_signal_extractor — strategic_synthesis Phase 1 deterministic.

Reads compact_summary_pack.top_event_conclusions and produces a partition of
canonical signals (sig_evt_*) for the downstream ss_signal_compiler.

Routine event kategorileri (genel kurul, yıllık filing) düşük weight (3-4) alır;
material event'ler (capex, satın alma, kapasite, temettü) yüksek weight (7-8).
Compact_summary_pack zaten extractEventInsights ile materiality cut yapmış —
burada additional ranking yapmıyoruz, sadece signal canonicalization.
"""

from __future__ import annotations

import json
import sys


_ROUTINE_PATTERNS = (
    "genel kurul", "yıllık", "olağan", "agm", "rutin",
)
_MATERIAL_HIGH_WEIGHT_PATTERNS = (
    "kapasite", "yatırım", "satın alma", "birleşme", "ihale",
    "temettü", "stake", "ortaklık", "halka arz",
)


def _weight_for(text: str, has_magnitude: bool) -> int:
    text_lower = text.lower()
    if any(p in text_lower for p in _MATERIAL_HIGH_WEIGHT_PATTERNS):
        return 8 if has_magnitude else 7
    if any(p in text_lower for p in _ROUTINE_PATTERNS):
        return 3
    return 6 if has_magnitude else 5


def _polarity_for(insight: dict) -> str:
    direction = (insight.get("direction") or "").lower()
    if direction in ("positive", "negative", "neutral", "mixed"):
        return direction
    text = (insight.get("text") or "").lower()
    # Heuristic: capex / yatırım / kapasite usually positive (growth catalyst)
    if any(p in text for p in ("kapasite", "yatırım", "satın alma", "birleşme")):
        return "positive"
    if any(p in text for p in ("kayıp", "düşüş", "yaptırım", "soruşturma")):
        return "negative"
    return "neutral"


def _confidence_for(insight: dict) -> str:
    conf = (insight.get("confidence") or "").lower()
    if conf in ("low", "medium", "high"):
        return conf
    # KAP disclosed events default high; inferred events medium
    if insight.get("ref") and str(insight.get("ref")).lower().startswith("evt_"):
        return "high"
    return "medium"


def run(inputs: dict) -> dict:
    ticker = inputs.get("ticker", "")
    events = inputs.get("top_event_conclusions") or []

    signals = []
    for idx, e in enumerate(events, start=1):
        if not isinstance(e, dict):
            continue
        text = e.get("text") or ""
        if not text:
            continue
        magnitude_try_mn = e.get("magnitude_try_mn")
        magnitude_pct = e.get("magnitude_pct")
        has_magnitude = magnitude_try_mn not in (None, 0) or magnitude_pct not in (None, 0)
        signals.append({
            "id": f"sig_evt_{idx:03d}",
            "source_agent": e.get("source_agent") or "event_impact_mapper",
            "category": "event",
            "signal_text": text[:240],
            "polarity": _polarity_for(e),
            "magnitude_try_mn": magnitude_try_mn,
            "magnitude_pct": magnitude_pct,
            "confidence": _confidence_for(e),
            "weight": _weight_for(text, has_magnitude),
            "reference": e.get("ref"),
        })

    return {
        "ticker": ticker,
        "signals": signals,
        "data_quality": {
            "source_count": len(events),
            "pack_section_empty": len(events) == 0,
            "annotations": (
                ["event_pack_empty — extractor emitted 0 signals; downstream may flag absence as data_gap"]
                if len(events) == 0
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
