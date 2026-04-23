"""
IAS 29 / TMS 29 EBITDA calculation (hyperinflation accounting).

Turkiye 2022+ dönemlerinde TÜFE kümülatif >%100 olduğu için IFRS/SPK raporları
IAS 29 ("Yüksek Enflasyonlu Ekonomilerde Finansal Raporlama") altında
yeniden düzenlenmiş (restated) olarak sunulur.

Bu modül `compute_ebitda_ias29()` sağlar — operating-only EBITDA'yı doğru
formülle hesaplar ve management-reported EBITDA ile reconciliation yapar.

## Formül

    EBITDA_ias29 = operating_profit_restated + D&A_restated

## Net Parasal Pozisyon Kazancı/Kaybı (NMP) — EXCLUDED

NMP, IAS 29 altında operating profit'in ALTINDA yer alan non-operating
bir P&L satırıdır (tipik olarak Not 35, finansal giderlerden sonra, vergi
öncesi kârdan önce). EBITDA'ya dahil EDİLMEZ. Eğer yönetimin açıkladığı
"EBITDA" rakamı bu kalemi içeriyorsa, bu modül divergence'ı tespit edip
likely_cause raporlar.

## Kaynak doğrulama

Bu yaklaşım EREGL FY2024 (KAP bildirim 1392292, Not 35) ve ARCLK FY2024 H1
(KAP bildirim 1317392, Not 2.1) kaynak finansal tablolarından doğrulanmıştır.

Ayrıca mevcut IAS29 skill'inin "Reported EBITDA − Net Monetary Gain"
formülü, bu modülün reconciliation adımına denk düşer: management'in
NMP-kontamine rakamının düzeltilmesi.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional

from ..schemas.financials import PeriodFinancials


# Yönetim raporunun NMP'yi EBITDA'ya dahil etmiş olma ihtimali için
# tolerans: reported − computed farkının NMP'ye yakınlığı (%5 içinde).
_NMP_INCLUSION_TOLERANCE = Decimal("0.05")


@dataclass
class Ias29EbitdaComponents:
    operating_profit_restated: Optional[Decimal] = None
    depreciation_restated: Optional[Decimal] = None
    amortization_restated: Optional[Decimal] = None
    # NMP ayrı tutulur — bilgi amaçlı, hesaba DAHİL DEĞİL.
    net_monetary_position_gain_loss: Optional[Decimal] = None


@dataclass
class Ias29Reconciliation:
    reported_ebitda: Optional[Decimal]
    computed_ebitda_ias29: Optional[Decimal]
    divergence: Optional[Decimal]
    likely_cause: str
    action_hint: str


@dataclass
class Ias29EbitdaResult:
    ticker: str
    fiscal_period: str
    ias29_applied: bool
    ebitda_ias29: Optional[Decimal]
    components: Ias29EbitdaComponents
    excluded_items: dict[str, Optional[Decimal]]
    reconciliation: Optional[Ias29Reconciliation]
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        def _d(v: Optional[Decimal]) -> Optional[float]:
            return float(v) if v is not None else None

        return {
            "ticker": self.ticker,
            "fiscal_period": self.fiscal_period,
            "ias29_applied": self.ias29_applied,
            "ebitda_ias29": _d(self.ebitda_ias29),
            "components": {
                "operating_profit_restated": _d(self.components.operating_profit_restated),
                "depreciation_restated": _d(self.components.depreciation_restated),
                "amortization_restated": _d(self.components.amortization_restated),
                "net_monetary_position_gain_loss": _d(
                    self.components.net_monetary_position_gain_loss
                ),
            },
            "excluded_items": {k: _d(v) for k, v in self.excluded_items.items()},
            "reconciliation": (
                {
                    "reported_ebitda": _d(self.reconciliation.reported_ebitda),
                    "computed_ebitda_ias29": _d(self.reconciliation.computed_ebitda_ias29),
                    "divergence": _d(self.reconciliation.divergence),
                    "likely_cause": self.reconciliation.likely_cause,
                    "action_hint": self.reconciliation.action_hint,
                }
                if self.reconciliation is not None
                else None
            ),
            "warnings": self.warnings,
        }


def _resolve_da(pf: PeriodFinancials) -> tuple[Optional[Decimal], Optional[Decimal]]:
    """D&A satırları için fallback: income statement, sonra cash flow."""
    is_ = pf.income_statement
    cf = pf.cash_flow
    # Schema'da ayrık depreciation / amortization yok; tek alan:
    # `depreciation_amortization` = D + A birleşik. Ayrıştıramadığımızda
    # D'ye dev verir, A'ya None. Agent prompt'unda bu görünür ve
    # reconciliation üretilebilir.
    da = is_.depreciation_amortization or (
        cf.depreciation_amortization if cf is not None else None
    )
    if da is None:
        return None, None
    return abs(da), None  # tek satır → depreciation slot'una koy


def compute_ebitda_ias29(
    pf: PeriodFinancials,
    ticker: str,
    fiscal_period: str,
) -> Ias29EbitdaResult:
    """
    IAS 29 operating-only EBITDA'yı hesapla.

    Preferred path: `operating_profit_restated + D&A_restated`
    Fallback: ham `ebitda` alanı varsa onu kullan (çoğu KAP bildirim restated).

    Net parasal pozisyon kazanç/kaybı (NMP) HİÇBİR ZAMAN eklenmez.
    NMP mevcutsa `excluded_items`'e yazılır; management-reported EBITDA
    varsa reconciliation dataclass'ı doldurulur.
    """
    is_ = pf.income_statement
    warnings: list[str] = []
    ias29_applied = bool(pf.ias29_restated)

    op_profit = is_.operating_income
    depreciation, amortization = _resolve_da(pf)

    # 1) Doğru formül: operating_profit + D + A
    ebitda_ias29: Optional[Decimal] = None
    if op_profit is not None and (depreciation is not None or amortization is not None):
        d_part = depreciation or Decimal("0")
        a_part = amortization or Decimal("0")
        ebitda_ias29 = op_profit + d_part + a_part

    # 2) Fallback: schema'daki `ebitda` alanını kullan (yönetim raporu)
    #    Turkish IFRS filings 2022+ ebitda alanı zaten restated figürü
    #    içerir (ias29_applied=True iken). Bu yol son çare.
    source_note = "computed_from_components"
    if ebitda_ias29 is None and is_.ebitda is not None:
        ebitda_ias29 = is_.ebitda
        source_note = "used_reported_ebitda_field"
        if op_profit is None:
            warnings.append("operating_income missing; fell back to reported ebitda")

    if ebitda_ias29 is None:
        warnings.append(
            "compute_ebitda_ias29: neither operating_income+D&A nor reported ebitda available"
        )

    # 3) NMP ayrı tutulur (excluded). Var ise reconciliation'a input.
    nmp = is_.monetary_gain_loss

    if not ias29_applied and nmp is not None and abs(nmp) > (
        Decimal("0.05") * abs(op_profit or Decimal("1"))
    ):
        warnings.append(
            "monetary_gain_loss material but ias29_restated=False; "
            "statements may not be IAS 29 adjusted"
        )

    # 4) Reconciliation: reported ebitda ile computed arasındaki fark
    reconciliation: Optional[Ias29Reconciliation] = None
    reported = is_.ebitda if source_note == "computed_from_components" else None
    if reported is not None and ebitda_ias29 is not None and reported != ebitda_ias29:
        divergence = reported - ebitda_ias29
        likely_cause = "unknown — verify restatement methodology"
        action_hint = "cross-check with Note 2.x (IAS 29) and Note 35 (Net Monetary Position)"

        if nmp is not None:
            # Management ebitda NMP'yi eklemiş mi? |divergence - nmp| küçükse evet.
            threshold = _NMP_INCLUSION_TOLERANCE * abs(reported)
            if abs(divergence - nmp) <= threshold:
                likely_cause = (
                    f"reported_ebitda includes net_monetary_position_gain_loss "
                    f"({float(nmp):+,.0f}); exclude per IAS 29 operating definition"
                )
                action_hint = (
                    "use computed_ebitda_ias29 (excludes NMP); "
                    "flag management disclosure inconsistency"
                )

        reconciliation = Ias29Reconciliation(
            reported_ebitda=reported,
            computed_ebitda_ias29=ebitda_ias29,
            divergence=divergence,
            likely_cause=likely_cause,
            action_hint=action_hint,
        )

    return Ias29EbitdaResult(
        ticker=ticker,
        fiscal_period=fiscal_period,
        ias29_applied=ias29_applied,
        ebitda_ias29=ebitda_ias29,
        components=Ias29EbitdaComponents(
            operating_profit_restated=op_profit,
            depreciation_restated=depreciation,
            amortization_restated=amortization,
            net_monetary_position_gain_loss=nmp,
        ),
        excluded_items={
            "net_monetary_position_gain_loss": nmp,
        },
        reconciliation=reconciliation,
        warnings=warnings,
    )
