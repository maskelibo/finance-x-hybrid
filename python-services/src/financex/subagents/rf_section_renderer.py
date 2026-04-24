"""rf_section_renderer — one section's HTML fragment.

Stub implementation for FAZ S5 infrastructure. The full template binding
happens in S12 cutover; for now this returns a minimal `<section>`
wrapper so the parallel fan-out can be exercised and the HTML validator
has content to check.
"""

from __future__ import annotations

import html
import json
import sys


def run(section_id: str, title: str, body_text: str) -> dict:
    safe_title = html.escape(title)
    safe_body = html.escape(body_text)
    fragment = (
        f'<section id="{section_id}" class="page">'
        f'<h2>{safe_title}</h2>'
        f'<div class="section-body">{safe_body or "(placeholder)"}</div>'
        f'</section>'
    )
    return {
        "section_id": section_id,
        "html_fragment": fragment,
        "byte_count": len(fragment.encode("utf-8")),
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    section_id = inputs.get("section_id", "unknown")
    title = inputs.get("title", section_id.replace("_", " ").title())
    body_text = inputs.get("body_text", "")
    print(json.dumps(run(section_id, title, body_text), ensure_ascii=False))


if __name__ == "__main__":
    main()
