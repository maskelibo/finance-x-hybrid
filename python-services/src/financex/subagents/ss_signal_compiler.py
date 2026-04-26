"""ss_signal_compiler — strategic_synthesis Phase 2 deterministic.

Aggregates 3 Phase 1 extractor outputs (financial / event / macro signals) and
the compact_summary_pack base context into a canonical signal_map. This output
matches the legacy ss_signal_merger schema so downstream sub-agents
(ss_contradiction_flag, ss_thesis_writer) consume it unchanged.

Inputs (task_inputs):
- ticker, sector, is_holding, current_price_try, market_cap_try_mn (pack base)
- top_valuation_outputs, top_sector_findings, unresolved_contradictions,
  citation_sensitive_facts (residual pack sections — used for data_quality
  signal emission, not for primary signals)
- previous_financial_signals (chain-injected by shadow runner; may be missing
  if extractor failed)
- previous_event_signals
- previous_macro_signals

Outputs canonical signal_map:
- signals[]: merged Phase 1 signals + valuation/sector data_quality signals +
  citation-tagged residual signals + unresolved_contradictions surfaced as
  signals
- holding_signals[]: deterministic for known Turkish holdings
- data_quality.{used_pack_sections, missing_pack_sections, signal_count_by_source,
  extractor_status, holding_override_applied}
- data_gaps[]
"""

from __future__ import annotations

import json
import sys


_HOLDING_PORTFOLIO_MIX = {
    "KCHOL": "Otomotiv (FROTO+TOFAS), enerji (TUPRS+AYGAZ), finans (YKBNK), perakende ve teknoloji segmentleri konsolide gelir tabanını çeşitlendiriyor.",
    "SAHOL": "Bankacılık (AKBNK), enerji (ENERJISA), perakende (CARSI), endüstri ve dijital portföy çeşitlendirilmiş NAV tabanı sunar.",
    "DOHOL": "Medya, enerji, otomotiv, perakende ve gayrimenkul segmentlerinde holding mix.",
    "ENKAI": "İnşaat, enerji, gayrimenkul ve sanayi yatırımları.",
    "TKFEN": "İnşaat-taahhüt (TKFEN), tarım (TKFEN tarım) ve sanayi yatırımları.",
}

_HOLDING_DISCOUNT_NOTE = "Holding indirimi historical median civarında; NAV breakdown thesis'i destekleyen önemli bir lens."

_PACK_SECTIONS_FULL = (
    "top_financial_insights",
    "top_valuation_outputs",
    "top_sector_findings",
    "top_macro_impacts",
    "top_event_conclusions",
    "unresolved_contradictions",
    "citation_sensitive_facts",
)


def _renumber_signal(prefix: str, idx: int, signal: dict) -> dict:
    """Compiler stage'inde signals'a global sequential id ver — extractor lokal id'leri overwrite et."""
    out = dict(signal)
    out["id"] = f"sig_{idx:03d}"
    return out


def _extractor_signals(prev_payload: object, source_label: str) -> list:
    """Extractor output'tan signals[] çek — eğer extractor null/failed ise [] dön."""
    if not isinstance(prev_payload, dict):
        return []
    sig = prev_payload.get("signals")
    if not isinstance(sig, list):
        return []
    out = []
    for s in sig:
        if isinstance(s, dict):
            out.append(s)
    return out


def _extractor_status(prev_payload: object) -> str:
    if prev_payload is None:
        return "missing"
    if isinstance(prev_payload, dict) and isinstance(prev_payload.get("signals"), list):
        return "completed"
    return "failed"


