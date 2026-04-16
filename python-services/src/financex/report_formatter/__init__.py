"""report_formatter — Jinja2 renderer.

Replaces the LLM-driven report_formatter agent with a deterministic
template engine. The input is a structured ReportPayload the
orchestrator assembles from every upstream runner.
"""

from financex.report_formatter.engine import ReportPayload, render_report

__all__ = ["ReportPayload", "render_report"]
