"""ss_financial_signal_extractor — strategic_synthesis Phase 1 deterministic.

Reads compact_summary_pack.top_financial_insights and produces a partition of
canonical signals (sig_fin_*) for the downstream ss_signal_compiler.

No LLM, no provider call — pure JSON transform. <100ms typical.

Signal weight heuristic:
- red_flag                : 9
- canonical_metric         : 7
- composite_score          : 6
- computed_ratio           : 6
- metric (legacy fallback) : 5
- default                  : 5

Polarity heuristic:
- explicit insight.direction wins
- red_flag → negative
- text contains negative cue (kayıp, daralma, baskı, riski) → negative
- text contains positive cue (büyüme, güçlü, yüksek, üstü) → positive
- otherwise neutral
"""

from __future__ import annotations

import json
import sys


_NEGATIVE_CUES = (
    "kayıp", "daralma", "baskı", "düşüş", "zayıf", "negatif", "geri",
    "risk", "açık", "azalma", "kötü", "borç", "altı", "altında",
)
_POSITIVE_CUES = (
    "büyüme", "güçlü", "yüksek", "üstü", "üstünde", "artış", "olumlu",
    "iyileşme", "stabil", "üstün", "lider", "wide moat", "top quartile",
)


_CATEGORY_WEIGHT = {
    "red_flag": 9,
    "canonical_metric": 7,
    "computed_ratio": 6,
    "composite_score": 6,
    "metric": 5,
}


def _polarity_for(insight: dict) -> str:
    direction = (insight.get("direction") or "").lower()
    if direction in ("positive", "negative", "neutral", "mixed"):
        return direction
    cat = (insight.get("category") or "").lower()
    if cat == "red_flag":
        return "negative"
    text = (insight.get("text") or "").lower()
    if any(cue in text for cue in _NEGATIVE_CUES):
        return "negative"
    if any(cue in text for cue in _POSITIVE_CUES):
        return "positive"
    return "neutral"


def _weight_for(insight: dict) -> int:
    cat = (insight.get("category") or "").lower()
    return _CATEGORY_WEIGHT.get(cat, 5)


def _confidence_for(insight: dict) -> str:
    conf = (insight.get("confidence") or "").lower()
    if conf in ("low", "medium", "high"):
        return conf
    cat = (insight.get("category") or "").lower()
    if cat in ("canonical_metric", "computed_ratio", "composite_score"):
        return "high"
    if cat == "red_flag":
        return "high"
    return "medium"


def run(inputs: dict) -> dict:
    ticker = inputs.get("ticker", "")
    insights = inputs.get("top_financial_insights") or []

    signals = []
    for idx, insight in enumerate(insights, start=1):
        if not isinstance(insight, dict):
            continue
        text = insight.get("text") or ""
        if not text:
            continue
        signals.append({
            "id": f"sig_fin_{idx:03d}",
            "source_agent": insight.get("source_agent") or "financial_analysis",
            "category": "financial",
            "signal_text": text[:240],
            "polarity": _polarity_for(insight),
            "magnitude_try_mn": insight.get("magnitude_try_mn"),
            "magnitude_pct": insight.get("magnitude_pct"),
            "confidence": _confidence_for(insight),
            "weight": _weight_for(insight),
            "reference": insight.get("ref"),
        })

    return {
        "ticker": ticker,
        "signals": signals,
        "data_quality": {
            "source_count": len(insights),
            "pack_section_empty": len(insights) == 0,
            "annotations": (
                ["financial_pack_empty — extractor emitted 0 signals; compiler will surface as data_quality signal"]
                if len(insights) == 0
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
