"""Schema package — re-exports for ergonomic imports.

Usage:
    from financex.schemas import TickerPackage, MetaInfo, CURRENT_SCHEMA_VERSION
"""

from financex.schemas.analyst import AnalystConsensus, AnalystReport, Recommendation
from financex.schemas.base import (
    CURRENT_SCHEMA_VERSION,
    Confidence,
    Currency,
    FinancexModel,
    Money,
    Ratio,
    ReportingPeriod,
    SourceRef,
)
from financex.schemas.brand import BrandIdentity
from financex.schemas.company import CompanyInfo, Subsidiary
from financex.schemas.data_collection import CollectedDocument, DataCollectionManifest
from financex.schemas.engine import (
    DcfResult,
    DcfSensitivityCell,
    EngineOutput,
    EngineRatios,
    EngineScores,
    RatioValue,
)
from financex.schemas.esg import CbamExposure, EsgData, ExternalEsgRating, RatingAgency
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    EquityChange,
    Financials,
    IncomeStatement,
    PeriodFinancials,
)
from financex.schemas.kap import KapEvent, KapEvents
from financex.schemas.macro import MacroSnapshot, TransmissionImpact
from financex.schemas.market import MarketData, MarketSnapshot, OhlcvBar
from financex.schemas.meta import MetaInfo
from financex.schemas.package import TickerPackage
from financex.schemas.quality import QualityControl, QualityFlag, Severity
from financex.schemas.timeline import (
    EventForTimeline,
    Phase,
    PriorityAlert,
    Timeline,
    TimelineBucket,
    Urgency,
)

__all__ = [
    "CURRENT_SCHEMA_VERSION",
    "AnalystConsensus",
    "AnalystReport",
    "BalanceSheet",
    "BrandIdentity",
    "CashFlowStatement",
    "CbamExposure",
    "CollectedDocument",
    "CompanyInfo",
    "DataCollectionManifest",
    "Confidence",
    "Currency",
    "DcfResult",
    "DcfSensitivityCell",
    "EngineOutput",
    "EngineRatios",
    "EngineScores",
    "EquityChange",
    "EsgData",
    "ExternalEsgRating",
    "FinancexModel",
    "Financials",
    "IncomeStatement",
    "KapEvent",
    "KapEvents",
    "MacroSnapshot",
    "MarketData",
    "MarketSnapshot",
    "MetaInfo",
    "Money",
    "OhlcvBar",
    "PeriodFinancials",
    "QualityControl",
    "QualityFlag",
    "Ratio",
    "RatingAgency",
    "RatioValue",
    "Recommendation",
    "ReportingPeriod",
    "Severity",
    "SourceRef",
    "Subsidiary",
    "TechnicalIndicators",
    "TickerPackage",
    "Timeline",
    "TimelineBucket",
    "TransmissionImpact",
    "EventForTimeline",
    "Phase",
    "PriorityAlert",
    "Urgency",
]
