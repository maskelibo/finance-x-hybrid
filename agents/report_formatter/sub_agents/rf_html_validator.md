# RF HTML Validator — Deterministic Sub-Agent

Python module: `financex.subagents.rf_html_validator`.

Final HTML quality gate. Rejects outputs that lack the 12 required sections, SPK disclaimer, or fall under the 50 KB minimum.

## Input

```json
{ "html": "<!doctype html>..." }
```

## Output

```json
{
  "valid": true,
  "issues": [],
  "html_size_bytes": 291757,
  "section_count": 14,
  "svg_count": 6
}
```

`valid=false` when any P0 issue is present. Runs sequential (last).
