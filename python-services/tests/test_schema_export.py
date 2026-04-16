"""Schema-export tests — JSON Schema shape, file writing, version marker."""

from __future__ import annotations

import json
from pathlib import Path

from financex.schemas import TickerPackage
from financex.schemas.base import CURRENT_SCHEMA_VERSION
from financex.schemas.export import EXPORTABLE_SCHEMAS, export_all, generate_schema


def test_ticker_package_schema_has_required_block() -> None:
    schema = generate_schema(TickerPackage)
    assert schema["type"] == "object"
    assert "properties" in schema
    required = schema.get("required", [])
    for critical in ("meta", "company", "financials", "market"):
        assert critical in required, f"{critical} must be in required"


def test_optional_fields_are_not_required() -> None:
    schema = generate_schema(TickerPackage)
    required = set(schema.get("required", []))
    for optional in ("technical", "macro", "esg", "brand"):
        assert optional not in required, f"{optional} should NOT be required"


def test_schema_has_version_marker() -> None:
    schema = generate_schema(TickerPackage)
    assert schema.get("x-financex-version") == CURRENT_SCHEMA_VERSION


def test_schema_has_id() -> None:
    schema = generate_schema(TickerPackage)
    assert schema["$id"].endswith("TickerPackage.json")


def test_export_all_writes_all_schemas(tmp_path: Path) -> None:
    written = export_all(tmp_path)
    expected_count = len(EXPORTABLE_SCHEMAS)
    assert len(written) == expected_count
    names = {p.name for p in written}
    assert names == {
        "ticker_package.schema.json",
        "engine_output.schema.json",
        "kap_event.schema.json",
    }


def test_exported_file_is_parseable_json(tmp_path: Path) -> None:
    export_all(tmp_path)
    for path in tmp_path.glob("*.schema.json"):
        parsed = json.loads(path.read_text(encoding="utf-8"))
        assert parsed["type"] == "object"
        assert "properties" in parsed


def test_exported_schema_mentions_nested_types(tmp_path: Path) -> None:
    """TickerPackage references MetaInfo, CompanyInfo, Financials, etc.
    These must appear in the $defs block so downstream Ajv can resolve them.
    """
    export_all(tmp_path)
    path = tmp_path / "ticker_package.schema.json"
    parsed = json.loads(path.read_text(encoding="utf-8"))
    defs = parsed.get("$defs", {})
    for expected in ("MetaInfo", "CompanyInfo", "Financials", "MarketData"):
        assert expected in defs, f"${expected} missing from $defs"
