"""qa_review — rubric-based automatic quality checks.

Wave 2 (2026-04-28) — financial truth gate:
  - Adds 6 new dimensions targeting board-grade truth:
      MULTI_YEAR_COVERAGE       (≥3 FY periods with revenue?)
      PEER_COUNT_SUFFICIENT     (≥3 peers in benchmark?)
      OWNERSHIP_FRESHNESS       (ownership data sourced & fresh?)
      CFS_PARSED_NOT_ESTIMATED  (operating_cash_flow + capex parsed?)
      PERIOD_CONSISTENCY        (FA period matches reconciliation period?)
      LANGUAGE_PURITY           (no English residue, no estimate-judgment)
  - Reconciliation `passed=True (skipped)` is now distinguished from
    truly_passed: skipped checks no longer count toward MATH_CONSISTENCY
    score (would otherwise be a free pass).
  - Hard-fail behavior: any BLOCKER dim score == 0 → qa_decision='hard_fail'.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from financex.schemas.analysis import FinancialAnalysisOutput
from financex.schemas.base import FinancexModel
from financex.schemas.reconciliation import ReconciliationReport


class DimensionScore(FinancexModel):
    code: str
    label: str
    score: Decimal          # 0..1
    evidence: str | None = None
    is_blocker: bool = False


class QaOutput(FinancexModel):
    ticker: str
    period_label: str

    dimensions: list[DimensionScore] = Field(default_factory=list)
    quality_flags: list[str] = Field(default_factory=list)
    overall_score: Decimal = Decimal("0")
    overall_pass: bool = False
    qa_decision: str = "pass"  # 'pass' | 'soft_fail' | 'hard_fail'
    blocker_failures: list[str] = Field(default_factory=list)

    computed_at: datetime
    schema_version: str = "1.1.0"


# ---------- Truth context (Wave 2) ----------

class TruthContext(FinancexModel):
    """Wave 2 — additional inputs for financial truth dimensions.

    Caller supplies what it knows; missing fields are treated as
    "uncertain" (mid-score), not "fail" (zero). This keeps adapters
    that haven't been wired yet from immediately failing.
    """
    multi_year_periods: int | None = None       # count of FY-* periods with revenue > 0
    peer_count: int | None = None                # peer_count from sector_competition
    ownership_source: str | None = None          # 'kap_filing' | 'static_fallback' | None
    ownership_age_days: int | None = None
    cfs_operating_cash_flow_parsed: bool | None = None
    cfs_capex_parsed: bool | None = None
    reconciliation_period: str | None = None     # if mismatch with fa.period_label → fail
    english_residue_count: int | None = None
    estimate_judgment_rewrites: int | None = None


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
    """Wave 2 — skipped checks no longer count as passed.

    Old behaviour: `passed=True (skipped: totals are zero)` → score 1.0,
    creating false-positive "7/7 reconciliation passed" when actually 7/7
    were skipped due to missing data. Now: ratio = truly_passed / total.
    A check is truly_passed iff `passed=True AND not str(message).startswith('skipped')`.
    """
    if report is None:
        return DimensionScore(
            code="MATH_CONSISTENCY",
            label="Reconciliation pass rate (excluding skipped)",
            score=Decimal("0"),
            evidence="no reconciliation report supplied",
        )
    total = len(report.checks)
    truly_passed = sum(
        1 for c in report.checks
        if c.passed and not (c.message or "").lower().startswith("skipped")
    )
    skipped = sum(
        1 for c in report.checks
        if c.passed and (c.message or "").lower().startswith("skipped")
    )
    failed_codes = [c.code for c in report.checks if not c.passed]
    # Score uses (truly_passed) / (total - skipped) when at least one real
    # check ran; otherwise 0 (no-data signal, not a free pass).
    real_total = total - skipped
    score = Decimal(str(truly_passed / real_total)) if real_total > 0 else Decimal("0")
    evidence = (
        f"{truly_passed}/{real_total} truly passed; {skipped} skipped (data missing); "
        + (f"failures: {', '.join(failed_codes)}" if failed_codes else "no real failures")
    )
    return DimensionScore(
        code="MATH_CONSISTENCY",
        label="Reconciliation pass rate (excluding skipped)",
        score=score.quantize(Decimal("0.01")),
        evidence=evidence,
        is_blocker=(skipped == total and total > 0),  # all skipped = data void
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


# ---------- Wave 2 truth dimensions ----------

def _multi_year_coverage(ctx: TruthContext) -> DimensionScore:
    n = ctx.multi_year_periods
    if n is None:
        # Uncertain — adapter not wired yet. Mid-score, not zero.
        return DimensionScore(
            code="MULTI_YEAR_COVERAGE", label="Multi-year FY coverage",
            score=Decimal("0.5"), evidence="multi_year_periods not supplied — uncertain",
        )
    score = Decimal("1") if n >= 5 else Decimal("0.7") if n >= 3 else Decimal("0")
    return DimensionScore(
        code="MULTI_YEAR_COVERAGE", label="Multi-year FY coverage",
        score=score, evidence=f"{n} FY period(s) with revenue available",
        is_blocker=(n is not None and n < 3),
    )


def _peer_count_sufficient(ctx: TruthContext) -> DimensionScore:
    n = ctx.peer_count
    if n is None:
        return DimensionScore(
            code="PEER_COUNT_SUFFICIENT", label="Peer benchmark count",
            score=Decimal("0.5"), evidence="peer_count not supplied — uncertain",
        )
    score = Decimal("1") if n >= 4 else Decimal("0.6") if n >= 3 else Decimal("0")
    return DimensionScore(
        code="PEER_COUNT_SUFFICIENT", label="Peer benchmark count",
        score=score,
        evidence=f"peer_count={n} — {'sufficient' if n >= 3 else 'insufficient (need ≥3, ideally ≥4)'}",
        is_blocker=(n == 0),
    )


def _ownership_freshness(ctx: TruthContext) -> DimensionScore:
    src = ctx.ownership_source
    age = ctx.ownership_age_days
    if src is None:
        return DimensionScore(
            code="OWNERSHIP_FRESHNESS", label="Ownership data freshness",
            score=Decimal("0.5"), evidence="ownership_source not supplied — uncertain",
        )
    if src == "kap_filing":
        if age is None or age <= 90:
            return DimensionScore(
                code="OWNERSHIP_FRESHNESS", label="Ownership data freshness",
                score=Decimal("1"),
                evidence=f"sourced from KAP filing, age={age if age is not None else 'unknown'} days",
            )
        return DimensionScore(
            code="OWNERSHIP_FRESHNESS", label="Ownership data freshness",
            score=Decimal("0.4"),
            evidence=f"KAP filing but stale (age={age} days > 90)",
        )
    # static_fallback or other
    return DimensionScore(
        code="OWNERSHIP_FRESHNESS", label="Ownership data freshness",
        score=Decimal("0"),
        evidence=f"source='{src}' — static fallback; not board-grade",
        is_blocker=True,
    )


def _cfs_parsed_not_estimated(ctx: TruthContext) -> DimensionScore:
    ocf = ctx.cfs_operating_cash_flow_parsed
    capex = ctx.cfs_capex_parsed
    if ocf is None and capex is None:
        return DimensionScore(
            code="CFS_PARSED_NOT_ESTIMATED", label="Cash flow statement parsed",
            score=Decimal("0.5"), evidence="cfs_*_parsed not supplied — uncertain",
        )
    if ocf and capex:
        return DimensionScore(
            code="CFS_PARSED_NOT_ESTIMATED", label="Cash flow statement parsed",
            score=Decimal("1"), evidence="OCF + CAPEX both parsed from source filing",
        )
    if ocf or capex:
        return DimensionScore(
            code="CFS_PARSED_NOT_ESTIMATED", label="Cash flow statement parsed",
            score=Decimal("0.5"),
            evidence=f"partial: ocf_parsed={ocf}, capex_parsed={capex} — derived metrics will be incomplete",
            is_blocker=True,
        )
    return DimensionScore(
        code="CFS_PARSED_NOT_ESTIMATED", label="Cash flow statement parsed",
        score=Decimal("0"),
        evidence="OCF + CAPEX not parsed — board-grade CFS analysis impossible",
        is_blocker=True,
    )


def _period_consistency(fa: FinancialAnalysisOutput, ctx: TruthContext) -> DimensionScore:
    rec_period = ctx.reconciliation_period
    if rec_period is None:
        return DimensionScore(
            code="PERIOD_CONSISTENCY", label="Period label consistency",
            score=Decimal("0.5"), evidence="reconciliation_period not supplied — uncertain",
        )
    if rec_period == fa.period_label:
        return DimensionScore(
            code="PERIOD_CONSISTENCY", label="Period label consistency",
            score=Decimal("1"), evidence=f"FA + reconciliation both '{fa.period_label}'",
        )
    return DimensionScore(
        code="PERIOD_CONSISTENCY", label="Period label consistency",
        score=Decimal("0"),
        evidence=f"mismatch: FA='{fa.period_label}' vs reconciliation='{rec_period}'",
        is_blocker=True,
    )


def _language_purity(ctx: TruthContext) -> DimensionScore:
    residue = ctx.english_residue_count
    rewrites = ctx.estimate_judgment_rewrites
    if residue is None and rewrites is None:
        return DimensionScore(
            code="LANGUAGE_PURITY", label="Language purity (no residue / no estimate-judgment)",
            score=Decimal("0.5"), evidence="language metrics not supplied — uncertain",
        )
    residue_clean = (residue is None) or (residue == 0)
    rewrites_clean = (rewrites is None) or (rewrites == 0)
    if residue_clean and rewrites_clean:
        return DimensionScore(
            code="LANGUAGE_PURITY", label="Language purity",
            score=Decimal("1"),
            evidence=f"english_residue={residue}, estimate_judgment_rewrites={rewrites} — clean",
        )
    score = Decimal("0.3") if (residue or 0) <= 3 else Decimal("0")
    return DimensionScore(
        code="LANGUAGE_PURITY", label="Language purity",
        score=score,
        evidence=f"english_residue={residue}, estimate_judgment_rewrites={rewrites}",
        is_blocker=(residue is not None and residue > 5),
    )


# ---------- Public API ----------

def review_analysis(
    fa: FinancialAnalysisOutput,
    *,
    reconciliation: ReconciliationReport | None = None,
    truth_context: TruthContext | None = None,
    pass_threshold: Decimal = Decimal("0.7"),
) -> QaOutput:
    """Wave 2 — extended QA review.

    Backward-compatible: callers that don't supply truth_context get
    mid-score (0.5) for the 6 new dimensions, so legacy adapters don't
    spuriously hard-fail.
    """
    ctx = truth_context or TruthContext()
    dimensions = [
        # Legacy (5)
        _evidence_sufficiency(fa),
        _reconciliation_score(reconciliation),
        _completeness(fa),
        _flag_acknowledgement(fa),
        _narrative_hint_coverage(fa),
        # Wave 2 truth (6)
        _multi_year_coverage(ctx),
        _peer_count_sufficient(ctx),
        _ownership_freshness(ctx),
        _cfs_parsed_not_estimated(ctx),
        _period_consistency(fa, ctx),
        _language_purity(ctx),
    ]
    overall = (sum((d.score for d in dimensions), Decimal("0")) / len(dimensions)).quantize(Decimal("0.01"))

    flags: list[str] = []
    for d in dimensions:
        if d.score < Decimal("0.5"):
            flags.append(f"{d.code} below 0.5 — {d.evidence}")

    # Wave 2 hard-fail: any blocker dim with score == 0 → hard_fail.
    blocker_failures = [
        d.code for d in dimensions if d.is_blocker and d.score == Decimal("0")
    ]
    if blocker_failures:
        qa_decision = "hard_fail"
        overall_pass = False
    elif overall >= pass_threshold:
        qa_decision = "pass"
        overall_pass = True
    else:
        qa_decision = "soft_fail"
        overall_pass = False

    return QaOutput(
        ticker=fa.ticker,
        period_label=fa.period_label,
        dimensions=dimensions,
        quality_flags=flags,
        overall_score=overall,
        overall_pass=overall_pass,
        qa_decision=qa_decision,
        blocker_failures=blocker_failures,
        computed_at=datetime.now(UTC),
    )


# ---------- Wave 2 helper: build TruthContext from typical adapter inputs ----------

def build_truth_context(*, fa: FinancialAnalysisOutput, reconciliation: ReconciliationReport | None,
                        sector_competition: dict[str, Any] | None = None,
                        ownership: dict[str, Any] | None = None,
                        sanitizer_report: dict[str, Any] | None = None) -> TruthContext:
    """Best-effort TruthContext extractor. Adapters can call this to
    populate the context from their existing outputs without manual
    field-by-field plumbing.
    """
    multi_year = None
    cfs_ocf = None
    cfs_capex = None
    # canonical_numbers — single-period today; wave 3+ will surface multi-year.
    canon = fa.canonical_numbers if hasattr(fa, "canonical_numbers") else {}
    if isinstance(canon, dict):
        cfs_ocf = canon.get("operating_cash_flow") is not None
        cfs_capex = canon.get("capex") is not None

    peer_count = None
    if isinstance(sector_competition, dict):
        peers = sector_competition.get("peer_group")
        if isinstance(peers, list):
            peer_count = len(peers)

    rec_period = None
    if reconciliation is not None:
        rec_period = getattr(reconciliation, "period_label", None) or getattr(reconciliation, "period", None)
        if rec_period is not None:
            rec_period = str(rec_period)

    own_src = None
    own_age = None
    if isinstance(ownership, dict):
        own_src = ownership.get("source")
        own_age = ownership.get("age_days")

    residue = None
    rewrites = None
    if isinstance(sanitizer_report, dict):
        residue = sanitizer_report.get("english_residue_remaining")
        rewrites = sanitizer_report.get("no_estimate_judgment_rewrites")

    return TruthContext(
        multi_year_periods=multi_year,
        peer_count=peer_count,
        ownership_source=own_src,
        ownership_age_days=own_age,
        cfs_operating_cash_flow_parsed=cfs_ocf,
        cfs_capex_parsed=cfs_capex,
        reconciliation_period=rec_period,
        english_residue_count=residue,
        estimate_judgment_rewrites=rewrites,
    )
