# PS Statement Extractor — Deterministic Sub-Agent

Python modülü olarak çalışır, LLM yok.

## Python Module

`financex.subagents.ps_statement_extractor`

## Input (argv[1] JSON)

```json
{
  "ticker": "EREGL",
  "pdf_paths": ["/cache/eregl/FY2025_kap.pdf", "/cache/eregl/FY2024_kap.pdf"]
}
```

## Output (stdout JSON)

```json
{
  "ticker": "EREGL",
  "statements_by_period": [
    {
      "fiscal_period": "FY-2025",
      "source_pdf": "/cache/eregl/FY2025_kap.pdf",
      "sector_detected": "industrial",
      "income_statement": {
        "revenue": 208910000000,
        "gross_profit": 18565000000,
        "operating_profit": 12400000000,
        "net_income": 512000000
      },
      "balance_sheet": { "total_assets": 0 },
      "cash_flow": { "operating_cash_flow": 0, "depreciation_amortization": 0 },
      "confidence": 0.85
    }
  ],
  "parse_errors": []
}
```

## Data Source

`financex.parsers.financial_statements.parse_kap_pdf()` döner `ParsedFinancials`; bu sub-agent bunu serialize eder.
