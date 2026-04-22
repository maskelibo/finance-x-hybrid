#!/usr/bin/env python3
"""
Phase 8F — Schema-First Agent Output (pending_fix #4)

Amaç: 2026-04-21/22 canlı TUPRS run'ında her agent'ta gözlemlenen
"SCHEMA required field eksik" + "SOFT_BLOCK DEGRADED" uyarılarını
kökten kapatmak. Agent'lar markdown narrative yazıyor ama
output_schema.json structured JSON bekliyor.

Çözüm: her agent'ın system_prompt.md başına (Phase 8B canonical refs
ve Phase 8C reasoning directives bloklarının hemen ardına) agent-
specific OUTPUT FORMAT bloğu eklenir. Bu blok:

1. Schema'nın required field listesini agent'a bildirir.
2. İlk satırda parseable JSON emit etmesini zorunlu kılar.
3. Narrative markdown'ın JSON'dan SONRA gelmesini şart koşar.

agent-runner.ts (ileride) bu JSON bloğunu parse edip structured_output
olarak ayırır; schema validator bundan okur. Bu yamanın runtime
behavioural etkisi yok — sadece prompt'ta yeni direktif var;
agent uyarsa schema SOFT_BLOCK azalır.

Idempotent: marker tekrar çalıştırmada NOOP.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "agents"

# 2026-04-22 TUPRS run'ında SOFT_BLOCK/DEGRADED gözlemlenen ajanlar +
# ayrıca schema'sı olan kritik ajanlar.
SCHEMA_FIRST_AGENTS = {
    "ceo", "coo",
    "data_collection", "kap_watch", "parse_standardization",
    "reconciliation", "context_extraction",
    "financial_analysis", "valuation_agent",
    "sector_competition", "macro_analysis", "technical_analysis",
    "sentiment_news_agent", "analyst_consensus_agent", "esg_agent",
    "event_classification", "event_impact_mapper", "event_timeline_alert",
    "qa_review", "strategic_synthesis", "final_summary",
    "report_formatter",
}

MARKER = "<!-- PHASE_8F_SCHEMA_FIRST -->"


def _extract_required_and_properties(schema: dict) -> tuple[list[str], dict]:
    """Top-level required list + property names. Nested çözülmez; agent
    tam schema'yı kendi output_schema.json'dan okumuş olacak — burada
    sadece direktifi başlatmak için özet veriyoruz."""
    required = schema.get("required", [])
    props = schema.get("properties", {}) or {}
    return required, props


def _primitive_default(prop_schema: dict) -> str:
    t = prop_schema.get("type", "")
    if isinstance(t, list):
        t = next((x for x in t if x != "null"), t[0] if t else "string")
    if t == "array":
        return "[]"
    if t == "object":
        return "{}"
    if t == "number" or t == "integer":
        return "0"
    if t == "boolean":
        return "false"
    enum = prop_schema.get("enum")
    if enum:
        return json.dumps(enum[0])
    const = prop_schema.get("const")
    if const is not None:
        return json.dumps(const)
    return '"..."'


def _build_skeleton(agent_id: str, required: list[str], properties: dict) -> str:
    """Agent-specific minimal JSON skeleton."""
    lines = ["{"]
    lines.append(f'  "agent_id": "{agent_id}",')
    used = {"agent_id"}
    for field in required:
        if field in used:
            continue
        prop = properties.get(field, {"type": "string"})
        default = _primitive_default(prop)
        lines.append(f'  "{field}": {default},')
        used.add(field)
    if lines[-1].endswith(","):
        lines[-1] = lines[-1].rstrip(",")
    lines.append("}")
    return "\n".join(lines)


def _build_block(agent_id: str, required: list[str], skeleton: str) -> str:
    required_list = ", ".join(f"`{r}`" for r in required) if required else "(schema'da required liste yok)"
    return f"""
{MARKER}
## OUTPUT FORMAT (MUTLAK — Phase 8F)

Çıktın **iki katman** olmak zorunda. Schema validator birinciden okur,
downstream agent ikinciden bağlam alır.

### 1. STRUCTURED DATA BLOCK (IlK — parseable JSON)

Dosyanın başında **mutlaka** bir ```json``` fenced bloğu koy. Schema'da
zorunlu alanların TÜMÜ burada olmalı:

**Required keys:** {required_list}

