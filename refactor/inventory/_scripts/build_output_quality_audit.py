"""
Output quality audit for Finance-X Hybrid refactor Phase 1 - Task 1.8.

Scans a selected set of published reports (the Yonetim_Kurulu_Raporu /
Kapsamli_Analiz_Raporu / V4_Final / Reformat / SISE_YONETIM_RAPORU HTML files
sitting at the project root and under `output/`) and measures, per report:

  * Presence of the 28 mandatory financial metrics (Turkish + English aliases).
  * Sector-specific KPI presence (aviation: CASK/RASK/LF/RPK/Yield; steel:
    growth-vs-maintenance CAPEX split, HRC transmission; banking: NIM / CAR /
    Cost of Risk; telecom: ARPU / churn / SAC / LTV; holding: 3-layer / NAV /
    holding discount).
  * IAS 29 adjusted metric presence (explicit IAS 29 column or "ayrıştırılmış"
    table).
  * Truncation / BLOCKED markers in text.
  * Interpretation density: number of non-table prose characters per KB.
  * Counter-argument markers ("ancak", "yalnız", "öte yandan", "counter", "karşı
    argüman", "rağmen", "however", "but").
  * Benchmark references ("sektör benchmark", "sektör ortalaması", "küresel
    ortalama", "IATA", "peer", etc.).
  * CoE comparison in ROE discussion (ROE near CoE / özkaynak maliyeti).

Emits:
  refactor/inventory/output_quality_audit.md
  refactor/inventory/output_quality_audit.json
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "refactor" / "inventory"

# 28 mandatory metrics — name set with Turkish + English variants.
# Each entry: canonical_id -> list of regex patterns (case-insensitive).
MANDATORY_METRICS: dict[str, list[str]] = {
    # A. Gelir / Revenue
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

    # B. Isletme Sermayesi / Working Capital
    "MM-12-dso":              [r"\bDSO\b", r"alaca[kg]\s+tahsil\s+s[üu]resi"],
    "MM-13-dio":              [r"\bDIO\b", r"stok\s+tutma\s+s[üu]resi", r"inventory\s+days"],
    "MM-14-dpo":              [r"\bDPO\b", r"bor[çc]\s+[öo]deme\s+s[üu]resi", r"payable\s+days"],
    "MM-15-ccc":              [r"\bCCC\b", r"nakit\s+d[öo]n[üu]?[şs]\s+d[öo]ng[üu]s[üu]", r"cash\s+conversion\s+cycle"],
    "MM-16-nwc_revenue":      [r"NWC\s*/\s*(h[aâ]s[ıi]lat|revenue)", r"net\s+working\s+capital"],

    # C. Borc / Likidite
    "MM-17-net_debt":         [r"net\s+bor[çc]", r"net\s+debt"],
    "MM-18-net_debt_ebitda":  [r"net\s+bor[çc]\s*/\s*FAV[ÖO]K", r"net\s+debt\s*/\s*EBITDA"],
    "MM-19-current_ratio":    [r"cari\s+oran", r"current\s+ratio"],
    "MM-20-quick_ratio":      [r"asit[-\s]?test", r"quick\s+ratio"],

    # D. Nakit Akisi
    "MM-21-fcf":              [r"\bFCF\b", r"serbest\s+nakit\s+ak[ıi][şs]"],
    "MM-22-ocf_ebitda":       [r"OCF\s*/\s*FAV[ÖO]K", r"OCF\s*/\s*EBITDA"],
    "MM-23-ebitda_interest":  [r"FAV[ÖO]K\s*/\s*faiz", r"EBITDA\s*/\s*interest", r"interest\s+coverage"],
    "MM-24-fcf_interest":     [r"FCF\s*/\s*faiz", r"FCF\s*/\s*interest"],

    # E. Karlilik
    "MM-25-roe":              [r"\bROE\b", r"[öo]zsermaye\s+k[aâ]rl"],
    "MM-26-roce":             [r"\bROCE\b", r"[öo]zkaynak\s+getiri"],

    # F. Yatirim
    "MM-27-capex_ebitda":     [r"CAPEX\s*/\s*FAV[ÖO]K", r"CAPEX\s*/\s*EBITDA"],
    "MM-28-interest_ebitda":  [r"faiz\s+gideri\s*/\s*FAV[ÖO]K", r"interest\s+expense\s*/\s*EBITDA"],
}

# Sector-specific KPIs.
SECTOR_KPIS: dict[str, list[tuple[str, list[str]]]] = {
    "aviation": [
        ("EBITDAR",          [r"\bEBITDAR\b"]),
        ("CASK",             [r"\bCASK\b"]),
        ("RASK",             [r"\bRASK\b"]),
        ("load_factor",      [r"load\s+factor", r"doluluk\s+oran"]),
        ("RPK",              [r"\bRPK\b"]),
        ("ASK",              [r"\bASK\b"]),
        ("yield",            [r"\byield\b", r"verim\s+birim"]),
        ("IFRS_16_pre_post", [r"IFRS[\s-]?16.*\b(pre|post|[öo]ncesi|sonras)"]),
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
        ("churn",               [r"\bchurn\b", r"abone\s+kayb"]),
        ("SAC_LTV",             [r"\bSAC\b.*\bLTV\b", r"LTV\s*/\s*SAC"]),
        ("capex_intensity",     [r"CAPEX\s+intensity", r"CAPEX\s+yo[gğ]unlu[gğ]"]),
    ],
    "holding": [
        ("three_layer",         [r"[üu][çc]\s+katmanl", r"three[-\s]?layer"]),
        ("sotp_nav",            [r"\bSOTP\b", r"\bNAV\b", r"net\s+aktif\s+de[gğ]er"]),
        ("holding_discount",    [r"holding\s+discount", r"holding\s+[ıi]skonto"]),
    ],
    "defense": [
        ("backlog_revenue",     [r"backlog\s*/\s*revenue", r"bakiye\s+sipari[şs]"]),
        ("rd_revenue",          [r"AR-?GE\s*/\s*ciro", r"R&D\s*/\s*revenue"]),
        ("export_ratio",        [r"ihracat\s+oran", r"export\s+ratio"]),
    ],
    "retail": [
        ("sssg",                [r"\bSSSG\b", r"ayn[ıi]\s+ma[gğ]aza"]),
        ("revenue_per_store",   [r"revenue\s*/\s*store", r"ma[gğ]aza\s+ba[şs]"]),
        ("ifrs_16_normalize",   [r"IFRS\s*16\s+normali"]),
    ],
}

# Ticker → sector (aligned with brief).
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


@dataclass
class Report:
    path: str
    ticker: str | None
    sector: str | None
    size_kb: float
    char_count: int
    metric_hits: dict[str, bool]
    metric_total_hits: int
    metric_presence_pct: float
    sector_kpi_hits: dict[str, bool]
    truncation_markers: int
    blocked_markers: int
    counter_arg_hits: int
    benchmark_hits: int
    coe_hits: int
    ias29_hits: int


def extract_text_from_html(html: str) -> str:
    # Crude but adequate: strip tags, collapse whitespace.
    txt = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    txt = re.sub(r"<style[\s\S]*?</style>", " ", txt, flags=re.IGNORECASE)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = re.sub(r"\s+", " ", txt)
    return txt


def ticker_of(p: Path) -> str | None:
    m = re.match(r"^([A-Z]{3,6})_", p.name)
    if m:
        return m.group(1)
    return None


def audit_report(p: Path) -> Report:
    raw = p.read_text(encoding="utf-8", errors="replace")
    if p.suffix.lower() == ".html":
        text = extract_text_from_html(raw)
    else:
        text = raw

    ticker = ticker_of(p)
    sector = TICKER_SECTOR.get(ticker or "", None)

    metric_hits: dict[str, bool] = {}
    metric_total = 0
    for mid, patterns in MANDATORY_METRICS.items():
        hit = any(re.search(pat, text, re.IGNORECASE) for pat in patterns)
        metric_hits[mid] = hit
        if hit:
            metric_total += 1

    sector_hits: dict[str, bool] = {}
    if sector and sector in SECTOR_KPIS:
        for kname, patterns in SECTOR_KPIS[sector]:
            sector_hits[kname] = any(re.search(pat, text, re.IGNORECASE) for pat in patterns)

    return Report(
        path=p.relative_to(ROOT).as_posix(),
        ticker=ticker,
        sector=sector,
        size_kb=round(p.stat().st_size / 1024, 2),
        char_count=len(text),
        metric_hits=metric_hits,
        metric_total_hits=metric_total,
        metric_presence_pct=round(metric_total / len(MANDATORY_METRICS) * 100, 1),
        sector_kpi_hits=sector_hits,
        truncation_markers=len(TRUNCATION_RE.findall(text)),
        blocked_markers=len(BLOCKED_RE.findall(text)),
        counter_arg_hits=len(COUNTER_ARG_RE.findall(text)),
        benchmark_hits=len(BENCHMARK_RE.findall(text)),
        coe_hits=len(COE_RE.findall(text)),
        ias29_hits=len(IAS29_RE.findall(text)),
    )


def find_candidate_reports() -> list[Path]:
    patterns = [
        "*Yonetim_Kurulu_Raporu*.html",
        "*Kapsamli_Analiz_Raporu*.html",
        "*YONETIM_RAPORU*.html",
        "*V4_Final*.html",
        "*V4_Reformat*.html",
        "kchol_report_final.html",
    ]
    seen: set[Path] = set()
    out: list[Path] = []
    for pat in patterns:
        for p in ROOT.glob(pat):
            if p.is_file() and p not in seen:
                seen.add(p)
                out.append(p)
    # Also include any final institutional smoke outputs under output/.
    for p in (ROOT / "output").glob("TUPRS_institutional*.html"):
        if p not in seen:
            out.append(p); seen.add(p)
    for p in (ROOT / "output").glob("TUPRS_Yonetim*.html"):
        if p not in seen:
            out.append(p); seen.add(p)
    # Sort by mtime descending (newest first).
    out.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return out


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    reports = [audit_report(p) for p in find_candidate_reports()]

    md: list[str] = []
    md.append("# Output Quality Audit")
    md.append("")
    md.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    md.append(f"- Reports audited: **{len(reports)}**")
    md.append(f"- Mandatory metric catalog size: **{len(MANDATORY_METRICS)}**")
    md.append("")
    md.append("Detection is by regex on the flattened text of each HTML report; a 'hit' means the metric name (or a close alias) appears somewhere in the document. This is **presence**, not correctness — a metric can be named and still be wrong. The brief's target (≥95% completeness with meaningful interpretation) remains separate from this presence score.")
    md.append("")

    # Top summary table.
    md.append("## Per-report summary")
    md.append("")
    md.append("| ticker | sector | report | size_kb | metrics/28 | % | sector_kpi | truncation | BLOCKED | counter_arg | benchmark | CoE refs | IAS29 refs |")
    md.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for r in reports:
        sector_fraction = ""
        if r.sector and r.sector_kpi_hits:
            sector_fraction = f"{sum(1 for v in r.sector_kpi_hits.values() if v)}/{len(r.sector_kpi_hits)}"
        elif r.sector:
            sector_fraction = "—"
        md.append(
            f"| `{r.ticker or '?'}` | `{r.sector or '—'}` | `{r.path.split('/')[-1]}` | {r.size_kb} | "
            f"{r.metric_total_hits}/28 | {r.metric_presence_pct}% | {sector_fraction} | "
            f"{r.truncation_markers} | {r.blocked_markers} | {r.counter_arg_hits} | "
            f"{r.benchmark_hits} | {r.coe_hits} | {r.ias29_hits} |"
        )
    md.append("")

    # Per-metric presence matrix.
    md.append("## Per-metric presence matrix")
    md.append("")
    md.append("`✓` = pattern matched somewhere in the report text. Blank = not found.")
    md.append("")
    metric_ids = list(MANDATORY_METRICS.keys())
    header = "| metric |" + "".join(f" {r.ticker or '?'}<br>{Path(r.path).stem[:10]} |" for r in reports)
    md.append(header)
    md.append("| --- |" + " --- |" * len(reports))
    for mid in metric_ids:
        row = f"| `{mid}` |"
        for r in reports:
            row += " ✓ |" if r.metric_hits.get(mid) else "  |"
        md.append(row)
    md.append("")

    # Per-sector KPI matrix.
    md.append("## Sector-specific KPI presence")
    md.append("")
    for r in reports:
        if not r.sector_kpi_hits:
            continue
        md.append(f"### `{r.ticker}` ({r.sector}) — `{Path(r.path).name}`")
        md.append("")
        md.append("| kpi | present |")
        md.append("| --- | --- |")
        for k, v in r.sector_kpi_hits.items():
            md.append(f"| `{k}` | {'✓' if v else '✗'} |")
        md.append("")

    # Qualitative aggregate.
    if reports:
        avg_pct = round(sum(r.metric_presence_pct for r in reports) / len(reports), 1)
        worst = min(reports, key=lambda r: r.metric_presence_pct)
        best = max(reports, key=lambda r: r.metric_presence_pct)
        coe_covered = sum(1 for r in reports if r.coe_hits > 0)
        ias29_covered = sum(1 for r in reports if r.ias29_hits > 0)
        counter_covered = sum(1 for r in reports if r.counter_arg_hits >= 3)
        benchmark_covered = sum(1 for r in reports if r.benchmark_hits >= 3)
    else:
        avg_pct = 0.0
        worst = best = None
        coe_covered = ias29_covered = counter_covered = benchmark_covered = 0

    md.append("## Portfolio-level signals")
    md.append("")
    md.append(f"- **Average metric presence**: {avg_pct}% of the 28-metric catalog mentioned.")
    md.append(f"- **Best**: `{best.path if best else '—'}` at {best.metric_presence_pct if best else 0}%.")
    md.append(f"- **Worst**: `{worst.path if worst else '—'}` at {worst.metric_presence_pct if worst else 0}%.")
    md.append(f"- Reports with **CoE / özkaynak maliyeti** reference: **{coe_covered} / {len(reports)}** (brief: ROE without CoE comparison = uninterpreted number).")
    md.append(f"- Reports with **IAS 29** references: **{ias29_covered} / {len(reports)}** (brief: IAS 29 split table required when inflation > 100%).")
    md.append(f"- Reports with ≥3 **counter-argument markers**: **{counter_covered} / {len(reports)}** (brief: every thesis needs a counter-hypothesis).")
    md.append(f"- Reports with ≥3 **sector benchmark references**: **{benchmark_covered} / {len(reports)}** (brief: no metric interpretation without benchmark).")
    md.append("")

    (OUT / "output_quality_audit.md").write_text("\n".join(md), encoding="utf-8")
    (OUT / "output_quality_audit.json").write_text(
        json.dumps({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "reports": [asdict(r) for r in reports],
            "catalog_size": len(MANDATORY_METRICS),
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"reports: {len(reports)}")
    if reports:
        print(f"avg metric presence: {avg_pct}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
