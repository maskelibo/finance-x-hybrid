"""strategic_synthesis — cross-signal convergence / divergence mapping.

Python pulls signals from financial_analysis (red_flags + highlights),
macro transmission, technical trend, and event impact. Classifies each
signal as positive / negative / neutral, and surfaces the groups for
the LLM to turn into a Bull/Base/Bear narrative.

No opinion is written here — only the map. The narrative lives in LLM.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.analysis import FinancialAnalysisOutput
from financex.schemas.base import FinancexModel, Sector
from financex.schemas.competition import SectorComparisonReport


class Signal(FinancexModel):
    source: str           # 'fundamental' / 'macro' / 'technical' / 'event' / 'peer'
    direction: str        # 'positive' / 'negative' / 'neutral'
    label: str
    evidence: str | None = None


class SignalBucket(FinancexModel):
    positive: list[Signal] = Field(default_factory=list)
    negative: list[Signal] = Field(default_factory=list)
    neutral: list[Signal] = Field(default_factory=list)


class SynthesisOutput(FinancexModel):
    ticker: str
    period_label: str
    sector: Sector

    signals: SignalBucket = Field(default_factory=SignalBucket)
    convergence_score: Decimal = Decimal("0")      # −1..+1
    confidence: str = "low"                        # low / medium / high
    divergences: list[str] = Field(default_factory=list)

    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Signal extraction ----------

_POSITIVE_HIGHLIGHT_CODES = {
    "GROSS_MARGIN", "EBITDA_MARGIN", "NET_MARGIN", "ROE", "ROA", "ROCE",
    "NIM", "BANK_ROE", "BANK_ROA",
    "CCC", "FCF", "ALTMAN_Z", "PIOTROSKI_F",
}
_NEGATIVE_FLAG_CODES = {
    "NET_LOSS", "LIQUIDITY_TIGHT", "OVERLEVERAGED", "INTEREST_COVERAGE_LOW",
    "ALTMAN_DISTRESS", "PIOTROSKI_WEAK",
    "BANK_NII_NEGATIVE", "BANK_COST_HIGH", "BANK_LLP_HEAVY", "BANK_ROE_WEAK",
}


def _extract_fundamental_signals(fa: FinancialAnalysisOutput) -> list[Signal]:
    out: list[Signal] = []
    # Positive highlights with healthy thresholds
    for h in fa.highlights:
        if h.code in _POSITIVE_HIGHLIGHT_CODES and h.value is not None:
            direction = "positive"
            # Direction override for ratios where lower=better
            if h.code == "CCC" and h.value > 0:
                direction = "neutral"
            if h.code == "NET_MARGIN" and h.value <= 0:
                direction = "negative"
            if h.code in {"ROE", "ROA", "BANK_ROE", "BANK_ROA"} and h.value <= 0:
                direction = "negative"
            out.append(Signal(source="fundamental", direction=direction, label=h.label, evidence=h.code))
    # Red flags map to negative
    for f in fa.red_flags:
        sev = "negative" if f.severity != "info" else "neutral"
        out.append(Signal(source="fundamental", direction=sev, label=f.code, evidence=f.message))
    return out


def _extract_peer_signals(peer_report: SectorComparisonReport | None) -> list[Signal]:
    if peer_report is None:
        return []
    out: list[Signal] = []
    for code in peer_report.strengths:
        out.append(Signal(source="peer", direction="positive", label=f"Top quartile: {code}"))
    for code in peer_report.weaknesses:
        out.append(Signal(source="peer", direction="negative", label=f"Bottom quartile: {code}"))
    return out


# ---------- Public API ----------

@dataclass(frozen=True)
class SynthesisInputs:
    financial_analysis: FinancialAnalysisOutput
    peer_report: SectorComparisonReport | None = None
    technical_trend: str | None = None    # 'bullish' / 'bearish' / 'neutral' (from ta)
    macro_tilt: str | None = None         # 'positive' / 'negative' / 'neutral'
    event_net_direction: str | None = None  # same three


def synthesize(inputs: SynthesisInputs, *, ticker: str) -> SynthesisOutput:
    fa = inputs.financial_analysis
    signals: list[Signal] = []

    signals.extend(_extract_fundamental_signals(fa))
    signals.extend(_extract_peer_signals(inputs.peer_report))

    if inputs.technical_trend:
        direction = (
            "positive" if inputs.technical_trend == "bullish"
            else "negative" if inputs.technical_trend == "bearish"
            else "neutral"
        )
        signals.append(Signal(source="technical", direction=direction, label=f"Trend: {inputs.technical_trend}"))

    if inputs.macro_tilt:
        signals.append(Signal(source="macro", direction=inputs.macro_tilt, label=f"Macro tilt: {inputs.macro_tilt}"))

    if inputs.event_net_direction:
        signals.append(Signal(
            source="event",
            direction=inputs.event_net_direction,
            label=f"Event net: {inputs.event_net_direction}",
        ))

    # Bucketize
    bucket = SignalBucket()
    for s in signals:
        if s.direction == "positive":
            bucket.positive.append(s)
        elif s.direction == "negative":
            bucket.negative.append(s)
        else:
            bucket.neutral.append(s)

    # Convergence score in [-1, 1]: (pos − neg) / total
    pos = len(bucket.positive)
    neg = len(bucket.negative)
    total = pos + neg + len(bucket.neutral)
    score = Decimal("0")
    if total > 0:
        score = ((Decimal(pos) - Decimal(neg)) / Decimal(total)).quantize(Decimal("0.01"))

    # Confidence
    if total >= 8 and abs(score) >= Decimal("0.4"):
        confidence = "high"
    elif total >= 4:
        confidence = "medium"
    else:
        confidence = "low"

    # Divergences — sources disagreeing noticeably
    divergences: list[str] = []
    sources_by_direction: dict[str, set[str]] = {"positive": set(), "negative": set()}
    for s in signals:
        if s.direction in sources_by_direction:
            sources_by_direction[s.direction].add(s.source)
    if sources_by_direction["positive"] and sources_by_direction["negative"]:
        shared = sources_by_direction["positive"] & sources_by_direction["negative"]
        for src in shared:
            divergences.append(f"{src} has both positive and negative signals — inspect closer.")

    return SynthesisOutput(
        ticker=ticker.upper(),
        period_label=fa.period_label,
        sector=fa.sector,
        signals=bucket,
        convergence_score=score,
        confidence=confidence,
        divergences=divergences,
        computed_at=datetime.now(UTC),
    )
