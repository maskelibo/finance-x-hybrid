"""
Aviation sector calculator — EBITDAR, RPK, ASK, Load Factor, CASK, RASK.

Why this module exists:
  THYAO FY2025 report surfaced AVIATION_METRICS_MISSING — the generic
  engine had no sector-aware calculator, so EV/EBITDAR and aviation
  KPIs were absent, leaving a known valuation gap.

How it works:
  1. Accept `activity_report_text` extracted from the KAP activity
     report via parse_standardization.
  2. Regex-extract RPK / ASK / Load Factor / CASK / RASK / fuel-hedge /
     aircraft-rent using tight unit-anchored patterns (unit keyword
     required to avoid matching arbitrary percentages or trailing years).
  3. Derive EBITDAR = EBITDA + aircraft-rent (IFRS 16 roll-back).
  4. Return AviationKpis dataclass.

Units:
  ASK / RPK:   million seat-kilometers
  Load factor: percent
  CASK / RASK: US cents per ASK
  EBITDAR:     TRY millions

Reference: skills/sector-aviation/SKILL.md.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class AviationKpis:
    ticker: str
    fiscal_period: str
    ebitdar_try_millions: Optional[Decimal] = None
    ebitdar_margin_pct: Optional[Decimal] = None
    ask_million_seatkm: Optional[Decimal] = None
    rpk_million_seatkm: Optional[Decimal] = None
    load_factor_pct: Optional[Decimal] = None
    cask_cents_per_ask: Optional[Decimal] = None
    rask_cents_per_ask: Optional[Decimal] = None
    cask_ex_fuel_cents_per_ask: Optional[Decimal] = None
    fuel_hedge_ratio_pct: Optional[Decimal] = None
    aircraft_rent_try_millions: Optional[Decimal] = None
    source_notes: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        def _d(v):
            return float(v) if v is not None else None
        return {
            "ticker": self.ticker,
            "fiscal_period": self.fiscal_period,
            "ebitdar_try_millions": _d(self.ebitdar_try_millions),
            "ebitdar_margin_pct": _d(self.ebitdar_margin_pct),
            "ask_million_seatkm": _d(self.ask_million_seatkm),
            "rpk_million_seatkm": _d(self.rpk_million_seatkm),
            "load_factor_pct": _d(self.load_factor_pct),
            "cask_cents_per_ask": _d(self.cask_cents_per_ask),
            "rask_cents_per_ask": _d(self.rask_cents_per_ask),
            "cask_ex_fuel_cents_per_ask": _d(self.cask_ex_fuel_cents_per_ask),
            "fuel_hedge_ratio_pct": _d(self.fuel_hedge_ratio_pct),
            "aircraft_rent_try_millions": _d(self.aircraft_rent_try_millions),
            "source_notes": self.source_notes,
            "warnings": self.warnings,
        }


def _parse_num(raw):
    if raw is None:
        return None
    s = re.sub(r"[\s\xa0 ]+", "", str(raw).strip())
    if not re.search(r"\d", s):
        return None
    sign = ""
    if s.startswith(("+", "-")):
        sign, s = s[0], s[1:]
    if "." in s and "," in s:
        last = max(s.rfind("."), s.rfind(","))
        decimal_sep = s[last]
        group_sep = "," if decimal_sep == "." else "."
        s = s.replace(group_sep, "").replace(decimal_sep, ".")
    elif "," in s:
        idx = s.rfind(",")
        trailing = s[idx + 1:]
        if len(trailing) == 3 and trailing.isdigit():
            s = s.replace(",", "")
        else:
            s = s.replace(",", ".")
    elif "." in s:
        idx = s.rfind(".")
        trailing = s[idx + 1:]
        if len(trailing) == 3 and trailing.isdigit():
            s = s.replace(".", "")
    try:
        return Decimal(sign + s)
    except Exception:
        return None


_NUM = r"[+-]?\d[\d.,\s\xa0]*"

_REGEX_ASK = re.compile(
    r"\b(?:ASK|Arz\s*Edilen\s*Koltuk[\s\-]?Km)\b[^:=\n]{0,60}?[:=]\s*"
    r"(?P<num>" + _NUM + r")\s*"
    r"(?:mn|milyon|million|bn|milyar|billion|koltuk[\s\-]?km)",
    re.IGNORECASE,
)
_REGEX_RPK = re.compile(
    r"\b(?:RPK|Yolcu\s*Koltuk[\s\-]?Km)\b[^:=\n]{0,60}?[:=]\s*"
    r"(?P<num>" + _NUM + r")\s*"
    r"(?:mn|milyon|million|bn|milyar|billion|koltuk[\s\-]?km)",
    re.IGNORECASE,
)
_REGEX_LOAD_FACTOR = re.compile(
    r"(?:doluluk\s*oran[ıi]|load\s*factor|yolculuk\s*fakt[öo]r[üu])"
    r"[^%\n]{0,30}?[:=]?\s*%?\s*"
    r"(?P<num>\d+(?:[.,]\d+)?)\s*%?",
    re.IGNORECASE,
)
_REGEX_CASK = re.compile(
    r"\bCASK\b(?!\s*ex)(?:[^:=\n]{0,40})?[:=]\s*"
    r"(?P<num>\d+(?:[.,]\d+)?)\s*(?:[¢c]|cent|kuru?)\s*/?\s*ASK",
    re.IGNORECASE,
)
_REGEX_CASK_EX_FUEL = re.compile(
    r"\b(?:CASK\s*ex[\s\-]?fuel|ex[\s\-]?fuel(?:\s*CASK)?|CASK\s*\(?ex[\s\-]?fuel\)?)"
    r"[^:=\n]{0,40}?[:=]?\s*"
    r"(?P<num>\d+(?:[.,]\d+)?)\s*(?:[¢c]|cent|kuru?)\s*/?\s*ASK",
    re.IGNORECASE,
)
_REGEX_RASK = re.compile(
    r"\bRASK\b(?:[^:=\n]{0,40})?[:=]\s*"
    r"(?P<num>\d+(?:[.,]\d+)?)\s*(?:[¢c]|cent|kuru?)\s*/?\s*ASK",
    re.IGNORECASE,
)
_REGEX_FUEL_HEDGE = re.compile(
    r"(?:yak[ıi]t|fuel)\s*hedge[^%\n]{0,80}?"
    r"(?:oran[ıi]\s*)?%\s*(?P<num>\d+(?:[.,]\d+)?)",
    re.IGNORECASE,
)
_REGEX_AIRCRAFT_RENT = re.compile(
    r"\b(?:aircraft\s*rent|u[çc]ak\s*kira(?:s[ıi])?(?:\s*gideri)?|operating\s*lease\s*expense)"
    r"[^:=\n]{0,60}?[:=]?\s*(?P<num>\d[\d.,\s\xa0]*)\s*"
    r"(?:mn|milyon|million|bn|milyar|billion)\s*(?:TRY|TL|USD)?",
    re.IGNORECASE,
)


def _extract(pattern, text):
    m = pattern.search(text)
    if not m:
        return None
    return _parse_num(m.group("num"))


def compute_aviation_kpis(
    ticker,
    fiscal_period,
    activity_report_text,
    *,
    ebitda_try_millions=None,
    revenue_try_millions=None,
    opex_try_millions=None,
    fx_try_per_usd=Decimal("35"),
):
    result = AviationKpis(ticker=ticker, fiscal_period=fiscal_period)

    if not activity_report_text or not activity_report_text.strip():
        result.warnings.append("activity_report_text empty; aviation KPIs unparseable")
        return result

    result.ask_million_seatkm = _extract(_REGEX_ASK, activity_report_text)
    result.rpk_million_seatkm = _extract(_REGEX_RPK, activity_report_text)
    result.load_factor_pct = _extract(_REGEX_LOAD_FACTOR, activity_report_text)
    result.cask_cents_per_ask = _extract(_REGEX_CASK, activity_report_text)
    result.cask_ex_fuel_cents_per_ask = _extract(_REGEX_CASK_EX_FUEL, activity_report_text)
    result.rask_cents_per_ask = _extract(_REGEX_RASK, activity_report_text)
    result.fuel_hedge_ratio_pct = _extract(_REGEX_FUEL_HEDGE, activity_report_text)
    result.aircraft_rent_try_millions = _extract(_REGEX_AIRCRAFT_RENT, activity_report_text)

    if (
        result.load_factor_pct is None
        and result.ask_million_seatkm is not None
        and result.rpk_million_seatkm is not None
        and result.ask_million_seatkm > 0
    ):
        result.load_factor_pct = (
            (result.rpk_million_seatkm / result.ask_million_seatkm) * Decimal("100")
        ).quantize(Decimal("0.01"))
        result.source_notes.append("load_factor back-computed from RPK/ASK")

    if ebitda_try_millions is not None:
        if result.aircraft_rent_try_millions is not None:
            result.ebitdar_try_millions = ebitda_try_millions + result.aircraft_rent_try_millions
        else:
            result.ebitdar_try_millions = ebitda_try_millions
            result.warnings.append(
                "EBITDAR: aircraft_rent not found in activity report - using EBITDA as proxy"
            )
        if revenue_try_millions and revenue_try_millions > 0:
            result.ebitdar_margin_pct = (
                (result.ebitdar_try_millions / revenue_try_millions) * Decimal("100")
            ).quantize(Decimal("0.01"))

    if (
        result.cask_cents_per_ask is None
        and opex_try_millions is not None
        and result.ask_million_seatkm is not None
        and result.ask_million_seatkm > 0
        and fx_try_per_usd > 0
    ):
        cask_try_per_ask = opex_try_millions / result.ask_million_seatkm
        result.cask_cents_per_ask = (cask_try_per_ask / fx_try_per_usd * Decimal("100")).quantize(
            Decimal("0.01")
        )
        result.source_notes.append(
            "CASK back-computed from opex/ASK using fx=" + str(fx_try_per_usd) + " TRY/USD"
        )

    missing = [
        label for label, val in (
            ("ASK", result.ask_million_seatkm),
            ("RPK", result.rpk_million_seatkm),
            ("Load Factor", result.load_factor_pct),
        ) if val is None
    ]
    if missing:
        result.warnings.append(
            "aviation KPIs not extracted from activity report: " + ", ".join(missing)
        )

    return result
