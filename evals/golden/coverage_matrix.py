"""
Golden coverage-matrix harness for Finance-X Hybrid refactor Phase 2+.

Deterministic re-scorer. Reads each report under GOLDEN_REPORTS and emits
per-report scores for:

  * mandatory 28 metric presence (name-presence heuristic)
  * sector-specific KPI presence (if ticker is classified)
  * CoE / cost-of-equity references
  * IAS 29 references
  * truncation markers
  * benchmark references
  * counter-argument markers

Usage:
  # Pin a baseline:
  python evals/golden/coverage_matrix.py --freeze evals/golden/baseline_<date>.json

  # Score current state and diff against baseline:
  python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_<date>.json

Exit code 0 if current scores are equal-or-better than baseline on every
guarded signal; non-zero if any signal regressed.

This harness is intentionally permissive: it measures *presence* of metric
names, not numeric correctness. Its value is as a floor — Phase 2+ commits
must not make any ticker lose ground.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Pin the exact report set to stay deterministic across reruns.
GOLDEN_REPORTS: list[str] = [
    "TUPRS_Yonetim_Kurulu_Raporu_20260419.html",
    "TUPRS_Yonetim_Kurulu_Raporu_2026.html",
    "output/TUPRS_institutional_smoke.html",
    "THYAO_Yonetim_Kurulu_Raporu_20260416.html",
    "THYAO_Yonetim_Kurulu_Raporu_20260413.html",
    "TCELL_Yonetim_Kurulu_Raporu_20260415.html",
    "TCELL_Yonetim_Kurulu_Raporu_20260414.html",
    "TCELL_Kapsamli_Analiz_Raporu_2026_final_v2.html",
    "KCHOL_Yonetim_Kurulu_Raporu_20260414.html",
    "KCHOL_Kapsamli_Analiz_Raporu_2026.html",
    "EREGL_Yonetim_Kurulu_Raporu_20260413.html",
    "EREGL_Kapsamli_Analiz_Raporu_2026.html",
    "BIMAS_Yonetim_Kurulu_Raporu_20260413.html",
    "ASELS_Yonetim_Kurulu_Raporu_20260417.html",
    "SISE_YONETIM_RAPORU_2026-04-10.html",
]

MANDATORY_METRICS: dict[str, list[str]] = {
    "MM-01-net_sales":        [r"\bnet\s+sat[ıi]?[şs]", r"\brevenue\b", r"\bh[aâ]s[ıi]lat\b"],
    "MM-02-gross_profit":     [r"\bbr[uü]t\s+k[aâ]r\b", r"\bgross\s+profit\b"],
    "MM-03-gross_margin":     [r"\bbr[uü]t\s+k[aâ]rl[ıi]?l[ıi]k\b", r"\bbr[uü]t\s+marj\b", r"\bgross\s+margin\b"],
    "MM-04-gross_profit_ias29":   [r"br[uü]t\s+k[aâ]r\b.*\bIAS\s*29", r"IAS\s*29.*br[uü]t\s+k[aâ]r"],
    "MM-05-gross_margin_ias29":   [r"br[uü]t\s+marj\b.*\bIAS\s*29", r"IAS\s*29.*br[uü]t\s+(marj|k[aâ]rl[ıi])"],
    "MM-06-monetary_gain_loss":   [r"parasal\s+(kay[ıi]p|kazan[çc])", r"monetary\s+(gain|loss)", r"net\s+parasal\s+pozisyon"],
    "MM-07-ebitda":           [r"\bFAVÖK\b", r"\bFAVOK\b", r"\bEBITDA\b"],
    "MM-08-ebitda_margin":    [r"FAV[ÖO]K\s+marj", r"EBITDA\s+margin"],
    "MM-09-pretax_profit":    [r"\bVÖK\b", r"\bVOK\b", r"vergi\s+[ÖO]ncesi\s+k[aâ]r", r"pre[-\s]?tax\s+profit"],
    "MM-10-net_income":       [r"net\s+d[öo]nem\s+k[aâ]r[ıi]", r"net\s+income", r"net\s+profit"],
    "MM-11-opex_ratio":       [r"OPEX\s*/\s*(ciro|revenue)", r"opex\s+to\s+revenue"],
    "MM-12-dso":              [r"\bDSO\b", r"alaca[kg]\s+tahsil\s+s[üu]resi"],
    "MM-13-dio":              [r"\bDIO\b", r"stok\s+tutma\s+s[üu]resi", r"inventory\s+days"],
    "MM-14-dpo":              [r"\bDPO\b", r"bor[çc]\s+[öo]deme\s+s[üu]resi", r"payable\s+days"],
    "MM-15-ccc":              [r"\bCCC\b", r"nakit\s+d[öo]n[üu]?[şs]\s+d[öo]ng[üu]s[üu]", r"cash\s+conversion\s+cycle"],
    "MM-16-nwc_revenue":      [r"NWC\s*/\s*(h[aâ]s[ıi]lat|revenue)", r"net\s+working\s+capital"],
    "MM-17-net_debt":         [r"net\s+bor[çc]", r"net\s+debt"],
    "MM-18-net_debt_ebitda":  [r"net\s+bor[çc]\s*/\s*FAV[ÖO]K", r"net\s+debt\s*/\s*EBITDA"],
    "MM-19-current_ratio":    [r"cari\s+oran", r"current\s+ratio"],
    "MM-20-quick_ratio":      [r"asit[-\s]?test", r"quick\s+ratio"],
    "MM-21-fcf":              [r"\bFCF\b", r"serbest\s+nakit\s+ak[ıi][şs]"],
    "MM-22-ocf_ebitda":       [r"OCF\s*/\s*FAV[ÖO]K", r"OCF\s*/\s*EBITDA"],
    "MM-23-ebitda_interest":  [r"FAV[ÖO]K\s*/\s*faiz", r"EBITDA\s*/\s*interest", r"interest\s+coverage"],
    "MM-24-fcf_interest":     [r"FCF\s*/\s*faiz", r"FCF\s*/\s*interest"],
    "MM-25-roe":              [r"\bROE\b", r"[öo]zsermaye\s+k[aâ]rl"],
    "MM-26-roce":             [r"\bROCE\b", r"[öo]zkaynak\s+getiri"],
    "MM-27-capex_ebitda":     [r"CAPEX\s*/\s*FAV[ÖO]K", r"CAPEX\s*/\s*EBITDA"],
    "MM-28-interest_ebitda":  [r"faiz\s+gideri\s*/\s*FAV[ÖO]K", r"interest\s+expense\s*/\s*EBITDA"],
}

SECTOR_KPIS: dict[str, list[tuple[str, list[str]]]] = {
    "aviation": [
        ("EBITDAR",           [r"\bEBITDAR\b"]),
        ("CASK",              [r"\bCASK\b"]),
        ("RASK",              [r"\bRASK\b"]),
        ("load_factor",       [r"load\s+factor", r"doluluk\s+oran"]),
        ("RPK",               [r"\bRPK\b"]),
        ("ASK",               [r"\bASK\b"]),
        ("yield",             [r"\byield\b", r"verim\s+birim"]),
        ("IFRS_16_pre_post",  [r"IFRS[\s-]?16.*\b(pre|post|[öo]ncesi|sonras)"]),
    ],
    "steel": [
        ("growth_vs_maintenance_capex", [r"b[üu]y[üu]me\s+vs\.?\s+idame", r"growth\s+vs\s+maintenance\s+CAPEX"]),
        ("hrc_transmission",            [r"HRC.*transmi", r"\$?\s*1/ton\s+HRC", r"demir\s+cevheri\s+ge[çc]irgenlik"]),
        ("dio_emphasis",                [r"\bDIO\b.*\bvurgu\b", r"stok\s+tutma\s+s[üu]resi"]),
    ],
    "banking": [
        ("NIM",                [r"\bNIM\b", r"net\s+faiz\s+marj"]),
        ("CAR",                [r"\bCAR\b", r"sermaye\s+yeter", r"BDDK\s+CAR"]),
        ("cost_of_risk",       [r"cost\s+of\s+risk", r"kredi\s+riski\s+maliyet", r"\bCoR\b"]),
    ],
    "telecom": [
        ("ARPU",               [r"\bARPU\b"]),
        ("churn",              [r"\bchurn\b", r"abone\s+kayb"]),
        ("SAC_LTV",            [r"\bSAC\b.*\bLTV\b", r"LTV\s*/\s*SAC"]),
        ("capex_intensity",    [r"CAPEX\s+intensity", r"CAPEX\s+yo[gğ]unlu[gğ]"]),
    ],
    "holding": [
        ("three_layer",        [r"[üu][çc]\s+katmanl", r"three[-\s]?layer"]),
        ("sotp_nav",           [r"\bSOTP\b", r"\bNAV\b", r"net\s+aktif\s+de[gğ]er"]),
        ("holding_discount",   [r"holding\s+discount", r"holding\s+[ıi]skonto"]),
    ],
    "defense": [
        ("backlog_revenue",    [r"backlog\s*/\s*revenue", r"bakiye\s+sipari[şs]"]),
        ("rd_revenue",         [r"AR-?GE\s*/\s*ciro", r"R&D\s*/\s*revenue"]),
        ("export_ratio",       [r"ihracat\s+oran", r"export\s+ratio"]),
    ],
    "retail": [
        ("sssg",               [r"\bSSSG\b", r"ayn[ıi]\s+ma[gğ]aza"]),
        ("revenue_per_store",  [r"revenue\s*/\s*store", r"ma[gğ]aza\s+ba[şs]"]),
        ("ifrs_16_normalize",  [r"IFRS\s*16\s+normali"]),
    ],
}

TICKER_SECTOR: dict[str, str] = {
    "THYAO": "aviation", "PEGYS": "aviation", "ONUIR": "aviation",
    "ASELS": "defense", "ROKET": "defense", "FNSS": "defense",
    "EREGL": "steel", "KRDMD": "steel", "ISDMR": "steel",
    "AKBNK": "banking", "GARAN": "banking", "ISCTR": "banking", "YKBNK": "banking",
    "TCELL": "telecom", "TTKOM": "telecom",
    "BIMAS": "retail", "MGROS": "retail", "SOKM": "retail",
    "KCHOL": "holding", "SAHOL": "holding", "DOHOL": "holding",
    "TUPRS": "energy_refining", "PETKM": "energy_chemicals",
    "FROTO": "automotive", "TOASO": "automotive",
    "ARCLK": "durable_goods",
    "SISE": "industrial",
}

TRUNCATION_RE = re.compile(r"(\.\.\.|…|\[truncated\]|<!--\s*truncated|truncation|kesildi|yar[ıi]m\s+b[ıi]rak)", re.IGNORECASE)
BLOCKED_RE = re.compile(r"\bBLOCKED\b|\[BLOCKED\]|engel[li]?|bloke", re.IGNORECASE)
COUNTER_ARG_RE = re.compile(r"\b(ancak|yaln[ıi]z|[öo]te\s+yandan|ragmen|ra[gğ]men|kar[şs][ıi]\s+arg[üu]man|counter[-\s]?argument|however|nevertheless)\b", re.IGNORECASE)
BENCHMARK_RE = re.compile(r"(sekt[öo]r\s+(benchmark|ortalama)|k[üu]resel\s+ortalama|peer\s+(average|median)|IATA|IEA|OECD)", re.IGNORECASE)
COE_RE = re.compile(r"(\bCoE\b|cost\s+of\s+equity|[öo]zkaynak\s+maliyeti)", re.IGNORECASE)
IAS29_RE = re.compile(r"IAS\s*29|TAS\s*29|enflasyon\s+muhaseb", re.IGNORECASE)

# Phase 10A extensions ─────────────────────────────────────────────────────────
# CANONICAL_REF_RE: tokens matching canonical rule ids (MM-01, NH-001, OI-003,
# CT-002, IAS29-001, SR-aviation-001, TM-THYAO). Positive hits mean the
# report is actually referencing canonical rules rather than re-deriving them
# from prose — a prerequisite for Phase 8 memory purge.
CANONICAL_REF_RE = re.compile(
    r"\b(MM-[0-9]{2}|NH-[0-9]{3}|CT-[0-9]{3}|OI-[0-9]{3}|IAS29-[0-9]{3}|SR-[a-z_]+-[0-9]{3}|TM-[A-Z]{3,5})\b"
)

# EVIDENCE_RE: common citation surface markers. Each hit is one evidence
# pointer. Phase 6 checklist enforcement builds on top of these.
EVIDENCE_RE = re.compile(
    r"("
    r"Not\s+\d+|Footnote\s+\d+|Dipnot\s+\d+|"
    r"page\s+\d+|sayfa\s+\d+|"
    r"\bKAP\b\s+(?:disclosure|bildirim|tebli[gğ])|"
    r"\b(?:20\d{2})\s*(?:Q[1-4]|FY)\b|"
    r"document[_\s]id\s*[:=]|\bdoi:"
    r")",
    re.IGNORECASE,
)

# SECTION_HEADER_RE: top-level h1/h2 headers. Used to check OI-003 12-section
# floor. Matches both raw markdown and rendered HTML that retained headers.
SECTION_HEADER_RE = re.compile(
    r"(<h[12]\b[^>]*>.*?</h[12]>|^#{1,2}\s+.+$)",
    re.IGNORECASE | re.MULTILINE,
)


@dataclass
class Score:
    path: str
    ticker: str | None
    sector: str | None
    size_kb: float
    mandatory_metrics_hit: int
    mandatory_metrics_total: int
    sector_kpi_hit: int
    sector_kpi_total: int
    truncation_markers: int
    blocked_markers: int
    coe_refs: int
    ias29_refs: int
    benchmark_refs: int
    counter_arg_refs: int
    # Phase 10A extensions
    canonical_rule_refs: int = 0
    evidence_citations: int = 0
    section_count: int = 0
    metric_presence: dict[str, bool] = field(default_factory=dict)
    sector_kpi_presence: dict[str, bool] = field(default_factory=dict)


def extract_text(html_or_md: str) -> str:
    txt = re.sub(r"<script[\s\S]*?</script>", " ", html_or_md, flags=re.IGNORECASE)
    txt = re.sub(r"<style[\s\S]*?</style>", " ", txt, flags=re.IGNORECASE)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = re.sub(r"\s+", " ", txt)
    return txt


def score_report(rel_path: str) -> Score:
    p = ROOT / rel_path
    raw = p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""
    text = extract_text(raw) if rel_path.endswith(".html") else raw
    ticker_match = re.match(r"^([A-Z]{3,6})_", Path(rel_path).name)
    ticker = ticker_match.group(1) if ticker_match else None
    sector = TICKER_SECTOR.get(ticker or "", None)

    metric_presence = {
        mid: any(re.search(pat, text, re.IGNORECASE) for pat in patterns)
        for mid, patterns in MANDATORY_METRICS.items()
    }
    sector_kpi_presence: dict[str, bool] = {}
    if sector and sector in SECTOR_KPIS:
        for kname, patterns in SECTOR_KPIS[sector]:
            sector_kpi_presence[kname] = any(re.search(pat, text, re.IGNORECASE) for pat in patterns)

    # Phase 10A: count section headers against the raw document (preserves
    # HTML tags); prose extraction strips them so the count would always be 0.
    section_count = len(SECTION_HEADER_RE.findall(raw))
    return Score(
        path=rel_path,
        ticker=ticker,
        sector=sector,
        size_kb=round(p.stat().st_size / 1024, 2) if p.is_file() else 0.0,
        mandatory_metrics_hit=sum(1 for v in metric_presence.values() if v),
        mandatory_metrics_total=len(metric_presence),
        sector_kpi_hit=sum(1 for v in sector_kpi_presence.values() if v),
        sector_kpi_total=len(sector_kpi_presence),
        truncation_markers=len(TRUNCATION_RE.findall(text)),
        blocked_markers=len(BLOCKED_RE.findall(text)),
        coe_refs=len(COE_RE.findall(text)),
        ias29_refs=len(IAS29_RE.findall(text)),
        benchmark_refs=len(BENCHMARK_RE.findall(text)),
        counter_arg_refs=len(COUNTER_ARG_RE.findall(text)),
        canonical_rule_refs=len(CANONICAL_REF_RE.findall(text)),
        evidence_citations=len(EVIDENCE_RE.findall(text)),
        section_count=section_count,
        metric_presence=metric_presence,
        sector_kpi_presence=sector_kpi_presence,
    )


def score_all() -> list[Score]:
    scores: list[Score] = []
    for rel in GOLDEN_REPORTS:
        scores.append(score_report(rel))
    return scores


def freeze(path: Path) -> None:
    scores = score_all()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({
            "frozen_at": datetime.now(timezone.utc).isoformat(),
            "report_count": len(scores),
            "scores": [asdict(s) for s in scores],
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    agg_metric = sum(s.mandatory_metrics_hit for s in scores)
    agg_max = sum(s.mandatory_metrics_total for s in scores)
    coe_covered = sum(1 for s in scores if s.coe_refs > 0)
    print(f"frozen: {path}")
    print(f"reports: {len(scores)}")
    print(f"metric presence: {agg_metric}/{agg_max} = {round(agg_metric / max(1, agg_max) * 100, 1)}%")
    print(f"CoE covered: {coe_covered}/{len(scores)}")


# Which signals are "guarded" — regression is disallowed only for these.
GUARDED_UP_SIGNALS = {
    "mandatory_metrics_hit",       # must not decrease per report
    "sector_kpi_hit",               # must not decrease per report
    "coe_refs",                     # must not decrease (target: rise from 0)
    "ias29_refs",                   # must not decrease
    "benchmark_refs",               # must not decrease
    "counter_arg_refs",             # must not decrease
    # Phase 10A — new up-guarded signals
    "canonical_rule_refs",          # must not decrease (target: rise from 0)
    "evidence_citations",           # must not decrease
    "section_count",                # must not decrease
}
GUARDED_DOWN_SIGNALS = {
    "truncation_markers",           # must not increase
    "blocked_markers",              # must not increase
}


def diff_vs_baseline(baseline_path: Path) -> int:
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    base_by_path = {s["path"]: s for s in baseline["scores"]}
    current = score_all()
    regressions: list[str] = []
    for s in current:
        b = base_by_path.get(s.path)
        if b is None:
            regressions.append(f"[NEW REPORT] {s.path} — not in baseline; freeze a new baseline if intentional")
            continue
        cur_d = asdict(s)
        for field_name in GUARDED_UP_SIGNALS:
            # Phase 10A: tolerate signals absent from older baselines so we
            # don't invalidate pre-Phase-10A frozen files. Once re-frozen with
            # the new signals present, this line becomes a no-op for them.
            if field_name not in b:
                continue
            if cur_d[field_name] < b[field_name]:
                regressions.append(f"[DOWN] {s.path} · {field_name}: {b[field_name]} → {cur_d[field_name]}")
        for field_name in GUARDED_DOWN_SIGNALS:
            if field_name not in b:
                continue
            if cur_d[field_name] > b[field_name]:
                regressions.append(f"[UP ] {s.path} · {field_name}: {b[field_name]} → {cur_d[field_name]}")
    if regressions:
        print("REGRESSIONS DETECTED:")
        for r in regressions:
            print(" ", r)
        return 2
    else:
        print(f"OK: all {len(current)} reports meet or exceed baseline on guarded signals.")
        return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Finance-X golden coverage harness")
    ap.add_argument("--freeze", metavar="PATH", help="Freeze current scores to PATH as the new baseline.")
    ap.add_argument("--baseline", metavar="PATH", help="Compare current scores against baseline PATH and exit non-zero on regression.")
    ap.add_argument("--print", action="store_true", help="Print a summary table and exit.")
    args = ap.parse_args(argv)

    if args.freeze:
        freeze(Path(args.freeze))
        return 0
    if args.baseline:
        return diff_vs_baseline(Path(args.baseline))
    if args.print or not any([args.freeze, args.baseline]):
        scores = score_all()
        print(f"{'ticker':<6} {'sector':<16} {'mm':>6} {'sk':>5} {'coe':>4} {'ias29':>5} {'canon':>5} {'evid':>5} {'secs':>4} {'trunc':>5} {'bench':>5}  report")
        for s in scores:
            mm = f"{s.mandatory_metrics_hit}/{s.mandatory_metrics_total}"
            sk = f"{s.sector_kpi_hit}/{s.sector_kpi_total}" if s.sector_kpi_total else "—"
            print(
                f"{(s.ticker or '?'):<6} {(s.sector or '—'):<16} {mm:>6} {sk:>5} {s.coe_refs:>4} "
                f"{s.ias29_refs:>5} {s.canonical_rule_refs:>5} {s.evidence_citations:>5} "
                f"{s.section_count:>4} {s.truncation_markers:>5} {s.benchmark_refs:>5}  "
                f"{Path(s.path).name}"
            )
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
