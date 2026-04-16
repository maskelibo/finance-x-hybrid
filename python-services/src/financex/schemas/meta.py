"""Package-level metadata — who built this package, when, against what schema."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import Field

from financex.schemas.base import CURRENT_SCHEMA_VERSION, FinancexModel, SourceRef


class MetaInfo(FinancexModel):
    """Identifies a TickerPackage and tracks its provenance.

    Required: ticker, package_date, schema_version, producer.
    Optional: sources list, producer_version, notes.
    """

    ticker: str = Field(
        min_length=3,
        max_length=10,
        description="BIST ticker in uppercase, e.g. 'KCHOL', 'THYAO'. Minimum 3 characters.",
        pattern=r"^[A-Z][A-Z0-9]{2,}$",
    )
    package_date: date = Field(description="Reporting date the package represents (not build time).")
    schema_version: str = Field(default=CURRENT_SCHEMA_VERSION)
    producer: str = Field(
        description="Python module that built this package, e.g. 'financex.crawlers.kchol'."
    )

    # --- optional --------------------------------------------------------
    built_at: datetime | None = Field(default=None, description="When the producer finished.")
    producer_version: str | None = None
    sources: list[SourceRef] = Field(
        default_factory=list,
        description="Canonical sources consulted (not exhaustive — line-level SourceRef lives on the data).",
    )
    notes: str | None = Field(default=None, description="Free-form producer notes.")
