"""Schemas for data_collection — what did we fetch, from where, and where is it now.

A DataCollectionManifest is a receipt: ticker + date window + every PDF
pulled + local path + hash. Downstream (parse_standardization) reads this
to know where to dig.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import Field

from financex.schemas.base import FinancexModel, SourceRef


class CollectedDocument(FinancexModel):
    """A single downloaded artefact."""

    # Required
    kind: str = Field(
        description="High-level kind: 'financial_report', 'activity_report', 'disclosure', 'other'.",
    )
    disclosure_index: str = Field(description="KAP disclosure index as string.")
    title: str
    published_at: datetime
    source_url: str
    local_path: str = Field(description="Absolute path on disk to the downloaded file.")
    content_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    size_bytes: int = Field(ge=0)

    # Optional
    category: str | None = None
    subcategory: str | None = None
    summary: str | None = None
    period_label: str | None = Field(
        default=None,
        description="Reporting period this document covers, if inferable: 'FY2024', 'Q3-2024'.",
    )
    year: int | None = Field(default=None, ge=2000, le=2100)


class YearCoverageGap(FinancexModel):
    """A year for which no financial_report or activity_report was found."""

    year: int = Field(ge=2000, le=2100)
    kind: str = Field(description="'financial_report' or 'activity_report'.")
    sources_tried: list[str] = Field(
        default_factory=list,
        description="Source IDs attempted: 'kap', 'fintables', etc.",
    )
    reason: str | None = Field(
        default=None,
        description="Why the gap exists: '404_all_sources', 'rate_limited', etc.",
    )


class DataCollectionManifest(FinancexModel):
    """Summary of a data_collection run for one ticker."""

    # Required
    ticker: str
    collected_at: datetime
    since: date
    until: date
    documents: list[CollectedDocument] = Field(default_factory=list)

    # Optional diagnostics
    sources_consulted: list[SourceRef] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    coverage_gaps: list[YearCoverageGap] = Field(
        default_factory=list,
        description="Years within the window that lack a financial or activity report.",
    )

    def financial_reports(self) -> list[CollectedDocument]:
        return [d for d in self.documents if d.kind == "financial_report"]

    def activity_reports(self) -> list[CollectedDocument]:
        return [d for d in self.documents if d.kind == "activity_report"]
