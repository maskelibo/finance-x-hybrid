"""KAP probe — the general disclosure search page with ticker filter.

Visits https://www.kap.org.tr/tr/bildirim-sorgu, fills a ticker, submits,
and captures every XHR. The search page fires the endpoint that supports
filtering — the company 'ozet' page is SSR and doesn't XHR disclosures.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


def main(ticker: str) -> None:
    out_dir = Path("/tmp/kap_probe")
    out_dir.mkdir(parents=True, exist_ok=True)

    collected: list[dict] = []
    saved_files: list[str] = []

    def interesting(url: str) -> bool:
        return any(k in url for k in ("/api/", "disclosure", "Disclosure", "_next/data"))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605 Safari/605",
        )
        page = context.new_page()

        def on_request(req) -> None:
            url = req.url
            if not interesting(url):
                return
            collected.append({"phase": "request", "method": req.method, "url": url, "post_data": (req.post_data or "")[:300]})

        def on_response(resp) -> None:
            url = resp.url
            if not interesting(url):
                return
            ct = resp.headers.get("content-type", "")
            entry = {"phase": "response", "status": resp.status, "url": url, "content_type": ct}
            if "json" in ct:
                try:
                    body = resp.body()
                    entry["body_bytes"] = len(body)
                    entry["body_head"] = body[:400].decode("utf-8", errors="replace")
                    if len(body) < 500_000:
                        safe = url.replace("https://www.kap.org.tr", "").replace("/", "_")[-80:]
                        fn = out_dir / f"{entry['status']}_{safe}.json"
                        fn.write_bytes(body)
                        saved_files.append(fn.name)
                except Exception as exc:
                    entry["error"] = str(exc)
            collected.append(entry)

        page.on("request", on_request)
        page.on("response", on_response)

        target = "https://www.kap.org.tr/tr/bildirim-sorgu"
        print(f"=== GET {target}", file=sys.stderr)
        try:
            page.goto(target, wait_until="commit", timeout=15_000)
        except Exception as exc:
            print(f"    (goto: {exc})", file=sys.stderr)
        page.wait_for_timeout(30_000)

        # Try to find a search input and fire a query.
        for sel in [
            "input[placeholder*='odu']",
            "input[placeholder*='irket']",
            "input[placeholder*='ticker']",
            "input[placeholder*='Hisse']",
            "input[type='search']",
            "input[type='text']",
        ]:
            try:
                el = page.query_selector(sel)
                if el:
                    print(f"    filling {sel}", file=sys.stderr)
                    el.fill(ticker)
                    page.wait_for_timeout(2_000)
                    page.keyboard.press("Enter")
                    page.wait_for_timeout(12_000)
                    break
            except Exception as exc:
                print(f"    (fill warn {sel}: {exc})", file=sys.stderr)

        # Try clicking a search/submit button
        for sel in [
            "button:has-text('Ara')",
            "button[type='submit']",
            "button:has-text('Sorgula')",
        ]:
            try:
                btn = page.query_selector(sel)
                if btn:
                    print(f"    clicking {sel}", file=sys.stderr)
                    btn.click(timeout=5_000)
                    page.wait_for_timeout(12_000)
                    break
            except Exception:
                pass

        browser.close()

    # Summary
    seen: dict[str, dict] = {}
    for item in collected:
        url = item.get("url", "?")
        key = (item.get("phase", ""), url)
        if key not in seen or len(str(item)) > len(str(seen[key])):
            seen[key] = item

    values = sorted(seen.values(), key=lambda e: (e.get("url", ""), e.get("phase", "")))
    print(json.dumps(values, indent=2, ensure_ascii=False))
    print(
        f"\n[probe] captured {len(seen)} unique events, wrote {len(saved_files)} json bodies to {out_dir}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("ticker", nargs="?", default="KCHOL")
    args = parser.parse_args()
    main(args.ticker)