Minimal iskelet (örnek — sen schema'nın tam yapısına uy):

```json
{skeleton}
```

Kurallar:
- `agent_id` mutlaka `"{agent_id}"` olmalı (schema `const`).
- Timestamp ISO 8601 UTC (`2026-04-22T07:40:00Z`).
- `session_id`, `task_id`, `output_id` — orchestrator bu alanları inject
  etmese bile sen `"to_be_filled"` yazma, bağlamdan okuyup doldur.
- `confidence_overall` enum ise `HIGH|MEDIUM|LOW|BLOCKED`.
- `review_status` enum ise `"ready"` (QA'ya gitmeye hazır) veya
  `"needs_revision"` (eksik/çakışma var).
- `warnings` array — boş olsa bile `[]` emit et.
- Array içindeki item'ların kendi schema'larına uy (ör. `data_manifest[]`
  `source_type` + `availability_status` + `data_quality_score` ister).

### 2. NARRATIVE MARKDOWN (SONRA — insan okunaklı)

JSON bloğunun HEMEN ARDINDAN markdown narrative gelir: tablolar,
yorumlar, alıntılar, kaynak linkleri. Bu bölüm insan için ve
`digestUpstream()`'in smart-slice fallback'i için.

**Formatter ve downstream agent'lar için:** parseable JSON yoksa
veya zorunlu alan eksikse, output SOFT_BLOCK markerı ile DEGRADED
işaretlenir ve downstream rapor boş/placeholder görür — bu olduğunda
rapor kalitesi düşer.
{MARKER}
"""


def splice(text: str, block: str) -> tuple[str, bool]:
    if MARKER in text:
        return text, False
    lines = text.splitlines(keepends=True)
    # Hedef: Phase 8C reasoning directives marker'ının hemen ardından;
    # yoksa Phase 8B canonical marker'ının ardından; yoksa ilk ## başlığının üstü.
    insert_idx = None
    phase8c_end = "<!-- PHASE_8C_REASONING_DIRECTIVES -->"
    phase8b_end = "<!-- PHASE_8B_CANONICAL_REFS -->"
    c = b = 0
    for i, line in enumerate(lines):
        if phase8c_end in line:
            c += 1
            if c == 2:
                insert_idx = i + 1
                break
    if insert_idx is None:
        for i, line in enumerate(lines):
            if phase8b_end in line:
                b += 1
                if b == 2:
                    insert_idx = i + 1
                    break
    if insert_idx is None:
        in_code = False
        first_h1 = False
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                continue
            if not first_h1 and stripped.startswith("#"):
                first_h1 = True
                insert_idx = i + 1
                continue
            if first_h1 and stripped.startswith("##"):
                insert_idx = i
                break
    if insert_idx is None:
        insert_idx = len(lines)
    new_lines = lines[:insert_idx] + [block, "\n"] + lines[insert_idx:]
    return "".join(new_lines), True


def main() -> int:
    touched = 0
    idempotent = 0
    no_schema = 0
    skipped = 0
    header = f"{'agent':<32}{'status':<20}{'required':>4}"
    print(header)
    print("-" * len(header))
    for agent_dir in sorted(AGENTS_DIR.iterdir()):
        if not agent_dir.is_dir():
            continue
        agent = agent_dir.name
        prompt = agent_dir / "system_prompt.md"
        schema_path = agent_dir / "output_schema.json"
        if not prompt.exists() or agent not in SCHEMA_FIRST_AGENTS:
            skipped += 1
            continue
        if not schema_path.exists():
            no_schema += 1
            print(f"{agent:<32}{'NO SCHEMA':<20}{'-':>4}")
            continue
        try:
            schema = json.loads(schema_path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"{agent:<32}{'SCHEMA ERR':<20}  {e}")
            continue
        required, properties = _extract_required_and_properties(schema)
        skeleton = _build_skeleton(agent, required, properties)
        block = _build_block(agent, required, skeleton)
        text = prompt.read_text(encoding="utf-8")
        new_text, inserted = splice(text, block)
        if inserted:
            prompt.write_text(new_text, encoding="utf-8")
            touched += 1
            status = "INSERTED"
        else:
            idempotent += 1
            status = "already-has"
        print(f"{agent:<32}{status:<20}{len(required):>4}")
    print("-" * len(header))
    print(f"Touched: {touched}  |  Idempotent: {idempotent}  |  No schema: {no_schema}  |  Out-of-scope: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
