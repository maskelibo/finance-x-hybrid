#!/usr/bin/env python3
"""
Test 28 Financial Metrics across downloaded BIST 30 PDFs.

Parses each financial report PDF, runs the financial engine,
and reports metric coverage (how many of 28 are non-null).

Usage:
  python scripts/test_28_metrics.py [--ticker EREGL] [--limit 5] [--verbose]
"""

import sys
import json
import argparse
from pathlib import Path
from decimal import Decimal

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "python-services" / "src"))

from financex.parsers.financial_statements import parse_kap_pdf
from financex.calculators.financial_engine import compute_for_period
from financex.calculators.financial_analysis import analyze_financials

OUTPUT_DIR = PROJECT_ROOT / "output" / "bist30"

# BIST ticker → Yahoo Finance suffix mapping
def fetch_market_cap(ticker: str) -> Decimal | None:
    """Fetch current market cap from Yahoo Finance for Altman Z calculation."""
    try:
        import yfinance as yf
        yf_ticker = f"{ticker}.IS"
        info = yf.Ticker(yf_ticker).info
        mc = info.get("marketCap")
        return Decimal(str(mc)) if mc else None
    except Exception:
        return None

# Cache market caps to avoid repeated API calls
_market_cap_cache: dict[str, Decimal | None] = {}

# Industrial metrics (22 ratios + 2 scores = 24)
INDUSTRIAL_METRICS = {
    "gross_margin", "ebitda_margin", "net_margin", "roe", "roa", "roce", "roic",
    "opex_to_revenue",
    "dso", "dio", "dpo", "ccc", "nwc_to_revenue",
    "net_debt", "net_debt_to_ebitda", "current_ratio", "acid_test",
    "fcf", "ocf_to_ebitda", "capex_to_ebitda", "interest_coverage", "interest_burden",
    "altman_z", "piotroski_f",
}

# Banking metrics (different slate — no CoGS/DIO/DPO/CCC/EBITDA)
BANKING_METRICS = {
    "roe", "roa", "net_margin", "current_ratio", "net_debt", "fcf",
    "nim", "cost_to_income", "llp_to_nii", "loans_to_assets",
    "equity_multiplier", "nii_growth",
    "piotroski_f",
}

BANKING_TICKERS = {"AKBNK", "GARAN", "ISCTR", "YKBNK"}


