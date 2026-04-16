# Generated JSON Schemas

**Do not edit these files by hand.** They are produced from the Python
Pydantic models in `python-services/src/financex/schemas/` and regenerated
whenever those models change.

## To regenerate

```bash
cd python-services
uv run financex schemas export --out ../backend/generated/schemas
```

## Files

| File | Source | Purpose |
|------|--------|---------|
| `ticker_package.schema.json` | `TickerPackage` | Full bundle the Python data layer produces; Node reads this via Ajv before handing it to LLM agents. |
| `engine_output.schema.json` | `EngineOutput` | Deterministic financial-engine output. |
| `kap_event.schema.json` | `KapEvent` | Individual KAP disclosure record. |

## Schema version

Each file carries an `x-financex-version` extension field. Consumers
compare this against the version they were built for and warn / block
(per `SCHEMA_VALIDATION_MODE` in `backend/src/config.ts`) on mismatch.
