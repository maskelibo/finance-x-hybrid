"""Export Pydantic schemas as JSON Schema files for Node.js consumers.

The Node backend reads these files at startup to validate incoming
TickerPackage JSON (via Ajv). Single source of truth, bi-lingual.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from financex.schemas import EngineOutput, KapEvent, TickerPackage
from financex.schemas.base import CURRENT_SCHEMA_VERSION

# Schemas exposed across the Python ↔ Node boundary.
EXPORTABLE_SCHEMAS: dict[str, type] = {
    "ticker_package": TickerPackage,
    "engine_output": EngineOutput,
    "kap_event": KapEvent,
}


def generate_schema(model_class: type) -> dict[str, Any]:
    """Produce a JSON Schema from a Pydantic v2 model with our extensions."""
    schema = model_class.model_json_schema()
    schema["$id"] = f"https://finance-x.local/schemas/{model_class.__name__}.json"
    schema["x-financex-version"] = CURRENT_SCHEMA_VERSION
    return schema


def export_all(out_dir: Path) -> list[Path]:
    """Write every exportable schema to a file named `<key>.schema.json`."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name, cls in EXPORTABLE_SCHEMAS.items():
        schema = generate_schema(cls)
        path = out_dir / f"{name}.schema.json"
        path.write_text(
            json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        written.append(path)
    return written