def test_pdf(pdf_path: str, ticker: str, verbose: bool = False) -> dict:
    """Parse a PDF and compute metrics. Return coverage stats."""
    result = {
        "file": Path(pdf_path).name,
        "ticker": ticker,
        "success": False,
        "error": None,
        "period": None,
        "metrics_computed": 0,
        "metrics_null": 0,
        "metric_values": {},
        "highlights": 0,
        "red_flags": 0,
        "parse_warnings": [],
    }

    try:
        # Pre-filter: skip non-financial PDFs (admin notices, audit opinions)
        pdf_size = Path(pdf_path).stat().st_size
        if pdf_size < 200_000:  # < 200KB = likely not a real financial statement
            import pdfplumber
            _pdf = pdfplumber.open(pdf_path)
            _pages = len(_pdf.pages)
            _text = (_pdf.pages[0].extract_text() or '')[:300].lower()
            _pdf.close()
            skip_keywords = ['ek süre', 'duran varlık', 'sorumluluk beyan',
                           'bağımsız denet', 'erteleme', 'düzeltme']
            if _pages <= 3 or any(kw in _text for kw in skip_keywords):
                result["error"] = f"skipped: not a financial statement ({_pages}p, {pdf_size//1024}KB)"
                if verbose:
                    print(f"  [SKIP] {Path(pdf_path).name}: idari bildirim ({_pages}p, {pdf_size//1024}KB)")
                return result

        parsed = parse_kap_pdf(pdf_path)
        pf = parsed.period
        result["period"] = f"{pf.period.value}-{pf.year}"

        # Fetch market cap for Altman Z (cached per ticker)
        if ticker not in _market_cap_cache:
            _market_cap_cache[ticker] = fetch_market_cap(ticker)
        mc = _market_cap_cache[ticker]

        engine = compute_for_period(pf, market_cap=mc)

        # Determine which metrics to expect based on sector
        is_bank = ticker in BANKING_TICKERS
        expected = BANKING_METRICS if is_bank else INDUSTRIAL_METRICS

        # Count metrics
        ratios = vars(engine.ratios)
        scores = vars(engine.scores)

        all_values = {}
        for k, v in {**ratios, **scores}.items():
            if v is not None and v.value is not None:
                all_values[k] = float(v.value)

        # Only count metrics that are relevant for this sector
        computed = {k: v for k, v in all_values.items() if k in expected}
        null_metrics = [k for k in expected if k not in all_values]

        result["metrics_computed"] = len(computed)
        result["metrics_null"] = len(null_metrics)
        result["metrics_expected"] = len(expected)
        result["metric_values"] = computed
        result["null_metrics"] = null_metrics
        result["is_bank"] = is_bank
        result["success"] = True

        # Run analysis for highlights/flags
        try:
            analysis = analyze_financials(pf, engine, ticker=ticker)
            result["highlights"] = len(analysis.highlights)
            result["red_flags"] = len(analysis.red_flags)
            result["red_flag_codes"] = [f.code for f in analysis.red_flags]
        except Exception as e:
            result["parse_warnings"].append(f"Analysis failed: {e}")

        if verbose:
            print(f"  [OK] {result['file']} — {result['period']}: {result['metrics_computed']} metrics, {result['highlights']} highlights, {result['red_flags']} flags")
            if null_metrics:
                print(f"       NULL: {', '.join(null_metrics)}")

    except Exception as e:
        result["error"] = str(e)
        if verbose:
            print(f"  [FAIL] {Path(pdf_path).name}: {e}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Test 28 metrics on BIST 30 PDFs")
    parser.add_argument("--ticker", type=str, help="Single ticker to test")
    parser.add_argument("--limit", type=int, default=3, help="Max PDFs per ticker (default 3)")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--all", action="store_true", help="Test all PDFs (overrides --limit)")
    args = parser.parse_args()

    if args.ticker:
        ticker_dirs = [OUTPUT_DIR / args.ticker.upper()]
    else:
        ticker_dirs = sorted(OUTPUT_DIR.iterdir())

    all_results = []
    ticker_summary = {}

    for ticker_dir in ticker_dirs:
        if not ticker_dir.is_dir() or ticker_dir.name.startswith("_"):
            continue

        ticker = ticker_dir.name
        # Find financial report PDFs only (not activity reports)
        financial_pdfs = sorted(ticker_dir.rglob("*financial_report*.pdf"))

        if not financial_pdfs:
            print(f"[{ticker}] No financial report PDFs found")
            continue

        limit = len(financial_pdfs) if args.all else min(args.limit, len(financial_pdfs))
        test_pdfs = financial_pdfs[:limit]

        print(f"\n[{ticker}] Testing {limit}/{len(financial_pdfs)} financial reports:")

        ticker_stats = {"tested": 0, "success": 0, "avg_metrics": 0, "total_metrics": 0}

        for pdf in test_pdfs:
            result = test_pdf(str(pdf), ticker, verbose=args.verbose)
            all_results.append(result)

            ticker_stats["tested"] += 1
            if result["success"]:
                ticker_stats["success"] += 1
                ticker_stats["total_metrics"] += result["metrics_computed"]

        if ticker_stats["success"] > 0:
            ticker_stats["avg_metrics"] = ticker_stats["total_metrics"] / ticker_stats["success"]
            ticker_stats["expected"] = len(BANKING_METRICS) if ticker in BANKING_TICKERS else len(INDUSTRIAL_METRICS)
            ticker_stats["is_bank"] = ticker in BANKING_TICKERS

        ticker_summary[ticker] = ticker_stats

    # Summary
    print(f"\n{'=' * 70}")
    print(f"28 METRIC TEST SUMMARY")
    print(f"{'=' * 70}")
    print(f"{'Ticker':<8} {'Type':>6} {'Tested':>7} {'OK':>5} {'Metrics':>10} {'Expected':>9} {'Coverage':>10}")
    print(f"{'-' * 75}")

    total_tested = 0
    total_ok = 0
    total_coverage_sum = 0.0
    total_ok_count = 0

    for ticker, stats in sorted(ticker_summary.items()):
        exp = stats.get("expected", 24)
        is_bank = stats.get("is_bank", False)
        ttype = "BANK" if is_bank else "IND"
        coverage = f"{stats['avg_metrics'] / exp * 100:.0f}%" if stats["avg_metrics"] > 0 else "N/A"
        print(f"{ticker:<8} {ttype:>6} {stats['tested']:>7} {stats['success']:>5} {stats['avg_metrics']:>10.1f} {exp:>9} {coverage:>10}")
        total_tested += stats["tested"]
        total_ok += stats["success"]
        if stats["success"] > 0:
            total_coverage_sum += stats["avg_metrics"] / exp * 100
            total_ok_count += 1

    avg_coverage = total_coverage_sum / total_ok_count if total_ok_count > 0 else 0
    print(f"{'-' * 75}")
    print(f"{'TOTAL':<8} {'':>6} {total_tested:>7} {total_ok:>5} {'':>10} {'':>9} {avg_coverage:>9.0f}%")

    # Most common null metrics
    null_counter: dict[str, int] = {}
    for r in all_results:
        if r["success"]:
            for m in r.get("null_metrics", []):
                null_counter[m] = null_counter.get(m, 0) + 1

    if null_counter:
        print(f"\n{'=' * 70}")
        print(f"MOST COMMON NULL METRICS (across {total_ok} successful parses)")
        print(f"{'=' * 70}")
        for metric, count in sorted(null_counter.items(), key=lambda x: -x[1]):
            pct = count / total_ok * 100
            print(f"  {metric:<25} {count:>5} ({pct:.0f}%)")

    # Save full results
    results_path = OUTPUT_DIR / "_metric_test_results.json"
    results_path.write_text(json.dumps(all_results, indent=2, default=str))
    print(f"\nDetailed results saved to: {results_path}")


if __name__ == "__main__":
    main()
