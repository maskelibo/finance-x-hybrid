"""Company-level static facts — identity, sector, subsidiaries."""

from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel, Ratio


class Subsidiary(FinancexModel):
    """Holding-company subsidiary / participation."""

    name: str
    ticker: str | None = Field(default=None, description="If listed; null for private subsidiaries.")
    ownership_pct: Ratio = Field(description="0.40 means 40% stake.")
    segment: str | None = None
    market_value_try: Decimal | None = Field(
        default=None,
        description="Fair value of the stake in TRY, if computable.",
    )


class CompanyInfo(FinancexModel):
    """Identity block. Required fields must be known before a package is valid."""

    name: str = Field(description="Legal name, e.g. 'Koç Holding A.Ş.'.")
    sector: str = Field(
        description="One of: holding, steel, refinery, banking, telecom, aviation, retail, defense, energy, other.",
    )

    # --- optional --------------------------------------------------------
    industry_detail: str | None = Field(default=None, description="Finer sub-sector, e.g. 'integrated steel'.")
    is_holding: bool = Field(default=False, description="If True, SOTP valuation is mandatory downstream.")
    founded_year: int | None = Field(default=None, ge=1800, le=2100)
    employees: int | None = Field(default=None, ge=0)
    subsidiaries: list[Subsidiary] = Field(default_factory=list)
    description: str | None = None