def run(inputs: dict) -> dict:
    ticker = (inputs.get("ticker") or "").upper()
    sector = inputs.get("sector")
    is_holding = bool(inputs.get("is_holding"))

    fin_payload = inputs.get("previous_financial_signals")
    evt_payload = inputs.get("previous_event_signals")
    mac_payload = inputs.get("previous_macro_signals")

    fin_signals = _extractor_signals(fin_payload, "financial_analysis")
    evt_signals = _extractor_signals(evt_payload, "event_impact_mapper")
    mac_signals = _extractor_signals(mac_payload, "macro_analysis")

    val_outputs = inputs.get("top_valuation_outputs") or []
    sector_findings = inputs.get("top_sector_findings") or []
    citations = inputs.get("citation_sensitive_facts") or []
    unresolved_contradictions = inputs.get("unresolved_contradictions") or []
    fin_pack = inputs.get("top_financial_insights") or []
    evt_pack = inputs.get("top_event_conclusions") or []
    mac_pack = inputs.get("top_macro_impacts") or []

    # Merge signals with global sequential ids
    merged: list = []
    seq = 1
    for s in fin_signals:
        merged.append(_renumber_signal("sig", seq, s))
        seq += 1
    for s in evt_signals:
        merged.append(_renumber_signal("sig", seq, s))
        seq += 1
    for s in mac_signals:
        merged.append(_renumber_signal("sig", seq, s))
        seq += 1

    # Valuation: pack sections expose a slot for valuation signals via top_valuation_outputs
    # (compact_summary_pack.extractValuationInsights). Compiler emits canonical
    # signals from those when present, else surfaces a data_quality signal.
    if val_outputs:
        for v in val_outputs:
            if not isinstance(v, dict):
                continue
            text = v.get("text") or ""
            if not text:
                continue
            merged.append({
                "id": f"sig_{seq:03d}",
                "source_agent": v.get("source_agent") or "valuation_agent",
                "category": "valuation",
                "signal_text": text[:240],
                "polarity": v.get("direction") or "neutral",
                "magnitude_try_mn": v.get("magnitude_try_mn"),
                "magnitude_pct": v.get("magnitude_pct"),
                "confidence": v.get("confidence") or "medium",
                "weight": 8 if (v.get("category") or "").startswith("dcf") else 6,
                "reference": v.get("ref"),
            })
            seq += 1
    else:
        merged.append({
            "id": f"sig_{seq:03d}",
            "source_agent": "valuation_agent",
            "category": "data_quality",
            "signal_text": "DCF target ve peer multiples bu run'da upstream'de yok (valuation_data_gap). Thesis qualitative pillar'lara dayanır.",
            "polarity": "neutral",
            "magnitude_try_mn": None,
            "magnitude_pct": None,
            "confidence": "high",
            "weight": 9,
            "reference": "pack.top_valuation_outputs=[]",
        })
        seq += 1

    if sector_findings:
        for sc in sector_findings:
            if not isinstance(sc, dict):
                continue
            text = sc.get("text") or ""
            if not text:
                continue
            merged.append({
                "id": f"sig_{seq:03d}",
                "source_agent": sc.get("source_agent") or "sector_competition",
                "category": "sector",
                "signal_text": text[:240],
                "polarity": sc.get("direction") or "neutral",
                "confidence": sc.get("confidence") or "medium",
                "weight": 6,
                "reference": sc.get("ref"),
                "magnitude_try_mn": sc.get("magnitude_try_mn"),
                "magnitude_pct": sc.get("magnitude_pct"),
            })
            seq += 1
    else:
        merged.append({
            "id": f"sig_{seq:03d}",
            "source_agent": "sector_competition",
            "category": "data_quality",
            "signal_text": "Sector benchmark + peer group bu run'da upstream'de yok (sector_data_gap). Holding context segment-mix pillar'ı öne çıksın.",
            "polarity": "neutral",
            "magnitude_try_mn": None,
            "magnitude_pct": None,
            "confidence": "high",
            "weight": 7,
            "reference": "pack.top_sector_findings=[]",
        })
        seq += 1

    # Unresolved contradictions — surface as risk_flag signals (informational; ss_contradiction_flag will reprocess)
    for idx, c in enumerate(unresolved_contradictions[:3], start=1):
        text = c if isinstance(c, str) else str(c)
        if not text:
            continue
        merged.append({
            "id": f"sig_{seq:03d}",
            "source_agent": "strategic_synthesis",
            "category": "risk_flag",
            "signal_text": ("Unresolved contradiction: " + text)[:240],
            "polarity": "mixed",
            "magnitude_try_mn": None,
            "magnitude_pct": None,
            "confidence": "medium",
            "weight": 6,
            "reference": f"unresolved_contradictions[{idx-1}]",
        })
        seq += 1

    # Citations — top 3 surfaced as informational signals (low weight)
    for idx, c in enumerate(citations[:3], start=1):
        if not isinstance(c, dict):
            continue
        fact = c.get("fact") or ""
        if not fact:
            continue
        merged.append({
            "id": f"sig_{seq:03d}",
            "source_agent": c.get("source") or "compact_pack",
            "category": "citation",
            "signal_text": fact[:240],
            "polarity": "neutral",
            "magnitude_try_mn": None,
            "magnitude_pct": None,
            "confidence": "high",
            "weight": 4,
            "reference": c.get("source"),
        })
        seq += 1

    # Holding signals — deterministic per known ticker
    holding_signals = []
    holding_override_applied = False
    if is_holding:
        holding_override_applied = True
        portfolio_mix_text = _HOLDING_PORTFOLIO_MIX.get(ticker, "Holding portfolio mix scale + diversification pillar'ı.")
        holding_signals.append({
            "id": f"sig_h_001",
            "category": "portfolio_mix",
            "signal_text": portfolio_mix_text[:240],
            "polarity": "positive",
            "weight": 7,
            "reference": "sector_canonical=holding",
        })
        holding_signals.append({
            "id": f"sig_h_002",
            "category": "holding_discount",
            "signal_text": _HOLDING_DISCOUNT_NOTE,
            "polarity": "neutral",
            "weight": 6,
            "reference": "registry_holding_override",
        })

    # data_quality
    used_sections = []
    missing_sections = []
    for name, items in (
        ("top_financial_insights", fin_pack),
        ("top_valuation_outputs", val_outputs),
        ("top_sector_findings", sector_findings),
        ("top_macro_impacts", mac_pack),
        ("top_event_conclusions", evt_pack),
        ("unresolved_contradictions", unresolved_contradictions),
        ("citation_sensitive_facts", citations),
    ):
        if items:
            used_sections.append(name)
        else:
            missing_sections.append(name)

    signal_count_by_source: dict = {}
    for s in merged:
        src = s.get("source_agent", "unknown")
        signal_count_by_source[src] = signal_count_by_source.get(src, 0) + 1

    extractor_status = {
        "ss_financial_signal_extractor": _extractor_status(fin_payload),
        "ss_event_signal_extractor": _extractor_status(evt_payload),
        "ss_macro_signal_extractor": _extractor_status(mac_payload),
    }

    annotations: list = []
    if any(v != "completed" for v in extractor_status.values()):
        failed = [k for k, v in extractor_status.items() if v != "completed"]
        annotations.append(f"Phase 1 partial — non-completed extractors: {', '.join(failed)}; compiler degraded gracefully")
    if not val_outputs:
        annotations.append("valuation_data_gap surfaced as data_quality signal (no fake DCF)")
    if not sector_findings:
        annotations.append("sector_data_gap surfaced as data_quality signal")
    if holding_override_applied:
        annotations.append(f"holding context applied for {ticker}")

    data_gaps: list = []
    if not val_outputs:
        data_gaps.append("valuation_data_gap")
    if not sector_findings:
        data_gaps.append("sector_data_gap")
    if not fin_pack:
        data_gaps.append("financial_pack_empty")
    if not mac_pack:
        data_gaps.append("macro_pack_partial_or_empty")
    if extractor_status["ss_financial_signal_extractor"] != "completed":
        data_gaps.append("financial_extractor_unavailable")
    if extractor_status["ss_event_signal_extractor"] != "completed":
        data_gaps.append("event_extractor_unavailable")
    if extractor_status["ss_macro_signal_extractor"] != "completed":
        data_gaps.append("macro_extractor_unavailable")

    return {
        "ticker": ticker,
        "sector": sector,
        "is_holding": is_holding,
        "signals": merged,
        "holding_signals": holding_signals,
        "grouped_summary": {"skipped_count": 0, "groups": []},
        "data_quality": {
            "used_pack_sections": used_sections,
            "missing_pack_sections": missing_sections,
            "signal_count_by_source": signal_count_by_source,
            "extractor_status": extractor_status,
            "holding_override_applied": holding_override_applied,
            "annotations": annotations,
        },
        "data_gaps": data_gaps,
        "output_mode": "FULL",
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    print(json.dumps(run(inputs), ensure_ascii=False))


if __name__ == "__main__":
    main()
