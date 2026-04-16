"""Shared primitives used across TickerPackage sub-schemas.

Hybrid doctrine: each sub-model declares its own Required vs Optional
fields. This module only defines the shared building blocks.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated, TypeAlias

from pydantic import BaseModel, ConfigDict, Field

# Semver — bumped on schema changes. Consumers compare against their
# expected version and warn (MODE='warn') or block (MODE='block').
CURRENT_SCHEMA_VERSION = "1.0.0"


class FinancexModel(BaseModel):
    """Base for every schema model.

    - extra='ignore' → forward-compatible with future fields producers
      may add without breaking older consumers.
    - str_strip_whitespace=True → defense against messy HTML scrape input.
    """

    model_config = ConfigDict(
        extra="ignore",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class Currency(str, Enum):
    TRY = "TRY"
    USD = "USD"
    EUR = "EUR"


class ReportingPeriod(str, Enum):
    """BIST reporting cadence."""

    FY = "FY"
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"
    H1 = "H1"


class Sector(str, Enum):
    """High-level sector profile. Drives which label maps, column layouts
    and reconciliation checks apply. Pipeline elements read this off
    CompanyInfo.sector or let the parser auto-detect from the PDF header.
    """

    INDUSTRIAL = "industrial"   # manufacturing, retail, services (default)
    HOLDING = "holding"         # dual-stream P&L (sanayi + finans)
    BANKING = "banking"         # BDDK format, TP/YP/Toplam columns
    INSURANCE = "insurance"     # premium/claims P&L
    REIT = "reit"               # GYO
    UTILITY = "utility"         # EPDK-regulated
    AVIATION = "aviation"       # RPK/ASK/CASK metrics
    UNKNOWN = "unknown"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


# Financial numbers use Decimal — float rounding is unacceptable in
# accounting math. Pydantic serializes Decimal as a JSON string so
# precision survives IPC to the Node side.
Money: TypeAlias = Annotated[Decimal, Field(description="Monetary amount, full precision.")]
Ratio: TypeAlias = Annotated[Decimal, Field(description="Ratio or percentage as decimal (0.15 = 15%).")]


class SourceRef(FinancexModel):
    """Provenance pointer — every material datum must cite at least one."""

    source_id: str = Field(description="e.g. 'kap', 'is_yatirim', 'tcmb', 'bigpara'.")
    url: str | None = None
    fetched_at: datetime
    detail: str | None = Field(
        default=None,
        description="e.g. KAP disclosure ID, PDF page number, API endpoint.",
    )
