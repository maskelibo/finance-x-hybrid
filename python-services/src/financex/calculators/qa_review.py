"""qa_review — rubric-based automatic quality checks.

Python scores five dimensions on [0, 1]. The LLM qa_review agent can
override or refine each, but the baseline score comes from deterministic
structural checks (sections present, numbers cited, math consistent,
flags acknowledged).
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.analysis import FinancialAnalysisOutput
from financex.schemas.base import FinancexModel
from financex.schemas.reconciliation import ReconciliationReport


class DimensionScore(FinancexModel):
    code: str
    label: str
    score: Decimal          # 0..1
    evidence: str | None = None


class QaOutput(FinancexModel):
    ticker: str
    period_label: str

    dimensions: list[DimensionScore] = Field(default_factory=list)
    quality_flags: list[str] = Field(default_factory=list)
    overall_score: Decimal = Decimal("0")
    overall_pass: bool = False

    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Individual dimension checks ----------

def _evidence_sufficiency(fa: FinancialAnalysisOutput) -> DimensionScore:
    """How many canonical numbers landed? Proxy for data completeness."""
    total = len(fa.canonical_numbers)
    filled = sum(1 for v in fa.canonical_numbers.values() if v is not None)
    ratio = Decimal(str(filled / total)) if total > 0 else Decimal("0")
    return DimensionScore(
        code="EVIDENCE_SUFFICIENCY",
        label="Canonical number coverage",
        score=ratio.quantize(Decimal("0.01")),
        evidence=f"{filled}/{total} canonical values populated",
    )


def _reconciliation_score(report: ReconciliationReport | None) -> DimensionScore:
    if report is None:
        return DimensionScore(
            code="MATH_CONSISTENCY",
            label="Reconciliation pass rate",
            score=Decimal("0"),
            evidence="no reconciliation report supplied",
        )
    total = len(report.checks)
    passed = sum(1 for c in report.checks if c.passed)
    score = Decimal(str(passed / total)) if total > 0 else Decimal("0")
    failed_codes = [c.code for c in report.checks if not c.passed]
    return DimensionScore(
        code="MATH_CONSISTENCY",
        label="Reconciliation pass rate",
        score=score.quantize(Decimal("0.01")),
        evidence=(
            f"{passed}/{total} reconciliation checks passed. "
            + (f"Failures: {', '.join(failed_codes)}" if failed_codes else "All clean.")
        ),
    )


def _completeness(fa: FinancialAnalysisOutput) -> DimensionScore:
    """Did the financial_analysis surface highlights for the core dimensions?"""
    required_codes = {"NET_MARGIN", "ROE"}
    if fa.sector.value == "banking":
        required_codes = {"NIM", "BANK_ROE", "COST_TO_INCOME"}
    present = {h.code for h in fa.highlights} & required_codes
    score = Decimal(str(len(present) / len(required_codes))) if required_codes else Decimal("0")
    return DimensionScore(
        code="COMPLETENESS",
        label="Core highlights present",
        score=score.quantize(Decimal("0.01")),
        evidence=f"required={sorted(required_codes)}; present={sorted(present)}",
    )


def _flag_acknowledgement(fa: FinancialAnalysisOutput) -> DimensionScore:
    """Any critical flags must be surfaced. If red_flags contains at
    least one critical AND the rest of the output has highlights, we
    assume the LLM will write about them — score=1. If critical flags
    exist but the output is otherwise empty, score=0 (analyst missed
    the cue)."""
    critical = [f for f in fa.red_flags if f.severity == "critical"]
    if not critical:
        return DimensionScore(
            code="FLAG_ACKNOWLEDGEMENT",
            label="Critical flags surfaced",
            score=Decimal("1"),
            evidence="no critical flags raised",
        )
    if fa.highlights:
        return DimensionScore(
            code="FLAG_ACKNOWLEDGEMENT",
            label="Critical flags surfaced",
            score=Decimal("1"),
            evidence=f"{len(critical)} critical flag(s) present alongside narrative hooks",
        )
    return DimensionScore(
        code="FLAG_ACKNOWLEDGEMENT",
        label="Critical flags surfaced",
        score=Decimal("0"),
        evidence="critical flags raised but no highlights — analyst may miss them",
    )


def _narrative_hint_coverage(fa: FinancialAnalysisOutput) -> DimensionScore:
    """Each highlight should carry a narrative_hint; missing hints starve
    the LLM of angles."""
    hl = fa.highlights
    if not hl:
        return DimensionScore(
            code="NARRATIVE_COVERAGE",
            label="Highlights carry narrative hints",
            score=Decimal("0"),
            evidence="no highlights produced",
        )
    with_hints = sum(1 for h in hl if h.narrative_hint)
    score = Decimal(str(with_hints / len(hl))).quantize(Decimal("0.01"))
    return DimensionScore(
        code="NARRATIVE_COVERAGE",
        label="Highlights carry narrative hints",
        score=score,
        evidence=f"{with_hints}/{len(hl)} highlights include a narrative hint",
    )


# ---------- Public API ----------

def review_analysis(
    fa: FinancialAnalysisOutput,
    *,
    reconciliation: ReconciliationReport | None = None,
    pass_threshold: Decimal = Decimal("0.7"),
) -> QaOutput:
    dimensions = [
        _evidence_sufficiency(fa),
        _reconciliation_score(reconciliation),
        _completeness(fa),
        _flag_acknowledgement(fa),
        _narrative_hint_coverage(fa),
    ]
    overall = (sum((d.score for d in dimensions), Decimal("0")) / len(dimensions)).quantize(Decimal("0.01"))

    flags: list[str] = []
    for d in dimensions:
        if d.score < Decimal("0.5"):
            flags.append(f"{d.code} below 0.5 — {d.evidence}")

    return QaOutput(
        ticker=fa.ticker,
        period_label=fa.period_label,
        dimensions=dimensions,
        quality_flags=flags,
        overall_score=overall,
        overall_pass=overall >= pass_threshold,
        computed_at=datetime.now(UTC),
    )
