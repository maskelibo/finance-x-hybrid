# RF Section Renderer — Deterministic Sub-Agent

Python module: `financex.subagents.rf_section_renderer`.

Renders one section's HTML from its template + data bundle.

## Input

```json
{
  "section_id": "financial_performance",
  "template": "backend/src/python/report_formatter/template.html",
  "data": { "ticker": "EREGL", "metrics": { } }
}
```

## Output

```json
{
  "section_id": "financial_performance",
  "html_fragment": "<section>...</section>",
  "byte_count": 4321
}
```

Runs in parallel (one instance per section from rf_layout_planner).
