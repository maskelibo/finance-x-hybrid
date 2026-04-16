"""TickerPackage — the single source-of-truth container.

Exported as JSON to the Node backend, imported by every Python runner.
This is the contract that survives IPC.
"""

from __future__ import annotations

from pydantic import Field

from financex.schemas.analyst import AnalystConsensus
from financex.schemas.base import FinancexModel
from financex.schemas.brand import BrandIdentity
from financex.schemas.company import CompanyInfo
from financex.schemas.engine import EngineOutput
from financex.schemas.esg import EsgData
from financex.schemas.financials import Financials
from financex.schemas.kap import KapEvents
from financex.schemas.macro import MacroSnapshot, TransmissionImpact
from financex.schemas.market import MarketData
from financex.schemas.meta import MetaInfo
from financex.schemas.quality import QualityControl
from financex.schemas.technical import TechnicalIndicators


class TickerPackage(FinancexModel):
    """The full bundle produced by the Python data layer.

    Required vs Optional here encodes the hybrid doctrine:
      Required = without this, the LLM reasoning layer has no floor to stand on.
      Optional = missing is annoying, not fatal — flagged in `quality.missing_fields`.
    """

    # --- required --------------------------------------------------------
    meta: MetaInfo
    company: CompanyInfo
    financials: Financials
    market: MarketData

    # --- optional --------------------------------------------------------
    technical: TechnicalIndicators | None = None
    macro: MacroSnapshot | None = None
    transmission: TransmissionImpact | None = None
    kap_events: KapEvents | None = None
    analyst: AnalystConsensus | None = None
    esg: EsgData | None = None
    brand: BrandIdentity | None = None
    engine_results: EngineOutput | None = None

    # Quality control — always present, empty block means "producer asserted nothing is wrong".
    quality: QualityControl = Field(default_factory=QualityControl)
