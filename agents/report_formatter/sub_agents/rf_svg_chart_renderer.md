# RF SVG Chart Renderer — Deterministic Sub-Agent

Python module: `financex.subagents.rf_svg_chart_renderer`.

Generates deterministic inline SVG charts. Chart.js / client-side JS forbidden — the report must render identically offline.

## Input

```json
{
  "chart_id": "ebitda_margin_5y",
  "chart_type": "line",
  "series": [
    { "label": "EBITDA Marjı", "values": [15.1, 16.1, 10.5, 10.3, 9.8] }
  ],
  "x_labels": ["2021", "2022", "2023", "2024", "2025"]
}
```

## Output

```json
{
  "chart_id": "ebitda_margin_5y",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>...</svg>",
  "byte_count": 2345
}
```

Runs in parallel per chart.
