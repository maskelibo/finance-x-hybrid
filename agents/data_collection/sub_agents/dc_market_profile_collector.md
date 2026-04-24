# DC Market Profile Collector — Deterministic Sub-Agent

Bu sub-agent **Python modülü** olarak çalışır. LLM yok.

## Python Module

`financex.subagents.dc_market_profile`

## Input (argv[1] JSON)

```json
{ "ticker": "EREGL", "date_range": { "from": "2021-01-01", "to": "2026-04-24" } }
```

## Output (stdout JSON)

```json
{
  "ticker": "EREGL",
  "ohlcv_5y": [
    { "date": "2026-04-22", "open": 32.10, "high": 32.50, "low": 31.80, "close": 32.04, "volume": 12500000 }
  ],
  "market_cap_try_mn": null,
  "shares_outstanding_mn": null,
  "free_float_pct": null,
  "dividend_history": [],
  "borsa_istanbul_index_membership": ["BIST30", "BIST100"]
}
```

## Data Sources

- TradingView (primary) → yfinance fallback (`financex.crawlers.tradingview.build_default_ohlcv_client`)
- Borsa İstanbul / KAP (market cap, dividend history — future expansion)

## Notlar

- Market cap, shares outstanding, free float opsiyonel — TradingView `info` dict'i BIST için tutarsız, null dönmek yfinance fallback'le bile kabul edilebilir.
- `borsa_istanbul_index_membership` yerel tablodan türetilir (BIST30 lookup).
- Dividend history mevcut infrastructure'da yoksa boş array dönebilir (future expansion).
