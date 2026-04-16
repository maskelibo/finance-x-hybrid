"""ESG scores + CBAM/ETS cost estimate. LLM handles the scoring narrative."""

from __future__ import annotations

from decimal import Decimal
from enum import Enum

from pydantic import Field

from financex.schemas.base import FinancexModel


class RatingAgency(str, Enum):
    MSCI = "msci"
    SUSTAINALYTICS = "sustainalytics"
    SP_GLOBAL = "sp_global"
    BIST_SUSTAIN = "bist_sustain"
    CDP = "cdp"
    OTHER = "other"


class ExternalEsgRating(FinancexModel):
    agency: RatingAgency
    rating: str
    score_numeric: Decimal | None = None
    as_of_year: int | None = Field(default=None, ge=2000, le=2100)


class CbamExposure(FinancexModel):
    """CBAM / ETS carbon cost exposure — material for steel, refinery, cement filers."""

    scope_1_tco2: Decimal | None = None
    scope_2_tco2: Decimal | None = None
    scope_3_tco2: Decimal | None = None
    cbam_default_intensity: Decimal | None = Field(
        default=None, description="Default tCO2/ton product assumed by EU if unverified."
    )
    annual_cbam_cost_eur_base: Decimal | None = Field(
        default=None, description="Python-computed base-case cost assuming current certificate price."
    )
    annual_ets_cost_eur_base: Decimal | None = None
    notes: str | None = None


class EsgData(FinancexModel):
    """All-optional block. LLM later adds E/S/G scores (1-10) and greenwashing judgment."""

    external_ratings: list[ExternalEsgRating] = Field(default_factory=list)
    cbam: CbamExposure | None = None

    # Scoring placeholders — populated by the LLM layer, not Python.
    score_e: Decimal | None = Field(default=None, ge=0, le=10)
    score_s: Decimal | None = Field(default=None, ge=0, le=10)
    score_g: Decimal | None = Field(default=None, ge=0, le=10)
    score_overall: Decimal | None = Field(default=None, ge=0, le=10)
    greenwashing_flag: bool | None = None
