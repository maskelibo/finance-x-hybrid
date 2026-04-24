"""rf_svg_chart_renderer — deterministic inline SVG chart.

Stub for FAZ S5. Renders a single-series line chart with discrete points
and no client-side JS. Good enough to exercise the dispatcher path and
provide rf_html_validator with real SVG content to count; richer chart
types (bar, stacked, annotated) land in S12 cutover.
"""

from __future__ import annotations

import json
import sys

SVG_W = 480
SVG_H = 180
PAD = 20


def _line_chart(chart_id: str, title: str, series: list, x_labels: list) -> str:
    if not series or not series[0].get("values"):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" id="{chart_id}" '
            f'viewBox="0 0 {SVG_W} {SVG_H}"><title>{title}</title>'
            f'<text x="{PAD}" y="{SVG_H // 2}">(no data)</text></svg>'
        )
    values = [float(v) for v in series[0]["values"]]
    vmin, vmax = min(values), max(values)
    span = (vmax - vmin) or 1.0
    x_step = (SVG_W - 2 * PAD) / max(len(values) - 1, 1)
    points = []
    for i, v in enumerate(values):
        x = PAD + i * x_step
        y = SVG_H - PAD - (v - vmin) / span * (SVG_H - 2 * PAD)
        points.append(f"{x:.1f},{y:.1f}")
    polyline = f'<polyline fill="none" stroke="#2b5797" stroke-width="2" points="{" ".join(points)}"/>'
    label_block = ""
    if x_labels:
        step = max(1, len(x_labels) // 5)
        label_block = "".join(
            f'<text x="{PAD + i * x_step:.1f}" y="{SVG_H - 4}" font-size="10" text-anchor="middle">{lbl}</text>'
            for i, lbl in enumerate(x_labels)
            if i % step == 0 or i == len(x_labels) - 1
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" id="{chart_id}" '
        f'viewBox="0 0 {SVG_W} {SVG_H}"><title>{title}</title>'
        f"{polyline}{label_block}</svg>"
    )


def run(chart_id: str, chart_type: str, series: list, x_labels: list, title: str = "") -> dict:
    # S5 stub: only line charts are supported; other types fall back to the
    # same renderer for infra exercise purposes. Full chart_type switching
    # arrives in S12.
    svg = _line_chart(chart_id, title or chart_id, series, x_labels)
    return {
        "chart_id": chart_id,
        "svg": svg,
        "byte_count": len(svg.encode("utf-8")),
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    print(
        json.dumps(
            run(
                inputs.get("chart_id", "chart"),
                inputs.get("chart_type", "line"),
                inputs.get("series", []),
                inputs.get("x_labels", []),
                inputs.get("title", ""),
            ),
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
